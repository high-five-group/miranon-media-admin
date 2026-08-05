import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Accept-sidan `/valkommen` (TASK-127.6, ADR-092/ADR-093) — DATALÖSA
 * beteendetester (ADR-094). Kriteriet (ADR-094 Beslut 2): "har testet ett
 * databeteende att bevisa formen av?" — nej för samtliga tester i denna
 * fil. `getSession()` läser lokal storage utan nätverksanrop
 * (`AuthProvider`-kontraktet, samma grund ADR-094 § Beslut 4 vilar på för
 * `InstallPrompt`), så en session kan seedas och läsas helt utan
 * fixturvärld. De tester som FAKTISKT konsumerar ett mockat nätverkssvar
 * (HIBP-träff, updateUser, signOut) hör hemma i — och bor i —
 * `tests/acceptance/valkommen.acceptance.test.ts`.
 *
 * FLYTTAD UT UR acceptance-KLASSEN EFTER ETT RÖTT SJÄLVTEST-VARV (samma
 * mönster som `install-prompt.test.ts`s egen historik, se den filens
 * topp-kommentar): `scripts/hermetik-sjalvtest.mjs` fällde 9 av 13 ADB-
 * genomkörda tester i den ursprungliga acceptance-filen med "Testet
 * överlever utan fixturens svar" — vakten hade rätt, placeringen var fel.
 *
 * INGEN MSW, INGEN HERMETIK-VAKT, INGEN FIXTURVÄRLD (ADR-094 § Beslut 3):
 * klassens definierande egenskap är att den ALDRIG rör nätverket, så det
 * finns inget att bevisa frånvaron av. Sessionen seedas direkt i
 * localStorage (samma `sb-visual-fixture-auth-token`-nyckel som
 * fixturvärlden delar för app-boot, ADR-094 § Beslut 4) — men UTAN en
 * fryst klocka (klassen har ingen), så utgångstiden härleds ur ÄKTA
 * `Date.now()`, till skillnad från syskonfilen i acceptance-klassen.
 */
const AUTH_STORAGE_KEY = 'sb-visual-fixture-auth-token';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

/** Samma sessionsform som acceptance-syskonfilens `bygdSession()`, men med
 * `expiresAt` härlett ur ÄKTA `Date.now()` — denna klass fryser aldrig
 * klockan (ADR-094 § Beslut 3/4). `displayName`/`inviterName` (TASK-143) är
 * OPTIONELLA överlägg — default `user_metadata: {}` speglar en session UTAN
 * dem, vilket är exakt vad de BEFINTLIGA testerna nedan (heading "Du har
 * bjudits in") ska fortsätta pröva: fallback-grenen, inte den personaliserade. */
function bygdSession(
  overrides: { email?: string; role?: string; displayName?: string; inviterName?: string } = {},
) {
  const epost = overrides.email ?? 'ny.anvandare@visual-fixture.se';
  const expiresAt = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const user = {
    id: '00000000-0000-4000-8000-000000000099',
    aud: 'authenticated',
    role: 'authenticated',
    email: epost,
    email_confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'], role: overrides.role ?? 'admin' },
    user_metadata: {
      ...(overrides.displayName ? { display_name: overrides.displayName } : {}),
      ...(overrides.inviterName ? { inviter_name: overrides.inviterName } : {}),
    },
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

function seedaInviteSession(
  page: Page,
  overrides: { email?: string; role?: string; displayName?: string; inviterName?: string } = {},
) {
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

test.describe('/valkommen — ogiltig, förbrukad eller obefintlig länk (AC #3)', () => {
  test('ingen session → vänligt felläge, ingen rå felkod, väg framåt till inloggningen', async ({
    page,
  }) => {
    await rensaSession(page);
    await page.goto('/valkommen');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Länken fungerar inte längre' }),
    ).toBeVisible();
    // Enumeration-neutralt: ingen orsak anges, ingen inbjudare namnges.
    await expect(page.getByText(/utgången|expired|error_code|invalid/i)).toHaveCount(0);
    const lank = page.getByRole('link', { name: 'Till inloggningen' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/login');

    // AC #4 — axe 0 på felläget.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('/valkommen — formuläret (AC #1, #2, #5)', () => {
  test('e-post förifylld och OREDIGERBAR; rollen visas ur sessionens app_metadata', async ({
    page,
  }) => {
    await seedaInviteSession(page, { email: 'roger@visual-fixture.se', role: 'admin' });
    await page.goto('/valkommen');

    await expect(page.getByRole('heading', { level: 1, name: 'Du har bjudits in' })).toBeVisible();
    await expect(page.getByText('administratör')).toBeVisible();

    const emailFalt = page.getByLabel('E-postadress');
    await expect(emailFalt).toHaveValue('roger@visual-fixture.se');
    await expect(emailFalt).toHaveAttribute('readonly', '');

    // AC #1 "kan inte ändras ... eller manipulerad request": fältet är inte
    // bara readOnly i DOM:en — komponentens EGEN state för värdet som
    // skickas vid submit läses ALDRIG ur detta fält, den kommer uteslutande
    // ur `session.user.email` (React-kontrollerad `value`-prop, se
    // valkommen.tsx). Beviset: manipulera DOM-värdet direkt (kringgår
    // Playwrights egna actionability-checks helt — en hårdare simulering av
    // "manipulerad request" än ett fill()-försök, som visade sig bero på
    // webbläsarimplementationens egna, oförutsägbara hantering av readonly
    // + programmatiska value-sättningar). Trigga sedan EN godtycklig
    // re-rendering (visa/dölj-knappen) och bevisa att Reacts kontrollerade
    // binding river tillbaka det äkta värdet — tamperingen kan alltså aldrig
    // överleva en enda interaktion, och kan följaktligen aldrig nå submit.
    await emailFalt.evaluate((el: HTMLInputElement) => {
      el.value = 'attacker@example.com';
    });
    await expect(emailFalt).toHaveValue('attacker@example.com');
    await page.getByRole('button', { name: 'Visa lösenord' }).click();
    await expect(emailFalt).toHaveValue('roger@visual-fixture.se');
  });

  test('lösenord under 8 tecken → vänligt felmeddelande, INGET nätverksanrop görs', async ({
    page,
  }) => {
    await seedaInviteSession(page);
    await page.goto('/valkommen');

    await page.getByLabel('Lösenord').fill('kort1');
    await page.getByRole('button', { name: 'Skapa mitt konto' }).click();

    const fel = page.getByRole('alert');
    await expect(fel).toContainText('minst 8 tecken');
  });

  test('visa/dölj lösenord växlar fältets type och knappens etikett', async ({ page }) => {
    await seedaInviteSession(page);
    await page.goto('/valkommen');

    const losenordFalt = page.getByLabel('Lösenord');
    await expect(losenordFalt).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Visa lösenord' }).click();
    await expect(losenordFalt).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'Dölj lösenord' }).click();
    await expect(losenordFalt).toHaveAttribute('type', 'password');
  });

  test('TTL-fotnoten anger 24 timmar (ADR-092 beslut 3 — plattformens tak, inte 7 dagar)', async ({
    page,
  }) => {
    await seedaInviteSession(page);
    await page.goto('/valkommen');
    await expect(page.getByText('Länken gäller i 24 timmar.')).toBeVisible();
  });

  test('axe 0 violations på formulär-tillståndet', async ({ page }) => {
    await seedaInviteSession(page);
    await page.goto('/valkommen');
    await expect(page.getByRole('heading', { level: 1, name: 'Du har bjudits in' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

/**
 * TASK-143 (AC#2): den personliga hälsningen facitet visar
 * ("Välkommen, Lotta" / "Marcus Johansson har bjudit in dig … Du får
 * rollen **administratör**.") — rent klient-side rendering ur en session
 * vars `user_metadata` bär `display_name`/`inviter_name` (ingen nätverks-
 * rundtrip inblandad, samma ADR-094-motiv som resten av filen). Syskon-
 * describe-blocket ovan ("formuläret") bevisar medvetet den ANDRA grenen
 * — fallback UTAN namn ("Du har bjudits in") — så BÅDA grenarna av
 * `mottagarNamn ? … : …`/`inbjudarNamn ? … : …` i valkommen.tsx har ett
 * test som fäller om grenlogiken bryts.
 */
test.describe('/valkommen — personlig hälsning ur user_metadata (TASK-143 AC#2/#3)', () => {
  test('namn + inbjudare satta → "Välkommen, {namn}" och inbjudarens namn nämns med rollen', async ({
    page,
  }) => {
    await seedaInviteSession(page, {
      email: 'lotta@visual-fixture.se',
      role: 'admin',
      displayName: 'Lotta',
      inviterName: 'Marcus Johansson',
    });
    await page.goto('/valkommen');

    await expect(page.getByRole('heading', { level: 1, name: 'Välkommen, Lotta' })).toBeVisible();
    await expect(
      page.getByText('Marcus Johansson har bjudit in dig till Miranon Media Admin.'),
    ).toBeVisible();
    await expect(page.getByText('administratör')).toBeVisible();
    // Fallback-rubriken ska INTE synas samtidigt — bevisar att det är en
    // exklusiv gren, inte båda textblocken renderade på varandra.
    await expect(page.getByRole('heading', { level: 1, name: 'Du har bjudits in' })).toHaveCount(0);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('namn satt men INGEN inbjudare känd → personlig rubrik, generisk rollmening (ingen "undefined har bjudit in")', async ({
    page,
  }) => {
    await seedaInviteSession(page, {
      email: 'lotta@visual-fixture.se',
      role: 'admin',
      displayName: 'Lotta',
    });
    await page.goto('/valkommen');

    await expect(page.getByRole('heading', { level: 1, name: 'Välkommen, Lotta' })).toBeVisible();
    await expect(page.getByText('har bjudit in dig')).toHaveCount(0);
    await expect(page.getByText('Du får rollen')).toBeVisible();
  });
});

test.describe('/valkommen — GRÄNSEN: allt innehåll ryms utan vertikal scroll', () => {
  /** `document.documentElement.scrollHeight > clientHeight`-mönstret ur
   * `events-list-kalender.acceptance.test.ts` (rad ~581) — samma renderade
   * mätning, inte en antagen klass-närvaro. */
  async function sidanScrollar(page: Page): Promise<boolean> {
    return page.evaluate(
      () => document.documentElement.scrollHeight > document.documentElement.clientHeight,
    );
  }

  test('desktop-viewport (1280×800): inget vertikalt scroll på formulär-tillståndet', async ({
    page,
  }) => {
    await seedaInviteSession(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/valkommen');
    await expect(page.getByRole('heading', { level: 1, name: 'Du har bjudits in' })).toBeVisible();
    expect(await sidanScrollar(page)).toBe(false);
  });

  test('mobil-viewport (390×844): inget vertikalt scroll på formulär-tillståndet', async ({
    page,
  }) => {
    await seedaInviteSession(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/valkommen');
    await expect(page.getByRole('heading', { level: 1, name: 'Du har bjudits in' })).toBeVisible();
    expect(await sidanScrollar(page)).toBe(false);
  });

  /**
   * KÄND BEGRÄNSNING, FLAGGAD ÖPPET (inte tyst): detta är EN approximation
   * av "mjukt tangentbord uppe", inte en verifiering av det. Ett riktigt
   * mjukt tangentbord ändrar den VISUELLA viewporten via webbläsarens/OS:ets
   * egen `VisualViewport`-mekanik (`interactive-widget=resizes-content`
   * m.fl.) — Playwright kan inte trigga det på riktigt, bara approximera
   * genom att krympa `page.setViewportSize` till ungefär halva mobilhöjden
   * (kortets egen beskrivning: "krymper synlig yta ofta till omkring halva
   * viewporten"). `min-h-dvh` (samma teknik som facit-prototypen) är
   * konstruerad för exakt detta scenario i moderna webbläsare, men den
   * mekanismen är inte vad DETTA test mäter. Se slutrapporten.
   */
  test('approximerad tangentbords-krympt viewport (390×420): lösenordsfältet och knappen förblir NÅBARA', async ({
    page,
  }) => {
    await seedaInviteSession(page);
    await page.setViewportSize({ width: 390, height: 420 });
    await page.goto('/valkommen');

    const losenordFalt = page.getByLabel('Lösenord');
    const knapp = page.getByRole('button', { name: 'Skapa mitt konto' });
    await losenordFalt.scrollIntoViewIfNeeded();
    await expect(losenordFalt).toBeInViewport();
    await knapp.scrollIntoViewIfNeeded();
    await expect(knapp).toBeInViewport();
  });
});
