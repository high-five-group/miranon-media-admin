import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, type Page, test } from './support/acceptance-bas';

/**
 * TASK-241.8 — Eventinfo-svepet, ände till ände: bevakningsradens `onPress`
 * öppnar sändytan förifiltrerad på exakt de bekräftade som saknar
 * Deltagarinfo-stämpeln FÖR DET KLICKADE eventet (AC #1), samma trygghetstriad
 * och SAMMA `SvepOverlay`-instans som bekräftelse-/påminnelsesvepen (AC #2,
 * Marcus paritetskrav 2026-08-18 — "allt blir samma, overlayet och
 * övergångarna också"), verklig sändväg utan ny EF (AC #3), bevakningsradens
 * radspegling efter genomfört svep (AC #4), aktivitetslogg (AC #5).
 *
 * SAMMA söm-kontrakt och sändvägsmaskineri som `svep-bekraftelse-send.
 * acceptance.test.ts` (TASK-241.3) / `svep-paminnelse-send.acceptance.
 * test.ts` (TASK-241.4) — AC #6 kräver EXAKT denna skarv, ingen ny. DEN ENDA
 * strukturella skillnaden: eventinfo-svepet är ETT event (bevakningsraden
 * pekar redan på vilket), inte cross-event — ingången är en bevaknings-RAD,
 * inte en bulk-knapp, och fixturerna nedan bygger därför bara EN
 * event-grupp per test i stället för tre.
 *
 * FIXTUREN ÄR EGEN, INTE ÅTERANVÄND UR `hem.acceptance.test.ts`: samma skäl
 * som de två syskonfilernas docblock — `reg()`/`ev()` är egna, schema-typade
 * byggare, `RegistrationSchema`/`EventSchema` är den delade sanningskällan.
 *
 * Startdatum 2026-09-30 (15 dagar efter den globalt frusna klockan
 * FROZEN_NOW 2026-09-15, `tests/support/fixturvarld/hermetic.ts`) ligger
 * INOM bevakningsfönstret (`EVENTINFO_FONSTER_DAGAR` = 21 dagar,
 * `hem-derivations.ts`) — samma datum `hem.acceptance.test.ts`s
 * Bevakningsrad-svit redan använder.
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
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-20T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEventBev',
    personId: 'recPersonBev',
    deltagarinfoSkickad: null,
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
    startdatum: '2026-09-30',
    slutdatum: '2026-10-01',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

function mockDashboard(
  network: { use: (...h: ReturnType<typeof http.get>[]) => void },
  registrations: RegRow[],
  events: EventRow[],
) {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations })),
    http.get(EF('get-events'), () => json({ events })),
  );
}

/** Bevakningsraden bär EXAKT en rad i varje fixtur nedan — samma
    `getByRole('button')`-lokalisering som `hem.acceptance.test.ts`s egen
    Bevakningsrad-svit använder. */
async function gotoHemOchOppnaEventinfoSvepet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('list', { name: 'Bevakningar' }).getByRole('button').click();
  await expect(
    page.getByRole('heading', { name: 'Skicka deltagarinformation', exact: true }),
  ).toBeVisible();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som syskonfilernas sändvägssviter). */
async function armera(page: Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta deltagarinfo-svepet' });
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

test.describe('Eventinfo-svepet — verklig sändväg, ETT event (TASK-241.8 AC #1/#2/#3)', () => {
  test('bevakningsraden öppnar sändytan förifiltrerad på exakt de utan-stämpel-bekräftade; ett POST med actionType eventinfo; fullt lyckat → resultat "sent"', async ({
    page,
    network,
  }) => {
    const EVENT_A = 'recEventBevA0001';
    const REG_A1 = 'recRegA0000001';
    const REG_A2 = 'recRegA0000002';
    const REG_A3 = 'recRegA0000003';
    mockDashboard(
      network,
      [
        reg({ id: REG_A1, fornamn: 'Anna', efternamn: 'Andersson', eventId: EVENT_A }),
        reg({ id: REG_A2, fornamn: 'Erik', efternamn: 'Sandberg', eventId: EVENT_A }),
        reg({ id: REG_A3, fornamn: 'Maria', efternamn: 'Ek', eventId: EVENT_A }),
        // OBEKRÄFTAD på samma event — INTE med i urvalet (definition B,
        // `hem-derivations.ts` § `eventinfoMottagare`).
        reg({ id: 'recRegA0000004', eventId: EVENT_A, status: 'Obekräftad' }),
        // Redan stämplad — INTE med i urvalet.
        reg({
          id: 'recRegA0000005',
          eventId: EVENT_A,
          deltagarinfoSkickad: '2026-09-01T08:00:00.000Z',
        }),
      ],
      [ev({ id: EVENT_A, eventNamn: 'Sommarkurs i akvarell' })],
    );
    const sentBodies: SendActionEmailBody[] = [];
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        const body = (await request.json()) as SendActionEmailBody;
        sentBodies.push(body);
        return json({
          status: 'sent',
          requested: 3,
          attempted: 3,
          completed: [REG_A1, REG_A2, REG_A3],
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoHemOchOppnaEventinfoSvepet(page);

    // GRANSKA: EN event-grupp (AC #1 — inte cross-event).
    await expect(
      page.getByText(/Deltagarinformation\s+till\s+3\s+personer\s+i\s+1\s+event/),
    ).toBeVisible();
    // AC #2 trygghetstriaden — adresslistan visar exakt de tre urvalda,
    // INTE den obekräftade och INTE den redan stämplade.
    const adresslista = page.getByRole('region', { name: /Mottagare/ });
    // `.first()` — pillformen (stängd, default) OCH den expanderade
    // rad-listan bär BÅDA namnet i DOM:en samtidigt (`hidden`-attributet
    // döljer bara den expanderade panelen visuellt); pillen är den FÖRSTA
    // DOM-träffen (JSX-ordningen i `Adresslista.tsx`) och den enda synliga.
    await expect(adresslista.getByText('Anna Andersson').first()).toBeVisible();
    await expect(adresslista.getByText('Erik Sandberg').first()).toBeVisible();
    await expect(adresslista.getByText('Maria Ek').first()).toBeVisible();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 3 personer' }).click();

    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();
    const utfallSektion = page.getByRole('region', { name: 'Utfall per event' });
    await expect(utfallSektion.getByText('Sommarkurs i akvarell')).toBeVisible();
    await expect(utfallSektion.getByText('3 av 3 lyckades')).toBeVisible();

    // ETT POST, actionType eventinfo, alla tre mottagare — ingen ny EF (AC #3):
    // samma `send-action-email`-kontrakt bekräftelse-/påminnelsesvepen använder.
    expect(sentBodies).toHaveLength(1);
    expect(sentBodies[0].actionType).toBe('eventinfo');
    expect(sentBodies[0].eventId).toBe(EVENT_A);
    expect(new Set(sentBodies[0].registrationIds)).toEqual(new Set([REG_A1, REG_A2, REG_A3]));

    // AC #4 — FULLT lyckad sändning: raden FÖRSVINNER helt när alla
    // bekräftade nu bär stämpeln. Detta är DETERMINISTISKT vid stängning
    // (Hem.tsx § `nyligenEventinfoSkickade`) — MSW-mocken för
    // get-registrations returnerar FORTFARANDE den URSPRUNGLIGA, ostämplade
    // datan (ingen refetch-kappspring inblandad i detta bevis).
    await page.getByRole('button', { name: 'Tillbaka till Hem' }).click();
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toHaveCount(0);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

test.describe('Eventinfo-svepet — radspegling efter DELVIS lyckad sändning (TASK-241.8 AC #4)', () => {
  test('2 av 3 lyckas → raden KVARSTÅR i eftersläntrare-läget med korrekt kvarvarande antal', async ({
    page,
    network,
  }) => {
    const EVENT_B = 'recEventBevB0001';
    const REG_B1 = 'recRegB0000001';
    const REG_B2 = 'recRegB0000002';
    const REG_B3 = 'recRegB0000003';
    mockDashboard(
      network,
      [
        reg({ id: REG_B1, fornamn: 'Björn', efternamn: 'Ahlgren', eventId: EVENT_B }),
        reg({ id: REG_B2, fornamn: 'Cecilia', efternamn: 'Cold', eventId: EVENT_B }),
        reg({ id: REG_B3, fornamn: 'David', efternamn: 'Dag', eventId: EVENT_B }),
      ],
      [ev({ id: EVENT_B, eventNamn: 'Hantverkshelg' })],
    );
    network.use(
      http.post(EF('send-action-email'), () =>
        json({
          status: 'partial',
          requested: 3,
          attempted: 3,
          completed: [REG_B1, REG_B2],
          skipped: [],
          failed: [{ registrationId: REG_B3, reason: 'E-postadressen studsade' }],
        }),
      ),
    );

    await gotoHemOchOppnaEventinfoSvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 3 personer' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Utskicket lyckades delvis' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Tillbaka till Hem' }).click();

    // Raden KVARSTÅR (2 av 3 nu stämplade, INTE alla) — läget är
    // "eftersläntrare" med det KORREKTA kvarvarande antalet (1), inte det
    // ursprungliga (3) och inte "Deltagarinfo saknas" (som bara gäller när
    // ALLA bekräftade saknar stämpeln).
    const rad = page.getByRole('list', { name: 'Bevakningar' }).getByRole('listitem');
    await expect(rad).toHaveCount(1);
    await expect(rad).toContainText('1 nya deltagare saknar deltagarinfo');
    await expect(rad).not.toContainText('Deltagarinfo saknas');
  });
});

test.describe('Eventinfo-svepet — aktivitetsloggen (TASK-241.8 AC #5)', () => {
  test('EN post per faktiskt skickad mottagare, verbet "skickade deltagarinformation", taggad med eventets ID', async ({
    page,
    network,
  }) => {
    const EVENT_C = 'recEventBevC0001';
    const REG_C1 = 'recRegC0000001';
    const REG_C2 = 'recRegC0000002';
    mockDashboard(
      network,
      [
        reg({
          id: REG_C1,
          fornamn: 'Johanna',
          efternamn: 'Berg',
          eventId: EVENT_C,
          eventNamn: 'Novemberretreat',
        }),
        reg({
          id: REG_C2,
          fornamn: 'Karin',
          efternamn: 'Kvist',
          eventId: EVENT_C,
          eventNamn: 'Novemberretreat',
        }),
      ],
      [ev({ id: EVENT_C, eventNamn: 'Novemberretreat' })],
    );
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
      http.post(EF('send-action-email'), () =>
        json({
          status: 'sent',
          requested: 2,
          attempted: 2,
          completed: [REG_C1, REG_C2],
          skipped: [],
          failed: [],
        }),
      ),
    );

    await gotoHemOchOppnaEventinfoSvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();

    await expect.poll(() => loggposter.length).toBe(2);
    for (const post of loggposter) {
      expect(post.verb.display['sv-SE']).toBe('skickade deltagarinformation');
      expect(post.object.definition.type).toContain('/activity-types/mail');
    }
    const eventTaggar = loggposter.map((p) => {
      const varden = Object.entries(p.context.extensions).find(([nyckel]) =>
        nyckel.includes('event'),
      );
      return varden?.[1];
    });
    expect(new Set(eventTaggar)).toEqual(new Set([EVENT_C]));
    const namn = loggposter.map((p) => p.object.definition.name['sv-SE']).sort();
    expect(namn).toEqual(['Johanna Berg (Novemberretreat)', 'Karin Kvist (Novemberretreat)']);
  });
});

test.describe('Eventinfo-svepet — avbryt utan sidoeffekt (TASK-241.8, samma AC #5-mönster som TASK-241.3)', () => {
  test('Avbryt FÖRE armering: noll sändanrop, dialogen stängs, bevakningsraden oförändrad', async ({
    page,
    network,
  }) => {
    const EVENT_D = 'recEventBevD0001';
    mockDashboard(
      network,
      [reg({ id: 'recRegD0000001', eventId: EVENT_D })],
      [ev({ id: EVENT_D, eventNamn: 'Vinterretreat' })],
    );
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
        'NEGATIV SENSOR: svepet stängs UTAN armering — räknaren `sandanrop` ska ' +
          'stanna på 0. Att handlern förblir oanvänd ÄR beviset; en dag den träffas ' +
          'har avbryt-kontraktet brutits.',
      ),
    );

    await gotoHemOchOppnaEventinfoSvepet(page);
    await expect(
      page.getByText(/Deltagarinformation\s+till\s+1\s+person\s+i\s+1\s+event/),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(
      page.getByRole('heading', { name: 'Skicka deltagarinformation', exact: true }),
    ).toHaveCount(0);

    expect(sandanrop).toBe(0);
    // Bevakningsraden OFÖRÄNDRAD — samma rad, samma "Deltagarinfo saknas".
    await expect(page.getByRole('list', { name: 'Bevakningar' })).toBeVisible();
    await expect(page.getByText('Deltagarinfo saknas')).toBeVisible();
  });

  test('armerat men INTE skickat, sedan Avbryt: fortfarande noll sändanrop', async ({
    page,
    network,
  }) => {
    const EVENT_E = 'recEventBevE0001';
    mockDashboard(
      network,
      [reg({ id: 'recRegE0000001', eventId: EVENT_E })],
      [ev({ id: EVENT_E, eventNamn: 'Vårläger' })],
    );
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
        'NEGATIV SENSOR: armerad men Skicka-knappen ALDRIG klickad — räknaren ' +
          '`sandanrop` ska stanna på 0.',
      ),
    );

    await gotoHemOchOppnaEventinfoSvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(
      page.getByRole('heading', { name: 'Skicka deltagarinformation', exact: true }),
    ).toHaveCount(0);

    expect(sandanrop).toBe(0);
  });
});
