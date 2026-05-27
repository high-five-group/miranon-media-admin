# ADR-001: Biome 2.0 över ESLint + Stylelint + Prettier

- **Status:** Accepted
- **Datum:** 2026-04-14
- **Fas:** 0

> **Korrigering (ADR-036, 2026-05-27):** Påståendena nedan att en pre-commit-hook kör `biome check . && tsc --noEmit` (Beslut, Konsekvenser "Pre-commit kör …", Följdbeslut) är felaktiga. `hooks.pre-commit` i `.claude/settings.json` var dead config och kördes aldrig vid commit — empiriskt bevisat Session 7 K0.1b (en fil med `debugger;` committades rent). CI är den mekaniska kvalitetsgrinden; lokal kvalitet vilar på DoD-disciplin. Se [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md). Beslutstexten nedan bevaras oförändrad (immutabilitet).

## Kontext

Fas 0 behövde etablera lint- och formateringsverktyg för ett React 19 + TypeScript + Tailwind v4-projekt. Det klassiska valet i React-världen är en kombination av tre separata verktyg:

- **ESLint** för JavaScript/TypeScript-linting
- **Stylelint** för CSS-linting
- **Prettier** för formatering

Varje verktyg har egen config-fil, egen pre-commit-hook, egen CI-integration och egen update-cadence. Initial gap-analysen av conversion-plan vs research (`docs/logs/gap-analysis.md` §7) identifierade detta som teknisk skuld redan innan projektet startade — research från `docs/research/react-stack-research.md` och `docs/research/beyond-best-practices-2026.md` pekade mot Biome 2.0 som branschens nya standard.

## Beslut

Använd **Biome 2.0** som enda lint/format-verktyg för hela projektet:

- Ett verktyg, en config (`biome.json`)
- En pre-commit-hook (`biome check && tsc --noEmit`)
- CSS-linting inbyggt (ersätter Stylelint)
- Format-regler inbyggda (ersätter Prettier)
- Built-in `useSortedClasses` för Tailwind class-sortering

Prompten till Fas 0 specificerade redan Biome och markerade dependencien med `[GA]` (Gap-Analys-tillägg från `gap-analysis.md` §7).

## Alternativ som övervägdes

### 1. ESLint + Stylelint + Prettier (branschens tidigare standard)

- **Fördelar:** Ekosystem med tusentals plugins, stabilitet, alla kan det.
- **Nackdelar:** Tre separata verktyg, tre configs, tre update-cadenser, 65× långsammare lint-körningar (Biome är skriven i Rust, ESLint i JavaScript — se `docs/research/beyond-best-practices-2026.md`). ESLint 9:s flat-config-migration ligger i limbo för många plugins. Stylelints Tailwind-stöd är begränsat.

### 2. Rolldown/Oxlint (Rust-baserad lint, Rolldown-teamet)

- **Fördelar:** Ännu snabbare än Biome på vissa benchmarks.
- **Nackdelar:** Inte mogen — 2026-04 är Oxlint fortfarande i beta, ingen CSS-linting, ingen format-support.

## Konsekvenser

**Positivt:**

- En config-fil (`biome.json`) styr hela kedjan
- Pre-commit kör `biome check . && tsc --noEmit` på millisekunder
- `biome check --write` fixar både lint och formatering på en körning
- CSS-linting via Biomes egen parser (med `tailwindDirectives: true` för `@theme`-stöd)
- `useSortedClasses` sorterar Tailwind-klasser automatiskt i `className`/`cn`/`clsx`/`twMerge`-anrop

**Negativt:**

- Mindre ekosystem av plugins än ESLint
- Vissa specialregler finns inte (t.ex. `no-hardcoded-colors` i CSS planeras i Fas 7 som custom GritQL-plugin)
- Biomes CSS-parser är strikt — den avvisade `--p-space-0.5` (se [ADR-003](ADR-003-css-custom-property-naming.md))
- Biomes Deno-okunskap tvingade oss att exkludera `supabase/functions/` (se [ADR-010](ADR-010-biome-exclude-deno-edge-functions.md))

**Följdbeslut som denna ADR möjliggjorde:**

- Pre-commit-hook i `.claude/settings.json` körs utan beroende på nodsamstämmighet mellan tre verktyg
- Biome-version pinnas i `$schema`-fältet (`https://biomejs.dev/schemas/2.4.11/schema.json`) vilket ger IDE-autocomplete för config

## Referenser

- `docs/research/beyond-best-practices-2026.md` — research-rekommendation
- `docs/logs/gap-analysis.md` §7 — motiveringen för `[GA]`-markeringen
- `biome.json` — den faktiska konfigurationen
- [BUILD-LOG.md](../BUILD-LOG.md) Session 31, Fas 0 — installationen
