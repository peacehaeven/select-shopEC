"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cancelOrder, logout } from "@/lib/actions"
import { taxIncluded } from "@/lib/utils/price"

type OrderItem = {
  product_name: string
  unit_price: number
  quantity: number
}

type Order = {
  id: string
  order_number: string
  created_at: string
  status: "pending" | "shipped" | "cancelled"
  guest_email: string
  shipping_name: string
  shipping_postal_code: string
  shipping_address: string
  shipping_phone: string
  subtotal: number
  shipping_fee: number
  total: number
  carrier: string | null
  tracking_number: string | null
  order_items: OrderItem[]
}

const CARRIERS = ["ヤマト運輸", "佐川急便", "ゆうパック", "その他"]

export default function OrdersPage() {
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>([])
  const [shipSelectOrder, setShipSelectOrder] = useState<Order | null>(null)
  const [carrier, setCarrier] = useState(CARRIERS[0])
  const [trackingNumber, setTrackingNumber] = useState("")
  const [cancelSelectOrder, setCancelSelectOrder] = useState<Order | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select(`
        id, order_number, created_at, status,
        guest_email,
        shipping_name, shipping_postal_code, shipping_address, shipping_phone,
        subtotal, shipping_fee, total,
        carrier, tracking_number,
        order_items ( product_name, unit_price, quantity )
      `)
      .order("created_at", { ascending: false })
    if (data) setOrders(data as Order[])
  }

  useEffect(() => { fetchOrders() }, [])

  const openShipModal = (order: Order) => {
    setShipSelectOrder(order)
    setCarrier(CARRIERS[0])
    setTrackingNumber("")
    setErrorMsg("")
  }

  const handleShip = async () => {
    if (!trackingNumber.trim()) {
      setErrorMsg("追跡番号を入力してください。")
      return
    }
    if (!shipSelectOrder) return

    setLoading(true)
    setErrorMsg("")

    const res = await fetch("/api/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: shipSelectOrder.id,
        carrier,
        tracking_number: trackingNumber,
      }),
    })

    setLoading(false)

    if (res.ok) {
      setShipSelectOrder(null)
      fetchOrders()
    } else {
      const { message } = await res.json() as { message: string }
      setErrorMsg(message)
    }
  }

  const handleCancel = async () => {
    if (!cancelSelectOrder) return

    setLoading(true)
    setErrorMsg("")

    const result = await cancelOrder(cancelSelectOrder.id)
    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setCancelSelectOrder(null)
      fetchOrders()
    }
  }

  return (
    <>
      <nav>
        <span className="nav-logo">なにわセレクトショップ 管理</span>
        <span className="nav-links">
          <a href="/">ショップへ戻る</a>
          <button
            onClick={() => logout().then(() => { window.location.href = "/admin/login" })}
            style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "13px" }}
          >
            ログアウト
          </button>
        </span>
      </nav>

      <main>
        <div className="admin-tabs">
          <a href="/admin/orders" className="active">注文管理</a>
          <a href="/admin/products">商品管理</a>
        </div>

        <h2 className="section-title">注文一覧</h2>

        <div className="order-list">
          {orders.map((order) => {
            const displaySubtotal = taxIncluded(order.order_items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0))
            const displayTotal = displaySubtotal + order.shipping_fee
            return (
            <div key={order.id} className={`order-card is-${order.status}`}>

              {/* ヘッダー（1番目の子div） */}
              <div>
                <div>
                  <span>#{order.order_number}</span>
                  <span>{new Date(order.created_at).toLocaleDateString("ja-JP")}</span>
                  <span>
                    {order.status === "pending" && "注文受付済み"}
                    {order.status === "shipped" && "発送済み"}
                    {order.status === "cancelled" && "キャンセル済み"}
                  </span>
                </div>
                <span>¥{displayTotal.toLocaleString()}<small style={{ marginLeft: "4px", fontWeight: "normal" }}>（税込）</small></span>
              </div>

              {/* ボディ：3カラム（2番目の子div） */}
              <div>
                {/* 注文者情報 */}
                <div>
                  <p>注文者情報</p>
                  <div><span>氏名</span><span>{order.shipping_name}</span></div>
                  <div><span>メール</span><span>{order.guest_email}</span></div>
                  <div><span>電話</span><span>{order.shipping_phone}</span></div>
                  <div><span>住所</span><span>〒{order.shipping_postal_code} {order.shipping_address}</span></div>
                </div>

                {/* 注文商品 */}
                <div>
                  <p>注文商品</p>
                  <ul>
                    {order.order_items.map((item, i) => (
                      <li key={i}>
                        <span>{item.product_name}</span>
                        <span>¥{item.unit_price.toLocaleString()} × {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 金額明細 */}
                <div>
                  <p>金額明細</p>
                  <div><span>小計</span><span>¥{displaySubtotal.toLocaleString()}</span></div>
                  <div><span>送料</span><span>¥{order.shipping_fee.toLocaleString()}</span></div>
                  <div><span>合計（税込）</span><span>¥{displayTotal.toLocaleString()}</span></div>
                </div>
              </div>

              {/* フッター（最後の子div：常に表示） */}
              <div>
                {order.status === "pending" && (
                  <>
                    <button onClick={() => setCancelSelectOrder(order)}>キャンセルする</button>
                    <button onClick={() => openShipModal(order)}>発送済みにする</button>
                  </>
                )}
                {order.status === "shipped" && (
                  <span>{order.carrier}　追跡番号：{order.tracking_number}</span>
                )}
                {order.status === "cancelled" && (
                  <span>キャンセル済み</span>
                )}
              </div>

            </div>
            )
          })}
        </div>

        {/* 発送情報入力モーダル */}
        {shipSelectOrder !== null && (
          <div className="modal-overlay" onClick={() => setShipSelectOrder(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3>発送情報の入力</h3>
              <p>#{shipSelectOrder.order_number}　{shipSelectOrder.shipping_name} 様</p>

              <div className="form-group">
                <label>配送業者</label>
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>追跡番号</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="例: 1234-5678-9999"
                />
              </div>

              {errorMsg && (
                <p style={{ color: "#c00", fontSize: "13px", marginBottom: "16px" }}>{errorMsg}</p>
              )}

              <div>
                <button className="btn btn-outline" onClick={() => setShipSelectOrder(null)}>キャンセル</button>
                <button className="btn btn-secondary" onClick={handleShip} disabled={loading}>
                  {loading ? "処理中..." : "発送済みにする"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* キャンセル確認モーダル */}
        {cancelSelectOrder !== null && (
          <div className="modal-overlay" onClick={() => setCancelSelectOrder(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3>注文をキャンセル</h3>
              <p>#{cancelSelectOrder.order_number}　{cancelSelectOrder.shipping_name} 様</p>
              <p>この注文をキャンセルします。キャンセル後は元に戻せません。</p>
              <p>※ キャンセル通知メールは送信されません。</p>

              {errorMsg && (
                <p style={{ color: "#c00", fontSize: "13px" }}>{errorMsg}</p>
              )}

              <div>
                <button className="btn btn-outline" onClick={() => setCancelSelectOrder(null)}>戻る</button>
                <button className="btn btn-secondary" onClick={handleCancel} disabled={loading}>
                  {loading ? "処理中..." : "キャンセルする"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}