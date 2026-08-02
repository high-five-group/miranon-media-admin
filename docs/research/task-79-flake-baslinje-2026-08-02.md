# TASK-79 — färsk lokal baslinje + CI-artefakt-svep 2026-08-02

**Uppdrag:** exekvera TASK-79:s AC 2-mätplan (skriven av diagnos-agenten
2026-08-01, se kortets Implementation Notes) på tyst maskin, natt-körning
2026-08-02. Detta dokument redovisar DATA + nämnare. Vägvalsbeslutet (a/b/c i
kortets "NÄSTA STEG, ORKESTRERAREN VÄLJER") tas INTE här — det är
Marcus/beslutsbordets punkt 2, och den här mätningen föregriper det inte.

## Premiss-pass (ADR-086) — utfört före mätningen

| Premiss i uppdraget | Prövad mot | Utfall |
|---|---|---|
| "Maskinen är din ensam — inga andra agenter kör" | `ps aux` genomsökt för `node`/`playwright`/`vite`/claude-agent-processer; `git worktree`-listan (4 worktrees, inga aktiva testprocesser i dem); CI-aktivitet (`gh run list`) | **BEKRÄFTAD** — inga konkurrerande test-/build-processer, och CI-loggen visade NOLL workflow-körningar efter 2026-08-01T23:32:02Z under hela mätfönstret |
| "Loadavg-krav: uptime under 2 (ensam maskin) före FÖRSTA körningen" | `uptime` upprepat 2026-08-02 01:28–01:35 | **DIVERGENS, dokumenterad nedan** — uppmätt 7,11 → stabiliserat kring 3,6–5,2, ALDRIG under 2 |
| Testet `hem.acceptance.test.ts` bär titeln "AC 1 — identitetsbeviset: FÖRE == UNDER == EFTER byte-identiska under bevisat aktiv omhämtning" | `grep -n "identitetsbeviset" tests/acceptance/hem.acceptance.test.ts` | **BEKRÄFTAD**, rad 1114 (kortets egen radnummer-drift-notering stämmer) |
| Riggen är `scripts/flake-matserie.mjs` / `npm run metrics:flake`, ingen egen variant tillåten | Läst filen i sin helhet före körning | Följt — körkommandot nedan är rigg-standard, ingen egen mätform |
| Repo-tillstånd vid start (branch, HEAD) | `git fetch` + `git log -1` + `git merge-base --is-ancestor origin/main HEAD` | Worktree var vid `origin/main` (55b8b07e + lokal pausnings-commit 1ade1eb), inga divergerande commits missade vid seriestart |

### Loadavg-divergensen — vad som gjordes åt den

Mätplanens exakta krav ("uptime under 2") uppfylldes INTE. Uppmätt sekvens
(2026-08-02, `uptime`, 1-min-medel): 01:28 7,11 → 01:29 5,50→4,76 (fallande,
20 s-intervall) → 01:32 3,63→3,81 → 01:33 3,81→4,01 → 01:35 4,00 (sista
mätning omedelbart före seriestart).

Rotorsaken identifierad, inte antagen: `ps aux` visade `bztransmit
-completesync` (Backblaze fullsynk) på 55–68 % CPU, plus normal
skrivbordslast (Chrome, VS Code, Claude Desktop, ChatGPT, Notion, Obsidian —
detta är Marcus arbetsdator, ingen dedikerad CI-runner). INGEN av dessa är en
konkurrerande testkörning eller agent-process.

**Beslut (punkt 6 i uppdraget: "välj det försiktiga alternativet och bokför
öppet, väck ingen"):** väntade ~7 minuter och såg lasten stabiliseras strax
under riggens EGNA `--load-gate` (5,5, default) men över mätplanens striktare
2,0. Att vänta ut ett `completesync`-jobb med okänd återstående längd (kan
vara timmar) hade riskerat att göra hela natt-fönstret verkningslöst. Serien
startades vid loadavg ≈ 4,0 — dokumenterad avvikelse, inte dold. Riggens egen
`vantaPaLast()` (gate 5,5, väntar upp till 180 s/körning, loggar
`loadVidStart`/`loadVidSlut` per körning) gav ändå samma skyddseffekt
mätplanen är ute efter, och rådatan bär last per körning för
efterhandsdeflatering. Detta är en RESIDUAL RISK för denna serie (inte "tyst
maskin" i mätplanens strikta mening) — vägs in i tolkningen nedan.

### En andra, oplanerad divergens: serien avbröts av harnesset vid 16/20

Den FÖRSTA invokeringen (`--varv 10`, 20 körningar planerade) kördes som en
bakgrunds-process. Loggen visar 16 fullbordade körningar (run 1–16,
01:37–02:35), sedan TYSTNAD — ingen `KLAR`-rad, ingen slutsummering. Processen
var bekräftat BORTA (`ps aux` — ingen `flake-matserie`/`playwright test`) utan
att maskinen sovit (`pmset -g log` — inga Sleep/Wake-händelser i fönstret;
`caffeinate -dimsu` aktiv hela tiden) och utan git-relaterat fel. Body för
avbrottet är INTE fastställd härifrån (troligen en tidsgräns på
bakgrunds-processer i agent-harnesset — körningen varade ~59 min från
auto-backgrounding till sista skrivning, vilket är misstänkt nära en
60-minuters-gräns, men detta är en HYPOTES, inte verifierad orsak).

**Åtgärd:** i stället för att acceptera n=8/arm (under mätplanens "MINST 10
per arm") kördes en andra, kortare invokering (`--varv 2`, 4 körningar) som
topp-upp till full 10 varv/20 körningar. Den kördes MOT EN KATALOG UTANFÖR
repot (för att inte trigga riggens eget clean-tree-abort mot den redan
skrivna, ännu ocommittade rådatan från första invokeringen) och fullbordade
alla 4 körningar med explicit `EXIT=0` innan den avslutades. Ingen tredje
körning behövdes.

**Konsekvens för dataseten:** två separata rigg-invokeringar, redovisade som
två kataloger (se nedan). Det kombinerade datasetet uppnår mätplanens "minst
10 varv" (20 körningar, 10 A + 10 B), men är INTE en enda sammanhängande
körsvit — cooldown/interfoliering är kontinuerlig INOM varje del, men det
finns ett glapp (körning 16 slutade 02:35, körning 17 startade 02:51) mellan
delarna. Detta påverkar inte tolkningen av fällningsraten (interfolieringens
syfte — att ge båda armarna samma chans att träffa en lasttopp — hölls inom
varje del), men redovisas här för fullständighet.

## Mätserie A — färsk lokal baslinje (rigg-standardform, två delar)

**Del 1** (`docs/research/task-79-flake-baslinje-2026-08-02-data/`):

```bash
node scripts/flake-matserie.mjs --varv 10 --utdir docs/research/task-79-flake-baslinje-2026-08-02-data
```

16 av 20 planerade körningar fullbordade innan harnesset avslutade processen
(se ovan). Plan `A,B,A,B,A,B,A,B,A,B,A,B,A,B,A,B` (8 varv fullbordade av 10
planerade).

**Del 2** (`docs/research/task-79-flake-baslinje-2026-08-02-data-del2/`,
topp-upp):

```text
node scripts/flake-matserie.mjs --varv 2 --utdir <extern katalog, flyttad till docs/research/ efteråt>
```

4 körningar, plan `A,B,A,B`, alla fullbordade, `EXIT=0`.

- Projekt: `acceptance` (default) · workers=8 (default) · `--retries=0` (kodat i riggen) — BÅDA delarna
- INGEN patch i någon del (armarna identiska; ren baslinje, ingen A/B-jämförelse — inget att jämföra mot finns)
- Maskin: MacBook Pro, Intel Core i9-9980HK, 16 kärnor, macOS 26.5.2, Node
  v24.13.1, Playwright 1.61.1 (kortets källa angav context7 v1.61.0 — patch-
  version skiljer, samma minor)

### SAMMANFATTNING — kombinerat dataset (20 körningar, riggens `--las` per del + manuell summering)

**Del 1 (`--las`, 16 körningar, 2448 testresultat):**

```text
arm A: 0 fällda av 1224 testresultat i 0 av 8 körningar · last vid slut medel 20.89 (16.83–24.3) · körtid medel 111 s
arm B: 2 fällda av 1224 testresultat i 2 av 8 körningar · last vid slut medel 17.66 (14.37–20.75) · körtid medel 112 s

FÄLLNINGAR:
körning  4 arm=B last(slut)=20.1  hem.acceptance.test.ts:437 [failed 20569ms] "AC 1 — dagar-kvar-pillen: tre exakta former, vit pill topp-höger"
  Error: expect(locator).toBeVisible() failed
  Locator: getByRole('region', { name: 'Nästa event' }).getByText('1 dag kvar', { exact: true })
körning  8 arm=B last(slut)=17.53 hem.acceptance.test.ts:398 [failed 19175ms] "refetchInterval (60s) triggar polling-refetch — falsk klocka"
  Error: expect(received).toBeGreaterThan(expected) — Expected: > 1, Received: 1
```

**Del 2 (`--las`, 4 körningar, 612 testresultat):**

```text
arm A: 0 fällda av 306 testresultat i 0 av 2 körningar · last vid slut medel 18.63 (17.99–19.28) · körtid medel 107 s
arm B: 0 fällda av 306 testresultat i 0 av 2 körningar · last vid slut medel 18.23 (17.9–18.55) · körtid medel 107 s
(inga fällningar)
```

**Kombinerat, alla 20 körningar, 3060 testresultat:** 2 fällda av 3060 (0,065 %) — BÅDA i del 1, arm B, BÅDA i `hem.acceptance.test.ts` men på ANDRA rader (437 och 398) än TASK-79:s mål (rad 1114). Loadavg vid mätningen: `loadVidStart` spann 3,12–5,50 (median ≈ 5,3), `loadVidSlut` spann 14,37–24,3 (körningen själv driver upp lasten kraftigt via Playwright-workers, väntat och konsistent med tidigare baslinjer).

### Denna specifika flake (`hem.acceptance.test.ts:1114`, "identitetsbeviset") — TASK-79:s mål

**20 av 20 observationer PASSED, 0 fällningar.** Varaktighet 1379–1592 ms
(del 1, n=16) och 1400–1471 ms (del 2, n=4) — stabilt, inga extremvärden,
ingen budget-marginal-krympning synlig ens vid `loadVidSlut` upp mot 24,3.

## Oväntat fynd — utanför TASK-79:s scope, registrerat men INTE diagnostiserat här

De två fällningarna i del 1 (`hem:437` "dagar-kvar-pillen" och `hem:398`
"refetchInterval … falsk klocka") är INTE TASK-79:s mål-test och delar inte
dess felsignatur (byte-identisk skärmdump). De är heller inte TASK-74:s B1
(ingen timeout-på-goto-signatur) eller B2/B3 (ingen video-/observer-relaterad
text i felmeddelandet). De är alltså sannolikt en FEMTE och SJÄTTE distinkt
flake-form i samma testfil, fångade av en ren tur i denna mätning (2 av 3060
testresultat, båda i arm B, ingen uppenbar last-korrelation — `loadVidSlut`
20,1 respektive 17,53, inom samma spann som många GRÖNA körningar).

Notervärt: `hem:437` handlar om en "dagar kvar"-pill (dagsgränsberoende UI)
och `hem:398` om `refetchInterval`-polling — båda vidrör exakt de mekanismer
TASK-79:s eget karaktäriserings-avsnitt (kortets punkt 5, `nuMs`-hypotesen
och dagsgräns-korsning) redan diskuterade och delvis falsifierade FÖR DEN
NORMALA körvägen. Om dessa två är samma familj som den `nuMs`-hypotesen är
INTE fastställt här — det vore precis den typen av ogrundad sammanslagning
kortet varnar mot (AC 3-disciplinen: bevisa gemensam orsak innan formerna
slås ihop). Registreras för triage (ADR-053), diagnostiseras INTE vidare i
detta uppdrag — det låg utanför TASK-79:s AC 2-mätplan, och att gå vidare på
egen hand hade varit ett scope-beslut som inte är mitt att ta.

## Mätserie B — kompletterande CI-artefakt-svep (upprepningsbar utan lokal last)

Mätplanens egen instruktion: komplettera den lokala serien med fortsatt
CI-artefakt-räkning (kortets steg 7-metod), eftersom TASK-74 redan visat att
klass B till övervägande del är lokal-osynlig och just detta test är
undantaget CI FAKTISKT ser. Kört PARALLELLT med serie A (ren `gh api`-läsning,
noll lokal CPU-last, ingen kontamination av serie A:s mätning).

**Metod (identisk med kortets tidigare steg 7):** `gh run list
--workflow=ci.yml` för körningar EFTER föregående sveps avstämningspunkt
(2026-08-01T22:08:00Z, kortets egen cutoff), jobb-status hämtad per körning
(`gh api .../actions/runs/<id>/jobs`), och loggarna för varje körning där
`Test suite / Acceptance (hermetisk)` faktiskt EXEKVERADE (inte skippades av
path-filtret) genomsökta för `identitetsbeviset` och för `flaky$` (i
sökmönstret föregånget av ett mellanslag så bara Playwrights egen
summeringsrad — "N flaky" — träffas, inte ordet "flaky" som substräng någon
annanstans i loggen).

**Fönster:** 2026-08-01T22:08:33Z – 2026-08-01T23:32:02Z (sista CI-körning
innan natt-tystnaden — bekräftar oberoende att ingen CI-aktivitet skett sedan
dess, konsistent med "orkestreraren pausad").

**Resultat:**

- 43 `ci.yml`-körningar i fönstret, varav **17 exekverade** Acceptance-jobbet
  (26 skippades av `Detect changed files`-porten — dok-/backlog-tunga commits,
  väntat mönster)
- Samtliga 17 loggar genomsökta: **NOLL** förekomster av "identitetsbeviset"
  eller av mönstret `flaky$` (mellanslag + "flaky" i radslutet) av något slag
- **Uppdaterat sammanlagt facit sedan klass A:s fix:** 1 fällning på
  (14 TASK-74-jobb + 34 tidigare svepta + 17 nya) = **65 observerade
  Acceptance-CI-jobb**, fortsatt NOLL ytterligare observationer efter den
  enda bekräftade fällningen 2026-07-28T21:29:05Z — nu **fyra+ dygn** utan ny
  observation (mot kortets "tre dygn" vid förra uppdateringen)

## Tolkning — DATA + nämnare, inget vägval

Läs alltid ut n innan ett noll-resultat tolkas (CLAUDE.md-disciplinen, samma
regel TASK-74 etablerade): **n=20** lokala körningar av den specifika
"identitetsbeviset"-testen (1 observation/körning), 0 fällningar. CI-basen är
nu n=65 jobb, 1 fällning, rate ≈ 1,5 %. Ingendera nämnare är stor nog att med
säkerhet skilja "flaken är borta" från "flaken lever kvar på sin ursprungliga,
mycket låga rat" — exakt den övertolkning kortet varnar för. Kortets egen
karaktärisering (Chromium-kompositor-nivå-nondeterminism, klass B till
övervägande del CI-synlig, INTE lokalt reproducerbar för DENNA specifika
test) förblir den bäst underbyggda förklaringen efter denna mätning — den
falsifieras inte av ett fortsatt 0-utfall, men bekräftas inte heller positivt
av det.

**Vad denna mätning TILLFÖR utöver kortets befintliga underlag:**

1. En färsk, oberoende lokal 0-observation för "identitetsbeviset" med mer än
   TRE gånger så många körningar (n=20) som föregående baslinje (n=6,
   TASK-81) — högre upplösning, samma slutsats (0 fällningar för just denna
   test).
2. Ett förlängt CI-observationsfönster (65 mot 48 jobb) utan ny fällning av
   denna specifika flake.
3. En explicit, mätt loadavg-baslinje för DENNA körning — mätplanens `<2`-krav
   uppfylldes inte, dokumenterat öppet.
4. Två NYA, oväntade fällningar i SAMMA testfil (annan rad, annan
   felsignatur) — inte TASK-79:s mål, men ett datapunkt-fynd registrerat för
   triage snarare än tyst bortkastat.
5. En harness-relaterad drift (första seriens process avbröts vid 16/20 utan
   synlig orsak) — dokumenterad öppet, åtgärdad med en topp-upp-körning,
   INTE tyst gömd bakom det kombinerade slutresultatet.

**Vad denna mätning INTE gör:** den avgör inte vägvalet (a)/(b)/(c) ur
kortets "NÄSTA STEG"-lista, och den diagnostiserar inte de två nya
fällningarna (§ Oväntat fynd). Båda är beslutsbordets/nästa uppdrags jobb.

## Källor

- `backlog/tasks/task-79 - ...md` — mätplanen, karaktäriseringen, tidigare
  bevisläge (läst i sin helhet 2026-08-02 före mätningen)
- `scripts/flake-matserie.mjs` — riggen, läst i sin helhet före körning
- `docs/research/task-79-flake-baslinje-2026-08-02-data/` — rådata del 1
  (`serie.jsonl` — en rad/körning, `resultat.jsonl` — en rad/testresultat,
  16 körningar)
- `docs/research/task-79-flake-baslinje-2026-08-02-data-del2/` — rådata del 2
  (samma format, 4 körningar)
- **Utelämnat, avsiktligt:** riggens råa `run-NN-X.json` (Playwrights orörda
  per-körning-rapport) och `.stderr.txt`-filerna. Kommandot `npx @biomejs/biome check .`
  (CI:s "Lint + Audit + TypeCheck"-jobb, körs ovillkorligt över hela repot)
  flaggade formateringsavvikelser i alla 20 `run-NN-X.json` — de är
  tredjepartsverktygets ORÖRDA output och ska inte omformateras av vår egen
  linter. Snarare än att antingen låta CI fälla eller tysta det med en
  undantagsregel i `biome.json` (en config-ändring utanför detta uppdrags
  scope) behölls bara `resultat.jsonl`/`serie.jsonl` — den flata,
  per-testresultat-rådata riggens egen AC 3-motivering pekar ut som den
  bärande artefakten. Ingen information om just denna mätning går förlorad:
  `resultat.jsonl` innehåller fil, rad, titel, status, varaktighet och
  felmeddelande per testresultat.
- `gh run list --workflow=ci.yml --limit 300` + `gh api
  repos/high-five-group/miranon-media-admin/actions/runs/<id>/jobs` +
  `gh run view --job=<id> --log` — CI-artefakt-svepet, körningar listade i
  detta dokuments Mätserie B
- `uptime`, `ps aux`, `pmset -g log`, `pmset -g assertions` —
  premiss-passets loadavg-, process- och sömn/vakenhets-verifiering,
  2026-08-02 01:28–02:49
