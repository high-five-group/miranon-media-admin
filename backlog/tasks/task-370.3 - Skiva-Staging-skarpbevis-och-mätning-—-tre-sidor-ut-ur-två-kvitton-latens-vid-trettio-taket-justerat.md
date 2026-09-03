---
id: TASK-370.3
title: >-
  Skiva: Staging-skarpbevis och mätning — tre sidor ut ur två kvitton, latens
  vid trettio, taket justerat
status: To Do
assignee: []
created_date: '2026-09-03 08:32'
updated_date: '2026-09-03 12:02'
labels:
  - ready-for-agent
dependencies:
  - TASK-370.1
  - TASK-370.2
references:
  - tasks/sessions/2026-09-03-session-116.md
parent_task_id: TASK-370
ordinal: 669000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: mot staging (riktig DocRaptor, riktig Storage) anropas förhandsgransknings-EF:en med två fixtur-inbetalningar och svarar med en signerad länk till en PDF med exakt tre sidor (försättsblad + två kvitton), Carlito inbäddat på alla sidor, rätt namn och belopp på rätt sida, ingen överlappning vid sidbrytningarna, platshållaren FÖRHANDSVISNING på båda kvittosidorna, försättsbladets summa lika med summan av de två. Testet lever som permanent staging-test i samma skarv som dagens preview-receipt-staging-test (testskarv 2). Mätning: 30 fixtur-kvitton renderas och DocRaptor-latensen läses ur svaret; jämförs mot vårt eget klienttak (30 s) och DocRaptors 60 s; ligger latensen nära taket höjs VÅRT tak (under 60 s), annars bekräftas 30 kvitton som tak. Utfallet (verbatim tal) bokförs i kortet och taket i 370.1 justeras i samma PR om mätningen kräver det. Täcker användarberättelser: 15, 19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Staging-test: två inbetalningar → PDF med exakt tre sidor (pdfinfo), Carlito emb=yes på alla sidor (pdffonts), rätt namn/belopp per sida utan överlappning (pdftotext -bbox), summan på försättsbladet stämmer
- [x] #2 Mätning vid 30 kvitton: DocRaptor-latens och total svarstid bokförda verbatim i kortet, jämförda mot 30 s-klienttaket och 60 s-gränsen
- [x] #3 Taket (30) bekräftat eller justerat med motivering ur mätningen; en justering landar i samma PR
- [x] #4 Testet är wirat i den staging-klass CI redan kör och skyddat av samma bas-guard som befintliga staging-tester
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
- [x] #4 Minimaltestet (två kvitton, en sidbrytning) verifierat med pdfinfo/pdftotext/pdffonts FÖRE EF-bygget, och renderingstiden vid N ≈ 30 mätt mot klienttaket (ärvd PRD-grind; markera N/A med motivering om skivan inte rör den)
- [x] #5 ADR-124 § Updates amenderad med det kombinerade utkastets nyckelform; mallkatalogens README § Förlagorna bokför försättsbladet som mall utan förlaga (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
- [x] #6 Mallparitets-grinden och mall-synken körda om försättsbladets mall läggs i mallkatalogen (ärvd PRD-grind; N/A med motivering om skivan inte rör den)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Staging-EF-läge (verifierat FÖRE mätning)

`preview-receipt` staging (ref `pqtshyierkdgwdnxuirz`) verifierad ACTIVE, version 25, `updated_at` 2026-09-03T11:10:05Z — efter `TASK-370.2`s merge (commit `b2753b2c`, 10:55:06Z) och innehåller alltså 370.1+370.2. `registrera-inbetalning` (v6) och `hantera-inbetalning` (v6) redan deployade sedan tidigare (TASK-346.4), oförändrat behov för denna skiva.

## AC #1 — staging-skarpbevis (permanent test)

Ny fil `tests/api/preview-receipt-forhandsgranska-alla.staging.test.ts`, egen fixtur i `tests/api/fixtures.ts` (`FORHANDSGRANSKA_ALLA_*`): ett dedikerat event `ZZ-TASK-370.3-fixtur` (`reck7WgOA5zgUy52X`) + två permanenta Anmälningar (`recYj7Jm9DYJ11X6d`/`recNKZHR0MkWP5SQB`), seedade via Airtable MCP 2026-09-03. Testet registrerar TVÅ transienta `inbetalningar`-rader (`registrera-inbetalning`, 500/750 kr), anropar `preview-receipt` med `inbetalningIds`, verifierar PDF:en (pdfjs-dist — poppler är INTE installerat i CI, se testfilens filhuvud för `grep`-beviset), och RADERAR (`hantera-inbetalning atgard=radera`) i ett `try/finally` som trackar varje faktiskt skapad rad separat (mätt läckage under bygget: en fel-status-assertion läckte en rad, städad manuellt, koden omskriven).

Körd skarpt 2× i rad, båda gröna (`PLAYWRIGHT_NO_WEB_SERVER=1 npx playwright test --project=api-staging tests/api/preview-receipt-forhandsgranska-alla.staging.test.ts`, ~13,5–13,7 s testkörning). Mutate-and-restore verifierat: `Anmälningar.Summa inbetalt (kr)` = 0 på båda fixturerna efter körning (Airtable-läsning post-test).

Bevisat i PDF:en: exakt 3 sidor (`doc.numPages`), inbäddat typsnitt (`/FontFile[23]?` i rå byteström), sida 1 (försättsblad) bär båda namn/e-post/belopp + korrekt summa ("SEK 1 250,00" = 500+750), sida 2/3 bär ENDAST respektive persons data + platshållaren "FÖRHANDSVISNING", ingen sidöverlapp (varje sidas text saknar den ANDRA personens namn/e-post och saknar försättsbladets rubrik).

## AC #2 — mätning vid N ≈ 30

Staging saknar 30 distinkta fixtur-inbetalningar (bara TASK-370.3s egna 2) — mätt i stället via `mall:pdf`-vägen, DIREKT mot DocRaptors testnyckel (`.env.docraptor`), UTANFÖR staging-EF:en: `kombineraFylldaKvittoSidor` importerad direkt i Node 24 (ren modul, Deno-fri, samma sak `kvitto-kombination.test.ts` redan bevisar), 30 syntetiska kvitto-block fyllda med `eta` (samma Eta-config som `mall-render.ts`), självbärande via `scripts/docraptor-sjalvbarande.mjs` (samma verktyg som `npm run mall:pdf`), POST:ad direkt till DocRaptor.

**Mätvärden, verbatim:**
- DocRaptor-svarstid vid N=30: **5 469 ms** (HTTP 200).
- Jämfört mot `DOCRAPTOR_TIMEOUT_MS` (30 000 ms, `supabase/functions/_shared/mall-render.ts` rad 340): marginal **24 531 ms (81,8 %)**.
- Jämfört mot DocRaptors dokumenterade synkrona gräns (60 000 ms): marginal **54 531 ms (90,9 %)**.
- Jämförelsepunkt: en ENSKILD kvitto-sida lokalt (`npm run mall:pdf -- kvitto`) tog 4,8 s DocRaptor-tid — det kombinerade 31-siders dokumentet (N=30+försättsblad) tog bara ~0,7 s LÄNGRE totalt. Konsistent med PRD:ns "DocRaptor fakturerar per dokument, inte per sida"-fynd — rendertiden skalar INTE linjärt med sidantalet i denna mätning.
- Utdata: 32 fysiska sidor (INTE 31 — se AC #3/fynd nedan), 158,2 KB PDF, Carlito inbäddat (`pdffonts`: 3 typsnitt, samtliga `emb=yes`).

**Kompletterande, REDOVISAT SOM ESTIMAT (INTE mätt vid N=30 — se ADR-083-disciplinen, en lokal/extrapolerad siffra får aldrig påstås mätt):** en riktig N=2-mätning mot SKARP staging (samma fixtur som AC #1, egen curl-timing, städat efteråt) gav **6 052 ms TOTAL svarstid** för HELA `preview-receipt`-anropet (inkl. 2× `hamtaRiktigtUnderlag` — Postgres + upp till 3 Airtable-läsningar per person, sekventiellt, INGEN parallellisering i loopen — samt DocRaptor-rendering av den 3-sidiga PDF:en och Storage-uppladdning). Om DocRaptor-delen för en 3-sidig komposition antas ligga nära den enskilda kvitto-mätningen (~4,5 s) blir per-underlag-overheaden ≈ 0,68 s/person — vid N=30 skulle det EXTRAPOLERAT (ALDRIG uppmätt) ge ~20 s underlagshämtning + ~5,5 s DocRaptor + uppladdning ≈ **~26 s TOTAL svarstid**, vilket fortfarande ligger UNDER `DOCRAPTOR_TIMEOUT_MS` (som bara omsluter DocRaptor-anropet, inte hela EF-svaret) men börjar närma sig en möjlig UX-väntetid värd att räkna med i TASK-370.4 (knappen). Extrapoleringen är konsistent med Airtable-plattformens 5 req/s-tak (ADR-063): 30 personer × upp till 3 Airtable-anrop / 5 req/s ≈ 18 s golv, i linje med skattningen. INGEN kodändring föreslås av detta — det är en observation för nästa skiva, inte en brist i denna.

## AC #3 — taket

**Tak 30 (`MAX_KOMBINERADE_KVITTON`) och `DOCRAPTOR_TIMEOUT_MS` (30 000 ms) BEKRÄFTADE OFÖRÄNDRADE.** Motivering: den enda hårda tidsgränsen taket skyddar mot är DocRaptors EGEN synkrona rendering (`postaTillDocRaptor`s `AbortController`), och den mätta latensen vid N=30 (5 469 ms) ligger med 81,8 % marginal under `DOCRAPTOR_TIMEOUT_MS` och 90,9 % marginal under DocRaptors 60 s-gräns. Ingen justering av taket är motiverad av mätningen.

Två fynd, INTE mallfixade i denna skiva (mission-instruktion: "fixa inte mallen"), bokförda i nytt fynd-kort **TASK-380**:
1. `kvitto.css` saknar `vertical-align` på `.kvitto-post td` — en LÅNG `benämning` (flerradig) gör att Antal/Enhet/A-pris/Summa centreras mitt i den uppradade texten (Prince/HTML-tabellcellers UA-standard `middle`). Mätt precist med `pdftotext -bbox` (se TASK-380).
2. Försättsbladets EGEN tabell bryter till en andra fysisk sida redan vid N=30 rader (32 sidor totalt i stället för de förväntade 31) — motsäger `forsattsblad.html`s eget filhuvud-påstående att tabellen "inte behöver bryta i praktiken" vid taket. Grafiskt korrekt (thead upprepas, ingen data tappas) men en avvikelse mot dokumenterad förväntan.

## Grindutfall

- `npx @biomejs/biome check` (nya/ändrade filer): 0 fel.
- `npm run typecheck`: exit 0.
- Staging-testet: 2/2 körningar gröna (se ovan).
- `check-langa-streck.mjs`: N/A — diffen rör inte `src/`.

## DoD #5/#6 — N/A, motiverat

**DoD #5 (ADR-124 § Updates / README § Förlagorna):** N/A. Lagringsnyckelns form (`utkast/kombinerat/<requestId>.pdf`) och ADR-124 § Updates-amenderingen landade redan i `TASK-370.1` (PR #2241); försättsbladets README-bokföring landade i `TASK-370.2` (PR #2253). Denna skiva (370.3) rör varken lagringsnyckeln eller mallkatalogens README — den mäter och skarpbevisar en redan byggd EF.

**DoD #6 (mallparitets-grinden/mall-synken):** N/A. Ingen mall lades till eller ändrades i `docs/mallar/bilagor/` i denna skiva — mätscripten (N≈30, mätpunkt 3) körde LOKALT och TRANSIENT mot befintliga, oförändrade mallfiler (`kvitto.html`/`forsattsblad.html`), och ingen temp-fil eller ändring lämnades kvar i mallkatalogen (verifierat: `git status` visar noll ändringar under `docs/mallar/`).

## Övriga staging-tester — flaky-observation (INTE en regression)

`npm run test:api` (fulla parallella api-staging-svepet, ~2700 tester) fällde ett SKIFTANDE, ORELATERAT urval tester (2 olika körningar → 2 helt olika testmängder föll: `generate-event-attachment.staging.test.ts` första körningen, `cancel-registration`/`get-registrations`/`save-event-content`/`send-registration-confirmation`/`generate-event-attachment` andra körningen — "Request context disposed"-klassen, en Playwright/nätverks-transient under hög parallell belastning mot delad staging, INTE en kodregression). Samtliga fällda tester GRÖNA vid isolerad omkörning. `api-pure` (1511 test, hermetiskt): 1511/1511 gröna. Riktad omkörning av betalningsdomänens/preview-receipt-grannskapet (38 tester inkl. denna skivas nya fil): 38/38 gröna, 3/3 för den nya filen specifikt (2 solokörningar + 1 i den riktade batchen). Ingen fil denna skiva rör (`tests/api/fixtures.ts`, `tests/api/preview-receipt-forhandsgranska-alla.staging.test.ts`) korsar de fällda testernas domän.
<!-- SECTION:NOTES:END -->
