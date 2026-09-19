---
id: TASK-475
title: >-
  Fynd: beskedet om Airtable-eftersläpning är obegripligt för användaren —
  'Basen släpar' + dold förklaring; sökläget ger spegel-raderna egen höjd
status: Done
assignee: []
created_date: '2026-09-19 09:45'
updated_date: '2026-09-19 12:40'
labels:
  - fynd
dependencies: []
references:
  - 'https://github.com/high-five-group/miranon-media-admin/pull/2541'
priority: high
type: enhancement
ordinal: 815000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Marcus, 2026-09-19 (S127), efter ögonmätning av PR #2541

"Ser bra ut, men vad betyder 'Basen släpar'? Den texten kan vi inte visa för användaren (Lotta)."

## Vad som är mätt

- Etiketten "Basen släpar" (`src/components/betalningar/BasenSlaparPill.tsx`) ligger i prod sedan betalningsytan byggdes (TASK-436, ADR-128 beslut 5: eftersläpningen "syns i appen i stället för att tystas"). Den visas i betalningsinkorgen och i eventdetaljens "Öppna detaljer". PR #2541 flyttade den från pill-raden till beloppsraden men rörde inte ordalydelsen.
- Förklaringen "Basen har inte hunnit uppdateras än" ligger i ett `title`-attribut — osynligt på pekskärm och för tangentbord. På mobil finns alltså ingen förklaring alls.
- Varningstriangeln signalerar fara om något som inte kräver någon åtgärd.
- Ordet "basen" är användarsynligt på ett tiotal ställen i betalningsytan ("Pris saknas i basen", "Basen har inte hunnit uppdateras än" i `AterbetalningsForm.tsx`, `InbetalningsLista.tsx`, `RegistreraForm.tsx`, `PersonBetalningar.tsx`, `events/detail/Betalningar.tsx` m.fl.).
- SÖKLÄGET (granskningens runda 3 på #2541): med `visaEvent` läggs eventnamnet på samma rad som beloppet och beskedet; raden klipps först vid 640 px, så under det radbryter den. Ett långt eventnamn eller ett sexsiffrigt belopp ger just spegel-raderna en extra rad — höjdvariation i sökläget. Radbrytningen finns redan på main; beskedet gör att den inträffar tidigare. Inget test övar sökläget.

## Vad det betyder, utan teknik

En registrerad betalning sparas direkt i appen och kopieras sedan till Airtable. Hinner kopian inte fram visar Airtable ett äldre belopp för just den personen en stund; appens belopp är det rätta och det löser sig självt.

## ÖPPET — Marcus avgör orden (grillnings-kandidat)

Vilket ord stör: "släpar", "basen" eller båda? Säger Lotta "Airtable" eller "basen"? Gäller det hela betalningsytans vokabulär är frågan större än en rad och hör hemma i ORDLISTA.md.

## Orkestrerarens förslag (S127)

(1) Raden bär en kort, NEUTRAL markering utan varningstriangel — högst ~15 tecken ryms bredvid beloppet vid 390 px (mätt marginal 19,8 px med dagens 12 tecken). (2) Hela meningen står EN gång, synligt, överst i listan eller gruppen när minst en rad berörs, t.ex. "Airtable har inte hunnit uppdateras för 2 betalningar. Beloppen här i appen stämmer." (3) Sökläget: eventnamnet får en egen rad som klipps med "…", så alla kort blir lika höga oavsett namnlängd och beloppsraden bär bara belopp + markering.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Marcus har avgjort ordvalet (grillning eller direkt besked); beslutet bokfört i ORDLISTA.md om det rör fler än denna text
- [x] #2 Rött-först: test som visar att förklaringen i dag inte är nåbar utan hover (title-attribut) — efter fix är hela meningen synlig text
- [x] #3 Radmarkeringen är neutral (ingen varningssignal) och ryms på beloppsraden vid 390 px och 1280 px utan radbrytning, mätt med realistiska belopp inkl. sexsiffriga
- [x] #4 Sökläget: korthöjden är lika för rader med och utan besked vid 390 px, även med långt eventnamn — testat
- [x] #5 Båda konsumenterna (inkorgen och eventdetaljens Öppna detaljer) bär samma ord; tillgänglighet 11
- [x] #6 Marcus ögonmäter i dev-server innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Marcus beslut, ordagrant (2026-09-19, S127)

Om dagens text: *"Ser bra ut, men vad betyder 'Basen släpar'? Den texten kan
vi inte visa för användaren (Lotta)."*

Om lösningen: *"Jag vet inte, Lotta säger väl inget av det, det bästa kanske
är som du sa att hela meningen står en gång synligt överst i listan när minst
en rad berörs, typ 'Databasen har inte hunnit uppdateras för två betalningar.
Beloppen här i appen stämmer.'"*

På orkestrerarens konkretisering: *"Låter bra."*

**"Typ" betyder att orden stämplas först när Marcus sett dem på plats.**
AC #1 står därför obockad, och `ORDLISTA.md` är ORÖRD i denna PR — ordvalet
bokförs där efter stämpeln, inte före.

## Formen som byggdes

- `SpegelSlaparBesked` — hela meningen, EN gång, synligt överst i den lista
  där berörda rader står. Nivån är LIST-nivå (per eventgrupp i gruppvyn, per
  träfflista i sökläget), inte sidnivå: meningen räknar, och ett tal måste gå
  att koppla till de rader man faktiskt ser.
- `SpegelSlaparMarkor` — radens markering: `Hourglass` utan text, `aria-hidden`,
  med full mening i `sr-only`. Meningen överst är teckenförklaringen.
- `BasenSlaparPill` är RIVEN (ingen död komponent kvar).
- Ikonvalet: `Hourglass` är husets neutrala väntar-ikon (`VantelistePaminnelse`),
  `AlertTriangle` är husets varningssignal. Inget är fel, ingen åtgärd krävs.
- Numerus: SIFFRA, inte utskrivet räkneord — husets mönster utan motinstans
  (`1 person väntar på plats.`, `1 dag kvar`, `3 träffar`).

## Tre fel rättade, inte ett

1. **Förklaringen var inte nåbar utan hover** (`title`-attribut) — nu synlig text.
2. **Sökläget gav spegel-raderna egen höjd** @ 390 px: 162 mot 180 px. Nu 166/166.
3. **Beloppet klipptes bort** @ 1280 px i sökläget: beloppsraden bar
   `eventnamn · belopp · besked` i en `sm:truncate`-span, innehåll 458 px mot
   306 px tillgängligt, så raden slutade i "… hösten 202…" och varken beloppet
   eller beskedet syntes. Felet fanns på `main` före denna skiva och är
   OBEROENDE av spegel-beskedet; eventnamnet har fått egen rad (ordens
   fallback-gren, utlöst av mätning). Fyndet gjordes av skivans egen mätrigg,
   inte av uppdraget.

## Registrerat, ej åtgärdat (triage: blockerar ej, utanför ordern)

`InbetalningsLista.tsx` bär SAMMA utsaga ("Databasen har inte hunnit
uppdateras än …") men fortfarande med `AlertTriangle`. Ordern begränsade den
ytan till ordbytet; att byta även dess ikon till `Hourglass` är ett
designbeslut utanför skivan. Inkonsekvensen är medveten och bokförd här i
stället för tyst tagen.

## Facit-prövning (ADR-102)

Två manifest nämner rörda sökvägar. `s121-bekraftelsesteget-konvergens/facit.json`
listar `prototype/VariantC.tsx` + `prototype/radfalt.tsx` i `kallor` men bär
`godkand: null`, alltså ADR-102 A1 **klass (a)** — fri ändring, ingen sidofil.
`s111-anmalningssidan-konvergens/facit.json` ÄR stämplat, men dess `kallor`
(`dev/anmalningar-prototyp/VariantB.tsx`, `FilterRad.tsx`, `EventValjare.tsx`,
`hem-derivations.ts`) rör ingen fil i denna diff. **Ingen AMENDERING-sidofil
krävs.**

## Ögonmätning

Skärmbilder (390 + 1280, gruppvy + sökläge, med och utan berörda rader) plus
läsanvisning och mätvärden: `docs/research/task-475-spegelbesked-2026-09-19/`.

## Ordvalet stämplat (2026-09-19, S127, runda 2)

Marcus ögonmätte formen i dev-server (rutten /mer/betalningar) och stämplade ordagrant: *"Det blir okej."* Ordvalet — meningen "Databasen har inte hunnit uppdateras för N betalningar. Beloppen här i appen stämmer.", ordet "databasen" i stället för "basen", Hourglass-ikonen och eventnamnet på egen rad i sökläget — är därmed AVGJORT. `ORDLISTA.md` uppdaterad i samma PR (#2576), post "Databasen (UI-ord)" under § Flöden och distinktioner.

## § Registrerat, ej åtgärdat — löst i runda 2

Granskningens runda 1-fynd 1 (PR #2576) fångade exakt den inkonsekvens som noterades ovan: `InbetalningsLista.tsx` bytte till `SpegelSlaparIkon` (Hourglass) i denna runda, återanvänd som exporterad komponent ur `SpegelSlaparBesked.tsx` i stället för en hand-kopierad `<Hourglass ... />`. Rött-först-vakt tillagd: `tests/api/spegel-budskap-ikon-vakt.test.ts` (källtextsvakt, api-pure) fäller om `AlertTriangle` återkommer nära spegel-budskapet i `src/components/betalningar/**`. Ovanstående sektion är alltså historisk, inte längre aktuell.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landat: PR #2576, merge 0cbd12f6 (2026-09-19T12:14:44Z, main), runda 2. Etiketten Basen slapar ersatt av synligt heldbeskede en gang per lista (SpegelSlaparBesked) + neutral Hourglass-markor per rad (SpegelSlaparMarkor, aria-hidden, sr-only-mening) - BasenSlaparPill riven. Ordvalet stamplat av Marcus i dev-server (Det blir okej): meningen Databasen har inte hunnit uppdateras for N betalningar. Beloppen har i appen stammer., ordet databasen i stallet for basen. ORDLISTA.md fick posten Databasen (UI-ord). Tre fel rattade: forklaring nu synlig text (var title-attribut), soklagets spegel-rader fick lika hojd (162 mot 180px -> 166/166), belopp som klipptes bort i soklaget vid 1280px synligt igen (eventnamn fick egen rad). Runda 2 stangde granskningens fynd: InbetalningsLista.tsx bytte till samma SpegelSlaparIkon (Hourglass) + ny kalltextsvakt tests/api/spegel-budskap-ikon-vakt.test.ts mot AlertTriangle-atervand. Grindar runda 2 (matt): typecheck exit 0; biome (repo-brett) exit 0 (18 warn/84 info forbefintliga); build exit 0; test:api:pure 1839/1839; check-langa-streck exit 0 (331 filer); check:docs 16/16 grona. Granskning: risk LAG, runda 2, 1 info-fynd. Facit-provning (ADR-102): ingen AMENDERING kravdes (godkand: null / ingen berord kalla).
<!-- SECTION:FINAL_SUMMARY:END -->
