---
owner: marcus803
updated: 2026-09-18
review_by: 2026-12-18
status: draft
---

# Actions-minutbudgeten — var minuterna går, och vilken design som håller under 50 000 (2026-09-18)

> **Vad jag redan hade att stå på.** Jag läste först
> [`docs/research/repo-privat-konsekvenser-2026-09-18.md`](repo-privat-konsekvenser-2026-09-18.md)
> (§ B1 — prisformeln, kvoten, augustis 76 080 minuter; filen är OSPÅRAD i
> detta arbetsträd), hela
> [`ci-djupgranskning-2026-09-17/08-risk-redundans-flakighet-tid-och-kostnad.md`](ci-djupgranskning-2026-09-17/08-risk-redundans-flakighet-tid-och-kostnad.md)
> och åtgärdsplanens
> [`10-migrations-och-atgardsplan.md`](ci-djupgranskning-2026-09-17/10-migrations-och-atgardsplan.md)
> (§ SE1, § SE2, § De övriga sjutton, § Inte alls), plus
> [`ADR-036`](../decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md),
> [`ADR-076`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md),
> [`ADR-077`](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
> och [`ADR-097`](../decisions/ADR-097-arbetsformens-tillstandsbarare.md)
> § Decline-rationale.
>
> **Vad de redan täckte:** att samma träd testas upp till fyra gånger per
> landning, att merge-dedupen sällan träffar, och att tio av fjorton
> dokumentationsgrindar kör alltid-på. **Vad som var åldrat:** kostnadssidan.
> Djupgranskningen skrev rakt ut att *"minuterna är gratis"* (repot är
> publikt) och räknade därför konsekvent i **körtid**, aldrig i
> **fakturerbara minuter** — de två talen skiljer sig med 27 procent på
> grund av avrundning, och rangordningen mellan åtgärderna ändras när man
> byter mått. **Vad som är nytt här:** en fakturaverifierad minutbudget per
> yta och per jobb, mätningen att enhetskostnaden har mer än fördubblats
> sedan augusti, och en räknad optionsrymd mot ett tak.
>
> **Ett redan fattat beslut som binder:** `ADR-097` § Decline-rationale har
> redan avvisat *"session-batchad push"* med fyra skäl. Jag föreslår inte om
> den — men jag mäter vad den hade varit värd, eftersom talet är stort och
> Marcus fråga uttryckligen gäller arbetsformen (§ Spak S8).

## Kort svar

**Är något fundamentalt fel? Ja — men inte det du tror.** Kostnaden i
kronor är noll i dag. Augustis 76 080 minuter fakturerades till 456,48
dollar och rabatterades sedan till **0,00** — eftersom repot är publikt, och
publika repon kör gratis. Frågan blir skarp först om repot görs privat.

**Var går minuterna?** Samma kod testas fyra gånger per landning: på
förslaget (PR), i kön, på huvudgrenen efter landning, och i efterkontrollen.
De fyra ytorna är **87 procent** av augustis minuter. Säkerhetsskanningen
(CodeQL) är 13 procent. Nattkontrollen är 2 procent — den är inte problemet.

**Det som verkligen oroar är inte augusti — det är i dag.** Sedan augusti
har testsviten delats i tre parallella bitar och vuxit. Väntetiden halverades,
men **priset per körning har mer än fördubblats**: en kodlandning kostade
94 minuter i augusti och kostar **190 minuter i dag**. Kör vi augusti igen
med dagens uppsättning landar månaden på cirka **138 000 minuter** — nästan
tre gånger fribeloppet, ungefär **527 dollar i månaden**.

**En fjärdedel av notan är ren avrundning.** Varje jobb avrundas uppåt till
hel minut. 40 procent av alla jobb är kortare än 30 sekunder och betalar
ändå en hel minut. 27,5 procent av det fakturerade är alltså luft.

**En ren textändring kostar 35 minuter.** Mätt exakt på landning `#2517`
(två markdown-filer): 10 + 9 + 9 + 2 + 5 minuter över fem separata
körningar. Sådana landningar är **68 procent** av alla landningar och
**22 procent** av minuterna.

**Går målet att nå?** Ja — men inte med små justeringar. Att stänga av
huvudgrenens omkörning och låta textändringar slippa kodgrindarna räcker
**inte** (landar på ~91 000). Först när den fulla sviten körs **en enda
gång per landning** — i kön, som Rust gör — landar månaden på cirka
**53 000**, och med ett av fyra ytterligare steg klart under 50 000. Vill
du ha marginal ned mot 30 000 krävs att antalet textlandningar minskar,
och det är ett arbetsforms-beslut som `ADR-097` redan sagt nej till en gång.

---

## Metod, och hur talen ska läsas

**Varje tal är märkt.** *MÄTT* = hämtat ur GitHubs API eller faktura i dag.
*HÄRLETT* = räknat ur mätta tal med en utskriven formel. *ANTAGET* = en
bedömning jag gjort, alltid med skälet utskrivet.

**Faktureringsregeln, verifierad mot förstapartskällan** (och inte antagen —
den avgör hela avrundningsavsnittet):

> "GitHub rounds the minutes and partial minutes **each job** uses up to the
> nearest whole minute."
> — [GitHubs prislista för runners](https://docs.github.com/en/billing/reference/actions-runner-pricing), hämtat 2026-09-18

Avrundningen sker alltså **per jobb**, inte per körning. Ett arbetsflöde med
fjorton jobb betalar fjorton uppåtavrundningar.

**Varför jag inte kunde använda GitHubs egen minutrapport per körning.**
Ändpunkten `/actions/runs/<id>/timing` returnerar `total_ms: 0` för det här
repot — *MÄTT* på körning `35335750664`. Förstaparten förklarar varför:

> "Billable job execution minutes are only shown for jobs run on **private**
> repositories ... There are no billable minutes when using GitHub Actions in
> public repositories"
> — [GitHubs sida om jobbens körtid](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time), hämtat 2026-09-18

Jag har därför byggt en egen modell: för varje jobb `ceil((completed_at −
started_at) / 60)`, summerat per körning. Hoppade jobb kostar noll.

**Modellen är validerad mot den verkliga fakturan, tre gånger:**

| Fönster | Modell | Faktura (`billing/usage`) | Kvot |
|---|---|---|---|
| Augusti 2026, hela månaden | 78 013 ± 2 891 min | **76 080 min** | 1,025 |
| 8–17 september 2026 | 5 765 min | **5 656 min** | 1,019 |
| Augusti, rekonstruerad ur landningsmodellen | 73 481 min | **76 080 min** | 0,966 |

Alla tre ligger inom ett standardfel. Modellen bär alltså talen den ska bära.

**Urvalet.** Augusti hade **9 117** arbetsflödeskörningar (*MÄTT*, hämtade
dygn för dygn — ändpunkten kapar vid 1 000 träffar per fråga, vilket är
skälet till fönstringen). Jag drog ett stratifierat slumpurval på **418**
körningar och hämtade jobbdata för var och en; för september ytterligare
**171**. Osäkerheten nedan är beräknad med ändlig-population-korrektion.

**Kötid är inte inräknad och ska inte vara det.** *MÄTT* på 346 jobb:
mediankön mellan `created_at` och `started_at` är **2 sekunder**, medel 3,2
sekunder. Kön är alltså inte en dold kostnad här.

---

## (A) Mätningen

### A1 — Augustis minutbudget per yta

*MÄTT.* `N` = antal körningar i augusti. `fakt.min/körn` = medelvärde i
urvalet. `±SE` = ett standardfel på månadssumman.

| Yta (arbetsflöde × händelse) | N | n | fakt.min/körn | mån-min | ±SE | % |
|---|---|---|---|---|---|---|
| **`CI` på förslaget** (`pull_request`) | 1 829 | 100 | 13,59 | **24 856** | 1 761 | 32,7 |
| **`CI` i kön** (`merge_group`) | 1 504 | 100 | 10,07 | **15 145** | 1 051 | 19,9 |
| **`Post-merge`** (efterkontroll) | 1 279 | 80 | 10,31 | **13 190** | 1 724 | 17,3 |
| **`CI` på huvudgrenen** (`push`) | 1 279 | 80 | 10,20 | **13 046** | 1 063 | 17,1 |
| CodeQL på förslag (`dynamic`) | 1 852 | 40 | 2,92 | 5 417 | 201 | 7,1 |
| CodeQL på huvudgrenen (`dynamic`) | 1 279 | 35 | 3,66 | 4 677 | 103 | 6,1 |
| `Nightly` (nattsviten) | 31 | 10 | 41,80 | 1 296 | 45 | 1,7 |
| Övrigt (nattvakt, baslinjer, bevis-körningar) | 60 | 32 | — | 386 | — | 0,5 |
| **Summa** | **9 117** | **418** | | **78 013** | **± 2 891** | **100** |

**De fem största posterna** är de fyra ytor som testar samma träd, plus
CodeQL. De fyra ytorna ensamma: **66 237 minuter, 87 procent**.

**Ett fel i uppdragets premiss, värt att notera:** premiss 1 räknade upp
1 829 + 1 504 + 2 559 + 62 + 28 = 5 982 körningar. Den verkliga siffran är
9 117. Skillnaden är händelsetypen **`dynamic`** — 3 135 körningar, hela
CodeQL-ytan — som saknades i uppräkningen. Den är alltså **den enskilt mest
talrika** händelsetypen i repot och var osynlig.

### A2 — Inom `CI`, per jobb

*MÄTT*, augusti. `förek` = andel av körningarna där jobbet faktiskt kördes
(resten var hoppade och kostade noll).

**På förslaget (`pull_request`), 24 856 min:**

| Jobb | förek | sek | mån-min | % |
|---|---|---|---|---|
| `Test suite / Acceptance (hermetisk)` | 53 % | 478 | 8 194 | 33,0 |
| `Lint + Audit + TypeCheck` | **101 %** | 125 | 4 682 | 18,8 |
| `Acceptance — tvåsidigt bevis (hermetik)` | 25 % | 458 | 3 713 | 14,9 |
| `Test suite / Webblasarbeteende` | 52 % | 84 | 1 920 | 7,7 |
| `Detect changed files` | **101 %** | **10** | 1 847 | 7,4 |
| `CI Passed or Skipped` | **101 %** | **3** | 1 847 | 7,4 |
| `Docs link check` | 89 % | 48 | 1 683 | 6,8 |
| `Test suite / Pure + Build` | 53 % | 37 | 969 | 3,9 |

Läs de två fetstilta raderna i mitten: `Detect changed files` tar **10
sekunder** och `CI Passed or Skipped` tar **3 sekunder**. Tillsammans
13 sekunders arbete — som faktureras **två hela minuter per körning**, och
de kör på varenda körning på varje yta. Summan över de fyra `CI`-ytorna i
augusti: **9 224 minuter**, alltså 12 procent av hela notan, för sammanlagt
drygt tjugo timmars verkligt arbete.

**I efterkontrollen (`Post-merge`), 13 190 min** är de två tyngsta jobben
`Staging (API + E2E)` (3 325 min) och `Acceptance (hermetisk)` (3 245 min).
Det första är **unikt** — det är enda stället hela flödet körs mot en
verklig Airtable-bas. Det andra är den fjärde körningen av ett test som
redan passerat tre gånger.

### A3 — Avrundningsspillet

*MÄTT* över 2 277 jobb med körtid i augustiurvalet:

| Mått | Värde |
|---|---|
| Fakturerat (avrundat per jobb) | 5 010 min |
| Verklig körtid | 3 630 min |
| **Ren avrundning** | **1 380 min = 27,5 %** |
| Jobb kortare än 30 sekunder | 910 av 2 277 = **40,0 %** |
| Jobb kortare än 60 sekunder | 1 451 av 2 277 = **63,7 %** |
| Jobbposter som var hoppade (kostade noll) | 776 |

**Slutsats:** drygt en fjärdedel av notan betalas för sekunder som aldrig
användes. Detta är den enskilt starkaste invändningen mot "många små, tydliga
jobb" som designprincip när minuter kostar pengar — och den syns inte alls
när man mäter i körtid, vilket är exakt vad djupgranskningen gjorde.

**Fast overhead per jobb** (*MÄTT* på 94 jobb, stegnivå): checkout,
nodinstallation, cacheåterställning och upprensning tar tillsammans **26
sekunder i medel, 18 procent av jobbtiden**. Cacheträffarna fungerar alltså
bra — overheaden är låg. Det betyder att när man delar ett jobb i tre, är det
inte overheaden som kostar mest utan **avrundningen**: tre jobb à 278
sekunder faktureras 15 minuter medan ett jobb à 774 sekunder faktureras 13.

### A4 — Vad en landning kostar

*MÄTT*, exakt, på en verklig ren dokumentlandning — `#2517`, två
markdown-filer (`docs/research/...` + `tasks/sessions/...`):

| Körning | Jobb som kördes | Fakturerbara minuter |
|---|---|---|
| `CI` på förslaget | 5 | 10 |
| `CI` i kön | 5 | 9 |
| `CI` på huvudgrenen | 5 | 9 |
| `Post-merge` | 2 | 2 |
| CodeQL "Push on main" | 2 | 5 |
| **Summa** | **19** | **35** |

Uppdragets premiss 2 angav exakt dessa 35 minuter. **Premissen håller,
verifierad oberoende.**

Motsvarande för en kodlandning, *HÄRLETT* ur klassvisa medelvärden:

| Klass | Augusti | September (dagens uppsättning) |
|---|---|---|
| Ren dokumentlandning | 27,5 min | **37,6 min** |
| Kodlandning | 94,3 min | **190,0 min** |

Premiss 2:s hypotes — *"en landad kodändring kostar ~150+ min"* — **håller,
och underskattar**: dagens tal är 190.

**Fördelningen mellan klasserna** (*MÄTT*, klassificerat på om jobbet
`Test suite / Pure + Build` faktiskt kördes):

| Yta | Andel dokumentklassade körningar | Dokument-min | Kod-min |
|---|---|---|---|
| `CI` på förslaget | 48 % | 4 810 | 20 046 |
| `CI` i kön | 66 % | 5 475 | 9 671 |
| `CI` på huvudgrenen | 68 % | 4 652 | 8 393 |
| `Post-merge` | 68 % | 1 727 | 11 463 |
| **Summa fyra ytor** | | **16 664 (25 %)** | **49 573 (75 %)** |

Med CodeQL:s andel inräknad blir dokumentlandningarnas totala andel av
augustis minuter **cirka 22 procent** (*HÄRLETT*: 16 664 + ~6 700 CodeQL,
delat på 78 013). De är **68 procent av landningarna** men en dryg femtedel
av notan — de är alltså många och billiga var för sig, inte få och dyra.

### A5 — Omkörnings- och ersättningsspillet

*MÄTT* ur augustis körningslista:

- `cancel-in-progress` **är** påslaget på förslagsytan och avstängt i kön
  (`ci.yml:43-45`) — avsiktligt, eftersom en avbruten kökörning fäller hela
  kön. Det är rätt gjort och är inte en spak som återstår.
- **129 av 1 829** förslagskörningar (7,1 %) avbröts av en ny push. De
  kostade partiella minuter men mekanismen gör sitt jobb.
- **1 402 distinkta grenar** gav 1 829 körningar. **17 procent av grenarna**
  fick mer än en körning; **427 körningar (23 %)** var omkörningar efter en
  ny push. Median 1, medel 1,3, max **25** på en enda gren.
- Djupgranskningens tal *"34 procent av grenarna fick mer än en körning"*
  (leverabel 9) **stämmer inte överens med min mätning** på hela augusti
  (17 %). Skillnaden beror sannolikt på mätfönster — leverabel 9 mätte ett
  nittondagarsfönster, jag mätte 31 dygn. Jag har inte rekonstruerat deras
  fönster; **flaggas som avvikelse, inte som fel**.
- 1 504 kökörningar gav 1 279 landningar på huvudgrenen — **kvot 1,18**.
  Kön testar alltså varje förslag för sig, och grupperingen sparar knappt
  något. 39 kökörningar misslyckades (2,6 %); var och en av dem konsumerade
  en armering.

### A6 — Det som ändrats sedan augusti: enhetskostnaden har mer än fördubblats

**Detta är passets viktigaste enskilda fynd, och det fanns inte i något
befintligt underlag.** *MÄTT*, samma metod, september (8–17) mot augusti:

| Yta, kodklassad körning | Augusti | September | Förändring |
|---|---|---|---|
| `CI` på förslaget | 21,08 min | **43,32 min** | +106 % |
| `CI` i kön | 18,91 min | **42,19 min** | +123 % |
| `CI` på huvudgrenen | 20,19 min | **40,40 min** | +100 % |
| `Post-merge` | 27,58 min | **56,42 min** | +105 % |
| Nattsviten | 41,80 min | **64,00 min** | +53 % |
| `CI` på förslaget, **dokumentklassad** | 5,48 min | **11,00 min** | +101 % |

Orsakerna, var för sig *MÄTTA*:

1. **Skärvningen.** `Acceptance (hermetisk)` gick från **ett** jobb à 467
   sekunder till **tre** jobb à 278 sekunder (`ci-suite.yml:366-372`,
   matrisen `[1,2,3]`). Väggklockan halverades — men det fakturerade gick
   från 8,3 till **16,3 minuter per körning**. Skärvning byter väntetid mot
   pengar, ungefär en mot en.
2. **Sviten har vuxit.** Det tvåsidiga hermetikbeviset gick från 432 till
   **739 sekunder** väggklocka (+71 %) mellan augusti och september, utan
   att skärvas.
3. **Lintjobbet delades och blev långsammare.** `Lint + Audit + TypeCheck`
   (125 s, 2,5 fakt.min) är nu `Lint + TypeCheck` (224 s) **plus**
   `Audit dependencies` (52 s) — alltså **5,5 fakturerbara minuter** där det
   förut var 2,5. Båda kör alltid, på varje yta, även för en markdown-fil.

**Och sedan i dag, 2026-09-18 kl 11:54, landade N6** (`#2524`,
`TASK-366`) och skärvade även det tvåsidiga beviset i tre. *MÄTT* på
huvudgrenskörning `35341976159` direkt efteråt: **45 fakturerbara minuter**,
där beviset nu är tre jobb (5 + 6 + 5 min = 16) i stället för ett (12–13
min). **Uppdragets premiss 4 föll på två punkter:** PR:en är inte längre
"ej landad" — den är MERGED — och den *"sänker inte minuterna"* är för
milt: den **höjer** dem med cirka 4 minuter per kodkörning, alltså
uppskattningsvis **9 100 minuter i månaden** vid augustis takt. Väntetiden
halveras, vilket var syftet; priset är ett annat än beskrivet.

**Baslinjen framåt** (*HÄRLETT*: augustis volym och klassblandning, dagens
enhetskostnad efter N6):

| | Minuter/månad | Överskott över 50 000 | Kostnad |
|---|---|---|---|
| Augusti, som den faktiskt fakturerades | 76 080 | 26 080 | 156 USD |
| **Augustis arbetstakt med dagens uppsättning** | **≈ 137 800** | **≈ 87 800** | **≈ 527 USD/mån** |

Det här är designpunkten som resten av dokumentet räknar mot. Att september
hittills bara förbrukat 33 915 minuter beror på **volym, inte design**:
27 runda körningar per dygn mot augustis 59, och åtta nästan helt stillastående
dygn (9–16 september: 60–70 minuter per dygn, alltså bara nattkontrollen).

### A7 — Merge-dedupen träffar nästan aldrig, och det är mätbart

`ci.yml:452-499` bär en mekanism som ska hoppa de tunga jobben på
huvudgrenen när trädet redan bevisats grönt. *MÄTT* i mitt urval: **samtliga
kodklassade huvudgrenskörningar körde hela sviten** — dedupen hoppade inget.
Det bekräftar oberoende djupgranskningens KG1-mätning (32 träffar av 32
möjliga, men bara 5,3 procent av pusharna var möjliga).

Skälet står i koden: villkoret kräver att merge-commitens träd är
**identiskt** med förslagets huvud, vilket bara gäller när huvudgrenen stått
still sedan grenen senast uppdaterades. Med 41 landningar per dygn står den
aldrig still. Mekanismen är byggd, korrekt, fail-closed — och verkningslös.

---

## (B) Spakarna

Varje spak: mekanism · räknad besparing · vad den kostar i skydd · precedent
· vilka beslut den rör. Besparingarna är räknade mot baslinjen 137 800
min/mån och är **inte additiva** (de överlappar) — paketen i del C räknas
kompositionellt.

| # | Spak | Min/mån | % | Vad det kostar |
|---|---|---|---|---|
| **S1** | Ta bort `CI` på huvudgrenen (`push:`) helt | **25 600** | 18,6 | Nätet under `N3`-hålet försvinner |
| **S1b** | `SE1` i stället: byt dedupen till SHA-identitet | 14 600 | 10,6 | Inget, om `N3` landat först |
| **S2** | Lätt förslagsyta, full svit bara i kön | **36 900** | 26,8 | Längre återkoppling till bygg-agenten |
| **S3** | Efterkontrollen kör bara det UNIKA (staging, a11y) | 15 100 | 11,0 | Fjärde acceptance-körningen bort |
| **S4** | Dokumentändring slipper typkontroll/Biome/audit | 14 000 | 10,2 | En textändring granskas av färre grindar |
| **S5** | CodeQL path-filtreras bort från dokumentändringar | 6 700 | 4,9 | Kräver byte till "advanced setup" |
| **S6** | Av-skärva `Acceptance` (3 → 1) | 7 500 | 5,4 | +8 min väntan per kodkörning |
| **S7** | Av-skärva hermetikbeviset (rulla tillbaka N6) | 9 100 | 6,6 | +5 min väntan per kodkörning |
| **S8** | Bunta dokumentlandningar 3:1 | 24 200 | 17,6 | Arbetsformen — `ADR-097` sade nej |
| **S9** | Urval efter påverkan i kön (Chromium-modellen) | ~6 200 | 4,5 | ≤5 % risk att missa en regression |

### S1 / S1b — den fjärde körningen på huvudgrenen

**Mekanism.** `CI` kör en fjärde gång efter landning, på ett träd kön just
testat. Antingen tas ytan bort, eller så lagas dedupen så att den frågar
*"har det här SHA:t redan en grön kökörning där sviten faktiskt KÖRDE?"*
i stället för att jämföra träd.

**Precedent, och den är exakt.** Kubernetes Tide gör precis den frågan:

> "Tide may merge a PR without retesting if the existing test results are
> already against the latest base branch commit."
> — [docs.prow.k8s.io, Tide maintainers](https://docs.prow.k8s.io/docs/components/core/tide/maintainers/), hämtat 2026-09-18

**Kostnad i skydd.** Åtgärdsplanens `SE1` är kategorisk: får inte göras före
`N3`, annars förlorar cirka 60 pushar per nitton dagar sitt sista nät. Den
regeln gäller oförändrat. Fällan som `SE1` namnger — att villkoret aldrig
får vara "körningen är grön" utan "sviten körde och var grön" — är verklig
och mätt i mina data: 68 procent av kökörningarna är gröna **med sviten
hoppad**.

**Rör:** [`ADR-077`](../decisions/ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
§ Beslut 2, åtgärdsplanens `N3` och `SE1`.

### S2 — full svit EN gång, i kön

**Mekanism.** Förslagsytan kör lint, typkontroll, bygge och de snabba
testerna. Hela acceptance-klassen och det tvåsidiga beviset kör **bara i
kön**, där de bevisar exakt det träd som landar.

**Precedent — Rust gör exakt detta, ordagrant:**

> "A small subset of tests and checks are run after each push to the PR."
>
> "Before a commit can be merged into the `main` branch, it needs to pass our
> complete test suite. We call this an `auto` build."
> — [rustc-dev-guide, Testing with CI](https://rustc-dev-guide.rust-lang.org/tests/ci.html), hämtat 2026-09-18

**Vad som händer med den obligatoriska kontrollen `CI Passed or Skipped`.**
Ingenting — men villkoret måste hållas. GitHub är kategorisk:

> "A merge queue will wait for required checks to be reported before it can
> proceed with merging."
>
> "Merge queue and pull requests checks are coupled and configured under
> branch protection rules or rulesets."
> — [GitHubs dokumentation om merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), hämtat 2026-09-18

Kontroll-**namnet** måste alltså rapporteras på båda ytorna — vilket repots
aggregatorjobb redan gör (`ci.yml`, jobbet `ci-passed`). Vad som körs
*under* namnet är fritt. **Jag hittade ingen förstapartskälla som
rekommenderar en lättare förslagsyta** — Rust och Prow är precedenten, inte
GitHubs egen dokumentation.

**Kostnad, ärligt.** Bygg-agenten får veta att acceptance brustit först i
kön. *MÄTT*: 96 av 1 829 förslagskörningar (5,2 %) misslyckades i augusti.
En fällning i kön sparkar posten ur kön och **konsumerar armeringen** — det
är dyrare per instans än ett rött förslag. Med 5 procents felfrekvens och
cirka 409 kodlandningar i månaden blir det ungefär **21 extra kö-varv per
månad** (*HÄRLETT*), à cirka 46 minuter = ~970 minuter. Det är inräknat i
marginalen och ändrar inte slutsatsen, men det ändrar **upplevelsen**: fel
upptäcks senare och kostar en omarmering.

**Rör:** [`ADR-036`](../decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)
(CI som enda mekaniska grind — oförändrat, grinden flyttar bara yta),
[`ADR-076`](../decisions/ADR-076-merge-grinden-ruleset-pr-flode.md),
[`ADR-080`](../decisions/ADR-080-acceptance-klassen-hermetisk-utbrytning.md),
och `CONTRIBUTING.md` § Rött-först (ett rött i kön måste fortsatt betyda
exakt en sak).

### S3 — efterkontrollen kör bara det den ensam kan

**Mekanism.** `Post-merge` kör i dag hela sviten en fjärde gång **plus**
`Staging (API + E2E)` mot en verklig Airtable-bas. Bara det sista är unikt.
Kvar: staging, a11y, sentinel-städningen, klassningen, exponeringsfönstret —
*HÄRLETT* 23,5 minuter i stället för 60,4.

**Kostnad i skydd.** Den fjärde hermetiska körningen försvinner. Eftersom de
tre första kör samma hermetiska tester på samma träd är förlusten liten —
**men den är inte noll**: efterkontrollen är enda ytan som kör på det
faktiskt landade trädet efter en gruppmerge. Det är precis det hål `N3`
finns för att stänga, vilket gör `N3` till förutsättning även här.

### S4 / S5 — dokumentlandningens 35 minuter

**Vad behöver en ren textändring egentligen?** *MÄTT* från `#2517`: av de 35
minuterna är 4 minuter dokumentgrindar (länkkontroll) och 1 minut klassning.
Resten — typkontroll, Biome, beroendegranskning, CodeQL — prövar kod som inte
ändrats.

**S4** flyttar typkontroll och Biome bakom kodvillkoret, så att en ren
markdown-ändring kör dokumentgrindarna plus aggregatorn. Detta är
åtgärdsplanens `SE2` **speglad**: `SE2` flyttar dokumentgrindarna bakom
dokumentvillkoret (rätt signal), S4 flyttar kodgrindarna bakom kodvillkoret
(minuterna). De bör byggas i samma ändring — annars blir mängden grindar i
lintjobbet motsägelsefull.

**S5, CodeQL.** *MÄTT*: repot kör CodeQL som GitHubs **"default setup"**
(`gh api .../code-scanning/default-setup` → `"state":"configured"`,
`"runner_type":"standard"`, fyra språk). I det läget finns ingen väg att
undanta sökvägar. Byte till "advanced setup" (en egen arbetsflödesfil) ger
`paths-ignore` — men med en viktig begränsning som förstaparten skriver ut:

> "They don't determine what files will be analyzed when the actions *are*
> run. When a pull request contains any files that are not matched by
> `on:pull_request:paths-ignore` ... the workflow runs the actions and scans
> all of the files changed in the pull request"
> — [GitHubs dokumentation om advanced setup](https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning), hämtat 2026-09-18

För vårt syfte räcker det: vi vill hoppa **hela körningen** vid ren markdown,
inte filtrera inuti den. **Men bytet har ett pris jag inte kan prissätta:**
default setup underhålls av GitHub och följer med när frågesviterna
uppdateras; en egen arbetsflödesfil blir vår att underhålla.

### S6 / S7 — skärvningen är en växelkurs, inte en förbättring

*MÄTT* och entydigt: skärvning **halverar väntan och fördubblar notan** för
det skärvade jobbet. Det är ett fullt legitimt val när minuter är gratis —
vilket de var när besluten fattades. Blir de inte gratis är det första
stället att titta.

**Detta är ingen rekommendation att riva N6.** Delningen löste ett verkligt
problem (fyra `cancelled`-avbrott på jobb-timeout en och samma dag,
`ci-suite.yml:526-532`). Spaken finns med för att beslutsunderlaget ska vara
komplett, och för att växelkursen ska vara känd nästa gång någon föreslår
en skärvning.

### S8 — färre landningar vid samma arbete

**Mätningen först.** Av augustis 1 279 landningar var **870 rena
dokumentlandningar** (*HÄRLETT* ur klassandelen 68 %). De kostar cirka 22
procent av minuterna. Buntas de tre och tre — samma innehåll, samma arbete,
en tredjedel så många landningar — faller cirka **24 200 minuter** bort.

**Detta är en arbetsforms-fråga, inte en CI-fråga, och den är redan avgjord
en gång.** [`ADR-097`](../decisions/ADR-097-arbetsformens-tillstandsbarare.md)
§ Decline-rationale avvisade *"session-batchad push"* med fyra skäl (parallell
nummerallokering, agentsynlighet mot origin, write-ahead-principen,
stor-batch-risken). Åtgärdsplanen upprepar avvisningen som `I8`.

**Vad jag ändå lägger fram — och skillnaden är inte semantisk.** `ADR-097`
avvisade att bunta **pushar**. Det jag mätt är att bunta **landningar**: en
gren får fortsätta ta emot pushar precis som i dag (ingen agentsynlighet
går förlorad, ingen write-ahead bryts), men flera färdiga dokumentenheter
landar i en PR i stället för tre. Orkestreraren gör redan detta i
stängningsbatchar. Frågan är om det ska vara normalform för dokumentarbete.
**Jag tar inte ställning — jag lägger talet på bordet, eftersom Marcus fråga
uttryckligen gäller arbetstakten.**

### S9 — urval efter påverkan

Repot har redan halva mekanismen: `changed`-jobbet klassar diffen, och
`scripts/acceptance-urval.sh` kan mata en delmängd spec-filer till
förslagsytan (`ci-suite.yml:430-437`). Att låta **kön** göra samma sak är
nästa steg — och det är precis Chromiums modell:

> "CQ Quick Run (QR) is a new CQ mode with the goal of delivering results
> faster. QR saves roughly 50% CPU time in exchange for at most a 5% chance
> of false negative."
> — [chromium.googlesource.com, CQ Quick Run (arkiverad revision `eb6a38f`)](https://chromium.googlesource.com/chromium/src/+/eb6a38f/docs/cq_quick_run.md), hämtat 2026-09-18

Prow gör det per jobb i stället, med ett filter på ändrade sökvägar:

> "`run_if_changed` and `skip_if_only_changed` accept a (Golang-style)
> regular expression which is run against the path of each changed file.
> `run_if_changed` triggers the job if any path matches."
> — [docs.prow.k8s.io, Jobs](https://docs.prow.k8s.io/docs/jobs/), hämtat 2026-09-18

**Vad det riskerar, och varför det är en riktig risk här.** Varje
branschledare som använder urval varnar för täckningsluckan i sin egen
dokumentation: Chromium anger ≤5 % falska negativ, Nx markerar alla projekt
som påverkade så snart låsfilen ändras ("a failsafe in case Nx misses a
project"), Jest kräver en statisk beroendegraf. Vår acceptance-klass testar
mot en låtsasvärld vars paritet mot verkligheten redan är den tystaste
risken i testarkitekturen (åtgärdsplanens `SE6`). Urval ovanpå det lager
skulle göra en tyst risk tystare. **Bör inte byggas före `SE6`.**

---

## (C) Paketen

Räknat kompositionellt: designparametrar in, minuter ut. Volym = augustis
1 279 landningar, 1 402 grenar, 1,3 körningar per gren. Enhetskostnad = dagens
(september, efter N6).

| Paket | Innehåll | Min/mån | Överskott | Kostnad |
|---|---|---|---|---|
| **BAS** | dagens design | **137 800** | 87 800 | **527 USD** |
| **P1 — minsta ingrepp** | S1 + S4 + S5 | **90 800** | 40 800 | **245 USD** |
| **P2 — branschledarform** | P1 + S2 + S3 | **53 000** | 3 000 | **18 USD** |
| **P2+ — samma, utan skärvning** | P2 + S6 + S7 | **49 500** | 0 | **0 USD** |
| **P3 — maximal besparing** | P2+ och S8 | **28 100** | 0 | **0 USD** |

Nedbrytningen per yta, så att det syns var minuterna tar vägen:

| Paket | Förslag | Kö | Huvudgren | Efterkontroll | CodeQL | Natt |
|---|---|---|---|---|---|---|
| BAS | 41 200 | 30 800 | 25 600 | 26 500 | 11 300 | 2 400 |
| P1 | 31 700 | 26 600 | **0** | 26 500 | 3 600 | 2 400 |
| P2 | 9 000 | 26 600 | **0** | 11 400 | 3 600 | 2 400 |
| P3 | 4 900 | 12 600 | **0** | 6 200 | 2 000 | 2 400 |

**Svaret på Marcus fråga, rakt:** ja, målet är nåbart — men **inte** med P1.
P1 är den intuitiva åtgärdslistan (stäng av den uppenbart överflödiga
körningen, låt textändringar slippa kodgrindarna) och den lämnar månaden på
91 000 minuter, nästan dubbelt över taket. **Först P2 — full svit exakt en
gång per landning — bryter genom.** P2 landar på 53 000, alltså marginellt
ÖVER taket; "lätt under" kräver ett fjärde steg.

**Fyra vägar från P2 ned under 50 000, i den ordning jag skulle pröva dem:**

1. **S9, urval efter påverkan i kön** — cirka −6 200 min → **46 900**. Kostar
   ≤5 % täckning enligt Chromiums egen mätning. Kräver `SE6` först.
2. **S6/S7, rulla tillbaka skärvningen** — −3 500 min → **49 500**. Kostar
   väntetid, inget skydd. Den ärligaste men mest impopulära.
3. **S8, bunta dokumentlandningar** — −21 400 min → **31 600**. Kostar
   ingenting i skydd; kräver ett arbetsforms-beslut mot `ADR-097`.
4. **Gör ingenting mer och betala 18 dollar i månaden.** Fullt rimligt.
   Poängen med P2 är inte att nå noll, utan att komma från 527 till 18.

**Byggordning mot nuvarande högar.** Ingen av spakarna bör byggas före
`N1`–`N3` — de är förutsättningar, inte konkurrenter:

| Steg | Vad | Varför i den ordningen |
|---|---|---|
| 0 | `N1`, `N2`, `N3` (redan planerade) | `N3` är hård förutsättning för S1 och S3 |
| 1 | S4 + `SE2` i samma ändring | Billigast, lägst risk, rör inget skydd på kod |
| 2 | S5 (CodeQL advanced setup) | Fristående; ingen beroendekedja |
| 3 | S1b (`SE1`, SHA-dedup) före S1 | Reversibelt steg först; S1 är den större ändringen |
| 4 | S3 (efterkontrollen trimmas) | Efter `N3` |
| 5 | **S2 — den stora** | Egen ADR. Flyttar var grinden bor |
| 6 | Mät om. Välj sedan mellan väg 1–4 ovan | Inte innan |

`SE1` och `SE2` ur åtgärdsplanen ligger alltså som steg 1 och 3 — de är
riktiga, men de är **inte** det som löser problemet. Djupgranskningen
värderade dem i körtid och landade på "låg prioritet, ingen ledtidsvinst";
i fakturerbara minuter är `SE1` värd 14 600 i månaden, vilket är en annan
sak.

---

## Vad jag INTE föreslår, och varför

**Golvet skärs aldrig.** Följande rörs inte av något paket ovan, och ska inte
röras: det tvåsidiga hermetikbeviset (det bevisar att de hermetiska testerna
faktiskt är hermetiska — utan det är hela acceptance-klassen ett påstående),
tillgänglighetskontrollen (`a11y`, kvalitetsribban säger 11 utan undantag),
beroendegranskningen på kodändringar, hemlighetsskyddet, och
granskningsbackstoppen (`ADR-105`). Alla fyra paket behåller dem intakta på
den yta där de faktiskt bevisar något.

| Förslag | Varför inte |
|---|---|
| **Självhostad runner i molnet** | Räknar hem först om minutproblemet INTE löses. Självhostade runners är gratis (*"GitHub Actions usage is free for self-hosted runners"*, [GitHubs faktureringssida](https://docs.github.com/en/billing/concepts/product-billing/github-actions)) och två Hetzner CPX32 (~€71/mån) hade absorberat baslinjen mot 527 dollar — men det är att bygga en maskinpark för att slippa laga en design. GitHubs egen säkerhetstext varnar dessutom även för privata repon: *"be cautious when using self-hosted runners on private or internal repositories"* ([secure-use](https://docs.github.com/en/actions/reference/security/secure-use)). Lägg P2 först; ta upp frågan bara om P2 visar sig omöjlig |
| **Slå ihop `changed` och `ci-passed` mot avrundningsspillet** | Går inte. `changed` måste köra **först** (dess utdata styr alla `needs`), `ci-passed` **sist** (det är den obligatoriska kontrollen). De 9 224 minuterna är strukturella, inte slarv. Att i stället slå ihop `Docs link check` med lintjobbet ger *MÄTT* **noll** besparing: 226 s + 55 s i samma jobb avrundas till samma 5 minuter som två separata jobb |
| **Sänka push-frekvensen** | Avvisat i `ADR-097` med fyra mätta skäl, och upprepat som `I8`. Min mätning ger inget nytt skäl att ompröva. S8 gäller landningar, inte pushar — och även den lämnar jag som fråga, inte förslag |
| **Riva merge-dedupen** | Åtgärdsplanens `I1` har rätt: den träffar 32 av 32 där den kan. Den ska lagas (S1b), inte rivas |
| **Sätta kögruppen till ett** | `I4`. Min mätning stärker avrådan: kvoten kö-till-landning är redan 1,18, så grupperingen sparar knappt något i dag — men att slå av den mångdubblar efterkontrollens kostnad |
| **Maskininlärt testurval** | `I10`. Vi har inte datamängden. S9 är den enkla, regelbaserade formen och räcker |

---

## Öppna frågor till Marcus

1. **Vilken arbetstakt ska designen bära?** Augusti (1 279 landningar) eller
   september hittills (cirka 360 i månadstakt)? Alla tal ovan utgår från
   augusti. Är augusti ett undantag faller hela problemet bort av sig självt.
2. **Är frågan skarp i dag, eller villkorad av privat-beslutet?** Kostnaden
   är 0,00 dollar just nu. Ska CI-arbetet göras oavsett (hygien, väntetid,
   maskinlast), eller först när repot faktiskt görs privat?
3. **Accepterar du att acceptance-fel upptäcks i kön i stället för på
   förslaget?** Det är hela P2:s växel: 37 000 minuter i månaden mot att
   bygg-agenten får sitt besked ett steg senare, och att cirka 21 armeringar
   i månaden konsumeras av kö-fällningar.
4. **Ska dokumentlandningar buntas?** `ADR-097` sade nej till batchade
   **pushar**. Detta gäller **landningar** — 21 400 minuter i månaden. Kräver
   ett eget beslut; jag bygger inget på det utan ditt ord.
5. **Ska CodeQL flyttas från "default setup" till egen arbetsflödesfil?**
   Vinsten är 6 700 minuter i månaden; priset är att frågesviternas underhåll
   blir vårt.
6. **Ska ett budget-tak sättas som skyddsnät?** Det finns och det biter —
   men det är trubbigt: *"Members are now blocked from using all
   GitHub-hosted runners until the next billing cycle or until the 'Actions'
   product budget is increased"*
   ([GitHubs dokumentation om budgetar](https://docs.github.com/en/billing/how-tos/set-up-budgets)).
   Slår det till mitt i en månad **stannar merge-kön helt** tills du höjer
   taket. Jag kunde inte hitta någon förstapartstext om vad som händer med
   jobb som redan är i kö i det ögonblicket.

## Vad jag inte kunde belägga

- **Vad som händer med pågående och köade jobb när ett budget-tak slår
  till.** Tre förstapartssidor lästes; ingen nämner in-progress eller queued
  jobs. Detta är en verklig lucka i ett skyddsnät som annars ser attraktivt ut.
- **Om `Detect changed files` beräknar rätt på en yta där `CI`-push tagits
  bort.** S1 tar bort en yta som dedupen lever på; jag har inte prövat att
  `Post-merge`:s ärvda klassning (`scripts/classify-post-merge.sh`) fortsatt
  fungerar utan den. **Måste prövas tvåsidigt före S1.**
- **Skärvningens exakta uppdelning mellan "sviten växte" och "skärvningen
  kostar".** Båda hände mellan augusti och september och jag kunde inte
  separera dem rent. Min uppskattning (skärvningen står för ungefär hälften)
  vilar på att overheaden per jobb är mätt till 26 sekunder; resten är
  avrundning och faktisk tillväxt.
- **Om GitHubs kö bygger spekulativa grupper på det sätt jag antar.** Kvoten
  1,18 kökörningar per landning är *MÄTT*, men jag har inte läst
  förstapartstext som förklarar den exakta grupperingsmekaniken under
  `ALLGREEN`. Slutsatsen "grupperingen sparar knappt något" vilar alltså på
  mätningen, inte på dokumentationen.
- **N6:s kostnad framåt** vilar på **en enda** körning efter landning
  (`35341976159`, 45 fakturerbara minuter). Talet +4 min per kodkörning bör
  mätas om när en vecka gått.
- **Leverabel 9:s "34 procent av grenarna fick mer än en körning"** kunde
  jag inte reproducera (jag mäter 17 procent över hela augusti). Jag har inte
  rekonstruerat deras mätfönster och kan därför inte säga vilken siffra som
  är fel — bara att de inte är samma.
- **Ingen förstapartskälla rekommenderar en lättare förslagsyta.** Rust och
  Prow gör det i praktiken och dokumenterar det; GitHubs egen text säger
  bara att kontrollerna är kopplade och måste rapporteras på båda ytorna.
  Precedenten är alltså stark men indirekt — tre projekt (Rust, Kubernetes,
  Chromium), inget av dem med GitHubs merge queue specifikt.

## Källor

<!-- vale Vale.Terms = NO -->

**Egna mätningar, 2026-09-18**, samtliga körda mot
`high-five-group/miranon-media-admin` via `gh api`: `actions/runs` per dygn
(9 117 körningar i augusti, 1 827 i september 1–17), `actions/runs/<id>/jobs`
för 589 körningar i stratifierat urval, `actions/runs/<id>/timing`,
`orgs/high-five-group/settings/billing/usage` (månad 8 och 9),
`code-scanning/default-setup`, `pulls/2517`, `pulls/2524`.

- [docs.github.com — Actions runner pricing](https://docs.github.com/en/billing/reference/actions-runner-pricing) — avrundning per jobb. Hämtat 2026-09-18.
- [docs.github.com — View job execution time](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time) — inga fakturerbara minuter på publika repon. Hämtat 2026-09-18.
- [docs.github.com — GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) — 50 000 min, 0,006 USD/min Linux 2-core, gratis för självhostade runners. Hämtat 2026-09-18.
- [docs.github.com — Set up budgets](https://docs.github.com/en/billing/how-tos/set-up-budgets) — "Stop usage when budget limit is reached". Hämtat 2026-09-18.
- [docs.github.com — Managing a merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) — obligatoriska kontroller kopplade över båda ytor. Hämtat 2026-09-18.
- [docs.github.com — Customizing your advanced setup for code scanning](https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning) — `paths-ignore` styr utlösning, inte analys. Hämtat 2026-09-18.
- [docs.github.com — Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use) — självhostade runners, varning även för privata repon. Hämtat 2026-09-18.
- [rustc-dev-guide — Testing with CI](https://rustc-dev-guide.rust-lang.org/tests/ci.html) — delmängd på PR, komplett svit i kön, rollups. Hämtat 2026-09-18.
- [docs.prow.k8s.io — Tide (maintainers)](https://docs.prow.k8s.io/docs/components/core/tide/maintainers/) — merge utan omtest när resultatet gäller senaste basen. Hämtat 2026-09-18.
- [docs.prow.k8s.io — Jobs](https://docs.prow.k8s.io/docs/jobs/) — `run_if_changed` / `skip_if_only_changed`, presubmit mot postsubmit. Hämtat 2026-09-18.
- [chromium.googlesource.com — CQ](https://chromium.googlesource.com/chromium/src/+/main/docs/infra/cq.md) och [CQ Quick Run, revision `eb6a38f`](https://chromium.googlesource.com/chromium/src/+/eb6a38f/docs/cq_quick_run.md) — dry-run mot full run, 50 % CPU mot ≤5 % falska negativ. Hämtat 2026-09-18.
- [nx.dev — Affected](https://nx.dev/docs/features/ci-features/affected) — låsfilens failsafe. Hämtat 2026-09-18.
- [jestjs.io — CLI](https://jestjs.io/docs/cli) — `--changedSince`, kravet på statisk beroendegraf. Hämtat 2026-09-18.
- [playwright.dev — Test CLI](https://playwright.dev/docs/test-cli) — `--only-changed`. Hämtat 2026-09-18.
- [digitalocean.com — Droplet pricing](https://www.digitalocean.com/pricing/droplets) och [docs.hetzner.com — prisjustering 2026-06-15](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/) — jämförelsepriser för självhostad runner. Hämtat 2026-09-18.

<!-- vale Vale.Terms = YES -->

**Internt:** `.github/workflows/ci.yml` (rad 43–45 samtidighet, 452–499
merge-dedup, 2159–2163 svitens villkor), `.github/workflows/ci-suite.yml`
(rad 366–372 skärvmatrisen, 430–437 acceptance-urvalet, 526–532 N6:s
motivering), `docs/research/ci-djupgranskning-2026-09-17/` (leverabel 9 och
11), `docs/research/repo-privat-konsekvenser-2026-09-18.md` § B1,
`docs/decisions/ADR-036`, `ADR-076`, `ADR-077`, `ADR-080`, `ADR-097`,
`ADR-105`, `CONTRIBUTING.md` § Landnings-ordningen och § Rött-först.
