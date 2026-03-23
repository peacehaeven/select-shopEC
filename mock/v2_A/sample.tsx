import { createClient } from "@/lib/supabase/server" // インポート、外部から取り込む

export default async function Home() {  // 「Home」という名前の非同期関数をデフォルトでエクスポート
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