alter table public.contacts
  add column gclid text,
  add column fbclid text;

alter function public.submit_public_lead_form(text, jsonb, text, jsonb)
  rename to submit_public_lead_form_core;

revoke all on function public.submit_public_lead_form_core(text, jsonb, text, jsonb) from public, anon, authenticated;

create function public.submit_public_lead_form(
  target_slug text,
  input_payload jsonb,
  source_url text default null,
  attribution_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  click_attribution jsonb;
  submission_id uuid;
  captured_contact_id uuid;
begin
  click_attribution := jsonb_strip_nulls(jsonb_build_object(
    'gclid', nullif(left(btrim(coalesce(attribution_payload ->> 'gclid', '')), 500), ''),
    'fbclid', nullif(left(btrim(coalesce(attribution_payload ->> 'fbclid', '')), 500), '')
  ));

  result := public.submit_public_lead_form_core(target_slug, input_payload, source_url, attribution_payload);
  submission_id := (result ->> 'submission_id')::uuid;
  captured_contact_id := (result ->> 'contact_id')::uuid;

  if click_attribution <> '{}'::jsonb then
    update public.form_submissions
    set attribution = attribution || click_attribution
    where id = submission_id;

    update public.contacts
    set
      gclid = coalesce(gclid, click_attribution ->> 'gclid'),
      fbclid = coalesce(fbclid, click_attribution ->> 'fbclid')
    where id = captured_contact_id;

    update public.lead_events
    set properties = jsonb_set(
      properties,
      '{attribution}',
      coalesce(properties -> 'attribution', '{}'::jsonb) || click_attribution
    )
    where event_name = 'lead.captured'
      and properties ->> 'submission_id' = submission_id::text;
  end if;

  return result;
end;
$$;

revoke all on function public.submit_public_lead_form(text, jsonb, text, jsonb) from public;
grant execute on function public.submit_public_lead_form(text, jsonb, text, jsonb) to anon, authenticated;
