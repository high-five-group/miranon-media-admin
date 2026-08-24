---
id: TASK-272
title: >-
  Fas 4:s EF-deploy-sekvens som ett skript — fem handkörda kommandon till en
  körning
status: Done
assignee: []
created_date: '2026-08-17 12:20'
updated_date: '2026-08-24 13:56'
labels:
  - ready-for-human
dependencies: []
ordinal: 487000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus GO 2026-08-17 ('Ja skript är väl mycket bättre'), efter frågan 'Varför måste jag köra alla dessa kommandon?'.

BAKGRUND: fas 4:s prod-deploy bestod av fem handkörda kommandon i rätt ordning. Tre av felen kostar mest när de görs för hand, och alla tre är MÄTTA i huset: (a) supabase link utan styrd stdin HÄNGER på databas-lösenordsprompten (fas 4-underlagets fälla 1, kostade en arbetsdag) · (b) fel projekt länkat vid skarp operation — fem EF:er deployades oavsiktligt till prod 2026-08-10 16:47 på exakt det felet · (c) återlänkningen till staging glöms, och link-tillståndet är sticky och osynligt så nästa db push går mot prod.

LEVERERAT: scripts/fas4-prod-deploy.sh med två lägen (--kontrollera read-only, --deploya skarpt). Styrd stdin överallt, verifiering av supabase/.temp/project-ref FÖRE varje skarp operation, och återlänkning i en EXIT-trap som körs även när något fallerar halvvägs.

DESIGNENS KÄRNA — skriptet får inte bli en bypass: scripts/deny-prod-ref.sh matchar prod-refens NÄRVARO I BASH-KOMMANDOSTRÄNGEN. Ett bekvämt 'bash scripts/fas4-prod-deploy.sh --deploya' som läste refen ur .prod-ref-policy.conf hade gjort hela prod-låset verkningslöst för varje agent som läser repot. Därför KRÄVS refen som argument i BÅDA lägena, även det read-only (policyns § Matchning slår fast att låset gäller oavsett om kommandot skriver ut något eller inte). Policyn läses bara för att VALIDERA det angivna värdet.

VERIFIERAT TVÅSIDIGT: testsviten scripts/test-fas4-prod-deploy.sh, 11/11 gröna, 178 ms, CI-wirad i gatekeeper-steget. Fall 8/9 vaktar bypass-invarianten i båda riktningar. Dessutom provocerades låset skarpt: mitt eget agent-anrop med prod-refen FÄLLDES av deny-prod-ref.sh med korrekt skäl — skriptet är alltså bevisat ingen väg förbi.

EGEN FÅNGST under bygget: testsvitens första version av fall 8 matchade all förekomst av PROD_REF_PROD och föll på skriptets egen valideringsrad — ett falskt positivt i testet, inte ett fel i koden. Skärpt till att pröva OPERATIONS-position.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Skriptet kör hela sekvensen med ett anrop per läge, och återlänkar till staging även vid fel halvvägs
- [x] #2 Prod-låsets integritet bevarad — refen kommer ur argumentet, aldrig ur policyn; vaktat av testsviten i båda riktningar
- [x] #3 Marcus har kört --deploya skarpt och sekvensen gick igenom, eller avvikelsen är bokförd
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
STÄNGD S112 STÄDVÅG A (2026-08-24, bokföringspass, ingen kod ändrad). Belägg verifierat mot disk: scripts/fas4-prod-deploy.sh finns (14053 bytes, exekverbar), matchar CLAUDE.md § Prod-EF-deploy körs via SKRIPTET. AC #1/#2 redan bevisade i kortets egna notes (11/11 testsvit, deny-prod-ref.sh-bypass fälld skarpt). AC #3 (Marcus har kört --deploya skarpt) verifierat via TASK-269:s notes: 'DEPLOYAD 2026-08-17 (Marcus körde --deploya via fas4-prod-deploy.sh). Verifierat mot prod-svaret...39 funktioner ACTIVE...SKRIPTETS SKYDDSRÄCKEN FUNGERADE SKARPT'. Landningskommiten 910a2998/PR #1551 verifierad ancestor av origin/main, checks SUCCESS/SKIPPED, merge 2026-08-17T12:41:20Z.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redan löst på disk och skarpt kört — scripts/fas4-prod-deploy.sh landade i PR #1551 och kördes --deploya skarpt av Marcus 2026-08-17 (bevis i TASK-269:s notes: 39 EF ACTIVE, deny-triple mot create-attendance 401/401/405, skyddsräckena verifierade). Kortet flippades aldrig till Done i backlog-CLI:t. Bokförd stängning, S112 städvåg A.
<!-- SECTION:FINAL_SUMMARY:END -->
