# GEOCON · species ingestion pipeline

Bulk imports the world's geophyte species into the `species` table from
authoritative open sources, then keeps them in sync with periodic re-runs.

## Goal

Cover every accepted geophyte species globally (~15-20K rows across ~12
families), with provenance preserved so a row can always be traced back
to where it came from and re-synced safely.

## Sources

| Source | What it gives us | Auth |
| ------ | ---------------- | ---- |
| **WCVP** (Kew, World Checklist of Vascular Plants) | Accepted names, synonyms, family, distribution per country, nomenclatural year. The taxonomic spine. | None — bulk CSV download |
| **IUCN Red List v3 API** | Conservation status (CR/EN/VU/NT/LC/DD), per-country threat assessments | Free API key (apply at https://apiv3.iucnredlist.org/api/v3/token) |
| **GBIF** | Occurrence records (lat/lng), additional taxonomy cross-checks | None — free REST API |

## Target families (12)

Iridaceae, Amaryllidaceae, Liliaceae (sensu stricto), Asparagaceae,
Orchidaceae, Colchicaceae, Hyacinthaceae, Araceae, Tecophilaeaceae,
Alstroemeriaceae, Themidaceae, plus a curated long tail of bulbous
genera in other families.

Family list is configurable in each script; not all members of these
families are true geophytes, but family-level filtering is the practical
first cut. Refinement happens later via curation flags.

## Pipeline phases

1. **WCVP bulk** — download CSV, filter to geophyte families, upsert
   accepted names with provenance. Synonyms handled but not stored as
   separate rows (cross-referenced via `external_ids`). Expected output:
   ~15-20K species rows.
2. **IUCN status sync** — for each species with a WCVP id, query the
   IUCN API for current status + per-country assessments. Rate limit
   1 req/sec (IUCN's published etiquette). Expected runtime: 5-6 hours
   for full set, runnable overnight. Many species will return no
   assessment — those stay as `iucn_status = NULL` (effectively DD/NE).
3. **GBIF occurrence** *(optional)* — fetch first N occurrence records
   per species for real lat/lng pin placement. Heavier, can be skipped
   on first run.

Each phase is idempotent: re-running upserts only the changed rows and
updates `last_synced_at`.

## Schema contract

The pipeline writes to columns added in migration
`species_ingestion_columns`:

| Column | Purpose |
| ------ | ------- |
| `source` | `wcvp` after Phase 1, may become `mixed` once IUCN/GBIF add data |
| `external_ids` | `{ wcvp: "...", iucn: "...", gbif: "..." }` |
| `last_synced_at` | UTC timestamp of last successful upsert |
| `discovery_year` | First publication year (from WCVP) |
| `accepted_name_authority` | Taxonomic author string (e.g. "Boiss.") |
| `native_countries` | ISO-3166-1 alpha-2 codes (WCVP-derived) |
| `introduced_countries` | Same, kept separate from native |

Existing manually curated rows (source=`manual`) are never overwritten;
the script falls back to `INSERT … ON CONFLICT DO NOTHING` for rows
whose `external_ids->>'wcvp'` matches an existing manual entry, or it
augments missing fields without clobbering.

## Running

Scripts assume Node 18+ ESM. From the repo root:

```bash
# Phase 1 (when wcvp.mjs lands)
node scripts/ingest/wcvp.mjs

# Phase 2 (when iucn.mjs lands)
node scripts/ingest/iucn.mjs

# Phase 3 (when gbif.mjs lands)
node scripts/ingest/gbif.mjs --species-limit 50
```

### Environment

Each script reads `.env.local` at the repo root and expects:

```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...     # required — bypasses RLS for upserts
IUCN_API_TOKEN=...                # only for iucn.mjs
```

The service role key is sensitive — keep it out of the client bundle
and out of commits. `.env.local` is already gitignored by Next.

## What is *not* yet built

- The actual Phase 1 / 2 / 3 scripts (this is just scaffolding).
- A management UI ("last sync, N new this week, errors") — comes once
  the first ingest succeeds and we have something to display.
- Geophyte verification curation flags — for now we trust family-level
  filtering, then audit afterwards.
