---
id: TASK-299.3
title: 'Skiva: Divergens på anmälningssidan — tre varianter, tre lägen'
status: Done
assignee: []
created_date: '2026-08-22 19:18'
updated_date: '2026-08-23 19:19'
labels:
  - ready-for-human
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 543000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Anmälningssidan får tre radikalt olika varianter växlingsbara på en dev-route. Startpunkten är en EXAKT kopia av nuvarande vy, aldrig ett tomt blad. Varje variant ska gå att se i sidans tre lägen: hela listan, det filtrerade åtgärdskö-läget och tomt läge — det filtrerade läget är ett läge av samma vy, inte en egen sida. Marcus väljer EN variant i visuell granskning. Radanatomin i minst en variant ska vara personlistans form med anmälningsdata: initialcirkel, namnet som länk, undertext med hur länge sedan anmälan kom in och vilket event den gäller, status som egen kolumn med reserverad plats. Täcker användarberättelser: 1, 2, 3, 4, 5, 6, 7, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tre varianter växlingsbara på en dev-route; utgångsläget är en exakt kopia av nuvarande /mer/anmalningar
- [x] #2 Varje variant går att se i alla tre lägen: ofiltrerad lista, åtgärdskö-läget och tomt läge
- [x] #3 Minst en variant bär personlistans radanatomi med anmälningsdata (initialcirkel, namn som länk, undertext 'N dagar sedan · Eventnamn', status som egen kolumn med reserverad plats)
- [x] #4 I varje variant leder en rad som behöver kopplas om till resolutionen — inget separat knappelement i raden
- [x] #5 Ingen variant bär betydelse enbart genom färg
- [x] #6 Marcus väljer EN variant; valet citeras daterat på kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
- [x] #6 Höjdlåset verifierat som beteende: rader med/utan status och med/utan åtgärdsbehov har samma höjd
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
MARCUS VAL 2026-08-23, AC #6: variant B.

Verbatim: "vad det gäller anmälningssidan så är ju B bäst, men vi måste ju få in vilket event anmälan tillhör. Och kanske en filtreringsgrej högst upp."

Valet är därmed gjort och citerat. Divergensfasen är över; A och C är kvar i koden tills konvergensen (299.4) river prototyp-substratet.

FORMEN HAR ITERERATS EFTER VALET och ligger i LOKALA, OPUSHADE commits på grenen wip/s111-marcus-iteration — INTE i main. Det som byggts ovanpå B: eventnamnet i radens undertext via Hems eventIdentitet(), tiden utflyttad till egen högerställd kolumn (Hems anatomi), statusen flyttad till rad 2 med min-h-6-golv, filterpanelen med dimensionerna Period/Event/Typ/Ort, EventValjare med opt-in-omfattning, och period som dimension i stället för pill-rad.

Kortet står kvar To Do med avsikt: DoD #3 (CI grön per jobb) kan inte bockas eftersom arbetet aldrig pushats och därmed aldrig setts av CI.

2026-08-23 (S111 resume 2, fönster 1) — Event-dimensionens rymd: Marcus *"2. Behåll"* — väljaren listar HELA eventrymden (omfattning="alla"), inte bara event raderna pekar på. Väljarens FORM ändrad på Marcus order samma fönster: dokumentsidans form="fristaende" (stora, luftiga rutan) + CalendarRange-ikon på "Alla event", samma grepp som "Delade dokument" bär Files (lokal commit 7ac7b973 på wip/s111-marcus-iteration).

STÄNGNING 2026-08-23 (S111 kort-stängningspass). De två kvarvarande DoD-posterna bockade; #2/#4/#5/#6 var redan bockade av byggpasset.

DoD #1 — AC #1-#6 samtliga bockade före detta pass.
DoD #3 — CI GRÖN PER JOBB, och det var den POST kortet uttryckligen stod öppen för: kortets egen not sade 'Kortet står kvar To Do med avsikt: DoD #3 (CI grön per jobb) kan inte bockas eftersom arbetet aldrig pushats och därmed aldrig setts av CI.' Den premissen är nu upphävd — divergens-/konvergensarbetet på wip/s111-marcus-iteration landade i PR #1864, merge-commit e1470eb0 på main. `gh pr checks 1864` mätt 2026-08-23: 15 rollup-poster, NOLL fail (Lint + Audit + TypeCheck, Acceptance hermetisk 8m54s, Acceptance tvåsidigt bevis 9m17s, Pure + Build, Webblasarbeteende, Docs link check, CodeQL, Vercel — samtliga pass; A11y/Staging skipping per CI:s diff-gating).
<!-- SECTION:NOTES:END -->
