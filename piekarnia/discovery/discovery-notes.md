---
project: Piekarnia — system zamówień
context_type: greenfield
created: 2026-06-05
updated: 2026-06-05
product_type: web-app
target_scale:
  users: small
estimated_effort: ~1 tydzień (first slice)
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6]
  quality_check_status: accepted
---

## Vision & Problem

**Current state:** Lokalna piekarnia przyjmuje zamówienia na pieczywo i wypieki przez
telefon i karteczki. Brak listy zamówień na dany dzień, pomyłki w ilościach, klienci
dzwonią by potwierdzić odbiór. Piekarz rano nie wie ile czego upiec.

**Key gaps:**
1. Brak listy zamówień na dzień — piekarz nie planuje produkcji
2. Pomyłki w ilościach i terminach odbioru
3. Brak potwierdzenia dla klienta
4. Brak śladu, co już odebrane

## User & Persona

**Primary: Właściciel/piekarz (40–60 lat, mało tech-savvy)**
- Przyjmuje zamówienia, planuje poranną produkcję, wydaje pieczywo
- Chce rano widzieć zbiorczą listę „co upiec" na dziś

**Secondary: Klient**
- Składa zamówienie z wyprzedzeniem, podaje datę/godzinę odbioru
- Chce potwierdzenie i przypomnienie

## Access Control

**Login:** Email + hasło dla obsługi piekarni. Klient zamawia bez konta (link/numer).

**Roles:**
- **Właściciel (Admin):** widzi wszystkie zamówienia, zarządza produktami
- **Obsługa (Member):** widzi listę na dziś, oznacza odbiór

## Success Criteria

### Primary

Klient składa zamówienie (produkty, ilości, data/godzina odbioru) → Piekarz rano widzi
zbiorczą listę produkcji na dziś (ile czego upiec) oraz listę zamówień do wydania.

**First slice scope:** Składanie zamówień + dzienna lista produkcji. (Później: płatności,
powiadomienia SMS, magazyn surowców.)

### Guardrails

- Zamówienia się nie gubią (persistent storage)
- Nie można zamówić na termin z przeszłości

## Functional Requirements

- FR-001: Klient może złożyć zamówienie (produkty, ilości, data/godzina odbioru). must-have
- FR-002: Właściciel może zarządzać katalogiem produktów. must-have
- FR-003: Piekarz widzi dzienną listę produkcji (suma ilości per produkt). must-have
- FR-004: Obsługa widzi listę zamówień do wydania na dziś. must-have
- FR-005: Obsługa może oznaczyć zamówienie jako odebrane. must-have

## Non-Goals

- Płatności online (next slice)
- Powiadomienia SMS/email (next slice)
- Magazyn surowców i receptury (next slice)
- Dostawa pod adres (next slice)

## Open Questions

- Czy klient potrzebuje konta, czy wystarczy link do zamówienia?
