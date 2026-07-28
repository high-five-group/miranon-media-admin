---
owner: marcus803
updated: 2026-07-28
review_by: 2027-01-28
status: stable
---

# Är "interna länkar blockerande i PR, externa till en nattlig rapport" rätt form? (Code, 2026-07-28)

> **Proveniens:** avgränsat research-pass, S91 restlistan A4. Ingen kod, ingen
> config och ingen workflow rörd — enda leveransen är denna fil. Varje påstående
> om ett verktygs beteende bär antingen en käll-URL till primärkällan (projektets
> egen kod eller dokumentation) eller en mätning jag själv körde 2026-07-28 med
> repots faktiska lychee-binär. Där jag lutar mig på en delegerad hämtning som
> jag inte själv verifierat om står det utskrivet. Motsägelser mot repots egna
> anteckningar redovisas i klartext i stället för att jämnas ut.

## Kort svar

Formen är branschens mönster, och den är det med marginal: av nio projekt jag
själv öppnade kontrollerar **noll** externa länkar i en PR-blockerande grind.
Två saker i den föreslagna formuleringen håller dock inte. Påståendet att
*"17 av 19 undantag blir onödiga"* reproduceras inte mot filen — och de
undantag som försvinner ur PR-grinden försvinner inte ur repot, de flyttar.
Det finns dessutom ett verktygsfel i vår nuvarande grind som ingen av dagens
tre instanser krävde en uppdelning för att laga: `--accept-timeouts`.

## A · Lychees egna mekanismer, mot primärkällan

### A.0 Vilken version vi faktiskt kör

| Led | Värde | Verifiering |
|---|---|---|
| Vår pin i `ci.yml` och `nightly.yml` | `e7477775783ea5526144ba13e8db5eec57747ce8` | `.github/workflows/ci.yml` rad 508 |
| Den pinnen är taggen | **lychee-action v2.9.0** | `gh api repos/lycheeverse/lychee-action/git/ref/tags/v2.9.0` → samma SHA |
| v2.9.0 installerar | **lychee v0.24.2** (`lycheeVersion`-default) | [`action.yml` @ v2.9.0](https://github.com/lycheeverse/lychee-action/blob/v2.9.0/action.yml) |
| Lokal binär på maskinen | `lychee 0.24.2` | `/usr/local/bin/lychee --version` |
| Pinnen sattes | 2026-07-19, commit `a39a388` (Dependabot) | `git log -S` mot `ci.yml` |
| Föregående pin v2.8.0 installerade | lychee **v0.23.0** | `action.yml` @ `8646ba30…` |

Att den lokala binären är exakt CI:s version gör de mätningar jag redovisar
nedan giltiga som utsagor om CI. Kvarstående osäkerhet: min maskin är macOS/arm
och runnern x86-64/Linux, och nätvägen är en annan — flagg-semantiken är
densamma, nätutfallet är det inte.

### A.1 `--offline` och dess spegelbild

`--offline` beskrivs i hjälptexten som *"Only check local files and block
network requests"*. Implementationen är smalare och mer förutsägbar än
beskrivningen antyder — den byter ut schema-filtret:

```rust
// Offline mode overrides the scheme
let schemes = if cfg.offline() {
    vec!["file".to_string()]
} else {
    cfg.scheme.clone()
};
```

Källa: [`lychee-bin/src/client.rs`](https://github.com/lycheeverse/lychee/blob/lychee-v0.24.2/lychee-bin/src/client.rs). Följden är att varje
`http(s)`-adress klassas `Status::Excluded` — inte fel, inte timeout, inte
"okänd". Mätt 2026-07-28 på en fil med fyra länkar (en fungerande intern, en
trasig intern, en fungerande extern, en död extern):

| Läge | Utfall | Exit |
|---|---|---|
| Utan flaggor | 1 intern `[ERROR]` + 1 extern `[ERROR]` | 2 |
| `--offline` | 1 intern `[ERROR]`, båda externa `[EXCLUDED]` | 2 |
| `--scheme https --scheme http` | 1 extern `[ERROR]`, båda interna `[EXCLUDED]` | 2 |

Båda halvorna av en uppdelning finns alltså som en enda flagga var. Det är inte
en konstruktion vi behöver bygga.

Mätning mot vårt eget repo, med CI:s exakta scope-argument plus `--offline`:

```text
🔍 1944 Total (in 31ms) 🔗 946 Unique ✅ 1129 OK 🚫 0 Errors 👻 815 Excluded
```

Den interna grinden kostar **31 ms** och är grön idag. Med `--dump` mot samma
scope: 903 unika länkar, varav **467 externa fördelade på 125 skilda värdar**
och 436 interna. De 125 värdarna är grindens verkliga sprängradie — var och en
av dem kan ensam rödmåla en PR som inte rör dem.

### A.2 Exit-koderna, och varför `0 Errors, 1 Timeout` gav exit 2

READMEn är entydig ([`README.md` § Exit codes](https://github.com/lycheeverse/lychee/blob/lychee-v0.24.2/README.md)): `0` lyckat, `1`
oväntat fel eller konfigfel, `2` länkkontroll-fel, `3` konfigfil-fel. I koden är
det `LinkCheckFailure = 2`.

Det som fällde ADR-081:s PR är en finess i hur statistiken förs. Timeouts hamnar
i en **egen** karta, inte bland felen:

```rust
let status_map_entry = if status.is_timeout() {
    self.timeout_map.entry(source).or_default()
} else if status.is_error() {
    self.error_map.entry(source).or_default()
```

men lyckat-villkoret räknar båda:

```rust
pub(crate) fn is_success(&self) -> bool {
    self.error_map.is_empty() && self.timeout_map.is_empty()
}
```

Källa: [`lychee-bin/src/formatters/stats/response.rs`](https://github.com/lycheeverse/lychee/blob/lychee-v0.24.2/lychee-bin/src/formatters/stats/response.rs).
Summeringsraden visar därför `🚫 Errors 0` samtidigt som körningen faller.
Reproducerat 2026-07-28 mot en svartahåls-adress:

```text
⏳ Timeouts.........1
🚫 Errors...........0
EXIT=2
```

### A.3 `--accept-timeouts` — den riktade fixen för instans 3

Flaggan finns sedan [PR #2063](https://github.com/lycheeverse/lychee/pull/2063) (merged 2026-03-04) och kopplar om precis det
villkoret:

```rust
let is_success = if accept_timeouts {
    stats.is_success_ignoring_timeouts()   // error_map.is_empty()
} else {
    stats.is_success()                      // error_map + timeout_map tomma
};
```

Mätt 2026-07-28, samma svartahåls-adress:

| Innehåll | Flagga | Exit |
|---|---|---|
| Enbart timeout | ingen | **2** |
| Enbart timeout | `--accept-timeouts` | **0** |
| Timeout **plus** ett äkta trasigt filmål | `--accept-timeouts` | **2** |

Flaggan är alltså inte "stäng av grinden" — den degraderar timeout till rapport
och håller kvar allt annat. `cs.umd.edu`-instansen hade inte behövt en
uppdelning för att sluta fälla PR:er; den hade behövt en flagga vi inte kände
till. Det talar inte emot uppdelningen, men det gör den till ett val och inte en
nödvändighet för den instansen.

### A.4 Retry-semantiken — vad som återförsöks och vad som aldrig gör det

Default är `--max-retries 3` och `--retry-wait-time 1` (sekund), med
fördubbling per försök (`wait_time.saturating_mul(2)`). Vad som får ett omtag
avgörs av [`lychee-lib/src/retry.rs`](https://github.com/lycheeverse/lychee/blob/lychee-v0.24.2/lychee-lib/src/retry.rs):

| Utfall | Återförsöks | Konsekvens för oss |
|---|---|---|
| `Status::Timeout` | **Ja** | `cs.umd.edu` fick tre omtag och föll ändå — retries är uttömda, inte oprövade |
| HTTP 5xx, 408, 429 | Ja | Rate-limit läker ofta av sig självt |
| **HTTP 403** | **Nej** | Hela bot-block-klassen (Shopify, Splashthat, RingCentral, TicketTailor, Sched, ACM) får noll omtag |
| HTTP 406 | Nej | `uber.com`-posten |
| `reqwest::Error::is_connect()` | **Nej** (explicit `false`) | Anslutningsfel i connect-fasen |
| `ConnectionReset`/`Aborted`/`TimedOut` via hypers request-väg | Ja | `danger.systems` — vilken gren felet tar är overifierat för just den värden |

Det förklarar varför `.lycheeignore` ser ut som den gör: majoriteten av posterna
är 403/406, alltså precis den klass lychee per konstruktion aldrig försöker om.

### A.5 Cachen — vår egen anteckning är föråldrad

Tre poster i `.lycheeignore` vilar på påståendet att 403 cachas och att en
omkörning därför inte kan läka:

- css-tricks-posten (S83, 2026-07-24): *"OBS: 415 cachas (endast 429 exkluderas)
  så re-run läker inte."*
- sched.com-posten (S91, 2026-07-26): *"403 CACHAS av lychee … så en omkörning
  kan per konstruktion inte producera den andra instansen."*

Det stämde för lychee v0.23.0. Det stämmer **inte** för v0.24.2, som vi kört
sedan 2026-07-19. [PR #2105](https://github.com/lycheeverse/lychee/pull/2105) ("fix(cache): never cache errors on disk",
merged 2026-03-26, släppt i v0.24.0) tog bort felcachningen helt:

```rust
// Do not serialize errors to disk. We always want to recheck failing links.
if matches!(result.value().status, CacheStatus::Error(_)) {
    continue;
}
```

Och ett avvisat statusfel mappas till just den varianten:
`ErrorKind::RejectedStatusCode(code) => Self::Error(Some(*code))`
([`lychee-lib/src/types/cache.rs`](https://github.com/lycheeverse/lychee/blob/lychee-v0.24.2/lychee-lib/src/types/cache.rs)). PR:n stängde
[issue #2190](https://github.com/lycheeverse/lychee/issues/2190), som beskrev exakt vårt symptom: *"a transient
infrastructure blip in one run thus causes every subsequent run that uses the
cache to fail on a URL that is actually healthy."*

**Två följder.** Sched.com-postens motivering — att en andra instans inte kan
produceras — är ogiltig; en omkörning hade prövat värden på nytt. Och vår
`--cache-exclude-status '429'` är i praktiken en no-op i v0.24.2, eftersom en
429 blir `CacheStatus::Error` och därmed aldrig når disken. Flaggan skadar inte,
men den skyddar inte längre mot något.

### A.6 Övriga mekanismer som är relevanta för dagens tre fall

| Mekanism | Default | Vad den löser |
|---|---|---|
| `--max-concurrency` | 128 | Global parallellism |
| `--host-concurrency` | 10 | **Parallellism per värd** — martinfowler-fallet |
| `--host-request-interval` | 50 ms | Baslinje-fördröjning per värd, med adaptiv ökning vid rate-limit |
| `--timeout` | 20 s | `cs.umd.edu`-klassens PDF:er |
| `--accept` | `100..=103,200..=299` | Värdar som svarar 999 (LinkedIn) eller 204 |
| `--include-fragments` | **av** | Ankare i interna länkar kontrolleras inte alls idag |
| `--header` | — | Använder vi redan (browser-UA) |

Två av dessa är obesatta hos oss och direkt relevanta: `--host-concurrency` mot
strypande värdar, och `--include-fragments`, som en 31-millisekunders offline-grind
skulle ha råd att slå på.

## B · Branschpraxis — nio projekt jag själv öppnade

Jag redovisar två nivåer. **Nivå 1** är filer jag hämtade och läste själv idag.
**Nivå 2** är hämtat av delegerade agenter och inte omverifierat av mig; det
räknas inte in i domen.

### Nivå 1 — verifierade av mig

**1. `lycheeverse/lychee` — verktygets eget repo.** Deras enda länkkontroll är
[`.github/workflows/links.yml`](https://github.com/lycheeverse/lychee/blob/master/.github/workflows/links.yml):

```yaml
on:
  repository_dispatch:
  workflow_dispatch:
  schedule:
    - cron: "00 18 * * *"
```

Ingen `pull_request`-trigger. Utfallet blir ett ärende via
`peter-evans/create-issue-from-file`. Repot har **ingen `.lycheeignore` och
ingen `lychee.toml`** — kontrollerat i den utpackade v0.24.2-tarballen.

**2. `lycheeverse/lychee-action` — den kanoniska rekommendationen.** README:n
inleder sitt fullständiga exempel med: *"It will check all repository links once
per day and create an issue in case of errors."* Exemplet har `schedule`-trigger,
`fail: false` och issue-skapande. Verktygets författare rekommenderar alltså
själva den form A4 föreslår för den externa halvan.

**3. `nuxt/nuxt` — närmaste tänkbara precedent.** Samma verktyg som vi, samma
action, **samma pinnade SHA**. [`.github/workflows/docs-check-links.yml`](https://github.com/nuxt/nuxt/blob/main/.github/workflows/docs-check-links.yml):

```yaml
  schedule:
    # weekly full check of all links, including external ones
    - cron: '0 0 * * 1'
```

```yaml
      # on pull requests, only check internal docs links to avoid
      # failures caused by flaky external sites
      - name: Lychee link checker (internal links)
        if: github.event_name == 'pull_request'
        uses: lycheeverse/lychee-action@e7477775783ea5526144ba13e8db5eec57747ce8 # v2.9.0
        with:
          args: >-
            '-c=lychee.toml'
            --exclude '^https?://'
            --include 'https://nuxt\.com/docs'
```

Motiveringen står utskriven i filen. Två skillnader mot vårt förslag är värda
att notera: de använder `--exclude '^https?://'` i stället för `--offline` (för
att kunna släppa in sina egna publicerade adresser igen via `--include`), och
deras schemalagda körning har `fail: true` — den blir röd, den rapporterar inte.

**4. `github/docs` — samma uppdelning, i produktion, en nivå djupare.** Fyra
skilda workflows. [`link-check-on-pr.yml`](https://github.com/github/docs/blob/main/.github/workflows/link-check-on-pr.yml) har `pull_request`-trigger,
`FAIL_ON_FLAW: true` och filhuvudet *"Checks internal links in changed content
files"* — internt, och bara diffen. [`link-check-external.yml`](https://github.com/github/docs/blob/main/.github/workflows/link-check-external.yml) har
`cron: '20 16 * * 1'`, `timeout-minutes: 180` och skapar ett ärende
(`🌐 Broken External Links Report`) i ett annat repo. Ingen `pull_request`-trigger
alls.

**5. `rust-lang/rust` — externa länkar kastas i koden.**
[`src/tools/linkchecker/main.rs`](https://github.com/rust-lang/rust/blob/master/src/tools/linkchecker/main.rs):

```rust
// Ignore external URLs
if url.starts_with("http:")
    || url.starts_with("https:")
```

Grinden är blockerande via `x.py test` — men den rör aldrig nätet.

**6. `kubernetes/website` — externt avstängt i config.** [`.htmltest.yml`](https://github.com/kubernetes/website/blob/main/.htmltest.yml) är
15 rader, och rad 3 är `CheckExternal: false`. Make-målet heter
`container-internal-linkcheck`.

**7. `withastro/docs` — samma rad, annan syntax.**
[`scripts/lib/linkcheck/base/check.ts`](https://github.com/withastro/docs/blob/main/scripts/lib/linkcheck/base/check.ts):

```ts
// Ignore external links
if (!url.href.startsWith(context.baseUrl)) return;
```

**8. `vuejs/vitepress` — bär `vitejs/vite`:s dokumentation.**
[`src/node/markdown/plugins/link.ts`](https://github.com/vuejs/vitepress/blob/main/src/node/markdown/plugins/link.ts): en extern adress läggs till
död-länk-listan **endast** om den pekar på `//localhost:`. Bygget faller på
döda länkar, men bara interna.

**9. `facebook/docusaurus` — `onBrokenLinks` är internt-bara.**
[`isInternalUrl.ts`](https://github.com/facebook/docusaurus/blob/main/packages/docusaurus/src/client/exports/isInternalUrl.ts) returnerar `false` för allt med protokoll, och
länkinsamlingen sker bara för interna mål. Ingen HTTP-hämtning sker.

### Nivå 2 — delegerat, ej omverifierat av mig

`mdn/content` (eget Node-skript, blockerande, prövar borttagna slugs och
rubrik-fragment, ingen HTTP), `nodejs/node` (remark-regel som bara prövar
`file:`-protokollet), `supabase/supabase` (PR-grind diff-scopad,
full korpus nattligt med auto-fix-PR, ingen länk-liveness alls),
`TanStack/router` (`verify-links.ts` exkluderar `http(s)` och är dessutom inte
kopplad till något workflow), `denoland/deno` och
`home-assistant/home-assistant.io` (ingen länkkontroll funnen). Hämtningen av
`nodejs/remark-preset-lint-node` misslyckades när jag försökte omverifiera den
(404 på den path agenten uppgav) — posten står därför kvar på nivå 2.

### Räkningen

| Fråga | Utfall bland nivå-1-projekten |
|---|---:|
| Har någon form av länkkontroll | 9 av 9 |
| Har en PR-blockerande länkgrind | 6 av 9 |
| Låter **externa** länkar blockera en PR | **0 av 9** |
| Kontrollerar externa länkar överhuvudtaget | 3 av 9 (lychee själv, nuxt, `github/docs`) |
| — och gör det då schemalagt | 3 av 3 |

Mönstret är konvergent utan att projekten koordinerat: **intern länkintegritet är
en egenskap hos vår kod och därför grindbar; extern länkstatus är en egenskap hos
omvärlden och därför inte grindbar.**

### Vad extern kontroll kostar även när den görs rätt

De tre projekt som faktiskt kontrollerar externt underhåller alla en
undantagslista — trots att kontrollen redan är schemalagd och trots att den
aldrig blockerar en PR:

- **`github/docs`:** [`src/links/lib/excluded-links.yml`](https://github.com/github/docs/blob/main/src/links/lib/excluded-links.yml), **155 rader**, med
  orsaken utskriven per post: *"npmjs.com blocks automated link checkers with
  403"*, *"All `support.github.com` links are currently firewalled"*,
  *"HashiCorp rate-limits automated requests (429)"*.
- **nuxt/nuxt:** [`lychee.toml`](https://github.com/nuxt/nuxt/blob/main/lychee.toml), **31 exclude-poster**, plus
  `max_retries = 6`, `retry_wait_time = 2`, `host_concurrency = 5`,
  `host_request_interval = "50ms"`, egen user-agent och `accept`-lista med 999.
- **lycheeverse/lychee:** noll poster — men de kontrollerar bara sitt eget repo,
  vars externa länkyta är en bråkdel av vår.

Två av tre exkluderar **exakt samma värd som vi**:
`https://www.npmjs.com/package/(.*)` hos nuxt, `startsWith: https://www.npmjs.com`
hos `github/docs`. Vår npmjs-post är alltså inte en lokal egendomlighet — den är
branschstandard, och den skulle behövas även efter en uppdelning.

## C · Domen

### C.1 Är formen rätt?

**Ja — den är branschens mönster, och vi har redan halva infrastrukturen.**
`nightly.yml` kör redan länkkontroll utan cache, larmkedjan skapar redan ett
tilldelat ärende vid röd natt, och `nightly-links` står redan i larmets `needs`.
ADR-077 slog redan fast principen (*"snabbt före merge, uttömmande i
bakgrunden"*) och placerade redan länkkontrollen i natten. Den enda ändring som
saknas är att PR-halvan slutar hämta nätet.

Vi skulle dessutom landa **starkare än nuxt**, som är närmaste precedenten:
deras schemalagda körning blir bara röd, medan vår redan producerar ett
tilldelat ärende som per CONTRIBUTING § Nattnätet *"stängs aldrig tyst"*. Det är
lychee-projektets egen form, inte nuxts.

### C.2 Vad uppdelningen kostar

**Kostnad 1 — undantagen försvinner inte, de byter uppgift.** Detta är den
allvarligaste invändningen och den syns direkt i branschmaterialet: `github/docs`
underhåller 155 rader och nuxt 31 poster *för sina icke-blockerande
schemalagda körningar*. Skälet är att en nattlig kontroll som är röd varje natt
av tjugo kända bot-block är en signal ingen läser. Antingen underhålls listan —
och då är arbetet kvar, bara utan PR-blockeringen — eller så accepteras en
permanent röd natt, och då har vi bytt en högljudd grind mot en tyst.

**Kostnad 2 — extern länkröta upptäcks senare.** Fördröjningen är
inte "en natt". GitHubs schemaläggning är best-effort, och `nightly.yml`:s eget
filhuvud dokumenterar uppmätt eftersläp på ~3 h i just detta repo, plus att
köade jobb kan tappas helt. Realistisk detektionsfördröjning är ett dygn i
normalfallet och obestämd i värsta.

**Kostnad 3 — larmkedjans trovärdighet blandas.** Om `nightly-links` behåller
`fail: true` och står kvar i larmets `needs`, blir varje extern värdhicka ett
`ci-natt`-ärende av samma dignitet som en trasig testsvit. Klassen som idag
förstör en PR skulle då i stället förstöra nattnätets signalvärde. Det är en
konstruktionsdetalj som måste avgöras samtidigt med uppdelningen, inte efter.

**Kostnad 4 — vi tappar en verklig fångst.** Grinden har fångat äkta
extern-drift förut (`adobe/react-spectrum`-flytten). Den fångsten skulle flytta
till natten, inte försvinna — men den slutar hindra en PR från att landa med en
död referens i sig.

### C.3 Håller "17 av 19 undantag blir onödiga"?

**Nej. Varken täljaren eller nämnaren reproduceras.** Räkningen, mekaniskt mot
disk 2026-07-28:

```bash
grep -vE '^\s*#' .lycheeignore | grep -vE '^\s*$' | nl -ba
```

| Mått | Idag (`d18d5eb`) | Vid mätningstillfället (`19cf3f4`, 2026-07-27) |
|---|---:|---:|
| Mönster totalt | **22** | 21 |
| Varav externa (`http(s)`) | **21** | 20 |
| Varav interna (`file://`) | **1** | 1 |

Sessionsdok S91 § "länkgrinden är fel designad" anger *"URL-undantag: 19 · varav
externa: 19 · varav interna: 0"*. Mot samma commit var siffrorna 21 / 20 / 1.
Två fel: externa undercountas med ett, och **påståendet att noll undantag är
interna är falskt** — posten
`^file://.*/docs/specs/KVALITETSDEFINITIONER-11\.md(>|#.*)?$` har funnits sedan
Session 6.5 (2026-05-14) och är permanent per ADR-022 § Fix-vs-skip-disciplin
kategori 4. Samma avvikelse finns i `.lycheeignore`:s egna kommentarer, som
kallar `danger.systems` *"det TJUGONDE externa undantaget"* när det mekaniskt är
det tjugoförsta. Jag kan inte rekonstruera vilken räkningskonvention som ger 19
respektive 20; per-rad ger 21, per kommentarsblock ger 16.

Och täljaren: under `--offline` blir **alla 21** externa mönster verkningslösa i
PR-grinden, inte 17. Det enda som överlever är `file://`-posten — som är den
enda posten filen påstår inte existerar. Rätt formulering är alltså:

> **21 av 22 undantag blir verkningslösa i PR-grinden. Noll av dem blir onödiga
> i repot**, om den nattliga rapporten ska vara läsbar.

Kostnaden uppdelningen faktiskt tar bort är inte listan utan **PR-rundan**: 11
av 25 commits mot `.lycheeignore` har ett undantag som sitt ärende, nio av dem
under de senaste två månaderna. Efter en uppdelning kan de posterna landa i en
samlad städning i stället för som brådskande avblockering av en väntande PR.

### C.4 Finns ett alternativ vi inte övervägt?

Tre, och de utesluter inte varandra:

1. **Behåll en grind, laga verktygsfelen.** `--accept-timeouts` +
   `--host-concurrency 5` + en `--accept`-lista hade adresserat instans 1
   (transient), instans 3 (timeout) och martinfowler-fallet (parallellism mot
   strypande värd). Men **inte** 403/406-klassen, som är merparten av
   `.lycheeignore` och som lychee per konstruktion aldrig återförsöker. Delvis
   fix, inte hel.
2. **`--exclude '^https?://'` i stället för `--offline`** (nuxts form). Skillnad:
   `--offline` filtrerar på schema och tar därmed även `mailto:`, medan
   `--exclude` bara tar `http(s)` och kan kombineras med `--include` för
   utvalda egna adresser. Vi har ingen publicerad egen webbadress att släppa in,
   så `--offline` är enklare och striktare för oss. `--exclude` är att föredra
   om vi någonsin vill grinda mot en egen publicerad dokumentationssajt.
3. **Byt verktyg.** Nej. `lychee` **är** verktyget branschen använder för detta;
   de som inte använder det har byggt eget (`github/docs`, rust, astro) för att de
   har egna byggda sajter att gå igenom, inte för att lychee brister. Inget att
   byta till.

En fjärde möjlighet som materialet öppnar och som vi inte diskuterat: **diffa
scopet**, som `github/docs` gör (`tj-actions/changed-files` → bara ändrade
`content/**`). Vår interna grind kostar 31 ms mot hela repot, så
diff-scopningen köper ingenting hos oss. Värd att notera som medvetet förkastad,
inte som förbisedd.

### C.5 Sammanfattad dom

Formen är **branschens mönster och ett rimligt eget val** — men motiveringen i
restlistan är fel på en punkt som spelar roll. Uppdelningen ska säljas på att
den tar bort PR-blockeringen och PR-rundan, inte på att den tar bort
undantagslistan. Gör man det andra antagandet bygger man en nattlig rapport man
sedan låter ruttna, och då är nettot negativt.

## D · ADR-bar-prövningen

Baren: (1) svårt att återställa i kod **eller** i koherens, (2) överraskande
utan kontext, (3) resultat av en verklig avvägning.

### Argument för att baren INTE nås

- **Kod-återställningen är trivial.** Ett `--offline` i ett args-block och ett
  `if:`-villkor. Rivs på en rad.
- **Beslutet är redan taget en nivå upp.** ADR-077 slog fast presubmit/postsubmit
  som arkitektur *och* placerade uttryckligen länkkontrollen i nattnätet
  (*"länkkontroll utan cache — dagsviten cachar för fart; natten kör kall"*).
  Att flytta den externa halvan dit är en tillämpning av ett fattat beslut, inte
  ett nytt.
- **Inte överraskande.** En läsare som har ADR-077 i handen förväntar sig just
  denna form.
- **Under-bar-maskineriet räcker:** en `§`-not i ADR-077 plus ett kort i
  backloggen.

### Argument för att baren NÅS

- **Koherens-återställningen är inte trivial.** ADR-029 § Medvetna utelämningar
  punkt 2 slår fast `.lycheeignore`:s add-only-policy med motiveringen
  *"Preventiv exklusion (typ 'lägg till github.com som potentiellt-flaky') tystar
  K18-signal vi inte vet om är problem"*, och ADR-029 § Konsekvenser säger
  *"broken links åtgärdas som drift, inte tystas via preventiv `.lycheeignore`"*.
  Att flytta **all** extern yta ur den blockerande grinden är den preventiva
  exklusionen — i grossistform och som standardläge. Det river en nedskriven
  motivering. En tyst rivning lämnar trailen självmotsägande.
- **Överraskande för en framtida läsare.** Någon som ser en grön docs-grind
  bredvid en dokumenterat död extern länk kommer inte att förstå varför utan att
  det står någonstans. Filhuvudet i `.lycheeignore` räcker inte — det är just den
  fil vars roll ändras.
- **Verklig avvägning.** Detektionsfördröjning (ett dygn, best-effort) mot
  leveranstakt, och signal-styrka mot signal-brus i larmkedjan. Båda sidor har
  kostnader; valet är inte självklart.

### Rekommendation (ej beslut)

**Baren nås — men smalt, och av skäl (1-koherens) och (2), inte av (3) ensamt.**
Det som kräver en record är inte formen (den är ADR-077:s) utan **rivningen av
ADR-029 § Medvetna utelämningar punkt 2**. Formen jag skulle föreslå är en
kort ADR som gör tre saker och inte mer: namnger ADR-029 punkt 2 som ändrad och
varför, fastställer att `.lycheeignore` byter roll från "grind-tystare" till
"brusfilter för nattrapporten" (vilket också avgör om add-only-policyn
kvarstår), och avgör larmkedjans koppling — ska `nightly-links` stå kvar i
`alarm.needs` eller få en egen, mildare kanal.

Alternativet — en `§`-not i ADR-077 plus en explicit "ersatt av"-rad i ADR-029 —
täcker samma yta med mindre ceremoni och är försvarbart. Valet är ditt.

## Vad jag inte kunde belägga

- **`danger.systems`-felets exakta retry-gren.** Klassificeringen beror på om
  `Connection reset` kommer via connect-fasen (`is_connect()` → aldrig omtag)
  eller via hypers request-väg (`should_retry_io` → omtag). Jag har inte
  reproducerat felet och kan inte avgöra vilken.
- **Räkningskonventionen bakom "19" och "20"** i sessionsdoket och i
  `.lycheeignore`:s kommentarer. Per rad ger 21 externa, per kommentarsblock 16.
  Ingen av dem ger 19 eller 20.
- **`nodejs/node`:s länkregel** — hämtningen av
  `nodejs/remark-preset-lint-node` gav 404 på den path som uppgavs. Posten står
  kvar som delegerad och overifierad.
- **Om `nightly-links` någonsin gått röd på en extern länk** och vad det kostade
  i praktiken. Jag frågade inte körnings-API:t; hela kostnadsargumentet i C.2
  vilar på konstruktion och på branschmaterialet, inte på vår egen mätserie.
- **Paritet mellan min lokala mätning och runnern.** Flagg-semantiken är
  identisk (samma binärversion), men nätvägen är det inte — och det är just
  nätvägen hela problemet handlar om.

## Rekommendation till Marcus

1. **Gör uppdelningen.** Noll av nio branschledande projekt låter externa länkar
   blockera en PR; lychees egen dokumentation rekommenderar schemalagt plus
   ärende, och vi har redan larmkedjan.
2. **Men sälj den inte på undantagslistan.** 21 av 22 undantag blir verkningslösa
   i PR-grinden — noll blir onödiga i repot. Både `github/docs` (155 rader) och
   nuxt (31 poster) behåller sina listor för icke-blockerande körningar.
3. **Lägg till `--accept-timeouts` på båda halvorna oavsett beslut.** Verifierat:
   `0 Errors, 1 Timeout` ger exit 2 idag, exit 0 med flaggan, och ett äkta fel
   fäller fortfarande.
4. **Avgör larmkopplingen samtidigt.** Står `nightly-links` kvar i
   `alarm.needs` flyttar bruset från PR:er till nattnätet.
5. **Rätta två faktafel i `.lycheeignore` när filen ändå öppnas:** felcachningen
   togs bort i lychee v0.24.0 (vi kör 0.24.2 sedan 2026-07-19), så sched.com-postens
   motivering är ogiltig och `--cache-exclude-status '429'` är en no-op.
6. **ADR: ja, smalt.** Inte för formen — den är ADR-077:s — utan för att
   ADR-029 § Medvetna utelämningar punkt 2 rivs öppet.
