import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900"
              >
                プロフィール
              </Link>
              <Link
                href="/settings"
                className="text-gray-600 hover:text-gray-900"
              >
                設定
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              ようこそ、{session?.user.name} さん
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-medium">メール:</span>{" "}
                {session?.user.email}
              </p>
              <p>
                <span className="font-medium">認証状態:</span>{" "}
                {session?.user.emailVerified ? "認証済み" : "未認証"}
              </p>
              <p>
                <span className="font-medium">ユーザーID:</span>{" "}
                {session?.user.id}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
