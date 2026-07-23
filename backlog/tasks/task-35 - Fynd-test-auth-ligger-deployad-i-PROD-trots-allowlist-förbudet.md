---
id: TASK-35
title: 'Fynd: test-auth ligger deployad i PROD trots allowlist-förbudet'
status: To Do
assignee: []
created_date: '2026-07-23 15:23'
labels: []
dependencies: []
priority: medium
ordinal: 88000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prod-projektet (lvjsfnphlauldxqlncpl) bär funktionen `test-auth` v10 ACTIVE. `.prod-functions-allowlist.conf` säger uttryckligen att den ALDRIG får nå prod ('test-auth saknas MEDVETET — den är test-only och får aldrig nå prod'), och deploy-skriptet är fail-closed. Funktionen är alltså från tiden FÖRE allowlisten infördes — allowlisten hindrar nya deployer men river inte historiska.

Upptäckt 2026-07-23 (S75 prod-deploy-vågens EF-inventering) vid jämförelse av prod-EF-listan mot allowlisten.

Risk: en test-only auth-yta står exponerad i produktionsprojektet. Låg akut risk (JWT-verifierad som övriga) men den är per definition inte avsedd för prod och ingår inte i någon säkerhetsgranskad yta.

Åtgärd: `npx supabase functions delete test-auth --project-ref lvjsfnphlauldxqlncpl` efter Marcus-auktorisering (prod-operation), därefter verifiera med `functions list` att endast allowlistade funktioner finns kvar. Överväg samtidigt om deploy-skriptet ska få ett `--audit`-läge som RAPPORTERAR icke-allowlistade prod-funktioner — grinden är i dag fail-closed framåt men blind bakåt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 test-auth borttagen ur prod-projektet, verifierat via functions list
- [ ] #2 Överväg audit-läge i deploy-prod-functions.sh som rapporterar icke-allowlistade prod-funktioner (eget beslut — dokumenteras oavsett utfall)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
