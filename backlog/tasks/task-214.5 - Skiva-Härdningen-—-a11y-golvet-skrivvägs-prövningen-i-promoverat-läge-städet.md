---
id: TASK-214.5
title: >-
  Skiva: Härdningen — a11y-golvet, skrivvägs-prövningen i promoverat läge,
  städet
status: To Do
assignee: []
created_date: '2026-08-14 19:18'
updated_date: '2026-08-15 00:37'
labels:
  - ready-for-agent
dependencies:
  - TASK-214.4
parent_task_id: TASK-214
ordinal: 406000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Den promoverade ytan härdas till skarp standard: tillgänglighetsgolvet bevisas med axe, skrivvägarna re-prövas i det promoverade läget, och prototypens byggspår städas utan att formen rörs. Täcker användarberättelser: 9, 10
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Axe-pass utan serious eller critical på dörrlistan i promoverat läge — a11y-golvet 11 håller (prefers-contrast, prefers-reduced-motion, print inkluderat)
- [x] #2 Skrivvägarna prövade i promoverat läge: incheckning, ångra båda riktningarna, CREATE-fallback och felvägen — mutations-skivans beteende-AC håller efter flippen
- [x] #3 Prototyp-städ utfört: döda variant-referenser städade; designskäl-kommentarer behållna
- [x] #4 Dörrlistan fortsatt identisk med facit tasks/sessions/bilagor/s103-checkin-konvergens/facit.json ytan 'check-in (dörrlistan, variant D)'
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [ ] #3 CI grön per jobb på pushad commit
- [x] #4 Inga orelaterade filer i diffen (path-scopad add)
- [x] #5 ariaSnapshot-paret grönt för varje promoverad yta (variant före == promoverad efter)
- [x] #6 Bevis-loopens spår (skärmdump + skillnadslista) bilagt i skivans PR
- [x] #7 Datavägs-invarianten verifierad: läsvägen oförändrad; skrivning sker ENDAST via de två speccade operationerna
- [x] #8 Test-konsument-svepets träffyta bilagd och alla träffar uppdaterade i samma skiva som sin flip
- [x] #9 Kvittensfönstrets kontrakt bevisat via nätverks-observation: inget skrivanrop före fönstrets utgång, ångra ger noll anrop
- [x] #10 Facit-granskningen utförd mot tasks/sessions/bilagor/s103-checkin-konvergens/facit.json (ytan 'check-in (dörrlistan, variant D)')
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Härdningen — genomförd (TASK-214.5)

### PREMISS-PASS (ADR-086)
git fetch + ff-only visade worktreen 5 commits bakom origin/main (saknade
PR #1306/TASK-214.4) — fast-forwardad till 26b1e724 innan design. Kortets
CheckinPrototyp.tsx-radantal ("~1239") stämde INTE exakt (1224 rader efter
ff); marginell divergens, ej blockerande, bokförd. facit.json/narvaro.tsx/
event-checkin-dorrlistan.acceptance.test.ts lästa mot disk, inte antagna.
`?variant=d` bekräftat DÖD (narvaro.tsx rad ~35-41 docblock) — uppdragets
premiss "de navigerade via ?variant=d — uppdatera navigeringen" höll.

### AC #1 — Axe-golv + kvalitetsribbans tre lägen
tests/visual/dorrlista-promoverings-grind.spec.ts: TVÅ nya describe-block
längst ned i SAMMA fil (171.3-precedentet) — INGA av de 6 befintliga
ariaSnapshot-testerna rörda (git diff på tests/visual/__aria__/ tomt).
6 axe-tester (4 fixturvärldar, 214.3:s sex lägen) navigerar UTAN ?variant=
via ny gotoDorrlistaPromoverad() — den skarpaste bevisformen, lutar inte på
att parametern råkar vara harmlös. 3 kvalitetsribba-tester: prefers-contrast:
more (Framstegskortets border-color mot --mm-border-strong-token, DOM-probe),
prefers-reduced-motion:reduce (klargruppens chevron, motion-safe:transition-
transform → 0s), print (rubrik/dörrlista-yta/sökfält förblir synliga).
Tröskel: 0 violations, ingen impact-filtrering (ADR-045 beslut 2,
strängare än kortets bokstav "utan serious/critical" — medveten
överträffning). 30/30 gröna (desktop+mobil), samtliga axe-block 0 violations
första körningen.

### AC #2 — Skrivvägs-prövning i promoverat läge
tests/acceptance/event-checkin-dorrlistan.acceptance.test.ts: oppnaDorren()
navigerar nu till /event/${EVENT_ID}/narvaro UTAN ?variant=d (var
verkningslöst sedan flippen, TASK-214.4). Testinnehåll (assertions,
fixturvärld, kvittensfönstrets kontrakt) OFÖRÄNDRAT. Alla fem gröna mot
promoverade routen (incheckning, ångra inom/efter fönstret, CREATE-fallback,
felväg).

### AC #3 — Prototyp-städ
Fyra döda variant-referenser i CheckinPrototyp.tsx rättade (samtliga namngav
riven kod som om den fanns kvar):
  - rad ~127: "DATA — läsning + klient-join (identisk i alla tre
    varianterna)" → "tre varianterna" borta (bara D finns).
  - rad ~137: basStatus-fältets kommentar pekade på `useDorrLage` (riven
    TASK-214.4) → rättad till `useDorrLageD`, med förklaring att fältet
    matas men inte läses av D.
  - rad ~628: "ÄNDRINGEN ÄR D-LOKAL: den bor i SessionsRadD, inte i den
    delade SessionsRad, så variant B och C är orörda" → SessionsRad/variant
    B/C existerar inte längre; meningen borttagen.
  - rad ~919: "D-LOKAL ändring: TillbakaLank (A/B/C) är orörd" → FALSKT
    (TillbakaLank är riven med A/B/C) → rättad till att förklara att denna
    länk är D:s enda kvarvarande.
Designskäls-kommentarer som citerar konvergenssteg/historik BEHÅLLNA
oförändrade (S103-konvergensvarvet-citaten, VECKET-defekten, variant B:s
breddlås-/Incheckad-mönster-attribueringarna) — de förklarar en aktiv
designavvägning, inte död maskinvara. dorrlista-promoverings-grind.spec.ts:s
egen docblock uppdaterad (axe fanns inte där tidigare, nu tillagd —
factual korrigering, inte bara städ).

### AC #4 — Facit-granskningen
Temporär testfil (borttagen efter körning, ALDRIG committad) tog skärmdump
av promoverade routen (4-personers fixturvärld, Dag 1/Dag 2-toggle) på
visual-desktop (1440×900). Jämförd mot facit.json §
"check-in (dörrlistan, variant D)" slutlage-desktop.png: sidkrom, rubrik,
framstegskort (primär-tint, progress bar, pill), sessionstoggle, sökfält,
personlista (divide-y, initial-cirklar, kryssruta) STRUKTURELLT/VISUELLT
IDENTISKA. Enda skillnaden: fixturdata-volym (4 vs 16 personer, annat
eventdatum — förväntat, annan fixturvärld) och rail-indikatorns form (ikon
+ badge "2" vs facit-bildens fyra bokstavs-chips a/b/c/d) — EXAKT samma
divergens 214.4 redan dokumenterade som väntad ("registret krympte med
avsikt"), orörd av denna skiva (narvaro.tsx/CHECKIN_PROTO_VARIANTS ej
rörda här). Noll strukturell/visuell drift i själva dörrlist-komponenten.
ariaSnapshot-paret (12/12, __aria__/ orört) är det starkare, deterministiska
beviset — skärmdumpen är kompletterande, prosaform i PR-kroppen i stället
för bifogad bildfil (samma precedent som 171.3: "formen bär samma funktion,
inte bocken").

### Grindar (samtliga NAKET, denna worktree)
npm run typecheck EXIT=0 · npx @biomejs/biome check . EXIT=0 (0 fel, 6
varningar/42 infos, samtliga pre-existing utanför rörda filer) ·
node scripts/check-langa-streck.mjs EXIT=0 · node scripts/check-mailto.mjs
EXIT=0 · npm run test:api EXIT=0 (750/750) · acceptance
event-checkin-dorrlistan.acceptance.test.ts EXIT=0 (5/5) · visual
dorrlista-promoverings-grind.spec.ts EXIT=0 (30/30, desktop+mobil) ·
npm run test:acceptance:sjalvtest EXIT=0 (229/229 fällda med
OmockadRequestError) · npm run build EXIT=0.

### Divergenser mot uppdraget
- CheckinPrototyp.tsx: 1224 rader vid ff-only (uppdraget angav "~1239") —
  marginell, ej blockerande.
- Fjärde död variant-referens (TillbakaLank/A/B/C, rad ~919) och en femte
  (useDorrLage, rad ~137) hittades utöver de två uppdraget inte namngav
  specifikt — städ-passet gick bredare än en ren AC-avprickning, alla fyra
  bokförda ovan.
<!-- SECTION:NOTES:END -->
