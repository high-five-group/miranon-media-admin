---
id: TASK-218.3
title: >-
  Skiva: Gate-integrationen — skärm + motor i auth-gaten, appnivå-textraderna
  ersätts
status: In Progress
assignee: []
created_date: '2026-08-15 08:47'
updated_date: '2026-08-15 10:38'
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
- [ ] #1 Kall/stale start: Förberedelseskärmen visas tills warmup släpper; därefter färdigt Hem utan skeleton och omedelbara flikbyten
- [ ] #2 Varm start helt tyst och offline-start direkt in — befintliga persist-E2E-AC:n gröna oförändrade
- [x] #3 Appnivåns två nakna Laddar…-textrader borta (grep-bevis); ingen ny textrad införd
- [x] #4 DoD-kvartetten grön (test:api, typecheck, biome, build)
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
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
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ADR-037-gaten (src/main.tsx InnerApp) utökad med en warmup-fas EFTER
auth.isLoading===false OCH useIsRestoring()===false: varm cache (queryClient
har redan data efter restore) -> starta() anropas ALDRIG, helt tyst. Tomt
cache (första besök ELLER buster/maxAge-kastad restore) -> starta(queryClient,
{dataSource}) körs, Förberedelseskärmen visas och drivs av
forloppsprenumeration tills slutlofte avgör (klar/timeout/offline hanteras
identiskt -- offline löser ut synkront, ingen duplicerad online-check).
Appnivåns två nakna "Laddar..."-rader (main.tsx-gaten + __root.tsx:s
Suspense-fallback) ersatta av samma Förberedelseskärm-komponent (grep-bevis:
noll träffar på levande "Laddar..."-JSX i src/). Konstant-driften mellan
SenasteAktivitet.tsx och startvarmningen.ts löst: HEM_SENASTE_AKTIVITET_ANTAL
exporteras nu från src/queries/keys.ts (datalagret), båda konsumerar samma
export. DoD-kvartetten grön (typecheck/biome/build/test:api, 758 API-tester).
AC3:s två cold-cache-persist-tester justerade (Förberedelseskärmen ersätter
gamla tre-status-mönstret) som direkt, nödvändig konsekvens -- INTE ny
kallstarts-täckning (TASK-218.4). Persist-cache-sviten kunde INTE köras live
lokalt (port 5173 CORS-låst mot staging, upptagen av en sibling-agents
dev-server hela sessionen, bunden poll ~24 min utan resultat) -- CI:s
Staging-jobb är den återstående, obekräftade grinden för AC1/AC2 och de
justerade AC3-testerna. PR öppnad och armerad mot main; CI-verifiering och
Done-flipp ägs av orkestreraren.
<!-- SECTION:FINAL_SUMMARY:END -->
