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
  name: "退会済みユーザー"
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
  name: "退会済みユーザー"
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
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, session, account } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // セッションからユーザー情報を取得
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!currentSession) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const userId = currentSession.user.id;

    // ソフトデリート: メール・名前を匿名化し、deletedAt を設定
    const anonymizedEmail = `deleted_${userId}@deleted.local`;
    const anonymizedName = "退会済みユーザー";

    await db
      .update(user)
      .set({
        email: anonymizedEmail,
        name: anonymizedName,
        image: null,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    // セッションを削除（ログアウト）
    await db.delete(session).where(eq(session.userId, userId));

    // アカウント情報を削除（OAuth連携解除）
    await db.delete(account).where(eq(account.userId, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { error: "退会処理に失敗しました" },
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
import { useRouter } from "next/navigation";

export function WithdrawButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/withdraw", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "退会処理に失敗しました");
      }

      // 退会成功後、ログインページへリダイレクト
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "退会処理に失敗しました");
      setIsLoading(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        onClick={() => setIsConfirming(true)}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        退会する
      </button>
    );
  }

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <p className="text-sm text-red-800 mb-4">
        本当に退会しますか？この操作は取り消せません。
      </p>
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}
      <div className="flex space-x-3">
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "処理中..." : "退会を確定する"}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
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

1. **シンプルな退会処理**: 現在の実装はパスワード検証なしのシンプルな退会処理。本番環境ではパスワード再入力による確認を追加することを推奨
2. **トランザクション**: 本番環境ではトランザクションを使用して一貫性を保証
3. **GDPR 対応**: 必要に応じて完全削除オプションも検討
4. **再入会制限**: 悪用防止のため、再入会回数や期間の制限を検討
