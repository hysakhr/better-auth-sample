"use client";

import { BaseSignupForm, SignupData, SignupResult } from "./BaseSignupForm";

export function RawSignupForm() {
  const handleSubmit = async (data: SignupData): Promise<SignupResult> => {
    const response = await fetch("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error?.message };
    }
    return { success: true };
  };

  return <BaseSignupForm onSubmit={handleSubmit} />;
}
