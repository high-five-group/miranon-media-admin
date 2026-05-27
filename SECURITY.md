# Säkerhetspolicy

Detta är ett **privat projekt**. Säkerhetsfynd eller misstankar om sårbarheter
ska rapporteras direkt till repots ägare, **inte via GitHub Issues** eller
publika kanaler.

## Rapportering

Skicka detaljer privat till repots ägare (se `.github/CODEOWNERS`). Inkludera:

- Beskrivning av sårbarheten
- Steg för reproduktion (om relevant)
- Bedömning av impact (vilka data eller flöden påverkas)
- Förslag på åtgärd om du har en

Ägaren bekräftar mottagning inom 7 dagar och kommunicerar därefter åtgärdsplan
direkt med rapportören.

## Scope

Sårbarheter inom följande omfattning behandlas som säkerhetsfynd:

- `src/` — applikationskod (auth-flöden, datahantering, render)
- `supabase/functions/` — Edge Functions
- `package.json` / `package-lock.json` — dependencies
- `.github/workflows/` — CI/CD-konfiguration
- `.env.example` / `.env.test.example` — exempelvariabler (faktiska secrets är gitignored)

Utanför scope:

- Sociala-medier-integrationer (hanteras av Miranon Media direkt)
- Airtable-bas-konfiguration (separat security-domän, dokumenterad i `docs/specs/SECURITY-SPEC.md` §4)
- Tredjeparts-tjänster (Resend, ScreenshotOne, Plausible)

## Stödjande dokumentation

- [`docs/specs/SECURITY-SPEC.md`](docs/specs/SECURITY-SPEC.md) — säkerhetsstandarden detta projekt följer
- [`docs/decisions/`](docs/decisions/) — säkerhetsrelaterade ADR:er (sök efter "security" eller "auth" i ADR-titlar)
- [`tasks/sessions/`](tasks/sessions/) — sessions-trail där säkerhetsbeslut diskuterats (Fas A — security hardening, 2026-05-04)

## Säker utveckling

CI (`.github/workflows/ci.yml`) kör `npx @biomejs/biome check .`, `npm run typecheck`,
`npm run test:api` och `npm run build` på varje pull request mot `main`.
Dependabot (`.github/dependabot.yml`) övervakar dependencies veckovis.
