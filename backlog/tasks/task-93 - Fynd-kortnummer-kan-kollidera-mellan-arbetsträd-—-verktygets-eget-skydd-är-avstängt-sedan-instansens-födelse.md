---
id: TASK-93
title: >-
  Fynd: kortnummer kan kollidera mellan arbetsträd — verktygets eget skydd är
  avstängt sedan instansens födelse
status: To Do
assignee: []
created_date: '2026-07-30 05:00'
updated_date: '2026-07-30 05:01'
labels:
  - ready-for-agent
dependencies: []
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
MÄTT FYND 2026-07-29 (S91, research-passet nummerallokering): två arbetsträd allokerade BÅDA `task-4` med CLI 1.47.1 och vår config. Våra noll kollisioner på 168 kort mätte turen, inte en mekanism.

ADR-081 beslut 4 påstår om kort: "redan löst. `backlog`-CLI:t äger allokeringen." DET ÄR FALSKT. CLI:t äger allokeringen inom ETT träd; varje worktree har en egen `backlog/tasks/`.

VERKTYGET BÄR REDAN SKYDDET, OCH VI HAR STÄNGT AV DET. `backlog/config.yml` har `check_active_branches: false` OCH `remote_operations: false`. Tillverkarens safe defaults är BÅDA `true` — se `ADVANCED-CONFIG.md` i MrLesk/Backlog.md. Med flaggan på hoppade CLI:t till `task-5` i research-passets mätning.

FORENSIK PÅ RADEN: satt vid instansens födelse, `e106e7f` (S48, T57, init v1.47.1), och ALDRIG ändrad sedan. Commit-meddelandet listar `integration none` och `autoCommit false` som medvetna val — `check_active_branches` nämns inte. Det är ett init-default ingen valde aktivt. Raden var oskyldig i juli (ingen parallellism fanns); worktree-isoleringen mekaniserades 2026-07-28. Arbetsformen ändrades, inställningen följde inte med. Samma klass som CLAUDE.md-fyndet: rätt när den skrevs, fel när förutsättningarna flyttade, ogranskad för att ingen visste att den fanns.

GRÄNSEN ÄR OCKSÅ MÄTT: skyddet ser COMMITTAT arbete. Ocommitterade kort i ett systerträd är osynliga. Skyddet är alltså en riskminskning, inte en garanti — skriv ut det.

VARFÖR DETTA INTE ÄR EN REN CONFIG-FLIPP: research-passet flaggade öppet att flaggan styr mer än ID-allokering, och vad den gör med kort-STATUSAR i vårt 168-kortsträd är OBELAGT. Verktyget har ett eget öppet ärende `task-4.12` Handle task ID conflicts across branches — ytan är känd hos leverantören. Mät före flipp.

Underlag: `docs/research/nummerallokering-parallella-aktorer-2026-07-29.md` (PR 465, 84 citerade URL:er). Grillningens `A2:7` delades 2026-07-29 på Marcus beslut: detta kort är nummerhalvan; filnamnskrocken i scratchpad kvarstår som egen designfråga.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 RÖTT-FÖRST: kollisionen reproducerad och dokumenterad med körutdrag — två arbetsträd, samma nästa-nummer, med `check_active_branches: false`. Utan detta bevis vet vi inte att vi mätt rätt sak
- [ ] #2 STATUS-MÄTNINGEN (den blockerande): alla 168 korts `status:` avlästa FÖRE och EFTER flaggan satts `true`, som maskinell diff — inte stickprov, inte ögonmått. Research-passet lämnade detta obelagt och det är kortets tyngsta uppgift
- [ ] #3 FLIPP-KRITERIET ÄR DETERMINISTISKT: flaggan sätts `true` OM OCH ENDAST OM status-diffen är TOM. Är en enda status ändrad flippas den INTE — fyndet rapporteras i stället, och kortet stängs som blockerat på Marcus-beslut. Ingen omdömesbedömning i stunden
- [ ] #4 GRÖNT-EFTER: med flaggan `true` verifieras att kollisionen från AC #1 UTEBLIR — samma två-träds-uppställning, olika nummer. Tvåsidigt bevis, per husets grind-praxis
- [ ] #5 TIDSKOSTNADEN MÄTT och nedskriven: `backlog task list` och `task create` före/efter, i sekunder. Den styr INTE flippen (AC #3 äger det) men tillverkaren varnar för stora repon, så talet ska finnas för Marcus avvägning
- [ ] #6 GRÄNSEN SKRIVEN DÄR DEN GÄLLER: skyddet ser committat arbete; ocommitterade kort i ett systerträd är osynliga. Detta är en riskMINSKNING, inte en garanti — formuleras i `CONTRIBUTING.md` eller `CLAUDE.md` så nästa aktör inte tror att krocken är omöjlig
- [ ] #7 ADR-081 AMENDERAS ÖPPET: beslut 4:s påstående "Kort: redan löst — `backlog`-CLI:t äger allokeringen" är falsifierat med mätning och ska rättas i ADR:n med hänvisning till detta kort. Öppen rivning, aldrig tyst omskrivning
- [ ] #8 `remote_operations: false` RÖRS INTE av detta kort — den är också avstängd mot tillverkarens default och är en egen fråga (nätanrop per CLI-körning). Noteras som öppen post, ändras inte här
<!-- AC:END -->
