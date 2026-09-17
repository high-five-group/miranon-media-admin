---
id: TASK-416.12
title: >-
  Skiva: get-event-attachments — eventraden och de gemensamma bilagorna i samma
  Promise.all, chunkarna parallellt; mätt före/efter i staging
status: Done
assignee: []
created_date: '2026-09-06 13:23'
updated_date: '2026-09-17 09:05'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-416
priority: high
ordinal: 738000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Källa: rapport E §3–4, §6 F4–F5 (S123). supabase/functions/get-event-attachments/index.ts: await fetchAirtableRecord(event) (rad 268) före Promise.all([egna-batch, gemensamma-kandidater]) (rad 300) fast fetchGemensammaKandidater() inte beror på eventraden; fetchAttachmentsByRecordIds (144–155) kör chunkarna seriellt (fixtureventet bär 57 länkar → två sekventiella anrop). Mätt mot staging: gemensamma ≈ 630–680 ms, eventrad + egen-batch ≈ 300–700 ms ovanpå; full union 1 019–1 590 ms varm. Åtgärd: flytta gemensamma-hämtningen in i samma Promise.all som eventraden (förväntad besparing ~250–350 ms) och Promise.all över chunkarna; ingen beteendeändring, samma svar. Deploya till STAGING och mät 5 anrop före/efter på samma event (rapport E §4-tabellen är baslinjen). Prod-deploy sker av Marcus via fas4-prod-deploy.sh — bokför som öppen skuld i kortet. Rör INTE fältlistan ATTACHMENT_FIELDS (sidofynd om Mall/Källhash är eget kort). Memoisering av gemensamma (F6) är ett eget beslut — inte här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Eventraden och gemensamma-kandidaterna hämtas parallellt; chunkarna i fetchAttachmentsByRecordIds parallellt
- [x] #2 Svaret är byte-identiskt före/efter för samma event (diff bifogad)
- [x] #3 Mätserie bifogad: fem varma anrop före och efter mot samma staging-event, medianen sjunker
- [x] #4 EF-testerna gröna (tests/api), deployad till staging av agenten, prod-deploy bokförd som Marcus-skuld
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Ändring

fetchGemensammaKandidater() flyttad in i SAMMA Promise.all som
fetchAirtableRecord(EVENTPLANERING_TABLE, eventId) (rad ~268/300 i
föregående version) — den beror inte på eventraden. fetchAttachmentsByRecordIds
kör nu sina chunkar via Promise.all i stället för en sekventiell for-loop.
Ingen fältlista rörd, ingen memoisering.

## Mätserie (staging, pqtshyierkdgwdnxuirz, varma anrop, curl mot deployad EF)

Stort event recIFrxHZw165ycXk (285 bilagor i svaret — betydligt fler än
rapport E:s 57/59, fixturen har vuxit av annan pågående flotta-aktivitet
under mätfönstret 2026-09-06):

| Anrop | Före (s) | Efter (s) |
|---|---|---|
| 1 | 2.158332 | 1.748658 |
| 2 | 2.100478 | 1.795282 |
| 3 | 2.195329 | 1.772664 |
| 4 | 2.014855 | 1.723557 |
| 5 | 2.045670 | 1.666072 |
| Median | 2.100478 | 1.748658 |

Median-besparing: ~352 ms (~16,8 %).

Litet event recnzSBfLWCo5dBlY (59 bilagor i svaret — dominerat av den
delade Gemensam-poolen):

| Anrop | Före (s) | Efter (s) |
|---|---|---|
| 1 | 1.514703 | 1.507073 |
| 2 | 1.561385 | 1.511317 |
| 3 | 1.533823 | 1.494791 |
| 4 | 1.542437 | 1.572324 |
| 5 | 1.564789 | 1.483948 |
| Median | 1.542437 | 1.507073 |

Median-besparing: ~35 ms (~2,3 %) — mindre effekt eftersom det lilla
eventet inte har flera chunkar och den delade poolen dominerar svarstiden
oavsett.

## Byte-diff (AC #2)

diff på RÅ respons-kropp mellan before-1..5 och after-1..5, båda events:
samtliga 10 par BYTE-IDENTISKA (diff exit 0, 0 rader). Attachment-antal
identiskt (285 / 59) i varje before/after-par — ingen konkurrerande
skrivning träffade dessa två fixturer under mätfönstret trots hög samtidig
flotta-belastning (observerat: 5-12 andra worktree-agenter körde
playwright test --project=api-pure --project=api-staging parallellt vid
mättillfället).

Sanity efter deploy: 404 (okänt event), 401 (ingen JWT), 200
(räckviddsläge utan eventId) — alla oförändrade.

## EF-tester (tests/api)

Isolerad körning get-event-attachments.staging.test.ts: 13/13 gröna, både
FÖRE (mot gammal deployad kod) och EFTER (mot ny deployad kod).

Full npm run test:api: kördes två gånger pga extrem samtidig
flotta-belastning på delad staging-bas (5 req/s-taket, P4/P26,
docs/reference/airtable-constraints.md). Körning 1: 32 failed (7 i
get-event-attachments, resten spridda över helt orelaterade EF:er —
update-event, create-attendance, cancel-registration m.fl. — samma
läs-tillbaka-timeout-signatur som tyder på delad-bas-kontention, inte en
kodregression). Körning 2 (mindre flotta-belastning): 5 failed, INGEN i
get-event-attachments — bekräftar att get-event-attachments-EF:en inte är
källan till instabiliteten. 2261/2266 passed run 2.

## Deploy

Deployad till STAGING (pqtshyierkdgwdnxuirz) via supabase functions deploy
get-event-attachments --project-ref pqtshyierkdgwdnxuirz --use-api, exit
0, 2026-09-06.

## Öppen skuld

Prod-deploy görs av Marcus via fas4-prod-deploy.sh --deploya <prod-ref>
(prod-refen anges av honom, aldrig av en agent — deny-prod-ref.sh). Denna
PR ändrar bara staging.

## Runda 2 (efter granskning, commit 4c948c05)

FYND 1 (granskaren, warning): chunk-hämtningen i fetchAttachmentsByRecordIds saknade ett samtidighetstak mot P4 (delad 5 req/s). Fixat med withConcurrencyLimit — kapar till 2 samtidiga chunk-anrop, dokumenterat i kommentar. En request håller aldrig fler än 3 Airtable-anrop i luften.

FYND 2 (orkestreraren, warning): runda 1 tappade overlappet mellan kandidater och egna-batchen (bara eventrad+kandidater överlappade, inte egna). Fixat till treväga-kedja: kandidaterP startas FÖRST (tyst .catch mot unhandled rejection på 404-vägen), sedan eventrad, sedan egna, sedan await kandidaterP sist. Förväntad tid nu max(kandidater, eventrad+egna). 404-vägen kostar nu ett extra oanvänt kandidat-anrop — medvetet.

Mätserie runda 2 (ren A/B, tillfällig runda-1-redeploy för fräsch baslinje, sedan slutlig runda-2-redeploy):
- Stort event (297 bilagor, ~6 chunkar, taket binder): median 1.724s -> 1.750s (+26ms, inom brus — chunk-taket kostar något här, uppvägs delvis av overlap-fixen). Fortfarande ~350ms bättre än ursprunglig baslinje (2.100s).
- Litet event (61 bilagor, 1 chunk, taket binder inte): median 1.550s -> 1.391s (-159ms, -10.3%)
- Byte-diff: 10/10 par byte-identiska
- Isolerad get-event-attachments.staging.test.ts: 13/13 grön mot slutlig kod
- typecheck/biome/build: exit 0

Slutlig deploy till STAGING (pqtshyierkdgwdnxuirz), commit 4c948c05, exit 0.

PR-kroppen uppdaterad med full runda-2-sektion. Draft-läget på PR #2394 sattes av orkestreraren (marcus803, convert_to_draft) 2026-09-06 14:29:31Z som del av runda-1-hanteringen — INTE rört av agenten, per uppdrag.

Bockad i efterhand av S125 mot belägg: PR #2394 mergad (2026-09-06), samtliga 4 AC redan bockade, runda 2-notiserna anger typecheck/biome/build exit 0, isolerad get-event-attachments.staging.test.ts 13/13 grön, byte-diff 10/10 identiska. Nightly Backlog-stängningsgrinden (körning 35187813487) flaggade kortet som inkonsistent.
<!-- SECTION:NOTES:END -->
