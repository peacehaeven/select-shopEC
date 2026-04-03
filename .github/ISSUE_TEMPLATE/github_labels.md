# GitHub ラベル定義

このプロジェクトで使用するラベルの一覧です。
GitHubへの登録は `gh label create` コマンドで行います（登録手順は末尾を参照）。

---

## 種別 (type)

| ラベル名 | 色 | 説明 |
|---|---|---|
| `bug` | `#d73a4a` | 予期しない動作・エラー |
| `enhancement` | `#a2eeef` | 新機能の追加 |
| `refactoring` | `#e4e669` | 機能変更を伴わないコード改善 |
| `documentation` | `#0075ca` | ドキュメントの追加・修正 |
| `chore` | `#fef2c0` | パッケージ更新・設定変更・環境整備 |
| `question` | `#d876e3` | 調査・確認が必要な事項 |

## 優先度 (priority)

| ラベル名 | 色 | 説明 |
|---|---|---|
| `priority: high` | `#b60205` | 早急に対応が必要 |
| `priority: medium` | `#fbca04` | 通常の優先度 |
| `priority: low` | `#0e8a16` | 余裕があるときに対応 |

## サイズ (size)

| ラベル名 | 色 | 説明 |
|---|---|---|
| `size: S` | `#c5def5` | 〜2時間程度 |
| `size: M` | `#5319e7` | 半日〜1日程度 |
| `size: L` | `#1d76db` | 複数日にまたがる作業 |

## ステータス (status)

| ラベル名 | 色 | 説明 |
|---|---|---|
| `blocked` | `#e11d48` | 他のIssue・作業待ちで止まっている |
| `wontfix` | `#ffffff` | 対応しないと判断 |
| `duplicate` | `#cfd3d7` | 重複Issue |

## 対象領域 (area)

| ラベル名 | 色 | 説明 |
|---|---|---|
| `frontend` | `#bfd4f2` | UI・コンポーネント・スタイル |
| `backend` | `#d4c5f9` | API Route・Server Actions |
| `db` | `#f9d0c4` | Supabase・スキーマ・RLS |
| `auth` | `#c2e0c6` | 認証・認可 |

---

## 登録コマンド

`OWNER/REPO` は実際のリポジトリ名に置き換えてください。

### Step 1: 不要なデフォルトラベルを削除

```bash
gh label delete "good first issue" --repo OWNER/REPO --yes
gh label delete "help wanted"      --repo OWNER/REPO --yes
gh label delete "invalid"          --repo OWNER/REPO --yes
```

### Step 2: 新規ラベルを作成

既存のデフォルトラベル（`bug` `enhancement` `documentation` `question` `wontfix` `duplicate`）はそのまま使用するため、作成不要です。

```bash
# 種別（新規）
gh label create "refactoring" --color "e4e669" --description "機能変更を伴わないコード改善" --repo OWNER/REPO
gh label create "chore"       --color "fef2c0" --description "パッケージ更新・設定変更・環境整備" --repo OWNER/REPO

# 優先度
gh label create "priority: high"   --color "b60205" --description "早急に対応が必要" --repo OWNER/REPO
gh label create "priority: medium" --color "fbca04" --description "通常の優先度" --repo OWNER/REPO
gh label create "priority: low"    --color "0e8a16" --description "余裕があるときに対応" --repo OWNER/REPO

# サイズ
gh label create "size: S" --color "c5def5" --description "〜2時間程度" --repo OWNER/REPO
gh label create "size: M" --color "5319e7" --description "半日〜1日程度" --repo OWNER/REPO
gh label create "size: L" --color "1d76db" --description "複数日にまたがる作業" --repo OWNER/REPO

# ステータス
gh label create "blocked" --color "e11d48" --description "他のIssue・作業待ちで止まっている" --repo OWNER/REPO

# 対象領域
gh label create "frontend" --color "bfd4f2" --description "UI・コンポーネント・スタイル" --repo OWNER/REPO
gh label create "backend"  --color "d4c5f9" --description "API Route・Server Actions" --repo OWNER/REPO
gh label create "db"       --color "f9d0c4" --description "Supabase・スキーマ・RLS" --repo OWNER/REPO
gh label create "auth"     --color "c2e0c6" --description "認証・認可" --repo OWNER/REPO
```
