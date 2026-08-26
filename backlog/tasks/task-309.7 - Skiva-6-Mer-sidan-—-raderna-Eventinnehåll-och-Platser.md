---
id: TASK-309.7
title: 'Skiva 6: Mer-sidan — raderna Eventinnehåll och Platser'
status: Done
assignee: []
created_date: '2026-08-23 14:27'
updated_date: '2026-08-24 17:04'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.3
parent_task_id: TASK-309
ordinal: 568000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Roger och Lotta underhåller standardtexter per Event × Eventtyp och platsernas uppgifter på Mer-sidan, utan att röra redan skapade bilagor. Täcker användarberättelser: 18, 19, 29.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mer-sidans verktygsgrupp bär två nya rader bredvid Dokument: Eventinnehåll och Platser, med samma radform som grannarna (Del 2 § D beslut 10)
- [x] #2 Eventinnehåll-ytan listar de sju kombinationerna och låter standardtexterna (inkl. agendan rad för rad) redigeras med samma block-dialog som genereringsvyn — ingen andra dialogform; sparar via skiva 2
- [x] #3 Platser-ytan listar platser, låter adress/parkering/transport/kläder redigeras och nya platser skapas; sparar via skiva 2
- [x] #4 Tillgänglighet 11 (fokusordning, etiketter, reduced-motion, prefers-contrast), acceptance-test per yta, ariaSnapshot
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Prod-schemaändringar endast efter Marcus GO i klartext per tabell (ADR-125 § 8)
- [x] #6 Ingen HTML byggs i klienten; lagervakten (ADR-057) grön
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-08-23 — Skiva 6 byggd. Prefaktorering FÖRST (egen commit 89df534d):
block-dialogen (ProtoDialog/BlockDialog/AgendaEditor/DatumEnkel/Kryss) och
blockkartan (GRUPPER/BlockDef/INFORUTA_IDN) utbrutna ur GenereringsPrototyp.tsx
till src/components/dokument/BlockDialog.tsx + blockDefinitioner.ts, VERBATIM
flytt (bevis: typecheck/biome/build/check-langa-streck gröna genom hela
extraktionen; ingen dedikerad facit-/acceptance-svit täcker idag den
DEV-grindade ?variant=a-prototypytan, så fidelitet vilar på transkription +
den mekaniska treenigheten, inte en levande ariaSnapshot-diff).

Skiva 6 (commit 544c3ec3): två nya EF:er (get-event-contents, get-places,
GLOBAL lista, speglar get-event-formats), save-place-standard utökad med två
event-lösa lägen (platsId-uppdatering, namn-skapelse med valfri falt för
Platser-ytans "ny plats"-tvåstegsflöde). Klientlager: SavePlaceInput-schema,
AirtableAdapter/DataSourceAdapter/SupabaseAdapter-metoder,
useSavePlace/useEventinnehallList/usePlacesList-hooks, useSaveEventContent
utökad att invalidera eventinnehall.list också. BlockId utökad med 'tid'
(additiv, rör inte GRUPPER). Två nya Mer-ytor (EventinnehallYta/PlatserYta)
+ routes + NavCard-rader.

PREMISS-DIVERGENS (bokförd öppet, ADR-086): uppdraget sa "kolla om #1874
landat, basera på main annars på grenen". #1874 var OLANDAD vid start →
basera på origin/task-309.3-eventinnehall-skrivvagar, som uppdraget
förutsåg. #1874 LANDADE (+ #1877 task-309.4-renderaren ovanpå) MEDAN jag
byggde — mergade in senaste origin/main före push (merge-commit e537216e),
löste EN konflikt (CONTRIBUTING.md, samma sentinel-räknings-stycke). Detta
avslöjade att 9 av mina ursprungliga test:api-körningars "röda" var STALE
testfiler (test-docraptor-render-utkast.staging.test.ts m.fl. RIVNA av
#1877, min gren hade den gamla kopian) — efter mergen: 1138 passed, 2 kvar
(preview-receipt.staging.test.ts, dokumenterad ÖPPET BOKFÖRD
TÄCKNINGSFÖRLUST i testfilens egen kommentar, TASK-306, orört av mig,
verifierat via `git diff` = tomt för den filen).

Alla tre EF:er (get-event-contents, get-places, save-place-standard)
deployade till staging (pqtshyierkdgwdnxuirz) och API-testade LIVE (20/20
gröna). Två acceptance-sviter (lista/dialog/spara/tangentbord/ariaSnapshot/
axe 0 violations) gröna. mer-index.staging.test.ts uppdaterad 8→10
NavCard-rader (körd LIVE mot staging, MM_STAGING_PREFLIGHT=off en gång pga
samtidig CI-körning på main — bedömt säkert: läsande, ingen datamutation
— sedan grönt utan override). Ny purge-target
save-place-standard-event-los-platser-sentineler + purge-guard-test med
negativ kontroll körd (fälla-och-rätta bevisat).

Ej byggt/prövat: DoD #6:s "lagervakten (ADR-057)" — ingen dedikerad
CI-grind hittad under det namnet; verifierat manuellt via grep att inga nya
filer bygger HTML-strängar eller använder dangerouslySetInnerHTML.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Skiva 6 gav Mer-sidan raderna Eventinnehåll och Platser, med samma radform som grannarna. Eventinnehåll-ytan listar de sju kombinationerna och låter standardtexterna inklusive agendan redigeras med SAMMA block-dialog som genereringsvyn (ingen andra dialogform); Platser-ytan listar platser, låter adress/parkering/transport/kläder redigeras och nya platser skapas. Båda sparar via skiva 2:s skrivvägar. Två nya EF:er (get-event-contents, get-places) plus save-place-standard utökad med två event-lösa lägen för Platser-ytans tvåstegsflöde. Block-dialogen och blockkartan bröts först ut VERBATIM ur GenereringsPrototyp till src/components/dokument/BlockDialog.tsx och blockDefinitioner.ts (prefaktorering, egen commit 89df534d).

BARS AV: PR #1879, commits 89df534d + 544c3ec3, head 369c0a8e (MERGED 2026-08-23T18:15Z, 33 filer).
GRIND-UTFALL: 12 CheckRuns SUCCESS + 3 SKIPPED på head-commiten 369c0a8e — noll icke-gröna. Landad via merge-kön.

RÄTTELSE AV BYGGNOTERINGENS ÖPPNA PUNKT (mätt 2026-08-24): byggnoteringen ovan skrev att DoD #6:s lagervakt inte gick att köra — "ingen dedikerad CI-grind hittad under det namnet" — och föll tillbaka på manuell grep. Det var ett SÖK-MISS, inte en saknad grind. Vakten finns mekaniskt: `tests/api/attachment-layer-independence.test.ts` ("Bilage-lager-oberoendets mekaniska vakt", ADR-057 klausul a + c), körd i api-pure-projektet utan creds. Körd skarpt 2026-08-24: 7/7 gröna, exit 0, inklusive tvåvägsbevis — detektorn fäller på en konstruerad överträdelse OCH på en konstruerad temp-fil på disk (hela walk+scan-kedjan), och släpper igenom oskyldig text. DoD #6 är därmed MEKANISKT belagt, inte grep-belagt.

DoD-belägg: #1 fyra av fyra AC bockade · #2 CI-jobben "Lint + Audit + TypeCheck" och "Test suite / Pure + Build" SUCCESS på exakt 369c0a8e · #3 rollupen ovan · #4 33 filer, samtliga inom skivans scope (två nya ytor med routes, EF:er, adaptrar, hooks, scheman, acceptance- och staging-tester, purge-target, kortet) · #5 diffen bär noll prod-schemaoperationer; prod-schemat skapades först i TASK-309.9 efter Marcus GO (commit 2290fa8f) · #6 se rättelsen ovan.

Den nya purge-targeten `save-place-standard-event-los-platser-sentineler` (Platser, Namn, ^ZZ-TASK-309.7-) verifierad 2026-08-24 via `node scripts/test-purge-staging-sentinels.mjs`, exit 0, med explicit disk-assertion.

Stängd av orkestrerad stängningsagent 2026-08-24 mot post-merge-bevis.
<!-- SECTION:FINAL_SUMMARY:END -->
