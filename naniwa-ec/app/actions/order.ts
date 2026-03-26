"use server";

import { createClient } from "@/lib/supabase/server";

// カートページから受け取るデータの型定義
interface OrderInput {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    total: number;
    shippingInfo: {
        name: string;
        email: string; // guest_email用
        postalCode: string;
        address: string;
        tel: string;
    };
}

export async function createOrder(input: OrderInput) {
    const supabase = await createClient();

    try {
        // 1. 在庫チェック
        const { data: product, error: fetchError } = await supabase
            .from("products")
            .select("id,stock,name")
            .eq("id", input.productId)
            .single();
        // デバッグ用：何が返ってきているかターミナルで確認する
        console.log("検索したID:", input.productId);
        console.log("DBからの返答:", product, "エラー:", fetchError);

        if (fetchError || !product) {
            return { success: false, message: "商品が見つかりませんでした。" };
        }

        if (product.stock < input.quantity) {
            return { success: false, message: `在庫不足です。` };
        }

        // 2. orders テーブルに注文ヘッダーを作成
        // ※order_numberはDBのトリガーで自動生成されるため指定不要
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
            .select()
            .single();

        if (orderError) throw orderError;

        // 3. order_items テーブルに明細を作成
        const { error: itemError } = await supabase
            .from("order_items")
            .insert({
                order_id: order.id,
                product_id: input.productId,
                product_name: input.productName, // 注文時の名前をスナップショット保存
                unit_price: input.unitPrice,     // 注文時の価格をスナップショット保存
                quantity: input.quantity
            });

        if (itemError) throw itemError;

        // 4. products テーブルの在庫を減らす
        const { error: stockError } = await supabase
            .from("products")
            .update({ stock: product.stock - input.quantity })
            .eq("id", input.productId);

        if (stockError) throw stockError;

        // すべて成功
        return {
            success: true,
            orderId: order.id,
            orderNumber: order.order_number // トリガーで作られた番号を返す
        };


        // app/actions/order.ts の最後
} catch (error: any) {
    console.error("注文エラー:", error);
    // これで「どのカラムが原因か」が画面に表示されます
    return { 
        success: false, 
        message: `DBエラー: ${error.message || "詳細不明なエラー"}` 
    };
}
    }
