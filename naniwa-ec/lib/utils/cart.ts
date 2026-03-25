const CART_KEY = 'naniwa_cart'
export const SHIPPING_FEE = 800

export interface CartItem {
  product_id: string
  name: string
  price: number   // 税抜価格
  quantity: number
  stock: number   // 追加時点の在庫数（上限チェック用）
}

/** カート取得 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(CART_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as CartItem[]
  } catch {
    return []
  }
}

/** カート保存 */
export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

/** カートに商品追加（同一商品は数量加算、在庫上限チェック付き） */
export function addToCart(product: { id: string; name: string; price: number; stock: number }): { items: CartItem[]; error?: string } {
  const items = getCart()
  const existing = items.find(item => item.product_id === product.id)
  const currentQty = existing ? existing.quantity : 0
  if (currentQty >= product.stock) {
    return { items, error: `「${product.name}」は在庫上限（${product.stock}個）に達しています。` }
  }
  if (existing) {
    existing.quantity += 1
  } else {
    items.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      stock: product.stock,
    })
  }
  saveCart(items)
  return { items }
}

/** 数量変更（在庫上限チェック付き） */
export function updateQuantity(productId: string, quantity: number): CartItem[] {
  const items = getCart()
  const item = items.find(i => i.product_id === productId)
  if (item) {
    item.quantity = Math.max(1, Math.min(quantity, item.stock))
  }
  saveCart(items)
  return items
}

/** カートから商品を除去 */
export function removeFromCart(productId: string): CartItem[] {
  const items = getCart().filter(i => i.product_id !== productId)
  saveCart(items)
  return items
}

/** カートを空にする */
export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
}

/** カート内の合計個数 */
export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0)
}
