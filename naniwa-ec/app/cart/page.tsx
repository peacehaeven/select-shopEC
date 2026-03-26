"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/app/components/CartProvider"
import { taxIncluded, formatPrice } from "@/lib/utils/price"
import { SHIPPING_FEE } from "@/lib/utils/cart"
import { createAnonClient } from "@/lib/supabase/client"
import "./cart.css"

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeFromCart, clearCart } = useCart()

  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // 入力フォーマット関数
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 7) val = val.slice(0, 7)
    if (val.length > 3) val = val.slice(0, 3) + "-" + val.slice(3)
    setPostalCode(val)
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "")
    setPhoneNumber(val)
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "")
    if (val.length > 16) val = val.slice(0, 16)
    const parts = val.match(/.{1,4}/g)
    setCardNumber(parts ? parts.join(" ") : "")
  }

  // 計算
  const subtotal = items.reduce((sum, item) => sum + taxIncluded(item.price) * item.quantity, 0)
  const shipping = items.length > 0 ? SHIPPING_FEE : 0
  const total = subtotal + shipping

  // 注文処理
  const handleOrder = async () => {
    setErrorMessage("")

    if (items.length === 0) {
      setErrorMessage("カートに商品がありません。")
      return
    }

    // バリデーション
    if (!customerName.trim()) { setErrorMessage("お名前が未入力です。"); return }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) { setErrorMessage("有効なメールアドレスを入力してください。"); return }
    if (postalCode.length !== 8) { setErrorMessage("郵便番号は7桁の数字で入力してください。"); return }
    if (!address.trim()) { setErrorMessage("住所が未入力です。"); return }
    if (!phoneNumber.trim()) { setErrorMessage("電話番号が未入力です。"); return }
    const rawCard = cardNumber.replace(/\s/g, "")
    if (rawCard.length !== 16) { setErrorMessage("カード番号は16桁の数字で入力してください。"); return }
    setLoading(true)

    const supabase = createAnonClient()
    const { data: orderId, error } = await supabase.rpc("place_guest_order", {
      p_guest_email: customerEmail,
      p_shipping_name: customerName,
      p_shipping_postal_code: postalCode,
      p_shipping_address: address,
      p_shipping_phone: phoneNumber,
      p_cart_items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    clearCart()
    router.push(`/order-complete?order_id=${orderId}`)
  }

  return (
    <main>
      <h2 className="section-title">カート</h2>
      <div className="cart-layout">
        <div>
          {/* カート商品一覧 */}
          <div className="card" style={{ padding: 0 }}>
            {items.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>商品</th>
                    <th style={{ textAlign: "right" }}>単価（税込）</th>
                    <th style={{ textAlign: "center" }}>数量</th>
                    <th style={{ textAlign: "right" }}>小計（税込）</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.product_id}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: "right" }}>{formatPrice(taxIncluded(item.price))}</td>
                      <td style={{ textAlign: "center" }}>
                        <div className="qty-control">
                          <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>＋</button>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>{formatPrice(taxIncluded(item.price) * item.quantity)}</td>
                      <td>
                        <button type="button" className="remove-btn" onClick={() => removeFromCart(item.product_id)}>
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p>カートに商品が入っていません。</p>
                <Link href="/" style={{ color: "var(--ink)", textDecoration: "underline", marginTop: "12px", display: "inline-block" }}>
                  ショッピングを続ける
                </Link>
              </div>
            )}
          </div>

          {/* お届け先フォーム */}
          {items.length > 0 && (
            <>
              <h3 style={{ fontSize: "16px", marginBottom: "16px", marginTop: "32px" }}>お届け先</h3>
              <div className="card">
                <div className="form-group">
                  <label>お名前</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="山田 太郎" />
                </div>
                <div className="form-group">
                  <label>メールアドレス（発送通知の送信先）</label>
                  <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="test@example.com" />
                </div>
                <div className="form-group">
                  <label>郵便番号</label>
                  <input type="text" value={postalCode} onChange={handlePostalCodeChange} style={{ width: "120px" }} placeholder="530-0001" />
                </div>
                <div className="form-group">
                  <label>住所</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="大阪府大阪市北区梅田1-1-1" />
                </div>
                <div className="form-group">
                  <label>電話番号</label>
                  <input type="text" value={phoneNumber} onChange={handlePhoneNumberChange} style={{ width: "160px" }} placeholder="09000000000" />
                </div>
              </div>

              <h3 style={{ fontSize: "16px", marginBottom: "16px", marginTop: "32px" }}>お支払い情報</h3>
              <div className="card">
                <div className="form-group">
                  <label>クレジットカード番号</label>
                  <input type="text" value={cardNumber} onChange={handleCardNumberChange} style={{ width: "220px" }} placeholder="0000 0000 0000 0000" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 注文サマリー */}
        {items.length > 0 && (
          <div className="card cart-summary">
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>注文内容</h3>
            <div className="summary-row"><span>小計（税込）</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-row"><span>送料</span><span>{formatPrice(shipping)}</span></div>
            <div className="summary-total"><span>合計</span><span>{formatPrice(total)}</span></div>
            <button className="btn btn-primary" style={{ marginTop: "24px" }} onClick={handleOrder} disabled={loading}>
              {loading ? "処理中..." : "注文を確定する"}
            </button>
            {errorMessage && (
              <p style={{ color: "#c00", fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
                {errorMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
