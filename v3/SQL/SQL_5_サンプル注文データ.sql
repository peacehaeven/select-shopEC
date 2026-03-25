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
-- 注文③ 田中 次郎 — 注文受付済み（pending）
--   商品: 河内鴨のロース・スモーク仕立て × 1、冷コーベース × 2
--   小計: 4800×1 + 1500×2 = 7800円
--   送料: 800円
--   合計: 8600円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = '河内鴨のロース・スモーク仕立て' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = '千日前・老舗喫茶の冷コー（レイコー）ベース' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'tanaka.jiro@example.com',
    '田中 次郎', '550-0003',
    '大阪府大阪市西区京町堀1-3-3', '070-2345-6789',
    7800, 800, 8600,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '河内鴨のロース・スモーク仕立て',               4800, 1),
    (v_order_id, v_product2, '千日前・老舗喫茶の冷コー（レイコー）ベース',   1500, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文④ 佐藤 美咲 — 発送済み（shipped）・追跡番号あり
--   商品: お好み焼きセット × 2
--   小計: 3500×2 = 7000円
--   送料: 800円
--   合計: 7800円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product  UUID;
BEGIN
  SELECT id INTO v_product FROM products
    WHERE name = 'どやさ！厚焼きプロ仕様お好み焼きセット（5枚入）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'sato.misaki@example.com',
    '佐藤 美咲', '558-0004',
    '大阪府大阪市住吉区長居1-4-4', '080-3456-7890',
    7000, 800, 7800,
    'shipped', '佐川急便', '2345-6789-0123'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product, 'どやさ！厚焼きプロ仕様お好み焼きセット（5枚入）', 3500, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑤ 中村 健一 — 注文受付済み（pending）
--   商品: 山椒ちりめんじゃこ × 3、ミックスジュースゼリー × 1
--   小計: 1200×3 + 2800×1 = 6400円
--   送料: 800円
--   合計: 7200円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = '浪速の虎炊き・山椒ちりめんじゃこ（100g）' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = 'まいど！ミックスジュース・贅沢ゼリー（6個入）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'nakamura.kenichi@example.com',
    '中村 健一', '534-0027',
    '大阪府大阪市都島区中野町2-5-5', '090-4567-8901',
    6400, 800, 7200,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '浪速の虎炊き・山椒ちりめんじゃこ（100g）',      1200, 3),
    (v_order_id, v_product2, 'まいど！ミックスジュース・贅沢ゼリー（6個入）', 2800, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑥ 小林 優子 — 発送済み（shipped）・追跡番号あり
--   商品: キャベツ千切りスライサー × 1
--   小計: 3800円
--   送料: 800円
--   合計: 4600円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product  UUID;
BEGIN
  SELECT id INTO v_product FROM products
    WHERE name = '堺の包丁職人監修・切れ味抜群！キャベツ千切りスライサー' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'kobayashi.yuko@example.com',
    '小林 優子', '591-8025',
    '大阪府堺市北区長曾根町1-6-6', '070-5678-9012',
    3800, 800, 4600,
    'shipped', '日本郵便', '3456-7890-1234'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product, '堺の包丁職人監修・切れ味抜群！キャベツ千切りスライサー', 3800, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑦ 伊藤 勇太 — 注文受付済み（pending）
--   商品: 豚まんキット × 1、どて焼きの素 × 2
--   小計: 2500×1 + 1800×2 = 6100円
--   送料: 800円
--   合計: 6900円
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
    WHERE name = '新世界名物！どて焼きの素（牛すじ煮込み）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'ito.yuta@example.com',
    '伊藤 勇太', '543-0001',
    '大阪府大阪市天王寺区上本町1-7-7', '080-6789-0123',
    6100, 800, 6900,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '大阪名物！551風・豚まん手作りキット',     2500, 1),
    (v_order_id, v_product2, '新世界名物！どて焼きの素（牛すじ煮込み）', 1800, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑧ 渡辺 さくら — 発送済み（shipped）・追跡番号あり
--   商品: 串カツセット × 2、ミックスジュースゼリー × 2
--   小計: 5500×2 + 2800×2 = 16600円
--   送料: 800円
--   合計: 17400円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = 'おうちで二度漬けOK！串カツだるまインスパイアセット' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = 'まいど！ミックスジュース・贅沢ゼリー（6個入）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'watanabe.sakura@example.com',
    '渡辺 さくら', '545-0051',
    '大阪府大阪市阿倍野区旭町2-8-8', '090-7890-1234',
    16600, 800, 17400,
    'shipped', 'ヤマト運輸', '4567-8901-2345'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, 'おうちで二度漬けOK！串カツだるまインスパイアセット', 5500, 2),
    (v_order_id, v_product2, 'まいど！ミックスジュース・贅沢ゼリー（6個入）',    2800, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑨ 松本 裕介 — 注文受付済み（pending）
--   商品: たこ焼き用タコ × 2
--   小計: 3200×2 = 6400円
--   送料: 800円
--   合計: 7200円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product  UUID;
BEGIN
  SELECT id INTO v_product FROM products
    WHERE name = '道頓堀の誘惑・たこ焼き用大粒タコ（冷凍）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'matsumoto.yusuke@example.com',
    '松本 裕介', '536-0016',
    '大阪府大阪市城東区蒲生3-9-9', '080-8901-2345',
    6400, 800, 7200,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product, '道頓堀の誘惑・たこ焼き用大粒タコ（冷凍）', 3200, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑩ 加藤 明日香 — 発送済み（shipped）・追跡番号あり
--   商品: 冷コーベース × 1、山椒ちりめんじゃこ × 2
--   小計: 1500×1 + 1200×2 = 3900円
--   送料: 800円
--   合計: 4700円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = '千日前・老舗喫茶の冷コー（レイコー）ベース' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = '浪速の虎炊き・山椒ちりめんじゃこ（100g）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'kato.asuka@example.com',
    '加藤 明日香', '554-0012',
    '大阪府大阪市此花区春日出中2-10-10', '070-9012-3456',
    3900, 800, 4700,
    'shipped', '佐川急便', '5678-9012-3456'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '千日前・老舗喫茶の冷コー（レイコー）ベース', 1500, 1),
    (v_order_id, v_product2, '浪速の虎炊き・山椒ちりめんじゃこ（100g）',  1200, 2);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑪ 木村 大輔 — 注文受付済み（pending）
--   商品: 河内鴨のロース・スモーク仕立て × 2、お好み焼きセット × 1
--   小計: 4800×2 + 3500×1 = 13100円
--   送料: 800円
--   合計: 13900円
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_order_id UUID;
  v_product1 UUID;
  v_product2 UUID;
BEGIN
  SELECT id INTO v_product1 FROM products
    WHERE name = '河内鴨のロース・スモーク仕立て' LIMIT 1;
  SELECT id INTO v_product2 FROM products
    WHERE name = 'どやさ！厚焼きプロ仕様お好み焼きセット（5枚入）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status
  ) VALUES (
    'kimura.daisuke@example.com',
    '木村 大輔', '557-0044',
    '大阪府大阪市西成区玉出中1-11-11', '090-0123-4567',
    13100, 800, 13900,
    'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '河内鴨のロース・スモーク仕立て',               4800, 2),
    (v_order_id, v_product2, 'どやさ！厚焼きプロ仕様お好み焼きセット（5枚入）', 3500, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 注文⑫ 橋本 菜々子 — 発送済み（shipped）・追跡番号あり
--   商品: 豚まんキット × 3、山椒ちりめんじゃこ × 1
--   小計: 2500×3 + 1200×1 = 8700円
--   送料: 800円
--   合計: 9500円
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
    WHERE name = '浪速の虎炊き・山椒ちりめんじゃこ（100g）' LIMIT 1;

  INSERT INTO orders (
    guest_email,
    shipping_name, shipping_postal_code,
    shipping_address, shipping_phone,
    subtotal, shipping_fee, total,
    status, carrier, tracking_number
  ) VALUES (
    'hashimoto.nanako@example.com',
    '橋本 菜々子', '547-0026',
    '大阪府大阪市平野区喜連東2-12-12', '080-1234-5679',
    8700, 800, 9500,
    'shipped', '日本郵便', '6789-0123-4567'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
  VALUES
    (v_order_id, v_product1, '大阪名物！551風・豚まん手作りキット',      2500, 3),
    (v_order_id, v_product2, '浪速の虎炊き・山椒ちりめんじゃこ（100g）', 1200, 1);
END $$;


-- ────────────────────────────────────────────────────────────
-- 確認用クエリ（コメントを外して実行）
-- ────────────────────────────────────────────────────────────
-- SELECT o.order_number, o.status, o.guest_email, o.total,
--        oi.product_name, oi.unit_price, oi.quantity
--   FROM orders o
--   JOIN order_items oi ON oi.order_id = o.id
--   ORDER BY o.created_at DESC;
