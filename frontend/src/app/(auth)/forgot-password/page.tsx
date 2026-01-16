import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          パスワードをお忘れの方
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          登録したメールアドレスを入力してください。
          <br />
          パスワードリセット用のリンクをお送りします。
        </p>
      </div>

      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <ForgotPasswordForm />

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            ログインに戻る
          </Link>
        </div>
      </div>
    </>
  );
}
