import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { WithdrawButton } from "@/components/auth/WithdrawButton";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Better Auth Sample
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-gray-600 hover:text-gray-900"
            >
              プロフィール
            </Link>
            <span className="text-gray-600">設定</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">設定</h2>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* アカウント情報 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  アカウント情報
                </h3>
                <div className="text-sm text-gray-600">
                  <p>名前: {session?.user.name}</p>
                  <p>メール: {session?.user.email}</p>
                </div>
              </div>

              {/* 危険な操作 */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-red-600 mb-2">
                  危険な操作
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  退会すると、アカウントは無効化され、同じメールアドレスで再登録できるようになります。
                </p>
                <WithdrawButton />
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}
