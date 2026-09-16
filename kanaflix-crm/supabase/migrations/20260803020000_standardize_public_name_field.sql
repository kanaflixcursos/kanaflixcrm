do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.lead_forms'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%full_name%'
  loop
    execute format('alter table public.lead_forms drop constraint %I', constraint_name);
  end loop;
end;
$$;

update public.lead_forms
set fields = (
  select jsonb_agg(
    case
      when field ->> 'key' = 'full_name' then jsonb_set(field, '{key}', '"name"'::jsonb)
      else field
    end
    order by position
  )
  from jsonb_array_elements(fields) with ordinality as configured(field, position)
)
where fields @> '[{"key":"full_name"}]'::jsonb;

update public.form_submissions
set payload = (payload - 'full_name') || jsonb_build_object('name', payload -> 'full_name')
where payload ? 'full_name';

alter table public.lead_forms
  alter column fields set default '[
    {"key":"name","label":"Nome","type":"text","required":true,"placeholder":"Seu nome completo"},
    {"key":"email","label":"E-mail","type":"email","required":true,"placeholder":"voce@empresa.com"},
    {"key":"phone","label":"Telefone","type":"tel","required":true,"placeholder":"(00) 00000-0000"}
  ]'::jsonb;

alter table public.lead_forms
  add constraint lead_forms_required_fields_check check (
    fields @> '[{"key":"name","required":true}]'::jsonb
    and fields @> '[{"key":"email","required":true}]'::jsonb
    and fields @> '[{"key":"phone","required":true}]'::jsonb
  );

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
  name_value text;
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

    if field_key not in ('name', 'email', 'phone') and field_value <> '' then
      notes_value := notes_value || case when notes_value = '' then '' else E'\n' end || field_label || ': ' || field_value;
    end if;
  end loop;

  name_value := btrim(coalesce(sanitized_payload ->> 'name', ''));
  email_value := lower(btrim(coalesce(sanitized_payload ->> 'email', '')));
  phone_value := btrim(coalesce(sanitized_payload ->> 'phone', ''));

  if char_length(name_value) < 2 then
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
    name_value,
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
