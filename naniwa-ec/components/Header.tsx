"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from "@/context/CartContext";
import "./Header.css";

export default function Header() {
  const { cartCount} = useCart();
  const pathname = usePathname();

  return (
    <header className="header">
      <div className="header-inner">
        {/* ロゴエリア */}
        <Link href="/" className="logo">
          なにわセレクトショップ
        </Link>

        {/* ナビゲーション */}
        <nav className="nav">
          <ul className="nav-list">
            <li>
              <Link href="/" className={pathname === '/' ? 'active' : ''}>
                ホーム
              </Link>
            </li>
            <li>
              <Link href="/product" className={pathname === '/product' ? 'active' : ''}>
                商品一覧
              </Link>
            </li>
          </ul>
        </nav>

        {/* アイコンエリア */}
        <div className="header-icons">
          <Link href="/cart" className="cart-icon-wrapper">
            <span className="cart-icon">🛒</span>
            <span className="cart-label">カート</span>
            {/* ０より大きいときだけバッジを表示 */}
            {cartCount >  0 && (
                <span className="cart-badge">{cartCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}