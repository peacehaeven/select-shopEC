"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// カートの中身の型定義
type CartItem = {
  id: string;
  quantity: number;
};

type CartContextType = {
  cartCount: number;
  setCartCount: (count: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  // ここでカートの総数を管理します（初期値は0、本来はローカルストレージなどから読み込む）
  const [cartCount, setCartCount] = useState(0);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

// 他のコンポーネントから簡単に使うためのカスタムフック
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}