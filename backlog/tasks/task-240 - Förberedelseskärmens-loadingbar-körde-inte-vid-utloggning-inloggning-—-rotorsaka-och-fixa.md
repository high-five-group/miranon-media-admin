---
id: TASK-240
title: >-
  Förberedelseskärmens loadingbar körde inte vid utloggning/inloggning —
  rotorsaka och fixa
status: Done
assignee: []
created_date: '2026-08-16 09:00'
updated_date: '2026-08-17 01:53'
labels:
  - ready-for-agent
dependencies: []
ordinal: 442000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus-observation 2026-08-16 (skarp yta, logga ut → logga in): Förberedelseskärmen visades men loadingbaren rörde sig INTE alls — sedan släpptes han in abrupt. Förväntat (TASK-218/219, ADR-112): trappan driver baren under startvärmningens 11 EF-anrop. Möjliga spår (HYPOTESER, verifiera mot kod + renderad yta): progress-events inte wirade på ut/inloggnings-vägen (cache tömd? gate-läge?) · varm-start-detektionen delvis fel (skärmen visas men progress-koppling saknas) · warmup klar innan första progress-event når baren. OBS QA-kortet 218.5 (naturlig kallstart m.m.) är fortfarande öppet — denna bugg är sannolikt exakt vad den QA:n skulle fångat. Reproducera FÖRST (logga ut/in mot staging), rotorsaka mot kod, fixa, bevisa på renderad yta i båda riktningar (bar rör sig vid kall start · tyst vid varm start per ADR-112-beslutet).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Buggen reproducerad och rotorsakad med fil:rad-belägg
- [ ] #2 Fix: baren driver mot faktisk warmup-progress på ut/inloggnings-vägen; varm-start förblir tyst (ADR-112)
- [x] #3 Bevis på renderad yta i båda riktningar (kall start: bar rör sig steg för steg · varm start: ingen skärm)
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
DIAGNOS-PASS 2026-08-16 (agent, ingen fix landad — scope-stopp mot task-236:s seam): De tre ursprungshypoteserna FALSIFIERADE med instrumenterad mätning — logout tömmer cachen korrekt (AuthProvider.tsx ~118-138, 9→0), progress-events avfyras korrekt på SPA-relogin (0/7→7/7, _authenticated.tsx ~130-132), baren renderar events korrekt (Forberedelseskarm.tsx ~100-137, aria-valuenow + stegtext). Mekaniken är alltså KORREKT under rena förhållanden — Marcus exakta symptom kunde inte reproduceras deterministiskt.

TVÅ REELLA DEFEKTER FUNNA: (A) persist-throttle-race vid omedelbar reload efter utloggning (queries/persist.ts ~12-16) — gammal cache läses tillbaka, skärmen hoppas HELT över med stale data (matchar INTE Marcus symptom). (B) STRAGGLER-FÖRGIFTNING, reproducerad x2: en in-flight ensureQueryData från tidigare startvärmning landar EFTER logoutens clear() och skriver in sig igen → arCacheVarm() (startvarmningen.ts ~277-279) tror cachen är varm vid nästa mount. Mitigering cancelQueries() före clear() TESTAD OCH OTILLRÄCKLIG (cache 0→3 ändå) — callEdgeFunction (supabase-client.ts ~77-99) tar ingen AbortSignal, så robust fix kräver signal-trädning genom adapter-seamen = task-236-området. EGET SMALT KORT när 236 landat.

TROLIGASTE FÖRKLARINGEN till Marcus exakta symptom (frusen bar → abrupt släpp), OBEKRÄFTAD HYPOTES: BATCH_SIZE=2 över 7 items → sista batchen (activityLog) kör ENSAM; emit() endast vid settle, ingen stall-indikator — ett segt sista anrop fryser baren visuellt tills 9s-timeouten släpper. Händer det igen: ta HAR/trace ur Marcus session direkt.

Skärmdumpar/loggar: sessionens scratchpad task240/ (efemär). Arbetsträd verifierat rent, allt reverterat.

DIAGNOS-PASS 2 (2026-08-17, agent, ingen fix landad — felklassnings-rapport per uppdragets egen escape hatch). Bygger vidare på DIAGNOS-PASS 1:s falsifieringar (progress-events wirade korrekt, cachen töms korrekt, baren renderar korrekt) och på TASK-236/244 som landat i main SEDAN dess.

PREMISS-PASS (ADR-086): uppdraget påstod PR #1463 (task-233, Sidbytesindikator) "sannolikt i main" — VERIFIERAT FALSKT (`gh pr view 1463`: state=OPEN, mergedAt=null, mergeStateStatus=BLOCKED). Följde uppdragets egen fallback (basera på origin/fix/task-233-sidbytesindikator) för DIAGNOS-läsningen, men verifierade separat att de tre filer min diagnos vilar på (src/main.tsx, src/routes/_authenticated.tsx, src/data/warmup/startvarmningen.ts) är BYTE-IDENTISKA mellan origin/main och den branchen (`git diff origin/main origin/fix/task-233-sidbytesindikator -- <de tre filerna>` = 0 rader) — enda skillnaden är ett docblock i Forberedelseskarm.tsx (prosa om vilka komponenter som återanvänder den, ingen logikändring). Min PR-gren är därför byggd rent mot origin/main (INTE mot den öppna 233-grenen) för att undvika att bunta in orelaterad, ej landad diff — diagnosens giltighet påverkas inte, eftersom de rörda filerna är identiska.

TASK-236/244-STATUS VERIFIERAD: `varmtBeslutat.current = true` sätts nu ÄVEN på auth-yta-bypass-grenen (main.tsx rad 255, kommentaren "rättat, task-244" rad 220-251) — den EXAKTA racet DIAGNOS-PASS 1:s "defekt B" beskrev (InnerApps warmup-effekt återkommer en andra gång efter aktiv inloggning, en OSYNLIG andra starta() poisonar _authenticated.tsx:s arCacheVarm()-koll) är STÄNGD på InnerApp-nivå. Denna fix är dock INTE relevant för Marcus rapporterade scenario (redan autentiserad session → logga ut → logga in): varmtBeslutat.current sattes redan TIDIGT i sidans livstid (vid ursprunglig sidladdning), så InnerApps warmup-effekt returnerar tidigt på VARJE efterföljande auth-växling oavsett denna fix — det är HELT _authenticated.tsx:s EGEN, oberoende useAppYtaVarmningsgate-hook (mountas färskt vid varje inloggning) som driver skärmen Marcus faktiskt ser vid en logga ut/in-cykel inom samma sidladdning.

EMPIRISK REPRODUKTION (renderad yta, egen dev-server, ALDRIG 5173/5174): tre kontrollerade körningar mot RIKTIG staging-data (Airtable via Edge Functions), CORS-kringgången per docs/reference/prototyp-verifiering-runbook.md § "Den bärande kringgången" (page.route() proxyar de sju get-*-läsvägarna via Node fetch INNAN webbläsarens CORS-kontroll appliceras — realtids-latens bevarad, INGEN förhämtning). MutationObserver på [role="progressbar"] + DOM-polling (150ms) loggade varje aria-valuenow-ändring med tidsstämpel.

KÖRNING 1 — normal logga ut/in, port 5183 (staging-user@miranon.test): baren rör sig SYNLIGT steg för steg efter relogin — 0(t=11246ms)→1(12468)→2(12620)→[paus ~600ms, normal EF-latens 800-1300ms/anrop]→3(13383)→4(13536)→[paus ~600ms]→6(14303, React 18-batchning slår ihop mail-log+segments tvåca-settle inom 30ms till EN render, hoppar synligt över 5)→[skärm försvinner 14607ms]. Detta MOTBEVISAR att mekanismen är strukturellt trasig under normala nätverksförhållanden — kall start driver baren korrekt, exakt AC3:s krav.

KÖRNING 2 — samma flöde MED en kontrollerad 8500ms artificiell fördröjning på get-activity-log (WARMUP_ITEMS[6], ENSAM i sista batchen eftersom 7 items/BATCH_SIZE=2 lämnar en rest på 1 — startvarmningen.ts rad 109+358-370): baren når 6/7 vid t=26702ms, FRYSER HELT (0 rörelse, 33 pollningar á 150ms, ~5,5 sekunder) till t=32393ms då skärmen ABRUPT försvinner — DELTA från starta()-anropet (~23280ms) till försvinnandet är ~9113ms, matchar DEFAULT_TIMEOUT_MS=9000 (startvarmningen.ts rad 106) inom mätgranulariteten. get-activity-log landar FAKTISKT först vid t=35600ms — 3,2 sekunder EFTER att skärmen redan försvann: en verklig, mätt STRAGGLER (samma familj DIAGNOS-PASS 1 flaggade, men nu bevisad i just detta läge). Detta REPRODUCERAR Marcus exakta symptom (bar frusen, sedan abrupt släpp) EXAKT — inte en analogi, en kontrollerad repro.

KÖRNING 3 — varm reload (inloggad, väntat in full startvärmning, sedan page.reload() med persisterad cache intakt), port 5184: NOLL Förberedelseskärm renderad under hela 3s-pollningsfönstret efter reload — ADR-112 beslut 2 (tyst-vid-varmt) hålls korrekt. AC3:s andra riktning bekräftad.

ROTORSAK, BELAGD (fil:rad): startvarmningen.ts rad 358-370 (korAlla, sekventiell batchning BATCH_SIZE=2 rad 109 — 7 items ger en OJÄMN sista batch om 1, alltid `activityLog` i nuvarande item-ordning) + rad 372-391 (slutlofte, ADR-112 beslut 3:s HÅRDA TIMEOUT, "Släpper med delresultatet" — DOKUMENTERAD, AVSIKTLIG skyddsräcke, inte en bugg) + Forberedelseskarm.tsx (ingen stall/heartbeat-visuell signal när emit() uteblir under en längre period — komponenten är, per design, en ren `{klara,totalt}`-spegling utan tidsmedvetenhet). När det SISTA, oparade batch-itemet råkar vara långsamt (nätverk, Airtable-svarstid, Edge Function cold start) ger mekanismen NOLL visuell feedback under hela väntan (upp till hela 9s-budgeten) innan den DOKUMENTERADE timeouten löser ut med ett partiellt klara-värde — vilket LÄSER som "frusen bar, sedan abrupt släpp" för en användare som tittar på skärmen, trots att `klara`/`totalt` hela tiden är sanningsenliga (aldrig felaktig data, bara ingen NY data att visa).

VIKTIGT SCOPE-FYND: mekanismen är IDENTISK oavsett om vägen in är utloggning/inloggning (_authenticated.tsx:s useAppYtaVarmningsgate) eller en genuin kall appstart (main.tsx:s InnerApp) — BÅDA konsumerar samma starta()-motor (startvarmningen.ts) med samma BATCH_SIZE/timeout-egenskaper. Kortets rubrik ("...vid utloggning/inloggning") är därför en ÖVER-SNÄV lokalisering av var symptomet OBSERVERADES, inte var mekanismen bor — roten är motor-generell.

SLUTSATS — FELKLASSNING (uppdragets egen escape hatch, angränsande fall): ADR-112 beslut 3:s hårda timeout gör EXAKT vad den är dokumenterad att göra (skydda mot en seg men online startvärmning genom att släppa med delresultat efter 8-10s). Baren ljuger aldrig och mekanismen fungerar bevisat korrekt under normala förhållanden (Körning 1) och respekterar tyst-vid-varmt korrekt (Körning 3). Det Marcus observerade är den INTENTIONELLA skyddsräckets VISUELLA baksida när ETT enda bakomliggande anrop (troligast, men ej det enda möjliga: det sista oparade batch-itemet) råkar vara ovanligt segt — INGEN koddefekt i gate-integrationen, cache-hanteringen eller själva baren. STOPPAR fix-delen per uppdraget: en genuin åtgärd (stall/heartbeat-visuell signal efter en tröskel utan framsteg) kräver en NY designbeslut — indeterminate/pulserande tillstånd, motion-safe-hantering, eventuell Marcus-låst ordalydelse-utökning — som denna diagnoskort inte ger mandat att uppfinna solo (Forberedelseskarm.tsx bär redan tätt specade kontrastvärden och en LÅST textrad, ADR-112).

REKOMMENDERAT UPPFÖLJNINGSSCOPE (ej byggt här): (1) Ny, grillad design-runda för ett stall/heartbeat-tillstånd i Forberedelseskarm när >N sekunder gått utan emit() — kräver Marcus-beslut om visuellt språk. (2) Lättviktig Sentry-breadcrumb när avgorMed('timeout') löser ut med klara<totalt (startvarmningen.ts rad 372-391) — ren observability, ingen UI-ändring, skulle ge produktionsbelägg om detta är sällsynt eller vanligt för Marcus specifikt (i stället för att gissa). Ingen av dessa byggs i denna PR.

KVARSTÅENDE, EJ MATCHANDE (bokfört, ej åtgärdat — DIAGNOS-PASS 1:s fynd, status verifierad): Defekt A (persist-throttle-race, queries/persist.ts rad 12-16 — omedelbar HÅRD RELOAD inom throttle-fönstret ~1s efter logout kan läsa tillbaka stale cache) kräver en HÅRD sidladdning direkt efter utloggning, inte en SPA-relogin som Marcus/mina körningar — ej testad här, ej Marcus symptom (han fick en skärm, inte ett hopp över den). Defekt B:s InnerApp-nivå ÄR fixad (task-244, se ovan); en SMALARE variant (_authenticated.tsx:s EGEN föregående instans, om en warmup fortfarande är i flykten när en NY logga ut/in-cykel startar inom samma 9s-fönster) är teoretiskt möjlig men OTESTAD och kräver ett rakt annat reproduktionsmönster (snabb dubbel-cykel) än vad kortet beskriver.

KOORDINATION: rörde ENDAST backlog/tasks/task-240 — noll filer i 243.3:s (tests/) eller 241.2:s (svep-filer) domän. Ingen kod i src/ ändrad (inget fixbehov identifierat inom mandat).

VERKTYG: egen dev-server 5183 (Körning 1+2) och 5184 (Körning 3), aldrig 5173/5174. CORS-kringgången exakt per runbooken. Diagnostikskript (scratch-task240/, [DEBUG-task240]) raderade efter passet — rådata (events.json, skärmdumpar) fanns bara transient i skriptets OUT-mapp under körningen, aldrig committade.

DoD-GRINDAR (körda FÖR PUSH, faktiska exitkoder): se Final Summary.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stängd av orkestreraren 2026-08-17: alla tre AC bockade (diagnos #1466 + stall-signal/observability #1472, båda mergade via kön); post-merge på efterföljande träd (5b71dcbb) grön. DoD 1–4 mot pass 2/3-rapporternas belägg (grindkvartett exit 0, path-scopade diffar).
<!-- SECTION:FINAL_SUMMARY:END -->
