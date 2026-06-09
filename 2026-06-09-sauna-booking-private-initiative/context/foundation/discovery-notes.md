---
project: Sauna Booking
client: private initiative
created: 2026-06-09
updated: 2026-06-09
product_type: web-app
target_scale:
  users: small
estimated_effort: (not estimated)
---

## Vision & Problem
The current Sauna Booking flow couples registering with paying. The owner wants the sauna to run on a community-funded model where contributing and attending are separate actions, and an event is only offered once it's actually paid for — without forcing each attendee to pay when they sign up. This is a private initiative; Rocksoft is not the sponsor.

## User & Persona
Primary persona: **Participant** — a member of the public who wants to join a sauna session and may also contribute to the fund. Secondary: **Organizer** — sets the event date/time once funding unlocks.

## Access Control
Public. Anyone can donate and register without a Rocksoft account; no organizational SSO.

## Success Criteria
**Primary** — Donations accumulate in a running pool. When the balance reaches ≥ 200 PLN, the organizer can schedule the next event and free registration opens. When the scheduled time passes, 200 PLN is auto-deducted and surplus carries forward.
**Secondary** — Participants can see progress toward the next event (e.g. "140 / 200 PLN raised").
**Guardrails** — (1) The existing donation collection must not break. (2) Registration can never open while the pool is below 200 PLN.

## Functional Requirements
- **FR-001:** Participant can donate to the sauna fund. Priority: must-have *(existing process — unchanged)*.
- **FR-002:** System maintains a running donation-pool balance with explicit deductions. Priority: must-have.
> Challenge: Could the balance be read from donation records on demand instead of stored? No — events *consume* from the pool, so a raw donation sum can't represent "spent." A stored balance with deductions is required.
- **FR-003:** When pool balance ≥ 200 PLN, system lets the organizer schedule the next event and opens free registration. Priority: must-have.
- **FR-004:** Participant can register for an unlocked event without payment; no headcount cap. Priority: must-have.
- **FR-005:** When pool balance < 200 PLN, registration for a new event is closed. Priority: must-have.
- **FR-006:** When the scheduled event time passes, system auto-deducts 200 PLN from the pool; surplus carries forward. Priority: must-have.
> Challenge: Auto-deduct risks burning 200 PLN if an event is cancelled. Accepted by owner; cancellation handling left as an open question.
- **FR-007:** Participant can see progress toward the next unlock. Priority: nice-to-have.

## User Stories
**US-01 — Funding unlocks an event**
Given the donation pool is at 180 PLN and a participant donates 30 PLN,
When the balance reaches 210 PLN,
Then the organizer can schedule the next sauna event and registration opens for participants.

## Business Logic
A sauna event becomes available for scheduling and registration only when the cumulative donation pool reaches or exceeds 200 PLN; once the scheduled event time passes, 200 PLN is consumed from the pool and any surplus carries forward to the next event.

Participants meet this rule in two places: a visible "raised so far" indicator while the pool fills, and a registration screen that is open or locked depending on the balance. The organizer meets it once per cycle, by setting the date/time after the pool unlocks. Deduction is automatic and time-based, not manually confirmed.

## Non-Functional Requirements
Pool balance and deductions must be accurate to the PLN and never double-counted. Lock/unlock state should reflect the current balance without noticeable delay after a donation. Small scale — a single sauna, modest participant count, public traffic.

## Non-Goals
- Per-attendee payment at registration — explicitly decoupled.
- Refunding donations to individuals — money stays in the pool as carry-forward credit.
- Building a new donation/payment mechanism — reuse the existing one.
- Headcount caps, waitlists, or seat guarantees — no capacity limit.

## Glossary
- **Donation pool** — running balance of contributions, less amounts consumed by held events. Avoid: "fund balance."
- **Unlock** — the state change when the pool reaches 200 PLN and scheduling/registration opens.
- **200 PLN threshold** — the cost of one sauna event; the gate for unlocking and the amount auto-deducted after.
- **Carry-forward** — surplus above 200 PLN remaining in the pool after a deduction.
- Avoid: "booking" — now split into *register* and *donate*.

## Open Questions
1. **Cancelled events** — if a scheduled event doesn't happen, should the 200 PLN auto-deduction be reversed/skipped, or is it still consumed? (Only unresolved decision.)
