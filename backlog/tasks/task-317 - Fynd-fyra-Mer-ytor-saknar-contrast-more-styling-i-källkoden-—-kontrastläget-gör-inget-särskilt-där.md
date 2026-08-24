---
id: TASK-317
title: >-
  Fynd: fyra Mer-ytor saknar contrast-more-styling i källkoden — kontrastläget
  gör inget särskilt där
status: Done
assignee: []
created_date: '2026-08-24 14:10'
updated_date: '2026-08-24 15:44'
labels:
  - fynd
dependencies: []
ordinal: 580000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt 2026-08-24 (S112, TASK-314-passet, grep per komponent): Waitlist.tsx, Intresserade.tsx, MailLog.tsx och InstalleraAppen.tsx har NOLL contrast-more:-träffar, medan husets övriga fem ytor (AnmalningarSida, AktivitetsHistorik, DokumentYta, PersonDetail, Bevakningsrad) bär contrast-more:border-border-strong/--mm-navcard-border-contrast. TASK-314:s vakter täcker de fyra med statiska boundary-probes — vakten finns, men själva affordansen saknas. DESIGNBESLUT (Marcus): ska de fyra få samma förstärkta kontrast-affordans som husets övriga ytor (kvalitetsribban: tillgänglighet 11, prefers-contrast: more per CLAUDE.md § Design-system), eller är deras statiska kanter medvetet tillräckliga? Vid ja: liten agent-skiva + TASK-314-svepen uppgraderas till token-probes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus-beslut bokfört: affordans byggs / statiska kanter deklareras tillräckliga med motiv
- [x] #2 Vid bygge: contrast-more-styling på de fyra ytorna + TASK-314-svepen uppgraderade till token-probes + ny baseline-dispatch
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
Marcus-beslut (S112 mandatpasset, beslut 7c, 2026-08-24): affordansen BYGGS — tillgänglighet 11 är golv (kvalitetsribban, CLAUDE.md § Design-system). De statiska kanterna på Waitlist/Intresserade/MailLog/InstalleraAppen deklareras INTE tillräckliga; de fyra ytorna får samma contrast-more:border-border-strong-affordans som husets övriga fem ytor.

AC #2 uppfylld: contrast-more:border-border-strong tillagd på de fyra ytorna (Waitlist.tsx/Intresserade.tsx/MailLog.tsx/InstalleraAppen.tsx), TASK-314:s fyra statiska boundary-probes uppgraderade till token-probes (vantelista.spec.ts, intresserade.spec.ts, maillogg-visual.spec.ts, installera-appen-visual.spec.ts). PR #1922 (kod+tester). Baseline-dispatch kört: gh workflow run visual-baselines.yml --ref task-317-kontrast-more-fyra-ytor -f specfilter='anmalningssidan|vantelista|intresserade|maillogg|installera-appen|aktivitetshistorik|dokument-visual|persondetalj|bevakningsrad' → run 32740792946 (success) → baseline-PR #1926 (24 bilder, OARMERAD, väntar Marcus granskning).

Done-flipp S112: PR #1922 landad, post-merge grönt; baseline-PR #1926 väntar Marcus bildgranskning (medvetet öppen). Landning: PR #1922
<!-- SECTION:NOTES:END -->
