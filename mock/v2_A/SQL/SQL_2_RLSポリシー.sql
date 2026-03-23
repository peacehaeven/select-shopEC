-- ============================================================
-- 【2回目】RLS（Row Level Security）ポリシー設定（v2_B：発送通知メール対応版）
-- 1回目が Success になってから実行してください
-- ※ 1回目より先に実行するとエラーになります（テーブルが存在しないため）
-- ============================================================
-- v2_A からの変更点:
--   orders_update_admin ポリシーは変更なし。
--   管理者が carrier / tracking_number を UPDATE できる権限は既存ポリシーで対応済み。

-- ■ RLS とは？
--   データベースの行単位でアクセス制御する仕組み。
--   「このユーザーはこの行を見ていいか」をDB側で自動チェックする。
--   アプリ側での実装漏れがあってもDBレベルで守れるのが利点。

-- ■ RLS デバッグ TIPS
--   「permission denied」エラーが出たらポリシーが原因の可能性がある。
--   Supabase Dashboard → Table Editor → 該当テーブル → RLS policies で確認できる。
--   一時的に確認したい場合は Dashboard の SQL Editor で以下を実行:
--     SET ROLE postgres;  -- RLS を回避して実行（確認後は必ず RESET ROLE; すること）

-- ■ 接続ロールの違い（Supabase）
--   auth.uid()  : ログイン中のユーザーID。未ログインは NULL。
--   auth.role() : 接続中のロール名。未ログインは 'anon'、ログイン済みは 'authenticated'。


-- ■ 全テーブルで RLS を有効化
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;


-- ■ ヘルパー関数: 現在のユーザーが admin かどうかを返す
--   SECURITY DEFINER: profiles テーブルへのアクセスに必要なため、削除・変更しないこと。
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- ─── profiles ────────────────────────────────────────
-- 自分のプロフィール、または管理者は全プロフィールを参照可能
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

-- 自分のプロフィールのみ更新可能
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());


-- ─── products ────────────────────────────────────────
-- 誰でも（未ログインのゲストも）商品を閲覧可能
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

-- 管理者のみ商品の追加・更新・削除が可能
CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (is_admin());


-- ─── cart_items ──────────────────────────────────────
-- ※ v2_B では未使用（カートは localStorage 管理）
-- ※ 将来の会員機能追加時にそのまま使用予定
-- ※ 未ログインの anon ユーザーは auth.uid() が NULL のため
--    以下ポリシーに該当せず、全操作が拒否される（意図的な設計）
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING (user_id = auth.uid());


-- ─── orders ──────────────────────────────────────────
-- ゲスト（未ログイン）が注文を作成できる
--   auth.role() = 'anon'  : 未ログインであることを確認
--   auth.uid() IS NULL    : ユーザーIDが存在しないことを確認
--   guest_email IS NOT NULL: メールアドレスが設定されていることを確認
CREATE POLICY "orders_insert_guest" ON orders
  FOR INSERT WITH CHECK (
    auth.role() = 'anon'
    AND auth.uid() IS NULL
    AND guest_email IS NOT NULL
  );

-- 管理者は全注文を閲覧できる
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (is_admin());

-- 管理者は全注文を更新できる
-- ※ status の更新だけでなく、carrier / tracking_number の書き込みもこのポリシーで対応済み
CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());


-- ─── order_items ─────────────────────────────────────
-- ゲスト（未ログイン）が注文明細を作成できる
--   対応する orders が guest_email を持つゲスト注文であることを確認
CREATE POLICY "order_items_insert_guest" ON order_items
  FOR INSERT WITH CHECK (
    auth.role() = 'anon'
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.guest_email IS NOT NULL
        AND orders.user_id IS NULL
    )
  );

-- 管理者は全明細を閲覧可能
CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (is_admin());
