---
id: TASK-327
title: >-
  Uppgradera Backlog.md till 1.50.1 — fixar tyst dataförlust vid samtidiga task
  edit
status: To Do
assignee: []
created_date: '2026-08-26 05:01'
labels:
  - ready-for-agent
  - deps
dependencies: []
ordinal: 600000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vi kör 1.49.1 (verifierat: docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md rad 274 'Vi kör 1.49.1'). Upstream-issue #843 (github.com/MrLesk/Backlog.md/issues/843, citerad rad 309-310 i samma dokument) mätte att samtidiga task edit tappar skrivningar TYST — 12 av 12 vid simultana anrop — fixat i 1.50.0. Vi har alltså den buggen live med 8-10 samtidiga agenter som redigerar kort. PR #898 (github.com/MrLesk/Backlog.md/pull/898, citerad rad 281) bekräftar att create-vägens ID-allokering INTE är fixad av samma release — create undantas alltså av denna uppgraderings-motivering. DIVERGENS, FLAGGAD (S112 resume 1, 2026-08-26): uppdragets instans 'B1-agentens race 2026-08-26: en bakgrundad task edit skrev efter commit' hittas INTE i forskningsdokumentet eller någon annan fil i repot vid sökning i denna session — obelagd, sannolikt muntlig/observerad utan filnedslag. Byggs vidare på ändå eftersom #843:s egen 12/12-mätning räcker som grund, men attributionen till en specifik B1-instans ska INTE återges som bekräftad fakta förrän källan hittas. Sidofynd i samma dokument (paragraf Sidofynd 1, rad 430-447): PR #710 (mergad 2026-07-01, FÖRE vår 1.49.1) gör att check_active_branches redan idag SER okommitterade kort i systerträd — CLAUDE.md paragraf Kortnummer-tabellens rader 2-3 ('Nej — osynligt') är alltså redan falska i den version vi kör, oavsett detta korts utfall. Registrerat här, ej åtgärdat — utanför detta korts scope, men flaggat för orkestreraren att triagera (ADR-053).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 package.json/lock bumpad till 1.50.1, npm ci ren
- [ ] #2 scripts/test-backlog-cli.sh (wrappern, 16 fall) grön efter uppgraderingen
- [ ] #3 check-backlog-closure.sh byte-identiskt utfall före/efter uppgraderingen
- [ ] #4 mätning av task list/view/edit via npm run bl-wrappern före/efter bokförd i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
