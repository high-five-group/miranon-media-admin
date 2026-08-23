---
id: TASK-304
title: >-
  Kvittots form i Prince — grid och flex-gap ersätts med primitiver motorn
  honorerar; Marcus PDF-granskning
status: Done
assignee: []
created_date: '2026-08-22 22:36'
updated_date: '2026-08-23 09:12'
labels:
  - ready-for-agent
dependencies: []
priority: high
ordinal: 556000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ur kvittots Prince-omgranskning (S108 resume 7, `docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md`): Prince 15.1 renderar 4 av 7 layoutställen TRASIGT och 3 AVVIKANDE i `docs/mallar/bilagor/kvitto.css` — tre `display: grid` staplar/kollapsar (metaraden, referensblocket, tabellraden 164,6 → ~55,5 mm), flex-`gap` mellan SEK och BETALT är 0 mm (`SEK2 500,00` hopvuxet), tre flex-gap avviker ±1–3 mm. Kvittot Marcus godkände i webbläsaren (S108 MARCUS-SEKVENS punkt 2) är inte kvittot Prince skriver. Styrande: `ADR-119` (extern motor — mät mot MOTORN), S108 Del 10 § B punkt 2 (fyra-fallstestet: flex + margin fungerar, `justify-content: space-between` fungerar, flex-gap IGNORERAS, grid + column-gap TRASIG).

## Vad som ska göras

1. Ersätt varje `display: grid` i `kvitto.css` (rad ~107, 151, 219 — verifiera mot disk) med en primitiv Prince honorerar: `<table>` för tabellraden (rubriker + rader, fasta kolumnbredder i mm som i dag), flex + margin för metarad/referensblock (dt/dd-par). Ersätt varje flex-`gap` (rad ~305, 320, 347, 369) med margin på barnet — SAMMA mm-värden som i dag, de är mätta mot förlagan (`RAPPORT.md § 2b`-kommentarerna i CSS:en ska stå kvar).
2. Behåll `gap` för webbvyn bara om `bilaga-delad.css`-mönstret följs (gap + margin satta till samma värde med kommentar) — annars bort. Inga nya värden: formen är redan godkänd, bara primitiverna byts.
3. Verifiera MEKANISKT med kvittopassets rigg (scratchpad `kvitto-prince-matning/` — `build-selfcontained.mjs`, `rendera-prince.mjs`, `analys.mjs`; fällan: `docraptor-sjalvbarande.mjs` lämnar ohämtbara url() orörda, neutralisera i scratchpad-kopian — `TASK-301`): rendera genom `test-docraptor-render` (staging, `leverans` default) OCH headless Chrome, mät samma sju ställen i mm. Acceptans: Prince ≡ Chrome inom ±0,5 mm på alla sju, och Chrome-värdena oförändrade mot före-mätningen (formen bevarad).
4. Uppdatera `docs/mallar/bilagor/README.md` § Kvittots FORM med en rad om Prince-primitiverna och mätningen; lägg mättabellen efter ombyggnaden som § Updates i research-filen.
5. Lämna Marcus PDF-granskning som öppet AC — bokför i notes exakt hur han öppnar den renderade PDF:en (sökväg i scratchpad + hur den återskapas).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 kvitto.css bär ingen display:grid och ingen flex-gap utan motsvarande margin — verifierat med grep
- [x] #2 Prince- och Chrome-rendering mäter lika inom ±0,5 mm på alla sju ställen (tabell i research-filens § Updates), och Chrome-värdena är oförändrade mot före-mätningen
- [x] #3 SEK ↔ BETALT-gapet är 6,55 mm i Prince (var 0), tabellraden 164,6 mm bred i Prince (var ~55,5)
- [x] #4 README § Kvittots FORM beskriver Prince-primitiverna; check:docs grönt
- [x] #5 Marcus granskar Prince-PDF:en och godkänner formen — öppet, bokförs i sessionsdok med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**AC#1 (grep):** `grep -n "display: *grid" docs/mallar/bilagor/kvitto.css` -> 0 träffar utanför kommentarer (3 träffar, alla i PRINCE-PRIMITIV-kommentarer som beskriver den BORTTAGNA egenskapen, radnr 108/177/261). `grep -nE "^\s+gap:\s*[0-9.]+mm;" docs/mallar/bilagor/kvitto.css` -> 0 träffar (samtliga sju forna gap-deklarationer ersatta med margin-right/margin-bottom på barnet). Ändrade selektorer: `.kvitto-metarad`/`.kvitto-referensblock`/`.kvitto-tabellrad` (display:grid -> flex-rad resp. `<table>`), `.kvitto-totalruta`/`.kvitto-total-kolumn`/`.kvitto-total-betalt`/`.kvitto-sidfot` (flex-gap -> margin).

**AC#2/#3 (mätning, 2026-08-23) — Prince vs Chrome, alla 7 ställen:**

| # | Ställe | Chrome | Prince | Avvikelse |
|---|---|---|---|---|
| 1 | metarad dt->dd (bredaste raden) | 7,28mm | 7,28mm | 0,00mm |
| 2 | referensblock dt->dd (bredaste raden) | 6,27mm | 6,27mm | 0,00mm |
| 3 | tabellrad kolumnstarter (Antal/A-pris/Summa) + box-bredd | 0px diff, 176,99mm | 0px diff, 176,99mm | 0,00mm (var ~55,5mm i Prince FÖRE) |
| 4 | totalruta kolumnstarter | baseline | ≤1px diff | ≤0,17mm |
| 5 | total-kolumn vertikal etikett->värde | 2,71mm | 2,71mm | 0,00mm |
| 6 | SEK->BETALT | 6,77mm | 6,77mm | 0,00mm (var 0mm/hopvuxet i Prince FÖRE) |
| 7 | sidfot kolumnstarter | baseline | ≤1px diff | ≤0,17mm |

AC#3s exakta rader: CSS-värdet för SEK->BETALT-gapet är `margin-right: 6.55mm` (ovan-spec, oförändrat sedan tidigare). Renderat/mätt värde i BÅDA motorerna: 6,77mm — samma glyf-mätningsbrus som resten av filens mätningar (t.ex. ställe 1s spec 6,82mm -> renderat 7,28mm), inte en avvikelse mellan motorerna. Tabellradens box border-till-border: 176,99mm i BÅDA motorerna (0px diff) — var ~55,5mm i Prince FÖRE ändringen.

**VIKTIG PREMISS-RÄTTELSE (ADR-086):** uppdragets utpekade "före"-baseline (`scratchpad/kvitto-prince-matning/chrome.png`/`prince.png`, från S108-forskningspasset) visade sig renderad mot ETT FÖRÅLDRAT FIXTURE-LÄGE — Datum-raden läste "3 augusti 2026" i den bilden, men `fixtures/kvitto.exempel.json` bar redan ISO `"2026-08-03"` (commit `1e8ccb50`, samma S108-dag) när DETTA kort startade. Sannolik orsak: forskningspassets worktree (`s108-paus-docs`) hade inte synkat `1e8ccb50` vid rendertillfället. Åtgärd: byggde en KORREKT "sant före"-baseline i detta kort — `git stash` av mina CSS/HTML-ändringar, återskapade `kvitto.granskning.html` från ORIGINAL grid-CSS (HEAD, orörd) mot AKTUELL fixture, renderade i Chrome, `git stash pop`. Alla jämförelser ovan är mot DENNA korrigerade baseline (`scratchpad/task304-kvitto-matning/true-before/true-before-1.png`), INTE mot forskningspassets ursprungliga bild. Full metod, mättabell och sida-vid-sida-filförteckning: `docs/research/kvitto-prince-gap-grid-omgranskning-2026-08-22.md` § Updates 2026-08-23.

**En avvikelse UTANFÖR de 7 officiella ställena, bokförd:** metaradens KORTARE rad ("Datum:", inte den officiellt uppmätta "bredaste raden") flyttar sitt dd-värde 2px (0,34mm) åt vänster i EFTER jämfört med det korrigerade FÖRE — `min-width` (mätt på "Kvitto-/OCR-nr:"s bläckbredd, 114px) råkar inte träffa EXAKT samma pixel som grid:ets auto-kolumnbredd gjorde för den kortare radens egen linjering. Inom mätningens egen felmarginal (~0,2–0,3mm), ej en av de 7 officiella mätpunkterna, men en genuin uppmätt skillnad — inte dold.

**Fynd om `bilaga-delad.css` § `.ikonruta-media` (mätt, UTANFÖR detta korts scope att ändra):** att behålla `gap` PARALLELLT med `margin` på samma flex-rad (det mönster uppdraget pekade på som alternativ) är ADDITIVT i en riktig webbläsare — isolerat testat (2 flex-barn, `gap:10mm` + `margin-right:10mm` på första barnet): 20,15mm uppmätt mellanrum, INTE 10mm. `bilaga-delad.css`s egen `.ikonruta-media`-instans av samma mönster bär sannolikt samma dubblering i webbvyn (ej verifierat på den exakta filen, men mekaniken är obestridlig CSS-flexbox-semantik). `kvitto.css` använder därför margin ENSAM på alla sju platser (inte gap+margin) — enda sättet att fixa Prince OCH hålla Chrome oförändrad samtidigt.

**AC#4 (dokumentation):** `docs/mallar/bilagor/README.md` § Kvittots FORM har ny underrubrik "Kvittots layout-primitiver är motor-honorerade (TASK-304)" med Prince-primitiverna, referens till forskningsfilen, och `.ikonruta-media`-fyndet ovan. Mättabellen är tillagd som § Updates 2026-08-23 i forskningsfilen. `npm run check:docs`: EXIT=0, 14 gröna (matchar CLAUDE.md:s dokumenterade grindantal). `npx @biomejs/biome check .` (repo-brett — kvitto.css är CSS och Biome lintar faktiskt CSS, så detta räknas INTE som "ej tillämpligt"): EXIT=0 efter en trivial selector-omordning (`noDescendingSpecificity`-varning på `.kvitto-totalruta > .kvitto-total-kolumn` vs `.kvitto-total-kolumn`, åtgärdad utan beteendeändring — de två reglerna sätter olika egenskaper, ingen cascade-konflikt). Endast förbefintliga, orelaterade varningar kvar på annat håll i repot (9 warnings, 47 infos, samtliga oberörda av denna diff). `typecheck`/`build`/`test:api`: EJ TILLÄMPLIGT — diffen rör uteslutande filer under `docs/` (kvitto.css, kvitto.html, README.md, forskningsfilen), ingen `src/`- eller `scripts/`-fil rörd.

**AC#5 (öppet, Marcus PDF-granskning):** Prince-renderad PDF ligger i `/private/tmp/claude-501/-Users-marcus-Repon-miranon-media-admin/1bb5fca4-599d-43b4-bc01-a5cfc2bddd79/scratchpad/task304-kvitto-matning/prince-after.pdf` (DocRaptor-testvattenstämplad, "TEST DOCUMENT"-banderoller — samma läge som forskningspassets minimaltest, försvinner med ett skarpt DocRaptor-konto). Öppna direkt: `open prince-after.pdf`. Återskapa från scratch (efter denna PR:s landning): `npm run mall:granska -- kvitto` (regenererar `docs/mallar/bilagor/kvitto.granskning.html`) -> bygg självbärande HTML med en kopia av `build-selfcontained.mjs` (pekande på `docs/mallar/bilagor/kvitto.granskning.html` i den checkade-ut branchen) -> neutralisera Cavolini-`url()` till `local("")` om `lokala-typsnitt`-symlänken saknas (samma fälla som `TASK-301`) -> `node rendera-prince.mjs .env.test <självbärande.html> <ut.pdf>` mot `test-docraptor-render`-EF:en i staging. Chrome-jämförelsen (`chrome-after-1.png`) ligger i samma katalog för sida-vid-sida.

AC #5 — Marcus granskade Prince-PDF:en 2026-08-23 (http://127.0.0.1:5199/granskning/kvitto-prince.pdf): *"det ser bra ut. Hela kvittot visas i skärmen"*. FORMEN godkänd. INNEHÅLLET fick tre avvikelser mot Lottas förlaga (benämning, A-pris netto, betalsätt) + nytt fält — eget kort TASK-306. Stängd av orkestreraren.
<!-- SECTION:NOTES:END -->
