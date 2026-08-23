---
id: TASK-306
title: >-
  Kvittots innehåll mot Lottas förlaga — benämning med typ/datum/kursnamn,
  A-pris netto, betalsätt bort, Bokföringstext-fält
status: To Do
assignee: []
created_date: '2026-08-23 09:10'
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
- [ ] #1 kvittoBenamning() enhetstestad: Rogers-facit, endagars-event, alla fält null → bara kursnamn; mailtextens Avser-rad använder samma
- [ ] #2 Mallen: A-pris och Summa visar netto (2 000,00 i fixturen), betalsätt-raden borta, betalningsetiketten synlig — Prince ≡ Chrome inom ±0,5 mm på alla mätställen
- [ ] #3 Fältet Bokföringstext (kvitto) finns i STAGING med fält-ID bokfört i data-model.md; preview-receipt läser det live (API-test: ifyllt → i benämningen, tomt → utelämnat)
- [ ] #4 README § Kvittots FORM: tokentabell + 1:1-regelns riktning förtydligad; check:docs, test:api, typecheck, biome, build gröna; staging deployad
- [ ] #5 Marcus skapar fältet i PROD och granskar kvittot på nytt — öppet
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
