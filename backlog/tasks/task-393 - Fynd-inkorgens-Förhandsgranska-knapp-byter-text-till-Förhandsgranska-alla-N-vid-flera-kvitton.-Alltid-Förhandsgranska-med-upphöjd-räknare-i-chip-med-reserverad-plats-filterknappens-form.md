---
id: TASK-393
title: >-
  Fynd: inkorgens Förhandsgranska-knapp byter text till "Förhandsgranska alla N"
  vid flera kvitton. Alltid "Förhandsgranska" med upphöjd räknare i chip med
  reserverad plats (filterknappens form)
status: To Do
assignee: []
created_date: '2026-09-04 10:52'
labels:
  - ready-for-agent
dependencies: []
ordinal: 687000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
FYND (Marcus 2026-09-04, S121 sessionsstart, verbatim i sessionsdoket): "när jag reggar fler än 1 betalning så ändrar förhandsgranska-knappen till Förhandsgranska alla 2, jag vill att den alltid ska vara Förhandsgranska X. X:et ska vara en dynamisk siffra på ett chip som det är reserverad plats för. Siffran i chippet ska vara upphöjd, vi har redan en form för det på exempelvis filterknappen."

FORENSIK (disk 2026-09-04, origin/main 90cc3ac1, som inkluderar #2264):
- Etiketten: src/components/betalningar/BetalningsInkorg.tsx rad 1191 (enSamKo = vantande.length === 1), rad 2035 till 2047 (ensam kandidat, texten "Förhandsgranska"), rad 2083 till 2096 (N >= 2, texten "Förhandsgranska alla" + vantande.length på rad 2092, aria-label rad 2089, loadingText rad 2088). Laddnyckel FORHANDSGRANSKA_ALLA_NYCKEL rad 322.
- Chip-formen som ska återanvändas: src/components/primitives/FilterRad.tsx rad 251 till 275. Badgen är en absolut placerad span (-top-1 -right-1, rounded-full, bg-accent, text-[10px]) med aria-hidden; det tillgängliga namnet bärs av en sr-only-span. Ingen Badge- eller Chip-primitiv finns i src/components/primitives, och inga badge-tokens i src/styles/tokens/components.css. Docblocken rad 260 till 264 bokför text-[10px] som öppen avvikelse från typografiskalan och säger att ett badge-skalsteg mintas först vid en andra konsument. Förhandsgranska-knappen ÄR den andra konsumenten.
- Tester som asserterar den gamla texten: tests/e2e/betalningar-inkorg-forhandsgranska-alla.staging.test.ts rad 267, 269, 315 ("Förhandsgranska alla 3"; N = 1 ger ingen alla-knapp, rad 286 till 297); tests/api/kvitto-forhandsgranskning.test.ts rad 305, 428, 443, 471; tests/api/betalningar-inkorg-statusyta-form.test.ts rad 159 (radbrytning mobilbredd). #2264 (TASK-370.3) lade även till tests/api/preview-receipt-forhandsgranska-alla.staging.test.ts; grep alla tester efter "Förhandsgranska alla" innan bygget.

AVGRÄNSNING: bara etiketten och chippet. Beteendet bakom knappen är orört: N = 1 förhandsgranskar det enskilda kvittot som i dag, N >= 2 kombinerar till ett dokument med försättsblad (TASK-370.1, tak 30). Ordet "alla" försvinner ur både synlig text och aria-label.

DESIGN: bryt ut chippet till en delad primitiv i src/components/primitives (namn i husets språk, t.ex. RaknarChip) som FilterRad och Förhandsgranska-knappen båda konsumerar. Reserverad plats betyder att knappens bredd inte hoppar när N går från en till två siffror; tvåsiffrigt N (upp till 30) ska rymmas. Inga hårdkodade färger; om text-[10px] blir ett skalsteg bokförs det i tokens och FilterRads avvikelse-not stängs, annars står noten kvar med hänvisning till detta kort. prefers-contrast: more och prefers-reduced-motion respekteras. Facit: inkorgen har ingen egen stämplad facit-bilaga enligt 346.6 AC #1 (endast AMENDERING i s64-mer-konvergens för Mer-listan); verifiera med grep i tasks/sessions/bilagor och bokför utfallet i notes. Källor: S121 sessionsdok Del 1 · TASK-370.4 (knappen) · TASK-346.6 (inkorgen).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Knappen lyder "Förhandsgranska" för alla N >= 1, med N som siffra i ett upphöjt chip i filterknappens form; ordet "alla" förekommer varken i synlig text eller aria-label; loadingText oförändrad.
- [ ] #2 Chippet är en delad primitiv i src/components/primitives som både FilterRad och Förhandsgranska-knappen konsumerar; FilterRads inline-badge är ersatt utan visuell regression (bilder före och efter i PR-kroppen).
- [ ] #3 Reserverad plats: knappens bredd är identisk vid N = 1, N = 9 och N = 12, mätt i browsern och bokförd i PR-kroppen; tvåsiffrigt N ryms.
- [ ] #4 Tillgängligt namn bär antalet i klartext (t.ex. "Förhandsgranska 2 kvitton", singular vid 1); chippets siffra är aria-hidden; axe 0 överträdelser på inkorgen.
- [ ] #5 Alla tester som asserterar "Förhandsgranska alla N" är uppdaterade (e2e-stagingtestet inklusive N = 1-fallet, kvitto-forhandsgranskning.test.ts, betalningar-inkorg-statusyta-form.test.ts, preview-receipt-forhandsgranska-alla.staging.test.ts om berörd); rörda sviter gröna, test:api grön.
- [ ] #6 Skärmdumpar desktop och iPad 820 px i PR-kroppen med N = 1, 2 och 12; prefers-contrast: more verifierad för chippet.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->
