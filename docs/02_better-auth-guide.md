# Better Auth 設定ガイド

## 1. Better Auth 概要

Better Auth は TypeScript 向けのフレームワーク非依存な認証・認可ライブラリです。

### 主な特徴
- Cookie ベースのセッション管理
- メール/パスワード認証
- OAuth/ソーシャル認証（Google, GitHub 等）
- 2要素認証、パスキー対応
- プラグインによる拡張性
- 複数のDBアダプター対応（Drizzle, Prisma 等）

## 2. インストール

```bash
# Next.js プロジェクトにインストール
npm install better-auth
# または
pnpm add better-auth
```

**バージョン固定の推奨**: Better Auth は活発に開発されており、マイナーバージョンでも破壊的変更が含まれる場合があります。
本番環境では `package.json` でバージョンを固定することを推奨します:

```json
"better-auth": "1.4.12"
```

アップデート時は [リリースノート](https://github.com/better-auth/better-auth/releases) を確認してください。

## 3. 環境変数設定

```env
# .env.local

# Better Auth の秘密鍵（32文字以上）
# 生成: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters

# アプリケーションのベースURL
BETTER_AUTH_URL=http://localhost:3050

# データベース接続
DATABASE_URL=postgresql://user:password@localhost:5555/better_auth_sample

# Google OAuth（Google Cloud Console で取得）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## 4. サーバー側設定

### lib/auth.ts

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";

export const auth = betterAuth({
  // データベースアダプター
  database: drizzleAdapter(db, {
    provider: "pg", // PostgreSQL
  }),

  // メール認証設定（トップレベルで設定）
  emailVerification: {
    sendOnSignUp: true, // 会員登録時に自動送信
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      // 実際のメール送信処理（Resend, SendGrid, Nodemailer 等を使用）
      await sendEmail({
        to: user.email,
        subject: "メールアドレスの確認",
        html: `
          <p>${user.name} 様</p>
          <p>以下のリンクをクリックしてメールアドレスを確認してください。</p>
          <a href="${url}">メールアドレスを確認する</a>
          <p>このリンクは24時間有効です。</p>
        `,
      });
    },
  },

  // メール/パスワード認証を有効化
  emailAndPassword: {
    enabled: true,
    // メール認証を必須にする
    requireEmailVerification: true,
    // パスワードリセットメール送信処理
    sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      await sendEmail({
        to: user.email,
        subject: "パスワードのリセット",
        html: `
          <p>${user.name} 様</p>
          <p>以下のリンクをクリックしてパスワードをリセットしてください。</p>
          <a href="${url}">パスワードをリセットする</a>
          <p>このリンクは1時間有効です。</p>
        `,
      });
    },
  },

  // OAuth プロバイダー
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // オプション: スコープの追加
      // scope: ["openid", "email", "profile"],
    },
  },

  // セッション設定
  session: {
    // セッションの有効期限（デフォルト: 7日）
    expiresIn: 60 * 60 * 24 * 7, // 7日（秒単位）
    // セッション更新の閾値
    updateAge: 60 * 60 * 24, // 1日経過で更新
    // Cookie 設定
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分間キャッシュ
    },
  },

  // ユーザーテーブルのカスタムフィールド
  user: {
    additionalFields: {
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },

  // 信頼するオリジン（CORS 設定）
  trustedOrigins: [
    "http://localhost:3050",
    "http://localhost:3051", // Axum バックエンド
  ],
});

// 型エクスポート
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
```

## 5. Drizzle スキーマ定義

### db/schema.ts

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

// users テーブル
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // カスタムフィールド（退会用）
  deletedAt: timestamp("deleted_at"),
});

// sessions テーブル
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// accounts テーブル（認証アカウント用）
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),  // メール/パスワード認証用（ハッシュ化済み）
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // provider_id と account_id の組み合わせでユニーク制約
  providerAccountUnique: unique().on(table.providerId, table.accountId),
}));

// verifications テーブル
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

## 6. Drizzle 設定

### lib/db.ts

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

### drizzle.config.ts

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // 注意: マイグレーションは SeaORM で管理するため、out は設定しない
});
```

## 7. API Route 設定

### app/api/auth/[...all]/route.ts

```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// 認証 API はキャッシュしない（動的レンダリングを強制）
export const dynamic = "force-dynamic";

export const { GET, POST } = toNextJsHandler(auth);
```

## 8. クライアント側設定

### lib/auth-client.ts

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3050",
});

// 便利なエクスポート
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
```

## 9. 認証フックの使用

### セッション取得（クライアントコンポーネント）

```typescript
"use client";

import { useSession } from "@/lib/auth-client";

export function UserProfile() {
  const { data: session, isPending, error } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!session) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### セッション取得（サーバーコンポーネント）

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}</p>
    </div>
  );
}
```

## 10. 会員登録

```typescript
"use client";

import { signUp } from "@/lib/auth-client";
import { useState } from "react";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/dashboard", // 登録後のリダイレクト先
    });

    if (error) {
      setError(error.message);
      return;
    }

    // メール認証が有効な場合、確認画面を表示
    // （requireEmailVerification: true の場合）
    alert("確認メールを送信しました。メールをご確認ください。");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="名前"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード（8文字以上）"
        required
        minLength={8}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">登録</button>
    </form>
  );
}
```

## 11. ログイン

```typescript
"use client";

import { signIn } from "@/lib/auth-client";
import { useState } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error } = await signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
      rememberMe: true, // ブラウザ閉じてもログイン維持
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">ログイン</button>
    </form>
  );
}
```

## 12. Google 認証

```typescript
"use client";

import { signIn } from "@/lib/auth-client";

export function GoogleSignInButton() {
  const handleGoogleSignIn = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  return (
    <button onClick={handleGoogleSignIn}>
      Googleでログイン
    </button>
  );
}
```

## 13. ログアウト

```typescript
"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  return (
    <button onClick={handleLogout}>
      ログアウト
    </button>
  );
}
```

## 14. メール認証

### メール送信サービス（Resend）

Better Auth 自体にはメール送信機能がないため、外部サービスを使用します。
本プロジェクトでは [Resend](https://resend.com/) を使用します。

#### Resend のセットアップ

1. [Resend](https://resend.com/) でアカウント作成
2. API Key を取得
3. 送信元ドメインを設定（または `onboarding@resend.dev` を使用）

#### インストール

```bash
pnpm add resend
```

#### 環境変数

```env
# .env.local
RESEND_API_KEY=re_xxxxxxxxxxxx
```

#### メール送信ユーティリティ

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@yourdomain.com', // Resend で設定したドメイン
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Failed to send email:', error);
    throw new Error('メール送信に失敗しました');
  }

  return data;
}
```

#### auth.ts での使用

```typescript
import { sendEmail } from './email';

export const auth = betterAuth({
  // ...
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: 'メールアドレスの確認',
        html: `
          <p>${user.name} 様</p>
          <p>以下のリンクをクリックしてメールアドレスを確認してください。</p>
          <a href="${url}">メールアドレスを確認する</a>
          <p>このリンクは24時間有効です。</p>
        `,
      });
    },
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: 'パスワードのリセット',
        html: `
          <p>${user.name} 様</p>
          <p>以下のリンクをクリックしてパスワードをリセットしてください。</p>
          <a href="${url}">パスワードをリセットする</a>
          <p>このリンクは1時間有効です。</p>
        `,
      });
    },
  },
});
```

### メール認証の仕組み

メール認証を有効にすると、会員登録時に以下のフローになります。

1. ユーザーが登録フォームを送信
2. `users` テーブルにユーザーが作成される（`emailVerified = false`）
3. `verifications` テーブルに認証トークンが保存される
4. `sendVerificationEmail` で Resend 経由でメール送信
5. ユーザーがメール内のリンクをクリック
6. `emailVerified = true` に更新され、セッションが作成される

### 認証メール再送信

```typescript
// 認証メールを再送信
await authClient.sendVerificationEmail({
  email: "user@example.com",
  callbackURL: "/dashboard",
});
```

### メール認証状態の確認

```typescript
const { data: session } = useSession();

if (session && !session.user.emailVerified) {
  // メール未認証の場合の処理
  return <div>メールアドレスを確認してください</div>;
}
```

### 未認証ユーザーのログイン制限

`requireEmailVerification: true` を設定すると、メール未認証のユーザーはログインできません。
ログイン時に「メールアドレスが確認されていません」というエラーが返されます。

### 開発環境でのテスト

Resend の無料プランでは、認証済みドメインがない場合でも `onboarding@resend.dev` から送信できます。
ただし、送信先は Resend アカウントに登録したメールアドレスのみに制限されます。

```typescript
// 開発環境用の設定
from: process.env.NODE_ENV === 'production'
  ? 'noreply@yourdomain.com'
  : 'onboarding@resend.dev',
```

## 15. セッション Cookie について

Better Auth は `better-auth.session_token` という名前の Cookie を使用します。

### Cookie の特性
| 属性 | 値 | 説明 |
|------|-----|------|
| Name | `better-auth.session_token` | Cookie 名 |
| HttpOnly | `true` | JavaScript からアクセス不可 |
| Secure | `true` (本番) | HTTPS でのみ送信 |
| SameSite | `Lax` | CSRF 保護 |
| Path | `/` | 全パスで有効 |

### セッショントークンの検証

Better Auth の Cookie は**署名付き**で保存されます：

```text
Cookie 形式: {token}.{signature}
例: OgyWoCtgvcOQId1Q1TwllqNSQgKU5UKh.BiLgzCK5RHiQnBejjbzumhdryeMEoUzr30gqA%2FST7iA%3D
```

データベースの `sessions.token` カラムには**署名なしの平文トークン**が保存されます。

Axum バックエンドでセッションを検証する際は、Cookie の値から署名部分を分離してから照合します：

```sql
-- Cookie から token 部分を抽出して照合
SELECT * FROM sessions
WHERE token = 'OgyWoCtgvcOQId1Q1TwllqNSQgKU5UKh'  -- 署名部分を除いた token
  AND expires_at > NOW();
```

## 15. スキーマ生成（CLI）

Better Auth CLI を使用してスキーマを自動生成できます。

```bash
# スキーマ生成（参考用）
npx @better-auth/cli@latest generate
```

> **注意**: 本プロジェクトでは SeaORM でマイグレーションを一元管理しています。
> Drizzle はあくまで Better Auth のアダプターとして使用し、マイグレーション生成は行いません。
> スキーマ変更が必要な場合は SeaORM のマイグレーションを使用してください。

## 16. トラブルシューティング

### よくある問題

1. **Cookie が設定されない**
   - `BETTER_AUTH_URL` が正しいか確認
   - HTTPS 環境では `Secure` 属性が必要

2. **CORS エラー**
   - `trustedOrigins` にクライアントのオリジンを追加

3. **セッションが取得できない**
   - `headers()` を正しく渡しているか確認
   - Cookie が送信されているか確認

4. **Google OAuth エラー**
   - リダイレクト URI が正しく設定されているか確認
   - Google Cloud Console で認証情報を確認

## 17. SDK を使わない直接 API 呼び出し（Raw API）

Better Auth の認証 API は公開 REST API として提供されており、SDK（`better-auth/react`）を使わずに `fetch` で直接呼び出すことも可能です。Cookie ベースのセッション管理が可能なクライアントであれば、どの環境からでも認証できます。

### 実装ファイル

本プロジェクトでは、SDK を使わない認証画面を以下のファイルで実装しています。

| ファイル | 説明 |
|----------|------|
| `app/(auth)/raw-login/page.tsx` | ログインページ |
| `app/(auth)/raw-signup/page.tsx` | 会員登録ページ |
| `components/auth/RawLoginForm.tsx` | fetch 版ログインフォーム |
| `components/auth/RawSignupForm.tsx` | fetch 版会員登録フォーム |
| `components/auth/BaseLoginForm.tsx` | ログインフォーム共通 UI |
| `components/auth/BaseSignupForm.tsx` | 会員登録フォーム共通 UI |

### SDK 版 vs Raw API 版の比較

| 項目 | SDK 版 | Raw API 版 |
|------|--------|-----------|
| API 呼び出し | `signIn.email()` | `fetch("/api/auth/sign-in/email")` |
| Cookie 管理 | SDK が自動処理 | `credentials: "include"` を明示 |
| 型安全性 | SDK の型定義あり | 自前で型定義 |
| 依存 | `better-auth/react` | なし（fetch のみ） |

### 実装例（ログイン）

```typescript
const handleSubmit = async (data: { email: string; password: string }) => {
  const response = await fetch("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",  // Cookie を受け取るために必須
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.error?.message };
  }
  return { success: true };
};
```

**重要:** `credentials: "include"` を指定しないと、レスポンスの `Set-Cookie` ヘッダーがブラウザに反映されません。

### 実装例（会員登録）

```typescript
const handleSubmit = async (data: { name: string; email: string; password: string }) => {
  const response = await fetch("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { success: false, error: result.error?.message };
  }
  return { success: true };
};
```

### 共通コンポーネント構造

SDK 版と Raw API 版でフォーム UI を共通化するために、`BaseLoginForm` / `BaseSignupForm` コンポーネントを用意しています。

```typescript
// BaseLoginForm.tsx - 共通 UI
type BaseLoginFormProps = {
  onSubmit: (data: LoginData) => Promise<LoginResult>;
};

export function BaseLoginForm({ onSubmit }: BaseLoginFormProps) {
  // フォーム UI（state, validation, JSX）を提供
  // API 呼び出しロジックは onSubmit で注入
}

// LoginForm.tsx - SDK 版
export function LoginForm() {
  const handleSubmit = async (data) => {
    const result = await signIn.email({ ... });  // SDK 使用
    return result.error ? { success: false, error: result.error.message } : { success: true };
  };
  return <BaseLoginForm onSubmit={handleSubmit} />;
}

// RawLoginForm.tsx - Raw API 版
export function RawLoginForm() {
  const handleSubmit = async (data) => {
    const response = await fetch("/api/auth/sign-in/email", { ... });  // fetch 使用
    return !response.ok ? { success: false, error: result.error?.message } : { success: true };
  };
  return <BaseLoginForm onSubmit={handleSubmit} />;
}
```

### ユースケース

- **SDK に依存しないクライアント**: React 以外のフレームワーク（Vue, Svelte 等）からの認証
- **モバイルアプリ**: iOS/Android アプリからの API 呼び出し
- **学習目的**: Better Auth の認証フローを理解するため
- **テスト**: API を直接叩いて動作確認したい場合
