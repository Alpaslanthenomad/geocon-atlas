# Program Flow — Stage Rooms refactor (contract, for review)

The diagnosis (founder + ChatGPT): the Program screen still reads as a **checklist + tabs**, not
as a **work process**. The fix is NOT more Studio polish — it is to rebuild the Program experience
as a **biological maturation line** of stage *Rooms / Gates*. The TIC checklist is not removed; it
is **transformed into a guided stage experience.** This is a contract for review — build is
incremental (one room at a time), not a blind big-bang.

## The backbone (already in the engine — we surface it, don't invent it)
```
Foundation Gate → Field & Lab Gate → Propagation Gate → Deployment / Outputs
```
Real stages: `foundation · field_lab · propagation · deployment` (+ deep_work/governance folded
for now). Real gates already computed by `get_program_stage_status` / `get_program_foundation_status`.
Each stage becomes a **Room**.

## Every Room answers the same 5 questions
1. **What is this stage for?** (its purpose, one human sentence)
2. **What is blocking it?** (the gate's block reason)
3. **What TICs are required?** (the required tics + their status — the checklist, but framed)
4. **What work surfaces (Studios) are available here?**
5. **What unlocks when this gate passes?**

## The rooms
**0. Program Home (the cockpit — already built, keep + tighten):**
Current Mission (now imperative — fixed) · Gate Status · Next Action · Progress · Blockers ·
Studios · Recent Evidence · Outputs.

**1. Foundation Room** — *"Is this program's scientific & conservation base trustworthy?"*
- Required: `sci.taxonomy_verified`, `cons.threat_analysis`, `cons.ex_situ_strategy`.
- Studios here: Taxonomy Studio (for taxonomy_verified).
- Unlocks: Field & Lab work.

**2. Field & Lab Room** — *"Living material, locality, morphology, phenology, voucher, genetics —
the core scientific record."*
- Required: `cons.baseline_assessment`, `cons.material_secured`, `sci.specimen_documented`,
  `sci.morphological_characterization`; optional: viability, metabolite, phenology, genetic, niche.
- Studios here: Field Studio · Taxonomy Studio · Specimen/Voucher · Morphology · Genetic/Phenology.
- Unlocks: Propagation work.

**3. Propagation Room** — *"Is a viable propagation route proven for this species?"*
- The OR tree (In vitro / Vegetative / Seed); the restoration-stock + restoration tics.
- Studio here: **Propagation Studio** — opens FROM this room, with the gate state shown:
  - gate closed (Foundation incomplete): *"Propagation gate is closed (Foundation not done) — but
    you can start a draft trial."*
  - gate open: *"Start an in-vitro trial."*
- Unlocks: Deployment / Outputs.

**4. Output Room** — *"What did this program produce?"*
- Conservation output · Protocol output · Knowledge output · **Exchange eligibility** (verified
  outputs ready to cross the bridge — money-blind label).

## Review additions (v2 — approved with these 5)
1. **Room State** on every room (derived from gate status, shown plainly):
   `locked · open · blocked · ready_for_review · passed`. E.g. "Field & Lab — Locked (Foundation
   gate not passed)"; "Propagation — Draft work allowed (gate not open yet)".
2. **Foundation surfaces** — not only Taxonomy Studio. Show **Taxonomy Studio (available now)** +
   **Evidence Review** and **Conservation Strategy** as *planned/coming* (Foundation also holds
   `cons.threat_analysis` + `cons.ex_situ_strategy`, not just taxonomy).
3. **Field & Lab grouping** — Material (baseline, material secured, viability) / Documentation
   (specimen, morphology, phenology) / Advanced Science (genetic, metabolite, niche). Not a flat list.
4. **Rename "Değer Yolları" → "Çıktı Yolları"** (Output Pathways / Impact Pathways) — drop the
   commercial ring.
5. **Stream language** — replace "biri oluşturdu" with a system/user/action format:
   "Sistem kaydı oluşturuldu: …" / "<name>, <tic> için kanıt ekledi". Tag seed/system rows separately.

**UI language:** keep the tab labels natural — **Foundation / Field & Lab / Propagation / Outputs**
(NOT literally "Foundation Room"). The room/gate/door logic is the product model behind the scenes;
the user sees plain words, minimal jargon. The word "TIC" stays small — the user sees "required
proof" first, the technical tic id only on demand.

**Output Room wording (money-blind line):** not "Exchange eligibility" baldly — use
*"Doğrulanmış çıktı, sonraki değerlendirme için hazır" / "Verified output available for downstream
review."* Never imply "this will make money."

**Foundation = the program's legitimacy gate** ("Is this program really ready to begin?"), not just
"the first stage".

## Build approach (incremental, per the discipline)
1. **Foundation Room first** (the tiny build) — transform the existing Foundation tab into the
   Room layout (purpose + blocker + required-tics-framed + studios + unlocks). Review.
2. Then Field & Lab Room, Propagation Room (mounts the Studio with gate state), Output Room — same
   pattern, one at a time, each reviewed.
3. The existing tabs (Pathways/Species/Contributors/Stream) become secondary (a "more" group), not
   peers of the rooms.

## Already addressed this round (not part of the refactor)
- **Current Mission language** — fixed: missions now read imperatively ("Verify the taxonomic
  identity"), resolving the "verified but 0/22" contradiction. (Shipped.)
- **Studio Launcher program_id** — verified, NO bug (the route uses the same program id throughout;
  the screenshots were two different programs).
- **Seeded demo trial** — a realistic Fritillaria in-vitro trial (21-day log, one insight) added to
  the pilot program so the Studio/experience can be felt and critiqued. (Not promoted — ready to
  feel the promote.)
- **Studio polish — deliberately paused** until a real tissue-culture user validates the workflow.

## What this does NOT do
- Does not remove the TICs (it frames them). Does not build all rooms at once. Does not polish the
  Studio further. Does not touch the firewall (rooms are money-blind; only the Output Room *names*
  Exchange eligibility, read-only).

## Design-feel notes to carry in (from the review)
- Left nav still too crowded; the Work/Atlas/Reference hierarchy isn't visually established yet.
- "Değer Yolları" (Pathways) wording reads commercial even though money-blind — reconsider the word.
- "<someone> created this" stream lines look like seed/demo data and lower trust — hide or reword.
- The problem isn't colour; it's that **execution hierarchy isn't visible.** Rooms fix that.
