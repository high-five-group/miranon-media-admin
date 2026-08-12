import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-147.2 — "Skicka bekräftelsemail" skarpt ände-till-ände (åtgärd 1),
 * e2e-täckning i `chromium-authenticated`-projektet.
 *
 * SAMMA SPLIT SOM `atgarder-betalningar.staging.test.ts` (TASK-147.4) OCH
 * `event-bekraftelse.staging.test.ts` (task-48): SERVER-kontraktet (mail +
 * fält-skrivning, deny-by-default, idempotens, delutfall) är prövat mot
 * skarp EF-logik i `tests/api/send-action-email.test.ts` (TASK-147.1,
 * api-pure, injicerade gränser). Denna fil bevisar KLIENTENS form och
 * beteende, deterministiskt via `page.route`-mock av get-events,
 * get-registrations och send-action-email — ingen delad staging-data rörs.
 *
 * ACCEPTANCE-KLASSEN (`tests/acceptance/atgarder-bekraftelsemail-send.
 * acceptance.test.ts`) BÄR REDAN DEN HERMETISKA VERSIONEN AV DETTA BEVIS —
 * kroppskontraktet, delutfallet, fallna-kvar-markerade-omkörningen och
 * skärmläsar-annonseringen är alla prövade DÄR, mot MSW-mockad fixturvärld.
 * Denna fil är INTE en dubblett: den kör i `chromium-authenticated`
 * (staging-inloggad browser-kontext) i stället för fixturvärldens seedade
 * session — samma "två lager samma bevis, olika miljö"-form som paret
 * `mer-segment-send.acceptance.test.ts` / `tests/api/send-email.staging.
 * test.ts` redan etablerar för segment-utskicket.
 *
 * [ADR-086] LOKALT EJ KÖRT — port 5173 var upptagen av en levande
 * Marcus-process (`lsof -i :5173` verifierat mot huvudkatalogens cwd,
 * `/Users/marcus/Repon/miranon-media-admin`; PID 50113/50138, `npm run dev`
 * startad Sat06PM) vid byggtillfället — samma dokumenterade "hård vägran mot
 * människans dev-server" som `#1105`s beskrivning av samma villkor
 * (`atgarder-betalningar.staging.test.ts` § header). Filen är byggd mot
 * EXAKT samma etablerade mönster som de två syskonfilerna ovan (route-mock,
 * fixturform, `RegistrationSchema`-fullständighet) och verifierad via
 * `npm run typecheck` + `npx @biomejs/biome check .` — SKARP KÖRNING är
 * obevisad lokalt och betalas av PR:ens egen CI-körning (samma öppna
 * bokföring som `#1105`).
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const SEND_ACTION_EMAIL = '**/functions/v1/send-action-email';
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const EVENT_ID = 'recATGBEKRAFTELSE1';

type Json = Record<string, unknown>;

/** Statementet log-activity tagit emot (TASK-201.3 AC #4, pilot 3/3 —
 * mail-åtgärd) — bara de fält testet faktiskt behöver bevisa. */
type Aktivitetslogg = {
  actor: { name: string; account: { name: string } };
  verb: { display: Record<string, string> };
  object: { definition: { name: Record<string, string>; type: string } };
};

/** Komplett Registration som passerar RegistrationSchema (`mark-paid.staging.
    test.ts` § `reg()`-formen, återanvänd ur `atgarder-betalningar.staging.
    test.ts`). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Bekräftelseprövning',
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
  reg('recBekEva0000001', 'Eva Lindqvist'),
  reg('recBekJohan000002', 'Johan Berg'),
];

async function mocka(
  page: Page,
): Promise<{ sentBody: () => Json | null; aktivitetsloggar: Aktivitetslogg[] }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Bekräftelseprövning', startdatum: '2099-06-01' }),
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

  await page.route(SEND_ACTION_EMAIL, async (route: Route) => {
    sentBody = route.request().postDataJSON() as Json;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'partial',
        requested: 2,
        attempted: 2,
        completed: ['recBekEva0000001'],
        skipped: [{ registrationId: 'recBekJohan000002', reason: 'already_confirmed' }],
        failed: [],
      }),
    });
  });

  // [TASK-201.3, AC #4] recordActivity fire-and-forget:ar EN post PER
  // FAKTISKT skickad mottagare (`useSendActionEmail`s onSuccess,
  // `actionEmail.ts`) — Eva (completed) ska logga, Johan (skipped) ska INTE.
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

async function oppnaSidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

test.describe('Skicka bekräftelsemail — verklig sändväg mot send-action-email (TASK-147.2 AC #1, #3)', () => {
  test('POST med rätt kontrakt, ärligt delutfall, fallna kvar markerade efter "Tillbaka till åtgärderna"', async ({
    page,
  }) => {
    const { sentBody, aktivitetsloggar } = await mocka(page);
    await oppnaSidan(page);

    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    // Scopat till deltagarlistans namn-span (`data-testid="deltagar-namn"`,
    // `AtgardsSida.tsx` § `DeltagarKortInnehall`) — samma text förekommer
    // annars i FYRA element (sr-only-sammanfattningen, mottagar-preview-
    // badgen, deltagarkortet och den alltid-monterade-men-`hidden`
    // Betalnings-panelens namnrad), vilket gav Playwrights strict-mode-fel
    // (post-merge-run 31387516343, issue #1113). `data-testid="deltagar-namn"`
    // sätts ENDAST på deltagarkortets namn-span, så filtreringen är unik.
    await expect(
      page.getByTestId('deltagar-namn').filter({ hasText: 'Eva Lindqvist' }),
    ).toBeVisible();
    await expect(page.getByTestId('deltagar-namn').filter({ hasText: 'Johan Berg' })).toBeVisible();

    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();
    await page.getByRole('button', { name: 'Granska och skicka' }).click();
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();

    // Riggen är BORTA för bekräftelse (TASK-147.2) — den verkliga vägen har
    // ersatt dess roll, inte bara lagts bredvid den.
    await expect(page.getByText('Prototyp-rigg.')).toHaveCount(0);

    const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
    await vaxel.focus();
    await vaxel.press('Enter');
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    // Body-kontraktet mot EF:en (TASK-147.1).
    await expect.poll(() => sentBody()).not.toBeNull();
    const body = sentBody() as unknown as Json;
    expect(body.actionType).toBe('bekraftelse');
    expect(body.eventId).toBe(EVENT_ID);
    expect(body.registrationIds).toEqual(['recBekEva0000001', 'recBekJohan000002']);
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // [TASK-201.3 AC #4] AKTIVITETSLOGGEN: EN post — Eva (completed), ALDRIG
    // Johan (skipped, "redan bekräftad") — servern är facit, inte urvalet.
    await expect.poll(() => aktivitetsloggar.length).toBe(1);
    const [logg] = aktivitetsloggar;
    expect(logg.actor.name.length).toBeGreaterThan(0);
    expect(logg.actor.account.name.length).toBeGreaterThan(0);
    expect(logg.verb.display['sv-SE']).toBe('skickade bekräftelsemail');
    expect(logg.object.definition.name['sv-SE']).toBe('Eva Lindqvist (Bekräftelseprövning)');
    expect(logg.object.definition.type).toContain('/activity-types/mail');

    // Skärmläsar-annonseringen (berättelse 26): role=status (partial → intent
    // 'info'), inte en egen announcer-rad.
    const utfallStatus = page.getByRole('status').filter({ hasText: 'Utskicket lyckades delvis' });
    await expect(utfallStatus).toContainText('1 av 2 person fick mailet.');

    // Skälet står på KORTET (UtfallsKort), inte i sammanfattningsrutan —
    // svenska mappningen av EF:ens `already_confirmed` (`skalForSkip`).
    await expect(page.getByText('Redan bekräftad')).toBeVisible();

    // AC #3: fallen (Johan) kvar markerad, lyckad (Eva) avmarkerad — mätt i
    // HUBBEN efter återgång, inte antaget ur mutationssvaret.
    await page.locator('button', { hasText: 'Tillbaka till åtgärderna' }).click();
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByText('1 av 2 deltagare markerade')).toBeVisible();
    const evaKryss = page.getByRole('checkbox', { name: /Eva Lindqvist/ });
    await expect(evaKryss).toBeVisible();
    await expect(evaKryss).not.toBeChecked();
    const johanKryss = page.getByRole('checkbox', { name: /Johan Berg/ });
    await expect(johanKryss).toBeChecked();
  });
});
