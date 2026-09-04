---
id: TASK-327
title: >-
  Uppgradera Backlog.md till 1.50.1 — fixar tyst dataförlust vid samtidiga task
  edit
status: Done
assignee: []
created_date: '2026-08-26 05:01'
updated_date: '2026-08-28 04:19'
labels:
  - ready-for-agent
  - deps
dependencies: []
ordinal: 600000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Vi kör 1.49.1 (verifierat: docs/research/backlog-kortskapandets-flaskhals-2026-08-26.md rad 274 'Vi kör 1.49.1'). Upstream-issue #843 (github.com/MrLesk/Backlog.md/issues/843, citerad rad 309-310 i samma dokument) mätte att samtidiga task edit tappar skrivningar TYST — 12 av 12 vid simultana anrop — fixat i 1.50.0. Vi har alltså den buggen live med 8-10 samtidiga agenter som redigerar kort. PR #898 (github.com/MrLesk/Backlog.md/pull/898, citerad rad 281) bekräftar att create-vägens ID-allokering INTE är fixad av samma release — create undantas alltså av denna uppgraderings-motivering. DIVERGENS, FLAGGAD (S112 resume 1, 2026-08-26): uppdragets instans 'B1-agentens race 2026-08-26: en bakgrundad task edit skrev efter commit' hittas INTE i forskningsdokumentet eller någon annan fil i repot vid sökning i denna session — obelagd, sannolikt muntlig/observerad utan filnedslag. Byggs vidare på ändå eftersom #843:s egen 12/12-mätning räcker som grund, men attributionen till en specifik B1-instans ska INTE återges som bekräftad fakta förrän källan hittas. Sidofynd i samma dokument (paragraf Sidofynd 1, rad 430-447): PR #710 (mergad 2026-07-01, FÖRE vår 1.49.1) gör att check_active_branches redan idag SER okommitterade kort i systerträd — CLAUDE.md paragraf Kortnummer-tabellens rader 2-3 ('Nej — osynligt') är alltså redan falska i den version vi kör, oavsett detta korts utfall. Registrerat här, ej åtgärdat — utanför detta korts scope, men flaggat för orkestreraren att triagera (ADR-053).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 package.json/lock bumpad till 1.50.1, npm ci ren
- [x] #2 scripts/test-backlog-cli.sh (wrappern, 16 fall) grön efter uppgraderingen
- [x] #3 check-backlog-closure.sh byte-identiskt utfall före/efter uppgraderingen
- [x] #4 mätning av task list/view/edit via npm run bl-wrappern före/efter bokförd i kortet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
POINTER TILL S112 DEL 5 (S112 resume 1, 2026-08-26): tasks/sessions/2026-08-24-session-112.md (landad #2004, merge-commit 9b3a2581) bar landningstabellen for hela fix-voga 4 (17 PR:er / 27 kort) samt CLAUDE.md § Kortnummer-rattelsen (Backlog.md PR #710-fyndet). DIVERGENS-BEKRAFTELSE (ADR-086): sokning i denna session (grep over tasks/, docs/, backlog/tasks/) efter 'B1-agentens'/'edit-race' hittar ENDAST detta korts EGEN tidigare notes-rad ('DIVERGENS, FLAGGAD (S112 resume 1, 2026-08-26): uppdragets instans ... hittas INTE i forskningsdokumentet eller nagon annan fil ... obelagd') — dvs kortet hade redan sjalv flaggat exakt denna divergens innan detta pass. Ingen ny kalla hittad i Del 5 eller nagon annanstans. Attributionen till en specifik B1-instans forblir OBELAGD; kortets grund (upstream #843s 12/12-matning) star dock kvar oberoende av den attributionen.

UPPSTROMS-VERIFIERING (denna byggsession, 2026-08-28, `gh release view`/`gh pr view`/`gh issue view --repo MrLesk/Backlog.md`, live mot GitHub, ej cache): #843 stangdes 2026-08-07 av PR #860 ("BACK-575 - Fail fast instead of silently losing concurrent task edits"), shippad i 1.50.0. VIKTIG NYANS mot kortets beskrivning: fixen ar INTE "bada skrivningar overlever" — den ar fail-fast. Andra skrivaren pa samma kort far nu `Edit failed: TASK-X is being modified by another process; retry if appropriate.`, icke-noll exitkod, ingen vantan, ingen merge. PR #860 citerat: "no waiting, no merging, no auto-retry; the caller decides." Operativ konsekvens for var fleet: en agent vars `task edit`-anrop kolliderar med en annan far efter bumpen ett SYNLIGT fel i stallet for tyst forlust — ratt riktning, men kraver att anropande skript/agenter hanterar en icke-noll exitkod (ingen sadan retry-logik finns i scripts/backlog-cli.sh idag; wrappern rapporterar bara exitkoden vidare oforandrad, testat W12/W13). Flaggat for orkestreraren (ADR-053, blockerar-ej-vardefullt): eventuell retry-logik i wrappern eller hos agentkontraktet ar ett eget kort, inte del av denna uppgraderings scope.

1.50.1 (2026-08-10, PR #898 + #899) ar en HOTFIX for en PRESTANDAREGRESSION 1.50.0 sjalvt introducerade pa manga-grens-repon: `task view`/`task list`/`task edit` gjordes LOKALA-BARA (lasar inte langre cross-branch-korpuset for dessa kommandon), uppstroms egna siffror (deras repo): view 4,42s->0,85s, list 4,15s->0,21s, no-op edit 12,19s->0,42s. PR #898 citerat verbatim: "Task-ID allocation still consults other branches, so IDs stay collision-safe." och "No change to task-ID allocation, which still consults other branches on purpose." — bekraftar kortets premiss att `task create` INTE paverkas av uppgraderingen (varken snabbare eller kollisionsosakrare). PR #899:s granskningsrunda hittade dessutom och fixade ett eget dublett-ID-fonster i LANGLIVADE web/MCP-processer (ej relevant for var per-anrops-CLI-anvandning).

AC1 (npm ci ren): package.json rad 106 andrad "1.49.1" -> "1.50.1". `npm install` kort en gang for att uppdatera package-lock.json (diff: exakt 7 poster — backlog.md + de 6 plattforms-binararna backlog.md-{darwin,linux,windows}-{x64,arm64}, samtliga version+resolved+integrity, 0 ovidkommande paket paverkade). Darefter `rm -rf node_modules && npm ci`: exit 0, "added 638 packages, and audited 639 packages", 0 vulnerabilities. `node_modules/backlog.md-darwin-x64/backlog --version` -> 1.50.1 bekraftat. AC1 GRONT.

AVSIKTLIG AVVIKELSE fran standardinstruktionen "symlinka node_modules, kopiera inte": denna skiva BUMPAR sjalva beroendet, sa en symlink till huvudkatalogens DELADE node_modules hade muterat den delade tradet medan andra agenter aktivt kor (matt: 2026-08-28 ~05:16, `ps aux` visade minst 4 samtidiga `backlog.md-darwin-x64/backlog`-processer fran ANDRA sessioner/worktrees mot task 325 och 309.25 samtidigt som denna session lastes). Symlanken togs darfor bort (`rm node_modules`) INNAN nagon npm-operation och ersattes av en fullstandig LOKAL `npm install`/`npm ci` i detta worktree — noll risk for att storta en parallell agents pagaende `backlog`-anrop mitt i korningen. Flaggat har eftersom det bryter mot uppdragets skrivning "symlinka den — kopiera inte"; rationalet ar operativ sakerhet under matt hog fleet-last (loadavg 25-40 vid sessionsstart, se AC4).

AC2 (wrappertestsviten): `bash scripts/test-backlog-cli.sh` efter bumpen -> 16 passerade, 0 failade, exit 0 (W1-W16). Sviten kor mot en STUBBAD binar (prover wrapperns egen shell-logik: routing, BACKLOG_CWD, config-isolering) — den provar allts INTE 1.50.1:s faktiska las-beteende. Den provningen gjordes i stallet LIVE via AC4-matningen nedan (riktig 1.50.1-binar genom wrappern, riktiga kort). AC2 GRONT.

AC3 (check-backlog-closure.sh byte-identiskt): kord EN gang fore bumpen (sparad till fore.txt) och EN gang efter (efter.txt). Bada: exit=1, 11 inkonsistenta kort av 675 provade (fore-existerande inkonsekvenser i det levande registret, orelaterat till detta kort — t.ex. TASK-223, TASK-309.18-28; ingen av dem ror backlog.md-verktyget). `diff fore.txt efter.txt` -> TOMT, diff-exit=0. Byte-identiskt bekraftat inklusive exitkod. AC3 GRONT. Risk noterad: fleet-samtidighet hade kunnat gora korten olika mellan de tva korningarna (andra agenter redigerar kort parallellt) — det hande inte har (~8 minuter mellan korningarna), men diff-resultatet ar darfor en positiv observation for DETTA fonster, inte en generell garanti.

AC4 (matning task list/view/edit via `npm run bl`, 3x per fas, TASK-330 for view, TASK-327 sjalv for edit via --append-notes): rader medianer (sekunder), N=3 per cell:

| Kommando | FORE (1.49.1) median | EFTER (1.50.1) median | Loadavg (1 min) under fasen |
|---|---|---|---|
| task list --plain | 7,52s (6,47/7,52/15,45) | 7,43s (6,46/7,43/9,75) | fore: 25,3-39,7 · efter: 122,9-172,1 |
| task 330 --plain | 8,66s (8,31/8,66/10,24) | 9,61s (9,47/9,61/11,28) | samma |
| task edit 327 --append-notes | 8,46s (7,57/8,46/10,39) | 7,94s (6,69/7,94/8,62) | samma |

INGEN TYDLIG RIKTNING GAR ATT DRA — och det ar ett matt resultat, inte en gissning bortförklarad: loadavg (1 min) var ~4x HOGRE under efter-fasen (122,9-172,1) an under fore-fasen (25,3-39,7), en annan parallell sessions fleet-belastning som spikade MELLAN de tva matfonstren (~8 min isar), inte nagot denna skiva orsakade. Nollresultatet kan darfor INTE tolkas som "1.50.1 ger ingen vinst" — confoundet ar for stort for att sarskilja. ARKITEKTURELL FORKLARING utover confoundet: wrappern (scripts/backlog-cli.sh, ADR-117) satter redan `check_active_branches: false` i sin isolerade config for just dessa kommandon (list/view/edit) — exakt den kostnad 1.50.1 tar bort AR REDAN BORTTAGEN av wrappern innan bumpen. Den forvantade marginalvinsten AV BUMPEN SPECIFIKT for wrapper-anvandare ar darfor sannolikt liten oavsett last — uppstroms 4-12x-vinsterna galler den RAKA CLI:n med `check_active_branches: true`, som wrappern redan kringgar. Detta OPROVADE (research-doket rad ~334-336): kombinationen "1.50.1:s lokala-bara lasningar x wrapperns BACKLOG_CWD-symlank-isolering" AR NU BEVISAD FUNGERANDE — samtliga 9 verkliga (icke-stubbade) 1.50.1-anrop gav exit=0 och korrekt data (task 330 lastes, och alla 3 --append-notes-skrivningar till TASK-327 landade synligt i denna sektion). AC4 GRONT (matningen ar bokford; RIKTNINGEN ar obestamd pga confound, vilket ar den arliga slutsatsen).

OVANTAT FYND, UTANFOR SCOPE, REGISTRERAT EJ ATGARDAT (ADR-053, blockerar-DoD-men-inte-i-scope): `npm run test:api` gav 1241 passed / 3 failed forsta korningen. Omkorning av de tva `get-document-sources.staging.test.ts`-testerna (rad 52 och 100) fallde IDENTISKT en andra gang (samma "Expected: 10, Received: 16" och samma avvikande brodtext om "Resor i Medvetandet") — INTE flakighet, en genuin avvikelse i den DELADE staging-Airtable-fixturen. Tredje testet (generate-event-attachment.staging.test.ts:361) passerade vid omkorning — DEN var flakig, sannolikt fleet-samtidighet. De tva kvarstaende fallen ror en fixtur som TASK-31:s "BREDARE SVEP" (2026-08-26) uttryckligen klassade som "MEDVETET kontrollerad, icke-additiv" — dvs den skulle INTE vaxa. Att den nu visar 16 rader dar 10 forvantas motsager den klassningen och tyder pa att nagon/nagot (troligen en annan samtidig agent, ev. en seed-operation) har muterat just den staging-eventets agenda sedan TASK-31 landade. Ingen kausal koppling till backlog.md-bumpen ar mojlig eller sannolik (backlog.md ror aldrig Airtable/src-kod). Ej atgardat i denna skiva — utanfor scope, kraver egen Airtable-utredning. Flaggat for orkestreraren att triagera (ADR-053: blockerar min DoD-verifiering av test:api men blockerar inte SUBSTANSEN i denna PR, som inte ror dokumentgenerering).

DoD-avstamning: typecheck exit 0, `npx @biomejs/biome check .` exit 0 (11 warnings/67 infos, ofororandrat mot baseline — src/ ej rord), `npm run build` exit 0. `scripts/check-langa-streck.mjs` EJ TILLAMPLIG (src/ ej rord av denna diff). Rord fil-klass: package.json + package-lock.json (dependency-bump, klassas FULL enligt D0-allowlisten eftersom bada explicit undantas fran docs-klassen) + detta kort. Diff-scope verifierad via `git status --porcelain`: exakt 3 filer.

## Stängning (S112 resume 2, 2026-08-28 ~07:10)

Landning: PR #2041, merge-commit `ef2e0522` (kön, CI grön per jobb). DoD #2 bockad av orkestreraren efter CI: bygg-agenten lämnade den öppen p.g.a. två lokalt fallande test:api-fall i `get-document-sources.staging.test.ts` — rotorsakad som staging-datadrift utanför denna PR (S108:s avsiktliga RIM 1-berikning `9bb8d6be`, testfix TASK-333/PR #2053, larm #2043). Ingen kausal väg från en backlog.md-bump till ett staging-API-test (review-utlåtande #2041, fynd 1). Uppströms #843-fixen är fail-fast (andra skrivaren får fel), inte 'båda överlever' — bokfört i notes ovan.
<!-- SECTION:NOTES:END -->
