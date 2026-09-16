-- Executar pela Management API em uma transação. Nada é persistido: termina em ROLLBACK.
begin;

create temp table qa_results (test text primary key, passed boolean not null) on commit drop;
grant all on qa_results to authenticated;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous)
values
  ('ea77c426-8d0e-4aa0-a1c5-0000000000a1', gen_random_uuid(), 'authenticated', 'authenticated', 'qa-multitenant-a@kanaflixcrm.test', 'not-used', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"QA Tenant A"}', now(), now(), false, false),
  ('ea77c426-8d0e-4aa0-a1c5-0000000000b2', gen_random_uuid(), 'authenticated', 'authenticated', 'qa-multitenant-b@kanaflixcrm.test', 'not-used', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"QA Tenant B"}', now(), now(), false, false);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', true);
insert into public.companies (id, owner_id, organization_id, name)
values ('ea77c426-8d0e-4aa0-a1c5-000000000101', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'QA Company A');
insert into public.contacts (id, owner_id, organization_id, company_id, full_name)
values ('ea77c426-8d0e-4aa0-a1c5-000000000102', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-000000000101', 'QA Contact A');
insert into public.deals (id, owner_id, organization_id, contact_id, company_id, stage_id, title, amount)
select 'ea77c426-8d0e-4aa0-a1c5-000000000103', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-000000000102', 'ea77c426-8d0e-4aa0-a1c5-000000000101', s.id, 'QA Deal A', 123
from public.pipeline_stages s join public.pipelines p on p.id = s.pipeline_id
where p.organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1'
order by s.position limit 1;
insert into public.activities (id, owner_id, organization_id, contact_id, activity_type, description)
values ('ea77c426-8d0e-4aa0-a1c5-000000000104', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-000000000102', 'task', 'QA Activity A');
update public.deals set outcome = 'won', closed_at = now() where id = 'ea77c426-8d0e-4aa0-a1c5-000000000103';
insert into qa_results select 'CRM flow creates company contact deal activity and outcome', exists (select 1 from public.companies where id = 'ea77c426-8d0e-4aa0-a1c5-000000000101') and exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102') and exists (select 1 from public.activities where id = 'ea77c426-8d0e-4aa0-a1c5-000000000104') and exists (select 1 from public.deals where id = 'ea77c426-8d0e-4aa0-a1c5-000000000103' and outcome = 'won' and closed_at is not null);
insert into public.pipeline_stages (pipeline_id, name, position)
select id, 'QA Follow-up', 4 from public.pipelines where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1';
select public.reorder_pipeline_stages(p.id, array(select s.id from public.pipeline_stages s where s.pipeline_id = p.id order by s.position desc)) from public.pipelines p where p.organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1';
insert into qa_results select 'pipeline can add and reorder stages', (select count(*) = 5 and min(position) = 0 and max(position) = 4 and count(distinct position) = 5 from public.pipeline_stages s join public.pipelines p on p.id = s.pipeline_id where p.organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1');

insert into public.lead_forms (id, organization_id, created_by, name, slug, title, status)
values ('ea77c426-8d0e-4aa0-a1c5-000000000107', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'QA Capture A', 'qa-capture-tenant-a', 'Fale com a QA A', 'published');
reset role;
insert into qa_results select 'published form exposes only public configuration', exists (select 1 from public.get_public_lead_form('qa-capture-tenant-a') where id = 'ea77c426-8d0e-4aa0-a1c5-000000000107');
set local role anon;
select public.submit_public_lead_form('qa-capture-tenant-a', '{"name":"QA Lead A","email":"lead-a@kanaflixcrm.test","phone":"11999999999"}'::jsonb, 'https://qa-a.test');
reset role;
insert into qa_results select 'public form creates contact and submission in owner workspace',
  exists (select 1 from public.form_submissions where form_id = 'ea77c426-8d0e-4aa0-a1c5-000000000107' and organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1')
  and exists (select 1 from public.contacts where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' and email = 'lead-a@kanaflixcrm.test' and source = 'Formulário: QA Capture A');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', true);
insert into public.tracking_integrations (id, organization_id, provider, external_id, status)
values ('ea77c426-8d0e-4aa0-a1c5-000000000108', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'meta_pixel', '123456789012345', 'active');
insert into public.lead_automation_rules (id, organization_id, name, trigger_type, trigger_value, set_status, add_tags)
values ('ea77c426-8d0e-4aa0-a1c5-000000000109', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'QA Automation A', 'utm_campaign', 'qa-campaign-a', 'qualified', array['qa-automated']);
insert into qa_results select 'marketing data is available in active workspace',
  exists (select 1 from public.lead_events where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' and event_name = 'lead.captured')
  and exists (select 1 from public.tracking_integrations where id = 'ea77c426-8d0e-4aa0-a1c5-000000000108')
  and exists (select 1 from public.lead_automation_rules where id = 'ea77c426-8d0e-4aa0-a1c5-000000000109');

reset role;
insert into public.organizations (id, name, created_by) values ('ea77c426-8d0e-4aa0-a1c5-0000000000c3', 'QA Workspace A2', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1');
insert into public.organization_members (organization_id, user_id, role) values ('ea77c426-8d0e-4aa0-a1c5-0000000000c3', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'owner');
update public.profiles set current_organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000c3' where id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', true);
insert into public.contacts (id, owner_id, organization_id, full_name)
values ('ea77c426-8d0e-4aa0-a1c5-000000000105', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', 'ea77c426-8d0e-4aa0-a1c5-0000000000c3', 'QA Contact A2');
insert into qa_results select 'same user sees only active workspace', not exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102') and exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000105');
insert into qa_results select 'same user cannot see forms or submissions from inactive workspace',
  not exists (select 1 from public.lead_forms where id = 'ea77c426-8d0e-4aa0-a1c5-000000000107')
  and not exists (select 1 from public.form_submissions where form_id = 'ea77c426-8d0e-4aa0-a1c5-000000000107');
insert into qa_results select 'same user cannot see marketing data from inactive workspace',
  not exists (select 1 from public.lead_events where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1')
  and not exists (select 1 from public.tracking_integrations where id = 'ea77c426-8d0e-4aa0-a1c5-000000000108')
  and not exists (select 1 from public.lead_automation_rules where id = 'ea77c426-8d0e-4aa0-a1c5-000000000109');

reset role;
update public.profiles set current_organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' where id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea77c426-8d0e-4aa0-a1c5-0000000000a1', true);
insert into qa_results select 'switching workspace does not mix data', exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102') and not exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000105');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ea77c426-8d0e-4aa0-a1c5-0000000000b2', true);
insert into public.contacts (id, owner_id, organization_id, full_name)
values ('ea77c426-8d0e-4aa0-a1c5-000000000106', 'ea77c426-8d0e-4aa0-a1c5-0000000000b2', 'ea77c426-8d0e-4aa0-a1c5-0000000000b2', 'QA Contact B');
insert into qa_results select 'B cannot read A organization', not exists (select 1 from public.organizations where id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1');
insert into qa_results select 'B cannot read A members', not exists (select 1 from public.organization_members where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1');
insert into qa_results select 'B cannot read A company', not exists (select 1 from public.companies where id = 'ea77c426-8d0e-4aa0-a1c5-000000000101');
insert into qa_results select 'B cannot read A contact', not exists (select 1 from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102');
insert into qa_results select 'B cannot read A opportunity', not exists (select 1 from public.deals where id = 'ea77c426-8d0e-4aa0-a1c5-000000000103');
insert into qa_results select 'B cannot read A activity', not exists (select 1 from public.activities where id = 'ea77c426-8d0e-4aa0-a1c5-000000000104');
insert into qa_results select 'B cannot read A pipeline or stages', not exists (select 1 from public.pipelines where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1') and not exists (select 1 from public.pipeline_stages s join public.pipelines p on p.id = s.pipeline_id where p.organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1');
insert into qa_results select 'B cannot read A forms or submissions',
  not exists (select 1 from public.lead_forms where id = 'ea77c426-8d0e-4aa0-a1c5-000000000107')
  and not exists (select 1 from public.form_submissions where form_id = 'ea77c426-8d0e-4aa0-a1c5-000000000107');
insert into qa_results select 'B cannot read A marketing events or integrations',
  not exists (select 1 from public.lead_events where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1')
  and not exists (select 1 from public.tracking_integrations where id = 'ea77c426-8d0e-4aa0-a1c5-000000000108')
  and not exists (select 1 from public.lead_automation_rules where id = 'ea77c426-8d0e-4aa0-a1c5-000000000109');
with changed as (update public.tracking_integrations set external_id = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000108' returning id)
insert into qa_results select 'B cannot update A tracking integration', not exists (select 1 from changed);
with changed as (update public.lead_automation_rules set name = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000109' returning id)
insert into qa_results select 'B cannot update A automation rule', not exists (select 1 from changed);
with removed as (delete from public.lead_automation_rules where id = 'ea77c426-8d0e-4aa0-a1c5-000000000109' returning id)
insert into qa_results select 'B cannot delete A automation rule', not exists (select 1 from removed);
with changed as (update public.contacts set source = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102' returning id)
insert into qa_results select 'B cannot update A contact', not exists (select 1 from changed);
with removed as (delete from public.contacts where id = 'ea77c426-8d0e-4aa0-a1c5-000000000102' returning id)
insert into qa_results select 'B cannot delete A contact', not exists (select 1 from removed);
with changed as (update public.companies set name = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000101' returning id)
insert into qa_results select 'B cannot update A company', not exists (select 1 from changed);
with removed as (delete from public.companies where id = 'ea77c426-8d0e-4aa0-a1c5-000000000101' returning id)
insert into qa_results select 'B cannot delete A company', not exists (select 1 from removed);
with changed as (update public.deals set title = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000103' returning id)
insert into qa_results select 'B cannot update A opportunity', not exists (select 1 from changed);
with removed as (delete from public.deals where id = 'ea77c426-8d0e-4aa0-a1c5-000000000103' returning id)
insert into qa_results select 'B cannot delete A opportunity', not exists (select 1 from removed);
with changed as (update public.activities set description = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000104' returning id)
insert into qa_results select 'B cannot update A activity', not exists (select 1 from changed);
with removed as (delete from public.activities where id = 'ea77c426-8d0e-4aa0-a1c5-000000000104' returning id)
insert into qa_results select 'B cannot delete A activity', not exists (select 1 from removed);
with changed as (update public.pipelines set name = 'attack' where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' returning id)
insert into qa_results select 'B cannot update A pipeline', not exists (select 1 from changed);
with changed as (update public.pipeline_stages set name = 'attack' where pipeline_id in (select id from public.pipelines where organization_id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1') returning id)
insert into qa_results select 'B cannot update A stages', not exists (select 1 from changed);
with changed as (update public.lead_forms set name = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-000000000107' returning id)
insert into qa_results select 'B cannot update A form', not exists (select 1 from changed);
with removed as (delete from public.lead_forms where id = 'ea77c426-8d0e-4aa0-a1c5-000000000107' returning id)
insert into qa_results select 'B cannot delete A form', not exists (select 1 from removed);
with removed as (delete from public.form_submissions where form_id = 'ea77c426-8d0e-4aa0-a1c5-000000000107' returning id)
insert into qa_results select 'B cannot delete A submission', not exists (select 1 from removed);
with changed as (update public.organizations set name = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' returning id)
insert into qa_results select 'B cannot update A organization', not exists (select 1 from changed);
with changed as (update public.profiles set full_name = 'attack' where id = 'ea77c426-8d0e-4aa0-a1c5-0000000000a1' returning id)
insert into qa_results select 'B cannot update A profile', not exists (select 1 from changed);

reset role;
select jsonb_agg(jsonb_build_object('test', test, 'passed', passed) order by test) as results, bool_and(passed) as all_passed from qa_results;
rollback;
