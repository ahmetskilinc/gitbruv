import { normalizeUrl } from "@gitbruv/lib";

export const getApiUrl = () => {
  const isServer = typeof window === "undefined";

  if (isServer) {
    if (process.env.API_URL) {
      return normalizeUrl(process.env.API_URL);
    }
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3001";
    }
    return undefined;
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeUrl(process.env.NEXT_PUBLIC_API_URL);
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3001";
  }

  return undefined;
};
