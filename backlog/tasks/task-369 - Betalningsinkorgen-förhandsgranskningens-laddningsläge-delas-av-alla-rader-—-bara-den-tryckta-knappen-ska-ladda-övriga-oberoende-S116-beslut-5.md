---
id: TASK-369
title: >-
  Betalningsinkorgen: förhandsgranskningens laddningsläge delas av alla rader —
  bara den tryckta knappen ska ladda, övriga oberoende (S116 beslut 5)
status: Done
assignee: []
created_date: '2026-09-03 08:07'
updated_date: '2026-09-03 10:11'
labels:
  - ready-for-agent
dependencies: []
references:
  - src/components/betalningar/BetalningsInkorg.tsx
  - src/data/mutations/kvitton.ts
  - tasks/sessions/2026-09-03-session-116.md
ordinal: 665000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus 2026-09-03 (prod, S116 start): registrerade två inbetalningar, tryckte Förhandsgranska på den översta — den nedre radens knapp gick också i laddläge. 'Varför? Den skulle inte förhandsgranskas?' ROTORSAK (disk-verifierad vid S116-start): BetalningsInkorg.tsx skapar EN useForhandsgranskaKvitto()-mutation för hela komponenten; varje rads knapp (rad ~1511) och ett-kvitto-fallets knapp (rad ~1789) visar samma forhandsgranska.isPending, och dubbelklicksvakten i forhandsgranskaKvitto (rad ~859) läser samma delade läge, så ingen annan rad kan klickas medan en renderar. Bara ETT kvitto renderades — buggen sitter i visningen och vakten, inte i renderingen. GRILLAD SAMSYN S116 fråga 5, Marcus valde A 'Oberoende': bara den tryckta knappen visar Förhandsgranskar …; alla andra förhandsgransknings-knappar är klickbara och öppnar sitt eget fönster med sitt eget kvitto; den delade vakten RIVS och ersätts av en per-inbetalning-spärr (samma rad kan inte startas två gånger medan den renderar). Fönster-först-mönstret (window.open synkront före mutate, skrivLaddningssida, fonster.closed-vakten) är OFÖRÄNDRAT — se docblocket vid forhandsgranskaKvitto och useForhandsgranskaBilaga.ts § HISTORIK. Felvisning: ett fel på en rad namnger personen (role=alert finns redan, rad ~1876) och blockerar inte andra rader. Teknikval för byggaren: TanStack Querys mutationKey + useMutationState, eller ett lokalt Set<inbetalningId> av pågående — välj det som ger minst yta, bokför valet i kortet. Skivan är FÖRBEREDANDE för 'Förhandsgranska alla' (S116 fråga 1–4, eget kort efter research/grillning) som ska hänga sin egen knapp bredvid 'Skicka N kvitton' på samma per-id-mekanism — bygg inte den knappen här.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Bara den rad vars Förhandsgranska trycktes visar laddläge ('Förhandsgranskar …'); övriga Förhandsgranska-knappar (per rad och ett-kvitto-fallet) är enabled och visuellt oförändrade under tiden
- [x] #2 Två rader kan förhandsgranskas i följd utan väntan: varje klick öppnar sitt eget fönster med rätt persons kvitto; fönster-först-mönstret och fonster.closed-vakten är orörda
- [x] #3 Den delade dubbelklicksvakten (forhandsgranska.isPending) är riven; samma rad kan inte startas två gånger medan dess rendering pågår (per-inbetalning-spärr), bevisat med test
- [x] #4 Ett renderingsfel på en rad visas med personens namn och blockerar inte förhandsgranskning av andra rader
- [x] #5 Hermetiskt test (acceptance/Playwright för betalningsinkorgen, EF-mockad) bevisar oberoendet: rad A pending ⇒ rad B:s knapp enabled och utan laddtext; negativt bevis: samma test mot origin/main-komponenten fäller
- [x] #6 DoD (test:api, typecheck, biome, build) + relevanta acceptance-tester för betalningsinkorgen gröna; docblocken vid forhandsgranskaKvitto och knapparna uppdaterade så de beskriver den nya formen, inte den gamla
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TEKNIKVAL (bokfört per kortets krav): lokalt `Set<inbetalningId>`
(`forhandsgranskaPagar`) + lokalt namngivet felstate (`forhandsgranskaFel`),
INTE `mutationKey` + `useMutationState`. Skälet: `useForhandsgranskaKvitto()`
monteras EN gång på komponentnivå (delas medvetet av alla rader, se
kvitton.ts-docblocket) — mutationKey sätts vid hook-komposition, inte per
`.mutate()`-anrop, så en mutationKey-lösning hade krävt att hooken monteras
PER RAD (en extraherad radkomponent), en betydligt större yta än denna skiva
motiverar. Set+lokalt state är minsta ändringen som ger korrekt per-rad
laddläge/fel utan att röra render-strukturen.

DJUPARE ROTORSAK ÄN KORTETS EGEN DIAGNOS, verifierad mot installerad
@tanstack/react-query 5.101.4 källkod (node_modules/@tanstack/query-core):
`forhandsgranska.mutate(id, { onSuccess, onError })`-formen (per-anrops-
callbacks som ANDRA argumentet) lagras på `MutationObserver`s `#mutateOptions`
— ETT fält, ovillkorat överskrivet vid varje `.mutate()`-anrop — INTE på den
enskilda `Mutation`-instansen. `mutate()` kör dessutom
`this.#currentMutation?.removeObserver(this)` INNAN nästa mutation kopplas på,
så en tidigare rads mutation TAPPAR sin observatör så fort en ny rad klickas:
när den första radens EF-svar kommer tillbaka finns ingen observatör kvar att
notifiera, och dess `onSuccess`/`onError` kallas ALDRIG — fönstret blir kvar
på laddningssidan för alltid (exakt "bara ETT kvitto renderades"). Detta är
INTE bara en visningsbugg i `isPending`, det är en funktionell bugg i vilket
fönster som får sin URL satt. FIXEN: `mutateAsync(id).then(onFulfilled,
onRejected)` i stället för `.mutate(id, {onSuccess, onError})` —
`mutateAsync` returnerar `Mutation.execute()`s EGEN promise, som aldrig
passerar observatörens delade `#mutateOptions`. Fullt resonemang i
`forhandsgranskaKvitto`s docblock (BetalningsInkorg.tsx) och i
`useForhandsgranskaKvitto`s docblock (kvitton.ts).

TEST-KLASS, DIVERGENS FRÅN UPPDRAGET (ADR-086, öppet bokförd): kortet/
uppdraget bad om "acceptance/Playwright". Repots Acceptance-klass
(hermetisk MSW-fixturvärld) kan STRUKTURELLT INTE rendera /mer/betalningar:
playwright.config.ts sätter VITE_FEATURE_BETALNINGAR: 'av' för hela den
delade acceptance/visual/webblasarbeteende/manifest-screenshots-
fixturvärlden, och routens beforeLoad (mer/betalningar.tsx) redirectar till
/mer när flaggan är av — verifierat mot båda källorna. SAMMA blockerare som
betalningar-inkorg-utskicksflode.staging.test.ts (TASK-362) redan
dokumenterar för samma komponent. Ny fil:
tests/e2e/betalningar-inkorg-forhandsgranskning-oberoende.staging.test.ts
(chromium-authenticated, page.route()/context.route(), aldrig network.use()),
tre fall (AC #1/#2/#5, AC #3, AC #4). Negativt bevis kört av byggaren: fixen
reverterad via `git checkout --` mot de två källfilerna, samma svit
omkörd — 2 av 3 fall röda (AC #1/#2/#5: rad B blev disabled när rad A
klickades; AC #4: felet saknade personens namn), fixen återapplicerad via
`git apply` på sparad diff, sviten grön igen (4/4 inkl. setup). AC #3:s
fall är grönt mot BÅDA versionerna (den gamla delade vakten blockerar av
ett annat skäl även samma rad två gånger) — ingen differentierande negativ
kontroll för just det fallet, vilket är korrekt bokfört, inte en brist.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Levererad · PR #2237 (MERGED 2026-09-03T09:58:02Z, granskad head 9df90ec6). Review-loop: runda 1 ett warning-fynd (felstatet nollställdes aldrig) → fix + nytt e2e-fall → runda 2 konvergerad, noll fynd, risk låg; backstopp-preflight grön. Djupare rotorsak än kortets: TanStacks per-anrops-callbacks skrevs över vid överlappande klick (mutateAsync i stället). AC #5 klassad felställd av granskaren: Acceptance-klassen kör med betalningsflaggan AV och kan inte rendera inkorgen — testet ligger i staging-e2e (chromium-authenticated, TASK-362-precedent), intenten uppfylld, negativt bevis kört manuellt (2 av 3 fall röda mot origin/main). CI-noten: körningen på 9df90ec6 avbröts när PR:en gick draft→ready och kördes om grön. Orkestrerare S116.
<!-- SECTION:FINAL_SUMMARY:END -->
