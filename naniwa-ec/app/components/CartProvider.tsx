"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { getCart, saveCart, addToCart as addToCartUtil, updateQuantity as updateQtyUtil, removeFromCart as removeUtil, clearCart as clearUtil, getCartCount, type CartItem } from "@/lib/utils/cart"

// カートの状態と操作を管理する型定義
type CartContextType = {
  items: CartItem[]
  cartCount: number
  addToCart: (product: { id: string; name: string; price: number; stock: number }) => string | undefined
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

// カート機能のコンポーネント
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]) // カート内のアイテム一覧（種類）
  const [cartCount, setCartCount] = useState(0) // カートに入っているアイテムの数

  // 初期化時、LocalStorageからカート情報を取得
  useEffect(() => {
    const cart = getCart()
    setItems(cart)
    setCartCount(cart.length)
  }, [])

// カートのアイテム一覧と個数にズレが生じないように同時に更新する
  const refresh = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
    setCartCount(newItems.length)
  }, [])

  // 商品をカートに追加
  const addToCart = useCallback((product: { id: string; name: string; price: number; stock: number }): string | undefined => {
    const { items: updated, error } = addToCartUtil(product)
    if (error) return error
    refresh(updated)
    return undefined
  }, [refresh])

  // 商品の数量を更新
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const updated = updateQtyUtil(productId, quantity)
    refresh(updated)
  }, [refresh])

  // 商品をカートから削除
  const removeFromCart = useCallback((productId: string) => {
    const updated = removeUtil(productId)
    refresh(updated)
  }, [refresh])

  // カートの中身をすべて空にする
  const clearCartFn = useCallback(() => {
    clearUtil()
    refresh([])
  }, [refresh])

  return (
    <CartContext.Provider value={{ items, cartCount, addToCart, updateQuantity, removeFromCart, clearCart: clearCartFn }}>
      {children}
    </CartContext.Provider>
  )
}

// 各コンポーネントからカート機能を利用するためのカスタムフック
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
