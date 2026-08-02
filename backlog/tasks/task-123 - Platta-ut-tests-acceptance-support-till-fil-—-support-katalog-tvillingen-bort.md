---
id: TASK-123
title: Platta ut tests/acceptance/support/ till fil — support-katalog-tvillingen bort
status: To Do
assignee: []
created_date: '2026-08-02 08:19'
labels:
  - ready-for-agent
dependencies: []
priority: medium
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beslutsbordet S91 punkt 5(a), Marcus GO 2026-08-02 på research-rekommendation. Två oberoende läsare snubblade på tests/support/fixturvarld/ mot tests/acceptance/support/ (TASK-59.8:s QA-fynd, sessionsdok Del 17).

UNDERLAG: docs/research/testklass-namn-och-support-kataloger-2026-08-02.md. Branschmönstret är 5/5 entydigt (Cypress support/e2e.js-formen, RSpec rails_helper): EN delad hjälparkatalog per testträd, klasslokala behov som FILER. Katalogen innehåller EN fil. Mätt kostnad: 18 importrader + 11 path-strängar + 1 git mv; urvals-skriptets allowlist-logik och Playwrights testMatch överlever utan logikändring. tests/support/ behåller namnet (förstapartskonvention).

DELBESLUT (b) i samma punkt, för kontext: klassnamnet 'acceptance' byts INTE (defer, Marcus 2026-08-02) — ca 255 förekomster i ca 45 filer, ingen kollisionsfri kandidat; vid framtida byte är kandidaten 'application' (Ember-precedenten). Detta kort rör ENDAST katalog-utplattningen.

BIFYND att ta i samma veva OM ADR-080 ändå öppnas: dess not om tests/visual/support/hermetic.ts pekar på fil som nu bor i tests/support/fixturvarld/hermetic.ts (åldrad pekare, inte fel beslut).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 tests/acceptance/support/ utplattad till fil (researchens form: tests/acceptance/acceptance-bas.ts eller likvärdigt); alla importrader + path-strängar uppdaterade, git mv bevarar historik
- [ ] #2 Full grindkedja grön inkl. acceptance-sviten lokalt; ingen logikändring i urvals-skript/testMatch
- [ ] #3 Katalog-referenser i styrande dok korslästa; åldrade pekare rättade eller öppet bokförda
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
