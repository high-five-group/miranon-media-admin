---
id: TASK-286.3
title: 'Skiva: Svensk sortering, räknarrad ur arrayen, rivning av sök-walken'
status: Done
assignee: []
created_date: '2026-08-21 11:48'
updated_date: '2026-08-22 11:02'
labels:
  - ready-for-agent
dependencies:
  - TASK-286.2
parent_task_id: TASK-286
ordinal: 518000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ÄNDE TILL ÄNDE: Lotta bläddrar i listan och den är i svensk bokstavsordning — A till Z, sedan Å, Ä, Ö — med de namnlösa ('Ej tillgängligt', fälla 43) sist. Åsa står inte längre bland A:na (fälla 51:s inkonsekvens är stängd, för första gången). Räknarraden ('Visar N av M personer') räknas ur arrayen och behöver ingen egen hämtning. Under huven finns inte längre två vägar: dagens sök-/cursor-fråga i listan och EF:ens separata total-walk är rivna, eftersom ingen konsument läser dem; EF:ens sök-läge finns kvar bara om någon annan yta använder det (grep-svep avgör — rivs det inte, skriv varför).

HUR (ADR-123 beslut 3–4): Intl.Collator('sv') på den laddade arrayen; sentinelen sorteras sist i sin hink (den är redan undantagen i bokstavsindexets hink-logik, TASK-283). Räknarraden = filtrerad.length / register.length; TASK-277:s skew-säkra fallback för total rivs med walken. startvarmningen.ts:s kommentar om att persons.search 'saknar naturlig kärnfråga' uppdateras till att registerfrågan HAR en men hålls utanför den blockerande mängden av kostnadsskäl (ADR-123 beslut 7). queryKeys.persons.search/all städas om de blir oanvända.

Detta är skivan TASK-283.2–283.4 (bokstavsraden) bygger ovanpå: sorteringen och arrayen är deras underlag.

Täcker användarberättelser: 4, 7, 15
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Listan är sorterad med svensk kollation (A–Z, Å, Ä, Ö) och sentinelen för namnlösa sist — verifierat i acceptance-testet med fixtur som bär Å-, Ä-, Ö- och sentinel-poster
- [x] #2 Räknarraden räknas ur arrayen; EF:ens total-walk och dess fallback-logik i listan är rivna
- [x] #3 Listans sök-/cursor-fråga är riven; EF:ens sök-läge rivs om grep-svepet visar noll andra konsumenter, annars bokförs konsumenten i PR:en
- [x] #4 startvarmningens kommentar om persons-frågan är uppdaterad till ADR-123 beslut 7:s motivering
- [ ] #5 Personlistans rad- och listform är identisk med facit tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan — referenserna gröna
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 Paritetstestet (EF-filter mot klientfilter, samma fixtur) grönt för varje skiva som rör sök eller filtrering
- [ ] #6 Facit-referenserna för personlistan (tasks/sessions/bilagor/s90-personlistan-konvergens/facit.json ytan personlistan) gröna — formen är orörd
- [x] #7 Inga nätverksanrop vid skrivning efter första laddningen — mätt i testet, inte antaget
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Mätningar 2026-08-22 (bygg-agent, TASK-286.3)

### Grep-svepet som AC #3 kräver — EF:ens sök-läge RIVS INTE

Svepet kördes över hela repot (utom `node_modules`) på `listPersons`,
`persons.search`, `get-persons`, `?search=` och `?cursor=`.

**Klientsidan: NOLL konsumenter** → riven. `queryKeys.persons.search`,
`listPersons` i alla tre adapterlagren, samt `ListParams`/`PersonsPage`.

**EF:ens sök-/cursor-gren: FYRA konsumenter, samtliga blockerande testytor
som anropar EF:en direkt över HTTP** → behållen, bokförd i PR:en:

1. `tests/api/get-persons-sok-paritet.staging.test.ts` — ADR-123 beslut 2:s
   bevisinstrument; rivs grenen finns ingen mätbar referens att väga
   klientfiltret mot alls (och det är också denna skivas egen DoD #5).
2. `tests/api/get-persons.staging.test.ts` — cursor-port-conformance
   (ADR-056), sid-sekvens [2,2,1] med opak cursor.
3. `tests/kontraktsvakt/kontraktsfall.ts` — FELKONTRAKTET
   `?cursor=inte-en-cursor` → 400 'Invalid cursor' (TASK-69).
4. `tests/api/airtable-filter.staging.test.ts` — injektions-fuzzen
   ('illvillig search=TRUE-tautology / OR-injection → aldrig 500').

ADR-123 § Konsekvenser förutsåg det: paritetstestet underhålls 'så länge båda
vägarna finns'. Klientens väg hit är riven; EF-vägen står kvar som referensyta.

### EF:ens total-walk — RIVEN (AC #2)

`totalPromise` och `total` ur svarskuvertet är borta; kuvertet är åter
`{ persons, nextCursor }`. Följdrivningar: `PersonsPage.total`, klientens
skew-säkra avläsning (metoden själv riven), och
`tests/api/get-persons-totalisolering.test.ts` (hela dess objekt var
`totalPromise`s `.catch()`).

`get-persons-register.staging.test.ts`:s `hamtaOberoendeTotal` LÄSTE det
fältet och är omskriven till cursor-paginering + räkning. Starkare än den den
ersätter: `total` föddes ur SAMMA `fetchFromAirtable(BAS_FILTER)`-primitiv
som registerläget självt, alltså delvis samma kodväg den skulle korsvalidera.

**EF-DEPLOY KRÄVS.** `supabase/functions/get-persons/index.ts` är ändrad;
staging bär tills vidare den gamla koden. Ingen testyta asserterar på
FRÅNVARO av `total`, så divergensen är tyst — men den finns.

### queryKeys.persons.all — INTE riven, mätt beslut

Noll konsumenter i dag, men den hade noll REDAN FÖRE denna skiva och föll
därför aldrig inom kortets 'städas om de BLIR oanvända'. Den är dessutom
invaliderings-roten ADR-123 beslut 6 kräver och TASK-286.4 bygger på.

### AC #4 var redan uppfylld när jag kom — divergens mot kortet

`startvarmningen.ts`:s kommentar uppdaterades REDAN av TASK-286.2 till
ADR-123 beslut 7:s motivering (kostnadsskäl, inte principskäl). Jag har bara
rättat dess referens till den nyckel jag rev.

### TASK-286.5 (diakritik-tolerant sök, beslutad JA)

Påverkade diffen på EN punkt: de nya sorteringstesternas söktermer valdes
diakritik-NEUTRALA ('j'), så att de inte blir röda av det kortet och ser ut som
sorteringsregressioner. Sortering och sökning delar ingen jämförare —
`sorteraPersonregister` (Intl.Collator) och `filtreraPersonregister`
(toLowerCase().includes()) är helt separata. Ingen kollision.

### Grindar, mätta exitkoder

`npm run typecheck` 0 · `npx @biomejs/biome check .` 0 ·
`node scripts/check-langa-streck.mjs` 0 · `npm run build` 0 ·
api-pure **591 passed** (574 + 21 nya sorteringsfall − 4 rivna
totalisoleringsfall) · personlistans acceptance-svit **10 passed**.

## ÖPPEN SIGNAL — AC #5 / DoD #1 och #6 kan INTE bockas

`npm run test:visual -- tests/visual/personer-promoverings-grind.spec.ts`
går från **16 passed** (mätt på main före ändringen) till **10 passed,
6 failed**. Referenserna är ORÖRDA av mig — uppdraget föreskrev att en
referensändring ska stoppas och rapporteras, inte lösas av agenten.

**Exakt vad som avviker, mätt:** de två `personer-listlage-visual-{desktop,
mobile}.aria.yml` förväntar sentinel-raden 'Ej tillgängligt' på sin
ALFABETISKA plats, mellan David Dahl och Emma Eklund. AC #1 kräver att den
sorteras SIST. Enda strukturella diffen är den flytten (fyra rader); allt annat
i utfallet är Playwrights rendering av regex-mönster mot literalt värde, inte
innehållsskillnader. De fyra `?variant=`-degraderingsfallen faller på samma
referens.

**Formen är alltså orörd** — radmall, divide-y-avdelare, statuskolumn,
kontaktrad, interaktionsrad är identiska. Det som ändras är ORDNINGEN, vilket
är hela kortets syfte. `facit.json` är orörd (hooken hade nekat den ändå).

Detta är samma klass som PR #1715:s referensuppdatering, där Marcus fattade ett
uttryckligt väg B-beslut. Något sådant beslut finns inte för denna skiva.

### DoD #5 MÄTT (2026-08-22, efter att staging-preflighten släppte)

Första tre försöken stoppades av staging-preflighten (TASK-77): post-merge.yml
körning 32564937340 (PR #1748, T157-spåret) höll basen. Preflighten kringgicks
INTE med MM_STAGING_PREFLIGHT=off — staging är en delad bas (Airtable P26/P27).

Fjärde försöket, efter att körningen släppt: **16 passed, exit 0**.

- `get-persons-sok-paritet.staging.test.ts` — samtliga 12 termfall gröna
  ('anna', 'ANNA', 'åsa', 'asa', 'ås', 'ej till', '070', '070-', '070 1',
  'falköping', 'example.com', tom sträng). Klientfiltret och EF:ens SEARCH()
  enas om exakt samma personer.
- `get-persons-register.staging.test.ts` — alla tre fallen gröna, INKLUSIVE
  den omskrivna korsvalideringen 'registrets antal === basfiltrets oberoende
  mätta träffmängd (cursor-paginerad räkning)'. Den nya, paginerande formen är
  därmed bevisad mot verklig staging-data, inte bara typkontrollerad.

### Grindar körda om på det MERGADE trädet (origin/main inkl. PR #1748)

typecheck 0 · biome 0 · check-langa-streck 0 · build 0 · api-pure 591 passed ·
check:docs 0 (14 grindar) · check-facit 0.

### ADR-102 § A3 landade UNDER passet — facit-avvikelsen är nu klassad

T157 är inte längre öppen: amenderings-mekaniken för ett stämplat facit landade
i main kl 09:26:14Z 2026-08-22 (PR #1748), EFTER att denna gren skapades.
Mekaniken säger vad en agent ska göra — föreslå klass och skriva motiveringen,
medan omstämplingen ligger hos Marcus.

Klassningen är gjord och bokförd i
`tasks/sessions/bilagor/s90-personlistan-konvergens/AMENDERING-2026-08-22-svensk-sortering-sentinel-sist.md`:
**klass (c)** — formen ändras faktiskt. Sentinel-posterna finns i PROD (inte
bara i fixturen), och flytten är kortets avsikt, inte en bieffekt. Det skiljer
den från PR #1715:s klass (b), där 'Ladda fler' föll bort ur referensen ENBART
för att fixturen bär 17 personer mot render-fönstrets 50.

`scripts/check-facit.sh` fäller INTE: ytan personlistan deklarerar ingen
`referenser`-array, så invariant (d) hash-jämför ingenting här (mätt: exit 0,
'22 stämplade ytor saknar referenser'). Sidofilen noterar att `referenser` bör
deklareras nästa gång ytan ändå är ogodkänd — ADR-102 § A5 punkt 2 kräver att
de deklareras MEDAN manifestet är ogodkänt.

## Orkestrerar-stängning 2026-08-22

Kort stängdes av orkestreraren efter PR-merge (#1750, merge-SHA `2407ef37`). DoD #3 (CI grön per jobb) bockad — `gh pr checks 1750`: samtliga jobb pass eller (förväntat) skipping, noll fail. AC #5 och DoD #1/#6 lämnas ÖPPNA — redan grundligt motiverade ovan av byggagenten (facit brutet av avsedd sentinel-omsortering, klassat (c) enligt ADR-102 § Updates 2026-08-22, väntar Marcus omstämpling via TASK-283.4). Status sätts Done: alla punkter är antingen avklarade eller uttryckligen motiverade, ingen tyst.
<!-- SECTION:NOTES:END -->
