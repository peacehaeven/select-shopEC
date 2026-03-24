-- ============================================================
-- 【1回目】テーブル作成 + トリガー（v2_D：キャンセル機能追加版）
-- SQL Editor に貼り付けて「Run」を押してください
-- ============================================================
-- v2_C からの変更点:
--   orders.status の CHECK 制約に 'cancelled' を追加


-- ■ profiles: 管理者プロフィール（auth.users と 1:1）
--   ※ v2_C では管理者ログインのみ使用
--   ※ 将来の会員機能追加時にそのまま流用可能（role = 'customer' を使う）
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'customer'
             CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ■ Supabase Auth に新規ユーザーが登録されたとき、
--   自動で profiles にレコードを作成するトリガー
--
--   SECURITY DEFINER: この関数は作成者（postgres）権限で動く。
--   auth.users テーブルへのアクセスに必要なため、削除・変更しないこと。
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'ゲスト'),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ■ products: 商品マスタ
--   price     : 税抜価格（円）。フロントで表示する際は税込換算して表示すること。
--   deleted_at: 論理削除用カラム。NULL = 有効、値あり = 削除済み。
--               物理削除は行わず、削除時はここに日時を記録する。
CREATE TABLE products (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  price       INTEGER     NOT NULL CHECK (price >= 0),  -- 税抜価格（円）
  stock       INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured BOOLEAN     NOT NULL DEFAULT false,
  image_url   TEXT,                                     -- 将来の商品画像登録機能で使用予定（現在は未使用）
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ             -- 論理削除用。削除時に日時を記録。NULL = 有効
);


-- ■ cart_items: カート明細
--   ※ v2_C ではカートを localStorage（ブラウザ側）で管理するため未使用
--   ※ 将来の会員機能追加時にそのまま使用予定
--   ※ 未ログインの anon ユーザーは全操作が拒否される（意図的な設計）
CREATE TABLE cart_items (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  UNIQUE (user_id, product_id)  -- 同一ユーザー・同一商品は1行に集約
);


-- ■ orders: 注文ヘッダー
--   - carrier         : 配送業者名（例: 'ヤマト運輸'）
--   - tracking_number : 追跡番号（例: '1234-5678-9012'）
--     → 管理者が「発送済みにする」モーダルで入力した値が保存される
--     → フェーズ1でこれらの値をメール本文に埋め込んで送信する（Resend連携）
CREATE TABLE orders (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID        REFERENCES profiles(id),
  guest_email          TEXT        CHECK (
                                     guest_email IS NULL
                                     OR guest_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
                                   ),
  order_number         TEXT        NOT NULL UNIQUE,   -- トリガーが自動採番（例: 20260320-0001）
  status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending', 'shipped', 'cancelled')),
  shipping_name        TEXT        NOT NULL,
  shipping_postal_code TEXT        NOT NULL,
  shipping_address     TEXT        NOT NULL,
  shipping_phone       TEXT        NOT NULL,
  subtotal             INTEGER     NOT NULL CHECK (subtotal >= 0),
  -- 【注意】送料を変更する場合は place_guest_order() 関数内の v_shipping も合わせて変更すること
  shipping_fee         INTEGER     NOT NULL DEFAULT 800,
  total                INTEGER     NOT NULL CHECK (total >= 0),
  carrier              TEXT,           -- 配送業者名。発送前は NULL。
  tracking_number      TEXT,           -- 追跡番号。発送前は NULL。
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_user_or_guest
    CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
);

-- ■ 注文番号（YYYYMMDD-連番）を自動生成するトリガー
--   例: 2026年3月20日の1件目 → "20260320-0001"
--
--   ※ 同時に複数の注文が来ると同じ番号が生成されることがあるが、
--     UNIQUE 制約によりエラーになる（授業規模では実害なし）。
--     本番運用では排他制御の追加を検討すること。
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  today TEXT;
  seq   INTEGER;
BEGIN
  today := to_char(now(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq
    FROM orders
    WHERE order_number LIKE today || '-%';
  NEW.order_number := today || '-' || lpad(seq::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();


-- ■ order_items: 注文明細
--   ※ 注文時点の商品名・単価をスナップショットとして保存する。
--     後から商品情報が変わっても注文履歴に影響しない。
CREATE TABLE order_items (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID    NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID    NOT NULL REFERENCES products(id),
  product_name TEXT    NOT NULL,        -- 注文時の商品名（スナップショット）
  unit_price   INTEGER NOT NULL CHECK (unit_price >= 0),  -- 注文時の単価（スナップショット）
  quantity     INTEGER NOT NULL CHECK (quantity >= 1)
);
