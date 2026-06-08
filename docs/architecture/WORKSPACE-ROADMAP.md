# Workspace + program-collaboration — roadmap (next session)

> Recorded 2026-06-08. The program backbone + the personal Workspace landed this
> session; these are the open follow-ups to pick up next.

## Done this session (for context)
- **VIS-1 visibility** — programs now have a public face vs a member interior;
  the read RPCs redact evidence / blockers / PII / the internal stream for
  non-members. (`get_program_*` + HeroPanel/Stream gating.)
- **VIS-2 the door** — `request_to_join_program` / `respond_to_join_request` /
  `get_my_program_membership`; JoinProgramButton on the public face; owner
  approve/decline in Contributors.
- **VIS-3 member work loop** — the tic assignee (not just the owner) can complete
  their tic; private `program_tic_draft`; `get_my_assignments`.
- **Workspace** (`/geocon/workspace`, renamed from "bench") = the personal hub:
  assignments + my programs (`get_my_programs`) + drafts + watchlist + saved
  searches + activity + tools (specimen requests, webhooks, API keys).
  ProfileRoute slimmed to identity/ORCID/orgs/notifications.

## Open follow-ups
1. **Notifications** — on a new join request (to the owner) and on a new
   assignment (to the member). Today the owner sees requests only by opening
   Contributors; the member sees assignments only in the Workspace.
2. **Invitee-accept** — owner-initiated invites have no accept screen on the
   invitee side; the member should be able to accept/decline an invite (mirror
   the request flow). Today the owner must flip status manually.
3. **Respond-to-open-brief** — the open-call "respond to participate" action is
   advertised in the UI but never renders / has no RPC. Wire it (it ties briefs
   to the join/collaboration flow).
4. **Direct-table RLS hardening** — `program_members` is still public-read at the
   table level (PII closed at the RPC/UI layer, but a direct query could read it).
   Tighten via column-level REVOKE or a member-only policy, after checking the
   direct readers (lib/researchers.js, lib/programs.js, ResearchersRoute).
5. **Workspace depth** — more layers if wanted: a search box that runs/saves a
   search inline; a field-notebook shortcut; "my IUCN drafts"; quick "new program
   / new grant" tools; surface assignment due-dates.
6. **Member action on the program page** — optionally let the assignee complete
   their tic directly from the program TicCard too (today the action lives in the
   Workspace by design).

## Bigger, deferred (North-Star analysis)
- Lock the one-line definition; the Anatolia "State of Knowledge" finding; the
  chain re-expressed as inclusive verticals; moving `chain_evidence` from 0.
  (See docs/architecture/NORTH-STAR-ANALYSIS.md.)
