---
id: TASK-218.3
title: >-
  Skiva: Gate-integrationen — skärm + motor i auth-gaten, appnivå-textraderna
  ersätts
status: Done
assignee: []
created_date: '2026-08-15 08:47'
updated_date: '2026-08-17 08:17'
labels:
  - ready-for-agent
dependencies:
  - TASK-218.1
  - TASK-218.2
parent_task_id: TASK-218
ordinal: 417000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ände-till-ände: auth-gatens renderväg (ADR-037) utökas — kall/stale start visar Förberedelseskärmen driven av Startvärmningsmotorn tills släpp; varm start är HELT tyst (persist-kontraktet orört); offline-start går direkt in på sparad data; timeout släpper tyst. Appnivåns två nakna Laddar…-textrader (appstarts-gaten + rot-Suspense-fallbacken) ersätts av skärmen. Täcker användarberättelser: 2, 3, 4, 5 (PRD TASK-218).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Kall/stale start: Förberedelseskärmen visas tills warmup släpper; därefter färdigt Hem utan skeleton och omedelbara flikbyten
- [x] #2 Varm start helt tyst och offline-start direkt in — befintliga persist-E2E-AC:n gröna oförändrade
- [x] #3 Appnivåns två nakna Laddar…-textrader borta (grep-bevis); ingen ny textrad införd
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
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
GATE-INTEGRATIONEN (src/main.tsx InnerApp): efter auth.isLoading===false OCH
useIsRestoring()===false (PersistQueryClientProviderns restore-försök klart)
avgörs varm/kall EN gång (StrictMode-säkrad via två refs):
queryClient.getQueryCache().getAll().length>0 = varm -> starta() anropas
ALDRIG, HELT tyst. Tomt = kall/stale (första besök ELLER restore kastade pga
buster/maxAge) -> starta(queryClient,{dataSource}) körs, Förberedelseskärmen
drivs av forloppsprenumeration tills slutlofte avgör (klar/timeout/offline
hanteras identiskt av gaten -- offline löser ut synkront i samma
mikrotask-kedja per startvarmningen.ts:s filhuvud, ingen duplicerad
online-check behövs). __root.tsx:s Suspense-fallback ersatt med samma
komponent i ett platshållar-0-läge (FORBEREDELSESKARM_VANTAR, hemvist i
Forberedelseskarm.tsx för att undvika cirkulär import main.tsx<->__root.tsx).

KONSTANT-DRIFT LÖST: HEM_SENASTE_AKTIVITET_ANTAL exporteras nu från
src/queries/keys.ts (datalagret -- motorn får aldrig importera UI) och
konsumeras av BÅDE SenasteAktivitet.tsx och startvarmningen.ts. Den tidigare
hårdkodade, ospårade dubbleringen (TASK-218.1:s bokförda kopplingsrisk) är
borta.

PERSIST-CACHE-SVITEN: AC1 (varm start) och AC4 (offline) är ARKITEKTURELLT
oförändrade -- varm-grenen kör noll extra kod, identisk med före denna
skiva. AC3:s TVÅ cold-cache-undertester (buster-mismatch, maxAge 24h) är
JUSTERADE som en DIREKT, nödvändig konsekvens av att Förberedelseskärmen nu
ersätter det gamla tre-status-mönstret för kalla starter -- main#main
monteras inte förrän warmup släpper. Detta är INTE ny kallstarts-täckning
(TASK-218.4s scope förblir orört) utan en minimal assertion-justering så att
suiten inte blir röd av en medvetet ändrad, korrekt UI. gcTime-undertestet
är ORÖRT (varm väg, cachen kastas aldrig där).

KÄND RISK, EJ LIVE-VERIFIERAD LOKALT: port 5173 (playwright.config.ts
E2E_DEV_PORT) är CORS-låst mot staging (supabase/functions/_shared/cors.ts,
env-driven allowlist, kan inte bytas till en annan port lokalt) och var hela
sessionen upptagen av en annan agents dev-server (PID 53825, worktree
.claude/worktrees/s106-aktivitetslogg-design, körde >2,5 h) -- kunde därför
INTE köra "kör åtminstone persist-cache-fallen" live lokalt trots upprepade
försök (bunden poll, ~24 min total). DoD-kvartetten (typecheck/biome/
build/test:api, 758 API-tester) är FAKTISKT körd och grön. AC1/AC2 vilar på
noggrann kod-läsning + arkitektonisk konstruktion (varm-grenen rör
bevisligen ingen ny kod), INTE en live e2e-körning. Rekommenderar att
orkestreraren/CI:s "Staging (API + E2E)"-jobb bekräftar
persist-cache.staging.test.ts (särskilt de två justerade AC3-undertesterna
och deras 12s-timeout mot startvärmningens 9s-tak) innan kortet stängs.

VARV 4 — CI-MASSAKERN PÅ #1343, ROTORSAK MÄTT (2026-08-15, byggagent):
CI run 31880913364 fällde "Test suite / Acceptance (hermetisk)" massivt
(30/36 röda redan i hem.acceptance.test.ts, hela jobbet slutligen CANCELLED
efter 12 min). TVÅ separata, lagrade buggar hittades via lokal körning +
tillfällig console-instrumentering (page.on('console'/'pageerror'),
återställd efter diagnos) — INTE mission-hypotesens 9s-timeout-teori, som
föll vid granskning (starta()s hårda timeout kan aldrig hänga längre än
9000ms, för kort för att ensamt förklara massakern):

BUGG 1 (fixturvärlden): warmup-setets sju EF-anrop är BARA delvis mockade i
tests/support/fixturvarld/handlers.ts:s normalläge (events/registrations/
activityLog fanns; waitlist/intresserade/maillog/segment saknades). Eftersom
den hermetiska fixturvärlden ALLTID startar kall (tom localStorage per test
— dokumenterad invariant, hem-laddlage.acceptance.test.ts:s eget filhuvud:
"varje test där får en FÄRSK kontext med tom localStorage") körde starta()
på VARJE autentiserad sidladdning, och de fyra omockade EF-anropen fällde
hermetik-vakten med OmockadRequestError — testet dog innan sidan ens hann
rendera. FIX: lade till de fyra saknade handlarna i handlers.ts:s normalläge
som tomma listor (samma mönster som redan EVENT_ATTACHMENTS_RESPONSE och
mer-segment.acceptance.test.ts:s {segments:[]}) — designtrogen enligt
uppdragets egen ram (fixturvärlden SKA svara på warmup-setets alla anrop);
kolliderar inte med de fyra sviter som äger riktigt innehåll via egna
network.use()-överskuggningar (override vinner alltid, hermetic.ts §
"Överskugga en delad handler").

BUGG 2 (main.tsx, INGEN testfix — regression i själva gate-integrationen):
den BEFINTLIGA (pre-218.3, K4.3) router.invalidate()-effekten triggar
ovillkorligt på auth.isLoading→false, oberoende av den NYA warmup-gaten.
Kommentaren i koden påstod "Under isLoading är <RouterProvider>
render-gate:ad (mountas ej)" — sant FÖRE denna skiva (enkel boolean-gate,
RouterProvider monterades i SAMMA render som isLoading föll). TASK-218.3
lade en ANDRA, async gate-fas (gate: 'vantar'→'varmar'/'redo') MELLAN dem
utan att uppdatera denna effekt. På den FÖRSTA renderingen efter
auth-resolution är gate.typ fortfarande 'vantar' (warmup-effekten är en
SYSKON-effekt, hinner inte köra setGate innan denna effekt läses) →
router.invalidate() körde beforeLoad mot routerns omonterade
context.auth===undefined → "TypeError: Cannot read properties of undefined
(reading 'isAuthenticated')" i _authenticated.tsx, fångad av SectionError
(routerns defaultErrorComponent) — på VARJE autentiserad sidladdning i
fixturvärlden. FIX: lade till `gate.typ === 'redo'` som extra villkor +
dependency i samma effekt. Verifierat att K4.3s ursprungliga scenarier
(oinloggad→redirect, login/logout efter mount) fortsatt fungerar: gate.typ
blir 'redo' SYNKRONT för oautentiserad/auth-yta (samma effekt-batch), och
förblir 'redo' permanent efter första auth-resolutionen (varmtBeslutat-reffen)
— invalidate() är därför säker vid BÅDA de ursprungliga scenarierna.
auth-flow.staging.test.ts (K4.3 Test 4/6) är en .staging.test.ts och kunde
INTE köras lokalt (kräver TEST_USER_EMAIL/PASSWORD mot staging) — resonerat
igenom manuellt, inte körd; CI:s Staging-jobb är fortsatt grinden för den.

MÄTT UTFALL LOKALT: full acceptance-svit 231/231 gröna, kördes TVÅ gånger
(3.3 min resp. 3.7 min) — en enskild flake ("dagar-kvar-pillen"-testet)
i mellanrunda ett, grön isolerat (6.1s) och grön i den andra fullkörningen;
inte reproducerbar, bedöms orelaterad till denna fix (samma test rörs inte
av diffen). test:acceptance:sjalvtest (positivt bevis, samma CI-jobb):
231/231 fällda med OmockadRequestError som orsak — oförändrat. DoD-kvartetten
om: typecheck 0 fel, biome 0 fel (0 träffar i de två rörda filerna),
build grön, test:api 758/758 gröna. test:webblasarbeteende (regression åt
andra hållet, fixen rör gate-logik): 58/58 gröna.

AC #1/#2 (Förberedelseskärmens produktbeteende vid genuin kallstart,
persist-e2e-sviten) rörs INTE av denna skiva och lämnas overifierade av
mig — samma avgränsning ursprungsbygget bokförde (port 5173/staging-CORS,
ej körbar lokalt denna session heller). CI:s Staging (API + E2E)-jobb är
fortsatt den avgörande grinden för dem.

Rörda filer: src/main.tsx (invalidate-effektens villkor+dependency,
BUGG 2), tests/support/fixturvarld/handlers.ts (fyra nya EF-mockar i
normalläget, BUGG 1). Ingen ändring i produktbeteende utöver att appen
inte längre kraschar — Förberedelseskärmens design (ADR-112) är orörd.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad i PR #1343 (slutcommit de262db4, MERGED på main 817979a8) efter fyra CI-varv där varje rött var en äkta fångst: (1) oinloggade ytor skymdes — pathname/session-gate; (2) sessionsbärande auth-ytor (invite/recovery) skymdes — auth-ytelistan; (3) acceptance-massakern avslöjade TVÅ lagrade fel: fixturvärldens mockgap (3/7 warmup-EF:er) OCH en genuin produktionsregression (router-invalidate mot odefinierad auth-kontext under gatens väntfas). Slutläge: acceptance 231/231 ×2, webbläsar 58/58, api 758/758, DoD grön, merge-gruppens staging-jobb grönt. Konstant-driften löst (delad export). Känd öppen avgränsning → uppföljningskort: post-login-skärmen kräver router-medveten trigger; appstarts-fallet (Lottas PWA-vardag) täcks fullt.
<!-- SECTION:FINAL_SUMMARY:END -->
