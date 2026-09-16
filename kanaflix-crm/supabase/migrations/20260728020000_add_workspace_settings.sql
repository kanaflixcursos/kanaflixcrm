alter table public.profiles add column if not exists avatar_url text;
alter table public.organizations add column if not exists logo_url text;

create or replace function public.update_workspace_settings(workspace_name text, workspace_logo_url text default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare clean_name text := trim(workspace_name);
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 80 then raise exception 'Workspace name must have between 2 and 80 characters'; end if;
  update public.organizations set name = clean_name, logo_url = nullif(trim(workspace_logo_url), '')
  where id = (select current_organization_id from public.profiles where id = auth.uid())
    and public.is_organization_admin(id);
  if not found then raise exception 'Only workspace owners and admins can update these settings'; end if;
end;
$$;

create or replace function public.add_workspace_member(member_email text, member_role text default 'member')
returns void
language plpgsql security definer set search_path = public
as $$
declare target_org uuid; target_user uuid; clean_role text := lower(trim(member_role));
begin
  select current_organization_id into target_org from public.profiles where id = auth.uid();
  if target_org is null or not public.is_organization_admin(target_org) then raise exception 'Only workspace owners and admins can manage members'; end if;
  if clean_role not in ('admin', 'member') then raise exception 'Invalid member role'; end if;
  select id into target_user from auth.users where lower(email) = lower(trim(member_email));
  if target_user is null then raise exception 'This email must register in Kanaflix CRM before joining a workspace'; end if;
  insert into public.organization_members (organization_id, user_id, role) values (target_org, target_user, clean_role)
  on conflict (organization_id, user_id) do update set role = excluded.role;
end;
$$;

create or replace function public.remove_workspace_member(target_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare target_org uuid;
begin
  select current_organization_id into target_org from public.profiles where id = auth.uid();
  if target_org is null or not public.is_organization_admin(target_org) then raise exception 'Only workspace owners and admins can manage members'; end if;
  if target_user_id = auth.uid() then raise exception 'You cannot remove yourself'; end if;
  if exists (select 1 from public.organization_members where organization_id = target_org and user_id = target_user_id and role = 'owner') then raise exception 'Transfer ownership before removing the owner'; end if;
  delete from public.organization_members where organization_id = target_org and user_id = target_user_id;
end;
$$;

create or replace function public.transfer_workspace_ownership(target_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare target_org uuid;
begin
  select current_organization_id into target_org from public.profiles where id = auth.uid();
  if target_org is null or not exists (select 1 from public.organization_members where organization_id = target_org and user_id = auth.uid() and role = 'owner') then raise exception 'Only the workspace owner can transfer ownership'; end if;
  if not exists (select 1 from public.organization_members where organization_id = target_org and user_id = target_user_id) then raise exception 'The new owner must already be a workspace member'; end if;
  update public.organization_members set role = 'admin' where organization_id = target_org and user_id = auth.uid();
  update public.organization_members set role = 'owner' where organization_id = target_org and user_id = target_user_id;
  update public.organizations set created_by = target_user_id where id = target_org;
end;
$$;
