type Bucket = { count: number; resetAt: number };

export type PublicRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  backend: "upstash" | "memory";
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function consumeMemoryRequest(key: string, limit: number, windowMs: number): PublicRateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value ?? key);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: Math.ceil(windowMs / 1000), backend: "memory" };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: current.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    backend: "memory",
  };
}

async function consumeUpstashRequest(key: string, limit: number, windowMs: number): Promise<PublicRateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Upstash não configurado");

  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", `kanaflix:public-rate:${key}`],
        ["EXPIRE", `kanaflix:public-rate:${key}`, windowSeconds],
      ]),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Upstash retornou ${response.status}`);
    const result = (await response.json()) as Array<{ result?: number | string }>;
    const count = Number(result[0]?.result);
    if (!Number.isFinite(count)) throw new Error("Resposta inválida do Upstash");

    return { allowed: count <= limit, retryAfterSeconds: windowSeconds, backend: "upstash" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function consumePublicRequest(key: string, limit = 30, windowMs = 60_000): Promise<PublicRateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await consumeUpstashRequest(key, limit, windowMs);
    } catch {
      // O fallback mantém uma proteção mínima durante indisponibilidade do Redis.
    }
  }

  return consumeMemoryRequest(key, limit, windowMs);
}
