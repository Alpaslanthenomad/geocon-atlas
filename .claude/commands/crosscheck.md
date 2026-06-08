---
description: Independent Codex (gpt-5.5) review of the current changes — the second-model cross-check
---
Run a second-model cross-check with the installed Codex CLI. It is authenticated
via the founder's ChatGPT account and runs read-only (it cannot change files), so
it is safe. The founder does nothing — you run it and translate the result.

Steps:
1. From the repo root run the repo review:
   `codex exec review`
   or, for a focused check on specific code:
   `codex exec "Review <the diff / file X> for real bugs, security issues, and any
   data-integrity or IUCN/commerce firewall violation. Be concise. Real issues only."`
2. Read Codex's findings, drop false positives, and summarize in plain Turkish:
   what it flagged, whether you agree, and what (if anything) is worth fixing.
3. If something real surfaces, fix it (or flag it to the founder if it is his call).

Cost note: each run spends the founder's ChatGPT quota and takes a minute or two,
so use it on **critical / security / firewall** changes — not every commit.

$ARGUMENTS
