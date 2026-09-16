create table public.lead_automation_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  trigger_type text not null check (trigger_type in ('form', 'utm_source', 'utm_campaign')),
  trigger_value text not null check (char_length(trigger_value) between 1 and 300),
  set_status text check (set_status in ('new', 'reviewing', 'qualified', 'follow_up', 'converted', 'discarded')),
  add_tags text[] not null default '{}'::text[],
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (set_status is not null or cardinality(add_tags) > 0)
);

create index lead_automation_rules_workspace_idx
  on public.lead_automation_rules(organization_id, enabled);

alter table public.lead_automation_rules enable row level security;
create policy "Current workspace manages lead automation rules" on public.lead_automation_rules
  for all using (public.is_current_organization(organization_id))
  with check (public.is_current_organization(organization_id));

create trigger lead_automation_rules_updated_at
  before update on public.lead_automation_rules
  for each row execute procedure public.set_updated_at();

create or replace function public.apply_lead_capture_automations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rule public.lead_automation_rules%rowtype;
  captured_form_id text := new.properties ->> 'form_id';
  captured_source text := new.properties #>> '{attribution,utm_source}';
  captured_campaign text := new.properties #>> '{attribution,utm_campaign}';
begin
  if new.event_name <> 'lead.captured' then return new; end if;

  for rule in
    select *
    from public.lead_automation_rules
    where organization_id = new.organization_id
      and enabled
      and (
        (trigger_type = 'form' and trigger_value = captured_form_id)
        or (trigger_type = 'utm_source' and lower(trigger_value) = lower(coalesce(captured_source, '')))
        or (trigger_type = 'utm_campaign' and lower(trigger_value) = lower(coalesce(captured_campaign, '')))
      )
    order by created_at, id
  loop
    update public.contacts
    set
      status = coalesce(rule.set_status, status),
      tags = coalesce((select array_agg(distinct tag) from unnest(tags || rule.add_tags) as tag), '{}'::text[]),
      updated_at = now()
    where id = new.contact_id
      and organization_id = new.organization_id;

    insert into public.lead_events (organization_id, contact_id, event_name, source, properties)
    values (
      new.organization_id,
      new.contact_id,
      'lead.automation_applied',
      'automation',
      jsonb_build_object(
        'rule_id', rule.id,
        'rule_name', rule.name,
        'set_status', rule.set_status,
        'add_tags', rule.add_tags
      )
    );
  end loop;
  return new;
end;
$$;

create trigger lead_events_apply_capture_automations
  after insert on public.lead_events
  for each row execute procedure public.apply_lead_capture_automations();
