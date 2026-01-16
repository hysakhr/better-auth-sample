import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function ProfilePage() {
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
            <span className="text-gray-600">プロフィール</span>
            <Link
              href="/settings"
              className="text-gray-600 hover:text-gray-900"
            >
              設定
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">プロフィール</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center space-x-4 mb-6">
                {session?.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    className="h-16 w-16 rounded-full"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-medium">
                    {session?.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    {session?.user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{session?.user.email}</p>
                </div>
              </div>

              <dl className="divide-y divide-gray-200">
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">ユーザーID</dt>
                  <dd className="text-sm text-gray-900">{session?.user.id}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                  <dd className="text-sm text-gray-900">{session?.user.email}</dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">メール認証</dt>
                  <dd className="text-sm">
                    {session?.user.emailVerified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        認証済み
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        未認証
                      </span>
                    )}
                  </dd>
                </div>
                <div className="py-3 flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">作成日</dt>
                  <dd className="text-sm text-gray-900">
                    {session?.user.createdAt
                      ? new Date(session.user.createdAt).toLocaleDateString("ja-JP")
                      : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
      </main>
    </div>
  );
}
