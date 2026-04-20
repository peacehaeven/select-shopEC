import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

type Props = {
  searchParams: Promise<{
    order_id?: string
  }>
}

export default async function OrderCompletePage({ searchParams }: Props) {
  // URL クエリから注文IDを受け取り、完了画面で利用する。
  const { order_id } = await searchParams
  let orderNumber: string | null = null

  // 注文IDがある場合だけ、表示用の注文番号を DB から取得する。
  if (order_id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("orders")
      .select("order_number")
      .eq("id", order_id)
      .single()

    if (data) {
      orderNumber = data.order_number
    }
  }

  return (
    <main>
      <div
        className="card"
        style={{ maxWidth: "600px", margin: "60px auto", textAlign: "center", padding: "48px 32px" }}
      >
        <h2 style={{ fontSize: "22px", marginBottom: "24px" }}>ご注文ありがとうございました</h2>

        {/* 注文番号が取得できた場合だけ、強調表示エリアを出す。 */}
        {orderNumber ? (
          <div
            style={{
              background: "var(--bg)",
              padding: "24px",
              borderRadius: "4px",
              marginBottom: "24px",
              border: "2px dashed var(--border)",
            }}
          >
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>注文番号</p>
            <p style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "1px" }}>#{orderNumber}</p>
          </div>
        ) : (
          /* 注文番号が取れなかった場合は、その旨だけを表示する。 */
          <p style={{ marginBottom: "24px", color: "var(--muted)" }}>読み込み中...</p>
        )}

        {/* 注文後の案内文を表示する。 */}
        <p style={{ fontSize: "14px", marginBottom: "8px" }}>ステータス：<strong>注文受付済み</strong></p>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "8px" }}>
          発送が完了しましたら、ご登録のメールアドレスに通知をお送りします。
        </p>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "8px" }}>
          ※ 注文確認メールは送信されません。上記の<strong>注文番号を必ずお控えください</strong>。
        </p>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "32px" }}>
          ※ 発送完了後はキャンセルできません。
        </p>

        {/* 公開側トップへ戻る導線。 */}
        <Link href="/" className="btn btn-primary" style={{ display: "inline-block", maxWidth: "240px" }}>
          ショップトップへ戻る
        </Link>
      </div>
    </main>
  )
}
