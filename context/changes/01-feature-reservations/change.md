---
change_id: 01-feature-reservations
project: Warsztat samochodowy — system zarządzania
status: implementing
created: 2026-06-05
updated: 2026-06-05
---

# 01-feature-reservations

**First slice:** Owner can reserve services + Worker can see their daily schedule.

Replaces papierowy kalendarz; solves immediate pain: no visibility of reservations, no handoff context when worker takes over.

## Deliverable

Owner reserves service (client, car, description, date/time, workers) → Worker sees their services on their shift in a simple list.

## Why

Current: Papierowy kalendarz → właściciel nie wie gdzie są części, pracownik nie wie historii, chaos w handoff. Serwis: reservation system, no conflict checking yet (no podnośniki, no czekanie na części).

## Scope

In:
- User authentication (email + password, session-based)
- Owner can CRUD reservations (Filament admin panel)
- Worker can see their own reservations (React list)
- Conflict validation (one worker ≠ two reservations same time)
- Database: users, reservations, workers

Out:
- Powiadomienia, części, podnośniki, raportowanie, naliczanie
- Filament customization beyond default
- Multi-device (cookies only, no PWA yet)

## Effort

~1 tydzień (discovery: Medium complexity, 5 phases)
