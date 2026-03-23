-- ============================================================
-- 【3回目】初期データ投入 + 注文処理関数（v2_B：会員機能なし＋注文照会あり版）
-- 2回目が Success になってから実行してください
-- ============================================================

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


-- ■ ゲスト注文処理関数（v2_B用：カートデータを引数で受け取る）
--   フロント（localStorage）のカート内容をJSON配列で渡す
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
  v_shipping INTEGER := 800;
  v_item     RECORD;
BEGIN
  -- 1. カートが空でないことを確認
  IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
    RAISE EXCEPTION 'カートが空です';
  END IF;

  -- 2. 在庫チェック
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

  -- 3. 小計計算
  SELECT COALESCE(SUM(p.price * (elem->>'quantity')::INTEGER), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_cart_items) AS elem
    JOIN products p ON p.id = (elem->>'product_id')::UUID;

  -- 4. 注文作成（user_id は NULL、guest_email を設定）
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

  -- 5. 注文明細の作成 + 在庫の減算
  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    SELECT
      v_order_id,
      (elem->>'product_id')::UUID,
      p.name,
      p.price,
      (elem->>'quantity')::INTEGER
    FROM jsonb_array_elements(p_cart_items) AS elem
    JOIN products p ON p.id = (elem->>'product_id')::UUID;

  UPDATE products SET stock = stock - (elem->>'quantity')::INTEGER
    FROM jsonb_array_elements(p_cart_items) AS elem
    WHERE products.id = (elem->>'product_id')::UUID;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ■ ゲスト注文照会関数（v2_B固有）
--   注文番号 + メールアドレスで本人確認し、注文情報をJSONで返す
--   RLSをバイパスして安全にデータを返すため SECURITY DEFINER を使用
--
--   呼び出し例:
--     SELECT lookup_guest_order('20250601-0042', 'example@email.com');
--
--   戻り値（JSON）:
--     {
--       "order_number": "20250601-0042",
--       "status": "shipped",
--       "created_at": "2025-06-01T...",
--       "subtotal": 12960,
--       "shipping_fee": 800,
--       "total": 13760,
--       "items": [
--         { "product_name": "...", "unit_price": 8640, "quantity": 1 },
--         ...
--       ]
--     }
CREATE OR REPLACE FUNCTION lookup_guest_order(
  p_order_number TEXT,
  p_guest_email  TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_order  RECORD;
  v_items  JSONB;
BEGIN
  -- 注文番号 + メールアドレスで照合
  SELECT id, order_number, status, created_at,
         subtotal, shipping_fee, total
    INTO v_order
    FROM orders
    WHERE order_number = p_order_number
      AND guest_email  = p_guest_email;

  -- 該当なし
  IF v_order IS NULL THEN
    RETURN NULL;
  END IF;

  -- 注文明細を取得
  SELECT jsonb_agg(
    jsonb_build_object(
      'product_name', oi.product_name,
      'unit_price',   oi.unit_price,
      'quantity',     oi.quantity
    )
  )
  INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  -- JSON にまとめて返却
  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status',       v_order.status,
    'created_at',   v_order.created_at,
    'subtotal',     v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total',        v_order.total,
    'items',        COALESCE(v_items, '[]'::JSONB)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ■ 会員用注文処理関数（将来の会員機能追加時にそのまま使用可能）
CREATE OR REPLACE FUNCTION place_order(
  p_shipping_name        TEXT,
  p_shipping_postal_code TEXT,
  p_shipping_address     TEXT,
  p_shipping_phone       TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_order_id UUID;
  v_subtotal INTEGER;
  v_shipping INTEGER := 800;
  v_item     RECORD;
BEGIN
  -- 1. カートが空でないことを確認
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'カートが空です';
  END IF;

  -- 2. 在庫チェック＆小計計算
  SELECT COALESCE(SUM(p.price * c.quantity), 0) INTO v_subtotal
    FROM cart_items c
    JOIN products p ON p.id = c.product_id
    WHERE c.user_id = v_user_id;

  FOR v_item IN
    SELECT c.product_id, c.quantity, p.stock, p.name
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = v_user_id
  LOOP
    IF v_item.stock < v_item.quantity THEN
      RAISE EXCEPTION '% の在庫が不足しています（残り %個）',
        v_item.name, v_item.stock;
    END IF;
  END LOOP;

  -- 3. 注文作成
  INSERT INTO orders (user_id, shipping_name, shipping_postal_code,
                      shipping_address, shipping_phone,
                      subtotal, shipping_fee, total)
  VALUES (v_user_id, p_shipping_name, p_shipping_postal_code,
          p_shipping_address, p_shipping_phone,
          v_subtotal, v_shipping, v_subtotal + v_shipping)
  RETURNING id INTO v_order_id;

  -- 4. 注文明細の作成 + 在庫の減算
  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
    SELECT v_order_id, c.product_id, p.name, p.price, c.quantity
      FROM cart_items c
      JOIN products p ON p.id = c.product_id
      WHERE c.user_id = v_user_id;

  UPDATE products SET stock = stock - c.quantity
    FROM cart_items c
    WHERE products.id = c.product_id
      AND c.user_id = v_user_id;

  -- 5. カートをクリア
  DELETE FROM cart_items WHERE user_id = v_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
