"use client"

import { usePathname } from "next/navigation"
import { CartProvider } from "./CartProvider"
import Navbar from "./Navbar"
import Footer from "@/components/Footer"


// URLに応じて、共通パーツを表示するかどうかを切り替えます
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() // 現在のURLパスを取得
  const isAdmin = pathname.startsWith("/admin") // 管理画面かどうか判定

  // 管理画面の場合：コンテンツのみ表示
  if (isAdmin) {  
    return <>{children}</>
  }

  // ショップ画面の場合：Navbar、Footer、カート情報、及びコンテンツを表示
  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  )
}
