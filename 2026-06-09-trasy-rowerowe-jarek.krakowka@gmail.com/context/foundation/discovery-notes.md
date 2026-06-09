---
project: trasy-rowerowe
client: jarek.krakowka@gmail.com
context_type: greenfield
created: 2026-06-09
updated: 2026-06-09
product_type: web-app
target_scale:
  users: small
estimated_effort: unknown ("nie mam pojęcia")
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6]
  frs-drafted: 7
  quality_check_status: accepted
---

## Vision & Problem

A recreational cyclist who likes returning to favourite routes has no good place
to record which routes they have ridden, how many times, and how much they
enjoyed each one. Today this information lives in scattered phone notes that get
lost and disorganised, so the cyclist cannot answer simple questions like "which
route was the most enjoyable?" or "how often have I ridden this one?".

Existing activity apps (Strava, Komoot, Garmin) solve the opposite problem: they
automatically capture everything about an activity and lean on social sharing.
This cyclist wants the inverse — a simple, private log where they manually enter
only the basics they care about, and nothing is shared by default. The insight
is that the value here is in deliberate, lightweight, personal record-keeping,
not automatic data harvesting.

## User & Persona

**Recreational Cyclist** — rides bicycle routes for pleasure, returns to
favourite routes over time, and wants a simple personal record of those rides.
Not a competitive athlete chasing metrics, and not looking to broadcast
activity to others. Values simplicity and privacy over rich automatic tracking.

## Access Control

The Cyclist signs in with an email-and-password account so their data persists
and is reachable from multiple devices. Flat single-role model: every account is
a Cyclist who can see and manage only their own Routes and Rides. There are no
admin, member, or guest roles, and no shared or public data — privacy by default
is a core part of the product's appeal.

## Success Criteria

### Primary
The first end-to-end flow proves the whole loop works:
1. The Cyclist registers and signs in.
2. The Cyclist adds a Route and gives it a name.
3. The Cyclist logs a Ride on that Route with a rating (and an optional note).
4. The Cyclist sees a summary of their Routes that reveals which Route was the
   most enjoyable and how many times each Route has been ridden.

### Secondary
Per-Ride notes capturing how the ride felt — weather, mood, and anything worth
remembering about that particular outing. Nice to have, not required for the
first increment.

### Guardrails
- **Privacy.** Data is never public or shared without the Cyclist's explicit
  action. This is the product's reason to exist.
- **Simplicity of entry.** Logging a Ride stays fast — only a few fields, no
  forced detail.
- **No data loss.** Once a Ride is saved it does not silently disappear.

## Functional Requirements

- FR-001: Cyclist can register and sign in with an email and password. Priority: must-have
  > Challenge: No serious counterargument — sign-in is required for cross-device, private personal data. Kept as written.
- FR-002: Cyclist can add a Route and give it a name. Priority: must-have
  > Challenge: No serious counterargument — Routes are the core entity everything else hangs off. Kept as written.
- FR-003: Cyclist can log a Ride on a Route with a rating. Priority: must-have
  > Challenge: A single rating loses nuance, but it is the deliberately simple input that powers the enjoyment ranking. Kept as written.
- FR-004: Cyclist can add an optional note to a Ride (e.g. weather, mood, memories). Priority: nice-to-have
  > Challenge: No serious counterargument — optional and additive; cannot harm the core loop. Kept as written.
- FR-005: Cyclist can view a summary of Routes showing how many times each has been ridden and which is most enjoyable, ranked by average rating. Priority: must-have
  > Challenge: Average rating means a single bad Ride drags down a favourite Route. Accepted deliberately — simplicity over a weighting scheme; revisit if it misleads in practice.
- FR-006: Cyclist can view the full Ride history of a Route, listing each Ride with its date and rating. Priority: must-have
  > Challenge: Could be narrowed to a count + average for the first increment, but the Cyclist explicitly wants the dated list. Kept as full history.
- FR-007: Cyclist can record a personal Achievement on a Route — a manually entered milestone or personal record (e.g. "first time without stopping", "longest ride"). Priority: must-have
  > Challenge: Free-text Achievements are unstructured and cannot be ranked or compared automatically. Accepted — they are personal mementos the Cyclist enters and reads, not data the app needs to compute on; structure can come later if it proves useful.

## User Stories

### US-01 — Discover the most enjoyable route
- **Given** the Cyclist has logged several Rides across a few Routes with ratings,
- **When** they open the Routes summary,
- **Then** they see each Route with its Ride count and average rating, with the
  highest-average Route surfaced as the most enjoyable.

## Business Logic

The app ranks a Cyclist's Routes by their average Rating to surface which Route
is the most enjoyable.

The user-visible inputs are the Routes the Cyclist creates and the Rides they log
against each Route, where every Ride carries a Rating (and optionally a note).
The output is a Routes summary in which each Route shows how many times it has
been ridden and its average Rating, with the highest-average Route presented as
the most enjoyable. The Cyclist meets this rule when they open the summary after
logging Rides — it turns scattered, manually entered basics into a single ranked
answer to "which route did I enjoy most, and how often have I ridden it?".

Alongside the ranking, each Route also accumulates a Cyclist-entered record of
Achievements — manual milestones and personal records. These are kept and shown
as personal mementos rather than fed into the ranking, preserving the
deliberately simple, manual character of the app.

## Non-Functional Requirements

- Works well on a phone first: comfortable to use on a small touchscreen,
  including just after a ride when the Cyclist is still outdoors.
- Logging a Ride feels quick — the Cyclist can record one in well under a minute.
- Private by default: no Route, Ride, or Achievement is visible to anyone but
  its owner, and nothing is shared without an explicit action.
- Durable: saved Routes, Rides, and Achievements remain available across
  sessions and devices and are not silently lost.

## Non-Goals

- Automatic GPS tracking or route recording — entries are made manually by the
  Cyclist; manual, deliberate logging is the whole point.
- Social features (sharing, following, cross-user leaderboards) — the app is
  private and personal by design.
- Maps and navigation — the app records and rates Routes, it does not route you
  along them.
- Integrations with devices or wearables (Garmin, Strava, etc.) — avoiding
  automatic data capture keeps the product simple and private.
