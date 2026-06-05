---
project: Meniu-qr
client: Self-funded startup
created: 2026-06-05
updated: 2026-06-05
product_type: web-app
target_scale: medium
estimated_effort: 1-2 weeks prototype
---

## Vision & Problem
During peak hours, a guest seated at a café table waits a long time simply to place an order, often unable to catch a server's attention. The cost today is lost time and frustration for the guest and, in the worst case, a guest who leaves unserved — lost revenue for the café. Meniu-qr lets a guest order coffee from their phone without leaving the table.

## User & Persona
**Guest** (primary persona): a customer seated at a café table with a smartphone who wants to order coffee quickly, without standing up or competing for staff attention. Not technical, may be a first-time visitor, expects to start ordering within seconds of scanning.

## Access Control
- **Guest** — no login. Scans a table QR code that carries the table number, then orders immediately and anonymously.
- **Staff** — single role, authenticated login to a panel used to receive orders and manage the menu.

## Success Criteria
### Primary
A Guest scans the table QR, views the menu, adds items to a cart, submits an order bound to the table number, and Staff sees the order live and fulfills it, moving it through statuses (accepted, in progress, ready).

### Secondary
A "call the waiter" button the Guest can press from the table.

### Guardrails
- An order always reaches Staff carrying the correct table number.
- No order is lost — Staff always sees incoming orders.

## Functional Requirements

### Guest
- FR-001: Guest can scan a table QR code and open the menu bound to that table. Priority: must-have
- FR-002: Guest can browse menu items showing name, price, and category. Priority: must-have
- FR-003: Guest can add items to a cart and adjust quantities. Priority: must-have
- FR-004: Guest can submit an order tied to the table number. Priority: must-have
- FR-005: Guest can press a "call the waiter" button. Priority: nice-to-have

### Staff
- FR-006: Staff can log into the panel. Priority: must-have
- FR-007: Staff can see new orders live, each with its table number. Priority: must-have
- FR-008: Staff can change an order's status (accepted, in progress, ready). Priority: must-have
- FR-009: Staff can manage the menu: add/edit items, set prices, mark items "sold out". Priority: must-have
- FR-010: Staff receives a signal when a Guest presses "call the waiter". Priority: nice-to-have

## User Stories
### US-01 — Order coffee from the table
- Given a Guest is seated at table 7 and scans its QR code,
- When they add two flat whites to the cart and submit the order,
- Then the order appears on the Staff panel labeled "Table 7" within a few seconds, and only items currently marked available could be added.

## Business Logic
An order is valid only when it originates from an existing table and contains only items that are currently available.

The Guest's visible inputs are the scanned table (which fixes the table number) and their selection of available menu items with quantities. The output is a submitted order, routed to Staff and tagged with the table. The Guest meets this rule at submission: sold-out items cannot be added or ordered, and an order with no valid table cannot be placed.

## Non-Functional Requirements
- **Privacy**: collect the minimum possible data about the Guest — no account, no personal data required to place an order.
- **Perceived speed**: a submitted order appears on the Staff screen within a few seconds.
- **Device support**: works smoothly in a Guest's mobile browser with no installation.

## Non-Goals
- **Online payments (BLIK/card)** — deferred. The first version settles payment at pickup / with staff, to keep scope small and ship in 1-2 weeks.

## Glossary
- **Guest** — a customer seated at a café table who orders via QR.
- **Staff** — an authenticated café employee who receives orders and manages the menu.
- **Table** — a physical table identified by a number encoded in its QR code.
- **Order** — a set of menu items submitted by a Guest, bound to a Table, with a status.
- **Menu item** — a product (e.g. coffee) with name, price, category, and availability.

## Open Questions
- Multi-location support and whether the QR encodes location + table.
- Whether item availability ever needs scheduling rather than a manual sold-out toggle.