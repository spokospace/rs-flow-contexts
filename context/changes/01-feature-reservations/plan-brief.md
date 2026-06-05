# 01-feature-reservations — Plan Brief

**Link to full plan:** [plan.md](plan.md)  
**Discovery:** [context/discovery/discovery-notes.md](../../discovery/discovery-notes.md)  
**Tech stack:** [context/foundation/tech-stack.md](../../foundation/tech-stack.md)

---

## What & why

**First slice of garage management system.** Owner reserves car services (create, edit, delete). Worker sees their daily schedule as a simple list. Core constraint: one worker cannot have two reservations in the same time slot.

**Why now?** Current pain: papierowy kalendarz → no visibility, no handoff context when worker takes over. This slice solves the scheduling problem, unblocking other work.

## Starting point

Greenfield project. No code. Tech chosen: React + UnoCSS (frontend), PHP 8.3 + Laravel + Filament (backend), MySQL 8.0. Discovery complete with personas, FRs, user stories, business logic.

## Desired end state

1. **Owner:** Login to Filament admin → Create/edit/delete reservations in web UI. Cannot create conflicting reservations.
2. **Worker:** Login to React app → See today's + upcoming reservations as a list (client, car, time, description, other workers).
3. **Data:** Persistent storage, conflict validation at API boundary.

## Key decisions made

| Decision | Choice | Why | Source |
|----------|--------|-----|--------|
| **Owner UI** | Filament admin panel | Fast to MVP, default CRUD UI, Filament baked into Laravel. | Plan |
| **Worker UI** | React simple list (not calendar) | Simpler for first iteration, faster to ship, can add calendar later. | Plan |
| **API design** | REST (not GraphQL) | Standard for web apps, Laravel native, no overkill for first slice. | Plan |
| **Auth** | Session-based (not JWT) | Simpler for web-only, Laravel middleware native, cookies work for Chrome/Android. | Plan |
| **Conflict check** | Backend only (not frontend + backend) | Safety first; API always validates. Frontend can add live feedback in Slice 2. | Plan |
| **Architecture** | Monolithic Laravel (Filament + React API client) | Single source of truth for business logic; fast iteration. Can decouple later. | Plan |

## Scope

**In:**
- User authentication (email + password, session-based, role-based access)
- Owner CRUD reservations (via Filament)
- Worker read own reservations (via React list)
- Conflict validation (one worker ≠ two reservations same time)
- Database: users, reservations, workers (pivot table)
- PHPUnit + Playwright tests

**Out:**
- Notifications (email/SMS to clients) — Slice 2
- Parts inventory + podnośniki — Slice 2
- Cost tracking / reporting — Slice 3
- Filament customization beyond default
- PWA / multi-device sync (web-only, session cookies)

## Architecture / Approach

**Monolithic Laravel + Filament + React API client.**

- Single Laravel app serves both Filament admin (server-side) and REST API (for React frontend).
- React worker frontend is a separate SPA within the same Docker container.
- One database, one source of truth for business logic (conflict validation in Laravel).
- Filament uses Eloquent ORM directly. React calls REST API.

**Why:** Simplest for first slice. Proven patterns, fast to iterate, easy to test. Trade-off: tightly coupled, but can decouple later if needed.

## Phases at a glance

| Phase | Delivers | Key Risk |
|-------|----------|----------|
| **Phase 1: Data layer** | Database schema, Eloquent models, conflict logic | Schema design correct, migration clean |
| **Phase 2: API** | REST routes, auth, CRUD endpoints, 409 on conflict | API validation correct, authorization works |
| **Phase 3: Filament** | Owner admin panel, multi-select workers, validation UI | Filament resource config, conflict shows error |
| **Phase 4: React** | Worker login + list view, API integration | React builds, API calls work, login persists |
| **Phase 5: Testing** | PHPUnit + Playwright tests, CI/CD ready | Happy path covered, no flaky E2E tests |

**Prerequisites:** None (greenfield). Assumes Laravel + Docker available locally.

**Estimated effort:** ~1 week (5 phases, ~1–2 days each, some parallel work possible).

## Open risks & assumptions

1. **Assumption:** Filament's default admin UI is sufficient (no custom styling needed in Slice 1). *Verify:* Owner okays Filament UI after Phase 3.
2. **Assumption:** Session-based auth is fine (PWA multi-device = Slice 2). *Verify:* No logout issues on cross-device scenarios.
3. **Risk:** React build integration with Laravel. *Mitigation:* Use Laravel Mix / Vite (standard). Test locally first.
4. **Risk:** Conflict validation edge case (exact time boundary). *Mitigation:* Unit test [start, end) intervals carefully.

## Success criteria (summary)

- **Owner creates reservation** → appears in Filament, saved to DB, no duplicate on second create
- **Worker logs in** → sees today's reservations as a list, correct details (client, car, time)
- **Conflict detected** → API returns 409, Filament shows validation error
- **All PHPUnit tests pass** → conflict logic, auth, API responses
- **Playwright E2E passes** → owner creates, worker sees (happy path)
- **Deployable** → Docker image builds, CI passes, README has setup instructions
