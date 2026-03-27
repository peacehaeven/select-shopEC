"use client"

import { useEffect, useState } from "react"
import { cancelOrder, logout } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"
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

function formatYen(value: number) {
  return `¥${value.toLocaleString("ja-JP")}`
}

function getTaxIncludedUnitPrice(unitPrice: number) {
  return taxIncluded(unitPrice)
}

function getTaxIncludedSubtotal(order: Order) {
  if (order.order_items.length === 0) {
    return taxIncluded(order.subtotal)
  }

  return order.order_items.reduce(
    (sum, item) => sum + getTaxIncludedUnitPrice(item.unit_price) * item.quantity,
    0,
  )
}

function getTaxIncludedTotal(order: Order) {
  return getTaxIncludedSubtotal(order) + order.shipping_fee
}

function getStatusLabel(status: Order["status"]) {
  if (status === "pending") return "注文受付済み"
  if (status === "shipped") return "発送済み"
  return "キャンセル済み"
}

function normalizeTrackingNumber(value: string) {
  return value
    .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0),
    )
    .replace(/[‐－―ーｰ]/g, "-")
    .replace(/[^0-9A-Za-z-]/g, "")
}

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

    if (data) {
      setOrders(data as Order[])
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

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

    try {
      const res = await fetch("/api/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: shipSelectOrder.id,
          carrier,
          tracking_number: trackingNumber,
        }),
      })

      if (res.ok) {
        setShipSelectOrder(null)
        fetchOrders()
        alert("発送済みに更新しました。")
      } else {
        const { message } = (await res.json()) as { message: string }
        setErrorMsg(message)
      }
    } catch {
      setErrorMsg("配送更新中にエラーが発生しました。時間をおいて再度お試しください。")
    } finally {
      setLoading(false)
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
        <span className="nav-logo">なにわセレクトショップ 管理画面</span>
        <span className="nav-links">
          <a href="/">ショップへ戻る</a>
          <button
            onClick={() =>
              logout().then(() => {
                window.location.href = "/admin/login"
              })
            }
            style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "13px" }}
          >
            ログアウト
          </button>
        </span>
      </nav>

      <main>
        <div className="admin-tabs">
          <a href="/admin/orders" className="active">
            注文管理
          </a>
          <a href="/admin/products">商品管理</a>
        </div>

        <h2 className="section-title">注文一覧</h2>

        <div className="order-list">
          {orders.map((order) => (
            <div key={order.id} className={`order-card is-${order.status}`}>
              <div>
                <div>
                  <span style={{ fontWeight: 600, fontFamily: "'Noto Serif JP', serif" }}>
                    #{order.order_number}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "12px", marginLeft: "12px" }}>
                    {new Date(order.created_at).toLocaleDateString("ja-JP")}
                  </span>
                  <span style={{ marginLeft: "12px" }}>{getStatusLabel(order.status)}</span>
                </div>
                <div style={{ fontWeight: 600 }}>{formatYen(getTaxIncludedTotal(order))}</div>
              </div>

              <div
                style={{
                  padding: "16px 20px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  fontSize: "13px",
                }}
              >
                <div>
                  <p style={{ color: "var(--muted)", marginBottom: "4px" }}>注文者情報</p>
                  <p>{order.shipping_name}</p>
                  <p>{order.guest_email}</p>
                  <p>{order.shipping_phone}</p>
                  <p>
                    〒{order.shipping_postal_code} {order.shipping_address}
                  </p>
                </div>

                <div>
                  <p style={{ color: "var(--muted)", marginBottom: "4px" }}>注文商品</p>
                  {order.order_items.map((item, index) => (
                    <p key={index}>
                      {item.product_name} {formatYen(getTaxIncludedUnitPrice(item.unit_price))} × {item.quantity}
                    </p>
                  ))}
                  <p style={{ marginTop: "8px", color: "var(--muted)" }}>
                    小計 {formatYen(getTaxIncludedSubtotal(order))} + 送料 {formatYen(order.shipping_fee)}
                  </p>
                </div>
              </div>

              {order.status === "shipped" && (
                <div style={{ padding: "0 20px 16px", fontSize: "13px", color: "var(--muted)" }}>
                  {order.carrier} / 追跡番号: {order.tracking_number}
                </div>
              )}

              {order.status === "pending" && (
                <div style={{ padding: "0 20px 16px", display: "flex", gap: "8px" }}>
                  <button className="btn btn-outline" onClick={() => setCancelSelectOrder(order)}>
                    キャンセルする
                  </button>
                  <button className="btn btn-secondary" onClick={() => openShipModal(order)}>
                    発送済みにする
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {shipSelectOrder !== null && (
          <div className="modal-overlay" onClick={() => setShipSelectOrder(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: "'Noto Serif JP', serif", marginBottom: "4px" }}>発送情報の入力</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>
                #{shipSelectOrder.order_number} / {shipSelectOrder.shipping_name} 様
              </p>

              <div className="form-group">
                <label>配送業者</label>
                <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
                  {CARRIERS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>追跡番号</label>
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(normalizeTrackingNumber(e.target.value))}
                  placeholder="例: 1234-5678-9999"
                  maxLength={50}
                />
              </div>

              {errorMsg && <p style={{ color: "#c00", fontSize: "13px", marginBottom: "16px" }}>{errorMsg}</p>}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setShipSelectOrder(null)}>
                  キャンセル
                </button>
                <button className="btn btn-secondary" onClick={handleShip} disabled={loading}>
                  {loading ? "処理中..." : "発送済みにする"}
                </button>
              </div>
            </div>
          </div>
        )}

        {cancelSelectOrder !== null && (
          <div className="modal-overlay" onClick={() => setCancelSelectOrder(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontFamily: "'Noto Serif JP', serif", marginBottom: "4px" }}>注文をキャンセル</h3>
              <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "8px" }}>
                #{cancelSelectOrder.order_number} / {cancelSelectOrder.shipping_name} 様
              </p>
              <p style={{ fontSize: "13px", marginBottom: "24px" }}>
                キャンセル通知メールは送信されません。
              </p>

              {errorMsg && <p style={{ color: "#c00", fontSize: "13px", marginBottom: "16px" }}>{errorMsg}</p>}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button className="btn btn-outline" onClick={() => setCancelSelectOrder(null)}>
                  戻る
                </button>
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
