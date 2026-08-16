---
owner: marcus803
updated: 2026-08-16
review_by: 2027-02-16
status: draft
---

# 40-listan — proveniens och relevans per kort (2026-08-16)

> **Proveniens:** Marcus-order 2026-08-16 ("Jag tillför inget genom att själv
> granska 40-listan, det får en agent göra. Ta reda på var korten kommer ifrån
> eller framförallt om de fortfarande är relevanta."), ur `TASK-238` AC #3:
> de signal-lösa korten (noll egna acceptanskriterier OCH inga barn-kort) som
> stängningsgrinden `scripts/check-backlog-closure.sh` aldrig kan bedöma.
> `TASK-238`-agentens ID-lista bokfördes inte durabelt; listan här är därför
> REGENERERAD mekaniskt (se § Metod). **Detta är beslutsunderlag — inget kort
> har stängts eller ändrats i detta pass.** Verkställandet är ett separat pass
> efter Marcus kvittens.

## Summering

Regenereringen gav **exakt 40 kort** — samma tal som `TASK-238`:s notes
(2026-08-16), ingen drift sedan dess.

| Rekommendation | Antal | Kort |
|---|---|---|
| **BEHÅLL** (med föreslagna AC) | **26** | 20, 22, 23, 24, 25, 27, 28, 31, 33, 40, 41, 43, 44, 45, 46, 47, 187, 189, 190, 193, 195, 198, 200, 204, 207, 213.11 |
| **STÄNG** (källmärkt) | **9** | 26, 34, 42, 130, 131, 188, 191, 197, 206 |
| **OKLART** (Marcus-beslut) | **5** | 21, 30, 32, 39, 199 |

Mönstret i STÄNG-klassen: sju av nio är byggda eller överspelade av SENARE
landningar (TASK-205, TASK-237, TASK-238, TASK-147.x, TASK-121/243.3,
TASK-126.4/ADR-094) — kortet blev aldrig stängt när arbetet landade under
annat namn. Det är exakt den klass grinden inte kan se utan signaler, och
skälet till att listan behövde en manuell genomlysning.

## Metod

1. **Regenerering:** samtliga 483 kortfiler i `backlog/tasks/` lästes direkt
   från disk (aldrig backlog-CLI:t i loop — CLI-lasten är `TASK-238`:s eget
   forensik-fynd) och klassades med EXAKT grindens definition, replikerad ur
   `scripts/check-backlog-closure.sh` + `.backlog-closure-policy.conf`:
   status ≠ `Done` · ingen `intentionally-open`-etikett · utanför
   24 h-karensen · 0 egna AC · 0 barn (via `parent_task_id`). Kontrollsummor
   mot grindens egen semantik: 150 öppna kort, 2 deklarerat avsiktligt öppna,
   21 inom karens, 70 prövade mot AC, 17 mot barn-relationen, **40 utan
   stängningssignal**; invariant 1- och 3-fynd: noll — konsistent med att
   `TASK-238` nyss stängde driften.
2. **Proveniens:** minta-commit per kort via
   `git log --follow --diff-filter=A -- "<kortfil>"` + commit-meddelandets
   sessionskontext.
3. **Relevans:** varje korts påstående prövades mot DAGENS disk — faktisk
   kod (`src/`, `supabase/functions/`, `tests/`, `scripts/`,
   `.github/workflows/`), `docs/decisions/`, `docs/reference/` och senare
   backlog-kort. Fem parallella research-agenter (8 kort var); varje dom är
   källmärkt med fil:rad, commit-SHA, ADR- eller kort-ID.

**Känd git-artefakt i proveniensen:** `git log --follow` rapporterar för
flera av korten en falsk andra "A"-träff i `c832e607` (TASK-73, orelaterad
CI-ändring) — en rename-detection-artefakt; den äldre, innehållsmässigt
korrekta commiten är den som citeras.

**Notabelt kant-fall:** `TASK-207`:s FILNAMN är `task-207 - test-title.md`
men frontmatter-titeln är korrekt ("Fynd: staging Edge Runtime/Airtable
transienta 502/503 …"). Kortets egna Implementation Notes (2026-08-14)
dokumenterar att CLI:t inte kan döpa om filen — känt, ofarligt, kräver
uppströms CLI-funktion eller Marcus-undantag från "aldrig handredigera
registret".

---

## STÄNG — 9 kort, källmärkt

| Kort | Titel (kortform) | Född i | Motivering |
|---|---|---|---|
| TASK-26 | CI laddar inte upp Playwright-artefakter | `2bf743a2` (2026-07-22, 18.8-diagnosen) | Byggt: `ci-suite.yml` rad 346/441/602 laddar upp Playwright-artefakter vid `failure() \|\| cancelled()` för acceptance-, webblasarbeteende- och e2e-staging-jobben; cancelled-grenen förstärkt via `TASK-237` (Done). Exakt vad kortet begärde. |
| TASK-34 | hem.staging.test.ts rött i full svit, grönt ensamt | `67cf7b80` (2026-07-23, S75 batch 4) | Överspelat + duplikat: filen finns inte längre (omarkitekterad till `tests/acceptance/hem.acceptance.test.ts` i `109f8465`, TASK-59.3, annan mockmekanism); klassen spåras redan av det ÖPPNA `TASK-121` (samma testfall, rätt fil, rigorösare metod) och filen skrivs dessutom om av `TASK-243.3`. |
| TASK-42 | Atgarder.tsx åldrad wiring-kommentar ("kopplas i 18.6") | `6fbe1db3` (2026-07-25, 18.16-review) | Byggt: bekräftelsemail-wiringen landade i `2df7973e` (TASK-147.2); filen som bar den stale kommentaren totalomskrevs i `8535fc8e` (TASK-147.8) — grep på "Bekräftelsemail"/"kopplas" i filen: 0 träffar. |
| TASK-130 | Preview-skarven antogs vara CI-grind — anropas aldrig av CI | `a6839db9` (2026-08-02, S96/TASK-126.1) | Byggt: kortets eget stängningsvillkor ("stängs när båda landat") uppfyllt — `task-126.4` är Done med omformulerad AC #3 (PR #648, merge `52ba500e`), PRD `task-126` § Testbeslut bär "RÄTTAT 2026-08-03 (TASK-131)". |
| TASK-131 | Repot saknar hemvist för datalösa webbläsartester | `e23184e2` (2026-08-02, S96 Del 4) | Byggt: klassen `Webblasarbeteende` finns — `tests/webblasarbeteende/install-prompt.test.ts`, `playwright.config.ts:608`, eget CI-jobb `ci-suite.yml:385-443`, `ADR-094`; landat PR #651 (merge `3c7f2ff7`). Frontmatter-status är bokföringslucka, inte kvarvarande arbete. |
| TASK-188 | event-bekraftelse-scroll "flakar" i post-merge | `445d6f81` (2026-08-10, S102 våg 4) | Byggt/superseded: rotorsaken (+57 px deterministisk — omockad `get-event-notes` → 404-felbox) bevisades och fixades av `TASK-205` (Done); fixen verifierad i `tests/e2e/event-bekraftelse.staging.test.ts:34,77,311-312`. Exponeringsklassen bärs separat av öppna `TASK-212`. |
| TASK-191 | Bilagor-tabellen saknas i data-model.md | `bba7880a` (2026-08-10, S102 Del 4) | Byggt: `docs/reference/data-model.md:148-178` dokumenterar nu Bilagor (staging + prod-ID, 5 fält inkl. Lagringsnyckel) och Kvitton; infört `73aa42e9` (2026-08-11), utökat `9d9bac20` (TASK-147.12). |
| TASK-197 | check-pausade-sessioner.sh falsklarmar (nåbarhet ≠ kronologi) | `9522e570` (2026-08-11, rödklassnings-triagen) | Byggt: `scripts/check-pausade-sessioner.sh` rad 70–290 bär "NÅBARHET ≠ KRONOLOGI (TASK-197)"-fixen; landad via PR #1170 (commit `7309f0d5`, merge `43070f95`). Residual (test-sviten ej CI-wirad) är ett explicit deferrat, separat beslut. |
| TASK-206 | check-backlog-closure.sh ofullbordbar under fleet-last | `b09417fd` (2026-08-12, fyra häng-instanser) | Superseded av `TASK-238` (landat `d5507aac`, PR #1410): roten var `check_active_branches`-grenskanningen (28,5→1,96 s/view), fixen ROOT_CONFIG-mekanismen; full grind >60 min → ~16m46s. Residual (progressiv output + beteende under SAMTIDIG last) kan bli ett NYTT smalare kort — inte skäl att hålla 206 öppet. |

---

## BEHÅLL — 26 kort, med föreslagna AC

Formen per kort: proveniens · dagens belägg · föreslagna AC (de AC kortet i
dag saknar; formuleras skarpt vid verkställandet).

### Äldsta klungan — S75-fynden (2026-07-21/22), 8 kort

**TASK-20 — primitives.spec.ts doc-kommentar "6 primitiver" är stale**
Född `7f8ae750` (2026-07-21, S75). Öppet, driften VÄXT: rad 4 säger "6",
faktisk räkning i dag 12 sektioner/16 test-block. AC: (1) docblocken görs
antals-lös ("samtliga primitiver i sektionslistan"); (2) ren
dok-korrigering, ingen beteendeändring.

**TASK-22 — Tailwind v4 skannar docs/**.md; klass-literaler emitteras i
produktions-CSS**
Född `9eab457f` (2026-07-22, S75-batch v2.1). Öppet: `src/styles/tailwind.css`
har endast `@import "tailwindcss"` + `@theme` — ingen `@source`-styrning;
`vite.config.ts:36` kör pluginens default-skanning. AC: (1) explicit
`@source`-styrning som begränsar skanningen till `src/` (+ `index.html`);
(2) bevis: klass-formad literal i en docs-fil emitteras INTE i `dist` efter;
(3) ingen visuell regression (befintlig CSS-yta oförändrad).

**TASK-23 — mapEvent/deriveManadAr-dupliceringen ×4 EF-kopior**
Född `9eab457f` (2026-07-22). Öppet: `mapEvent` finns i tre EF:er
(`get-events`, `get-event`, `update-event`) + `create-event`:s
`deriveManadAr`/mapCreatedEvent (rad 77/204); inget i `_shared/`. Kortets
notes bokför även batch-läsningen ×3 (`chunk()`/`fetchByRecordIds` i
get-attendance/get-person/get-registrations). AC: (1) gemensam modul i
`supabase/functions/_shared/` (mapEvent + deriveManadAr), samma SSOT-mönster
som field-allowlists; (2) alla fyra EF:erna importerar den — ingen
beteendeändring, API-testerna gröna; (3) batch-läsnings-tripletten tas i
samma refactor eller bokförs som eget kort.

**TASK-24 — update-event mot okänt rec-ID ger 500, inte 404 (priority: high)**
Född `9eab457f` (2026-07-22). Öppet: `update-event/index.ts` saknar
404-mappning (grep NOT_FOUND/404: 0 träffar; generisk
`mapErrorToResponse`-catch rad 287), medan `get-event/index.ts:218-224` bär
det explicita 404-kontraktet. AC: (1) update-event mappar Airtable PATCH-404
till 404 med get-event-klassens `{error}`-form; (2) kontraktstest i
`tests/api/` (deny-svitens mönster) mot påhittat rec-ID asserterar 404;
(3) övriga write-EF:er med samma klass sveps eller bokförs.

**TASK-25 — globala `*:focus-visible` sätter border-radius 2px (priority: high)**
Född `9eab457f` (2026-07-22). Öppet: `src/styles/base.css:213-217` sätter
fortfarande `border-radius: 2px` hårt — kapselytor (SlideToConfirm,
ToggleButtonGroup-piller) tappar sin radie vid tangentbordsfokus. AC:
(1) fokusringen följer elementets egen radie (`border-radius: inherit` eller
radie-neutral ring-teknik); (2) visuell verifiering på kapselytorna vid
tangentbordsfokus; (3) ingen regression i specialfallen
`.focus-ring-inset`/listbox (base.css §226–258); (4) design-review godkänd
(Marcus i browsern) — kortet är flaggat till review-vågen.

**TASK-27 — tidszons-klassen i e2e-sviten (Node-UTC mot browser-Stockholm)**
Född `2bf743a2` (2026-07-22, 18.8-diagnosen). Öppet — klassen upprepas:
ursprungsinstansen löstes i `hem.acceptance.test.ts` men `task-201.6` (rad
46) bokför en NY instans i `mer-aktivitetshistorik.acceptance.test.ts`
(CI-run 31633396902, 2026-08-12) fixad ad hoc med egen `lokalTid()`. Den
efterfrågade delade hjälparen finns aldrig. AC: (1) inventering av
Node-sidiga datumkonstruktioner i `tests/e2e/**` + `tests/acceptance/**` som
jämförs mot browser-renderad text; (2) EN delad Stockholm-förankrad
datum-hjälpare ersätter ad hoc-varianterna; (3) kända upprepnings-filer
migrerade; (4) valfritt: grind som flaggar nya Node-lokala
datumkonstruktioner utan explicit `timeZone`.

**TASK-28 — persist-hydrerings-klassen i flerscenario-e2e**
Född `a4091be3` (2026-07-22, 18.8-diagnos runda 2). Delvis överspelad (18.8:s
instanser fixade; merparten av flerscenario-e2e flyttad till MSW-mekanism i
acceptance-klassen), men kvarvarande `tests/e2e/*.staging.test.ts` med
`page.route`+reload finns (auth-flow, pwa-offline) och ingen
konventionsregel skrevs. AC (nedskalad yta): (1) svep av kvarvarande
staging-e2e (utom `persist-cache.staging.test.ts` som AVSIKTLIGT testar
mekanismen) efter mönstret ny mock + samma query-nyckel + reload;
(2) konventionsrad (ADR-072 eller tests-README): distinkta id per scenario;
(3) inga fynd ⇒ kortet stängs med svepet som bevis.

**TASK-31 — get-person.staging asserterar exakt antal på en rollup**
Född `885dfca9` (2026-07-22, S75 batch 3). Öppet, orört:
`tests/api/get-person.staging.test.ts:219` har kvar `toHaveLength(2)`;
`task-87` (rad 55) bevisar att fällan är levande — en senare skiva fick
medvetet undvika att röra fixturen. AC: (1) rad 219 ersätts med
innehålls-baserad invariant (`arrayContaining`); (2) samma svep i
`get-persons.staging.test.ts:239`; (3) grep-svep i övriga
`tests/api/*.staging.test.ts` efter fler exakta längd-asserts på
rollup-/länkfält.

### Registerdrift och infrastruktur, 6 kort

**TASK-33 — `supabase/config.toml` har driftat**
Född `67cf7b80` (2026-07-23, S75 batch 4). Öppet och VÄRRE: 27
`[functions.*]`-poster mot 43 EF-kataloger — 16 saknas, inkl. `create-event`,
`get-event`, `update-event`, `get-person`. Ingen grind finns. AC: (1)
antingen komplettera config.toml ELLER en CI-grind som asserterar post per
EF-katalog; (2) om grind: fail-closed vid nya EF:er utan post.

**TASK-195 — Deno-EF:ernas modullänkning saknar grind (boot-fel når staging osedda)**
Född `21710438` (2026-08-10, S102 pausrapport; ur 147.7-boot-incidenten).
Öppet: `biome.json:15` exkluderar `supabase/functions`; noll
`deno check`/setup-deno i workflows; `tsconfig.edge-shared.json` typekollar
bara `_shared`, aldrig EF-index. AC: (1) config-driven CI-grind som länkar
varje `supabase/functions/*/index.ts` och fäller import/export-mismatch;
(2) grinden reproducerar 147.7-felklassen i regressionsrigg; (3) placering
(PR-grind vs nightly) motiverad ur körtid; (4) `biome.json`-exkluderingen
dokumenterad som medveten.

**TASK-198 — nightly.yml:s felrad beskriver invariant 1 men fynden är invariant 2**
Född `71e88ee3` (2026-08-11). Öppet: nightly.yml (~rad 428–445) har EN gren
för KOD=1 med generisk invariant-1-text; skriptet skiljer själv tre
invarianter. AC: (1) felraden skiljer invariant 1/2/3 (eller återanvänder
skriptets per-invariant-summering); (2) åtgärdstext korrekt per invariant;
(3) regressionstest: simulerad invariant-2-fällning ger invariant-2-text.

**TASK-200 — `airtable-constraints` P24 föråldrad + tre falska PROD-varningar**
Född `2fde088a` (2026-08-11, bas-diff-passet). Öppet, båda delarna: P24 (rad
406–421) citerar den falska formuleringen; `field-allowlists.ts` (~rad
95/182/286) bär tre PROD-varningar som prodbas-synk-researchen redan
bekräftat föråldrade (fld4Flif4NoFnNsxS, fldrjj61ovL3Zv1mN,
tblaUhH1KF9k9imul). AC: (1) P24 rättas mot tvåserver-verkligheten; (2) de
tre falska varningarna bort/uppdaterade med research-hänvisning; (3) de två
sanna varningarna (Bilagor/Kvitton) verifieras fortfarande sanna och lämnas.

**TASK-204 — Nyckelmigrering legacy Supabase-nycklar → nya nyckelsystemet**
Född `c5d97dcd` (2026-08-12; ur läckt staging service_role-JWT-incident).
Fullt öppet — säkerhetsgolv: 13 EF-filer refererar
`SUPABASE_SERVICE_ROLE_KEY`, inga `sb_publishable_`/`sb_secret_`-spår,
`/to-issues` aldrig kört. AC: (1) `/to-issues` bryter arbetsenheten (staging
före prod, 38 EF:er, anon→publishable); (2) sekvenseringsbeslutet explicit
Marcus; (3) varje steg källbelagt kvitto (TASK-203-disciplinen);
(4) rotations-runbook EFTER migreringen.

**TASK-207 — staging Edge Runtime/Airtable transienta 502/503 i post-merge**
Född `4f121b76` (2026-08-13, S105 D3-C-triagen). Öppet: fem endpoints, tre
oskyldiga PR:er (first-parent-diff-bevisade), två fönster — strukturellt
oförenligt med kodregression; nästa steg står i kortet (plattforms- vs
kontentionsdiagnos). `TASK-205` (Done) täcker en ANNAN klass och pekar
uttryckligen hit. AC: (1) avgör plattforms- vs kontentionsorsak (Supabase
status-historik för projektet kring fönstren + sessionsloggens
samtidighets-korrelation); (2) om kontention: beslut om mutex/kö för
post-merge mot staging (jfr TASK-77/78-gränserna); (3) om plattform:
signalvärdes-varning i stället för röd fällning (TASK-205-mönstret);
(4) triage-metodnoten (first-parent-diff, `gh pr diff`-fällan) lyfts till
varaktig yta. *(Filnamnet `test-title.md` — se § Metod.)*

### Design-/a11y-fynden ur 18.15/18.16-reviewvågen, 2 kort

**TASK-40 — Numrutans prefers-contrast-more-avgränsning**
Född `e338782c` (2026-07-25, 18.15-review). Öppet i BÅDA
NumRuta-kopiorna (`Atgarder.tsx:60-68`, `AtgardsSida.tsx:216-225`) — saknar
`contrast-more:border-border-strong` medan kortytan i samma fil har mönstret.
AC: (1) Marcus-beslut: kant ELLER dokumenterat undantag; (2) om kant:
identiskt i båda kopiorna; (3) visuell verifiering i
contrast-more-emulering; (4) 18.15-facitets mått opåverkade.

**TASK-41 — Fokusring på success-grön botten ~1,7:1 i inset-ytor**
Född `6fbe1db3` (2026-07-25, 18.16-review). Öppet: tokenvärdena oförändrade
(`--p-green-500: #606b57`, `--mm-focus-ring` = `--p-blue-700` #1B4965 —
~1,7:1, under WCAG 1.4.11:s 3:1); ingen checklist-regel för fallet. AC:
(1) compliant fokusring-lösning för inset-läget mot success-botten (≥3:1);
(2) vakt-rad i ACCESSIBILITY-CHECKLIST.md; (3) konkret förekomst i appen
identifierad (annars omprövas prioritet); (4) axe/kontrasttest grönt.

### Produkt-/datakvalitetsfynden ur 18.17-vågen, 2 kort

**TASK-43 — Interna noteringar på anmälan saknar författare/tidpunkt**
Född `220ea190` (2026-07-25, 18.17-review). Öppet med starkast möjliga
belägg: `AnmalanDetail.tsx:590-593` namnger själv task-43 som lösningens
hemvist ("Målbilden är Anteckningar-mönstret (ADR-075) utvidgat till
anmälningar — egen skiva/ADR-kandidat (task-43)"). AC (ur kodens egen
kommentar): (1) additiv Anteckningar-tabell för anmälningar
(ADR-075-mönstret); (2) server-satt författare ur JWT; (3) migreringsbeslut
för dagens Notering-data; (4) staging först (ADR-063/ADR-050).

**TASK-44 — Anmälans käll-URL/UTM saknar formulär och basfält**
Född `220ea190` (2026-07-25). Öppet: `get-registration/index.ts:84-85,
197-198` levererar hårdkodad null med kommentaren "BAS-GAP (öppet bokfört i
kortet, AT-Max/ADR-063-kandidat)"; `data-model.md:328-341` visar UTM-fält
enbart på Väntelista, inte Anmälningar. AC: (1) formulärfält för
käll-URL/UTM; (2) additiva basfält på Anmälningar (ADR-063-mönster, staging
först); (3) get-registration-mappningen fylld (null-raderna bort); (4)
e2e/api-kontrakt verifierar fälten i AnmalanDetail.

### Refactor-/arkitekturfynden ur 18.18/18.19-vågen, 3 kort

**TASK-45 — Kommande-filtret + närmast-först i två grammatiker**
Född `744b8c0b` (2026-07-25, 18.18). Delvis byggt (groupByMonth lyft till
`manadsgrupp.ts`), men huvudfyndet kvarstår: `EventsList.tsx:42-49` och
`EventValjare.tsx:144-149` implementerar samma filter+sort oberoende. AC:
(1) filter+sort lyfts till delad funktion; (2) båda konsumenterna anropar
den; (3) ORDLISTA-regeln ("Period" ur startdatum, aldrig Status; odaterade
sist) kodifierad EN gång; (4) oförändrad rendering via befintliga e2e-sviter.

**TASK-46 — Dynamisk sidtitel i route-lagret (RouteAnnouncer-tävlingen)**
Född `1f950d6a` (2026-07-25, 18.19). Öppet: `RouteAnnouncer.tsx:17-20` pekar
själv hit ("Grundorsaken … är routad som eget kort");
`EventDetail.tsx:107-124` bär kvar sin lokala re-assert-motoffensiv. AC:
(1) EN titel-ägare i route-lagret; (2) EventDetails lokala re-assert rivs
utan regression; (3) annonsering + `document.title` koherenta; (4) e2e
(`toHaveTitle`) grön för detaljvy-mönstret utan sid-lokala workarounds.

**TASK-47 — E2e-fixture-konsolidering (delade stub-helpers)**
Född `1f950d6a` (2026-07-25, 18.19 utanför-scope). I huvudsak öppet:
`tests/e2e/helpers/` har två filer; `mockNotes` dupliceras i 3 filer,
get-registrations-stubben i 13. AC: (1) gemensam fixture-modul för minst
mockNotes + get-registrations-stubben; (2) berörda sviter migrerade;
(3) default-väljarlistans event-ID-bifynd städat på köpet; (4) full e2e-svit
grön.

### S102-fynden (2026-08-10), 3 kort

**TASK-187 — Cursor-conformance faller på delad staging-datas storlekskant**
Född `445d6f81` (2026-08-10, S102 våg 4). Öppet: `cursor-conformance.ts` och
dess enda konsument orörda sedan mintningen; `FIXTURE_PREFIX =
'ZZ-Conformance Person'` är statiskt delat, ingen frys-mekanism. AC:
(1) diagnos verifierad (mutation av delad mängd mellan sidhämtningar?);
(2) körnings-unik sentinel eller count-snapshot-validering; (3) 0 fällningar
över tillräckligt n efter fix (`npm run metrics:flake`-disciplinen);
(4) grönt i samma Staging-jobb som föll (runs 31382290186/31383085989).

**TASK-189 — toMatchAriaSnapshot är subset-matchning; TILLAGD form fälls inte**
Född `445d6f81` (2026-08-10). Öppet: inget i `docs/decisions/` eller senare
kort löser containment-gapet (ADR-104 nämner regressionslåset men inte
exakt-kontra-subset). AC: (1) web-research (`playwright.dev` förstapartskälla)
om exakt-matchningsalternativ, källbelagd; (2) vald lösning implementerad
(exakt-läge eller egen diff av facit-yml mot `locator.ariaSnapshot()`);
(3) mutationstest: TILLAGD DOM-nod i godkänd yta fäller RÖTT; (4) befintliga
gröna facit-tester oförändrade.

**TASK-190 — create-event mappar Airtable-valideringsfel till generisk 500**
Född `bba7880a` (2026-08-10, S102 Del 4; samma dag omformulerat från
"odiagnostiserad 500" till felklassningsfrågan). Öppet:
`_shared/errors.ts` klassar bara redan-kastade `HttpError` som 4xx — rått
Airtable-valideringsfel faller till generisk 500 (rad 116–120);
`create-event/index.ts` har ingen egen fångst. AC: (1) Airtables
valideringsavvisning (422/INVALID_VALUE) klassas som 4xx med fältnamn;
(2) verifierat med kortets egen repro (ogiltig singleSelect-payload);
(3) API-test asserterar 4xx + fältnamn; (4) mönstret återanvändbart för
övriga write-EF:er.

**TASK-193 — send-action-email-bilagor saknar explicit content-type**
Född `491afd57` (2026-08-10, S102 våg 5). Öppet, verifierat i koden:
`send-action-email/index.ts:219-222` mappar attachments utan `type`-fält —
Resend faller till `application/octet-stream`. AC: (1) research mot Resends
attachment-schema (fältnamn/form), källbelagd; (2) `type` satt (statiskt
`application/pdf` eller mime-lookup ur filändelse); (3) verifierat utskick
servar rätt Content-Type; (4) ev. API-test utökat.

### QA-kortet, 1 kort

**TASK-213.11 — QA: Kontinuerlig bas-maxning våg 1**
Född `0dcaf00e` (2026-08-14, TASK-213 PRD + tio skivor + QA). Öppet och
AKTUELLT: samtliga syskon 213.1–213.10 är To Do — QA-planen ligger korrekt
sist i en pågående våg. Signal-lösheten är AVSIKTLIG per kortets egen text
("Acceptance Criteria: Ingen — detta är en manuell testplan, inte ett
AC-kort (per QA-konventionen)"). Rekommendationen är BEHÅLL utan
AC-tillägg — men det exponerar en grind-designfråga för Marcus:
QA-konventionens kort kommer ALLTID stå i denna lista. Överväg en
`qa-manuell`-etikett (eller återanvänd `intentionally-open`) som grinden
undantar, så klassen inte återfyller listan. (Det är en grind-fråga, inte
ett fel på kortet.)

---

## OKLART — 5 beslutspunkter för Marcus

**1. TASK-21 — bulk-betalningsvertikalernas hemvist** (född `9eab457f`,
2026-07-22). Halva fyndet är byggt: betalningspåminnelse-bulken är skarp på
åtgärdssidan (`AtgardsSida.tsx:420`, urvalsfilter `obetald`, TASK-147.x).
"Markera alla obetalda som betalda" finns däremot INTE — ingen bulk-write,
och `EventRegistrations.tsx:66` avgränsar sig uttryckligen från
betalnings-write. **Frågan:** ska "markera alla obetalda som betalda"
byggas som bulk-write (pessimistisk form per TASK-18 PRD beslut 20) — och i
så fall var (åtgärdssidan?) — eller avslås den vertikalen explicit?

**2. TASK-30 — beläggningsuppdelningen och Källa-tillstånden** (född
`885dfca9`, 2026-07-22). `get-event` härleder i dag väntelista-bucketen ur
Väntelista-TABELLEN (inte Källa-värdet), och koden dokumenterar sedan
task-18.2 att Källa=Manuell/Väntelista MEDVETET inte räknas. Men
`ManuellAnmalanForm.tsx` skapar riktiga Källa=Manuell-rader utan att synka
NUMBER-fältet "Manuella platser" — uppdelningens summa kan divergera från
`Antal anmälda` utan att någon ser det. **Frågan:** är detta en accepterad,
avsiktlig arkitektur — eller ska uppdelningen reconciliera mot
`antalAnmalda` så en admin ser om en rad tappats?

**3. TASK-32 — publiceringsflaggans läs-väg** (född `67cf7b80`,
2026-07-23). Oförändrat: flaggan skrivs bara vid create, exponeras aldrig i
get-event/get-events, kan inte ändras. Dessutom hård blockerare:
PROD-fältet är inte skapat (endast staging; `field-allowlists.ts:182-183`,
data-model §Kända fällor 37). **Frågan:** behöver Lotta kunna SE och ÄNDRA
publiceringsstatus efter skapandet — ska get-event/get-events exponera
fältet och update-event tillåta ändring (kräver även att prod-fältet
skapas i basen)?

**4. TASK-39 — röststyrnings-gapet i åtgärds-radernas nummer** (född
`e338782c`, 2026-07-25). Siffrorna 1–6 är fortfarande `aria-hidden` dekor;
manualarbetet som utlöser beslutspunkten har inte startat. **Frågan:** ska
numret läggas i tillgängliga namnet (reviderar AT-paritetsbeslutet från
18.15/S83 öppet), ska framtida manualspråk bära radNAMNET i stället för
siffran, eller avslås röststyrnings-referensen explicit? Behöver svar innan
manualer/instruktionsvideor för åtgärdssidan skrivs.

**5. TASK-199 — prod-frontens deploy-väg / Vercel Skew Protection** (född
`71e88ee3`, 2026-08-11). I allt väsentligt utredd och åtgärdad (ADR-047 §
Updates 2026-08-13 ×2: kärnpremissen falsifierad, SW-precache-risken
åtgärdad med AppUpdateBanner + chunk-laddningsfallback + tester). Kvarstår
ENDAST det bokförda "MARCUS-BESLUT KVARSTÅR" (ADR-047 rad 253–286).
**Frågan:** ska Vercel Skew Protection byggas (plan-verifiering + egen
`renderBuiltUrl`-implementation för Vite) för det sista
nätverks-gap-fönstret — eller räcker dagens AppUpdateBanner+fallback
permanent? "Räcker" ⇒ stäng kortet mot ADR-047; "bygg" ⇒ skriv om kortet
till den skivan.

---

## Nästa steg (efter Marcus kvittens — INGET utfört i detta pass)

1. **STÄNG-klassen (9 kort):** stängs via backlog-CLI:t med final-summary
   som citerar denna rapports källor. OBS: eftersom korten saknar AC går
   `--check-ac` inte att använda — stängningsformen behöver prövas mot
   CLI:t (DoD-bockning + `-s Done --final-summary`).
2. **BEHÅLL-klassen (26 kort):** AC-förslagen ovan skrivs in per kort via
   CLI:t (`--ac`), så grinden kan bedöma dem framåt.
3. **OKLART-klassen (5 kort):** Marcus besvarar frågorna ovan; svaren
   verkställs som (1) eller (2).
4. **Grind-designfrågan** (QA-konventionens kort, se TASK-213.11) beslutas
   separat.
