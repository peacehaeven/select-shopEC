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

// 注文データの型
interface OrderInput {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    total: number;
    shippingInfo: {
        name: string;
        email: string;
        postalCode: string;
        address: string;
        tel: string;
    };
}

// 新規注文作成：在庫チェック〜注文登録〜在庫削減までを一連の流れで実行
export async function createOrder(input: OrderInput) {
    const supabase = await createClient();
    try {
        // 1. 在庫チェック: 最新の在庫数を取得して購入可能か確認
        const { data: product, error: fetchError } = await supabase
            .from("products")
            .select("id,stock,name")
            .eq("id", input.productId)
            .single();
        if (fetchError || !product) return { success: false, message: "商品が見つかりませんでした。" };
        if (product.stock < input.quantity) return { success: false, message: "在庫不足です。" };

        // 2. 注文ヘッダー作成: 注文の基本情報を登録。order_numberはDB側で自動採番される。
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                guest_email: input.shippingInfo.email,
                shipping_name: input.shippingInfo.name,
                shipping_postal_code: input.shippingInfo.postalCode,
                shipping_address: input.shippingInfo.address,
                shipping_phone: input.shippingInfo.tel,
                subtotal: input.subtotal,
                shipping_fee: 800,
                total: input.total,
                status: "pending"
            })
            .select().single();
        if (orderError) throw orderError;

        // 3. 注文明細作成
        const { error: itemError } = await supabase
            .from("order_items")
            .insert({
                order_id: order.id,
                product_id: input.productId,
                product_name: input.productName,
                unit_price: input.unitPrice,
                quantity: input.quantity
            });
        if (itemError) throw itemError;

        // 4. 在庫更新: 注文個数分を減算
        const { error: stockError } = await supabase
            .from("products")
            .update({ stock: product.stock - input.quantity })
            .eq("id", input.productId);
        if (stockError) throw stockError;

        return { success: true, orderId: order.id, orderNumber: order.order_number };
    } catch (error: any) {
        console.error("注文エラー:", error);
        return { success: false, message: `DBエラー: ${error.message || "詳細不明"}` };
    }
}
