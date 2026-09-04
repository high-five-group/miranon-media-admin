---
id: TASK-343
title: >-
  Fynd: attachment-upload-large.staging.test.ts:472 stale mot 338.2:s
  legacy-normalisering — förväntar 'Kurstyp' i basen, EF:en sparar 'Gemensam'
status: To Do
assignee: []
created_date: '2026-08-29 16:06'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 629000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av två oberoende agenter med MOTSATT utfall i S113, avgjort mot källkod av orkestreraren 2026-08-29.

BYGG-AGENTEN (TASK-309.41, PR #2112) rapporterade `npm run test:api` exit 1 med `attachment-upload-large.staging.test.ts:472` deterministiskt röd: Räckvidd var "Gemensam", väntat "Kurstyp". Den bevisade det pre-existerande genom att parkera sin diff (`git diff > fil` + `git checkout --`, aldrig `git stash`) och köra mot rent `origin/main`-träd — identiskt fel.

GRANSKAREN (review-agent på #2112) kunde INTE reproducera: exit 0, 897 passed, 463 skipped, ingen träff på attachment-upload-large. Skrev det som info/ask-user i stället för att gissa. De 463 skippade är sannolikt förklaringen — staging-projektet kräver credentials som granskarens isolerade worktree saknade.

ORKESTRERARENS AVGÖRANDE (källkod, inte hypotes): bygg-agenten har rätt och det är INGEN flake. Testet skickar `rackvidd: 'Kurstyp'` och asserterar `expect(body.record.fields.Räckvidd).toBe('Kurstyp')` (tests/api/attachment-upload-large.staging.test.ts:466 resp. :472). Men TASK-338.2 gjorde legacy-värdena till NORMALISERADE indata: supabase/functions/finalize-attachment-upload/index.ts:32 säger verbatim "Legacy-värdena `Kurstyp`/`Alla event` accepteras och sparas som `Gemensam`", och supabase/functions/_shared/attachments.ts:239 "legacy-klients `Kurstyp`/`Alla event` blir alltså `Gemensam` I BASEN". Testet asserterar alltså det gamla kontraktet mot en EF som medvetet bytt det.

FÖLJDEN: main bär ett rött test:api-fall sedan 338.2 landade. Det är en STALE TEST, inte en produktbugg — skrivvägens legacy-tolerans är avsedd (ADR-125 § lagringsformen).

GÖR: (i) uppdatera assertionen till det NYA kontraktet — indata "Kurstyp" ska ge Räckvidd "Gemensam" med Kursfamilj "RIM" BEHÅLLEN (rackvidd-matchning.ts:113 "Kurstyp -> Gemensam, axlarna BEHÅLLS"), till skillnad från "Alla event" -> Gemensam där axlarna TÖMS (:115); (ii) lägg ett andra fall som täcker "Alla event"-vägen så båda legacy-formerna är låsta; (iii) svep efter fler stale förväntningar (grep efter toBe('Kurstyp') och toBe('Alla event') i tests/); (iv) bokför i testfilens huvud VARFÖR indata och lagrat värde skiljer sig, så nästa läsare inte rättar tillbaka det.

Ingen ändring av EF-beteendet — kontraktet är rätt, testet är efter.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Assertionen prövar det nya kontraktet: indata 'Kurstyp' → Räckvidd 'Gemensam' med Kursfamilj behållen; indata 'Alla event' → 'Gemensam' med axlarna tömda
- [ ] #2 Svepet i (iii) genomfört och bokfört: antal övriga testställen med stale legacy-förväntan, åtgärdade eller motiverat orörda
- [ ] #3 npm run test:api exit 0 mot rent origin/main-träd, kommandot och utfallet citerat
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
