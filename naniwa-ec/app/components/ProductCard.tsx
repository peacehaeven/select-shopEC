"use client"

import { useState } from "react"
import { useCart } from "./CartProvider"
import { taxIncluded, formatPrice } from "@/lib/utils/price"

type Props = {
  id: string
  name: string
  price: number
  stock: number
}

export default function ProductCard({ id, name, price, stock }: Props) {
  const { addToCart } = useCart()
  const [message, setMessage] = useState("")

  const handleAdd = () => {
    const error = addToCart({ id, name, price, stock })
    if (error) {
      setMessage(error)
      setTimeout(() => setMessage(""), 3000)
    } else {
      setMessage("カートに追加しました")
      setTimeout(() => setMessage(""), 2000)
    }
  }

  return (
    <div className="product-card">
      <div className="img-placeholder">商品画像</div>
      {stock === 0 && <span className="badge-sold-out">売り切れ</span>}
      <p className="product-name">{name}</p>
      <p className="product-price">{formatPrice(taxIncluded(price))}</p>
      {stock > 0 && stock <= 5 && <span className="badge-low-stock">残りわずか</span>}
      {stock > 0 ? (
        <button className="btn btn-primary" onClick={handleAdd}>カートに入れる</button>
      ) : (
        <button className="btn btn-disabled" disabled>売り切れ</button>
      )}
      {message && (
        <p style={{ fontSize: "12px", marginTop: "6px", color: message.includes("上限") ? "#c00" : "var(--muted)", textAlign: "center" }}>
          {message}
        </p>
      )}
    </div>
  )
}
