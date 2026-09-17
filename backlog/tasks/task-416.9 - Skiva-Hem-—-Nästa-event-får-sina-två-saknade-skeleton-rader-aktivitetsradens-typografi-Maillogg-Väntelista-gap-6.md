---
id: TASK-416.9
title: >-
  Skiva: Hem — Nästa event får sina två saknade skeleton-rader, aktivitetsradens
  typografi, Maillogg/Väntelista gap-6
status: Done
assignee: []
created_date: '2026-09-06 13:22'
updated_date: '2026-09-17 09:06'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: medium
ordinal: 735000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport D §5 (S123). Deterministiska geometri-avvikelser: src/components/hem/NastaEvent.tsx:43–49 skeleton har tre rader och gap-4, laddat har fem rader (ort/datum-raden och X av Y platser-captionen saknas) och gap-3 → ~94 mot ~154 px. src/components/hem/SenasteAktivitetKompakt.tsx:51–52 skeletonens rad 2 är text-caption (18 px), innehållet på rad 68 text-body (24 px), ×4 rader. src/components/maillog/MailLog.tsx:135 och src/components/waitlist/Waitlist.tsx:146 buntar rubrik + rader i ett gap-4-block medan laddat har dem som syskon med gap-6 (+8 px). EJ i denna skiva (designval, Marcus): NyaAnmalningar.tsx:74–79 och ForfallnaBetalningar.tsx:90–95 visar två listRow ≈156 px medan tomläget är en rad ≈24 px. Åtgärd: rätta de fyra deterministiska avvikelserna så skeleton = laddat innehåll rad för rad.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 NastaEvent-skeleton har fem rader med samma typografi och gap som laddat läge
- [x] #2 SenasteAktivitetKompakt-skeleton rad 2 är text-body
- [x] #3 MailLog och Waitlist: rubrik och rader som syskon med gap-6 i laddläget
- [x] #4 Hem-acceptance (tests/acceptance/hem-laddlage.acceptance.test.ts) grön, axe-svep grönt
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bockad i efterhand av S125 mot belägg: PR #2397 mergad (2026-09-06), samtliga 4 AC redan bockade. Kortet saknade eget Implementation Notes-avsnitt, men PR-kroppen (hämtad via gh pr view 2397) bär full grindtabell (typecheck 0, biome 0, check-langa-streck 0, build 0, test:api 0, hem-laddlage.acceptance.test.ts 5/5) och review-agentens utlåtande (risk LÅG, AC1-4 alla verifierade). Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
