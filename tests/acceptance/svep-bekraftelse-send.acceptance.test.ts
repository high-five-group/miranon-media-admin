import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-241.3 — Bekräftelsesvepet, ände till ände: verklig sändväg (AC #1/#2),
 * aktivitetslogg per event-grupp (AC #4), avbryt-utan-sidoeffekt (AC #5).
 *
 * VAD DENNA FIL BEVISAR (samma söm-kontrakt som
 * `atgarder-bekraftelsemail-send.acceptance.test.ts` § docblock): att
 * SÄNDYTAN, given svar av `send-action-email`-EF:ens egen form
 * (`SendActionEmailResultSchema`), (1) gör ETT POST-anrop PER event-grupp
 * (ADR-114 beslut 3), (2) renderar ett ärligt delresultat PER GRUPP —
 * sent/partial/failed SAMTIDIGT, aldrig en global siffra som döljer vad som
 * faktiskt gick fram, och (3) lämnar EN aktivitetspost per faktiskt skickad
 * mottagare, taggad med DEN gruppens `eventId`. STOPP-VILLKORET (AC #1)
 * prövade Åtgärds-sidans befintliga sändkontrakt design-tid (`dataSource.
 * sendActionEmail`, bulk `registrationIds[]` per `eventId`) och fann att det
 * räckte utan ny EF — denna fil bevisar konsekvensen: att SVEPETS nya klient-
 * lager (`useSendSvep`, `data/mutations/svepSend.ts`) faktiskt loopar en gång
 * per grupp mot exakt den ytan, inte att EF:en själv gör något nytt (dess
 * batch-egenskap är redan bevisad av `tests/api/send-action-email.test.ts`).
 *
 * FIXTUREN ÄR EGEN, INTE ÅTERANVÄND UR `hem.acceptance.test.ts`: den filen är
 * under samtidig omskrivning (TASK-243.3, "nya Morgonkoll-formen") och en
 * delad `mock()`-helper därifrån vore en couplings-risk mot en rörlig källa.
 * `reg()`/`ev()` nedan är egna, schema-typade byggare (samma mönster,
 * oberoende kopia — RegistrationSchema/EventSchema är den gemensamma
 * sanningskällan båda filerna härleder ifrån).
 *
 * ABSOLUT MAILFÖRBUD UTANFÖR ÖVERSKUGGNINGEN: `send-action-email` är INTE i
 * normalläget (`handlers.ts`) — varje test nedan överskuggar den explicit.
 */

type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

function reg(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    status: 'Obekräftad',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEventA',
    personId: 'recPersonA',
    ...overrides,
  };
}

function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'EVT',
    eventNamn: 'Sommarkurs i akvarell',
    typ: 'Kurs',
    ort: 'Uppsala',
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

// Tre event-grupper — SAMMA delresultat-form som facitets fel-resultat-läge
// (ADR-114 beslut 3): en grupp helt lyckad, en delvis, en helt fallen —
// samtidigt, i EN körning.
const EVENT_A = 'recEventA0001';
const EVENT_B = 'recEventB0002';
const EVENT_C = 'recEventC0003';
const REG_A1 = 'recRegA0000001';
const REG_A2 = 'recRegA0000002';
const REG_B1 = 'recRegB0000001';
const REG_B2 = 'recRegB0000002';
const REG_C1 = 'recRegC0000001';

const EVENTS = [
  ev({ id: EVENT_A, eventNamn: 'Sommarkurs i akvarell', ort: 'Uppsala' }),
  ev({ id: EVENT_B, eventNamn: 'Hantverkshelg', ort: 'Falun' }),
  ev({ id: EVENT_C, eventNamn: 'Novemberretreat', ort: 'Åre' }),
];

const REGISTRATIONS = [
  reg({
    id: REG_A1,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    eventId: EVENT_A,
    eventNamn: 'Sommarkurs i akvarell',
    personId: 'recPersonA1',
  }),
  reg({
    id: REG_A2,
    fornamn: 'Erik',
    efternamn: 'Sandberg',
    email: 'erik@example.se',
    eventId: EVENT_A,
    eventNamn: 'Sommarkurs i akvarell',
    personId: 'recPersonA2',
  }),
  reg({
    id: REG_B1,
    fornamn: 'Björn',
    efternamn: 'Ahlgren',
    email: 'bjorn@example.se',
    eventId: EVENT_B,
    eventNamn: 'Hantverkshelg',
    personId: 'recPersonB1',
  }),
  reg({
    id: REG_B2,
    fornamn: 'Maria',
    efternamn: 'Ek',
    email: 'maria@example.se',
    eventId: EVENT_B,
    eventNamn: 'Hantverkshelg',
    personId: 'recPersonB2',
  }),
  reg({
    id: REG_C1,
    fornamn: 'Johanna',
    efternamn: 'Berg',
    email: 'johanna@example.se',
    eventId: EVENT_C,
    eventNamn: 'Novemberretreat',
    personId: 'recPersonC1',
  }),
];

function mockDashboard(network: { use: (...h: ReturnType<typeof http.get>[]) => void }) {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: REGISTRATIONS })),
    http.get(EF('get-events'), () => json({ events: EVENTS })),
  );
}

async function gotoHemOchOppnaSvepet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Bekräfta alla', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toBeVisible();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som Åtgärds-sidans sändvägssviter). */
async function armera(page: Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta bekräftelsesvepet' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

interface SendActionEmailBody {
  actionType: string;
  eventId: string;
  registrationIds: string[];
  amne: string;
  mailtext: string;
  idempotencyKey: string;
  attachmentIds?: string[];
}

test.describe('Bekräftelsesvepet — verklig sändväg, delresultat per event-grupp (TASK-241.3 AC #1/#2)', () => {
  test('tre event-grupper: sent + partial + failed SAMTIDIGT — ett POST per grupp, aldrig en global siffra', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    const sentBodies: SendActionEmailBody[] = [];
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        const body = (await request.json()) as SendActionEmailBody;
        sentBodies.push(body);
        if (body.eventId === EVENT_A) {
          return json({
            status: 'sent',
            requested: 2,
            attempted: 2,
            completed: [REG_A1, REG_A2],
            skipped: [],
            failed: [],
          });
        }
        if (body.eventId === EVENT_B) {
          return json({
            status: 'partial',
            requested: 2,
            attempted: 2,
            completed: [REG_B1],
            skipped: [],
            failed: [{ registrationId: REG_B2, reason: 'E-postadressen studsade' }],
          });
        }
        if (body.eventId === EVENT_C) {
          return json({
            status: 'failed',
            requested: 1,
            attempted: 1,
            completed: [],
            skipped: [],
            failed: [{ registrationId: REG_C1, reason: 'Serverfel, försök igen' }],
          });
        }
        throw new Error(`Oväntat eventId i send-action-email: ${body.eventId}`);
      }),
    );

    await gotoHemOchOppnaSvepet(page);

    // GRANSKA: cross-event-summeringen (5 personer i 3 event).
    await expect(
      page.getByText(/Bekräftelsemail\s+till\s+5\s+personer\s+i\s+3\s+event/),
    ).toBeVisible();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 5 personer' }).click();

    // RESULTATET: ärligt delutfall — "delvis" (inte "lyckades", inte "misslyckades").
    await expect(
      page.getByRole('status').filter({ hasText: 'Utskicket lyckades delvis' }),
    ).toBeVisible();
    const sammanfattning = page
      .getByRole('status')
      .filter({ hasText: 'Utskicket lyckades delvis' });
    await expect(sammanfattning).toContainText('3 av 5 personer fick mailet.');
    await expect(sammanfattning).toContainText(
      '2 fick det inte. Skälet står på respektive event nedan, och du kan gå tillbaka och köra om just de grupperna.',
    );

    // PER-GRUPP-RADERNA: tre olika utfall, samtidigt synliga.
    const utfallSektion = page.getByRole('region', { name: 'Utfall per event' });
    await expect(utfallSektion.getByText('Sommarkurs i akvarell')).toBeVisible();
    await expect(utfallSektion.getByText('2 av 2 lyckades')).toBeVisible();
    await expect(utfallSektion.getByText('Hantverkshelg')).toBeVisible();
    await expect(utfallSektion.getByText('1 av 2 lyckades')).toBeVisible();
    await expect(utfallSektion.getByText('Maria Ek: E-postadressen studsade')).toBeVisible();
    await expect(utfallSektion.getByText('Novemberretreat')).toBeVisible();
    await expect(utfallSektion.getByText('0 av 1 lyckades')).toBeVisible();
    await expect(utfallSektion.getByText('Johanna Berg: Serverfel, försök igen')).toBeVisible();

    // ETT POST PER EVENT-GRUPP (AC #2 — inte ett per mottagare, inte ett globalt).
    expect(sentBodies).toHaveLength(3);
    const perEvent = new Map(sentBodies.map((b) => [b.eventId, b]));
    expect(perEvent.get(EVENT_A)?.registrationIds).toEqual([REG_A1, REG_A2]);
    expect(perEvent.get(EVENT_B)?.registrationIds).toEqual([REG_B1, REG_B2]);
    expect(perEvent.get(EVENT_C)?.registrationIds).toEqual([REG_C1]);
    for (const body of sentBodies) {
      expect(body.actionType).toBe('bekraftelse');
      expect(String(body.idempotencyKey)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    }
    // Distinkta idempotensnycklar per grupp — INTE samma nyckel återanvänd.
    expect(new Set(sentBodies.map((b) => b.idempotencyKey)).size).toBe(3);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

test.describe('Bekräftelsesvepet — aktivitetsloggen per event-grupp (TASK-241.3 AC #4)', () => {
  test('EN post per faktiskt skickad mottagare, taggad med DEN gruppens eventId', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    interface FangatStatement {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
      context: { extensions: Record<string, string> };
    }
    const loggposter: FangatStatement[] = [];
    network.use(
      http.post(EF('log-activity'), async ({ request }) => {
        const body = (await request.json()) as FangatStatement & { id: string; timestamp: string };
        loggposter.push(body);
        return json(
          {
            id: body.id,
            requestId: Object.values(body.context.extensions)[0],
            occurredAt: body.timestamp,
          },
          201,
        );
      }),
      http.post(EF('send-action-email'), async ({ request }) => {
        const body = (await request.json()) as SendActionEmailBody;
        if (body.eventId === EVENT_A) {
          return json({
            status: 'sent',
            requested: 2,
            attempted: 2,
            completed: [REG_A1, REG_A2],
            skipped: [],
            failed: [],
          });
        }
        if (body.eventId === EVENT_B) {
          return json({
            status: 'sent',
            requested: 2,
            attempted: 2,
            completed: [REG_B1, REG_B2],
            skipped: [],
            failed: [],
          });
        }
        return json({
          status: 'sent',
          requested: 1,
          attempted: 1,
          completed: [REG_C1],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoHemOchOppnaSvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 5 personer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();

    // Fire-and-forget → vänta in samtliga FEM (en per faktiskt skickad mottagare).
    await expect.poll(() => loggposter.length).toBe(5);

    for (const post of loggposter) {
      expect(post.verb.display['sv-SE']).toBe('skickade bekräftelsemail');
      expect(post.object.definition.type).toContain('/activity-types/mail');
    }

    // EVENT-TAGGNINGEN ÄR PER GRUPP — inte ett enda globalt eventId för alla fem.
    const eventTaggar = loggposter.map((p) => {
      const varden = Object.entries(p.context.extensions).find(([nyckel]) =>
        nyckel.includes('event'),
      );
      return varden?.[1];
    });
    expect(new Set(eventTaggar)).toEqual(new Set([EVENT_A, EVENT_B, EVENT_C]));

    const namn = loggposter.map((p) => p.object.definition.name['sv-SE']).sort();
    expect(namn).toEqual([
      'Anna Andersson (Sommarkurs i akvarell)',
      'Björn Ahlgren (Hantverkshelg)',
      'Erik Sandberg (Sommarkurs i akvarell)',
      'Johanna Berg (Novemberretreat)',
      'Maria Ek (Hantverkshelg)',
    ]);
  });
});

test.describe('Bekräftelsesvepet — avbryt utan sidoeffekt (TASK-241.3 AC #5)', () => {
  test('Avbryt FÖRE armering: noll sändanrop, dialogen stängs, hemmets rader oförändrade', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    let sandanrop = 0;
    network.use(
      medvetetOanvand(
        http.post(EF('send-action-email'), () => {
          sandanrop += 1;
          return json({
            status: 'sent',
            requested: 0,
            attempted: 0,
            completed: [],
            skipped: [],
            failed: [],
          });
        }),
        'NEGATIV SENSOR (AC #5): svepet stängs UTAN armering — räknaren `sandanrop` ' +
          'ska stanna på 0. Att handlern förblir oanvänd ÄR beviset; en dag den träffas ' +
          'har AC #5 brutits.',
      ),
    );

    await gotoHemOchOppnaSvepet(page);
    // Bläddra/väx interaktion utan att armera — fortfarande noll sidoeffekt.
    await expect(
      page.getByText(/Bekräftelsemail\s+till\s+5\s+personer\s+i\s+3\s+event/),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(page.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toHaveCount(0);

    expect(sandanrop).toBe(0);

    // Hemmet oförändrat — samma "Bekräfta alla"-ingång, samma räknare.
    await expect(page.getByText('5 nya anmälningar att bekräfta')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bekräfta alla', exact: true })).toBeVisible();
  });

  test('armerat men INTE skickat, sedan Avbryt: fortfarande noll sändanrop', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    let sandanrop = 0;
    network.use(
      medvetetOanvand(
        http.post(EF('send-action-email'), () => {
          sandanrop += 1;
          return json({
            status: 'sent',
            requested: 0,
            attempted: 0,
            completed: [],
            skipped: [],
            failed: [],
          });
        }),
        'NEGATIV SENSOR (AC #5): armerad men Skicka-knappen ALDRIG klickad — räknaren ' +
          '`sandanrop` ska stanna på 0. Att handlern förblir oanvänd ÄR beviset.',
      ),
    );

    await gotoHemOchOppnaSvepet(page);
    await armera(page);
    // Armerad men Skicka-knappen ALDRIG klickad.
    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(page.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toHaveCount(0);

    expect(sandanrop).toBe(0);
  });
});
