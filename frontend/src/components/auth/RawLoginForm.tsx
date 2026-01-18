"use client";

import { BaseLoginForm, LoginData, LoginResult } from "./BaseLoginForm";

export function RawLoginForm() {
  const handleSubmit = async (data: LoginData): Promise<LoginResult> => {
    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: data.email, password: data.password }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error?.message };
    }
    return { success: true };
  };

  return <BaseLoginForm onSubmit={handleSubmit} />;
}
