// "use client";
import Link from 'next/link';
import styles from './page.module.css'; 

type Product = {
  id: number;
  name: string;
  price: number;
  feature: string;
  isRecommended?: boolean;
};

const products: Product[] = [
  { id: 1, name: "551風・豚まん手作りキット", price: 2500, feature: "皮の甘みを再現した門外不出の粉ミックス", isRecommended: true },
  { id: 2, name: "道頓堀の誘惑・たこ焼き用大粒タコ", price: 3200, feature: "刺身でもいける新鮮な真蛸を贅沢カット", isRecommended: true },
  { id: 3, name: "河内鴨のロース・スモーク仕立て", price: 4800, feature: "大阪・河内産のブランド鴨を使用", isRecommended: true },
  { id: 4, name: "千日前・老舗喫茶の冷コーベース", price: 1500, feature: "4倍希釈で本格的なアイスコーヒー" },
  { id: 5, name: "新世界名物！どて焼きの素", price: 1800, feature: "白味噌ベースの甘辛いタレでトロトロ" },
  { id: 6, name: "どやさ！プロ仕様お好み焼きセット", price: 3500, feature: "秘伝の出汁と濃厚どろソース付" },
  { id: 7, name: "浪速の虎炊き・山椒ちりめん", price: 1200, feature: "職人手作りのピリ辛ご飯の供" },
  { id: 8, name: "まいど！ミックスジュースゼリー", price: 2800, feature: "喫茶店の味を再現した濃厚果肉" },
  { id: 9, name: "串カツだるまインスパイアセット", price: 5500, feature: "卓上フライヤー対応・冷凍30本入" },
];
 import { createClient } from "@/lib/supabase/server" // インポート、外部から取り込む

export default async function Home() {                // 「Home」という名前の非同期関数をデフォルトでエクスポート
   const supabase = await createClient()

   const { data: products, error } = await supabase
     .from("products")
     .select("*")
     .order("created_at")

  if (error) {
    return (
      <>
        <div>エラーが発生しました: {error.message}</div>
        <div>サンプルです。</div>
      </>
    )
  } else {
    return (
      <main>
        <h1 className="test">接続テスト</h1>

        {products.map((product) => (
          <div key={product.id}>
            {product.name}{product.is_featured && ("★おすすめ")}<br />
            ¥{product.price}／在庫:{product.stock}個
          </div>
        ))}
      </main>
    )
  }
}

/*

■ products?.map((product) => 　とは
配列（products）の 各要素 を（product）として取り出す。
（空になるまでループ）

また、今回取り出した（product）はオブジェクトです。
こんなん → { id:1, name:"商品A", ...}

product.name　→　オブジェクト（product）のプロパティ（name）

*/