import { getProducts } from "@/app/actions/product";
import AddToCartButton from "@/components/AddToCartButton";
import Link from 'next/link';
import './product.css';

// 消費税率を定義
const TAX_RATE = 0.08;

export default async function ProductPage() {
  const products = await getProducts();

  return (
    <main className="container">
      {products.map((product) => {
        // 税込価格の計算 (税抜価格 * 1.08)
        const priceWithTax = product.price
          ? Math.floor(product.price * (1 + TAX_RATE))
          : null;
        return (
          <div key={product.id} className="detailCard">
            {/* {product.is_featured &&(
            <span className="featuredBadge">おススメ！</span>
          )} */}
            {/* <div className="productImageWrapper"> */}
            {/* <img
              src={product.image_url || "/images/no-image.jpg"} // 画像がなければ「NO IMAGE」を出す安全策
              alt={product.name}
              className="productImage"
            /> */}
            {/* </div> */}
            <h1 className="productTitle">{product.name}</h1>
            <p className="price">{priceWithTax ? `${priceWithTax.toLocaleString()}円 (税込)` : "価格はお問い合わせください"}</p>
            <AddToCartButton />
          </div>
        );
      })}
    </main>
  );
}