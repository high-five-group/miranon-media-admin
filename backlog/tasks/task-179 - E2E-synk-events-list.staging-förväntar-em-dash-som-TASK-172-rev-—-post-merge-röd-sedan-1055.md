---
id: TASK-179
title: >-
  E2E-synk: events-list.staging förväntar em-dash som TASK-172 rev — post-merge
  röd sedan #1055
status: To Do
assignee: []
created_date: '2026-08-10 06:17'
updated_date: '2026-08-10 06:36'
labels:
  - ready-for-agent
dependencies: []
modified_files:
  - tests/e2e/events-list.staging.test.ts
priority: high
ordinal: 336000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-172:s strecksvep (commit fe037701, PR #1055) bytte 'Event — ' till 'Event - ' i src/components/events/EventsList.tsx:443, men tests/e2e/events-list.staging.test.ts rad 1047 (kommentar) + 1062 (locator) förväntar fortfarande em-dash → expect(toBeVisible) timeout. Fäller post-merge + nattnätet sedan 2026-08-09: runs 31318903977, 31330124095, 31352038158 (issues #1057/#1066/#1068). PR #1064 som skulle synka testkonsumenterna missade denna fil. INTE revert — dash-ändringen är avsiktlig och Marcus-godkänd; fixen är test-strängen.

Källa: S102 triage-rapport 2026-08-10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Förväntad sträng i tests/e2e/events-list.staging.test.ts (rad ~1047 + ~1062) uppdaterad till kort streck i exakt den form EventsList.tsx renderar
- [x] #2 Svep efter FLER em-dash-förväntningar i tests/e2e/ mot användarsynliga strängar som strecksvepet rev — synka alla träffar i samma commit
- [ ] #3 Post-merge-/staging-klassen bevisad grön på main efter landning (run-id i notes)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1: rad 1047 (kommentar) + 1062 (locator) i tests/e2e/events-list.staging.test.ts synkade från em-dash till kort bindestreck, verifierat mot faktisk källrad EventsList.tsx:443 (`Event - {PERIOD_LABEL[period]}`, grep-läst före ändring — bekräftat kort streck, inte em-dash).

AC #2 svep: node scripts/check-langa-streck.mjs --dir tests/e2e (AST-baserad, StringLiteral/JSXText/TemplateElement, kommentarer exkluderas strukturellt) gav 85 träffar. Klassificerat samtliga mot context: ingen ny bugg utöver rad 1047/1062. Fördelning: ~75 är test()/test.describe()-beskrivningssträngar (dokumentation, aldrig assertion — precedent 7b7f5a82), 1 är en expect()-failure-message (event-bor-over:331, developer-facing, inte app-text), ~2 är test.skip-anledningstexter (persist-cache/pwa-offline, developer-facing), resten är fixture/mock-data (eventlabel/namn/erfarenhetsbadge-fält, självkonsistent mellan mock-input och assertion, ej genererad av strecksvepets src/-strängar). Samma AST-svep kört mot tests/acceptance/ (91 träffar) och tests/visual/ (53 träffar) som friskrivningskontroll av 7b7f5a82/c39d7c9a — inga nya mismatchar funna (person-detail.acceptance.test.ts:161/162/170 är fixture-eventLabel/anteckningar-fält, samma självkonsistens-mönster). ariaSnapshot-låsen (tests/visual/__aria__/**/*.aria.yml) grep-verifierade: 0 em-dash-förekomster — orörda per kortets instruktion.

AC #3 ÖPPEN SKULD (per uppdrag — flippas ej av bygg-agenten): lokal körning av npm run test:e2e:staging (chromium-authenticated, testMatch events-list.staging.test.ts) försökt men blockerad — port 5173 (hårdkodad, CORS-låst mot staging, se playwright.config.ts E2E_DEV_PORT-kommentar) upptagen av en annan process (PID 50138, sannolikt en parallell agent-worktrees dev-server) — kan inte kommandera en delad port utan risk för kollision med annat pågående arbete. Bevisform (a) (grep mot källrad) är därför den enda utförda verifieringen av själva stränglikheten. Orkestreraren verifierar AC #3 mot nästa post-merge-/nattnäts-run på main och bokför run-id.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
