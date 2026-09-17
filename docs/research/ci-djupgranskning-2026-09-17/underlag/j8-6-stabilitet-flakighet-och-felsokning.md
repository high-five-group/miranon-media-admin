---
owner: marcus803
updated: 2026-09-17
review_by: 2026-12-17
status: draft
---

# J8.6 — Stabilitet och felsökning: hur ofta ljuger testflödet, och hur snabbt förstår vi ett rött?

> Skrivet av en agent i CI-djupgranskningen (Session 126), 2026-09-17, i
> worktreen `s126-ci-djupgranskning`. Modell: Sonnet 5 (`claude-sonnet-5`).
> Ögonblicksbild: `origin/main` på `eeca8c72` (2026-09-08) — repot har inte
> rört sig sedan dess. Denna fil själv skrevs från commit `85045ad7` på
> grenen `docs/s126-ci-djupgranskning`. Läs `00-agentkontrakt.md` i samma
> katalog för metodkontraktet — det gäller fullt ut här och återges inte.

**CI** (continuous integration) betyder de automatiska kontroller som körs
varje gång någon ändrar kod: bygga appen, köra tester, leta säkerhetshål i
beroenden, kontrollera länkar i dokumentationen. **Flakig** (flaky) betyder
ett test som ibland säger "fel" och ibland "rätt" på exakt samma kod — utan
att appen faktiskt ändrats. **Merge-kö** är en kö GitHub håller för
kodändringar som väntar på att slås ihop; en ändring måste vara felfri för
att komma ur kön.

## Kort svar

**Just nu ljuger testflödet nästan aldrig — men det är nästan alltid rött,
av två helt andra, identifierade skäl.** Sedan 2026-09-09 har **samtliga 14**
körningar av huvudflödet (`ci.yml`) på riktiga utvecklingsgrenar fallerat
(**verifierad**, `gh run list`, se § Metod) — men INTE för att koden som
testades var trasig. Två fristående, korrekt fungerande grindar slår till på
**varenda** ändring oavsett innehåll:

1. En **äkta säkerhetsvarning** i beroendeträdet (två "high"-graderade
   sårbarheter, `GHSA-7w5x-hrqm-74c2` och `GHSA-rgj7-g3m4-5g8c`) stoppar
   `Audit dependencies`-jobbet på i stort sett varje PR — **verifierad**,
   loggen citerar advisory-länkarna rakt av. Detta är korrekt agerande av
   grinden på ett verkligt fynd, inte ett fel i testflödet — men det
   blockerar **även rena dokumentationsändringar** som inte rör
   beroendena alls.
2. Ett **datum-relaterat testfel**, inte flakighet i vanlig mening: exakt
   EN testrad (`tests/acceptance/hem.acceptance.test.ts:281`) återställer
   webbläsarens klocka till *verklig* tid i stället för testsviftens
   frusna låtsas-tid. Sedan verklig tid passerade 2026-09-16 08:00 (ett
   inloggnings-kvitto i testerna är konstruerat att gälla i exakt 24 timmar
   efter den frusna tiden) har detta test misslyckats **deterministiskt** —
   inte ibland, utan **varje gång**, tre av tre försök i varje körning jag
   läste loggen för. **Verifierad** ner till exakt kodraden (§ Fynd 1).

Den distinktionen spelar roll: **traditionell flakighet — ett test som
slumpmässigt växlar mellan rätt och fel på identisk kod — är ovanligt
förekommande just nu.** Repots eget mätverktyg (`npm run metrics:ci`) fann
**0 bevisat flakiga körningar av 100** i sitt rullande fönster (samma
körning gav rött, sedan grönt vid omkörning UTAN kodändring — den enda
formen verktyget räknar som flakighet). De två problemen ovan är i stället
**systematiska defekter** som händelsevis råkar drabba alla, oavsett diff —
och just därför lättare att fixa än äkta flakighet, eftersom orsaken redan
är hittad.

Det tredje stora fyndet: **`nightly.yml` (den schemalagda nattkörningen på
`main`) har varit röd i minst 49 sammanhängande nätter** (2026-07-30 till
idag), med **21 öppna "Nattnätet rött"-ärenden i följd** och **noll
kommentarer** på något av dem. Ärenden stängs aldrig tyst per repots egen
regel — men de öppna 21 visar att regeln skyddar mot fel sak: den hindrar
tyst stängning, inte tyst *ansamling*. Ett larm som är rött var natt i sju
veckor har upphört att vara ett larm.

## Vad jag läste först

Jag inventerade `docs/research/` och läste tre befintliga pass i sin
helhet innan jag sökte något nytt:

- **`task-79-flake-baslinje-2026-08-02.md`** (6 veckor gammal) — lokal
  baslinje för klass B-flakighet: 20 körningar, 0 fällningar för det
  namngivna målet, men 2 OVÄNTADE fällningar i just `hem.acceptance.test.ts`
  (rad 437 och 398 — 398 är SAMMA test som denna rapports huvudfynd, se
  § Fynd 2). CI-baslinjen där: 1 fällning på 65 observerade
  Acceptance-jobb (≈1,5 %).
- **`verify-ci-parity-regel-vantetid-2026-08-05.md`** (redan citerad i
  `CLAUDE.md`) — kostnads/nytta-mätningen bakom "kör inte
  `verify:ci-parity` rutinmässigt".
- **`backlog/tasks/task-74`** (Done, 2026-07-29) — den grundläggande
  mekanism-utredningen: klass B-flakighet är TRE separata mekanismer (kall
  route-chunk mot en 5 s-budget, en vakts två observatörer, samt en 30 s
  testbudget vid extrem maskinlast), ingen av dem "fokus-tester" som
  ursprungligen antaget. CI-observerad flaky-rat föll 6/14 → 1/14
  jobb efter fixen.

**Vad som var åldrat:** hela bilden ovan beskriver ett läge FÖRE
2026-09-06 (Dependabot-mönster) och framför allt före 2026-09-16 (klockbug-
tröskeln). Ingen av de befintliga researchfilerna nämner audit-ci-
blockaden eller klockbugghen — de är för nya. Jag byggde därför vidare med
färsk mätning för perioden 2026-09-06 → idag i stället för att upprepa
augusti-mätningen.

**Beslut jag läste men inte fann relevanta att ompröva:** inga ADR:er
förkastar något jag föreslår nedan. `ADR-107` (styrande enligt mitt
uppdrag) visade sig vid läsning gälla **Marcus utvecklingsmaskins
miljöreproducerbarhet** (Nix mot Brewfile) — INTE test-/CI-reproducerbarhet.
Det är en felaktig premiss i mitt uppdrag, registrerad som fynd, inte en
öppen fråga jag löser här (§ Motsägelser).

## Metod

Alla kommandon kördes 2026-09-17 mot `high-five-group/miranon-media-admin`
med `gh` (autentiserad som `marcus803`).

1. `gh run list --workflow ci.yml --limit 300 --json databaseId,event,conclusion,status,headBranch,headSha,createdAt,updatedAt,attempt,startedAt`
   — 300 körningar, 2026-09-06T09:33Z till 2026-09-17T09:51Z.
2. `gh api repos/high-five-group/miranon-media-admin/actions/runs/<id>/jobs`
   för 18 enskilda körningar (stickprov av röda/inställda), plus
   `gh run view <id> --log-failed` för 7 av dem för att läsa
   felmeddelandena i klartext.
3. `gh run list --workflow nightly.yml --limit 60` och samma för
   `post-merge.yml`.
4. `gh issue list --label ci-natt --state all --limit 60 --json …` och
   samma för `ci-post-merge` — 60 ärenden vardera, öppna/stängda,
   skapelse-/stängningstid.
5. `node scripts/ci-metrics.mjs --limit 100` — repots EGET, byggda mätverktyg
   för PR-ledtid, rödorsak per jobb och bevisad flakighet (se filhuvudet,
   `scripts/ci-metrics.mjs:1-27`). Kördes en gång, i förgrunden (bakgrundades
   först av harnesset vid 120 s-gränsen, hämtades sedan med en pollande
   `until`-loop i förgrunden — ingen väntan lämnades öppen mellan turer).
6. Källkodsläsning: `playwright.config.ts`, `tests/support/fixturvarld/hermetic.ts`,
   `tests/acceptance/hem.acceptance.test.ts`, `tests/acceptance/login.acceptance.test.ts`,
   `scripts/verify-ci-parity.mjs`, `.github/workflows/{ci,ci-suite,nightly}.yml`,
   `CONTRIBUTING.md` § Nattnätet.

Ingen `npm run check:docs` kördes (kontraktets förbud — andra agenter
skriver samtidigt). `npm run metrics:flake` kördes INTE av mig — en ny
lokal serie hade tagit 10+ minuter, druckit maskinresurser andra agenter i
denna flotta delar, och dubblerat data som redan finns (TASK-74/79). Det är
ett medvetet val, inte en glömska.

## Fynd

### 1. Hur ofta fallerar tester utan att produkten faktiskt är trasig?

**Huvudtal (verifierad, n=100, `npm run metrics:ci` 2026-09-17):**

```text
Röda runs: 15 av 100 slutförda (15 %)
  CI Passed or Skipped (aggregatorn, fäller alltid när nåt annat fäller): 15
  Audit dependencies (audit-ci): 13
  Acceptance (hermetisk) (2) — klockbugghen: 4
  Pure + Build: 2
  Acceptance (hermetisk) (1): 2
  Acceptance (hermetisk) (3): 1
  Acceptance — tvåsidigt bevis (självtest): 1
  Webblasarbeteende: 1
  Lint + TypeCheck: 1
Bevisat flakiga (rött → grönt på OMKÖRD IDENTISK kod): 0 av 100 (0,0 %)
```

(Summan av jobbraderna överstiger 15 eftersom en körning kan fälla flera
jobb samtidigt — jag verifierade det direkt: två av körningarna jag läste
loggen för fällde BÅDE `Audit dependencies` OCH klockbugghens Acceptance-
shard i samma körning.)

**Felmarginal, ärligt:** n=100 räcker för ett tvåsiffrigt procent-intervall
men inte för en exakt siffra. Ett 15/100-utfall har (Wilson-intervall,
95 %) ungefär **9–24 %** som rimligt spann för "andel röda körningar" i
allmänhet. Men den siffran döljer det viktigaste: **13 av de 15** (87 %,
osäkerheten här är LÄGRE eftersom jag läst källan för varje instans) beror
på EN enda, redan identifierad orsak (audit-ci), och **4 av 15** (27 %) på
en ANNAN enda redan identifierad orsak (klockbugghen). Det är alltså inte
"15 % slumpmässig otillförlitlighet" — det är två koncentrerade,
diagnostiserade fel som råkar drabba nästan allt just nu.

**Ett renare, mer talande tal, från min egen körnings-genomgång
(verifierad, `gh run list` + `gh api …/jobs`, 2026-09-06 → 2026-09-17):**

| Period | `pull_request`-körningar | Utfall |
|---|---|---|
| Före huvudgrenens frysning (till 2026-09-08) | 146 | 129 gröna · 15 avbrutna (se nedan) · 2 äkta fel i diffen |
| Efter frysningen (2026-09-09 → idag) | 14 | **14 av 14 röda**, samtliga av de två systematiska orsakerna ovan |

De **15 "avbrutna" (cancelled)** i den första raden är INTE testfel —
jag verifierade tre av dem mot jobbnivå (`gh run view … --json jobs`):
samtliga är körningar som en NY push till samma gren avbröt i förtid
(GitHub Actions "concurrency"-mekaniken — en ny körning ersätter en
pågående på samma gren). De utvärderade aldrig något och ska inte räknas
som ett testfel, ett produktionsfel eller flakighet — de är brus från att
någon pushade igen innan förra körningen hann klart. Detta är en EGEN
kategori som inte fanns bland uppdragets föreslagna klasser (a–f) — jag
lägger den till som **(g) överflödig, aldrig utvärderad** i stället för
att tvinga in den i en av de andra.

**Klassificering av ett stickprov på 31 röda/avbrutna körningar**
(kontraktets krav om minst 30, uppfyllt exakt):

| Klass | n | Andel | Exempel, källbelagt |
|---|---|---|---|
| (g) överflödig, aldrig utvärderad (superseded av ny push) | 15 | 48 % | `34032469599` m.fl. — jobbnivå bekräftar: allt grönt utom det avbrutna jobbet |
| Genuint utanför diffen — audit-ci (verkligt beroende-sårbarhetsfynd) | 10 | 32 % | `35207417255` m.fl. — loggen citerar `GHSA-7w5x-hrqm-74c2` |
| (f) tids-/datumberoende — klockbugghen | 3 | 10 % | `35202824444`, `35205123500`, `35205187710` — `hem.acceptance.test.ts:281` |
| (a) äkta fel i diffen | 2 | 6 % | `34247598715` (layout-regression, "ikonen får inte växa raden") · en Dependabot-PR med trasig `Lint+TypeCheck`+`Pure+Build` |
| oklassad — självtestets egen bokföring divergerade | 1 | 3 % | `34043212879`, "❌ BEVISET HÅLLER INTE — 2 avvikelser" (självtestets jämförelse mot kända, redan dokumenterade defekter — inte en ny produktbugg, men inte heller en ren infrastruktur- eller klockorsak) |

**Ingen instans i mitt stickprov landar i klass (b) klassisk flakighet, (c)
runner/nätverksinfrastruktur eller (d) extern tjänst (Airtable/Supabase).**
Det är ett äkta nollresultat, inte frånvaro av sökning — men n=31 över 11
dagar är för litet för att svara "de klasserna finns inte", bara "jag såg
dem inte i detta fönster". TASK-386 (2026-09-04, utanför mitt
sampling-fönster men i samma repo) visar att klass (c) FINNS: `npm ci` tog
4 minuter mot normalt ~1 minut och fällde `lint`/`docs`-jobben fyra gånger
på ett enda dygn på ren npm-registry-latens — löst genom att höja
tidsgränser och lägga omförsök. Det är alltså inte att klass (c) aldrig
händer, bara att den inte var aktiv i mitt fönster.

### 2. Vilka tester är mest flakiga?

Två helt olika svar, beroende på om frågan gäller **nu** eller
**historiskt**:

**Just nu (2026-09-17) är ingenting flakigt i traditionell mening** —
det som är trasigt är trasigt DETERMINISTISKT (se § 1 och § 3). Det
mest anmärkningsvärda enskilda testet är
`tests/acceptance/hem.acceptance.test.ts:274`
("refetchInterval (60s) triggar polling-refetch — falsk klocka"): det har
gått från "flakigt vid extrem maskinlast" (augusti) till "alltid rött vid
en viss verklig kalenderdag" (september) — SAMMA test, TVÅ olika,
tidsseparerade felformer.

**Historiskt (TASK-74, 2026-07-29, verifierad genom läsning av det stängda
kortet), tre mekanismer i minst 9 tester:**

| Test | Mekanism | Fällt hur ofta (mätt) |
|---|---|---|
| `person-detail.acceptance.test.ts:140` | B1 — kall route-chunk mot en 5 s-budget för FÖRSTA assertion i en fil | 1 av 5 körningar i mättnads-serien |
| `mer-maillogg.acceptance.test.ts:77` | B1, samma mekanism | 1/10 baslinjekörningar |
| `mer-segment-send.acceptance.test.ts:113` | B1 | 1/10 |
| `event-ny-anmalan.acceptance.test.ts:734` | B2 — hermetik-vaktens två observatörer läser vid olika tidpunkter | 2/10 |
| `anmalan-detalj` (axe), `events-list-kalender` (×2) | B3 — 30 s-testbudget vid extrem last (loadavg 125) | endast vid konstruerad extremlast, ej observerat i normalläge |
| `hem.acceptance.test.ts:1097` ("identitetsbeviset") | Fjärde, ej löst form — byte-identisk skärmdumpsjämförelse | 1 av 65 observerade CI-jobb (TASK-79) |
| `hem.acceptance.test.ts:398`/`274` ("falsk klocka") | Femte form i augusti (evCalls-race), nu en sjätte, orelaterad form (klockdrift) | 1 av 3060 testresultat i augusti; deterministiskt sedan 2026-09-16 |

**Öppet, ej löst (verifierad via backlog, To Do-kort):**
`TASK-418` — `tests/e2e/betalningar-inkorg-markera-lage.staging.test.ts`
§ "navigation UTANFÖR betalningsfamiljen rensar" fäller 2 av 7 i
hel-filskörning men 4/4 grönt isolerat — ordningsberoende (delat
tillstånd mellan tester i samma fil), mätt 2026-09-06, ännu oåtgärdat.
Detta är den enda posten i mitt underlag som är **äkta, klassisk
flakighet** (samma kod, växlande utfall) och som fortfarande är öppen.

**Ett oväntat sidofynd:** `page.clock.install()` UTAN tidsargument (roten
till dagens klockbugg) förekommer på ytterligare två ställen —
`tests/e2e/persist-cache.staging.test.ts:547` och
`tests/e2e/bekraftelsesteget-promoverings-grind.staging.test.ts:412`
(verifierad, `grep`). Båda är staging-E2E-tester som inte körs på PR-ytan
(kräver hemligheter, se § 6) och därför inte ännu observerats brista i mitt
CI-urval — men mekanismen som fällde `hem.acceptance.test.ts:274` finns
alltså på minst två fler ställen och är, om orsaken inte åtgärdas
generellt, en tickande klocka (bokstavligen) mot nästa trösklar.

### 3. Görs automatiska omkörningar, och döljer de i så fall instabilitet?

**Ja, omkörningar görs — 2 st i CI, 0 lokalt** (verifierad,
`playwright.config.ts:240`: `retries: process.env.CI ? 2 : 0`).

**Historiken här är ovanligt ärlig och värd att lyfta fram som gott
exempel.** Kommentaren vid samma rad (240) redovisar att skälet som en
gång motiverade omkörningarna VAR FALSIFIERAT av egen mätning: ursprungs-
motiveringen ("absorbera infrastruktur-brus utan att maskera äkta fel")
visade sig felaktig — TASK-74 bevisade att omkörningarna **maskerade ett
äkta race-villkor i testkoden** (14 av 22 observerade CI-jobb rapporterade
"flaky" internt utan att jobbet blev rött). Beslutet blev ändå att BEHÅLLA
omkörningarna, men som ett **medvetet, kostnadskänt val**, av två skäl:

1. En egenbyggd reporter (`tests/support/fixturvarld/overskuggnings-rapport.ts`)
   skriver en explicit rad ("N flaky") i varje körnings logg — instabilitet
   döljs alltså INTE helt, den blir en textrad i loggen i stället för en
   siffra i GitHub UI:t.
2. Lokalt är omkörningar avstängda helt (`0`) — en utvecklare som kör
   testerna på sin egen maskin ser en flake DIREKT, ograverat.

**Men "syns i loggen" är inte samma sak som "syns automatiskt".** Ingen
mekanism jag hittade läser "N flaky"-raden och larmar eller sammanställer
den över tid av sig själv i det dagliga CI-flödet — TASK-79/TASK-74:s
mätningar av just den siffran gjordes för hand, genom att grepa igenom
sparade loggar. `scripts/ci-metrics.mjs` mäter en ANNAN, striktare
definition av flakighet (rött → grönt vid omkörning av HELA körningen på
identisk kod) och läser inte Playwrights interna per-test-omkörningar alls
— de två måtten svarar på olika frågor och ingen av dem täcker den andra.
**Osäker:** om "N flaky"-raden aggregeras NÅGONSTANS (t.ex. i
`docs/reference/review-instrumentering.jsonl` eller motsvarande) hittade
jag inget belägg för det i den tid jag hade; jag utesluter det inte.

**I dagens data maskerade omkörningarna ingenting**, av ett tydligt skäl:
klockbugghen är deterministisk. Loggen för `35205123500` visar explicit
`test-failed-1.png`, `-retry1/test-failed-1.png`, `-retry2/test-failed-1.png`
— alla tre försök (originalet plus båda omkörningarna) föll med EXAKT
samma fel. En omkörning kan bara dölja instabilitet när felet i sig är
instabilt; ett deterministiskt fel överlever omkörningen synligt, precis
som här.

### 4. Är felmeddelandena tillräckligt tydliga för att snabbt hitta orsaken?

Jag läste fem verkliga röda körningars loggar i sin helhet (kontraktets
krav). Bedömning per fall, senaste 30 raderna av `gh run view --log-failed`:

| Körning | Orsak | Framgick av sista ~30 raderna? |
|---|---|---|
| `35207417255` (audit-ci) | Beroende-sårbarhet | **Ja, exemplariskt.** Loggen citerar advisory-URL:erna OCH en handskriven rad: *"audit-ci: sårbarhetsmarkören 'Failed security audit due to' står i försök 1:s utdata — audit-ci rapporterade en TRÄFF, inte ett nätverksfel."* Ingen arkeologi krävdes. |
| `35202824444` (klockbugghen) | `OmockadRequestError` | **Delvis.** Testnamn, felklass och exakt kodrad (`hermetik-vakt.ts:113`) syns direkt. Men VARFÖR anropet var omockat (klockdriften) krävde källkodsläsning i tre filer — loggen säger "ett anrop kom igenom som inte skulle", inte "din klocka har hoppat ur synk med ett tidsbaserat kvitto". |
| `34247598715` (layout-regression) | Assertion-fel | **Ja.** "ikonen får inte växa raden — höjdlåset är 124 px" är ett handskrivet, meningsfullt felmeddelande skrivet av utvecklaren som skrev testet — inte Playwrights generiska text. |
| `34043212879` (självtestets bokföring) | Bokföringsavvikelse | **Nej, kräver arkeologi.** "❌ BEVISET HÅLLER INTE — 2 avvikelser" pekar ut VILKA två test-rader som avvek, men att förstå VARFÖR (statusen `expected` mot förväntat `unexpected` på en redan dokumenterad känd defekt) kräver att man känner till hela självtestets syfte i förväg. |
| `33851503642` (TASK-386, npm-latens) | Timeout | **Nej vid första anblick, ja efter en blick till.** Loggen visar bara "The operation was canceled" — ingen förklaring. Men den FÖREGÅENDE raden ("npm ci … added 643 packages in 4m") avslöjar orsaken för den som vet att jämföra mot normal körtid (~1 min). |

**Slutsats:** när ett fel är **avsiktligt konstruerat för att vara
läsbart** (audit-ci:s handskrivna disambiguerings-rad, testens egna
handskrivna assertion-meddelanden) är kvaliteten mycket god — ovanligt god,
jämfört med standard-Playwright-utskrifter. När felet uppstår i
**infrastrukturens gränssnitt mot verkligheten** (en klocka som glider,
npm som är långsamt) krävs källkodsläsning eller domänkunskap för att gå
från symptom till orsak. Det är inte en brist i "hur tydligt loggen
skrivs" utan i att den typen av fel per definition kräver att man känner
till en osynlig premiss (frusen tid, normal npm-latens) för att inse att
den brutits.

### 5. Sparas screenshots, loggar, traces och testresultat?

**Ja, och regeln är noggrant genomtänkt** (verifierad,
`.github/workflows/ci-suite.yml`, fem separata `upload-artifact`-steg):

| Jobb | Vad laddas upp | När | Sparas hur länge |
|---|---|---|---|
| Acceptance (varje shard) | `test-results/` (skärmdumpar, videor, traces) + `playwright-report/` | endast vid `failure()` eller `cancelled()` | 7 dagar |
| Acceptance-självtest | samma | samma villkor | 7 dagar |
| Webblasarbeteende | samma | samma villkor | 7 dagar |
| Staging (E2E) | samma, plus lösenord rensade ur `error-context.md` FÖRE uppladdning | samma villkor | 7 dagar |
| Städmanifest för kastbara staging-poster | en JSONL-fil med vilka testposter som skapades | **alltid** (`if: always()`), oavsett grönt/rött | 1 dag |

**Playwright-projektnivå** (`playwright.config.ts:544-552`, det normala
läget): `trace: 'on-first-retry'` (spelbar tidslinje sparas bara om testet
föll och körs igen), `screenshot: 'only-on-failure'`, `video:
'retain-on-failure'`. Under **självtestet** stängs alla tre AV
(`trace/screenshot/video: 'off'`, rad 669-671) — ett medvetet val eftersom
självtestet FÖRVÄNTAS fälla nästan alla sina tester, och att spela in video
för varenda en hade varit ren egenlast utan diagnostiskt värde (samma
slutsats som TASK-74:s sidofynd C: videoinspelning kostar ~3 kärnor CPU för
artefakter som ändå kastas i det normala, gröna fallet).

**En historisk lucka, redan täppt (värd att nämna som exempel på att
systemet lär av sina egna hål):** kommentarerna vid varje
`upload-artifact`-steg citerar `TASK-237` — en tidigare version av flera av
dessa steg saknade `cancelled()` i sitt `if`-villkor, vilket betydde att en
TAKFÄLLNING (jobbets `timeout-minutes` slår till) lämnade **noll**
artefakter alls. Fixat i minst tre jobb (Acceptance, Webblasarbeteende,
Staging).

### 6. Går det att köra exakt samma test lokalt?

**Delvis, och gränsen är tydligt dragen och dokumenterad — men
`ADR-107` (som mitt uppdrag pekade ut som styrande) är FEL ADR för denna
fråga** (se § Motsägelser). Den faktiska mekanismen är
`scripts/verify-ci-parity.mjs` (`npm run verify:ci-parity`):

| Vad | Reproducerbart lokalt? | Källa |
|---|---|---|
| `lint`, `docs`, `changed`-jobbens steg | **Ja** — skriptet läser `ci.yml`s YAML och kör stegens `run:`-block VERBATIM | `verify-ci-parity.mjs` §HÄRLETT |
| `test-fast`, `acceptance`, `webblasarbeteende` (ci-suite.yml) | **Ja** — samma härledning, de tre jobb som faktiskt instansieras på PR-ytan | samma |
| `purge`, `a11y`, `test-staging` (Staging E2E, A11y) | **Nej, per design** — kräver `STAGING_AIRTABLE_TOKEN`/`TEST_SUPABASE_*`-hemligheter som inte finns lokalt, och instansieras aldrig på PR-ytan (`run_staging`/`run_a11y` är villkorslöst `false` från `ci.yml`) | samma, § SUITE-YTAN |
| Visuella baslinjer (skärmdumps-jämförelse) | **Nej för Linux-bruset** — noise floor är mätt på macOS (darwin); Linux-bruset i CI:s runner är explicit OMÄTT tills en framtida grind (`T87`) aktiveras | `playwright.config.ts:260-261` |
| `nightly-audit` (moderate-tröskeln), `Kontraktsvakt` | **Nej** — existerar bara i `nightly.yml`, ingen motsvarighet i `ci-suite.yml` som `verify-ci-parity` härleder ur | `CONTRIBUTING.md` § Nattnätet, `nightly.yml:64-90` |

Skriptets eget säkerhetsnät (§ PARITETSGRIND i filhuvudet) fäller
FAIL-CLOSED om `ci.yml`/`ci-suite.yml` får ett nytt jobb policyn inte
känner till — så gränsen ovan är inte en ögonblicksbild som kan glida
tyst, den är mekaniskt vaktad.

### 7. Hur lång tid tar det normalt från rött test till förstådd felorsak?

Detta är den svåraste frågan att svara ärligt på, för det finns **två helt
olika siffror**, och den ena är vilseledande.

**Den naiva siffran (tid till STÄNGT GitHub-ärende):**

| Kanal | n (stängda) | Median | p90 |
|---|---|---|---|
| `ci-natt` (nightly rött) | 39 | 16,6 h | 169,3 h (≈7 dygn) |
| `ci-post-merge` (post-merge rött) | 60 | 44,4 h | 257,3 h (≈10,7 dygn) |

**Vad detta mått INTE fångar, verifierat konkret:** jag öppnade
kommentarerna på flera av de nyligen stängda `ci-post-merge`-ärendena. Ett
exempel (`#2447`, skapat 2026-09-07T16:17Z, stängt 2026-09-17T09:03Z —
**alltså 233 timmar, nästan 10 dygn, i den råa statistiken**): den enda
kommentaren, skriven vid stängningen, lyder i sin helhet:

> "Rotorsak: sentinel-driften (L599, tredje instansen) — … Källa:
> `tasks/sessions/2026-09-06-session-123.md` Del 6 … Läkning: sentinel-
> fältet `Flagga` tömdes av S123-orkestreraren via Airtable-MCP under
> Resume 1. … **Besvarat av S125-orkestreraren 2026-09-17 i efterhand.**"

Ordet **"i efterhand"** är nyckeln: orsaken var förstådd och ÅTGÄRDAD
samma dag ärendet öppnades (2026-09-07, session 123) — men GitHub-ärendet
självt stod obesvarat och oskrivet på i tio dagar tills en SENARE session
gjorde en bokföringssvep och skrev in facit. Jag hittade EXAKT SAMMA
mönster i ytterligare 15 ärenden — en batch på 16 stycken, alla skapade
2026-09-06/07, alla stängda inom samma minut idag (09:02:58–09:03:52 UTC),
vilket exakt matchar uppdragets hypotes om "16 obesvarade
ci-post-merge-larm" (**verifierad**, räknat i data — se § Metod punkt 4).

**Slutsats: "tid till stängt ärende" är i det här repot inte samma mått
som "tid till förstådd orsak".** De två bokföringssystemen (GitHub-ärenden
kontra sessionsdokumentation/backlog-kort) är strukturellt frikopplade —
diagnosen görs snabbt i det ena, men bokförs i det andra med stor
fördröjning. Ett p90 på 257 timmar säger nästan ingenting om hur länge
NÅGON satt och inte förstod problemet; det säger hur länge en administrativ
sammanställning dröjde.

**Ett bättre, om än grövre, mått: tid mellan att ett problem UPPSTÅR och
att en ÅTGÄRD landar.** För klass A-flakigheten (TASK-64→TASK-74, juli
2026): samma dag (upptäckt och fixad inom en session, ≈ några timmar). För
`TASK-386` (npm-latens, 2026-09-04): samma dag, fyra iterativa förbättringar
inom ~1 timme totalt. **För dagens klockbugg och audit-ci-blockaden: ÄNNU
INTE åtgärdade** — de är nya fynd av just detta forskningspass, ej
tidigare bokförda i något kort jag hittade (§ Rekommendationer).

**Vad ingen av siffrorna fångar:** hur lång tid en MÄNNISKA (Marcus)
faktiskt lade på att förstå ett specifikt fel, till skillnad från en agent.
Det har jag inget sätt att mäta ur denna typ av källor.

### Fristående svar på "hur ofta orsakar testflödet falska stopp?" (för en oteknisk läsare)

Tänk dig en portvakt som kontrollerar allt som ska in i huset. Just nu
säger portvakten nej till nästan alla — men inte för att det som bärs in
faktiskt är farligt. Portvakten säger nej av två skäl som INTE har med det
som bärs in att göra:

1. Ett lås i väggen (en beroende-komponent appen är byggd med) har visat
   sig ha en känd svaghet, och portvakten är inställd på att stoppa ALLT
   tills låset bytts — oavsett vad personen bär.
2. Portvaktens egen klocka går fel på ett förutsägbart sätt sedan ett visst
   klockslag igår, och en av kontrollerna som bygger på "hur lång tid har
   gått" ger därför alltid fel svar just nu.

Båda felen är kända, förstådda och (i teorin) enkla att åtgärda — det är
inte "portvakten är opålitlig i allmänhet", det är "portvakten har exakt
två specifika saker att laga just nu, och tills dess säger den nej till
allt". Det är alltså **inte** samma sak som en portvakt som slumpmässigt
säger nej ibland av ingen anledning (det var vanligare i somras, är
ovanligt just nu) — och det är en viktig skillnad, för den första sortens
fel vet man exakt hur man löser, den andra sortens fel är mycket svårare
att jaga.

Det andra, allvarligare mönstret: en NATTLIG kontroll (som inte stoppar
någon utan bara skriver en lapp om något är fel) har skrivit en lapp
**varje natt i sju veckor** utan att någon svarat på lapparna. Det är inte
farligt i sig — inget stoppas — men en lapp som kommer varje dag och aldrig
läses är på väg att bli osynlig, precis den dag den faktiskt behövs.

## Motsägelser mellan styrande text och implementation

1. **Uppdragets pekare till `ADR-107` som styrande för
   reproducerbarhetsfrågan är fel.** `ADR-107` (`Accepted`, 2026-08-09)
   handlar uttömmande om Marcus utvecklingsmaskins verktygsmiljö (Nix mot
   ett versionsstyrt Brewfile-setup) — INTE om CI/test-reproducerbarhet.
   Den faktiska styrande texten för "kan jag köra samma sak lokalt" är
   `scripts/verify-ci-parity.mjs`s eget filhuvud plus
   `CLAUDE.md` § `verify:ci-parity`. Detta är en premiss i mitt uppdrag som
   inte höll vid prövning (ADR-086) — registrerat som fynd, inte som
   irritation.
2. **`CLAUDE.md` § Flakighet mäts med riggen** beskriver `metrics:flake`
   korrekt som verktyget för flakighets-mätning, men nämner INTE
   `scripts/ci-metrics.mjs` (`npm run metrics:ci`) alls trots att det är
   det verktyg som faktiskt levererade dagens mest användbara enskilda
   mätning (bevisad flakighet över en rullande produktionsfönster, snarare
   än en konstruerad lokal serie). De två verktygen mäter helt olika saker
   och kompletterar varandra — men `CLAUDE.md` nämner bara det ena. Inte en
   motsägelse i sak, men en täckningslucka värd att notera.

## Osäkerheter och vad jag inte kunde belägga

- **Om "N flaky"-loggraden (§ Fynd 3) aggregeras automatiskt någonstans**
  över tid: jag hittade ingen sådan mekanism, men uteslöt den inte
  uttömmande. Krävs: en riktad sökning i `scripts/` efter kod som parsar
  just den textsträngen, som jag inte hann göra fullständigt.
- **Om de återstående 5 oklassade jobben i mitt 15-körningars ci-metrics-
  fönster** (`Pure + Build` ×2, `Acceptance (1)` ×2, `Acceptance (3)` ×1)
  är ytterligare instanser av klockbugghen eller något annat: jag
  verifierade bara TVÅ av de fem individuellt (Dependabot-PR:n och
  task-309-48). Krävs: `gh run view --log-failed` på återstående tre
  run-ID:n, vilka jag inte identifierade exakt inom mitt tids-/API-budget.
- **Om "Bredare sårbarhetsgranskning" (nightly, moderate-tröskel) har
  fällt KONTINUERLIGT sedan en känd advisory dök upp, eller om olika
  advisories kommit och gått**: jag läste bara två körningars jobbnamn, inte
  loggens advisory-lista, för nightly. Ej verifierbart inom mitt
  tidsbudget utan ytterligare `gh run view --log-failed`-anrop.
- **Om `ci-natt`-ärendenas 39 STÄNGDA instansers median/p90 (16,6 h /
  169,3 h) lider av samma batch-stängnings-artefakt jag bevisade för
  `ci-post-merge`:** starkt indikerat (samma mönster av vitt spridda
  skapelsedatum och kluster av stängningstidsstämplar syntes vid en snabb
  blick på råtabellen) men jag öppnade inte kommentarerna på ett
  ci-natt-exempel för att bekräfta det explicit — jag prioriterade
  post-merge-exemplet eftersom uppdraget namngav just den siffran (16).
- **Marcus egen faktiska diagnostid** (till skillnad från agenters och
  GitHub-ärendens bokförda tider) är inte mätbar ur de källor jag hade
  tillgång till.

## Risker

- **Klockbugghen och audit-ci-blockaden samverkar just nu till att
  blockera VARJE landning** — huvudgrenen har inte rört sig sedan
  2026-09-08, delvis av detta skäl (bekräftat indirekt: 14 av 14 PR-
  körningar sedan dess är röda av just dessa orsaker). Om ingen agent i
  denna granskning äger att faktiskt fixa dem, kvarstår blockaden efter att
  rapporten är skriven.
- **Samma "parameterlös klocka"-bugg finns på minst två fler ställen**
  (§ Fynd 2) i tester som ännu inte körts sedan tröskeln passerades
  (de kör bara i staging-E2E, som kräver merge-kö-aktivitet för att
  triggas via `ci-suite.yml`). Nästa gång en PR faktiskt når kön riskerar
  ANNU FLER tester att falla på samma mekanism.
- **21 obesvarade nattliga larm i följd normaliserar rött.** Om/när ett
  GENUINT nytt produktionsfel dyker upp i nattkörningen är sannolikheten
  att någon läser just DEN lappen bland 21 identiska föregångare
  strukturellt lägre än om nätterna växlade grönt/rött.

## Rekommendationer

(Märkta som rekommendationer — inget beslut tas här.)

1. **Fixa `hem.acceptance.test.ts:281`** genom att byta
   `page.clock.install()` mot `page.clock.install({ time: FROZEN_NOW })`
   (eller motsvarande explicit tid) — samma mönster testfilen redan
   använder korrekt på andra ställen. Kontrollera samtidigt de två andra
   parameterlösa förekomsterna (`persist-cache.staging.test.ts:547`,
   `bekraftelsesteget-promoverings-grind.staging.test.ts:412`) innan de
   hinner brista på samma sätt. Detta är sannolikt ett par rader och löser
   4 av 15 (27 %) av dagens röda körningar.
2. **Lös eller allowlista de två audit-ci-advisorierna**
   (`GHSA-7w5x-hrqm-74c2`, `GHSA-rgj7-g3m4-5g8c`) — antingen genom
   uppgradering, eller genom ett medvetet, tidsbegränsat undantag i
   `audit-ci.jsonc` med skriven motivering, om uppgradering inte är
   möjlig just nu. Detta löser sannolikt merparten av resterande 13/15.
3. **Överväg om `Audit dependencies` bör blockera en REN
   dokumentationsändring.** Detta ligger närmare J8.5/J8.7:s domän
   (grindlogik, kostnad) men föddes ur detta fynd: en docs-only-PR
   (dagens `#2488`-relaterade körning) blockerades av samma
   beroende-sårbarhet som en kodändring hade blockerats av, trots att
   docs-ändringen inte rör beroendeträdet. Om detta är avsiktligt
   (säkerhetsfynd ska aldrig ignoreras oavsett diff) bör det sägas
   explicit någonstans en läsare hittar det.
4. **Skriv ett kort för "kyrkogårds-mönstret" i `ci-natt`/`ci-post-merge`:**
   överväg en mekanisk sammanfattning (t.ex. en veckovis, en rad per
   öppet ärende) i stället för att förlita sig på att någon läser 21
   separata identiska ärenden. Stängningsregeln ("aldrig tyst") är sund —
   den saknar bara ett komplement mot tyst ANSAMLING.
5. **Överväg att koppla GitHub-ärendets stängning till samma commit som
   faktiskt löser problemet**, i stället för en separat, senare
   bokföringssvep — detta hade gjort "tid till stängt ärende" till ett
   ärligt mått på "tid till förstådd/löst orsak" i stället för ett mått på
   administrativ eftersläpning.
6. **Nämn `scripts/ci-metrics.mjs` i `CLAUDE.md`** bredvid `metrics:flake`
   — de två verktygen svarar på olika frågor (bevisad flakighet över
   produktionsdata kontra konstruerad lokal mätserie) och båda hör hemma i
   samma uppslagsdel.

## Källor

- `gh run list --workflow ci.yml --limit 300 --json …` (2026-09-17,
  `high-five-group/miranon-media-admin`)
- `gh run list --workflow nightly.yml --limit 60`, samma för
  `post-merge.yml` (2026-09-17)
- `gh issue list --label ci-natt --state all --limit 60 --json …`, samma
  för `ci-post-merge` (2026-09-17)
- `gh api repos/high-five-group/miranon-media-admin/actions/runs/<id>/jobs`
  för run-ID: `35201821158`, `35202459345`, `35202824444`, `35203759802`,
  `35203773284`, `35204915551`, `35205123500`, `35205187710`,
  `35207417255`, `34043212879`, `34247598715`, `34032469599`,
  `34143820839`, `30513174298`, `31858717699`, `35061163532`,
  `35187813487`, `34805494826`, `34805544672`
- `gh run view <id> --log-failed` för `35207417255`, `35205123500`,
  `35202824444`, `34247598715`, `34043212879`
- `gh issue view 2447 --json body,comments`, `gh issue view 2488 --json body`
- `node scripts/ci-metrics.mjs --limit 100` (2026-09-17)
- `kod`: `playwright.config.ts:240` (retries), `:544-552` (trace/screenshot/video),
  `:669-671` (självtest-undantag)
- `kod`: `tests/support/fixturvarld/hermetic.ts:428` (`page.clock.setFixedTime(FROZEN_NOW)`)
- `kod`: `tests/acceptance/hem.acceptance.test.ts:274-301` (den brustna testen),
  `:281` (den parameterlösa `page.clock.install()`)
- `kod`: `tests/acceptance/login.acceptance.test.ts:32,39` (`FROZEN_NOW`+24h-mönstret)
- `kod`: `.github/workflows/ci-suite.yml:440-460, 575-592, 670-687, 865-903`
  (`upload-artifact`-stegen)
- `kod`: `.github/workflows/nightly.yml:53-90` (`nightly-audit`, den
  bredare moderate-tröskeln)
- `kod`: `scripts/verify-ci-parity.mjs:1-90` (filhuvudet, härlednings- och
  paritetsgrindslogiken)
- `kod`: `scripts/ci-metrics.mjs:1-27` (filhuvudet, vad verktyget mäter)
- `CONTRIBUTING.md` § Nattnätet (rad 948–1032)
- `docs/decisions/ADR-107-reproducerbarhets-malet-lattviktsvagen-fore-nix.md`
  (läst i sin helhet — gäller INTE denna fråga, se § Motsägelser)
- `backlog/tasks/task-74 - …md` (Done, läst i sin helhet)
- `backlog/tasks/task-79 - …md`, `backlog/tasks/task-386 - …md`,
  `backlog/tasks/task-366 - …md`, `backlog/tasks/task-418 - …md`,
  `backlog/tasks/task-128 - …md` (läst i sin helhet eller relevanta delar)
- `tasks/lessons.d/acceptance-timeout-under-ko-last-konsumerar-armeringen.md`,
  `dequeuepullrequest-konsumerar-armeringen.md`,
  `fordrojd-enkoning-efter-gron-check-ar-transient-inte-konsumerad-armering.md`,
  `konfliktad-pr-konsumerar-armeringen-armera-om-efter-losning.md`
- `docs/research/task-79-flake-baslinje-2026-08-02.md` (läst i sin helhet)
