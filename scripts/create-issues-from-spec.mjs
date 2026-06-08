#!/usr/bin/env node
// Parses a discovery-notes.md and creates GitHub Issues for every FR-XXX.
// Second pass resolves ## Dependencies, adds "blocked" / "blocks" labels,
// and prepends "Blocked by: #N" to affected issue bodies.
// Uses gh CLI only — GITHUB_TOKEN is enough, no API key needed.
//
// Usage:
//   node scripts/create-issues-from-spec.mjs <path-to-discovery-notes.md>
//
// Env:
//   DRY_RUN=true  — preview only, no gh calls
//   REPO          — target repo (owner/name). Defaults to current gh repo.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , specFile] = process.argv;
if (!specFile) {
  console.error('Usage: node create-issues-from-spec.mjs <discovery-notes.md>');
  process.exit(1);
}

const DRY_RUN  = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const REPO     = (process.env.REPO || '').trim();
const repoFlag = REPO ? ['--repo', REPO] : [];

const raw = readFileSync(specFile, 'utf8');

// ── parse FR lines ────────────────────────────────────────────────────────
const FR_LINE       = /^[-*]\s+(FR-\d+):\s+(.+)$/gm;
const PRIORITY_LABEL  = /\s+Priority:\s*(.+?)\s*$/i;
const PRIORITY_INLINE = /[.\s]+(must-have|should-have|nice-to-have|could-have)\s*$/i;

const requirements = [];
let m;
while ((m = FR_LINE.exec(raw)) !== null) {
  let title    = m[2].trim();
  let priority = 'unspecified';
  const hit = title.match(PRIORITY_LABEL) || title.match(PRIORITY_INLINE);
  if (hit) {
    priority = hit[1].trim();
    title    = title.replace(hit[0], '').replace(/\.$/, '').trim();
  }
  requirements.push({ id: m[1].trim(), title, priority });
}

if (requirements.length === 0) {
  console.log('No Functional Requirements (FR-XXX) found.');
  process.exit(0);
}

// ── parse ## Dependencies section ─────────────────────────────────────────
// Format:  - FR-007 blocked-by FR-006, FR-004
const blockedBy = new Map(); // FR-A -> [FR-B, FR-C]  (A is blocked by B, C)
const depIdx = raw.search(/^##\s+Dependencies/im);
if (depIdx !== -1) {
  const afterHeader = raw.slice(depIdx).replace(/^[^\n]+\n/, '');
  const sectionBody = afterHeader.replace(/\n##[\s\S]*$/, '');
  const DEP_LINE    = /^[-*]\s+(FR-\d+)\s+blocked-by\s+(.+)$/gim;
  let d;
  while ((d = DEP_LINE.exec(sectionBody)) !== null) {
    blockedBy.set(d[1].trim(), d[2].split(',').map(s => s.trim()).filter(Boolean));
  }
}

console.log(`Found ${requirements.length} requirements, ${blockedBy.size} with dependencies. DRY_RUN=${DRY_RUN}\n`);

// ── gh helpers ────────────────────────────────────────────────────────────
function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function ensureLabel(name, color, description) {
  try { gh(['label', 'create', name, '--color', color, '--description', description, ...repoFlag]); }
  catch { /* already exists */ }
}

// ── fetch existing issues (title -> number) ───────────────────────────────
const existingIssues = new Map();
try {
  const list = JSON.parse(gh(['issue', 'list', ...repoFlag, '--state', 'all', '--limit', '500', '--json', 'title,number']));
  for (const i of list) existingIssues.set(i.title, i.number);
} catch { /* no issues yet */ }

// ── pass 1: create issues ─────────────────────────────────────────────────
const frToNum = new Map(); // FR-XXX -> issue number
const results = [];

for (const req of requirements) {
  const issueTitle = `[${req.id}] ${req.title}`;
  const issueBody  = `**Requirement:** ${req.id}\n\n${req.title}\n\n**Priority:** ${req.priority}`;

  if (existingIssues.has(issueTitle)) {
    const num = existingIssues.get(issueTitle);
    frToNum.set(req.id, num);
    console.log(`= ${issueTitle} — already exists (#${num}), skipping`);
    results.push({ id: req.id, status: 'exists', num });
    continue;
  }

  if (DRY_RUN) {
    console.log(`+ [dry-run] "${issueTitle}" (priority: ${req.priority})`);
    results.push({ id: req.id, status: 'dry-run' });
    continue;
  }

  try {
    const url = gh(['issue', 'create', ...repoFlag, '--title', issueTitle, '--body', issueBody, '--label', 'enhancement']);
    const num = parseInt(url.split('/').pop(), 10);
    frToNum.set(req.id, num);
    console.log(`+ ${req.id} — created: ${url}`);
    results.push({ id: req.id, status: 'created', num });
  } catch (e) {
    console.error(`! ${req.id} — ERROR: ${e.message}`);
    results.push({ id: req.id, status: 'error' });
  }
}

// ── pass 2: resolve dependencies ──────────────────────────────────────────
if (blockedBy.size > 0 && !DRY_RUN) {
  console.log('\nResolving dependencies...');
  ensureLabel('blocked', 'e4e669', 'Blocked by another issue');
  ensureLabel('blocks',  'd93f0b', 'Blocks another issue');

  for (const [frA, blockers] of blockedBy) {
    const numA       = frToNum.get(frA);
    const blockerNums = blockers.map(fr => frToNum.get(fr)).filter(Boolean);
    if (!numA || blockerNums.length === 0) continue;

    const refs    = blockerNums.map(n => `#${n}`).join(', ');
    const body    = gh(['issue', 'view', String(numA), ...repoFlag, '--json', 'body', '--jq', '.body']);
    const newBody = `**Blocked by:** ${refs}\n\n${body}`;

    gh(['issue', 'edit', String(numA), ...repoFlag, '--body', newBody, '--add-label', 'blocked']);
    for (const numB of blockerNums) {
      gh(['issue', 'edit', String(numB), ...repoFlag, '--add-label', 'blocks']);
    }
    console.log(`  ${frA} (#${numA}) blocked by ${refs}`);
  }
} else if (blockedBy.size > 0 && DRY_RUN) {
  console.log('\nDependencies (dry-run):');
  for (const [frA, blockers] of blockedBy) {
    console.log(`  ${frA} blocked-by ${blockers.join(', ')}`);
  }
}

const created  = results.filter(r => r.status === 'created').length;
const skipped  = results.filter(r => r.status === 'exists').length;
const errors   = results.filter(r => r.status === 'error').length;
console.log(`\nDone. Created: ${created} | Skipped: ${skipped} | Errors: ${errors} | Dependencies resolved: ${blockedBy.size}`);
