#!/usr/bin/env node
// Parses a discovery-notes.md file and creates GitHub Issues for every
// Functional Requirement (FR-XXX). Uses `gh` CLI — only needs GITHUB_TOKEN.
//
// Usage:
//   node scripts/create-issues-from-spec.mjs <path-to-discovery-notes.md>
//
// Env:
//   DRY_RUN=true  — print what would be created, don't call gh
//   REPO          — target repo (owner/name). Defaults to current gh repo.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const [, , specFile] = process.argv;
if (!specFile) {
  console.error('Usage: node create-issues-from-spec.mjs <discovery-notes.md>');
  process.exit(1);
}

const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const REPO    = (process.env.REPO || '').trim();

const raw = readFileSync(specFile, 'utf8');

// Match lines like:
//   - FR-001: Guest can scan ... Priority: must-have
//   - FR-001: Klient może złożyć zamówienie ... must-have
const FR_LINE = /^[-*]\s+(FR-\d+):\s+(.+)$/gm;
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
  console.log('No Functional Requirements (FR-XXX) found in the file.');
  process.exit(0);
}

console.log(`Found ${requirements.length} requirements. DRY_RUN=${DRY_RUN}\n`);

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

// Fetch existing issue titles to avoid duplicates
let existingTitles = new Set();
try {
  const repoFlag = REPO ? ['--repo', REPO] : [];
  const list = JSON.parse(gh(['issue', 'list', ...repoFlag, '--state', 'all', '--limit', '200', '--json', 'title']));
  existingTitles = new Set(list.map(i => i.title));
} catch {
  // no existing issues or gh not authed — continue
}

const results = [];

for (const req of requirements) {
  const issueTitle = `[${req.id}] ${req.title}`;
  const issueBody  = `**Requirement:** ${req.id}\n\n${req.title}\n\n**Priority:** ${req.priority}`;

  if (existingTitles.has(issueTitle)) {
    console.log(`= ${issueTitle} — already exists, skipping`);
    results.push({ id: req.id, status: 'exists' });
    continue;
  }

  if (DRY_RUN) {
    console.log(`+ [dry-run] would create: "${issueTitle}" (priority: ${req.priority})`);
    results.push({ id: req.id, status: 'dry-run' });
    continue;
  }

  try {
    const repoFlag = REPO ? ['--repo', REPO] : [];
    const url = gh([
      'issue', 'create',
      ...repoFlag,
      '--title', issueTitle,
      '--body',  issueBody,
      '--label', 'enhancement',
    ]);
    console.log(`+ ${req.id} — created: ${url}`);
    results.push({ id: req.id, status: 'created', url });
  } catch (e) {
    console.error(`! ${req.id} — ERROR: ${e.message}`);
    results.push({ id: req.id, status: 'error' });
  }
}

console.log(`\nDone. Created: ${results.filter(r => r.status === 'created').length} | Skipped: ${results.filter(r => r.status === 'exists').length} | Errors: ${results.filter(r => r.status === 'error').length}`);
