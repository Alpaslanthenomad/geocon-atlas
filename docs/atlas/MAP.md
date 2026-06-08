# GEOCON project map (the atlas)

A navigable map of the surface, the data, and the call layer so an AI builds
context fast. Curated (not a raw dump). Regenerate / spot-check with `/health`.
Scale today: **62 routes · 110 tables · ~250 GEOCON RPCs** (the rest are
pg_vector / ltree / trigram extension internals).

## Routes (`app/geocon/*`)
- **Public atlas**: `/` (home) · `species` · `species/[id]` · `species/[id]/edits`
  · `explore` (globe) · `families[/[name]]` · `countries[/[code]]` ·
  `metabolites[/[id]]` · `publications[/[id]]` · `researchers[/[id]]` ·
  `organizations[/[id]]` · `outcomes[/timeline]` · `chain` (3D tree) · `search` ·
  `compare` · `about` · `shortcuts`.
- **Programs**: `programs` · `programs/[id]` · `programs/new` · `programs/analytics`.
- **Personal (signed-in)**: `workspace` (the hub; `bench` → redirect) · `profile`
  (identity/settings) · `drafts` · `watch` · `thesis[/[id]]` ·
  `grant-studio[/[id]]` · `grants` · `ventures[/[id]]`.
- **Conservation / field**: `iucn[/[id]]` · `field` (PWA notebook) · `calendar` ·
  `specimens` · `feed` · `observe` · `activity`.
- **Collaboration**: `proposals[/new|/open|/[id]]` · `briefs[/new]` · `communities`.
- **Admin**: `admin` · `admin/{analytics,health,iucn-sync,verticals}` ·
  `programs/analytics`.
- **Auth**: `welcome` (ORCID / onboarding). `ask` (AI Q&A).

## Data model (110 tables, by domain)
- **Species & taxonomy**: `species`, `synonyms`, `related_species`, `researcher_species`,
  `species_native_regions`, `species_phenology`, `species_local_names`,
  `species_iucn_history`, `species_field_provenance`, `species_stories`,
  `species_ai_summary`, `species_edit_proposals(+_votes)`.
- **Knowledge**: `publications` (+`publication_researchers`), `metabolites`
  (+`metabolite_publications`), `propagation_protocols`, `herbarium_specimens`,
  `collection_accessions`, `seed_bank_lots`, `indigenous_knowledge`.
- **The Chain**: `chain_link_type` (363 nodes registry), `chain_link_fact`,
  `chain_evidence` — *dormant* (vocabulary unsettled).
- **Programs (the engine)**: `programs`, `program_tics`, `tic_definitions`,
  `tic_evidence_options`, `tic_gate_requirements`, `program_members`,
  `program_member_agreements`, `program_pathways`, `program_outputs`,
  `program_species`, `program_comments`, `program_story_entries`,
  `program_tic_draft`, `program_*_audit`. + `output_definitions`,
  `pathway_definitions`, `geocon_health_config`.
- **People & orgs**: `profiles`, `researchers`, `organizations`, `institutions`,
  `org_memberships`, `org_accreditation_events`, `org_webhooks`.
- **Conservation**: `iucn_assessments`, `conservation`, `conservation_grants`,
  `climate_projections`, `locations`, `occurrence_summary`.
- **Value / commerce (Bahçe)**: `commercialized_outcomes`, `commercial`,
  `commercialization_credits`, `grant_proposals`, `grant_templates`,
  `market_intelligence`, `data_citations`, `partner_links`.
- **Collaboration**: `collaboration_proposals`, `proposal_comments`,
  `proposal_events`, `thesis_tracks`, `thesis_milestones`, `contributions`,
  `contribution_events`.
- **Platform**: `notifications`, `notification_preferences`, `notify_email_queue`,
  `push_subscriptions`, `saved_searches`, `user_watchlist`, `species_watch`,
  `webhook_channels`, `webhook_deliveries`, `api_keys`, `analytics_events`,
  `ai_usage_events`, `harvest_log`, `data_sources`, `source_registry`,
  `verticals`, `vertical_maintainers`, `scoring_model`.

## Call layer (RPC families)
- **`get_*`** (~90) — reads (often SECURITY DEFINER + viewer-gated).
- **`list_*`** (~53) — list/feed reads.
- **`fn_*`** (~27) — helpers/predicates (`fn_is_program_owner`,
  `fn_program_can_see_interior`, `fn_is_tic_assignee`, `chain_strength`).
- **writes**: `set_*` `add_*` `submit_*` `complete_*` `request_*` `upsert_*` `save_*`
  `mark_*` `count_*`. Program engine: `complete_program_tic`, `apply_move`,
  `request_to_join_program`, `get_program_{region,stage}_status`.

## Code layout
- `components/programs/v2/` — the program engine (Tailwind; `ProgramDetailPanel`,
  tabs, `VennHero`, `HeroPanel`, `JoinProgramButton`).
- `components/geocon/` — route components (inline styles + `--gx-*` tokens).
- `components/ui` — primitives (Badge, Toast `useToast()`, TrustStrip).
- `lib/` — `supabase`, `auth`/`authContext`, `programTics`, `programMembers`, `iucn`.
- `app/api/` — server routes (`grant/draft-section` AI drafting, `iucn/[id]`, etc.).
- crons + ingest: `scripts/ingest/`, pg_cron jobs (GBIF, POWO, iNaturalist, Wikidata).
