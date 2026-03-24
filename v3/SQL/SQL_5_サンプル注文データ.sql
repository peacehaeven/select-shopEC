-- ============================================================
-- 【サンプルデータ】注文データ 2件（修正版）
-- SQL_3 が Success になってから実行してください
-- ============================================================
-- ※ サンプルデータは注文管理画面の表示確認用のため、
--    在庫の減算は行いません。
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 注文① 山田 太郎 — 注文受付済み（pending）
--   商品: 豚まんキット × 2、たこ焼き用タコ × 1
--   小計: 2500×2 + 3200×1 = 8200円
--   送料: 800円
--   合計: 9000円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = '大阪名物！551風・豚まん手作りキット' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = '道頓堀の誘惑・たこ焼き用大粒タコ（冷凍）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'yamada.taro@example.com',
    '山田 太郎', '530-0001',
    '大阪府大阪市北区梅田1-1-1', '090-1234-5678',
    8200, 800, 9000,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '大阪名物！551風・豚まん手作りキット',       2500, 2),
    (v_order_id, v_product2, '道頓堀の誘惑・たこ焼き用大粒タコ（冷凍）', 3200, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文② 鈴木 花子 — 発送済み（shipped）・追跡番号あり
--   商品: 串カツセット × 1
--   小計: 5500円
--   送料: 800円
--   合計: 6300円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product  UUID;
BEGIN
  SELECT id INTO v_product FROM products
    WHERE name = 'おうちで二度漬けOK！串カツだるまインスパイアセット' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'suzuki.hanako@example.com',
    '鈴木 花子', '542-0012',
    '大阪府大阪市中央区谷町2-2-2', '080-9876-5432',
    5500, 800, 6300,
    'shipped', 'ヤマト運輸', '1234-5678-9012'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product, 'おうちで二度漬けOK！串カツだるまインスパイアセット', 5500, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 確認用クエリ（コメントを外して実行）
-- ────────────────────────────────────────────────────────────
-- SELECT o.order_number, o.status, o.guest_email, o.total,
--        oi.product_name, oi.unit_price, oi.quantity
--   FROM orders o
--   JOIN order_items oi ON oi.order_id = o.id
--   ORDER BY o.created_at DESC;
