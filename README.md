# rs-flow-contexts

Control plane for provisioning client repositories and bootstrapping GitHub Issues from discovery notes.

```
scripts/
├── create-repos.mjs          ← tworzy repo w organizacji
├── create-issues-from-spec.mjs  ← tworzy issues z discovery-notes.md
└── sync-spec-choices.mjs     ← aktualizuje dropdown w workflow

.github/workflows/
├── create-repos.yml          ← Actions: tworzenie repo
├── create-issues.yml         ← Actions: tworzenie issues (dropdown)
└── sync-spec-choices.yml     ← Actions: auto-sync listy plików

2026-06-05-meniu-qr-*/
└── context/foundation/discovery-notes.md   ← spec klienta
```

---

## Tworzenie repozytoriów

[`create-repos.yml`](.github/workflows/create-repos.yml) tworzy repo w organizacji na podstawie plików w [`repo-requests/`](repo-requests/). Każde nowe repo dostaje submodule `rs-skills` pod `.claude/skills/` i opcjonalnie skopiowany folder `context/`.

### GitHub Actions

**Actions → Create repositories → Run workflow.** Inputy:
- `dry_run` — podgląd bez tworzenia,
- `only_file` — jeden konkretny plik z `repo-requests/`,
- `target_org` — docelowa organizacja (domyślnie `Rocksoft-IT`; dla klienta podaj jego org i ustaw secret `CLIENT_REPO_TOKEN`).

### Lokalnie (tryb CLI)

```bash
# Jedno repo bez pliku repo-requests/:
GH_TOKEN=$(gh auth token) node scripts/create-repos.mjs \
  --name moje-repo \
  --org spokospace \
  --description "Opis projektu" \
  --context-path 2026-06-05-meniu-qr-self-funded-startup/context

# Dry run z pliku:
GH_TOKEN=$(gh auth token) DRY_RUN=true node scripts/create-repos.mjs
```

Format `repo-requests/*.md`: [`repo-requests/README.md`](repo-requests/README.md).

### Autoryzacja

`GITHUB_TOKEN` nie może tworzyć repo w organizacji. Ustaw secret w *Settings → Secrets → Actions*:

| Secret | Kiedy |
|--------|-------|
| `ORG_REPO_TOKEN` | PAT z scope `repo` dla konta Rocksoft-IT |
| `CLIENT_REPO_TOKEN` | PAT klienta gdy `target_org` wskazuje jego org |

---

## Tworzenie issues z discovery notes

[`create-issues.yml`](.github/workflows/create-issues.yml) parsuje plik `discovery-notes.md` i tworzy GitHub Issues dla każdego `FR-XXX`. Bezpieczne do wielokrotnego uruchamiania — istniejące issues są pomijane.

**Co tworzy:**
- Issue per FR z tytułem `[FR-NNN] tytuł`, priorytetem i kryterium akceptacji (jeśli obecne w pliku),
- Labele `blocked` / `blocks` i "Blocked by: #N" w opisie dla zależności z sekcji `## Dependencies`.

### GitHub Actions

**Actions → Create issues from spec → Run workflow.** Inputy:
- `spec_file` — dropdown z listą dostępnych plików `discovery-notes.md`,
- `target_repo` — repo docelowe (`owner/name`); puste = bieżące repo,
- `dry_run` — podgląd bez tworzenia.

Dla zewnętrznych repo potrzebny secret `CLIENT_REPO_TOKEN` lub `ORG_REPO_TOKEN` z prawem `issues: write`.

### Lokalnie

```bash
# Tworzenie issues w konkretnym repo:
REPO=spokospace/meniu-qr \
  node scripts/create-issues-from-spec.mjs \
  2026-06-05-meniu-qr-self-funded-startup/context/foundation/discovery-notes.md

# Dry run:
DRY_RUN=true REPO=spokospace/meniu-qr \
  node scripts/create-issues-from-spec.mjs <plik>
```

### Format discovery-notes.md

```markdown
## Functional Requirements

### Guest
- FR-001: Guest can scan a QR code. Priority: must-have
  - **Acceptance:** Guest scans QR in test env and sees correct menu.
- FR-002: Guest can browse menu items. Priority: must-have

## Dependencies
- FR-002 blocked-by FR-001
- FR-007 blocked-by FR-006, FR-004
```

---

## Auto-sync listy plików

[`sync-spec-choices.yml`](.github/workflows/sync-spec-choices.yml) automatycznie aktualizuje dropdown w `create-issues.yml` gdy na `main` pojawi się nowy lub zmieniony plik `discovery-notes.md`.

**Ręcznie** (po dodaniu nowego klienta lokalnie):

```bash
node scripts/sync-spec-choices.mjs
```

---

## Struktura folderów klientów

```
2026-06-05-meniu-qr-self-funded-startup/
└── context/
    └── foundation/
        └── discovery-notes.md   ← spec klienta (parsowana przez create-issues)
```

Folder `context/` jest kopiowany do nowo tworzonego repo przez `create-repos.mjs` gdy w `repo-requests/*.md` jest pole `context_path`.
