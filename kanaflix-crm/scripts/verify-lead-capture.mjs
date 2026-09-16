import crypto from "node:crypto";
import fs from "node:fs";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!accessToken) throw new Error("Defina SUPABASE_ACCESS_TOKEN para executar a verificação de captura.");

const projectRef = fs.readFileSync("supabase/.temp/project-ref", "utf8").trim();
const previewUrl = (process.env.PREVIEW_URL ?? "http://localhost:8081").replace(/\/$/, "");
const userId = crypto.randomUUID();
const formId = crypto.randomUUID();
const slug = `qa-capture-${crypto.randomBytes(5).toString("hex")}`;
const email = `${slug}@kanaflixcrm.test`;

async function queryDatabase(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message ?? "Falha ao consultar o banco de teste.");
  return payload;
}

try {
  await queryDatabase(`
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
    values ('${userId}', gen_random_uuid(), 'authenticated', 'authenticated', '${email}', 'not-used', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"QA Lead Capture"}', now(), now(), false, false);
    insert into public.lead_automation_rules (organization_id, name, trigger_type, trigger_value, set_status, add_tags)
    values ('${userId}', 'QA campanha qualificada', 'utm_campaign', 'qa-campaign', 'qualified', array['automated']);
    insert into public.lead_forms (id, organization_id, created_by, name, slug, title, redirect_url, status, campaign_name, default_tags)
    values ('${formId}', '${userId}', '${userId}', 'QA endpoint', '${slug}', 'Formulário sintético', 'https://qa.kanaflix.test/obrigado', 'published', 'qa-default-campaign', array['qa-form', 'inbound']);
    update public.lead_forms
    set fields = fields || jsonb_build_array(jsonb_build_object('key', 'custom_origin', 'label', 'Como conheceu o Kanaflix?', 'type', 'text', 'required', false, 'placeholder', ''))
    where id = '${formId}';
  `);

  const schemaResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`);
  if (!schemaResponse.ok) throw new Error(`O endpoint de configuração respondeu ${schemaResponse.status}.`);
  const schema = await schemaResponse.json();
  if (schema.slug !== slug || schema.fields?.length < 3 || schema.redirect_url !== "https://qa.kanaflix.test/obrigado") throw new Error("O endpoint não retornou a configuração publicada.");

  const invalidResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "QA inválido" }),
  });
  if (invalidResponse.status !== 422) throw new Error(`A validação obrigatória respondeu ${invalidResponse.status}, esperado 422.`);

  const framerResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Framer-Webhook-Submission-Id": crypto.randomUUID() },
    body: JSON.stringify({ data: { Nome: "QA Framer", "E-mail": "qa-framer@endpoint.test", Telefone: "11555555555", "Como conheceu o Kanaflix?": "Google" } }),
  });
  if (framerResponse.status !== 200) throw new Error(`O webhook no formato do Framer respondeu ${framerResponse.status}: ${await framerResponse.text()}`);

  const submissionResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://qa.kanaflix.test", "X-Page-Url": "https://qa.kanaflix.test/landing?utm_source=meta" },
    body: JSON.stringify({ name: "QA Lead Endpoint", email: "qa-lead@endpoint.test", phone: "11999999999", utm_source: "meta", utm_medium: "paid_social", utm_campaign: "qa-campaign", fbclid: "qa-meta-click", gclid: "qa-google-click" }),
  });
  const submission = await submissionResponse.json();
  if (submissionResponse.status !== 200 || !submission.success) throw new Error(submission.error ?? `A captura respondeu ${submissionResponse.status}.`);

  const duplicateResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "QA Lead Endpoint novamente", email: "qa-lead@endpoint.test", phone: "11999999999", utm_source: "google", utm_campaign: "qa-return" }),
  });
  const duplicate = await duplicateResponse.json();
  if (duplicateResponse.status !== 200 || duplicate.contact_id !== submission.contact_id || duplicate.is_new_lead !== false) throw new Error(`A deduplicação não reutilizou o lead existente: ${duplicateResponse.status} ${JSON.stringify(duplicate)}`);

  const urlEncodedResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ name: "QA URL Encoded", email: "qa-urlencoded@endpoint.test", phone: "11888888888" }),
  });
  if (urlEncodedResponse.status !== 200) throw new Error(`O envio URL encoded respondeu ${urlEncodedResponse.status}.`);

  const htmlFormResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "text/html" },
    body: new URLSearchParams({ name: "QA HTML Form", email: "qa-html@endpoint.test", phone: "11777777777" }),
    redirect: "manual",
  });
  if (htmlFormResponse.status !== 303 || htmlFormResponse.headers.get("location") !== "https://qa.kanaflix.test/obrigado") throw new Error("O formulário HTML nativo não recebeu o redirecionamento configurado.");

  const plainTextResponse = await fetch(`${previewUrl}/api/forms/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "name=QA Plain Text\nemail=qa-plain@endpoint.test\nphone=11666666666",
  });
  if (plainTextResponse.status !== 200) throw new Error(`O envio text/plain respondeu ${plainTextResponse.status}.`);

  const verification = await queryDatabase(`
    select
      exists (select 1 from public.contacts where id = '${submission.contact_id}' and organization_id = '${userId}' and source = 'meta' and status = 'qualified' and utm_campaign = 'qa-campaign' and fbclid = 'qa-meta-click' and gclid = 'qa-google-click' and tags @> array['qa-form', 'inbound', 'automated']) as contact_isolated,
      exists (select 1 from public.form_submissions where id = '${submission.submission_id}' and organization_id = '${userId}' and form_id = '${formId}' and attribution ->> 'utm_source' = 'meta' and attribution ->> 'utm_campaign' = 'qa-campaign' and attribution ->> 'fbclid' = 'qa-meta-click' and attribution ->> 'gclid' = 'qa-google-click') as submission_isolated,
      exists (select 1 from public.contacts where organization_id = '${userId}' and email = 'qa-urlencoded@endpoint.test' and utm_campaign = 'qa-default-campaign' and tags @> array['qa-form', 'inbound']) as form_defaults_applied,
      exists (select 1 from public.contacts where organization_id = '${userId}' and email = 'qa-framer@endpoint.test' and full_name = 'QA Framer' and notes like '%Como conheceu o Kanaflix?: Google%') as framer_payload_accepted,
      (select count(*) = 1 from public.contacts where organization_id = '${userId}' and email = 'qa-lead@endpoint.test') as duplicate_merged,
      (select count(*) = 2 from public.lead_events where organization_id = '${userId}' and contact_id = '${submission.contact_id}' and event_name = 'lead.captured') as capture_events_recorded,
      exists (select 1 from public.lead_events where organization_id = '${userId}' and contact_id = '${submission.contact_id}' and event_name = 'lead.automation_applied' and properties ->> 'rule_name' = 'QA campanha qualificada') as automation_recorded;
  `);
  if (!verification[0]?.contact_isolated || !verification[0]?.submission_isolated || !verification[0]?.form_defaults_applied || !verification[0]?.framer_payload_accepted || !verification[0]?.duplicate_merged || !verification[0]?.capture_events_recorded || !verification[0]?.automation_recorded) throw new Error("A captura, compatibilidade com Framer, atribuição, automação, tags ou deduplicação não ficou correta no workspace de teste.");

  const publicPage = await fetch(`${previewUrl}/f/${slug}`);
  if (!publicPage.ok || !(await publicPage.text()).includes("Formulário sintético")) throw new Error("A página pública do formulário não foi renderizada.");

  const embedPage = await fetch(`${previewUrl}/f/${slug}?embed=1`);
  const embedHtml = await embedPage.text();
  if (!embedPage.ok || !embedHtml.includes("public-form-embed") || embedHtml.includes("Formulário seguro por Kanaflix CRM")) throw new Error("O modo de iframe transparente não foi renderizado corretamente.");

  const attributionHelper = await fetch(`${previewUrl}/kanaflix-attribution.js`);
  const attributionHelperCode = await attributionHelper.text();
  if (!attributionHelper.ok || !attributionHelperCode.includes("kanaflix:attribution") || !attributionHelperCode.includes("fbclid")) throw new Error("O helper automático de atribuição não foi publicado corretamente.");

  console.log("Captura validada: atribuição, deduplicação, eventos, JSON, URL encoded, text/plain, redirecionamento e iframe passaram.");
} finally {
  await queryDatabase(`
    delete from public.organizations where id = '${userId}';
    delete from auth.users where id = '${userId}';
  `).catch((error) => console.error(`Falha ao limpar os dados sintéticos: ${error.message}`));
}
