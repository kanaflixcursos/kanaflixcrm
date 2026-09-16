create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_color text not null default '#FE6731' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.profiles add column current_organization_id uuid references public.organizations(id) on delete set null;
alter table public.companies add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.contacts add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.pipelines add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.deals add column organization_id uuid references public.organizations(id) on delete cascade;
alter table public.activities add column organization_id uuid references public.organizations(id) on delete cascade;

insert into public.organizations (id, name, brand_color, created_by)
select id, coalesce(nullif(full_name, ''), 'Meu espaço'), brand_color, id
from public.profiles;

insert into public.organization_members (organization_id, user_id, role)
select id, id, 'owner'
from public.profiles;

update public.profiles set current_organization_id = id where current_organization_id is null;
update public.companies set organization_id = owner_id where organization_id is null;
update public.contacts set organization_id = owner_id where organization_id is null;
update public.pipelines set organization_id = owner_id where organization_id is null;
update public.deals set organization_id = owner_id where organization_id is null;
update public.activities set organization_id = owner_id where organization_id is null;

alter table public.companies alter column organization_id set not null;
alter table public.contacts alter column organization_id set not null;
alter table public.pipelines alter column organization_id set not null;
alter table public.deals alter column organization_id set not null;
alter table public.activities alter column organization_id set not null;

create index companies_organization_id_idx on public.companies(organization_id);
create index contacts_organization_id_idx on public.contacts(organization_id);
create index pipelines_organization_id_idx on public.pipelines(organization_id);
create index deals_organization_id_idx on public.deals(organization_id);
create index activities_organization_id_idx on public.activities(organization_id);
create index organization_members_user_id_idx on public.organization_members(user_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

drop policy "Profiles are editable by their owner" on public.profiles;
create policy "Profiles are editable by their owner" on public.profiles
  for update using ((select auth.uid()) = id)
  with check (
    (select auth.uid()) = id
    and (
      current_organization_id is null
      or public.is_organization_member(current_organization_id)
    )
  );

create policy "Members can view organizations" on public.organizations
  for select using (public.is_organization_member(id));
create policy "Admins can update organizations" on public.organizations
  for update using (public.is_organization_admin(id))
  with check (public.is_organization_admin(id));
create policy "Members can view organization members" on public.organization_members
  for select using (public.is_organization_member(organization_id));

drop policy "Owners manage companies" on public.companies;
drop policy "Owners manage contacts" on public.contacts;
drop policy "Owners manage pipelines" on public.pipelines;
drop policy "Owners manage pipeline stages" on public.pipeline_stages;
drop policy "Owners manage deals" on public.deals;
drop policy "Owners manage activities" on public.activities;

create policy "Members manage companies" on public.companies
  for all using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy "Members manage contacts" on public.contacts
  for all using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy "Members manage pipelines" on public.pipelines
  for all using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy "Members manage pipeline stages" on public.pipeline_stages
  for all using (
    exists (
      select 1 from public.pipelines
      where pipelines.id = pipeline_stages.pipeline_id
        and public.is_organization_member(pipelines.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.pipelines
      where pipelines.id = pipeline_stages.pipeline_id
        and public.is_organization_member(pipelines.organization_id)
    )
  );
create policy "Members manage deals" on public.deals
  for all using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));
create policy "Members manage activities" on public.activities
  for all using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

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

  return new;
end;
$$;

create trigger organizations_updated_at before update on public.organizations
  for each row execute procedure public.set_updated_at();
