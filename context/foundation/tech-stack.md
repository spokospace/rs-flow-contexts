---
project: Warsztat samochodowy — system zarządzania
context_type: greenfield
created: 2026-06-05
updated: 2026-06-05
source: picked-from-palette
---

# Warsztat samochodowy — Tech Stack

## Languages & Runtimes

- Node 20 (pnpm) — for frontend build tooling
- PHP 8.3 — backend language
- MySQL 8.0 — database

## Frontend

- Framework: React
- Styling: UnoCSS
- Package manager: pnpm

## Backend

- Laravel (PHP framework)
- Filament (admin dashboard for owner interface)
- Eloquent ORM (data access)

## Data & Storage

- Database: MySQL / MariaDB

## Testing

- E2E: Playwright (browser tests for React app)
- Unit (PHP): PHPUnit (Laravel unit/feature tests)

## Infrastructure & Deploy

- IaC: Terraform (provisioning)
- Packaging: Docker (containerize Laravel + React)
- Deploy target: Cloud (AWS/Azure/GCP — see Open Stack Questions)

## CI/CD

- GitHub Actions

## Issue Tracker

- Linear (team work tracking)

## Open Stack Questions

1. **Concrete cloud provider** — AWS, Azure, or GCP? Free tier available for dev/test on all three. Pin before first deploy.
2. **Filament customization** — Does Filament's default admin panel fit the owner dashboard, or will we need custom React frontend + Laravel API separation?
