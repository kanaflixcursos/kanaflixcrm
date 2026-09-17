create or replace function public.is_current_organization_text(target_organization_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return public.is_current_organization(target_organization_id::uuid);
exception when invalid_text_representation then
  return false;
end;
$$;

revoke all on function public.is_current_organization_text(text) from public;
grant execute on function public.is_current_organization_text(text) to authenticated;

drop policy if exists "Users upload their CRM images" on storage.objects;
drop policy if exists "Users update their CRM images" on storage.objects;
drop policy if exists "Users delete their CRM images" on storage.objects;

create policy "Members upload scoped CRM images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'crm-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (
        (storage.foldername(name))[1] = 'workspace'
        and public.is_current_organization_text((storage.foldername(name))[2])
      )
    )
  );

create policy "Members update scoped CRM images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'crm-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (
        (storage.foldername(name))[1] = 'workspace'
        and public.is_current_organization_text((storage.foldername(name))[2])
      )
    )
  )
  with check (
    bucket_id = 'crm-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (
        (storage.foldername(name))[1] = 'workspace'
        and public.is_current_organization_text((storage.foldername(name))[2])
      )
    )
  );

create policy "Members delete scoped CRM images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'crm-images'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (
        (storage.foldername(name))[1] = 'workspace'
        and public.is_current_organization_text((storage.foldername(name))[2])
      )
    )
  );
