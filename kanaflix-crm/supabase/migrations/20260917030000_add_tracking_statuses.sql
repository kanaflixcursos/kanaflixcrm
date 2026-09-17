alter table public.tracking_integrations drop constraint if exists tracking_integrations_status_check;
alter table public.tracking_integrations add constraint tracking_integrations_status_check check (status in ('draft', 'configured', 'active', 'paused'));
