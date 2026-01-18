import Link from "next/link";
import { RawLoginForm } from "@/components/auth/RawLoginForm";

export default function RawLoginPage() {
  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          ログイン (REST API)
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/raw-signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            会員登録
          </Link>
        </p>
      </div>

      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <RawLoginForm />

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            パスワードをお忘れの方
          </Link>
        </div>
      </div>
    </>
  );
}
