"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function WithdrawButton() {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/withdraw", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "退会処理に失敗しました");
      }

      // 退会成功後、ログインページへリダイレクト
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "退会処理に失敗しました");
      setIsLoading(false);
    }
  };

  if (!isConfirming) {
    return (
      <button
        onClick={() => setIsConfirming(true)}
        className="text-red-600 hover:text-red-800 text-sm"
      >
        退会する
      </button>
    );
  }

  return (
    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
      <p className="text-sm text-red-800 mb-4">
        本当に退会しますか？この操作は取り消せません。
      </p>
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}
      <div className="flex space-x-3">
        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "処理中..." : "退会を確定する"}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
