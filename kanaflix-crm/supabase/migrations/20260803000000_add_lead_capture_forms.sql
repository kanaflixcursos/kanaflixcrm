create table public.lead_forms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 64),
  title text not null check (char_length(title) between 2 and 120),
  description text,
  success_message text not null default 'Recebemos seus dados. Em breve entraremos em contato.',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  fields jsonb not null default '[
    {"key":"full_name","label":"Nome","type":"text","required":true,"placeholder":"Seu nome completo"},
    {"key":"email","label":"E-mail","type":"email","required":true,"placeholder":"voce@empresa.com"},
    {"key":"phone","label":"Telefone","type":"tel","required":true,"placeholder":"(00) 00000-0000"}
  ]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(fields) = 'array'),
  check (jsonb_array_length(fields) between 3 and 12),
  check (
    fields @> '[{"key":"full_name","required":true}]'::jsonb
    and fields @> '[{"key":"email","required":true}]'::jsonb
    and fields @> '[{"key":"phone","required":true}]'::jsonb
  )
);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.lead_forms(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  payload jsonb not null,
  source_url text,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(payload) = 'object')
);

create index lead_forms_organization_id_idx on public.lead_forms(organization_id);
create index lead_forms_status_idx on public.lead_forms(status);
create index form_submissions_organization_id_idx on public.form_submissions(organization_id);
create index form_submissions_form_id_created_at_idx on public.form_submissions(form_id, created_at desc);
create index form_submissions_contact_id_idx on public.form_submissions(contact_id);

alter table public.lead_forms enable row level security;
alter table public.form_submissions enable row level security;

create policy "Current workspace manages lead forms" on public.lead_forms
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));

create policy "Current workspace reads form submissions" on public.form_submissions
  for select using (public.is_current_organization(organization_id));

create policy "Current workspace deletes form submissions" on public.form_submissions
  for delete using (public.is_current_organization(organization_id));

create trigger lead_forms_updated_at before update on public.lead_forms
  for each row execute procedure public.set_updated_at();

create or replace function public.get_public_lead_form(target_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  success_message text,
  brand_color text,
  fields jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    form.id,
    form.slug,
    form.title,
    form.description,
    form.success_message,
    organization.brand_color,
    form.fields
  from public.lead_forms as form
  join public.organizations as organization on organization.id = form.organization_id
  where form.slug = lower(target_slug)
    and form.status = 'published'
  limit 1;
$$;

create or replace function public.submit_public_lead_form(
  target_slug text,
  input_payload jsonb,
  source_url text default null
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
  full_name_value text;
  email_value text;
  phone_value text;
  sanitized_payload jsonb := '{}'::jsonb;
  notes_value text := '';
  new_contact_id uuid;
  new_submission_id uuid;
begin
  if input_payload is null or jsonb_typeof(input_payload) <> 'object' then
    raise exception 'Envie os dados como um objeto JSON.' using errcode = '22023';
  end if;

  if octet_length(input_payload::text) > 20000 then
    raise exception 'Os dados enviados ultrapassam o limite permitido.' using errcode = '22023';
  end if;

  select * into capture_form
  from public.lead_forms
  where slug = lower(target_slug)
    and status = 'published'
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

    if field_key not in ('full_name', 'email', 'phone') and field_value <> '' then
      notes_value := notes_value || case when notes_value = '' then '' else E'\n' end || field_label || ': ' || field_value;
    end if;
  end loop;

  full_name_value := btrim(coalesce(sanitized_payload ->> 'full_name', ''));
  email_value := lower(btrim(coalesce(sanitized_payload ->> 'email', '')));
  phone_value := btrim(coalesce(sanitized_payload ->> 'phone', ''));

  if char_length(full_name_value) < 2 then
    raise exception 'Informe um nome válido.' using errcode = '22023';
  end if;
  if email_value !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Informe um e-mail válido.' using errcode = '22023';
  end if;
  if char_length(regexp_replace(phone_value, '[^0-9]', '', 'g')) < 8 then
    raise exception 'Informe um telefone válido.' using errcode = '22023';
  end if;

  insert into public.contacts (
    owner_id,
    organization_id,
    full_name,
    email,
    phone,
    source,
    notes
  ) values (
    capture_form.created_by,
    capture_form.organization_id,
    full_name_value,
    email_value,
    phone_value,
    'Formulário: ' || capture_form.name,
    nullif(notes_value, '')
  ) returning id into new_contact_id;

  insert into public.form_submissions (
    organization_id,
    form_id,
    contact_id,
    payload,
    source_url
  ) values (
    capture_form.organization_id,
    capture_form.id,
    new_contact_id,
    sanitized_payload,
    nullif(left(btrim(coalesce(source_url, '')), 500), '')
  ) returning id into new_submission_id;

  return jsonb_build_object(
    'success', true,
    'submission_id', new_submission_id,
    'contact_id', new_contact_id,
    'message', capture_form.success_message
  );
end;
$$;

revoke all on function public.get_public_lead_form(text) from public;
revoke all on function public.submit_public_lead_form(text, jsonb, text) from public;
grant execute on function public.get_public_lead_form(text) to anon, authenticated;
grant execute on function public.submit_public_lead_form(text, jsonb, text) to anon, authenticated;
