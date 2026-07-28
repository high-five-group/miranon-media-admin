import AxeBuilder from '@axe-core/playwright';
import { mockValjarLista } from './helpers/valjar-lista';
import { expect, test } from './support/test-bas';

/**
 * task-18.9 — Närvaro-REGISTRET på eventsidan (S73-facit K60).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr event-detail.staging.test.ts).
 *
 * **Deterministisk via `page.route`-mock** av get-event + get-attendance +
 * get-registrations (Deltagare/Betalningar-sektionerna stubbas tomma så sviten
 * förblir deterministisk — deras egna sviter bär deras kontrakt). Bevisar
 * KLIENTENS registerform mot facit utan att röra delad staging-data.
 *
 * Skild från `tests/acceptance/event-narvaro.acceptance.test.ts` (den STANDALONE
 * /narvaro-routen, kvar per RIV INGENTING) — detta är det INLINE registret på
 * eventdetalj-sidan. Den filen flyttade till acceptance-klassen i task-59.6 (noll
 * skarpa anrop i mätdatan); DENNA stannar i den skarpa klassen — den mäter 8
 * skarpa get-event-notes-anrop. Namnlikheten är alltså inte klassgemenskap.
 *
 * Täckning: genomfört event → LMS-register (rader × sessioner, bock ⟺ poäng,
 * Total närvaro %), poäng RÅ ur `narvaropoang` OCH status-fallback (deploy-gap),
 * bara sessioner-med-rader, kommande event → lugnt läge UTAN EF-fetch, tom-state,
 * fel (role=alert), läsbart personNamn, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_ATTENDANCE = /\/functions\/v1\/get-attendance\?/;
const GET_REGISTRATIONS = /\/functions\/v1\/get-registrations/;
const EVENT_ID = 'recNARVREG0000001';

type EventMock = Record<string, unknown>;
type Row = Record<string, unknown>;

/** Full event-shape (get-event-svarets form). Default GENOMFÖRT → registret visas. */
function eventMock(overrides: EventMock = {}): EventMock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1 – 2026-05-01',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-05-01',
    slutdatum: '2026-05-02',
    tidKvarTillEvent: 'Avslutat',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Genomfört',
    eventKey: 'Event-21',
    reserverade: 1,
    manuelltTillagda: 1,
    viaFormular: 8,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

/**
 * En komplett Attendance-rad (EF-svarets form, AttendanceSchema). Bär medvetet
 * INGEN `narvaropoang` i basen — det är den icke-deployade EF-formen (deploy-gap).
 * Post-deploy-formen sätts explicit per rad (narvaropoang: 0/1); deploy-gap-testet
 * utelämnar den och bevisar status-fallbacken.
 */
function attRow(overrides: Row = {}): Row {
  return {
    id: `recATT${Math.random().toString(36).slice(2, 10)}`,
    anmalanId: 'recANM0000000001',
    eventId: EVENT_ID,
    personId: `recPER${Math.random().toString(36).slice(2, 10)}`,
    personNamn: 'Anna Andersson',
    session: 'Dag 1',
    status: 'Närvarande',
    noteringar: null,
    avstamt: '2026-05-01T10:00:00.000Z',
    ...overrides,
  };
}

/**
 * Mockar sidans EF-anrop. get-attendance mockas ALLTID (räknaren bevisar att den
 * INTE anropas för kommande event). Returnerar räknaren för get-attendance-anrop.
 */
async function setup(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  event: EventMock,
  attendance: Row[],
  { attendanceStatus = 200 }: { attendanceStatus?: number } = {},
): Promise<{ attendanceCalls: () => number }> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  let calls = 0;
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: [] }),
    });
  });
  await page.route(GET_ATTENDANCE, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    calls += 1;
    await route.fulfill({
      status: attendanceStatus,
      contentType: 'application/json',
      body:
        attendanceStatus === 200 ? JSON.stringify({ attendance }) : JSON.stringify({ error: 'x' }),
    });
  });
  return { attendanceCalls: () => calls };
}

/** Registrets sektion (h2 "Närvaro" + kortet) — scope för alla assertions. */
// biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
function narvaroSektion(page: any) {
  return page.locator('section[aria-labelledby="grupp-narvaro"]');
}

// 3 personer × 2 sessioner → 4 poäng / 6 platser = 67 % (avrundat). Anna full,
// Bo bara Dag 1, Cecilia bara Dag 2.
function treRaderTvaDagar(narvaropoang: boolean): Row[] {
  const p = (present: boolean, extra: Row): Row =>
    attRow({
      status: present ? 'Närvarande' : 'Frånvarande',
      ...(narvaropoang ? { narvaropoang: present ? 1 : 0 } : {}),
      ...extra,
    });
  return [
    p(true, { personId: 'recPERanna', personNamn: 'Anna Andersson', session: 'Dag 1' }),
    p(true, { personId: 'recPERanna', personNamn: 'Anna Andersson', session: 'Dag 2' }),
    p(true, { personId: 'recPERbo', personNamn: 'Bo Bengtsson', session: 'Dag 1' }),
    p(false, { personId: 'recPERbo', personNamn: 'Bo Bengtsson', session: 'Dag 2' }),
    p(false, { personId: 'recPERcia', personNamn: 'Cecilia Carlsson', session: 'Dag 1' }),
    p(true, { personId: 'recPERcia', personNamn: 'Cecilia Carlsson', session: 'Dag 2' }),
  ];
}

test.describe('Närvaro-registret på eventsidan (task-18.9)', () => {
  test('genomfört event → LMS-register: rader × sessioner, bock ⟺ poäng, Total närvaro %', async ({
    page,
  }) => {
    const rows = treRaderTvaDagar(true); // poäng RÅ ur narvaropoang (post-deploy-formen)
    await setup(page, eventMock(), rows);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const sektion = narvaroSektion(page);
    // Rubriken "Närvaro" (h2) bär registret.
    await expect(sektion.getByRole('heading', { level: 2, name: 'Närvaro' })).toBeVisible();

    // Total närvaro = 4/6 → 67 %.
    await expect(sektion.getByText('Total närvaro')).toBeVisible();
    await expect(sektion.getByText('67 %')).toBeVisible();

    // Sessions-kolumner i fast ordning (Dag 1, Dag 2).
    await expect(sektion.getByRole('columnheader', { name: 'Dag 1' })).toBeVisible();
    await expect(sektion.getByRole('columnheader', { name: 'Dag 2' })).toBeVisible();

    // Rad-rubriker = deltagarnas NAMN (aldrig record-ID).
    await expect(sektion.getByRole('rowheader', { name: 'Anna Andersson' })).toBeVisible();
    await expect(sektion.getByRole('rowheader', { name: 'Bo Bengtsson' })).toBeVisible();
    await expect(sektion.getByRole('rowheader', { name: 'Cecilia Carlsson' })).toBeVisible();

    // Cellernas närvaro bärs av TEXT (sr-only), aldrig bara av bock/färg:
    // 4 närvarande-celler (poäng 1), 2 ej-närvarande (poäng 0).
    await expect(sektion.getByText('Närvarande', { exact: true })).toHaveCount(4);
    await expect(sektion.getByText('Ej närvarande', { exact: true })).toHaveCount(2);
  });

  test('deploy-gap: narvaropoang UTELÄMNAD → status-fallback ger IDENTISKT register (67 %)', async ({
    page,
  }) => {
    // Den deployade EF:en bär ännu inte Närvaropoäng (DoD #7) — registret härleder
    // då poängen ur status (identisk mängd som basformeln). Samma % som post-deploy.
    const rows = treRaderTvaDagar(false); // INGEN narvaropoang i raderna
    await setup(page, eventMock(), rows);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const sektion = narvaroSektion(page);
    await expect(sektion.getByText('67 %')).toBeVisible();
    await expect(sektion.getByText('Närvarande', { exact: true })).toHaveCount(4);
    await expect(sektion.getByText('Ej närvarande', { exact: true })).toHaveCount(2);
  });

  test('bara sessioner med rader renderas: en föreläsning ger bara Föreläsning-kolumnen', async ({
    page,
  }) => {
    await setup(page, eventMock({ typ: 'Föreläsning' }), [
      attRow({
        personNamn: 'Doris Dahl',
        session: 'Föreläsning',
        status: 'Närvarande',
        narvaropoang: 1,
      }),
    ]);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const sektion = narvaroSektion(page);
    await expect(sektion.getByRole('columnheader', { name: 'Föreläsning' })).toBeVisible();
    await expect(sektion.getByRole('columnheader', { name: 'Dag 1' })).toHaveCount(0);
    await expect(sektion.getByRole('columnheader', { name: 'Dag 2' })).toHaveCount(0);
    await expect(sektion.getByText('100 %')).toBeVisible();
  });

  test('kommande event (Planerat) → lugnt läge, get-attendance anropas ALDRIG', async ({
    page,
  }) => {
    const { attendanceCalls } = await setup(page, eventMock({ status: 'Planerat' }), []);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const sektion = narvaroSektion(page);
    // Lugnt ej-genomfört-läge — registret monteras inte. Review-våg 2
    // (Marcus 2026-07-23): texten kortad (svansen riven), centrerad gråad.
    const tomlage = sektion.getByText('Eventet är inte genomfört ännu', { exact: true });
    await expect(tomlage).toBeVisible();
    await expect(tomlage).toHaveCSS('text-align', 'center');
    await expect(sektion.getByText('Total närvaro')).toHaveCount(0);
    await expect(sektion.getByRole('table')).toHaveCount(0);
    // Kommande event får ALDRIG anropa get-attendance (noll e2e-rippel-motivet).
    expect(attendanceCalls()).toBe(0);
  });

  test('genomfört men inga deltaganden → vänlig tom-text (ej fel)', async ({ page }) => {
    await setup(page, eventMock(), []);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const sektion = narvaroSektion(page);
    await expect(
      sektion.getByText('Inga deltaganden registrerade för det här eventet än.'),
    ).toBeVisible();
    await expect(sektion.getByRole('alert')).toHaveCount(0);
  });

  test('fel (icke-2xx) → fel-UI via role=alert i registret', async ({ page }) => {
    await setup(page, eventMock(), [], { attendanceStatus: 404 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expect(narvaroSektion(page).getByRole('alert')).toContainText(
      'Kunde inte hämta närvaron',
    );
  });

  test('personNamn null → "Namn saknas" (graciöst), aldrig record-ID/tomt', async ({ page }) => {
    await setup(page, eventMock(), [
      attRow({ personNamn: null, session: 'Dag 1', status: 'Närvarande', narvaropoang: 1 }),
    ]);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await expect(
      narvaroSektion(page).getByRole('rowheader', { name: 'Namn saknas' }),
    ).toBeVisible();
  });

  test('axe 0 violations på den renderade registret', async ({ page }) => {
    await setup(page, eventMock(), treRaderTvaDagar(true));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(narvaroSektion(page).getByText('67 %')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
