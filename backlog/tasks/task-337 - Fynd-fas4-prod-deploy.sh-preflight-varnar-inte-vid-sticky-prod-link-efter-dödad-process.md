---
id: TASK-337
title: >-
  Fynd: fas4-prod-deploy.sh preflight varnar inte vid sticky prod-link efter
  dödad process
status: To Do
assignee: []
created_date: '2026-08-28 04:45'
updated_date: '2026-08-28 05:11'
labels:
  - ready-for-agent
dependencies: []
ordinal: 608000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mätt instans (2026-08-28 ~03:38Z, källa: S108 sessionsdok Del 29 — K-sista-PR, landar samma dag — + denna sessions chattlogg). fas4-prod-deploy.sh kördes via !-prefixet under --deploya-sekvensen.

RÄTTELSE (review-runda 1 på #2060, ADR-086): kortet påstod ursprungligen att CLAUDE.md § Prod-EF-deploy 'kräver' eget terminalfönster och att !-prefixet vore fel kanal. FALSKT. CLAUDE.md § Prod-EF-deploy sanktionerar i dag BÅDA kanalerna, verbatim (git show origin/main:CLAUDE.md rad 275): 'Ska Edge Functions till prod (fas 4-klassen) kör Marcus, i sin egen terminal eller via `!`-prefixet'. Skriptets egen header (scripts/fas4-prod-deploy.sh rad 39) säger detsamma: 'ANVÄNDNING (Marcus, via !-prefixet eller egen terminal)'. Det är ett MÄTT designval, inte en förbisedd regel — tasks/lessons.d/bang-prefixet-passerar-pretooluse-hookar-matt-tva-ganger.md dokumenterar att !-prefixet passerar PreToolUse-hookar (mätt två gånger, S102/S103/S106) och är Marcus förstahandsval för hans egna spärrade kommandon: en fällning syns direkt i utdatan, och den egna terminalen står ändå kvar som strukturellt garanterad reservväg.

!-prefixets 2-minuterstak (BASH_DEFAULT_TIMEOUT_MS) SIGKILL:ade processen mitt i sekvensen. Skriptets EXIT-trap (som ska återlänka till staging oavsett utfall) körs INTE vid SIGKILL — bash kan inte fånga SIGKILL, trap-hanteraren triggas aldrig. supabase/.temp/project-ref stod därför kvar på prod-refen (sticky link) tills orkestreraren manuellt körde 'supabase link' mot staging igen. Nästa Supabase CLI-kommando i den katalogen (agent eller Marcus) hade gått mot PROD utan varning.

FYNDET ÄR EN SKÄRPNING, INTE EN RIVEN LIKVÄRDIGHET: --kontrollera (sekunder, read-only) och facit-stämplingar är korta nog att 2-minuterstaket aldrig blir en fråga — de kan fortsatt gå via !-prefixet precis som i dag. --deploya (45 EF, ≈10 min) är strukturellt inkompatibel med taket: en SIGKILL är i praktiken oundviklig om den körs via !, och en SIGKILL-avbruten --deploya lämnar länken i fel läge tyst. Skärpningen delar alltså upp de två kommandona efter körtid i stället för att behandla dem lika.

RISKEN preflighten ska stänga: preflighten (--kontrollera/--deploya) läser i dag inte det EGNA sticky-tillståndet innan den startar — den litar på att länken redan är rätt. En SIGKILL-avbruten tidigare --deploya-körning lämnar länken i fel läge tyst.

GÖR: (i) preflight-steget i scripts/fas4-prod-deploy.sh läser supabase/.temp/project-ref VID START (innan någon länk-/deploy-operation) och jämför mot förväntad staging-ref. Är den redan lika med prod-refen (föregående körning återlänkade aldrig) ska skriptet FÄLLA eller tydligt VARNA med instruktion att köra `supabase link --project-ref STAGING_REF` manuellt innan det fortsätter — aldrig tyst fortsätta som om läget vore rent. (ii) skriptets huvud och CLAUDE.md § Prod-EF-deploy skärps: --deploya i eget terminalfönster (aldrig !-prefixet, av SIGKILL-skälet ovan), --kontrollera och stämplingar får fortsatt gå via !-prefixet.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 preflight läser supabase/.temp/project-ref och fäller/varnar om ≠ staging med tydlig instruktion
- [ ] #2 skriptets huvud + CLAUDE.md § Prod-EF-deploy skärpta: --deploya i eget terminalfönster, --kontrollera får gå via ! — den tidigare likvärdighets-raden bokförd som riven öppet (K-sista S108, PR för K-sista-doken gör CLAUDE.md-ändringen)
- [ ] #3 tvåsidigt test i scripts/test-fas4-prod-deploy.sh
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RÄTTELSE 2026-08-28 (review-runda 1 på #2060, ADR-086): kortets ursprungliga premiss — att CLAUDE.md § Prod-EF-deploy 'kräver' eget terminalfönster och att !-prefixet vore fel kanal — var FALSK. CLAUDE.md rad 275 ('kör Marcus, i sin egen terminal eller via `!`-prefixet') och scripts/fas4-prod-deploy.sh rad 39 ('ANVÄNDNING (Marcus, via !-prefixet eller egen terminal)') sanktionerar båda kanalerna i dag, mätt designval enligt tasks/lessons.d/bang-prefixet-passerar-pretooluse-hookar-matt-tva-ganger.md. Description och AC #2 omskrivna: fyndet är nu en SKÄRPNING (--deploya kräver eget terminalfönster pga SIGKILL-risken vid 2-minuterstaket; --kontrollera och stämplingar får fortsatt gå via !-prefixet), inte en riven likvärdighet.
<!-- SECTION:NOTES:END -->
