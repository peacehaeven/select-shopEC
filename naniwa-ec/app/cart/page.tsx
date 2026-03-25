"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { createOrder } from "@/app/actions/order";
import "./cart.css";

export default function CartPage() {
  const router = useRouter();

  // --- 1. カートの商品をStateで管理 ---
  const [items, setItems] = useState([
    {
      id: "44309e29-05f6-4ce9-b347-11cf4bfb3904",
      name: "千日前・老舗喫茶の冷コー（レイコー）ベース",
      price: 1500,
      quantity: 1
    }
  ]);

  // お届け先情報（テスト）
  // const [customerName, setCustomerName] = useState("山田 太郎");
  // const [customerEmail, setCustomerEmail] = useState("test@example.com");
  // const [postalCode, setPostalCode] = useState("530-0001");
  // const [address, setAddress] = useState("大阪府大阪市北区梅田1-1-1");
  // const [phoneNumber, setPhoneNumber] = useState("090-0000-0000");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // --- 2. 数量変更の関数 ---
  const updateQuantity = (id: string, newQty: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, newQty) } : item
    ));
  };

  // --- 3. 削除の関数 ---
  const removeItem = (id: string) => {
    if (window.confirm("この商品をカートから削除しますか？")) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // --- 4. 計算ロジック ---
  const subtotal = items.reduce((sum, item) => sum + (item.price * 1.1 * item.quantity), 0);
  const shipping = items.length > 0 ? 800 : 0; // 商品がなければ送料も0
  const total = subtotal + shipping;

  // --- 5. 注文処理 ---
  const handleOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (items.length === 0) {
      alert("カートに商品がありません。");
      return;
    }

    // バリデーションチェック
    if (!customerName.trim()) {
      setErrorMessage("お名前が未入力です。");
      return;
    }
    if (!customerEmail.trim()) {
      setErrorMessage("メールアドレスが未入力です。");
      return;
    }
    if (!postalCode.trim()) {
      setErrorMessage("郵便番号が未入力です。");
      return;
    }
    if (!address.trim()) {
      setErrorMessage("住所が未入力です。");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMessage("電話番号が未入力です。");
      return;
    }
    if (!cardNumber.trim()) {
      setErrorMessage("カード番号が未入力です。");
      return;
    }
    if (!expiryDate.trim()) {
      setErrorMessage("有効期限が未入力です。");
      return;
    }
    if (!cvv.trim()) {
      setErrorMessage("セキュリティコードが未入力です。");
      return;
    }

    const message =
      "【注文内容の最終確認】\n\n" +
      "この内容で注文を確定してもよろしいですか？\n\n" +
      "■ お届けの目安\n" +
      "・3営業日以内に発送（土日祝を除く）\n\n" +
      "■ キャンセルについて\n" +
      "・キャンセルは発送連絡の前まで承ります\n\n" +
      "・お早めにお電話、またはメールにてご連絡ください\n\n" +
      "※地域や交通事情により、お届け日が前後する場合がございます。";

    const confirmed = window.confirm(message);

    if (!confirmed) return;

    try {
      const res = await createOrder({
        productId: items[0].id,
        productName: items[0].name,
        unitPrice: items[0].price,
        quantity: items[0].quantity,
        subtotal: Math.floor(subtotal),
        total: Math.floor(total),
        shippingInfo: {
          name: customerName,
          email: customerEmail,
          postalCode: postalCode,
          address: address,
          tel: phoneNumber
        }
      });

      if (res.success) {
        router.push(`/cart/success?orderId=${res.orderId}&orderNumber=${res.orderNumber}`);
      } else {
        alert(`エラー: ${res.message}`);
      }
    } catch (error) {
      alert("予期せぬエラーが発生しました。");
    }
  };

  return (
    <main>
      <h2 className="section-title">カート</h2>
      <div className="cart-layout">
        <div>
          <div className="card" style={{ padding: 0 }}>
            {items.length > 0 ? (
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
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>¥{item.price.toLocaleString()}</td>
                      <td>
                        <div className="qty-control">
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>＋</button>
                        </div>
                      </td>
                      <td>¥{Math.floor(item.price * 1.1 * item.quantity).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeItem(item.id)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p>カートに商品が入っていません。</p>
                <Link href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>ショッピングを続ける</Link>
              </div>
            )}
          </div>

          <h3 style={{ fontSize: '16px', marginBottom: '16px', marginTop: '32px' }}>お届け先</h3>
          <div className="card">
            <div className="form-group">
              <label>お名前</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="山田 太郎" />
            </div>
            <div className="form-group">
              <label>メールアドレス</label>
              <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="test@example.com"/>
            </div>
            <div className="form-group">
              <label>郵便番号</label>
              <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={{ width: '160px' }} placeholder="530-0001"/>
            </div>
            <div className="form-group">
              <label>住所</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="大阪府大阪市北区梅田1-1-1"/>
            </div>
            <div className="form-group">
              <label>電話番号</label>
              <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="090-0000-0000"/>
            </div>
            <div className="form-group">
              <label>カード番号</label>
              <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000-0000-0000-0000"/>
            </div>
            <div className="form-group">
              <label>有効期限 (月/年)</label>
              <input type="text" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ width: '60px' }} placeholder="MM/YY" />
            </div>
            <div className="form-group">
              <label>セキュリティコード</label>
              <input type="password" value={cvv} onChange={(e) => setCvv(e.target.value)} style={{ width: '60px' }} placeholder="000"/>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>注文内容</h3>
          <div className="summary-row"><span>小計（税込）</span><span>¥{subtotal.toLocaleString()}</span></div>
          <div className="summary-row"><span>送料</span><span>¥{shipping.toLocaleString()}</span></div>
          <div className="summary-total"><span>合計</span><span>¥{total.toLocaleString()}</span></div>
          <br />
          <Link href="#" onClick={handleOrder} className="btn btn-primary">
            注文する
          </Link>
          {errorMessage && (
            <div className="error-message">
              ● {errorMessage}
            </div>
          )}
          <p>発送目安：3営業日以内（土日祝を除く）<br />
            ※配送地域や交通事情により、お届け日が変動する場合がございます。
          </p>
        </div>
      </div>
    </main>
  );
}