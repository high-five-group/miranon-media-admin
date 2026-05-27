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
