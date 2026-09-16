create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  name text not null,
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  unique (pipeline_id, position)
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  stage_id uuid references public.pipeline_stages(id) on delete set null,
  title text not null,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  expected_close_date date,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  activity_type text not null check (activity_type in ('call', 'email', 'meeting', 'note', 'task')),
  description text not null,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contact_id is not null or deal_id is not null)
);

create index contacts_owner_id_idx on public.contacts(owner_id);
create index contacts_company_id_idx on public.contacts(company_id);
create index companies_owner_id_idx on public.companies(owner_id);
create index deals_owner_id_idx on public.deals(owner_id);
create index deals_stage_id_idx on public.deals(stage_id);
create index activities_owner_id_idx on public.activities(owner_id);
create index activities_due_at_idx on public.activities(due_at) where completed_at is null;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

create policy "Profiles are visible to their owner" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "Profiles are editable by their owner" on public.profiles
  for update using ((select auth.uid()) = id);

create policy "Owners manage companies" on public.companies
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners manage contacts" on public.contacts
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners manage pipelines" on public.pipelines
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners manage pipeline stages" on public.pipeline_stages
  for all using (
    exists (
      select 1 from public.pipelines
      where pipelines.id = pipeline_stages.pipeline_id
        and pipelines.owner_id = (select auth.uid())
    )
  );
create policy "Owners manage deals" on public.deals
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners manage activities" on public.activities
  for all using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger companies_updated_at before update on public.companies
  for each row execute procedure public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts
  for each row execute procedure public.set_updated_at();
create trigger pipelines_updated_at before update on public.pipelines
  for each row execute procedure public.set_updated_at();
create trigger deals_updated_at before update on public.deals
  for each row execute procedure public.set_updated_at();
create trigger activities_updated_at before update on public.activities
  for each row execute procedure public.set_updated_at();
