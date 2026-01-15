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
