---
id: TASK-461
title: >-
  CodeQL: fyra stack-trace-exponeringar i Edge Functions + triage av de nio
  öppna kodskanningslarmen
status: To Do
assignee: []
created_date: '2026-09-18 11:53'
updated_date: '2026-09-19 08:35'
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
- [x] #2 Stack-tracen loggas fortfarande server-side (felsökbarheten består)
- [x] #3 Alla nio larm är stängda i GitHub: 'fixed' av landad kod eller 'dismissed' med skrivet skäl — gh api …/code-scanning/alerts?state=open ger noll
- [x] #4 Kortet säger vilka EF:er som behöver prod-deploy och att den är Marcus steg
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prod-deploy krävs för TRE EF:er efter denna PR landar: hantera-inbetalning, registrera-inbetalning, rebook-registration (samtliga i .prod-functions-allowlist.conf). Detta är Marcus eget steg via scripts/fas4-prod-deploy.sh --deploya <prod-ref> — aldrig en agent. test-static-files och test-pdf-generation är MEDVETET UTELÄMNADE ur .prod-functions-allowlist.conf (staging-only testharness-EF:er, får aldrig nå prod) och kräver alltså inget prod-deploy-steg. AC #3 (0 öppna larm i GitHub) kan INTE bockas från en byggagents worktree — CodeQL-alerts state flippar till 'fixed' först efter att koden landat på main och skannats om; det är en orkestrerar-/Marcus-verifiering efter merge, inte något en bygg-agent kan uppnå. Känd öppen skuld: test-static-files kunde INTE deployas till staging under detta bygge (413 'request entity too large' mot Supabase Management API:s functions/deploy-endpoint, orsakad av funktionens EGNA static_files-bundle på 5,3 MB — config.toml static_files = ['./functions/_shared/mallar/*'], helt orört av denna PR:s diff). De tre betalnings-EF:erna + test-pdf-generation deployades till staging OK (version bumpad, verifierat via 'supabase functions list'). Full analys i PR-kroppen.

Granskningsrunda 1 (risk HÖG, betalningsflöden): AC #1 bedömd FELSTÄLLD — "ett test per EF" levererades inte fullt ut. test-static-files (#3) har NOLL automatiserad täckning efter att den beslutade staging-assertionen togs bort ur PR:en (413-deploy-blockern gjorde den obevisbar skarpt, se PR-kroppen). Källkodsfixen för #3 är kvar och korrekt (verifierad via kodläsning + samma mönster som den hermetiskt bevisade test-pdf-generation-fixen), men AC #1:s bokstav ('bevisat med ett test per EF') håller bara för 3 av 4 EF:er (hantera-inbetalning/registrera-inbetalning/rebook-registration via scripts/test-betalningar-bas-skrivspegel.mjs). Kortet ska inte se mer bevisat ut än det är — denna rad bokför det öppet.

AC #3 bockad 2026-09-19 (S126 resume 3): efter landningen av #2556 (`3c318da4`, 08:30Z) skannade default setup om main (körning 35432194752, grön) och ALLA NIO larm (nr 3, 4, 5, 7, 8, 9, 10, 11, 12) står som 'fixed' med fixed_at 2026-09-19T08:32:41Z — inget är avfärdat. Bokstaven 'state=open ger noll' håller INTE: listan bär ETT öppet larm, nr 13 (js/shell-command-injection-from-environment, scripts/check-nattkanal-partition.mjs:208, skapat 2026-09-18T23:10Z av #2557) — det är inte ett av de nio och fanns inte när kortet skrevs; rationale styr, och larm 13 bärs av eget kort. AC #1 står KVAR öppen med avsikt (granskarens dom 'felställd', runda 2): tre av fyra EF:er bevisas av det delade hermetiska testet, test-static-files saknar automatiserad täckning och går inte ens att deploya (TASK-468) — AC #1 avgörs när TASK-468 valt väg (laga eller riv). Prod-deploy av de tre betalnings-EF:erna: Marcus steg, kommandot lämnat i chatten 2026-09-19.
<!-- SECTION:NOTES:END -->
