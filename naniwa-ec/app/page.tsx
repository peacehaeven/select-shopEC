import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at");

  if (error) {
    return <div>エラーが発生しました: {error.message}</div>;
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
      <h1>テスト</h1>

      {products?.map((product) => (
        <div key={product.id}>
          <strong>{product.name}</strong><br />
          ¥{product.price.toLocaleString()} ／ 在庫: {product.stock}個
          {product.is_featured && (<span>おすすめ</span>)}
        </div>
      ))}
    </main>
  );
}