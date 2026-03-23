import { createClient } from "@/lib/supabase/server" // インポート、外部から取り込む

export default async function Home() {  // 「Home」という名前の非同期関数をデフォルトでエクスポート
    const supabase = await createClient()

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at")
    return (
        <main>
            <div className="login-box">
                <h2 className="login-title">管理者ログイン</h2>
                <div className="card">
                    <div className="form-group">
                        <label>メールアドレス</label>
                        <input type="email" placeholder="admin@example.com" />
                    </div>
                    <div className="form-group">
                        <label>パスワード</label>
                        <input type="password" placeholder="••••••••" />
                    </div>
                    <a href="orders.html" className="btn btn-primary btn-block-mt">ログイン</a>
                </div>
            </div>
        </main>
    )
}
