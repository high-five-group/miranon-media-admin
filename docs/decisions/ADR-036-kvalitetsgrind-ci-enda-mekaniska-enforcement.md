# ADR-036: Kvalitetsgrind — CI som enda mekaniska enforcement

- Status: Accepted (Session 7 K0.1c 2026-05-27)
- Datum: 2026-05-27
- Fas: Meta (Session 7 K0 — Fas 2 11/10-verification, Fynd 1 grind-arkitektur)

## Kontext

[ADR-001](ADR-001-biome-over-eslint-stylelint-prettier.md) (Beslut + Konsekvenser) och [ADR-010](ADR-010-biome-exclude-deno-edge-functions.md) (Alternativ #5) påstår båda att en pre-commit-hook i `.claude/settings.json` kör `biome check . && tsc --noEmit` och därmed blockerar commits med lint- eller typfel. Det påståendet är empiriskt falsifierat.

Session 7 K0.1b-test: en fil med ett `debugger;`-uttryck (garanterat `biome`-error via recommended-regeln `noDebugger`) stageades och committades — commiten **landade rent**, `biome check` kördes aldrig. `.claude/settings.json` `hooks.pre-commit` är **dead config**: Claude Codes hook-system har inget `pre-commit`-event, så nyckeln ignoreras. Den faktiska git-hooken (`core.hooksPath` → `.githooks/pre-commit`) gör **endast** frontmatter-`updated:`-bump per [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) — den kör varken `biome` eller `tsc`. Pre-commit-kvalitetsgrinden har alltså aldrig existerat; den var ett overifierat enforcement-claim buret sedan ADR-001 (Fas 0).

Parallellt fixade K0.1 en relaterad bugg: `tsc --noEmit` utan `-b` var no-op över project references — CI:s typkoll-signal var falsk-grön (se Session 7 K0.1-trail). Efter K0.1 kör CI `npm run typecheck` (`tsr generate && tsc -b --noEmit`, äkta över alla refererade projekt) + `biome check .`. CI är därmed den enda mekaniska grind som faktiskt enforce:ar kod-kvalitet — och den är nu ärlig.

## Beslut

**CI (`.github/workflows/ci.yml`) är den enda mekaniska enforcement-grinden** för `biome` + typkoll. `npm run typecheck` (äkta efter K0.1) + `biome check .` körs på varje pull request mot `main`.

**Ingen mekanisk lokal pre-commit-grind för Biome/typkoll införs.** Lokal kvalitetssäkring är **DoD-disciplin**: utvecklaren kör `npm run typecheck` + `npx @biomejs/biome check .` manuellt före commit (per `CONTRIBUTING.md` Definition of Done). Den döda `hooks.pre-commit` i `.claude/settings.json` tas bort (ingen grind som inte finns ska se ut att finnas). `.githooks/pre-commit` behåller sin legitima, fungerande frontmatter-bump-roll.

## Alternativ som övervägdes

**A — Gör pre-commit-grinden äkta** (lägg `npm run typecheck` + `biome` i `.githooks/pre-commit`). Förkastat: full typkoll i pre-commit är ett branschmässigt anti-mönster — långsam grind bygger in friktion som leder till `git commit --no-verify`-kringgång, vilket gör grinden "worse than useless". CI är sanningskällan; en lokal grind som kringgås ger falsk trygghet.

**B — Korrigera kommandot i den döda hooken** (`tsc --noEmit` → `npm run typecheck`) utan att wira den. Förkastat: perpetuerar dead config — gör en icke-körande hook mer korrekt på pappret och vidmakthåller illusionen att en grind finns.

**Pre-push-hook** — flytta grinden till pre-push istället för pre-commit. Förkastat: marginell vinst över en redan snabb och (efter K0.1) ärlig CI; fortfarande kringgåbar (`--no-verify`); överengineering per K11 (verifierad-inte-påstådd-disciplin gäller även infrastruktur).

## Konsekvenser

CI är kvalitets-arbitern; lokal kvalitet vilar på DoD-disciplin, inte mekanik. `.claude/settings.json` `hooks.pre-commit` tas bort (Session 7 K0.1c). ADR-001 + ADR-010 får en additiv korrigerings-not som pekar hit (immutabilitet: deras beslutstext bevaras oförändrad). `CLAUDE.md`, `CONTRIBUTING.md` och `PULL_REQUEST_TEMPLATE.md` DoD-listor pekar på `npm run typecheck` (den äkta typkollen) i stället för no-op-formen `npx tsc --noEmit`.

Kostnaden: ingen mekanisk lokal spärr mot att commita kod med lint-/typfel — en sådan commit fångas först i CI på PR. Detta är ett medvetet val: snabb ärlig CI + DoD-disciplin slår en långsam kringgåbar lokal grind. Den som vill ha en lokal spärr kör DoD-kommandona manuellt (eller wirar en egen icke-versionerad hook).

## Updates

### 2026-08-05 (S98) — pre-push-avslaget STÅR, och är nu MÄTT i stället för bedömt

Beslutet är oförändrat. Denna post byter ut ett av dess skäl mot ett starkare.

**Vad som prövades.** Ett research-pass om när den lokala CI-pariteten ska köras
([`ci-parity-lokal-trigger-branschmonster-2026-08-05.md`](../research/ci-parity-lokal-trigger-branschmonster-2026-08-05.md))
rekommenderade en opt-in pre-push-hook — alltså precis det Alternativ-sektionen
ovan förkastade 2026-05-27. Passet fick aldrig denna ADR som kontext, och
orkestreraren körde inte pre-K-forensiken före beställningen. Marcus fångade det
i stället, ur minnet: *"vi måste pratat om det tidigare under designen av det vi
har idag."* Den fångsten är skälet till att denna post finns.

**Passets egen mätning stärker däremot avslaget.** Den ursprungliga texten sade
*"marginell vinst över en redan snabb och (efter K0.1) ärlig CI"* — en bedömning.
Nu är den mätt:

| Vad | Tid |
|---|---|
| Riktig CI-körning, parallell, inkl. Acceptance (run `30983879673`, 2026-08-05) | **401,0 s** |
| Lokal `npm run verify:ci-parity`, seriell (två körningar samma dag) | **641,0 s** och **824,8 s** |

401,0 s är omräknad oberoende ur körningens `startedAt`/`updatedAt`, inte
avläst ur passets rapport. **Vinsten är inte marginell — den är negativ.** Att
köra den fulla lokala grinduppsättningen före push kostar mer väggklocka än att
pusha och låta CI svara, eftersom CI parallelliserar jobben och den lokala
körningen inte gör det.

**Premisser som HAR ändrats sedan 2026-05-27, och varför de ändå inte vänder
beslutet:**

- **Merge queue är aktiv** sedan 2026-07-29 (`TASK-70.1`). Den löser
  cross-PR-integrationsdrift — en annan fråga. Den tar inte bort behovet av
  lokal verifiering, eftersom en PR:s egna required checks måste vara gröna
  *innan* posten ens får köas (`gh pr merge --help`).
- **`scripts/verify-ci-parity.mjs` finns** sedan 2026-08-04 (`#752`) och gör
  det tekniskt möjligt att köra CI:s exakta uppsättning lokalt — vilket inte
  gick 2026-05-27. Möjligheten fanns alltså inte när beslutet fattades; nu gör
  den det, och mätningen visar att den ändå inte lönar sig som obligatorisk
  pre-push-grind.
- **Ändringsklassning** (`TASK-142`, `#762`) gör att skriptet numera kör CI:s
  faktiska delmängd per diff i stället för allt. Det sänker kostnaden för små
  diffar rejält — men flyttar inte den fulla körningens tal, och det är den
  fulla körningen en obligatorisk grind skulle behöva bära i värsta fallet.
- **CI har vuxit** från en handfull grindar till 28. Det gör den lokala
  repliken dyrare, inte billigare.

**Premisser som INTE har ändrats:** kringgåbarheten står kvar (`--no-verify`
gör varje hook till påminnelse, inte spärr), och CI är fortfarande den enda
punkt där efterlevnad går att garantera. Branschmönstret bekräftar samma sak —
sex organisationer undersökta, och ingen mekaniserar en full CI-replik i en
obligatorisk hook; det enda primärkälle-verifierade pre-push-exemplet
(`rust-lang/rust`) är opt-in och kör EN smal kontroll, inte testsviten.

**Vad som skulle kunna vända beslutet i framtiden** — skrivet ut så att nästa
läsare slipper gissa: en lokal körning som med klassningen mätt hamnar
*väsentligt* under CI:s väggklocka för den vanligaste diff-klassen, OCH ett
belagt behov som CI inte redan täcker. Båda krävs. Enbart "det går nu" räcker
inte — det var aldrig frågan.

`verify:ci-parity` förblir alltså **DoD-disciplin**, precis som typkoll och
Biome: ett verktyg man plockar fram när ändringens klass motiverar det, inte en
mekanism som körs åt en. Det är samma svar denna ADR gav 2026-05-27, med bättre
belägg.
