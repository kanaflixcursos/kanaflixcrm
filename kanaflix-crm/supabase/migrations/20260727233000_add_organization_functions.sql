create or replace function public.switch_organization(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  if not public.is_organization_member(target_organization_id) then
    raise exception 'You are not a member of this organization';
  end if;

  update public.profiles
  set current_organization_id = target_organization_id
  where id = auth.uid();
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

  return new_organization_id;
end;
$$;
