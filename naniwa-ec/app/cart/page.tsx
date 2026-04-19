"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCart } from "@/app/components/CartProvider"
import { createAnonClient } from "@/lib/supabase/client"
import { SHIPPING_FEE } from "@/lib/utils/cart"
import { formatPrice, taxIncluded } from "@/lib/utils/price"
import "./cart.css"

// カート詳細・注文情報入力ページ
export default function CartPage() {
  const router = useRouter()
  
  // カート情報の取得と操作用フック
  const { items, updateQuantity, removeFromCart, clearCart } = useCart()

  // --- 配送・顧客情報 ---
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  // --- UI制御 ---
  const [errorMessage, setErrorMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)



/* ▼▼▼▼▼▼ 要分割 ▼▼▼▼▼▼（新規ファイル：lib/utils/format.tsなど） */
  // 郵便番号のフォーマット（数字のみ抽出し、ハイフンを挿入）
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 7) value = value.slice(0, 7)
    if (value.length > 3) value = `${value.slice(0, 3)}-${value.slice(3)}`
    setPostalCode(value)
  }

  // 電話番号のフォーマット（数字のみ抽出し、最大11桁）
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 11) value = value.slice(0, 11)
    setPhoneNumber(value)
  }

  // カード番号のフォーマット（4桁ごとにスペースを挿入）
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length > 16) value = value.slice(0, 16)
    const parts = value.match(/.{1,4}/g)
    setCardNumber(parts ? parts.join(" ") : "")
  }
/* ▲▲▲▲▲▲▲ 要分割 ▲▲▲▲▲▲▲ */

  // --- 金額計算 ---
  const subtotal = items.reduce((sum, item) => sum + taxIncluded(item.price) * item.quantity, 0) // 商品小計（税込）
  const shipping = items.length > 0 ? SHIPPING_FEE : 0 // 送料（商品がある場合のみ）
  const total = subtotal + shipping // 合計金額

  // 注文ボタン押下時のバリデーション
  const handleOrder = () => {
    setErrorMessage("")
    if (items.length === 0) {
      setErrorMessage("カートに商品がありません。")
      return
    }
    if (!customerName.trim()) {
      setErrorMessage("お名前を入力してください。")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      setErrorMessage("有効なメールアドレスを入力してください。")
      return
    }
    if (postalCode.length !== 8) {
      setErrorMessage("郵便番号は7桁で入力してください。")
      return
    }
    if (!address.trim()) {
      setErrorMessage("住所を入力してください。")
      return
    }
    if (phoneNumber.length < 10 || phoneNumber.length > 11) {
      setErrorMessage("電話番号は10桁または11桁で入力してください。")
      return
    }
    const rawCardNumber = cardNumber.replace(/\s/g, "")
    if (rawCardNumber.length !== 16) {
      setErrorMessage("カード番号は16桁で入力してください。")
      return
    }
    setShowConfirmModal(true) // すべて通過したら確認モーダルを表示
  }

  // 確認モーダルでの注文確定処理
  const handleConfirmOrder = async () => {
    setShowConfirmModal(false)
    setLoading(true)

    const supabase = createAnonClient()
    // Supabase RPCを介して注文情報とアイテムを一括登録
    const { data: orderId, error } = await supabase.rpc("place_guest_order", {
      p_guest_email: customerEmail,
      p_shipping_name: customerName,
      p_shipping_postal_code: postalCode,
      p_shipping_address: address,
      p_shipping_phone: phoneNumber,
      p_cart_items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
    })

    setLoading(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    clearCart() // カートをクリア
    router.push(`/order-complete?order_id=${orderId}`) // 完了ページへ遷移
  }


/* ▼▼▼▼▼▼ 要分割 ▼▼▼▼▼▼（新規ファイル：app/components/ConfirmModal.tsxなど） */
  // --- UIコンポーネント: 確認モーダル ---
  const confirmModal =
    showConfirmModal && typeof document !== "undefined"
      ? createPortal(
          <div className="modal-overlay">
            <div>
              <h3>注文内容のご確認</h3>
              <p>ご注文前に以下をご確認ください。</p>
              <ul
                style={{
                  textAlign: "left",
                  fontSize: "13px",
                  lineHeight: 2,
                  paddingLeft: "20px",
                  margin: "8px 0 12px",
                }}
              >
                <li>商品は<strong>３営業日以内</strong>に発送いたします（土日祝日を除く）。</li>
                <li>お届けは地域や交通状況により前後する場合がございます。</li>
                <li>キャンセルご希望の場合は、電話かメールにてご連絡ください。</li>
                <li><strong>発送完了後はキャンセルできません</strong>のでご注意ください。</li>
              </ul>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  margin: "0 0 16px",
                  padding: "12px 16px",
                  backgroundColor: "#fffbeb",
                  border: "1.5px solid #f59e0b",
                  borderLeft: "5px solid #f59e0b",
                  borderRadius: "8px",
                  color: "#92400e",
                }}
              >
                <span style={{ fontSize: "20px", flexShrink: 0 }}>!</span>
                <span style={{ fontSize: "13px", lineHeight: 1.7 }}>
                  注文確認メールは送信されません。
                  <br />
                  <strong style={{ fontSize: "14px" }}>注文確定後の注文番号を必ずお控えください。</strong>
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button type="button" className="btn btn-primary" onClick={handleConfirmOrder}>
                  注文を確定する
                </button>
                <button type="button" className="btn" onClick={() => setShowConfirmModal(false)}>
                  戻る
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null
/* ▲▲▲▲▲▲▲ 要分割 ▲▲▲▲▲▲▲ */

  return (
    <>
      {confirmModal}

      <main>
        <h2 className="section-title">カート</h2>

        <div className="cart-layout">

          {/* 左カラム: カート商品一覧 + お届け先入力 */}
          <div>
            <div className="card" style={{ padding: 0 }}>
              {items.length > 0 ? (
                <div className="table-wrapper">
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
                          <td data-label="商品">{item.name}</td>
                          <td data-label="単価（税込）" style={{ textAlign: "right" }}>
                            {formatPrice(taxIncluded(item.price))}
                          </td>
                          <td data-label="数量" style={{ textAlign: "center" }}>
                            <div className="qty-control">
                              <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>
                                +
                              </button>
                            </div>
                          </td>
                          <td data-label="小計（税込）" style={{ textAlign: "right" }}>
                            {formatPrice(taxIncluded(item.price) * item.quantity)}
                          </td>
                          <td data-label="">
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "40px", textAlign: "center" }}>
                  <p>カートに商品が入っていません。</p>
                  <Link
                    href="/"
                    style={{
                      color: "var(--ink)",
                      textDecoration: "underline",
                      marginTop: "12px",
                      display: "inline-block",
                    }}
                  >
                    ショッピングを続ける
                  </Link>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <p style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>
                ※カートに追加した時点では、商品の取り置きはされません。ほかのお客様のご注文が先に確定した場合は、そちらが優先されますのでご了承ください。
              </p>
            )}

            {items.length > 0 && (
              <>
                <h3 style={{ fontSize: "16px", marginTop: "32px", marginBottom: "16px" }}>お届け先</h3>
                <div className="card">
                  <div className="form-group">
                    <label>お名前</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="大阪 太郎"
                    />
                  </div>

                  <div className="form-group">
                    <label>メールアドレス（注文時の確認用）</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>郵便番号</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={handlePostalCodeChange}
                      style={{ width: "220px" }}
                      placeholder="530-0001"
                    />
                  </div>

                  <div className="form-group">
                    <label>住所</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="大阪府大阪市中央区〇〇 1-1-1"
                    />
                  </div>

                  <div className="form-group">
                    <label>電話番号</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      style={{ width: "220px" }}
                      placeholder="09000000000"
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: "16px", marginTop: "32px", marginBottom: "16px" }}>お支払い情報</h3>
                <div className="card">
                  <div className="form-group">
                    <label>クレジットカード番号</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      style={{ width: "220px" }}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 右カラム: 注文内容のサマリー */}
          {items.length > 0 && (
            <div className="card cart-summary">
              <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>注文内容</h3>
              <div className="summary-row">
                <span>商品合計（税込）</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>送料</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="summary-total">
                <span>合計</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: "24px" }}
                onClick={handleOrder}
                disabled={loading}
              >
                {loading ? "処理中..." : "注文内容を確認する"}
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
    </>
  )
}
