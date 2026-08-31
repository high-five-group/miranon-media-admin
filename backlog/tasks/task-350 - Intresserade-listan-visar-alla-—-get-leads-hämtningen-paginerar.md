---
id: TASK-350
title: Intresserade-listan visar alla — get-leads-hämtningen paginerar
status: To Do
assignee: []
created_date: '2026-08-31 08:51'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 654000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus S114-scope punkt 6-delfix (kvitterad 2026-08-31, sessionsdok S114 Del 1). Verifierad rotorsak: get-leads-EF:en har DEFAULT_PAGE_SIZE = 50 med cursor-paginering (supabase/functions/get-leads/index.ts:9, ADR-056), och klienten hämtar exakt EN sida utan cursor-loop (src/data/adapters/AirtableAdapter.ts:332, callEdgeFunction('get-leads') utan pageSize/offset) — Lotta ser 50 intresserade oavsett verkligt antal. Samma felklass som S109:s prod-incident (get-persons 50-klampen, ADR-123-bakgrunden). Lösning: paritet med personregistrets mönster — läs hur get-persons/fetchPersonsRegister löste 'hämta allt' (?register=true-vägen, ADR-123) och gör motsvarande för intresserade (register-parameter i EF:en ELLER cursor-loop i adaptern tills offset saknas — välj det mönster som matchar ADR-056/ADR-123, motivera valet i PR:en). Adapter-gränsen kringgås aldrig (ADR-055/057). Server-sorteringen 'Senaste interaktion desc' bevaras.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Intresserade-listan visar samtliga intresserade — verifierat mot staging med > 50 poster (siffra + första/sista rad rapporterade)
- [ ] #2 Lösningen följer ADR-056-pagineringen och ADR-123-mönstret; adapter-gränsen intakt; valet motiverat i PR-kroppen
- [ ] #3 Sorteringen senaste interaktion (desc) oförändrad
- [ ] #4 api-test täcker fler-än-en-sida-fallet; DoD-grindarna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
