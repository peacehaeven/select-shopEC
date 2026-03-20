# なにわセレクトショップ DB 設計解説

> 対象: チームメンバー向け（プログラミング初学者）  
> バージョン: v2.0  
> 前バージョン v1.x からの主な変更点: ゲスト購入専用構成に変更。`orders` テーブルに `carrier`・`tracking_number` を追加。発送通知メール（Resend連携）をフェーズ1必須として追加。

---

## 目次

1. [使用技術とバージョン](#1-使用技術とバージョン)
2. [SQLファイルの実行順序](#2-sqlファイルの実行順序)
3. [テーブル全体像（ER図）](#3-テーブル全体像er図)
4. [各テーブルの詳細](#4-各テーブルの詳細)
5. [自動化の仕組み（トリガー）](#5-自動化の仕組みトリガー)
6. [アクセス制御の仕組み（RLS）](#6-アクセス制御の仕組みrls)
7. [注文処理の流れ（place_guest_order関数）](#7-注文処理の流れplace_guest_order関数)
8. [発送処理の流れ（管理者モーダル）](#8-発送処理の流れ管理者モーダル)
9. [将来の機能拡張について](#9-将来の機能拡張について)
10. [よくあるエラーと対処法](#10-よくあるエラーと対処法)

---

## 1. 使用技術とバージョン

2026年3月20日時点の最新安定版を採用しています。

| 技術 | バージョン | 用途 |
|---|---|---|
| Next.js (App Router) | **16.2** | フロントエンド・APIフレームワーク |
| React | **19.2** | UIライブラリ（Next.js 16.2 に同梱） |
| TypeScript | **5.9** | 型安全な開発（6.0はRC段階のため安定版を採用） |
| Node.js | **24.14.0 LTS** | 実行環境（Active LTS "Krypton"） |
| @supabase/supabase-js | **2.99.3** | DB操作・認証クライアント |
| @supabase/ssr | **0.9.0** | Next.js App RouterでのSupabase Auth連携 |
| Supabase Auth | マネージド | 管理者ログイン |
| Supabase (PostgreSQL) | マネージド | データベース |
| resend | **6.9.4** | 発送通知メール送信 |
| Vercel | マネージド | ホスティング・デプロイ |

---

## 2. SQLファイルの実行順序

> ⚠️ **必ずこの順番で実行してください。** 各ファイルは「前のファイルで作ったテーブル」を前提に書かれています。逆順で実行するとエラーになります。

| 実行順 | ファイル名 | 内容 | 前のファイルが必要な理由 |
|---|---|---|---|
| 1回目 | `SQL_1_テーブル作成.sql` | テーブルとトリガーを作る（土台） | — |
| 2回目 | `SQL_2_RLSポリシー.sql` | 誰が何を見られるかルールを設定する | テーブルがないとRLSを設定できない |
| 3回目 | `SQL_3_初期データと注文関数.sql` | テスト用商品データを投入し、注文処理関数を作る | テーブルがないとデータを入れられない |

**各ファイルで作られるもの**

```
SQL_1_テーブル作成.sql
  ├── profiles        （ユーザー情報テーブル）
  ├── products        （商品マスタテーブル）
  ├── cart_items      （カート明細テーブル ※将来の会員機能用）
  ├── orders          （注文ヘッダーテーブル）
  ├── order_items     （注文明細テーブル）
  ├── handle_new_user()      （トリガー関数①）
  └── generate_order_number()（トリガー関数②）

SQL_2_RLSポリシー.sql
  ├── is_admin()      （ヘルパー関数）
  └── 各テーブルのアクセス制御ポリシー（全14本）

SQL_3_初期データと注文関数.sql
  ├── テスト商品データ（おすすめ3件 + 通常7件）
  └── place_guest_order()（ゲスト注文処理関数）
```

---

## 3. テーブル全体像（ER図）

矢印は「参照（外部キー）」の関係を表しています。例えば `orders → profiles` は「注文はユーザーを参照している」という意味です。

```
auth.users（Supabase が自動管理）
    │
    │ 🔄 トリガー自動作成
    ▼
┌──────────────────┐        ┌──────────────────────┐
│    profiles      │        │       products       │
│（ユーザー情報）    │        │（商品マスタ）          │
│                  │        │                      │
│ id          PK   │        │ id            PK     │
│ name             │        │ name                 │
│ role             │        │ price                │
│ created_at       │        │ stock                │
└──────────────────┘        │ is_featured          │
         │                  │ image_url  ※将来用    │
         │ ※将来の           │ created_at           │
         │   会員機能用      └──────────┬───────────┘
         ▼ （現在未使用）               │         │
┌──────────────────┐                   │         │
│    cart_items    │◀──────────────────┘         │
│（カート明細）      │                              │
│ user_id     FK   │                              │
│ product_id  FK   │                              │
│ quantity         │                              │
└──────────────────┘                              │
                                                  │
┌─────────────────────────────────────┐           │
│                orders               │           │
│（注文ヘッダー）                       │           │
│                                     │           │
│ id                     PK           │           │
│ user_id                FK, NULL許容  │           │
│ guest_email            ゲスト注文用  │           │
│ order_number           自動採番      │           │
│ status                 pending/shipped│          │
│ shipping_name/address/...           │           │
│ subtotal / shipping_fee / total     │           │
│ carrier        発送通知メール用       │           │
│ tracking_number発送通知メール用       │           │
│ created_at                          │           │
└───────────────┬─────────────────────┘           │
                │                                 │
                ▼                                 │
┌──────────────────────────────────────────────── ┘
│                  order_items                     │
│（注文明細）                                       │
│                                                  │
│ id            PK                                 │
│ order_id      FK → orders                        │
│ product_id    FK → products                      │
│ product_name  📸スナップショット                  │
│ unit_price    📸スナップショット                  │
│ quantity                                         │
└──────────────────────────────────────────────────┘
```

**テーブル一覧**

| テーブル名 | 今回使う？ | 役割 |
|---|---|---|
| profiles | ✅ 使用中 | 管理者アカウントの情報を管理 |
| products | ✅ 使用中 | 販売商品のマスタデータ |
| cart_items | 🔜 将来用 | 会員のカート（現在はlocalStorageで代用） |
| orders | ✅ 使用中 | 注文のヘッダー情報（配送先・金額・発送情報など） |
| order_items | ✅ 使用中 | 注文に含まれる商品の明細 |

---

## 4. 各テーブルの詳細

### 4-1. profiles（ユーザー情報）

管理者のログイン情報を管理するテーブルです。Supabase の認証機能（auth.users）と1対1で紐づいています。

| カラム名 | 型 | 説明 |
|---|---|---|
| id | UUID | Supabase Auth のユーザーID（auth.users と同じID）|
| name | TEXT | 名前 |
| role | TEXT | 権限。`'admin'` か `'customer'` のどちらか |
| created_at | TIMESTAMPTZ | 登録日時 |

**管理者アカウントの作成手順**

```
1. Supabase Dashboard → Authentication → Users → 「Add user」でメール＋パスワードを登録
2. 自動で profiles にレコードが作られる（role は 'customer' がデフォルト）
3. Dashboard → Table Editor → profiles → 該当レコードの role を 'admin' に変更
```

---

### 4-2. products（商品マスタ）

| カラム名 | 型 | 説明 |
|---|---|---|
| id | UUID | 商品ID（自動生成） |
| name | TEXT | 商品名 |
| price | INTEGER | 価格（円）。0以上の整数のみ |
| stock | INTEGER | 在庫数。注文が確定すると自動で減算される |
| is_featured | BOOLEAN | `true` でトップページ上段に表示されるおすすめ商品 |
| image_url | TEXT | 商品画像のURL（**現在は未使用**。将来の画像登録機能で使う） |
| created_at | TIMESTAMPTZ | 登録日時 |

---

### 4-3. cart_items（カート明細）

**現在このテーブルは使っていません。** カートはブラウザの localStorage で管理しています。将来の会員機能で「カートをDBに保存する」ときに使います。

---

### 4-4. orders（注文ヘッダー）

1件の注文全体の情報を管理するテーブルです。

| カラム名 | 型 | 説明 |
|---|---|---|
| id | UUID | 注文ID（自動生成） |
| user_id | UUID | 会員のID（現在は常に NULL） |
| guest_email | TEXT | ゲストのメールアドレス（必須）。**発送通知メールの送信先** |
| order_number | TEXT | 注文番号（例: `20260320-0001`）。**トリガーが自動採番** |
| status | TEXT | 注文状態。`'pending'`（注文受付済み）か `'shipped'`（発送済み） |
| shipping_name | TEXT | 配送先の氏名 |
| shipping_postal_code | TEXT | 郵便番号 |
| shipping_address | TEXT | 住所 |
| shipping_phone | TEXT | 電話番号 |
| subtotal | INTEGER | 小計（送料を除いた商品合計） |
| shipping_fee | INTEGER | 送料（固定 800円） |
| total | INTEGER | 合計金額（subtotal + shipping_fee） |
| **carrier** | **TEXT** | **配送業者名（例: 'ヤマト運輸'）。発送前は NULL。** |
| **tracking_number** | **TEXT** | **追跡番号。発送前は NULL。発送通知メールに記載される。** |
| created_at | TIMESTAMPTZ | 注文日時 |

**carrier / tracking_number のライフサイクル**

```
注文確定時
  → carrier          = NULL
  → tracking_number  = NULL

管理者が発送モーダルで「発送済みにする」を実行（フェーズ1）
  → status           = 'shipped'
  → carrier          = 'ヤマト運輸'（管理者が入力した値）
  → tracking_number  = '1234-5678-9012'（管理者が入力した値）
  → guest_email 宛に発送通知メールが自動送信される（Resend）
```

**ゲスト注文の設計**

`user_id` は NULL でも許容されますが、その代わり `guest_email` が必須です。どちらか一方は必ず入っていることを DB 側の制約で保証しています。

```sql
-- user_id か guest_email のどちらかが必ずある
CONSTRAINT orders_user_or_guest
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL)
```

**ステータス管理**

```
pending  → 「注文受付済み」（注文確定直後の初期状態）
shipped  → 「発送済み」（管理者が発送モーダルで登録したとき）
```

---

### 4-5. order_items（注文明細）

1件の注文に含まれる商品の明細を管理するテーブルです。

| カラム名 | 型 | 説明 |
|---|---|---|
| id | UUID | 明細ID（自動生成） |
| order_id | UUID | どの注文か（orders.id への参照） |
| product_id | UUID | どの商品か（products.id への参照） |
| product_name | TEXT | **注文時の商品名（スナップショット）** |
| unit_price | INTEGER | **注文時の単価（スナップショット）** |
| quantity | INTEGER | 数量 |

**📸 スナップショットとは？**

`product_name` と `unit_price` は、注文確定時点の値をそのままコピーして保存します。後から管理者が商品名や価格を変更しても、過去の注文履歴には影響しません。

```
【例】
注文時:   豚まんキット 2,500円 → order_items に 2,500 で保存
後日変更: 管理者が価格を 2,800円 に変更
注文履歴: 変わらず 2,500円 のまま ✅
```

---

## 5. 自動化の仕組み（トリガー）

トリガーとは、**特定の操作が起きたとき自動で実行される処理**のことです。今回は2つ設定しています。

### トリガー① handle_new_user（ユーザー登録時）

```
Supabase Auth にユーザーを登録する
    ↓（自動）
profiles テーブルにレコードが自動作成される
```

管理者アカウントを作ったとき、手動で profiles にレコードを作る必要はありません。

### トリガー② generate_order_number（注文作成時）

```
orders テーブルに INSERT される
    ↓（自動）
order_number に「YYYYMMDD-連番」形式の番号が設定される

例: 2026年3月20日の1件目 → "20260320-0001"
    2026年3月20日の2件目 → "20260320-0002"
```

フロント側で注文番号を生成する必要はありません。DB が自動でつけます。

> ⚠️ 同時に複数の注文が来ると同じ番号が生成されることがありますが、UNIQUE 制約によりエラーになります。授業規模では実害なしですが、本番運用では排他制御の追加を検討してください。

---

## 6. アクセス制御の仕組み（RLS）

### RLS（Row Level Security）とは？

「**誰がどの行にアクセスできるか**」をデータベース側で制御する仕組みです。アプリ（Next.js）側での実装に漏れがあっても、DB レベルで守ることができます。

### Supabase の「ロール」とは？

| ロール | 意味 | auth.uid() | auth.role() |
|---|---|---|---|
| anon | 未ログイン（ゲスト） | NULL | `'anon'` |
| authenticated | ログイン済み | ユーザーID | `'authenticated'` |

### ポリシー一覧

| テーブル | 操作 | 誰が | 条件 |
|---|---|---|---|
| products | SELECT | 🌐 全員（ゲスト含む） | 無条件 |
| products | INSERT / UPDATE / DELETE | 🔑 管理者のみ | role = 'admin' |
| orders | INSERT | 👤 ゲストのみ | 未ログイン ＋ guest_email あり |
| orders | SELECT / UPDATE | 🔑 管理者のみ | role = 'admin' |
| order_items | INSERT | 👤 ゲストのみ | 対応する orders がゲスト注文 |
| order_items | SELECT | 🔑 管理者のみ | role = 'admin' |
| profiles | SELECT | 🙋 本人 or 管理者 | id 一致、または admin |
| profiles | UPDATE | 🙋 本人のみ | id 一致 |
| cart_items | 全操作 | 🙋 本人のみ | user_id 一致（将来の会員用） |

> **orders の UPDATE ポリシーについて**  
> `orders_update_admin` ポリシーが管理者によるすべての UPDATE を許可しています。発送モーダルで `status`・`carrier`・`tracking_number` を同時に更新する処理も、このポリシー1本でカバーされています。追加のポリシー設定は不要です。

### 🚨 RLS デバッグ TIPS

`permission denied` エラーが出たら RLS ポリシーが原因の可能性があります。

**確認場所:** Supabase Dashboard → Table Editor → 該当テーブル → 「RLS policies」タブ

**一時的に RLS を回避して確認する方法（SQL Editor で実行）**

```sql
SET ROLE postgres;   -- RLS を回避

-- 確認したいクエリを実行
SELECT * FROM orders;

RESET ROLE;          -- ← 確認後は必ず元に戻すこと！
```

---

## 7. 注文処理の流れ（place_guest_order関数）

注文確定ボタンが押されたとき、フロントから `place_guest_order()` を1回呼び出すだけで、在庫チェック・注文作成・在庫減算まですべて自動で行われます。

### 処理のステップ

```
フロント（Next.js）
  │
  │ place_guest_order(メール, 氏名, 郵便番号, 住所, 電話番号, カート内容) を呼び出す
  │
  ▼
【DB 内で自動実行】
  0. ゲスト専用チェック（ログイン済みなら即エラー）
  1. カートが空でないか確認
  2. 全商品の在庫をチェック（1個でも不足したらエラーで全処理中止）
  3. 小計を計算
  4. orders に INSERT（→ トリガーが注文番号を自動採番）
     ※ carrier / tracking_number は NULL のまま作成
  5. order_items に明細を INSERT
  6. products の stock を減算
  │
  ▼
注文ID（UUID）を返す
  │
  ▼
フロント
  └─ 返ってきた注文IDで注文番号を取得 → 完了画面に表示
```

### トランザクションについて

ステップ4〜6の処理は **1つのトランザクション（一体不可分の処理まとまり）** として実行されます。途中でエラーが起きた場合は、全処理が自動でロールバック（なかったことに）されます。

```
【もしトランザクションがなかったら…】
  ステップ4: 注文作成 ✅
  ステップ5: 明細作成 ← ここでエラー！
  ステップ6: 在庫減算 → 実行されない
  → 「注文はできたけど在庫が減らなかった」状態になる 😱

【トランザクションがあると…】
  ステップ5でエラー → ステップ4の INSERT も自動取り消し
  → データは常に正しい状態が保たれる ✅
```

### フロントからの呼び出し方

```typescript
const { data } = await supabase.rpc('place_guest_order', {
  p_guest_email:          'user@example.com',
  p_shipping_name:        '山田 太郎',
  p_shipping_postal_code: '530-0001',
  p_shipping_address:     '大阪府大阪市...',
  p_shipping_phone:       '090-0000-0000',
  p_cart_items: [
    { product_id: 'uuid...', quantity: 2 },
    { product_id: 'uuid...', quantity: 1 }
  ]
});

// data には注文ID（UUID）が返ってくる
const orderId = data;
```

---

## 8. 発送処理の流れ（管理者モーダル）

### フロントの操作の流れ

```
管理者が「発送済みにする」ボタンをクリック
  ↓
モーダルが開く
  ┌──────────────────────────────────┐
  │ 発送情報の入力                    │
  │ 注文番号：#20260320-0001          │
  │                                  │
  │ 配送業者: [ヤマト運輸         ▼] │
  │ 追跡番号: [__________________]   │
  │ ※入力後、お客様へ発送通知メールが  │
  │   自動送信されます                │
  │                                  │
  │ [キャンセル]  [発送済みにする]     │
  └──────────────────────────────────┘
  ↓「発送済みにする」を押す
```

### 発送処理の全体像

フロントのモーダルから直接 Supabase を呼ぶのではなく、Next.js の API Route を経由します。これにより、DBの更新とメール送信を1リクエストで安全に処理できます。

```
フロント（モーダル）
  │
  │ POST /api/ship  { orderId, carrier, trackingNumber }
  │
  ▼
Next.js API Route（/app/api/ship/route.ts）
  ├─ ① Supabase: orders を UPDATE
  │     status          = 'shipped'
  │     carrier         = 'ヤマト運輸'
  │     tracking_number = '1234-5678-9012'
  │
  └─ ② Resend: guest_email 宛にメールを送信
        件名: 【なにわセレクトショップ】ご注文商品を発送しました
        本文: 注文番号・配送業者・追跡番号・追跡URLを記載
  │
  ▼
フロント
  └─ 成功 → 画面の一覧を更新（ステータスを「発送済み」に）
     失敗 → エラーメッセージを表示
```

### DB への書き込み内容（Supabase クライアント側）

```typescript
// /app/api/ship/route.ts 内での処理イメージ
const { error } = await supabase
  .from('orders')
  .update({
    status:          'shipped',
    carrier:         carrier,          // モーダルで選択した配送業者
    tracking_number: trackingNumber,   // モーダルで入力した追跡番号
  })
  .eq('id', orderId);
```

### Resend によるメール送信（API Route 内）

```typescript
// /app/api/ship/route.ts 内での処理イメージ
import { Resend } from 'resend'; // resend@6.9.4

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from:    'naniwa-select@yourdomain.com',
  to:      guestEmail,    // orders.guest_email の値
  subject: '【なにわセレクトショップ】ご注文商品を発送しました',
  html: `
    <p>ご注文番号：${orderNumber}</p>
    <p>配送業者：${carrier}</p>
    <p>追跡番号：${trackingNumber}</p>
  `,
});
```

> **環境変数について**  
> Resend の API キーは `.env.local` に `RESEND_API_KEY=re_xxxxx` の形式で保存します。ソースコードに直接書いたり、Git にコミットしたりしないでください。

---

## 9. 将来の機能拡張について

このDB設計は将来の機能追加を見越して作られています。下記の機能を追加するとき、テーブルの作り直しは不要です。

### 会員ログイン機能（フェーズ2）

| 対応箇所 | 状況 |
|---|---|
| profiles テーブル | ✅ 設計済み。role = 'customer' を会員として使う |
| cart_items テーブル | ✅ テーブルと RLS ポリシーが設定済み |
| orders.user_id | ✅ カラム確保済み。ゲスト注文との共存設計 |
| RLS ポリシー | ➕ orders / order_items に会員用ポリシーを追加するだけ |

### 商品画像登録（フェーズ3）

| 対応箇所 | 状況 |
|---|---|
| products.image_url | ✅ カラム確保済み（現在は NULL のまま） |
| Supabase Storage | ➕ フェーズ3で画像アップロード先として使う |

---

## 10. よくあるエラーと対処法

| エラー | 原因 | 対処 |
|---|---|---|
| `permission denied for table xxx` | RLS ポリシーが原因 | Section 6 のデバッグTIPSを参照。ポリシーを確認する |
| `violates check constraint "orders_user_or_guest"` | user_id も guest_email も NULL で INSERT した | guest_email を必ず渡しているか確認する |
| `duplicate key value violates unique constraint "orders_order_number_key"` | 同じ秒に複数の注文が入った（ほぼ起きない） | もう一度注文を試みてください |
| `カートが空です` | place_guest_order() に空の配列を渡した | フロントのカート状態を確認する |
| `XXX の在庫が不足しています` | 在庫数を超える数量で注文した | フロントで在庫チェック UI を見直す |
| `relation "profiles" does not exist` | SQL_1 を先に実行していない | SQL_1 → SQL_2 → SQL_3 の順で実行する |
| 発送モーダルで UPDATE 後に `permission denied` | is_admin() が false を返している | 管理者アカウントの role が 'admin' になっているか確認する |
| `メール送信に失敗しました` | ResendのAPIキーが未設定または誤っている | `.env.local` の `RESEND_API_KEY` を確認する |
| メールが届かない | 送信先アドレスの誤り・迷惑メール判定 | Resend Dashboard の送信ログで配信状況を確認する |

---

*作成: いちごチーム / v2.0（ゲスト購入 + 発送情報入力 + 発送通知メール対応版）*
