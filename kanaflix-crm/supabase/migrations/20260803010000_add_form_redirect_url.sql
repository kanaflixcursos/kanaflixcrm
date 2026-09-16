alter table public.lead_forms
  add column redirect_url text
  check (
    redirect_url is null
    or (
      char_length(redirect_url) <= 2048
      and redirect_url ~* '^https?://[^[:space:]]+$'
    )
  );

drop function public.get_public_lead_form(text);

create function public.get_public_lead_form(target_slug text)
returns table (
  id uuid,
  slug text,
  title text,
  description text,
  success_message text,
  redirect_url text,
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
    form.redirect_url,
    organization.brand_color,
    form.fields
  from public.lead_forms as form
  join public.organizations as organization on organization.id = form.organization_id
  where form.slug = lower(target_slug)
    and form.status = 'published'
  limit 1;
$$;

revoke all on function public.get_public_lead_form(text) from public;
grant execute on function public.get_public_lead_form(text) to anon, authenticated;
