-- 2026-06-11 — Firewall: close the metabolite value-signal leak on the public/anon surface
--
-- WHY: the IUCN/commerce firewall (and the "Bioactivity money-blind + INTERNAL" principle)
-- requires that Z-side value/commercial signals never appear on the public conservation
-- surface. Verified live on 2026-06-11: the SECURITY DEFINER RPC get_metabolite_detail
-- (granted to anon) returned to_jsonb(m) — the ENTIRE metabolites row — so the value signals
-- cosmetic_relevance / clinical_stage / ip_potential reached anon and were rendered at
-- components/geocon/MetaboliteDetailRoute.jsx. (Populated in 17/12/12 of 1688 rows.) The two
-- other anon read paths on metabolites — components/programs/v2/tabs/OutputsTab.jsx and
-- lib/atlas/queries.js fetchMetabolitesForSpecies — already select an explicit safe column
-- list, so the RPC was the only leak path. The server API app/api/species/[id]/summary also
-- selects only safe columns. This migration is the structural fix at the projection layer.
--
-- ALSO HARDENED:
--   * market_intelligence had a permissive public_read policy (qual=true) but NO anon/authenticated
--     GRANT, so it was inert today — but a future grant would have silently exposed market_size_usd
--     / price_range / premium_multiplier / key_buyers / revenue_model. Drop the latent policy so the
--     closure is structural, not accidental. (7 rows; commercial table is empty / category-only.)
--   * metabolites had broad anon write/TRUNCATE grants (RLS already denied writes — no permissive
--     anon write policy exists — but TRUNCATE is not RLS-filtered). Revoke them; keep anon SELECT
--     (the public atlas reads metabolites).
--
-- APPROACH: allowlist projection (default-deny). New value columns added to metabolites later will
-- NOT leak unless explicitly added here.
--
-- ROLLBACK (if ever needed):
--   * restore the metabolite projection to (SELECT to_jsonb(m) FROM public.metabolites m WHERE m.id = p_id)
--   * CREATE POLICY public_read ON public.market_intelligence FOR SELECT TO public USING (true);
--   * GRANT INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.metabolites TO anon;  (not recommended)
--
-- VERIFICATION: npm run build green; get_advisors(security) = 0 ERROR; the public metabolite page
-- no longer renders Cosmetic relevance / Clinical stage / IP potential.

CREATE OR REPLACE FUNCTION public.get_metabolite_detail(p_id text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'metabolite', (
      SELECT jsonb_build_object(
        'id', m.id,
        'species_id', m.species_id,
        'compound_name', m.compound_name,
        'compound_class', m.compound_class,
        'cas_number', m.cas_number,
        'molecular_formula', m.molecular_formula,
        'molecular_weight', m.molecular_weight,
        'plant_organ', m.plant_organ,
        'extraction_method', m.extraction_method,
        'reported_activity', m.reported_activity,
        'activity_category', m.activity_category,
        'therapeutic_area', m.therapeutic_area,
        'evidence', m.evidence,
        'pubchem_cid', m.pubchem_cid,
        'chebi_id', m.chebi_id,
        'confidence', m.confidence,
        'source_database', m.source_database,
        'last_verified', m.last_verified,
        'notes', m.notes,
        'source', m.source,
        'created_at', m.created_at
      )
      FROM public.metabolites m WHERE m.id = p_id
    ),
    -- species sub-object is allowlisted too (Codex cross-check): default-deny on both sub-objects.
    'species', (
      SELECT jsonb_build_object('id', s.id, 'accepted_name', s.accepted_name, 'family', s.family)
      FROM public.species s WHERE s.id = (SELECT species_id FROM public.metabolites WHERE id = p_id)
    ),
    'publications', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', p.id, 'title', p.title, 'authors', p.authors, 'year', p.year,
        'journal', p.journal, 'doi', p.doi, 'open_access', p.open_access,
        'cited_by_count', p.cited_by_count,
        'is_primary_source', mp.is_primary_source,
        'match_method',     mp.match_method
      ) ORDER BY p.year DESC NULLS LAST), '[]'::jsonb)
      FROM public.metabolite_publications mp
      JOIN public.publications p ON p.id = mp.publication_id
      WHERE mp.metabolite_id = p_id
    )
  );
$function$;

DROP POLICY IF EXISTS public_read ON public.market_intelligence;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.metabolites FROM anon;
