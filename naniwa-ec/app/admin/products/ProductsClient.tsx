"use client"
import { useState } from "react"
import { addProduct, updateProduct, deleteProduct } from "@/lib/actions"
import { formatPrice } from "@/lib/utils/price"
import { logout } from "@/lib/actions"

type Product = {
  id: string
  name: string
  price: number
  stock: number
  is_featured: boolean
}

type ModalState =
  | { mode: "add" }
  | { mode: "edit"; product: Product }
  | null

export default function ProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [modal, setModal] = useState<ModalState>(null)
  const [formName, setFormName] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formStock, setFormStock] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const openAdd = () => {
    setModal({ mode: "add" })
    setFormName("")
    setFormPrice("")
    setFormStock("")
    setErrorMsg("")
  }

  const openEdit = (p: Product) => {
    setModal({ mode: "edit", product: p })
    setFormName(p.name)
    setFormPrice(String(p.price))
    setFormStock(String(p.stock))
    setErrorMsg("")
  }

  const closeModal = () => setModal(null)

  const validate = () => {
    if (!formName.trim()) return "商品名を入力してください。"
    const price = Number(formPrice)
    if (!Number.isInteger(price) || price < 0) return "価格は0以上の整数を入力してください。"
    const stock = Number(formStock)
    if (!Number.isInteger(stock) || stock < 0) return "在庫数は0以上の整数を入力してください。"
    return null
  }

  const handleSubmit = async () => {
    const err = validate()
    if (err) { setErrorMsg(err); return }

    setLoading(true)
    setErrorMsg("")

    const data = {
      name: formName.trim(),
      price: Number(formPrice),
      stock: Number(formStock),
      is_featured: false,
    }

    let result: { error: string | null }
    if (modal?.mode === "add") {
      result = await addProduct(data)
    } else if (modal?.mode === "edit") {
      result = await updateProduct(modal.product.id, data)
    } else {
      return
    }

    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
    } else {
      // 画面をリフレッシュして最新データを取得
      window.location.reload()
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    const result = await deleteProduct(id)
    if (result.error) {
      alert(`削除に失敗しました: ${result.error}`)
    } else {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  return (
    <>
      <nav>
        <span className="nav-logo">なにわセレクトショップ 管理</span>
        <span className="nav-links">
          <a href="/">ショップへ戻る</a>
          <button
            onClick={() => logout().then(() => { window.location.href = "/admin/login" })}
            style={{ background: "none", border: "none", color: "#bbb", cursor: "pointer", fontSize: "13px" }}
          >
            ログアウト
          </button>
        </span>
      </nav>

      <main>
        <div className="admin-tabs">
          <a href="/admin/orders">注文管理</a>
          <a href="/admin/products" className="active">商品管理</a>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>商品一覧</h2>
          <button className="btn btn-secondary" onClick={openAdd}>＋ 商品を追加</button>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px" }}>
          <table>
            <thead>
              <tr>
                <th>商品名</th>
                <th>単価</th>
                <th>在庫</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{formatPrice(p.price)}</td>
                  <td>{p.stock === 0 ? <span className="badge-sold-out">売り切れ</span> : p.stock}</td>
                  <td style={{ display: "flex", gap: "8px" }}>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "12px" }} onClick={() => openEdit(p)}>編集</button>
                    <button className="btn btn-outline" style={{ padding: "4px 12px", fontSize: "12px", color: "#c00", borderColor: "#c00" }} onClick={() => handleDelete(p.id, p.name)}>削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* 商品追加・編集モーダル */}
      {modal !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === "add" ? "商品を追加" : "商品を編集"}</h3>

            <div className="form-group">
              <label>商品名</label>
              <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="例: なにわ黒毛和牛 すき焼きセット" />
            </div>

            <div className="form-group">
              <label>価格（税抜・円）</label>
              <input type="number" min="0" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="例: 8000" />
            </div>

            <div className="form-group">
              <label>在庫数</label>
              <input type="number" min="0" value={formStock} onChange={(e) => setFormStock(e.target.value)} placeholder="例: 10" />
            </div>

            {errorMsg &&<p style={{ color: "#c00", fontSize: "13px", marginBottom: "16px" }}>{errorMsg}</p>}

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={closeModal}>キャンセル</button>
              <button className="btn btn-secondary" onClick={handleSubmit} disabled={loading}>
                {loading ? "処理中..." : modal.mode === "add" ? "追加する" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
