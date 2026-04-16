"use client"
import { useState } from 'react'
import { login } from '@/lib/actions'

export default function AdminLoginPage() {
  // 入力欄の値と、エラー表示・送信中表示の状態を管理する。
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    // 新しいログイン試行の前に、前回のエラーメッセージを消す。
    setErrorMsg("")
    setLoading(true)

    // 認証処理自体は server action 側に任せる。
    const result = await login(email, password)
    setLoading(false)

    // 認証失敗時はエラーを表示し、成功時は注文管理画面へ遷移する。
    if (result.error) {
      setErrorMsg("メールアドレスまたはパスワードが正しくありません")
    } else {
      window.location.href = "/admin/orders"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter キーでもログインできるようにする。
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <main className="login">
      <div>
        <h1>管理者ログイン</h1>
        <div className="form-group">
          {/* メールアドレス入力欄。入力内容を state と同期する。 */}
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
          {/* パスワード入力欄。ブラウザ補完用に current-password を指定する。 */}
          <label>パスワード</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
        </div>
        {/* 認証失敗時だけエラーメッセージを表示する。 */}
        {errorMsg && <p className="error">{errorMsg}</p>}
        {/* ログイン処理中は二重送信を防ぐためボタンを無効化する。 */}
        <button className="btn btn-primary" onClick={handleLogin} disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </main>
  )
}
