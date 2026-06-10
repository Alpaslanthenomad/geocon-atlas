# GEOCON v-next — Decision Journal (founder talking points)

> The presentable record of every locked v-next design decision **with its rationale**,
> in plain language — so the founder can master the "why" and answer it when presenting
> the platform. Each entry: the QUESTION (as an outsider would ask it), OUR ANSWER, WHY
> (the defensible justification), and IF PUSHED (the hardest objection + the answer).
> Deep analysis behind each lives in `VNEXT-R3-DECISIONS.md`. This file GROWS as decisions lock.

---

## Cluster A — Conservation outputs (locked 2026-06-11)

### A1. "How do you verify a reintroduction (returning a species to the wild)?"
**Our answer.** A **hybrid gate.** The platform *structurally refuses* to mint a
"reintroduction achieved" record unless the validity-critical, document-checkable
preconditions are met — ex-situ propagated material and genetic breadth — and it will not
let anyone claim *success* on day one at all. The softer, judgment-call preconditions
(secured site, threats abated) are not hard-blocked; they visibly lower the record's
evidence strength and carry honest warnings.

**Why.** The conservation science is unforgiving and well-documented: in the largest global
review (Godefroid et al. 2011, 249 reintroductions) mean survival was **52%**, flowering
19%, fruiting 16% — and **all three decline over time** because the field's central error is
*declaring success too early*. CPC best practice is explicit that threats must be removed
*before* introduction and that sustainability "may require **decades** to evaluate" while
most projects monitor under 5 years. IUCN (2013) demands a comprehensive multi-risk analysis
and proof that the original threats were eliminated. So a record that says "reintroduction
achieved" the day a plant goes in the ground would be a **fabricated conservation fact** —
which violates our first principle (no fabrication). The gate makes the truth *structural*,
not a footnote someone has to remember.

**If pushed ("why not hard-gate everything?").** Because "secured site" and "threats abated"
are land-tenure documents and field judgments, not DOIs — and our evidence engine is built
on document-backed facts. Forcing the platform to *adjudicate* soft evidence would make it a
bureaucracy it is not designed to be, and would lock the headline action out of nearly every
species at this early stage. So we hard-gate exactly what is *checkable and validity-critical*,
and we are transparent (not silent) about the rest.

### A2. "If a translocation has been done but the multi-year monitoring is not finished, what do you show?"
**Our answer.** **Separate rungs, never one claim on a dimmer switch.** The record moves
through distinct, honestly-named states — *translocation executed → under monitoring →
success confirmed* — and "confirmed" can only be reached after the monitoring evidence exists.

**Why.** "We planted it" and "it worked" are separated by years (often a decade — *Pseudophoenix
sargentii* took 25 years to fruit in the wild). Collapsing them into one claim at variable
strength is exactly the early-success error Godefroid names, and casual readers see the claim,
not the strength band. Separate rungs are simultaneously honest (no false "success") **and**
fair to the researcher (the real work of executing a translocation is visibly credited at its
own rung — it is not hidden until decade-long monitoring closes).

### A3. "Which conservation actions are hard requirements, and which are just good practice?"
**Our answer.** A single governing **two-filter test:** a step is a *hard requirement (a gate)*
**only if** the output is *scientifically invalid* or *unsafe* without it; otherwise it is an
optional enrichment that raises confidence. We keep the hard set **small and principled** —
validity/safety gates, not bureaucracy.

**Why.** Every best practice can be argued into a requirement until nothing can be claimed and
the atlas is an empty museum of locked goals — which would kill the whole point ("the gap is the
product" only works if filling it is reachable). The two-filter test is the discipline that
keeps the gate honest in both directions: it blocks genuinely invalid/unsafe claims (a
reintroduction with no genetic breadth; a biosecurity/invasiveness risk; source material with
no provenance) while letting real, reachable conservation wins through.

---

## Cluster B — Z value-honesty (locked 2026-06-11)

> During this analysis two **fabrication-by-tooling** failures were caught LIVE (not theorized):
> a PubMed query "lycorine antiproliferative OR anticancer" returned **245,867** results (real
> assays: ~84), and "lycorine" returned **0** in ChEMBL by name (it must be looked up by chemical
> structure). These are the talking-point proof of *why* the floors below exist.

### B1. "Why don't you just show every possible use a plant might have?"
**Our answer.** A value-potential is **visible** only from a named molecule with literature
(not bare genus); a species can **claim** it once its OWN extract has actually been screened;
and it can become an **Exchange opportunity** only when a pure compound from THAT accession was
assayed AND the external evidence clears a real confidence bar (a two-key gate).
**Why.** The tiers keep loud claims honest: "a relative of this plant has a compound that does X"
is almost nothing; "this plant's own extract was screened" is a real, species-specific signal.
**If pushed ("doesn't that make commercial wins rare?").** Yes — and it biases them toward
already-known molecules where we add least. That is the honest price of never over-claiming;
the conservation (X/Y) side, not the Z fan, is where the cold-start value lives anyway.

### B2. "Isn't broadcasting hundreds of 'potentials' risky — hype, or handing competitors a target list?"
**Our answer.** Publicly we show an **honest aggregate gap** ("N candidate activities await
screening on this species") with a correctly-computed count — never confident per-claim cards.
The enumerated, muted, label-first detail is **member-gated**.
**Why.** "The gap is the product," but at the *detail* level loud per-edge claims read as hype to
a non-expert and hand a bioprospector a pre-digested target list (a real risk for threatened
geophytes). The aggregate is loud *and* safe; the detail stays with people who read it correctly.

### B3. "How do you decide a plant actually 'has' a bioactivity?"
**Our answer.** A real predicate, not a name match: the compound must resolve to a **chemical
structure identifier**, then **≥1 curated ChEMBL mechanism (direct interaction) OR ≥2 independent
quantitative assays from distinct sources**.
**Why.** We demonstrated live that a name search silently inflated ~84 real assays to 245,867,
and a name lookup silently dropped a real compound (lycorine → 0). A bar stated as a slogan
fabricates or omits; stated as a structure-keyed, independence-counted predicate, it cannot.

### B4. "When you say a plant has 'anti-aging potential,' what does that actually mean?"
**Our answer.** **Two honest numbers, asymmetric.** PRIMARY = the *accession band* — what has
actually been done on THIS plant (rises only via the verb). SECONDARY = a categorical badge for
the *molecule's* literature/clinical status. e.g. "MOLECULE: galantamine — approved AChE inhibitor ·
THIS ACCESSION: not yet assayed."
**Why.** Collapsing them lets a reader conclude the *plant* is verified when only the *molecule* is —
the cosmetic-hype catastrophe ("Galanthus treats Alzheimer's"). Two numbers, accession primary,
makes that conflation impossible.

**System note.** These four are one system, not four knobs (B3 feeds B4 and B1; B2 is B4's width).
And the Z bench is the LAST thing built (deferred); the first build is the pure-conservation IUCN
bench where none of this is in play — so these principles are locked now for talking points, not
because they block anything.

---

## Cluster C — Equity & benefit-sharing (locked PROVISIONALLY 2026-06-11 — "for now")

> The founder cut through the complexity to a simple principle (his instinct: *simpler = progress*).
> Marked provisional: revisited when a first real commercial opportunity is concrete.

### C1. "Who earns equity when work on a plant leads to commercial value?"
**Our answer.** Equity is born **only at a commercial output (the Z axis)** — at the moment a
documented commercial *potential* crosses into the Exchange. **Conservation and knowledge work
(X/Y) is volunteer + ethical → it earns CREDIT** (the receipt as citation/recognition), **never
equity.** The line is drawn by the **output type** (a conservation action vs a documented
commercial potential), not by intent and not by the program.
**Why.** It is the simplest honest rule and it rides on the firewall we already have: inside
GEOCON (conservation + knowledge + even the money-blind potential record) there is no equity;
equity is an Exchange-side, commercial-side fact. It also matches the academic norm —
authorship (credit) vs inventorship (equity).
**If pushed ("but the taxonomy/baseline enabled the commercial find — no share?").** The upstream
conservation/knowledge contributors are **credited** (cited in the value's evidence lineage);
**equity goes to the commercial step's author.** Credit = conservation; equity = commercial. The
rare genuinely-decisive foundational case can be an exception later, but credit is the default.

### C2. "What is the benefit-sharing percentage / the ABS cut?"
**Our answer.** **Deliberately not fixed yet.** Because equity lives entirely on the commercial
(Exchange) side and GEOCON is money-blind, the numbers — the ABS reserved share for the source
community, the traditional-knowledge premium — are **tunable Exchange-side parameters** set when a
real deal exists, not a figure the conservation atlas must carry. What IS fixed structurally: the
receipt captures **consent provenance** (PIC/MAT — already built in Firewall B / ETHNOFLORA) and
the **conservation-vs-commercial (credit-vs-equity) distinction**. Real benchmarks for when we set
the number live in `VNEXT-R3-DECISIONS.md` (Merck-INBio, San-Hoodia, Kani-Jeevani, Cali Fund 2024).

**Note — the gear metaphor.** The founder's "interlocking gears / independent domains" image is kept
for what it is GOOD at — the *systematic + story* of how work in different domains interlocks (the
thing that was "weak"). It is deliberately **not** used as the equity mechanism (looking at it
through the equity window over-complicated it). Story = gears; equity = the simple X/Y-vs-Z line above.

---

*All four decision clusters now journaled (D — Y non-coercion / tic_edge authorship / bench-framing —
was largely settled in the locked model: Y exit non-mandatory; the first environment is the
~70%-shipped real IUCN bench, which breaks the bench-arc resemblance).*
