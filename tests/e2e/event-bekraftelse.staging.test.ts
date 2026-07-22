import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';

/**
 * task-18.6 — Hantera-flödet: bekräftelse-vertikalen + Bekräfta alla + auto-utskicks-
 * krysset (S73-facit K44/K46/K47/K48).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations,
 * send-registration-confirmation och update-event — samma split som 18.4/18.5/18.8:
 * SERVER-kontraktet (mail + status-flip, deny-by-default, icke-prod-spärren) bevisas av
 * `tests/api/send-registration-confirmation.staging.test.ts` + `confirm-registrations.test.ts`
 * mot skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt.
 *
 * Mockarna är TILLSTÅNDSBÄRANDE: bekräftelse-anropet muterar listan som
 * get-registrations serverar, så den optimistiska flytten bevisas överleva
 * onSettled-refetchen (annars hade kortet studsat tillbaka — en falsk grön).
 *
 * Täckning: kort-knappen endast på obekräftade + POST-kontraktet (AC #1 klient-sidan),
 * kontrollfrågan på Bekräfta alla med avbryt-vägen (AC #2), grupper + summeringsrader
 * live efter bulk (AC #2), auto-krysset läser och skriver bas-fälten (AC #3), axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const CONFIRM = '**/functions/v1/send-registration-confirmation';
const UPDATE_EVENT = '**/functions/v1/update-event';
const EVENT_ID = 'recBEKRAFTELSE001';

type Json = Record<string, unknown>;

/** YYYY-MM-DD `n` dagar från idag (toleranta fönster — T27-klassen). */
function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    // Långt fram = utanför tvåveckorsfönstret → signal-slotten bär AUTO-KRYSSET.
    startdatum: omDagar(60),
    slutdatum: omDagar(61),
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 3,
    platserKvar: 9,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.08,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 1,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 3,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 3,
    medfoljande: 0,
    vantelista: 0,
    deltagarinfoAutoAvstangt: false,
    ...overrides,
  };
}

function registrering(overrides: Json): Json {
  return {
    id: 'recX',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: 'namn@example.com',
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
    ...overrides,
  };
}

/**
 * Två OBEKRÄFTADE (Bertil äldst) + en BEKRÄFTAD. Kön är alltså 2 och arkivet 1 —
 * summeringsraden "Obekräftade anmälningar" ska stå på 2 före bekräftelsen.
 */
function grundData(): Json[] {
  return [
    registrering({ id: 'recAnna', namn: 'Anna Ek', inskickad: '2026-07-01T09:00:00.000Z' }),
    registrering({ id: 'recBertil', namn: 'Bertil Sund', inskickad: '2026-06-20T09:00:00.000Z' }),
    registrering({
      id: 'recCecilia',
      namn: 'Cecilia Lund',
      status: 'Bekräftad (mail skickat)',
      inskickad: '2026-07-05T09:00:00.000Z',
      bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
    }),
  ];
}

type Mockar = {
  /** Varje POST-body mot bekräftelse-EF:en (kontrollfrågans bevis: noll = inget hänt). */
  confirmCalls: Json[];
  /** Varje POST-body mot update-event (auto-krysset). */
  updateEventCalls: Json[];
};

/**
 * TILLSTÅNDSBÄRANDE mockar: bekräftelse-anropet muterar `deltagare`-listan som
 * get-registrations serverar (status + tidsstämpel) — precis som servern gör — så att
 * refetchen efter mutationen bekräftar den optimistiska flytten i stället för att
 * rulla tillbaka den.
 */
async function mocka(page: Page, event: Json, deltagare: Json[] = grundData()): Promise<Mockar> {
  const mockar: Mockar = { confirmCalls: [], updateEventCalls: [] };
  let aktuellt = event;
  const lista = [...deltagare];

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: aktuellt }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: lista }),
    });
  });
  await page.route(CONFIRM, async (route: Route) => {
    const body = route.request().postDataJSON() as { registrationIds: string[] };
    mockar.confirmCalls.push(body as unknown as Json);
    const nu = '2026-07-22T12:00:00.000Z';
    for (const id of body.registrationIds) {
      const i = lista.findIndex((r) => r.id === id);
      if (i >= 0) {
        lista[i] = { ...lista[i], status: 'Bekräftad (mail skickat)', bekraftelseSkickad: nu };
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        requested: body.registrationIds.length,
        attempted: body.registrationIds.length,
        confirmed: body.registrationIds,
        skipped: [],
        failed: [],
        bekraftelseSkickad: nu,
      }),
    });
  });
  await page.route(UPDATE_EVENT, async (route: Route) => {
    const body = route.request().postDataJSON() as Json;
    mockar.updateEventCalls.push(body);
    aktuellt = { ...aktuellt, ...body, id: EVENT_ID };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: aktuellt, record: { id: EVENT_ID, fields: {} } }),
    });
  });
  return mockar;
}

function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

test.describe('Hantera-flödet — bekräftelse-vertikalen (task-18.6)', () => {
  test('Skicka bekräftelse-knappen bor ENDAST på obekräftade kort, utanför person-länken', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Kön står öppen (K40) — båda obekräftade korten bär knappen.
    const knappar = gruppen(page).getByRole('button', { name: /^Skicka bekräftelse till/ });
    await expect(knappar).toHaveCount(2);

    // Arkivet: Cecilia är bekräftad → INGEN knapp på hennes kort.
    const bekraftade = gruppen(page).getByRole('button', { name: 'Bekräftade (1)', exact: true });
    await bekraftade.click();
    await expect(knappar).toHaveCount(2);

    // L303: knappen ligger UTANFÖR person-länken (interaktivt aldrig i interaktivt).
    const knappILank = await gruppen(page).locator('a[href*="/personer/"] button').count();
    expect(knappILank).toBe(0);
  });

  test('AC #1: enskild bekräftelse skickar record-ID:t och flyttar kortet till Bekräftade LIVE', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar2');

    await gruppen(page)
      .getByRole('button', { name: 'Skicka bekräftelse till Bertil Sund' })
      .click();

    // POST-kontraktet: EXAKT det ena record-ID:t + en idempotensnyckel.
    await expect.poll(() => mockar.confirmCalls.length).toBe(1);
    expect(mockar.confirmCalls[0].registrationIds).toEqual(['recBertil']);
    expect(typeof mockar.confirmCalls[0].idempotencyKey).toBe('string');

    // Kön krymper LIVE (optimistiskt, och står kvar efter refetchen).
    await expect(gruppen(page).getByRole('button', { name: 'Obekräftade (1)' })).toBeVisible();
    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar1');
    // Utskicks-raden räknar upp (tidsstämpeln skrevs i samma operation).
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ })).toHaveText(
      'Anmälningsbekräftelse skickad2 av 3−1',
    );

    // Bertil bor nu i arkivet — och bär ingen knapp längre.
    await gruppen(page).getByRole('button', { name: 'Bekräftade (2)', exact: true }).click();
    await expect(
      gruppen(page).getByRole('button', { name: 'Skicka bekräftelse till Bertil Sund' }),
    ).toHaveCount(0);
  });

  test('AC #2: Bekräfta alla KRÄVER kontrollfråga — avbryt skickar ingenting', async ({ page }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    await gruppen(page).getByRole('button', { name: 'Bekräfta alla obekräftade' }).click();

    // Massmutationens confirm-grind: dialogen står, INGET har skickats.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/2 obekräftade/)).toBeVisible();
    expect(mockar.confirmCalls).toHaveLength(0);

    await dialog.getByRole('button', { name: 'Avbryt' }).click();
    await expect(dialog).toBeHidden();
    expect(mockar.confirmCalls).toHaveLength(0);

    // Kön står orörd efter avbrytet.
    await expect(gruppen(page).getByRole('button', { name: 'Obekräftade (2)' })).toBeVisible();
  });

  test('AC #2: bekräftad kontrollfråga tömmer kön och uppdaterar summeringsraderna live', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    await gruppen(page).getByRole('button', { name: 'Bekräfta alla obekräftade' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Skicka 2 bekräftelser/ }).click();

    // ETT anrop med BÅDA record-ID:na (bulk är en operation, inte N stycken).
    await expect.poll(() => mockar.confirmCalls.length).toBe(1);
    expect((mockar.confirmCalls[0].registrationIds as string[]).sort()).toEqual([
      'recAnna',
      'recBertil',
    ]);

    await expect(dialog).toBeHidden();
    // Kön TOM → den positiva raden ersätter accordionen; alla tre är bekräftade.
    await expect(gruppen(page).getByText('Inga obekräftade — alla är bekräftade.')).toBeVisible();
    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar0');
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ })).toHaveText(
      'Anmälningsbekräftelse skickad3 av 3',
    );
    await expect(gruppen(page).getByRole('button', { name: 'Bekräftade (3)' })).toBeVisible();
  });

  test('AC #3: auto-krysset står i signal-slotten, speglar bas-fälten och skriver dem', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Utanför tvåveckorsfönstret → badgen är släckt och slotten bär krysset.
    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    const kryss = slot.getByRole('checkbox');
    // RAC-kryssets input är visuellt gömd — LABELN är den verkliga träffytan
    // (mark-paid-svitens klickaKryss-precedent; hit-target-checken fäller inputen).
    const kryssYta = kryss.locator('xpath=ancestor::label[1]');
    await expect(kryss).toBeVisible();
    // deltagarinfoAutoAvstangt=false ⇒ auto-utskicket är PÅ (ikryssat).
    await expect(kryss).toBeChecked();
    await expect(slot.getByText(/^Schemalagt att skickas automatiskt/)).toBeVisible();

    // Kryssa UR → opt-out skrivs till basen via update-event.
    await kryssYta.click();
    await expect.poll(() => mockar.updateEventCalls.length).toBe(1);
    expect(mockar.updateEventCalls[0].deltagarinfoAutoAvstangt).toBe(true);
    expect(mockar.updateEventCalls[0].eventId).toBe(EVENT_ID);
    await expect(kryss).not.toBeChecked();
    await expect(slot.getByText('Skickas inte automatiskt')).toBeVisible();

    // Kryssa I igen → opt-out av + schemalagt datum sätts (härlett ur tvåveckorsgränsen).
    await kryssYta.click();
    await expect.poll(() => mockar.updateEventCalls.length).toBe(2);
    expect(mockar.updateEventCalls[1].deltagarinfoAutoAvstangt).toBe(false);
    expect(mockar.updateEventCalls[1].deltagarinfoSchemalagd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('AC #3: schemalagt datum ur BASEN vinner över den härledda gränsen', async ({ page }) => {
    await mocka(
      page,
      eventDetail({ deltagarinfoSchemalagd: '2026-12-24', deltagarinfoAutoAvstangt: false }),
    );
    await oppnaEventsidan(page);

    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slot.getByText('Schemalagt att skickas automatiskt 24 december')).toBeVisible();
  });

  test('axe 0 med kön öppen och med kontrollfrågan uppe', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const grundlage = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(grundlage.violations).toEqual([]);

    await gruppen(page).getByRole('button', { name: 'Bekräfta alla obekräftade' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Vänta ut modalens IN-transition innan scanningen: mitt i fade:en komposit-
    // beräknar axe färgen ur en HALVGENOMSKINLIG knapp (mätt 4,17:1 mot #767f6e —
    // en animations-artefakt, inte tokenens kontrast). Färdig-läget = success-
    // tokenens faktiska värde (--mm-success #606b57, vitt på det = 5,6:1).
    await expect(dialog.getByRole('button', { name: /^Skicka 2 bekräftelser/ })).toHaveCSS(
      'background-color',
      'rgb(96, 107, 87)',
    );
    const dialoglage = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(dialoglage.violations).toEqual([]);
  });
});
