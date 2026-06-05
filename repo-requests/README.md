# repo-requests

Jeden plik `.md` = jedno repozytorium do utworzenia w organizacji `Rocksoft-IT`.

## Jak dodać nowe repo

1. Skopiuj [`_TEMPLATE.md`](./_TEMPLATE.md) na np. `moje-repo.md`.
2. Uzupełnij frontmatter YAML (patrz pola niżej).
3. Zacommituj plik na `main`.
4. Wejdź w **Actions → Create repositories → Run workflow**.
   - `dry_run: true` najpierw, żeby zobaczyć co powstanie.
   - potem `dry_run: false` → repo zostaje utworzone.

Action jest **idempotentny** — jeśli repo już istnieje, plik jest pomijany.
Pliki `README.md` oraz zaczynające się od `_` są ignorowane.

## Pola frontmattera

| Pole | Wymagane | Opis |
|---|---|---|
| `repo` | nie | Nazwa repo. Brak → wyliczona ze `slug(project)`. |
| `project` | tak* | Czytelna nazwa projektu. Źródło nazwy, gdy brak `repo`. |
| `description` | nie | Opis repo (po angielsku). |
| `visibility` | nie | `private` (domyślnie) \| `public` \| `internal`. |
| `template` | nie | `Org/template-repo` — utwórz z szablonu. |
| `topics` | nie | Lista topiców, np. `[rs-flow, discovery]`. |

\* Przynajmniej jedno z `repo` / `project` musi pozwolić wyliczyć nazwę.

Pozostałe pola (`context_type`, `product_type`, ...) są dozwolone i służą jako
dokumentacja — Action ich nie używa.
