"use client"

import Link from "next/link"
import { useCart } from "./CartProvider"

export default function Navbar() {
  const { cartCount } = useCart()

  return (
    <nav>
      <Link href="/" className="nav-logo">なにわセレクトショップ</Link>
      <Link href="/cart" className="nav-cart">
        🛒 カート{cartCount > 0 && `（${cartCount}）`}
      </Link>
    </nav>
  )
}
