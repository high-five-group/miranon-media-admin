---
owner: marcus803
updated: 2026-09-19
review_by: 2026-12-19
status: draft
---

# "Request context disposed" i staging-sviten — rotorsaken är att seed-eventet blivit CI:s egen soptipp (2026-09-19)

> **Uppdraget.** Rotorsaksdiagnos av den staging-flake som fällde
> efterkontrollen (`post-merge.yml`) två gånger 2026-09-18: körning
> `35343753042` (träd `a046d29c`, larmärende `#2544`) och `35346136785`
> (träd `ab6b2127`, larmärende `#2549`). Diagnosen är READ-ONLY mot repot —
> ingen commit, ingen gren, ingen kodändring. Alla staging-anrop i § 4 är
> rena GET-läsningar; prod rördes aldrig.

---

## Sammanfattning

`Request context disposed` är **inte** felet. Det är vad Playwright skriver
när den river en test-lokal `request`-fixtur efter att testets tidsgräns
redan löpt ut — loggen säger `Test timeout of 30000ms exceeded.` på raden
FÖRE. Det verkliga felet är att **ett enda `GET
get-registrations?eventId=<seed-eventet>` numera tar längre tid än hela
testets tidsbudget.**

Orsaken är mätt, inte gissad: endpointens event-gren är **O(n) i eventets
antal anmälningar** (~0,17 s per anmälan), och seed-eventet
`reci2UQEPBMl3ebNl` har svällt till **188 anmälningar, varav 185 är
CI:s egna sentinel-poster som aldrig städats bort**. Purgens efter-körning-
läge städar bara Eventplanering-rader; anmälnings-sentinelerna når bara
setup-purgens 60-minutersfönster, och vid fleet-drift skapas de snabbare än
fönstret släpper dem.

**`#2543` frias.** Samma test föll redan på `a046d29c`, tjugosex minuter
FÖRE `#2543` landade, och `#2543`:s diff rör varken en Edge Function eller
en staging-test (§ 3). En revert hade kostat en landning och inte flyttat
felet en millimeter.

---

## 1. Vad loggen faktiskt säger — BELAGT

Båda körningarna fäller i samma steg (`API tests (staging)`), och i båda
står tidsgränsen FÖRE dispose-felet. Verbatim ur
`gh api …/actions/jobs/105595626665/logs` (körning `35343753042`):

```text
2026-09-18T12:26:36.5136777Z     Test timeout of 30000ms exceeded.
2026-09-18T12:26:36.5137470Z     Error: apiRequestContext.get: Request context disposed.
2026-09-18T12:26:36.5139577Z       - → GET ***/functions/v1/get-registrations?eventId=reci2UQEPBMl3ebNl
```

Ordningen är hela poängen: Playwright avbryter testet vid taket, river
`request`-fixturen, och det redan utestående GET-anropet rapporterar då
`disposed`. **Symptom, inte orsak** — precis som uppdragets hypotes sa.

| Körning | Fallande test | Tak | Fel |
|---|---|---|---|
| `35343753042` | `send-registration-confirmation.staging.test.ts:192` (GATE-LIVENESS + ATOMICITET) | **30 000 ms** (projektets default) | timeout → disposed, 3 försök |
| `35346136785` | samma test **+** `cancel-registration.staging.test.ts:232` (runda-tripen) | 30 000 ms resp. **90 000 ms** (`test.setTimeout(90_000)`) | timeout → disposed, 3 försök vardera |

Båda testerna faller i sin `readRegistration`-hjälpare
(`send-registration-confirmation…:118`, anropad från `:216`;
`cancel-registration…:142`, anropad från `:278`/`:296`), och båda
hjälparna gör exakt ett anrop: `GET
get-registrations?eventId=reci2UQEPBMl3ebNl`.

Att `cancel-registration`-testet spräcker ett **90 s**-tak är det starkaste
enskilda belägget för att långsamheten är grov, inte marginell.

### Punkt-utskriftens `T` och `×`

Uppdraget noterade ett `T` utöver `×`. Det stämmer och hör till samma test:
Playwrights dot-reporter skriver `T` för timeout och `×` för övriga
fällningar, och de tre markörerna per körning är de tre försöken (initial +
`retries: 2` i CI).

---

## 2. Hela körningen var långsam, inte bara det fallande testet — BELAGT

Detta är fyndet som utesluter "buggigt enskilt test". Jag tidsatte varje
80-teckens framstegsrad i dot-reportern (tidsstämpeln sätts när raden är
full) för de två röda och sex gröna körningarna av samma jobb.

| Segment (80 tester) | Grön median (n=6) | **Röd 1** `35343753042` | **Röd 2** `35346136785` |
|---|---|---|---|
| 1 | 30,5 s | 38,0 s | 36,7 s |
| 2 | 40,4 s | 57,6 s | **93,3 s** |
| 3 | 88,7 s | 115,2 s | **189,3 s** |
| 4 | 36,5 s | 46,4 s | 69,3 s |
| 5 | 90,4 s | 120,3 s | 124,2 s |
| 6 | 82,1 s | 139,2 s | 166,4 s |
| 7 (rest) | 26,6 s | 39,3 s | 44,1 s |
| **Total (Playwright)** | **6,3–6,8 m** | **9,3 m** | **12,1 m** |

De röda körningarna ligger **1,2–2,3× över gröna medianen i VARJE segment
— inklusive segment 1 och 2, som körs långt innan första fällningen**.
Långsamheten föregår alltså felet och är global för körningen. Ett trasigt
enskilt test kan inte producera det mönstret.

Kontrastgruppens jobbtider (`gh api …/actions/jobs/<id>`, steget
`API tests (staging)`):

| Körning | Träd | API-steg | Utfall |
|---|---|---|---|
| `35337578276` | `129675f1` | 389 s | grön (530 passed) |
| `35340750185` | `b6872fb9` | 376 s | grön (530 passed) |
| `35341976206` | `0b3c9a24` | 440 s | grön (529 passed, 1 flaky) |
| **`35343753042`** | **`a046d29c`** | **559 s** | **RÖD** |
| `35344214605` | `fba38b66` | 393 s | grön (530 passed) |
| `35344474711` | `e6308887` | 408 s | grön (530 passed) |
| `35344638454` | `cdd1856b` | 507 s | grön (532 passed) |
| **`35346136785`** | **`ab6b2127`** | **726 s** | **RÖD** |

De två röda är också de två långsammaste. Jobbet bär `timeout-minutes: 20`
(höjt 12→20 i `TASK-404`), så taket slog aldrig till — båda fällde på
testnivå, inte på jobbnivå.

---

## 3. `#2543` frias — BELAGT

`#2549` är automatskrivet och pekar ut landningen `#2543` som primär
misstänkt med revert-förslag. Tre oberoende belägg fäller den slutsatsen:

1. **Tidsordningen.** Samma test föll redan i körning `35343753042` på
   träd `a046d29c` (merge av `#2521`), skapad `12:16:00Z`. `#2543` mergades
   `12:36:22Z` och dess efterkontroll skapades `12:42:57Z` — **26 minuter
   senare**.
2. **Diffen rör inget av det.** `git show --stat ab6b2127`: fyra filer —
   `src/components/hem/hamtaDashboardData.ts`,
   `src/components/hem/useDashboardData.ts`,
   `tests/api/hem-delad-hamtning.test.ts` och ett sessionsdok. **Ingen
   Edge Function, ingen `*.staging.test.ts`.**
3. **Testantalet bekräftar det.** api-staging körde 532 tester i `#2543`:s
   körning — exakt samma 532 som i föregående gröna körning
   (`cdd1856b`/`35344638454`). `#2543`:s nya testfil är `api-pure`, inte
   `api-staging`, så den lade till noll staging-tester. De två som tillkom
   (530→532) kom från `#2538` (`cdd1856b`), som landade FÖRE.

**En revert av `#2543` hade inte rört rotorsaken.**

---

## 4. Rotorsaken — BELAGT genom direkt mätning

### 4.1 Endpointen är O(n) i eventets anmälningar

`GET get-registrations?eventId=` kör (se
`supabase/functions/get-registrations/index.ts` steg 1–6):

1. ett single-get på eventraden,
2. `fetchByRecordIds(Anmälningar, <alla eventets anmälnings-ID:n>)`,
3. `berikaPersonhistorik(registrations)` → `fetchByRecordIds(Personer, …)`
   och `fetchByRecordIds(Deltaganden, …)`.

`fetchByRecordIds` chunkar **10 record-ID per Airtable-anrop**
(`supabase/functions/_shared/airtable-client.ts:508`). 188 anmälningar blir
därmed ~19 anrop för anmälningarna, ~19 för personerna och ytterligare för
deltagandena — **i storleksordningen 40–60 sekventiella Airtable-anrop för
ETT HTTP-anrop**, under Airtables delade 5 req/s-budget.

### 4.2 Mätningen — fyra event, samma endpoint, samma minut

Rena GET-läsningar mot staging (`apphjj8Q7lkXCMsL4`), 2026-09-18 ~22:4xZ,
sekventiellt med 2 s paus:

| Event | Anmälningar | `time_total` |
|---|---|---|
| `rece1IvvqxvdjbC7u` | 4 | **2,48 s** |
| `rec62qCKvBFihIvl4` | 10 | **4,51 s** |
| `recolQdNGcKz1eX0n` | 17 | **7,43 s** |
| **`reci2UQEPBMl3ebNl` (seed-eventet)** | **188** | **34,44 s** |

Lutningen är i praktiken rak: (34,44 − 2,48) / (188 − 4) = **0,174 s per
anmälan**. Tre upprepade anrop mot seed-eventet gav 52,20 s / 36,47 s /
41,72 s — alltid **över testets 30 s-tak**, för ett enda av testets flera
anrop.

Den event-lösa grenen är opåverkad (1,76 s / 1,68 s för 350 poster) — den
gör varken record-ID-batch eller personhistorik-berikning. Problemet sitter
uteslutande i event-grenen.

### 4.3 Seed-eventet är CI:s egen soptipp

Sammansättningen av de 188 (mätt ur svaret):

| Klass | Antal |
|---|---|
| `create-test+<uuid>@staging.test` (CI-sentinel) | **185** |
| Riktiga fixturposter (`zz-6c-regfix-*`, `staging-test`) | 3 |

Hela staging-basen bär 350 anmälningar, varav **228 sentinels** — och
**185 av dem hänger på seed-eventet**. Näst största event har 17. Av
sentinelerna är 227 skapade **2026-09-18**.

Kopplingen till testerna är direkt: `findSeededEventId` härleder eventet ur
`TEST_REGISTRATION_RECORD_ID`, och `createSentinelRegistration` skapar varje
ny sentinel **på exakt det eventet**. Minst sju staging-sviter skapar
`create-test+`-anmälningar (`cancel-registration`, `create-registration`,
`get-persons`, `hamta-inbetalningar-batch`,
`hamta-oppna-betalningar-kvitto-avbojt`, `rebook-registration`,
`send-registration-confirmation`). Varje körning matar alltså soptippen
som varje efterföljande körning måste läsa igenom.

### 4.4 Varför de aldrig städas i tid

`.purge-staging-policy.json` har rätt target
(`create-registration-sentineler`, Anmälningar) och `minAgeMinutes: 60`.
Setup-purgen fungerar — verbatim ur purge-jobbet i `35346136785`
(job `105603123352`, `12:43:26Z`):

```text
▸ create-registration-sentineler (Anmälningar): 114 träffar — 28 raderas,
  85 för färska, 0 länk-guardade, 1 icke-exakta
   🗑  28/28 raderade
   ✅ efter-verifiering: 0 radera-bara sentineler kvar
```

**85 av 114 var "för färska"** (< 60 min). Och efter-körning-purgen
(job `105617612570`, `13:31:21Z`) städar **enbart Eventplanering**:

```text
▸ create-event-sentineler (Eventplanering): 13 ägda raderas, …
▸ create-event-plats-harledning-sentineler (Eventplanering): 6 ägda raderas, …
▸ save-event-text-eventplanering-sentineler (Eventplanering): 18 ägda raderas, …
```

Ingen Anmälningar-rad. Skälet är strukturellt: `--efter-korning` städar det
som står i ägar-manifestet (`.kastbara/poster.jsonl`, ADR-060 punkt 3), och
**ingen av anmälnings-sviterna registrerar sina sentinels där** — verifierat
med `grep` mot `kastbara-poster` i `tests/`:
`send-registration-confirmation.staging.test.ts`,
`cancel-registration.staging.test.ts` och
`create-registration.staging.test.ts` saknas i den listan.

Nettot: anmälnings-sentineler kan bara städas av setup-purgen, och bara
efter 60 minuter. **Vid fleet-drift landar staging-körningar tätare än så**
— 2026-09-18 landade åtta staging-bärande körningar mellan 11:02 och 13:31,
flera med 2–5 minuters mellanrum. Tillskottet överstiger avräkningen, nivån
stiger, och latensen med den.

### 4.6 Mätningen är tillståndet VID röd 2, inte ett nattligt drift

Detta var först bokfört som en svaghet ("mätt ~9 timmar efteråt"). Det
visade sig vara fel — jag prövade det och slutsatsen håller starkare än så.

**Ingen CI-körning har rört staging-basen efter `13:31:35Z`.** Jag räknade
upp samtliga workflow-körningar efter röd 2 (`35350533479`, `35350938325`,
`35352765943`, `35352791786`, `35353438164`, `35353935047`, `35355081287`,
`35356630926`, `35357073178`, `35357569967`) och deras jobb: **varje**
`Staging (API + E2E)`, `Staging sentinel purge` och
`… (efter körning)` är `skipped` (D0/docs-only). Nattvakten
(`35355035790`, schedule `14:14:52Z`) körde ett enda jobb, `Kom natten
igång?`, utan staging-beröring.

Nivån jag mätte — 188 poster på seed-eventet, 228 sentinels i tabellen — är
därmed **tillståndet som rådde när röd 2 avslutades**, inte något som vuxit
fram under natten.

Det ger en kvantitativ konsistenskontroll. Från setup-purgens tal
(`12:43:26Z`: 114 träffar, 28 raderade → 86 kvar) och de tre API-steg som
följde (`12:43:28`, `13:00:07`, `13:18:22`) skapades ~142 nya sentinels,
alltså **~45 anmälnings-sentineler per api-staging-körning**. Vid röd 2:s
START hade eventet därmed ~140–150 poster ≈ **25–27 s per
`readRegistration`**:

| Test | Tak | Antal tunga läsningar | Förväntat | Utfall |
|---|---|---|---|---|
| GATE-LIVENESS | 30 s | 2 (+ overhead) | ~55 s | **föll** ✓ |
| cancel-registration runda-trip | 90 s | 4 | ~105 s | **föll** ✓ |

Samma räkning bakåt för röd 1 förklarar varför `cancel-registration`
klarade sig DÄR: för att 30 s-taket skulle spricka men 90 s-taket hålla
krävs 13,5 s < t < 22,5 s per läsning, alltså ~70–120 poster på eventet vid
`12:17`. Modellen förutsäger alltså **både** vilka tester som föll och
vilket som inte gjorde det, i båda körningarna — utan någon fri parameter.

### 4.5 Den självförstärkande retryn

Fällningen sker i `readRegistration`, som körs **efter**
`createSentinelRegistration`. Varje av de tre försöken hinner alltså skapa
sin sentinel innan det timeoutar. **En fällning gör därför eventet tre
poster större — ≈ 0,5 s långsammare — inför nästa körning.** Retry-
mekanismen, som finns för att absorbera brus, matar här det tillstånd som
orsakar felet.

---

## 5. Vad hypoteserna i uppdraget landade i

| Hypotes | Utfall |
|---|---|
| Timeout → disposed, långsamhet är orsaken | **BEKRÄFTAD** (§ 1, § 2) |
| Airtable 429/backoff | **EJ BELAGD, men ej utesluten.** `AIRTABLE_429_BASE_WAIT_MS = 30_000` gör vägen farlig — en enda 429 i EF:en ≥ 30 s, exakt testets tak. Inga 429-spår finns i CI-loggen, men de skulle loggas i EF:en, inte i Playwright-utdatan. Se § 6. |
| Staging-EF-kallstart | **EJ BELAGD.** Latensen följer postantalet linjärt över fyra event i samma mätfönster — kallstart förklarar inte den lutningen. |
| Samtidig staging-last (CI) | **DELVIS FALSIFIERAD.** Se nedan. |
| `#2543` primär misstänkt (`#2549`) | **FALSIFIERAD** (§ 3) |

### Konkurrens-confoundern, prövad

Staging-jobben serialiseras korrekt av mutexen `staging-tests`
(`concurrency.group`, `queue: max`) — jobbtiderna är perfekt FIFO:
`12:16:53→12:26:40`, `12:26:42→12:42:57`, `12:42:58→12:59:34`,
`12:59:37→13:17:46`, `13:17:49→13:30:33`.

Purge-jobben saknar mutex, och tre purge-körningar överlappade **röd 1**
(`12:21:36`, `12:24:32`, `12:26:25`). Men **röd 2 hade ingen överlappning
alls** — närmaste purge slutade `13:18:14`, åtta sekunder före API-steget
började `13:18:22`, och inget annat CI-jobb rörde staging under
`13:18–13:30`. Ändå var röd 2 den långsammaste körningen i hela serien.
**CI-intern konkurrens kan alltså inte bära förklaringen.** Postantalet kan.

Lokala agentflottor kan ha bidragit med last mot samma bas; det är inte
mätbart i efterhand och behövs inte för förklaringen.

---

## 6. Vad jag INTE kunde belägga

- **Det exakta postantalet per event vid `12:17` respektive `13:18`.**
  Airtable har ingen tidsserie att läsa bakåt, och purgen loggar tabellvida
  träffar (114 vid `12:43`), inte per event. **Men osäkerheten är mindre än
  den såg ut** (§ 4.6): ingen CI-körning har rört basen efter `13:31:35Z`,
  så mätningen ÄR röd 2:s sluttillstånd, och nivån vid körningarnas start
  går att räkna bakåt ur purgens tal. Uppskattningarna (~140–150 poster vid
  röd 2, ~70–120 vid röd 1) är **härledda, inte mätta** — de förutsäger
  dock korrekt vilka tester som föll och vilket som höll i båda
  körningarna.
- **Att en Airtable-429 faktiskt inträffade.** EF:ens backoff loggar i
  Supabase-loggen, inte i CI-loggen, och att nå den kräver
  `supabase link` — som jag medvetet lämnade orörd (sticky-länk-risken,
  `CLAUDE.md` § Prod-EF-deploy). Hypotesen är varken bekräftad eller
  utesluten och **behövs inte** för förklaringen, men den förvärrar
  bilden: en 429 mitt i en redan 34 s lång läsning gör fällningen
  omedelbar.
- **Varför segment 2–3 i röd 2 var oproportionerligt långsamma**
  (93 s/189 s mot 40 s/89 s). Postantalet förklarar en bred förhöjning,
  inte just den profilen.

### Om `npm run metrics:flake` — medvetet ej kört

Riggen (`scripts/flake-matserie.mjs`) är byggd för interfolierad A/B av en
**ändring** mot en flake-rat. Här finns ingen ändring att A/B:a: rotorsaken
är ett datatillstånd i staging, och mekanismen är redan mätt direkt (§ 4.2)
med hårdare bevisvärde än en frekvensserie skulle ge. En lokal serie vore
dessutom **fel instrument, med två konkreta skador**: (a) den skulle själv
skapa fler sentinels på seed-eventet och förvärra precis det tillstånd den
mätte, och (b) lokala körningar tar inte `staging-tests`-mutexen, så den
hade stört andra sessioners pågående CI. Detta är CLAUDE.md:s "en lokal
serie kan vara fel instrument för en CI-flake" — sagt öppet, som regeln
kräver.

---

## 7. Åtgärdsförslag — i den ordning de ger effekt

1. **Kapa soptippen vid roten (akut + varaktigt).** Låt anmälnings-
   sentinelerna registreras i ägar-manifestet
   (`tests/support/kastbara-poster.ts`), så efter-körning-purgen städar
   dem i samma körning som skapade dem. Det tar bort 60-minutersfönstrets
   ackumulation helt och gör nivån oberoende av landningstakten. Detta är
   den enda åtgärd som håller när fleeten går varm.
2. **Engångsstädning.** De 185 kvarliggande sentinelerna på
   `reci2UQEPBMl3ebNl` bör bort; efter det faller ett `readRegistration`
   från ~34 s till under 2 s.
3. **Låt inte testerna dela seed-eventet.** Ett eget sentinel-event per
   körning gör `readRegistration` O(1) i stället för O(hela historiken) och
   skär beroendet mellan sviter.
4. **Höj INTE taket som första åtgärd.** 30 000 ms är inte för lågt — det
   är endpointen som blivit för långsam. Ett höjt tak hade dolt en
   verklig, växande prestandaregression i en yta produkten också använder.
   Nivå-larm hellre än tyst tolerans.

**Utanför denna diagnos, men värt en egen tråd:** `get-registrations`
event-gren är O(n) med ~0,17 s per anmälan även i produktion. Ett event med
188 riktiga anmälningar tar 34 s att läsa i appen. Det är inte ett
testproblem.

---

## Källor

Samtliga tal i detta dokument är mätta 2026-09-18/19, inte avskrivna.

- `gh api repos/high-five-group/miranon-media-admin/actions/jobs/105595626665/logs`
  (röd 1), `…/105603278876/logs` (röd 2), `…/105603123352/logs`
  (setup-purge), `…/105617612570/logs` (efter-purge)
- `gh run list --workflow post-merge.yml`; `gh api …/actions/runs/<id>/jobs`
  för jobb- och stegtider
- Playwright-artefakt `10545733053` (`error-context.md` × 3 — samtliga
  `Test timeout of 30000ms exceeded.`)
- `git show --stat ab6b2127` (`#2543`), `git show --stat cdd1856b` (`#2538`)
- `playwright.config.ts` (projektet `api-staging` — inget eget `timeout`,
  default 30 s; `retries: process.env.CI ? 2 : 0`)
- `.github/workflows/ci-suite.yml` (`test-staging`: `concurrency.group:
  staging-tests`, `timeout-minutes: 20`; `purge-efter`:
  `--efter-korning`)
- `supabase/functions/get-registrations/index.ts`,
  `supabase/functions/_shared/registration-read.ts:214`,
  `supabase/functions/_shared/airtable-client.ts:508`,
  `supabase/functions/_shared/airtable-retry.ts:65`
- `.purge-staging-policy.json`; `grep -rn 'create-test+' tests/`;
  `grep -rln 'kastbara-poster' tests/`
- Egna GET-mätningar mot staging-EF:en (fyra event, se § 4.2)
- Jobb-uppräkning för samtliga körningar efter `13:31:35Z` (§ 4.6) —
  staging- och purge-jobben är genomgående `skipped`; nattvakten
  `35355035790` rörde inte staging
