// app/cart/success/page.tsx
import Link from 'next/link';

export default function OrderSuccessPage() {
  return (
    <main style={{ textAlign: 'center', padding: '100px 20px' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '40px' }}>
        <h2 style={{ fontSize: '24px', color: '#2ecc71', marginBottom: '16px' }}>
          ご注文ありがとうございます！
        </h2>
        <p style={{ marginBottom: '32px', color: '#666' }}>
          注文番号：#12345678<br />
          お手続きが完了いたしました。確認メールをお送りしましたのでご確認ください。
        </p>
        
        <Link href="/" className="btn btn-primary" style={{ padding: '12px 24px' }}>
          トップページに戻る
        </Link>
      </div>
    </main>
  );
}