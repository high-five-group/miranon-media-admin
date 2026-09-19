---
id: TASK-475
title: >-
  Fynd: beskedet om Airtable-eftersläpning är obegripligt för användaren —
  'Basen släpar' + dold förklaring; sökläget ger spegel-raderna egen höjd
status: To Do
assignee: []
created_date: '2026-09-19 09:45'
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
- [ ] #1 Marcus har avgjort ordvalet (grillning eller direkt besked); beslutet bokfört i ORDLISTA.md om det rör fler än denna text
- [ ] #2 Rött-först: test som visar att förklaringen i dag inte är nåbar utan hover (title-attribut) — efter fix är hela meningen synlig text
- [ ] #3 Radmarkeringen är neutral (ingen varningssignal) och ryms på beloppsraden vid 390 px och 1280 px utan radbrytning, mätt med realistiska belopp inkl. sexsiffriga
- [ ] #4 Sökläget: korthöjden är lika för rader med och utan besked vid 390 px, även med långt eventnamn — testat
- [ ] #5 Båda konsumenterna (inkorgen och eventdetaljens Öppna detaljer) bär samma ord; tillgänglighet 11
- [ ] #6 Marcus ögonmäter i dev-server innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
