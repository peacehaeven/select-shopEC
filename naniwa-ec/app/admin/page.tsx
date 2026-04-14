import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function AdminPage() {
  // 管理画面の入口では、まず現在のログイン状態を確認する。
  const supabase = await createClient()

  // 未ログインなら管理者ログイン画面へ案内する。
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  // ログイン済みでも、管理者以外は管理画面に入れない。
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // 非管理者は公開側トップへ戻す。
  if (profile?.role !== "admin") {
    redirect("/")
  }

  // 管理者は注文管理を管理画面の入口として使う。
  redirect("/admin/orders")
}
