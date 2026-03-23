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
