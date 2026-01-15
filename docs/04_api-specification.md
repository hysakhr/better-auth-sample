# API 仕様書

## 1. 概要

本プロジェクトでは、2つの API サーバーが存在します。

| サーバー | ポート | 用途 |
|----------|--------|------|
| Next.js API Routes | 3050 | 認証API、アプリ固有の認証ロジック |
| Axum Backend | 3051 | ビジネスロジックAPI |

## 2. Next.js API Routes

### 2.1 Better Auth エンドポイント

Better Auth が自動的に提供するエンドポイントです。

#### POST /api/auth/sign-up/email
メールアドレス/パスワードで会員登録

**Request Body:**
```json
{
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "password": "password123"
}
```

**Response (成功):**
```json
{
  "user": {
    "id": "abc123",
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "emailVerified": false,
    "image": null,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "session": {
    "id": "session123",
    "userId": "abc123",
    "token": "...",
    "expiresAt": "2024-01-22T10:00:00.000Z"
  }
}
```

**Set-Cookie:**
```
better-auth.session_token=...; Path=/; HttpOnly; SameSite=Lax
```

---

#### POST /api/auth/sign-in/email
メールアドレス/パスワードでログイン

**Request Body:**
```json
{
  "email": "tanaka@example.com",
  "password": "password123",
  "rememberMe": true
}
```

**Response (成功):**
```json
{
  "user": { ... },
  "session": { ... }
}
```

**Response (エラー):**
```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

---

#### POST /api/auth/sign-in/social
ソーシャル認証（リダイレクト）

**Request Body:**
```json
{
  "provider": "google",
  "callbackURL": "/dashboard"
}
```

**Response:**
リダイレクト URL を返却し、Google 認証画面へ遷移

---

#### GET /api/auth/callback/google
Google OAuth コールバック

Better Auth が自動処理し、ユーザー作成/更新とセッション作成を行う。
成功時は `callbackURL` にリダイレクト。

---

#### GET /api/auth/session
現在のセッション情報を取得

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Response (認証済み):**
```json
{
  "user": {
    "id": "abc123",
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "emailVerified": false,
    "image": "https://...",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "session": {
    "id": "session123",
    "userId": "abc123",
    "expiresAt": "2024-01-22T10:00:00.000Z"
  }
}
```

**Response (未認証):**
```json
null
```

---

#### POST /api/auth/sign-out
ログアウト

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Response:**
```json
{
  "success": true
}
```

**Set-Cookie:**
```
better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0
```

---

### 2.2 アプリ固有の認証API

#### POST /api/user/withdraw
ユーザー退会処理

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Request Body:**
```json
{
  "confirmPassword": "password123"
}
```
※ Google 認証ユーザーの場合、`confirmPassword` は不要

**Response (成功):**
```json
{
  "success": true,
  "message": "退会処理が完了しました"
}
```

**Response (エラー - パスワード不一致):**
```json
{
  "error": {
    "message": "パスワードが正しくありません",
    "code": "INVALID_PASSWORD"
  }
}
```

**処理内容:**
1. セッションからユーザー情報を取得
2. メール/パスワードユーザーの場合、パスワードを検証
3. users テーブルをソフトデリート（deleted_at 設定、email/name 難読化）
4. sessions テーブルから全セッションを削除
5. メール/パスワードユーザーの場合、accounts レコードも削除
6. Cookie を削除

---

## 3. Axum Backend API

### 3.1 認証ミドルウェア

Axum バックエンドでは、Cookie からセッショントークンを抽出し、sessions テーブルで検証します。

```rust
// middleware/auth.rs
pub async fn auth_middleware(
    State(state): State<AppState>,
    cookie_jar: CookieJar,
    mut request: Request,
    next: Next,
) -> Response {
    // Cookie からトークンを取得
    let token = cookie_jar
        .get("better-auth.session_token")
        .map(|c| c.value().to_string());

    if let Some(token) = token {
        // Cookie の値は "{token}.{signature}" 形式なので、署名部分を除去
        let token = token.split('.').next().unwrap_or(&token).to_string();

        // sessions テーブルで検証
        if let Ok(Some(session)) = Session::find()
            .filter(sessions::Column::Token.eq(&token))
            .filter(sessions::Column::ExpiresAt.gt(Utc::now()))
            .one(&state.db)
            .await
        {
            // ユーザー情報を取得してリクエストに付加
            if let Ok(Some(user)) = User::find_by_id(&session.user_id)
                .one(&state.db)
                .await
            {
                request.extensions_mut().insert(AuthUser(user));
            }
        }
    }

    next.run(request).await
}
```

### 3.2 公開API（認証不要）

#### GET /api/health
ヘルスチェック

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

#### GET /api/greeting
任意認証の挨拶 API（FromRequestParts パターン）

**Response (認証済み):**
```json
{
  "message": "こんにちは、田中太郎さん！",
  "user_name": "田中太郎",
  "is_logged_in": true
}
```

**Response (未認証):**
```json
{
  "message": "こんにちは、ゲストさん！",
  "user_name": null,
  "is_logged_in": false
}
```

---

### 3.3 認証必須API（middleware パターン）

#### GET /api/me
現在のユーザー情報

**Request Headers:**
```
Cookie: better-auth.session_token=...
```

**Response (認証済み):**
```json
{
  "id": "abc123",
  "name": "田中太郎",
  "email": "tanaka@example.com",
  "emailVerified": false,
  "image": "https://...",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

**Response (未認証):**
```json
{
  "error": {
    "message": "Unauthorized",
    "code": "UNAUTHORIZED"
  }
}
```
**Status:** 401

---

## 4. CORS 設定

Axum バックエンドでは、Next.js からの API 呼び出しを許可するために CORS を設定します。

**注意:** `allow_credentials(true)` を使用する場合、`allow_headers(Any)` は使用できません。明示的にヘッダーを指定する必要があります。

```rust
// main.rs
use axum::http::{header, Method};
use tower_http::cors::CorsLayer;

let cors = CorsLayer::new()
    .allow_origin(frontend_url.parse::<HeaderValue>().unwrap())
    .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
    .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION, header::COOKIE])
    .allow_credentials(true);  // Cookie を許可

let app = Router::new()
    // routes...
    .layer(cors);
```

## 5. クライアントからの API 呼び出し

Next.js から Axum バックエンドの API を呼び出す際は、`credentials: "include"` を指定して Cookie を送信する必要があります。

```typescript
// フロントエンドから Axum API を呼び出す例
const response = await fetch(
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/me`,
  {
    method: "GET",
    credentials: "include",  // Cookie を送信するために必要
  }
);

const data = await response.json();
```

## 6. エラーレスポンス形式

全 API で統一したエラーレスポンス形式を使用します。

```json
{
  "error": {
    "message": "エラーメッセージ",
    "code": "ERROR_CODE",
    "details": {}  // オプション
  }
}
```

### エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| `UNAUTHORIZED` | 401 | 認証が必要 |
| `FORBIDDEN` | 403 | アクセス権限がない |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `INVALID_CREDENTIALS` | 401 | 認証情報が不正 |
| `INVALID_PASSWORD` | 400 | パスワードが不正 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `INTERNAL_ERROR` | 500 | サーバー内部エラー |
