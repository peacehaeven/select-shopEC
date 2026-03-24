"use server" //ファイル内の処理をサーバー側で実行させる

import { createClient } from "@/lib/supabase/server"

// 認証関連
// ログイン情報の取得
export async function login(email: string, password: string) {
    const supabase = await createClient()
    const result = await supabase.auth.signInWithPassword({ email, password })
    return(
        result
    )
}
// ログアウト
export async function logout(){
    const supabase = await createClient()
    return(
        supabase.auth.signOut()
    )
}