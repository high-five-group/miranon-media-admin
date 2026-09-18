---
id: TASK-461
title: >-
  CodeQL: fyra stack-trace-exponeringar i Edge Functions + triage av de nio
  öppna kodskanningslarmen
status: To Do
assignee: []
created_date: '2026-09-18 11:53'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 801000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt av orkestreraren 2026-09-18 (S126, gh api repos/high-five-group/miranon-media-admin/code-scanning/alerts?state=open): nio ÖPPNA CodeQL-larm som inget kort eller någon tråd följer — äldsta från 2026-08-23. Fyra är js/stack-trace-exposure (medium) i Edge Functions: rebook-registration (#9), registrera-inbetalning (#8), hantera-inbetalning (#7), test-static-files (#3) — ett fel som läcker en stack-trace i HTTP-svaret avslöjar intern struktur för den som anropar. Ett är js/incomplete-sanitization (HIGH, #12) i ett bilageskript under tasks/sessions/bilagor/ (inte produktkod). Fyra är js/unnecessary-use-of-cat (medium, #4/#5/#10/#11) i scripts/test-review-policy.mjs. Efter kortet: de fyra EF-larmen är rättade så att felsvar bär ett generiskt meddelande + korrelations-ID medan stack-tracen loggas server-side (följ SECURITY-SPEC § EF-ribban och den felform övriga EF:er redan använder — läs en EF som INTE larmar och gör likadant); övriga fem är antingen rättade eller avfärdade I GitHub med skrivet skäl. Marcus GO 2026-09-18. OBS: EF-ändringar kräver prod-deploy via scripts/fas4-prod-deploy.sh av Marcus — kortet levererar kod + staging-bevis, inte prod-deployen.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 De fyra EF:erna returnerar aldrig stack-trace eller internt felmeddelande till klienten — bevisat med ett test per EF som provocerar felvägen
- [ ] #2 Stack-tracen loggas fortfarande server-side (felsökbarheten består)
- [ ] #3 Alla nio larm är stängda i GitHub: 'fixed' av landad kod eller 'dismissed' med skrivet skäl — gh api …/code-scanning/alerts?state=open ger noll
- [ ] #4 Kortet säger vilka EF:er som behöver prod-deploy och att den är Marcus steg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
