import { createPublicClient } from "@/lib/supabase/public";
import type { LeadFormField } from "@/lib/lead-forms";
import { consumePublicRequest } from "@/lib/public-rate-limit";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, X-Requested-With, X-Page-Url, X-Client-Id",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"] as const;

function normalizeKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function unwrapExternalPayload(payload: Record<string, unknown>) {
  for (const wrapper of ["data", "fields", "formData", "form_data", "submission"]) {
    const nested = payload[wrapper];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) return { ...payload, ...(nested as Record<string, unknown>) };
  }
  return payload;
}

function normalizeFormPayload(payload: Record<string, unknown>, fields: LeadFormField[]) {
  const entries = Object.entries(payload);
  const indexed = new Map(entries.map(([key, value]) => [normalizeKey(key), value]));
  const aliases: Record<string, string[]> = {
    name: ["name", "nome", "fullname", "full_name", "nomecompleto"],
    email: ["email", "e-mail", "mail", "correioeletronico"],
    phone: ["phone", "telefone", "tel", "celular", "whatsapp", "mobile"],
  };
  const normalized = { ...payload };

  for (const field of fields) {
    if (normalized[field.key] !== undefined && normalized[field.key] !== null && normalized[field.key] !== "") continue;
    const candidates = [field.key, field.label, ...(aliases[field.key] ?? [])];
    const value = candidates.map((candidate) => indexed.get(normalizeKey(candidate))).find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
    if (value !== undefined) normalized[field.key] = value;
  }
  return normalized;
}

function takeAttribution(payload: Record<string, unknown>, request: Request) {
  const attribution: Record<string, string> = {};
  for (const key of attributionKeys) {
    const value = payload[`_${key}`] ?? payload[key];
    if (typeof value === "string" && value.trim()) attribution[key] = value.trim();
    delete payload[`_${key}`];
    delete payload[key];
  }

  const landingPage = payload._landing_page_url ?? request.headers.get("x-page-url");
  const referrer = payload._referrer_url ?? request.headers.get("referer");
  const clientId = payload._client_id ?? request.headers.get("x-client-id");
  if (typeof landingPage === "string" && landingPage.trim()) attribution.landing_page_url = landingPage.trim();
  if (typeof referrer === "string" && referrer.trim()) attribution.referrer_url = referrer.trim();
  if (typeof clientId === "string" && clientId.trim()) attribution.client_id = clientId.trim();
  delete payload._landing_page_url;
  delete payload._referrer_url;
  delete payload._client_id;
  return attribution;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

function html(message: string, status: number) {
  const safeMessage = message.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kanaflix CRM</title><style>body{margin:0;padding:32px;background:#f4f4f3;color:#171716;font:16px system-ui,sans-serif}.box{max-width:560px;margin:10vh auto;padding:28px;border:1px solid #e0e0dd;border-radius:24px;background:#fff}p{line-height:1.6}</style></head><body><main class="box"><h1>Não foi possível enviar</h1><p>${safeMessage}</p><button onclick="history.back()">Voltar</button></main></body></html>`, { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

function wantsHtml(request: Request) {
  return request.headers.get("accept")?.toLowerCase().includes("text/html") ?? false;
}

function errorResponse(request: Request, message: string, status: number) {
  return wantsHtml(request) ? html(message, status) : json({ error: message }, status);
}

function normalizedOrigin(value: string | null) {
  if (!value) return null;
  try { return new URL(value).origin; } catch { return null; }
}

async function readPayload(request: Request): Promise<Record<string, unknown>> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

  if (contentType.includes("application/json")) {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("invalid");
    return body as Record<string, unknown>;
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries([...formData.entries()].filter((entry): entry is [string, string] => typeof entry[1] === "string"));
  }

  const body = await request.text();
  if (!body.trim()) return {};

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(body));
  }

  if (contentType.includes("text/plain")) {
    return Object.fromEntries(body.split(/\r?\n/).map((line) => line.split(/[:=]([\s\S]*)/)).filter(([key, value]) => key?.trim() && value !== undefined).map(([key, value]) => [key.trim(), value.trim()]));
  }

  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    return parsed as Record<string, unknown>;
  } catch {
    return body.includes("&")
      ? Object.fromEntries(new URLSearchParams(body))
      : Object.fromEntries(body.split(/\r?\n/).map((line) => line.split(/[:=]([\s\S]*)/)).filter(([key, value]) => key?.trim() && value !== undefined).map(([key, value]) => [key.trim(), value.trim()]));
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(_request: Request, { params }: RouteContext<"/api/forms/[slug]/submit">) {
  const { slug } = await params;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_public_lead_form", { target_slug: slug });
  const form = data?.[0];
  if (error || !form) return json({ error: "Formulário não encontrado ou indisponível." }, 404);
  return json({ slug: form.slug, title: form.title, fields: form.fields, redirect_url: form.redirect_url });
}

export async function POST(request: Request, { params }: RouteContext<"/api/forms/[slug]/submit">) {
  const { slug } = await params;
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const rate = await consumePublicRequest(`form:${slug}:${clientIp}`);
  if (!rate.allowed) {
    return new Response(JSON.stringify({ error: "Muitas tentativas. Aguarde alguns segundos e tente novamente." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(rate.retryAfterSeconds) },
    });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 25000) return errorResponse(request, "Os dados enviados ultrapassam o limite permitido.", 413);

  let payload: Record<string, unknown>;
  try {
    payload = unwrapExternalPayload(await readPayload(request));
  } catch {
    return errorResponse(request, "Envie JSON, multipart/form-data, dados de formulário ou texto em formato chave=valor.", 400);
  }

  if (String(payload._company_website ?? "").trim()) return wantsHtml(request) ? new Response(null, { status: 303, headers: { ...corsHeaders, Location: request.headers.get("referer") ?? "/" } }) : json({ success: true });
  delete payload._company_website;

  // Compatibilidade com integrações antigas; a documentação oficial permanece `name`.
  if (!payload.name && payload.full_name) payload.name = payload.full_name;
  delete payload.full_name;
  const attribution = takeAttribution(payload, request);

  const supabase = createPublicClient();
  const { data: formData, error: formError } = await supabase.rpc("get_public_lead_form", { target_slug: slug });
  const form = formData?.[0];
  if (formError || !form) return errorResponse(request, "Formulário não encontrado ou indisponível.", 404);
  const requestOrigin = normalizedOrigin(request.headers.get("origin"));
  const allowedOrigins = Array.isArray(form.allowed_origins) ? form.allowed_origins : [];
  if (requestOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(requestOrigin)) {
    return errorResponse(request, "Esta origem não está autorizada para enviar este formulário.", 403);
  }
  payload = normalizeFormPayload(payload, Array.isArray(form.fields) ? form.fields as LeadFormField[] : []);

  const { data, error } = await supabase.rpc("submit_public_lead_form", {
    target_slug: slug,
    input_payload: payload,
    source_url: attribution.landing_page_url ?? request.headers.get("origin") ?? request.headers.get("referer"),
    attribution_payload: attribution,
  });

  if (error) {
    if (error.code === "P0002") return errorResponse(request, "Formulário não encontrado ou indisponível.", 404);
    if (error.code === "22023") return errorResponse(request, error.message, 422);
    return errorResponse(request, process.env.NODE_ENV === "development" ? error.message : "Não foi possível registrar os dados agora.", 500);
  }

  if (wantsHtml(request)) {
    const destination = form.redirect_url || new URL(`/f/${slug}?submitted=1`, request.url).toString();
    return new Response(null, { status: 303, headers: { ...corsHeaders, Location: destination } });
  }

  return json(data, 200);
}
