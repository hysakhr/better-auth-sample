"use client";

import { signUp } from "@/lib/auth-client";
import { BaseSignupForm, SignupData, SignupResult } from "./BaseSignupForm";

export function RegisterForm() {
  const handleSubmit = async (data: SignupData): Promise<SignupResult> => {
    const result = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  };

  return <BaseSignupForm onSubmit={handleSubmit} />;
}
