---
id: TASK-378
title: >-
  Purge-sentinelns Postgres-mönster matchar aldrig ogonblicksbild_namn med
  blanksteg — EF-skapade staging-inbetalningar är opurgbara
status: To Do
assignee: []
created_date: '2026-09-03 11:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 681000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Symptom (källa: review-agent runda 1 på PR #2247, 2026-09-03, info-fynd 5; HYPOTES tills utföraren verifierat mot filen): .purge-staging-policy.json bär ett Postgres-mönster för tabellen inbetalningar som matchar kolumnen ogonblicksbild_namn mot ^ZZ-TASK-346[.-][0-9A-Za-z._+-]{1,80}$. Teckenklassen saknar blanksteg. Edge Functions create-registration och rebook-registration fyller alltid ogonblicksbild_namn med 'Förnamn Efternamn' (ett mellanslag), så en EF-skapad staging-inbetalning på en sentinel-person kan strukturellt aldrig matcha mönstret. Följd: varje framtida EF-skapad staging-inbetalning som inte självstädar (PR #2247:s staging-test städar själv via hantera-inbetalning/atgard:radera i finally) blir opurgbar för alltid av den delade purge-mekanismen (ADR-060, npm run purge:staging, CI-jobbet Staging sentinel purge). Förväntat beteende: purge-mekanismen raderar EF-skapade sentinel-inbetalningar i staging på samma villkor som övriga sentineler (bas-guard, ålders-guard, exakt markör-match), utan att en icke-sentinel-rad med blanksteg i namnet någonsin träffas. Fix-formen (vidga teckenklassen, eller matcha på en annan kolumn som bär sentinel-markören utan blanksteg) avgörs av utföraren mot policyfilen och guard-testsviten, aldrig mot antagande. Sidofynd bokfört i S115 (sessionsdok Del 6 § Kort att minta).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Postgres-mönstret i .purge-staging-policy.json matchar en inbetalningsrad vars ogonblicksbild_namn skrivits av create-registration eller rebook-registration för en sentinel-person (namn med mellanslag), och matchar fortfarande INTE en rad vars namn saknar sentinel-markören
- [ ] #2 Purge-motorns guard-testsvit bär två nya fall: sentinel-namn med blanksteg raderas; icke-sentinel-namn med blanksteg rörs inte
- [ ] #3 Skarpbevis mot staging: en EF-skapad inbetalning med sentinel-namn (äldre än ålders-guarden) rapporteras av npm run purge:staging i dry-run och raderas i skarp körning; efter-verifiering 0 kvar
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #4 Den fixade regeln är dokumenterad i ADR-060 § Updates eller i policyfilens egen kommentar (var den styrande ytan är avgörs av ADR-100 §1)
<!-- DOD:END -->
