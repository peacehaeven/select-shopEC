"use client"
import { useState } from 'react'
import { login } from '@/lib/actions'

export default function Home() {
    const [email, setEmail] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState<string>("")

    // ※ログイン認証はSupabaseサーバーがやってくれるので、ここで比較する必要はない。
    const pushLoginData = async () => {
        setErrorMsg("")
        const result = await login(email, password)
        if (result.error) {
            setErrorMsg("IDかパスワードが間違っています")
        } else {
            window.location.href = "/admin/orders"
        }
    }
    return (
        <main className="login">
            <div>
                <h1>管理者ログイン</h1>
                <form id="login-form">
                    <div>
                        <label>メールアドレス</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label>パスワード</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    {errorMsg && <p>{errorMsg}</p>}
                    <button type="button" onClick={pushLoginData}>ログイン</button>
                </form>
            </div>
        </main>
    )
}