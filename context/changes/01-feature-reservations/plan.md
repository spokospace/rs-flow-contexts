# 01-feature-reservations — Implementation Plan

## Overview

First slice of the garage management system: Owner reserves car services, Worker sees their daily schedule. Replaces papierowy kalendarz. Core feature: conflict detection (one worker cannot have overlapping reservations). Architecture: Laravel backend (Filament admin for owner, REST API for worker), React frontend (simple list), MySQL database.

## Current State Analysis

Project is greenfield. No code exists. Tech stack chosen: React + UnoCSS (frontend), PHP 8.3 + Laravel + Filament (backend), MySQL 8.0. CI: GitHub Actions, issue tracker: Linear.

**Discovery complete:** context/discovery/discovery-notes.md + glossary.md define personas, FRs, user stories, business logic.

**Assumptions to verify:**
- Filament's default admin interface is sufficient for owner (no custom styling needed yet)
- Worker list view (not calendar) is enough for initial slice
- Session-based auth (not JWT) is fine for web-only (PWA later)

## Desired End State

1. **Owner perspective:** Login to Filament admin → create/edit/delete reservations. Reservations show in a calendar/list. Cannot create overlapping reservations for same worker.
2. **Worker perspective:** Login to React app → see today's reservations as a simple list (client name, car, description, time, other workers assigned).
3. **Data:** Persistent storage of users, reservations, workers. Conflict validation at API level.

### Key discoveries

- **Business rule:** System prevents one worker from having two reservations in the same timeslot (core constraint for Phase 1).
- **Two UIs:** Filament (owner, admin-heavy) + React (worker, simple list). Separate codebases, same API.
- **Auth:** Session-based (cookies), role-based access (Owner = admin, Worker = read-own).
- **API first:** REST endpoints drive both UIs; validation happens at API boundary.

## What we're NOT doing

- Powiadomienia (email/SMS to clients) — next slice
- Zarządzanie częściami / podnośnikami — next slice
- Raportowanie / naliczanie kosztów — next slice
- Filament customization (default Filament UI is OK for now)
- PWA / mobile-native (web-only, sessio-based)
- Soft-delete, archiving, audit logs — not in scope

## Implementation Approach

**Monolithic start, API-first.** Single Laravel app serves both Filament (admin) and API (worker frontend). React worker frontend is a separate SPA within the same Docker container for now.

**Why:** Simplest for first slice. Database + business logic lives in Laravel (single source of truth). Filament admin uses Laravel ORM directly. Worker React app calls REST API (same business logic, single validation point). Later (Slice 2), can decouple into separate microservices if needed.

**Alternatives considered:**
- Separate Laravel API + separate admin/worker apps: More microservices-ready, but extra deployment complexity for first slice.
- Filament-only (no React): Locks worker UI into Filament, harder to evolve separately.
- Full separation (React + Laravel API): Overkill for first slice, same validation logic duplicated.

**Chosen:** Monolithic Laravel + Filament + React API client. Trade-off: tightly coupled, but proven fast, easy to test, iterate.

## Phase 1: Database layer & backend models

### Overview

Create Laravel schema, migrations, Eloquent models. Define core tables (users, reservations, workers). No API yet, no UI. Goal: data layer + business logic ready and unit-testable.

### Required changes

#### 1. Laravel project scaffold
- **File:** New Laravel 11 project (standard scaffold)
- **Goal:** Initialize Laravel, configure DB connection, set up .env
- **Contract:** `php artisan` works, tests run, app boots

#### 2. Database migrations
- **File:** `database/migrations/` directory
- **Goal:** Create tables for users, reservations, workers
- **Contract:** Schema defined per Eloquent migration; `php artisan migrate` applies cleanly
- **Schema sketch:**
  ```
  users: id, email, password, role (owner|worker), created_at
  reservations: id, client_name, car_number, description, 
                start_time, end_time, created_by (user_id),
                created_at, updated_at
  reservation_workers: reservation_id, worker_id (pivot table)
  ```

#### 3. Eloquent models + relationships
- **File:** `app/Models/User.php`, `app/Models/Reservation.php`, `app/Models/Worker.php`
- **Goal:** Define ORM relationships (User has many Reservations, Reservation has many Workers via pivot)
- **Contract:** Models load/save via Eloquent; relationships are eager-loadable

#### 4. Conflict validation logic
- **File:** `app/Services/ReservationService.php` (or within Model)
- **Goal:** Implement "one worker cannot have two reservations in the same time"
- **Contract:** Method `canAssignWorker(Reservation $r, Worker $w): bool` returns false if conflict detected
- **Pseudo-logic:**
  ```
  - Given reservation R with start_time, end_time
  - Given worker W
  - Check: does W have any existing reservation overlapping [R.start, R.end)?
  - If yes: conflict. Return false.
  - Else: OK. Return true.
  ```

### Success criteria

#### Automated
- Migration applies cleanly on `php artisan migrate:fresh`
- All Eloquent models load/save without error
- Unit test: `ReservationService::canAssignWorker()` returns true for non-conflicting, false for conflicting

#### Manual
- Run `php artisan tinker` and create a test reservation + worker; verify conflict logic works

---

## Phase 2: REST API endpoints

### Overview

Build Laravel API routes + controllers. Owner + Worker endpoints. Conflict validation at API boundary. Return JSON. Goal: API ready, testable via curl.

### Required changes

#### 1. Authentication routes
- **File:** `routes/api.php`, `app/Http/Controllers/AuthController.php`
- **Goal:** POST /api/login, POST /api/logout
- **Contract:** Login returns session cookie; logout clears session
- **Note:** Session-based (not JWT)

#### 2. Owner endpoints (CRUD)
- **File:** `routes/api.php`, `app/Http/Controllers/ReservationController.php`
- **Goal:** Create/read/update/delete reservations (Owner only)
- **Contract:**
  - `POST /api/reservations` → create (validate conflict, return 409 if conflict)
  - `GET /api/reservations` → list all (owner sees all)
  - `PUT /api/reservations/{id}` → update
  - `DELETE /api/reservations/{id}` → delete
- **Conflict check:** On create/update, call `ReservationService::canAssignWorker()` for each worker. Return 409 Conflict if any worker has overlap.

#### 3. Worker endpoints (read-only)
- **File:** `routes/api.php`, `app/Http/Controllers/ReservationController.php`
- **Goal:** Worker sees only their own reservations
- **Contract:**
  - `GET /api/reservations?filter=mine` → return reservations for logged-in worker
  - `GET /api/reservations/{id}` → read one (worker can read if assigned)
- **Authorization:** Middleware checks role + ownership

#### 4. Middleware & authorization
- **File:** `app/Http/Middleware/` (custom)
- **Goal:** Enforce role-based access (Owner = admin, Worker = read-own)
- **Contract:** Routes return 403 Forbidden if unauthorized

### Success criteria

#### Automated
- PHPUnit: `POST /api/reservations` with valid data returns 201 + reservation
- PHPUnit: `POST /api/reservations` with conflicting worker returns 409
- PHPUnit: Worker can read own reservation, cannot read others (403)

#### Manual
- curl tests: Create reservation, read it, update it, delete it
- curl test: Try to create conflicting reservation, get 409

---

## Phase 3: Owner interface (Filament)

### Overview

Filament admin panel. Owner can CRUD reservations through a web UI (no custom React yet; Filament default is fine for MVP).

### Required changes

#### 1. Filament resource for Reservations
- **File:** `app/Filament/Resources/ReservationResource.php`
- **Goal:** Auto-generated CRUD UI for reservations
- **Contract:** Filament creates index/create/edit/view pages
- **Fields:** client_name, car_number, description, start_time, end_time, workers (multi-select)
- **Note:** Filament's default form + table is enough; no custom styling yet

#### 2. Worker multi-select field
- **File:** `app/Filament/Resources/ReservationResource.php`
- **Goal:** Owner can assign multiple workers to a reservation
- **Contract:** Multi-select dropdown, links via pivot table

#### 3. Conflict validation in Filament
- **File:** `app/Filament/Resources/ReservationResource.php` (validation rule)
- **Goal:** Filament form shows error if worker conflict detected
- **Contract:** Custom validation rule or model validation hooks prevent saving conflicting reservation

### Success criteria

#### Automated
- Filament resource boots without error (`php artisan serve`)

#### Manual
- Navigate to /admin/reservations → create a reservation → assign worker → verify it saves
- Try to assign same worker to overlapping time → see validation error
- Edit reservation (change time) → verify conflict check re-runs

---

## Phase 4: Worker interface (React)

### Overview

React SPA: Worker logs in, sees a simple list of their reservations for today + upcoming days. Consumes REST API from Phase 2.

### Required changes

#### 1. React app scaffold
- **File:** `resources/js/` (Laravel default)
- **Goal:** Set up React + React Router, connect to API
- **Contract:** `npm run build` compiles to public/js

#### 2. Login page
- **File:** `resources/js/pages/Login.tsx`
- **Goal:** Worker enters email + password
- **Contract:** Calls POST /api/login, stores session cookie, redirects to dashboard

#### 3. Dashboard (list of reservations)
- **File:** `resources/js/pages/Dashboard.tsx`, `resources/js/components/ReservationList.tsx`
- **Goal:** Worker sees their reservations in a table/list
- **Contract:**
  - Fetch `GET /api/reservations?filter=mine`
  - Display: client name, car number, time, description, other workers
  - Group by date (Today / Tomorrow / Later)

#### 4. API client
- **File:** `resources/js/services/api.ts`
- **Goal:** Reusable fetch wrapper (auth, error handling)
- **Contract:** `api.get()`, `api.post()` handle cookies + errors

### Success criteria

#### Automated
- React TypeScript compiles without errors
- Unit test: ReservationList component renders list (mock API)

#### Manual
- Login as worker → see dashboard → list shows reservations for today
- Verify times, client names, other workers are correct

---

## Phase 5: Testing & Polish

### Overview

Unit tests (PHPUnit), E2E tests (Playwright), bug fixes, documentation.

### Required changes

#### 1. PHPUnit tests
- **File:** `tests/Feature/` + `tests/Unit/`
- **Goal:** API + model + validation tests
- **Tests:**
  - `ReservationServiceTest::testCanAssignWorker()` (conflict logic)
  - `ReservationControllerTest::testCreateReservation()` (201, 409)
  - `AuthControllerTest::testLogin()` (session)

#### 2. Playwright E2E tests
- **File:** `tests/e2e/reservations.spec.ts` (or similar)
- **Goal:** Happy path: owner creates reservation → worker sees it
- **Tests:**
  - Login as owner, create reservation, verify it appears in Filament
  - Login as worker, see today's reservations in React app
  - Login as different worker, verify they don't see other worker's reservation

#### 3. Documentation
- **File:** `README.md`, `.github/workflows/ci.yml` (GitHub Actions)
- **Goal:** Setup instructions, run tests, deploy process
- **Contract:** `npm install`, `php artisan migrate`, `npm run dev` gets it running locally

### Success criteria

#### Automated
- `./vendor/bin/phpunit` passes all tests
- `npx playwright test` passes all E2E tests
- GitHub Actions CI passes on push

#### Manual
- Local dev setup: `docker-compose up` works, app loads on localhost
- Filament loads, can create a reservation
- React app loads, can log in, see reservations

---

## Testing Strategy

- **Unit (PHPUnit):** Conflict validation logic, model relationships, API input validation
- **Integration (PHPUnit):** API routes return correct status + response body
- **E2E (Playwright):** Owner creates, worker sees (happy path)
- **Manual:** Test locally before each phase end

## Performance Notes

First slice: Small dataset, no optimization needed. Once 100+ reservations, add index on `(worker_id, start_time)` for conflict query.

## Migration Notes

No data migration (greenfield). Schema is created fresh with `php artisan migrate`. Seed dummy data with `php artisan db:seed` for manual testing.

## References

- `context/discovery/discovery-notes.md` — Vision, personas, FRs, user stories
- `context/discovery/glossary.md` — Serwis, rezerwacja, pracownik, właściciel
- `context/foundation/tech-stack.md` — React, Laravel, Filament, MySQL, Playwright, PHPUnit
- `context/changes/01-feature-reservations/change.md` — This change's metadata

## Progress

### Phase 1: Database layer & backend models
#### Automated
- [ ] 1.1 Migration applies cleanly on `php artisan migrate:fresh`
- [ ] 1.2 All Eloquent models load/save without error
- [ ] 1.3 Unit test: `ReservationService::canAssignWorker()` returns true/false correctly
#### Manual
- [ ] 1.4 `php artisan tinker`: Create test reservation + worker, verify conflict logic works

### Phase 2: REST API endpoints
#### Automated
- [ ] 2.1 PHPUnit: `POST /api/reservations` with valid data returns 201
- [ ] 2.2 PHPUnit: `POST /api/reservations` with conflict returns 409
- [ ] 2.3 PHPUnit: Worker can read own, cannot read others (403)
#### Manual
- [ ] 2.4 curl test: Create, read, update, delete reservation
- [ ] 2.5 curl test: Conflicting reservation returns 409

### Phase 3: Owner interface (Filament)
#### Automated
- [ ] 3.1 Filament resource boots without error
#### Manual
- [ ] 3.2 Navigate to /admin/reservations → create reservation → save
- [ ] 3.3 Assign multiple workers → verify pivot table saves
- [ ] 3.4 Try overlapping time → see validation error

### Phase 4: Worker interface (React)
#### Automated
- [ ] 4.1 React TypeScript compiles without errors
- [ ] 4.2 Unit test: ReservationList renders (mock API)
#### Manual
- [ ] 4.3 Login as worker → see today's reservations in list
- [ ] 4.4 Verify client names, times, other workers displayed correctly

### Phase 5: Testing & Polish
#### Automated
- [ ] 5.1 `./vendor/bin/phpunit` passes all tests
- [ ] 5.2 `npx playwright test` passes all E2E tests
- [ ] 5.3 GitHub Actions CI passes on push
#### Manual
- [ ] 5.4 Local setup: `docker-compose up` works, app loads
- [ ] 5.5 Filament works, can create reservation
- [ ] 5.6 React app loads, can log in, see reservations
