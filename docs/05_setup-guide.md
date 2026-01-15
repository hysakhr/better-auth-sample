# セットアップガイド

## 1. 前提条件

以下がインストールされていることを確認してください。

- Node.js 20.x 以上
- pnpm（推奨）または npm
- Rust (stable)
- Docker & Docker Compose
- sea-orm-cli

```bash
# sea-orm-cli のインストール
cargo install sea-orm-cli
```

## 2. プロジェクト構成

```
better-auth-sample/
├── frontend/          # Next.js アプリケーション
├── backend/           # Axum アプリケーション
├── docs/              # ドキュメント
└── docker-compose.yml # PostgreSQL
```

## 3. データベースセットアップ

### 3.1 Docker Compose で PostgreSQL を起動

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: better-auth-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: better_auth_sample
    ports:
      - "5555:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# PostgreSQL 起動
docker-compose up -d

# 接続確認
docker exec -it better-auth-db psql -U postgres -d better_auth_sample
```

## 4. バックエンド（Axum）セットアップ

### 4.1 プロジェクト作成

```bash
mkdir -p backend
cd backend

# Cargo.toml 作成
cargo init
```

### 4.2 依存関係（Cargo.toml）

```toml
[package]
name = "better-auth-backend"
version = "0.1.0"
edition = "2021"

[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors"] }
sea-orm = { version = "1.0", features = ["sqlx-postgres", "runtime-tokio-rustls"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = "0.3"
axum-extra = { version = "0.9", features = ["cookie"] }

[dependencies.sea-orm-migration]
version = "1.0"
features = ["sqlx-postgres", "runtime-tokio-rustls"]
```

### 4.3 環境変数（.env）

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
RUST_LOG=debug
SERVER_PORT=3051
FRONTEND_URL=http://localhost:3050
```

### 4.4 マイグレーション作成

```bash
cd backend

# マイグレーションプロジェクト作成
sea-orm-cli migrate init

# マイグレーションファイル作成
sea-orm-cli migrate generate create_users_table
sea-orm-cli migrate generate create_sessions_table
sea-orm-cli migrate generate create_accounts_table
sea-orm-cli migrate generate create_verifications_table
```

### 4.5 マイグレーション実行

```bash
# マイグレーション実行
sea-orm-cli migrate up

# エンティティ生成
sea-orm-cli generate entity -o src/entity
```

### 4.6 バックエンド起動

```bash
cargo run
```

## 5. フロントエンド（Next.js）セットアップ

### 5.1 プロジェクト作成

```bash
# Next.js プロジェクト作成
pnpm create next-app@latest frontend --typescript --tailwind --eslint --app --src-dir

cd frontend
```

### 5.2 依存関係インストール

```bash
# Better Auth と関連パッケージ
pnpm add better-auth

# Drizzle ORM
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg
```

### 5.3 環境変数（.env.local）

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
BETTER_AUTH_URL=http://localhost:3050

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL（クライアントサイドで使用）
NEXT_PUBLIC_APP_URL=http://localhost:3050

# Backend API（Axum）
NEXT_PUBLIC_BACKEND_URL=http://localhost:3051

# Resend（メール送信）
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### 5.4 ディレクトリ構成作成

```bash
mkdir -p src/lib
mkdir -p src/db
mkdir -p src/components/auth
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/register
mkdir -p src/app/\(protected\)/dashboard
mkdir -p src/app/api/auth/\[...all\]
mkdir -p src/app/api/user/withdraw
```

### 5.5 設定ファイル作成

#### src/lib/db.ts
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

#### src/lib/auth.ts
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3050",
    "http://localhost:3051",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

#### src/lib/auth-client.ts
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3050",
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

#### src/app/api/auth/[...all]/route.ts

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// 認証 API はキャッシュしない
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
```

### 5.6 フロントエンド起動

```bash
# ポート 3050 で起動
pnpm dev --port 3050
```

**ヒント**: `package.json` の scripts を変更しておくと便利です:

```json
"scripts": {
  "dev": "next dev --port 3050"
}
```

## 6. Google OAuth 設定

### 6.1 Google Cloud Console 設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存を選択）
3. 「APIとサービス」→「認証情報」へ移動
4. 「認証情報を作成」→「OAuth クライアント ID」を選択
5. アプリケーションの種類: 「ウェブ アプリケーション」
6. 承認済みの JavaScript 生成元:
   - `http://localhost:3050`
7. 承認済みのリダイレクト URI:
   - `http://localhost:3050/api/auth/callback/google`
8. 作成後、クライアント ID とクライアント シークレットを `.env.local` に設定

### 6.2 OAuth 同意画面の設定

1. 「APIとサービス」→「OAuth 同意画面」へ移動
2. User Type: 「外部」を選択
3. アプリ情報を入力
4. スコープを追加:
   - `openid`
   - `email`
   - `profile`
5. テストユーザーを追加（開発中の場合）

## 7. 動作確認

### 7.1 サービス起動順序

```bash
# 1. PostgreSQL
docker-compose up -d

# 2. マイグレーション実行
cd backend && sea-orm-cli migrate up

# 3. バックエンド起動（別ターミナル）
cd backend && cargo run

# 4. フロントエンド起動（別ターミナル）
cd frontend && pnpm dev
```

### 7.2 動作確認チェックリスト

- [ ] http://localhost:3050 にアクセスできる
- [ ] http://localhost:3051/api/health が応答する
- [ ] 会員登録ができる
- [ ] ログインができる
- [ ] Google 認証ができる
- [ ] ダッシュボードにアクセスできる
- [ ] ログアウトができる
- [ ] バックエンド API（認証必須）にアクセスできる
- [ ] 退会処理ができる

## 8. トラブルシューティング

### PostgreSQL 接続エラー

```bash
# コンテナの状態確認
docker ps
docker logs better-auth-db

# 接続テスト
psql -h localhost -U postgres -d better_auth_sample
```

### Better Auth エラー

```bash
# 環境変数確認
echo $BETTER_AUTH_SECRET
echo $BETTER_AUTH_URL

# Cookie の確認（ブラウザ開発者ツール）
# Application → Cookies → localhost:3050
```

### CORS エラー

Axum の CORS 設定と Next.js の URL が一致しているか確認。
```rust
.allow_origin("http://localhost:3050".parse::<HeaderValue>().unwrap())
.allow_credentials(true)
```

### セッションが維持されない

1. Cookie が設定されているか確認
2. `SameSite` 属性が適切か確認
3. HTTPS 環境では `Secure` 属性が必要
