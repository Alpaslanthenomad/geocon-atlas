# IUCN Red List API — Application & Compliance Note

Goal: obtain an IUCN Red List API token to display **official conservation
status** in GEOCON, on a footing that keeps us **non-profit-clean** and
**legally safe long-term**. Read the *current* official Terms of Use at the
source when applying — this note is the playbook, not a substitute for them.

> Two different things — don't confuse them:
> - **Consuming** the Red List API → read official statuses to *display* (this doc).
> - **Assessment Hub** (already in GEOCON) → users draft assessments to *submit* to IUCN. Separate, and fine.

---

## 1. What to apply for
The IUCN Red List API (account + token at the official IUCN Red List API
site — `api.iucnredlist.org`). The token feeds `/api/harvest/iucn`
(`IUCN_API_TOKEN`), which pulls assessment categories for our species.

## 2. Applicant identity — this is why Venn matters
Apply as **Venn**, framed as a **non-profit / research / conservation**
initiative — *not* a commercial company. Establishing Venn as a non-profit
or research entity first makes this application clean. A commercial-company
applicant invites scrutiny and the wrong terms.

## 3. Use declaration (what to write on the form)
- Purpose: **non-commercial, conservation & research, public-good atlas** of
  geophyte biodiversity.
- Audience: researchers, conservation programs, students, the public.
- Output: per-species status displayed with full attribution; no resale, no
  bulk redistribution.

## 4. The five compliance rules (bake these into the product)
1. **Non-commercial use.** Declare it, mean it. Commercial use needs separate
   IUCN permission we are not seeking.
2. **★ Total separation from the commercial layer (the key legal point).**
   The Bahçe / ventures / investor surface must **never** display, sit beside,
   or be powered by IUCN data. IUCN status lives **only** on the
   conservation/research surface. Our architecture already enforces this (no
   money columns in GEOCON; the commercial pathway is the separate BEE layer)
   — keep it that way and state it explicitly in the application.
3. **Attribution, always.** Cite "IUCN Red List of Threatened Species.
   Version YYYY-N" plus the per-species assessment. (I'll build a visible
   attribution component + an `/iucn-terms` page — see §6.)
4. **No bulk redistribution / no raw-data download product.** Reasonable
   caching + periodic refresh is fine; "download the IUCN dataset from
   GEOCON" is not.
5. **No implied endorsement.** Never suggest IUCN endorses, partners with, or
   certifies GEOCON / Venn.

## 5. Data-integrity tie-in
Same discipline as the rest of the atlas: IUCN status is shown as the
**authoritative, sourced** value with its assessment version — never guessed,
never mixed with inferred values. The 423 species with real statuses stay
labelled real; the API expands that set honestly.

## 6. What I build once the token is approved
- A pure-DB, rate-respecting IUCN fetch (same pattern as the POWO pipeline) so
  the data flow is reliable and never touches the broken Vercel write path.
- A visible **attribution component** on every species page showing IUCN data
  + version + assessment link.
- A public **`/iucn-terms`** page stating our compliant, non-commercial use.
- A technical guard keeping IUCN fields out of any commercial/ventures query.

## 7. Application checklist (today)
- [ ] Venn established (or in progress) as **non-profit / research** — the applicant identity
- [ ] Create an account at the official IUCN Red List API site
- [ ] On the form: purpose = **non-commercial, conservation & research**
- [ ] Describe GEOCON: public-good geophyte conservation atlas; status shown with attribution; no resale
- [ ] Explicitly note IUCN data is isolated from any commercial offering
- [ ] Accept the current Terms of Use (read them in full first)
- [ ] On approval: paste the token into Vercel as `IUCN_API_TOKEN` (all environments) → tell me to wire the fetch + attribution + /iucn-terms

## 8. If a prior application was flagged
Earlier notes suggested a previous attempt may have been read as commercial.
Re-apply with the **non-commercial** declaration, Venn as the non-profit
applicant, and the explicit commercial-separation statement above. That is
the correct, durable footing.

---

**Bottom line:** non-profit applicant (Venn) + non-commercial declaration +
hard separation of IUCN data from the commercial layer + visible attribution.
Get those four right and the data flow is both reliable and legally safe.
