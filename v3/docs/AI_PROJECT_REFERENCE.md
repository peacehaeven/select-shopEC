# AI プロジェクト参照ドキュメント
## なにわセレクトショップ ECシステム — フェーズ1 実装専用

> **このドキュメントの用途**  
> バイブコーディング時にAIが参照する「プロジェクト憲法」。  
> コードを1行書く前に必ずこのドキュメントを読み込み、全ての判断の基準にすること。

---

## 🚨 最重要宣言（コーディング開始前に必ず読むこと）

```
このプロジェクトは「フェーズ1」のみを実装する。
フェーズ2以降の機能は、DBのカラム・テーブルが設計済みであっても
コードを一切書いてはならない。

「あとで使うかもしれないから」という理由でフェーズ2の実装を
先取りすることは絶対に禁止。
```

### ✅ フェーズ1で作るもの（これだけ）

| 対象 | 実装する機能 |
|---|---|
| 顧客向け | 商品閲覧、ゲストカート（localStorage）、ゲスト注文 |
| 管理者向け | 商品管理CRUD（論理削除）、注文管理・発送情報入力・キャンセル、管理者認証、発送通知メール |

### 🚫 フェーズ1で絶対に作らないもの

| 禁止機能 | 理由 |
|---|---|
| 会員登録・ログイン画面 | フェーズ2以降のスコープ |
| マイページ・注文履歴画面 | フェーズ2以降のスコープ |
| 商品画像のアップロード機能 | フェーズ3以降のスコープ |
| スマホ対応レスポンシブデザイン | フェーズ2以降のスコープ |
| DBカート（cart_itemsテーブル）の読み書き | フェーズ2以降のスコープ |
| 実際のクレジットカード課金処理 | フェーズ1はモックのみ |

---

## 📋 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック（バージョン固定）](#2-技術スタックバージョン固定)
3. [絶対遵守ルール（AIへの厳命）](#3-絶対遵守ルールaiへの厳命)
4. [ディレクトリ構成](#4-ディレクトリ構成)
5. [画面一覧とルーティング](#5-画面一覧とルーティング)
6. [機能要件チェックリスト](#6-機能要件チェックリスト)
7. [データベース設計](#7-データベース設計)
8. [RLS・セキュリティ設計](#8-rlsセキュリティ設計)
9. [UIデザインシステム](#9-uiデザインシステム)
10. [ビジネスロジック仕様](#10-ビジネスロジック仕様)
11. [外部サービス連携](#11-外部サービス連携)
12. [環境変数定義](#12-環境変数定義)
13. [実装パターン集](#13-実装パターン集)
14. [NGパターン集（やってはいけないこと）](#14-ngパターン集やってはいけないこと)

---

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| プロジェクト名 | なにわセレクトショップ ECシステム |
| **実装フェーズ** | **フェーズ1のみ（v1.2 確定版）** |
| コンセプト | 大阪の特産品・名産品をオンラインで販売するECサイト |
| ターゲット | ゲスト購入者（会員登録不要） ＋ ショップ管理者 |
| 開発チーム | プログラミング初学者5名（残り6日間） |
| 文書番号 | REQ-NANIWA-EC-001 |

---

## 2. 技術スタック（バージョン固定）

> ⚠️ **バージョンは厳守。勝手にアップグレード・ダウングレードしないこと。**

| 領域 | 技術 | バージョン | 重要な制約 |
|---|---|---|---|
| フレームワーク | Next.js (App Router) | **16.2** | Server Components/Actions前提 |
| UI | React | **19.2** | Server Components/Actionsを前提とする |
| 言語 | TypeScript | **5.9** | Strictモード必須 |
| ランタイム | Node.js | **24.14.0 LTS** | コードネーム "Krypton" |
| データベース | Supabase (PostgreSQL) | 最新（マネージド） | Tokyo リージョン必須 |
| DBクライアント | `@supabase/supabase-js` | **2.99.3** | |
| SSR連携 | `@supabase/ssr` | **0.9.0** | |
| 認証 | Supabase Auth | 最新（マネージド） | 管理者ログイン専用。メール+パスワード認証のみ |
| カート管理 | **localStorage のみ** | Web標準API | **DBカートは使わない。cart_itemsテーブルには触らない** |
| 決済 | **モック実装のみ** | — | **UIと16桁バリデーションのみ。課金APIは繋がない** |
| メール送信 | Resend | **6.9.4** | |
| デプロイ | Vercel | 最新（マネージド） | GitHub連携自動デプロイ |

---

## 3. 絶対遵守ルール（AIへの厳命）

### 3.1 `proxy.ts` の使用（`middleware.ts` は使用禁止）

```
❌ 絶対に作成しないこと: middleware.ts
✅ 必ず使うこと: proxy.ts
```

- `middleware.ts` は使用・生成しない
- プロジェクトルート（または `src/` 配下）に `proxy.ts` を配置する
- `proxy` 関数としてエクスポートする
- ランタイムはNode.js（Edgeランタイムの制約は不要）

### 3.2 セッション維持（proxy.ts 内に必須実装）

```typescript
// proxy.ts の必須パターン
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: Request) {
  // ✅ createServerClient を使用
  // ✅ Cookie の getAll を実装
  // ✅ Cookie の setAll を実装（セッショントークンのリフレッシュ）← 省略不可
  // ✅ 未ログイン時の /admin/login へのリダイレクト
  //    ※ /login ではない（プロジェクトに /login 画面は存在しない）
}
```

**省略不可の処理：**
- `getAll` によるCookie取得
- `setAll` によるセッショントークンのリフレッシュ処理

### 3.3 責務の分離（厳守）

| 実装箇所 | 担当する処理 | 担当しない処理 |
|---|---|---|
| `proxy.ts` | Cookieの更新、未ログイン時の `/admin/login` へのリダイレクト（**`/login` ではない**） | 権限チェック、DBクエリ |
| Server Components / Server Actions | 権限チェック（adminか確認）、DBクエリを伴う認可ロジック | Cookieの直接操作 |

### 3.4 その他の必須ルール

- TypeScript Strictモード（`strict: true`）必須
- APIキー等は `.env.local` で管理。**ソースコードへのハードコード厳禁**
- `.env.local` は `.gitignore` に含めること
- 価格はDBに**税抜価格**で保存し、表示時に**税込換算**（×1.1、切り捨て）する
- 管理者の商品フォームでの価格入力も**税抜価格**で行う（DBに税抜で保存）
- 金額表示は `¥X,XXX` 形式（円記号 + 3桁カンマ区切り）で統一
- エラーメッセージはすべて**日本語**で表示
- 商品の削除は**論理削除のみ**（`deleted_at` に日時記録）。**`.delete()` は使わない**

---

## 4. ディレクトリ構成

> ⚠️ フェーズ1で作成するファイルのみ記載。フェーズ2以降のファイルは作成しない。

```
/ (プロジェクトルート)
├── proxy.ts                    ← ミドルウェア代替。必ずここに置く（middleware.tsは作らない）
├── .env.local                  ← 環境変数（gitignore済み）
├── .gitignore
├── next.config.ts
├── tsconfig.json               ← strict: true
├── package.json
│
├── app/
│   ├── layout.tsx              ← ルートレイアウト（Noto Sans JP / Noto Serif JP）
│   ├── page.tsx                ← SCR-01: トップページ（商品一覧）
│   │
│   ├── cart/
│   │   └── page.tsx            ← SCR-02: カート・注文フォーム
│   │
│   ├── order-complete/
│   │   └── page.tsx            ← SCR-03: 注文完了
│   │
│   ├── api/
│   │   └── ship/
│   │       └── route.ts        ← 発送処理API（Supabase UPDATE + Resendメール送信）
│   │
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx        ← SCR-04: 管理者ログイン
│   │   ├── orders/
│   │   │   └── page.tsx        ← SCR-05: 注文管理
│   │   └── products/
│   │       └── page.tsx        ← SCR-06: 商品管理
│   │
│   └── components/
│       ├── Navbar.tsx           ← 共通ナビゲーション
│       ├── ProductCard.tsx      ← 商品カード（トップページ）
│       ├── CartProvider.tsx     ← localStorageカート管理Context
│       ├── ShipModal.tsx        ← 発送情報入力モーダル
│       ├── CancelModal.tsx      ← キャンセル確認モーダル
│       └── ProductModal.tsx     ← 商品追加・編集モーダル
│
└── lib/
    ├── supabase/
    │   ├── server.ts            ← Server Component用クライアント
    │   ├── client.ts            ← Client Component用クライアント
    │   └── types.ts             ← Supabase CLI生成の型定義
    └── utils/
        ├── price.ts             ← 税込計算・金額フォーマット
        └── cart.ts              ← localStorageカート操作ユーティリティ
```

**🚫 フェーズ1では作成しないもの：**
- `/app/login/`（会員ログイン）
- `/app/register/`（会員登録）
- `/app/mypage/`（マイページ）
- その他フェーズ2以降の画面・コンポーネント

---

## 5. 画面一覧とルーティング

| 画面ID | 画面名 | URL | 認証 | コンポーネント種別 |
|---|---|---|---|---|
| SCR-01 | トップページ | `/` | 不要 | Server Component |
| SCR-02 | カート | `/cart` | 不要 | Client Component（localStorage操作） |
| SCR-03 | 注文完了 | `/order-complete` | 不要 | Client Component |
| SCR-04 | 管理者ログイン | `/admin/login` | 不要 | Client Component |
| SCR-05 | 注文管理 | `/admin/orders` | 要(admin) | Server Component + Client Modal |
| SCR-06 | 商品管理 | `/admin/products` | 要(admin) | Server Component + Client Modal |

> 上記6画面がフェーズ1の全画面。これ以外のURLのページは作成しない。

### 認証フロー

```
/admin/* へのアクセス
    ↓
proxy.ts: 未ログイン？ → /admin/login にリダイレクト
    ↓（ログイン済み）
Server Component: profiles.role === 'admin'？ → いいえなら / にリダイレクト
    ↓（admin確認済み）
ページ表示
```

---

## 6. 機能要件チェックリスト

### 顧客向け：商品閲覧（SCR-01）

- [ ] F-01-01: `is_featured = true` の商品をページ上段に表示
- [ ] F-01-02: 通常商品（`is_featured = false`）を下段に表示
- [ ] F-01-03: 商品名・価格（**税込換算して表示**）・在庫数を表示
- [ ] F-01-04: 在庫0 → 「売り切れ」バッジ表示 + ボタンを無効化（`disabled`）
- [ ] F-01-05: おすすめ商品 → 「おすすめ」バッジを表示
- [ ] F-01-06: 「カートに入れる」クリック → localStorageに追加
- [ ] F-01-07: 未ログイン状態でも「カートに入れる」を押せる（認証不要）

### 顧客向け：カート操作（SCR-02）

- [ ] F-02-01: カート商品一覧（商品名・単価・数量・小計）を表示
- [ ] F-02-02: ＋/−ボタンで数量を変更できる
- [ ] F-02-03: 数量変更時に小計・合計を即座に再計算
- [ ] F-02-04: 削除ボタンでカートから商品を除去できる
- [ ] F-02-05: 同一商品を追加した場合は新規行を作らず数量を加算
- [ ] F-02-06: 送料800円（固定）を加算した合計金額を表示
- [ ] F-02-07: カートが空の場合は適切なメッセージを表示
- [ ] F-02-08: カートの内容はlocalStorageで管理（ページリロードで保持）

### 顧客向け：注文処理（SCR-02 → SCR-03）

- [ ] F-03-01: メールアドレス入力フォーム（発送通知の送信先）
- [ ] F-03-02: 配送先入力（氏名・郵便番号・住所・電話番号）
- [ ] F-03-03: 決済情報入力フォーム（**モックのみ。16桁数字バリデーションのみ実装**）
- [ ] F-03-04: 注文確定時に `place_guest_order()` を呼び出し（注文・明細作成・在庫減算をトランザクション内で実行）
- [ ] F-03-05: 在庫不足時はエラーメッセージを日本語で表示し注文を中止
- [ ] F-03-06: 注文番号は `YYYYMMDD-連番` 形式（DBトリガーが自動採番するため、フロントは生成しない）
- [ ] F-03-07: 注文完了画面で注文番号とステータス（「注文受付済み」）を表示
- [ ] F-03-08: 注文確定後にlocalStorageのカートを空にする

### 管理者向け：認証（SCR-04）

- [ ] F-04-01: 管理者専用のログイン画面（メール+パスワード）
- [ ] F-04-02: `profiles.role = 'admin'` のユーザーのみ管理画面にアクセス許可
- [ ] F-04-03: 一般ユーザーが `/admin/*` にアクセスした場合は `/` にリダイレクト

### 管理者向け：注文管理（SCR-05）

- [ ] F-05-01: 全注文をカード形式で一覧表示（注文番号・日付・ステータス・合計・注文者情報・配送先・注文商品・金額明細）
- [ ] F-05-02: `pending` の注文のみ「発送済みにする」ボタンを表示
- [ ] F-05-03: 「発送済みにする」クリックで発送情報入力モーダルを開く
- [ ] F-05-04: モーダルに配送業者（選択式）と追跡番号（テキスト）のフォーム
- [ ] F-05-05: 配送業者・追跡番号は必須。未入力は送信を拒否
- [ ] F-05-06: 発送処理で `orders.status`・`carrier`・`tracking_number` を同時更新
- [ ] F-05-07: 発送済み注文に追跡番号・配送業者を表示
- [ ] F-05-08: `shipped`・`cancelled` の注文にはステータス変更ボタンを一切表示しない
- [ ] F-05-09: 発送情報登録と同時に `guest_email` 宛に発送通知メールを送信（`/api/ship` 経由）
- [ ] F-05-10: `pending` の注文に「キャンセルする」ボタンを表示
- [ ] F-05-11: 「キャンセルする」クリックで確認モーダルを表示し、確定後に `cancelled` へ更新
- [ ] F-05-12: キャンセル確定時に在庫を自動で戻す（`cancel_order()` 関数呼び出し）
- [ ] F-05-13: `cancelled` の注文は「キャンセル済み」として一覧に表示

**配送業者の選択肢（固定）：** ヤマト運輸 / 佐川急便 / ゆうパック / その他

### 管理者向け：商品管理（SCR-06）

- [ ] F-06-01: 全商品を一覧表示（商品名・価格・在庫数・おすすめ有無）
- [ ] F-06-02: 「商品を追加」ボタンから新規商品を登録（モーダル）
- [ ] F-06-03: 既存商品の編集（商品名・価格・在庫数・おすすめ設定）をモーダルで行う
- [ ] F-06-04: 商品削除は**論理削除のみ**（`deleted_at` に現在日時を記録）
- [ ] F-06-05: 登録・編集はモーダルダイアログで行う
- [ ] F-06-06: 価格の入力値は0以上の整数のみ許可
- [ ] F-06-07: 在庫数の入力値は0以上の整数のみ許可

---

## 7. データベース設計

### フェーズ1で使うテーブル

```
auth.users（Supabase管理）
    ↓ 1:1（自動トリガー）
profiles         ← 管理者ログインに使用
products         ← 商品マスタ。CRUD + 論理削除
orders           ← 注文ヘッダー。ゲスト注文・発送情報
    ↓ 1:N
order_items      ← 注文明細。スナップショット保存
```

### 🚫 フェーズ1で触らないテーブル

```
cart_items       ← フェーズ2（会員DBカート）用。フェーズ1はlocalStorage管理のため操作禁止
```

---

### テーブル定義

#### profiles

```sql
id         UUID  PK, FK → auth.users（ON DELETE CASCADE）
name       TEXT  NOT NULL
role       TEXT  NOT NULL, DEFAULT 'customer', CHECK IN ('customer', 'admin')
created_at TIMESTAMPTZ NOT NULL, DEFAULT now()
```

**重要：**
- Supabase Authにユーザーが登録されると `handle_new_user()` トリガーが自動でレコードを作成
- デフォルトroleは `'customer'`。管理者にするには Supabase Dashboard で手動で `'admin'` に変更する
- フェーズ1では管理者（role='admin'）のみが実際に使用する

---

#### products

```sql
id          UUID     PK, DEFAULT gen_random_uuid()
name        TEXT     NOT NULL
price       INTEGER  NOT NULL, CHECK >= 0       ← 税抜価格（円）。表示時は×1.1で税込換算
stock       INTEGER  NOT NULL, DEFAULT 0, CHECK >= 0
is_featured BOOLEAN  NOT NULL, DEFAULT false
image_url   TEXT     NULL許容                   ← 🚫 フェーズ1では読み書きしない
created_at  TIMESTAMPTZ NOT NULL, DEFAULT now()
deleted_at  TIMESTAMPTZ NULL許容                ← 論理削除用。NULL=有効、値あり=削除済み
```

**⚠️ 価格ルール：**
- DBには**税抜価格**で保存
- フロント表示時は必ず `Math.floor(price * 1.1)` で税込換算
- 管理者フォームの価格入力も**税抜価格**で行う

**⚠️ image_url について：**
- カラムはDBに存在するが、フェーズ1では一切使用しない
- 商品カードには「商品画像」のプレースホルダーを表示する
- image_url の読み書きコードは一切書かない

---

#### orders

```sql
id                   UUID  PK, DEFAULT gen_random_uuid()
user_id              UUID  FK → profiles, NULL許容    ← 🚫 フェーズ1では常にNULL（触らない）
guest_email          TEXT  NULL許容                    ← 発送通知メールの送信先
order_number         TEXT  NOT NULL, UNIQUE            ← YYYYMMDD-連番（トリガー自動採番）
status               TEXT  NOT NULL, DEFAULT 'pending'
                           CHECK IN ('pending', 'shipped', 'cancelled')
shipping_name        TEXT  NOT NULL
shipping_postal_code TEXT  NOT NULL
shipping_address     TEXT  NOT NULL
shipping_phone       TEXT  NOT NULL
subtotal             INTEGER NOT NULL, CHECK >= 0
shipping_fee         INTEGER NOT NULL, DEFAULT 800     ← 送料固定800円
total                INTEGER NOT NULL, CHECK >= 0
carrier              TEXT  NULL許容                    ← 発送前はNULL。発送モーダルで入力
tracking_number      TEXT  NULL許容                    ← 発送前はNULL。発送モーダルで入力
created_at           TIMESTAMPTZ NOT NULL, DEFAULT now()

-- テーブル制約
CONSTRAINT orders_user_or_guest CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
```

> ⚠️ `orders_user_or_guest` 制約により、`user_id` と `guest_email` のいずれか一方が必ず NOT NULL でなければならない。フェーズ1はゲスト注文専用のため、`place_guest_order()` を呼び出す際は **`p_guest_email` を必ず渡すこと**。渡し忘れると DB レベルでエラーになる。

**ステータス遷移（これ以外の遷移はシステム上不可）：**
```
pending（注文受付済み）→ shipped（発送済み）        ※ /api/ship 経由
pending（注文受付済み）→ cancelled（キャンセル済み） ※ cancel_order()関数経由
shipped → キャンセル不可（cancel_order()関数がエラーを返す）
```

---

#### order_items

```sql
id           UUID    PK, DEFAULT gen_random_uuid()
order_id     UUID    NOT NULL, FK → orders（ON DELETE CASCADE）
product_id   UUID    NOT NULL, FK → products
product_name TEXT    NOT NULL    ← 注文時の商品名スナップショット（後から変わっても不変）
unit_price   INTEGER NOT NULL, CHECK >= 0  ← 注文時の単価スナップショット
quantity     INTEGER NOT NULL, CHECK >= 1
```

---

### DBの関数・トリガー一覧

| 名前 | 種別 | フェーズ1での用途 |
|---|---|---|
| `handle_new_user()` | トリガー関数 | auth.usersへのINSERT時にprofilesを自動作成 |
| `on_auth_user_created` | トリガー | `handle_new_user()` を発火 |
| `generate_order_number()` | トリガー関数 | orders INSERT時に注文番号を自動採番 |
| `set_order_number` | トリガー | `generate_order_number()` を発火 |
| **`place_guest_order(...)`** | DB関数 | **ゲスト注文の作成（注文・明細作成・在庫減算をトランザクションで実行）** |
| **`cancel_order(p_order_id)`** | DB関数 | **キャンセル処理（status更新・在庫戻しをトランザクションで実行）** |
| `is_admin()` | ヘルパー関数 | RLSポリシーの中で使用（現在のユーザーがadminかチェック） |

### `place_guest_order()` の呼び出し方

```typescript
const { data: orderId, error } = await supabase.rpc('place_guest_order', {
  p_guest_email:          'example@email.com',
  p_shipping_name:        '山田 太郎',
  p_shipping_postal_code: '530-0001',
  p_shipping_address:     '大阪府大阪市北区梅田1-1-1',
  p_shipping_phone:       '090-0000-0000',
  p_cart_items: JSON.stringify([
    { product_id: 'uuid-here', quantity: 2 }
  ])
})
// 戻り値: orders.id（UUID）
// 在庫不足時: error.message に日本語エラー文が入る
```

### `cancel_order()` の呼び出し方

```typescript
const { error } = await supabase.rpc('cancel_order', {
  p_order_id: 'uuid-here'
})
// pending以外の注文: error.message にエラー文が入る
```

---

## 8. RLS・セキュリティ設計

### ポリシー一覧

| テーブル | 操作 | 許可する条件 |
|---|---|---|
| `profiles` | SELECT | `id = auth.uid()` OR `is_admin()` |
| `profiles` | UPDATE | `id = auth.uid()` |
| `products` | SELECT | `deleted_at IS NULL`（誰でも閲覧可。論理削除済みは除外） |
| `products` | INSERT | `is_admin()` |
| `products` | UPDATE | `is_admin()` |
| `products` | DELETE | **ポリシーなし**（物理削除は禁止。論理削除のみ） |
| `cart_items` | 全操作 | `user_id = auth.uid()`（フェーズ2用。フェーズ1は未使用） |
| `orders` | INSERT | `auth.role() = 'anon'` AND `auth.uid() IS NULL` AND `guest_email IS NOT NULL` |
| `orders` | SELECT | `is_admin()` |
| `orders` | UPDATE | `is_admin()` |
| `order_items` | INSERT | `auth.role() = 'anon'` AND 対応するordersがゲスト注文であること |
| `order_items` | SELECT | `is_admin()` |

### セキュリティの三重防御

```
1層目（proxy.ts）    : 未ログインユーザーを /admin/login にリダイレクト
2層目（Server Comp） : profiles.role が 'admin' か確認。違えば / にリダイレクト
3層目（RLS）         : DBレベルで操作を制御。コード漏れがあってもDBで守る
```

---

## 9. UIデザインシステム

### カラーパレット（CSS変数）

```css
:root {
  --ink:        #1A1A1A;  /* メインテキスト、プライマリボタン背景 */
  --bg:         #F4F4F4;  /* ページ背景 */
  --surface:    #FFFFFF;  /* カード・モーダル背景 */
  --muted:      #666666;  /* サブテキスト、フォームラベル */
  --border:     #DDDDDD;  /* 標準ボーダー */
  --border-mid: #BBBBBB;  /* 中間ボーダー */
  --sold-out:   #AAAAAA;  /* 売り切れ・無効要素 */
}
```

### フォント

```
見出し（h1, h2, h3） : 'Noto Serif JP', serif
本文・UI要素         : 'Noto Sans JP', sans-serif
Google Fonts から読み込み
```

### ボタンクラス

| クラス | 用途 | スタイル |
|---|---|---|
| `.btn-primary` | カートに入れる・注文確定等 | 黒背景・白文字・幅100% |
| `.btn-secondary` | 発送ボタン等 | #444背景・白文字 |
| `.btn-outline` | キャンセル・戻る等 | 透明背景・ボーダー |
| `.btn-disabled` | 売り切れ（disabled状態） | グレー・カーソル不可 |
| `.btn-success` | 完了系アクション | #333背景・白文字 |

### バッジ

| クラス | 表示テキスト例 | 用途 |
|---|---|---|
| `.badge-featured` | おすすめ | `is_featured = true` の商品 |
| `.badge-sold-out` | 売り切れ | `stock = 0` の商品 |

### 注文ステータスの表示

| DBの値 | 表示テキスト | カードの左ボーダー色 |
|---|---|---|
| `pending` | 注文受付済み | #555（中間グレー） |
| `shipped` | 発送済み | #333（濃いグレー） |
| `cancelled` | キャンセル済み | グレー系 |

### レイアウト

```css
/* 共通 */
main { max-width: 960px; margin: 0 auto; padding: 40px 24px; }

/* トップページ商品グリッド */
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

/* カートページ（左:商品リスト+フォーム / 右:合計サマリー） */
.cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; }
```

### ナビゲーション構成

```
【顧客向け】
なにわセレクトショップ（ロゴ）               🛒 カート（N）

【管理者向け】
なにわセレクトショップ 管理          ショップへ戻る | ログアウト
─────────────────────────────────────────────────────
[注文管理] [商品管理]（タブ切り替え）
```

### モーダル仕様

```css
/* オーバーレイ */
position: fixed; inset: 0;
background: rgba(0,0,0,0.5);
z-index: 100;

/* モーダル本体 */
background: var(--surface);
max-width: 460px; padding: 32px; border-radius: 6px;
box-shadow: 0 8px 32px rgba(0,0,0,0.18);
animation: modalIn 0.18s ease;  /* 上からフェードイン */
```

---

## 10. ビジネスロジック仕様

### 価格計算ユーティリティ

```typescript
// lib/utils/price.ts

const TAX_RATE = 1.1  // 消費税10%

/** 税込価格を計算（小数点以下切り捨て） */
export function taxIncluded(taxExcludedPrice: number): number {
  return Math.floor(taxExcludedPrice * TAX_RATE)
}

/** 金額を表示用フォーマット（例: ¥1,080） */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString('ja-JP')}`
}

// 使用例
formatPrice(taxIncluded(product.price))  // → "¥2,750"（税抜2,500円の場合）
```

### カート仕様（localStorage）

```typescript
// lib/utils/cart.ts

const CART_KEY = 'naniwa_cart'
const SHIPPING_FEE = 800  // 送料固定（円）

interface CartItem {
  product_id: string
  name:       string
  price:      number   // 税抜価格（DBから取得した値をそのまま保存）
  quantity:   number
}
```

**カートのルール：**
- 同一商品（`product_id` が同じ）を追加した場合は `quantity` を加算する（行を増やさない）
- `localStorage.getItem('naniwa_cart')` で JSON 配列として読み書きする
- 注文確定後に `localStorage.removeItem('naniwa_cart')` でカートを空にする

### 注文番号の形式

```
形式: YYYYMMDD-NNNN（NNNN は当日の連番、4桁ゼロ埋め）
例:   20260325-0001

※ DBのトリガー（generate_order_number）が自動採番するため、
   フロントエンドは注文番号を一切生成しない
```

### 発送通知メールの仕様

```
送信タイミング : 管理者が /api/ship に POST したとき
送信先         : orders.guest_email
件名           : 【なにわセレクトショップ】ご注文商品を発送しました
本文に含む情報 : 注文番号、配送業者名、追跡番号、各業者の追跡URL

送信失敗時の挙動:
  - エラーメッセージを管理者画面に表示する
  - DBのステータス更新は既に成功済みのため、手動で再送可能
  - ロールバックは行わない
```

**各配送業者の追跡URL：**

| 業者 | 追跡URL |
|---|---|
| ヤマト運輸 | `https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id={tracking_number}` |
| 佐川急便 | `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo={tracking_number}` |
| ゆうパック | `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1={tracking_number}` |
| その他 | 追跡URLなし |

### 発送処理API（`/app/api/ship/route.ts`）

```typescript
// POST リクエストのボディ
interface ShipRequest {
  order_id:        string
  carrier:         string
  tracking_number: string
}

// 処理内容（1リクエストで順に実行）:
// 1. adminチェック（未認証・非adminはエラーを返す）
// 2. Supabase: orders の status・carrier・tracking_number を UPDATE
// 3. Resend: guest_email 宛に発送通知メールを送信
```

---

## 11. 外部サービス連携

### Supabase クライアントの作成

```typescript
// lib/supabase/server.ts（Server Component・Server Action用）
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

```typescript
// lib/supabase/client.ts（Client Component用）
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Resend

```typescript
// lib/resend.ts
import { Resend } from 'resend'
export const resend = new Resend(process.env.RESEND_API_KEY)
// ⚠️ RESEND_API_KEY はサーバーサイドのみで使用（NEXT_PUBLIC_ をつけない）
```

---

## 12. 環境変数定義

```.env.local
# Supabase（ダッシュボードの Project Settings > API から取得）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Resend（Resendダッシュボードから取得）
# ⚠️ NEXT_PUBLIC_ をつけてはいけない（フロントに漏れる）
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## 13. 実装パターン集

### Server Component での商品一覧取得

```typescript
// app/page.tsx
import { createClient } from '@/lib/supabase/server'
import { taxIncluded, formatPrice } from '@/lib/utils/price'

export default async function TopPage() {
  const supabase = createClient()
  // ※ deleted_at IS NULL の絞り込みはRLSが自動でやるため、.filter()は不要
  const { data: featured } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })

  const { data: normal } = await supabase
    .from('products')
    .select('*')
    .eq('is_featured', false)
    .order('created_at', { ascending: false })

  // ...
}
```

### 管理者権限チェック（Server Component 内の必須パターン）

```typescript
// app/admin/orders/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminOrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')          // 未ログイン

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')  // 非admin
  // 以降は管理者確認済みとして処理
}
```

### 注文確定処理（place_guest_order の呼び出し）

```typescript
const cartItems: CartItem[] = JSON.parse(localStorage.getItem('naniwa_cart') || '[]')

const { data: orderId, error } = await supabase.rpc('place_guest_order', {
  p_guest_email:          formData.email,
  p_shipping_name:        formData.name,
  p_shipping_postal_code: formData.postalCode,
  p_shipping_address:     formData.address,
  p_shipping_phone:       formData.phone,
  p_cart_items: JSON.stringify(
    cartItems.map(item => ({ product_id: item.product_id, quantity: item.quantity }))
  ),
})

if (error) {
  setErrorMessage(error.message)  // DBからの日本語エラーをそのまま表示
  return
}

localStorage.removeItem('naniwa_cart')  // カートをクリア
router.push(`/order-complete?order_id=${orderId}`)
```

### 論理削除パターン（商品の削除）

```typescript
// Server Action 内
const { error } = await supabase
  .from('products')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', productId)

// ✅ これが正しい論理削除
// ❌ supabase.from('products').delete() は使わない
```

### 発送処理API への呼び出し

```typescript
// Client Component から /api/ship に POST
const res = await fetch('/api/ship', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ order_id, carrier, tracking_number }),
})
if (!res.ok) {
  const { message } = await res.json()
  setErrorMessage(message)
}
```

---

## 14. NGパターン集（やってはいけないこと）

### 🚫 フェーズ2以降の機能を実装しない

```
❌ 会員登録・ログインページを作らない（/login, /register は存在しない）
❌ マイページ・注文履歴ページを作らない（/mypage は存在しない）
❌ 商品画像のアップロード機能を実装しない（image_url カラムは無視する）
❌ スマホ対応のレスポンシブCSSを書かない（デスクトップのみ）
❌ cart_items テーブルを読み書きしない（カートは localStorage のみ）
❌ 決済APIに繋がない（Stripe等は実装しない。フォームとバリデーションのみ）
❌ orders.user_id を設定・参照するコードを書かない（フェーズ1は常にNULL）
```

### 🚫 middleware.ts を作らない

```typescript
// ❌ このファイルは作成禁止
// middleware.ts

// ✅ 代わりに proxy.ts を使う
// proxy.ts
```

### 🚫 物理削除しない

```typescript
// ❌ これは絶対にやらない
await supabase.from('products').delete().eq('id', id)

// ✅ 必ず論理削除を使う
await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id)
```

### 🚫 価格表示の間違い

```typescript
// ❌ 税抜価格をそのまま表示しない
<p>{product.price}円</p>

// ✅ 必ず税込換算してフォーマットする
<p>{formatPrice(taxIncluded(product.price))}</p>
```

### 🚫 APIキーの漏洩

```typescript
// ❌ ハードコードしない
const resend = new Resend('re_xxxxxxxxxx')

// ❌ RESEND_API_KEY に NEXT_PUBLIC_ をつけない（フロントに露出する）
process.env.NEXT_PUBLIC_RESEND_API_KEY  // ← 絶対ダメ

// ✅ サーバーサイドで環境変数から取得
const resend = new Resend(process.env.RESEND_API_KEY)
```

### 🚫 その他

```typescript
// ❌ TypeScript の any を多用しない（strict: true を活かす）

// ❌ cancel_order() を adminチェックなしで呼ばない
// → Server Action や API Route で必ず adminチェック後に実行する

// ❌ フロントエンドで注文番号を生成しない
// → generate_order_number トリガーが自動採番する

// ❌ 価格フォーマットを手書きしない
`¥${price}`  // ← 使わない
// → formatPrice(price) を使う
```

---

## 付録：初期サンプルデータ（商品一覧）

DBに投入済みのサンプル商品（SQL_3 で投入）。

| 商品名 | 税抜価格 | 在庫 | おすすめ |
|---|---|---|---|
| 大阪名物！551風・豚まん手作りキット | ¥2,500 | 20 | ✅ |
| 道頓堀の誘惑・たこ焼き用大粒タコ（冷凍） | ¥3,200 | 15 | ✅ |
| おうちで二度漬けOK！串カツだるまインスパイアセット | ¥5,500 | 8 | ✅ |
| 河内鴨のロース・スモーク仕立て | ¥4,800 | 10 | ❌ |
| 千日前・老舗喫茶の冷コー（レイコー）ベース | ¥1,500 | 25 | ❌ |
| 新世界名物！どて焼きの素（牛すじ煮込み） | ¥1,800 | 18 | ❌ |
| 堺の包丁職人監修・切れ味抜群！キャベツ千切りスライサー | ¥3,800 | 6 | ❌ |
| どやさ！厚焼きプロ仕様お好み焼きセット（5枚入） | ¥3,500 | 12 | ❌ |
| 浪速の虎炊き・山椒ちりめんじゃこ（100g） | ¥1,200 | 30 | ❌ |
| まいど！ミックスジュース・贅沢ゼリー（6個入） | ¥2,800 | 14 | ❌ |

---

*このドキュメントは REQ-NANIWA-EC-001 v1.2（2026年3月24日確定版）に基づいて作成。*  
*フェーズ1の開発において判断に迷った場合は、「初学者チームが6日間で完成できるシンプルな実装」を優先基準とすること。*
