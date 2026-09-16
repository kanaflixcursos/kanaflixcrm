alter table public.contacts
  add column status text not null default 'new'
    check (status in ('new', 'reviewing', 'qualified', 'follow_up', 'converted', 'discarded')),
  add column tags text[] not null default '{}'::text[],
  add column discard_reason text,
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_content text,
  add column utm_term text,
  add column landing_page_url text,
  add column referrer_url text,
  add column first_conversion_at timestamptz,
  add column last_conversion_at timestamptz;

create index contacts_status_idx on public.contacts(organization_id, status);
create index contacts_tags_idx on public.contacts using gin(tags);
create index contacts_utm_campaign_idx on public.contacts(organization_id, utm_campaign);
create index contacts_email_lookup_idx on public.contacts(organization_id, lower(email)) where email is not null;
create index contacts_phone_lookup_idx on public.contacts(organization_id, regexp_replace(phone, '[^0-9]', '', 'g')) where phone is not null;

alter table public.lead_forms
  add column campaign_name text,
  add column default_tags text[] not null default '{}'::text[];

alter table public.form_submissions
  add column attribution jsonb not null default '{}'::jsonb
    check (jsonb_typeof(attribution) = 'object');

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  event_name text not null check (event_name ~ '^[a-z][a-z0-9_.-]{2,79}$'),
  source text not null default 'crm',
  properties jsonb not null default '{}'::jsonb check (jsonb_typeof(properties) = 'object'),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index lead_events_organization_id_idx on public.lead_events(organization_id);
create index lead_events_contact_timeline_idx on public.lead_events(contact_id, occurred_at desc);
create index lead_events_name_idx on public.lead_events(organization_id, event_name, occurred_at desc);

alter table public.lead_events enable row level security;
create policy "Current workspace manages lead events" on public.lead_events
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));

create table public.tracking_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('meta_pixel', 'google_tag_manager')),
  external_id text not null check (char_length(external_id) between 3 and 120),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create index tracking_integrations_organization_id_idx on public.tracking_integrations(organization_id);
alter table public.tracking_integrations enable row level security;
create policy "Current workspace manages tracking integrations" on public.tracking_integrations
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));
create trigger tracking_integrations_updated_at before update on public.tracking_integrations
  for each row execute procedure public.set_updated_at();

create or replace function public.record_lead_status_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_events (organization_id, contact_id, event_name, source, properties)
    values (
      new.organization_id,
      new.id,
      'lead.status_changed',
      'crm',
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger contacts_record_status_event
  after update of status on public.contacts
  for each row execute procedure public.record_lead_status_event();

drop function if exists public.submit_public_lead_form(text, jsonb, text);

create function public.submit_public_lead_form(
  target_slug text,
  input_payload jsonb,
  source_url text default null,
  attribution_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  capture_form public.lead_forms%rowtype;
  field_definition jsonb;
  field_key text;
  field_label text;
  field_value text;
  name_value text;
  email_value text;
  phone_value text;
  normalized_phone text;
  sanitized_payload jsonb := '{}'::jsonb;
  sanitized_attribution jsonb := '{}'::jsonb;
  notes_value text := '';
  lead_id uuid;
  new_submission_id uuid;
  is_new_lead boolean := false;
  captured_at timestamptz := now();
  source_value text;
begin
  if input_payload is null or jsonb_typeof(input_payload) <> 'object' then
    raise exception 'Envie os dados como um objeto JSON.' using errcode = '22023';
  end if;
  if attribution_payload is null or jsonb_typeof(attribution_payload) <> 'object' then
    raise exception 'A atribuição deve ser um objeto JSON.' using errcode = '22023';
  end if;
  if octet_length(input_payload::text) > 20000 or octet_length(attribution_payload::text) > 10000 then
    raise exception 'Os dados enviados ultrapassam o limite permitido.' using errcode = '22023';
  end if;

  select * into capture_form
  from public.lead_forms
  where slug = lower(target_slug) and status = 'published'
  limit 1;
  if not found then
    raise exception 'Formulário não encontrado ou indisponível.' using errcode = 'P0002';
  end if;

  for field_definition in select value from jsonb_array_elements(capture_form.fields)
  loop
    field_key := field_definition ->> 'key';
    field_label := coalesce(nullif(field_definition ->> 'label', ''), field_key);
    field_value := left(btrim(coalesce(input_payload ->> field_key, '')), 2000);
    if coalesce((field_definition ->> 'required')::boolean, false) and field_value = '' then
      raise exception 'Preencha o campo obrigatório: %.', field_label using errcode = '22023';
    end if;
    sanitized_payload := sanitized_payload || jsonb_build_object(field_key, field_value);
    if field_key not in ('name', 'email', 'phone') and field_value <> '' then
      notes_value := notes_value || case when notes_value = '' then '' else E'\n' end || field_label || ': ' || field_value;
    end if;
  end loop;

  name_value := btrim(coalesce(sanitized_payload ->> 'name', ''));
  email_value := lower(btrim(coalesce(sanitized_payload ->> 'email', '')));
  phone_value := btrim(coalesce(sanitized_payload ->> 'phone', ''));
  normalized_phone := regexp_replace(phone_value, '[^0-9]', '', 'g');

  if char_length(name_value) < 2 then raise exception 'Informe um nome válido.' using errcode = '22023'; end if;
  if email_value !~* '^[A-Z0-9._%+-]+\.[A-Z0-9._%+-]*@[A-Z0-9.-]+\.[A-Z]{2,}$'
     and email_value !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Informe um e-mail válido.' using errcode = '22023';
  end if;
  if char_length(normalized_phone) < 8 then raise exception 'Informe um telefone válido.' using errcode = '22023'; end if;

  sanitized_attribution := jsonb_strip_nulls(jsonb_build_object(
    'utm_source', nullif(left(btrim(coalesce(attribution_payload ->> 'utm_source', '')), 200), ''),
    'utm_medium', nullif(left(btrim(coalesce(attribution_payload ->> 'utm_medium', '')), 200), ''),
    'utm_campaign', nullif(left(btrim(coalesce(attribution_payload ->> 'utm_campaign', capture_form.campaign_name, '')), 300), ''),
    'utm_content', nullif(left(btrim(coalesce(attribution_payload ->> 'utm_content', '')), 300), ''),
    'utm_term', nullif(left(btrim(coalesce(attribution_payload ->> 'utm_term', '')), 300), ''),
    'landing_page_url', nullif(left(btrim(coalesce(attribution_payload ->> 'landing_page_url', source_url, '')), 1000), ''),
    'referrer_url', nullif(left(btrim(coalesce(attribution_payload ->> 'referrer_url', '')), 1000), ''),
    'client_id', nullif(left(btrim(coalesce(attribution_payload ->> 'client_id', '')), 200), '')
  ));

  source_value := coalesce(
    nullif(sanitized_attribution ->> 'utm_source', ''),
    'Formulário: ' || capture_form.name
  );

  select id into lead_id
  from public.contacts
  where organization_id = capture_form.organization_id
    and (
      (email is not null and lower(email) = email_value)
      or (phone is not null and regexp_replace(phone, '[^0-9]', '', 'g') = normalized_phone)
    )
  order by case when email is not null and lower(email) = email_value then 0 else 1 end, created_at
  limit 1;

  if lead_id is null then
    is_new_lead := true;
    insert into public.contacts (
      owner_id, organization_id, full_name, email, phone, source, notes, status, tags,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      landing_page_url, referrer_url, first_conversion_at, last_conversion_at
    ) values (
      capture_form.created_by, capture_form.organization_id, name_value, email_value, phone_value,
      source_value, nullif(notes_value, ''), 'new', capture_form.default_tags,
      sanitized_attribution ->> 'utm_source', sanitized_attribution ->> 'utm_medium',
      sanitized_attribution ->> 'utm_campaign', sanitized_attribution ->> 'utm_content',
      sanitized_attribution ->> 'utm_term', sanitized_attribution ->> 'landing_page_url',
      sanitized_attribution ->> 'referrer_url', captured_at, captured_at
    ) returning id into lead_id;
  else
    update public.contacts
    set
      full_name = case when char_length(full_name) < 2 then name_value else full_name end,
      email = coalesce(email, email_value),
      phone = coalesce(phone, phone_value),
      notes = case when nullif(notes_value, '') is null then notes when notes is null then notes_value else notes || E'\n' || notes_value end,
      status = case when status = 'discarded' then 'new' else status end,
      tags = coalesce((select array_agg(distinct tag) from unnest(tags || capture_form.default_tags) as tag), '{}'::text[]),
      last_conversion_at = captured_at,
      updated_at = captured_at
    where id = lead_id;
  end if;

  insert into public.form_submissions (organization_id, form_id, contact_id, payload, source_url, attribution)
  values (
    capture_form.organization_id, capture_form.id, lead_id, sanitized_payload,
    nullif(left(btrim(coalesce(source_url, '')), 500), ''), sanitized_attribution
  ) returning id into new_submission_id;

  insert into public.lead_events (organization_id, contact_id, event_name, source, properties, occurred_at)
  values (
    capture_form.organization_id,
    lead_id,
    'lead.captured',
    'form',
    jsonb_build_object(
      'form_id', capture_form.id,
      'form_name', capture_form.name,
      'submission_id', new_submission_id,
      'is_new_lead', is_new_lead,
      'attribution', sanitized_attribution
    ),
    captured_at
  );

  return jsonb_build_object(
    'success', true,
    'submission_id', new_submission_id,
    'contact_id', lead_id,
    'is_new_lead', is_new_lead,
    'message', capture_form.success_message
  );
end;
$$;
