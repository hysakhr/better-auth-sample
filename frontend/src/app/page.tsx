"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { LogoutButton } from "@/components/auth/LogoutButton";

type ApiResult = {
  status: number;
  data: unknown;
  error?: string;
};

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const [results, setResults] = useState<Record<string, ApiResult | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3051";

  const testApi = async (name: string, url: string) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    setResults((prev) => ({ ...prev, [name]: null }));

    try {
      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      setResults((prev) => ({
        ...prev,
        [name]: {
          status: response.status,
          data,
        },
      }));
    } catch (error) {
      setResults((prev) => ({
        ...prev,
        [name]: {
          status: 0,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [name]: false }));
    }
  };

  const apis = [
    {
      name: "health",
      label: "/api/health",
      description: "公開 API（認証不要）",
      url: `${backendUrl}/api/health`,
    },
    {
      name: "greeting",
      label: "/api/greeting",
      description: "任意認証（ログインしていれば名前表示）",
      url: `${backendUrl}/api/greeting`,
    },
    {
      name: "me",
      label: "/api/me",
      description: "必須認証（ログイン必須、未認証は401）",
      url: `${backendUrl}/api/me`,
    },
  ];

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Better Auth Sample</h1>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                  プロフィール
                </Link>
                <Link href="/settings" className="text-gray-600 hover:text-gray-900">
                  設定
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  会員登録
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ユーザー情報 */}
        {session ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  ようこそ、{session.user.name} さん
                </h2>
                <p className="text-gray-600 text-sm">{session.user.email}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ゲストとして閲覧中
            </h2>
            <p className="text-gray-600 text-sm">
              ログインすると API の認証動作が変わります
            </p>
          </div>
        )}

        {/* API テスト */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Axum バックエンド API テスト
            </h2>
            <p className="text-sm text-gray-500">
              Backend: {backendUrl}
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {apis.map((api) => (
              <div key={api.name} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {api.label}
                    </h3>
                    <p className="text-xs text-gray-500">{api.description}</p>
                  </div>
                  <button
                    onClick={() => testApi(api.name, api.url)}
                    disabled={loading[api.name]}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading[api.name] ? "Testing..." : "Test"}
                  </button>
                </div>

                {results[api.name] && (
                  <div
                    className={`mt-2 p-3 rounded text-sm ${
                      results[api.name]?.error
                        ? "bg-red-50 border border-red-200"
                        : results[api.name]?.status === 200
                        ? "bg-green-50 border border-green-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium ${
                          results[api.name]?.error
                            ? "text-red-700"
                            : results[api.name]?.status === 200
                            ? "text-green-700"
                            : "text-yellow-700"
                        }`}
                      >
                        Status: {results[api.name]?.status || "Error"}
                      </span>
                      {results[api.name]?.error && (
                        <span className="text-red-600">
                          ({results[api.name]?.error})
                        </span>
                      )}
                    </div>
                    <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                      {JSON.stringify(results[api.name]?.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              認証アプローチの違い
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <span className="font-medium">/api/health:</span> 認証なし（誰でもアクセス可）
              </p>
              <p>
                <span className="font-medium">/api/greeting:</span> 任意認証（FromRequestParts）
                - ログイン有無で応答が変わる
              </p>
              <p>
                <span className="font-medium">/api/me:</span> 必須認証（middleware）
                - 未認証は 401 エラー
              </p>
            </div>
          </div>
        </div>

        {/* 機能一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              認証機能
            </h3>
            <ul className="text-gray-600 space-y-1 text-sm">
              <li>- メール/パスワード認証</li>
              <li>- Google OAuth 認証</li>
              <li>- メール認証（Resend）</li>
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
        </div>
      </div>
    </div>
  );
}
