---
id: TASK-309.24
title: >-
  Dokumentlistan: alltid fyra raders låst höjd, linje under varje rad, fjärde
  linjen klipps av kanten — ingen hoppning, ingen 1 px-scroll
status: To Do
assignee: []
created_date: '2026-08-26 02:48'
updated_date: '2026-08-26 07:33'
labels:
  - ready-for-agent
dependencies:
  - TASK-309.20
parent_task_id: TASK-309
ordinal: 590000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus beslut 2026-08-26 (S108 resume 11, prod-röktest), ordagrant: 'Vi kan ha låst höjd med separatorlinje på alla OM vi låser höjden så den fjärde separatorlinjen inte syns. Är 5 dokument i listan så syns inte linjen förrän du scrollar.' Bakgrund: han såg separatorlinjen under sista raden i en innehållsstyrd lista och tyckte det såg fel ut.

HISTORIK (git-belagd, läs innan du designar):
- 91738caa (QA-273.5, 2026-08-18): LISTA_SYNLIGA_RADER = 4, LISTA_MAXHOJD = 'max-h-[396px]' mätt att klippa exakt över fjärde radens separator; lasHojd = totaltAntal > 4 (höjden låses BARA när något filter har > 4 rader — 'ingen filterhoppning'); kanRulla = antalSynliga > 4.
- d9d973d5 (TASK-309.12, 2026-08-24): avslutaLista = antalSynliga > 0 && antalSynliga !== 4 → border-b på sista li. Rörde inte höjden.
- Kod: src/components/dokument/DokumentYta.tsx rad ~624–633 (konstanter), ~1295–1312 (kanRulla/lasHojd/avslutaLista), ~1433 (klassuttrycket), och den andra listan vid ~1720/1771 (samma mönster — avgör om regeln gäller båda; Marcus talar om dokumentlistan på /mer/dokument).

REGELN (ersätter både lasHojd-villkoret och avslutaLista):
1. Varje rad bär linje under sig, även sista (divide-y → border-b på alla li, eller motsvarande).
2. Listan är ALLTID exakt fyra raders hög (h = 4 × radhöjd, mätt så att fjärde radens underkantslinje ligger precis utanför den synliga ytan). Gäller 0–3 rader (luft under; tomt-läget renderas inom samma höjd), exakt 4 och 5+.
3. Scroll ENDAST när antalSynliga > 4. Vid exakt 4 får den klippta linjen INTE ge scrollbar/1 px-scroll (overflow hidden när ≤ 4, auto när > 4) — mät scrollHeight vs clientHeight.
4. Vid 5+: rad 5 med linjen under rad 4 syns först vid scroll; sista raden bär linje.
5. Filterbyte (Alla/Event/Familj/Delade) ändrar aldrig listans bounding box.
6. Radhöjden är densamma i desktop och 375 px? Om inte: höjden härleds per breakpoint — mät, hårdkoda inte ett px-tal som bara stämmer i en vyport. Kommentaren vid LISTA_MAXHOJD ska beskriva mätningen (ADR-083: prosan och koden säger samma sak).

FACIT: s108-dokumentytans fyra bilder (tasks/sessions/bilagor/s108-dokumentytan/) avbildar listan och tas om efter fixen med samma metod som skiva 9 (manifestet är ostämplat — rör ALDRIG godkand-fältet). TASK-309.20 tar om mobilbilderna först; denna skiva startar efter att 309.20 landat och tar om alla fyra.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Listans bounding box (bredd, höjd) är identisk vid 0, 1, 3, 4 och 5+ rader och över alla filter — Playwright-mätning i desktop och 375 px, tal i PR:en
- [x] #2 Vid exakt 4 rader: ingen linje synlig nederst, scrollHeight === clientHeight (ingen scroll); vid 5+ rader: scroll, linjen under rad 4 synlig efter scroll, sista raden bär linje; vid 1–3 rader: linje under sista raden
- [x] #3 Tomt-läget renderas inom samma låsta höjd; a11y oförändrad (tabb-stopp bara när listan rullar, aria-label kvar); axe grönt; prefers-contrast: more visar linjerna
- [x] #4 Facit-bilderna för s108-dokumentytan (alla fyra) omtagna med skiva 9:s metod; not-fältet uppdaterat; godkand orört; dokumentationsgrindarna (check:docs) exit 0
- [x] #5 Acceptance-test i browser-skarven fäller på hoppning vid filterbyte och på 1 px-scroll vid exakt fyra rader
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
RUNDA 2 (2026-08-26, PR #2008 återupptagen efter review-agentens utlåtande):

Review-fynd 1 (allvarligast): körning 1s berakaListgeometri läste lasHojd = totaltAntal > LISTA_SYNLIGA_RADER — höjden var alltså BARA låst när totalen översteg fyra, i strid mot kortets regel 2 (ALLTID exakt fyra raders hög ... Gäller 0-3 rader). AC #3 var felaktigt avbockad (testet hette tomt läge inom O-LÅST höjd — bekräftade det FELAKTIGA beteendet, prövade inte det rätta). Omdesignat: useLastaListhojd har nu TRE mätnivåer (PRECIS minst fyra riktiga rader / ESTIMAT 1-3 / FALLBACK 0, monotont fallande aldrig nedåt via harPreciserMatt) — se DokumentYta.tsx docblock för hela motiveringen, inkl. den empiriskt uppmätta LISTA_FALLBACK_BRYTPUNKT-kanten (en första gissning på 640 px föll skarpt i test — ul renderade bredd är bara 502 px vid 1280x720-viewporten, under gränsen, vilket gav MOBIL-konstanten på ett skrivbordsfönster; rättat till 400 efter att ha mätt BÅDA breddernas verkliga ul-bredd).

Review-fynd 2 (gränsfall): nytt acceptance-test bevisar att en IN-PLACE minskning under fyra rader (en riktig Radera-åtgärd i GemensamtLage, ingen page.goto) inte krymper en redan precis låst höjd — harPreciserMatt spärrar nedgradering till en sämre ESTIMAT-mätning.

Review-fynd 3 (facit-noten): s108-dokumentytan/facit.json påstod git bekräftar en diff på alla fyra — falskt, PR-diffen visade 3 av 4 (eventvaljare-desktop oförändrad, rimligt då ingen lista syns i den ramen). Rättat med ett öppet korrigerings-stycke (inte tyst omskrivet); samtliga tre påverkade bilder plus s108-generering/facit-dokumentlista-inaktuell-rad-desktop/mobil omtagna en gång till mot den KORRIGERADE koden, samma engångs-spec-metod som skiva 9 (tests/visual/zz-facit-tagning-309-24.spec.ts, raderad efter passet). godkand-fältet i BÅDA manifesten orört (null).

AC #3 och #4 avbockades och bockades om (höll efter omprövning). AC #1/#2/#5 höll redan och rördes inte. Negativ kontroll körd: DokumentYta.tsx tillfälligt återställd till körning 1s implementation (patch sparad, sedan återapplicerad) — exakt de 5 NYA testerna (0/1/3-raders-lägena plus gränsfallstestet) föll, de 6 tidigare testerna höll. Full mättabell och grindutfall i PR-beskrivningen.
<!-- SECTION:NOTES:END -->
