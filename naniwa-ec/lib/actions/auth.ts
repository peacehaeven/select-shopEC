"use server"
import { createClient } from "@/lib/supabase/server"

// ─── 認証 ──────────────────────────────────────────────

export async function login(email: string, password: string) {
  const supabase = await createClient()
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function logout() {
  const supabase = await createClient()
  return supabase.auth.signOut()
}
