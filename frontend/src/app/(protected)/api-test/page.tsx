"use client";

import { useState } from "react";
import Link from "next/link";

type ApiResult = {
  status: number;
  data: unknown;
  error?: string;
};

export default function ApiTestPage() {
  const [results, setResults] = useState<Record<string, ApiResult | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3051";

  const testApi = async (name: string, url: string, options?: RequestInit) => {
    setLoading((prev) => ({ ...prev, [name]: true }));
    setResults((prev) => ({ ...prev, [name]: null }));

    try {
      const response = await fetch(url, {
        ...options,
        credentials: "include", // Cookie を送信
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
      expectedStatus: 200,
    },
    {
      name: "greeting",
      label: "/api/greeting",
      description: "任意認証 API（ログインしていれば名前表示）",
      url: `${backendUrl}/api/greeting`,
      expectedStatus: 200,
    },
    {
      name: "me",
      label: "/api/me",
      description: "必須認証 API（ログイン必須）",
      url: `${backendUrl}/api/me`,
      expectedStatus: 200,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Home
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">API テスト</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Axum バックエンド API テスト
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Backend URL: {backendUrl}
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
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading[api.name] ? "Testing..." : "Test"}
                    </button>
                  </div>

                  {results[api.name] && (
                    <div
                      className={`mt-2 p-3 rounded text-sm ${
                        results[api.name]?.error
                          ? "bg-red-50 border border-red-200"
                          : results[api.name]?.status === api.expectedStatus
                          ? "bg-green-50 border border-green-200"
                          : "bg-yellow-50 border border-yellow-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-medium ${
                            results[api.name]?.error
                              ? "text-red-700"
                              : results[api.name]?.status === api.expectedStatus
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
                  - ログインしていれば名前を表示、していなければゲスト表示
                </p>
                <p>
                  <span className="font-medium">/api/me:</span> 必須認証（middleware）
                  - ログインしていないと 401 エラー
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
