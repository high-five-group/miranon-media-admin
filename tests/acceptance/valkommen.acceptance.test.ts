import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { HttpResponse, http } from 'msw';
import { FROZEN_NOW } from '../support/fixturvarld/fixture-data';
import { expect, test } from './support/acceptance-bas';

/**
 * Accept-sidan `/valkommen` (TASK-127.6, ADR-092/ADR-093) — DATABEROENDE
 * tester: att sidan renderar och beter sig rätt GIVET ETT SVAR AV RÄTT FORM
 * från HIBP-kontrollen (`api.pwnedpasswords.com`) och Supabase Auth
 * (`updateUser`/`signOut`). Detta är den enda delen av sidans testyta som
 * hör hemma i acceptance-klassen (ADR-094 Beslut 2: "har testet ett
 * databeteende att bevisa formen av?").
 *
 * DE STATISKA/KLIENT-ENDA TILLSTÅNDEN (ogiltig länk, e-post-readonly,
 * kort-lösenord-valideringen, visa/dölj, TTL-fotnoten, axe-scan på
 * formulär-tillståndet, GRÄNSEN-scrollmätningarna) FLYTTADE UT i ett
 * EGET, RÖTT `hermetik-sjalvtest.mjs`-varv: `getSession()` läser lokal
 * storage utan nätverksanrop, så de testerna överlevde ett tömt
 * normalläge — ett hermetik-brott (ADR-080 beslut 3), inte en
 * hermetik-BEVISNING. De bor nu i
 * `tests/webblasarbeteende/valkommen.test.ts` (ADR-094), som INTE hänger
 * på fixturvärlden och därför inte ska bevisas hänga på den.
 *
 * SESSIONEN SEEDAS DIREKT I localStorage, INTE VIA HASH-FRAGMENT-
 * SIMULERING — se `src/routes/valkommen.tsx`s topp-kommentar för det fulla
 * Supabase-dokumentationsresonemanget. `AUTH_STORAGE_KEY` duplicerad
 * medvetet ur `hermetic.ts`s privata konstant (samma skäl som
 * webblasarbeteende-syskonfilen).
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';
const PWNED_RANGE_PATTERN = 'https://api.pwnedpasswords.com/range/*';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** `expiresAt` HÄRLETT UR `FROZEN_NOW`, INTE `Date.now()` (fångat skarpt
 * av ett rött första körvarv): fixturvärlden fryser SIDANS klocka till
 * `FROZEN_NOW` (2026-09-15, se `hermetic.ts`), men denna funktion körs i
 * Node-processen — en `Date.now()`-baserad utgång landar på dagens
 * verkliga datum, veckor FÖRE den frusna klockan, så supabase-js läser
 * sessionen som redan utgången och försöker refresha den mot nätet
 * (`POST .../auth/v1/token?grant_type=refresh_token`), vilket hermetik-
 * vakten fäller. Samma härledning som `hermetic.ts`s egen `buildSession()`. */
function bygdSession(overrides: { email?: string; role?: string } = {}) {
  const epost = overrides.email ?? 'ny.anvandare@visual-fixture.se';
  const expiresAt = Math.floor(FROZEN_NOW.getTime() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000099',
    aud: 'authenticated',
    role: 'authenticated',
    email: epost,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], role: overrides.role ?? 'admin' },
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const accessToken = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email: user.email, role: 'authenticated', exp: expiresAt }),
    'valkommen-test-signatur',
  ].join('.');
  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 24 * 60 * 60,
    expires_at: expiresAt,
    refresh_token: 'valkommen-test-refresh',
    user,
  };
}

function seedaInviteSession(page: Page) {
  return page.addInitScript(
    ([key, session]) => {
      window.localStorage.setItem(key as string, JSON.stringify(session));
    },
    [AUTH_STORAGE_KEY, bygdSession()] as const,
  );
}

/** Normalläget för `updateUser`/`signOut`/pwnedpasswords-anropen — ett
 * lyckat, obrutet varv. Enskilda tester överskuggar delar via
 * `network.use()` för att pröva avvikande grenar (samma mönster som
 * `hem.acceptance.test.ts`s `mock()`-hjälpare). */
function mockLyckadSparning(network: NetworkFixture) {
  network.use(
    http.get(
      PWNED_RANGE_PATTERN,
      () => new HttpResponse('0000000000000000000000000000000:0', { status: 200 }),
    ),
    http.put('*/auth/v1/user', () =>
      HttpResponse.json({
        id: '00000000-0000-4000-8000-000000000099',
        email: 'ny.anvandare@visual-fixture.se',
        app_metadata: { role: 'admin' },
      }),
    ),
    http.post('*/auth/v1/logout*', () => new HttpResponse(null, { status: 204 })),
  );
}

test.describe('/valkommen — lösenordsgolvet mot en riktig HIBP-kontroll (AC #2)', () => {
  test('läckt lösenord (HIBP-träff) → blockeras med vänligt meddelande, updateUser anropas ALDRIG', async ({
    page,
    network,
  }) => {
    await seedaInviteSession(page);
    // Prefixet spelar ingen roll: handlern matchar VARJE range-anrop och
    // svarar med en post som per konstruktion matchar suffixet för LÖSENORDET
    // TESTET SKRIVER (beräknat lokalt här, samma SHA-1 klienten själv kör) —
    // testet styr alltså om SVARET innehåller en träff, inte vilket lösenord
    // som skrivs.
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
      // testet om koden ändå anropar det, vilket bevisar att breach-grenen
      // verkligen short-circuitar FÖRE updateUser.
    );
    await page.goto('/valkommen');

    await page.getByLabel('Lösenord').fill('EttOsakertLosenord123');
    await page.getByRole('button', { name: 'Skapa mitt konto' }).click();

    const fel = page.getByRole('alert');
    await expect(fel).toContainText('dataintrång');
  });

  test('fel → rätt-sekvensen (byggkravet ur TASK-127.2): ett rättat lösenord kan skickas UTAN att sidan behöver laddas om', async ({
    page,
    network,
  }) => {
    // Regressionsbevis för React Arias validationBehavior="native"-buggen
    // (kortets Implementation Notes): efter ETT fel måste ett ANDRA försök
    // med rätt lösenord faktiskt trigga submit-handlern. Ett test som bara
    // provar ett enda felaktigt försök hade varit grönt genom hela buggen.
    await seedaInviteSession(page);
    mockLyckadSparning(network);
    await page.goto('/valkommen');

    const losenordFalt = page.getByLabel('Lösenord');
    const knapp = page.getByRole('button', { name: 'Skapa mitt konto' });

    // FÖRSTA FÖRSÖKET: för kort → fel. Kort-cirkuit sker FÖRE nätverket
    // (samma grenval som webblasarbeteende-syskontestet), så inget mockat
    // svar konsumeras här — det är det ANDRA försöket nedan som gör det.
    await losenordFalt.fill('kort');
    await knapp.click();
    await expect(page.getByRole('alert')).toContainText('minst 8 tecken');

    // ANDRA FÖRSÖKET: rättat till ett giltigt, icke-läckt lösenord (mockat
    // ovan via mockLyckadSparning). Om validationBehavior="native" fortfarande
    // stod kvar hade webbläsarens egen constraint-validering blockerat detta
    // submit tyst, och testet hade fastnat på "Skapa mitt konto" för alltid.
    await losenordFalt.fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await knapp.click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kontot är skapat' })).toBeVisible();
  });

  test('lyckad path: giltigt lösenord → konto skapas, sessionen loggas ut, ETT medvetet inloggningssteg erbjuds', async ({
    page,
    network,
  }) => {
    await seedaInviteSession(page);
    mockLyckadSparning(network);
    await page.goto('/valkommen');

    await page.getByLabel('Lösenord').fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await page.getByRole('button', { name: 'Skapa mitt konto' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Kontot är skapat' })).toBeVisible();
    const lank = page.getByRole('link', { name: 'Logga in och upptäck ditt nya verktyg' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/login');

    // AC #4 — axe 0 på framgångsläget (renderat EFTER en konsumerad
    // nätverksrundtrip, hör därför hemma här och inte i webblasarbeteende-
    // syskonfilen).
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('updateUser misslyckas (5xx) → generiskt vänligt felmeddelande, formuläret kvarstår ifyllbart', async ({
    page,
    network,
  }) => {
    await seedaInviteSession(page);
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
    await page.goto('/valkommen');

    await page.getByLabel('Lösenord').fill('EttHelPigg-FrasMedManga-OrdOchTecken');
    await page.getByRole('button', { name: 'Skapa mitt konto' }).click();

    // Exakt sträng (TASK-285.8, copy-domarna § 5/§ 7.3, AC #4) — inte bara en
    // delsträng: den tidigare "Något gick fel ... Försök igen" faller på
    // GOV.UK/NN/g (huvudsatsen bär ingen orsak); ersättningen namnger
    // problemet specifikt och behåller en genuint hållbar uppmaning.
    await expect(page.getByRole('alert')).toContainText(
      'Lösenordet kunde inte sparas just nu. Försök igen om en liten stund.',
    );
    // Formuläret är fortfarande här — INGEN övergång till felläget eller
    // framgångsläget vid ett generiskt fel.
    await expect(page.getByRole('button', { name: 'Skapa mitt konto' })).toBeVisible();
  });
});
