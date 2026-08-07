import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.7 — Bor över: summeringsraden + KRYSS-LÄGET (S73-facit K50/K52).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations och
 * update-record — samma split som 18.1/18.4/18.8: SERVER-kontraktet
 * (`Bor över`-fältets läs-mappning, operationens allowlist och teardown) bevisas
 * av `tests/api/*.staging.test.ts` mot skarp staging; dessa e2e bevisar
 * KLIENTENS form och beteende flak-fritt utan delad staging-data.
 *
 * Täckning (AC #2): raden SIST i summeringen med HÄRLETT antal · kryss-läget i
 * EN kolumn med ALLA anmälda (även urkryssade) · ikryssade överst · STABIL
 * ordning under markeringen (raderna hoppar inte under fingret) · live-räknaren
 * · write-operationens payload · axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
const EVENT_ID = 'recBOROVER000001';

function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Json = Record<string, unknown>;

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: omDagar(60),
    slutdatum: omDagar(61),
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 4,
    platserKvar: 8,
    anmaldBelaggning: 0.33,
    bekraftadBelaggning: 0.17,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 2,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 4,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 1,
    viaFormular: 2,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

function registrering(overrides: Json): Json {
  return {
    id: 'recX',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: null,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: null,
    borOver: false,
    ...overrides,
  };
}

/**
 * Fyra AKTIVA anmälningar (data-ordning Anna → Bertil → Cecilia → David) + en
 * avbokad som ska räknas bort överallt. David bor över från start — han är
 * SIST i data-ordningen, så "ikryssade överst" kan inte bli sant av en slump.
 */
const DELTAGARE: Json[] = [
  registrering({ id: 'recAnna', namn: 'Anna Ek', inskickad: '2026-07-01T09:00:00.000Z' }),
  registrering({
    id: 'recBertil',
    namn: 'Bertil Sund',
    inskickad: '2026-06-20T09:00:00.000Z',
    kalla: 'Manuell',
  }),
  registrering({
    id: 'recCecilia',
    namn: 'Cecilia Lund',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-05T09:00:00.000Z',
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
  }),
  registrering({
    id: 'recDavid',
    namn: 'David Nord',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-06-25T09:00:00.000Z',
    kalla: '+1',
    bekraftelseSkickad: '2026-06-26T09:00:00.000Z',
    borOver: true,
  }),
  registrering({
    id: 'recEva',
    namn: 'Eva Sten',
    status: 'Avbokad/Ombokad',
    inskickad: '2026-06-10T09:00:00.000Z',
    borOver: true,
  }),
];

/** Skrivningar update-record tagit emot under testet (payload-beviset). */
type Skrivning = { operationKey: string; recordId: string; fields: Record<string, unknown> };

async function mocka(page: Page): Promise<Skrivning[]> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  const skrivningar: Skrivning[] = [];
  // Serverns rader muteras av skrivningarna så en refetch (mutationens
  // onSettled-invalidering) inte "ångrar" den optimistiska flippen.
  const rader = DELTAGARE.map((r) => ({ ...r }));

  await page.route(GET_EVENT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventDetail() }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: rader }),
    });
  });
  await page.route(UPDATE_RECORD, async (route) => {
    const body = route.request().postDataJSON() as Skrivning;
    skrivningar.push(body);
    const rad = rader.find((r) => r.id === body.recordId);
    if (rad) rad.borOver = body.fields['Bor över'];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
  return skrivningar;
}

function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

function borOverRaden(page: Page) {
  return gruppen(page).getByRole('button', { name: /^Bor över/ });
}

function kryssen(page: Page) {
  return gruppen(page).getByTestId('bor-over-rad');
}

/** Namnen i kryss-lägets ordning (raden bär även sin kategori-pill). */
function kryssNamn(page: Page) {
  return gruppen(page).getByTestId('bor-over-namn');
}

/**
 * Kryssrutan för EN person — det tillgängliga namnet börjar med personens namn.
 * För ASSERTIONER (toBeChecked). RAC lägger `role="checkbox"` på det dolda
 * <input>-elementet.
 */
function krysset(page: Page, namn: string) {
  return gruppen(page).getByRole('checkbox', { name: new RegExp(`^${namn}`) });
}

/**
 * KLICKYTAN för EN persons kryss — RAC renderar en <label> (radens `bor-over-rad`)
 * som omsluter ett dolt <input>; klick måste träffa labeln, inte inputen (labeln
 * fångar pekaren). Filtrerar rad-labeln på personens namn.
 */
function klickaKryss(page: Page, namn: string) {
  return kryssen(page).filter({ hasText: namn });
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

test.describe('Bor över — raden + kryss-läget (task-18.7)', () => {
  test('raden står SIST i summeringen med HÄRLETT antal (avbokade borträknade)', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);

    // K50: Bor över SIST — universell rad på ALLA event.
    const etiketter = await gruppen(page).locator('button[aria-pressed]').allTextContents();
    expect(etiketter).toEqual([
      'Obekräftade anmälningar2',
      'Anmälningsbekräftelse skickad2 av 4−2',
      'Betalningspåminnelse skickad0',
      'Eventinfo skickad0 av 4−4',
      'Bor över1',
    ]);

    // Eva (Avbokad/Ombokad) bär borOver i mocken men räknas ALDRIG — 1, inte 2.
    await expect(gruppen(page).getByText('Eva Sten')).toHaveCount(0);
  });

  test('klicket öppnar KRYSS-LÄGET: alla anmälda i EN kolumn, ikryssade överst', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);

    await borOverRaden(page).click();
    await expect(borOverRaden(page)).toHaveAttribute('aria-pressed', 'true');

    // ALLA anmälda står i läget — inte bara de ikryssade (det är en ARBETSRAD,
    // inte en filterlista, K52). Ikryssade överst: David (sist i data-ordningen).
    const rader = kryssen(page);
    await expect(rader).toHaveCount(4);
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // EN kolumn: varje rad ligger på sin egen y och de delar vänsterkant.
    const boxar = await rader.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y) };
      }),
    );
    const xar = new Set(boxar.map((b) => b.x));
    expect(xar.size, 'kryss-läget ska vara EN kolumn — alla rader delar vänsterkant').toBe(1);
    for (let i = 1; i < boxar.length; i++) {
      expect(boxar[i].y, `rad ${i} ska ligga UNDER föregående (en kolumn)`).toBeGreaterThan(
        boxar[i - 1].y,
      );
    }

    // Personkorten är ersatta av kryss-raderna — inte båda formerna samtidigt.
    await expect(gruppen(page).getByTestId('deltagar-kort')).toHaveCount(0);

    // Kryss-tillståndet speglar basen.
    await expect(krysset(page, 'David Nord')).toBeChecked();
    await expect(krysset(page, 'Anna Ek')).not.toBeChecked();
  });

  test('krysset skriver via set-registration-lodging och live-räknaren tickar', async ({
    page,
  }) => {
    const skrivningar = await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();

    await klickaKryss(page, 'Anna Ek').click();
    await expect(krysset(page, 'Anna Ek')).toBeChecked();

    // LIVE-RÄKNAREN: summeringsradens siffra är HÄRLEDD ur samma cache-rad —
    // den tickar 1 → 2 utan omladdning.
    await expect(borOverRaden(page)).toHaveText('Bor över2');

    // Av-bock med samma operation (allowlisten gatar fältet, inte värdet).
    await klickaKryss(page, 'David Nord').click();
    await expect(krysset(page, 'David Nord')).not.toBeChecked();
    await expect(borOverRaden(page)).toHaveText('Bor över1');

    expect(skrivningar).toEqual([
      {
        operationKey: 'set-registration-lodging',
        recordId: 'recAnna',
        fields: { 'Bor över': true },
      },
      {
        operationKey: 'set-registration-lodging',
        recordId: 'recDavid',
        fields: { 'Bor över': false },
      },
    ]);
  });

  test('ordningen är STABIL under markeringen — nykryssad rad hoppar inte under fingret', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();

    await klickaKryss(page, 'Cecilia Lund').click();
    await expect(krysset(page, 'Cecilia Lund')).toBeChecked();

    // Cecilia står KVAR sist trots att hon nu är ikryssad (K52: sorteringen är
    // en ögonblicksbild från när läget öppnades).
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // Vid OMÖPPNING sätter sig ordningen om — då står de ikryssade överst
    // (inbördes i listans ordning: Cecilia före David).
    await gruppen(page).getByRole('button', { name: 'Rensa filtret' }).click();
    await expect(kryssen(page)).toHaveCount(0);
    await borOverRaden(page).click();
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'Cecilia Lund',
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
    ]);
  });

  test('axe 0 i kryss-läget', async ({ page }) => {
    await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();
    await expect(kryssen(page)).toHaveCount(4);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
});
