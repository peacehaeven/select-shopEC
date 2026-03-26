"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function OrderCompletePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()
    supabase
      .from("orders")
      .select("order_number")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        if (data) setOrderNumber(data.order_number)
      })
  }, [orderId])

  return (
    <main>
      {showModal && (
        <div className="modal-overlay">
          <div>
            <h3>ご注文ありがとうございます</h3>
            <p>ご注文内容を受け付けました。以下をご確認ください。</p>
            <ul style={{ textAlign: "left", fontSize: "13px", lineHeight: 2, paddingLeft: "20px", margin: "8px 0 16px" }}>
              <li>商品は<strong>３営業日以内</strong>に発送いたします（土日祝日を除く）。</li>
              <li>お届けは地域や交通状況により前後する場合がございます。</li>
              <li>キャンセルご希望の場合は、注文確認メールに記載のメールアドレスまでご連絡ください。</li>
            </ul>
            <div>
              <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                確認しました
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", padding: "48px 32px" }}>
        <h2 style={{ fontSize: "22px", marginBottom: "24px" }}>ご注文ありがとうございました</h2>

        {orderNumber ? (
          <div style={{ background: "var(--bg)", padding: "24px", borderRadius: "4px", marginBottom: "24px", border: "2px dashed var(--border)" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>注文番号</p>
            <p style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "1px" }}>#{orderNumber}</p>
          </div>
        ) : (
          <p style={{ marginBottom: "24px", color: "var(--muted)" }}>読み込み中...</p>
        )}

        <p style={{ fontSize: "14px", marginBottom: "8px" }}>ステータス：<strong>注文受付済み</strong></p>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "32px" }}>
          発送が完了しましたら、ご登録のメールアドレスに通知をお送りします。
        </p>

        <Link href="/" className="btn btn-primary" style={{ display: "inline-block", maxWidth: "240px" }}>
          ショップトップへ戻る
        </Link>
      </div>
    </main>
  )
}
