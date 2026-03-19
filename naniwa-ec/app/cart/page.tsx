"use client";
import React, {useState} from 'react';
import React from 'react';
import Link from 'next/link';

interface Product {
    id:string;
    name:string;
    price: number;
    stock: number;
    is_featured: boolean;
    image_url:string | null;
    created_at: string;
}

export default async function CartPage() {
    // 商品の数（カートに入れるときの数）初期値は１で設定
    const [quantity, setQuantity] = useState(1);
    // 計算ロジック
    const total = price * quantity;

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
                  <th>小計</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{productsName}</td>
                  <td>{price}</td>
                  <td>
                    <div className="qty-control">
                      <button type="button">−</button>
                      <span>1</span>
                      <button type="button">＋</button>
                    </div>
                  </td>
                  <td>{total}</td>
                  <td><button type="button" className="remove-btn">削除</button></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* お届け先情報 */}
          <h3 style={{ fontSize: '16px', marginBottom: '16px', marginTop: '32px' }}>お届け先</h3>
          <div className="card">
            <div className="form-group">
              <label>お名前</label>
              <input type="text" defaultValue="山田 太郎" />
            </div>
            <div className="form-group">
              <label>郵便番号</label>
              <input type="text" defaultValue="530-0001" style={{ width: '160px' }} />
            </div>
            <div className="form-group">
              <label>住所</label>
              <input type="text" defaultValue="大阪府大阪市北区梅田1-1-1" />
            </div>
            <div className="form-group">
              <label>電話番号</label>
              <input type="text" defaultValue="090-0000-0000" />
            </div>
          </div>

          {/* 決済 */}
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
          <div className="summary-row"><span>小計</span><span>¥12,960</span></div>
          <div className="summary-row"><span>送料</span><span>¥800</span></div>
          <div className="summary-total"><span>合計</span><span>¥13,760</span></div>
          <br />
          <Link href="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
            ログインして注文を確定する
          </Link>
        </div>
      </div>
    </main>
  );
}