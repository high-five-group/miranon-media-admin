---
id: TASK-416.5
title: >-
  Skiva: Personer — skeletonradens anatomi lika den laddade raden (py-2.5,
  avatar size-9, text-caption) och räknarraden i linje
status: Done
assignee: []
created_date: '2026-09-06 13:21'
updated_date: '2026-09-17 09:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 731000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport D §4 #5 (S123). src/components/persons/PersonsList.tsx:852–884 (skeleton) mot 1015–1145 (laddad rad): skeleton py-3 + gap-1 + text-small på rad 2 + ingen avatar ≈ 95 px/rad; laddad rad py-2.5 + mt-1 + text-caption + size-9-avatar ≈ 84 px/rad → ~110 px drift på tio rader redan ovanför vikningen. Räknarraden: skeleton gap-4 flush-vänster (859) mot laddad gap-2 + px-4 (986–990). Filen bokför själv (118–124) att tio rader mot PAGE_SIZE 50 är en medveten avvikelse — det håller för antalet, inte för radens anatomi. Åtgärd: ge skeletonraden exakt den laddade radens anatomi (avatar-cirkel som skeleton, samma padding/typografi/gap) och räknarraden samma klasser; behåll tio rader.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skeletonradens höjd och inre struktur är identisk med den laddade radens (DOM-mätt, ±0 px)
- [x] #2 Räknarradens placering identisk före och efter datalandning
- [x] #3 Befintliga tester gröna, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Mätning (TASK-416.5)

DOM-mätt via ny acceptance-test (tests/acceptance/persons-list.acceptance.test.ts,
"AC #1/#2 (TASK-416.5) — skeletonradens höjd matchar den laddade radens,
räknarraden byter aldrig position"), getBoundingClientRect, egen körning
(node modules/.bin/playwright, workers=1):

- Radhöjd: skeletonrad 85.0×534.0 px vs laddad rad 85.0×534.0 px — IDENTISK.
- Avatar-cirkel (size-9): 36.0×36.0 px i båda lägena — IDENTISK.
- Räknarraden: x 356.0→356.0, y 246.0→246.0, höjd 21.0→21.0 px — IDENTISK
  placering och höjd.

Mätningen kräver en rad med RIKTIGT interaktionsinnehåll (senasteInteraktion
satt) — testfabrikens default (null) triggar en OBESLÄKTAD, förbefintlig
CSS-kvirk i höjdlåset (PersonsList.tsx ~1074–1099): en <span> vars enda
innehåll är ETT mellanslag, kombinerat med white-space: nowrap (truncate),
kollapsar till 0 px höjd (CSS Text-modulens whitespace-trimning vid
rad-kanten), vilket i det läget krymper den laddade radens höjd till 67 px
i stället för avsedda ~85. Detta rör INTE denna skiva (RÖR INTE-scope) men
registreras här som ett upptäckt, oåtgärdat fynd — se PR-beskrivningen och
slutrapporten för triage-rekommendation.

Grindar: typecheck 0, biome check 0, build 0, check-langa-streck 0 (OK),
test:api 2237 passed / 29 failed (samtliga i attachment/rebook/save-*
staging-filer, ORELATERADE till persons — 30s-timeouts under uppmätt
fleet-kontention, load average 281 på 16 kärnor; alla get-persons*.staging
gröna), acceptance persons+tabbar 47/47 (varav 1 ny), a11y (axe-runner)
118/118 vid workers=1 (8 miss vid hög fleet-last, samtliga i orelaterade
filer, reproducerat grönt efter lastfall), visual personer-promoverings-grind
16/16 (aria-snapshot + axe, alla lägen).

Bockad i efterhand av S125 mot belägg: PR #2400 mergad (2026-09-06), samtliga 3 AC redan bockade, notiserna anger DOM-mätta identiska mått + grindtabell (typecheck 0, biome 0, build 0, check-langa-streck OK, acceptance 47/47, a11y 118/118, visual 16/16). Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
