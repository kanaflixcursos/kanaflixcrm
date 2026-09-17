export const dynamic = "force-dynamic";

export async function GET() {
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasDistributedRateLimit = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

  return Response.json(
    {
      status: hasSupabase ? "ok" : "degraded",
      service: "kanaflix-crm",
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      checks: {
        supabase: hasSupabase ? "configured" : "missing",
        rateLimit: hasDistributedRateLimit ? "upstash" : "memory-fallback",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
