const TAX_RATE = 1.08

/** 税込価格を計算（小数点以下切り捨て） */
export function taxIncluded(taxExcludedPrice: number): number {
  return Math.floor(taxExcludedPrice * TAX_RATE)
}

/** 金額を表示用フォーマット（例: ¥1,080） */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('ja-JP')}`
}
