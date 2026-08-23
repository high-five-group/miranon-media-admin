import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-147.3 — "Skicka betalningspåminnelse", "Skicka deltagarinformation" och
 * "Skicka mail" (fritt) skarpt ände-till-ände (åtgärd 2–4), e2e-täckning i
 * `chromium-authenticated`-projektet. SAMMA SPLIT och SAMMA route-mock-mönster
 * som `atgarder-bekraftelsemail.staging.test.ts` (TASK-147.2) — server-
 * kontraktet (mail + fält-skrivning, deny-by-default, idempotens, delutfall)
 * är prövat mot skarp EF-logik i `tests/api/send-action-email.test.ts`
 * (TASK-147.1, api-pure, injicerade gränser); denna fil bevisar KLIENTENS
 * form och beteende för de tre TYPER som TASK-147.2 inte täckte.
 *
 * ACCEPTANCE-KLASSEN (`tests/acceptance/atgarder-paminnelse-eventinfo-fritt-
 * send.acceptance.test.ts`) BÄR REDAN DEN HERMETISKA VERSIONEN AV DETTA BEVIS
 * — kroppskontraktet, urvalsfilter-uteslutningen, redigerad text i stället
 * för mallen, delutfallet och fallna-kvar-markerade-omkörningen är alla
 * prövade DÄR mot MSW-mockad fixturvärld. Denna fil är INTE en dubblett: den
 * kör i `chromium-authenticated` (staging-inloggad browser-kontext) i
 * stället för fixturvärldens seedade session.
 *
 * [ADR-086] LOKALT EJ KÖRT — port 5173 (`E2E_DEV_PORT`, playwright.config.ts)
 * var upptagen av en levande Marcus-process vid byggtillfället
 * (`lsof -i :5173`: PID 50138, `npm run dev`, ESTABLISHED-anslutning från en
 * Chrome-flik) — samma dokumenterade "hård vägran mot människans dev-server"
 * som `#1105`/`atgarder-bekraftelsemail.staging.test.ts` § header beskriver
 * för TASK-147.2. Filen är byggd mot EXAKT samma etablerade mönster som den
 * syskonfilen (route-mock, fixturform, `RegistrationSchema`-fullständighet)
 * och verifierad via `npm run typecheck` + `npx @biomejs/biome check .` —
 * SKARP KÖRNING är obevisad lokalt och betalas av PR:ens egen CI-körning
 * (samma öppna bokföring som `#1105`, bokfört i kortets notes).
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const SEND_ACTION_EMAIL = '**/functions/v1/send-action-email';
const EVENT_ID = 'recATGPAMEVFRITT01';

type Json = Record<string, unknown>;

/** Komplett Registration som passerar RegistrationSchema (`atgarder-
    bekraftelsemail.staging.test.ts` § `reg()`-formen, återanvänd). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Påminnelse-/eventinfo-/frittprövning',
    ort: 'Skövde',
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

/** Sätter upp get-events/get-registrations-mocken och en fångande send-action-email-route. */
async function mocka(page: Page, registrations: Json[]): Promise<{ sentBody: () => Json | null }> {
  await mockValjarLista(page, [
    valjarRad({
      id: EVENT_ID,
      namn: 'Påminnelse-/eventinfo-/frittprövning',
      startdatum: '2099-06-01',
    }),
  ]);

  let sentBody: Json | null = null;

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations }),
    });
  });

  await page.route(SEND_ACTION_EMAIL, async (route: Route) => {
    sentBody = route.request().postDataJSON() as Json;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        requested: registrations.length,
        attempted: registrations.length,
        completed: registrations.map((r) => r.id as string),
        skipped: [],
        failed: [],
      }),
    });
  });

  return { sentBody: () => sentBody };
}

async function oppnaSidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

test.describe('Skicka betalningspåminnelse — verklig sändväg mot send-action-email (TASK-147.3 AC #1)', () => {
  test('POST med rätt kontrakt (urvalsfiltrets obetald-mängd), avmarkering efter "Tillbaka till åtgärderna"', async ({
    page,
  }) => {
    // Båda obetalda (slutbetalning saknas) — status Bekräftad, alltså UTANFÖR
    // "obekräftad"-seedet men INNANFÖR "obetald"-seedet: samma seeding-regel
    // (`obekraftad(r) || obetald(r)`) som `AtgardsSida.tsx` kör.
    const registrations = [
      reg('recPamEva0000001', 'Eva Lindqvist'),
      reg('recPamJohan000002', 'Johan Berg'),
    ];
    const { sentBody } = await mocka(page, registrations);
    await oppnaSidan(page);

    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    // Scopat till deltagarlistans namn-span (`data-testid="deltagar-namn"`,
    // `AtgardsSida.tsx` § `DeltagarKortInnehall`) — SAMMA komponentträd som
    // `atgarder-bekraftelsemail.staging.test.ts` (TASK-147.2), där otextscopad
    // `getByText` matchade FYRA element (sr-only-sammanfattningen,
    // mottagar-preview-badgen, deltagarkortet och den alltid-monterade-men-
    // `hidden` Betalnings-panelens namnrad) och gav Playwrights strict-mode-fel
    // (post-merge-run 31387516343, issue #1113). `data-testid="deltagar-namn"`
    // sätts ENDAST på deltagarkortets namn-span, så filtreringen är unik.
    await expect(
      page.getByTestId('deltagar-namn').filter({ hasText: 'Eva Lindqvist' }),
    ).toBeVisible();
    await expect(page.getByTestId('deltagar-namn').filter({ hasText: 'Johan Berg' })).toBeVisible();

    await page.getByRole('button', { name: /Skicka betalningspåminnelse/ }).click();
    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka betalningspåminnelse\s+till\s+2\s+personer/)).toBeVisible();

    // INGEN "Prototyp-rigg." toHaveCount(0)-assertion här, MEDVETET (till
    // skillnad från `atgarder-bekraftelsemail.staging.test.ts`s motsvarande
    // rad för `bekraftelse`): `PrototypRigg`s monteringsvillkor
    // (`granskning.atgard.nyckel !== 'bekraftelse'`) rörs INTE av denna
    // skiva — se `AtgardsSida.tsx` § PrototypRigg-docblocken. Riggen
    // MONTERAS ALLTSÅ ÄNNU i DEV-läge (`npm run dev`, denna projekts
    // webServer) för `paminnelse`/`eventinfo`/`fritt`, bara funktionellt
    // INERT sedan `skicka()` alltid går den verkliga vägen. Rivningen är
    // TASK-147.8s uttryckliga scope.
    const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
    await vaxel.focus();
    await vaxel.press('Enter');
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.actionType).toBe('paminnelse');
    expect(body.eventId).toBe(EVENT_ID);
    expect(body.registrationIds).toEqual(['recPamEva0000001', 'recPamJohan000002']);
    expect(body.amne).toBe('Påminnelse om betalning');
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // AC #3-arvet (147.2:s regel, oförändrad): båda lyckade → båda avmarkerade.
    await page.locator('button', { hasText: 'Tillbaka till åtgärderna' }).click();
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByText('0 av 2 deltagare markerade')).toBeVisible();
  });
});

test.describe('Skicka deltagarinformation — verklig sändväg mot send-action-email (TASK-147.3 AC #1-#2)', () => {
  test('redigerad ämnesrad/brödtext sänds i stället för mallen; inget urvalsfilter', async ({
    page,
  }) => {
    const registrations = [reg('recEvtinfoAda00001', 'Ada Nilsson', { status: 'Obekräftad' })];
    const { sentBody } = await mocka(page, registrations);
    await oppnaSidan(page);

    await page.getByRole('button', { name: /Skicka deltagarinformation/ }).click();
    await page.getByRole('button', { name: 'Ändra' }).click();
    await page.getByRole('textbox', { name: 'Ämne' }).fill('Praktisk info');
    await page
      .getByRole('textbox', { name: 'Meddelandetext' })
      .fill('Hej {förnamn},\n\nParkering finns vid {ort}.\n\nRoger och Lotta');
    await page.getByRole('button', { name: 'Klar med texten' }).click();

    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka deltagarinformation\s+till\s+1\s+person\b/)).toBeVisible();
    await expect(page.getByText('Praktisk info')).toBeVisible();
    await expect(page.getByText(/Parkering finns vid Skövde\./)).toBeVisible();

    const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
    await vaxel.focus();
    await vaxel.press('Enter');
    await page.getByRole('button', { name: 'Skicka till 1 person' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.actionType).toBe('eventinfo');
    expect(body.registrationIds).toEqual(['recEvtinfoAda00001']);
    expect(body.amne).toBe('Praktisk info');
    expect(body.mailtext).toBe('Hej {förnamn},\n\nParkering finns vid {ort}.\n\nRoger och Lotta');
  });
});

test.describe('Skicka mail (fritt) — verklig sändväg mot send-action-email (TASK-147.3 AC #1-#2)', () => {
  test('fritt utskick utan mall-grund sänder den skrivna texten', async ({ page }) => {
    const registrations = [reg('recFrittBo000001', 'Bo Karlsson', { status: 'Obekräftad' })];
    const { sentBody } = await mocka(page, registrations);
    await oppnaSidan(page);

    await page.getByRole('button', { name: /^Skicka mail\b/ }).click();
    await page.getByRole('textbox', { name: 'Ämne' }).fill('En hälsning');
    await page
      .getByRole('textbox', { name: 'Meddelandetext' })
      .fill('Hej {förnamn},\n\nEtt fritt meddelande utan mall.\n\nRoger och Lotta');

    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka mail\s+till\s+1\s+person\b/)).toBeVisible();

    const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
    await vaxel.focus();
    await vaxel.press('Enter');
    await page.getByRole('button', { name: 'Skicka till 1 person' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.actionType).toBe('fritt');
    expect(body.registrationIds).toEqual(['recFrittBo000001']);
    expect(body.amne).toBe('En hälsning');
    expect(body.mailtext).toBe(
      'Hej {förnamn},\n\nEtt fritt meddelande utan mall.\n\nRoger och Lotta',
    );
  });
});
