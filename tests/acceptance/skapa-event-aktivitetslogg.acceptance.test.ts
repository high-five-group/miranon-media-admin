import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './acceptance-bas';

/**
 * TASK-201.15 — "skapa event"s aktivitetslogg, ände-till-ände genom den
 * RIKTIGA hooken (`useCreateEvent`, `src/data/mutations/useCreateEvent.ts`).
 *
 * VARFÖR DENNA FIL FINNS: hooken extraherades ur `CreateEventForm.tsx`
 * (hemvistsluckan, `.mutation-hemvist-policy.conf`s docblock) — samma klass
 * bevis som `atgarder-betalningsnotering-logg.acceptance.test.ts` bär för
 * betalningsnoteringen. Statement-FORMEN (verb/objekt/kategori) är redan
 * bevisad api-pure (`activity-log-hemvist-statements.test.ts` § 1); den här
 * filen binder formen till den RIKTIGA hooken genom att driva
 * `/event/skapa`s verkliga formulär.
 *
 * Form-fyllnings-mekaniken (Select/DateRangePicker/NumberField) speglar
 * `tests/e2e/skapa-event.staging.test.ts`s etablerade helpers — samma
 * fält, samma interaktionsform, men här via MSW (`network.use`) i stället
 * för `page.route`, i acceptance-klassens form.
 *
 * RÄKNANDET ÄR MEDVETET HÄR — samma motiverade undantag som
 * `atgarder-betalningsnotering-logg.acceptance.test.ts` § filhuvudet: för
 * aktivitetsloggen ÄR den utgående posten det externa beteendet.
 *
 * `create-event` ligger MEDVETET INTE i normalläget (`handlers.ts`) —
 * samma skäl som `send-email`/`save-segment` i syskonfilerna: en delad
 * skrivväg hade gjort en tyst lyckad skapelse till default för hela
 * klassen.
 */

const FORMAT_2_DAGAR = { id: 'recFmtHEM0000001', namn: 'Utbildning - 2 dagar' };
const CREATED_ID = 'recEVThemvist0001';

const CREATED_EVENT = {
  id: CREATED_ID,
  eventlabel: 'Skövde – Utbildning – Fjärrskådning – 2026-09-15',
  eventNamn: 'Fjärrskådning',
  typ: 'Utbildning',
  ort: 'Skövde',
  startdatum: '2026-09-15',
  slutdatum: '2026-09-16',
  manadAr: 'September 2026',
  maxPlatser: 20,
  status: 'Planerat',
  eventKey: 'Event-101',
  eventNr: 101,
};

type Kropp = Record<string, unknown>;

async function valj(
  page: import('@playwright/test').Page,
  faltTestId: string,
  alternativ: string,
): Promise<void> {
  await page.getByTestId(faltTestId).getByRole('button').click();
  await page.getByRole('option', { name: alternativ, exact: true }).click();
}

async function fyllDatum(
  page: import('@playwright/test').Page,
  start: string,
  slut: string,
): Promise<void> {
  const segment = page.getByTestId('falt-datum').getByRole('spinbutton');
  await segment.nth(0).click();
  await page.keyboard.type(start.replaceAll('-', ''));
  await segment.nth(3).click();
  await page.keyboard.type(slut.replaceAll('-', ''));
}

async function fyllPlatser(page: import('@playwright/test').Page, antal: string): Promise<void> {
  const falt = page.getByTestId('falt-platser').getByRole('textbox');
  await falt.click();
  await falt.fill(antal);
  await page.keyboard.press('Tab');
}

async function fyllFormular(page: import('@playwright/test').Page): Promise<void> {
  await valj(page, 'falt-event', 'Fjärrskådning');
  await valj(page, 'falt-eventtyp', 'Utbildning');
  await page.getByLabel('Ort', { exact: true }).fill('Skövde');
  await fyllDatum(page, '2026-09-15', '2026-09-16');
  await fyllPlatser(page, '20');
  await valj(page, 'falt-eventformat', '2 dagar');
}

test.describe('Skapa-events aktivitetslogg (TASK-201.15)', () => {
  test.beforeEach(async ({ network }) => {
    network.use(
      http.get(EF('get-events'), () =>
        json({
          events: [
            {
              id: 'recEVhemvistlista1',
              eventlabel: 'Fjärrskådning',
              eventNamn: 'Fjärrskådning',
              typ: 'Utbildning',
              ort: 'Skövde',
              startdatum: '2026-03-01',
              slutdatum: '2026-03-02',
              tidKvarTillEvent: null,
              maxPlatser: 20,
              antalAnmalda: 0,
              platserKvar: 20,
              anmaldBelaggning: 0,
              bekraftadBelaggning: 0,
              antalNyaAnmalningar: 0,
              antalAnmalningsavgifter: 0,
              antalSlutbetalningar: 0,
              antalSlutbetalningFelande: 0,
              status: null,
            },
          ],
        }),
      ),
      http.get(EF('get-event-formats'), () => json({ eventFormats: [FORMAT_2_DAGAR] })),
    );
  });

  test('RIKTNING 1/2 — eventet SKAPAS: posten skapas, objektet är det NYA eventet', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('create-event'), () =>
        json({ event: CREATED_EVENT, record: { id: CREATED_ID, fields: {} }, created: true }, 201),
      ),
      http.post(EF('log-activity'), async ({ request }) => {
        const body = (await request.json()) as Kropp;
        loggar.push(body);
        const b = body as unknown as {
          id: string;
          context: { extensions: Record<string, string> };
        };
        return json(
          {
            id: b.id,
            requestId: Object.values(b.context.extensions)[0],
            occurredAt: '2026-08-14T08:00:00.000Z',
          },
          201,
        );
      }),
    );

    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fyllFormular(page);
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();

    // Bekräftelseläget = skriv-beviset (server-OK).
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // EN aktivitetspost, objektet är det NYSKAPADE eventet.
    await expect.poll(() => loggar.length).toBe(1);
    const logg = loggar[0] as unknown as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
      context: { extensions: Record<string, string> };
    };
    expect(logg.verb.display['sv-SE']).toBe('skapade eventet');
    expect(logg.object.definition.name['sv-SE']).toBe('Fjärrskådning');
    expect(logg.object.id).toContain(CREATED_ID);
  });

  test('RIKTNING 2/2 — skapandet MISSLYCKAS: ingen aktivitetspost skapas alls', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('create-event'), () => json({ error: 'Airtable 422' }, 422)),
      medvetetOanvand(
        http.post(EF('log-activity'), async ({ request }) => {
          loggar.push((await request.json()) as Kropp);
          return json({ id: 'x', requestId: 'x', occurredAt: '2026-08-14T08:00:00.000Z' }, 201);
        }),
        'NEGATIV SENSOR: log-activity ska ALDRIG anropas när create-event föll. ' +
          'Matchar den ändå har instrumenteringen flyttat ut ur onSuccess.',
      ),
    );

    await page.goto('/event/skapa');
    await expect(page.getByRole('heading', { level: 1, name: 'Skapa nytt event' })).toBeFocused();

    await fyllFormular(page);
    await page.getByRole('button', { name: 'Skapa event', exact: true }).click();

    // Felytan bekräftar att mutationen FAKTISKT föll.
    await expect(page.getByText('Kunde inte skapa eventet')).toBeVisible();
    await expect(page.getByTestId('bekraftelse')).toHaveCount(0);

    expect(loggar).toHaveLength(0);
  });
});
