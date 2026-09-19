# ADR-133: Testa en gång per landning — ytornas arbetsfördelning, väntetidstak och tillväxtmål

- **Status:** Accepted (grillad samsyn S126 Del 17, `/grill-with-docs`,
  2026-09-19 ~10:15–11:10Z, tio beslut kvitterade var för sig; Del 18
  tillfogar beslut 6b efter ett eget research-pass. Denna ADR bär BESLUT
  1–6 — beslut 7–9 är engångsbeslut/regler som hör hemma i `T171` och
  `CLAUDE.md`, beslut 10 är redan kort (`TASK-479`/`480`), ingetdera
  omfattas här. Se § Besluten för Marcus ordagranna kvittens per beslut.)
  **ADR-baren** (`~/.claude/CLAUDE.md` § ADR-BAR) klaras på alla tre
  villkor — prövningen står i egen sektion, § ADR-baren — prövad.
- **Datum:** 2026-09-19
- **Fas:** Session 126 (PRD [`TASK-464`](../../backlog/tasks/task-464%20-%20PRD-Minutbudgeten-under-50-000-—-testa-varje-ändring-en-gång-inte-fyra.md),
  skiva `TASK-464.3`)
- **Rör:** `.github/workflows/ci.yml`, `ci-suite.yml`, `post-merge.yml`,
  `nightly.yml` — arkitekturen låses här, koden byggs i skivorna
  `TASK-464.4`–`TASK-464.14` (flera direkt blockerade av detta beslut,
  övriga blockerade transitivt via dem — se `TASK-464`s egen
  blockeringskarta för exakt vilken) ·
  [ADR-097](ADR-097-arbetsformens-tillstandsbarare.md) (amenderas, egen
  § Updates-post i den ADR:n) · [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md),
  [ADR-077](ADR-077-riskanpassad-ci-klassning-dedup-nightly.md),
  [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)
  (pekare tillagda i var och en; deras kärnbeslut står, bara räckvidden
  omtolkas — se § Relation till tidigare beslut).
- **Relation till tidigare beslut:** **bygger på**
  [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) (CI som
  enda mekaniska enforcement-grind — oförändrat; denna ADR flyttar bara VAR
  i CI det obligatoriska beviset produceras) ·
  [ADR-076](ADR-076-merge-grinden-ruleset-pr-flode.md) (merge-kön, den
  obligatoriska checken `CI Passed or Skipped`, `ALLGREEN`-grupperingen — vad
  som körs UNDER checken på respektive yta ändras, checkens namn och
  kö-mekaniken rörs inte) ·
  [ADR-077](ADR-077-riskanpassad-ci-klassning-dedup-nightly.md)
  (presubmit/postsubmit-delningen, merge-dedupen, nattnätet som redan
  korrekt reservat för den fullständiga svepningskontrollen — denna ADR
  smalnar postsubmit-lagrets (`post-merge.yml`) omfång till det unika och
  avgör triggerfrågan för den) ·
  [ADR-080](ADR-080-acceptance-klassen-hermetisk-utbrytning.md) (den
  hermetiska Acceptance-klassen och dess tvåsidiga bevis — golvet, rörs
  inte, bara VAR den körs) ·
  [ADR-105](ADR-105-review-grinden-fyra-deltan-byggs-inte-adopteras.md)
  (review-grinden — oförändrad; se § Konsekvenser för varför den
  uttryckligen inte försvagas). **Amenderar**
  [ADR-097](ADR-097-arbetsformens-tillstandsbarare.md) (§ Updates i den
  ADR:n): avvisningen av *"session-batchad push"* står — den gällde PUSH.
  Denna ADR beslutar en NY, avgränsad form: LANDNINGS-buntning av
  orkestrerarens egna dokument, se § Besluten 5.

## Kontext

> **Ordförklaringar, i vardagsspråk — termerna används genomgående i
> resten av dokumentet.** Ett **förslag** (engelska "pull request",
> förkortat **PR**) är en föreslagen kodändring som väntar på att testas
> och infogas. **Kön** ("merge queue") är GitHubs mekanism som testar
> varje förslag TILLSAMMANS med de förslag som redan står före det i kön
> — flera förslag testas samtidigt, upp till tre enligt repots inställning
> — och släpper in dem i huvudgrenen i tur och ordning, först när testet
> är grönt. Flera gröna förslag kan landa i SAMMA landning (upp till tre;
> mätt hos oss: `#1711` och `#1713` landade i en och samma push, tråd
> `T166`). Vad en sådan grupplandning betyder för `ADR-077` § Beslut 2:s
> SHA-identitet avgörs i `TASK-464.4`, inte här. (BYGGET av varje köad
> posts test-grupp är en annan fråga än hur många som sedan LANDAR
> tillsammans — GitHubs egen dokumentation säger det uttryckligen: *"Merge
> limits do not combine `merge_group` builds. Merge limits only affect
> merges to the base branch once one or more `merge_group` has satisfied
> build checks."* — [GitHubs dokumentation om merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue),
> § Merge limits, hämtat 2026-09-19. Byggsidan i detalj: `CLAUDE.md` § Review-grinden,
> "Kö-antagandet som bär grinden".) **Huvudgrenen**
> (`main`) är den gemensamma, godkända versionen av koden — webbappen i
> drift följer den (via Vercel), medan serverfunktionerna (Edge Functions
> hos Supabase) deployas i ett EGET, separat steg och kan ligga efter
> (`CLAUDE.md` § Prod-EF-deploy). **Efterkontrollen** (`post-merge.yml`)
> är ett extra test som körs EFTER att ändringen redan landat på
> huvudgrenen — en sista koll att allt fortfarande håller. **Skärvning**
> betyder att ett stort, tidsödande test delas upp i flera mindre JOBB
> som körs parallellt — väggklockan (väntetiden) krymper, men varje jobb
> betalar sin egen minut (se nedan), så fler jobb ur samma test höjer
> notan. En **fakturerad minut** är GitHubs minsta debiteringsenhet:
> varje JOBB (en enskild körning består av flera jobb) avrundas alltid
> uppåt till en hel minut, även om det bara tog några sekunder — därför
> gör fler, mindre jobb (skärvning) notan dyrare även när väggklockan
> blir kortare.

Marcus, 2026-09-19, ledstjärnan för allt CI-arbete framåt
(`tasks/sessions/2026-09-17-session-126.md` Del 11):

<!-- vale Vale.Terms = NO -->
> "jag ska kunna jobba exakt lika mycket som nu och LÄTT klara mig under
> 50 000 minuter i månaden, utan att betala extra och utan att vi tar bort
> något verkligt skydd (säkerhet, tillgänglighet, hermetik-beviset,
> review-grinden). Kärnan är 'testa varje ändring EN gång, inte fyra'."
<!-- vale Vale.Terms = YES -->

Skärpt vid resume 3, samma dag (Del 15): *"Vi måste kunna göra repot
privat så fort som möjligt och jag måste kunna jobba lika mycket och MER
än vad jag gjort tidigare och ända klara mig under taket på 50 000
minuter."* Två skärpningar mot den första formuleringen: målet är inte
augustis takt inom taket utan augustis takt MED tillväxtmarginal, och
privat-steget flyttas tidigare i ordningen.

**Mätläget** (källa: [`docs/research/actions-minutbudget-2026-09-18.md`](../research/actions-minutbudget-2026-09-18.md)
§ Kort svar + § A, ett stratifierat slumpurval på 418 körningar ur
augustis 9 117 arbetsflödeskörningar, validerat mot faktisk fakturadata
inom ett standardfel tre gånger oberoende):

| Mått | Värde | n / källa |
|---|---|---|
| Augusti 2026, fakturerat | 76 080 min (rabatterat till 0 USD — repot är publikt) | mätt mot `orgs/.../settings/billing/usage`, hela månaden |
| Augustis arbetstakt med DAGENS uppsättning | ≈ 137 800 min/mån (≈ 527 USD/mån den dag repot är privat) | härlett, augustis volym × dagens (september) enhetskostnad |
| De fyra ytorna (förslag, kö, huvudgren, efterkontroll) andel av augustis minuter | 87 % | n = 418, stratifierat urval |
| En kodlandning, augusti → dagens uppsättning | 94,3 → 190,0 fakt. min | härlett ur klassvisa medelvärden (§ A4); underliggande yt-urval § A1/§ A2, n = 80–100 per yta, augusti vs. 8–17 september |
| En ren dokumentlandning (`#2517`) | 35 fakt. min, exakt mätt | n = 1, en verklig landning, fem separata körningar |
| Avrundningsspill (varje jobb → hel minut) | 27,5 % av det fakturerade | n = 2 277 jobb i urvalet |

Samma träd testas alltså upp till fyra gånger per landning — på
förslaget (PR), i kön, på huvudgrenen efter landning, och i
efterkontrollen — och enhetskostnaden per körning har **mer än
fördubblats** sedan augusti (skärvningen av `Acceptance` och det
tvåsidiga hermetikbeviset halverade väntan men fördubblade notan,
samma § A6). Utan förändring landar en augusti-takt månad på ≈ 137 800
min, nästan tre gånger fribeloppet.

### Formen

`/grill-with-docs`, tio frågor en i taget med en rekommendation per
fråga, underlag lästa före intervjun: `actions-minutbudget-2026-09-18.md`
§ S1–S9, `ADR-097` § Decline-rationale, `repo-privat-konsekvenser-2026-09-18.md`
§ Förberedelselista. Marcus kvitterade varje fråga separat (se tabellen i
§ Besluten). Beslut 1–6 låser vad varje CI-yta gör och de två mätbara
målen — det som håller ADR-baren; beslut 7–9 är engångsbeslut/regler och
hör hemma i `T171`/`CLAUDE.md`, inte här; beslut 10 (SE-högens
prioritering) är redan kort.

## Besluten

Varje beslut nedan bär Marcus ordagranna kvittens, skälet, och det
avvisade alternativet — källan är `tasks/sessions/2026-09-17-session-126.md`
Del 17 § "Besluten" (tabellen) och Del 17/18:s omgivande prosa.

### 1. Målet: under 50 000 fakturerade min/mån, byggt för att KUNNA bära 2× augustis takt

**Beslut:** taket är < 50 000 fakturerade minuter i månaden, och
arkitekturen ska KUNNA bära dubbla augustis arbetstakt — tillväxtutrymme
är ett uttalat designmål, inte en eftertanke. Marcus: *"B låter väl
bra."*

**Skäl.** Repot blir privat (beslut 7, `T171`), och kostnaden i kronor
blir då skarp för första gången. Mätningen visar att augustis takt med
dagens uppsättning redan sprängt taket nästan tre gånger om (≈ 137 800
min/mån); ett tak satt EXAKT vid augustis nuvarande volym hade gjort
varje tillväxt i arbetstakt till ett arkitekturproblem, inte ett
kostnadsproblem — därför är "KUNNA bära 2×" en del av målet, inte en
separat fråga.

**Vad "kunna bära 2×" faktiskt betyder i denna ADR, utskrivet ärligt.**
Beslut 1–6 i sig räcker INTE för att rymma 2× augustis takt under
50 000 — se § Kostnad i två mått: vid 2× landar det uppskattade läget på
≈ 71 000 min/mån, eftersom kö-ytans fulla svit (45 fakt. min per
kodlandning, 15 jobb) är ett GOLV som inte krymper med testjusteringar
och skalar ungefär linjärt med antal landningar. "Kunna bära 2×" är
alltså inte ett påstående att DENNA ADR:s arkitektur rymmer 2× under
taket — det är ett åtagande om en KÄND ESKALERINGSVÄG när volymen växer
dit, se beslut 2:s snubbeltråd.

**Avvisat alternativ:** inget eget för beslut 1 — det ÄR målformuleringen
alla andra beslut mäts mot. Se beslut 2 för det första konkreta
alternativet som prövades och avvisades (egen byggmaskin nu).

### 2. Stegad väg: testjusteringar nu → privat → snubbeltråd vid 40 000 min

**Beslut:** testjusteringarna (beslut 3–6 nedan) byggs och landar FÖRST.
Repot görs privat (beslut 7). En budgetvarning sätts vid **40 000
fakturerade min/mån** (snubbeltråd, inte en spärr som stänger CI — se
beslut 7:s "aldrig 'stop usage'"). FÖRST när den löser ut startar
research om nästa steg: egen byggmaskin (hyrd server · en färdig
byggmaskinstjänst · en hybrid av de två — **den tredje formen är
OBELAGD, hämtad ur orkestrerarens minne, ingen källa verifierad för
den**) eller buntade kodlandningar (vilket river review-grindens
singulära `kortId`-schema, se [[L636]] i `tasks/lessons/vol-08.md`).
**Inget av detta byggs "ifall".** Marcus: *"Den reviderade
rekommendationen låter bra."*

**Skäl.** Orkestrerarens FÖRSTA rekommendation i denna fråga var att
godkänna egen byggmaskin i princip nu — ett bygge "ifall" arbetstakten
skulle stiga. Marcus arbetar inte i 2× takt i dag, och pushback:en
fångade det direkt:

<!-- vale Vale.Terms = NO -->
> "Låter omständigt att lämna Github. Kan vi inte få ner våra minutrar
> tillräckligt genom att justera hur vi testar bara?"
<!-- vale Vale.Terms = YES -->

Rekommendationen reviderades till den stegade vägen ovan: en enkel
åtgärd (testjusteringarna) provas och mäts INNAN en tyngre åtgärd
(ny infrastruktur) övervägs — samma disciplin lesson-kandidat 43 (Del
17) skriver ut: räkna alltid vad den enkla vägen ger innan den tunga
föreslås. Förtydligat i samma svar: "egen byggmaskin" betyder att en
ANNAN dator kör CI-jobben; allt annat (kö, ruleset, `gh`-kommandona)
ligger kvar på GitHub oförändrat.

**Avvisat alternativ: egen byggmaskin (eller byggmaskinstjänst) NU, i
princip, innan en snubbeltråd löst ut.** Förkastat av skälet ovan —
det var ett bygge "ifall" arbetstakten steg, mot en Marcus-observation
att den inte har det. Byggs den dagen snubbeltråden löser ut, inte
tidigare.

### 3. Väntetidstak: dokument ≤ 5 min, kod ≤ 12 min median / ≤ 15 min p95 — skärvningen behålls

**Beslut:** ett andra, uttalat mål vid sidan av minutbudgeten:
dokumentlandningar ska vänta **högst 5 minuter**, kodlandningar **högst
12 minuter i median och högst 15 minuter i 95:e percentilen** (mätt per
runda och per armering → `main`). **Skärvningen av `Acceptance` och det
tvåsidiga hermetikbeviset BEHÅLLS** — S6/S7 (att riva skärvningen
tillbaka) görs INTE: den hade sparat ≈ 3 500 min/mån men kostat 8–13
extra minuters väntan per kodkörning. Taket mäts löpande (`npm run
metrics:ci`, nattens CI-mätning); två veckors brott mot taket ⇒ eget
backlog-kort. Marcus: *"Det låter bra."*

**Skäl.** Väntetid och fakturerade minuter är TVÅ separata mål, och en
förbättring i det ena får aldrig tyst köpas med en försämring i det
andra (§ "Två regler som bärs i ALLT CI-arbete", Del 11) — N6
(skärvningen av det tvåsidiga beviset) är själva varnings­exemplet: den
halverade väntan men höjde notan med ≈ 9 100 min/mån, och bara det ena
måttet mättes när den byggdes. Att sätta ETT väntetidstak utan att
samtidigt skydda skärvningen hade riskerat att S6/S7 senare föreslås
som en ren kostnadsbesparing utan att växelkursen (väntetid för pengar)
syns.

**Avvisat alternativ: S6/S7 — riva skärvningen tillbaka.** Mätt,
entydigt: skärvning halverar väntan och fördubblar notan för det
skärvade jobbet — en växelkurs, inte en förbättring, när minuter kostar
pengar
([`actions-minutbudget-2026-09-18.md`](../research/actions-minutbudget-2026-09-18.md)
§ S6/S7). Paketjämförelsen P2 (53 000 min/mån) mot P2+ (P2 + S6 + S7,
49 500 min/mån) visar nettobesparingen: bara 3 500 min/mån för en
väntekostnad på 8–13 extra minuter per kodkörning — och det direkt mot
det nya väntetidstaket denna ADR just satt. N6 löste ett verkligt
problem (fyra `cancelled`-timeout-avbrott på en dag,
`ci-suite.yml:526-532`); att riva den tillbaka nu hade rivit ett
medvetet designval utan att skälet till det försvunnit.

### 4. S2 — hela acceptance-klassen och det tvåsidiga beviset körs EN gång, i kön

**Beslut:** förslagsytan (PR) kör lint, typkontroll, bygge och de snabba
testerna. Hela `Acceptance`-klassen och det tvåsidiga hermetikbeviset
körs BARA i kön, där de bevisar exakt det träd som landar. Bygg-agenten
SKA köra ett berört urval lokalt före push — en ny rad i bygg-agentens
kontrakt, tillagd av `TASK-464.5`. **Snubbeltråd:** överstiger
kö-fällningar (PR:er som faller i kön efter att ha varit gröna på
förslaget) ≈ 5 procent av landningarna en månad, tas ett etikett-utlöst
alternativ upp — en PR kan då märkas för att köra den fulla sviten
redan på förslaget. Marcus: *"B (din rek)."*

**Nuläge, hållet isär från beslutet ovan.** Mekaniken
(`scripts/acceptance-urval.sh`) finns redan i repot, men körs I DAG av
`ci.yml`:s `acceptance-urval`-steg i `changed`-jobbet — det vill säga
EFTER push, som en CI-mekanik, inte lokalt av bygg-agenten
(`CONTRIBUTING.md` § "Urvalet i PR-grinden (`TASK-75`)"). Ingen rad om
urvalet finns i dag i bygg-agentens kontrakt (`grep -n -i
"acceptance-urval" .claude/agents/bygg-agent.md` ⇒ noll träffar). Att
skriptet går att köra lokalt i en agents arbetsträd är INTE prövat —
det prövas i `TASK-464.5`, som lägger till kontraktsraden.

**Källnot.** Del 17:s tabell ("Besluten", rad 4) formulerar detta
beslut ordagrant: *"Bygg-agenten kör berört urval lokalt före push
(`scripts/acceptance-urval.sh`, en rad i kontraktet — ingen ny
CI-mekanik)."* Formuleringen står i PRESENS ("kör") och kallar det
"ingen ny CI-mekanik" — vilket läses som ett nuläge, fast det är ett
beslut om framtida bygge. Denna ADR:s FÖRSTA version (runda 1–2)
förstärkte sammanblandningen ytterligare genom att själv lägga till
orden "redan byggd", som inte finns i Del 17 alls. Denna version håller
isär BESLUT (bygg-agenten SKA köra urvalet lokalt, `TASK-464.5`) och
NULÄGE (skriptet finns och körs redan, men av CI, inte lokalt).
Sessionsdoket självt rättas inte i efterhand — Del 17:s tabellrad står
kvar som den skrevs; det är denna ADR som bär den rättade formen (samma
disciplin som § Kostnad i två mått redan tillämpar på en annan
källdivergens).

**Skäl.** Detta är kärnan i "testa en gång per landning": den tunga,
hermetiska sviten flyttar från FYRA körningar (förslag, kö, huvudgren,
efterkontroll delvis) till EN, i kön — precis det steg som gör att P1
(minsta ingrepp, ≈ 90 800 min/mån) inte räcker medan P2 (P1 + S2 + S3,
≈ 53 000 min/mån) gör det (§ Kostnad i två mått nedan). Priset är
ärligt: bygg-agenten får besked om ett acceptance-fel ETT STEG SENARE
(i kön i stället för på förslaget), och en kö-fällning konsumerar
armeringen (§ Landning, `CLAUDE.md`) — dyrare per instans än ett rött
förslag.

**Vad som är mätt och vad som är härlett i kostnadstalet, hållet
isär.** Kön kör i DAG samma fulla svit som förslaget — S2
(`TASK-464.5`) är obyggd — så en kö-fällning i den mening detta beslut
definierar den (en PR som var grön på förslaget men ändå faller i
kön) kan strukturellt inte mätas förrän S2 finns. Det enda som ÄR
mätt (`actions-minutbudget-2026-09-18.md` § S2): 96 av 1 829
förslagskörningar (5,2 procent) misslyckades i augusti — det är
dagens FELFREKVENS PÅ FÖRSLAGSYTAN, inte en kö-fällningsfrekvens. Den
siffran används här som en PROXY för den framtida kö-fällningsfrekvensen
(samma tunga svit flyttar bara YTA, inte innehåll, så samma andel
förslag antas falla oavsett var de testas) — INTE som en mätning av
den. Ur den proxyn HÄRLEDS ≈ 21 extra kö-varv i månaden vid augustis
kodlandningstakt, redan inräknat i marginalen. **Snubbeltråden "≈ 5 %
kö-fällningar en månad" är alltså INTE utlöst av detta tal** — den kan
först mätas skarpt sedan S2 är i drift och en verklig kö-fällning går
att observera.

**Precedent.** Rust kör exakt denna modell:

> "A small subset of tests and checks are run after each push to the
> PR."
>
> "Before a commit can be merged into the `main` branch, it needs to
> pass our complete test suite. We call this an `auto` build."
> — [rustc-dev-guide, Testing with CI](https://rustc-dev-guide.rust-lang.org/tests/ci.html), hämtat 2026-09-18

Kubernetes Tide gör samma avvägning från andra hållet — testa inte om
det som redan är bevisat mot rätt bas:

> "Tide may merge a PR without retesting if the existing test results
> are already against the latest base branch commit."
> — [docs.prow.k8s.io, Tide (maintainers)](https://docs.prow.k8s.io/docs/components/core/tide/maintainers/), hämtat 2026-09-18

**Precedent-rymden är TUNN på en punkt, sagt öppet:** ingen
förstapartskälla från GitHub REKOMMENDERAR en lättare förslagsyta — Rust
och Kubernetes Prow/Tide GÖR det och dokumenterar det, men GitHubs egen
dokumentation säger bara att den obligatoriska kontrollen måste
rapporteras under samma namn på båda ytorna (villkoret `ci-passed`
redan uppfyller, ADR-076/ADR-036 opåverkade):

> "A merge queue will wait for required checks to be reported before it
> can proceed with merging."
> — [GitHubs dokumentation om merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue), hämtat 2026-09-18

**Avvisat alternativ: etikett-utlöst full svit NU, som standard.**
Förkastat till förmån för snubbeltråden — att bygga ett opt-in-läge
innan mätningen visar att kö-fällningarna faktiskt är ett problem hade
varit ett bygge "ifall", samma felklass beslut 2 avvisade. Chromiums
Quick Run-modell (en LÄTTARE presubmit-svit med en explicit
falsk-negativ-risk, inte ett label-baserat val av full svit) belyser
samma avvägningsprincip men löser en annan fråga och byggs inte här:

> "CQ Quick Run (QR) is a new CQ mode with the goal of delivering
> results faster. QR saves roughly 50% CPU time in exchange for at
> most a 5% chance of false negative."
> — [chromium.googlesource.com, CQ Quick Run (arkiverad revision `eb6a38f`)](https://chromium.googlesource.com/chromium/src/+/eb6a38f/docs/cq_quick_run.md), hämtat 2026-09-18

### 5. S8 som LANDNINGS-buntning — inte push-buntning — för orkestrerarens dokument

**Beslut:** normalform för ORKESTRERARENS egna dokument (sessionsdok,
todo, kortstängningar, instrumenteringsloggen) blir en bunt PER PASS —
flera färdiga dokumentenheter landar i en PR i stället för var för sig.
Agenternas egna dokument-PR:er rörs INTE — skäl 2 i `ADR-097` (agent-
synlighet mot origin) består oförändrat för dem. Plus:
`docs/reference/review-instrumentering.jsonl` får `merge=union` i
`.gitattributes` (löser krockar mellan parallella sessioner utan
manuell rebase); todo-filens kadensrad blir en rad per session i
stället för en rad per landning. `ADR-097` amenderas med distinktionen
push kontra landning (se den ADR:ns § Updates). Marcus: *"Vi kör på din
rekommendation där också."*

**Skäl.** `ADR-097` § Decline-rationale avvisade *"session-batchad
push"* med fyra mätta skäl (parallell nummerallokering,
agent-synlighet mot origin, write-ahead-principen, DORA:s
stor-batch-risk). Det forskningspasset som ledde till detta beslut
([`actions-minutbudget-2026-09-18.md`](../research/actions-minutbudget-2026-09-18.md)
§ S8) mätte uttryckligen en ANNAN sak: att bunta LANDNINGAR, inte
PUSHAR. En gren fortsätter ta emot pushar precis som i dag — ingen
agentsynlighet går förlorad, write-ahead-principen bryts inte — men
flera färdiga dokumentenheter samlas i EN PR i stället för att var och
en pushas och armeras separat. Orkestreraren GJORDE redan detta i
stängningsbatchar innan beslutet formaliserade det. Besparingen är
mätt: 870 av augustis 1 279 landningar var rena dokumentlandningar
(68 procent av landningarna, ≈ 22 procent av minuterna); buntade tre
och tre faller ≈ 24 200 min/mån bort.

**Avvisat alternativ: buntning av ALLA dokument-PR:er, inklusive
agenternas.** Detta hade varit exakt den `session-batchad push` `ADR-097`
redan avvisat — samma fyra skäl gäller oförändrat för en agents
arbetsträd (en agent som håller flera färdiga enheter opushade förlorar
sin synlighet mot orkestrerarens sekventiella granskning, § Landning).
Distinktionen är därför inte semantisk utan strukturell: det som
buntas är ORKESTRERARENS EGNA, redan centralt hanterade
dokumentlandningar — en yta där write-ahead-risken och
agent-synlighets-risken inte finns, eftersom det inte finns någon
annan agent som behöver se mellanstegen.

### 6. S3 — efterkontrollen kör bara det den ensam kan; klockan avvisas (beslut 6b)

**Beslut:** `post-merge.yml` (efterkontrollen) kör i dag hela sviten en
FJÄRDE gång plus `Staging (API + E2E)` mot en verklig Airtable-bas.
Bara det sista är unikt. S3 skär bort den upprepade hermetiska
körningen och lämnar kvar: staging, tillgänglighet (a11y),
sentinel-städning, klassning, exponeringsfönster-mätning — härlett ≈
23,5 min i stället för ≈ 60,4 per körning. Marcus: *"C."*

**Skäl.** De tre tidigare ytorna (förslag, kö, huvudgren) kör redan
samma hermetiska tester på samma träd — den fjärde körningen bevisar
inget nytt förutom det som är UNIKT för efterkontrollen: att det
FAKTISKT LANDADE trädet efter en eventuell gruppmerge fortfarande
håller (samma hål `N3` finns för att stänga, `ADR-077` § Beslut 2 —
`N3` är därför en hård förutsättning för S3, inte en konkurrent till
den).

**Beslut 6b — "efterkontroll på klocka" avvisas, en egen fråga inom
samma beslut.** Grillningen (Del 17) sköt frågan "ska efterkontrollens
TRIGGER vara push-händelsen eller en klocka?" till ett eget
research-pass innan beslut, eftersom orkestreraren mindes en hypotes
("Google buntar postsubmit på klocka") utan källa. Passet
([`docs/research/efterkontroll-pa-klocka-2026-09-19.md`](../research/efterkontroll-pa-klocka-2026-09-19.md))
verifierade sex branschledare direkt mot förstapartskällor och
FALSIFIERADE hypotesen i dess bokstavliga form:

> "After a change has been submitted, we use TAP to asynchronously run
> all potentially affected tests, including larger and slower tests."
> — [abseil.io, Software Engineering at Google, kapitel 23](https://abseil.io/resources/swe-book/html/ch23.html), hämtat 2026-09-19

Kubernetes namnger samma distinktion uttryckligen:

> "Postsubmits are run by the trigger plugin when a push event happens
> on a repo."
> — [docs.prow.k8s.io, Jobs](https://docs.prow.k8s.io/docs/jobs/), hämtat 2026-09-19

Ingen av de sex undersökta organisationerna (Google/TAP, Kubernetes/Prow,
Chromium/ChromiumOS, Rust, GitLab, Mozilla) kör sin "höll landningen?"-
kontroll på ett cron-uttryck — samtliga triggar HÄNDELSEN "kod landade"
och reserverar klockan för en separat, fullständig svepningskontroll,
vilket är precis den arkitektur vi redan har (`nightly.yml`). GitHubs
egen dokumentation talar dessutom emot en klocka för en tidskänslig
kontroll:

> "The `schedule` event can be delayed during periods of high loads of
> GitHub Actions workflow runs."
> — [GitHubs dokumentation om händelser som utlöser arbetsflöden](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows), hämtat 2026-09-19

Marcus godkände research-passets dom: *"Jag godkänner."*

**Vald väg, men implementationen är en ÖPPEN, DEFERRAD punkt.** Passets
egen rekommendation (väg 3): behåll `push` som trigger, byt
`post-merge.yml`:s concurrency-grupp från per-SHA till en FAST nyckel
(GitHubs inbyggda "kör senaste, hoppa mellanliggande" utan ny kod), och
byt SAMTIDIGT `classify-post-merge.sh`:s spann-källa från
`github.event.before` till "SHA:t för senaste FAKTISKT AVSLUTADE
körning" (annars återöppnas `N3`:s täckningshål via en annan mekanism).
Denna ADR LÅSER RIKTNINGEN (klockan avvisas, väg 3 är den fortsatta
vägen) men låser INTE den slutgiltiga mekaniken som ett byggt
arkitekturbeslut — den bärs framåt som `TASK-464.14`, blockerad av S3
(`TASK-464.6`). Skälet till att den hålls öppen här snarare än låst:
**precedent-rymden för denna EXAKTA kombination är TOM, inte tunn** —
forskningspasset fann ingen branschkälla, i något av de sex verifierade
projekten eller i egna sökningar, som beskriver fast concurrency-grupp
plus API-härledd "senaste avslutade körning" tillämpat på ett
postsubmit-lager; det är passets egen härledning ur GitHubs
dokumenterade byggstenar, och kostnadsöverslaget (≈ 4 650 min/mån efter
S3) vilar på två dagars burst-data, inte en hel månad
(§ Kostnad i två mått nedan).

**Eget mätt skäl till att status quo (dagens seriella per-landning-form)
inte håller under belastning:** tre landningar 2026-09-19 09:50 UTC
skapade post-merge-körningar inom 32 sekunder av varandra; den TREDJE
landningens Staging-jobb hade inte ens startat 31 minuter senare —
inte på grund av en klocka, utan för att `ci-suite.yml`:s
`staging-tests`-mutex bara släpper igenom en körning i taget. Två av
de tre landade över sitt eget 12-minuterstak. Källa: samma
research-pass, § "Eget mätt", `gh run list` mot repots faktiska data.

**Avvisat alternativ: ren klocka (schemalagd efterkontroll, t.ex. var
30:e minut).** Avvisad av skälen ovan — ingen branschprecedent, GitHubs
egen dokumentation varnar för schemadrift och tappade körningar under
belastning, och det egna kostnadsöverslaget visar att en ren klocka
inte ens är billigare än dagens form efter S3 (samma storleksordning,
≈ 4 650–11 300 min/mån beroende på antagande) — den bara FÖRDELAR om
kostnaden till en jämnare men i snitt LÅNGSAMMARE form.

## Kostnad i två mått

Väntetid OCH fakturerade minuter redovisas alltid tillsammans, med
enhet utskriven — ett ensamt "min" läses annars som väntan (lesson-
kandidat 39, Del 17). **Talen i denna sektion som är märkta "härlett
(Del 17, n=1)" bygger på EN uppmätt kodlandning per klass, inte en
fullmånads dataserie** — det gäller uttryckligen den projicerade
"Efter S1+S2+S3"-kolumnen nedan.

### Per landning, i dag (mätt)

| Landningstyp | Väntetid | Fakturerat | n / källa |
|---|---|---|---|
| Kodlandning (`#2556`, `TASK-461`) | ≈ 11–12 min (förslag 5,4 + kö 6,0) | 192 fakt. min (förslag 44 + kö 45 + huvudgren 42 + efterkontroll 57 + CodeQL 4) | n = 1, mätt 2026-09-19, sessionsdok Del 15 (rad ~2091) |
| Dokumentlandning, FÖRE S4+SE2 (`#2565`) | 9 min 21 s (förslag 4,1 + kö 4,3) | 31 fakt. min (8+8+8+5+2) | n = 1, mätt 2026-09-19, sessionsdok Del 15 (rad ~2089-2092) |
| Dokumentlandning, EFTER S4+SE2+S5 (`#2572`) | 8,4 → 2,8 min | 31 → 13 fakt. min | n = 1, mätt 2026-09-19, sessionsdok Del 19 (handoff TILLSTÅND) |

**Öppen källdivergens, flaggad enligt ADR-086 i stället för tyst
reconciled:** Del 17:s egen sammanfattningstabell (nedan) anger
CodeQL-posten för dagens kodlandning som "≈ 9"; den detaljerade
nedbrytningen samma dag (raden ovan, källan 2091–2092) ger "4" och
summerar exakt till 192 (44+45+42+57+4). De två citaten i
källmaterialet är alltså inte inbördes konsistenta med mer än 5
minuter — denna ADR återger båda i stället för att gissa vilket som är
rätt.

### Per landning, härlett (Del 17, n = 1 per landningstyp)

| Yta, kodlandning | Mätt i dag (`#2556`) | Efter S1 + S2 + S3 |
|---|---|---|
| Förslaget | 44 fakt. min | ≈ 10 |
| Kön (hela sviten, 15 jobb) | 45 | 45 |
| Huvudgrenen efter landning | 42 | ≈ 6 |
| Efterkontrollen | 57 | ≈ 24 |
| CodeQL | ≈ 9 | ≈ 9 |
| **Summa** | **≈ 192** | **≈ 94** |

`S1`/`S1b` (huvudgrenen kör inte om en svit kön redan körde,
SHA-identitet i stället för trädjämförelse) är INTE ett eget numrerat
beslut i denna ADR — det är förutsättningen `ADR-077` § Beslut 2 redan
lade grunden för, och byggs som `TASK-464.4`, som denna ADR blockerar.
Kolumnen "Efter S1+S2+S3" tar med den effekten eftersom det redan är
den planerade byggordningen (sessionsdok Del 11 § Ordningen), inte en
ny sjunde ADR-beslutspunkt.

### Per månad, augustis volym (härlett, n = 418 stratifierat urval för augusti-basen)

| Läge | Min/mån | Källa |
|---|---|---|
| Augustis takt med dagens uppsättning (innan denna ADR) | ≈ 137 800 | `actions-minutbudget-2026-09-18.md` § A6 |
| Efter S1+S2+S3 (409 kod- + 870 dokumentlandningar, dok. 13 fakt. min mätt på `#2572`) | ≈ 51 000 | Del 17, härlett |
| + buntade orkestrerardokument (beslut 5) + länkkontroll < 60 s (`TASK-464.9`) | ≈ 44 000 | Del 17, härlett |
| + efterkontroll-optimering väg 3 (**OBELAGD spak, `TASK-464.14` inte byggd**) | ≈ 39 000 | Del 17, härlett, ≈ 4 650 min/mån-delta vilar på två dagars data |
| Vid 2× augustis takt (samma paket) | ≈ 71 000 | Del 17, härlett — över taket, se § Besluten 1 |

**Tak i takt med det paket denna ADR beslutar (utan den obelagda
klock-spaken):** ≈ 1,3× augustis takt inom 50 000-taket. 2× nås inte med
testjusteringar allena — kö-ytans full-svit-kostnad (45 fakt. min, 15
jobb per kodlandning) är golvet, se § Besluten 1 och 2.

### Väntekostnaden av att INTE riva skärvningen (beslut 3)

| Spak | Besparing (min/mån) | Väntekostnad per kodkörning | Källa |
|---|---|---|---|
| S6 — av-skärva `Acceptance` (3 → 1) | 7 500 (enskilt) | +8 min | `actions-minutbudget-2026-09-18.md` § B |
| S7 — av-skärva hermetikbeviset (riv N6) | 9 100 (enskilt) | +5 min | samma källa |
| S6+S7 kombinerat (P2 → P2+) | **3 500 netto** (överlapp) | 8–13 min | § C, paketjämförelsen |

## ADR-baren — prövad

1. **Svår att återställa?** Ja, i båda meningarna. I kod/koherens: när
   `TASK-464.4`–`TASK-464.14` byggt om vilken yta som bär den
   obligatoriska kontrollen (`CI Passed or Skipped`), återinför en
   naiv rivning exakt fyrdubbel-testning eller `N3`:s täckningshål —
   ingen av dem syns förrän en kostym eller en revert-attribution
   börjar avvika, vilket redan hänt en gång (`#2549`). Utan denna ADR
   är gränsen mellan "vad `S2`/`S3` medvetet flyttade" och "vad som
   glömdes" orekonstruerbar ur skripten ensamma.
2. **Överraskande utan kontext?** Ja — att en kod-PR:s acceptance-fel
   dyker upp först i KÖN, eller att efterkontrollen inte längre kör
   hela sviten en fjärde gång, ser ut som ett regressions-hål om man
   inte känner till att det är ett MEDVETET, mätt val mot ett uttalat
   tak. Väntetidstaket (beslut 3) är på samma sätt oväntat utan
   kontext: en agent som ser 12 minuters median-väntan på en
   kodlandning och föreslår att riva skärvningen för att korta den vet
   inte att just den växeln redan prövades och avvisades.
3. **Verklig avvägning?** Ja: sex beslut vägde uttryckligen fördel mot
   pris i BÅDA måtten (väntetid och pengar) och mot ett verkligt
   avvisat alternativ vardera — byggmaskin nu (beslut 2), riven
   skärvning (beslut 3), etikett-full-svit nu (beslut 4), buntning av
   alla dokument-PR:er (beslut 5), ren klocka (beslut 6b). Ingen av
   dem var en gratislunch: varje "ja" kostade antingen fördröjd
   feedback, väntetid, eller ett arbetsformsbeslut som redan en gång
   avvisats i en snävare form.

## Snubbeltrådarna

Två mätbara omprövningsvillkor är en del av besluten ovan men fanns
inte som trådar i `tasks/threads/README.md`-registret vid detta ADR:s
författning — de bärs här, med sina villkor utskrivna, i stället för
att tappas mellan grillningen och registret:

1. **Budget-snubbeltråden (beslut 2).** Vid 40 000 fakturerade
   min/mån: starta research om egen byggmaskin (hyrd server · en
   färdig byggmaskinstjänst · en hybrid av de två — hybridformen är
   OBELAGD, ingen källa) eller buntade kodlandningar (rör
   review-grindens singulära `kortId`, [[L636]]). Ingetdera byggs
   innan tråden löst ut.
2. **Kö-fällnings-snubbeltråden (beslut 4).** Överstiger andelen
   kö-fällningar (PR:er gröna på förslaget som ändå faller i kön) ≈ 5
   procent av en månads landningar, tas ett etikett-utlöst
   alternativ upp: en PR kan märkas för att köra den fulla sviten
   redan på förslaget, i stället för att vänta på kön. **Inte utlöst
   i dag** — kön kör i dag samma svit som förslaget, så en
   kö-fällning i denna mening går inte att mäta förrän S2
   (`TASK-464.5`) är i drift; se § Besluten 4.

## Alternativ som övervägdes

| Alternativ | Status | Skäl | Hör till |
|---|---|---|---|
| Egen byggmaskin (eller byggmaskinstjänst) NU, i princip | Avvisad | Bygge "ifall" — Marcus arbetar inte i 2× takt i dag; pushback fångade det direkt | Beslut 2 |
| S6/S7 — riva skärvningen tillbaka | Avvisad | Växelkurs, inte förbättring: 3 500 min/mån netto mot 8–13 min extra väntan, direkt mot väntetidstaket | Beslut 3 |
| Etikett-utlöst full svit på förslaget, byggd NU som standard | Avvisad | Samma "ifall"-felklass som byggmaskinen — byggs när snubbeltråden (≈ 5 % kö-fällningar) faktiskt löser ut | Beslut 4 |
| Buntning av ALLA dokument-PR:er, inklusive agenternas | Avvisad | Exakt den `session-batchad push` `ADR-097` redan avvisat med fyra mätta skäl; de skälen gäller agenternas arbetsträd oförändrat | Beslut 5 |
| Ren klocka som efterkontrollens trigger | Avvisad | Falsifierad branschhypotes (sex organisationer, samtliga händelsestyrda); GitHubs egen dokumentation varnar för schemadrift/tappade körningar; ingen billigare än dagens form efter S3 | Beslut 6b |
| History-rewrite av persondata-exponeringen | **Hör INTE hit** | Beslut 9 (Del 17), hanteras i `T171`/`CLAUDE.md` — ingen del av denna ADR:s CI-arkitektur | — |

## Konsekvenser

**Positiva:** samma träd testas en gång, i kön, i stället för upp till
fyra gånger — den enskilt största posten i minutbudgeten (87 procent av
augustis fakturerade minuter). Väntetiden får för första gången ett
eget, mätt tak vid sidan av kostnadstaket, så framtida CI-ändringar
inte kan köpa det ena med det andra i tysthet. Repot kan bli privat med
en känd, mätt kostnadsprofil i stället för en okänd (≈ 44 000–51 000
min/mån mot ett tak på 50 000, beroende på om `TASK-464.14` byggs).
Golvet rörs inte: den hermetiska Acceptance-klassen, tillgänglighets­-
kontrollen, beroendegranskningen, hemlighetsskyddet och review-grinden
(`ADR-105`) är alla intakta på den yta där de faktiskt bevisar något —
S2/S3 flyttar VAR de körs, ingen av dem tas bort.

**Negativa/skuld, öppet burna:** denna ADR bygger INGEN kod — arkitekturen
låses här, mekaniken byggs i `TASK-464.4`–`TASK-464.14`. Fram till dess
är "efter S1+S2+S3"-kolumnen i § Kostnad i två mått en projektion, inte
ett mätt utfall (`TASK-464.12` ommäter med samma metod som
researchen). Beslut 6b:s implementation (väg 3) är explicit ÖPPEN —
ingen branschprecedent finns för den exakta kombinationen, och dess
kostnadsöverslag vilar på två dagars data. Bygg-agenten får acceptance-
besked ett steg senare (i kön, inte på förslaget) sedan beslut 4 —
härlett ur en proxy till ≈ 21 extra kö-varv i månaden vid augustis
takt (inte ännu mätt — se § Besluten 4), en upplevd kostnad, inte en
säkerhetskostnad. Den interna talkälle-divergensen i
§ Kostnad i två mått (CodeQL 4 kontra ≈ 9) är inte upplöst här; nästa
mätning (`TASK-464.12`) bör klargöra vilket som var rätt.

**Vad som INTE ändras, uttryckligen:** `ADR-105`s review-grind
(färsk-kontext-granskning, backstopp i kön) är opåverkad av denna ADR —
S2 flyttar VAR den obligatoriska kontrollen produceras, inte OM en PR
granskas eller HUR granskningsutlåtandet valideras. `ADR-076`s
merge-kö, `ALLGREEN`-gruppering och den obligatoriska checken
`CI Passed or Skipped` står oförändrade som mekanism — bara innehållet
under checken på respektive yta byter form. `ADR-077`s nattnät
(`nightly.yml`) förblir den korrekta, branschlika periodiska
svepningskontrollen och rörs inte av något beslut här.

## Relaterat

- [`docs/research/actions-minutbudget-2026-09-18.md`](../research/actions-minutbudget-2026-09-18.md) — hela mätningen, spakarna (S1–S9) och paketen (P1–P3) denna ADR väljer mellan.
- [`docs/research/efterkontroll-pa-klocka-2026-09-19.md`](../research/efterkontroll-pa-klocka-2026-09-19.md) — beslut 6b:s fullständiga underlag, sex branschledare, väg 1–4.
- [`docs/research/repo-privat-konsekvenser-2026-09-18.md`](../research/repo-privat-konsekvenser-2026-09-18.md) — beslut 7:s förberedelselista (utanför denna ADR:s scope, men samma grillning).
- `tasks/sessions/2026-09-17-session-126.md` Del 11 (ledstjärnan, skärpt i Del 15), Del 17 (grillad samsyn, besluten 1–10), Del 18 (beslut 6b, korten mintade).
- [`TASK-464`](../../backlog/tasks/task-464%20-%20PRD-Minutbudgeten-under-50-000-—-testa-varje-ändring-en-gång-inte-fyra.md) — PRD:t; skivorna `TASK-464.4`–`TASK-464.14` bygger vad denna ADR låser.
- [[L636]] — review-utlåtandets singulära `kortId`, relevant för budget-snubbeltrådens "buntade kodlandningar"-gren.
- `ADR-097` § Updates — amenderingen denna ADR beslutar (push kontra landning).
- `ADR-076`, `ADR-077`, `ADR-036` § Updates — pekare till denna ADR där dess beslut ändrar deras räckvidd.

## Updates

Inga än.
