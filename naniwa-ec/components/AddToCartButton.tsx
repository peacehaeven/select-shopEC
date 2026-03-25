// components/AddToCartButton.tsx
"use client";

import { useCart } from "@/context/CartContext"; // パスは適宜合わせてください

export default function AddToCartButton() {
  const { cartCount, setCartCount } = useCart();

  const handleAddToCart = () => {
    // 今の数に +1 して更新する
    setCartCount(cartCount + 1);
    alert("カートに追加しました！まいどあり！🛒");
  };

  return (
    <button className="cartButton" onClick={handleAddToCart}>
      カートに入れる
    </button>
  );
}