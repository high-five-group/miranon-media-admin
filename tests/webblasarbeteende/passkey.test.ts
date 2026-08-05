import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Erbjudande-ytan `/passkey` (TASK-127.8, ADR-093 beslut 2) — DATALÖSA
 * beteendetester (ADR-094). Kriteriet (ADR-094 Beslut 2): "har testet ett
 * databeteende att bevisa formen av?" — nej för de två fallen här:
 *
 *   1. Guarden (`beforeLoad`) läser `context.auth.isAuthenticated`, som i
 *      sin tur härleds ur `getSession()` — lokal storage, inget
 *      nätverksanrop (samma grund som `valkommen.test.ts`s egen
 *      topp-kommentar vilar på).
 *   2. Webbläsarstöds-checken (`webblasarenStodjerPasskey()`,
 *      `src/lib/auth/passkey.ts`) är en SYNKRON klient-check. Saknas stödet
 *      görs ALDRIG något nätverksanrop — `probaPasskeyTillganglighet()`
 *      returnerar tidigt (se modulens källkod) — så det finns inget
 *      databeteende att bevisa här heller.
 *
 * ALLT som faktiskt konsumerar ett nätverkssvar (servern har stängt av
 * passkey, kontot har redan en, erbjudandet visas, registrering lyckas/
 * misslyckas) hör hemma i — och bor i — `tests/acceptance/passkey.acceptance.test.ts`.
 *
 * INGEN MSW, INGEN HERMETIK-VAKT (ADR-094 § Beslut 3): klassens
 * definierande egenskap är att den ALDRIG rör nätverket för de scenarier
 * som testas här.
 *
 * MÅLET FÖR "REDIRECT UTAN ERBJUDANDE" är MEDVETET EN LÅG-FETCH-ROUTE
 * (`/mer/installera-appen`, 0 träffar på `useQuery`/`useDataSource`/
 * `callEdgeFunction` i sin källkod och i `AppShell.tsx`) — INTE default
 * `/hem`, som är en datatung dashboard. Ett riktigt navigerings-mål
 * (i stället för en overifierad `waitForURL`-gissning) bevisar att
 * TanStack Routers faktiska routing kör, utan att dra in Airtable-fetchar
 * som hör till en helt annan yta.
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';
const SAKERT_MAL = '/mer/installera-appen';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function bygdSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000098',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'passkey-webblasarbeteende@visual-fixture.se',
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'passkey-webblasarbeteende-test-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'passkey-webblasarbeteende-test-refresh',
    user,
  };
}

function seedaSession(page: Page) {
  return page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, JSON.stringify(session));
    },
    [AUTH_STORAGE_KEY, bygdSession()] as const,
  );
}

function rensaSession(page: Page) {
  return page.addInitScript((key) => {
    window.localStorage.removeItem(key as string);
  }, AUTH_STORAGE_KEY);
}

/** Tar bort webbläsarens WebAuthn-API:er INNAN appens JS körs, så
 * `webblasarenStodjerPasskey()` (synkron check vid mount) ser frånvaron. */
function taBortWebAuthnStod(page: Page) {
  return page.addInitScript(() => {
    // @ts-expect-error — medvetet ta bort en global för att simulera en
    // webbläsare utan WebAuthn-stöd.
    delete window.PublicKeyCredential;
  });
}

test.describe('/passkey — guard: kräver en aktiv session', () => {
  test('ingen session → redirect till /login med redirect-målet bevarat', async ({ page }) => {
    await rensaSession(page);
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    await expect(page).toHaveURL(/\/login\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get('redirect')).toBe(SAKERT_MAL);
    // Aldrig ett flimmer av erbjudande-innehåll för en session som inte
    // finns — guarden kör i beforeLoad, INNAN komponenten hinner mounta.
    await expect(page.getByRole('heading', { name: 'Vill du logga in snabbare' })).toHaveCount(0);
  });
});

test.describe('/passkey — webbläsarstöd saknas → tyst genomsläpp (AC #4)', () => {
  test('WebAuthn-API:er saknas → navigerar direkt till redirect-målet, erbjudandet visas ALDRIG', async ({
    page,
  }) => {
    await seedaSession(page);
    await taBortWebAuthnStod(page);
    await page.goto(`/passkey?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    await expect(page).toHaveURL(new RegExp(`${SAKERT_MAL.replace('/', '\\/')}$`));
    await expect(page.getByRole('heading', { name: 'Vill du logga in snabbare' })).toHaveCount(0);
  });
});
