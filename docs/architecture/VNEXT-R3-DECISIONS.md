# v-next Round 3 — decision substrate (analyze each deeply, not pre-decided)

> 4 domain-expert deep analyses (conservation biology · NP-science/integrity · ABS/equity law · knowledge/product) + synthesis. Each decision: why it matters · full options (pros/cons/second-order) · real grounding · the genuine tension · a one-input rec (NOT the answer).

## D1. Q1 — Reintroduction output: HARD validity-gate or ADVISORY strong-nudge? When a researcher's X-axis position reaches the reintroduction terminal, does the schema refuse to mint a 'reintroduction achieved' receipt until the dependency closure (propagation + genetic breadth + threat-abatement + secured site + monitoring) is satisfied, or does it let them claim it with preconditions surfaced only as strength-reducers and warnings?
**Why it matters:** A receipt is the citable atom that rolls up to the species page and that the Exchange can later cite. A false 'reintroduction achieved' receipt is a fabricated conservation fact — it hits the data-integrity constraint directly. The choice decides whether integrity is STRUCTURAL (the platform cannot say the false thing) or merely PRESENTATIONAL (it says it, but at a low band). The whole v-next thesis is that the firewall is structural, not remembered; an advisory gate quietly converts that guarantee into a remembered one. It also decides whether the flagship conservation action is rare-and-earned or populated-but-noisy.

- **A — HARD validity-gate. Terminal is binary-unavailable until propagation + genetic breadth + threat-abatement + secured site are satisfied; the success receipt cannot be minted at all before monitoring closes.**
  - + Mirrors the strongest reading of IUCN 2013 / CPC: you literally cannot reintroduce without these. Protects the receipt as a trustworthy atom — the asset the entire Exchange-citation model depends on. Makes the gap legible and motivating (a locked-but-reachable goal is more honest than a green check). Maximally defensible to any IUCN/CPC reviewer, which is the platform's whole moat at cold-start.
  - − Heavy: at ~0 users almost no one will ever legitimately reach the most emotionally rewarding output, so the headline action is permanently 'locked' for nearly every species. Risks reading as a bureaucratic obstacle course. The gate is only as good as its predicates — 'secured site' and 'threats abated' are judgment calls (land-tenure docs, field outcomes), not DOIs, so a hard gate forces the platform to adjudicate soft evidence it is not built to verify.
  - ↪ ikincil: Pushes researchers toward lower-barrier X terminals (Red List filed, seed banking) — arguably correct prioritization that directly attacks the 47k IUCN-stub gap. But it also displaces pressure: frustrated users may mis-route, claiming a lighter 'threat-abatement plan' or 'habitat enrichment' win as a proxy for the reintroduction they actually did, polluting the lighter terminals. Gating one output pushes pressure onto its neighbours.
- **B — ADVISORY strong-nudge. Terminal always available to claim; missing preconditions drive the strength band toward 0 and render loud 'premature per IUCN 2013 / CPC' flags, but the receipt can still be minted.**
  - + Respects researcher autonomy and a real field scenario — emergency/rescue translocations ahead of full protocol are legitimate and IUCN-acknowledged. Keeps the headline output reachable, which matters for morale and adoption at cold start. The 0–1 band already carries honesty: a reintroduction at 0.1 with five red flags is visibly weak.
  - − This is the exact failure Godefroid 2011 names — outcomes labelled too early (52% survival, declining over time). A weak-but-present 'achieved' receipt still EXISTS as a fact and rolls up; casual readers see the action, not the 0.1 band ('people read the checkmark, not the footnote'). It converts the integrity guarantee from structural to presentational — the precise posture v-next was built to escape.
  - ↪ ikincil: If the most VISIBLE conservation action is the EASIEST to over-claim, species pages fill with weak reintroduction receipts and signal-to-noise on the flagship action degrades exactly where reputation is most exposed. For a credibility-first cold-start platform this is the dangerous direction.
- **C — SPLIT the gate by precondition class (hard where science is unforgiving AND checkable; advisory where it is judgment). Hard-gate the DOI-checkable validity-critical preconditions (ex-situ material exists, genetic breadth >50 founders documented) and the success claim; advisory-but-strength-capped on the judgment calls (threats abated, site secured) the platform cannot verify.**
  - + Maps the gate to the actual shape of the evidence — hard where truth is binary and checkable, advisory where truth is a human judgment the platform cannot see anyway. Avoids both the 'everything locked forever' failure of A and the 'everything claimable' failure of B. Honors the substrate's own principle (R1 line 34): required only when a downstream output is scientifically invalid/unsafe without it — material and breadth genuinely make the output invalid; site-security makes it risky but is unverifiable.
  - − More moving parts to author and explain. The boundary between 'hard' and 'advisory' precondition is itself a defensible-but-arguable call a reviewer could contest. Requires the schema to carry two precondition classes — slightly more than the current single requires/enriches edge kind, though tic_edge.edge_kind already has room.
  - ↪ ikincil: Establishes a reusable, principled gate-design rule for every future output (the two-filter test), preventing gate-creep elsewhere. It also makes the firewall's credibility structurally defended where the platform can enforce it, while staying honest about what it cannot verify — which is itself a credibility signal to a skeptical auditor.

**Dayanak:** IUCN 2013 Guidelines mandate a comprehensive multi-risk analysis and 'strong evidence that the threats responsible for previous extinctions have been identified and eliminated or significantly mitigated.' CPC Best Practice: threats must be eliminated/alleviated BEFORE introduction; founder size >50 whole plants; 'most reintroductions are monitored for less than 5 years, yet may require decades to evaluate sustainability' (Pseudophoenix sargentii took 25 years to flower in the wild). Godefroid et al. 2011 (249 reintroductions): mean survival 52%, flowering 19%, fruiting 16%, all declining with time — the literature's central failure is calling success too early. The R1 tic-architecture doc (lines 40, 57, 122–125) already flags monitoring >=4yr as REQUIRED to close a return-to-wild output and poses this as a round-2 founder call.

**Asıl gerilim:** Credibility vs. reachability, and structural-vs-presentational integrity. A hard gate makes the flagship action almost unreachable but keeps every reintroduction receipt trustworthy and integrity structural. An advisory nudge keeps the action reachable and morale-positive but demotes integrity to 'we displayed a low number' — exactly the firewall posture v-next was built to escape. A hard gate commits the platform to being an atlas of honest gaps where hard outputs are rare and earned (the North-Star posture); an advisory gate commits it to a more populated but noisier record where the flagship action's meaning is diluted. For a platform whose only cold-start asset is being more honest than the alternatives, dilution of the flagship action is the more expensive mistake.

**Tek-girdi önerisi (cevap değil):** ONE INPUT, NOT THE ANSWER: Option C. Hard-gate the two validity-critical, DOI-checkable preconditions (ex-situ material, genetic breadth) plus the success claim; advisory-strength-cap the unverifiable judgment calls (site, threat-abatement). It is the only option that keeps integrity structural WHERE the platform can enforce it and honest WHERE it cannot — without either locking the flagship forever or letting it be over-claimed. The founder must still personally weigh whether his appetite for a populated atlas (favoring B) outruns the credibility cost of a diluted flagship action.

## D2. Q2 — The PROVISIONAL state: how should the platform represent in-progress-but-unconfirmed reintroduction during the multi-year (CPC: often decades) monitoring window — CLAIMED on execution, first-class PROVISIONAL, or WITHHELD until confirmed?
**Why it matters:** This is where Q1's gate actually lives day-to-day, and the >=4yr (often decades) monitoring window is the NORMAL case, not an edge case — almost every legitimate reintroduction will spend years here. Get it wrong and you either lie (claim early, Godefroid's named failure) or demoralize (withhold the most meaningful work for a decade). It commits the platform to a model of time: whether 'we did it' and 'it worked' are one event or two, and whether the atlas holds the monitoring window open as a dataset nobody else keeps.

- **A — CLAIMED on execution. A translocation executed = full-strength 'reintroduction achieved' receipt; monitoring updates it later.**
  - + Maximally motivating; rewards the hard physical work immediately; matches how grant reports and press releases usually talk.
  - − This IS the Godefroid failure encoded. 52% survival declining over time means a meaningful fraction of 'achieved' receipts describe populations already dead by the time anyone looks. The receipt is the citable atom — an 'achieved' the Exchange later cites for a locally-extinct species is a fabricated conservation fact with downstream commercial reach. Fails data-integrity constraint #1.
  - ↪ ikincil: Included only to mark the boundary — not a real option. If adopted, it would poison the species page's most visible record class and hand the Exchange false provenance.
- **B — PROVISIONAL as a first-class state. A distinct, honest token: 'translocation executed — outcome pending (monitoring year N of >=4)'. A real, credited record of the ACTION taken, explicitly NOT a claim of SUCCESS. Strength starts low and climbs only as monitoring-year tics land (yr-1 survival -> flowering -> recruitment -> self-sustaining). The 'succeeded' terminal fires only when recruitment/self-sustaining evidence closes it.**
  - + Exactly how the science talks — CPC distinguishes 'established' from 'self-sustaining'; Godefroid's whole point is that vital rates en route are the real data. Records the truth at every moment ('this was done; whether it worked is genuinely not yet known') — the North-Star made literal (the temporal gap IS the product). Credits the real, hard, fundable work without claiming an outcome nobody can yet know: morale-positive AND honest, the rare case where they align. Creates a natural multi-year engagement loop (return each year to land the monitoring tic) — a cold-start feature.
  - − Requires modeling a TIME-EXTENDED output with a maturing strength band and scheduled monitoring tics — more than a binary terminal. Requires UI that communicates 'provisional' so clearly it cannot be mis-read as success (the hard part). Real morale risk in the long tail: a researcher who did a textbook translocation watches it sit at 'provisional, yr 2 of 4+' for years; if the UI frames that as incomplete/failing rather than legitimately-in-progress, it reads as punishment for doing the right thing.
  - ↪ ikincil: Done well, this becomes a dataset nobody else has: a structured, longitudinal, money-blind record of in-progress reintroductions with year-by-year monitoring — precisely the gap the CPC Reintroduction Database exists to fill and which most projects FAIL to maintain (monitored <5yr). The platform could become the place that HOLDS THE MONITORING WINDOW OPEN — a genuine, defensible field contribution. That reframes the 'extra work to model' con as the actual product.
- **C — WITHHELD until confirmed. Nothing shows until monitoring closes on a self-sustaining success.**
  - + Maximally conservative; zero risk of over-claim; the species page only ever shows confirmed wins.
  - − Erases the truth. A reintroduction-in-progress is a real, important, often-published conservation action; hiding it for a decade means the atlas is BLANK on the most active conservation work on a species — the opposite of an atlas. Destroys the engagement loop and demoralizes more than B (you did the work, the platform shows nothing). Contradicts the North-Star: withholding the in-progress state hides the gap instead of making it the product.
  - ↪ ikincil: Pushes researchers to record the work somewhere the platform cannot see, fragmenting exactly the longitudinal record B would uniquely capture.

**Dayanak:** CPC Best Practice explicitly separates 'established' from 'self-sustaining' and warns monitoring runs <5yr while sustainability takes decades (Phoradendron rubrum recruitment came ~8 years after sowing). Godefroid et al. 2011's central finding is that vital rates decline over time and outcomes are labelled too early ('three or four years after planting'). The CPC International Reintroduction Database exists precisely to capture longitudinal monitoring that most projects abandon. The substrate's commercialized_outcomes-style ladder pattern (rungs, each its own evidenced step) is the right structural shape for provisional -> monitored -> confirmed.

**Asıl gerilim:** Integrity vs. morale — but uniquely SEPARABLE here. A maximizes morale and destroys integrity (and is firewall-illegal). C maximizes a narrow integrity (no false positives) but destroys completeness, morale, and the North-Star. B is the only option where integrity and morale are BOTH served — but only if the provisional state is framed as a legitimate, credited, scientifically-normal phase, not a half-finished checkmark. The ENTIRE risk of B is presentational, and it is the same risk already flagged for Z's two-number display: people read the badge, not the band. The single design rule that makes B safe: the provisional record must be a DIFFERENT KIND OF TOKEN from a closed win, not the same token at low opacity — two states, two words, two glyphs, never one state on a dimmer. Provisional/monitored/confirmed are separate RUNGS, each its own evidenced step.

**Tek-girdi önerisi (cevap değil):** ONE INPUT, NOT THE ANSWER: Option B, with the hard rule that provisional and confirmed are different tokens/rungs — never one claim on a dimmer switch. It is the only representation simultaneously Godefroid-proof, North-Star-aligned, morale-positive, and a unique field contribution (the longitudinal monitoring record nobody else keeps). The cost is real (time-extended output modeling + disciplined, non-punitive UI for the long-tail wait), and the founder must personally decide whether he will hold the UI discipline that keeps 'provisional yr 2/4+' reading as legitimate-in-progress rather than as failure — because that copy/ranking discipline, not the schema, is where B succeeds or quietly collapses into A or C.

## D3. Q3 — Beyond reintroduction: which conservation actions are GENUINELY hard validity-gates vs. enrichments? And are there gates currently MISSING from the substrate?
**Why it matters:** Gates are where the platform spends its scarce 'you cannot claim this yet' authority. Too many gates and the atlas is empty (an atlas of gaps nobody is allowed to fill — North-Star death). Too few and unsafe or invalid actions get minted as facts. This decision sets the discriminating PRINCIPLE for the whole X/Y output menu, not just one terminal — so it governs gate-creep across every future environment. It also surfaces two conservation-validity gaps in the current substrate (pathogen screening, invasion risk) that are integrity issues, not money/firewall issues.

- **GENUINELY HARD gates (output is fabricated/unsafe without it AND it is platform-checkable): (1) Taxonomy verified — universal root, every action on a misidentified plant is a fabricated fact, checkable via POWO/IPNI. (2) Seed-storage-behaviour routes ex-situ method — a 'seed banked' receipt for a recalcitrant species is not weak but FALSE (the accession is dead); forces in-vitro/cryo. (3) Material secured + viability for any ex-situ accession — binary, checkable via accession record + viability assay. (4) Reintroduction quartet: material + genetic breadth + (NEW) pathogen-screen of outplanted material + monitoring-gated success.**
  - + Each meets the two-filter test (validity-critical OR unsafe, AND checkable) cleanly and is grounded in hard literature (Berjak & Pammenter / Walters on recalcitrant seed; IUCN-mandated health-risk analysis). Taxonomy and storage-behaviour are already correctly in the substrate. The set is SMALL and principled, which is what keeps the atlas fillable.
  - − Items 2 and 4 add conditional complexity (storage-behaviour determination must precede any storage output; pathogen-screen is a new precondition to author). Pathogen-screening is currently ABSENT from the substrate despite IUCN treating health-risk analysis as mandatory — a real omission.
  - ↪ ikincil: Adding pathogen-screening is the most defensible single ADDITION to the current gate set: outplanting nursery-raised material can introduce Phytophthora and other pathogens to a wild recipient site — a documented, serious risk that makes a reintroduction without screening not merely weak but potentially UNSAFE (it can damage the very ecosystem it is meant to restore), squarely meeting the 'invalid OR unsafe' bar (R1 line 34).
- **CONDITIONAL hard gate for out-of-range outputs: invasion-risk / assisted-colonisation assessment. For the specific output class 'assisted colonisation / conservation introduction' (already on the open menu), an invasion-risk assessment is a hard precondition; in-range reinforcement/reintroduction does not trigger it.**
  - + IUCN is unambiguous: 'do not go ahead if the species or its genes are likely to become invasive,' and conservation introductions outside indigenous range carry particularly high risk. A conditional gate keyed to output type targets the riskiest translocation class without burdening in-range work.
  - − Currently there is NO explicit out-of-range / assisted-colonisation branch with its invasion-risk gate in the substrate, even though that output already sits on the open menu — so the riskiest translocation class is presently UNGATED. Authoring the branch + its conditional gate is net-new work.
  - ↪ ikincil: Leaving it ungated is the second conservation-validity gap (alongside pathogen screening). Both are integrity/safety gaps, not money/firewall issues, and both are worth closing before the reintroduction environment ships its out-of-range path.
- **ADVISORY / strength-capping (validity-critical but NOT platform-checkable — the Q1-C pattern): threats abated at recipient site; recipient site secured (land tenure); source-site environmental/provenance climate matching. Surfaced as required attestations with IUCN/CPC citations and a hard strength-cap if absent, but never a binary blocker.**
  - + CPC/IUCN say threats must be removed first and habitat matching is often the most important success factor — so these are validity- or quality-critical. But 'the threat is gone' and 'the site is secured' are field judgments / land-tenure documents the platform cannot verify from a DOI. Advisory-with-cap is honest about that limit; forcing them as binary gates would make the platform adjudicate evidence it cannot see — its own kind of dishonesty.
  - − A reader could argue these are 'real requirements' being demoted to advisories. The mitigation is loud citation + a hard strength-cap so the absence is visible and consequential, just not a fabricated binary 'verified'.
  - ↪ ikincil: This is where the famous 'threats removed first' rule lands — deliberately NOT a hard gate, because the platform cannot verify it. Stating that explicitly prevents reviewers from reading the gate set as naive.
- **ENRICHMENTS (raise the band; never gate — the Y-axis posture): duplicate/safety-backup accessions; viability-assay and germination-protocol refinement beyond the minimum; demographic-monitoring depth beyond the survival minimum; filed Red List assessment (deliberately low-barrier — taxonomy + threat-analysis + baseline only); standalone habitat-enrichment / threat-abatement plans.**
  - + Keeps best-practice work rewarded (higher strength) without blocking the atlas from being filled. Protects the Red List terminal as light — its highest-leverage role against the 47k IUCN-stub gap; gating it heavily would defeat its purpose. Keeping habitat-enrichment as its own honest terminal reduces the Q1 mis-route displacement risk.
  - − Requires discipline not to let any of these creep into gate status as the menu grows.
  - ↪ ikincil: The Red List terminal's lightness is a strategic asset (per the iucn_coverage_gap memory) and should be explicitly protected from gate-creep; making it heavy would silently kill the platform's best near-term conservation win.

**Dayanak:** The discriminating principle is the substrate's own (R1 line 34): a precondition is a hard gate only when the output is scientifically invalid OR unsafe without it — refined here with a second filter: AND it is checkable by the platform. IUCN 2013 makes health/disease risk analysis a core mandated component of any translocation; 'Assessing Disease Risks in Wildlife Translocation Projects' (PMC 2023) documents translocation-introduced pathogens causing serious harm, and Phytophthora introduction via outplanting is a recognized plant-conservation risk. IUCN: 'do not go ahead if the species or its genes are likely to become invasive.' Berjak & Pammenter / Walters establish that recalcitrant/intermediate seed dies in conventional seed banks. CPC: habitat/community matching often more important than other factors.

**Asıl gerilim:** Bureaucratic sprawl vs. unsafe/invalid facts. Every best-practice can be argued into a gate until nothing can be claimed and the atlas is empty — which kills the North-Star (an empty atlas of gaps nobody is allowed to fill). The discipline that prevents it is the two-filter test applied honestly: hard-gate ONLY where the output is scientifically invalid or unsafe without the precondition AND the precondition is checkable; everything validity-critical-but-unverifiable becomes an advisory strength-cap; everything merely quality-improving is an enrichment. By that test the genuinely-hard set is small (taxonomy; storage-behaviour routing; material+viability; the reintroduction quartet; invasion-risk for out-of-range only) — and even 'threats removed first' is best handled as an advisory cap, because pretending the platform can verify it is its own dishonesty.

**Tek-girdi önerisi (cevap değil):** ONE INPUT, NOT THE ANSWER: adopt the two-filter test as the governing principle and keep the hard set small and principled. Beyond confirming the existing gates, the two ADDITIONS to put in front of the founder as well-grounded gaps: (a) pathogen-screening of outplanted material as a hard SAFETY precondition on reintroduction (IUCN-mandated, checkable, currently absent), and (b) invasion-risk assessment as a conditional hard gate on out-of-range / assisted-colonisation outputs only (currently the riskiest translocation class is ungated). Everything else — including 'threats removed' and 'site secured' — is best modeled as an advisory strength-cap or an enrichment, because it is real but unverifiable. The founder should personally decide whether to close gaps (a) and (b) before the reintroduction environment ships, since both are conservation-validity/safety issues independent of the money firewall.

## Cross-cutting (kararlar birbirini nasıl kısıtlar)
The three decisions are one coherent system governed by a single principle, not three independent knobs. (1) The unifying rule that falls out of all three: GEOCON's forcing functions should live ONLY where the science is genuinely unforgiving AND the platform can verify it — and nowhere else. Q1's split-gate, Q2's monitoring-gated success rung, and Q3's two-filter test are three applications of the same test (R1 line 34: required only when the output is scientifically invalid or unsafe without the precondition), refined with the second filter of checkability. Settle the principle once and all three resolve coherently; settle them ad hoc and they will drift apart. (2) Q1 and Q2 are mechanically the same object viewed from two angles: Q1 decides WHETHER the success claim is gated; Q2 decides WHAT the cursor displays during the multi-year window that gate opens. Choosing Q1-C (hard-gate the success claim) without Q2-B (a first-class provisional state) is incoherent — you would gate the success claim and then have nothing honest to show for years, which forces users toward either over-claim (Q1-B by the back door) or abandonment. They must be decided together: hard-gated success REQUIRES a credited provisional state to be humane, and a credited provisional state REQUIRES a gated success to be honest. (3) Q3's two-filter test is the GENERALIZATION of Q1's split — Q1 is just the two-filter test applied to the single reintroduction terminal. So Q1-C and Q3's principle are the same decision at two scales; adopting one commits you to the other. (4) The data-integrity and money-blind firewalls are FIXED constraints under all three and are untouched: every gate and state here is an X-axis conservation action; none introduces a money column; the success claim is gated on real monitoring evidence rather than asserted early (no fabricated values); the existing ABS/consent is_gate nodes that cap strength toward 0 operate independently and are unaffected. The one genuinely irreversible commitment across all three is SCHEMA SHAPE, not the gate thresholds: whether tic_edge.edge_kind can carry two precondition classes (hard vs advisory-cap), whether the output ladder supports separate provisional/monitored/confirmed RUNGS rather than one terminal at variable fill_strength, and whether a pathogen-screen and an out-of-range/invasion-risk branch exist as authorable nodes. If the schema captures those distinctions, every specific gate and threshold above is tunable later without a migration; if it does not, no later tuning can recover a distinction the data never recorded.

## Sequencing (hangisi inşadan önce)
MUST be settled before the first build of the reintroduction environment (they are schema-shaping and cannot be retrofitted without a migration): (1) Q1+Q2 jointly, because the success-claim gate and the provisional state are one design object and determine the output-ladder schema (separate provisional/monitored/confirmed rungs vs one terminal at variable fill_strength) — get the ladder shape wrong and every reintroduction record minted before the fix is structurally mis-modeled. (2) The two-class precondition decision from Q1-C/Q3 (hard-gate vs advisory-strength-cap), because it determines whether tic_edge / the precondition model needs to carry two edge kinds — a schema property, not a runtime setting. CAN wait until the reintroduction environment is actually authored, and need not block the FIRST ship at all: (a) The specific gate THRESHOLDS and which preconditions sit in which class — these are tunable policy once the two-class schema exists. (b) Q3's two ADDITIONS (pathogen-screen node; out-of-range/invasion-risk branch) — they should be authored before the reintroduction environment ships its out-of-range path, but they do NOT block the first build, because the first build environment is the IUCN Red List assessment bench (pure X/Y, no reintroduction, no fan, no external join — the firewall and these gates are trivially not yet exercised). CRITICAL SEQUENCING NOTE: none of these three decisions blocks the first ship. The first environment is the IUCN conservation bench, which involves no reintroduction terminal at all, so all three can be RATIFIED NOW AS POLICY and BUILT LATER, when the reintroduction environment is actually constructed. The discipline to enforce now, before any build, is only the SCHEMA decisions in items (1) and (2) above — capture the distinctions in the data model so the policy is tunable later; defer the thresholds and the pathogen/invasion nodes until the reintroduction environment is on the build path.

---
# FULL CLUSTER ANALYSES (the deep substrate)

## Cluster A — Conservation gates (full analysis)
I now have strong grounding: IUCN 2013 (threats removed, comprehensive multi-risk assessment, "do not go ahead if invasive"), CPC (>50 founders, threats removed first, decades to confirm, monitored <5yr), Godefroid 2011 (52/19/16% with downward time trend), and the existing tic-architecture doc already flags exactly these three questions as round-2 founder calls. I have everything needed to write the decision substrate. No need to over-fetch further.

I'll write the analysis directly as my response (per instructions — not a file).

---

# Conservation-biology decision substrate — v-next (reintroduction gate, the provisional state, and which actions actually gate)

Three locked-model facts frame everything below, so I don't re-litigate them: an output on X/Y is a **real conservation action**, not a potential; **availability is binary, strength is 0–1** (the unlock rule already separates them); and **monitoring (>=4yr) is already flagged as REQUIRED to *close* a return-to-wild output** in `VNEXT-TIC-ARCHITECTURE-R1.md` lines 40, 57, 124. So question 1 is not "invent a gate" — it's "confirm or soften a gate the substrate already proposes," and question 2 is "what does the cursor display in the multi-year window the gate opens." That window is the actual design object.

The empirical floor that should anchor all three answers (this is the load-bearing science):
- **Godefroid et al. 2011** (global review, 249 reintroductions): mean survival **52%**, flowering **19%**, fruiting **16%**, and **all three decline with time** — i.e. the early numbers everyone reports are optimistic. Authors "label outcomes when first reported... three or four years after planting," and conclude **most plant reintroductions will not succeed long-term**.
- **CPC Best Practice**: threats must be **eliminated/alleviated *before* introduction**; founder size **>50 whole plants** beats <50; genetic composition "as diverse as possible while representing the local gene pool"; and the killer line — **"most reintroductions are monitored for less than 5 years, yet may require decades to evaluate whether the population is sustainable."** Case studies: *Pseudophoenix sargentii* took **25 years** to flower/fruit in the wild; *Phoradendron rubrum* recruitment came **~8 years** after sowing.
- **IUCN 2013**: a translocation demands a **comprehensive multi-risk analysis** (ecological, invasion, genetic, disease, socio-economic, financial) and **"strong evidence that the threats responsible for previous extinctions have been identified and eliminated or significantly mitigated"**; **"do not go ahead if the species or its genes are likely to become invasive."**

The through-line: in plant reintroduction, **"we planted it" and "it worked" are separated by a decade, and the literature's central failure is calling success too early.** That single fact is what makes this a firewall-of-truth question, not just a UX question — and it cuts toward gating. Below, the full option space for each, honestly.

---

## QUESTION 1 — Reintroduction output: HARD validity-gate or ADVISORY strong-nudge?

### What "the output" actually means here
The decision is narrow but consequential: when a researcher's X-axis position reaches the reintroduction terminal, does the platform let them **mint a receipt that says "reintroduction achieved"** based only on self-attested preconditions + a planting event, or does the schema **refuse to emit that terminal** until the dependency closure (germination protocol + genetic breadth + threat-abatement + secured site + monitoring) is satisfied? Everything rides on whether the receipt is a *claim of a conservation action* (it is, per the locked model) — because a receipt is the atom that rolls up to the species page and is the thing the Exchange can later cite. A false "reintroduction achieved" receipt is a fabricated conservation fact, which hits constraint #1 (data integrity) directly.

### The option space

**Option A — HARD validity-gate (terminal refuses to emit without the closure).**
The reintroduction terminal is `unavailable` (binary) until: ex-situ propagation evidenced + genetic-breadth tic complete + threat-abatement plan filed + recipient site secured. And the *"reintroduction succeeded"* receipt cannot be minted at all — only a provisional state (Q2) until monitoring closes.
- *Pros.* Matches the strongest reading of IUCN/CPC: you literally **cannot** reintroduce without these, so the schema mirrors reality. Protects the receipt as a trustworthy atom — the one thing the whole Exchange-citation model depends on. Makes the **gap legible** (North-Star: "the gap is the product") — a species with no genetic-breadth tic shows reintroduction as a *locked, reachable* goal, which is more motivating and more honest than a green check. Defensible to any IUCN/CPC reviewer, which matters for a platform whose credibility is its entire moat at cold-start.
- *Cons.* Heavy. For a solo founder at ~0 users, a hard gate on the single most emotionally rewarding output means **almost no one will ever legitimately reach it** in the platform's first years — the headline conservation action is permanently "locked" for nearly every species. Risks the platform reading as a bureaucratic obstacle course rather than an atlas. Also: the gate is only as good as its evidence predicates — "secured site" and "threats abated" are **judgment calls**, not DOIs, so a hard gate forces the platform to adjudicate soft evidence, which it's not built to do (the VERB is DOI-backed; site-security is a land-tenure document, not a paper).
- *Second-order effects.* Pushes researchers toward the **lower-barrier X terminals** (Red List assessment filed, seed banking) — which is arguably *correct prioritization* (those are higher-leverage, more-achievable wins and the Red List terminal directly attacks your 47k IUCN-stub gap per the memory). But it could also push frustrated users to **mis-route** — claiming a "habitat enrichment" or "threat-abatement plan" win as a proxy for the reintroduction they actually did, polluting those lighter terminals. Gating one output displaces pressure onto its neighbours.

**Option B — ADVISORY strong-nudge (terminal emits; preconditions are surfaced as strength-reducers + warnings, not blockers).**
Reintroduction is always *available* to claim; missing preconditions drive the **strength band toward 0** and render loud "premature per IUCN 2013 / CPC" flags, but the researcher can still mint the receipt.
- *Pros.* Respects researcher autonomy and field reality — real practitioners sometimes do **emergency/rescue translocations** ahead of full protocol when a site is about to be destroyed (a recognized, legitimate scenario IUCN acknowledges). Keeps the headline output reachable, which matters for morale and adoption. The 0–1 band already carries the honesty: a reintroduction at strength 0.1 with five red flags is visibly weak.
- *Cons.* This is the **exact failure Godefroid names** — outcomes labelled too early. A weak-but-present "reintroduction achieved" receipt still *exists as a fact* and rolls up to the species page; casual readers see the action, not the 0.1 band (the well-known "people read the checkmark, not the footnote" problem, which `VNEXT-ROUND2-DESIGN`'s display-tier split already worries about for Z). It quietly converts the integrity guarantee from **structural** (can't say it) to **presentational** (said it, but dim) — and the whole v-next thesis is that the firewall is *structural, not remembered*. Advisory gating is remembered gating.
- *Second-order effects.* If the most visible conservation action is the *easiest to over-claim*, the species pages fill with weak reintroduction receipts and the atlas's signal-to-noise on its flagship action degrades precisely where reputation is most exposed. For a credibility-first cold-start platform, that's the dangerous direction.

**Option C — SPLIT the gate by precondition class (hard where science is unforgiving, advisory where it's judgment).** *(This is the option the data actually points toward, offered as one labelled input, not the verdict.)*
Treat the five preconditions not as one undifferentiated gate but by **evidence type**:
- **Hard-gate the DOI-checkable, validity-critical ones**: ex-situ propagation evidenced (you cannot reintroduce material you don't have — this is a *fact about material*, binary, un-fudgeable) and genetic-breadth captured (>50 founders / documented provenance — checkable). These are where the science is genuinely unforgiving *and* the evidence is hard, so a hard gate is both correct and enforceable.
- **Advisory-but-loud on the judgment calls**: "threats abated" and "site secured" — surfaced as required-attestations with literature citations, strength-capped hard if absent, because the platform cannot truly verify a land-tenure claim or a threat-abatement outcome from a DOI. Forcing these as hard binary gates would make the platform adjudicate evidence it can't see.
- **Hard-gate the *success claim* regardless** (this is Q2): the *event* "translocation executed" can be claimed once material + breadth are real; the *outcome* "reintroduction succeeded / self-sustaining" can **never** be minted before monitoring closes.

- *Pros.* Maps the gate to the *actual shape of the evidence* — hard where truth is binary and checkable, advisory where truth is a human judgment the platform can't verify anyway. Avoids both the "everything locked forever" failure of A and the "everything claimable" failure of B. Honors the substrate's own principle (line 34): *required only when a downstream output is scientifically invalid/unsafe without it* — material and breadth genuinely make the output invalid; site-security makes it *risky* but is unverifiable by the platform.
- *Cons.* More moving parts to author and explain; the line between "hard" and "advisory" precondition is itself a defensible-but-arguable call a reviewer could contest. Requires the schema to carry two precondition classes, slightly more than the current single `requires`/`enriches` edge kinds (though `tic_edge.edge_kind` already has room).

### The genuine tension (Q1)
**Credibility vs. reachability, and structural-vs-presentational integrity.** A hard gate makes the flagship action almost unreachable but keeps every reintroduction receipt trustworthy and keeps integrity structural. An advisory nudge keeps the action reachable and morale-positive but demotes integrity to "we displayed a low number," which is exactly the firewall posture v-next was built to escape. **What you commit to:** a hard gate commits the platform to being *an atlas of honest gaps where the hard outputs are rare and earned* (consistent with the North-Star); an advisory gate commits it to *a more populated but noisier record where the flagship action's meaning is diluted.* For a platform whose only asset at cold-start is being more honest than the alternatives, dilution of the flagship action is the more expensive mistake.

**Recommendation (one input among the analysis):** Option C. Hard-gate the two validity-critical, DOI-checkable preconditions (ex-situ material, genetic breadth) and the success claim; advisory-but-strength-capped on the unverifiable judgment calls (site, threat-abatement). This is the only option that keeps integrity *structural where the platform can actually enforce it* and *honest where it can't* — without either locking the flagship forever or letting it be over-claimed.

---

## QUESTION 2 — The PROVISIONAL state: how to represent in-progress-but-unconfirmed conservation

This is the **most important** of the three, because it's where Q1's gate actually lives day-to-day, and because **the >=4yr (CPC: often *decades*) monitoring window is the normal case, not an edge case.** Almost every legitimate reintroduction on the platform will spend years here. Get this wrong and you either lie (claim early, per Godefroid's named failure) or you demoralize (withhold the most meaningful work for a decade).

### The three honest representations

**Option A — CLAIMED on execution (the act is the win; monitoring is a footnote).**
A translocation executed = "reintroduction achieved" receipt, full strength; monitoring updates it later.
- *Pros.* Maximally motivating; rewards the hard physical work immediately; matches how grant reports and press releases usually talk.
- *Cons.* This **is** the Godefroid failure, encoded. 52% survival declining over time means a meaningful fraction of "achieved" receipts describe populations that are **already dead** by the time anyone looks. The receipt is the citable atom — a "reintroduction achieved" that the Exchange later cites for a species that went locally extinct is a fabricated conservation fact with downstream commercial reach. **Rejected on constraint #1.** Not a real option; included only to mark the boundary.

**Option B — PROVISIONAL as a first-class state (claimed-as-*in-progress*, distinct token, strength rises only as monitoring lands).**
A new, *honest* status: **"translocation executed — outcome pending (monitoring year N of >=4)."** It is a real, visible, credited record of *the action taken*, explicitly NOT a claim of *success*. Strength band starts low and climbs only as monitoring-year tics land (year-1 survival → year-2 → flowering → recruitment → self-sustaining). The "reintroduction succeeded" terminal only fires when recruitment/self-sustaining evidence closes it.
- *Pros.* This is **exactly how the science talks** — CPC distinguishes "established" from "self-sustaining"; Godefroid's whole point is that vital rates *en route* are the real data. A provisional state lets the platform record *the truth at every moment*: "this was done; whether it worked is genuinely not yet known." That **is the North-Star** — the gap (here, a temporal gap) is the product. It credits the researcher for the real, hard, fundable work (you *did* execute a translocation) without letting them claim an outcome nobody can yet know. Morale-positive *and* honest — the rare case where they align, because the provisional record is itself a meaningful, citable, creditable thing. It also creates a **natural multi-year engagement loop** (return each year to land the monitoring tic), which for a cold-start platform is a feature: it gives researchers a reason to come back.
- *Cons.* Requires the schema to model a **time-extended output** with a maturing strength band and scheduled monitoring tics — more than a binary terminal. Requires UI that communicates "provisional" so clearly it can't be mis-read as success (the hard part — see below). There's a real **morale risk** in the long tail: a researcher who executed a textbook translocation watches it sit at "provisional, year 2 of 4+" for years; if the UI frames that as *incomplete/failing* rather than *legitimately-in-progress-as-all-good-reintroductions-are*, it reads as punishment for doing the right thing.
- *Second-order effects.* Done well, this becomes a **dataset nobody else has**: a structured, longitudinal, money-blind record of in-progress reintroductions with year-by-year monitoring — which is precisely the gap the CPC Reintroduction Database exists to fill and which most projects *fail* to maintain (monitored <5yr). The platform could become the place that *holds the monitoring window open* — a genuine, defensible contribution to the field, not just a UI state. That reframes the "cons" (it's extra work to model) as the actual product.

**Option C — WITHHELD until confirmed (nothing shows until monitoring closes).**
No record of the reintroduction until it's a confirmed self-sustaining success.
- *Pros.* Maximally conservative; zero risk of over-claim; the species page only ever shows confirmed wins.
- *Cons.* **Erases the truth.** A reintroduction-in-progress is a real, important, often-published conservation action; hiding it for a decade means the atlas is *blank* on the most active conservation work happening on a species — the opposite of an atlas. It also destroys the engagement loop and demoralizes more than B (you did the work and the platform shows *nothing*). And it contradicts the North-Star: withholding the in-progress state hides the gap instead of making it the product.
- *Second-order effect.* Pushes researchers to record the work *somewhere the platform can't see*, fragmenting exactly the longitudinal record B would uniquely capture.

### The integrity ⇄ morale trade-off, stated plainly
- **A** maximizes morale, destroys integrity (and is firewall-illegal).
- **C** maximizes a *narrow* integrity (no false positives) but destroys the atlas's completeness and morale, and *also* fails the North-Star.
- **B** is the only option where integrity and morale are *both* served — but only if the provisional state is framed as **a legitimate, credited, scientifically-normal phase**, not as a half-finished checkmark. The entire risk of B is presentational, and it's the same risk `VNEXT-ROUND2-DESIGN` already flagged for Z's two-number display: people read the badge, not the band.

**The one design rule that makes B safe:** the provisional record must be **a different *kind* of token from a closed conservation win, not the same token at low opacity.** "Translocation executed — outcome pending (yr 2/4+)" must never be visually or semantically interpolatable with "reintroduction: self-sustaining." Two states, two words, two glyphs — never one state on a dimmer switch. (Concretely: the success terminal and the provisional state should be *different rows in the chain*, not the same terminal at fill_strength 0.3. The substrate's `commercialized_outcomes`-style ladder pattern is the right shape: provisional → monitored → confirmed are *rungs*, each its own evidenced step, not opacity levels of one claim.)

**Recommendation (one input):** Option B, with the hard rule above. Provisional is first-class, credited, and *named as the normal scientific state it is*; success is a separate, monitoring-gated rung. This is the only representation that is simultaneously honest (Godefroid-proof), North-Star-aligned (holds the gap open as the product), morale-positive (credits the real work immediately), and a genuine field contribution (the longitudinal monitoring record nobody else keeps). The cost is real (time-extended output modeling + disciplined UI), but it buys the platform something unique.

---

## QUESTION 3 — Beyond reintroduction: which conservation actions are genuinely hard validity-gates vs enrichments?

The discriminating principle is the substrate's own (line 34, and it's the right one): **a precondition is a hard gate only when the output is scientifically *invalid or unsafe* without it — and ideally only when that precondition is *checkable* by the platform.** Two filters, not one: *validity-critical* AND *evidence-checkable*. Where both hold → hard gate. Where validity-critical but not checkable → advisory-strength-cap (the Q1-C pattern). Where neither → enrichment. Here is the menu, sorted.

### GENUINELY HARD validity-gates (the output is fabricated/unsafe without it, and it's checkable)

1. **Taxonomy verified — the universal root.** Already in the substrate as the shared trunk root. *Every* conservation action on a misidentified plant is a fabricated fact (you banked seed of the wrong taxon; you assessed the wrong species; you reintroduced a mislabeled lineage). Non-negotiable, checkable (POWO/IPNI), and already correctly modeled. This is the one gate nobody disputes.

2. **Seed-storage behaviour → routes ex-situ method (the conditional gate).** Already in the substrate (lines 40, 56, 79). This is the *cleanest* hard gate after taxonomy because it's a **validity router**: orthodox seed → seed bank is valid; **recalcitrant/intermediate seed dies in a conventional seed bank** — so a "seed banked" receipt for a recalcitrant species is not weak, it's *false* (the accession is dead). Berjak & Pammenter / Walters establish this firmly. The moment any ex-situ storage output is targeted, storage-behaviour determination is required and *forces* the route (recalcitrant → in-vitro/cryo). Hard gate, well-grounded, checkable.

3. **Material secured + viability — for any ex-situ accession.** Already in substrate. "Banked an accession" with no viable material is a fabricated holding. Binary, checkable (accession record + germination/TZ viability assay). Hard gate.

4. **Reintroduction's material + genetic-breadth preconditions** (per Q1-C) and **the success claim gated on monitoring** (per Q2). Covered above.

5. **Disease/pathogen screening — *conditional* hard gate, and currently MISSING from the substrate.** This is the one I'd flag as a real gap. IUCN 2013 makes **health/disease risk analysis a core, mandated component** of any translocation, and the disease-incident literature shows translocation-introduced pathogens causing serious harm. For plants this is non-trivial: outplanting nursery-raised material can introduce *Phytophthora* and other pathogens to a wild recipient site — a documented, serious risk in ex-situ→in-situ plant conservation. **A reintroduction without a pathogen-screen of the outplanted material is not just weak — it is potentially *unsafe* (it can damage the very ecosystem it's meant to restore).** That meets the "invalid OR **unsafe**" bar (line 34) squarely. It's checkable (a phytosanitary/pathogen-screen record). I'd add **pathogen-clearance of outplanted material as a hard precondition on the reintroduction/translocation output**, alongside material + breadth. This is the most defensible *addition* to the current gate set.

6. **Invasiveness / assisted-colonisation risk — *conditional* hard gate for out-of-range outputs.** IUCN is unambiguous: **"do not go ahead if the species or its genes are likely to become invasive,"** and conservation *introductions* outside indigenous range carry "particularly high risk." So for the specific output class **assisted colonisation / conservation introduction** (already on the open menu, line 58), an **invasion-risk assessment is a hard precondition** — without it the action is potentially unsafe. In-range reinforcement/reintroduction doesn't trigger this; out-of-range does. A conditional gate keyed to output type.

### ADVISORY / strength-capping (validity- or quality-critical, but NOT platform-checkable — the Q1-C pattern)

- **Threats abated at the recipient site.** CPC/IUCN say threats *must* be removed first — so it's validity-critical — but "the threat is gone" is a **field judgment**, not a DOI. Advisory-attestation + hard strength-cap if absent, with the IUCN citation surfaced. (Forcing it as a binary gate makes the platform adjudicate evidence it can't see.)
- **Recipient site secured (land tenure/protection).** Same logic — critical, but verified by a land-tenure document the platform can't validate. Advisory + cap.
- **Source–site environmental matching / provenance climate-match.** CPC: "plant community/habitat matching often more important than other factors" — quality-critical, raises success odds, but a judgment that shouldn't *block* the record. Strong enrichment / strength-driver, not a binary gate.

### ENRICHMENTS (raise the band; never gate — the Y-axis posture)

- **Duplicate/safety-backup accessions** (a second institution holding) — best practice, raises resilience, never required for the *primary* accession to be valid. (Already correctly enrichment, line 41.)
- **Viability-assay refinement, germination-protocol optimization beyond the minimum, demographic-monitoring depth beyond the survival minimum.** All raise strength; none gate.
- **Filed Red List assessment** — deliberately *low-barrier* (needs only taxonomy + threat-analysis + baseline, line 54). This is the right call and worth protecting: it's your highest-leverage X win against the 47k IUCN-stub gap (per the `iucn_coverage_gap` memory), and gating it heavily would defeat its purpose. Keep it light.
- **Habitat enrichment / threat-abatement plan as standalone deliverables** — lighter dependency sets (line 58); keep them as their own honest terminals so people don't *mis-route* a reintroduction into them (the Q1 displacement risk).

### The principle that prevents gate-creep
The danger in gating is **bureaucratic sprawl** — every best-practice becoming a blocker until nothing can be claimed and the atlas is empty, which would *kill* the North-Star (an empty atlas of gaps nobody is allowed to fill). The discipline that prevents it is the two-filter test, applied honestly:

> **Hard-gate only where the output is scientifically *invalid or unsafe* without the precondition AND the precondition is *checkable* by the platform. Everything validity-critical-but-unverifiable becomes an advisory strength-cap. Everything merely quality-improving is an enrichment.**

By that test, the genuinely-hard set is **small and principled**: taxonomy (universal); storage-behaviour (routes ex-situ validity); material+viability (ex-situ); material+breadth+pathogen-screen+monitoring-gated-success (reintroduction); invasion-risk (out-of-range only). Everything else — including the famous "threats removed first" — is best handled as an advisory cap or enrichment, *because the platform can't verify it and pretending otherwise is its own kind of dishonesty.*

---

## Net for the founder's decision (the three calls, as inputs not verdicts)

- **Q1 (gate hard/advisory):** the strongest-grounded answer is **neither pure** — *split by evidence type* (Option C). Hard-gate the validity-critical *checkable* preconditions (ex-situ material, genetic breadth, pathogen-screen) + the success claim; advisory-strength-cap the validity-critical *unverifiable* ones (site, threats). This keeps integrity **structural where you can enforce it** and **honest where you can't**, without locking the flagship forever or letting it be over-claimed. The commit: an atlas where hard conservation wins are rare and earned — which *is* the North-Star posture.

- **Q2 (provisional state):** **first-class provisional** (Option B) is the only representation that is simultaneously Godefroid-proof, North-Star-aligned, morale-positive, and a unique field contribution (the longitudinal monitoring record nobody else keeps). The single hard rule that makes it safe: **provisional and confirmed are different tokens/rungs, never one claim on a dimmer.** This is the real design object of the whole reintroduction story.

- **Q3 (what else gates):** the genuinely-hard set is **small and principled** (taxonomy, storage-behaviour-routing, material+viability, the reintroduction quartet). The two *additions* I'd put in front of you as well-grounded gaps in the current substrate: **(a) pathogen-screening of outplanted material** as a hard *safety* precondition on reintroduction (IUCN-mandated, checkable, currently absent), and **(b) invasion-risk assessment** as a conditional hard gate on out-of-range/assisted-colonisation outputs only. Everything else — including "threats removed" — is best modeled as an advisory strength-cap or an enrichment, because it's real but unverifiable.

The fixed constraints held throughout: no fabricated values (the success claim is gated on real monitoring evidence, never asserted early); money-blind (none of these gates or states touch value — they're all X-axis conservation actions); consent/ABS (the provenance/ABS `is_gate` nodes already cap strength toward 0 independently and are untouched by any of this).

**Two integrity gaps I'd flag for follow-up beyond these three questions:** (1) the current substrate's reintroduction gate has **no pathogen/biosecurity precondition** despite IUCN treating health-risk analysis as mandatory — a real omission worth closing; (2) there is **no explicit out-of-range / assisted-colonisation branch** with its invasion-risk gate, even though that output already sits on the open menu — so the riskiest translocation class is currently ungated. Both are conservation-validity gaps, not money/firewall issues.

Relevant file: `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\docs\architecture\VNEXT-TIC-ARCHITECTURE-R1.md` (lines 40, 57, 122–125 already pose these as round-2 founder calls — this analysis fills them in).

**Sources:**
- [IUCN Guidelines for Reintroductions and Other Conservation Translocations (2013)](https://portals.iucn.org/library/efiles/documents/2013-009.pdf)
- [CPC Best Practice Guidelines for the reintroduction of rare plants (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6112315/)
- [Godefroid et al. 2011, "How successful are plant species reintroductions?" (Biological Conservation)](https://www.sciencedirect.com/science/article/abs/pii/S0006320710004362)
- [Albrecht & Maschinski 2011, "A long-term view of rare plant reintroduction"](https://pdxscholar.library.pdx.edu/esm_fac/32/)
- [Assessing Disease Risks in Wildlife Translocation Projects (PMC, 2023)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10649731/)

## Cluster B — Z value-honesty (full analysis)
Final grounding confirmed. **Galantamine→AChE has 87 curated ChEMBL bioactivity rows**, IC50 100-800 nM, pChEMBL 6.1-7, multiple independent J Med Chem / BMCL documents 1996-2006, BAO-typed binding assays. That is a deeply curated edge — the gold standard the floor should admit at full confidence. And the `Galanthus elwesii` profiling query returns **zero PubMed hits** — meaning even the worked example's "named compounds" depend on the *researcher's own* metabolite_profiling receipt, not on the literature asserting it of the species. That is the firewall-critical distinction: the species→compound link must come from the verb, never from a name-match against external DBs.

I have everything I need. Writing the analysis now.

---

# Z VALUE-HONESTY: deep analysis of the four decisions

Grounded live in ChEMBL / PubMed / ClinicalTrials.gov this session. Three anchor molecules carry the whole argument because they sit at three genuinely different evidence maturities, which is exactly what the tier system has to express honestly:

| Molecule | ChEMBL curated mechanism | Curated bioactivity | PubMed assays | Clinical reality | Honest tier ceiling |
|---|---|---|---|---|---|
| **Galantamine** (CHEMBL659→AChE CHEMBL220) | YES — INHIBITOR, direct, disease_efficacy, max_phase 4, DailyMed label | **87 rows**, IC50 100-800 nM, pChEMBL 6.1-7, J Med Chem 1996-2006 | many | **Approved drug**; Alzheimer 59 trials incl. Phase 3 J&J | T4 (mechanism/clinical precedent) |
| **Colchicine** (CHEMBL107→β-tubulin CHEMBL2095182) | YES — INHIBITOR, "binds beta tubulin", max_phase 4, DailyMed+PubMed | curated | many | gout approved (T4); **CV 137 trials Phase 2-4** (T4); oncology preclinical (T1-2) | T4 on 2 indications, T1 on a 3rd — *off one mechanism node* |
| **Lycorine** | **NONE** — name search returns 0; canonical ID 404s | none retrievable | 84 antiproliferative + 22 with IC50 in title + 95 antiviral | **0 clinical trials** | T1-T2 (literature on compound; no translation) |

This table *is* the decision substrate. Every floor below is calibrated so that galantamine and colchicine can reach the top, lycorine is honestly visible but capped, and nothing fabricates.

A second live finding sets a hard constraint under all four decisions: **the external join cannot be name-keyed.** "lycorine" returns nothing in ChEMBL by name, and the worked-example phrase "Galanthus elwesii metabolite profiling" returns nothing in PubMed. So the species→compound edge must be minted by the researcher's own `metabolite_profiling` receipt carrying a resolved structural identifier (InChIKey/ChEMBL_id), and the *external* fan must be keyed on that identifier — never on a string match. A name-keyed fan would silently drop lycorine (under-claim) or silently bind the wrong synonym (fabricate). This is foundational to decisions (3) and (4).

---

## DECISION 1 — TIER FLOORS: visible-as-gap vs available-to-claim vs exit-eligible

**The real considerations.** Three different thresholds are being conflated under one word "floor." They serve three different audiences and three different failure modes:
- **VISIBLE-as-gap** serves the North-Star ("the gap is the product"). Failure mode if too high: the atlas hides the very unknowns it exists to show. If too low: noise.
- **AVAILABLE-to-claim** (a researcher may attach this potential to their position / declare intent on it) serves work-routing. Failure mode if too low: researchers chase literature ghosts; if too high: real opportunities stay invisible until someone already did the work.
- **EXIT-eligible** (may be declared a Commercial Output and cross the firewall to the Exchange) is the one with teeth — it is the only place an over-claim becomes *money-adjacent*. Failure mode if too low: GEOCON's credibility (the firewall-as-credibility-engine) collapses on the first VC who checks; if too high: nothing ever exits and the value thesis is theater.

**The option space.**

**Option 1A — Recommendation in the docs: visible always (T0+), available ≥T2, exit ≥T3.**
- *Pros:* Maximal North-Star payoff (even T0 genus-inference is shown as gap). Available at T2 means "this species' own extract has been screened" — a real, species-specific signal, not just literature. Exit at T3 means "a pure compound from this accession was assayed" — defensible to an external party.
- *Cons / second-order:* "Visible always" at T0 (genus-inferred, cap ~0.15) is the riskiest broadcast — see Decision 2. T0 says *almost nothing* ("a relative of this plant has a compound that does X") and is the easiest to mistake for a claim by a non-expert reader or a journalist.
- *Second-order commitment:* The platform commits to rendering, on potentially every one of 47k species pages, a long tail of T0/T1 candidates. That is a UI-drowning risk the R1 caveats explicitly flag ("legibility at scale is UNTESTED").

**Option 1B — visible ≥T1, available ≥T2, exit ≥T4.**
- *Pros:* Drops pure genus-inference (T0) from public view — you only surface a potential once a *named molecule* with literature exists (galantamine, lycorine both qualify; a random Colchicum with no profiling does not). Exit at T4 is the strictest honest bar: a mechanism is confirmed *or* a clinical/approved precedent exists for that molecule-target pair. Galantamine's AChE edge (max_phase 4, 87 assays) clears it; lycorine's antiproliferative literature does **not** (0 trials, no curated mechanism) — which is *correct*: lycorine should not be Exchange-listable as an oncology potential today.
- *Cons / second-order:* T4 exit is very high. It means a solo researcher almost never reaches exit on their own accession without either (a) the molecule already being a known drug (in which case "potential" is thin — the world knows galantamine inhibits AChE) or (b) doing mechanism-confirmation wet-lab work that is years away. This risks making the Z exit feel unreachable, undercutting the "living value engine yields outputs" promise. It also creates a perverse incentive: the easiest T4 exits are *already-known drugs*, where GEOCON's marginal contribution is smallest.

**Option 1C (synthesis I'd put forward as one input): keep T2/T3 floors but make EXIT a two-key gate, not a single tier.**
Exit-eligible iff **T3 (a pure compound from THIS accession was assayed on THIS activity) AND the external edge clears the Decision-3 confidence floor.** Tier T3 proves *the species really makes the active molecule and it really has the activity in your hands*; the external floor proves *the activity class is real, not one weak paper*. This decouples "your accession is real" (T3, intrinsic) from "the target biology is real" (external, extrinsic) — you need both, and neither alone. Galantamine: a researcher who isolates galantamine from their Galanthus and runs an AChE IC50 hits T3, and the external AChE edge is rock-solid → exit-eligible, honestly labeled "documented AChE-inhibition potential, this accession assayed, molecule has approved precedent." Lycorine oncology: even at T3 (isolated, cytotoxic in their hands), the external edge is preclinical-only, so it exits as a *weaker-labeled* potential or is held — see Decision 3.

**The genuine tension.** Floors high enough to protect Exchange credibility (1B) make the Z exit rare and bias it toward already-known molecules where GEOCON adds least. Floors low enough to feel alive (1A) put the over-claim risk onto the public T0/T1 tier. **1C resolves this by moving the strictness off the *visibility* axis (keep the gap visible) and onto the *exit* axis (make crossing the firewall require both intrinsic and extrinsic proof).** That is the most faithful expression of "potential not product": the gap stays loud, but the door to money requires two independent keys.

**What each choice commits the platform to.** 1A commits to heavy public T0 rendering + UI scale work. 1B commits to a rare, prestige Z exit that mostly re-documents known drugs. 1C commits to building the Decision-3 external floor as a *hard gate on exit* (not just a display hint) — slightly more engineering, but it is the only option where the firewall's credibility is structurally, not editorially, defended.

**Recommendation (one input, not a verdict):** Visible from T1 (named molecule, not bare genus — drop public T0 to a "potential exists in genus" muted line at most). Available at T2. **Exit = T3 AND external-floor-pass (Option 1C).** This keeps the North-Star gap loud while making the one money-adjacent threshold structurally honest.

---

## DECISION 2 — BROADCAST WIDTH: how loud/public should T1 be

**Why this is the sharpest decision.** A single `metabolite_profiling` receipt naming a handful of Amaryllidaceae alkaloids fires *every* external edge for *every* named compound *simultaneously* at T1. I watched this nearly go wrong live: the query `lycorine antiproliferative OR anticancer` returned **245,867 hits** because of loose Boolean binding, when the honest signal is ~84 title-level papers. **An automated T1 fan that miscounts evidence by 3000× is not hypothetical — it happened in this session.** The over-claim surface is real and mechanical, not just reputational.

**The considerations.**
- *North-Star payoff:* T1 is where "the gap is the product" lives most vividly. "Galanthus makes lycorine; lycorine shows antiviral activity in 95 studies; nobody has tested *this accession* — here is the open question with your name on it." That is genuinely the product.
- *Scoop / IP risk:* Broadcasting (species × compound × candidate indication × locality) publicly hands a competitor or a bad-actor bioprospector a pre-digested target list. For threatened geophytes this compounds the existing locality-sensitivity tiering.
- *Over-claim / cosmetic-hype risk:* Hundreds of T1 points rendered loudly read, to a non-expert (a journalist, an investor skimming, the founder's own future marketing), as "Galanthus treats cancer, Alzheimer's, and viruses." The tier label *says* "untested on this accession," but loud rendering + many points = an impression the label can't undo.

**The option space.**

**Option 2A — T1 fully public, loud, all points rendered (max North-Star).**
- *Pros:* Maximal gap-visibility; most screenshot-worthy; best recruitment ("come prove this").
- *Cons / second-order:* Worst over-claim surface; worst scoop exposure; the 245k-miscount class of bug becomes a *public* artifact. Commits the platform to defending every loud T1 against "you said this plant cures cancer." For a no-hype, credibility-first founder this is the highest tone-risk in the whole design.

**Option 2B — docs' recommendation: T1 gated to members via `chain_link_fact.sensitivity`; T2+ public.**
- *Pros:* Honest "untested gap" stays inside the working community who can read it correctly; the public sees only species-specific signal (T2 = this extract was actually screened). Reuses shipped sensitivity tiering — zero new mechanism. Scoop risk contained to authenticated researchers.
- *Cons / second-order:* Dampens the North-Star payoff precisely where it's strongest — the *public* atlas no longer shows the widest gap. A cold-start platform with ~0 members hides its most compelling content behind a near-empty member wall. Risks the gap being invisible exactly when visibility is the growth lever.

**Option 2C (synthesis input) — public AGGREGATE, member-gated DETAIL ("the gap is public, the list is member-gated").**
Publicly, on the species page, render T1 as a **single honest sentence with a count, not an enumerated list:** *"Galanthus elwesii's profiled chemistry intersects 40+ documented bioactivity classes across pharma/nutra/cosmeceutical — all untested on this accession. [Open questions: members]."* The *fact that a wide gap exists* is public (North-Star satisfied, and it's screenshot-worthy as a gap, not a claim). The *enumerated (compound × indication) list* — the scoop-able, miscount-prone, hype-prone detail — is member-gated (2B's protection). This directly mirrors the existing program-visibility pattern (public = mission + aggregate progress; interior = detail) and the receipt allowlist philosophy.
- *Pros:* Keeps the gap loud AND public without rendering a single specific over-claimable line; eliminates the public miscount surface (no per-edge counts shown publicly); preserves recruitment ("there's a gap here — join to see it"); scoop list stays gated.
- *Cons:* Requires a deliberate aggregate-rendering component (small build). The aggregate count itself must be computed honestly (the 245k bug must be fixed *before* even a count is shown — see below).

**The genuine tension and what it commits to.** The tension is North-Star-loudness vs hype/scoop-safety, and it is irreducible at the *detail* level. But it is *separable* at the aggregate level: a gap can be advertised without its contents being enumerated. 2C commits the platform to one honest aggregate sentence publicly and the detailed fan behind auth — which is the same shape as every other firewall-respecting surface in the system.

**Two hard constraints under any option (both proven live this session):**
1. **Counts must be computed with strict Boolean binding and identifier-keyed queries**, not name+OR. The 245,867 vs 84 gap is the difference between honesty and fabrication-by-query-bug. Any number shown to any user must come from a parenthesized, field-tagged, structure-identifier-anchored query.
2. **Loud rendering is itself a claim, independent of the label.** N points rendered prominently = "this plant does N things," regardless of the "untested" tag. So width must be expressed as *aggregate gap*, and individual points must render in deliberately muted, single-line, label-first form ("MOLECULE verified in literature · THIS ACCESSION untested") — never as a confident card.

**Recommendation (one input):** Public = honest aggregate gap sentence (count computed correctly). Member-gated = the enumerated, muted, label-first fan. Never render T1 points as confident cards anywhere. This is 2C, and it is the only option that keeps the North-Star loud while removing the public over-claim and scoop surfaces.

---

## DECISION 3 — THE EXTERNAL-EDGE CONFIDENCE FLOOR

**This is the load-bearing integrity decision, and the live data resolves it cleanly.** The question: before an (activity × compound) edge from external DBs lights a potential, what must be true? The docs propose `≥1 curated ChEMBL mechanism OR ≥2 independent PubMed assays`. The live evidence shows **this exact OR is correct, because each clause admits a different real molecule, and neither alone admits all three anchors:**

- **Galantamine → AChE:** clears clause 1 decisively (curated ChEMBL mechanism: INHIBITOR, direct_interaction, disease_efficacy, max_phase 4, DailyMed) *and* clause 2 (87 bioactivity rows across ≥4 independent J Med Chem/BMCL documents). Belt and suspenders.
- **Colchicine → tubulin:** clears clause 1 (curated mechanism, binds beta-tubulin, max_phase 4) — and the CV indication is *separately* validated by 137 clinical trials. Clause 1 alone is enough here.
- **Lycorine → antiproliferative/antiviral:** clears **only clause 2** (84 + 22 + 95 PubMed assays) — **ChEMBL has no resolvable curated mechanism for it.** If the floor were "curated ChEMBL mechanism *required*" (AND not OR), the single most-studied Amaryllidaceae anticancer alkaloid would be **invisible** — a massive false-negative against the North-Star. The OR is what saves it.

**So the OR structure is empirically validated.** But the live session also exposed three failure modes the bare floor does not yet handle:

**Failure mode A — name resolution (proven).** ChEMBL returned **0** for "lycorine" by name and 404'd the ID. A floor stated as "≥1 ChEMBL mechanism" is meaningless if the compound can't be *found* in ChEMBL by the key you have. **Mitigation:** the edge must be keyed on **InChIKey / canonical structure identifier minted by the researcher's profiling receipt**, with name as a fallback display only. If structure resolution fails, the compound is "named in this accession but not externally resolvable" — a legitimate T1-floor *fail* (visible as the researcher's own finding, but it lights no external fan). This turns a silent failure into an honest state.

**Failure mode B — query-binding inflation (proven).** The "≥2 independent PubMed assays" clause is only honest if "assay" is counted rigorously. `lycorine antiproliferative OR anticancer` = 245,867 (garbage). `lycorine[Title] AND IC50` = 22 (real). **The floor must specify the counting query**, not just the threshold: field-tagged (`[Title]` or `[Title/Abstract]`), compound-anchored, with quantitative-assay terms (IC50/EC50/Ki), and de-duplicated by document. "≥2 independent assays" must mean ≥2 distinct PMIDs each reporting a quantitative value, not ≥2 hits in a loose string search.

**Failure mode C — "independent" is doing real work.** Two papers from the same lab citing the same original finding are not 2 independent assays. The honest version: ≥2 distinct quantitative measurements from ≥2 distinct documents/groups. ChEMBL's 87 galantamine rows span 1996-2006 across multiple journals — genuinely independent. A floor that doesn't check independence can be gamed by a review-citation cascade.

**The option space for the floor strength:**

**Option 3A — docs' floor as written: `≥1 curated ChEMBL mechanism OR ≥2 independent PubMed assays`.**
- *Pros:* Validated by the live data (admits galantamine, colchicine, lycorine correctly). Two clauses cover the two real evidence shapes (curated-mechanism molecules vs literature-only molecules).
- *Cons:* As written, vulnerable to failure modes A/B/C above. Needs the keying + counting + independence specifications bolted on or it's not actually safe.

**Option 3B — stricter: `≥1 curated ChEMBL mechanism` required for any *pharmaceutical-domain* edge; PubMed-only edges allowed but capped one tier lower and labeled "literature-only, no curated mechanism."**
- *Pros:* Pharma is the highest-stakes, most-scrutinized domain; requiring a curated mechanism there is the most defensible. Lycorine oncology would surface but visibly flagged "literature-only" and capped below a mechanism-backed edge — *more* honest than treating it identically to galantamine.
- *Cons:* Adds a domain-conditional rule (more complexity). Could be seen as over-engineering for v1, which won't ship the Z bench anyway (it's sequence step 6, deferred).

**Option 3C — looser: any single curated source (1 ChEMBL OR 1 strong PubMed assay).**
- *Cons:* Re-opens the door the lycorine-ID failure warned about: one weak/wrong paper mints a T1 potential. The docs' own caveat ("without it, a single weak paper could mint a T1 potential") rejects this. Not recommended.

**Recommendation (one input):** Adopt **3A's OR structure (validated live) but specify it as a real predicate, not a slogan:**
> An external (compound × activity) edge lights iff the compound resolves to a structure identifier from the profiling receipt **AND** [ ≥1 ChEMBL mechanism row with `direct_interaction=true` for that target family **OR** ≥2 distinct PMIDs each reporting a quantitative assay (IC50/EC50/Ki) from ≥2 independent documents ]. Pharma-domain edges without a curated mechanism are admitted but tier-capped one band lower and labeled "literature-only" (the 3B graft).

This is the version where galantamine reads as gold, lycorine reads as a real-but-literature-only gap, and the 245k-miscount and the lycorine-404 can never silently fabricate or silently drop an edge. **Who curates / authors this floor and the `tic_edge` welds remains a genuine founder/governance call** (founder vs accredited steward vs AI-draft-with-`[EKLE:]`) — flagged unresolved.

---

## DECISION 4 — THE "MOLECULE VERIFIED IN LITERATURE" vs "UNTESTED ON THIS ACCESSION" DISPLAY SPLIT

**The core honesty problem, stated precisely.** For galantamine, two facts are *both true and must not be collapsed*:
- (Molecule axis) Galantamine is a verified, approved AChE inhibitor — 87 ChEMBL assays, max_phase 4, 59 Alzheimer trials. **This is settled science.**
- (Accession axis) *This particular Galanthus elwesii accession* has **not** been assayed for AChE inhibition by this researcher. **This is an open question.**

A single number cannot carry both. If you show only the molecule axis, you imply "this plant is a proven Alzheimer's source" (over-claim — fabricates an accession-level result). If you show only the accession axis (T1, weak), you *hide a true and decision-relevant fact* (that the molecule has approved precedent) — which under-informs and makes the genuinely-promising galantamine point look identical to a random weak edge. **Both single-number collapses lie, in opposite directions.**

**The option space.**

**Option 4A — collapse to species-axis only (conservative single number).**
- *Pros:* Impossible to over-claim about the plant; simplest UI; one band per point.
- *Cons / second-order:* Hides the precedent. Galantamine (approved-drug target) and lycorine-vs-some-obscure-target (preclinical hint) render *identically* at T1 — destroying the researcher's ability to prioritize. The platform's value (revealing *which* gaps are worth closing) is gutted. Actively misleading by omission.

**Option 4B — collapse to molecule-axis only (show the literature strength).**
- *Cons:* The worst option. Renders "Galanthus — AChE inhibition — verified (max_phase 4)" and a reader concludes the *plant* is verified. This is the cosmetic-hype catastrophe. Rejected.

**Option 4C — docs' recommendation: show BOTH axes explicitly (two labeled numbers per point).**
- *Pros:* The only fully honest rendering. "MOLECULE: galantamine — verified AChE inhibitor, approved (T4 precedent) · THIS ACCESSION: not yet assayed (T1)." A reader cannot conflate them because they're named separately. It also makes the *value of the work obvious*: the gap between "molecule verified" and "accession untested" *is* the open question the researcher can close — North-Star made literal. Prioritization is restored: galantamine's molecule-axis is bright, lycorine-oncology's is dim, even when both accession-axes are T1.
- *Cons / second-order:* Two numbers per point × hundreds of points = cognitive load and UI density (the R1 "drowning" caveat). Mitigated by Decision 2 (member-gated detail, muted single-line rows) and by rendering the molecule-axis as a compact badge ("approved-precedent" / "preclinical" / "no clinical data") rather than a second full band.

**The genuine tension.** Honesty *demands* two pieces of information (4C); usability *pushes toward* one (4A). The resolution is not to drop a number but to **make the two pieces asymmetric in weight:** the **accession axis is the primary band** (it's the researcher's actual evidence, it's what the receipt certifies, it's what rises with their work), and the **molecule axis is a secondary provenance badge** (a categorical precedent tag: `approved-drug precedent` / `clinical-stage` / `preclinical-only` / `literature-only, no curated mechanism`), not a competing 0-1 number. One band, one badge. This keeps a single evidence band per position (preserving the clean shipped 0-1 model and avoiding two-number confusion) while never hiding the precedent.

**What this commits the platform to.** A rendering contract: **every Z potential shows (a) the accession band — the real, earned, rising number — as primary, and (b) a categorical molecule-precedent badge sourced from the external floor — as secondary, never a number that competes with the band.** And a hard rule: the molecule badge can *never* raise the accession band. Galantamine's approved status does **not** make *this Galanthus* a stronger result — it only tells the researcher this gap is worth closing. That separation *is* the firewall between "what's known about the molecule" and "what's proven about this plant."

**Recommendation (one input):** **4C, asymmetric form.** Accession evidence = the primary 0-1 band (rises only via the verb, per the locked model). Molecule literature/clinical status = a secondary categorical precedent badge from the Decision-3 external floor. Two facts, two visual weights, one band. This is the display rule that makes "potential not product" legible at a glance: *the plant has a documented potential; the proof on this accession is exactly this much, and no more.*

---

## Cross-cutting findings the founder should weigh as a set

1. **The four decisions are one system, not four knobs.** Decision 3 (external floor) is the *input* to Decision 4's molecule badge and to Decision 1's exit gate; Decision 2 (width) is just Decision 4's rendering applied at scale. Calibrate them together: a strict, well-specified external floor (3) makes an honest molecule badge (4) possible, which makes a loud-but-honest public gap (2) safe, which lets the exit gate (1) trust the T3+external two-key.

2. **Two fabrication-by-tooling failures were demonstrated live, not theorized** — the 245,867-vs-84 query-binding inflation and the lycorine name/ID resolution failure. The locked frame already says "the money-blind line and the no-fabrication line are the same line." These two bugs show a *third* line that is identical to both: **the honest-query line.** A number produced by a sloppy external query is a fabricated value, exactly as forbidden as a money column. The external-edge layer needs the same write-discipline (`evidence_json_is_clean`-grade rigor) applied to its *query construction*, not just its storage.

3. **The strict version biases the Z exit toward already-known drugs** (galantamine, colchicine), where GEOCON's marginal scientific contribution is smallest, and away from novel chemistry (lycorine-class), where it's largest. This is a real strategic tension with no clean answer: tight floors protect credibility but reward re-documenting known biology; loose floors reward novelty but risk the hype the founder most wants to avoid. The 1C two-key exit (intrinsic T3 *and* extrinsic floor) is the least-bad resolution because it lets novel chemistry exit *on the strength of the researcher's own accession-level assay* (T3) even when external precedent is only preclinical — labeled honestly as such — rather than requiring the molecule to already be a drug.

4. **Sequencing protects all of this.** The Z bench is sequence step 6 (deferred); the first build is the IUCN conservation bench (pure X/Y, no fan, no external join, firewall trivially safe). So these four decisions can be *ratified now as policy* but *built last*, after the conservation bench proves the generalized-workbench pattern with zero firewall exposure. None of these decisions blocks the first ship.

**Files:** the locked model and all four decisions live in `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\docs\architecture\VNEXT-PORTFOLIO-RECONCEPTION.md` (LOCKED MODEL, lines 152-196), `VNEXT-ROUND2-DESIGN.md` (tier floors + external floor as open questions, lines 132-138; Z trunk/fan, line 78-82), and `VNEXT-TIC-ARCHITECTURE-R1.md` (the T0-T4 ladder + unlock rule + firewall check, lines 60-119). The unresolved-lycorine-ChEMBL-ID flagged at `VNEXT-ROUND2-DESIGN.md:82` and `VNEXT-TIC-ARCHITECTURE-R1.md:134` is now resolved as a confirmed name/ID resolution failure — which is itself the strongest live argument for the Decision-3 floor.

## Cluster C — ABS / equity / rights (full analysis)
I now have a strong, real-world evidence base spanning four canonical ABS structures, the modern multilateral benchmark, and the legal inventorship/authorship line that governs the equity-vs-credit question. I have enough to write the decision substrate. No more searches needed — let me synthesize.

---

# ABS / benefit-sharing & research equity — decision substrate for GEOCON v-next

Scope note. This covers two LOCKED-frame decisions where GEOCON stays money-blind but the *receipt/evidence lineage* it produces becomes the input to an Exchange-side rights computation:
1. **The ABS reserved-share fraction** — the off-the-top slice for the source community/country, and the traditional-knowledge (TK) multiplier.
2. **Foundational-work equity** — whether upstream load-bearing contributors (genus taxonomy, baseline assessment, reused methods) get a token equity slice or reputational credit only.

Both are *parameter* decisions encoded in the lineage schema, not money flows. GEOCON records *who contributed what, load-bearing weight, and a provenance tag* (ABS-relevant / TK-derived / foundational). The Exchange reads that lineage and computes shares. So what you are really deciding is **what the receipt commits to remembering, and with what default weights** — the actual money math is downstream and replaceable. That asymmetry matters and I'll return to it.

---

## Part 1 — The ABS reserved-share fraction

### 1.1 What the question actually is

When a Z-axis *documented potential* on a GEOCON species crosses into the Exchange and reaches a *value event* (a license, a product, a revenue stream), some fraction comes "off the top" — before contributor lineage is divided — and is reserved for the **source** (the country of origin and/or the community/Indigenous group whose land or knowledge the resource came from). The question has two parameters:
- **(a) the base ABS reserved fraction** (for plain genetic-resource provenance, no TK), and
- **(b) the TK multiplier** — how much *heavier* the reservation is when the lead originated in traditional knowledge.

### 1.2 The real-world anchor points (these are the numbers that exist)

I deliberately pulled the four canonical agreements plus the new multilateral benchmark, because together they bracket the entire defensible range:

| Precedent | Base / sample royalty | Reserved-for-source share | TK present? | What it teaches |
|---|---|---|---|---|
| **Merck–INBio** (Costa Rica, 1991) | Royalties ~**0.5–4%** of net sales (undisclosed exact); $1M+ upfront | INBio committed **50% of royalties** + **10% of project budget** to the national conservation system (SINAC) | No TK — pure biodiversity access | Sets the *royalty band* (~1–4%) and the principle that **half of the discoverer's take** can be routed to conservation/source |
| **San–CSIR Hoodia** (South Africa, 2003) | — | San получили **8% of milestone payments** + **6% of royalties** *that CSIR receives* | **Yes — TK lead** (San knowledge of appetite suppression) | The canonical **TK premium expressed as a fraction of the discovering institution's receipts**, not of gross |
| **Kani–TBGRI Jeevani** (India, 1999) | License fee + **2% royalty** | **50%** of license fee AND royalty to the Kani trust | **Yes — TK lead** | The high-water TK mark: a **50:50 split** between the scientific institution and the knowledge-holder community |
| **Cali Fund / DSI multilateral** (CBD COP16, 2024; launched Feb 2025) | — | **1% of profit OR 0.1% of revenue** suggested contribution; **≥50%** of the fund earmarked for Indigenous peoples & local communities; **academic/non-commercial exempt** | Mixed/pooled | The **modern, multilateral, money-blind-compatible** benchmark — a *small off-the-top levy*, with the *internal* split to communities at ~50% |

Two structural readings jump out:

- **The "off-the-top from gross" number is small** (Cali: 0.1% of revenue / 1% of profit; classic royalties 0.5–4%). Nobody reserves 30% of *gross revenue* for the source — that would kill the deal. The big fractions (50%) are always **shares of the discovering party's own slice**, not of the whole pie.
- **The TK premium is real and large, but it's expressed against a specific base.** Hoodia: 6–8% *of CSIR's receipts*. Kani: 50% *of TBGRI's license + royalty*. When TK is the *lead*, the community moves from "small off-the-top" to "co-equal partner with the discoverer."

This distinction — **fraction of GROSS (the reserved levy) vs. fraction of the DISCOVERER's slice (the partnership split)** — is the single most important design choice, and it's where most naive ABS designs go wrong.

### 1.3 The two structurally different ways to encode the reservation

**Model A — Off-the-top levy on the value event (the "Cali" shape).**
A fixed small fraction *F_base* of the gross value event is reserved for source before any contributor lineage is split. TK adds a multiplier: *F_tk = F_base × M*.
- *Pros:* simple; matches the modern multilateral consensus; predictable for the Exchange's commercial counterparties (a known, small cost of goods); the source is paid *first* and *unconditionally* — strongest fairness signal; survives even if the downstream contributor lineage is contested.
- *Cons:* a flat small fraction can feel **tokenistic** precisely in the TK case (0.1% of revenue to a community that *gave you the entire lead* is the Hoodia critique — see §1.6); doesn't scale the source's reward to how *load-bearing* the source actually was.

**Model B — Source-as-a-contributor in the lineage (the "Kani" shape).**
The source isn't a levy; it's a **first-class node in the contribution graph** with a load-bearing weight. A plain genetic-resource origin gets a modest weight; a TK lead gets a *heavy* weight (potentially co-equal with the discovering researcher).
- *Pros:* fairness scales with actual contribution — a community whose TK *was* the discovery can be weighted at parity (the Kani 50:50); fits GEOCON's existing "load-bearing contribution" lineage primitive *exactly* — you don't need a second mechanism; honest (a centroid-level "this came from Country X's flora" is genuinely a small contribution; a documented TK use is a large one).
- *Cons:* the source's reward is now *contingent* on the rest of the lineage and on the value event being correctly attributed; harder for the source to understand ("you're 18% of a weighted graph" vs "you get 6%"); a sophisticated downstream actor could *dilute* the source by stuffing the lineage with many small contributors.

**The honest synthesis the precedents point to is a hybrid:** a **small unconditional off-the-top floor (Model A)** *plus* **source-as-weighted-contributor (Model B)**, with the TK multiplier applied to *both*. This is in fact what the best real agreements do implicitly: Merck–INBio has both an upfront/budget commitment (floor) *and* a royalty share (contingent); the Cali Fund has a levy *and* earmarks ≥50% internally to communities.

### 1.4 A concrete, defensible parameter set (one labelled input — not the decision)

Grounding each number in a real precedent so it's defensible, not invented:

- **Base ABS reserved floor (no TK):** **1–3% of the gross value event**, reserved unconditionally for the country/region of origin.
  *Grounding:* sits inside the classic 0.5–4% bioprospecting royalty band (Merck–INBio, Kani 2%) and an order of magnitude above the Cali levy — defensible as "more than a multilateral fund pool because this is a *direct, attributed* lineage, not anonymous DSI." Below ~1% reads as tokenistic; above ~5% of *gross* starts to deter the commercial counterparty.
- **TK multiplier on the floor:** **×2 to ×3** → a TK-led potential reserves **~5–8% off the top**.
  *Grounding:* Hoodia's 6–8% of receipts is the canonical TK number; this lands you in the same neighbourhood.
- **Source-as-contributor weight in the lineage:**
  - Genetic-resource-only origin (centroid/flora-level): **a small node** — single-digit % equivalent.
  - **TK-led:** weight the source community **at or near parity with the lead researcher** — the Kani 50:50 is the precedent that "the knowledge *was* the invention."

So a TK-derived Z-potential might see the source community capture, in total, *the unconditional ~5–8% floor PLUS a heavy lineage weight* — converging on the "co-equal partner" outcome that Hoodia and Kani both reached, while a pure-biodiversity-origin potential sees a modest unconditional floor and a small lineage node. **That gradient — small for mere provenance, near-parity for TK — is the defensible core, and it is exactly what real ABS practice converged on independently.**

### 1.5 Second-order effects (what each choice *commits the platform to*)

- **Too LOW a base (e.g. <1%, no real TK premium):** GEOCON becomes a *biopiracy-laundering* surface — the exact reputational risk that killed trust in the Jeevani model when the community felt excluded. For a conservation atlas whose entire brand is the firewall, this is existential, not cosmetic. The asymmetry of error here is severe: under-reserving is a brand-ending integrity failure; over-reserving is, at worst, a deterred deal.
- **Too HIGH a base off *gross* (e.g. 20–50% off the top):** no commercial counterparty will cite GEOCON; the Exchange dies; the source gets 50% of zero. The 50% figures in the precedents are *always* shares of the discoverer's slice, never of gross — copying "50%" onto gross would be a category error.
- **TK multiplier signals your values louder than the base does.** Making TK *materially* heavier (not a token +0.5%) is what separates a credible ABS posture from a checkbox. The cost is you must then be *rigorous* about the TK provenance tag (see §1.7) or you invite fraudulent TK claims to capture the premium.
- **Choosing Model B (lineage weight) commits you to a defensible weighting algorithm** — which is Exchange-side and out of GEOCON's money-blind scope, *but* GEOCON must still emit the *inputs* (the TK tag, the load-bearing weight) honestly. The integrity burden lands on GEOCON's recording even though the math is downstream.

### 1.6 The grounding caution from the precedents themselves

Every "model" agreement here later drew criticism, and the *pattern* of criticism is your real design spec:
- **Hoodia:** criticised that 6–8% of *CSIR's* receipts is a thin slice of the *eventual product's* value, and that the San had no say in the deal's construction. *Lesson:* the fraction matters less than **whether the source had agency and the base it's computed against is honest.**
- **Kani:** the celebrated 50:50 collapsed into controversy over *exclusion from decision-making*, patents granted without consent, and the community feeling the science "capitalised on" them. *Lesson:* a high fraction does not buy legitimacy if **consent and governance are absent.**

This is decisive for GEOCON: the *number* is necessary but not sufficient. The firewall must also carry **consent provenance** — was the TK contributed with documented PIC (prior informed consent) / MAT (mutually agreed terms)? An untagged TK premium is worse than no premium, because it monetises knowledge the community never agreed to share. **Recommendation as one input: the TK multiplier should be *gated on a consent/PIC flag*, not granted on a mere "this looks like TK" classification.** That makes the firewall's consent dimension (already in your constraints) load-bearing for the money math downstream.

### 1.7 Recommendation (one labelled input among the analysis)

A **hybrid floor + weighted-contributor model**, parameters: **base reserved floor 1–3% of gross**, **TK multiplier ×2–3 (→ ~5–8%)**, **source-as-contributor weight small for provenance-only and near-parity for TK**, and **the TK premium gated on a documented-consent flag**. This is *defensible by direct citation* to Merck–INBio, Hoodia, Kani, and the Cali Fund simultaneously — which is exactly the property you want when a sceptical conservation community audits the firewall. But the numbers are policy, not physics: encode them as **named, versioned parameters** in the lineage schema so the founder can move them after seeing real cases, without a migration.

---

## Part 2 — Foundational-work equity (genus taxonomy, baseline assessment, reused methods)

### 2.1 What the question actually is

When a downstream Z-potential reaches a value event, do the **upstream, load-bearing-but-not-novel** contributors — the person who did the genus revision, the baseline IUCN assessment, the methods paper everyone reuses — get a **token equity slice** of the outcome, or **reputational credit only** (their citation/receipt appears in the lineage, but they capture no value share)?

### 2.2 The cleanest real-world analogue: inventorship vs. authorship

This is not a novel problem — it is *exactly* the line drawn in patent law, which GEOCON should borrow because it is the most litigated, most-defended version of this distinction in existence:

- **Inventorship (→ equity/IP rights):** reserved for those who **contributed to the conception of the claimed invention** — the specific novel step that makes the thing patentable/valuable.
- **Authorship / acknowledgement (→ credit only):** for those who **contributed labour, supervision, routine technique, or pre-existing methods well known in the art**. Critically: *"an individual who only contributes concepts or techniques well known in the art is not, under the law, an inventor."*

Mapped onto GEOCON:
- A **genus revision / baseline assessment / a reused standard method** is, in patent terms, the **prior art and the routine technique** — load-bearing (the downstream work is *invalid without it*, which is precisely your tic-architecture's "required" criterion), but **not the conception of the value event**. Under the dominant legal norm, this earns **acknowledgement, not equity**.
- The **novel Z-step** (the specific documented potential, the mechanism evidence, the assay) is the **inventive contribution** — that's where equity attaches.

This gives you a principled, citable default: **foundational upstream work = reputational credit (the receipt/citation in the lineage); novel value-creating work = equity-bearing.** And it aligns perfectly with your existing distinction between **AVAILABILITY (binary — was this required input present?)** and **STRENGTH (0–1 — how load-bearing toward the value)**: foundational work is high on *availability/requiredness* but typically low on *value-conception strength*.

### 2.3 The academic-spinout grounding (who actually gets equity)

The spinout data sharpens the same line and adds a *complexity* warning:

- In real spinouts, **equity goes to the founders/inventors of the specific IP** (Oxford 80/20, MIT/Stanford ~5% to the institution, Penn up to 51% inventor). The person who *taught the inventor the technique*, or whose earlier paper the method came from, **gets cited — not capitalised.** The equity table is deliberately *shallow*: you do not put every upstream dependency on the cap table, or it becomes unfinanceable.
- TenU's recommendation (max ~10% institutional equity for software spinouts) and the broad 2024 move to *shrink* founder-dilution exists precisely because **over-broad equity claims deter the value event from happening at all.** A cap table with 40 token-equity holders is a cap table no investor will touch.

This is the **second-order argument against token equity for foundational work**: it's not just fairness, it's *financeability*. Every foundational contributor you give a token equity slice to is a person whose consent/signature the Exchange-side deal may later need, and a line on a rights table. Pushed to GEOCON scale (genus revisions touch *thousands* of downstream species), token equity for foundational work creates a **combinatorial rights-clearance nightmare** — the anticommons. Reputational credit has *zero* clearance cost and scales infinitely.

### 2.4 The option space

**Option 1 — Reputational credit only for foundational work (the inventorship/authorship line).**
Foundational contributors appear in the lineage/receipt as **cited, credited, permanently attributed** — but capture no value share. Equity attaches only to the novel value-conceiving step.
- *Pros:* matches patent law and spinout norms exactly → maximally defensible; zero rights-clearance cost; scales to thousands of reuses; keeps the cap table financeable; *and* it's congruent with GEOCON's North Star — the foundational work's reward is that **the fact now exists in the atlas with their name on it forever**, which is the platform's *native currency*.
- *Cons:* feels unfair to a researcher whose genus revision *was* genuinely load-bearing for a lucrative outcome; risks reproducing the academic pattern where foundational taxonomists are chronically under-rewarded; may under-incentivise the *unglamorous foundational work GEOCON most needs* (the baseline assessments — your actual North-Star metric).

**Option 2 — Token equity slice for foundational work (a small capped pool).**
A fixed small fraction (say, a *single-digit % "foundational pool"*) of the contributor-side value, split across upstream load-bearing nodes by weight.
- *Pros:* directly rewards the foundational labour GEOCON wants to incentivise; a differentiator vs. ordinary academia ("here, baseline work *can* pay"); could be the hook that gets taxonomists to contribute.
- *Cons:* the rights-clearance / anticommons problem above; defining "foundational enough to qualify" is a contestable boundary that invites gaming (everyone claims their upstream node was load-bearing); dilutes the novel contributor (who *conceived* the value) in favour of routine inputs; **departs from every cited norm**, so it's harder to defend to a sceptical auditor.

**Option 3 — Tiered hybrid: credit by default, *conditional* equity for the rare genuinely-decisive foundational case.**
Reputational credit is the default for all foundational work (Option 1). *But* the lineage weight (STRENGTH 0–1) can, in exceptional cases, be high enough that a foundational node crosses a **threshold of decisiveness** — e.g. a baseline assessment that *was itself the value* (the conservation status that unlocked the funding) — and then it converts to an equity-bearing node.
- *Pros:* honours the patent principle (routine ≠ inventive) while not being blind to the rare case where the "foundational" work was actually the load-bearing inventive step; uses machinery you *already have* (the 0–1 strength weight + a threshold) rather than a separate pool; gameable boundary is narrowed to "did this cross the decisiveness threshold," which the evidence-tier system (T0–T4) can adjudicate.
- *Cons:* threshold-setting is a judgement call and will be contested case-by-case; more complex than a bright line; risks litigating every foundational node's strength.

### 2.5 The asymmetry that should drive the choice

Note where the two error directions land:
- **Erring toward credit-only (Option 1)** under-rewards a foundational contributor in a rare high-value case. The cost is *unfairness in a tail case*, and it's *recoverable* — you can always add a discretionary acknowledgement grant, or the Exchange-side deal can choose to cut them in.
- **Erring toward token-equity-for-all (Option 2)** loads *every* outcome with a clearance burden and dilutes the novel contributor *systematically*. The cost is *structural and compounding*, and it's *hard to unwind* once people hold the rights.

For an *unfinanced cold-start platform*, structural drag on the value event is the more dangerous error. You want the *first* value events to happen at all; an anticommons guarantees they don't.

### 2.6 Recommendation (one labelled input among the analysis)

**Option 3 — credit-by-default, conditional-equity-by-exception** is the most defensible: it adopts the patent-law inventorship/authorship line as the *default* (citable, scalable, financeable), reuses your existing STRENGTH-weight + evidence-tier machinery to handle the genuine edge case where foundational *was* decisive, and avoids both the under-reward trap and the anticommons. If the founder wants maximal simplicity and defensibility over nuance, **Option 1 (pure credit-only)** is the safest and most-citable fallback — and crucially, **it is the one most aligned with GEOCON's own thesis that the existence of the evidenced fact, attributed, is itself the reward.** The thing that makes GEOCON different from a patent pool is that *credit in the atlas is supposed to be load-bearing value on its own*. Option 1 trusts that thesis; Option 3 hedges it.

The thing *not* to do is Option 2-flat: token equity for all foundational work contradicts every real norm and manufactures the anticommons that kills your first deals.

---

## Cross-cutting note for the founder (the meta-decision)

Both questions share one structural fact worth surfacing explicitly: **GEOCON should record richly and decide minimally.** Because the money math is Exchange-side and money-blind from GEOCON's view, the *durable* commitment is the **lineage schema** — the provenance tags (ABS-relevant, TK-derived, consent-documented, foundational-vs-novel) and the load-bearing weights. The *fractions* (1–3%, ×2–3 TK, the decisiveness threshold) are **versioned policy parameters** that can move after you see real cases, without a migration and without breaking past receipts.

So the genuinely *irreversible* decision is not "what percentage" — it's **"does the receipt schema capture consent provenance and the foundational-vs-novel distinction at all?"** If it does, every number above is tunable later. If it doesn't, no later parameter can recover a fairness signal the data never recorded. **The schema commitments are the real decision; the fractions are settings.**

Key files for where this lands in the codebase (lineage substrate): `chain_link_fact` / `chain_evidence` (the receipt substrate, already money-blind via `evidence_json_is_clean`), the `get_chain_receipt` projection, and the v-next design docs `docs/architecture/VNEXT-PORTFOLIO-RECONCEPTION.md` and `docs/architecture/VNEXT-ROUND2-DESIGN.md`.

**Sources:**
- [Merck–INBio agreement (CIESIN)](http://www.ciesin.org/docs/008-129/008-129.html) and [equity issues in bioprospecting (NZDL)](https://www.nzdl.org/cgi-bin/library.cgi?e=d-00000-00---off-0envl--00-0----0-10-0---0---0direct-10---4-------0-1l--11-en-50---20-about---00-0-1-00-0-0-11-1-0utfZz-8-00&cl=CL3.39&d=HASH01230cb240ad6e29c7cc9d20.5.1.2)
- [San–CSIR Hoodia benefit-sharing accord (Cultural Survival)](https://www.culturalsurvival.org/publications/cultural-survival-quarterly/san-reach-landmark-ipr-benefit-sharing-accord-diet-pill)
- [Kani–TBGRI Jeevani model (WIPO)](https://www.wipo.int/en/web/ip-advantage/w/stories/using-traditional-knowledge-to-revive-the-body-and-a-community) and [50:50 split / TBGRI case study (CBD)](https://www.cbd.int/financial/bensharing/india-tbgri.pdf)
- [Cali Fund — DSI multilateral mechanism (Wikipedia)](https://en.wikipedia.org/wiki/Cali_Fund) and [CBD Cali Fund launch](https://www.cbd.int/article/cali-fund-launch-2025)
- [Regulation (EU) No 511/2014 (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2014/511) and [Nagoya compliance for R&D sourcing (Osborne Clarke)](https://www.osborneclarke.com/insights/nagoya-protocol-compliance-shapes-eu-sourcing-genetic-resources-rd)
- [Inventorship vs. authorship (NIH/PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4632863/) and [improving equity in patent inventorship (Science)](https://www.science.org/stoken/author-tokens/ST-1606/full)
- [Oxford University spinout equity](https://innovation.ox.ac.uk/com_technology_faqs/gets-equity-spin/), [Southampton Spinout Equity Guide](https://www.southampton.ac.uk/business/develop-organisation/invest-start-ups/spinout-equity-guide), and [TenU / spinout equity norms (Orrick)](https://www.orrick.com/en/Insights/2024/12/Legal-Ninja-Snapshot-Technology-Transfers-How-much-should-a-University-hold-in-IP-based-Spin-Outs)

## Cluster D — Knowledge / structure / framing (full analysis)
That grounds the two most load-bearing claims. The IUCN process has a formal three-role authority model (Assessor / Reviewer / Red List Authority) — directly relevant to question 2 (who authors the necessity welds) and to the IUCN environment's design. And the "registered reports / null results as first-class" movement is a real, named precedent for question 1 (Y non-coercion). I have enough real-world grounding; the ABS lineage point is secondary to my three assigned questions. Let me synthesize.

---

# Deep analysis — three founder calls (research-practice + experience-design domain)

I read the locked frame, the round-2 design, the R1 tic doc, and the live code. Three load-bearing facts ground what follows:

- The IUCN editor (`components/geocon/IucnAssessmentEditor.jsx`) is genuinely real and end-to-end: 7 categories, the actual IUCN v3.1 criteria short-codes (A1–A4, B1ab(iii), C2a(i), D1, D2, E), 5 narrative sections, a `draft → peer_review → submitted → published` state machine, a SIS `.json` export at `/api/v1/iucn/[id]`, and a peer-review discussion thread. The confirmed single defect: `advance_iucn_assessment` (line 129) flips a status string and mints nothing.
- The real IUCN process is a **three-role authority model**: Assessor (authors) → Reviewer (≥1 required) → Red List Authority (validates correct criteria application). This is directly relevant to Q2 and Q3.
- "Negative/null/exploratory results as first-class" is a real, named movement in science (Registered Reports, in-principle acceptance) — not a courtesy. This grounds Q1.

I deliberately do **not** pre-decide any of the three. Each gets the option space, second-order effects, real precedent, and a clearly-labelled recommendation as *one input*.

---

## QUESTION 1 — Y non-coercion: should the system *guarantee* that no stage-gate ever forces a Y position to yield an output?

### The real tension
Two of the founder's own commitments collide here. The LOCKED model already says **"Y axis = exit NOT mandatory"** and **"a program never has to finish; finishing is not a concept"** (VNEXT-ROUND2 lines 167, 179). But the same founder carries an **"a-program-must-yield-an-output" instinct** — the gut sense that work without a deliverable is aimless, the exact felt-aimlessness the whole Book reconception is trying to cure. So the question is not "did he decide" — it's *whether the guarantee is structural (the engine cannot coerce Y) or merely default (the engine nudges, and discipline holds the line)*. Those are very different commitments.

### What "coercion" can even mean here — three distinct mechanisms
Worth separating, because the founder's instinct and the non-coercion principle may both be satisfiable depending on which one you pick:
1. **Hard stage-gate** — a Y program physically cannot pass `deep_work → deployment` (or reach governance) without a declared terminal. This is genuine coercion.
2. **Default-door nudge** — the exit gate exists and is *offered* at deployment, but a first-class "parked / exploring" status is always an equally-valid answer to "what did this return?" No state is blocked.
3. **No gate at all on Y** — Y positions simply never present an exit prompt; publication is one *available* terminal among many, never a solicited one.

### Option space

**Option A — Guarantee non-coercion structurally (Y has no forced exit, "exploring" is a permanent terminal-equivalent resting state, published-knowledge is a win of equal standing).**
- *Pros.* Matches the locked model verbatim and the R1 science stance ("Y deliberately FLAT, only two hard gates: taxonomy root + data-dependency"). Aligns with the North-Star: **the gap is the product** — a permanently-open Y question *is* an evidenced, displayable asset, not an unfinished task. It protects data integrity directly: a forced exit is the single largest structural pressure to **over-claim** (declare a thin "published method" or an inflated commercial potential just to close), and over-claiming is the same failure mode as fabricating a value. Real precedent is strong and named: Registered Reports / in-principle acceptance exist precisely because *"scientific findings should be evaluated on study rigor, not outcomes"* — the field has already built first-class homes for null and exploratory results. A platform that punishes open-endedness would be behind current science, not ahead of it.
- *Cons / what is lost.* You lose the forcing function that the founder's instinct wants — the thing that makes a Book of three parked Y positions feel like *motion* rather than a wishlist. Without *some* sense of destination, Y risks becoming the watchlist-with-extra-steps that the design's own "hardest truth" warns about. A permanent resting state can become a permanent excuse: nothing ever resolves, the Tape goes quiet, and the felt-aimlessness returns through the back door.
- *Second-order effects.* Establishes a platform-wide precedent that **a position never owes the platform an output** — which then makes the X-side reintroduction gate and the Z-side exit ladder look like the *exceptions* that need justifying, not the rule. That is actually a *cleaner* mental model (gates exist only where science demands them), but the founder must consciously accept that "everything must yield an output" dies as a universal law.

**Option B — Default exit with an honest escape (gate is offered, "parked/exploring" is always a valid response, never blocked).**
- *Pros.* Threads the needle: the founder's instinct gets a *destination prompt* (the Book always whispers "what is this proving toward?"), but no science is coerced because "still exploring" is a first-class answer that lifts no false flag. The exit becomes a *mirror* ("here's what you'd need to file a publication / a Red List assessment") rather than a *toll*. Preserves the felt motion the reconception needs without the over-claim pressure.
- *Cons.* "Offered but optional" is a discipline, not a guarantee — and disciplines erode. The moment a future analytics view sorts the Book by "% positions exited," or a co-manager UI nudges "your Y position has been parked 180 days," the soft nudge silently becomes coercion. The line between "mirror" and "toll" lives in copy and ranking, which are exactly the surfaces that drift.
- *Second-order effects.* Requires a permanent governance commitment: **"parked" must never sort below "exited" anywhere, ever.** That is the same rigor as "conviction never sorts the Book." If you take this option you are signing up to police presentation forever.

**Option C — No Y exit gate at all; publication is a terminal that simply becomes *available* (R1's pure-availability model).**
- *Pros.* The most honest to the actual science and the cheapest to build — it's literally what the R1 routing already implies (availability is binary, strength is separate; `sci.peer_publication` is just one available terminal). Zero coercion by construction because there is no gate object to coerce with. A Y position shows its available wins (publish, contribute genetic breadth to an X program, etc.) as *open doors*, never as *demands*.
- *Cons.* Loses the founder's felt "destination" entirely on Y — a Y position never says "you are heading somewhere," only "here is what you *could* do." For a strategy-first founder who wants the Book to feel like it's *going* somewhere, pure-availability may read as flat. It also makes X and Z (which *do* have gates) feel architecturally inconsistent unless that asymmetry is explicitly narrated as "the science is unforgiving on X/Z, open-ended on Y."

### Real-world grounding
- The **Registered Reports** movement (Nature *Scientific Reports*, *Cortex*, ~300+ journals) institutionalizes exactly Option A's claim: a result's legitimacy is its rigor, not its valence. A platform whose currency is the **evidence band** (rigor) rather than the **outcome** is philosophically a Registered-Report engine — which argues that forcing an output is *off-brand* for what GEOCON already is.
- The **IUCN process itself** is instructive in the *other* direction: a Red List assessment is a real terminal with a real authority gate (Reviewer + RLA). So on X, gates are appropriate and expected by practitioners. The asymmetry the R1 doc claims ("X gate-heavy, Y gate-light") is not an invention — it mirrors how the two kinds of work actually operate. This *supports* treating Y differently from X rather than imposing one universal exit rule.

### Recommendation (one input, not the decision): **Option A, implemented via Option B's mechanism.**
Guarantee non-coercion as a **stated, structural invariant** ("no stage-gate ever blocks a Y position; published-knowledge and 'still exploring' are both first-class terminals"), but *deliver* it through a deployment-stage mirror that offers the publication door without ever gating on it. Concretely: write the invariant into `VENN-ENGINE-CONTRACT.md` as a law of equal rank to "xyz is never a gate" — because a stance that lives only in copy will drift, and the over-claim pressure it prevents is a **data-integrity** risk, not a UX preference. The founder's "must yield an output" instinct is honored on **X and Z** (where the science genuinely terminates) and *re-channeled* on Y into "the Book always shows the nearest available win" — destination as invitation, never as toll. **What the founder must consciously accept:** "every program yields an output" stops being a universal law and becomes an axis-specific one. That is the price, and it is worth naming out loud.

---

## QUESTION 2 — Who authors the `tic_edge` necessity welds (the requires-vs-enriches backbone)?

### Why this is the sharpest integrity question of the three
The `tic_edge` table (R1 §grammar, primitive 2) encodes the single judgment that the entire rights model and the entire Z-fan honesty rest on: **which evidence is load-bearing (`requires`, necessity-multiplier 1.0, earns equity) vs merely enriching (`enriches`, 0.5) vs off-path (0.0, cited only)** (VNEXT-ROUND2 line 59). Whoever authors these edges is, in effect, **deciding who gets paid** when a value-potential reaches the Exchange — because the lineage weighting *is* the requires/enriches split. This is not metadata. It is the constitution of the benefit-share.

### The grace of the fallback
The design's most important property here: `tic_edge` **degrades gracefully to "on the ltree required path vs off it" until authored** (VNEXT-ROUND2 line 82, R1 line 23). This means the question is *not* "we are blocked until someone authors 47k edges" — it is "the ltree parent→child order gives a *default* backbone for free, and authorship is the act of *correcting* that default where the chain topology and the scientific necessity diverge." That reframes everything: authorship is **curation of exceptions**, not authoring from scratch. The volume is "tens of cross-trunk welds for the whole 47k corpus" (R1 line 23), not thousands.

### Option space

**Option A — A single curator (the founder, or one accredited science steward).**
- *Pros.* Maximum integrity and a single accountable authority — mirrors the IUCN **Red List Authority** model exactly, where a designated authority validates that criteria are correctly applied. Necessity is a domain-truth judgment; concentrating it in one expert prevents the dilution and gaming that a crowd invites. Small volume (tens of welds) makes it tractable for one person. Defensible: when the Exchange computes a benefit-share, "the necessity backbone was set by an accredited steward" is an auditable provenance.
- *Cons.* **Bottleneck and bus-factor.** The founder is "technically light by his own account" and solo; making him the necessity-curator either stalls the system or pushes him to rubber-stamp AI drafts (which is fine *if* the drafts are good — see Option D). A single curator is also a single point of bias: one person's view of "load-bearing" silently shapes every future payout.
- *Second-order effects.* Creates a **governance dependency** the platform must staff forever. If the steward leaves, the backbone freezes. It also centralizes a *money-adjacent* judgment in GEOCON — which is uncomfortably close to the firewall, even though the edge itself carries no money (the weighting is applied Exchange-side). Must be framed carefully: the curator sets *scientific necessity*, never *value*.

**Option B — Community-authored (researchers propose/vote on requires-vs-enriches).**
- *Pros.* Scales, distributes bias, and matches how scientific consensus actually forms (peer agreement on what's methodologically necessary). Potentially the most *legitimate* in the long run — necessity declared by the community of practice.
- *Cons.* **Direct gaming incentive.** Because `requires` edges earn 1.0 equity and `enriches` earn 0.5, every researcher has a financial motive to argue *their own* contribution is load-bearing. A community vote on "is my assay required?" is a vote on "do I get paid more?" — a textbook conflict of interest. This is the single most dangerous option for data integrity, and at cold-start (~0 users) there *is* no community to author anything. It also revives the spectre of the reverted arc: community-driven "claim" mechanics were part of what was rejected.
- *Second-order effects.* Would require a whole governance layer (proposals, review, dispute resolution) — exactly the sprawling subsystem the v1-complexity lesson forbids. Net-negative at this stage.

**Option C — Pure auto-derivation from the chain ltree parent→child order (never hand-author; the fallback *is* the answer).**
- *Pros.* Zero authoring cost, zero bottleneck, zero gaming surface (no human sets the equity weight, so no one can argue for their own). Deterministic and auditable. Ships today. The ltree order already encodes most of the real dependency structure (taxonomy is genuinely the root; you genuinely cannot profile metabolites before extracting).
- *Cons.* The ltree topology and scientific necessity **diverge in exactly the high-value cases.** The R1 doc names these: OR-groups (seed OR vegetative OR in-vitro propagation — `max_across_siblings`), and **cross-trunk welds** (a Z chemist's assay that is load-bearing for a potential but lives on a different branch than the taxonomy it depends on). Pure ltree would mis-weight precisely the parallel-program, mixed-area cases that the founder explicitly designed the system around ("a taxonomist + chemist + conservationist on one effort"). Under-crediting the chemist whose assay is the actual load-bearing fact is the *unfair* outcome the whole receipt-lineage model exists to prevent.
- *Second-order effects.* Safe but slightly *unjust* by default — and the injustice is invisible until real money flows, at which point it's a credibility problem. Acceptable as a *starting* state; dangerous as a *permanent* one.

**Option D — AI-drafted from literature with `[EKLE:]` placeholders, human-ratified (the project's own established pattern).**
- *Pros.* This is *literally how the codebase already handles domain-truth drafting* — the `[EKLE:]`/`[ADD:]` placeholder discipline, "never auto-save AI output as fact" (CLAUDE.md constraint #1). An AI can read the actual literature (the R1 doc already cites Berjak/Walters on seed storage, Godefroid 2011 on reintroduction preconditions) and *propose* requires-vs-enriches with a citation, leaving a placeholder where the science is genuinely contested. A human (the founder or steward) ratifies. Combines C's scalability with A's accountability, and the volume is tiny (tens of welds). The connected bio-research tools (ChEMBL, PubMed) make the *drafting* genuinely grounded, not hallucinated.
- *Cons.* Still needs a human ratifier (so it inherits A's bottleneck, but only as a *review* load, not an *authoring* load — far lighter). An AI can mis-classify necessity confidently; the `[EKLE:]` discipline only works if the ratifier actually checks, rather than rubber-stamping.
- *Second-order effects.* Makes the necessity backbone **defensible and provenance-stamped** ("requires-edge proposed from {DOI}, ratified by {steward} on {date}") — which is exactly the kind of auditable trail the Exchange needs when a benefit-share is disputed. Reuses an existing, founder-approved pattern rather than inventing governance.

### Real-world grounding
- The IUCN model answers this cleanly: necessity-of-criteria is **not** crowd-sourced. SIS *auto-assigns* criteria from parameters (= auto-derivation, Option C), and a **Reviewer + Red List Authority validate** (= human ratification, Option A/D). The field's own most-respected assessment process is precisely **"auto-derive the default, human-authority validates the exceptions."** That is Option C+D combined — and it's the established norm for exactly this kind of necessity judgment.

### Recommendation (one input): **C as the permanent floor, D as the correction layer, A as the ratifying authority — never B.**
Ship **C** (ltree-derived default) immediately — it carries current with zero authoring and zero gaming. Layer **D** (AI-drafts the cross-trunk and OR-group exceptions from cited literature, with `[EKLE:]` where contested) as the correction mechanism, reusing the project's existing no-auto-save discipline. Make **A** (the founder now, an accredited science steward later) the *ratifier* of D's drafts — a light review load on tens of edges, not an authoring burden. **Explicitly rule out B (community authorship)** for the necessity backbone specifically, because tying an equity weight to a community vote is a structural conflict of interest and a cold-start non-starter. The graceful-degradation property means you are *never blocked*: the system is correct-enough on day one (ltree) and gets *fairer* as exceptions are ratified — the same "weak-but-honest, strengthens with evidence" philosophy the rest of the platform already runs on. **How it degrades if left to ltree alone:** safe, deterministic, but systematically under-credits the cross-trunk parallel-program contributor (the mixed-area chemist) — tolerable until real money flows, which is exactly when D+A must be in place.

---

## QUESTION 3 — The bench-framing risk: does the tabbed personal work-area read as the reverted arc redux?

### The honest resemblance (stated plainly, because the design docs already flag it twice)
The reverted v1 arc was a **personalization/bench arc** (3-axis personas, station chip, claim-species/chain-heal). The v-next Book is *also* a personalization arc, with a personal home, *also* organized on three axes (X/Y/Z), *also* introducing a personal-work-area surface, and the round-2 doc literally admits **"the WORD 'bench' and a tabbed personal surface are exactly what was reverted"** (line 113). The memory note records *why* it died: the founder's verdict was **"shallow / no meaningful change / too radical"** — and the LOCKED model refines this crucially: it died on **COMPLEXITY + design + tech, NOT the concept** (line 159-160). The founder *still wants* the personalization vision; he rejected the *execution*.

So the resemblance is real and cannot be waved away. The question is whether starting from the ~70%-shipped IUCN environment **breaks** it or merely **disguises** it.

### What actually distinguished the reverted arc from this one — three structural breaks
I went to the code to test this rather than trust the framing. The breaks are genuine:

1. **The reverted arc was a *hollow persona surface*; the IUCN bench is a *finished real-world artifact*.** The v1 station chip/persona was decoration over nothing — it changed how you *looked*, not what you *produced*. The IUCN environment produces **a filed Red List assessment** — a real conservation action with a SIS export, a real category against the 93%/44,146-species Not-Evaluated gap, citable in the real world. The editor already exists end-to-end (I read it: real criteria codes, real state machine, real SIS export). This is the difference between "a profile that says you're a taxonomist" and "a tool that files an actual IUCN assessment." **This is the load-bearing break.** A persona is a claim about a person; an assessment is an output about a plant.

2. **The reverted arc introduced *new mental models* (personas, claim-species, chain-heal); the Book introduces *one* new noun (position) and otherwise renames things the founder already approved.** The v1 arc asked the user to learn a persona system *and* a claim mechanic *and* a chain-healing mechanic. The Book adds exactly `positions(researcher, species, axis, status, program_id?)` and otherwise reuses program, receipt, species, and the Venn X/Y/Z that already ship (VNEXT-ROUND2 line 111). "Too radical" was three new systems; this is one thin table.

3. **The reverted arc added a *new claim/evidence substrate*; the Book adds *none*.** The single sharpest discipline test, stated in the reconception's hardest-truths: a position **only GROUPS already-shipped receipts under a species×axis** — it adds **no new claim mechanic and no new evidence substrate** (line 99). The moment it grows a bespoke "claim" or a hand-maintained strength column, it *becomes* the reverted arc and should be reverted. The evidence still enters only through the one shipped verb.

### Option space

**Option A — Start from the IUCN environment (the round-2 plan).**
- *Pros.* The strongest possible anti-resemblance move: the first thing the founder sees is **not a persona surface but a tool that files a real assessment.** It is ~70% shipped, so the first slice is small (wire the publish→receipt weld) — directly answering the "complexity/tech" cause of death. It delivers a real artifact in week one, so it can never be dismissed as "shallow." It is a pure X/Y position so the firewall is trivially safe and none of the heavy Z machinery is touched.
- *Cons.* It is still *a tabbed personal work-area* — the exact silhouette that was reverted. If the founder's revulsion was to the *silhouette* (a personal multi-tab workspace) rather than the *hollowness*, starting from IUCN won't save it. And there's a sequencing trap: if the Book *shell* (position cards, axes, Tape) ships *before* the IUCN environment has real teeth, the founder sees the persona-surface resemblance *first* and the artifact *later* — recreating the exact bad first impression.
- *Second-order effect.* If it works, it establishes the *anti-bench-arc proof pattern* for every future environment: "an environment earns its place by producing a real artifact, not by personalizing." That's a durable governance rule worth more than the IUCN bench itself.

**Option B — Ship the verb-weld ALONE first, no new surface (the escape hatch).**
- *Pros.* The round-2 doc's own fallback (sequence step 0, line 116): edit `advance_iucn_assessment` so publish *also* mints a receipt — **zero new tabs, zero new tables, zero personalization surface.** It proves the entire spine ("real conservation work mints a citable receipt") with no bench framing at all. If *any* bench silhouette worries the founder, this ships value while showing him the spine works before he commits to the personal-work-area shape. It is the maximally-de-risked first step.
- *Cons.* It proves the *spine* but not the *felt experience* — and the design's own hardest truth is that the felt experience is the only thing you can't verify with `npm run build` (line 98). The verb-weld alone won't tell the founder whether the *Book* feels momentous; it only tells him the plumbing carries current. You still have to cross the bench-framing bridge eventually.
- *Second-order effect.* Buys a real-data checkpoint: the founder mints one receipt from a real assessment, feels whether *that* is satisfying, *then* decides whether to build the personal surface on top. Decision-under-evidence instead of decision-under-spec.

**Option C — Build the personal Book shell first (cards, axes, Tape), environments later.**
- *Pros.* Delivers the "portfolio going somewhere" felt experience fastest.
- *Cons.* **This is the resemblance trap in its purest form.** A personal three-axis surface with cards and a tape, *before* any environment has real teeth, is almost exactly the reverted arc's silhouette — a personalization shell over thin content. It leads with the persona-surface and defers the artifact, recreating the precise first impression that got v1 killed. Given the founder's stated cause of death, this is the highest-risk ordering.
- *Second-order effect.* If it reads as redux, it doesn't just fail — it *burns the concept the founder still wants*, making the next attempt harder.

### What concretely must be true so it never feels like the reverted arc
This is the operational core of the answer — a falsifiable checklist, not reassurance:

1. **The first surface the founder touches must produce a real-world artifact, not a representation of himself.** Lead with the IUCN *tool*, not the Book *shell*. A filed assessment, not a populated persona.
2. **No new claim mechanic. No new evidence substrate. No hand-maintained strength column.** Evidence enters only through the one shipped verb; the position table holds intent, never evidence (its band is a *view* over receipts). If a single bespoke claim or strength field appears, it has become the reverted arc — this is the bright-line revert trigger, and it should be written down as one.
3. **One new noun, maximum.** `position`. Everything else is a rename of an approved concept. If a second new mental model appears (a persona, a station, a "heal" verb), stop.
4. **Built one environment at a time, each justified by a real artifact.** The v1 arc sprawled (the complexity cause of death). The rule: an environment ships only when it produces something citable in the real world. IUCN first *because* it's 70% done and yields a filed assessment — not because it personalizes.
5. **Sequence artifact-first.** Verb-weld (Option B) or IUCN-tool (Option A) before the Book shell (Option C). The founder must experience "I produced something real" *before* "here is my personal page," or the persona-resemblance lands first and poisons the rest.

### Real-world grounding
The distinction that saves this is the same one the IUCN process embodies: **the unit of work is the assessment (an artifact about the species), not the assessor (a profile about the person).** The reverted arc made the *person* the unit (personas, station, claims). The Book, *if disciplined*, makes the *species×evidence* the unit and the person merely the cursor pointing at it (R1 primitive 5: the cursor "owns no graph and no evidence; it POINTS"). That inversion — person-as-cursor, not person-as-content — is the conceptual reason the resemblance is breakable. But it's only breakable *if the build order and the no-new-substrate discipline hold*; the silhouette alone won't save it.

### Recommendation (one input): **B then A, never C-first.**
Ship the **verb-weld alone (Option B)** as step zero — it proves the spine, mints a real receipt from a real assessment, carries zero bench framing, and gives the founder a real-data gut-check on whether minting-from-real-work is satisfying. Then build the **IUCN environment (Option A)** as the first tabbed surface — because it leads with a real artifact and is mostly already shipped, it's the one personal-work-area that can't be dismissed as shallow. **Defer the personal Book shell (Option C) until at least one environment has real teeth** — leading with the shell is the resemblance trap. And **write down the revert trigger** as an explicit invariant: *"if this grows a bespoke claim mechanic, a new evidence substrate, a second new mental model, or a hand-maintained strength column, it has become the reverted arc — revert it."* That sentence is the cheapest insurance the project can buy, because it converts the founder's hard-won gut lesson into a checkable rule that survives him not being in the room.

---

## Cross-cutting note (the one thread linking all three)
All three questions are the *same* question wearing three masks: **where does the platform place a forcing function, and who controls it?** Q1 asks whether the *engine* forces an output (answer: not on Y). Q2 asks who forces the *equity weighting* (answer: ltree floor + AI-draft + human ratify, never a vote). Q3 asks whether the *surface* forces a persona-feel (answer: no — lead with artifact, person is a cursor). The consistent principle that falls out: **GEOCON's forcing functions should live only where the science is unforgiving (X reintroduction gates, Z validity trunk, taxonomy root) — and nowhere else.** Y is open-ended, equity defaults to deterministic-and-fair-by-correction, and the personal surface forces nothing about the person. That single rule, if the founder adopts it, resolves all three coherently and keeps the firewall and data-integrity lines fixed throughout.

**Files referenced (all absolute):**
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\docs\architecture\VNEXT-PORTFOLIO-RECONCEPTION.md`
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\docs\architecture\VNEXT-ROUND2-DESIGN.md`
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\docs\architecture\VNEXT-TIC-ARCHITECTURE-R1.md`
- `C:\Users\Alpaslan\Documents\GitHub\geocon-atlas-live\geocon-atlas\components\geocon\IucnAssessmentEditor.jsx` (the ~70%-shipped environment; the one defect is `advance_iucn_assessment` at line 129 minting nothing)

**Real-world sources used:**
- [IUCN Red List assessment process / Rules of Procedure](https://www.iucnredlist.org/resources/rules-of-procedure) and [SIS overview](https://www.iucnredlist.org/assessment) — the Assessor/Reviewer/Red List Authority authority model and SIS auto-criteria assignment (grounds Q2 and Q3).
- [Registered Reports — Scientific Reports policy](https://www.nature.com/srep/journal-policies/registered-reports) and [The Value of Null Results, Surrey CoGDeV](https://blogs.surrey.ac.uk/cogdev/2021/02/08/the-value-of-null-results/) — first-class legitimacy of null/exploratory results, evaluated on rigor not outcome (grounds Q1).
