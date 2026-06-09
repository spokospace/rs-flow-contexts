#!/usr/bin/env node
// Aktualizuje listę options w .github/workflows/create-issues.yml
// na podstawie wszystkich discovery-notes.md w repo.
//
// Użycie: node scripts/sync-spec-choices.mjs

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const SKIP = new Set(['.git', '.github', 'node_modules', 'scripts', 'docs']);
const WORKFLOW = '.github/workflows/create-issues.yml';

function findSpecFiles(dir, root, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findSpecFiles(full, root, results);
    else if (entry.name === 'discovery-notes.md')
      results.push(relative(root, full).replace(/\\/g, '/'));
  }
  return results;
}

const root = process.cwd();
const files = findSpecFiles(root, root).sort();

if (files.length === 0) {
  console.log('Brak plików discovery-notes.md.');
  process.exit(0);
}

const workflowPath = join(root, WORKFLOW);
let yaml;
try {
  yaml = readFileSync(workflowPath, 'utf8');
} catch {
  console.error(`Nie znaleziono ${WORKFLOW} — uruchom skrypt z katalogu głównego repo.`);
  process.exit(1);
}

const optionsBlock = files.map(f => `          - ${f}`).join('\n');
const updated = yaml.replace(
  /(        options:\n)((?:          - .+\n?)*)/,
  `$1${optionsBlock}\n`
);

if (updated === yaml) {
  console.log('Brak zmian.');
  process.exit(0);
}

writeFileSync(workflowPath, updated);
console.log(`Zaktualizowano ${files.length} opcji w ${WORKFLOW}:`);
for (const f of files) console.log(`  - ${f}`);
