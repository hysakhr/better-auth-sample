import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { db } from "./db";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: user.email,
        subject: "メールアドレスを確認してください",
        html: `
          <h1>メールアドレスの確認</h1>
          <p>${user.name} さん、</p>
          <p>以下のリンクをクリックしてメールアドレスを確認してください。</p>
          <p><a href="${url}">メールアドレスを確認する</a></p>
          <p>このリンクは24時間有効です。</p>
        `,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPasswordEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@example.com",
        to: user.email,
        subject: "パスワードをリセット",
        html: `
          <h1>パスワードのリセット</h1>
          <p>${user.name} さん、</p>
          <p>以下のリンクをクリックしてパスワードをリセットしてください。</p>
          <p><a href="${url}">パスワードをリセットする</a></p>
          <p>このリンクは1時間有効です。</p>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3050",
    "http://localhost:3051",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
