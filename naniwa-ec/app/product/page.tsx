import { getProducts } from "@/app/actions/product";
// import ProductPage  from "@/components/ProductPage";
import Link from 'next/link';
import './products.css';


export default async function ProductPage() {
  const products = await getProducts();

  return (
    <main className="container">
      {/* <Link href="/" className="backLink">← TOPに戻る</Link> */}
      {products.map((product) =>
        <div key={product.id} className="detailCard">
          <div className="productImageWrapper">
            {/* <img
              src={product.image_url || "/images/no-image.jpg"} // 画像がなければ「NO IMAGE」を出す安全策
              alt={product.name}
              className="productImage"
            /> */}
          </div>
          <h1 className="productTitle">{product.name}</h1>
          <p className="price">{product.price ? `${product.price.toLocaleString()}円 (税込)` : "価格はお問い合わせください"}</p>
          <button className="cartButton">
            カートに入れる（まいどあり！）
          </button>
        </div>
      )}
    </main>
  );
}