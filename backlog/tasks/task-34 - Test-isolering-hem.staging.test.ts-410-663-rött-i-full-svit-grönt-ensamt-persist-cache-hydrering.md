---
id: TASK-34
title: >-
  Test-isolering: hem.staging.test.ts:410 + :663 rött i full svit, grönt ensamt
  (persist-cache-hydrering)
status: To Do
assignee: []
created_date: '2026-07-23 02:06'
updated_date: '2026-08-26 03:16'
labels:
  - ready-for-agent
dependencies: []
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND ur S75 batch 4 (task-18.5 + task-17.5:s bygg-agenter, oberoende observerat).

tests/e2e/hem.staging.test.ts:410 (task-4.3 'dagar-kvar-pillen: tre exakta former') OCH :663 (task-4.4 'anmälningslistan: namn 16/600 + relativ tid, fast klocka') FALLERAR i full parallell svit men PASSERAR ensamma (hem-filen 29/29).

ROTORSAK (410): testet loopar tre dagar-kvar-fall via reload, men DOM:en visar fortfarande fall 1:s data ('71 dagar kvar') när fall 2 ('1 dag kvar') förväntas — persist-cache-hydreringens klass. Samma familj som TASK-28-fyndet, som 18.4:s svit löste genom SKILDA event-ID:n i stället för reload.

BEVISAT PRE-EXISTERANDE: baseline på förgrenings-SHA med batch-ändringar stashade ger exakt samma röda — inget batch-kort införde det. (19.3:s post-CI-bokföring rapporterade dock grön main-CI på samma SHA, så CI-miljön kan vara mindre känslig; isolerings-svagheten i testerna är verklig oavsett.)

FÖRESLAGEN FIX: skilda query-nycklar per scenario i stället för reload (samma form som 18.4 använde för TASK-28).

Oetiketterat per fynd-regeln — människan klassar.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FALSIFIERAT (S112 fix-våg 4, bunt B1) — rör INTE koden, se motivering.

Premiss-pass (ADR-086): git fetch origin → tests/e2e/hem.staging.test.ts
EXISTERAR INTE på origin/main. `find tests -iname "*hem*"` listar noll
träff på den filnamnsformen. `git log --all --diff-filter=D -- "*hem.staging.test.ts"`
visar att filen togs bort i commit 109f8465 ("[TASK-59.3] acceptance-klassen
etablerad med Hem-ytan som pilot", 2026-07-28) — FEM dagar EFTER att detta
kort skrevs (2026-07-23). git visar det som en RENAME (302 ändrade rader)
till tests/acceptance/hem.acceptance.test.ts, inte en ren flytt: filen gick
samtidigt om från page.route-mockning mot verklig playwright-navigation
till MSW-baserad hermetisk mockning (network.use()) i en helt egen,
mutexfri CI-klass (ADR-080).

STÖRRE DIVERGENS DÄRUTÖVER: Hem-vyn i sig är sedan dess HELT OMSKRIVEN
(TASK-243.3, "full omskrivning mot den promoverade formen" — K10-formen som
task-4.3/4.4 byggde mot är riven, ersatt av V1 "Lugna morgonen").
hem.acceptance.test.ts:s egen docblock bokför öppet att "dagar-kvar-pillen"
(pill-WIDGETEN task-4.3 byggde) INTE promoverades till den nya formen.

Kortets två specifika testfall:
- task-4.3 "dagar-kvar-pillen: tre exakta former" (gamla :410) — motsvarande
  TEXT-invariant finns kvar i NY FORM: hem.acceptance.test.ts:313
  "dagar-kvar-formens tre exakta texter" — men implementationen navigerar
  med page.goto('/hem') FRÄSCH per scenario i en for-loop, INTE page.reload()
  som gamla testet gjorde. Ingen reload → ingen persist-cache-hydrering
  mellan scenarierna → rotorsaksklassen kortet beskriver kan strukturellt
  inte uppstå i den nya formen.
- task-4.4 "anmälningslistan: namn 16/600 + relativ tid, fast klocka" (gamla
  :663) — motsvarande yta: hem.acceptance.test.ts:797 "Nya anmälningar —
  statusfilter, räknare...". Samma sak: page.goto() per test, MSW-mock unik
  per test, ingen delad query-cache mellan scenarier.

KLASSFIXEN ÄR REDAN ETABLERAD ANNANSTANS I KODBASEN: TASK-34:s föreslagna
fix ("skilda event-ID:n i stället för reload") är exakt mönstret som redan
används i tests/e2e/event-deltagare.staging.test.ts:512-516 (kommentar
verbatim: "TVÅ event-ID:n i stället för route-byte + reload:
persist-hydreringen serverar annars scenario 1-data under samma
query-nyckel efter en reload (TASK-28-fyndets klass). Skilda ID:n ⇒ skilda
nycklar ⇒ inget överlapp.") — samma TASK-28-fyndsklass kortet själv
refererar. Fixen finns redan i produktionskod-mönstret, bara inte i den nu
raderade filen.

SLUTSATS: kortets mål (filen, raderna, testfallens exakta form) är samtliga
obsoleta. Ingen kod rörd — risken att "fixa" en fil som inte längre
existerar, eller reintroducera K10-formens rivna dagar-kvar-pill, är större
än värdet. Rekommendation: stäng kortet som obsolet/superseded via Marcus-
beslut (ADR-053-triage: utanför scope, ej blockerande — defer/förkasta,
ej agent-beslut).

Källor: git fetch origin (SHA vid detta pass: 1d853fa3), git log
--diff-filter=D -- "*hem.staging.test.ts", git show 109f8465 --stat,
tests/acceptance/hem.acceptance.test.ts (docblock rad 1-49, rad 312-337,
rad 796-869), tests/e2e/event-deltagare.staging.test.ts rad 512-517.
<!-- SECTION:NOTES:END -->
