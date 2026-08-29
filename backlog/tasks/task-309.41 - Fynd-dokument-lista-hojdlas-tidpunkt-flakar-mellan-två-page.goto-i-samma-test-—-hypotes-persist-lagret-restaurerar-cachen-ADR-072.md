---
id: TASK-309.41
title: >-
  Fynd: dokument-lista-hojdlas-tidpunkt flakar mellan två page.goto i samma test
  — hypotes: persist-lagret restaurerar cachen (ADR-072)
status: Done
assignee: []
created_date: '2026-08-29 12:47'
updated_date: '2026-08-29 17:16'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 626000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur TASK-338.3 runda 3 (S113, 2026-08-29): `tests/acceptance/dokument-lista-hojdlas-tidpunkt.acceptance.test.ts:357` ("fyra och fem rader delar EXAKT samma låsta bounding box") föll en gång i ett fullt svep (74/75) — `getByText('Delad 5.pdf')` hittades inte efter andra `page.goto('/mer/dokument')` med `handler(0, 5)`; grön isolerat (10/10) och i nästa fulla svep (75/75). HYPOTES (agentens, INTE verifierad): testet gör två `page.goto` mot samma `attachments.gemensamma`-nyckel i samma test; persist-lagret (ADR-072) + `staleTime` kan restaurera den fyra-raders cachen utan refetch vid andra laddningen — en pre-existerande korspollution i testfilen, oberoende av 338.3:s diff (som bara ändrar fixturvärden). Uppdraget: diagnostisera med tät slinga (marcus-system:diagnosing-bugs): reproducera med `--repeat-each`, mät om persist-lagret faktiskt återställer (läs `src/data/config` + ADR-072), och fixa rotorsaken (t.ex. rensa persist/queryClient mellan de två laddningarna i testet, eller ge dem olika nycklar) — inte en retry. Kortet är en HYPOTES-registrering (ADR-053: blockerar ej + värdefullt); falsifieras hypotesen bokförs det öppet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rotorsaken belagd med reproduktion (--repeat-each ≥ 10, röd-rate bokförd) OCH mätning av om persist-lagret restaurerar mellan de två laddningarna; hypotesen bekräftad eller falsifierad öppet
- [x] #2 Fix mot rotorsaken (ingen retry, ingen sleep); testfilen 20/20 gröna med --repeat-each=20; övriga dokument-*-sviter gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Precedent (granskaren #2094 r3): TASK-28 (S75) — samma mekanism (ADR-072-persist + staleTime återanvänder tidigare scenarios data vid omnavigering med samma query-nyckel), redan klassat 'ingen produktbugg' med etablerat fix-mönster: distinkta nycklar per scenario. Diagnostisera mot TASK-28 först, omdiagnostisera inte från noll.
<!-- SECTION:NOTES:END -->
