---
# Nazwa repo. Jeśli pominiesz `repo`, zostanie wyliczona ze slug(project).
repo: nazwa-repozytorium
project: Pełna nazwa projektu — czytelna dla człowieka
description: Short English description that becomes the repo description
visibility: private        # private | public | internal
# Pola z konwencji rs-flow (opcjonalne, trafiają tylko do dokumentacji):
context_type: greenfield   # greenfield | brownfield
product_type: web-app
# Opcjonalnie utwórz repo z szablonu (musi być template repo w org):
# template: Rocksoft-IT/rs-context-template
topics: [rs-flow, discovery]
---

# Tytuł

Treść (markdown) jest dowolna — opisz tu kontekst projektu. Na razie body NIE
jest używane przez Action (tworzymy tylko repo z metadanych frontmattera);
służy jako dokumentacja requestu.

> Pliki zaczynające się od `_` (jak ten) oraz `README.md` są pomijane przez Action.
