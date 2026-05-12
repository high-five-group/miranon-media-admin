# playwright/.auth/

Playwright auth-state cache. Innehållet (`user.json`) genereras av
`tests/e2e/auth.setup.ts` vid varje testrun och innehåller Supabase
session-tokens + cookies för TEST_USER.

## Disciplin (Kandidat 34 aldrig-läcka, K0åc.2-förlängning)

- **`user.json` är `.gitignored`** — innehåller session-tokens som aldrig får
  läcka till git-historiken.
- **`.gitkeep` + denna `README.md`** bevarar mapp-strukturen i repo utan att
  innehållet committas.
- **Auto-genererad vid setup-step** — kör `npx playwright test --project=setup`
  lokalt eller via CI (kräver `TEST_USER_EMAIL` + `TEST_USER_PASSWORD` env-vars
  satta lokalt i `.env.test` eller på CI via GitHub Actions Secrets).

## Återanvändning

`playwright.config.ts` har projekt `chromium-authenticated` med:

```typescript
dependencies: ['setup'],
use: {
  storageState: 'playwright/.auth/user.json',
}
```

Setup-steget körs en gång per testrun, övriga e2e-tester startar autentiserade.

## Vid manuell debugging

Om `user.json` blir korrupt eller utgången:
```bash
rm playwright/.auth/user.json
npx playwright test --project=setup
```

## Spårbarhet

Skapad i K4.2 (Fas 2 Session 5). Se `tasks/sessions/2026-05-11-fas2-routing-auth.md`
för full kontext.
