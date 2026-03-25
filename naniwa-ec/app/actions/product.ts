// これはデータベースを操作するサーバー側の処理
"use server";
// Supabaseを操作するための「道具箱（クライアント）」を呼び出しています。 /server からインポートしているのがポイントで、ブラウザではなく、サーバーの中で安全に動かす設定になっている
import { createClient } from "@/lib/supabase/server";

export async function getProducts(){
    const supabase = await createClient();
    const {data,error} = await supabase
    .from("products")
    .select("id,name,price")
    // .select("id,name,price,is_featured,image_url")
    // .order("created_at",{ ascending:false});
    if(error) {
        console.error("商品取得できませんでした",error);
        return[];
    }
    return data;
}