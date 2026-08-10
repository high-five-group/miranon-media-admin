import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-147.7, ADR-109 — "Skicka kvitto" skarpt ände-till-ände, e2e-täckning
 * i `chromium-authenticated`-projektet.
 *
 * SAMMA SPLIT SOM `atgarder-bekraftelsemail.staging.test.ts` (TASK-147.2)
 * OCH `atgarder-betalningar.staging.test.ts` (TASK-147.4): SERVER-kontraktet
 * (numrering, idempotens, atomicitet) är prövat mot skarp logik i
 * `tests/api/receipt-numbering.test.ts` + `tests/api/send-receipt.test.ts`
 * (api-pure, injicerade gränser). Denna fil bevisar KLIENTENS form och
 * beteende, deterministiskt via `page.route`-mock av get-events,
 * get-registrations och send-receipt-email — ingen delad staging-data rörs.
 *
 * ACCEPTANCE-KLASSEN (`tests/acceptance/atgarder-kvitto-send.acceptance.
 * test.ts`) BÄR REDAN DEN HERMETISKA VERSIONEN AV DETTA BEVIS — kropps-
 * kontraktet, det ärliga avvisnings-fallet och skärmläsar-annonseringen är
 * alla prövade DÄR, mot MSW-mockad fixturvärld. Denna fil kör i stället i
 * `chromium-authenticated` (staging-inloggad browser-kontext) — samma "två
 * lager samma bevis, olika miljö"-form 147.2:s egen fil etablerar.
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const SEND_RECEIPT_EMAIL = '**/functions/v1/send-receipt-email';
const EVENT_ID = 'recATGKVITTO00001';
const REG_ID = 'recAtgKvittoAnna1';

type Json = Record<string, unknown>;

/** Komplett Registration som passerar RegistrationSchema (samma `reg()`-form som syskonfilerna). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Kvittoprövning',
    ort: null,
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    ...overrides,
  };
}

const FACIT: Json[] = [reg(REG_ID, 'Anna Andersson')];

async function mocka(page: Page): Promise<{ sentBody: () => Json | null }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Kvittoprövning', startdatum: '2099-06-01' }),
  ]);

  let sentBody: Json | null = null;

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: FACIT }),
    });
  });

  await page.route(SEND_RECEIPT_EMAIL, async (route: Route) => {
    sentBody = route.request().postDataJSON() as Json;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        kvittonummer: 'MM-2026-1001',
        lopnummer: 1001,
        ar: 2026,
      }),
    });
  });

  return { sentBody: () => sentBody };
}

async function oppnaSidanOchBetalningar(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
  await page
    .locator('section[aria-labelledby="grupp-betalningar"]')
    .getByRole('button', { name: /Pricka av och notera/ })
    .click();
}

test.describe('Skicka kvitto — verklig sändväg mot send-receipt-email (TASK-147.7 AC #2, #3)', () => {
  test('POST med rätt kontrakt, kvittonumret redovisas i dialogen', async ({ page }) => {
    const { sentBody } = await mocka(page);
    await oppnaSidanOchBetalningar(page);

    const panel = page.locator('section[aria-labelledby="grupp-betalningar"]');
    await panel
      .getByRole('button', { name: 'Skicka kvitto - Anmälningsavgift för Anna Andersson' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Skicka kvitto - Anmälningsavgift' });
    await dialog.getByRole('textbox', { name: 'Belopp (kr)' }).fill('1250');
    await dialog.getByRole('button', { name: 'Betalsätt' }).click();
    await page.getByRole('option', { name: 'Swish' }).click();
    await dialog.getByRole('button', { name: 'Skicka' }).click();

    await expect(dialog.getByText('MM-2026-1001 skickat till Anna Andersson.')).toBeVisible();

    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.registrationId).toBe(REG_ID);
    expect(body.eventId).toBe(EVENT_ID);
    expect(body.betalning).toBe('avgift');
    expect(body.belopp).toBe(1250);
    expect(body.betalsatt).toBe('Swish');
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
