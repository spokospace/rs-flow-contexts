# rs-flow-contexts

rs-flow context repository + **provisioning of new repositories via GitHub Actions**.

## Create repositories from `.md` files

The [`Create repositories`](.github/workflows/create-repos.yml) action creates repos in
the `Rocksoft-IT` organization based on the files in [`repo-requests/`](repo-requests/).
One `.md` file = one repo; the data comes from the YAML frontmatter.

```
repo-requests/
├── _TEMPLATE.md            ← template (ignored by the action)
├── warsztat-samochodowy.md ← example request
scripts/create-repos.mjs    ← logic (gh CLI + js-yaml)
.github/workflows/create-repos.yml
```

### Running it

**Actions → Create repositories → Run workflow.** Inputs:
- `dry_run` — when `true`, creates nothing and just prints the plan (start here),
- `only_file` — optionally limit to a single file.

Format details: [`repo-requests/README.md`](repo-requests/README.md).

### Required authorization (important)

The default `GITHUB_TOKEN` **cannot** create repositories in an organization. The action
uses the **`ORG_REPO_TOKEN`** secret. Set it under *Settings → Secrets and variables →
Actions*:

- **MVP (fastest):** a classic **PAT** with the **`repo`** scope, from an account allowed
  to create repositories in `Rocksoft-IT`.
- **Long term:** a **GitHub App** with the *Administration: write* permission on the org;
  mint the token inside the workflow (`actions/create-github-app-token`) instead of a
  human PAT — narrow scope, rotatable, not tied to anyone's profile.

## Test data

The [`context/`](context/) directory contains a sample rs-flow context package
(discovery / foundation / prd / changes) for the "Warsztat samochodowy" project.
It serves as real test data (the `repo-requests/warsztat-samochodowy.md` request is
derived from it).

## Running locally

```bash
npm install
# preview without creating anything:
GH_TOKEN=$(gh auth token) DRY_RUN=true node scripts/create-repos.mjs
# real creation:
GH_TOKEN=$(gh auth token) node scripts/create-repos.mjs
```
