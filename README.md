# Better Auth サンプルアプリケーション

Better Auth 利用に向けた学習用サンプルアプリケーションです。

## 構成

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Next.js 16 (App Router) |
| 認証 | Better Auth + Drizzle Adapter |
| バックエンド | Axum + SeaORM |
| データベース | PostgreSQL 16 |

## 機能一覧

- [x] メールアドレス/パスワードによる会員登録・ログイン
- [x] メール認証（メールアドレスの存在確認）
- [x] Google OAuth による会員登録・ログイン
- [x] Cookie ベースのセッション管理
- [x] バックエンド側での Cookie 認証検証
- [x] ユーザー退会（ソフトデリート + 再入会可能）
- [x] 認証・非認証 API の実装
- [x] API 動作確認ページ

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [01_architecture.md](docs/01_architecture.md) | システムアーキテクチャ設計 |
| [02_better-auth-guide.md](docs/02_better-auth-guide.md) | Better Auth 設定・実装ガイド |
| [03_database-schema.md](docs/03_database-schema.md) | データベーススキーマ設計 |
| [04_api-specification.md](docs/04_api-specification.md) | API 仕様書 |
| [05_setup-guide.md](docs/05_setup-guide.md) | 環境構築手順 |
| [06_withdraw-implementation.md](docs/06_withdraw-implementation.md) | 退会機能実装ガイド |

## クイックスタート

```bash
# 1. PostgreSQL 起動
docker-compose up -d

# 2. バックエンドセットアップ
cd backend
sea-orm-cli migrate up
cargo run

# 3. フロントエンドセットアップ（別ターミナル）
cd frontend
pnpm install
pnpm dev
```

## ディレクトリ構成

```
better-auth-sample/
├── frontend/          # Next.js アプリケーション
│   ├── src/
│   │   ├── app/       # App Router ページ
│   │   ├── lib/       # 設定ファイル（auth, db）
│   │   ├── db/        # Drizzle スキーマ
│   │   └── components/
│   └── ...
├── backend/           # Axum アプリケーション
│   ├── src/
│   │   ├── routes/    # API ルート
│   │   ├── middleware/# 認証ミドルウェア
│   │   └── entity/    # SeaORM エンティティ
│   └── migration/     # SeaORM マイグレーション
├── docs/              # ドキュメント
└── docker-compose.yml
```

## 認証フロー概要

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant NextJS as Next.js
    participant Axum as Axum Backend
    participant DB as PostgreSQL

    Browser->>NextJS: 1. ログイン
    NextJS->>DB: ユーザー認証・セッション作成
    NextJS-->>Browser: 2. Cookie設定 (better-auth.session_token)
    Browser->>Axum: 3. API リクエスト (Cookie 自動送信)
    Axum->>DB: 4. sessions テーブルで検証
    DB-->>Axum: セッション情報
    Axum-->>Browser: 5. レスポンス
```

## 環境変数

### フロントエンド (.env.local)

```env
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3050
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### バックエンド (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
SERVER_PORT=3051
FRONTEND_URL=http://localhost:3050
```

## ライセンス

MIT
