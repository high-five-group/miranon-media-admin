---
id: TASK-306
title: >-
  Kvittots innehåll mot Lottas förlaga — benämning med typ/datum/kursnamn,
  A-pris netto, betalsätt bort, Bokföringstext-fält
status: Done
assignee: []
created_date: '2026-08-23 09:10'
updated_date: '2026-08-24 13:07'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 559000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus granskade kvittots Prince-form 2026-08-23 (S108 resume 7, morgonen) mot Lottas skarpa kvitto (`2026-08-03 kvitto-forlaga.pdf`, T170) och fann tre innehållsavvikelser; *"Kör på dina rekommendationer"* + beslut om kategoriorden. Styrande: `docs/mallar/bilagor/README.md` § Kvittots FORM (tokenytan 1:1 med `receipt-content.ts`, hårt krav), `ADR-109` (kvittonumrering), `ADR-063` (resolution i basen, inte lappning), `docs/reference/data-model.md` (fält-ID:n, skrivbarhet, § Kända fällor — läs FÖRE varje fältoperation).

## Förlagan, enligt Marcus läsning (orkestreraren kunde inte öppna filen — TCC)

- Benämning: **"Utbildning, 2026-07-25 - 2026-07-26, personlig utveckling, meditation"**
- A-pris: **2 000** (= netto, exkl. moms); totalrutan Netto 2 000 / Moms 500 / BETALT 2 500
- Ingen "Betalsätt"-rad

## Vad mallen gör i dag (mätt mot disk)

- `kvitto.html:111`: benämning = `{{eventNamn}}, {{betalningLabel}}` → "Personlig utveckling, Slutbetalning"
- `kvitto.html:114–115`: A-pris OCH Summa = `{{brutto}}` (2 500) — raden och totalrutan (Netto 2 000) säger olika saker. FEL, inte smak.
- `kvitto.html:118`: `Betalsätt: {{betalsatt}}` — från mailtexten (`receipt-content.ts:184`), saknas i förlagan.
- `receipt-content.ts` § `KvittoradSpec` bär `eventNamn: string | null`, `betalning: 'avgift' | 'slut…'`, `betalsatt`, `belopp`, `datum` — INGEN eventtyp, INGA eventdatum, INGEN bokföringstext.

## Beslut (Marcus, 2026-08-23)

a) **Benämning = `<Typ>, <Startdatum> – <Slutdatum>, <Kursnamn>[, <Bokföringstext>]`** — samma form som Lotta, ur basens fält: Event `Typ` (Utbildning/Föreläsning/…), `Startdatum`/`Slutdatum` (ISO, som Lotta skriver), `Event (source)` (kursnamn). Endagars-event: ett datum, inget streck. **Anmälningsavgift/Slutbetalning** visas som egen etikett på raden (t.ex. under benämningen eller i en egen kolumn-fri rad) — kunden måste se vilken del som betalats; det är skillnaden mot Lottas helköp. Saknas ett fält: utelämna ledet, aldrig platshållare.
b) **A-pris och Summa = `{{netto}}`.** Totalrutan oförändrad.
c) **"Betalsätt"-raden tas bort ur mallen.** Uppgiften finns kvar i Kvitton-tabellen och mailtexten (`kvittoRader`). README § Kvittots FORM: förtydliga att 1:1-kravet betyder *inget i mallen utan källa*, inte *allt i källan i mallen*.
d) **Nytt frivilligt fält på Event: `Bokföringstext (kvitto)`** (singleLineText). Lotta skriver sina egna kategoriord ("personlig utveckling, meditation"); ifyllt → sist i benämningen, tomt → utelämnat. Skapas i STAGING (`apphjj8Q7lkXCMsL4`) av agenten via Airtable-MCP (`create_field`), fält-ID bokförs i `data-model.md` (Event-tabellen + write-fält-lista) och i kortets notes. **PROD (`app8uGPrVCVOm6LfD`) är förbjuden för agenten — prod-fältet är Marcus moment**, bokförs som öppet AC.

## Bygg, i ordning

1. `receipt-content.ts`: `KvittoradSpec` får `eventTyp: string | null`, `eventStart: string | null`, `eventSlut: string | null`, `bokforingstext: string | null`; ny ren funktion `kvittoBenamning(spec)` som bygger strängen enligt (a) — enhetstestad (`tests/api/receipt-content.test.ts`, Rogers-facit + endagars + alla-null). `kvittoRader` (mailtexten) använder samma benämning på Avser-raden. Behåll `Betalsätt` i mailtexten.
2. `preview-receipt/index.ts` + `_shared/send-receipt.ts`/`send-receipt-email` läser de nya fälten ur eventraden (fält-ID:n ur `data-model.md`, aldrig namn i kod) och fyller specen.
3. `kvitto.html` + `kvitto.granskning.html` + fixture `kvitto.exempel.json` (+ `render-bilage-mall.mjs` om tokenlistan valideras där): `{{benamning}}`-token (eller de fyra delarna), betalningsetikett, netto i A-pris/Summa, betalsätt-raden bort. Fixturen speglar Lottas förlaga: "Utbildning, 2026-07-25 – 2026-07-26, Personlig utveckling, personlig utveckling, meditation"? NEJ — fixturen bär kursnamnet ur basen ("Resor i medvetandet 1" e.d.) och bokföringstexten "personlig utveckling, meditation"; bokför i `_kalla` att Lottas rad saknar kursnamn eftersom hennes system är per artikel.
4. Prince-verifiering som i `TASK-304` (riggen i scratchpad `task304-kvitto-matning/`): Prince ≡ Chrome inom ±0,5 mm, och benämningen får inte radbrytas fult — mät med en lång bokföringstext.
5. `docs/mallar/bilagor/README.md` § Kvittots FORM + § Gap: uppdatera tokentabellen; `data-model.md`: nytt fält; staging-deploy av `preview-receipt` + `send-receipt-email`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 kvittoBenamning() enhetstestad: Rogers-facit, endagars-event, alla fält null → bara kursnamn; mailtextens Avser-rad använder samma
- [x] #2 Mallen: A-pris och Summa visar netto (2 000,00 i fixturen), betalsätt-raden borta, betalningsetiketten synlig — Prince ≡ Chrome inom ±0,5 mm på alla mätställen
- [x] #3 Fältet Bokföringstext (kvitto) finns i STAGING med fält-ID bokfört i data-model.md; preview-receipt läser det live (API-test: ifyllt → i benämningen, tomt → utelämnat)
- [x] #4 README § Kvittots FORM: tokentabell + 1:1-regelns riktning förtydligad; check:docs, test:api, typecheck, biome, build gröna; staging deployad
- [x] #5 Marcus skapar fältet i PROD och granskar kvittot på nytt — öppet
- [x] #6 Benämningen är Lottas form utan kursnamn och etikett, på EN rad i Prince med fixturens text; kapacitetsgränsen bokförd i README
- [x] #7 Vår referens lyder 'Miranon Media/Lotta Gotthardsson' (ur MIRANON_ORG.varReferens), sidfoten oförändrad
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
AC #3 fält-ID (mitt-i-sessionen-tillägg, orkestrerarens meddelande): prod fldof3z1V1duVZNjM (skapat av orkestreraren pa Marcus uttryckliga GO) - staging fldlYgrv3P4hKezJE (skapat av bygg-agenten via Airtable-MCP create_field). Bokfort i data-model.md paragraf Eventplanering-kvitto-benamning. AC 5 bockas med detta som belagg for prod-falt-delen; Marcus egen visuella granskning av kvittot kvarstar OPPEN.

AVVIKELSE mot ett uppdragsdirektiv (ADR-086, bokford oppet): uppdraget instruerade EF:erna laser faltet pa ID, aldrig namn, och pekade pa ett pastatt Bilagor/staging-monster. Sokt repo-brett (grep returnFieldsByFieldId, per-miljo falt-ID-branching) - NOLL traffar. Airtables REST-API kan inte blanda namn-baserad och ID-baserad faltlasning i SAMMA GET-svar. En ID-baserad lasning av ENBART Bokforingstext-faltet hade krävt en HELT NY mekanism ingen annan faltlasning i kodbasen delar - for ETT falt bland fem kvittoBenamning() konsumerar. Fortsatte etablerad by-name-konvention (ADR-050). Fullt resonemang i kod: send-receipt-email/index.ts paragraf readEventKvittoFalt.

Bindestreck-vald: beslutstexten skrev en-dash men Lottas faktiska rad (citerad i kortet) skriver kort bindestreck, och repots .langa-streck-policy.json (TASK-172, Marcus 2026-08-09) sager korta streck vinner aven i datumspann. Valde kort bindestreck, kallbelagt i receipt-content.ts paragraf kvittoBenamning.

Matning AC2, Prince mot Chrome, samma analys.mjs-metod som TASK-304: tabellradens kolumnstarter diff 0-1px (0-0,17mm); totalrutans y-position Prince 230,80mm mot Chrome 231,14mm diff 0,34mm; sidfotens y-position Prince 251,97mm mot Chrome 252,14mm diff 0,17mm. Alla inom 0,5mm. Langtext-stresstest (bokforingstext forlangd till tre rader): identisk radbrytning i bada motorerna, ingen kollision, totalruta/sidfot ofdrandrat positionerade. Bilder i scratchpad task306-kvitto-matning/. Marcus-granskningskopia: sw-range-rigg/granskning/kvitto-prince-306.pdf (http://127.0.0.1:5199/granskning/kvitto-prince-306.pdf).

AC3 ifyllt-bevis: unit-testat fullt (receipt-content.test.ts paragraf kvittoBenamning) plus en engangs live-verifiering mot den nydeployade EF:en - temporart sentinel-event skapat via Airtable-MCP (rec46YVc0cQIoI3li, Ort ZZ-TASK-306-temp, Bokforingstext=personlig utveckling meditation), preview-receipt anropad med riktig JWT, PDF:ens content-stream bevisat innehalla HELA Avser-raden inklusive bokforingstexten (WinAnsi-hex-match), eventet sedan RADERAT (bekraftat borta). Ingen permanent ny fixture skapad - inget EF-skrivbart falt finns for denna manuella kolumn. Tomt-fallet ar en staende automatiserad test (preview-receipt.staging.test.ts) mot den delade ALDRIG-muterade BELAGGNING_EVENT_ID-fixturen.

Grindar matta denna korning: test:api 1052 passed 0 failed - typecheck exit 0 - biome exit 0 (9 warnings 47 infos, ofdrandrad baseline) - build exit 0 - check:docs exit 0 (14 av 14 grona). check-langa-streck.mjs kort som extra kontroll trots att diffen inte ror src/ (ej gated for denna diff): exit 0. Deployat till staging: preview-receipt, send-receipt-email.

RÄTTELSEVARV (2026-08-23), tre Marcus-domar mot kvitto-prince-306.pdf, samtliga verbatim: 1) "Benämningen är för lång! Den tar ju upp tre rader!! Orginalet tar upp EN rad. Kan vi skriva 'Utbildning 2026-07-25/26, personlig utveckling, meditation' bara och få plats med det på en rad utan att det ser konstigt ut? Lotta får ju plats med det på orginalet, med marginal." 2) "Varför har vi fortfarande med ordet 'Slutbetalning'. Det är FEL. Det är bara en betalning, varken slut eller början." 3) "på originalkvittot så har hon efter 'Vår referens' skrivit 'Miranon Media/Lotta Gotthardsson', vi har i vår mall skrivit 'Miranon Media AB'. Ändra det också."

Åtgärdat: kvittoBenamning() (receipt-content.ts) bygger nu <Typ> <Datumspann>, <Bokföringstext> - inget kursnamn, datumspannet komprimerat via ny formaterDatumspann() (samma år+månad -> bara slutdagen, samma år olika månad -> månad-dag, olika år -> hela slutdatumet). Betalningsetiketten (Anmälningsavgift/Slutbetalning) borttagen HELT ur kvitto.html (.kvitto-betalningsetikett-spannet + CSS-regeln raderade, inte tomma) och ur kvittoRader()s Avser-rad - KvittoradSpec.betalning oförändrat (Kvitton-tabellens ledger, send-receipt-email/index.ts makeRealFinalizer, skriver det fortfarande). MIRANON_ORG fick nytt fält varReferens ("Miranon Media/Lotta Gotthardsson"); kvitto.html Vår referens-raden bytte token {{orgNamn}} -> {{orgReferens}}; orgNamn (sidfoten, "Miranon Media AB") oförändrad. Persondata-not: efternamnet Gotthardsson finns redan publicerat i repot (schema_reference.md, VariantB.tsx m.fl.), ingen ny T171-klass.

Kapacitetsgräns mätt BÅDE teoretiskt och empiriskt, BÅDA renderingsmotorerna: teoretiskt 93,7mm kolumnbredd / 4,908 px medelteckenbredd (canvas measureText, Carlito 400 9pt) = 72,2 tecken. Empiriskt (binärsökning i den FAKTISKA .kvitto-post td.kvitto-col-benamning-cellen, Chrome): exakt 72 tecken ryms på en rad, 73 tecken bryter. Bekräftat i Prince (test-docraptor-render, samma 72-/73-teckensträngar, pdftotext -layout): identisk brytpunkt, tecken för tecken. Marcus-facitet ("Utbildning 2026-07-25/26, personlig utveckling, meditation", 58 tecken) har 14 tecken marginal - bekräftar hans egen observation. Bokfört i README § Kvittots FORM.

tests/api/preview-receipt.staging.test.ts hade en LIVE staging-assertion hårdkodad mot DEN GAMLA benämningen ("Utbildning, 2025-11-20 - 2025-11-21, Fjärrskådning") - hade fallit rött efter deploy om den inte uppdaterats (upptäckt vid premiss-pass/eftergranskning, inte i uppdraget). Uppdaterad till "Utbildning 2025-11-20/21". Å-tecken-i-eventdata-beviset ("Fjärrskådning") är BORTTAGET, inte flyttat - eventnamnet syns inte längre någonstans i kvittots text sedan dom 1, och ingen annan fält i den delade BELAGGNING_EVENT_ID-fixturen bär en svensk diakritik. Öppet bokförd täckningsförlust, se testfilens kommentar (Swedish-char-hantering i eventdata generellt är fortfarande täckt på unitnivå + för klass B/C-mallarnas hårdkodade brödtext).

Staging-deploy: preview-receipt + send-receipt-email (pqtshyierkdgwdnxuirz), efter alla grindar. Live-verifierat: den omskrivna preview-receipt.staging.test.ts-assertionen körde grönt mot den NYDEPLOYADE funktionen.

Grindar (denna körning, post-rebase på main efter #1856 landade): test:api 1055 passed/0 failed (inkl. api-staging mot nydeployade funktioner, körd två gånger - före och efter rebase, båda gröna) - typecheck exit 0 - biome exit 0 (9 warnings/47 infos, oförändrad baseline) - build exit 0 - check:docs exit 0 (14/14 gröna). check-langa-streck.mjs INTE körd - diffen rör inte src/ (skriptet skannar bara src/, ingen av de sju rörda filerna ligger där).

Marcus egen visuella granskning av DEN NYA PDF:en (kvitto-prince-306b.pdf, http://127.0.0.1:5199/granskning/kvitto-prince-306b.pdf) kvarstår ÖPPEN - inte gjord av agenten. AC #5 (prod-fält + Marcus granskning) var redan delvis öppen sedan förra varvet; kvarstår öppen för den visuella halvan, nu mot den NYA formen.

Marcus granskade kvitto-prince-306b.pdf 2026-08-23 (~11:30): *"OK"*. Tre domar verbatim i notes ovan (en rad, etikett bort, Vår referens). #1856 + #1857 landade; prod deployad 12:16Z (fas4-prod-deploy.sh, 39/39). Prod-fältet Bokföringstext (kvitto) = fldof3z1V1duVZNjM. Stängd av orkestreraren efter CI-verifiering och Marcus acceptans.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
S112 bokföringspass (2026-08-24): PR #1856 MERGED 2026-08-23T10:25:25Z + PR #1857 MERGED 2026-08-23T12:08:40Z, samtliga checks SUCCESS på båda. Prod-fält skapat (fldof3z1V1duVZNjM), prod deployad 12:16Z. Marcus slutgranskning 'OK' 2026-08-23. Samtliga 4 DoD bockade mot detta.
<!-- SECTION:FINAL_SUMMARY:END -->
