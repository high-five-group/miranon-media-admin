---
id: TASK-304
title: >-
  Kvittots form i Prince — grid och flex-gap ersätts med primitiver motorn
  honorerar; Marcus PDF-granskning
status: To Do
assignee: []
created_date: '2026-08-22 22:36'
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
- [ ] #1 kvitto.css bär ingen display:grid och ingen flex-gap utan motsvarande margin — verifierat med grep
- [ ] #2 Prince- och Chrome-rendering mäter lika inom ±0,5 mm på alla sju ställen (tabell i research-filens § Updates), och Chrome-värdena är oförändrade mot före-mätningen
- [ ] #3 SEK ↔ BETALT-gapet är 6,55 mm i Prince (var 0), tabellraden 164,6 mm bred i Prince (var ~55,5)
- [ ] #4 README § Kvittots FORM beskriver Prince-primitiverna; check:docs grönt
- [ ] #5 Marcus granskar Prince-PDF:en och godkänner formen — öppet, bokförs i sessionsdok med datum
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [ ] #4 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
