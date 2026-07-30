---
id: TASK-87
title: >-
  Fynd: save-segment-läckan städas aldrig — app-segment-test+<uuid> saknar
  target i purge-policyn
status: Done
assignee: []
created_date: '2026-07-29 17:35'
updated_date: '2026-07-30 19:49'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`save-segment`-testerna skapar poster med mönstret `app-segment-test+<uuid>`. `.purge-staging-policy.json` har ingen target som matchar dem, så de städas **aldrig** — de ackumulerar i staging.

Klassen är känd: ADR-060:s purge-wiring har nått tröskeln två gånger förut (S52 create-event, S69 create-registration), båda gångerna för att en ny sentinel-form saknade target. Detta är den tredje instansen.

**Avgränsning:** skivan lägger till en target och bevisar att den fångar. Den städar INTE upp historiken utan att först räkna hur många poster som finns — en massradering mot staging utan räkning är precis det `TASK-76` visade är farligt.

Källa: restlistans § Spår E.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Antalet befintliga app-segment-test-poster i staging RÄKNAT och redovisat före något raderas
- [x] #2 Target tillagd i .purge-staging-policy.json, och dess mönster prövat mot ett verkligt post-namn
- [x] #3 Tvåsidigt bevis: purge fångar en planterad post med mönstret, och rör INTE en post utanför det
- [x] #4 Preflighten (TASK-77) respekterad — ingen lokal staging-körning som kan krocka med CI
- [x] #5 De permanenta rollup-fixturerna orörda — verifierat, inte antaget
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄKNINGEN (AC #1, före något ändrades): 665 poster med app-segment-test+<uuid> i staging-Segment (apphjj8Q7lkXCMsL4 / tbll2N6JKCj4u6y9o), mätt 2026-07-30 via två OBEROENDE vägar som gav samma tal — Airtable-MCP (list_records, filterByFormula på Namn på segment) och purge-skriptets egen dry-run. Alla 665 matchade exakt UUID-formen (0 avvikare). Tabellen innehöll INGET annat: NOT-filtret på samma prefix gav 0 rader, så de nio legacy-segmenten bor bara i prod. Ingenting raderades i denna skiva.

TARGETEN: save-segment-sentineler, tabell Segment (per NAMN, ADR-050), filterByFormula "FIND(app-segment-test+, {Namn på segment}) = 1", exactMatchField "Namn på segment", exactMatchPattern ^app-segment-test\+<uuid>$, linkGuard: true.

linkGuard: true motiverat live, inte antaget: Mailutskick (fldjUIp0iqRpJWgem) är multipleRecordLinks mot Bulkutskick (tblWarzSse85NI1Zx). save-segment sätter aldrig fältet, så guarden är en spärr för framtiden — kopplar någon en testrad till ett verkligt utskick är den inte längre skräp. Och den är INTE L288:s no-op-fälla: 0 av 665 bar en Mailutskick-länk (mätt), och dry-runen rapporterade 0 länk-guardade. Inga linkGuardExcludeFields behövs — till skillnad mot Eventtyp (ADR-066 b5) finns ingen länk som sitter på varje segment-rad by design.

TESTERNA (AC #2/#3): 8 nya fall i scripts/test-purge-staging-sentinels.mjs (47 → 55, exit 0). Targeten LÄSES UR POLICYN PÅ DISK i stället för att dupliceras som REG_TARGET/EVENT_TARGET — en kopia hade gått grön även med tom targets-lista, vilket är exakt felläget klassen består av. Mönstret prövat mot ett VERKLIGT post-namn (app-segment-test+51c071b1-2130-4d86-a526-030cdd834b77, rec07tynH900d4wzL) och mot 50 varv av save-segment-testets egen randomUUID-generator.

TVÅSIDIGT + FALSIFIERAT: sida A = planterad sentinel hamnar i toDelete; sida B = fyra former utanför mönstret (människo-namngivet segment, nästan-sentinel utan UUID, suffix efter UUID, markör i mitten) hamnar alla i skippedMismatch med toDelete tomt. Att sviten FÄLLER bevisades i tre riktningar mot en kopia av policyn: target borttagen → exit 1, 8 röda, första meddelandet namnger roten; $-ankaret borttaget → exit 1, exakt AC#3-sida-B rött; linkGuard: false → exit 1, exakt linkGuard-fallet rött. Policyn återställd byte-identisk efteråt.

SKARPT BEVIS (dry-run, exit 0, inget raderat): "save-segment-sentineler (Segment): 665 träffar — 665 raderas, 0 för färska, 0 länk-guardade, 0 icke-exakta". Det bevisar att tabellnamnet Segment löser i record-API:t och att formeln fungerar server-side med ett fältnamn som bär mellanslag och å — vilket bara kan prövas mot Airtable.

AC #4: båda staging-körningarna gick genom preflighten. purge:staging skrev "PREFLIGHT OK" explicit; test:api bär den via tests/api/auth.setup.ts:29 (api-staging dependencies: [api-setup]).

AC #5 MÄTT FÖRE OCH EFTER, identiskt: ZZ-History Person 01 (recqxaFNwHAdQlAqb) Ort-rollup ["ZZ-Skövde","ZZ-Göteborg"] = 2 element (TASK-31-invarianten), 3 Deltaganden, 2 Anmälningar; ZZ-belaggning-fixtur (recIFrxHZw165ycXk) Antal anmälda 5, Max 10, Extra 2, Manuella 1, 4 Anmälningar, 2 Väntelista = BELAGGNING_EXPECTED; ZZ-arbetsko-fixtur (recZyRIzbqWSifAQO) 4 Anmälningar med ARBETSKO_EXPECTED:s exakta ID:n. Strukturellt dessutom oåtkomliga: targeten är tabell-scopad till Segment, fixturerna bor i Personer och Eventplanering.

NOTERAT: npm run test:api (DoD-kommandot) kör api-staging och skapade EN ny sentinel-rad under verifieringen (recWjXKwK2vuc6Pv5) — 665 blev 666. Läckan i realtid, ~1 rad per körning, precis den takt kortet beskriver.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Target save-segment-sentineler tillagd i .purge-staging-policy.json, ankrad i båda ändar, linkGuard: true. 665 befintliga poster RÄKNADE via två oberoende vägar som gav samma tal (Airtable-MCP och purge-skriptets dry-run) — inget raderades i skivan. Testsviten 47 to 55 fall, och targeten LÄSES UR POLICYN PÅ DISK i stället för att dupliceras som de befintliga targetsen: en kopia hade gått grön även mot en tom targets-lista, vilket är exakt felläget klassen består av. Fällande riktning bevisad i tre riktningar mot en kopia av policyn, som återställdes byte-identisk. linkGuard live-motiverad: 0 av 665 bar Mailutskick-länk, alltså ingen no-op-broms. Läckan bekräftades i realtid — agentens egen test:api-körning skapade post 666 under mätningen. PR #477, CI grön per jobb.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
