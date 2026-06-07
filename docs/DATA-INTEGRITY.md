# Data Integrity Program — log

The upper-segment lever: turn 47k stub-heavy rows into trustworthy,
honestly-labelled records. North-star metric: **curated (≥70) record
count**.

## Baseline (2026-06-06, before)
- avg completeness **41.0/100**
- stubs (<45): **33,628** (71%)
- curated (≥70): **381**

## Completeness weights (total 100)
name 5 (baseline) · family 8 · genus 7 · authority 10 · **iucn_status
25** · **native_countries 20** · geophyte_type 12 (inferred → 6) ·
discovery_year 8 · endemic 5. is_stub = score < 45.

## Done
- **DI-1** completeness score + `species.completeness_score` +
  `data_quality_summary()` + admin `<DataQualityPanel/>`.
- **DI-2** genus backfill from binomial → **0.9% → 100%** (47,052;
  1,213 genera). Provenance `derived_from_name`.
- **DI-3** `<CompletenessBadge/>` on species detail — honest "Record N%
  complete" + stub label + missing fields + contribute CTA.
- **DI-4** geophyte_type smart inference — only **79 monomorphic
  genera** (all curated members one type), **4,574 species** filled,
  flagged `geophyte_type_inferred` + provenance `inferred`, HALF weight
  (6 not 12). 11 mixed genera left untouched. 436 → 5,010.
- Provenance labels: `derived_from_name`, `inferred`,
  `gbif_distribution`.

## Findings / decisions
- **discovery_year cannot come from authority strings** — botanical
  author citations (ICN) carry no year; 0/46,616 had one. Needs
  POWO/IPNI publication year. Left empty (honest).
- **native_countries: GBIF is the WRONG source.** A 25-species proof
  batch over high-value geophytes showed GBIF `species/distributions`
  is sparse AND noisy — a Greek *Crocus* came back "NO" (Norway), a
  Mediterranean *Pancratium* included "US". We did NOT apply it.
  `/api/cron/enrich-distribution` now runs STRICT (explicit
  `establishmentMeans=NATIVE` only) = zero garbage, low yield.

## DI-6 — POWO native distribution (Yol 1: store TDWG, defer ISO)  ✅ started
- Proof: same 25 species through POWO + Wikidata. **POWO 20/24 native
  regions (correct data); Wikidata 0/24 IUCN.** Verdict: POWO is the
  native-range authority; Wikidata-IUCN is a dead end for this corpus
  (real IUCN only grows via real assessments — Hub + partnership).
- Built `species_native_regions` (region_name + WGSRPD tdwg_code +
  source=powo + POWO fqId), `species.has_native_regions` flag,
  `add_native_region` / `list_species_native_regions` RPCs,
  `/api/cron/harvest-powo`, `<NativeRegions/>` on species detail.
- Completeness now credits native distribution if ISO list OR regions
  → DI-6 moves the north-star directly.
- First batch (60 high-value geophytes): **44 filled, 158 native
  regions** with TDWG codes (e.g. *Pancratium maritimum* → 24 regions,
  *Allium baytopiorum* → Türkiye/TUR). **Curated 381 → 425.**
- **ISO2 conversion is a GATED later step** (STAGE-GATES.md, S4): map
  WGSRPD L3 → ISO2 with a verified crosswalk once POWO regions cover the
  corpus. Until then we show authoritative botanical regions (more
  precise than ISO anyway). DON'T forget — it's gated, not dropped.

## Next (the real needle-movers)
1. **Finish POWO harvest over the corpus** — run /api/cron/harvest-powo
   repeatedly (admin / pg_cron). ~34k species × ~85% yield = the bulk
   of the north-star gain.
2. **IUCN real status at scale** — restore the Wikidata iucn-sync to run
   over the corpus (via pg_cron once CRON_SECRET is in Supabase). +25 pts.
3. **Taxonomic backbone reconciliation** — match every species to GBIF
   backbone / POWO; store accepted name, synonyms, taxonKey, publication
   year (also fills discovery_year correctly).

## Principle
Never inject a guessed value as if it were a fact. Inference is allowed
ONLY when labelled (provenance source) and weighted down. We ran a proof
batch, found the source was bad, and refused to fill garbage — that IS
the discipline.
