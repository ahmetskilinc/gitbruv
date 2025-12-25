import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getPublicServerUrl = () => {
  if (import.meta.env.VITE_PUBLIC_ENV === "production" || import.meta.env.NODE_ENV === "production") {
    return `https://${import.meta.env.VITE_RAILWAY_PUBLIC_DOMAIN}`;
  } else {
    return `http://localhost:3000`;
  }
};

export const getApiUrl = () => {
  if (import.meta.env.VITE_PUBLIC_ENV === "production" || import.meta.env.NODE_ENV === "production") {
    return `https://${import.meta.env.VITE_PUBLIC_API_URL}`;
  } else {
    return `http://localhost:3001`;
  }
};

export const getGitUrl = () => {
  const workerUrl = getApiUrl();
  if (workerUrl) {
    return workerUrl;
  }
  const baseUrl = getPublicServerUrl();
  return `${baseUrl}/api/git`;
};
