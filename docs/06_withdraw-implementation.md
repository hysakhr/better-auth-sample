# 退会機能実装ガイド

## 1. 概要

本プロジェクトでは、以下の要件で退会機能を実装します。

| 認証方式 | 退会処理 | 再入会 |
|----------|----------|--------|
| メール/パスワード | ソフトデリート + 匿名化 | 可能（同じメールアドレスで新規登録、データ引継ぎなし） |
| Google OAuth | ソフトデリート + 匿名化 | 可能（同じアカウントで新規登録、データ引継ぎなし） |

## 2. データ変更の詳細

### 2.1 メール/パスワードユーザーの退会

```
退会前:
users:
  id: "user_123"
  name: "田中太郎"
  email: "tanaka@example.com"
  deleted_at: NULL

accounts:
  provider_id: "credential"
  user_id: "user_123"
  ...

退会後:
users:
  id: "user_123"
  name: "Deleted User"
  email: "deleted_user_123@deleted.local"  // 匿名化（元のメールアドレスは解放）
  deleted_at: "2024-01-15T10:00:00.000Z"

accounts: (削除)
sessions: (削除)

再入会:
- 同じメールアドレス (tanaka@example.com) で新規登録が可能
- 以前のデータは引き継がれない（完全に新規ユーザーとして扱う）
- 退会済みユーザーのレコードは残る（ソフトデリート）
```

### 2.2 Google OAuth ユーザーの退会

```
退会前:
users:
  id: "user_456"
  name: "山田花子"
  email: "yamada@gmail.com"
  deleted_at: NULL

accounts:
  provider_id: "google"
  account_id: "google_12345"  // Google のユーザーID
  user_id: "user_456"
  ...

退会後:
users:
  id: "user_456"
  name: "Deleted User"
  email: "deleted_user_456@deleted.local"
  deleted_at: "2024-01-15T10:00:00.000Z"

accounts: (削除)
sessions: (削除)

再入会:
- 同じ Google アカウントで新規登録が可能
- 以前のデータは引き継がれない（完全に新規ユーザーとして扱う）
- 退会済みユーザーのレコードは残る（ソフトデリート）
```

## 3. 実装

### 3.1 退会 API Route

```typescript
// src/app/api/user/withdraw/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, sessions, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. セッション取得
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: { message: "認証が必要です", code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. ユーザーの認証方式を確認
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId));

    const isGoogleUser = userAccounts.some(
      (acc) => acc.providerId === "google"
    );
    const isCredentialUser = userAccounts.some(
      (acc) => acc.providerId === "credential"
    );

    // 3. パスワード検証（メール/パスワードユーザーのみ）
    if (isCredentialUser) {
      const body = await request.json();
      const { confirmPassword } = body;

      if (!confirmPassword) {
        return NextResponse.json(
          { error: { message: "パスワードを入力してください", code: "VALIDATION_ERROR" } },
          { status: 400 }
        );
      }

      // Better Auth の signIn.email を使ってパスワードを検証
      // 退会前に再認証することでパスワードの正当性を確認
      const verifyResult = await auth.api.signInEmail({
        body: {
          email: session.user.email,
          password: confirmPassword,
        },
      });

      if (!verifyResult) {
        return NextResponse.json(
          { error: { message: "パスワードが正しくありません", code: "INVALID_PASSWORD" } },
          { status: 400 }
        );
      }
    }

    // 4. ユーザー情報をソフトデリート
    const anonymizedEmail = `deleted_${userId}@deleted.local`;

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        email: anonymizedEmail,
        name: "Deleted User",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 5. セッション削除
    await db.delete(sessions).where(eq(sessions.userId, userId));

    // 6. アカウント削除（全ユーザー共通）
    await db.delete(accounts).where(eq(accounts.userId, userId));

    // 7. Cookie 削除
    const cookieStore = await cookies();
    cookieStore.delete("better-auth.session_token");

    return NextResponse.json({
      success: true,
      message: "退会処理が完了しました",
    });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { error: { message: "退会処理中にエラーが発生しました", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}

```

### 3.2 退会確認コンポーネント

```typescript
// src/components/auth/WithdrawButton.tsx
"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function WithdrawButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Google ユーザーかどうかを判定（実際にはバックエンドで判定すべき）
  const isGoogleUser = session?.user?.image?.includes("googleusercontent");

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/user/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          isGoogleUser ? {} : { confirmPassword: password }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || "退会処理に失敗しました");
        return;
      }

      // 成功時はトップページへリダイレクト
      router.push("/?withdrawn=true");
    } catch (err) {
      setError("退会処理中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-800"
      >
        退会する
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">退会確認</h2>

            <p className="mb-4 text-gray-600">
              本当に退会しますか？この操作は取り消せません。
            </p>

            {!isGoogleUser && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  確認のためパスワードを入力してください
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="パスワード"
                />
              </div>
            )}

            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border rounded"
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                onClick={handleWithdraw}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded"
                disabled={isLoading || (!isGoogleUser && !password)}
              >
                {isLoading ? "処理中..." : "退会する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

## 4. Axum バックエンドでの退会ユーザー除外

認証ミドルウェアで退会ユーザーを除外します。

```rust
// src/middleware/auth.rs
use axum::{
    extract::State,
    http::Request,
    middleware::Next,
    response::Response,
};
use axum_extra::extract::CookieJar;
use sea_orm::{EntityTrait, QueryFilter, ColumnTrait};
use chrono::Utc;

use crate::entity::{sessions, users};
use crate::AppState;

pub async fn auth_middleware<B>(
    State(state): State<AppState>,
    cookie_jar: CookieJar,
    mut request: Request<B>,
    next: Next<B>,
) -> Response {
    let token = cookie_jar
        .get("better-auth.session_token")
        .map(|c| c.value().to_string());

    if let Some(token) = token {
        // Cookie の値は "{token}.{signature}" 形式なので、署名部分を除去
        let token = token.split('.').next().unwrap_or(&token).to_string();

        // セッション検証
        if let Ok(Some(session)) = sessions::Entity::find()
            .filter(sessions::Column::Token.eq(&token))
            .filter(sessions::Column::ExpiresAt.gt(Utc::now()))
            .one(&state.db)
            .await
        {
            // ユーザー取得
            if let Ok(Some(user)) = users::Entity::find_by_id(&session.user_id)
                .one(&state.db)
                .await
            {
                // 退会ユーザーを除外
                if user.deleted_at.is_none() {
                    request.extensions_mut().insert(AuthUser(user));
                }
            }
        }
    }

    next.run(request).await
}

#[derive(Clone)]
pub struct AuthUser(pub users::Model);
```

## 5. 注意事項

1. **パスワード検証**: Better Auth の `signInEmail` API を使用して検証（内部実装に依存しない）
2. **トランザクション**: 本番環境ではトランザクションを使用して一貫性を保証
3. **GDPR 対応**: 必要に応じて完全削除オプションも検討
4. **再入会制限**: 悪用防止のため、再入会回数や期間の制限を検討
