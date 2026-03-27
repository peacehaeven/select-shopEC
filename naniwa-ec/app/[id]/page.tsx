import Link from 'next/link';
import styles from './page.module.css';

// 商品データ（本来はデータベースから取りますが、今はTOPと同じものを使います）
const products = [
  { id: 1, name: "551風・豚まん手作りキット", price: 2500, feature: "皮の甘みを再現した門外不出の粉ミックス" },
  { id: 2, name: "道頓堀の誘惑・たこ焼き用大粒タコ", price: 3200, feature: "刺身でもいける新鮮な真蛸を贅沢カット" },
  { id: 3, name: "河内鴨のロース・スモーク仕立て", price: 4800, feature: "大阪・河内産のブランド鴨を使用" },
  { id: 4, name: "千日前・老舗喫茶の冷コーベース", price: 1500, feature: "4倍希釈で本格的なアイスコーヒー" },
  { id: 5, name: "新世界名物！どて焼きの素", price: 1800, feature: "白味噌ベースの甘辛いタレでトロトロ" },
  { id: 6, name: "堺の包丁職人監修・スライサー", price: 3800, feature: "フワフワのキャベツが誰でも作れる" },
  { id: 7, name: "どやさ！プロ仕様お好み焼きセット", price: 3500, feature: "秘伝の出汁と濃厚どろソース付" },
  { id: 8, name: "浪速の虎炊き・山椒ちりめん", price: 1200, feature: "職人手作りのピリ辛ご飯の供" },
  { id: 9, name: "まいど！ミックスジュースゼリー", price: 2800, feature: "喫茶店の味を再現した濃厚果肉" },
  { id: 10, name: "串カツだるまインスパイアセット", price: 5500, feature: "卓上フライヤー対応・冷凍30本入" },
];


export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  

  const { id } = await params;

  const product = products.find(p => p.id === Number(id));

  if (!product) {
    return <div className="p-8 text-center text-red-500 font-bold">商品が見つかりません。</div>;
  }

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.backLink}>← TOPに戻る</Link>
      
      <div className={styles.detailCard}>
        <h1 className={styles.productTitle}>{product.name}</h1>
        <p className={styles.price}>{product.price.toLocaleString()}円 (税込)</p>
        
        <div className={styles.featureBox}>
          <h2 className={styles.featureTitle}>商品の特徴：</h2>
          <p className={styles.featureText}>{product.feature}</p>
        </div>

        <button className={styles.cartButton}>
          カートに入れる（まいどあり！）
        </button>
      </div>
    </main>
  );
}