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
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const EVENT_ID = 'recATGKVITTO00001';
const REG_ID = 'recAtgKvittoAnna1';

/** Statementet log-activity tagit emot (TASK-201.4 AC #3) — samma minimala
 * form som `atgarder-betalningar.staging.test.ts` § `Aktivitetslogg`. */
type Aktivitetslogg = {
  actor: { name: string; account: { name: string } };
  verb: { display: Record<string, string> };
  object: { definition: { name: Record<string, string>; type: string } };
};

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

async function mocka(
  page: Page,
): Promise<{ sentBody: () => Json | null; aktivitetsloggar: Aktivitetslogg[] }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Kvittoprövning', startdatum: '2099-06-01' }),
  ]);

  let sentBody: Json | null = null;
  const aktivitetsloggar: Aktivitetslogg[] = [];

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

  // [TASK-201.4, AC #3] recordActivity fire-and-forget:ar EFTER
  // send-receipt-email redan lyckats (samma mönster som
  // `atgarder-betalningar.staging.test.ts`) — mocken svarar alltid 201 med
  // EF:ens faktiska form.
  await page.route(LOG_ACTIVITY, async (route: Route) => {
    const body = route.request().postDataJSON() as Aktivitetslogg & {
      id: string;
      context: { extensions: Record<string, string> };
    };
    aktivitetsloggar.push(body);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: body.id,
        requestId: Object.values(body.context.extensions)[0],
        occurredAt: new Date().toISOString(),
      }),
    });
  });

  return { sentBody: () => sentBody, aktivitetsloggar };
}

async function oppnaSidanOchBetalningar(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
  await page
    .locator('section[aria-labelledby="grupp-betalningar"]')
    .getByRole('button', { name: /Pricka av och notera/ })
    .click();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SKIPPAD AV TASK-346.7 — DIALOGEN FINNS INTE MED MILJÖFLAGGAN PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * Båda testerna nedan öppnar knappen "Skicka kvitto - …" i Åtgärds-panelen.
 * Sedan TASK-346.7 renderas den knappen bara med `VITE_FEATURE_BETALNINGAR`
 * satt till annat än `pa` — och e2e-klassen kör med `pa` (`.env.development`;
 * `playwright.config.ts`s e2e-webServer sätter ingen egen flagga).
 *
 * VARFÖR DIALOGEN RIVS: den bygger på ADR-109 beslut 7-flödet, där Lotta
 * skriver kvittobeloppet för hand i en ruta utan felmeddelanden. Det beslutet
 * är rivet (PRD TASK-346 § ADR-koppling). Kvittot avser numera exakt EN
 * inbetalning och bär dess belopp och datum (ADR-128), så ett handskrivet
 * belopp kan inte längre peka på någon inbetalning — Roger hade fått en
 * verifikation utan motpost.
 *
 * SKIPPAD OCH INTE RADERAD, med avsikt: `send-receipt-email` är fortfarande
 * deployad, och med flaggan AV är dialogen Lottas enda kvittoväg i PROD tills
 * Marcus slår på flaggan. Bevisen för den vägen får inte försvinna medan
 * vägen kör.
 *
 * ATT DIALOGEN FAKTISKT ÄR BORTA med flaggan på bevisas positivt i
 * `atgarder-betalningar.staging.test.ts` § "gamla 'Skicka kvitto'-dialogen är
 * RIVEN ur panelen" — den nya kvittovägen (Visa/Skicka igen per
 * inbetalningsrad) prövas i `tests/api/kvitto-visa-skicka-igen.test.ts` och i
 * acceptansvandringen mot staging.
 *
 * VEM SOM STÄNGER DET HÄR: `TASK-346.12` river flaggan och därmed dialogen,
 * `useSendReceipt` och denna fil.
 */
test.describe
  .skip('Skicka kvitto — verklig sändväg mot send-receipt-email (TASK-147.7 AC #2, #3) [SKIPPAD: dialogen är riven med miljöflaggan på, TASK-346.7]', () => {
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

    test('AKTIVITETSLOGGEN (TASK-201.4 AC #3): ett skickat kvitto postar log-activity med rätt aktör, verb och objekt-namn', async ({
      page,
    }) => {
      const { aktivitetsloggar } = await mocka(page);
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

      await expect.poll(() => aktivitetsloggar.length).toBe(1);
      const [logg] = aktivitetsloggar;
      // AKTÖR: ett giltigt (icke-tomt) namn skickas klient-sidan — samma
      // form-bevis som `atgarder-betalningar.staging.test.ts`, den
      // AUKTORITATIVA identiteten härleds server-side.
      expect(logg.actor.name.length).toBeGreaterThan(0);
      expect(logg.actor.account.name.length).toBeGreaterThan(0);
      expect(logg.verb.display['sv-SE']).toBe('skickade kvitto');
      expect(logg.object.definition.name['sv-SE']).toBe('Anna Andersson (Kvittoprövning)');
      expect(logg.object.definition.type).toContain('/activity-types/kvitto');
    });
  });
