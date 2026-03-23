import { createClient } from "@/lib/supabase/server" // インポート、外部から取り込む

export default async function Home() {  // 「Home」という名前の非同期関数をデフォルトでエクスポート
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

                    <div className="order-card is-pending" id="card-20250601-0042">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250601-0042</span>
                                <span className="order-date">2025年6月1日</span>
                                <span className="status status-new" id="status-20250601-0042">注文受付済み</span>
                            </div>
                            <span className="order-total">¥13,760</span>
                        </div>

                        <div className="order-card-body">
                            <!-- 注文者・配送先 -->
                            <div className="order-section">
                                <p className="order-section-title">注文者 / 配送先</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">お名前</span>
                                    <span className="order-info-value">山田 太郎</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">メール</span>
                                    <span className="order-info-value"><a href="/cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="1168707c707570517469707c617d743f727e7c">[email&#160;protected]</a></span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">090-1234-5678</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">郵便番号</span>
                                    <span className="order-info-value">530-0001</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">大阪府大阪市北区梅田1-1-1</span>
                                </div>
                            </div>

                            <!-- 注文商品 -->
                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">なにわ黒毛和牛 すき焼きセット</span>
                                        <span className="item-meta">¥8,640 × 1</span>
                                    </li>
                                    <li>
                                        <span className="item-name">泉州水茄子 浅漬けセット</span>
                                        <span className="item-meta">¥2,160 × 2</span>
                                    </li>
                                </ul>
                            </div>

                            <!-- 金額 -->
                            <div className="order-section">
                                <p className="order-section-title">金額</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">小計</span>
                                    <span className="order-info-value">¥12,960</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">送料</span>
                                    <span className="order-info-value">¥800</span>
                                </div>
                                <div className="order-info-row order-info-row-total">
                                    <span className="order-info-label fw-bold">合計</span>
                                    <span className="order-info-value fw-bold">¥13,760</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer" id="footer-20250601-0042">
                            <span className="tracking-info">追跡番号：未登録</span>
                            <button
                                className="btn btn-success btn-ship"
                                onclick="openModal('20250601-0042', '山田 太郎')">
                                発送済みにする
                            </button>
                        </div>
                    </div>

                    <div className="order-card is-pending" id="card-20250601-0041">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250601-0041</span>
                                <span className="order-date">2025年6月1日</span>
                                <span className="status status-new" id="status-20250601-0041">注文受付済み</span>
                            </div>
                            <span className="order-total">¥5,400</span>
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
                                    <span className="order-info-value"><a href="/cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="087b7d727d6361486d70696578646d266b6765">[email&#160;protected]</a></span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">080-9876-5432</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">郵便番号</span>
                                    <span className="order-info-value">542-0012</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">大阪府大阪市中央区谷町2-2-2</span>
                                </div>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">大阪湾 天然ハモ 白焼きセット</span>
                                        <span className="item-meta">¥5,400 × 1</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">金額</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">小計</span>
                                    <span className="order-info-value">¥4,600</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">送料</span>
                                    <span className="order-info-value">¥800</span>
                                </div>
                                <div className="order-info-row order-info-row-total">
                                    <span className="order-info-label fw-bold">合計</span>
                                    <span className="order-info-value fw-bold">¥5,400</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer" id="footer-20250601-0041">
                            <span className="tracking-info">追跡番号：未登録</span>
                            <button
                                className="btn btn-success btn-ship"
                                onclick="openModal('20250601-0041', '鈴木 花子')">
                                発送済みにする
                            </button>
                        </div>
                    </div>


                    <!-- ────────────────────────────────
                    注文③：発送済み
        ──────────────────────────────── -->
                    <div className="order-card is-shipped">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250531-0040</span>
                                <span className="order-date">2025年5月31日</span>
                                <span className="status status-shipped">発送済み</span>
                            </div>
                            <span className="order-total">¥3,456</span>
                        </div>

                        <div className="order-card-body">
                            <div className="order-section">
                                <p className="order-section-title">注文者 / 配送先</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">お名前</span>
                                    <span className="order-info-value">田中 一郎</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">メール</span>
                                    <span className="order-info-value"><a href="/cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="6c180d020d070d2c09140d011c0009420f0301">[email&#160;protected]</a></span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">070-1111-2222</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">郵便番号</span>
                                    <span className="order-info-value">550-0014</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">大阪府大阪市西区北堀江3-3-3</span>
                                </div>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">なにわ伝統野菜 詰め合わせ</span>
                                        <span className="item-meta">¥1,620 × 1</span>
                                    </li>
                                    <li>
                                        <span className="item-name">大阪みかん 旬の詰め合わせ</span>
                                        <span className="item-meta">¥1,080 × 1</span>
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
                                    <span className="order-info-value fw-bold">¥3,456</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer">
                            <span className="tracking-info">
                                ヤマト運輸　追跡番号：
                                <a href="#" onclick="return false;">1234-5678-9012</a>
                            </span>
                            <span className="shipped-note">発送済みのため変更不可</span>
                        </div>
                    </div>

                    <div className="order-card is-shipped">
                        <div className="order-card-header">
                            <div className="order-header-left">
                                <span className="order-number">#20250531-0039</span>
                                <span className="order-date">2025年5月31日</span>
                                <span className="status status-shipped">発送済み</span>
                            </div>
                            <span className="order-total">¥9,720</span>
                        </div>

                        <div className="order-card-body">
                            <div className="order-section">
                                <p className="order-section-title">注文者 / 配送先</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">お名前</span>
                                    <span className="order-info-value">佐藤 恵子</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">メール</span>
                                    <span className="order-info-value"><a href="/cdn-cgi/l/email-protection" className="__cf_email__" data-cfemail="136072677c53766b727e637f763d707c7e">[email&#160;protected]</a></span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">電話番号</span>
                                    <span className="order-info-value">06-9999-8888</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">郵便番号</span>
                                    <span className="order-info-value">558-0041</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">住所</span>
                                    <span className="order-info-value">大阪府大阪市住吉区南住吉4-4-4</span>
                                </div>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">注文商品</p>
                                <ul className="item-list">
                                    <li>
                                        <span className="item-name">なにわ黒毛和牛 すき焼きセット</span>
                                        <span className="item-meta">¥8,640 × 1</span>
                                    </li>
                                    <li>
                                        <span className="item-name">なにわ黒豆 煮豆セット</span>
                                        <span className="item-meta">¥1,296 × 1</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="order-section">
                                <p className="order-section-title">金額</p>
                                <div className="order-info-row">
                                    <span className="order-info-label">小計</span>
                                    <span className="order-info-value">¥8,920</span>
                                </div>
                                <div className="order-info-row">
                                    <span className="order-info-label">送料</span>
                                    <span className="order-info-value">¥800</span>
                                </div>
                                <div className="order-info-row order-info-row-total">
                                    <span className="order-info-label fw-bold">合計</span>
                                    <span className="order-info-value fw-bold">¥9,720</span>
                                </div>
                            </div>
                        </div>

                        <div className="order-card-footer">
                            <span className="tracking-info">
                                ゆうパック　追跡番号：
                                <a href="#" onclick="return false;">0987-6543-2100</a>
                            </span>
                            <span className="shipped-note">発送済みのため変更不可</span>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    )
}

