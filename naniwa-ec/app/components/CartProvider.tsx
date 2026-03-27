"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { getCart, saveCart, addToCart as addToCartUtil, updateQuantity as updateQtyUtil, removeFromCart as removeUtil, clearCart as clearUtil, getCartCount, type CartItem } from "@/lib/utils/cart"

type CartContextType = {
  items: CartItem[]
  cartCount: number
  addToCart: (product: { id: string; name: string; price: number; stock: number }) => string | undefined
  updateQuantity: (productId: string, quantity: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const cart = getCart()
    setItems(cart)
    setCartCount(cart.length)
  }, [])

  const refresh = useCallback((newItems: CartItem[]) => {
    setItems(newItems)
    setCartCount(newItems.length)
  }, [])

  const addToCart = useCallback((product: { id: string; name: string; price: number; stock: number }): string | undefined => {
    const { items: updated, error } = addToCartUtil(product)
    if (error) return error
    refresh(updated)
    return undefined
  }, [refresh])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const updated = updateQtyUtil(productId, quantity)
    refresh(updated)
  }, [refresh])

  const removeFromCart = useCallback((productId: string) => {
    const updated = removeUtil(productId)
    refresh(updated)
  }, [refresh])

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

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error("useCart must be used within a CartProvider")
  return context
}
