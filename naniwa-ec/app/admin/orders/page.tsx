"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
// import { cancelOrder } from "./actions"　あとで

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

    if (data) {
      setOrders(data as Order[])
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const openShipSelect = (order: Order) => {
    setShipSelectOrder(order)
    setCarrier(CARRIERS[0])
    setTrackingNumber("")
  }

  const handleShip = async () => {
    if (!trackingNumber) {
      alert("追跡番号を入力してください。")
      return
    }
    if (!shipSelectOrder) {
      return
    }

    const res = await fetch("/api/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: shipSelectOrder.id,
        carrier: carrier,
        trackingNumber: trackingNumber,
      }),
    })

    if (res.ok) {
      setShipSelectOrder(null)
      fetchOrders()
    }
  }

  const handleCancel = async () => {
    if (!cancelSelectOrder) {
      return
    }
    // await cancelOrder(cancelSelectOrder.id)
    setCancelSelectOrder(null)
    fetchOrders()
  }

  return (
    <main>

      <h2>注文一覧</h2>

      {orders.map((order) => (
        <div key={order.id}>

          {/* 注文番号・日付・ステータス・合計 */}
          <p>
            #{order.order_number}　
            {new Date(order.created_at).toLocaleDateString("ja-JP")}　
            {order.status === "pending" && <span>注文受付済み</span>}
            {order.status === "shipped" && <span>発送済み</span>}
            {order.status === "cancelled" && <span>キャンセル済み</span>}
            　¥{order.total.toLocaleString()}
          </p>

          {/* 注文者・配送先 */}
          <p>お名前：{order.shipping_name}</p>
          <p>メール：{order.guest_email}</p>
          <p>電話番号：{order.shipping_phone}</p>
          <p>住所：〒{order.shipping_postal_code} {order.shipping_address}</p>

          {/* 注文商品 */}
          {order.order_items.map((item, i) => (
            <p key={i}>
              {item.product_name}　¥{item.unit_price.toLocaleString()} × {item.quantity}
            </p>
          ))}

          {/* 金額明細 */}
          <p>小計：¥{order.subtotal.toLocaleString()}</p>
          <p>送料：¥{order.shipping_fee.toLocaleString()}</p>
          <p>合計：¥{order.total.toLocaleString()}</p>

          {/* ボタン：pending のときだけ表示 */}
          {order.status === "pending" && (
            <div>
              <button onClick={() => setCancelSelectOrder(order)}>キャンセルする</button>
              <button onClick={() => openShipSelect(order)}>発送済みにする</button>
            </div>
          )}

          {/* 追跡番号：shipped のときだけ表示 */}
          {order.status === "shipped" && (
            <p>{order.carrier}　追跡番号：{order.tracking_number}</p>
          )}

          <hr />
        </div>
      ))}


      {/* 発送情報入力モーダル */}
      {shipSelectOrder !== null && (
        <div>
          <h3>発送情報の入力</h3>
          <p>#{shipSelectOrder.order_number}　{shipSelectOrder.shipping_name} 様</p>

          <div>
            <label>配送業者</label>
            <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              {CARRIERS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label>追跡番号</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="1234-5678-9999"
            />
          </div>

          <button onClick={() => setShipSelectOrder(null)}>キャンセル</button>
          <button onClick={handleShip}>発送済みにする</button>
        </div>
      )}


      {/* キャンセル確認モーダル */}
      {cancelSelectOrder !== null && (
        <div>
          <h3>注文をキャンセル</h3>
          <p>#{cancelSelectOrder.order_number}　{cancelSelectOrder.shipping_name} 様</p>
          <p>※ キャンセル通知メールは送信されません。</p>

          <button onClick={() => setCancelSelectOrder(null)}>戻る</button>
          <button onClick={handleCancel}>キャンセルする</button>
        </div>
      )}

    </main>
  )
}