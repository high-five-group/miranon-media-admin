import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/**
 * Hem-vyn (task-1.3 — A-skelettet, prototypvinnaren ur S52 Del 4). Uppifrån
 * och ned: hälsningskort (h1 "Hej {namn}!" + uppdatera-kontroll) → Nästa event
 * (primär-tint, HELA kortet klickbart till eventets detaljsida) bredvid
 * Obetalda avgifter (antalet stort, första namnen under) → helbredds-listkortet
 * Nya anmälningar (rad klickbar → eventets anmälda-vy; rad utan event olänkad
 * med "Utan event") → stor helbredds-CTA sist. INGEN separat "Hem"-rubrik
 * (AC #6): hälsningen ÄR sidans h1 → h1-assertions matchar /^Hej/
 * (miljö-neutralt: namn-delen styrs av sessionens display-namn, task-1.1).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av EF:erna. Regex-matchare som inte
 * kolliderar: `get-registrations` och `get-events` är unika delsträngar
 * (get-events matchar inte get-event, get-registrations matchar inte
 * create-registration); `get-event\?` (klick-testet) matchar inte get-events.
 * Mockarna speglar EF-svaren `{ registrations: [...] }` / `{ events: [...] }`
 * (Registration.schema / Event.schema-rader → adapterns `.parse()` passerar).
 *
 * Täckning: A-skelettets rendering (senaste anmälningar recency-sorterat,
 * nästa event temporalt, obetalda-antal stort), hälsnings-h1, klick-ytorna
 * (helkorts-klick AC #2, rad-klick + "Utan event" AC #3), CTA→/event,
 * tom-state per card, fel (4xx role=alert, no-retry), axe 0. INGEN
 * h1-auto-fokus-assertion: /hem är default-landningsytan → containern flyttar
 * INTE fokus (skip-link-först-tab-ordning, speglar EventsList; se Hem.tsx +
 * shell DoD 2).
 */

const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;
const GET_EVENTS = /\/functions\/v1\/get-events/;
const GET_EVENT = /\/functions\/v1\/get-event\?/;

/** Sidrubriken = hälsningen (AC #6) — namn-delen är miljöberoende → prefix-match. */
const H1_HALSNING = /^Hej/;

type Row = Record<string, unknown>;

/** En komplett Registration-rad (EF-svarets form, Registration.schema). */
function reg(overrides: Row = {}): Row {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEvent1',
    personId: 'recPerson1',
    ...overrides,
  };
}

/** En komplett Event-rad (EF-svarets form, Event.schema). */
function ev(overrides: Row = {}): Row {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'RIM1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

async function mock(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  {
    registrations = [],
    events = [],
    regStatus = 200,
    eventStatus = 200,
  }: { registrations?: Row[]; events?: Row[]; regStatus?: number; eventStatus?: number } = {},
) {
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: regStatus,
      contentType: 'application/json',
      body: regStatus === 200 ? JSON.stringify({ registrations }) : JSON.stringify({ error: 'x' }),
    });
  });
  await page.route(GET_EVENTS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: eventStatus,
      contentType: 'application/json',
      body: eventStatus === 200 ? JSON.stringify({ events }) : JSON.stringify({ error: 'x' }),
    });
  });
}

test.describe('Hem — A-skelettet (task-1.3)', () => {
  test('A-skelettet renderas: hälsnings-h1, kort med data, CTA', async ({ page }) => {
    await mock(page, {
      registrations: [
        reg({ fornamn: 'Carl', efternamn: 'Carlsson', inskickad: '2026-06-22T10:00:00.000Z' }),
        reg({ fornamn: 'Bo', efternamn: 'Bengtsson', inskickad: '2026-06-21T10:00:00.000Z' }),
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          inskickad: '2026-06-20T10:00:00.000Z',
          anmalningsavgift: 'Ej mottagen',
        }),
      ],
      events: [
        ev({ eventNamn: 'Förbi-event', startdatum: '2020-01-01' }), // dåtid → ej "nästa"
        ev({ eventNamn: 'Resor i medvetandet 1', startdatum: '2099-06-01' }),
      ],
    });
    await page.goto('/hem');

    // <h1> = hälsningen (AC #6 — ingen separat "Hem"-rubrik). Ingen
    // fokus-assertion: landningsytan stjäl inte fokus.
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hem' })).toHaveCount(0);

    // Nya anmälningar: senaste namn (recency via Inskickad) + formaterat datum;
    // raden är en LÄNK till eventets anmälda-vy (AC #3).
    await expect(page.getByRole('link', { name: /Carl Carlsson/ })).toBeVisible();
    await expect(page.getByText('2026-06-22')).toBeVisible();

    // Nästa event: temporalt valt (kommande, ej dåtids-eventet); namn-länk.
    // exact: true — rad-länkarnas accessible name INNEHÅLLER eventnamnet
    // (substräng-default hade gett strict-mode-dubbelträff mot raderna).
    await expect(
      page.getByRole('link', { name: 'Resor i medvetandet 1', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('Förbi-event')).toHaveCount(0);

    // Obetalda: en rad har "Ej mottagen" → antalet STORT (A-skelettet:
    // etikett-över-värde) + de första namnen under. Scopat till cardets
    // region-landmark: namnet kan även synas i "Nya anmälningar" (samma
    // person), så region-scope undviker strict-mode-dubbelträff och bevisar
    // att raden ligger i RÄTT card.
    const obetalda = page.getByRole('region', { name: 'Obetalda avgifter' });
    await expect(obetalda.getByText('1', { exact: true })).toBeVisible();
    await expect(obetalda.getByText('Disa Dahl')).toBeVisible();

    // CTA → samlade anmälningslistan (task-1.4 AC #2; chevronen är
    // aria-hidden → rent namn). Eventlistan nås via tabbaren (beslut 7).
    await expect(page.getByRole('link', { name: 'Visa alla anmälningar' })).toHaveAttribute(
      'href',
      '/mer/anmalningar',
    );

    // RefreshButton — manuell uppdatera-kontroll i hälsningskortet.
    await expect(page.getByRole('button', { name: 'Uppdatera översikt' })).toBeVisible();
  });

  test('AC 2 — klick var som helst på Nästa event-kortet → eventets detaljsida', async ({
    page,
  }) => {
    await mock(page, {
      registrations: [reg()],
      events: [ev({ id: 'recEventNasta', eventNamn: 'Resor i medvetandet 1' })],
    });
    // Detaljsidan hämtar get-event vid landning → mocka för deterministisk render.
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: ev({ id: 'recEventNasta' }) }),
      });
    });
    await page.goto('/hem');

    const kort = page.getByRole('region', { name: 'Nästa event' });
    // Klicka i kortets övre vänstra hörn — INTE på länktexten — för att bevisa
    // att HELA kort-ytan är länk-yta (stretched link, AC #2).
    await kort.click({ position: { x: 12, y: 12 } });
    await expect(page).toHaveURL(/\/event\/recEventNasta/);
  });

  test('AC 3 — klick på anmälningsrad → eventets anmälda-vy', async ({ page }) => {
    await mock(page, {
      registrations: [reg({ fornamn: 'Carl', efternamn: 'Carlsson', eventId: 'recEvent1' })],
      events: [ev()],
    });
    await page.goto('/hem');

    await page.getByRole('link', { name: /Carl Carlsson/ }).click();
    await expect(page).toHaveURL(/\/event\/recEvent1\/anmalda/);
  });

  test('task-1.4 AC 2 — Hem-CTA:n landar på samlade anmälningslistan', async ({ page }) => {
    await mock(page, { registrations: [reg()], events: [ev()] });
    await page.goto('/hem');

    await page.getByRole('link', { name: 'Visa alla anmälningar' }).click();
    await expect(page).toHaveURL(/\/mer\/anmalningar$/);
    // Listan renderar mot samma get-registrations-mock (delad event-lös gren).
    await expect(page.getByRole('heading', { level: 1, name: 'Anmälningar' })).toBeVisible();
  });

  test('AC 3 — rad utan event-koppling är olänkad och visar "Utan event"', async ({ page }) => {
    await mock(page, {
      registrations: [reg({ fornamn: 'Eva', efternamn: 'Ek', eventId: null, eventNamn: null })],
      events: [ev()],
    });
    await page.goto('/hem');

    const lista = page.getByRole('region', { name: 'Nya anmälningar' });
    await expect(lista.getByText('Eva Ek')).toBeVisible();
    await expect(lista.getByText(/Utan event/)).toBeVisible();
    await expect(lista.getByRole('link')).toHaveCount(0);
  });

  test('tomma listor → vänliga tom-texter per card, inga fel', async ({ page }) => {
    await mock(page, { registrations: [], events: [] });
    await page.goto('/hem');

    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
    await expect(page.getByText('Inga obetalda avgifter.')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('endast dåtida event → "Inga kommande event"', async ({ page }) => {
    await mock(page, {
      registrations: [reg()],
      events: [ev({ startdatum: '2020-01-01' })],
    });
    await page.goto('/hem');
    await expect(page.getByText('Inga kommande event.')).toBeVisible();
  });

  test('get-registrations 4xx → fel-UI (role=alert) i anmälnings-cards, event-card opåverkat', async ({
    page,
  }) => {
    // 4xx = klient-fel → no-retry-grenen (speglar 6c). Båda anmälnings-cards delar
    // queryn → båda visar alert; event-cardet (separat query, 200) renderar fint.
    await mock(page, { regStatus: 404, events: [ev({ eventNamn: 'Resor i medvetandet 1' })] });
    await page.goto('/hem');

    await expect(page.getByRole('alert').first()).toContainText('Kunde inte hämta anmälningar');
    await expect(page.getByRole('link', { name: 'Resor i medvetandet 1' })).toBeVisible();
  });

  test('axe 0 violations på den renderade Hem-vyn', async ({ page }) => {
    await mock(page, {
      registrations: [reg({ anmalningsavgift: 'Ej mottagen' }), reg()],
      events: [ev()],
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});

/**
 * Hälsningen (task-1.1 — namnkällan): display-namnet läses ur inloggnings-
 * kontots user_metadata (Supabase-sessionen i localStorage, seedad av
 * auth.setup via storageState). Hermetiskt via addInitScript-patch av den
 * lagrade sessionen — assertionerna är oberoende av staging-kontots faktiska
 * metadata (T26-klassen: miljö-beroende assertions är sköra). Patchen körs
 * FÖRE app-boot, så getSession() läser det patchade värdet.
 */
function patchStoredDisplayName(page: Page, displayName: string | null) {
  return page.addInitScript((name) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session?.user) continue;
      session.user.user_metadata = { ...session.user.user_metadata };
      if (name === null) delete session.user.user_metadata.display_name;
      else session.user.user_metadata.display_name = name;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, displayName);
}

test.describe('Hälsningen (task-1.1 — namnkällan ur kontots metadata)', () => {
  test('display-namn i sessionen → h1 "Hej {namn}!"', async ({ page }) => {
    // 'Lotta' speglar staging-kontots faktiska display-namn — en (osannolik)
    // mitt-i-testet token-refresh, där server-sanningen ersätter patchen, kan
    // då inte flippa texten. Hälsningen är sidans h1 (task-1.3 AC #6).
    await patchStoredDisplayName(page, 'Lotta');
    await mock(page);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hej Lotta!' })).toBeVisible();
  });

  test('utan display-namn → neutral hälsning, aldrig e-postadressen', async ({ page }) => {
    await patchStoredDisplayName(page, null);
    await mock(page);
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: 'Hej!' })).toBeVisible();
    // E-posten är ALDRIG fallback (AC 2, Gunilla-principen). auth.setup
    // hard-failar utan TEST_USER_EMAIL → tom sträng här är ett riggfel.
    const email = process.env.TEST_USER_EMAIL ?? '';
    expect(email).not.toBe('');
    await expect(page.getByText(email)).toHaveCount(0);
  });
});

test.describe('Hem polling + refresh (Fas 6d L2 — ADR-017 + erratum)', () => {
  test('RefreshButton → invalidate(dashboard.all) → båda grenarna refetchar', async ({ page }) => {
    let regCalls = 0;
    let evCalls = 0;
    await page.route(GET_REGISTRATIONS, async (route) => {
      regCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [reg()] }),
      });
    });
    await page.route(GET_EVENTS, async (route) => {
      evCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [ev()] }),
      });
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

    // Initial last: registrerings-grenen hämtas EN gång trots TVÅ konsumenter
    // (NyaAnmalningar + Obetalda delar queryKey → dedup); event-grenen en gång.
    // staleTime: 30_000 gör att ev. window-focus-event inte blåser upp räkningen.
    await expect.poll(() => regCalls).toBe(1);
    await expect.poll(() => evCalls).toBe(1);

    const refresh = page.getByRole('button', { name: 'Uppdatera översikt' });
    await refresh.click();

    // invalidateQueries({ queryKey: dashboard.all }) → båda grenarna refetchar.
    await expect.poll(() => regCalls).toBeGreaterThan(1);
    await expect.poll(() => evCalls).toBeGreaterThan(1);
  });

  test('refetchInterval (60s) triggar polling-refetch — falsk klocka', async ({ page }) => {
    // page.clock fakar timers → vi kan avancera förbi 60s-intervallet deterministiskt
    // utan att vänta i realtid. refetchIntervalInBackground:false pausar bara när
    // fliken är dold; i testet är document synligt → intervallet är aktivt.
    await page.clock.install();
    let evCalls = 0;
    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [reg()] }),
      });
    });
    await page.route(GET_EVENTS, async (route) => {
      evCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: [ev()] }),
      });
    });
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();
    await expect.poll(() => evCalls).toBe(1); // initial hämtning

    // Avancera förbi 60s → refetchInterval fyrar en polling-refetch.
    await page.clock.fastForward(61_000);
    await expect.poll(() => evCalls).toBeGreaterThan(1);
  });
});
