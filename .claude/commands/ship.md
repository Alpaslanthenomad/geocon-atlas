---
description: Build, commit, and push the current changes the standard way
---
Ship the current working changes the GEOCON way:
1. Run `npm run build` and confirm "Compiled successfully" — fix any error first.
2. Stage all changes and commit with a clear, specific message: what changed and
   why. Do NOT use apostrophes or parentheses in the commit body (the bash
   heredoc breaks on them — write "founders" not "founder's"). End with:
   `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
3. Push to `main` (it auto-deploys on Vercel). LF→CRLF warnings are benign.

$ARGUMENTS
