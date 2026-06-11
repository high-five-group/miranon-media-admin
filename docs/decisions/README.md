---
owner: marcus803
updated: 2026-06-11
review_by: 2026-11-15
status: stable
---


# Architecture Decision Records

Denna mapp innehåller Architecture Decision Records (ADR) för Miranon Media Admin — ett kort, permanent spår av **varför** tekniska val gjordes så att framtida läsare (inklusive framtida jag) förstår kontexten bakom koden.

## Format

Varje ADR följer samma struktur:

```text
# ADR-NNN: [Titel]
- Status: Accepted | Superseded | Deprecated
- Datum: YYYY-MM-DD
- Fas: 0 | 1 | ...
- Kontext: Varför frågan uppstod
- Beslut: Vad vi valde
- Alternativ som övervägdes: Vad vi INTE valde och varför
- Konsekvenser: Vad beslutet innebär framåt
```

En ADR är **oföränderlig** efter att den accepterats. Om ett beslut senare ändras skrivs en ny ADR som `Supersedes ADR-NNN`, och den gamla markeras `Superseded by ADR-MMM`.

### Korrigering vs supersedering

Oföränderligheten justeras via en av två mekanismer beroende på omfattning:

- **Additiv korrigerings-not** — när ADR:ns kärnbeslut STÅR men en avgränsad punkt visat sig felaktig eller inaktuell. En blockquote läggs direkt efter header-blocket (efter `- Fas: …`-raden): `> **Korrigering (<källa>, <datum>):** <vad som korrigeras>. Se <pekare>. Beslutstexten nedan bevaras oförändrad (immutabilitet).` Källan/pekaren är den korrigerande ADR:n (ADR-MMM) eller — för errata utan ny ADR — sessionen/committen som gjorde rättelsen. Ursprungstexten rörs ALDRIG. Precedens: ADR-001 + ADR-010 (korrigerade av ADR-036, Session 7 K0.1c); ADR-030 (fetch-depth-erratum, Session 7 K0.S2).
- **Superseded by** — när beslutet i grunden ersätts eller ogiltigförklaras. En ny ADR skrivs som `Supersedes ADR-NNN`; den gamla markeras `Superseded by ADR-MMM`.

Kriterium: en avgränsad punkt korrigeras medan beslutet kvarstår → additiv not; beslutet ersätts i grunden → supersedering.

## Index

| Nr | Titel | Status | Fas |
|----|-------|--------|-----|
| [ADR-001](ADR-001-biome-over-eslint-stylelint-prettier.md) | Biome 2.0 över ESLint + Stylelint + Prettier | Accepted | 0 |
| [ADR-002](ADR-002-tailwind-v4-theme-css-first.md) | Tailwind v4 `@theme` CSS-first (ingen `tailwind.config.ts`) | Accepted | 0 |
| [ADR-003](ADR-003-css-custom-property-naming.md) | CSS custom property-namnkonvention (bindestreck, inga perioder) | Accepted | 0 |
| [ADR-004](ADR-004-typescript-baseurl-removal.md) | TypeScript `baseUrl` proaktiv borttagning | Accepted | 0 |
| [ADR-005](ADR-005-zod-parallell-definitions.md) | Zod parallella definitioner (schema bredvid interface) | Accepted | 1 |
| [ADR-006](ADR-006-fetch-with-retry-infrastructure.md) | `fetchWithRetry` på infrastrukturnivå (i `callEdgeFunction`) | Accepted | 1 |
| [ADR-007](ADR-007-event-name-collision-deferred-aliasing.md) | `Event`-namnkollision — uppskjuten aliasering per fil | Accepted | 1 |
| [ADR-008](ADR-008-file-inventory-selective-run.md) | FILE-INVENTORY selektiv körning (skydda Fas 0-filer) | Accepted | 1 |
| [ADR-009](ADR-009-supabase-client-env-consolidation.md) | `supabase-client.ts` env-konsolidering via `@/env` | Accepted | 1 |
| [ADR-010](ADR-010-biome-exclude-deno-edge-functions.md) | Biome-exkludering för Deno Edge Functions | Accepted | 1 |
| [ADR-011](ADR-011-csp-plugin-deferral.md) | CSP-nonce-plugin uppskjuten från Fas 0 till Fas 7 | Accepted | 0 |
| [ADR-012](ADR-012-conversion-plan-ersatt-av-byggplan.md) | `conversion-plan.md` ersatt av `byggplan.md` | Accepted | Meta |
| [ADR-013](ADR-013-fas-4-borttagningen.md) | Fas 4 borttagen — DataTable till Fas 7 | Accepted | Meta |
| [ADR-014](ADR-014-create-registration-idempotency.md) | `create-registration` måste vara idempotent | Accepted | 6c |
| [ADR-015](ADR-015-send-email-direct-resend.md) | `send-email` direkt Resend-anrop — medveten skuld | Accepted | 6e |
| [ADR-016](ADR-016-tanstack-optimistic-mutation-pattern.md) | TanStack optimistic mutation-mönster | Accepted | 5.5 |
| [ADR-017](ADR-017-polling-vs-realtime.md) | Hybrid polling 60s, Realtime till Fas E | Accepted | 6d |
| [ADR-018](ADR-018-fas-5-forenkling.md) | Fas 5 selektivt förenklad — 4 [GA] till Fas 7 | Accepted | 5 |
| [ADR-019](ADR-019-background-sync-defer.md) | Background Sync defer från Fas 7 till Fas 8 | Accepted | 8 |
| [ADR-020](ADR-020-fas-3-5-egen-fas.md) | Fas 3.5 = egen fas (a11y-baseline) | Accepted | 3.5 |
| [ADR-021](ADR-021-docs-omstrukturering.md) | docs/-omstrukturering till specs/analysis/reference/logs/ | Accepted | Pre-Fas-2 |
| [ADR-022](ADR-022-analys-flyttat-till-docs-research.md) | analys/ flyttat till docs/research/datamodell-research/ | Accepted | Pre-Fas-2 |
| [ADR-023](ADR-023-sessions-arkivering.md) | tasks/sessions/-arkivering med datum-baserad strategi | Accepted | Pre-Fas-2 |
<!-- vale Vale.Terms = NO -->
<!-- L_X.1 IL-mitigation per ADR-032 § L_X.1 vs L_X.2-distinktion: Vale.Terms canonical-substitution (github → GitHub) skulle flagga `.github/`-token i ADR-024-titelraden om disable togs bort. IL-disable är tillförlitlig mitigation för L_X.1-klass (inline lookbehind/lookahead-pattern fungerar via IL), vs L_X.2 som kräver helfil-disable per ADR-032. Empiriskt verifierat i K3.6 Block I.2 Skuld 4: temp-fil utan disable → 1 Vale.Terms error rad 57. -->
| [ADR-024](ADR-024-publika-professionalitetssignaler.md) | Publika professionalitetssignaler — LICENSE, package.json, .github/, top-level docs | Accepted | Pre-Fas-2 |
<!-- vale Vale.Terms = YES -->
| [ADR-025](ADR-025-byggplan-lattlast-v2-till-v3.md) | BYGGPLAN-LÄTTLÄST v2 → v3 (revision efter byggplan-revisionen) | Accepted | Pre-Fas-2 |
| [ADR-026](ADR-026-runtime-validering-vid-datagrans.md) | Runtime-validering vid datagräns med Zod `.parse()` | Accepted | 2 |
| [ADR-027](ADR-027-kvalitetsdefinitioner-stack-skifte.md) | KVALITETSDEFINITIONER-11.md stack-skifte (Vue → React) | Accepted | 2 |
| [ADR-028](ADR-028-supply-chain-incident-respons.md) | Supply chain incident-respons-protokoll (npm advisories) | Accepted | 2 |
| [ADR-029](ADR-029-ci-architektur-changed-files-pattern.md) | CI-arkitektur — changed-files-baserat skip-mönster + third-party Actions-policy | Accepted | Meta |
| [ADR-030](ADR-030-docs-grindvakter-frontmatter-policy.md) | Docs-grindvakter + frontmatter-policy (5 grindvakter + 4-fält-frontmatter på styrande docs) | Accepted | Meta |
| [ADR-031](ADR-031-dependabot-strategi-2026.md) | Dependabot-strategi 2026 — grouping, cooldown, minimal CI-yta, manuell review | Accepted | Meta |
| [ADR-032](ADR-032-vale-lazy-continuation-helfil-disable.md) | Vale L_X.2 lazy-continuation-quirk — helfil-disable som formaliserad mitigation | Accepted | Meta |
| [ADR-033](ADR-033-shellcheck-strict-grindvakt.md) | Shellcheck-strict-grindvakt för bash-scripts | Accepted | Meta |
| [ADR-034](ADR-034-skill-arkitektur.md) | Skill-arkitektur — hub/projekt-skills + Agent Skills-standard | Accepted | Meta |
| [ADR-035](ADR-035-plugin-aktivering-user-scope.md) | marcus-system-plugin aktiveras via user-scope install-record (scope-migrering övergiven; #38271) | Accepted | Meta |
| [ADR-036](ADR-036-kvalitetsgrind-ci-enda-mekaniska-enforcement.md) | Kvalitetsgrind — CI enda mekaniska enforcement (pre-commit-grind var dead config; korrigerar ADR-001 + ADR-010) | Accepted | Meta |
| [ADR-037](ADR-037-auth-resolution-render-gate.md) | Auth-resolution render-gate (mount-gate + guardad invalidate; stänger Fynd 2 + 3 + index.tsx-vektorn) | Accepted | 2 |
| [ADR-038](ADR-038-router-fel-defaultErrorComponent.md) | Router-fel-fångst via defaultErrorComponent (branded fallback inkl. root-route; stänger Fynd 4) | Accepted | 2 |
| [ADR-039](ADR-039-konsistens-grindar-kadens.md) | Konsistens-grindar i CI — kadens-principen + lesson→grind-principen (per-push ADR-count + fetch-depth-invariant) | Accepted | Meta |
| [ADR-040](ADR-040-sessions-numreringskonvention.md) | Sessions-numreringskonvention — sekventiella heltal (inga decimaler; faser separat axel; historik grandfathrad) | Accepted | Meta |
| [ADR-041](ADR-041-session-end-do-confirm-roll.md) | session-end:s roll — do-confirm-verifiering, inte read-do-motor (omdefinierar ADR-034:s skill-mekanik; tre-lagers-kadens med ADR-039) | Accepted | Meta |
| [ADR-042](ADR-042-code-roll-disciplin-alltid-pa.md) | Code-roll-disciplin alltid-på via template, inte skill — falsifierar Session 9-handoffens "egen skill" mot ADR-034 p.8 + K8 | Accepted | Meta |
| [ADR-043](ADR-043-session-lifecycle-skills-arkitektur.md) | Session-lifecycle som två-ytors skill-par (Chat + Code) + Project Instructions bas/delta-mall; ger Chat-ytan lifecycle-mekanism utan discovery-beroende | Accepted | Meta |
| [ADR-044](ADR-044-react-aria-components-demo-route.md) | react-aria-components som primitiv-bas (hooks = per-komponent-reservutgång) + demo-route `/dev/primitives` i stället för Storybook | Accepted | 3 |
| [ADR-045](ADR-045-a11y-runner-arkitektur.md) | A11y-runner-arkitektur — CI-måltavla `/dev/primitives` via webServer-dev-server, 0 violations kanonisk tolerans, `test:a11y` i Test+Build-sfären | Accepted | 3.5 |

## Relaterade dokument

- [BUILD-LOG.md](../BUILD-LOG.md) — kronologisk implementation journal som refererar dessa ADR:er
- [conversion-plan.md](../archive/conversion-plan-2026-04-14.md) — fas-för-fas-planen
- [gap-analysis.md](../logs/gap-analysis.md) — gap-analys mellan conversion-plan och research
- [../tasks/lessons.md](../../tasks/lessons.md) — universella lärdomar som uppstått under implementation
