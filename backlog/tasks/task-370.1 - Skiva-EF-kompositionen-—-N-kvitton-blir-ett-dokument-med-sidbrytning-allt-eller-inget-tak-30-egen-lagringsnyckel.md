---
id: TASK-370.1
title: >-
  Skiva: EF-kompositionen — N kvitton blir ett dokument med sidbrytning, allt
  eller inget, tak 30, egen lagringsnyckel
status: To Do
assignee: []
created_date: '2026-09-03 08:31'
updated_date: '2026-09-03 09:09'
labels:
  - ready-for-agent
dependencies: []
references:
  - tasks/sessions/2026-09-03-session-116.md
  - docs/research/kvitto-forhandsgranskning-flera-som-ett-dokument-2026-09-03.md
parent_task_id: TASK-370
ordinal: 667000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Beteende ände-till-ände: klienten anropar förhandsgransknings-EF:en med en lista av inbetalnings-ID:n i visningsordning (additivt vid sidan av dagens enskilda ID; svarsformen signerad länk + utgångstid är densamma). EF:en validerar listan (UUID:er, inga dubbletter, inte tom, högst 30 — över taket ett tydligt fel som klienten kan visa, aldrig en tyst delmängd), hämtar underlaget per inbetalning med befintlig logik, fyller kvittomallen en gång per kvitto, sätter blocken efter varandra med sidbrytning (break-before: page) i ett enda HTML-dokument, gör dokumentet självbärande EN gång och skickar det som ETT DocRaptor-anrop (DocRaptor fakturerar per dokument). Ett trasigt underlag bland N fäller hela anropet med personens namn i felet (allt eller inget, S116 beslut 4). Kvittomallen, dess CSS och sändflödet rörs inte; varje kvittosida bär platshållaren FÖRHANDSVISNING som i dag. Utkastet lagras under en egen nyckelform för kombinerade dokument (nycklad på anrop, inte på event — kön kan spänna över flera event) med egen livstid och städning, och ADR-124 § Updates amenderas med formen. Kompositionen lämnar en tydlig plats för ett försättsblad som första sida (skiva 370.2 kopplar in det). SEKVENS INOM SKIVAN: minimaltestet först — två fiktiva kvitton, en sidbrytning, POST mot DocRaptors testnyckel, verifierat med pdfinfo (exakt 2 sidor), pdftotext -bbox (rätt namn på rätt sida, ingen överlappning) och pdffonts (Carlito inbäddat på båda) — innan EF-grenen byggs; mät också payload en gång självbärande mot N gånger. Testskarv 1 (enhetsnivå utan DocRaptor, samma skarv som förhandsgranskningens och mall-renderarens befintliga tester): validering, komposition (N underlag → HTML med N block och N−1 sidbrytningar), allt-eller-inget med namn, taket, nyckelformen. Täcker användarberättelser: 1, 5, 8, 9, 13, 14, 15, 17, 18, 19.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 EF:en tar additivt en lista av inbetalnings-ID:n; dagens enskilda ID-gren är byte för byte oförändrad (befintligt test grönt)
- [x] #2 Validering: icke-UUID, dubblett, tom lista och fler än 30 avvisas med tydliga fel; taket är en namngiven konstant med motivering
- [x] #3 N giltiga ID:n ger ETT DocRaptor-anrop med ETT HTML-dokument: N kvittoblock i given ordning, sidbrytning mellan varje, självbärande-gjort en gång; enhetstest utan DocRaptor bevisar strukturen
- [x] #4 Ett trasigt underlag bland N fäller hela anropet; felet bär personens namn; inget utkast lagras
- [x] #5 Kombinerat utkast lagras under egen nyckelform (inte utkast/<eventId>/…) med livstid och städning; ADR-124 § Updates amenderad med formen och skälet (kön spänner över flera event)
- [x] #6 Minimaltestet mot DocRaptors testnyckel (2 kvitton, 1 sidbrytning) körd och bokförd i kortet med pdfinfo/pdftotext/pdffonts-utfall verbatim, FÖRE EF-grenen byggdes
- [x] #7 DoD-kvartetten grön; Deno-typkontroll för EF-lagret grön; befintliga kvitto-/mall-tester gröna
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
## Minimaltest — FÖRE EF-bygget (AC #6), körd 2026-09-03

Engångsskript (scratchpad, ej committat), TVÅ fiktiva kvitton (Anna
Andersson / Bengt Bengtsson, T171-mönstret), Eta-fyllda mot kvitto.html
rakt av, kombinerade med samma princip som produktionskoden
(kombineraFylldaKvittoSidor): extrahera body, break-before:page på sida 2,
självbärande-gjort EN gång, POST mot DocRaptors testnyckel.

pdfinfo: Pages: 2, Page size: 595.276 x 841.89 pts (A4), Producer: Prince 15.1.

pdftotext -bbox / -layout: sida 1 = "Anna Andersson" / "anna.andersson@example.com" / BETALT 2 500,00. Sida 2 = "Bengt Bengtsson" / "bengt.bengtsson@example.com" / BETALT 1 200,00. Rätt namn på rätt sida, ingen text-överlappning vid sidbrytningen.

pdffonts: PXAAAA+Carlito-Bold TrueType WinAnsi yes yes yes, PXAAAB+Carlito-Regular TrueType WinAnsi yes yes yes — båda emb=yes, delade av båda sidorna.

DocRaptor-latens: klient-mätt 4356 ms för det kombinerade 2-sidiga anropet (x-docraptor-ms-headern var inte satt i detta svar — noterat, inte extrapolerat).

Mätpunkt 4 (payload en gång vs N gånger självbärande): kombinerat dokument (fyll 2x, självbärande-gör 1x) = 3 894 197 bytes HTML-payload. Samma två kvitton självbärande-gjorda VAR FÖR SIG och konkatenerade (2x) = 7 725 568 bytes. Diff: 3 831 371 bytes, dvs cirka 49,6 procent mindre med "en gång självbärande" — Carlito-typsnittens base64 dominerar payloaden och bäddas nu in EN gång i stället för N gånger. Bekräftar S116 Del 2 beslut 6:s rekommenderade form.

Cavolini-fonten (bilaga-delad.css) neutraliserades till local("") som väntat (gitignorerad licensfont, saknas lokalt) — påverkar inte kvittot, som bara använder Carlito.

Slutsats: break-before:page fungerar som dokumenterat på VÅR .sida--kvitto (flex-container) för MELLAN-sida-brytning (Prince-forumets kända begränsning gäller brytning INUTI en flex-container, inte FÖRE den — se research-passet). Grönt ljus att bygga EF-grenen enligt beslut 6.

## Grindutfall (AC #7), körda 2026-09-03

- npm run typecheck: exit 0 (tsc -b --noEmit, inkluderar tsconfig.edge-shared.json — Deno-typkontrollen för EF-lagret ligger HÄR, ingen separat ci.yml-rad kallad "Deno-typkontroll" existerar; ADR-086-avvikelse mot uppdragstexten bokförd i slutrapporten).
- npx @biomejs/biome check --write . följt av npx @biomejs/biome check .: exit 0 båda gångerna. 14 warnings/81 infos, samtliga i filer denna skiva INTE rör (src/styles/base.css !important, DokumentYta.tsx suppressions/unused) — verifierat med grep mot diffen.
- npm run build: exit 0, PWA-service worker byggd, inga fel.
- npm run test:api:pure (1396 tester, inkluderar de tre "befintliga skarv 1"-filerna PLUS den nya tests/api/kvitto-kombination.test.ts och de utökade sektionerna i kvitto-forhandsgranskning.test.ts): exit 0, 1396 passed, 0 failed.
- npm run test:api (fullständig, api-pure + api-staging): BLOCKERAD av en AKTIV extern staging-preflight (TASK-77-vakten, "Staging sentinel purge" i post-merge.yml, körning 33736577261, in_progress) — inte av min kod. Reproducerat TVÅ gånger oberoende: körning 1 kom förbi setup och föll på EN staging-test i generate-event-attachment.staging.test.ts (rör EJ kvitto, rör EJ någon fil denna skiva ändrar) med ett byte-hash-mismatch i en PROMOVERINGS-kontroll som inte alls går via min kod; körning 2 (och 3) stoppades redan vid auth.setup.ts INNAN någon test körde. Ingen av mina ändrade filer (mall-render.ts, utkast.ts, preview-receipt/index.ts, kvitto-kombination.ts) berörs av det testet. api-staging-halvan för MIN skarv (preview-receipt.staging.test.ts) är uttryckligen 370.3:s skarv, inte min — uppdragets egen FAKTA-sektion pekar bara ut de tre api-pure-filerna som "Befintliga tester i skarv 1".

## DoD-status (denna skiva)

- #1 Alla AC avbockade: ja.
- #2 Rörd fil-klass lokala grindar gröna: typecheck/biome/build/test:api:pure gröna (se ovan). npm run test:api (fullständig, med api-staging) är miljömässigt blockerad av en pågående extern staging-preflight (TASK-77), inte av denna skivas kod — se separat notering ovan.
- #3 Inga orelaterade filer i diffen: path-scopad git add används vid commit; diffen omfattar bara supabase/functions/_shared/{mall-render,utkast,kvitto-kombination}.ts, supabase/functions/preview-receipt/index.ts, tsconfig.edge-shared.json, docs/decisions/ADR-124-…, tests/api/{kvitto-forhandsgranskning,kvitto-kombination}.test.ts, backlog/tasks/task-370.1-….md.
- #4 (ärvd PRD-grind, delad mellan skivor): minimaltestet (2 kvitton, 1 sidbrytning, pdfinfo/pdftotext/pdffonts) är GJORT och bokfört ovan, FÖRE EF-grenen byggdes. Renderingstiden vid N≈30 mätt mot klienttaket är EXPLICIT 370.3:s scope (PRD § Testbeslut punkt 2, "Staging-skarpbevis... + mätning vid 30, taket justerat") — N/A här, inte utfört av denna skiva.
- #5 (ärvd PRD-grind): ADR-124 § Updates amenderad med den kombinerade nyckelformen och skälet (se ovan) — DENNA skivas del är klar. Mallkatalogens README § Förlagorna-bokföringen gäller FÖRSÄTTSBLADET, som är skiva 370.2:s mall (jag rör ingen fil i docs/mallar/bilagor/) — N/A här.
- #6 (ärvd PRD-grind): mallparitets-grinden/mall-synken gäller när försättsbladets mall LÄGGS i mallkatalogen (370.2). Denna skiva lägger ingen mallfil — N/A, inget att köra.
<!-- SECTION:NOTES:END -->
