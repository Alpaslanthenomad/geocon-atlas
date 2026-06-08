#!/usr/bin/env node
// Knowledge-base health check (Project Knowledge OS, step 10).
// Validates the docs / memory layer so it stays trustworthy:
//   - CLAUDE.md exists and is <= 200 lines; AGENTS.md exists
//   - relative markdown links resolve (no broken links)
//   - every doc in docs/architecture/ is referenced by INDEX.md (no orphans)
//   - flags docs not touched in >120 days (freshness, informational)
// Usage: node scripts/kb-health.mjs   (exit 1 if any ERROR)

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";

const ROOT = process.cwd();
const errors = [];
const warns = [];
const infos = [];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git" || name === "worktrees") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name.endsWith(".md")) out.push(p);
  }
}

// 1. CLAUDE.md + AGENTS.md
const claude = join(ROOT, "CLAUDE.md");
if (!existsSync(claude)) errors.push("CLAUDE.md is missing (the project memory).");
else {
  const lines = readFileSync(claude, "utf8").split("\n").length;
  if (lines > 200) warns.push(`CLAUDE.md is ${lines} lines (> 200). Keep it tight.`);
}
if (!existsSync(join(ROOT, "AGENTS.md"))) warns.push("AGENTS.md is missing (cross-tool contract).");

// 2. broken relative links across all .md (skip node_modules/.claude/worktrees)
const mdFiles = [];
walk(join(ROOT, "docs"), mdFiles);
[claude, join(ROOT, "AGENTS.md"), join(ROOT, "README.md")].forEach((f) => existsSync(f) && mdFiles.push(f));
const linkRe = /\]\(([^)]+)\)/g;
const now = Date.now();
for (const file of mdFiles) {
  const text = readFileSync(file, "utf8");
  let m;
  while ((m = linkRe.exec(text))) {
    let target = m[1].split("#")[0].trim();
    if (!target || /^(https?:|mailto:)/i.test(target)) continue;
    const abs = resolve(dirname(file), target);
    if (!existsSync(abs)) errors.push(`broken link in ${relative(ROOT, file)} -> ${target}`);
  }
  const ageDays = (now - statSync(file).mtimeMs) / 86_400_000;
  if (ageDays > 120) infos.push(`stale (${Math.round(ageDays)}d): ${relative(ROOT, file)}`);
}

// 3. orphans: docs/architecture/*.md not referenced by INDEX.md
const indexPath = join(ROOT, "docs/architecture/INDEX.md");
if (existsSync(indexPath)) {
  const index = readFileSync(indexPath, "utf8");
  for (const f of readdirSync(join(ROOT, "docs/architecture"))) {
    if (!f.endsWith(".md") || f === "INDEX.md" || f === "README.md") continue;
    if (!index.includes(f.replace(/\.md$/, ""))) warns.push(`orphan doc (not in INDEX): docs/architecture/${f}`);
  }
} else warns.push("docs/architecture/INDEX.md is missing (the knowledge backbone).");

// report
const line = (label, arr) => arr.length ? `\n${label} (${arr.length}):\n  ${arr.join("\n  ")}` : "";
console.log(`KB health: ${mdFiles.length} docs checked.`);
console.log(line("ERROR", errors) + line("WARN", warns) + line("INFO", infos));
if (!errors.length && !warns.length) console.log("\nAll good.");
process.exit(errors.length ? 1 : 0);
