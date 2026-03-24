import { createClient } from "@/lib/supabase/server"

export default async function Home() {
    const supabase = await createClient()

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at")
    return (
        <main>
            <div className="admin-tabs">
                <a href="orders.html" className="active">注文管理</a>
                <a href="products.html">商品管理</a>
            </div>

            <div>
                <h2 className="section-title">注文一覧</h2>
                <div className="order-list">

                    {/* 未発送 */}
                    <div className="order-card is-pending">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250601-0042</span>
                                <span className="order-date">2025年6月1日</span>
                                <span className="status status-new">注文受付済み</span>
                            </div>
                            <span className="order-total">¥9,440</span>
                        </div>

                        <div className="order-card-body">
                            <div className="order-section">
                                <p className="order-section-title">注文者 / 配送先</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">お名前</span>
                                    <span className="order-info-value">山田 太郎</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">メール</span>
                                    <span className="order-info-value">yamada@example.com</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">090-1234-5678</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">〒530-0001　大阪府大阪市北区梅田1-1-1</span>
                                </div>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">なにわ黒毛和牛 すき焼きセット</span>
                                        <span className="item-meta">¥8,640 × 1</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">金額</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">小計</span>
                                    <span className="order-info-value">¥8,640</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">送料</span>
                                    <span className="order-info-value">¥800</span>
                                </div>
                                <div className="order-info-row order-info-row-total">
                                    <span className="order-info-label fw-bold">合計</span>
                                    <span className="order-info-value fw-bold">¥9,440</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer">
                            <span className="tracking-info">追跡番号：未登録</span>
                            <button className="btn btn-success btn-ship">
                                発送済みにする
                            </button>
                        </div>
                    </div>

                    {/* 発送済み */}
                    <div className="order-card is-shipped">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250531-0041</span>
                                <span className="order-date">2025年5月31日</span>
                                <span className="status status-shipped">発送済み</span>
                            </div>
                            <span className="order-total">¥3,500</span>
                        </div>

                        <div className="order-card-body">
                            <div className="order-section">
                                <p className="order-section-title">注文者 / 配送先</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">お名前</span>
                                    <span className="order-info-value">鈴木 花子</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">メール</span>
                                    <span className="order-info-value">suzuki@example.com</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">080-9876-5432</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">〒542-0012　大阪府大阪市中央区谷町2-2-2</span>
                                </div>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">泉州水茄子 浅漬けセット</span>
                                        <span className="item-meta">¥2,700 × 1</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">金額</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">小計</span>
                                    <span className="order-info-value">¥2,700</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">送料</span>
                                    <span className="order-info-value">¥800</span>
                                </div>
                                <div className="order-info-row order-info-row-total">
                                    <span className="order-info-label fw-bold">合計</span>
                                    <span className="order-info-value fw-bold">¥3,500</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer">
                            <span className="tracking-info">
                                ヤマト運輸 追跡番号：1234-5678-9012
                            </span>
                            <span className="shipped-note">発送済みのため変更不可</span>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}
