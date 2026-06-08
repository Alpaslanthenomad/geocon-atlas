---
description: Run the knowledge-base health check (broken links, orphan docs, CLAUDE.md size, freshness)
---
Run `node scripts/kb-health.mjs` and report the result. If there are ERRORs (broken
links, missing CLAUDE.md), fix them. If there are WARNs (orphan docs not in INDEX,
CLAUDE.md over 200 lines), note them and offer to fix. This keeps the Project
Knowledge OS trustworthy so context-building stays accurate.

$ARGUMENTS
