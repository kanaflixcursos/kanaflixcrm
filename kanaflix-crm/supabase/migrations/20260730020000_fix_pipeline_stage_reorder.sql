create or replace function public.reorder_pipeline_stages(target_pipeline_id uuid, ordered_stage_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication is required'; end if;
  if not exists (select 1 from public.pipelines where id = target_pipeline_id and public.is_current_organization(organization_id)) then
    raise exception 'Pipeline does not belong to the active workspace';
  end if;
  select count(*) into expected_count from public.pipeline_stages where pipeline_id = target_pipeline_id;
  if expected_count <> cardinality(ordered_stage_ids) or exists (select 1 from unnest(ordered_stage_ids) as stage_id where not exists (select 1 from public.pipeline_stages where id = stage_id and pipeline_id = target_pipeline_id)) then
    raise exception 'Stage order does not match this pipeline';
  end if;
  update public.pipeline_stages set position = position + expected_count + 1000 where pipeline_id = target_pipeline_id;
  update public.pipeline_stages as stage set position = ordered.position - 1 from unnest(ordered_stage_ids) with ordinality as ordered(id, position) where stage.id = ordered.id;
end;
$$;
