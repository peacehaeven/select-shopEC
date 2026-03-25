"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

  // 【1】 ページを開いた時：ローカルストレージから数字を読み込む
  useEffect(() => {
    const savedCount = localStorage.getItem("naniwa_cart_count");
    if (savedCount) {
      setCartCount(parseInt(savedCount, 10));
    }
  }, []);

  // 【2】 数字が変わった時：ローカルストレージに保存する
  useEffect(() => {
    localStorage.setItem("naniwa_cart_count", cartCount.toString());
  }, [cartCount]);

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