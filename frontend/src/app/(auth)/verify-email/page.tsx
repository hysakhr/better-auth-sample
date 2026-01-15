import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          メールを確認してください
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {email ? (
            <>
              <span className="font-medium">{email}</span> 宛に認証メールを送信しました。
            </>
          ) : (
            "認証メールを送信しました。"
          )}
        </p>
        <p className="mt-4 text-center text-sm text-gray-500">
          メール内のリンクをクリックして、アカウントを有効化してください。
        </p>
      </div>

      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <div className="flex flex-col space-y-2">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ログインページへ
            </Link>
            <Link
              href="/register"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              別のメールアドレスで登録
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
