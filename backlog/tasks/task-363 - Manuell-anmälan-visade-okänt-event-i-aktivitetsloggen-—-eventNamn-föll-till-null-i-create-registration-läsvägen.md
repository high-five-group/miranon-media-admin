---
id: TASK-363
title: >-
  Manuell anmälan visade '(okänt event)' i aktivitetsloggen — eventNamn föll
  till null i create-registration + läsvägen
status: Done
assignee: []
created_date: '2026-09-02 09:23'
updated_date: '2026-09-02 12:16'
labels: []
dependencies: []
ordinal: 662000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rotorsak: create-registration-EF:en skrev aldrig Anmälans egna 'Vill anmäla sig till', så formeln Event (namn) alltid var tom för manuella/+1/väntelista-anmälningar och eventNamn föll till null. Samma tomma formel lästes av get-registrations/get-registration (_shared/registration-read.ts). Fix: eventNamn föredrar nu lookupen Kurs (from Event) med fallback till formeln Event (namn), plus en tredje sista-utväg-fallback i create-registration (eventnamnet EF:en redan läst ur Eventplanering-posten). STOPP-BESLUT: skrev INTE Vill anmäla sig till vid create — data-model.md visar att fältet bär en annan semantik (self-reported form-claim, Eventmatchning-formelns påstående-sida, källa för Antal tidigare genomförda utbildningar-rollupen på Personer).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 create-registration svarar med eventNamn satt (aldrig null) när Event-länken finns — bevisat via skarp staging-conformance mot deployad EF
- [x] #2 get-registrations/get-registration (_shared/registration-read.ts mapRegistration) returnerar samma eventNamn-parity för en manuell anmälan som för en webbformulär-anmälan till samma event
- [x] #3 Vill anmäla sig till skrivs INTE av create-registration (STOPP-BESLUT, ADR-086) — bevisat: skriv-beviset visar fältet frånvarande i record.fields
- [x] #4 Aktivitetsloggens klientmall (useCreateRegistration.ts m.fl.) behåller sin okänt-event-fallback, men den ska inte längre kunna inträffa för en länkad anmälan
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · commit 1a256f58 · PR #2211 (MERGED 2026-09-02T09:58:17Z) · CI-run-familjen grön (Lint+Audit+TypeCheck, Pure+Build, Acceptance ×2, Webblasarbeteende, Docs link, CodeQL — samtliga SUCCESS). Verifierat mot origin/main HEAD 59c3f7e3 vid denna Done-flippbatch: supabase/functions/create-registration/index.ts mapCreatedRegistration prioriterar 'Kurs (from Event)' → fallback 'Event (namn)' → fallback eventNamnFallback (läst ur Eventplanering-posten), aldrig null när Event-länken finns (AC1) · _shared/registration-read.ts mapRegistration använder identisk prioritetsordning 'Kurs (from Event)' ?? 'Event (namn)' ?? null (AC2, parity bekräftad läsning) · 'Vill anmäla sig till' grep-verifierat FRÅNVARANDE som skrivfält i create-registration/index.ts (AC3, STOPP-BESLUTET hållet) · frontend-fallbacken '(okänt event)' finns kvar oförändrad i 8 mutations-filer + useCreateRegistration.ts (AC4, defensiv kod behållen men ska inte längre triggas för länkade anmälningar). AC1:s 'skarp staging-conformance' bär en namngiven, live test:api-staging-test: tests/api/create-registration.staging.test.ts describe 'create-registration — skarp conformance', testet 'eventNamn ska aldrig vara null när Event-länken är satt (TASK-363)' jämför en ny manuell creates eventNamn mot en seedad webbformulär-anmälans eventNamn (facit). Testfilens klass (staging) körs i CI:s 'Test suite / Staging (API + E2E)'-jobb — SKIPPED på PR #2211 själv (D0/concurrency-klassning) men bekräftat GRÖNT i den kumulativa post-merge-körningen på e9ab7cd4 (run 33624671547), som inkluderar denna PR:s commit. Landning: PR #2211. Ingen avvikelse funnen.
<!-- SECTION:FINAL_SUMMARY:END -->
