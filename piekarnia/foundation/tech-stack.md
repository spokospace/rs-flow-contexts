---
project: Piekarnia — system zamówień
context_type: greenfield
created: 2026-06-05
updated: 2026-06-05
source: picked-from-palette
---

# Piekarnia — Tech Stack

## Languages & Runtimes

- PHP 8.3 — backend language
- Node 20 (pnpm) — frontend build tooling
- MySQL 8.0 — database

## Backend

- Laravel — application framework
- Filament — admin panel (katalog produktów, zamówienia, lista produkcji)

## Frontend

- Blade + Alpine.js — prosty formularz zamówienia dla klienta
- Tailwind v4 — styling

## Infrastructure

- Docker — local + deploy
- REST API — endpoint składania zamówienia

## Notes

Monolit Laravel: Filament dla obsługi, publiczny formularz zamówienia w Blade/Alpine.
Sesyjny auth dla obsługi; klient zamawia bez konta.
