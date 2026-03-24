-- ============================================================
-- 【3回目】初期データ投入 + 注文処理関数（v2_B：発送通知メール対応版）
-- 2回目が Success になってから実行してください
-- ============================================================
-- v2_A からの変更点:
--   place_guest_order() 関数の変更なし。
--   carrier / tracking_number は管理者が発送モーダルから直接 UPDATE するため
--   注文作成関数では扱わない（注文時点では常に NULL）。


-- ■ おすすめ商品（3件）
INSERT INTO products (name, price, stock, is_featured) VALUES
  ('大阪名物！551風・豚まん手作りキット',                2500, 20, true),
  ('道頓堀の誘惑・たこ焼き用大粒タコ（冷凍）',          3200, 15, true),
  ('おうちで二度漬けOK！串カツだるまインスパイアセット',  5500,  8, true);

-- ■ 通常商品（7件）
INSERT INTO products (name, price, stock, is_featured) VALUES
  ('河内鴨のロース・スモーク仕立て',                              4800, 10, false),
  ('千日前・老舗喫茶の冷コー（レイコー）ベース',                  1500, 25, false),
  ('新世界名物！どて焼きの素（牛すじ煮込み）',                    1800, 18, false),
  ('堺の包丁職人監修・切れ味抜群！キャベツ千切りスライサー',      3800,  6, false),
  ('どやさ！厚焼きプロ仕様お好み焼きセット（5枚入）',            3500, 12, false),
  ('浪速の虎炊き・山椒ちりめんじゃこ（100g）',                    1200, 30, false),
  ('まいど！ミックスジュース・贅沢ゼリー（6個入）',              2800, 14, false);


-- ■ ゲスト注文処理関数
--   フロント（localStorage）のカート内容を JSON 配列で受け取り、
--   注文・明細の作成と在庫の減算をまとめて行う。
--
--   処理の流れ:
--     1. カートが空でないか確認
--     2. 全商品の在庫チェック
--     3. 小計を計算
--     4. orders テーブルに注文を INSERT（注文番号はトリガーが自動採番）
--        ※ carrier / tracking_number は NULL のまま作成される
--           → 管理者が発送モーダルで入力した時点で UPDATE される
--     5. order_items テーブルに明細を INSERT
--     6. products テーブルの stock を減算
--
--   ※ plpgsql 関数内は1トランザクションで実行される。
--     途中でエラーが発生した場合は全処理がロールバックされるため、
--     注文だけ作られて在庫が減らない、という状態にはならない。
--
--   呼び出し例:
--     SELECT place_guest_order(
--       'example@email.com',
--       '山田 太郎',
--       '530-0001',
--       '大阪府大阪市北区梅田1-1-1',
--       '090-0000-0000',
--       '[{"product_id": "uuid-here", "quantity": 2}]'
--     );
--
--   SECURITY DEFINER: RLS を回避して処理する必要があるため必須。削除・変更しないこと。
CREATE OR REPLACE FUNCTION place_guest_order(
  p_guest_email          TEXT,
  p_shipping_name        TEXT,
  p_shipping_postal_code TEXT,
  p_shipping_address     TEXT,
  p_shipping_phone       TEXT,
  p_cart_items           JSONB
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_subtotal INTEGER;
  -- 送料（円）。変更する場合は orders テーブルの shipping_fee DEFAULT も合わせて変更すること
  v_shipping INTEGER := 800;
  v_item     RECORD;
BEGIN
  -- ゲスト専用関数のため、ログイン済みユーザーからの呼び出しを拒否
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'この関数はゲスト専用です';
  END IF;

  -- 1. カートが空でないことを確認
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'カートが空です';
  END IF;

  -- 2. 在庫チェック（全商品をループして確認）
  FOR v_item IN
    SELECT
      (elem->>'product_id')::UUID AS product_id,
      (elem->>'quantity')::INTEGER AS quantity,
      p.stock,
      p.name
    FROM jsonb_array_elements(p_cart_items) AS elem
    JOIN products p ON p.id = (elem->>'product_id')::UUID
  LOOP
    IF v_item.stock < v_item.quantity THEN
      RAISE EXCEPTION '% の在庫が不足しています（残り %個）',
        v_item.name, v_item.stock;
    END IF;
  END LOOP;

  -- 3. 小計計算（商品単価 × 数量 の合計）
  SELECT COALESCE(SUM(p.price * (elem->>'quantity')::INTEGER), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_cart_items) AS elem
    JOIN products p ON p.id = (elem->>'product_id')::UUID;

  -- 4. 注文作成（order_number はトリガーが自動採番）
  --    carrier / tracking_number は NULL のまま作成
  --    → 管理者が発送モーダルで入力した時点で UPDATE される
  INSERT INTO orders (
    user_id, guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total
  )
  VALUES (
    NULL, p_guest_email,
    p_shipping_name, p_shipping_postal_code,
    p_shipping_address, p_shipping_phone,
    v_subtotal, v_shipping, v_subtotal + v_shipping
  )
  RETURNING id INTO v_order_id;

  -- 5. 注文明細の作成
  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    SELECT
      v_order_id,
      (elem->>'product_id')::UUID,
      p.name,
      p.price,
      (elem->>'quantity')::INTEGER
    FROM jsonb_array_elements(p_cart_items) AS elem
    JOIN products p ON p.id = (elem->>'product_id')::UUID;

  -- 6. 在庫の減算
  UPDATE products SET stock = stock - (elem->>'quantity')::INTEGER
    FROM jsonb_array_elements(p_cart_items) AS elem
    WHERE products.id = (elem->>'product_id')::UUID;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ■ キャンセル処理関数
--   注文ステータスを 'cancelled' に更新し、在庫を注文数分だけ戻す。
--   pending 以外の注文はキャンセル不可（エラーを返す）。
--
--   処理の流れ:
--     1. 注文が pending かチェック
--     2. orders.status を 'cancelled' に UPDATE
--     3. 注文明細の数量分だけ products.stock を加算
--
--   ※ plpgsql 関数内は 1 トランザクションで実行される。
--     途中でエラーが発生した場合は全処理がロールバックされる。
--
--   SECURITY DEFINER: RLS を回避して処理する必要があるため必須。削除・変更しないこと。
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- 1. 注文が pending かチェック
  SELECT status INTO v_status
    FROM orders
    WHERE id = p_order_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION '注文が見つかりませんでした';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION '発送前（pending）の注文のみキャンセルできます（現在のステータス: %）', v_status;
  END IF;

  -- 2. 注文ステータスを 'cancelled' に更新
  UPDATE orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

  -- 3. 在庫を注文数分だけ戻す
  UPDATE products
    SET stock = stock + oi.quantity
    FROM order_items oi
    WHERE products.id = oi.product_id
      AND oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
