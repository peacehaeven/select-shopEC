"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function OrderCompletePage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

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
