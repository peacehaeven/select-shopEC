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
                <a href="orders.html">注文管理</a>
                <a href="products.html" className="active">商品管理</a>
            </div>

            <div className="page-header">
                <h2 className="section-title section-title-inline">商品一覧</h2>
                <button className="btn btn-secondary" onclick="openModal()">＋ 商品を追加</button>
            </div>

            <div className="card card-no-pad">
                <table>
                    <thead>
                        <tr>
                            <th>商品名</th>
                            <th>価格</th>
                            <th>在庫</th>
                            <th>おすすめ</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>なにわ黒毛和牛 すき焼きセット</td>
                            <td>¥8,640</td>
                            <td>5</td>
                            <td>✅</td>
                            <td>
                                <button className="btn btn-outline btn-sm" onclick="openModal()">編集</button>
                                &nbsp;
                                <button className="btn btn-sm btn-danger">削除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>大阪湾 天然ハモ 白焼きセット</td>
                            <td>¥5,400</td>
                            <td>12</td>
                            <td>✅</td>
                            <td>
                                <button className="btn btn-outline btn-sm" onclick="openModal()">編集</button>
                                &nbsp;
                                <button className="btn btn-sm btn-danger">削除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>泉州水茄子 浅漬けセット</td>
                            <td>¥2,160</td>
                            <td>20</td>
                            <td>✅</td>
                            <td>
                                <button className="btn btn-outline btn-sm" onclick="openModal()">編集</button>
                                &nbsp;
                                <button className="btn btn-sm btn-danger">削除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>河内鴨 ロース 冷凍500g</td>
                            <td>¥3,888</td>
                            <td>8</td>
                            <td>—</td>
                            <td>
                                <button className="btn btn-outline btn-sm" onclick="openModal()">編集</button>
                                &nbsp;
                                <button className="btn btn-sm btn-danger">削除</button>
                            </td>
                        </tr>
                        <tr>
                            <td>岸和田だんじり 地酒セット</td>
                            <td>¥4,320</td>
                            <td>0</td>
                            <td>—</td>
                            <td>
                                <button className="btn btn-outline btn-sm" onclick="openModal()">編集</button>
                                &nbsp;
                                <button className="btn btn-sm btn-danger">削除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    )
}




