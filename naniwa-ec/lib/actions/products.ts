"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── 商品管理 ──────────────────────────────────────────

// 商品を新規登録。成功後は管理画面を最新にする。
export async function addProduct(formData: { name: string; price: number; stock: number; is_featured: boolean }) {
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

// 既存の商品情報を更新
export async function updateProduct(id: string, formData: { name: string; price: number; stock: number; is_featured: boolean }) {
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

// 商品の論理削除
export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() }) // 現在時刻を入れて削除済みにする
    .eq('id', id)
    .is('deleted_at', null) // 未削除の商品のみを対象に更新
    .select('id')
  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: '削除失敗（権限またはポリシーを確認）' }
  
  // 商品一覧（トップ）にも削除を反映する
  revalidatePath('/admin/products')
  revalidatePath('/')
  return { error: null }
}
