"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';

// 仮の関数（後でSupabaseの処理を書くファイルからインポートします）
//今は動作確認用に仮で置いておきます
const createOrder = async (productId: string, quantity: number) => {
  return { success: true, orderId: "ORD-" + Math.floor(Math.random() * 100000) };
};

export default function CartPage() {
  const router = useRouter();

  // 仮のデータ（本来はDBから取得する値）
  const productId = "p1";
  const productsName = "なにわ特選セット";
  const price = 12000;

  // 1.商品の数（useStateで管理）
  const [quantity, setQuantity] = useState(1);

  // 2.計算ロジック
  const tax = 0.1;
  const basePrice = price * quantity;
  const taxAmount = Math.floor(basePrice * tax);
  const subtotal = basePrice + taxAmount;
  const shipping = 800;
  const total = subtotal + shipping;

  // 3. 注文ボタンを押した時の処理
  const handleOrder = async (e: React.MouseEvent) => {
    e.preventDefault();

    const confirmed = window.confirm("本当に注文を確定しますか？");
    if (!confirmed) return;

    try {
      // サーバーサイド処理の呼び出し
      const res = await createOrder(productId, quantity);

      if (res.success) {
        alert("注文を受け付けました！");
        router.push(`/cart/success?orderId=${res.orderId}`);
      } else {
        alert(`エラー: ${res.message}`);
      }
    } catch (error) {
      alert("予期せぬエラーが発生しました。");
      console.error(error);
    }
  };

  // --- JSX (表示部分) ---
  return (
    <main>
      <h2 className="section-title">カート</h2>

      <div className="cart-layout">
        {/* カート明細 */}
        <div>
          <div className="card" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>商品</th>
                  <th>単価</th>
                  <th>数量</th>
                  <th>小計(税込)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{productsName}</td>
                  <td>¥{price.toLocaleString()}</td>
                  <td>
                    <div className="qty-control">
                      {/* 数量を減らすボタン（1以下にはならないようにする） */}
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                      <span>{quantity}</span>
                      {/* 数量を増やすボタン */}
                      <button type="button" onClick={() => setQuantity(quantity + 1)}>＋</button>
                    </div>
                  </td>
                  <td>¥{subtotal.toLocaleString()}</td>
                  <td><button type="button" className="remove-btn">削除</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* お届け先情報（以下、省略なし） */}
          <h3 style={{ fontSize: '16px', marginBottom: '16px', marginTop: '32px' }}>お届け先</h3>
          <div className="card">
            <div className="form-group"><label>お名前</label><input type="text" defaultValue="山田 太郎" /></div>
            <div className="form-group">
              <label>郵便番号</label>
              <input type="text" defaultValue="530-0001" style={{ width: '160px' }} />
            </div>
            <div className="form-group"><label>住所</label><input type="text" defaultValue="大阪府大阪市北区梅田1-1-1" /></div>
            <div className="form-group"><label>電話番号</label><input type="text" defaultValue="090-0000-0000" /></div>
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '16px', marginTop: '32px' }}>お支払い</h3>
          <div className="card">
            <div className="form-group">
              <label>カード番号</label>
              <input type="text" placeholder="1234 5678 9012 3456" />
            </div>
          </div>
        </div>

        {/* 合計・注文ボタン */}
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>注文内容</h3>
          <div className="summary-row"><span>小計（税込）</span><span>¥{subtotal.toLocaleString()}</span></div>
          <div className="summary-row"><span>送料</span><span>¥{shipping.toLocaleString()}</span></div>
          <div className="summary-total"><span>合計</span><span>¥{total.toLocaleString()}</span></div>
          <br />
          <Link href="#"
            onClick={handleOrder}
            className="btn btn-primary"
            style={{ display: 'block', textAlign: 'center' }}
          >
            注文する
          </Link>
          <p style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '12px',
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            ※発送はご注文完了から10営業日以内に行います。<br />
            ※土日祝日は発送業務をお休みしております。
          </p>
        </div>
      </div>
    </main>
  );
}