import Link from "next/link";
import { RawSignupForm } from "@/components/auth/RawSignupForm";

export default function RawSignupPage() {
  return (
    <>
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          会員登録 (REST API)
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          既にアカウントをお持ちの方は{" "}
          <Link
            href="/raw-login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ログイン
          </Link>
        </p>
      </div>

      <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <RawSignupForm />
      </div>
    </>
  );
}
