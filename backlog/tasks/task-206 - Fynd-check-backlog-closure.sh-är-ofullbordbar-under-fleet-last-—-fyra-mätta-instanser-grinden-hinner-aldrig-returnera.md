---
id: TASK-206
title: >-
  Fynd: check-backlog-closure.sh är ofullbordbar under fleet-last — fyra mätta
  instanser, grinden hinner aldrig returnera
status: To Do
assignee: []
created_date: '2026-08-12 21:17'
updated_date: '2026-08-28 05:09'
labels: []
dependencies: []
priority: medium
ordinal: 381000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den repo-breda stängningsgrinden scripts/check-backlog-closure.sh returnerar inte inom rimlig tid när flera agenter arbetar parallellt. Den är nattlig (nightly.yml:437) och alltså inte en blockerande PR-grind, men den är fortfarande den mekanism som ska fånga stängningsdrift — och i praktiken kan ingen agent köra den för hand under normal fleet-last.

FYRA MÄTTA INSTANSER, samtliga 2026-08-12:

1. Två mätningar tidigare samma dag: >55 min utan fullbordan, 3–5 samtidiga instanser. Trolig kontention på delad .git. Bokfört i S105 sessionsdok Del 4.
2. Kvällens stängningsagent, körning 1: DÖDAD efter ca 55 min utan output. Load average 68 vid tillfället.
3. Kvällens stängningsagent, körning 2: >1 timme 11 minuter, fortfarande vid liv när orkestreraren avbröt den. Load average 47,85 / 57,51 / 38,21 vid mätningen, TRE samtidiga instanser av samma skript på maskinen.
4. Även UTAN last mättes en körning till >420 s i en worktree tidigare samma dag.

JÄMFÖRELSETAL: CLAUDE.md bokför 164,60 s för grinden med check_active_branches paa. Det talet är en HUVUDKATALOGSMÄTNING utan konkurrens och ska inte läsas som ett löfte — se den filens egen varning om att inte multiplicera per-anropstalet.

VAD SOM ÄR KÄNT OM MEKANIKEN: grinden gör ett backlog task list (dyrt, ~6,5 s med check_active_branches) och därefter ca 173 backlog task view (~0,55 s styck, opåverkade av flaggan). Under samtidiga Playwright-sviter och flera parallella backlog-CLI-instanser tycks kostnaden växa långt bortom summan av delarna.

FRÅGOR ETT DIAGNOS-PASS BÖR BESVARA:
- Är det verkligen .git-kontention, eller ligger kostnaden i backlog-CLI:ts egen grenskanning (check_active_branches mot 223 grenar)? Mätbart genom att köra grinden med flaggan av och jämföra.
- Skalar det med antal SAMTIDIGA CLI-instanser eller med maskinens totala load? Interfolierad mätning enligt riggen i npm run metrics:flake-anda, inte blockad.
- Kan grinden göras inkrementell — bara kort som ändrats sedan senaste gröna nattkörning — i stället för repo-bred varje gång?
- Bör den ha en tidsgräns som fäller med tydligt skäl i stället för att hänga tyst? En grind som aldrig returnerar är en grind utan bevakare.

KONSEKVENS TILLS DEN ÄR LÖST: agenter ska inte köra den repo-breda grinden som del av en stängning under fleet-last. Per-kort-verifikationen mot faktiska belägg är uppdragets kärna; den repo-breda konsistensen ägs av nattgrinden. Detta beslut togs av orkestreraren 2026-08-12 efter att ha disk-verifierat att grinden är nattlig och inte en PR-gate.

RELATERAT MEN INTE SAMMA SAK: TASK-118 (grinden fail-closed:ar utan BACKLOG_CMD-override när backlog.md saknas i node_modules). Det är en frånvaro-bugg, detta är en prestanda-pathologi.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Diagnos-passets fyra frågor besvaras med mätdata: (1) git-kontention vs backlog-CLI:ts egen grenskanning, (2) skalning mot antal samtidiga CLI-instanser vs total maskin-load, (3) om grinden kan göras inkrementell (bara ändrade kort sedan senaste gröna nattkörning), (4) om en tidsgräns med tydligt felmeddelande behövs — interfolierad mätning, ej blockad (metrics:flake-mönstret)
- [ ] #2 scripts/check-backlog-closure.sh emitterar progressiv output (per kort eller per N kort) till stderr, så en pågående körning kan skiljas från en hängd
- [ ] #3 Skriptet har en tidsgräns som fäller med tydligt skäl i stället för att hänga tyst, eller ett källbelagt beslut om varför en tidsgräns är fel åtgärd om diagnosen visar det
- [ ] #4 Nightly-körningen (nightly.yml:437) grön efter ändringen, mätt minst en gång under normal fleet-last
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
INSTANS 5 (2026-08-13, S105 resume-dagen) — mätt av orkestreraren direkt, inte via agentrapport. D3-A:s körning startade 16:31:01 i huvudkatalogen under fleet-last (loadavg 8,36 vid mätning, TVÅ samtidiga instanser av skriptet på maskinen: pid 22128 + 89962). Vid 12 min 07 s körtid: outputfilen 0 BYTES. Processen dog därefter utan att någonsin skriva en enda byte.

NY EGENSKAP, ej bokförd i instans 1-4: skriptet ger INGEN PROGRESSIV OUTPUT. Det gör 'hängd' mekaniskt oskiljbart från 'arbetar' för den som väntar — man kan inte avgöra om en körning är värd att invänta eller ska avbrytas. Det är en separat defekt från långsamheten: även ett långsamt skript är hanterbart om det säger var det är. Kandidat-åtgärd vid fix: emittera per prövat kort (eller per N kort) till stderr, så väntan blir informerad.

KONSEKVENS FÖR S105: TASK-176/177/196:s DoD-bockning (PR #1246) kunde därför INTE aggregat-verifieras lokalt. Kompensation: varje DoD-post styrktes i stället direkt mot GitHubs check-status per PR (gh pr view --json statusCheckRollup) plus en färsk check:docs-körning — starkare punktbelägg, men inte samma sak som grindens egen exit 0. Facit väntar på nattens Nightly, som kör utan fleet-last.
<!-- SECTION:NOTES:END -->
