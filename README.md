# rs-flow-contexts

Repozytorium kontekstów rs-flow + **provisioning nowych repozytoriów przez GitHub Actions**.

## Tworzenie repozytoriów z plików `.md`

Action [`Create repositories`](.github/workflows/create-repos.yml) tworzy repo w
organizacji `Rocksoft-IT` na podstawie plików w [`repo-requests/`](repo-requests/).
Jeden plik `.md` = jedno repo; dane bierzemy z frontmattera YAML.

```
repo-requests/
├── _TEMPLATE.md            ← szablon (ignorowany przez Action)
├── warsztat-samochodowy.md ← przykładowy request
scripts/create-repos.mjs    ← logika (gh CLI + js-yaml)
.github/workflows/create-repos.yml
```

### Uruchomienie

**Actions → Create repositories → Run workflow.** Inputy:
- `dry_run` — gdy `true`, nic nie tworzy, tylko pokazuje plan (zacznij od tego),
- `only_file` — opcjonalnie ogranicz do jednego pliku.

Szczegóły formatu: [`repo-requests/README.md`](repo-requests/README.md).

### Wymagana autoryzacja (ważne)

Domyślny `GITHUB_TOKEN` **nie może** tworzyć repo w organizacji. Action używa
sekretu **`ORG_REPO_TOKEN`**. Ustaw go w *Settings → Secrets and variables →
Actions*:

- **MVP (najszybciej):** classic **PAT** ze scope **`repo`**, z konta które ma
  prawo tworzyć repozytoria w `Rocksoft-IT`.
- **Docelowo:** **GitHub App** z uprawnieniem *Administration: write* na org;
  token mintowany w workflow (`actions/create-github-app-token`) zamiast PAT
  człowieka — wąski zakres, rotowalny, bez tokenu w czyimś profilu.

## Dane testowe

Katalog [`context/`](context/) zawiera przykładowy pakiet kontekstu rs-flow
(discovery / foundation / prd / changes) projektu "Warsztat samochodowy".
Służy jako realne dane do testów (request `repo-requests/warsztat-samochodowy.md`
jest z niego wyprowadzony).

## Lokalne uruchomienie

```bash
npm install
# podgląd bez tworzenia:
GH_TOKEN=$(gh auth token) DRY_RUN=true node scripts/create-repos.mjs
# realne tworzenie:
GH_TOKEN=$(gh auth token) node scripts/create-repos.mjs
```
