import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { HttpResponse, http } from 'msw';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { expect, test } from './support/acceptance-bas';

/**
 * Sätt-nytt-lösenord-sidan `/nytt-losenord` (TASK-127.7, ADR-093) —
 * DATABEROENDE tester, samma gräns/motivering som
 * `tests/acceptance/valkommen.acceptance.test.ts` (TASK-127.6, gott
 * föredöme för denna delning): att sidan renderar och beter sig rätt GIVET
 * ETT SVAR AV RÄTT FORM från HIBP-kontrollen (`api.pwnedpasswords.com`) och
 * Supabase Auth (`updateUser`/`signOut`).
 *
 * Sessionen seedas direkt i localStorage, INTE via hash-fragment-simulering
 * — se `src/routes/nytt-losenord.tsx`s topp-kommentar. `expiresAt` härlett
 * ur `FROZEN_NOW` (fixturvärldens frusna klocka), samma skäl som
 * `valkommen.acceptance.test.ts`s `bygdSession()`: en `Date.now()`-baserad
 * utgång landar veckor FÖRE den frusna klockan och tvingar supabase-js att
 * försöka refresha sessionen mot nätet, vilket hermetik-vakten fäller.
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';
const PWNED_RANGE_PATTERN = 'https://api.pwnedpasswords.com/range/*';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function bygdSession(overrides: { email?: string } = {}) {
  const epost = overrides.email ?? 'lotta@visual-fixture.se';
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
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

function seedaRecoverySession(page: Page) {
  return page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, JSON.stringify(session));
    },
    [AUTH_STORAGE_KEY, bygdSession()] as const,
  );
}

function mockLyckadSparning(network: NetworkFixture) {
  network.use(
    http.get(
      PWNED_RANGE_PATTERN,
      () => new HttpResponse('0000000000000000000000000000000:0', { status: 200 }),
    ),
    http.put('*/auth/v1/user', () =>
      HttpResponse.json({
        id: '00000000-0000-4000-8000-000000000098',
        email: 'lotta@visual-fixture.se',
        app_metadata: { role: 'admin' },
      }),
    ),
    http.post('*/auth/v1/logout*', () => new HttpResponse(null, { status: 204 })),
  );
}

test.describe('/nytt-losenord — lösenordsgolvet mot en riktig HIBP-kontroll (AC #3)', () => {
  test('läckt lösenord (HIBP-träff) → blockeras med vänligt meddelande, updateUser anropas ALDRIG', async ({
    page,
    network,
  }) => {
    await seedaRecoverySession(page);
    network.use(
      http.get(PWNED_RANGE_PATTERN, async ({ request }) => {
        const { createHash } = await import('node:crypto');
        const hash = createHash('sha1').update('EttOsakertLosenord123').digest('hex').toUpperCase();
        const url = new URL(request.url);
        const prefix = url.pathname.split('/').pop();
        if (hash.slice(0, 5) !== prefix) {
          return new HttpResponse('0000000000000000000000000000000:0', { status: 200 });
        }
        return new HttpResponse(`${hash.slice(5)}:42`, { status: 200 });
      }),
      // MEDVETET ingen handler för updateUser — hermetik-vakten fäller
      // testet om koden ändå anropar det.
    );
    await page.goto('/nytt-losenord');

    await page.getByLabel('Nytt lösenord').fill('EttOsakertLosenord123');
    await page.getByRole('button', { name: 'Spara nytt lösenord' }).click();

    const fel = page.getByRole('alert');
    await expect(fel).toContainText('dataintrång');
  });

  test('lyckad path: giltigt lösenord → sparas, sessionen loggas ut, ETT medvetet inloggningssteg erbjuds', async ({
    page,
    network,
  }) => {
    await seedaRecoverySession(page);
    mockLyckadSparning(network);
    await page.goto('/nytt-losenord');

    await page.getByLabel('Nytt lösenord').fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await page.getByRole('button', { name: 'Spara nytt lösenord' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Lösenordet är sparat' }),
    ).toBeVisible();
    const lank = page.getByRole('link', { name: 'Logga in' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/login');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('updateUser misslyckas (5xx, generiskt fel) → vänligt felmeddelande, formuläret kvarstår ifyllbart', async ({
    page,
    network,
  }) => {
    await seedaRecoverySession(page);
    network.use(
      http.get(
        PWNED_RANGE_PATTERN,
        () => new HttpResponse('0000000000000000000000000000000:0', { status: 200 }),
      ),
      http.put('*/auth/v1/user', () =>
        HttpResponse.json(
          { code: 500, error_code: 'unexpected_failure', msg: 'x' },
          { status: 500 },
        ),
      ),
    );
    await page.goto('/nytt-losenord');

    await page.getByLabel('Nytt lösenord').fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await page.getByRole('button', { name: 'Spara nytt lösenord' }).click();

    // Exakt sträng (TASK-285.8, copy-domarna § 5/§ 7.3, AC #4) — inte bara en
    // delsträng: den tidigare "Något gick fel ... Försök igen" faller på
    // GOV.UK/NN/g (huvudsatsen bär ingen orsak); ersättningen namnger
    // problemet specifikt och behåller en genuint hållbar uppmaning.
    await expect(page.getByRole('alert')).toContainText(
      'Lösenordet kunde inte sparas just nu. Försök igen om en liten stund.',
    );
    await expect(page.getByRole('button', { name: 'Spara nytt lösenord' })).toBeVisible();
  });

  test('updateUser misslyckas med session_expired (token gick ut mitt i flödet) → samma vänliga felläge som en direkt ogiltig länk (AC #2)', async ({
    page,
    network,
  }) => {
    await seedaRecoverySession(page);
    network.use(
      http.get(
        PWNED_RANGE_PATTERN,
        () => new HttpResponse('0000000000000000000000000000000:0', { status: 200 }),
      ),
      http.put('*/auth/v1/user', () =>
        HttpResponse.json(
          { code: 401, error_code: 'session_expired', msg: 'Session expired' },
          { status: 401 },
        ),
      ),
    );
    await page.goto('/nytt-losenord');

    await page.getByLabel('Nytt lösenord').fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await page.getByRole('button', { name: 'Spara nytt lösenord' }).click();

    await expect(
      page.getByRole('heading', { level: 1, name: 'Länken fungerar inte längre' }),
    ).toBeVisible();
  });
});
