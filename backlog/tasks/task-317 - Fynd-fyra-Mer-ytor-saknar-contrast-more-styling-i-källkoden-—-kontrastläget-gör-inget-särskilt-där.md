---
id: TASK-317
title: >-
  Fynd: fyra Mer-ytor saknar contrast-more-styling i källkoden — kontrastläget
  gör inget särskilt där
status: To Do
assignee: []
created_date: '2026-08-24 14:10'
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
- [ ] #1 Marcus-beslut bokfört: affordans byggs / statiska kanter deklareras tillräckliga med motiv
- [ ] #2 Vid bygge: contrast-more-styling på de fyra ytorna + TASK-314-svepen uppgraderade till token-probes + ny baseline-dispatch
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
