import { createClient } from "@/lib/supabase/server"
import ProductCard from "./components/ProductCard"
import HeroSection from "./components/HeroSection"

export default async function TopPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <>
      <HeroSection />
      <main>
        <h2 className="section-title">商品一覧</h2>
        <div className="product-grid">
          {(products ?? []).map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              stock={p.stock}
            />
          ))}
        </div>
      </main>
    </>
  )
}
