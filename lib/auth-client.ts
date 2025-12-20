import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signOut, useSession } = authClient;

export async function signUpWithUsername(data: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  return authClient.signUp.email(data as Parameters<typeof authClient.signUp.email>[0]);
}
