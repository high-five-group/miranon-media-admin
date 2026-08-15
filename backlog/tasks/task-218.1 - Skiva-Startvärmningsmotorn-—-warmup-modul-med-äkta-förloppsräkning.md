---
id: TASK-218.1
title: 'Skiva: Startvärmningsmotorn — warmup-modul med äkta förloppsräkning'
status: To Do
assignee: []
created_date: '2026-08-15 08:46'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-218
ordinal: 415000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: efter auth-resolution vid kall/stale cache startar motorn en hämtning per datamängd ur det definierade warmup-setet, rapporterar löpande förlopp (klara/totalt) till konsumenten, seedar varje svar till både hem-kortens poll-nyckelfamilj och listornas nyckelfamilj (hämta-en-gång-dela, ADR-112), och avslutar med släpp-besked — direkt vid offline (online-gate), vid fylld räkning, eller vid hård timeout ~8–10 s med delresultat. Payload-identiteten mellan nyckelfamiljerna verifieras vid bygget; spricker den → öppen fallback till dubbelhämtning, bokförd i notes. Täcker användarberättelser: 5, 8 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Motorn exponerar förlopp (klara/totalt) bundet till faktiska query-avslut — aldrig en fejkad animation
- [ ] #2 Offline vid start ⇒ direkt-släpp utan startade hämtningar; hård timeout ⇒ släpp med delresultat
- [ ] #3 En hämtning per datamängd seedas till båda cache-nyckelfamiljerna; ADR-017:s poll-scope orört; payload-identitet verifierad eller öppen fallback bokförd
- [ ] #4 Hermetiska tester (räkning, timeout, offline-gate, seed-delning) gröna utan staging-beroende
- [ ] #5 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
