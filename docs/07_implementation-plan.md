# 実装作業計画表

## 概要

Better Auth サンプルアプリケーションの実装作業計画です。

## 前提条件

- Node.js 20.x 以上
- pnpm
- Rust (stable)
- Docker & Docker Compose
- sea-orm-cli

## 作業一覧

### Phase 1: 環境構築

- [ ] **1.1** Docker Compose で PostgreSQL 起動 → `docker-compose.yml`
- [ ] **1.2** バックエンドプロジェクト作成 → `backend/Cargo.toml`
- [ ] **1.3** フロントエンドプロジェクト作成 → `frontend/package.json`

### Phase 2: データベース（SeaORM マイグレーション）

- [ ] **2.1** マイグレーションプロジェクト初期化 → `backend/migration/`
- [ ] **2.2** users テーブル作成 → `m20240101_000001_create_users_table.rs`
- [ ] **2.3** sessions テーブル作成 → `m20240101_000002_create_sessions_table.rs`
- [ ] **2.4** accounts テーブル作成 → `m20240101_000003_create_accounts_table.rs`
- [ ] **2.5** verifications テーブル作成 → `m20240101_000004_create_verifications_table.rs`
- [ ] **2.6** posts テーブル作成 → `m20240101_000005_create_posts_table.rs`
- [ ] **2.7** マイグレーション実行 → DB テーブル
- [ ] **2.8** SeaORM エンティティ生成 → `backend/src/entity/`

### Phase 3: フロントエンド認証（Better Auth）

- [ ] **3.1** 依存パッケージインストール → `package.json`
- [ ] **3.2** Drizzle DB 設定 → `src/lib/db.ts`
- [ ] **3.3** Drizzle スキーマ定義 → `src/db/schema.ts`
- [ ] **3.4** Better Auth サーバー設定 → `src/lib/auth.ts`
- [ ] **3.5** Better Auth クライアント設定 → `src/lib/auth-client.ts`
- [ ] **3.6** 認証 API Route → `src/app/api/auth/[...all]/route.ts`

### Phase 4: 認証 UI

- [ ] **4.1** ログインページ → `src/app/(auth)/login/page.tsx`
- [ ] **4.2** 会員登録ページ → `src/app/(auth)/register/page.tsx`
- [ ] **4.3** メール認証完了ページ → `src/app/(auth)/verify-email/page.tsx`
- [ ] **4.4** ログインフォーム → `src/components/auth/LoginForm.tsx`
- [ ] **4.5** 会員登録フォーム → `src/components/auth/RegisterForm.tsx`
- [ ] **4.6** Google ログインボタン → `src/components/auth/SocialButtons.tsx`

### Phase 5: 保護ページ

- [ ] **5.1** ダッシュボードページ → `src/app/(protected)/dashboard/page.tsx`
- [ ] **5.2** プロフィールページ → `src/app/(protected)/profile/page.tsx`
- [ ] **5.3** 認証ガード（レイアウト） → `src/app/(protected)/layout.tsx`

### Phase 6: 退会機能

- [ ] **6.1** 退会 API Route → `src/app/api/user/withdraw/route.ts`
- [ ] **6.2** 退会確認コンポーネント → `src/components/auth/WithdrawButton.tsx`
- [ ] **6.3** 設定ページに退会ボタン追加 → `src/app/(protected)/settings/page.tsx`

### Phase 7: バックエンド（Axum）

- [ ] **7.1** Axum プロジェクト構成 → `src/main.rs`, `src/lib.rs`
- [ ] **7.2** 認証ミドルウェア → `src/middleware/auth.rs`
- [ ] **7.3** 公開 API（ヘルスチェック等） → `src/routes/public.rs`
- [ ] **7.4** 認証必須 API（/api/me 等） → `src/routes/protected.rs`
- [ ] **7.5** CORS 設定 → `src/main.rs`

### Phase 8: API 動作確認ページ

- [ ] **8.1** API テストページ → `src/app/(protected)/api-test/page.tsx`

### Phase 9: メール設定（Resend）

- [ ] **9.1** Resend 設定 → `src/lib/auth.ts`（emailVerification 追加）
- [ ] **9.2** メールテンプレート → `src/lib/email.ts`（オプション）

## 実装順序（推奨）

```
Phase 1 (環境構築)
    ↓
Phase 2 (DB マイグレーション)
    ↓
Phase 3 (Better Auth 設定)
    ↓
Phase 4 (認証 UI)
    ↓
Phase 5 (保護ページ)
    ↓
Phase 6 (退会機能)
    ↓
Phase 7 (Axum バックエンド)
    ↓
Phase 8 (API 動作確認)
    ↓
Phase 9 (メール設定)
```

## 環境変数

### フロントエンド (.env.local)

```env
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3050
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=http://localhost:3050
NEXT_PUBLIC_BACKEND_URL=http://localhost:3051
RESEND_API_KEY=re_xxxxxxxxxxxx
```

### バックエンド (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5555/better_auth_sample
RUST_LOG=debug
SERVER_PORT=3051
FRONTEND_URL=http://localhost:3050
```

## 動作確認チェックリスト

### Phase 2 完了時

- [ ] PostgreSQL に接続できる
- [ ] マイグレーションが成功する
- [ ] テーブルが作成されている

### Phase 4 完了時

- [ ] 会員登録ができる
- [ ] ログインができる
- [ ] Google 認証ができる
- [ ] ログアウトができる

### Phase 6 完了時

- [ ] 退会処理ができる
- [ ] 退会後に同じメールで再登録できる

### Phase 7 完了時

- [ ] /api/health が応答する
- [ ] /api/me が認証ユーザー情報を返す
- [ ] Cookie なしで /api/me にアクセスすると 401 が返る

### Phase 9 完了時

- [ ] 会員登録時に認証メールが届く
- [ ] メール内リンクをクリックすると認証完了する
