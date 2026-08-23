---
id: TASK-299.7
title: 'Skiva: Promovering av sidram + initialcirkel till väntelistan'
status: To Do
assignee: []
created_date: '2026-08-22 19:29'
updated_date: '2026-08-22 23:23'
labels:
  - ready-for-agent
dependencies:
  - TASK-299.1
parent_task_id: TASK-299
ordinal: 547000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Väntelistan får husets sidram och initialcirkeln. Lotta möter samma tillbaka-knapp och samma sidhuvud som på anmälningssidan, och varje rad bär personens initialer till vänster om namnet. RADINNEHÅLLET RÖRS INTE (Marcus beslut 2026-08-22, alternativ B): fälten och deras ordning står kvar som de är — full radanatomi på en annan datatyp är en egen designfråga och inte detta pass. Sidan har i dag en acceptance-skarv men ingen visuell; den får en när den landar, så nästa ändring inte driver tyst. Täcker användarberättelser: 11, 12, 13, 18, 21.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Väntelistan bär den delade sidramen; den gamla textlänken och den dubblerade sidmarginalen är borta
- [x] #2 Varje rad bär initialcirkeln ur den väntandes namn, med primitiv-komponenten — ingen ny inline-kopia
- [x] #3 Radens fält och deras inbördes ordning är OFÖRÄNDRADE
- [x] #4 Sidan har en visuell spec med baslinje för desktop och mobil
- [x] #5 Befintliga acceptance-skarven utvidgad, inte omskriven
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 axe 0 på varje ny/ändrad yta i alla tillstånd (lista, filtrerat, tomt, fel)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
BEROENDE OMSATT 2026-08-22: TASK-299.5 → TASK-299.1.

Marcus order i klartext: "Bygg det globalt bara med sidkromet." Det ursprungliga beroendet på 299.5 antog att sidramens form måste vinnas på anmälningssidan innan den kan promoveras till systersidorna. Det antagandet håller inte längre:

- Kant-i-kant är avgjort i S111:s grillning, inte i konvergenspasset.
- SidRam- och InitialAvatar-primitiverna LANDADE i TASK-299.1 (merge-SHA 24238b1c) och finns att importera i dag.
- Omfattningen är låst av Marcus 2026-08-22: full omfattning på ytaxeln, bara sidkromet på ägandeskapsaxeln. Se TASK-299 § OMFATTNINGEN LÅST.

Vad denna skiva faktiskt behöver är alltså primitiverna, inte anmälningssidans LISTA. Beroendet pekar nu på det som verkligen krävs. TASK-299.5 förblir låst bakom 299.4 (Marcus konvergensgranskning) — den kedjan rörs inte.

MARCUS UNDANTAGSREGEL, samma beslut: "Ser vi något som inte funkar sedan så är det ju bara att göra ett undantag på den sidan, men jag tror det är helt lungt." Ett lokalt avsteg på en enskild sida är alltså tillåtet och ska INTE läsas som att den delade formen ska rivas. Stöter du på en yta där sidkromet inte fungerar: bygg undantaget lokalt, bokför skälet, riv inte formen.

GENOMFÖRT 2026-08-22/23. `src/components/waitlist/Waitlist.tsx`: `SidRam`
(kant-i-kant, ingen `rubrik`-prop — rubriken lever kvar i sidan) ersätter den
gamla textlänken; `p-4`-wrappern riven (dubbla sidmarginalen borta); text-
bärande element (`header`, `ul`) tar egen `px-4` för att fluktlinjera med
chevronens `mx-4`, `MessageBox` odekorerad kant-i-kant — samma mönster som
`AktivitetsHistorik.tsx`/`DokumentYta.tsx`. `WaitlistRow` bär `InitialAvatar`
vänster om namnet; `dl`:n (fälten, oförändrad ordning) indragen `pl-12` för
att fluktlinjera under namntexten.

VISUELL SPEC (AC #4): `tests/visual/vantelista.spec.ts`, enkel sidnamn-form
(som `personer.spec.ts`/`mer-anmalningar.spec.ts`) — INTE en
`-promoverings-grind`-svit, eftersom väntelistan aldrig haft ett
facit-stämplat divergenspass att regressionslåsa mot. Baslinje-PNG:erna är
CI-födda (task-36.7/`visual-baselines.yml`), inte committade av mig — lokala
macOS-renderingar genererades bara för granskning och är `.gitignore`-
exkluderade (`*-darwin.png`). Baslinjen föds vid nästa dispatch av
`visual-baselines.yml`.

ACCEPTANCE-SKARVEN (AC #5) UTVIDGAD: chevron-assertionen bytt till
`getByRole('link', { name: 'Tillbaka till Mer' })` (utan pilprefix — den
gamla texten fanns aldrig med SidRam och assertas nu explicit BORTA);
initialcirkel-assertioner (`AA`/`BB` som synlig text) tillagda; tre nya
axe-tester (tomt/fel/laddning) utöver den befintliga (lista) — väntelistan
saknar filtrerat läge, så DoD #5:s "lista/filtrerat/tomt/fel"-mall täcks med
de FYRA tillstånd som faktiskt existerar (lista/tomt/fel/laddning).

`npm run test:acceptance:sjalvtest -- tests/acceptance/mer-vantelista.acceptance.test.ts`
grön: 9/9 fällda med `OmockadRequestError` som orsak (hermetiskt bevis).

VISUELL GRANSKNING, TRE VARV (Marcus order): (1) bygg → rendera 375/1440 →
fann `gap-1.5` (6 px, ej 4 px-bas) mellan avatar-rad och fältlista → (2) fix
till `gap-2` (8 px) → rendera om, ren. (3) utökad granskning: 390/768 px,
tomt/fel/laddningsläge, `prefers-contrast: more`, `reduced-motion`, `print`
— alla rena, ingen ytterligare kodändring krävdes (print:hidden på TabBar
bekräftat fungera; SidRam/InitialAvatar ärver kontrast-tokens utan egen
`contrast-more:`-klass, samma som alla andra SidRam-konsumenter).

`npm run test:api:staging` blockerades av TASK-77-mutexen (post-merge.yml
run 32604691211 höll staging) — `test:api:pure` grönt (660/660). Ändringen
rör ingen EF/adapter-kod.
<!-- SECTION:NOTES:END -->
