"use client";

import React from "react";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function OrderSuccessPage() {
  // 仮の注文ID（本来はURLやStateから取得）
  const searchParams = useSearchParams();
  const orderId = SearchParams.get(orderId ||"読み込み中");

  return (
    <main>
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          {/* アイコン */}
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>✅</div>
          
          {/* メインタイトル */}
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>
            ご注文ありがとうございます
          </h2>
          
          {/* 注文番号 */}
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '32px' }}>
            注文番号：<span style={{ fontWeight: '500', color: '#333' }}>#{orderId}</span>
          </p>
          
          <hr style={{ border: 'none', borderTop: '1px solid #eee', marginBottom: '32px' }} />

          {/* メッセージ */}
          <p style={{ marginBottom: '24px', color: '#333', lineHeight: '1.8' }}>
            ご注文を受け付けました。<br />
            これより発送の準備に入らせていただきます。
          </p>

          {/* 重要なお知らせ（強調ボックス） */}
          <div style={{ 
            backgroundColor: '#fff9db', // 柔らかな黄色
            border: '1px solid #ffec99',
            color: '#856404', // 濃い茶色（読みやすさ重視）
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            <strong>発送通知について</strong><br />
            発送が完了しましたら、ご登録のメールアドレス宛に<br />
            「発送通知メール」をお送りいたします。
          </div>

          {/* アクションボタン */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <Link 
              href="/" 
              className="btn btn-primary" 
              style={{ width: '100%', maxWidth: '280px', textAlign: 'center', textDecoration: 'none' }}
            >
              トップページに戻る
            </Link>
            
            <Link 
              href="/mypage" 
              style={{ fontSize: '14px', color: '#666', marginTop: '8px', textDecoration: 'underline' }}
            >
              注文履歴を確認する
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}