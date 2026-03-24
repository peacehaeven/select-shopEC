-- ============================================================
-- 【追加実行】既存DBへの変更適用（v2_B → v2_C マイグレーション）
-- ※ 新規にDBを作る場合は不要です。SQL_1〜3 を実行してください。
-- ※ すでにSQL_1〜3 を実行済みの場合のみ、このファイルを実行してください。
-- ============================================================

-- ① products テーブルに論理削除カラムを追加
ALTER TABLE products
  ADD COLUMN deleted_at TIMESTAMPTZ;  -- NULL = 有効、値あり = 削除済み

-- ② products の SELECT ポリシーを論理削除対応に差し替え
--    （削除済み商品がゲスト・管理者ともに取得されないようにする）
DROP POLICY IF EXISTS "products_select_all" ON products;

CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (deleted_at IS NULL);

-- ③ 物理削除ポリシーを削除（論理削除に切り替えるため不要）
DROP POLICY IF EXISTS "products_delete_admin" ON products;

-- ============================================================
-- 【追加実行】キャンセル機能対応（v2_C → v2_D マイグレーション）
-- ※ 上記の v2_C 変更を実行済みの場合のみ、この以降を実行してください。
-- ============================================================

-- ④ orders.status の CHECK 制約に 'cancelled' を追加
--    既存の制約を DROP して再作成する
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'shipped', 'cancelled'));

-- ⑤ cancel_order() 関数を追加
--    （SQL_3 に追記したものと同一内容）
CREATE OR REPLACE FUNCTION cancel_order(
  p_order_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_status TEXT;
BEGIN
  SELECT status INTO v_status
    FROM orders
    WHERE id = p_order_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION '注文が見つかりませんでした';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION '発送前（pending）の注文のみキャンセルできます（現在のステータス: %）', v_status;
  END IF;

  UPDATE orders
    SET status = 'cancelled'
    WHERE id = p_order_id;

  UPDATE products
    SET stock = stock + oi.quantity
    FROM order_items oi
    WHERE products.id = oi.product_id
      AND oi.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
