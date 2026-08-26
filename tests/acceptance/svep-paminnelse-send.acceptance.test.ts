import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-241.4 — Påminnelsesvepet, ände till ände: en-påminnelse-modellens
 * LÄGE 1-urval (AC #1, mekaniskt spamsäkert — negativ sensor nedan), verklig
 * sändväg + avgiftstyp-suffix i adresslistan (AC #2), skickat-markörer +
 * aktivitetslogg (AC #3). SAMMA söm-kontrakt och sändvägsmaskineri som
 * `svep-bekraftelse-send.acceptance.test.ts` (TASK-241.3) — den filens
 * docblock beskriver hela beviskedjan (`useSendSvep` loopar ETT POST per
 * event-grupp mot `dataSource.sendActionEmail`), oförändrad här.
 *
 * FIXTUREN ÄR EGEN, INTE ÅTERANVÄND UR `hem.acceptance.test.ts` (samma skäl
 * som bekräftelsefilens docblock: oberoende kopia av `reg()`/`ev()`,
 * `RegistrationSchema`/`EventSchema` är den delade sanningskällan).
 *
 * Deadline = eventstart − 14 dagar (`DEADLINE_DAGAR`, `hem-derivations.ts`);
 * samtliga event nedan har startdatum 2026-09-20 (deadline 2026-09-06, redan
 * passerad mot den globalt frusna klockan FROZEN_NOW 2026-09-15, se
 * `tests/support/fixturvarld/hermetic.ts`). Ringtröskeln (`vantar` →
 * `dags-att-ringa`) är 7 dagar (`RINGTROSKEL_DAGAR`).
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
    eventNamn: 'Fjärrskådning',
    ort: 'Skövde',
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
    eventId: 'recEventForf',
    personId: 'recPersonForf',
    ...overrides,
  };
}

function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: `recE${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: 'FJARR',
    eventNamn: 'Fjärrskådning',
    typ: 'Kurs',
    ort: 'Skövde',
    startdatum: '2026-09-20',
    slutdatum: '2026-09-21',
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

async function gotoHemOchOppnaPaminnelsesvepet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Skicka påminnelse till alla', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Skicka påminnelse till alla', exact: true }),
  ).toBeVisible();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som bekräftelsesvepets svit). */
async function armera(page: Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta påminnelsesvepet' });
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
}

test.describe('Påminnelsesvepet — en-påminnelse-modellens LÄGE 1-filter, negativ sensor (TASK-241.4 AC #1)', () => {
  test('ENDAST "Att påminna"-registreringen (Disa) ingår — "Väntar" (Egon) och "Dags att ringa" (Frida) kan ALDRIG nå urvalet, adresslistan eller sändningen', async ({
    page,
    network,
  }) => {
    const DISA = 'recDisaDahl0001';
    const EGON = 'recEgonEk000001';
    const FRIDA = 'recFridaFalk001';
    mockDashboard(
      network,
      [
        // LÄGE 1 "Att påminna" — ingen påminnelse skickad ännu. DEN ENDA som
        // får ingå (negativ sensor prövas mot de två andra nedan).
        reg({
          id: DISA,
          fornamn: 'Disa',
          efternamn: 'Dahl',
          email: 'disa.dahl@example.se',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
        }),
        // LÄGE 2 "Väntar" — påmind för 2 dagar sedan (< 7 dagars ringtröskel).
        reg({
          id: EGON,
          fornamn: 'Egon',
          efternamn: 'Ek',
          email: 'egon.ek@example.se',
          eventId: 'recEvForf',
          slutbetalning: 'Ej mottagen',
          paminnelseSlutbetalningSkickad: '2026-09-13T08:00:00.000Z',
        }),
        // LÄGE 3 "Dags att ringa" — påmind för 14 dagar sedan (≥ 7 dagar).
        reg({
          id: FRIDA,
          fornamn: 'Frida',
          efternamn: 'Falk',
          email: 'frida.falk@example.se',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          paminnelseAnmalningsavgiftSkickad: '2026-09-01T08:00:00.000Z',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    );

    const sentBodies: SendActionEmailBody[] = [];
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        const body = (await request.json()) as SendActionEmailBody;
        sentBodies.push(body);
        return json({
          status: 'sent',
          requested: body.registrationIds.length,
          attempted: body.registrationIds.length,
          completed: body.registrationIds,
          skipped: [],
          failed: [],
        });
      }),
    );

    await gotoHemOchOppnaPaminnelsesvepet(page);
    const dialog = page.getByRole('dialog', { name: 'Skicka påminnelse till alla' });

    // GRANSKA: cross-event-summeringen räknar ENDAST Disa (1 person, 1 event)
    // — Egon och Frida är strukturellt osynliga för urvalet.
    await expect(
      page.getByText(/Påminnelsemail\s+till\s+1\s+person\s+i\s+1\s+event/),
    ).toBeVisible();
    await expect(dialog).toContainText('1 mottagare');

    // NEGATIV SENSOR (DOM-nivå): läge 2/3-namnen finns INGENSTANS i dialogen,
    // varken kollapsad (pill) eller expanderad vy.
    await expect(dialog.getByText('Egon Ek')).toHaveCount(0);
    await expect(dialog.getByText('Frida Falk')).toHaveCount(0);
    // `.first()`: "Disa Dahl" förekommer BÅDE i den kollapsade pill-vyn
    // (synlig) och i den expanderade listan (närvarande i DOM:en men
    // `hidden` — `Adresslista.tsx` monterar båda samtidigt, växlar bara
    // `hidden`-attributet) — DOM-ordningen ger pillen (den synliga) först.
    await expect(dialog.getByText('Disa Dahl').first()).toBeVisible();

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 1 person' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();

    // NEGATIV SENSOR (nätverks-nivå, starkast beviset): det ENDA POST-anropet
    // bär ENDAST Disas registrerings-ID — Egons/Fridas ID:n förekommer ALDRIG.
    expect(sentBodies).toHaveLength(1);
    expect(sentBodies[0].registrationIds).toEqual([DISA]);
    expect(sentBodies[0].actionType).toBe('paminnelse');

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('tomt urval strukturellt onåbart via UI: samtliga registreringar i läge 2/3 → knappen "Skicka påminnelse till alla" renderas aldrig', async ({
    page,
    network,
  }) => {
    // Ingen "Att påminna"-rad alls (läge 1) → `ForfallnaBetalningar.tsx`s
    // gate (`grupper.attPaminna.length > 0 || nyligenPaminda.length > 0`)
    // håller aldrig — samma no-op-till-riktig-knapp-princip som
    // `NyaAnmalningar.tsx`s "Bekräfta alla" (`anmalningar.total > 0`).
    mockDashboard(
      network,
      [
        reg({
          fornamn: 'Egon',
          efternamn: 'Ek',
          eventId: 'recEvForf',
          slutbetalning: 'Ej mottagen',
          paminnelseSlutbetalningSkickad: '2026-09-13T08:00:00.000Z',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    );
    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 3, name: /^Väntar/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka påminnelse till alla' })).toHaveCount(0);
  });
});

test.describe('Påminnelsesvepet — avgiftstyp-suffix i adresslistan (TASK-241.4 AC #2)', () => {
  test('registrering som saknar BÅDA avgifterna visar BÅDA avgiftstyperna i adresslistans expanderade rad', async ({
    page,
    network,
  }) => {
    mockDashboard(
      network,
      [
        reg({
          fornamn: 'Camilla',
          efternamn: 'Öst',
          email: 'camilla.ost@example.se',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          slutbetalning: 'Ej mottagen',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    );
    await gotoHemOchOppnaPaminnelsesvepet(page);
    const dialog = page.getByRole('dialog', { name: 'Skicka påminnelse till alla' });

    // Expandera event-gruppen (accordion, kollapsad som default — samma
    // grammatik som `Adresslista.tsx`s docblock beskriver för pill-vyn).
    await dialog.getByRole('button', { name: /Fjärrskådning/ }).click();
    await expect(dialog.getByText('camilla.ost@example.se')).toBeVisible();
    await expect(dialog).toContainText('Anmälningsavgift, Slutbetalning');
  });

  test('bekräftelsesvepet visar ALDRIG avgiftstyp (oförändrad TASK-241.2-form)', async ({
    page,
    network,
  }) => {
    mockDashboard(
      network,
      [
        reg({
          fornamn: 'Britta',
          efternamn: 'Bok',
          status: 'Obekräftad',
          eventId: 'recEvBekr',
        }),
      ],
      [ev({ id: 'recEvBekr', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    );
    await page.goto('/hem');
    await page.getByRole('button', { name: 'Bekräfta alla', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Bekräfta alla' });
    await dialog.getByRole('button', { name: /Fjärrskådning/ }).click();
    // reg()-defaultens e-post (Britta/Bok-overriden rör aldrig `email`).
    await expect(dialog.getByText('anna@example.se')).toBeVisible();
    await expect(dialog.getByText('Anmälningsavgift')).toHaveCount(0);
    await expect(dialog.getByText('Slutbetalning')).toHaveCount(0);
  });
});

test.describe('Påminnelsesvepet — skickat-markörer + aktivitetslogg (TASK-241.4 AC #3)', () => {
  test('efter lyckad sändning: "Påminnelse skickad"-markör på hemmets rad, EN aktivitetspost med betalningspåminnelse-verbet', async ({
    page,
    network,
  }) => {
    const DISA = 'recDisaDahl0002';
    mockDashboard(
      network,
      [
        reg({
          id: DISA,
          fornamn: 'Disa',
          efternamn: 'Dahl',
          email: 'disa.dahl@example.se',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
          personId: 'recPersonDisa',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
    );

    interface FangatStatement {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
    }
    const loggposter: FangatStatement[] = [];
    network.use(
      http.post(EF('log-activity'), async ({ request }) => {
        const body = (await request.json()) as FangatStatement & { id: string; timestamp: string };
        loggposter.push(body);
        return json({ id: body.id, requestId: 'req-1', occurredAt: body.timestamp }, 201);
      }),
      http.post(EF('send-action-email'), async () =>
        json({
          status: 'sent',
          requested: 1,
          attempted: 1,
          completed: [DISA],
          skipped: [],
          failed: [],
        }),
      ),
    );

    await gotoHemOchOppnaPaminnelsesvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 1 person' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Utskicket lyckades' })).toBeVisible();
    await page.getByRole('button', { name: 'Tillbaka till Hem' }).click();

    // MARKÖREN — samma grammatik som bekräftelsesvepets "Bekräftelse
    // skickad" (`NyaAnmalningar.tsx`), fast i "Att påminna"-sektionen.
    const attPaminna = page.getByRole('heading', { level: 3, name: /^Att påminna/ }).locator('..');
    await expect(attPaminna.getByText('Påminnelse skickad', { exact: true })).toBeVisible();
    await expect(attPaminna).toContainText('Disa Dahl');
    // Live-badgen (icke-markerade kvarvarande) är nu 0 — Disa är filtrerad
    // ur den vanliga listan via markörens dedup-nyckel.
    await expect(attPaminna.locator('span.tabular-nums')).toHaveText('0');

    await expect.poll(() => loggposter.length).toBe(1);
    expect(loggposter[0].verb.display['sv-SE']).toBe('skickade betalningspåminnelse');
    expect(loggposter[0].object.definition.type).toContain('/activity-types/mail');
    expect(loggposter[0].object.definition.name['sv-SE']).toBe('Disa Dahl (Fjärrskådning)');
  });
});

test.describe('Påminnelsesvepet — avbryt utan sidoeffekt', () => {
  test('Avbryt FÖRE armering: noll sändanrop, dialogen stängs, hemmets rader oförändrade', async ({
    page,
    network,
  }) => {
    mockDashboard(
      network,
      [
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
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
        'NEGATIV SENSOR (avbryt = noll anrop): svepet stängs UTAN armering — ' +
          'räknaren `sandanrop` ska stanna på 0. Att handlern förblir oanvänd ÄR beviset.',
      ),
    );

    await gotoHemOchOppnaPaminnelsesvepet(page);
    await expect(
      page.getByText(/Påminnelsemail\s+till\s+1\s+person\s+i\s+1\s+event/),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(
      page.getByRole('heading', { name: 'Skicka påminnelse till alla', exact: true }),
    ).toHaveCount(0);

    expect(sandanrop).toBe(0);
    await expect(page.getByRole('button', { name: 'Skicka påminnelse till alla' })).toBeVisible();
  });

  test('armerat men INTE skickat, sedan Avbryt: fortfarande noll sändanrop', async ({
    page,
    network,
  }) => {
    mockDashboard(
      network,
      [
        reg({
          fornamn: 'Disa',
          efternamn: 'Dahl',
          eventId: 'recEvForf',
          anmalningsavgift: 'Ej mottagen',
        }),
      ],
      [ev({ id: 'recEvForf', eventNamn: 'Fjärrskådning', startdatum: '2026-09-20' })],
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
        'NEGATIV SENSOR (avbryt = noll anrop): armerad men Skicka-knappen ALDRIG ' +
          'klickad — räknaren `sandanrop` ska stanna på 0.',
      ),
    );

    await gotoHemOchOppnaPaminnelsesvepet(page);
    await armera(page);
    await page.getByRole('button', { name: 'Avbryt' }).click();
    await expect(
      page.getByRole('heading', { name: 'Skicka påminnelse till alla', exact: true }),
    ).toHaveCount(0);

    expect(sandanrop).toBe(0);
  });
});
