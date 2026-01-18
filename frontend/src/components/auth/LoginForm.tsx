"use client";

import { signIn } from "@/lib/auth-client";
import { BaseLoginForm, LoginData, LoginResult } from "./BaseLoginForm";

export function LoginForm() {
  const handleSubmit = async (data: LoginData): Promise<LoginResult> => {
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  };

  return <BaseLoginForm onSubmit={handleSubmit} />;
}
