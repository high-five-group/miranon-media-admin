import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Sätt-nytt-lösenord-sidan `/nytt-losenord` (TASK-127.7, ADR-093) — DATALÖSA
 * beteendetester (ADR-094), samma gräns TASK-127.6 drog för `/valkommen`:
 * `getSession()` läser lokal storage utan nätverksanrop, så en session kan
 * seedas och läsas helt utan fixturvärld. De tester som FAKTISKT konsumerar
 * ett mockat nätverkssvar (HIBP-träff, updateUser, signOut) hör hemma i —
 * och bor i — `tests/acceptance/nytt-losenord.acceptance.test.ts`.
 *
 * Session-seedningen (nyckel, JWT-form) är EN-TILL-EN med
 * `tests/webblasarbeteende/valkommen.test.ts`s egen — duplicerad hit
 * medvetet, samma konvention som acceptance-/webblasarbeteende-syskonparen
 * redan följer (varje testfil äger sin egen kopia, ingen delad testhjälp-modul).
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function bygdSession(overrides: { email?: string } = {}) {
  const epost = overrides.email ?? 'lotta@visual-fixture.se';
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000098',
    aud: 'authenticated',
    role: 'authenticated',
    email: epost,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], role: 'admin' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'nytt-losenord-test-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'nytt-losenord-test-refresh',
    user,
  };
}

function seedaRecoverySession(page: Page, overrides: { email?: string } = {}) {
  return page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, JSON.stringify(session));
    },
    [AUTH_STORAGE_KEY, bygdSession(overrides)] as const,
  );
}

function rensaSession(page: Page) {
  return page.addInitScript((key) => {
    window.localStorage.removeItem(key as string);
  }, AUTH_STORAGE_KEY);
}

test.describe('/nytt-losenord — ogiltig, förbrukad eller obefintlig länk (AC #2)', () => {
  test('ingen session → vänligt felläge, ingen rå felkod, väg framåt till en NY länk', async ({
    page,
  }) => {
    await rensaSession(page);
    await page.goto('/nytt-losenord');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Länken fungerar inte längre' }),
    ).toBeVisible();
    // Enumeration-neutralt: ingen orsak anges.
    await expect(page.getByText(/utgången|expired|error_code|invalid/i)).toHaveCount(0);
    // Självbetjäningsväg (skiljer sig från valkommen.tsx:s motsvarighet, se
    // routens docblock): CTA till /glomt-losenord, inte /login.
    const lank = page.getByRole('link', { name: 'Begär en ny länk' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/glomt-losenord');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('/nytt-losenord — formuläret (AC #3)', () => {
  test('e-post förifylld och OREDIGERBAR ur sessionens e-postadress', async ({ page }) => {
    await seedaRecoverySession(page, { email: 'roger@visual-fixture.se' });
    await page.goto('/nytt-losenord');

    await expect(page.getByRole('heading', { level: 1, name: 'Sätt nytt lösenord' })).toBeVisible();
    const emailFalt = page.getByLabel('E-postadress');
    await expect(emailFalt).toHaveValue('roger@visual-fixture.se');
    await expect(emailFalt).toHaveAttribute('readonly', '');
  });

  test('lösenord under 8 tecken → vänligt felmeddelande, INGET nätverksanrop görs', async ({
    page,
  }) => {
    // Matchningen går på PARSAD hostname + pathname, aldrig på substräng i den
    // råa URL:en. `url.includes('pwnedpasswords.com')` fälls av CodeQL
    // (js/incomplete-url-substring-sanitization, high) eftersom värden kan stå
    // var som helst i en URL — `https://elak.example/?x=pwnedpasswords.com`
    // matchar. Här är det visserligen en OBSERVATION och inte en grind, så
    // sårbarhetsklassen gäller inte i sak; formen rättas ändå, eftersom ett
    // exakt värdnamnstest är strikt mer precist och en undertryckt varning
    // hade lärt nästa läsare fel mönster.
    const natverksanrop: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      let parsad: URL;
      try {
        parsad = new URL(url);
      } catch {
        return; // ogiltig URL kan per definition inte vara något av målen
      }
      const arHibp = parsad.hostname === 'api.pwnedpasswords.com';
      const arAuthUser = parsad.pathname === '/auth/v1/user';
      if (arHibp || arAuthUser) {
        natverksanrop.push(url);
      }
    });

    await seedaRecoverySession(page);
    await page.goto('/nytt-losenord');

    await page.getByLabel('Nytt lösenord').fill('kort1');
    await page.getByRole('button', { name: 'Spara nytt lösenord' }).click();

    const fel = page.getByRole('alert');
    await expect(fel).toContainText('minst 8 tecken');
    expect(natverksanrop).toHaveLength(0);
  });

  test('visa/dölj lösenord växlar fältets type och knappens etikett', async ({ page }) => {
    await seedaRecoverySession(page);
    await page.goto('/nytt-losenord');

    const losenordFalt = page.getByLabel('Nytt lösenord');
    await expect(losenordFalt).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Visa lösenord' }).click();
    await expect(losenordFalt).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Dölj lösenord' }).click();
    await expect(losenordFalt).toHaveAttribute('type', 'password');
  });

  test('axe 0 violations på formulär-tillståndet', async ({ page }) => {
    await seedaRecoverySession(page);
    await page.goto('/nytt-losenord');
    await expect(page.getByRole('heading', { level: 1, name: 'Sätt nytt lösenord' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
