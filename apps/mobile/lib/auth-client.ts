import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

export const authClient = createAuthClient({
  baseURL: API_URL,
  storage: {
    getItem: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {}
    },
    removeItem: async (key: string) => {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {}
    },
  },
});

export const { signIn, signOut, useSession } = authClient;

export async function signUpWithUsername(data: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  return authClient.signUp.email(
    data as Parameters<typeof authClient.signUp.email>[0]
  );
}
