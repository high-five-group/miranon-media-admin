---
owner: marcus803
updated: 2026-08-10
review_by: 2026-11-07
status: stable
lifecycle: closed
---

# T135 — Post-merge-körningen avbryts trots att filen säger att den aldrig gör det

> Tråd-kort (ADR-053), fött i S93 när ett försök att hämta färskt
> karantän-underlag för `main`-rödan avbröts mitt i staging-jobbet.
> Registrerad som **defer**: den blockerar inte pågående arbete — en omkörning
> är alltid möjlig — men påståendet i filen är falskt och bör inte stå kvar
> oemotsagt.

## Vad filen påstår

`.github/workflows/post-merge.yml`, verbatim ur dess `concurrency`-block:

> ```yaml
> # Per-SHA-grupp, cancel-in-progress OSATT: en post-merge-körning avbryts
> # ALDRIG. En serialiserande grupp (som nightly.yml:s `nightly`) vore FEL här —
> # GitHubs default-concurrency håller bara EN väntande körning, så en tredje
> # landning hade avbrutit den andras väntande körning och tyst tappat dess
> # täckning. Per-SHA ger en körning per landat träd, alltid.
> concurrency:
>   group: post-merge-${{ github.sha }}
>   cancel-in-progress: false
> ```

## Vad som mättes

Körning `31196593426` (2026-08-07, `workflow_dispatch` mot `--ref main`,
`sha=f0171117`) avbröts. Sju av åtta jobb blev `success`; endast
**`Verifierande svit på det mergade trädet / Staging (API + E2E)`** avbröts —
och inuti det steget:

| Steg | Utfall |
|---|---|
| `API tests (staging)` | `success` |
| `E2E tests (staging)` | **`cancelled`** |

Loggen, verbatim: `##[error]The operation was canceled.` vid
`2026-08-07T16:27:11Z`, följt av `Terminate orphan process` för
`npm run test:e2e:staging`. Alltså en EXTERN avbrytning, inte en timeout.

**Den uppenbara misstänkta är utesluten.** Push-körningen som startade 16:26
för `6756bb92` **skippade** hela sviten (docs-only-landning, `T134`) — den tog
därmed aldrig `staging-tests`-mutexen och kan inte ha trängt undan
dispatch-körningen. Orsaken är alltså **inte fastställd**.

Kandidater, ingen verifierad:

1. Den globala `concurrency: group: staging-tests` i `ci-suite.yml` (~rad 520),
   som är en global sträng oavsett anropare — någon annan workflow kan ha tagit
   den. `CI [main]` startade 16:26 och `CI [gh-readonly-queue/…pr-925…]` 16:27.
2. GitHubs enkelplats-kö för väntande körningar — samma mekanism
   `post-merge.yml`:s egen kommentar beskriver, men applicerad på ett lager
   kommentaren inte täcker.
3. Något tredje.

**Samma mönster finns på flera landningar samma dygn:** post-merge-körningarna
för `0682a5b0` (`TASK-145.2`), `1af3299d` (`TASK-145.4`) och `57f8d143` står
alla `cancelled`.

### REPRODUCERAD — två av två dispatch-försök, inte ett engångsfall

Kortet ovan skrevs efter EN mätning. En omkörning gjordes direkt efteråt, med
avsikten att få det underlag den första inte hann ge. **Den avbröts också.**

| Försök | Körning | `main` vid start | Utfall |
|---|---|---|---|
| 1 | `31196593426` | `f0171117` | staging-jobbet `cancelled` |
| 2 | `31197915169` | `6756bb92` | staging-jobbet `cancelled` |

Därtill en tredje instans utan dispatch: `31198327068` (`d25bd4d9`),
`cancelled` på samma vis.

**Vad omkörningen tillförde utöver reproduktionen:** körningslistan för
16:30–16:44 visar att flera post-merge-körningar mot `main` överlappar i tiden
— `16:30-16:43`, `16:35-16:43` och `16:38-16:39`. Med parallella sessioner som
landar löpande är samtidiga post-merge-körningar alltså normaltillståndet, inte
ett kantfall. Det stärker kandidat 1 och 2 utan att avgöra mellan dem.

**Operativ slutsats, dragen i stunden:** att jaga ett färskt staging-utfall via
upprepade dispatch-försök är inte en väg som går att lita på medan andra
sessioner landar. Den billiga vägen till samma svar är att låta nästa kod-PR
köra sviten på sin egen gren — vilket är exakt vad `TASK-145.3` (`#929`) sedan
gjorde.

## Vad som INTE är fel — rättelse av en första hypotes

Den första hypotesen var att en avbruten körning tappar täckningen **tyst**.
**Det är falskt, och verifierat falskt.** Larmkedjan fyrar på `cancelled`
likaväl som på `failure`:

```yaml
if: ${{ always() && (contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled')) }}
```

med kommentaren *"Fyrar vid RÖTT (eller cancelled — utebliven dom är inte
grön…)"*. Mätt: ärende **`#926`** skapades `16:27` för `f0171117`, alltså för
just den avbrutna körningen. Mekanismen gör exakt vad den ska.

Luckan är därmed **prosan, inte skyddet**.

## Varför det spelar roll ändå

Sedan A7:5 (`TASK-70.3`) skickar `ci.yml` `run_staging: false` villkorslöst.
`post-merge.yml`:s egen header säger då att lagret *"gick från skyddsnät till
primär bärare av staging-kontrollen"*. När den bäraren avbryts landar ett
kod-träd på `main` utan fullständig staging-täckning — bokfört i ett larm, men
utan dom. Med parallella sessioner som landar löpande (S99, S100) är det inte
ett kantfall utan ett återkommande läge: **sex öppna post-merge-larm på ett
dygn**, varav flera `cancelled` snarare än genuint röda.

Operativ följd: den som behöver ett färskt staging-utfall mot `main` kan inte
räkna med att en dispatch går igenom orörd medan andra sessioner landar.

## Vad tråden ska avgöra

- **Fastställ orsaken** innan något ändras. Kandidat 1 (den globala
  `staging-tests`-gruppen) är billigast att pröva: korrelera tidsstämplarna för
  de fyra `cancelled`-körningarna mot vilka andra körningar som höll gruppen.
- **Rätta prosan oavsett utfall.** Raden *"en post-merge-körning avbryts
  ALDRIG"* är falsifierad. Antingen är den fel, eller så avser den bara sin
  egen concurrency-grupp och inte de grupper jobben ärver — i båda fallen ska
  texten säga vad som faktiskt gäller. Samma ADR-083-klass som `CLAUDE.md`
  § `verify:ci-parity` river i sin egen historik: prosa som lovar en täckning
  ingen mekanism håller.
- **Avgör om `cancelled` ska särskiljas från `failure` i larmtexten.** De
  behandlas idag lika (korrekt — utebliven dom är inte grön), men ett ärende
  som säger "rött" när jobbet i själva verket aldrig fick köra klart leder
  läsaren fel. Sex larm på ett dygn med blandade orsaker är svårare att triera
  än de behöver vara.

## ROTORSAK FASTSTÄLLD (TASK-178, 2026-08-10) — STÄNGD

**Varken kandidat 1 eller kandidat 2 (§ Vad tråden ska avgöra) var orsaken.**
Ingen av de misstänkta i den ursprungliga listan pekade rätt. Den faktiska
mekanismen är en TREDJE, mycket enklare källa som ingen av kandidaterna
övervägde: `test-staging`-jobbets EGET `timeout-minutes: 12`
(`.github/workflows/ci-suite.yml`, jobbet `test-staging`).

### Belägget

Alla tre "avbrutna" instanser i tabellen ovan mätte jobbets väggklocka
(`started_at` → `completed_at` via `gh api repos/.../actions/jobs/<id>`):

| Körning | Jobb-ID | `started_at` | `completed_at` | Elapsed |
|---|---|---|---|---|
| `31196593426` | `92926328777` | `16:14:58` | `16:27:14` | **12m16s** |
| `31197915169` | `92930743634` | `16:31:22` | `16:43:37` | **12m15s** |
| `31198327068` | `92932009374` | `16:43:45` | `16:56:00` | **12m15s** |

`timeout-minutes: 12` för `test-staging` (ci-suite.yml). Tre oberoende
instanser landar på 12m15–12m16s — en skillnad på EN sekund mellan de två
sista. Det är inte en mutex-krock; det är jobbet som slår i sitt eget tak,
om och om igen.

**Loggen bekräftar det.** Raw-loggen för job `92926328777`
(`gh api repos/.../actions/jobs/92926328777/logs`) visar: `API tests
(staging)` klar (194 passed, 1.4m), sedan `E2E tests (staging)` startar och
kör i **10m20s** innan `##[error]The operation was canceled.` — följt av
`Terminate orphan process`-rader. Jobbet hade alltså redan tagit
`staging-tests`-mutexen och passerat halva sviten när det dog; det stod
aldrig och väntade.

**Varför kandidat 1+2 (mutex-eviction) är UTESLUTNA, inte bara osannolika.**
`staging-tests`-gruppen (ci-suite.yml) kör `queue: max` —
verifierat mot [GitHubs officiella workflow-syntax-referens](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions):
*"To allow more than one
`queue: max`"*, och *"the combination of `queue: max` and
`cancel-in-progress: true` is not allowed"*. `queue: max` kan per
konstruktion bara evictera VÄNTANDE poster (upp till 100), aldrig en redan
PÅGÅENDE — och `cancel-in-progress` är dessutom OSATT (default `false`) på
just detta jobb. En redan startad, redan-halvvägs-igenom körning kan alltså
strukturellt inte cancellas av den här mutexen. Alla tre instanser hade
redan startat och passerat API-steget.

**Varför det såg ut som en extern cancellation.** GitHub tog bort den
specifika "exceeded the maximum execution time"-annoteringen från loggen i
en plattformsändring — kvar står bara det generiska "The operation was
canceled.", identiskt för BÅDA avbrottskällorna (grupp-eviction OCH eget
timeout). Källa: [GitHub community-diskussion #40582](https://github.com/orgs/community/discussions/40582)
("GitHub Actions stopped telling the reason for job cancellation on
timeout"). Det är därför den första hypotesen i den här tråden gick mot
concurrency-gruppen — loggen gav inget annat att gå på.

### Varför jobbet gick över taket — vad SOM UTLÖSTE overrunet, INTE fastställt

Normal väggklocka för `test-staging` ligger på ~6–7 min: `TASK-59.7` mätte
393 s (6,55 min) median 2026-07-28 (commit `29f1c5f1`), och tre färska gröna
körningar 2026-08-10 (`31364111832` 5m48s · `31363930819` 6m48s ·
`31363708107` 6m15s) ligger i samma härad. Taket på 12 min gav alltså
normalt ~1,8× marginal — exakt samma förhållande TASK-59.7 citerade som
"säkert" när acceptance-jobbets eget tak höjdes till samma 12 min.

Rå-loggens dot-notation för de tre avbrutna körningarna visar ett kluster av
`F`/`T`-markörer (fail/timeout) bland de 184 E2E-testen — inte det tysta
`·`-strömmet en normal grön körning visar. `playwright.config.ts` rad 231
sätter `retries: process.env.CI ? 2 : 0` — varje flakigt/timeoutande test i
CI körs alltså om till 3 gånger (1 försök + 2 omförsök) á upp till 60 s
(`timeout: 60_000`, rad 502). En BURST av samtidigt flakiga E2E-tester
räcker därmed för att äta hela 12-minutersbudgeten utan att en enda av dem
till slut räknas som en genuin, kvarstående testfailure — retries döljer
FLAKE-utfallet (känt, se `metrics:flake`-disciplinen) men förstorar samtidigt
JOBBETS VÄGGKLOCKA, en kostnad som inte tidigare var bokförd.

**Varför detta INTE är samma sak som "hög landnings-kadens = trigger":**
dagens (2026-08-10) burst om ~10 landningar 06:00–08:00 UTC — tätare än
2026-08-07-fönstret — reproducerade INGEN cancellation; de tre mätta
`test-staging`-körningarna i det fönstret låg alla inom normal budget
(5m48s–6m48s). Vad som specifikt orsakade flake-klustret 2026-08-07
16:14–16:56 UTC (degraderad staging-backend, en enskild trasig spec, eller
något tredje) är INTE fastställt av den här diagnosen — det kräver ett
dedikerat `npm run metrics:flake`-pass mot den specifika testpopulationen,
vilket ligger utanför TASK-178:s scope (diagnostisera AVBROTTS-mekanismen,
inte E2E-flakets grundorsak).

### Vad som levererades (TASK-178, trivialt + riskfritt)

1. **Prosan korrigerad.** `post-merge.yml`s concurrency-kommentar ("avbryts
   ALDRIG") kvalificerad: gruppen skyddar mot grupp-eviction, inte mot
   suite-jobbets eget timeout.
2. **Larmets Tolkningshjälp utökad.** Ny punkt i `larm`-jobbets
   ärende-mall: skiljer `Staging (API + E2E)` = `cancelled` (troligen
   timeout, kolla väggklockan, ~12 min = signatur) från `failure` (genuin
   regression). Föregående version behandlade båda lika och pekade mot
   revert.
3. **Cross-referens i ci-suite.yml.** Kommentar vid `test-staging`s
   `timeout-minutes: 12` som pekar hit, med en explicit varning: höj INTE
   taket reflexmässigt vid nästa cancellation — mekanismen är fastställd,
   flake-ORSAKEN är det inte.

Alla tre är kommentar-/prosa-ändringar (ingen logik, ingen trigger, inget
`uses:`-SHA rört) — `actionlint -ignore 'unexpected key "queue"...'` och
`yamllint .github/` gröna på båda filerna (TASK-178-körning, 2026-08-10).

### ESKALERAT TILL MARCUS — inte byggt

Två öppna frågor kräver ett policy-/prioriterings-beslut, inte en
mekanisk fix:

1. **Ska `timeout-minutes: 12` höjas för `test-staging`?** Nuvarande
   marginal (~1,8×) MATCHAR redan TASK-59.7:s egen "säker marginal"-
   presedens — att höja taket UTAN en förstådd orsak riskerar bara att
   dölja en genuin hängning längre (samma avvägning `test-staging`s eget
   tak alltid har burit, TASK-59.7). En höjning utan mätdata om VARFÖR
   klustret 2026-08-07 hände vore en gissning, inte en mätt fix.
2. **Ska E2E-flaket 2026-08-07 16:14–16:56 UTC utredas separat?** Kräver
   `npm run metrics:flake` riktat mot den specifika testpopulationen/
   tidsfönstret (eller en ny mätserie om historiska data inte räcker) för
   att avgöra om det var en isolerad staging-degradering eller en
   kvarstående testinstabilitet. Ett nytt tråd-/kort-beslut, inte del av
   denna diagnos.

## Ingång

- Körning `31196593426` (avbruten dispatch, jobb `92926328777`) ·
  `31197915169` (jobb `92930743634`) · `31198327068` (jobb `92932009374`) ·
  `31197538141` (den skippade push-körningen) · larm-ärende `#926`.
- `.github/workflows/post-merge.yml` § concurrency + § LARMKEDJAN
  (rättad TASK-178).
- `.github/workflows/ci-suite.yml` jobbet `test-staging` — `timeout-minutes:
  12` + `staging-tests`-gruppen (rättad/kommenterad TASK-178).
- `playwright.config.ts` rad 231 (`retries: process.env.CI ? 2 : 0`) + rad
  502 (`timeout: 60_000`).
- GitHub-dokumentation: workflow-syntax-referensen (`queue: max`-semantik) +
  community-diskussion `#40582` (borttagen timeout-annotering).
- Besläktad: `T134` (agent-apparatens genomloppstid) rör samma pass men en
  annan axel.
