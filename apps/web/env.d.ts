/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Client-side environment variables
  readonly VITE_RAILWAY_PUBLIC_DOMAIN: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Server-side environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly DATABASE_URL: string;
      readonly CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_DB: string;
      readonly R2_ACCESS_KEY_ID: string;
      readonly R2_SECRET_ACCESS_KEY: string;
      readonly R2_BUCKET_NAME: string;
      readonly R2_ENRAILWAY_PUBLIC_DOMAINDPOINT: string;
      readonly API_URL: string;
      readonly NODE_ENV: "development" | "production" | "test";
    }
  }
}

export {};
