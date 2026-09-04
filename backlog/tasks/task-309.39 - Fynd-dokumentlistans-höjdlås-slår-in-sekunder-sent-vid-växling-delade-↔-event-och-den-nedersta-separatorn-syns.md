---
id: TASK-309.39
title: >-
  Fynd: dokumentlistans höjdlås slår in sekunder sent vid växling delade ↔
  event, och den nedersta separatorn syns
status: Done
assignee: []
created_date: '2026-08-29 07:54'
updated_date: '2026-08-29 09:15'
labels:
  - ready-for-agent
dependencies: []
parent_task_id: TASK-309
ordinal: 610000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus prod-röktest 2026-08-29 (S113), ordagrant: "Nu har jag laddad upp 2 delade dokument som gäller alla event i prodappen. När jag växlade flik från delade dokument till ett specifikt event så laggade dokumentlistan. Den följde först innehållet och växte och krympte med innehållet för att några sekunder senare ligga låst på att visa '4 rader' eller fyra dokument högt. Dessutom så har vi sagt att listan ska sluta precis över den nedersta separatorn men det gör den inte just nu, jag ser den nedersta separatorn. Detta måste kollas om noggrant i koden och göras proffsigt och världsklass." · Verifierade adresser (orkestreraren, main 10c0cedf; disk-prövade av bygg-agenten mot 86c343bb, filen bit-identisk mellan de två SHA:na): useLastaListhojd + docblock src/components/dokument/DokumentYta.tsx:641-960 (tre mätnivåer PRECIS/ESTIMAT/FALLBACK, monoton precision, LISTA_SYNLIGA_RADER=4 :655, LISTA_FALLBACK_RADHOJD=99 :703), berakaListgeometri :947-950 (kanRulla, sistaRadenBarLinje), DokumentLista:s matbar-villkor :1663-1702 (foretradesMatbar = 'bilaga' && rader.length>=4, reservMatbar = 'alla'), listans klasser :1823-1837 (divide-y, overflow-y-auto/hidden, [&>li:last-child]:border-b), GemensamtLage :2168-2235. Bakgrund: TASK-309.24 (PR #2008, mergad 2026-08-26) införde mätningen; acceptance-test tests/acceptance/dokument-lista-hojdlas.acceptance.test.ts. Produktregeln (309.24) är FAST: alltid fyra raders låst höjd, linje under varje rad, fjärde linjen klipps av kanten, ingen hoppning, ingen 1 px-scroll. Diagnos med tät röd-kapabel slinga FÖRE fix (marcus-system:diagnosing-bugs).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rotorsaken till S1 och S2 är belagd med reproduktion: ett acceptance-test som samplar listans höjd (getBoundingClientRect) vid t=0/100/500/3000 ms efter växlingen delade → event OCH efter sidladdning på ett event med ≥ 4 bilagor, och som är RÖTT på main före fixen (bevisat, run/utdata i Implementation Notes)
- [x] #2 S1 fixad: höjden är låst från listans FÖRSTA målade ram efter växling/laddning — ingen mellanfas där boxen följer innehållet; samplingstestet grönt; ingen layout-shift synlig (CLS-mätning eller ram-för-ram-bevis bokfört)
- [x] #3 S2 fixad: med ≥ 4 rader sammanfaller boxens nederkant med fjärde radens nederkant och INGEN separatorlinje syns i boxens nedre kant (DOM-/pixelbevis: femte radens border-top ligger utanför den synliga boxen, eller motsvarande mätning); med < 4 rader slutar boxen under sista radens linje enligt 309.24:s regel — bevisat i test
- [x] #4 Gäller BÅDA listorna (DokumentLista för event och GemensamtLage för delade) och båda viewports (1280×720 och 375×800); befintliga 309.24-tester fortsatt gröna; ingen 1 px-scroll (scrollHeight === clientHeight vid exakt fyra rader)
- [x] #5 Docblocken i DokumentYta.tsx håller ihop med koden efter fixen (ADR-083) — stale prosa om mätnivåer/villkor omskriven, inte lämnad; rotorsak + valda väg + förkastade alternativ i Implementation Notes med källor
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [ ] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Rotorsak

Två OBEROENDE rotorsaker i samma hook (`useLastaListhojd`, `src/components/dokument/DokumentYta.tsx`). Båda reproducerade i acceptance-riggen FÖRE fixen; ingen är en gissning.

### S1 — listan följde innehållet (aldrig låst, inte "sent låst")

`useLayoutEffect` returnerade tidigt när BÅDA mätkällorna var falska:
`foretradesMatbar = aktivtFilter === 'bilaga' && rader.length >= 4` och `reservMatbar = aktivtFilter === 'alla'`.
Är ingen av dem sann sätts aldrig någon höjd, `matadHojd` förblir `null`, `<ul>` får ingen `style.height` och följer sitt innehåll — PERMANENT, inte i sekunder.

Två mätta vägar in i det läget:
1. `?typ=bilaga` kvar i URL:en över räckviddsväxlingen delade → event, på ett event med FÄRRE än fyra bilagor. nuqs-nyckeln `typ` nollställs inte av `setEventId`, och räckviddsläget (`GemensamtLage`) har ingen filterrad som visar att filtret är satt. Komponenten monteras OM vid växlingen, så alla refs och `hojd`-state nollställs.
2. Sidladdning i `?typ=mall` eller `?typ=generator`. `MALLAR` har 2 poster och `GENERATORER` 1 — de kan strukturellt ALDRIG nå fyra rader, så låsningen uteblev utan att någon växling behövdes.

Mätt före fixen (acceptance-riggen, 1280x720, 2 delade + 2 egna bilagor, 400 ms EF-latens): listan stod på **200 px** (två raders naturliga höjd) i VARJE ram i 3,5 s, `style.height` osatt. Vid 375 px: 312 px. Förväntat låst värde: ~4 x radhöjd.

Marcus formulering "några sekunder senare ligga låst" är låsningen som inträffar först när något ANNAT gör filtret mätbart (t.ex. att han klickar "Alla" i filterraden) — inte en fördröjd mätning.

### S2 — den fjärde separatorlinjen syntes

NIVÅ 1 (PRECIS) satte höjden till `fjarde.bottom - forsta.top + kantjustering`. Det spannet INKLUDERAR fjärde radens egen `border-bottom`.

Tailwind 4:s `divide-y` genererar `:where(& > :not(:last-child)) { border-bottom-style/-width }` — verifierat i `node_modules/tailwindcss/dist/lib.js` och i renderad DOM (varje `<li>`: `border-top: 0px`, `border-bottom: 1px`). I Tailwind 3 var samma verktygsklass `border-top-width` på `& > * + *`. Docblocket byggde på v3-semantiken och påstod därför: *"Ingen egen kantlinje behöver uteslutas för hand här"* — det resonerar bara om `[&>li:last-child]:border-b` och missar att `divide-y` ger fjärde raden en linje så fort en femte rad följer.

Mätt före fixen (GemensamtLage, 5 och 7 rader; DokumentLista, 7 rader; även 375 px): innehållsytan slutade vid **397 px** och fjärde radens linje upptog **396 -> 397 px** — alltså ytans sista synliga pixelrad. Vid exakt 4 rader var linjen 0 px (fjärde raden är `:last-child`), och där fanns inget fel.

## Vald väg

Två minimala ändringar INOM den befintliga mekanismen — inga nya nivåer, ingen omskriven modell.

1. **S1: `harMattAlls`-ref (nödmätning).** När INGEN nivå ännu satt en höjd mäter effekten oavsett vad källvillkoren säger. Nödmätningen sätter aldrig `harForetradesMatt`, så 'bilaga'/'alla' förfinar värdet precis som förut, och `harPreciserMatt` skyddar fortfarande mot nedgradering. Fixen sitter i hooken och INTE i räckviddsväxlingens URL-hantering just för att väg 2 ovan (direktlänk `?typ=mall`) inte går genom någon växling.
2. **S2: `separatorBredd(rad)` dras bort.** NIVÅ 1 drar bort fjärde radens egen `border-bottom-width`; NIVÅ 2 drar bort den mätta radens, av samma skäl (`radhojd x 4` innehåller fyra separatorer när bara tre ligger mellan rader). NIVÅ 3 gör inget avdrag — den läser `senastUppmattRadhojd`, som NIVÅ 1/2 redan skriver separator-fri.

Bieffekt, avsiktlig och god: fyra och fem rader delar nu EXAKT samma bounding box (397 px) i stället för att skilja sig med linjens bredd. Vid exakt fyra rader är avdraget 0, så 1 px-scroll-invarianten är orörd.

## Förkastade alternativ

- **Nolla `?typ` när räckvidden byts.** Tar väg 1 men lämnar väg 2 (direktlänk) öppen, och är en PRODUKTändring — filtret skulle tyst kastas om. Frågan om `?typ` bör överleva ett räckviddsbyte är verklig men separat och ligger hos Marcus. Bokförd, inte gjord.
- **`reservMatbar = true` ovillkorat.** Enklare, men 'mall' (2 rader) hade då mätt vid VARJE render och skrivit över 'alla's värde vid filterbyte — direkt brott mot regel 5 (filterbyte ändrar aldrig bounding box).
- **Bygga om mekanismen (CSS-radhöjd i stället för JS-mätning i tre nivåer).** Inte motiverad: diagnosen visade att de tre nivåerna fungerar som avsett — felet var ett saknat golv (S1) och en felräknad term (S2), inte modellen. En omskrivning hade dessutom krävt orkestrerarens GO per uppdraget.
- **Hårdkoda linjebredden till 1 px.** Ett magiskt tal som tyst blir fel om `divide-y`-bredden eller `contrast-more`-varianten ändras. `getComputedStyle` läser den faktiska bredden och ger 0 där ingen linje finns — vilket är exakt vad gränsfallet exakt-fyra behöver.

## Bevis i båda riktningar

Nytt test `tests/acceptance/dokument-lista-hojdlas-tidpunkt.acceptance.test.ts` (9 fall).

- **RÖTT före fixen: 8 failed, 1 passed** (`npm run test:acceptance -- dokument-lista-hojdlas-tidpunkt --workers=1`, exit 1). Fällningarna av rätt skäl: *"listan var OLÅST i ram t=1011 ms (höjd 200)"*, *"fjärde separatorn börjar vid 396 px, innehållsytan slutar vid 397 px"*.
- Det nionde fallet ("exakt fyra rader") är NEGATIV KONTROLL — grönt både före och efter, och bevisar att fixen inte betalas av gränsfallet.
- **GRÖNT efter fixen: 9 passed**, exit 0.
- **Ingen regression:** `dokument-lista-hojdlas.acceptance.test.ts` (309.24) **15 passed**, exit 0.

S1-testet samplar ram för ram med `requestAnimationFrame` och fäller på FÖRSTA olåsta ramen — AC #1:s t=0/100/500/3000 är en delmängd av det som mäts. Ett stickprov efteråt kan strukturellt inte se ett tidsfönster; det är exakt därför 309.24:s svit missade S1.

309.24:s femradersfall mätte `rad4.bottom <= ulRect.bottom + 0.5` och kallade utfallet "klippt bort" — den olikheten är SANN även när linjen ligger på ytans sista synliga pixelrad. Rätt tal, fel gräns. Nya `separatornsLage` mäter `bottom - borderBottomWidth < innehallBottom`, vilket faktiskt skiljer synlig från klippt.

## Grindar (mätta exitkoder)

| Grind | Exit |
|---|---|
| `npm run typecheck` | 0 |
| `npx @biomejs/biome check .` | 0 |
| `node scripts/check-langa-streck.mjs` | 0 |
| `npm run build` | 0 |
| `npm run test:api` | **1** — se noten nedan |
| `npm run test:api:staging -- generate-event-attachment` (omkörning) | 0, 17 passed |
| acceptance: nya sviten (9 fall) | 0 |
| acceptance: 309.24-sviten (15 fall) | 0 |

**`test:api`s enda fällning är INTE denna diff.** 1281 passed / 1 failed:
`tests/api/generate-event-attachment.staging.test.ts` "preview-läge → 200 + riktig PDF + INGEN Bilagor-rad skapas", med `Expected: 20, Received: 21` — testet räknar rader i den DELADE staging-basen före/efter, och antalet steg med 1 under mätfönstret. En parallell session/agent skrev i samma bas. Diffen rör inga Edge Functions och inget Airtable-fält. Omkörning av hela filen: **17 passed, exit 0**. Bokfört öppet i stället för att tystas — men det är en känd delad-bas-race, inte en regression.

## Divergens mot uppdraget

Ingen. Samtliga premisser prövade mot disk och bekräftade — se PR-beskrivningen.

## Öppet, ej gjort

`?typ`-nyckelns överlevnad vid räckviddsbyte (se Förkastade alternativ). Produktfråga för Marcus, inte en kvarvarande bugg: höjdlåset är korrekt oavsett hur den frågan avgörs.

---

## Runda 2 (orkestrerar-uppdrag, 2026-08-29)

### 1. CI-rött på `dokument-rackviddsval` — var min 1 px-korrigering, prövat först

CI run 33243034215 föll på `dokument-rackviddsval.acceptance.test.ts:326` "inline-rullningen: tabb-stopp och max-höjd bara när listan faktiskt rullar", tre försök av tre. Reproducerat lokalt mot grenen FÖRE någon ändring:

```text
Error: expect(received).toBeCloseTo(expected, precision)
Expected: 396
Received: 395
Expected difference: < 0.5
Received difference:   1
```

`Received: 395` är `ul.clientHeight` efter korrigeringen; `Expected: 396` är testets `fyraRader = fjarde.bottom - forsta.top`, alltså spannet INKLUSIVE fjärde radens separator. Differensen är exakt linjens 1 px — samma term som NIVÅ 1 nu drar bort. Det var alltså denna diff, inte något annat.

**Testets förväntan uppdaterad till den nya produktregeln, inte tvärtom.** `fyraRader` drar nu bort `getComputedStyle(items[3]).borderBottomWidth` — samma avdrag som `useLastaListhojd`. Ett nytt `expect(geometri.fjardeSeparator).toBeGreaterThan(0)` säkrar att linjen FINNS i fixturen (nio rader), så testet inte kan passera på ett nollavdrag av fel skäl. Motivet står i testets egen kommentar (Tailwind 4 kontra 3, mätningen 396 -> 395).

### 2. Review-fyndet: `LISTA_FALLBACK_RADHOJD`-docblocket

Granskaren hade rätt. Stycket påstod att NIVÅ 3 "I PRAKTIKEN bara [är] nåbar i `GemensamtLage`", med motiveringen att `DokumentLista` alltid har minst tre riktiga rader i 'alla'. Den slutledningen förutsätter att komponenten NÅGON GÅNG renderat i 'alla' — vilket den inte gör när `?typ=bilaga` redan står i URL:en vid mount. Före 309.39 var det ofarligt eftersom höjden då inte sattes alls (det VAR symptom S1); `harMattAlls`-nödmätningen gör vägen nåbar och påståendet falskt.

Stycket är omskrivet med båda nåbara vägarna. **Och nåbarheten är MÄTT, inte påstådd** — nytt testfall "NIVÅ 3 är nåbar även i DokumentLista — `?typ=bilaga` på ett event UTAN bilagor" låser den: höjden är låst, `hojd` ligger inom `FALLBACK * 4` .. `+ 8`, ingen scroll. Uppmätt 398 px. Inga andra prosa-ändringar gjorda.

### Grindar runda 2 (mätta exitkoder, nakna)

| Grind | Exit |
|---|---|
| `npm run typecheck` | 0 |
| `npx @biomejs/biome check .` | 0 |
| `node scripts/check-langa-streck.mjs` | 0 |
| acceptance, HELA `tests/acceptance/dokument-*` (9 filer) | **0 — 57 passed** |
| acceptance, omkörning efter biome-formatering (rackviddsval + hojdlas x2) | 0 — 40 passed |

Nya sviten är nu 10 fall (var 9). Det tidigare fällande `inline-rullningen`-testet är grönt.

### Ej rört

`?typ`-nollställning vid räckviddsbyte — orkestreraren har avgjort JA på Marcus mandat, men i ett EGET kort. Inte berörd i denna PR.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Landning: PR #2080 (mergad 2026-08-29 09:14:23Z, main c7366aba). Två rotorsaker: S1 höjdlåset var ALDRIG satt när ?typ=bilaga följde med från Delade → event (och vid ?typ=mall/generator) — harMattAlls-nödmätning; S2 docblocket byggde på Tailwind v3:s divide-y (border-top på syskonet) medan v4 sätter border-bottom på :not(:last-child) — spannet räknade in linjen, separatorBredd dras bort. Reproduktion röd före fix (8/9), ny svit 10 fall. Review-grinden: runda 1 warning (stale LISTA_FALLBACK_RADHOJD-docblock) + CI-rött i dokument-rackviddsval (396 vs 395) → runda 2 konvergerad, risk låg. Produktfrågan ?typ vid räckviddsbyte → TASK-309.40.
<!-- SECTION:FINAL_SUMMARY:END -->
