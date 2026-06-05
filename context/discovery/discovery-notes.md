---
project: Warsztat samochodowy — system zarządzania
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
  frs-drafted: 0
  quality_check_status: pending
---

## Vision & Problem

**Current state:** Warsztat samochodowy zarządzany ręcznie — planowanie na papierowym kalendarzu, brak śladu gdzie są części, brak kontroli kosztów, brak raportów. Właściciel odbiera telefony od klientów, ale nie ma szybkiego dostępu do statusu serwisu. Pracownicy ciągle szukają narzędzi i części, nie wiadomo gdzie leżą ani kto je wziął.

**Four key gaps:**
1. Brak systemu zarządzania serwisami — wychodzenie z papieru, widok na wszystkie otwarte naprawy
2. Brak śladu częśći i narzędzi — gdzie są, kto je wziął, czy są dostępne
3. Brak kontroli kosztów — ile kosztuje każdy serwis, czy zarabiamy
4. Brak raportów — dla właściciela (rentowność), dla klientów (status)

**Cost today:** Stracony czas (szukanie, handoff pracy między pracownikami), błędy (pracownik przejmuje robotę bez kontekstu), nie wiesz czy zarabiasz czy tracisz pieniądze, klient czeka na odpowiedź.

## User & Persona

**Primary: Właściciel warsztatu (30–50 lat, biegły w mechanic, mało tech-savvy)**
- Zarządza warsztatem, przydzielza pracę, odbiera telefony od klientów
- Musi szybko odpowiedzieć klientom — "kiedy będzie gotowe?"
- Chce widzieć rentowność, gdzie idą pieniądze
- Musi koordynować pracę gdy pracownik choruje (handoff)

**Secondary: Pracownik warsztatowy (różne weki, różne doświadczenie)**
- Wykonuje naprawy, potrzebuje znać plan dnia, gdzie są narzędzia, gdzie są części
- Raportuje co zrobił, co zostało, co potrzeba zamówić
- Musi wiedzieć gdzie coś zostawił, jeśli już tego nie ma przy stanowisku pracy

## Access Control

**Login:** Email + hasło, każdy ma swoje konto.

**Roles:**
- **Właściciel (Admin):** widzi wszystkie rezerwacje, wszystkich pracowników, może edytować wszystko
- **Pracownik (Member):** widzi tylko swoje rezerwacje na dzisiaj i nadchodzące dni

## Success Criteria

### Primary

Właściciel rezerwuje serwis samochodowy (klient, auto, co się psuje, data/godzina, przydzieleni pracownicy) → Pracownik przychodzi na zmianę i widzi listę swoich serwisów na dzisiaj z pełnymi szczegółami (klient, auto, opis pracy, przydzieleni pracownicy).

**First slice scope:** Rezerwacje + przydzielanie pracowników. (Brakuje: zarządzanie częściami, naliczanie, podnośniki, powiadomienia — to będą następne slicy.)

### Secondary

Właściciel może edytować rezerwację (zmiana godziny, przydzielonych pracowników, opisu).

### Guardrails

- Rezerwacje nigdy się nie nachodzą — dwa serwisy nie mogą być przydzielone do tego samego pracownika w tym samym czasie
- Rezerwacje się nie tracą (persistent storage)

## Functional Requirements

- FR-001: Właściciel może tworzyć rezerwację (klient, samochód, opis pracy, data/godzina, pracownicy). Priority: must-have
- FR-002: Właściciel może edytować rezerwację. Priority: must-have
- FR-003: Właściciel może zobaczyć wszystkie rezerwacje (kalendarz/lista). Priority: must-have
- FR-004: Właściciel może przydzielić pracownika do serwisu. Priority: must-have
- FR-005: Pracownik może zobaczyć swoje serwisy na dziś. Priority: must-have
- FR-006: Pracownik może zobaczyć szczegóły serwisu (klient, auto, opis pracy, inni pracownicy). Priority: must-have

> Challenge (FR-002): Gdy serwis się rozpoczął, edytowanie rezerwacji jest blokowane (chyba że będziemy mieć system czekania na części — przyszły slice).

## User Stories

### US-01: Właściciel rezerwuje serwis

**Given** właściciel jest zalogowany i widzi kalendarz serwisów  
**When** właściciel odbiera telefon od klienta i chce zarezerwować serwis  
**Then** właściciel może wpisać: imię klienta, numer auta, co się psuje, kiedy przygotować auto, i przydzielić pracownika(ów) do pracy  
**And** rezerwacja pojawia się w kalendarzu  
**And** pracownik(y) przydzielony(i) do tej rezerwacji widzą ją w swoim planie dnia

### US-02: Pracownik przychodzi na zmianę

**Given** pracownik jest zalogowany  
**When** pracownik przychodzi na zmianę  
**Then** pracownik widzi listę swoich serwisów na dzisiaj  
**And** każdy serwis zawiera: klienta, auto, opis pracy, godzinę startu/końca, innych pracowników przydzielonych

## Business Logic

System zapewnia że rezerwacje pracowników się nie nachodzą — jeden pracownik nie może mieć dwóch serwisów w tym samym czasie.

Właściciel wprowadza dane serwisu (klient, auto, co się psuje, data/godzina, pracownicy). System sprawdza dostępność każdego pracownika — jeśli pracownik ma już serwis w tym czasie, rezerwacja jest odrzucana. Jeśli wszyscy pracownicy są dostępni, rezerwacja jest tworzona. Pracownicy widzą swoją pracę na dzisiaj — system gwarantuje że nie będą mieć konfliktów czasowych.

## Non-Functional Requirements

- **Response time:** Natychmiastowe (ładowanie rezerwacji, tworzenie, edytowanie)
- **Device/Browser:** Android + Chrome, Windows + Chrome (web app). Później PWA.
- **Availability:** 24/7
- **Privacy:** Tylko zalogowani pracownicy mogą widzieć rezerwacje

## Non-Goals

- Zarządzanie częściami i magazynem (next slice)
- Naliczanie kosztów (next slice)
- Powiadomienia dla klienta (next slice)
- SMS/email notyfikacje (next slice)
- Raportowanie kosztów i serwisów (next slice)
- Zarządzanie podnośnikami (next slice)

## Open Questions

- "Połączona z kalendarzem" — czy to znaczy integracja z Google Calendar / Outlook, czy system ma wbudowany calendar?
