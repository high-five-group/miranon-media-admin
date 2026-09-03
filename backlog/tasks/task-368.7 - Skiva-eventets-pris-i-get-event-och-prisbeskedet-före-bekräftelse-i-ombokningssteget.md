---
id: TASK-368.7
title: >-
  Skiva: eventets pris i get-event och prisbeskedet före bekräftelse i
  ombokningssteget
status: To Do
assignee: []
created_date: '2026-09-03 12:43'
labels:
  - ready-for-agent
dependencies:
  - TASK-368.5
parent_task_id: TASK-368
ordinal: 682000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: när Lotta väljer ett event i ombokningssteget ser hon redan innan hon bekräftar vad det nya eventet kostar och vad mellanskillnaden blir ('Nya eventet kostar X kr, Y kr blir att återbetala' / 'saknas Y kr' / 'samma pris'), samma ordalydelse som kvittot efter bekräftelse (368.5). Bakgrund: 368.5 (PR #2267) kunde inte visa beskedet före bekräftelse eftersom get-event/get-events inte returnerar eventets pris (disk-verifierat av byggaren mot supabase/functions/_shared/event-map.ts § mapEventBas och src/domain/schemas/Event.schema.ts) och rebook-registration saknar torrkörningsläge. Lösningen är additiv: eventets pris exponeras i event-mappningen (läs fältets form i docs/reference/data-model.md först; skriv aldrig mot fältet), schema + typ utökas, och ombokningssteget räknar mellanskillnaden klient-sidigt ur pris minus den aktuella anmälans aktiva inbetalningssumma (samma tal som serverns prisskillnad, verifiera mot _shared/rebook-registration.ts så de två aldrig kan skilja sig i tecken). Täcker användarberättelse 13 (PRD TASK-368). Stänger 368.5 AC #3:s öppna halva.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 get-event och get-events bär eventets pris (null när pris saknas); Event-schemat, typen och EF-allowlisten är utökade; API-test prövar fältet mot staging
- [ ] #2 Ombokningssteget visar prisbeskedet före bekräftelse med exakt samma ordalydelse och tre grenar som kvittot efter bekräftelse; klientens och serverns prisskillnad kan inte skilja sig i tecken (test)
- [ ] #3 Acceptanstestet för ombokning (tests/acceptance/anmalan-ombokning.acceptance.test.ts) utökas med prisbeskedet före bekräftelse i alla tre grenar; axe noll överträdelser
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Facit-granskning mot tasks/sessions/bilagor/s83-anmalningsvyn-konvergens/ (ADR-102 R3): amenderingsfilen för ombokningssteget uppdateras med prisbeskedet, aldrig ett nytt manifest
<!-- DOD:END -->
