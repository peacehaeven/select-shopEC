import Link from 'next/link';
import styles from './page.module.css'; // ← ここでCSSを読み込んでいます

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
  { id: 6, name: "堺の包丁職人監修・スライサー", price: 3800, feature: "フワフワのキャベツが誰でも作れる" },
  { id: 7, name: "どやさ！プロ仕様お好み焼きセット", price: 3500, feature: "秘伝の出汁と濃厚どろソース付" },
  { id: 8, name: "浪速の虎炊き・山椒ちりめん", price: 1200, feature: "職人手作りのピリ辛ご飯の供" },
  { id: 9, name: "まいど！ミックスジュースゼリー", price: 2800, feature: "喫茶店の味を再現した濃厚果肉" },
  { id: 10, name: "串カツだるまインスパイアセット", price: 5500, feature: "卓上フライヤー対応・冷凍30本入" },
];

export default function HomePage() {
  const recommendedProducts = products.filter(p => p.isRecommended).slice(0, 3);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>まいど！なにわセレクトショップ</h1>
        <p>大阪のええもん、揃うてます。</p>
      </header>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>おすすめ商品</h2>
        <div className={styles.grid}>
          {recommendedProducts.map(product => (
            <ProductCard key={product.id} product={product} isHighlight />
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>全商品リスト</h2>
        <div className={styles.grid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}

function ProductCard({ product, isHighlight = false }: { product: Product, isHighlight?: boolean }) {
  // おすすめの場合は highlightCard クラスを追加する
  const cardClassName = `${styles.card} ${isHighlight ? styles.highlightCard : ''}`;

  return (
    <div className={cardClassName}>
      <h3 className={styles.productName}>{product.name}</h3>
      <p className={styles.price}>{product.price.toLocaleString()}円 (税込)</p>
      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{product.feature}</p>

      <Link href ={`/${product.id}`} className ={styles.detailLink}>
        詳細を見る
      </Link>
    </div>
  
);
}