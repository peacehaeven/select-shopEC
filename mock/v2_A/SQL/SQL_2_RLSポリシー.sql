-- ============================================================
-- 【2回目】RLS（Row Level Security）ポリシー設定（v2_A：会員機能なし版）
-- 1回目が Success になってから実行してください
-- ============================================================

-- ■ 全テーブルで RLS を有効化
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;

-- ■ ヘルパー関数: 現在のユーザーが admin かどうか
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;


-- ─── profiles ────────────────────────────────────────
-- 管理者が自分のプロフィールを参照・更新できる
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());


-- ─── products ────────────────────────────────────────
-- 誰でも商品を閲覧可能（未ログイン＝ゲストも含む）
CREATE POLICY "products_select_all" ON products
  FOR SELECT USING (true);

-- 管理者のみ追加・更新・削除
CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (is_admin());


-- ─── cart_items ──────────────────────────────────────
-- ※ v2_Aでは未使用だが、将来の会員機能用にポリシーを設定しておく
CREATE POLICY "cart_select_own" ON cart_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "cart_insert_own" ON cart_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "cart_update_own" ON cart_items
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "cart_delete_own" ON cart_items
  FOR DELETE USING (user_id = auth.uid());


-- ─── orders ──────────────────────────────────────────
-- ゲスト注文: anon ロールで INSERT を許可
CREATE POLICY "orders_insert_guest" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NULL AND guest_email IS NOT NULL);

-- ログインユーザーの注文（将来の会員機能用）
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 管理者: 全注文の閲覧・更新
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (is_admin());

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());


-- ─── order_items ─────────────────────────────────────
-- ゲスト注文: anon ロールで INSERT を許可
CREATE POLICY "order_items_insert_guest" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.guest_email IS NOT NULL
        AND auth.uid() IS NULL
    )
  );

-- ログインユーザー（将来の会員機能用）
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- 管理者: 全明細の閲覧
CREATE POLICY "order_items_select_admin" ON order_items
  FOR SELECT USING (is_admin());
