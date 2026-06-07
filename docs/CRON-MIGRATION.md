# Cron migration — Vercel Hobby → Supabase pg_cron

**Why:** Vercel Hobby plan allows **max 2 cron jobs, daily-only**. The
project had 49 crons (some sub-daily), which made every git-push
deployment FAIL validation. The build itself was fine — Vercel rejected
the deployment because the cron count/frequency exceeded the plan.

**Fix applied:** `vercel.json` trimmed to 2 daily crons (iucn-sync +
enrich-classifications). All other endpoints still exist and work — they
just lost their Vercel schedule.

**To restore full automation without upgrading to Pro:** schedule the
endpoints below via Supabase `pg_cron` + `pg_net` (both extensions are
already enabled). Each job does an HTTP POST to the endpoint with the
`CRON_SECRET` bearer. Run once the endpoints are live (post-deploy).

Template:
```sql
select cron.schedule(
  'geocon-<name>',
  '<cron expr>',
  $$ select net.http_post(
       url    := 'https://atlas.vennbioventures.com<path>',
       headers:= jsonb_build_object('Authorization','Bearer '||current_setting('app.cron_secret', true))
     ); $$
);
```

## Endpoints to migrate (were in vercel.json before this trim)

| Path | Old schedule | Notes |
|---|---|---|
| /api/harvest/openalex?batch=0..6 | 0 5 * * 0..6 | weekly batches |
| /api/harvest/pubmed?batch=0..5 | 0 6 {1,5,10,15,20,25} * * | monthly batches |
| /api/harvest/enrich?batch=0..6 | 0 7 * * 0..6 | weekly batches |
| /api/harvest/backfill?batch=0..6 | 0 8 * * 0..6 | weekly batches |
| /api/harvest/gbif?batch=0..6 | 0 9 * * 0..6 | weekly batches |
| /api/harvest/iucn?batch=0..3 | 0 10 {1,8,15,22} * * | monthly batches |
| /api/cron/dispatch-webhooks | */5 * * * * | every 5 min |
| /api/cron/ai-summarize-publications?max=6 | 0 3 * * * | daily |
| /api/cron/ingest-specimens?limit=25 | 0 2 * * * | daily (GBIF specimens) |
| /api/cron/transcribe-voice?max=10 | 0 1 * * * | daily (Whisper, env-gated) |
| /api/cron/sync-inaturalist?limit=20 | 30 2 * * * | daily |
| /api/cron/iucn-history?limit=20 | 0 0 1 * * | monthly |
| /api/cron/autopost-social | 0 12 * * * | daily (env-gated) |
| /api/cron/email-queue?limit=30 | */10 * * * * | every 10 min (email drain) |
| /api/cron/saved-search-digest | 0 9 * * 1 | weekly Monday |

## Kept on Vercel (the 2 Hobby allows)
- /api/cron/iucn-sync — daily 04:00
- /api/cron/enrich-classifications — daily 04:30

**Alternative:** upgrade to Vercel Pro (~$20/mo) → restore all 49 crons
in vercel.json, no pg_cron needed.
