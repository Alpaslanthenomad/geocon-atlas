# IUCN Red List API — reapplication template (Path B)

Use this when reapplying at https://api.iucnredlist.org/. The earlier
attempt was declined because we answered "Yes" to the commercial-use
question. The honest current state is non-commercial R&D — the answers
below reflect that.

---

## Form answers (English)

**Organization / institution**
Ada Biyoteknoloji (academic / R&D affiliation; non-commercial researcher
using IUCN data for conservation prioritization of endemic geophytes).

**Will the API data be used for commercial purposes?**
> **No.**
> The data feeds a non-commercial research atlas (GEOCON Atlas) that
> surfaces conservation status for endemic geophyte (bulbous, cormous,
> rhizomatous, tuberous) plants. The atlas is pre-revenue, open to
> researchers and conservation organizations free of charge, and used
> for conservation prioritization, propagation planning, and red-list
> follow-up by botanic gardens and seed banks. No paywall, no resale of
> IUCN data, and no advertising surface.

**How will you use the data?**

- Display each species' current IUCN Red List category on its detail
  page, linked back to the official IUCN species page.
- Aggregate threat counts per country and per family on the explore
  map to help researchers identify hotspots.
- Surface "watched" threatened species to registered users (botanic
  gardens, conservation researchers) so they can follow status updates.

**Will the data be redistributed?**

- The official IUCN category will be displayed inline next to each
  species, **with explicit attribution to the IUCN Red List of
  Threatened Species™** and a link to the official species page.
- No bulk export or re-download of IUCN data will be offered. Our own
  public REST endpoints (`/api/public/species/:id`, etc.) will return
  the IUCN status string and a `iucn_attribution` field pointing back
  to the official IUCN URL, but will not redistribute the full IUCN
  payload (assessment text, supporting documents, etc.).

**Scope of species**

~47,000 catalogued geophyte taxa (WCVP taxonomy). We need IUCN status
for approximately 5,000 of these — the subset that intersects with
species evaluated by IUCN.

**Expected request volume**

A one-off bulk sync over ~5,000 species (one species lookup each)
followed by a weekly refresh job. Estimated <10,000 requests per month.

**Attribution & terms**

Every IUCN status displayed will be accompanied by:
> "Source: IUCN Red List of Threatened Species™, [year of access].
> www.iucnredlist.org. Downloaded on [YYYY-MM-DD]."

We will comply with the Terms and Conditions of Use, including not
selling or redistributing raw IUCN datasets and removing data within
the timeframe required if the API token is revoked.

---

## What to do after approval

1. Add `IUCN_API_TOKEN` to Vercel environment variables.
2. Tell Claude (or me) to wire `/api/admin/iucn-sync` to fall back to
   the IUCN API when Wikidata doesn't match.
3. Run the sync; expect to lift evaluated coverage from ~420 to
   ~2,500-5,000 species.

## Notes about the previous declined application

- Previously registered under "Ada Biyoteknoloji" — keep that
  affiliation; it is the entity behind which the IUCN application
  history sits.
- If asked why a new application: "Original answer about commercial
  use was overly cautious. The current atlas is non-commercial,
  pre-revenue, and used only for research and conservation
  prioritization."
