#!/usr/bin/env node
// Tworzy repozytoria w organizacji na podstawie plików `repo-requests/*.md`.
//
// Dwa tryby:
//   FILE MODE  — domyślny; przetwarza pliki z REQUESTS_DIR.
//   CLI MODE   — podaj --name, pomija repo-requests/.
//
// Env (file mode):
//   GH_TOKEN     – token (wymagany, chyba że DRY_RUN=true)
//   TARGET_ORG   – org docelowa (domyślnie Rocksoft-IT)
//   REQUESTS_DIR – katalog z plikami request (domyślnie repo-requests)
//   DRY_RUN      – "true" => nic nie tworzy, tylko raportuje
//   ONLY_FILE    – opcjonalnie: jeden plik (np. warsztat-samochodowy.md)
//
// CLI mode:
//   node create-repos.mjs --name <repo> [--org <org>] [--token <pat>]
//     [--description "..."] [--visibility private|public|internal]
//     [--context-path <dir>] [--topics "a,b,c"] [--dry-run]

import { readdirSync, readFileSync, appendFileSync, rmSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { parseArgs } from 'node:util';
import yaml from 'js-yaml';

const { values: cli } = parseArgs({
  strict: false,
  options: {
    name:           { type: 'string' },
    org:            { type: 'string' },
    token:          { type: 'string' },
    description:    { type: 'string', default: '' },
    visibility:     { type: 'string', default: 'private' },
    'context-path': { type: 'string', default: '' },
    topics:         { type: 'string', default: '' },
    'dry-run':      { type: 'boolean', default: false },
  },
});

const CLI_MODE = Boolean(cli.name);

if (cli.token) process.env.GH_TOKEN = cli.token;

const ORG          = cli.org || process.env.TARGET_ORG || 'Rocksoft-IT';
const RS_SKILLS_URL = 'https://github.com/Rocksoft-IT/rs-skills';
const RS_SKILLS_PATH = '.claude/skills';
const REQUESTS_DIR = process.env.REQUESTS_DIR || 'repo-requests';
const DRY_RUN      = cli['dry-run'] || String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const ONLY_FILE    = (process.env.ONLY_FILE || '').trim();

const VALID_VISIBILITY = new Set(['private', 'public', 'internal']);

// --- slugify z transliteracją polskich znaków -----------------------------
// NFKD usuwa większość znaków diakrytycznych, ale `ł`/`Ł` trzeba podmienić ręcznie.
function slugify(input) {
  return String(input)
    .replace(/ł/g, 'l').replace(/Ł/g, 'L')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

function parseFrontmatter(raw, file) {
  const m = raw.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error(`${file}: brak bloku frontmatter (---) na początku pliku`);
  const data = yaml.load(m[1]) || {};
  if (typeof data !== 'object') throw new Error(`${file}: frontmatter nie jest mapą YAML`);
  return data;
}

function run(args) {
  // stderr 'pipe' (nie 'inherit'), żeby błędy gh nie zaśmiecały logu —
  // obsługujemy je przez wyjątek tam, gdzie to istotne.
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function git(args, cwd) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    cwd,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function initRepo(fullName, contextPath) {
  const token = process.env.GH_TOKEN || '';
  const tmpDir = join(tmpdir(), `rs-new-${Date.now()}`);
  try {
    git(['clone', '--quiet', `https://x-access-token:${token}@github.com/${fullName}.git`, tmpDir]);
    git(['config', 'user.email', 'github-actions@github.com'], tmpDir);
    git(['config', 'user.name', 'GitHub Actions'], tmpDir);
    git(['submodule', 'add', '--quiet', RS_SKILLS_URL, RS_SKILLS_PATH], tmpDir);

    if (contextPath) {
      const srcDir = join(process.cwd(), contextPath);
      if (existsSync(srcDir)) {
        cpSync(srcDir, join(tmpDir, 'context'), { recursive: true });
        console.log(`  → context copied from "${contextPath}"`);
      } else {
        console.warn(`  → context_path "${contextPath}" nie istnieje — pomijam`);
      }
    }

    const workflowTemplates = join(process.cwd(), 'templates', 'workflows');
    if (existsSync(workflowTemplates)) {
      mkdirSync(join(tmpDir, '.github', 'workflows'), { recursive: true });
      cpSync(workflowTemplates, join(tmpDir, '.github', 'workflows'), { recursive: true });
      console.log(`  → workflows copied from templates/workflows/`);
    }

    const commitMsg = [contextPath && 'context', existsSync(workflowTemplates) && 'workflows']
      .filter(Boolean).join(' + ');
    git(['add', '.'], tmpDir);
    git(['commit', '--quiet', '-m', commitMsg ? `chore: init — rs-skills + ${commitMsg}` : 'chore: init — rs-skills'], tmpDir);
    git(['push', '--quiet'], tmpDir);
    console.log(`  → pushed`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function repoExists(fullName) {
  try {
    run(['repo', 'view', fullName, '--json', 'name']);
    return true;
  } catch {
    return false;
  }
}

// --- CLI MODE: --name podane, pomijamy repo-requests/ ----------------------
if (CLI_MODE) {
  const name = slugify(cli.name);
  if (!name || !/^[a-z0-9._-]+$/.test(name)) {
    console.error(`Niepoprawna nazwa repo: "${cli.name}"`);
    process.exit(1);
  }
  const visibility = cli.visibility.toLowerCase();
  if (!VALID_VISIBILITY.has(visibility)) {
    console.error(`visibility="${visibility}" — dozwolone: private|public|internal`);
    process.exit(1);
  }
  const fullName   = `${ORG}/${name}`;
  const topics     = cli.topics ? cli.topics.split(',').map((t) => slugify(t.trim())).filter(Boolean) : [];
  const contextPath = cli['context-path'];

  console.log(`Org: ${ORG} | repo: ${name} | dry-run: ${DRY_RUN}`);

  if (repoExists(fullName)) {
    console.log(`= ${fullName} — już istnieje`);
    process.exit(0);
  }
  if (DRY_RUN) {
    console.log(`+ ${fullName} — [dry-run] utworzyłbym (${visibility})`);
    process.exit(0);
  }

  const createArgs = ['repo', 'create', fullName, `--${visibility}`];
  if (cli.description) createArgs.push('--description', cli.description);
  run(createArgs);
  if (topics.length) {
    const editArgs = ['repo', 'edit', fullName];
    for (const t of topics) editArgs.push('--add-topic', t);
    run(editArgs);
  }
  initRepo(fullName, contextPath);
  console.log(`+ ${fullName} — utworzone (${visibility})${topics.length ? `, topics: ${topics.join(', ')}` : ''}`);
  process.exit(0);
}

// --- FILE MODE: zbierz pliki-requesty --------------------------------------
let files;
try {
  files = readdirSync(REQUESTS_DIR, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((n) => n.toLowerCase().endsWith('.md'))
    .filter((n) => n.toLowerCase() !== 'readme.md')
    .filter((n) => !n.startsWith('_')) // szablony: _TEMPLATE.md itd.
    .filter((n) => (ONLY_FILE ? n === ONLY_FILE : true))
    .sort();
} catch (e) {
  console.error(`Nie mogę odczytać katalogu "${REQUESTS_DIR}": ${e.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.log(`Brak plików do przetworzenia w "${REQUESTS_DIR}".`);
  process.exit(0);
}

console.log(`Org: ${ORG} | katalog: ${REQUESTS_DIR} | dry-run: ${DRY_RUN}`);
console.log(`Plików do przetworzenia: ${files.length}\n`);

const results = []; // { file, repo, status, detail }

for (const file of files) {
  const path = join(REQUESTS_DIR, file);
  try {
    const raw = readFileSync(path, 'utf8');
    const fm = parseFrontmatter(raw, file);

    const name =
      (fm.repo && slugify(fm.repo)) ||
      (fm.name && slugify(fm.name)) ||
      slugify(fm.project || basename(file, '.md'));

    if (!name || !/^[a-z0-9._-]+$/.test(name)) {
      throw new Error(`nie udało się ustalić poprawnej nazwy repo (otrzymano "${name}")`);
    }

    const visibility = String(fm.visibility || 'private').toLowerCase();
    if (!VALID_VISIBILITY.has(visibility)) {
      throw new Error(`visibility="${visibility}" — dozwolone: private|public|internal`);
    }

    const description = String(fm.description || fm.project || '').trim();
    const template = fm.template ? String(fm.template).trim() : '';
    const topics = Array.isArray(fm.topics)
      ? fm.topics.map((t) => slugify(t)).filter(Boolean)
      : [];

    const fullName = `${ORG}/${name}`;

    if (repoExists(fullName)) {
      console.log(`= ${fullName} — już istnieje, pomijam`);
      results.push({ file, repo: fullName, status: 'exists', detail: '' });
      continue;
    }

    if (DRY_RUN) {
      console.log(`+ ${fullName} — [dry-run] utworzyłbym (${visibility}${template ? `, z szablonu ${template}` : ''})`);
      results.push({ file, repo: fullName, status: 'dry-run', detail: visibility });
      continue;
    }

    const createArgs = ['repo', 'create', fullName, `--${visibility}`];
    if (description) createArgs.push('--description', description);
    if (template) createArgs.push('--template', template);
    run(createArgs);

    if (topics.length) {
      const editArgs = ['repo', 'edit', fullName];
      for (const t of topics) editArgs.push('--add-topic', t);
      run(editArgs);
    }

    initRepo(fullName, fm.context_path ? String(fm.context_path).trim() : '');

    console.log(`+ ${fullName} — utworzone (${visibility})${topics.length ? `, topics: ${topics.join(', ')}` : ''}`);
    results.push({ file, repo: fullName, status: 'created', detail: visibility });
  } catch (e) {
    console.error(`! ${file} — BŁĄD: ${e.message}`);
    results.push({ file, repo: '', status: 'error', detail: e.message });
  }
}

// --- podsumowanie do GitHub Step Summary -----------------------------------
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  const icon = { created: '🟢', exists: '⚪', 'dry-run': '🔵', error: '🔴' };
  let md = `## Tworzenie repozytoriów\n\n`;
  md += `**Org:** \`${ORG}\` · **dry-run:** \`${DRY_RUN}\`\n\n`;
  md += `| Status | Plik | Repo | Szczegóły |\n|---|---|---|---|\n`;
  for (const r of results) {
    md += `| ${icon[r.status] || ''} ${r.status} | \`${r.file}\` | ${r.repo ? `\`${r.repo}\`` : '—'} | ${r.detail || ''} |\n`;
  }
  try { appendFileSync(summaryFile, md); } catch { /* ignore */ }
}

const errors = results.filter((r) => r.status === 'error').length;
if (errors) {
  console.error(`\nZakończono z błędami: ${errors}`);
  process.exit(1);
}
console.log(`\nGotowe.`);
