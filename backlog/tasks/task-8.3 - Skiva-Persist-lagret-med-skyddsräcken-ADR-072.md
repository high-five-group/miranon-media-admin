---
id: TASK-8.3
title: 'Skiva: Persist-lagret med skyddsräcken (ADR-072)'
status: In Progress
assignee: []
created_date: '2026-07-11 22:55'
updated_date: '2026-07-12 12:44'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-8
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Query-cachen persistas på enheten så att appen öppnar med senast kända data direkt — kallstarten upphör i praktiken (Marcus-kravet 'det ska bara vara där'). Styrs av ADR-072; icke-UI-mekanism (ingen ny synlig yta — effekten är att laddläget FÖRSVINNER vid varm start). Beteende ände-till-ände: appstart med tidigare besök på enheten renderar Hem med senast kända data omedelbart, medan en tyst bakgrundshämtning uppdaterar per osynlighets-mekaniken (restaurerad data är stale per gällande staleTime — poll-lagrets kontrakt ADR-017 ändras INTE); utloggning tömmer den persistade cachen via queryClient.clear()-mönstret (ALDRIG manuell nyckel-radering — den racear mot throttle-synken ~1 s, maintainer-bekräftat); cache skriven av annan app-version kastas vid restore (buster = den build-injicerade versionen, samma källa som versionsraden); maxAge 24 h och gcTime ≥ maxAge för persistade queries (dokumenterad GC-fälla); offline-öppning visar restaurerad data (pwa-offline-svitens precedent). Befintliga e2e-sviter förblir gröna — persist får inte läcka tillstånd mellan tester eller ändra poll-beteendet. Täcker användarberättelser: 1, 4, 8, 9, 10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Varm start (tidigare besök på enheten) renderar Hem med senast kända data direkt utan synligt laddläge, med nätverksnivå-bevisad tyst bakgrundshämtning (e2e)
- [x] #2 Utloggning tömmer persistad cache — efter logout→login finns ingen tidigare data i lagringen (e2e via auth-flödes-ytan)
- [x] #3 Skyddsräckena på plats: buster = build-injicerad app-version, maxAge 24 h, gcTime ≥ maxAge för persistade queries — och poll-lagrets befintliga e2e-svit grön (kontraktet orört)
- [x] #4 Offline-öppning visar restaurerad data (pwa-offline-svitens mönster)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Persist-lagret (2026-07-12, T76-pilot A2)

### Form (ADR-072 realiserad)

- `src/queries/persist.ts` (NY): synkron localStorage-persister (`createSyncStoragePersister`) + `persistOptions` — buster = `__APP_VERSION__` (build-injicerad, samma källa som versionsraden), maxAge 24 h, exporterad `PERSIST_MAX_AGE_MS`. Selektiv persist (`shouldDehydrateQuery`) dokumenterad som EJ inkopplad ratt (beslut 6).
- `src/main.tsx`: `QueryClientProvider` → `PersistQueryClientProvider` (provider-formen per PRD-beslut 1); allt annat i bootstrappen orört.
- `src/router.ts`: global `gcTime` 30 min → `PERSIST_MAX_AGE_MS` (skyddsräcke 2, GC-fällan).
- `src/components/hem/useDashboardData.ts`: poll-lagrets `gcTime` 300_000 → `PERSIST_MAX_AGE_MS`. Öppet bokfört i koden: ADR-072 skyddsräcke 2 ersätter ADR-017-erratum §4-VÄRDET så länge hela cachen persistas; poll-BETEENDET (60s-intervall, staleTime 30s, fokus-semantik) orört — bevisat av grön hem-svit (33 tester inkl. polling + task-4.5-osynligheten).
- `src/auth/AuthProvider.tsx`: `logout()` kör `queryClient.clear()` EFTER lyckad signOut (skyddsräcke 1, maintainer-mönstret — aldrig manuell nyckel-radering, race mot throttle-synken ~1 s).
- `docs/specs/STATE-STRATEGY.md` §1+§3 synkade (gcTime-värdet + persist-noten; kodblockets hemvist rättad till src/router.ts).
- Beroenden: EXAKT @tanstack/react-query-persist-client + @tanstack/query-sync-storage-persister (5.101.2, koherenta med react-query 5.101.2).

### Bevis (tests/e2e/persist-cache.staging.test.ts, 6 tester)

- AC 1: varm start renderar sentinel-datat DIREKT medan EF-svaren står PARKERADE (håll-bar mock = nätverksnivå-bevisad tyst bakgrundshämtning; klocka +6 min gör restaurerat data stale per gällande staleTime) → släpp med ändrat data uppdaterar tyst.
- AC 2: logout via Mer-knappen → lagringen 0 dehydrerade queries, sentinel borta.
- AC 3: buster-fältet == package.json-versionen; främmande buster → kastas vid restore (kalla laddläget + återhämtning); 25 h-gammal payload → kastas (maxAge); GC-fälle-testet: 6 min inaktivitet (klient-side-nav + fake clock) behåller lagringen — och hem-sviten grön = poll-kontraktet orört.
- AC 4: byggd staging-preview (SW aktiv, riktiga läs-EF:er): offline-omladdning renderar restaurerad data utan laddläge/felläge; pwa-offline-sviten grön (regression).
- Falsifikations-pass (räcken bevisade vaktade): clear() urkopplad → AC 2-testet RÖTT på sin assertion (2 queries kvar); buster urkopplad → RÖTT (buster '' ≠ version); gcTime 300_000 → RÖTT (lagringen queries: [] — exakt GC-fällan).

### Metodnoter

1. gcTime-testet kräver KLIENT-SIDE-nav bort från Hem (page.goto omhydrerar med default-gcTime och prövar aldrig poll-lagrets override) + TVÅ fastForward-steg (steg 2 låter throttle-synken som schemaläggs UNDER steg 1 fyra — annars maskerar stale lagring GC:n).
2. AC 4 kör medvetet UTAN route-mockar (SW-fetch gör page.route opålitlig i preview) — assertionerna speglar renderat innehåll före/efter offline.
3. SW-guarden är härdad: getRegistration()-först ger instant skip i dev/CI (inga 15 s-fönster där dev-server-omladdning förstör evaluate-kontexten).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [ ] #5 Design-review: Marcus-granskning i webbläsaren av laddläget godkänd (per skiva med UI-yta; L220/L269)
- [ ] #6 Layout-skift ≈ 0 bevisad med renderad mätning före granskning (L245/L246; task-4.5-bevismönstret)
<!-- DOD:END -->
