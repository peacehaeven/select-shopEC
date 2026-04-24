"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ─── 注文管理 ──────────────────────────────────────────

// 指定した注文をキャンセル
export async function cancelOrder(orderId: string) {
    const supabase = await createClient()
    const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
    if (error) return { error: error.message }
    revalidatePath('/admin/orders') // 注文一覧を最新にする
    revalidatePath('/admin/products') // 在庫を反映させるため商品ページを更新
    return { error: null }
}
