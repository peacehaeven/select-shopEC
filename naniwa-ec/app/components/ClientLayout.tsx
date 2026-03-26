"use client"

import { usePathname } from "next/navigation"
import { CartProvider } from "./CartProvider"
import Navbar from "./Navbar"
import Footer from "@/components/Footer"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <CartProvider>
      <Navbar />
      {children}
      <Footer />
    </CartProvider>
  )
}
