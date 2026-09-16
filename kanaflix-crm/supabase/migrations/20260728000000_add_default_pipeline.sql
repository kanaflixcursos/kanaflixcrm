create or replace function public.create_default_pipeline(target_organization_id uuid, target_owner_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  default_pipeline_id uuid;
begin
  select id into default_pipeline_id
  from public.pipelines
  where organization_id = target_organization_id
  order by created_at asc
  limit 1;

  if default_pipeline_id is null then
    insert into public.pipelines (organization_id, owner_id, name)
    values (target_organization_id, target_owner_id, 'Vendas')
    returning id into default_pipeline_id;

    insert into public.pipeline_stages (pipeline_id, name, position)
    values
      (default_pipeline_id, 'Novos leads', 0),
      (default_pipeline_id, 'Em conversa', 1),
      (default_pipeline_id, 'Proposta enviada', 2),
      (default_pipeline_id, 'Fechamento', 3);
  end if;

  return default_pipeline_id;
end;
$$;

select public.create_default_pipeline(id, created_by)
from public.organizations;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  organization_name text;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  organization_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), 'Meu espaço');

  insert into public.organizations (id, name, created_by)
  values (new.id, organization_name, new.id);

  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.id, 'owner');

  update public.profiles
  set current_organization_id = new.id
  where id = new.id;

  perform public.create_default_pipeline(new.id, new.id);
  return new;
end;
$$;

create or replace function public.create_organization(organization_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
  clean_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  clean_name := trim(organization_name);

  if char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'Organization name must have between 2 and 80 characters';
  end if;

  insert into public.organizations (name, created_by)
  values (clean_name, auth.uid())
  returning id into new_organization_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_organization_id, auth.uid(), 'owner');

  update public.profiles
  set current_organization_id = new_organization_id
  where id = auth.uid();

  perform public.create_default_pipeline(new_organization_id, auth.uid());
  return new_organization_id;
end;
$$;
