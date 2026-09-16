insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crm-images', 'crm-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Users upload their CRM images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'crm-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users update their CRM images" on storage.objects
  for update to authenticated
  using (bucket_id = 'crm-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Users delete their CRM images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'crm-images' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "Public CRM images are viewable" on storage.objects
  for select using (bucket_id = 'crm-images');
