---
id: TASK-451.5
title: 'Skiva: preconnect mot Supabase i index.html'
status: Done
assignee: []
created_date: '2026-09-18 10:39'
updated_date: '2026-09-19 13:06'
labels:
  - ready-for-agent
dependencies: []
references:
  - docs/research/kallstarten-diagnoskarta-2026-09-18.md
parent_task_id: TASK-451
priority: medium
ordinal: 789000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prod-`index.html` (mätt 2026-09-18 mot admin.miranon.dev) bär 0 `preconnect` och 42 `modulepreload`. DNS + TCP + TLS mot Supabase startar först när första anropet fyrar — efter en vecka i vila är det token-refreshen, mitt i Förberedelseskärmen. web.dev rekommenderar preconnect för tredjeparts-origin på kritisk väg.

Origin är miljöberoende (staging/prod): använd Vites HTML-env-ersättning eller motsvarande, hårdkoda inte. Kontrollera CSP/headers i `vercel.json` och att service workerns precachade `index.html` får samma tagg. Underlag § 1.1, § 6 punkt 4.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Byggd index.html för production respektive staging bär preconnect (med crossorigin) mot rätt Supabase-origin — verifierat i dist, inte antaget
- [x] #2 Ingen hårdkodad origin i källan; saknas env-värdet bryts bygget eller taggen utelämnas — aldrig en tom/felaktig href
- [x] #3 DoD-grindarna gröna; befintliga e2e/acceptance orörda
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verifiering (2026-09-18): dist/index.html bär en preconnect-tagg med crossorigin mot rätt Supabase-origin för BÅDA byggena, mätt i dist (prod-origin ur .env.production, staging-origin ur .env.staging — inte återgivna verbatim här, se PR-diffen). Origin läses live ur VITE_SUPABASE_URL via Vites inbyggda %VAR%-HTML-ersättning (ingen ny plugin). Bygg-tids-vakt i vite.config.ts kastar om variabeln saknas (negativt prövat: exit 1, felmeddelande verifierat). SW-precachens index.html-revisionshash skiljer sig mellan de två byggena (bevisar att precachen bär den byggspecifika taggen automatiskt). vercel.json bär ingen CSP; X-DNS-Prefetch-Control:off påverkar INTE explicit link-rel-preconnect (MDN, verifierat). DoD: typecheck/biome/build gröna (exit 0). test:api: 2313/2316 gröna — 3 fel i api-staging-projektet, samtliga bevisat obesläktade med diffen (PLAYWRIGHT_NO_WEB_SERVER=1, ingen vite-byggväg i den testkörvägen): en är en källkommenterad, KÄND race mot delad staging-fixtur som testets egen kod säger absorberas av CI:s 2 retries (generate-event-attachment.staging.test.ts rad ~629-633), de två andra är 'Request context disposed'/timeout mot samma staging-Edge Function, sammanfallande med att CI:s post-merge-jobb (run 35337578276) samtidigt höll staging (tests/support/staging-preflight.ts blockerade en ren omkörning). AC #3 lämnas därför avbockad — se PR-kroppen för full motivering.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landad som PR #2531 (merge b6872fb9, 2026-09-18): byggd index.html bär preconnect med crossorigin mot rätt Supabase-origin för production respektive staging, utan hårdkodad origin i källan. PR:en gick genom merge-kön med gröna grindar; befintliga e2e/acceptance orörda. Stängd vid S127:s session-end 2026-09-19 (kortet blev över när stängningsagenten avbröts av kvottaket).
<!-- SECTION:FINAL_SUMMARY:END -->
