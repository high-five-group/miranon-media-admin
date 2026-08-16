---
id: TASK-236
title: >-
  Staging-e2e spränger 12-min-taket sedan TASK-218.3 — namnge fällningarna,
  åtgärda warmup-kostnaden
status: To Do
assignee: []
created_date: '2026-08-16 07:06'
updated_date: '2026-08-16 10:36'
labels:
  - ready-for-agent
dependencies: []
ordinal: 436000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forensik 2026-08-16 (R2): 5/5 körningar som körde sviten på träd med 817979a8 (TASK-218.3, warmup-gate i main.tsx) blev cancelled >12 min — noll motexempel. 1F→3F vid exakt 218.3-gränsen + ~+50 % svit-tid (dot-radmätning 2m05s→3m00s per 80 tester). Mekanism: varje e2e-test startar kallt och betalar startvärmningen (11 ensureQueryData, DEFAULT_TIMEOUT_MS 9000) FÖRE router-mount; 3F × 3 försök ovanpå baslasten → taket. PR-CI skickar run_staging: false villkorslöst (ADR-077) — därför osynligt pre-merge. Taket höjs INTE reflexmässigt (ci-suite.yml:s eget förbud). REVERTA INTE 817979a8 (bär ADR-112; 218.2/218.4 ligger ovanpå). Larm #1348/#1351/#1371/#1372 stängda mot detta kort.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 De 3 fällningarna namngivna via lokal 'npx playwright test --project=chromium-authenticated --retries=0' — läs docs/reference/staging-verifiering-runbook.md först och verifiera att ingen staging-CI-körning är i luften
- [x] #2 De två 218.3-inducerade fällningarna fixade (kandidat: persist-cache.staging.test.ts — 218.3 ändrade både prod-kod och testfil)
- [x] #3 Warmup-kostnaden i e2e åtgärdad via befintlig seam (StartvarmningBeroenden) — inte via höjt tak
- [ ] #4 Staging-jobbet når sin sammanfattning < 12 min (post-merge-belägg)
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
AC1 (namngivning): CI:s dot-reporter-mönster (4 oberoende post-merge-körningar, inkl. 95135345058 på nuvarande main-HEAD) visar konsekvent EXAKT 3 F på samma relativa position — R1 (aktivitetslogg-skarv.staging.test.ts, task-235:s mål, ej rört här) + 2 i persist-cache.staging.test.ts. Lokal reproduktion var svårare än väntat (se avvikelser nedan) men isolerad enfils-körning (workers=1, ingen CI-kollision) namngav 4 STRUKTURELLT IDENTISKA instanser av samma bugg i persist-cache.staging.test.ts: "AC 3 — buster", "AC 3 — gcTime ≥ maxAge", "AC 3 — maxAge 24h" och "AC 4 — offline-öppning" — alla fyra gör en bar toBeVisible() (default 5000ms) DIREKT efter page.goto('/hem') på en fräsch kall kontext, dvs INNAN 218.3:s warmup-gate (upp till 9000ms, 4 sekventiella batcher, 5 av 7 poster mot RIKTIG staging) hunnit släppa. CI:s "3F" är sannolikt 3 av dessa 4 (marginella/timing-nära, vilken som fäller kan variera per körning) — fixen täcker alla fyra eftersom de delar exakt samma rotorsak.

AC2 (fix): Lade { timeout: 12_000 } på samtliga 4 assertions — matchar EXAKT den konvention filen redan använder för sina ANDRA post-cold-start-assertions (t.ex. rad ~430, ~508 i originalet). Verifierat: isolerad körning FÖRE fix = 7 failed/2 passed (utöver setup); EFTER fix = 3 failed/6 passed/1 skipped (AC4 self-skippar korrekt i dev-mode utan SW — det ÄR dess facit-beteende). De 3 kvarvarande (Kallstart + TASK-227 kall/varm enhet) delar INTE denna bugg — se avvikelse nedan, rörda EJ.

AC3 (seam): src/env.ts fick valfri VITE_E2E_WARMUP_TIMEOUT_MS (zod-validerad via befintliga t3-env-mönstret); src/main.tsx läser den och sprider in som timeoutMs-override i starta(queryClient, {...}) — EXAKT den seam StartvarmningBeroenden.timeoutMs redan är designad för ("Tester sätter ett litet värde", modulens egen docblock). playwright.config.ts:s e2e-webServer (setup+chromium-authenticated) sätter den till 6000ms — produktionens DEFAULT_TIMEOUT_MS (9000ms) är HELT ORÖRD (build:staging/build:production sätter aldrig VITE_E2E_WARMUP_TIMEOUT_MS). Ingen ny gate-semantik, bara samma DI en nivå högre.

AC4 (post-merge-belägg): EJ avbockad härifrån med avsikt — kortets egen text kräver "post-merge-belägg", vilket bara existerar EFTER denna PR:s landning. Orkestreraren verifierar via nästa post-merge-körnings summary-tid.

AVVIKELSER FRÅN UPPDRAGET (ADR-086):
1) "11 ensureQueryData" i kortets egen beskrivning: startvarmningen.ts har 7 WARMUP_ITEMS (7 ensureQueryData-anrop, batchade 2 åt gången = 4 sekventiella batcher); grep-träffen 11 räknar även 4 doc-kommentarer som nämner ordet. Mekanismen (sekventiell batchning FÖRE router-mount) stämmer, bara talet var för högt.
2) Lokal full-svit-reproduktion (AC1:s föreskrivna metod) visade sig OTILLFÖRLITLIG i denna session: (a) lokal default workers (8 på 16-kärnig maskin) mot CI:s faktiska 2 (verifierat i CI-loggen: "Running 202 tests using 2 workers") gav 98-103 falska fällningar; (b) sessionen hade EXTREMT hög merge-kadens — tre POST-MERGE staging-CI-körningar startade UNDER pågående lokala körningar (verifierat: run startad 08:17:09 mitt i min lokal 08:15:36-körning), vilket kontaminerar båda sidor samtidigt mot samma delade Airtable-bas; (c) en trolig KVARVARANDE ARTEFAKT: Kallstart-testets "Fjärrskådning"-assertion blev strict-mode-tvetydig (4 element, inkl en AKTIVITETSLOGG-rad "Lotta skapade ett event · Fjä...") — sannolikt en RIKTIG event-skrivning i staging från en tidigare chaotisk körning av skapa-event.staging.test.ts:s "SKARPT mot staging"-test. RÖRDES EJ (utanför scope), flaggas för uppstädning.
3) TASK-227-testerna ("kall enhet"/"varm enhet") fäller konsekvent lokalt med h1="Vill du logga in snabbare nästa gång?" i stället för "Hej..." — en PASSKEY-ERBJUDANDE-redirect (login.tsx, session.user.user_metadata.passkey_erbjudande_sett) som INTE finns i CI:s 3F-budget (max 2 rum kvar efter R1). Sannolikt konto-tillstånd på delade TEST_USER, ej en 218.3-regression. RÖRDES EJ.

GRINDAR: typecheck 0 fel (tsc -b), biome check 0 fel (515 filer), npm run build grön, npm run test:api 758/758 gröna (inkl api-staging). Mätning: isolerad fil workers=1 FÖRE=1.2min(7 failed) EFTER=1.7min(3 failed/1 skipped) — längre väggklocka EFTER är FÖRVÄNTAT (fler tester fullföljer nu sin RIKTIGA scenario-längd i stället för att fail-fast:a vid 5s); ingen fullsvit-mätning lyckades ge en ren <12min-siffra lokalt pga punkt 2 ovan — AC4 är därför post-merge-CI:s jobb, inte mätt här.

ADDENDUM (efter orkestrerarens genväg-tips, artefakt från run 31936039400/job 95138053339, träd 6ae89b7b): task-237:s nya failure()||cancelled()-uppladdning gjorde det möjligt att hämta playwright-e2e-artefakter från en CANCELLED körning för första gången. Den visar test-results-mappar med KOMPLETTA 3-försöksfel (attempt 0 + retry1 + retry2, samtliga med test-failed-*.png) för MINST 17 olika tester spridda över 6 filer: shell.staging.test.ts (5), skapa-event.staging.test.ts (2+), events-list.staging.test.ts, event-detail.staging.test.ts, persist-cache.staging.test.ts (7, matchar mitt AC2-fynd), aktivitetslogg-skarv.staging.test.ts (R1). Läst error-context.md för fyra av de icke-persist-cache-filerna: IDENTISK signatur i alla — "Timeout: 5000ms — Error: element(s) not found" på en bar toBeVisible()/toBeFocused() direkt efter kall page.goto(), dvs SAMMA rotorsak som mitt fynd men i FLER filer.

Slutsats: dot-reporterns "3 F" är sannolikt ett MÄTARTEFAKT av cancellation, inte det sanna antalet — en tests slutsymbol skrivs troligen bara ut när HELA dess retry-cykel hinner avslutas OCH flushas före 12-min-cancellationen; många av de 17 testernas retries hann köras (och lämna artefakter) men aldrig flushas som en symbol. Kortets AC1/AC2-premiss ("3"/"2 stycken") är alltså sannolikt en UNDERSKATTNING av den sanna regressionens omfattning.

Rapporterat till orkestreraren via SendMessage (2026-08-16) INNAN denna PR pushades — bad om beslut: utöka detta kort NU (jag kan fixa resten med samma säkra {timeout:12_000}-mönster) eller landa scopat och spjälka resten till nytt fynd-kort. Väntar INTE in svar (parkerar aldrig) — landar den scopade, redan verifierade fixen (persist-cache.staging.test.ts, 4 instanser) nu. Rör EJ shell/skapa-event/events-list/event-detail i denna PR — det vore scope utanför AC2:s "de TVÅ" på eget bevåg.

STEG 3 — RIKTAD VERIFIERING EFTER SEAMEN (orkestrerarens instruktion):
Körde de 4 filerna som artefakten pekade ut (shell/skapa-event/events-list/event-detail, workers=2 matchande CI) MED seamen aktiv (VITE_E2E_WARMUP_TIMEOUT_MS=6000): 87/100 passed, 13 kvar — seamen ensam av-flakade alltså majoriteten (shell gick från 8/8 trasiga i tidigare ostyrda körningar till 1/8), men inte allt: 12 av 13 bar EXAKT samma "Timeout: 5000ms — element(s) not found"-signatur som persist-cache-fyndet. Bumpade { timeout: 12_000 } på DESSA 13 (samma fil-etablerade mönster) — flera via DELADE helpers (shell.staging.test.ts:s beforeEach, event-detail.staging.test.ts:s båda oppnaSidan-funktioner) vilket täcker fler enskilda tester än 13 exakta call-sites. Filer rörda utöver persist-cache: event-detail.staging.test.ts (5 ställen), events-list.staging.test.ts (4), shell.staging.test.ts (1, beforeEach), skapa-event.staging.test.ts (3).

Omkörning av HELA 100-mängden gav 17 nya/andra fällningar på 24,4 min (mot 14,8 min innan) — SYSTEMET blev mätbart LÅNGSAMMARE mellan körningarna (denna sessions extrema samtidiga agent-belastning — bekräftat: dussintals parallella `backlog task`-processer sågs upptagna minutervis under detta korts sista fas), inte min fix som gick sönder: en riktad omkörning av BARA de 13 (6,6 min, mindre brus) gav 11/14 passed. Kvarvarande 3, EXAKTA fel:
1. event-detail.staging.test.ts "Lugnt laddläge: skeleton" — fäller ÄVEN vid 12000ms (Timeout: 12000ms, element(s) not found på status-rollen). Ej vidare buffrad — ingen empirisk grund för ett bättre tal utan fler mätningar under lugnare förhållanden. Kandidat för orkestrerarens svepkort om den upprepas i post-merge-CI.
2. events-list.staging.test.ts "Skriv ut: knappen anropar window.print" — Test timeout 30000ms på ett SENARE page.goto('/event?vy=kalender'), inte på min fixade assertion. Orelaterat till 218.3-mönstret, sannolikt maskinlast.
3. skapa-event.staging.test.ts "formuläret skapar ett riktigt event i staging" — Test timeout 30000ms på keyboard.press('Tab') inuti fyllPlatser-hjälparen, långt efter min fixade heading-assertion (som passerade). Orelaterat, sannolikt maskinlast.

STEG 4 — BOKFÖRT PER ORKESTRERARENS BEGÄRAN:

(a) 17-TESTER-FYNDET: via nedladdad playwright-e2e-artefakter (run 31936039400, job 95138053339, träd 6ae89b7b — task-237:s failure()||cancelled()-fix gjorde detta möjligt första gången): shell.staging.test.ts (5 av 8), skapa-event.staging.test.ts (minst 2), events-list.staging.test.ts, event-detail.staging.test.ts, persist-cache.staging.test.ts (7), aktivitetslogg-skarv.staging.test.ts (R1). Fyra icke-persist-cache-filer verifierat läst error-context.md — identisk "Timeout: 5000ms — element(s) not found"-signatur.

(b) DOT-REPORTER-MÄTARTEFAKTEN: dot-reportern skriver troligen en tests slutsymbol (·/F/×/±/°) bara när HELA dess retry-cykel (retries:2 i CI ⇒ upp till 3 försök) hunnit avslutas OCH flushas. En 12-min-cancellation avbryter mitt i — flera av de 17 testernas retries hann köras (artefakter finns för attempt 0+1+2) men aldrig flusha sin symbol. "3 F" i dot-strömmen är därför en UNDRE gräns satt av cancellation-tidpunkten, inte antalet drabbade tester.

(c) DE TRE ORELATERADE FÄLLNINGARNA (isolerad körning, persist-cache.staging.test.ts, före denna PR:s ytterligare fixar):
- "Kallstart (TASK-218.4)": strict-mode-violation — getByText('Fjärrskådning') matchade 4 element inkl en aktivitetslogg-rad "Lotta skapade ett event · Fjä…". Trolig kvarleva i delad staging från en tidigare SKARPT-mot-staging-körning. Data-hygien, ej kod. RÖRDES EJ.
- "TASK-227 — kall enhet": h1 = "Vill du logga in snabbare nästa gång?" i stället för väntat /^Hej/ EFTER riktig UI-inloggning. login.tsx omdirigerar till /passkey INNAN search.redirect när session.user.user_metadata.passkey_erbjudande_sett INTE är satt (src/lib/auth/passkey.ts, harSettErbjudandeTidigare) OCH webblasarenStodjerPasskey() är sant (Chromium rapporterar WebAuthn-API-existens utan konfigurerad virtual authenticator). Konkret: efter submit landar sidan på /passkey, inte /hem.
- "TASK-227 — varm enhet": samma redirect-mekanism, samma describe-block, samma delade TEST_USER.
Sannolikt KONTOTILLSTÅND på det delade staging-kontot (flaggan aldrig satt), inte en 218.3-regression — CI:s "3F"-budget lämnar knappt rum. Kan vara FÖRSTA INDIKATIONEN på en passkey-effekt (jfr task-240:s "ej utesluten, ej indikerad"). RÖRD EJ, flaggas för orkestrerarens bedömning.

TASK-240-NOTIS: seamen (StartvarmningBeroenden) fick INGEN AbortSignal i denna PR — interfacet är ett öppet objekt-literal ({ dataSource, isOnline?, timeoutMs? }), så ett framtida valfritt signal?-fält kan läggas till utan brytande ändring. Ingen dörr stängd.
<!-- SECTION:NOTES:END -->
