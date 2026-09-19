---
id: TASK-467
title: >-
  Beroendekanalens dödmansgrepp — nattvakten märker om beroendegranskningens
  larmkedja tystnat
status: To Do
assignee: []
created_date: '2026-09-18 23:23'
updated_date: '2026-09-19 12:20'
labels:
  - ready-for-agent
dependencies:
  - TASK-450.5
  - TASK-450.10
priority: high
ordinal: 808000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
K1 (b) (TASK-450.5, PR #2553) flyttar beroendegranskningen från varje ändring till diff-villkorad körning, med nattens strängare granskning (nightly.yml audit-ci --moderate + beroende-arende, kanal beroendevarning) som skyddsnät för en ny extern varning mot ett oförändrat träd. Därmed blir kanalen LASTBÄRANDE — men den saknar egen dödmansvakt: CONTRIBUTING § Nattnätet kallar det 'känd lucka, inte en glömska' (bekräftat av granskaren av #2553, runda 1, fynd 3). Om ärendeskapandet i beroendekanalen fallerar tyst finns inget som märker det. 3A-agenten (TASK-450.10, PR #2557) sköt medvetet denna del framför sig med skälet att en vakt byggd FÖRE K1 (b) hade vaktat en kanal som ännu inte bar något; orkestreraren gjorde den till eget kort i stället för ett AC #7 på det redan byggda 450.5-kortet (två PR:er redigerade samma kortfil — bekräftad merge-konflikt, granskningen av #2557 fynd 1). Form: bygg ut nightly-watchdog/.nattvakt-kanal-policy.conf (config-driven) och låt partitionsvakten check-nattkanal-partition.mjs känna kanalen. Marcus ledstjärna: värdera i BÅDA måtten väntetid och fakturerade Actions-minuter; inget nytt jobb där ett steg räcker.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Tvåsidigt via workflowens simulate-ingång: en tystnad beroendekanal (granskningen körde rött men inget ärende skapades) ger ett tilldelat larm; en frisk kanal ger inget
- [x] #2 Partitionsvakten (TASK-450.10) känner kanalen och fäller om dess dödmansgrepp tas bort
- [x] #3 CONTRIBUTING § Nattnätet säger inte längre 'känd lucka' — och påstår inte mer än mekanismen gör (ADR-083)
- [x] #4 PR-kroppens 'Kostnad i två mått' med mätta körningar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Beroendekanalens dödmansgrepp landad via PR #2590 (feat/task-467-nattvakt-dodmansgrepp, head f6bfd6f1). scripts/check-beroendekanal-dodmansgrepp.sh prövar en TVÅLEDS-relation (nightly-audit rött ⇒ beroende-arende MÅSTE nå success) i stället för produktkanalens "kördes natten alls?"-fråga — samma Prometheus Watchdog-mönster, ny relation. Wirad som ETT STEG i nightly-watchdog.yml:s befintliga jobb "watch" (ingen ny job), config-driven via NATTVAKT_BEROENDE_GRANSKNING_JOBBNAMN/NATTVAKT_BEROENDE_ARENDE_JOBBNAMN i .nattvakt-kanal-policy.conf, återanvänder NATTVAKT_OFARLIGA_CONCLUSIONS rakt av.

scripts/check-nattkanal-partition.mjs (TASK-450.10) fick ett TREDJE led som vaktar att kanal-configen matchar nightly.yml:s faktiska name:-fält OCH att nightly-watchdog.yml fortfarande refererar skriptet.

Tvåsidigt bevisat lokalt (mutationsprövat): scripts/test-check-beroendekanal-dodmansgrepp.sh 20 fall (6 LARMA + 5 TYST + 9 fail-closed), scripts/test-check-nattkanal-partition.mjs 23 fall/36 kontroller (upp från 18/26, +5 nya för led iii) — de RIKTIGA filerna passerar.

Tvåsidigt bevisat SKARPT via workflowens simulate-ingång (AC #1), på PR-grenen: (1) simulate_beroende_tyst=true, första försöket (run 35442300881) avslöjade en genuin bugg — dedupen (scripts/check-nattvakt-dedup.sh) kringgicks bara vid simulate_missing, inte vid det nya läget, så testet deduplicerades bort mot en redan täckt natt och bevisade ingenting; fixat i commit f6bfd6f1. (2) simulate_beroende_tyst=true efter fix (run 35442387722) skapade tilldelat ci-natt-ärende #2589 "Beroendekanalen tystnade — BEVIS-LÄGE" (assignee marcus803), stängt direkt med motivering. (3) Normal dispatch utan simulate-flaggor (run 35442426281) mot verklig produktionsdata (senaste schemalagda natten, run 35424541948, där nightly-audit var success) — vakten korrekt TYST trots att körningens totala conclusion var failure (rödheten bars av en obesluten bokföringsgrind, en annan kanal). Rad 3 är den starkaste raden: mekanismen urskiljer rätt kanal mot skarp, oförändrad produktionsdata.

CONTRIBUTING.md § Nattnätet och ADR-082 uppdaterade (AC #3): "känd lucka" gäller numera bara bokföringskanalen.

Kostnad i två mått (PR-kroppen har full tabell): väntetid omätbar utöver brus (steg-tid 3–6 s både före och efter, mätt över fyra gh run view-körningar, ingen riktningsskillnad). Fakturerade Actions-minuter: 0 nya per natt/månad — steg i BEFINTLIGT jobb, jobbets hela körning mätt till 9 s i värsta observerade fall, långt under 60 s-avrundningsgränsen; workflow körs 1x/dygn, 30 fakturerade minuter/månad oförändrat.

Grindar (exitkoder mätta, ej pipade): actionlint 0 (nightly-watchdog.yml + ci.yml, med CI:s exakta -ignore-flagga), yamllint 0 (båda), shellcheck --severity=style --enable=all 0 (exakt CI:s fillista via scripts/*.sh-glob + policy-uppräkningen), bash scripts/test-check-beroendekanal-dodmansgrepp.sh 0 (20/20), node scripts/test-check-nattkanal-partition.mjs 0 (36/36), bash scripts/test-check-nattvakt-dedup.sh 0 (13/13, regressionskontroll), bash scripts/check-listparitet.sh 0, node scripts/check-aggregator-needs.mjs 0, npm run check:docs 0 (16/16), npx @biomejs/biome check . 0, npm run typecheck 0, npm run build 0.

Avvikelse, oförändrad av denna diff: npm run test:api gav 2413 passed / 5 failed i tests/api/*.staging.test.ts (generate-event-attachment, hamta-oppna-betalningar-kvitto-avbojt, save-place-standard, send-registration-confirmation, skapa-om-event-bilaga) — ingen rör CI-workflows/bash-skript/natt-kanaler, diffen rör aldrig src/tests/supabase. Flaggat som sannolik live-staging-flakighet, inte åtgärdat (utanför scope).

Premiss-pass (ADR-086): origin/main hade avancerat 2 commit (7ba4ef0d, 6d96fcbe) förbi orkestrerarens spawn-tidsstämplade aacf3673 — byggde på FÄRSK origin/main i stället för det uppdragna talet, ingen blockerande divergens. Worktreens ursprungliga gren bar en orelaterad session-dok-commit (4a8a6eb4, orkestrerarens egen bokföring) — ny gren skapad från origin/main i stället för att ärva den, så PR-diffen är ren. Inga andra divergenser mätta.

Kortnummer/beroenden (TASK-450.5, TASK-450.10) verifierade Done i backlog/tasks/ på origin/main, deras Final Summary läst före design.
<!-- SECTION:FINAL_SUMMARY:END -->
