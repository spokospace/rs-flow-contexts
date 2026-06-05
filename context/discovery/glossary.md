# Warsztat samochodowy — Glossary

System zarządzania warsztatem samochodowym. Ubiquitous language dla właściciela, pracowników, i zespołu developersów.

## Language

**Serwis**:
Zlecenie naprawy samochodu. Obejmuje klienta, opis pracy (co się psuje), samochód, data/godzina, przydzielonych pracowników, status (w toku / czeka na części / gotowy).
_Avoid_: naprawa, zlecenie, zadanie

**Rezerwacja**:
Zarezerwowanie slotu czasu dla serwisu. Zawiera: kto (klient), auto (numer rejestracyjny), kiedy (data/godzina), co (opis pracy), pracownicy przydzieleni.
_Avoid_: booking, appointment, scheduling

**Pracownik**:
Osoba pracująca w warsztacie, wykonująca naprawy. Widzi tylko swoje serwisy przydzielone na dzisiaj.
_Avoid_: mechanic, technician, employee

**Właściciel**:
Właściciel warsztatu. Zarządza rezerwacjami, przydziela pracowników, widzi wszystkie serwisy, raportuje klientom.
_Avoid_: manager, admin, boss

**Podnośnik**:
Stanowisko pracy / resource w warsztacie. Samochód zajmuje podnośnik przez czas serwisu.
_Avoid_: lift, workstation, bay

**Część**:
Komponent / części zamienne potrzebne do serwisu. Mogą być dostępne w magazynie lub trzeba zamówić.
_Avoid_: component, spare, item
