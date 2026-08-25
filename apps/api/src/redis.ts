import { createClient, type RedisClientType } from "redis";
import { config } from "./config";

let redis: RedisClientType | null = null;

export const getRedis = async (): Promise<RedisClientType | null> => {
  if (!config.redisUrl) {
    return null;
  }

  if (redis) {
    return redis;
  }

  const client = createClient({
    url: config.redisUrl,
  });

  // node-redis emits 'error' on socket drops even after a successful connect.
  // Without a listener an unhandled 'error' event throws and can crash the
  // process, so always attach one. The client auto-reconnects on its own.
  client.on("error", (error) => {
    console.error(
      "[API] Redis client error:",
      error instanceof Error ? error.message : "Unknown error"
    );
  });

  try {
    await client.connect();
    redis = client;
  } catch (error) {
    console.error("[API] Failed to connect to Redis:", error instanceof Error ? error.message : "Unknown error");
    // Leave redis null so a later call retries the connection instead of being
    // permanently disabled after one transient boot-time failure.
    redis = null;
  }

  return redis;
};

export const initRedis = async (): Promise<RedisClientType> => {
  if (!config.redisUrl) {
    throw new Error("REDIS_URL is not configured");
  }

  const client = await getRedis();
  if (!client) {
    throw new Error("Failed to connect to Redis");
  }

  return client;
};

export const CACHE_TTL = {
  session: 60 * 60,
  gitObject: 60 * 60 * 24,
  refs: 60 * 5,
  tree: 60 * 30,
  file: 60 * 60,
} as const;
