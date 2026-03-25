"use server"

import { createClient } from "@/lib/supabase/server"

// ── 認証 ──────────────────────────────────────────

export async function login(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function logout() {
  const supabase = await createClient()
  return supabase.auth.signOut()
}

// ── 共通：adminチェック ────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: "ログインが必要です" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") return { supabase: null, error: "権限がありません" }
  return { supabase, error: null }
}

// ── 注文管理 ──────────────────────────────────────

export async function cancelOrder(orderId: string): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId })
  if (error) return { error: error.message }
  return { error: null }
}

// ── 商品管理 ──────────────────────────────────────

type ProductInput = {
  name: string
  price: number
  stock: number
  is_featured: boolean
}

export async function addProduct(data: ProductInput): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase.from("products").insert(data)
  if (error) return { error: error.message }
  return { error: null }
}

export async function updateProduct(id: string, data: ProductInput): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase.from("products").update(data).eq("id", id)
  if (error) return { error: error.message }
  return { error: null }
}

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
  const { supabase, error: authError } = await requireAdmin()
  if (authError || !supabase) return { error: authError }

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { error: error.message }
  return { error: null }
}
