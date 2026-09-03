---
id: TASK-372
title: >-
  Fynd: raderad inbetalning lämnar Anmälningsavgift='Mottagen' kvar i basen när
  eventets anmälningsavgift saknar belopp — tre spökflaggor på RIM 3 efter
  Marcus test
status: To Do
assignee: []
created_date: '2026-09-03 08:58'
labels:
  - ready-for-agent
dependencies: []
ordinal: 673000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Symptom
Prod 2026-09-03: Marcus registrerade testinbetalningar på 2 500 kr (helpriset) på Cecilia Örning (06:43), Anna Roos (07:17) och Anna Ryttberg (07:17) på RIM 3 Rönninge (Event-25, recLJ3SuZz8A1UEND) och raderade alla tre. Efteråt står alla tre med Anmälningsavgift = 'Mottagen' i basen trots Summa inbetalt = 0 och noll inbetalningsrader i Postgres. Eventsidan visar '3 av 13 anmälningsavgifter mottagna' (rollup Antal mottagna anmälningsavgifter läser flaggan). Slutbetalning återställdes korrekt till 'Ej mottagen'.

## Rotorsak (verifierad i kod)
supabase/functions/_shared/betalningsharledning.ts: vid registrering av helpriset tas 'Mottagen'-grenen för avgiften även när avgiftens belopp är okänt (helpris täcker avgiften). Vid radering är summan 0 < helpris, men avgiftens belopp är okänt på eventet (RIM 3 saknar 'Anmälningsavgift (kr)' i basen), och egenskap 3 ('okänd gräns ⇒ null, rör inte fältet') lämnar flaggan orörd. Flaggan kan alltså flippas TILL Mottagen men aldrig tillbaka så länge avgiftsbeloppet saknas.

## Förväntat beteende
Summa 0 ger ALLTID Anmälningsavgift = 'Ej mottagen' (0 understiger varje positivt avgiftsbelopp; ingen gissning krävs). Mer allmänt: när summan understiger helpriset och avgiften är okänd ska flaggan inte kunna stå kvar på ett värde som en tidigare, nu borttagen, inbetalning satte — härled symmetriskt eller lämna aldrig ett Mottagen-spår efter radering/makulering. Testfall: registrera helpris på anmälan med okänd avgift → Mottagen; radera → Ej mottagen. Datastädning: de tre RIM 3-flaggorna återställs (görs av orkestreraren på Marcus GO, S115 Del 5).

## Källa
S115 Del 5 (2026-09-03), prod-läsning via bypass + Airtable-connectorn; Marcus: 'det borde vara noll, ALLT borde vara noll'.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
