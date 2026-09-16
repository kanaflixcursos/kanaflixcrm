create or replace function public.validate_crm_relationships()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  related_organization_id uuid;
begin
  if tg_table_name = 'contacts' then
    if new.company_id is not null then
      select organization_id into related_organization_id from public.companies where id = new.company_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Contact company must belong to the active workspace';
      end if;
    end if;
  elsif tg_table_name = 'deals' then
    if new.contact_id is not null then
      select organization_id into related_organization_id from public.contacts where id = new.contact_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Deal contact must belong to the active workspace';
      end if;
    end if;
    if new.company_id is not null then
      select organization_id into related_organization_id from public.companies where id = new.company_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Deal company must belong to the active workspace';
      end if;
    end if;
    if new.stage_id is not null then
      select p.organization_id into related_organization_id
      from public.pipeline_stages s
      join public.pipelines p on p.id = s.pipeline_id
      where s.id = new.stage_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Deal stage must belong to the active workspace';
      end if;
    end if;
  elsif tg_table_name = 'activities' then
    if new.contact_id is not null then
      select organization_id into related_organization_id from public.contacts where id = new.contact_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Activity contact must belong to the active workspace';
      end if;
    end if;
    if new.deal_id is not null then
      select organization_id into related_organization_id from public.deals where id = new.deal_id;
      if related_organization_id is distinct from new.organization_id then
        raise exception 'Activity deal must belong to the active workspace';
      end if;
    end if;
  end if;
  return new;
end;
$$;
