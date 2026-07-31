---
owner: marcus803
updated: 2026-07-31
review_by: 2027-01-31
status: draft
---

# Hur löser etablerade projekt typkontroll och lint av Supabase Edge Functions (Deno) i ett Node-repo? (Code, 2026-07-31)

> **Proveniens:** avgränsat research-pass 2026-07-31, beställt för `TASK-103`.
> Passet levererar underlaget, inte beslutet. Ingen kod, ingen config, ingen ADR
> och inget kort rört — enda skrivningen i repot är denna fil.
>
> **Mätningarna** kördes mot `deno 2.9.4` (stable, x86_64-apple-darwin, TypeScript
> 6.0.3), `@biomejs/biome 2.5.4` (repots egen, ur `node_modules`), `supabase CLI
> 2.75.0` och repots träd vid `67b3014`. Deno-verktygen kördes mot en **kopia** av
> `supabase/functions` i en scratchpad-katalog, aldrig mot arbetsträdet.
> Väggtider är tre körningar var vid load average 6,98–7,25 på en upptagen
> maskin — de är storleksordningar, inte riktmärken. Där något är bedömning och
> inte mätning står det utskrivet.

---

## Kort svar

**Ja — "exkludera Deno-mappen ur Node-verktygen och köra Denos egna verktyg
separat" är det etablerade mönstret. Det är inte en avvikelse.** Det är vad
Supabase egen CLI skriver in i projektet vid `supabase init`, det är vad
Deno-tilläggets `deno.enablePaths` finns till för, och det är vad varje
precedent-repo jag hittade gör.

Avvikelsen i vårt repo är alltså inte exkluderingen. Den är att **andra halvan
aldrig kopplades på**. [ADR-010](../decisions/ADR-010-biome-exclude-deno-edge-functions.md)
beslutade 2026-04-14 båda halvorna — exkludering *och* `deno lint` / `deno fmt` /
`deno check` — och sköt den andra till "Fas 7". Fas 7 kom aldrig, och sedan dess
har 39 filer legat utanför varje mekanisk grind i repot.

Vad det kostar, mätt idag mot koden som ligger i trädet:

- `deno check` med `@ts-nocheck` borttaget hittar **2 verkliga typfel** —
  `batchValidation: 'permissive'` skickas till `resend.batch.send()` men finns
  inte i `CreateBatchRequestOptions` i den pinnade `resend@4`.
- `deno lint` hittar **3 fynd** utan konfiguration, **7 med** Deno-specifika
  regler påslagna (fyra av dem: inline `https:`-imports som inte är deklarerade
  i någon config).
- Kommentaren som motiverar `@ts-nocheck` i två filer påstår att koden
  *"typas vid deploy"*. **Det är falskt.** Deno typkontrollerar inte vid körning
  (mätt), och `supabase functions deploy` bundlar via `edge-runtime bundle` till
  en eszip utan typkontroll (läst i CLI-källan). Ingenting typkontrollerar de
  filerna någonstans idag.

---

## 1. Vad Supabase officiellt rekommenderar

### Rekommendationen finns, och den är explicit om Node-repot

`development-environment.mdx` i Supabase docs-repo säger ordagrant:

> "The benefit of installing Deno separately is that you can use the Deno LSP to
> improve your editor's autocompletion, type checking, and testing. You can also
> use Deno's built-in tools such as `deno fmt`, `deno lint`, and `deno test`."

Och om sam-existensen med Node-kodbasen, ordagrant:

> "This configuration enables the Deno language server only for the
> `supabase/functions` folder, while using VSCode's built-in JavaScript/TypeScript
> language server for all other files."
>
> "The standard `.vscode/settings.json` setup works perfectly for projects where
> your Edge Functions live alongside your main application code."

Multi-root workspace rekommenderas endast för det andra fallet — Edge Functions i
ett *annat* repo än appen, eller flera parallella tjänster.

### CLI:t skriver in mönstret själv

Detta är inte bara prosa. `supabase init` frågar *"Generate VS Code settings for
Deno? [y/N]"* och skriver då in denna fil, ordagrant ur CLI-källan
(`apps/cli-go/internal/init/templates/.vscode/settings.json`):

```json
{
  "deno.enablePaths": ["supabase/functions"],
  "deno.lint": true,
  "deno.unstable": ["bare-node-builtins", "byonm", "sloppy-imports", "…"],
  "[typescript]": { "editor.defaultFormatter": "denoland.vscode-deno" }
}
```

Samma katalog innehåller `.idea/deno.xml` för JetBrains. **Vendorns default är
alltså: Deno-verktygen ägar `supabase/functions`, Node-verktygen ägar resten.**

### Ett `deno.json` — men var? Dokumentationen motsäger sig själv

Detta är den enda punkt där de officiella källorna inte är eniga, och skillnaden
spelar roll för oss:

| Källa | Säger |
|---|---|
| `development-environment.mdx` § Recommended project structure | `supabase/functions/deno.json # Top-level Deno configuration` |
| `development-environment.mdx` § editor-setup | `"deno.importMap": "./supabase/functions/deno.json"` |
| `dependencies.mdx` § Using `deno.json` (recommended) | "Each function should have its own `deno.json` file … **not recommended for deployment**" |

**Motsägelsen går att lösa mot källkoden, och svaret är entydigt.** I
`apps/cli-go/internal/functions/deploy/deploy.go` är upplösnings-ordningen per
funktion:

1. `--import-map`-flaggan
2. `config.toml` (`[functions.X] import_map`)
3. `<funktionskatalog>/deno.json`
4. `<funktionskatalog>/deno.jsonc`
5. `<funktionskatalog>/import_map.json` (varnar: deprecated)
6. `supabase/functions/import_map.json` (varnar: fallback, deprecated)

Ett **`supabase/functions/deno.json` finns inte i kedjan alls.** Deploy läser den
aldrig. `ShouldUseDenoJsonDiscovery()` i `pkg/function/bundle.go` bekräftar det
från andra hållet: en `deno.json` överlämnas till Denos egen discovery endast när
den ligger i *samma katalog som entrypointen*.

Praktisk konsekvens för oss: en `supabase/functions/deno.json` som bara bär
`lint`, `fmt` och `compilerOptions` är **deploy-neutral** — den kan inte påverka
en deploy, eftersom deploy inte läser den. Den är ett verktygs- och
redaktörs-artefakt, precis som `development-environment.mdx` använder den. Vår
kod behöver ingen import-map vid deploy: samtliga imports är antingen fullständiga
`https:`-URL:er eller relativa `.ts`-sökvägar.

### Supabase har byggt mot precis vårt fall

`pkg/function/bundle.go` sätter `DENO_NO_PACKAGE_JSON=1` på bundler-processen om
inte funktionens **egen** katalog har en `package.json`:

```go
func ShouldUsePackageJsonDiscovery(entrypoint, importMap string, fsys fs.StatFS) bool {
    if len(importMap) > 0 { return false }
    packageJsonPath := filepath.Join(filepath.Dir(entrypoint), "package.json")
    if _, err := fsys.Stat(packageJsonPath); errors.Is(err, os.ErrNotExist) { return false }
    return true
}
```

Det är förstahandsbevis på att Supabase uttryckligen har hanterat "Deno-kod i ett
Node-repo": de skärmar bundlern från repo-rotens `package.json`.

### Vad de INTE säger

- **`@ts-nocheck` nämns inte en enda gång** i Supabase docs-innehåll (0 träffar
  på `ts-nocheck` under `apps/docs/content`). Det finns alltså varken stöd för
  eller förbud mot vårt bruk — det är vår egen konstruktion.
- Ingen dokumenterad utsaga om att deploy typkontrollerar. Källan säger tvärtom:
  bundling sker med `edge-runtime bundle --entrypoint … --output …eszip`. Ingen
  `deno check` någonstans i vägen.

---

## 2. Deno officiellt: `check`, `lint`, `fmt` och CI

- **`deno check`** — "type-checks your TypeScript (or JavaScript) code without
  running it". Kontrollerar som default **endast lokala moduler**; `--all` drar
  in fjärrmoduler.
- **`deno lint`** — 198 regler, styrs i `deno.json` via `lint.rules.tags` /
  `include` / `exclude`, och undertrycks per rad med `// deno-lint-ignore <regel>`
  eller per fil med `// deno-lint-ignore-file`.
- **`deno fmt`** — konfigureras i `deno.json` (`fmt.lineWidth`, `singleQuote`,
  `semiColons`, `indentWidth`).
- **CI:** Deno hänvisar till GitHubs starter-workflow och till den **förstaparts**
  action `denoland/setup-deno@v2` (`denoland`-org). Rekommenderade steg:
  `deno fmt --check`, `deno lint`, `deno test`. Cachning slås på med
  `cache: true`; cache-nyckeln hashar `**/deno.lock`.
- **Kostnad i CI-tid: ingen officiell siffra.** Varken CI-sidan eller
  `setup-deno`-README:n anger en. Mina mätningar nedan är lokala och ersätter
  inte en riktig CI-mätning.

### Mätt lokalt mot våra 39 filer

| Körning | Utfall | Väggtid (3 körningar) |
|---|---|---|
| `deno lint` (utan config) | 3 fynd | 0,41 / 0,28 / 0,34 s |
| `deno lint` (+4 Deno-specifika regler) | 7 fynd | — |
| `deno check` (koden som den ligger) | 0 fel | 2,9 s kall cache |
| `deno check` (varm cache) | 0 fel | 1,55 / 1,49 / 1,50 s |
| `deno check` (`@ts-nocheck` borttaget) | **2 typfel** | 1,2 s |
| `deno fmt --check` (Denos defaults) | 39 av 39 filer skulle skrivas om | — |
| `deno fmt --check` (config matchad mot Biome) | 21 av 40 filer skulle skrivas om | — |

Två observationer värda att bära med sig:

1. **Ingen `deno.lock` skapades** av vare sig `deno check` eller `deno lint`, med
   eller utan `deno.json`, med eller utan `package.json` i roten. Vår kod har inga
   `npm:`- eller `jsr:`-specifierare, bara `https:`-URL:er.
2. **`deno check supabase/functions` fungerar från repo-roten** även med Node-repots
   `package.json` närvarande och utan `node_modules` — samma 2 fel, ingen
   byonm-krasch. Precedent-repona `cd`:ar ändå in i katalogen; det är
   robusthet, inte nödvändighet, för just vår kod.

---

## 3. Deno-globaler, URL-imports och `@ts-nocheck`

**`Deno`-globalen behöver ingen konfiguration alls när Denos egna verktyg kör.**
Mätt: `deno check --no-config` på våra 39 filer ger noll fel på `Deno.env.get(...)`
— och 28 av de 39 filerna refererar `Deno.*`, så täckningen är verklig och inte
en artefakt av att globalen bara förekommer i de två `@ts-nocheck`-filerna.
Typerna kommer ur runtimens inbyggda lib, inte ur ett paket.

- **`@types/deno` behövs inte** och rekommenderas inte av någon förstapartskälla
  jag hittade. Paketet finns och underhålls (`2.7.0`, publicerad 2026-05-16) men
  är DefinitelyTyped — dess enda syfte är att få *Node-tsc* att förstå `Deno`.
  Det löser fel problem: det ger `tsc` en `Deno`-typ men fortfarande ingen
  förståelse för `https:`-imports.
- **Supabase-specifika runtime-API:er** typas via en import, ordagrant ur
  `supabase functions new`-mallen:

  ```ts
  // Setup type definitions for built-in Supabase Runtime APIs
  import "@supabase/functions-js/edge-runtime.d.ts"
  ```

- **URL-imports** hanteras av Deno utan konfiguration, men `deno lint` har regeln
  `no-import-prefix` som **kräver** att beroendet deklareras i config i stället för
  inline. Mätt på vår kod: **4 träffar** — de fyra `https://esm.sh/...`-importerna.
  Systerregeln `no-unversioned-import` kräver versions-specifierare.
  Ingen av dem ingår i `recommended`; de måste väljas in.
- **`@ts-nocheck`** i `send-email/index.ts` och
  `send-registration-confirmation/index.ts` motiveras i koden med att filerna
  *"typas vid deploy, ej av Node-tsc"*. Mätt och läst:
  - Deno typkontrollerar **inte** vid körning. Negativ kontroll: en fil med
    `const n: number = "definitely not a number"` kördes av `deno run` med
    exit 0 och skrev ut strängen.
  - `supabase functions deploy` bundlar via `edge-runtime bundle` till eszip.
    Ingen typkontroll i vägen.
  - Med direktivet borttaget rapporterar `deno check` 2 fel — båda
    `batchValidation: 'permissive'` mot `CreateBatchRequestOptions`.

  **Sido-fynd (utanför frågan, registrerat, inte förkastat):** `resend@4.8.0`
  (det `https://esm.sh/resend@4` löser till) har varken `batchValidation` i sina
  typer eller i sin runtime — `post()` läser endast `options.idempotencyKey` och
  sprider resten in i `fetch`-init. Optionen når därmed sannolikt **aldrig**
  Resends API. Det är en hypotes om produktionsbeteende grundad på paketkällan,
  inte en körd verifiering; den hör hemma som eget kort, inte i detta pass.

---

## 4. Precedent — fem repon, och en ärlig bild av rymden

Alla fem har Deno-kod under `supabase/functions/` i ett repo med en annan
huvudkodbas, och alla fem kör Denos verktyg i en **egen, path-filtrerad**
CI-workflow.

| Repo | ★ | Node-verktygen | `deno.json` | CI |
|---|---|---|---|---|
| [`bdougie/contributor.info`](https://github.com/bdougie/contributor.info) | 33 | `supabase/functions/` i **både** `eslint.config.js` `ignores` och `.prettierignore`; utanför tsconfig-programmen | **top-level** `supabase/functions/deno.json` med `lint`, `fmt`, `tasks` | `edge-functions-quality.yml`: `deno lint`, `deno fmt --check`, `deno test`, `deno check`, `setup-deno@v1` |
| [`hero-org/herocast`](https://github.com/hero-org/herocast) | 92 | `biome.json` med `"!supabase/functions"` i `files.includes` | per funktion | `edge-functions-typecheck.yml`: `deno check --config <fn>/deno.json <fn>/index.ts`, `setup-deno@v1` |
| [`matiasbattocchia/open-bsp-api`](https://github.com/matiasbattocchia/open-bsp-api) | 528 | — (Deno-first repo) | top-level + `deno.lock` | `check.yml`: `cd supabase/functions && deno lint && deno check .`, `setup-deno@v2`, `deno-version: v2.x` |
| [`risa-labs-inc/BossConsole`](https://github.com/risa-labs-inc/BossConsole) | 208 | — (Kotlin/Gradle-huvudkodbas) | per funktion | `edge-functions.yml`: `deno check` per fil, `deno test`, `deno lint` som **advisory** (`continue-on-error`) |
| [`enzoftware/hotelyn`](https://github.com/enzoftware/hotelyn) | 190 | — (Flutter/Melos-huvudkodbas) | top-level + `deno.lock` | `ci-edge-functions.yml`: `defaults.run.working-directory: supabase/functions`, `deno lint`, `deno fmt --check`, `deno test --frozen`, `setup-deno@v2`, **pinnad** `deno-version: "2.7.3"` |

**`herocast` är den närmaste mekaniska tvillingen:** exakt samma Biome-mekanism
som vår, `"!supabase/functions"`, samma sträng — plus den `deno check`-workflow vi
saknar. **`contributor.info` är den närmaste strukturella tvillingen:** Vite/React
med `package.json` i roten, `tsconfig.json` med `references` till app- och
node-program (alltså Deno-koden utanför varje program, som hos oss), och en
`deno.json` vars `fmt` är satt till `lineWidth: 100` + `singleQuote: true` —
samma stil som vår Biome-config.

`hotelyn` och `BossConsole` motiverar dessutom i workflow-kommentarer varför
Deno-CI:n hålls **isolerad** från huvudpipelinen: den ska varken blockeras av
eller blockera Dart-/Gradle-sidan, och path-filtret gör den till en no-op när
inget under `supabase/functions/` ändrats.

### Kvantitativt — och var det tunnar ut

Via GitHubs kod-sök-API 2026-07-31:

| Sökning | Träffar |
|---|---|
| `setup-deno` + `supabase` i `.github/workflows` | 1 110 filer |
| `deno check` + Supabase-functions i workflows | 1 098 filer |
| `supabase/functions` i en `.eslintignore` | 93 filer |
| `supabase/functions` i en `biome.json` | 39 filer |
| `deno.enablePaths` (var som helst) | ~2 700 filer |

**Precedent-rymden är bred men grund, och det ska sägas rakt ut.** Jag sorterade
de ~60 första träffarna på stjärnor: den högsta var 528. **Inget välkänt
OSS-projekt** dök upp med kombinationen Node-frontend + `supabase/functions` +
Deno-CI. Klassen "stor känd produkt som kör Supabase Edge Functions i ett
Node-monorepo och grindar dem" hittade jag inte — vilket inte är samma sak som att
den inte finns.

En **motpunkt** som hör hemma här: `supabase/supabase`s egen monorepo exkluderar
*inte* sina Deno-exempel ur `.prettierignore`. Vendorn kör alltså Prettier över
egen Deno-exempelkod samtidigt som deras CLI scaffoldar Deno-tillägget som
TypeScript-formatterare för den scopade sökvägen. Formatterings-halvan av
mönstret är alltså mindre entydig än typkontroll- och lint-halvan.

---

## 5. Biome mot Deno — mätt, inte antaget

Kört med repots egen Biome 2.5.4 mot de 39 filerna, med exkluderingen borttagen
(via en scratchpad-config; `biome.json` orörd):

| Konfiguration | Utfall |
|---|---|
| `recommended`, som repots regler i övrigt | **21 errors, 6 warnings, 143 infos** — 68 ms |
| Endast formattern | 18 errors (18 av 39 filer formateras om) |
| `recommended` + `overrides` som stänger `useLiteralKeys` + `noNonNullAssertion` för `**/supabase/functions/**` | 21 errors, **4 warnings, 0 infos** |

Fördelningen: `useLiteralKeys` **143**, `noNonNullAssertion` 2, `useRegexLiterals` 2,
`useOptionalChain` 1, `noUnusedFunctionParameters` 1, `organizeImports` 3 (errors),
resterande 18 errors är rena formaterings-diffar.

Tre slutsatser, varav en river ett antagande i ADR-010:

1. **Biome 2.5.4 kvävs inte av Deno-koden.** Alla 39 filer parsades utan ett enda
   fel, och **inga** diagnostiker gällde `https:`-importerna eller
   `Deno`-globalen. ADR-010:s premiss att "TypeScript/Biome i Node-kontext …
   tolkar dem som relativa paths och försöker resolva på disk" stämmer inte längre
   för Biome — den resolvar inte imports alls i det här läget.
2. **`overrides` fungerar.** ADR-010 avfärdade alternativ 2 med att "Biome 2.x
   `overrides`-syntax är inte lika mogen som ESLints". Mätt på 2.5.4: en
   `overrides`-post med `includes: ["**/supabase/functions/**"]` tar bort 143 infos
   och 2 warnings, exakt som avsett. Den halvan av avfärdandet håller inte längre.
   Den **andra** halvan av samma alternativ håller fortfarande: Biome
   typkontrollerar inte, så `Cannot find name 'Deno'`-klassen löses inte av
   `overrides` — den löses av att `deno check` gör jobbet.
3. **Biome vet ingenting om Deno, och kommer inte att göra det.** Biomes egen
   dokumentation nämner Deno enbart som ett sätt att *installera och köra Biome*
   (`deno run -A npm:@biomejs/biome check`). Det finns ingen Deno-domän, ingen
   Deno-preset; de två PR:er i `biomejs/biome` som heter "fix: support deno" är
   från 2023 och stängda. `deno lint` har åtta runtime-specifika regler som Biome
   strukturellt saknar: `no-deprecated-deno-api`, `no-node-globals`,
   `no-process-global`, `no-window`, `no-window-prefix`, `no-sloppy-imports`,
   `no-import-prefix`, `no-unversioned-import`.

**Dom på delfråga 5:** Biome kan formatera Deno-kod och fånga generiska JS/TS-fel,
men den kan inte typkontrollera, inte läsa modulgrafen och inte se ett enda
Deno-specifikt fel. `deno lint` + `deno check` är rätt verktyg. Jag hittade ingen
etablerad praxis för att köra Biome på Deno-kod — varken i Biomes dokumentation
eller i precedent-repona.

---

## Dom

**Att exkludera `supabase/functions` ur Biome är rätt och i linje med
branschmönstret — mönstret är bara halvt implementerat hos oss.**

- **Delfråga 1 var avgörande.** Så länge frågan ställs som "ska Node-verktygen
  täcka Deno-koden?" ser exkluderingen ut som ett hål. Den officiella
  rekommendationen ställer frågan tvärtom: verktygskedjorna *ska* vara åtskilda,
  och skiljelinjen går exakt vid `supabase/functions`. Supabase CLI skriver in den
  linjen i projektet själv. Det som saknas är inte täckning från Biome — det är
  Denos halva av grinden.
- **Det som faktiskt är trasigt** är att 39 filer inte grindas av något alls, och
  att två av dem dessutom bär ett `@ts-nocheck` vars motivering är falsifierad.
  Kostnaden är mätt: 2 verkliga typfel och 3–7 lint-fynd ligger i trädet just nu.
- **Kostnaden att laga är låg.** `deno lint` ~0,3 s, `deno check` ~1,5 s varmt
  lokalt, i en path-filtrerad workflow som är no-op när `supabase/functions/` inte
  rörts. Det är samma form som alla fem precedent-repon valt.
- **Formatteringen är den enda delen med verklig friktion.** `deno fmt` skulle
  skriva om 21 av 39 filer även med en config matchad mot Biomes stil, eftersom
  dprint och Biome bryter rader olika. Den delen är ett separat val med en
  engångskostnad, inte en följd av typkontroll- och lint-beslutet.

---

## Vad jag inte kunde belägga

- **Ingen officiell Supabase-utsaga om `@ts-nocheck`.** Noll träffar i deras
  docs-innehåll. Det är frånvaro av dokumenterad rekommendation — inte bevis för
  att de avråder.
- **Ingen officiell siffra på CI-kostnad** för `denoland/setup-deno`. Mina tal är
  lokala, från en maskin med load average ~7, tre körningar per mätning. Ingen
  mätning i GitHub Actions gjord.
- **Att en top-level `supabase/functions/deno.json` är ofarlig för
  `supabase functions serve`** — verifierat endast för **deploy**-vägen, ur
  CLI-källan. Serve-vägen delar samma `FallbackImportMapPath`-konstant men jag
  läste inte serve-koden och körde ingen lokal serve.
- **Att de 2 typfelen är verkliga produktionsbuggar.** Bevisen (`resend@4.8.0`
  saknar `batchValidation` i både typer och runtime) pekar dit, men jag körde
  ingen skarp verifiering mot Resend.
- **Inget välkänt OSS-projekt som precedent.** Jag sökte på fyra sätt
  (workflow-innehåll, `.eslintignore`, `biome.json`, `deno.enablePaths`) och
  sorterade träffarna på stjärnor. Högsta var 528. Att jag inte hittade ett stort
  projekt betyder inte att det inte finns — GitHubs kod-sök indexerar bara
  default-grenar och rankar på relevans, inte på fullständighet.
- **Paritet mellan `deno check` lokalt och i CI.** Mätt på deno 2.9.4 lokalt;
  fyra av fem precedent-repon kör `v1.x` eller `v2.x` som flytande intervall.
  Vilken version *vi* skulle pinna är ett öppet val.
- **Om `deno fmt`s 21 omskrivna filer innehåller något som Biome-stilen faktiskt
  vill ha.** Jag karaktäriserade diffarna (radbrytning i ternärer, template-literals,
  import-listor) men granskade dem inte fil för fil.

---

## Rekommendation

*Detta är en rekommendation, inte ett beslut. Beslutet är Marcus.*

1. **Lägg en `supabase/functions/deno.json`** med `lint`- och `compilerOptions`-block.
   Den är deploy-neutral (bevisat ur CLI-källan) och ger `deno lint`/`deno check`
   en förankrad config.
2. **Kör `deno check` + `deno lint` i en egen, path-filtrerad CI-workflow** med
   `denoland/setup-deno@v2` och en **pinnad** version (hotelyn-mönstret: en
   Deno-release ska inte kunna göra en grön PR röd över natten). Det är exakt det
   snitt fem av fem precedent-repon valt.
3. **Ta bort de två `@ts-nocheck`-direktiven i samma landning** och åtgärda de
   2 typfelen — annars startar grinden röd, och en grind som startar röd blir
   avstängd.
4. **Behåll Biome-exkluderingen som den är.** Den är rätt enligt både vendorn och
   precedenten. Uppdatera däremot ADR-010:s *motivering*: två av dess premisser är
   mätt falsifierade på dagens versioner (Biome kvävs inte av URL-imports;
   `overrides` fungerar). Beslutet står — skälen behöver rättas.
5. **Skjut `deno fmt` till ett eget beslut.** 21 omskrivna filer är en
   engångskostnad som inte behöver bäras av samma landning som typkontrollen.
   `contributor.info` och `hotelyn` kör `fmt --check`; `herocast` gör det inte.
6. **Överväg `no-import-prefix`** som opt-in-regel senare. Den flyttar de fyra
   `https://esm.sh/...`-importerna till en deklarerad imports-map, vilket är ett
   leveranskedje-argument snarare än ett stilargument.

---

## Källförteckning

### Förstapartskällor — Supabase

- Development Environment (Edge Functions): <https://supabase.com/docs/guides/functions/development-environment>
  — källtext: <https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/functions/development-environment.mdx>
- Managing dependencies (Edge Functions): <https://supabase.com/docs/guides/functions/dependencies>
  — källtext: <https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/functions/dependencies.mdx>
- CLI, VS Code-mall som `supabase init` skriver: <https://github.com/supabase/cli/blob/main/apps/cli-go/internal/init/templates/.vscode/settings.json>
- CLI, `supabase functions new`-mallar: <https://github.com/supabase/cli/blob/main/apps/cli-go/internal/functions/new/templates/deno.json> och `index_auth_mode_user.ts` i samma katalog
- CLI, upplösning av import-map/`deno.json` vid deploy: <https://github.com/supabase/cli/blob/main/apps/cli-go/internal/functions/deploy/deploy.go>
- CLI, bundling till eszip + `DENO_NO_PACKAGE_JSON`: <https://github.com/supabase/cli/blob/main/apps/cli-go/pkg/function/bundle.go>
- CLI, sökvägsbyggaren (`FallbackImportMapPath`): <https://github.com/supabase/cli/blob/main/apps/cli-go/pkg/config/utils.go>

### Förstapartskällor — Deno

- `deno check`: <https://docs.deno.com/runtime/reference/cli/check/>
- `deno lint`: <https://docs.deno.com/runtime/reference/cli/lint/>
- Regelkatalogen (198 regler, taggar): <https://docs.deno.com/lint/>
- Continuous integration: <https://docs.deno.com/runtime/reference/continuous_integration/>
- `denoland/setup-deno`: <https://github.com/denoland/setup-deno>

### Förstapartskällor — Biome

- Getting started (Deno nämns endast som körsätt för Biome): <https://github.com/biomejs/website/blob/main/src/content/docs/guides/getting-started.mdx>
- Stängda PR:er "fix: support deno": <https://github.com/biomejs/biome/pull/151>, <https://github.com/biomejs/biome/pull/153>

### Precedent-repon

- <https://github.com/bdougie/contributor.info> — `.github/workflows/edge-functions-quality.yml`, `supabase/functions/deno.json`, `eslint.config.js`, `.prettierignore`
- <https://github.com/hero-org/herocast> — `.github/workflows/edge-functions-typecheck.yml`, `biome.json`
- <https://github.com/matiasbattocchia/open-bsp-api> — `.github/workflows/check.yml`
- <https://github.com/risa-labs-inc/BossConsole> — `.github/workflows/edge-functions.yml`
- <https://github.com/enzoftware/hotelyn> — `.github/workflows/ci-edge-functions.yml`

### Övrigt

- `resend@4.8.0` typer och runtime: <https://unpkg.com/resend@4.8.0/dist/index.d.ts>, <https://unpkg.com/resend@4.8.0/dist/index.mjs>
- `@types/deno` på npm: <https://registry.npmjs.org/@types/deno>
- Internt: [ADR-010](../decisions/ADR-010-biome-exclude-deno-edge-functions.md),
  [ADR-036](../decisions/ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md)
