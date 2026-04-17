"use client"

import { useState } from "react"
import { useCart } from "./CartProvider"
import { taxIncluded, formatPrice } from "@/lib/utils/price"

// 商品情報
type Props = {
  id: string 
  name: string
  price: number
  stock: number
}

export default function ProductCard({ id, name, price, stock }: Props) {
  const { addToCart } = useCart()
  const [message, setMessage] = useState("")

  // カートへの追加処理
  const handleAdd = () => {
    const error = addToCart({ id, name, price, stock })
    if (error) {
      // エラー（購入点数制限など）があった場合
      setMessage(error)
      setTimeout(() => setMessage(""), 3000)
    } else {
      // 正常に追加された場合
      setMessage("カートに追加しました")
      setTimeout(() => setMessage(""), 2000)
    }
  }

  return (
    <div className="product-card">
      <div className="img-placeholder">準備中</div>
      
      {/* 売り切れ時のバッジ表示 */}
      {stock === 0 && <span className="badge-sold-out">売り切れ</span>}
      <p className="product-name">{name}</p>
      <p className="product-price">
        {formatPrice(taxIncluded(price))}<span className="tax-label">（税込）</span>
      </p>

      {/* 在庫が少なくなった時のバッジ表示 */}
      {stock > 0 && stock <= 5 && <span className="badge-low-stock">残りわずか</span>}

      {/* 在庫有無によるボタンの切り替え */}
      {stock > 0 ? (<button className="btn btn-primary" onClick={handleAdd}>カートに入れる</button>)
      : (<button className="btn btn-disabled" disabled>売り切れ</button>)}

      {/* カート追加の結果メッセージ */}
      {message && (
        <p style={{ fontSize: "12px", marginTop: "6px", color: message.includes("上限") ? "#c00": "var(--muted)", textAlign: "center" }}>
          {message}
        </p>
      )}
    </div>
  )
}
