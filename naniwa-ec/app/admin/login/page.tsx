"use client"
import { useState } from 'react'
import { login } from '@/lib/actions'

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    // 新しいログイン試行の前に、前回のエラー表示を消す。
    setErrorMsg("")
    setLoading(true)

    try {
      const result = await login(email, password)

      // 認証失敗は想定内エラーなので、従来どおり result.error で扱う。
      if (result.error) {
        setErrorMsg("メールアドレスまたはパスワードが正しくありません")
        return
      }

      window.location.href = "/admin/orders"
    } catch {
      // 通信失敗や server action 側の例外など、想定外エラーはここで表示する。
      setErrorMsg("ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      // 成功・失敗に関係なく、最後に必ず送信中状態を解除する。
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter キーでもボタン押下と同じログイン処理を呼び出す。
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <main className="login">
      <div>
        <h1>管理者ログイン</h1>
        <div className="form-group">
          <label>メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>
        {errorMsg && <p className="error">{errorMsg}</p>}
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </main>
  )
}
