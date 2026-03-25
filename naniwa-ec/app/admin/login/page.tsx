"use client"
import { useState } from 'react'
import { login } from '@/lib/actions'

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setErrorMsg("")
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setErrorMsg("メールアドレスまたはパスワードが正しくありません")
    } else {
      window.location.href = "/admin/orders"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
