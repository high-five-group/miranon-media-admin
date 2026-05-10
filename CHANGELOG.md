# Changelog

Alla noterbara ändringar i detta projekt dokumenteras i denna fil.

Format följer [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
och projektet följer [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Pre-Fas-2 publik professionalisering: LICENSE, package.json metadata, .editorconfig, .nvmrc, .vscode/extensions.json, .github/-paketet (CI + dependabot + CODEOWNERS + templates), CHANGELOG, SECURITY, CONTRIBUTING (ADR-024)
- docs/-omstrukturering: docs/specs/, docs/analysis/, docs/reference/, docs/logs/ (ADR-021)
- analys/ flyttad till docs/research/datamodell-research/ (ADR-022)
- tasks/sessions/-arkivering till archive/2026-04/, archive/2026-05/, archive/datamodell-research-2026-04-30/ (ADR-023)

### Changed
- BYGGPLAN-LÄTTLÄST v2 → v3 efter byggplan-revisionen (ADR-025). v2 arkiverad till docs/archive/. Speglar docs/byggplan.md v1.1 (13 fas-prompter inkl. nya Fas A/2.5/3.5/5.5/6a-e/8/B/E).

## [0.1.0] - 2026-05-05

### Added
- `docs/byggplan.md` v1.1 (832 rader, 13 fas-prompter) som styrande plan för Fas 2+ (P3a)
- 10 ADR:er ADR-011..ADR-020 (P3a)
- `docs/BUILD-LOG.md` retrospektivt komplett — Fas A M1–M8 + P0/P1/P2/P3a/P3b (P3b)
- 7 UNIVERSAL-poster lyfta till `marcus-system/tasks/lessons.md` (P3b)
- Fas A — security hardening: klient-DSN, två-stegs auth-check, test-prefix-konvention, operations-baserad API, INVARIANT-mönster, structured JSON-loggning, M1–M8 (14 commits)
- Fas 1 — domäntransplant från Vue-referensen (10 domain-filer + 4 data-filer + utilities)
- Fas 0 — projektinitiering: Vite + React 19 + TanStack Router/Query/Table + Tailwind v4 + Biome 2.0 + Supabase
- 10 ADR:er ADR-001..ADR-010 (Fas 0+1)
- 113 tester (72 körda lokalt + 41 staging-only-skipped)
- Lighthouse-baseline: 86 / 100 / 96 / 82 (production)

### Changed
- `conversion-plan.md` ersatt av `byggplan.md` (ADR-012)

### Archived
- `docs/conversion-plan.md` → `docs/archive/conversion-plan-2026-04-14.md` (ADR-012)

[Unreleased]: https://github.com/marcus803/miranon-media-admin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/marcus803/miranon-media-admin/releases/tag/v0.1.0
