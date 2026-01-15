import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* ヘッダー */}
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Better Auth Sample
          </h1>
          <p className="text-lg text-gray-600">
            Next.js + Better Auth + Axum + SeaORM
          </p>
        </header>

        {/* 認証状態に応じた表示 */}
        {session ? (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  ようこそ、{session.user.name} さん
                </h2>
                <p className="text-gray-600">{session.user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/profile"
                className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                プロフィール
              </Link>
              <Link
                href="/settings"
                className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                設定
              </Link>
              <Link
                href="/api-test"
                className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                API テスト
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              はじめましょう
            </h2>
            <p className="text-gray-600 mb-6">
              アカウントを作成するか、ログインしてください。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                会員登録
              </Link>
              <Link
                href="/login"
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                ログイン
              </Link>
            </div>
          </div>
        )}

        {/* 機能一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              認証機能
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>- メール/パスワード認証</li>
              <li>- Google OAuth 認証</li>
              <li>- Cookie ベースセッション</li>
              <li>- 退会（ソフトデリート）</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              技術スタック
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>- Next.js 16 + Better Auth</li>
              <li>- Axum (Rust) バックエンド</li>
              <li>- SeaORM + Drizzle</li>
              <li>- PostgreSQL</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Axum 認証パターン
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>- middleware（必須認証）</li>
              <li>- FromRequestParts（任意認証）</li>
              <li>- 折衷アプローチのサンプル</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              API エンドポイント
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>- /api/health（公開）</li>
              <li>- /api/greeting（任意認証）</li>
              <li>- /api/me（必須認証）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
