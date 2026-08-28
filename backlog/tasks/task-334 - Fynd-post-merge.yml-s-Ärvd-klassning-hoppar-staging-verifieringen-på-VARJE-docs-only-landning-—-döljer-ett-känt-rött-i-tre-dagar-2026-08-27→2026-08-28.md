---
id: TASK-334
title: >-
  Fynd: post-merge.yml:s Ärvd klassning hoppar staging-verifieringen på VARJE
  docs-only-landning — döljer ett känt rött i tre dagar (2026-08-27→2026-08-28)
status: To Do
assignee: []
created_date: '2026-08-28 03:50'
labels:
  - fynd
  - ready-for-agent
dependencies: []
ordinal: 605000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Uppdragets ursprungliga hypotes ('concurrency-avbrott när nästa commit landar sekunder senare') PRÖVAD och FALSIFIERAD (ADR-086 premiss-pass, 2026-08-28): gh run view 33137040114/33138604694 --json jobs visar jobbet 'Verifierande svit på det mergade trädet' som skipped, INTE cancelled, och de två merge-commiten (7a0a2a46 kl 02:48:54Z, 10ae24f3 kl 03:20:36Z) ligger 32 min isär — inte sekunder. Den FAKTISKA, verifierade mekanismen (gh run view --log, jobbet 'Ärvd klassning'): 'docs_only=true — Test suite skippades i merge_group-körning 33136831515 ⇒ ci.yml klassade det landade trädet D0 (docs-only) — inget att skydda, sviten hoppas.' — scripts/classify-post-merge.sh (TASK-73, ADR-077) ÄRVER medvetet PR-grindens klassning av DENNA PR:s EGEN diff, räknar aldrig om. Konsekvensen: PR #2025 (fix/task-309-27-fetstil, icke-docs-only) körde full svit och FÅNGADE rätt — Staging (API+E2E) = failure, och 'Larm vid rött post-merge' körde och lyckades (run 33095380581). Men VARJE efterföljande docs-only PR:s post-merge-körning (#2029, #2030, #2033 — allihop 'success' på workflow-nivå) ärver bara 'inget nytt att skydda', och re-verifierar ALDRIG det redan trasiga trädet. Den underliggande get-document-sources.staging.test.ts-röda förblev därmed osynlig i tre dagar tills denna diagnos, trots att larmet faktiskt hade fyrat en gång. Mekanismen är EXAKT som ADR-077 designade den (ärvd klassning av PR:ens EGEN diff, inte av trädets aktuella hälsa) — frågan är om det är rätt kontrakt för en signal (post-merge/nattvakt) vars HELA syfte är att fånga sådant PR-grinden inte kan se (t.ex. Airtable-datadrift). Källor citerade: gh run list --workflow post-merge.yml, gh run view <id> --json jobs, gh run view <id> --log.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Marcus/orkestreraren beslutar om ärvd-klassnings-kontraktet ska ändras för post-merge (t.ex. alltid köra Staging oavsett docs_only, eller ett separat larm som eskalerar om senaste ICKE-skippade körning var röd) eller om nuvarande beteende accepteras som avsett tradeoff
- [ ] #2 Om ändring: en skiva myntas under lämpligt ADR (ADR-077 tillägg) som dokumenterar det nya kontraktet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
