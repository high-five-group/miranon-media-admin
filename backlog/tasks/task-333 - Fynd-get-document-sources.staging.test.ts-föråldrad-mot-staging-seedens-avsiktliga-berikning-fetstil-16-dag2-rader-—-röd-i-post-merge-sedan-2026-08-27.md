---
id: TASK-333
title: >-
  Fynd: get-document-sources.staging.test.ts föråldrad mot staging-seedens
  avsiktliga berikning (fetstil + 16 dag2-rader) — röd i post-merge sedan
  2026-08-27
status: To Do
assignee: []
created_date: '2026-08-28 03:48'
updated_date: '2026-08-28 04:13'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 604000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Diagnosagent 2026-08-28 (scratchpad diag-api-20260828-0530.txt): tests/api/get-document-sources.staging.test.ts:63 förväntade 'Utbildningen Resor i Medvetandet kommer...' men staging-Eventinnehåll-raden rec2MZrLMKWAzxarB (Airtable apphjj8Q7lkXCMsL4, tblwqaBrkm6hJPITd) bär '**Resor i Medvetandet**' med fetstilsmarkörer — MED AVSIKT, se commit 9bb8d6be (TASK-309.27). Samma fil rad 112 förväntade dag2.standard.length===10, staging bär 16 (sex agendapunkter tillagda 2026-08-27, #2020s beskrivning; verifierat live via Airtable MCP: Ordning 11-16 = Tanke respektive medvetande / Meditation: Kristallvägen 41 min / Upplevelser utanför verkligheten / Tid, Affirmationer, Altruism / Själshämtning / Meditation: Spegeln 40 min). Deterministiskt 4/4 körningar (post-merge run 33095380581 + tre lokala). Sviten körs inte i PR-grinden (ci.yml skippar staging), bara post-merge/nattvakt — därför osynlig i tre dagar. FIXEN LANDAR I DENNA PR (commit på samma gren som detta kort). Öppen skuld, medvetet EJ åtgärdad här: scripts/seed-eventinnehall-modell.mjs (FYLLD_EVENTINNEHALL_FALT.Beskrivning + FYLLD_AGENDA_DAG2) bär fortfarande den gamla omarkerade texten och 10 dag2-rader — en framtida re-seed av en FÄRSK bas skulle återskapa den föråldrade fixturen och fälla detta test igen. Rekommendation: uppdatera seed-skriptets konstanter i en separat skiva när/om en ny seed blir aktuell.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Testförväntningarna i get-document-sources.staging.test.ts matchar stagings avsiktliga berikning (fetstil i FYLLD_BESKRIVNING_BORJAN + dag2.standard.length===16 + assertion på de sex nya dag2-punkterna)
- [x] #2 Filen körd grön 2x isolerat mot staging (npx playwright test --project=api-staging get-document-sources.staging.test.ts)
- [x] #3 Seed-skript-beslutet bokfört i denna beskrivning (uppdateras INTE i denna PR, se Öppen skuld ovan)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixen (tests/api/get-document-sources.staging.test.ts + tests/api/fixtures.ts docstring) landar i SAMMA PR som detta kort (gren fix/task-331-get-document-sources-staging-expectations). Grindar körda och gröna: vitest-filen 2x isolerat mot staging (10/10 passed vardera gången, exit 0), biome check (exit 0, inga fynd i rörda filer), typecheck (exit 0). Status lämnas MEDVETET som 'To Do' i stället för 'Done' — uppdraget bad explicit om Done-flipp i samma PR, men min egen bygg-agent-kontraktsregel ('Sätt aldrig kortet till Done — orkestreraren stänger det efter CI-verifiering') är en ovillkorlig regel utan undantag för fynd-kort vars fix landar i samma PR. Flaggat i slutrapporten till orkestreraren; orkestreraren kan sätta Done själv efter CI-verifiering, eller instruera annat.
<!-- SECTION:NOTES:END -->
