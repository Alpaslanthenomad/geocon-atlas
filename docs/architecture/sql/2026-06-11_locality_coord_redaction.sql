-- 2026-06-11 — Locality coordinate redaction (constraint #5: sensitivity-tiered locality)
--
-- WHY: field/inat observation coordinates were exposed at full precision to anon
-- through several read paths. A redaction helper public._redact_field_coord(...)
-- already existed and was wired into the two FIELD-observation RPCs, but three
-- read paths still leaked raw / near-raw coordinates, and — most importantly —
-- the RLS SELECT policies on both tables were `USING (true)`, so anyone with the
-- public anon key could read raw lat/lng straight off the tables via PostgREST,
-- bypassing every RPC. Both tables are empty today; the iNat sync cron will
-- populate inat_observations, so this closes the hole before data lands.
--
-- POLICY (single source of truth, see public._locality_withheld below):
--   A locality is WITHHELD when the caller is not privileged (= not the observer
--   and not an admin) AND the species is sensitive (sensitivity_level <> 'public')
--   or threatened (iucn_status in CR,EN,VU,EW,EX).
--   _redact_field_coord then returns: null (coord null) / exact (privileged) /
--   null (withheld) / round(coord,1) ~0.1deg ~11km grid (everyone else).
--   Structured locality TEXT (iNat place_guess) is suppressed under the same
--   withheld condition so it cannot re-open a near-precise locality leak.
--
-- WHAT CHANGES:
--   0. _locality_withheld()  — new helper; _redact_field_coord() refactored to use it (behaviour identical).
--   1. get_live_observation_feed       — redact the iNaturalist branch (was raw) + place_guess.
--   2. list_species_inat_observations  — redact (was raw) + place_guess.
--   3. get_species_timeline            — redact the field-observation title coords (was ~110m raw).
--   4. RLS — replace the wide-open `USING (true)` SELECT policies with owner/admin-only
--      direct read. SECURITY DEFINER RPCs (owned by postgres, force_rls=false) bypass RLS
--      and remain the redacted public read path. No client reads these tables directly.
--
-- NOT redacted (deliberate, unchanged, flagged for the founder): free-text `notes`
-- (field obs) — observational content, redacted nowhere in the atlas today; observers
-- should avoid precise localities in notes for sensitive taxa (future enhancement).
--
-- REALTIME CAVEAT: neither table is in the supabase_realtime publication. Do NOT add
-- them expecting redaction — realtime delivers raw row columns (lat/lng/place_guess),
-- gated only by RLS (now owner/admin), never by the redacting RPCs. Broadcast a
-- redacted projection if live delivery is ever needed.
--
-- BACKWARD COMPATIBLE: identical signatures + output columns; deep links intact.
-- list_field_observations_for_species (already redacted) and list_my_field_observations
-- (owner-scoped) are unchanged.
--
-- ROLLBACK: recreate policies fobs_public_read / inat_observations_public_read as
-- FOR SELECT USING (true), and restore the three function bodies + the original
-- _redact_field_coord from git history of this file.

-- 0) Single source of truth for "is this locality withheld from this caller?" ------
create or replace function public._locality_withheld(p_iucn text, p_sensitivity text, p_privileged boolean)
 returns boolean
 language sql
 immutable
as $function$
  select (not coalesce(p_privileged, false))
     and ( coalesce(p_sensitivity, 'public') <> 'public'
           or coalesce(p_iucn, '') in ('CR','EN','VU','EW','EX') );
$function$;

-- Refactor the existing coordinate redactor to delegate (behaviour byte-identical
-- to the prior body: null/exact/withheld->null/round-to-0.1deg).
create or replace function public._redact_field_coord(p_coord double precision, p_iucn text, p_sensitivity text, p_privileged boolean)
 returns double precision
 language sql
 immutable
as $function$
  select case
    when p_coord is null then null
    when coalesce(p_privileged, false) then p_coord
    when public._locality_withheld(p_iucn, p_sensitivity, p_privileged) then null
    else round(p_coord::numeric, 1)::double precision
  end;
$function$;

-- 1) Live feed — redact the iNaturalist branch (field branch already redacted) ----
create or replace function public.get_live_observation_feed(
  p_limit integer default 30,
  p_family text default null::text,
  p_iucn_tier text[] default null::text[],
  p_my_watchlist_only boolean default false)
 returns table(source text, id text, species_id text, species_name text, family text,
               iucn_status text, observer text, observed_at timestamp with time zone,
               lat double precision, lng double precision, place_guess text,
               photo_url text, notes text, link text)
 language plpgsql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare v_uid uuid := auth.uid(); v_admin boolean; v_watched text[];
begin
  v_admin := coalesce((select pr.role = 'admin' from profiles pr where pr.id = v_uid), false);
  if p_my_watchlist_only and v_uid is not null then
    select array_agg(sw.species_id) into v_watched from species_watch sw where sw.user_id = v_uid;
  end if;
  return query
    with fo as (
      select 'field'::text as source, f.id::text as id, f.species_id::text,
             coalesce(s.accepted_name, f.proposed_name) as species_name, s.family, s.iucn_status,
             coalesce(f.observer_name, split_part(p.email, '@', 1), 'anonymous') as observer,
             coalesce(f.observed_at, f.created_at) as observed_at,
             public._redact_field_coord(f.lat, s.iucn_status, s.sensitivity_level, v_admin or f.user_id = v_uid) as lat,
             public._redact_field_coord(f.lng, s.iucn_status, s.sensitivity_level, v_admin or f.user_id = v_uid) as lng,
             null::text as place_guess, f.photo_url, f.notes,
             ('/geocon/species/' || coalesce(f.species_id, ''))::text as link
      from field_observations f
      left join species s on s.id = f.species_id
      left join profiles p on p.id = f.user_id
      where coalesce(f.status, '') in ('submitted','verified','community','public')
        and coalesce(f.observed_at, f.created_at) is not null
        and (p_family is null or s.family = p_family)
        and (p_iucn_tier is null or s.iucn_status = any(p_iucn_tier))
        and (not p_my_watchlist_only or v_watched is null or f.species_id = any(v_watched))
    ),
    ino as (
      select 'inaturalist'::text as source, i.inat_id::text as id, i.species_id::text,
             coalesce(s.accepted_name, i.taxon_name) as species_name, s.family, s.iucn_status,
             i.observer, i.observed_at::timestamptz as observed_at,
             public._redact_field_coord(i.lat, s.iucn_status, s.sensitivity_level, v_admin) as lat,
             public._redact_field_coord(i.lng, s.iucn_status, s.sensitivity_level, v_admin) as lng,
             case when public._locality_withheld(s.iucn_status, s.sensitivity_level, v_admin)
                  then null else i.place_guess end as place_guess,
             i.photo_url, null::text as notes,
             coalesce(i.observation_url, '/geocon/species/' || coalesce(i.species_id, ''))::text as link
      from inat_observations i
      left join species s on s.id = i.species_id
      where i.observed_at is not null
        -- iNat rows carry an external deep-link (inat_id/observation_url) to the raw
        -- precise locality; for withheld species the whole row is admin-only.
        and not public._locality_withheld(s.iucn_status, s.sensitivity_level, v_admin)
        and (p_family is null or s.family = p_family)
        and (p_iucn_tier is null or s.iucn_status = any(p_iucn_tier))
        and (not p_my_watchlist_only or v_watched is null or i.species_id = any(v_watched))
    )
    select * from (select * from fo union all select * from ino) merged
    order by observed_at desc nulls last
    limit greatest(1, least(p_limit, 100));
end; $function$;

-- 2) Species iNat panel — redact (no owner for iNat rows -> admin-only exact) ------
create or replace function public.list_species_inat_observations(p_species_id text, p_limit integer default 8)
 returns table(inat_id bigint, observer text, observed_at date, lat double precision,
               lng double precision, place_guess text, quality_grade text,
               photo_url text, observation_url text)
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select i.inat_id, i.observer, i.observed_at,
         public._redact_field_coord(i.lat, s.iucn_status, s.sensitivity_level, a.adm) as lat,
         public._redact_field_coord(i.lng, s.iucn_status, s.sensitivity_level, a.adm) as lng,
         case when public._locality_withheld(s.iucn_status, s.sensitivity_level, a.adm)
              then null else i.place_guess end as place_guess,
         i.quality_grade, i.photo_url, i.observation_url
  from inat_observations i
  left join species s on s.id = i.species_id
  cross join lateral (select public.is_admin() as adm) a
  where i.species_id = p_species_id
    -- withheld species: iNat deep-link (inat_id/observation_url) would leak the raw
    -- precise locality off-site, so the row is admin-only.
    and not public._locality_withheld(s.iucn_status, s.sensitivity_level, a.adm)
  order by i.observed_at desc nulls last
  limit greatest(1, least(p_limit, 50));
$function$;

-- 3) Species timeline — redact the field-observation coordinates in the title -----
create or replace function public.get_species_timeline(p_species_id text, p_limit integer default 80)
 returns table(ts timestamp with time zone, kind text, title text, subtitle text, url text, actor text)
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  SELECT * FROM (
    -- programs created on this species
    SELECT
      p.created_at::timestamptz AS ts,
      'program_created'::text AS kind,
      COALESCE(p.program_name, 'Untitled program') AS title,
      COALESCE(p.current_module, p.status, 'Program') AS subtitle,
      ('/geocon/programs/' || p.id::text) AS url,
      COALESCE(pr.full_name, 'a researcher') AS actor
    FROM programs p
    LEFT JOIN profiles pr ON pr.id::text = p.created_by
    WHERE p.species_id = p_species_id AND p.created_at IS NOT NULL

    UNION ALL

    -- outcomes declared on programs that target this species
    SELECT
      co.declared_at::timestamptz,
      'outcome'::text,
      COALESCE(co.title, co.outcome_kind, 'Outcome'),
      ('Verification: ' || COALESCE(co.verification, 'self_declared')),
      ('/geocon/outcomes#' || co.id::text),
      'GEOCON Outcomes'::text
    FROM commercialized_outcomes co
    WHERE co.species_id = p_species_id AND co.declared_at IS NOT NULL

    UNION ALL

    -- publications that link to this species
    SELECT
      make_date(pu.year, 1, 1)::timestamptz,
      'publication'::text,
      pu.title,
      COALESCE(pu.journal, pu.category, ''),
      ('/geocon/publications/' || pu.id),
      COALESCE(pu.authors, 'authors')
    FROM publications pu
    WHERE pu.species_id = p_species_id AND pu.year IS NOT NULL

    UNION ALL

    -- accepted edit proposals — show as "field updated"
    SELECT
      ep.submitted_at::timestamptz,
      'edit_accepted'::text,
      ('Edit accepted · ' || ep.field),
      ('→ ' || COALESCE(ep.proposed_value, '?')),
      ('/geocon/species/' || ep.species_id),
      COALESCE(pr.full_name, pr.email, 'a contributor')
    FROM species_edit_proposals ep
    LEFT JOIN profiles pr ON pr.id = ep.submitted_by
    WHERE ep.species_id = p_species_id AND ep.status = 'accepted'

    UNION ALL

    -- field provenance entries (IUCN sync, OpenAlex enrichment, etc.)
    SELECT
      fp.recorded_at,
      ('source_' || fp.source)::text,
      ('Field updated · ' || fp.field),
      ('From ' || fp.source ||
        CASE WHEN fp.source_ref IS NOT NULL THEN ' · ' || fp.source_ref ELSE '' END),
      ('/geocon/species/' || fp.species_id),
      ('Atlas · ' || fp.source)
    FROM species_field_provenance fp
    WHERE fp.species_id = p_species_id

    UNION ALL

    -- community-visible field observations (coordinates sensitivity-redacted)
    SELECT
      fo.observed_at::timestamptz,
      'observation'::text,
      CASE
        WHEN fo.lat IS NULL OR fo.lng IS NULL THEN 'Field observation'
        WHEN r.rlat IS NULL OR r.rlng IS NULL THEN 'Field observation (location withheld)'
        ELSE 'Field observation near ' || trim_scale(round(r.rlat::numeric, 4))::text || '°, '
                                       || trim_scale(round(r.rlng::numeric, 4))::text || '°'
      END,
      COALESCE(left(fo.notes, 80), ''),
      ('/geocon/species/' || fo.species_id),
      COALESCE(fo.observer_name, 'a researcher')
    FROM field_observations fo
    LEFT JOIN species s ON s.id = fo.species_id
    CROSS JOIN LATERAL (
      SELECT public._redact_field_coord(fo.lat, s.iucn_status, s.sensitivity_level,
                (fo.user_id = auth.uid()) OR public.is_admin()) AS rlat,
             public._redact_field_coord(fo.lng, s.iucn_status, s.sensitivity_level,
                (fo.user_id = auth.uid()) OR public.is_admin()) AS rlng
    ) r
    WHERE fo.species_id = p_species_id
      AND COALESCE(fo.status, 'submitted') IN ('submitted','verified')
  ) u
  ORDER BY ts DESC NULLS LAST
  LIMIT GREATEST(1, LEAST(p_limit, 200));
$function$;

-- Preserve public read access to the (redacting) RPCs.
grant execute on function public.get_live_observation_feed(integer, text, text[], boolean) to anon, authenticated;
grant execute on function public.list_species_inat_observations(text, integer) to anon, authenticated;
grant execute on function public.get_species_timeline(text, integer) to anon, authenticated;

-- 4) Close the direct-read bypass: no raw coordinates off the tables for the public.
--    Reads must go through the redacting RPCs; owner/admin keep direct access.
--    (drop new names too -> re-runnable; PG17 has no CREATE POLICY IF NOT EXISTS.)
drop policy if exists fobs_public_read on public.field_observations;
drop policy if exists fobs_owner_admin_read on public.field_observations;
create policy fobs_owner_admin_read on public.field_observations
  for select to public
  using ( auth.uid() = user_id or public.is_admin() );

drop policy if exists inat_observations_public_read on public.inat_observations;
drop policy if exists inat_admin_read on public.inat_observations;
create policy inat_admin_read on public.inat_observations
  for select to public
  using ( public.is_admin() );
