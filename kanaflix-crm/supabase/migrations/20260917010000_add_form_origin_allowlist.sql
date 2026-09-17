alter table public.lead_forms
  add column if not exists allowed_origins text[] not null default '{}'::text[];

drop function if exists public.get_public_lead_form(text);

create function public.get_public_lead_form(target_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  success_message text,
  redirect_url text,
  brand_color text,
  fields jsonb,
  allowed_origins text[]
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
    form.redirect_url,
    organization.brand_color,
    form.fields,
    form.allowed_origins
  from public.lead_forms as form
  join public.organizations as organization on organization.id = form.organization_id
  where form.slug = lower(target_slug)
    and form.status = 'published'
  limit 1;
$$;

revoke all on function public.get_public_lead_form(text) from public;
grant execute on function public.get_public_lead_form(text) to anon, authenticated;
