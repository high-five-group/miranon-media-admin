import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-147.10 — "Skicka test till mig" (T53 väg C, ADR-067 D10) skarpt
 * ände-till-ände, e2e-täckning i `chromium-authenticated`-projektet.
 *
 * SAMMA SPLIT SOM `atgarder-bekraftelsemail.staging.test.ts` (TASK-147.2):
 * SERVER-kontraktet (EN mottagare, TEST-prefix, testRecipientEmail-
 * överskrivningen, GOLVet, ingen fält-skrivning) är prövat mot skarp
 * EF-logik i `tests/api/send-action-email.test.ts` (TASK-147.10, api-pure,
 * injicerade gränser, § `runActionTestSend`). Denna fil bevisar KLIENTENS
 * form och beteende, deterministiskt via `page.route`-mock av get-events,
 * get-registrations och send-action-email — ingen delad staging-data rörs.
 *
 * ACCEPTANCE-KLASSEN (`tests/acceptance/atgarder-testmail-send.acceptance.
 * test.ts`) BÄR REDAN DEN HERMETISKA VERSIONEN AV DETTA BEVIS. Denna fil är
 * INTE en dubblett: den kör i `chromium-authenticated` (staging-inloggad
 * browser-kontext) i stället för fixturvärldens seedade session — samma
 * "två lager samma bevis, olika miljö"-form som paret `atgarder-
 * bekraftelsemail-send.acceptance.test.ts` / `atgarder-bekraftelsemail.
 * staging.test.ts` redan etablerar.
 *
 * [ADR-086] LOKALT EJ KÖRT — port 5173 bär en LEVANDE Marcus-process
 * (`lsof -i :5173` verifierat mot huvudkatalogens cwd,
 * `/Users/marcus/Repon/miranon-media-admin`; PID 50138, `npm run dev`,
 * samma process 147.2:s e2e-syskonfil redan dokumenterade) vid
 * byggtillfället — samma dokumenterade "hård vägran mot människans
 * dev-server" som `atgarder-bekraftelsemail.staging.test.ts` § header
 * beskriver. Filen är byggd mot EXAKT samma etablerade mönster som
 * syskonfilen (route-mock, fixturform, `RegistrationSchema`-fullständighet)
 * och verifierad via `npm run typecheck` + `npx @biomejs/biome check .` —
 * SKARP KÖRNING är obevisad lokalt och betalas av PR:ens egen CI-körning
 * (samma öppna bokföring som `#1105`/147.2).
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const SEND_ACTION_EMAIL = '**/functions/v1/send-action-email';
const EVENT_ID = 'recATGTESTMAIL0001';

type Json = Record<string, unknown>;

/** Komplett Registration som passerar RegistrationSchema (`atgarder-bekraftelsemail.
    staging.test.ts` § `reg()`-formen, återanvänd oförändrad). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Testmailprövning',
    ort: null,
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
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    ...overrides,
  };
}

const FACIT: Json[] = [
  reg('recTestEva0000001', 'Eva Lindqvist'),
  reg('recTestJohan000002', 'Johan Berg'),
];

async function mocka(page: Page): Promise<{ sentBody: () => Json | null }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Testmailprövning', startdatum: '2099-06-01' }),
  ]);

  let sentBody: Json | null = null;

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: FACIT }),
    });
  });

  await page.route(SEND_ACTION_EMAIL, async (route: Route) => {
    sentBody = route.request().postDataJSON() as Json;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'sent' }),
    });
  });

  return { sentBody: () => sentBody };
}

async function oppnaSidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

test.describe('Skicka till min inkorg — testmailets sändväg mot send-action-email (TASK-147.10 AC #1-#2)', () => {
  test('POST med testSend:true + EXAKT den FÖRSTA mottagaren, ingen mottagare i urvalet berörd, granska-läget orört', async ({
    page,
  }) => {
    const { sentBody } = await mocka(page);
    await oppnaSidan(page);

    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();
    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();

    // Riggen är BORTA för bekräftelse (TASK-147.2) — oförändrat av denna skiva.
    await expect(page.getByText('Prototyp-rigg.')).toHaveCount(0);

    await page.getByRole('button', { name: 'Skicka till min inkorg' }).click();

    // Body-kontraktet mot EF:ens testgren (TASK-147.10).
    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.actionType).toBe('bekraftelse');
    expect(body.eventId).toBe(EVENT_ID);
    // FÖRSTA mottagaren (Eva) ENSAM — Johan är INTE med (AC #2: ingen adress
    // ur urvalet UTÖVER den enda platshållar-källan kontaktas av testvägen).
    expect(body.registrationIds).toEqual(['recTestEva0000001']);
    expect(body.testSend).toBe(true);
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // Bekräftelsen — scopad mot texten (INTE en global getByText: "Eva
    // Lindqvist" förekommer på flera DOM-platser, samma scope-fälla dagens
    // fix-våg (f5da0a1f) dokumenterar för denna filklass). Kopian bytte form
    // (S102, Marcus form-beslut A): "Testmail skickat till X." → "Skickat
    // till X" — etiketten "Testmail" står redan till vänster om raden.
    await expect(page.getByText(/^Skickat till /)).toBeVisible();

    // FORTFARANDE GRANSKA-LÄGET, ingen mottagare avmarkerad — testmailet
    // rör inte den verkliga sändningens tillstånd.
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
    await expect(
      page.getByTestId('deltagar-namn').filter({ hasText: 'Eva Lindqvist' }),
    ).toBeVisible();
    await expect(page.getByTestId('deltagar-namn').filter({ hasText: 'Johan Berg' })).toBeVisible();
  });
});
