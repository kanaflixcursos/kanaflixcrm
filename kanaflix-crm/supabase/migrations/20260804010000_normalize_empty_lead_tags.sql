create or replace function public.normalize_contact_tags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.tags := coalesce(new.tags, '{}'::text[]);
  return new;
end;
$$;

create trigger contacts_normalize_tags
  before insert or update of tags on public.contacts
  for each row execute procedure public.normalize_contact_tags();
