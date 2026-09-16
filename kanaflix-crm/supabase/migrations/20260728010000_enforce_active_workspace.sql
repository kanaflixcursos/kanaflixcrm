create or replace function public.is_current_organization(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and current_organization_id = target_organization_id
  );
$$;

drop policy "Members manage companies" on public.companies;
drop policy "Members manage contacts" on public.contacts;
drop policy "Members manage pipelines" on public.pipelines;
drop policy "Members manage pipeline stages" on public.pipeline_stages;
drop policy "Members manage deals" on public.deals;
drop policy "Members manage activities" on public.activities;

create policy "Current workspace manages companies" on public.companies
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));
create policy "Current workspace manages contacts" on public.contacts
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));
create policy "Current workspace manages pipelines" on public.pipelines
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));
create policy "Current workspace manages pipeline stages" on public.pipeline_stages
  for all using (
    exists (
      select 1 from public.pipelines
      where pipelines.id = pipeline_stages.pipeline_id
        and public.is_current_organization(pipelines.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.pipelines
      where pipelines.id = pipeline_stages.pipeline_id
        and public.is_current_organization(pipelines.organization_id)
    )
  );
create policy "Current workspace manages deals" on public.deals
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));
create policy "Current workspace manages activities" on public.activities
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));

create or replace function public.validate_crm_relationships()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  related_organization_id uuid;
begin
  if tg_table_name = 'contacts' and new.company_id is not null then
    select organization_id into related_organization_id from public.companies where id = new.company_id;
    if related_organization_id is distinct from new.organization_id then
      raise exception 'Contact company must belong to the active workspace';
    end if;
  end if;

  if tg_table_name = 'deals' then
    if new.contact_id is not null then
      select organization_id into related_organization_id from public.contacts where id = new.contact_id;
      if related_organization_id is distinct from new.organization_id then raise exception 'Deal contact must belong to the active workspace'; end if;
    end if;
    if new.company_id is not null then
      select organization_id into related_organization_id from public.companies where id = new.company_id;
      if related_organization_id is distinct from new.organization_id then raise exception 'Deal company must belong to the active workspace'; end if;
    end if;
    if new.stage_id is not null then
      select p.organization_id into related_organization_id from public.pipeline_stages s join public.pipelines p on p.id = s.pipeline_id where s.id = new.stage_id;
      if related_organization_id is distinct from new.organization_id then raise exception 'Deal stage must belong to the active workspace'; end if;
    end if;
  end if;

  if tg_table_name = 'activities' then
    if new.contact_id is not null then
      select organization_id into related_organization_id from public.contacts where id = new.contact_id;
      if related_organization_id is distinct from new.organization_id then raise exception 'Activity contact must belong to the active workspace'; end if;
    end if;
    if new.deal_id is not null then
      select organization_id into related_organization_id from public.deals where id = new.deal_id;
      if related_organization_id is distinct from new.organization_id then raise exception 'Activity deal must belong to the active workspace'; end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger contacts_validate_relationships before insert or update on public.contacts for each row execute procedure public.validate_crm_relationships();
create trigger deals_validate_relationships before insert or update on public.deals for each row execute procedure public.validate_crm_relationships();
create trigger activities_validate_relationships before insert or update on public.activities for each row execute procedure public.validate_crm_relationships();
