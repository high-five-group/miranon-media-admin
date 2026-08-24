---
id: TASK-241.7
title: 'Skiva: Prototyp-rivningen — svep-substratet bort efter QA'
status: Done
assignee: []
created_date: '2026-08-16 23:09'
updated_date: '2026-08-24 14:39'
labels:
  - ready-for-agent
dependencies:
  - TASK-241.6
parent_task_id: TASK-241
ordinal: 461000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rivningen följer 243.4-till-243.5-prejudikatet: prototypen står kvar som körbar referens tills Marcus QA-vandring (241.6) är klar, sedan rivs flaggor och substrat — aldrig formen (ADR-103). Täcker användarberättelser: ingen (teknisk stängning per ADR-102 B3).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dev-routen /dev/svep-prototyp och katalogen src/components/dev/svep-prototyp/ rivna; import-beroendena mot hem-prototypkatalogen (VariantRo, demoUniversum, InitialAvatar-bokföringen i 241.1-notes) därmed borta — 243.5 avblockeras från svep-hållet
- [x] #2 B3-markören ([PROTOTYPE, TASK-241.1] Sändytans overlay — KONVERGENSVARV 2.) städad ur .facit-policy.conf i SAMMA landning som rivningen (TASK-192-regeln) med daterad removal-not
- [x] #3 scripts/check-facit.sh grönt efter städningen; bygget bär noll referenser till svep-prototypkatalogen (grep-verifierat i dist)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-241.7 — RIVNINGEN LANDAD (S112, Sonnet 5, 2026-08-24).

FÖRVILLKOR OMPRÖVAT OCH HÅLLIT: den tidigare blockeringen (ADR-104-hooken nekar Edit mot ett redan stämplat manifest, mätt 2026-08-17) är HÄVD av ADR-102 § Updates R1 ("Rivna prototyp-källor", 2026-08-22, fannsVidStampeln(), scripts/lib/facit-validera.mjs:247-283): en stämplad källa som rivs accepteras via git-härledning UTAN manifest-edit, så länge den fanns i stämpel-commitens träd. Verifierat: stämpel-SHA 10dff531 är lokalt uppslagbar och samtliga sex källor fanns i det trädet (git cat-file -e x 6, OK). TASK-241.6 (QA-vandringen, dependency) verifierad Done före start.

RIVNINGSLISTAN (git rm):
  - src/routes/dev/svep-prototyp.tsx
  - src/components/dev/svep-prototyp/SvepOverlay.tsx
  - src/components/dev/svep-prototyp/Adresslista.tsx
  - src/components/dev/svep-prototyp/Forhandsvisning.tsx
  - src/components/dev/svep-prototyp/data.ts
  - src/components/dev/svep-prototyp/types.ts

B3-MARKÖREN STÄDAD (AC #2), SAMMA LANDNING: markören "Sändytans overlay — KONVERGENSVARV 2." borttagen ur FACIT_PROTO_MARKORER i .facit-policy.conf, med daterad borttagnings-not (TASK-299.5-mönstret). grep -rlF <markören> src/ gav 0 träffar efter rivningen (verifierat FÖRE borttagning av markören).

GRINDUTFALL (samtliga mätta, exitkod fångad utan pipe):
  bash scripts/check-facit.sh          -> exit 0. Sex "riven efter stämpeln 10dff531"-noteringar för exakt de sex källorna ovan (invariant b rivnings-klausul). 13 manifest, 28 ytor, 0 ogodkända.
  npm run typecheck                    -> exit 0
  npx biome check .                    -> exit 0
  node scripts/check-langa-streck.mjs  -> exit 0 (268 filer skannade, 0 ofångade)
  npm run build                        -> exit 0
  grep -rl svep-prototyp dist/         -> exit 1 (0 träffar, AC #3 krav)
  npm run test:api                     -> exit 1 (1162 passed, 1 failed: get-registrations.staging.test.ts rad 504, "eventmatchning" förväntade "Utan event" fick "OK" — staging-fixturkollision, INTE orsakad av denna diff: testet rör event-länkningens vakt task-284.1, rör aldrig svep-ytan eller .facit-policy.conf. Isolerad om-körning av exakt samma test (playwright -g) -> exit 0, grönt. Bokförd, inte tyst kringgången.

243.5-AVBLOCKERINGEN BEVISAD: den enda import som höll TASK-243.5 blockerad (src/routes/dev/svep-prototyp.tsx rad 6-7, mot @/components/dev/hem-prototyp/demoData och VariantRo) är riven i sin helhet med routfilen. Grep över kvarvarande src/ för faktiska import-satser mot hem-prototyp-katalogen gav 0 träffar (endast docblock-kommentarer i promoverade svep/-filer kvar, ingen körande import). TASK-243.5 är därmed avblockerat från svep-hållet.

Diffen är path-scopad: git status --short visar enbart de sex rm-raderna plus .facit-policy.conf. dist/ är gitignored, ingen build-artefakt i diffen.

Done-flipp S112: PR #1912 landad, post-merge 0a93e95f grön (verifierad 2026-08-24).
<!-- SECTION:NOTES:END -->
