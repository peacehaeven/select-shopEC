"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── 認証 ──────────────────────────────────────────────

export async function login(email: string, password: string) {
  const supabase = await createClient()
  const result = await supabase.auth.signInWithPassword({ email, password })
  return result
}

export async function logout() {
  const supabase = await createClient()
  return supabase.auth.signOut()
}

// ─── 商品管理 ──────────────────────────────────────────

export async function addProduct(formData: {
  name: string
  price: number
  stock: number
  is_featured: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert({
    name: formData.name,
    price: formData.price,
    stock: formData.stock,
    is_featured: formData.is_featured,
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { error: null }
}

export async function updateProduct(id: string, formData: {
  name: string
  price: number
  stock: number
  is_featured: boolean
}) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({
      name: formData.name,
      price: formData.price,
      stock: formData.stock,
      is_featured: formData.is_featured,
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { error: null }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: '削除に失敗しました（権限またはDBポリシーを確認してください）' }
  revalidatePath('/admin/products')
  revalidatePath('/')
  return { error: null }
}

// ─── 注文管理 ──────────────────────────────────────────

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  revalidatePath('/admin/products')
  return { error: null }
}
