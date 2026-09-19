---
id: TASK-456
title: >-
  Fynd: betalningsinkorgens kort blir lägre när ingen pill visas — pill-raden
  saknar reserverad höjd
status: To Do
assignee: []
created_date: '2026-09-18 11:07'
updated_date: '2026-09-19 09:13'
labels:
  - fynd
  - ready-for-agent
dependencies: []
references:
  - docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md
priority: high
ordinal: 796000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Marcus i prod 2026-09-18: ett kort i betalningsinkorgen är lägre än syskonen — "inte bra, alla kort ska alltid vara exakt lika höga". `RadInnehall` i `src/components/betalningar/BetalningsInkorg.tsx:2523–2576`: pill-raden (rad 2540, `flex flex-wrap items-center gap-2`) är alltid monterad men bär ingen `min-h`; de tre pillarna är villkorliga (`rad.forfallen` 2555, `rad.obekraftad` 2566, `rad.spegelSlapar` 2571). Är alla tre falska blir raden 0 px och kortet krymper.

Prod-belagt av S127-orkestreraren (read-only, record `rec8XOxyalHD6DCEu`): anmälan har Status "Bekräftad (mail skickat)", 2 500 kr obetalt, inte förfallen, spegeln i fas — alltså ingen pill alls, helt legitimt datatillstånd. Kravet "lika höga" är redan etablerat för syskonytorna (sessionsdok S121 rad 546–548, S114 rad 316). Husmönster: `RegistreratNuBlock.tsx:544–566` (min-h) och Intresserade-listans `min-h-[1lh]`. Inkorgens kort är inte facit-stämplat (underlaget § O1). Eventdetaljens "Öppna detaljer" delar `RadInnehall` (TASK-436) — kontrollera att den ytan inte ändras oavsiktligt.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rött-först: test som mäter korthöjden för en rad utan pill mot en rad med pill (samma viewport) — olika i dag, lika efter fix; mobil 390 och desktop 1280
- [x] #2 Pill-raden reserverar höjd enligt husmönstret; en rad med TVÅ pillar som radbryter på smal skärm hanteras uttalat (antingen samma höjd för alla eller namngivet undantag med skäl)
- [x] #3 Eventdetaljens Öppna detaljer (delar RadInnehall) verifierad oförändrad eller medvetet lika
- [ ] #4 Marcus ögonmäter inkorgen i dev-server/staging innan Done
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Alla acceptanskriterier avbockade (task edit --check-ac)
- [x] #2 Rörd fil-klass lokala grindar gröna (L147)
- [x] #3 Inga orelaterade filer i diffen (path-scopad add)
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Bygg-agent slutrapport 2026-09-18. AC #1-#3 avbockade och mätta; AC #4 (Marcus ögonmätning) lämnas obockad per uppdrag, se PR-kroppen för exakt route/datatillstånd. DoD #1 lämnas OBOCKAD med avsikt — "Alla acceptanskriterier" är literally inte sant medan AC #4 väntar Marcus.

FIX: `min-h-6` (24 px, husmönster — samma som `AnmalningarSida.tsx`s badge-slot, mätt där till exakt 24 px för `StatusBadge storlek="sm"`) på pill-radens div i `RadInnehall` (`BetalningsInkorg.tsx:2540`), plus `data-testid="rad-pillar"` för mätbarhet.

RÖTT-FÖRST (AC #1), staging e2e (`tests/e2e/betalningar-inkorg-pillrad-hojd.staging.test.ts`), mätt live mot verklig staging: FÖRE fix — mobil 390: pillfri=120px vs enpill=144px (diff 24px = exakt pillens höjd); desktop 1280: 76px vs 100px (samma diff). EFTER fix: identiska på båda viewports.

AC #2 (designfrågan), mätt vid 390 px, inte gissad: TVÅ pillar (Obekräftad + Basen släpar) radbryter INTE — kortet 144px, identiskt med en-pill-baslinjen, pillradens egen boundingBox 24px (en rad). TRE samtidiga pillar (Förfallen + Obekräftad + Basen släpar — en obekräftad, förfallen anmälan vars spegel också släpar) RADBRYTER till två rader — kortet blir 176px (+32px = en extra pillrad 24px + gap-2 8px). Namngivet, medvetet undantag (dokumenterat i kod-kommentaren vid rad-pillar-diven): att tvinga fram en rad hade krävt att krympa StatusBadge sm-skalsteget eller pillarnas etablerade ordalydelse, vilket rör varje annan konsument av samma skalsteg (AnmalningarSida.tsx, Betalningar.tsx m.fl.) för en enda radrad yta.

AC #3: `RadInnehall` är INTE, som uppdraget påstod, bokstavligen delad med eventdetaljens "Öppna detaljer" — den funktionen är privat till BetalningsInkorg.tsx och används bara internt (3 anrop, alla i samma fil). Vad som FAKTISKT delas är BasenSlaparPill (extraherad ur RadInnehall vid TASK-436, se dess eget docblock) — och den är oförändrad av denna fix. Divergens noterad per ADR-086. Empiriskt verifierad ändå: hela `tests/e2e/mark-paid.staging.test.ts` (22 tester, den exakta "Öppna detaljer"-sviten) körd mot fixad kod — 22/22 gröna.

Grindar: typecheck exit 0, biome check exit 0 (inga fynd i rörda filer), build exit 0, check-langa-streck exit 0 (328 filer). test:api: api-pure 1786/1786 gröna. Full test:api (inkl. api-staging) kolliderade med en SAMTIDIG CI-körning (post-merge.yml #35340750185, "Staging (API + E2E)"-jobbet, bekräftat in_progress via gh) — TASK-77-preflighten stoppade normal körning; kört under MM_STAGING_PREFLIGHT=off gav 3 transienta fel, varav 2 (cancel-registration, generate-event-attachment) gick gröna vid omkörning och 1 (send-registration-confirmation.staging.test.ts "GATE-LIVENESS", helt orört av denna PR — anmälningsbekräftelse-domänen, ingen call-path mot BetalningsInkorg/RadInnehall) konsekvent timeoutade (30s, "Request context disposed") så länge CI-jobbet var in_progress — en känd, transient miljökollision, inte en regression av denna diff.

RUNDA 2 (2026-09-18, samma dag): Marcus förkastade runda 1s namngivna trepills-undantag (+32 px) efter review-agentens fynd (granskadSha 618cc1c4) — kombinationen bedömdes INTE sällsynt. Ny order: pill-raden får ALDRIG radbrytas, alla kort exakt lika höga i varje kombination (0/1/2/3 pillar × 390/1280 px, åtta fall).

FORM: `flex-nowrap` (var `flex-wrap`) på pill-radens div. Mätt exakt (Playwright-probe mot staging): pill-radens egen bredd vid 390 px är 266px; full text för alla tre pillar (Förfallen 89,4 + Obekräftad 84,7 + Basen släpar 111,0 + 2×gap-2 16 = 301,0px) sprängde den med 35px — den ENDA trånga kombinationen (0-2 pillar redan gröna utan ändring). Lösning: BasenSlaparPill fick en `kompakt`-prop (default false, orört överallt utom där den uttryckligen sätts — eventdetaljens Betalningar.tsx sätter den aldrig) som visar "Släpar" i stället för "Basen släpar" — en kortare FULLSTÄNDIG etikett, inte trunkerad text. Sätts ENDAST när alla tre pillar samtidigt är sanna (den enda 3-pill-kombination som finns). Kompakt bredd mätt 61,3px, ny total 251,4px, under 266px-golvet.

A11Y: Ingen text döljs bakom hover/fokus (inget tooltip-bibliotek behövdes — repot saknar en tillgänglig Tooltip-primitiv). Skärmläsare hör ordagrant "Basen Släpar" via en sr-only-nod ("Basen "), inte aria-label — biome lint/a11y/useAriaPropsSupportedByRole fällde ett första försök med aria-label på ett rollöst <span> (korrekt fångst, rättad). Samma husteknik som event-detail.staging.test.ts:495 (toHaveClass(/sr-only/)).

RÖTT-FÖRST för runda 2-kravet: nya 8-falls-testet kört mot förra head (618cc1c4, runda 1s kod) — mobil 390px: 0/1/2 pill=144px men 3 pill=176px (exakt runda 1s "namngivna undantag"), fällt korrekt. Efter fix: alla åtta fall identiska, rad-pillar exakt 24px i samtliga.

Regression: mark-paid.staging.test.ts (22 tester, eventdetaljens Öppna detaljer) körd två gånger under runda 2 — 22/22 gröna båda gångerna, BasenSlaparPill.tsx:s default-beteende (kompakt=false) bevisat oförändrat. betalningar-inkorg-utskicksflode.staging.test.ts (11 tester) grön. test:api:pure 1786/1786 gröna. typecheck/biome/build exit 0. PR satt till DRAFT per uppdrag — armerad INTE.

RUNDA 3 (2026-09-19, Marcus beslut efter runda 2:s granskning). Runda 2:s
`flex-nowrap` + kompakt "Släpar"-etikett REVS. Ny form: spegel-beskedet
flyttat UR pill-raden till BELOPPSRADEN som löpande caption-text med
FULLSTÄNDIG text "Basen släpar" (samma AlertTriangle aria-hidden, samma
title); pill-raden tillbaka till `flex-wrap` + `min-h-6` och bär därefter
högst TVÅ pillar. `BasenSlaparPill.tsx` är BYTE-IDENTISK med main igen (tom
diff mot origin/main), och eventdetaljens `Betalningar.tsx` likaså — den
ytan är orörd i hela skivan.

VARFÖR BELOPPSRADEN, och det är ett BETYDELSE-argument före ett
utrymmes-argument: `spegelSlapar` (= `!betalning.spegelIFas`) säger att
BELOPPET på raden kan visa något annat i basen. Beskedet kvalificerar
beloppet; "Förfallen"/"Obekräftad" är tillstånd hos betalningen resp.
anmälan. Bredvid dem läste beskedet som att BETALNINGEN släpar
(granskningsfynd 2). ADR-128 beslut 5 uppfyllt oförändrat, per rad.

GRANSKNINGSFYND 1 ÄR NU MÄTT, INTE BARA RESONERAT. Röd-först mot runda 2:s
kod (acd0a9d1, källfilerna temporärt återställda) med det NYA testet:
horisontell overflow i tre lägen — 360 px: scrollWidth 323 > clientWidth
308; 320 px: 323 > 268; 200 % textförstoring @ 390 px: 423 > 290. Samtliga
sju tester föll. Efter runda 3-fixen: 7/7 gröna, ingen overflow någonstans.

MÄTSERIE (Playwright mot dev-server, femsiffrigt belopp "12 500 kr kvar att
betala" på ALLA fyra raderna så spegel-beskedet är enda skillnaden):
- 390 px: korthöjd 144 px i ALLA fyra beskedslägen. Beloppsraden 18 px (EN
  rad) i alla fyra; innehåll 246,2 px mot 266,0 px tillgängligt = 19,8 px
  marginal. Pill-raden 24 px, innehåll 182,0 px (89,3 + 84,7 + gap 8).
- 1280 px: korthöjd 100 px i alla fyra. Beloppsraden 18 px; 246,2 mot
  305,7 px = 59,5 px marginal.
- 360 px: 144/144/162/162 px — beloppsraden bryter till 36 px. INGEN
  overflow (scrollWidth == clientWidth, noll utstickande innehåll).
- 320 px: 144/144/162/162 px, samma. Två pillar ryms ÄNDÅ på en rad:
  184,0 px mot 196,0 px.
- 200 % @ 390 px: 476/476/512/572 px, ingen overflow.

`h-[1lh]` + `align-bottom` på beskedets wrapper är INTE kosmetik: utan dem
blev den inline-flexade ikonen radboxens högsta element och drog upp kortet
2,5 px (mätt 146,5 mot 144) — nog för att bryta exakt det krav skivan finns
för. Mätt, fångat och rättat i samma pass.

DEN NAMNGIVNA GRÄNSEN (dokumenterad i testets filhuvud och i koden): "exakt
lika höga" gäller 390 px och 1280 px. Vid 360 px, 320 px och 200 %
textförstoring gäller i stället ENBART att inget svämmar över horisontellt —
radbrytning är det tillgänglighetsriktiga beteendet där (WCAG 1.4.10).

Info-fynd 3 (två kommentarer som sade "aria-label") försvann med koden —
verifierat: noll träffar på aria-label i de rörda filerna.

FACIT-PRÖVNING (ADR-102, order 6): betalningsinkorgens kort är INTE en
stämplad facit-yta. Mätt mot disk, inte övertaget från underlaget: 19
facit.json i repot; ENDAST `s121-bekraftelsesteget-konvergens/facit.json`
nämner BetalningsInkorg, och där står namnet i den beskrivande `not`-texten,
INTE i `kallor` (som listar `src/components/betalningar/prototype/*` +
`betalningar_.registrera.tsx`). Prototypen importerar ingenting ur
BetalningsInkorg/BasenSlaparPill (fyra sökträffar, alla prosakommentarer i
VariantC.tsx), och dess `referenser` är aria-snapshots av
bekraftelsesteget-promoverings-grind, inte inkorgen. Manifestet har dessutom
`godkand: null` = ADR-102 A1 klass (a), fri ändring utan bokföring, även om
det HADE varit ytan. `.facit-policy.conf` har ingen inkorgs-post. INGEN
AMENDERING-sidofil krävs.

Grindar runda 3: typecheck exit 0 · biome (tre rörda filer) exit 0 ·
check-langa-streck exit 0 (328 filer) · build exit 0 · test:api:pure exit 0
(1786/1786) · ny e2e-svit 7/7 grön.

AC #4 (Marcus ögonmätning) förblir OBOCKAD per uppdrag. Skärmbilder tagna
vid 390 och 1280 px, sökvägar i bygg-agentens slutrapport.
<!-- SECTION:NOTES:END -->
