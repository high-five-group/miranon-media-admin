---
id: TASK-285.6
title: >-
  Skiva: Offline-beskedet som överlagrad notis — samma primitiv, ingen knapp,
  stapling definierad
status: To Do
assignee: []
created_date: '2026-08-21 11:08'
updated_date: '2026-08-21 15:46'
labels:
  - ready-for-agent
dependencies:
  - TASK-285.1
parent_task_id: TASK-285
ordinal: 521000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: när Lotta tappar nätet visas 'Du är offline' som samma lilla överlagrade notis nere till höger som uppdateringsnotisen — inte längre en orange helbreddsrad som trycker ner sidan. Den har ingen knapp, en mening om vad som fungerar och inte, och försvinner av sig själv när anslutningen är tillbaka (det är den enda notisen som får stängas utan användarens val — orsaken är borta). Skärmläsaren får beskedet artigt. Finns både en ny version och offline samtidigt staplas de i samma region, offline överst, utan att någon av dem trycks utanför skärmen på 390 px.

FORMEN: Notis-primitiven ur 285.1, låst i facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis — återanvänd, inte ny. Formen är Marcus-låst för uppdateringsnotisen; offline-beskedet är en ny konsument av samma form och granskas som egen yta av Marcus i stämplings-skivan. Mekanismen (online/offline-lyssnaren och role=status-regionen) är oförändrad ur OfflineIndicator; bara renderingen byter. Helbreddsraden rivs ur skalet.

Täcker användarberättelser: 7
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Offline-beskedet renderas av Notis-primitiven och är identisk med facit tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json ytan uppdateringsnotis i form (samma kort, samma placering), med innehållet 'Du är offline' + en mening och utan knapp
- [x] #2 Helbreddsraden i skalet är borta; layoutförskjutningen vid offline-övergång är 0 mätt med layout-shift i testmiljön
- [x] #3 Beskedet försvinner när anslutningen är tillbaka; region role=status alltid monterad, aria-live=polite, fokus flyttas aldrig
- [x] #4 Offline + ny version samtidigt staplas i regionen (offline överst) och båda är helt synliga vid 390 px ovanför TabBar-pillen — skärmdump bilagd
- [x] #5 Befintliga e2e-/webbläsarbeteende-tester som läser offline-läget är uppdaterade i samma commit och gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Facit-granskning gjord mot manifesten tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json och tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json (sökvägarna utskrivna i PR:en) — aldrig mot minne eller bildkatalog
- [ ] #6 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter), ADR-103 B4
- [x] #7 Test-konsument-svepets träffyta bilagd (grep-svep över testfiler som konsumerar ytan) och alla träffar uppdaterade i samma skiva som sin flip
- [x] #8 Inga nya design-tokens uppfunna; inga hårdkodade färger utanför appfel-sidan (vars inline-form är designvillkoret)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
FACIT-GRANSKNING (DoD #5): läst i sin helhet mot
`tasks/sessions/bilagor/s109-uppdateringsnotis-konvergens/facit.json`
(ytan `uppdateringsnotis`) och
`tasks/sessions/bilagor/s109-meddelandefamiljen-konvergens/facit.json`
INNAN design. Offline-beskedet återanvänder `Notis`-primitiven ordagrant —
ingen ny variant.

STAPLING (AC #4): löst utan portaler/DOM-omplacering. `AppUpdateBanner`
publicerar sin FÄRDIGA (avfärdnings-/chunk-medvetna) synlighet via en ny
delad modul `src/lib/uppdateringsnotis-synlighet.ts` (samma
subscribe/read-mönster som `app-uppdatering.ts`/`chunk-laddningsfel.ts`).
`Notis` fick en ny prop `staplad?: boolean` som växlar kortets `bottom`
mellan `bottom-24` (facit, ostaplad) och `bottom-[229px]` (staplad — mätt
värde: 96px bas + uppdateringsnotisens RIKTIGA renderade höjd 121px, mätt
live mot dev-servern vid BÅDA 390px och 1280px [identisk höjd, kortets
bredd är konstant `max-w-[22rem]`] + 12px mellanrum). Uppdateringsnotisens
EGEN plats (`bottom-24`) rörs ALDRIG av stapling — bara offline viker undan.
Verifierat med riktiga komponenter (Playwright, se
tests/webblasarbeteende/offline-notis.test.ts) OCH manuellt i browser:
offline top=517/bottom=615, uppdatering top=627/bottom=748 vid 390×844 —
12px mellanrum, båda helt inom viewport. Skärmdump:
`tasks/sessions/bilagor/task-285-6-stapling/offline-plus-uppdatering-390px.png`.

DoD #6 (ariaSnapshot-paret) lämnas OKRYSSAD, avsiktligt — samma skäl som
TASK-285.5 dokumenterade för chunk-bannern: offline-beskedet gick ALDRIG
igenom en `?variant`-prototyp/konvergens (facit.json:s `uppdateringsnotis`-
yta är låst för UPPDATERINGSNOTISEN, inte för offline — offline är en NY
konsument av samma redan-låsta form). Det finns inget variant-läge att
snapshotta FÖRE för att jämföra mot EFTER. N/A, inte glömt.

FILER RÖRDA UTANFÖR DEN EXPLICITA ÄGARLISTAN (uppdraget listade AppShell.tsx,
AppUpdateBanner.tsx, OfflineIndicator.tsx, "notis-regionen"):
1. `src/routes/dev/primitives.tsx` — la till `<OfflineIndicator />` (samma
   rad, samma mönster som `ChunkBanner` TASK-285.5 redan etablerade där).
   Skälet: `OfflineIndicator` lever bara i `AppShell` (inloggat skalet),
   och `/dev/primitives` är den enda hermetiska, autentiseringsfria vägen
   in för `webblasarbeteende`-klassen. Minimal diff: en import-tillägg,
   en JSX-rad, en kommentar.
2. `src/lib/uppdateringsnotis-synlighet.ts` — NY fil, inte i ägarlistan
   men en nödvändig konsekvens av stapling-kravet (AC #4).
3. `tests/e2e/shell.staging.test.ts` — EN BEFINTLIG TEST FÖLL strukturellt:
   `getByRole('status').filter({hasText:'Du är offline'}).toBeVisible()`
   antog den GAMLA formen (normal-flow `<p>`, som expanderar sin förälders
   box). Med `Notis`-primitiven är kortet `position:fixed` och bidrar ALDRIG
   till förälderns (den alltid-monterade `role=status`-regionens) utbredning
   — exakt samma invariant som `app-update-banner.test.ts` redan dokumenterar
   för uppdateringsnotisen ("regionen har... noll utbredning även när barnet
   syns"). Fixat genom att skopa `toBeVisible()` till kortet
   (`getByTestId('offline-notis')`) i stället för regionen — samma mönster
   som den redan etablerade uppdateringsnotis-sviten. Verifierat grönt,
   både isolerat och i hela filens svit (9/9 mot skarp staging).

TEST-KONSUMENT-SVEPETS TRÄFFYTA (DoD #7): grep-svep för `setOffline`,
`OfflineIndicator`, `onlineManager`, "Du är offline", `border-warning` över
hela `tests/`. Träffar: `tests/e2e/shell.staging.test.ts` (FIXAD, se ovan),
`tests/e2e/persist-cache.staging.test.ts` (ingen assertion mot
OfflineIndicator-formen; scopar redan till `main#main`, dit den fixed-
positionerade regionen aldrig renderar — opåverkad, verifierat grönt/skip),
`tests/e2e/pwa-offline.staging.test.ts` (ingen koppling till
OfflineIndicator alls — testar cachat skal på /login, opåverkad, verifierat
grönt/skip), `tests/e2e/event-detail.staging.test.ts` (kommentar nämner att
OfflineIndicator "bär också role=status" — fortfarande sant, ingen ändring
behövd).

MASKINLAST/STAGING: `npm run test:api` (933/933) och samtliga
`chromium-authenticated`-körningar (shell.staging.test.ts 9/9,
persist-cache/pwa-offline offline-relaterade tester) kördes MOT SKARP
STAGING utan blockering eller override — semaforen var öppen vid
körningstillfället.

PREMISS-PASS: `main` hade gått vidare från uppdragets 5812299f till
`a024ad96` (TASK-287 + TASK-285.11-relaterade commits) under byggets gång.
Ingen konflikt: TASK-287 rörde `.facit-policy.conf` +
`scripts/check-facit.sh` (nya prototyp-markörer), noll överlapp med mina
filer — `check-facit.sh` grönt efter rebase (12 manifest, 27 ytor, 9
markörer verifierade kvar).
<!-- SECTION:NOTES:END -->
