"use client";

import React from "react";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import "./success.css"; // CSSファイルをインポート

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || searchParams.get("orderId") || "読み込み中";

  return (
    <main>
      <div className="success-container">
        <div className="card success-card"> {/* globals.cssのcardと success-cardを併用 */}
          <div className="success-icon">✅</div>
          
          <h2 className="success-title">ご注文ありがとうございました</h2>
          
          <div className="order-number-box">
            <p className="order-number-label">お問い合わせ用・注文番号</p>
            <p className="order-number-value">#{orderNumber}</p>
            <p className="order-number-note">
              ⚠️ キャンセル・お問い合わせの際に必要です。<br/>
              メモまたは保存をお願いします。
            </p>
          </div>

          <div className="success-message">
            <p>ご注文を受け付けました。</p>
            
            <div className="message-section">
              <strong>【重要】</strong><br />
              <strong>自動返信の「注文完了メール」はお送りしておりません。</strong><br />
              発送の手配が整い次第、別途メールにてご連絡差し上げます。
            </div>

            <div className="message-section">
              <h3>【発送について】</h3>
              <p>商品は、ご注文日から<strong>土日祝日を除く3営業日以内</strong>に発送いたします。</p>
              <p>発送が完了しましたら、改めてメールにてお知らせいたします。</p>
              <h3>【ご注文のキャンセルについて】</h3>
              <p><strong>発送準備に入る前（発送連絡のメールが届くまで）</strong>であれば承ることが可能です。</p>
              <p>キャンセルをご希望の場合は、お早めに下記までご連絡をお願いいたします。</p>
              <ul>
                <li>電話：06-1515-1515</li>
                <li>メール：naniwa15@example.com</li>
              </ul>
              <p>
                ※発送完了後のキャンセルはお受けできかねますのでご了承ください。
              </p>
            </div>
          </div>

          <div className="action-area">
            <Link href="/" className="btn btn-primary btn-full">
              ショップトップへ戻る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}