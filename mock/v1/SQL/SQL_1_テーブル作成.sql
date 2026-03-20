-- ============================================================
-- 【1回目】テーブル作成 + トリガー
-- SQL Editor に貼り付けて「Run」を押してください
-- ============================================================

-- ■ profiles: ユーザープロフィール（auth.users と 1:1）
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'customer'
             CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ■ 新規ユーザー登録時に自動で profiles レコードを作成するトリガー
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
CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL CHECK (price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ■ cart_items: カート（ログインユーザー専用）
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  UNIQUE (user_id, product_id)
);


-- ■ orders: 注文ヘッダー
CREATE TABLE orders (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id),
  order_number         TEXT NOT NULL UNIQUE,
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'shipped')),
  shipping_name        TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_address     TEXT NOT NULL,
  shipping_phone       TEXT NOT NULL,
  subtotal             INTEGER NOT NULL CHECK (subtotal >= 0),
  shipping_fee         INTEGER NOT NULL DEFAULT 800,
  total                INTEGER NOT NULL CHECK (total >= 0),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ■ 注文番号を自動生成する関数
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


-- ■ order_items: 注文明細（スナップショット）
CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_price   INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity     INTEGER NOT NULL CHECK (quantity >= 1)
);
