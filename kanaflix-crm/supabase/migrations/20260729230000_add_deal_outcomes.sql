alter table public.deals
  add column outcome text not null default 'open'
  check (outcome in ('open', 'won', 'lost'));

create index deals_organization_outcome_idx on public.deals (organization_id, outcome);
