import { Redis } from "@upstash/redis";

const SOURCE_TTL_SECONDS = 60 * 60;

function sourceRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function storeAiSourceText(input: {
  userId: string;
  documentId: string;
  text: string;
}) {
  const redis = sourceRedis();
  if (!redis) throw new Error("source_store_unavailable");
  await redis.set(`ai-source:${input.userId}:${input.documentId}`, input.text, { ex: SOURCE_TTL_SECONDS });
}

export async function getAiSourceText(userId: string, documentId: string) {
  const redis = sourceRedis();
  if (!redis) return null;
  return redis.get<string>(`ai-source:${userId}:${documentId}`);
}
