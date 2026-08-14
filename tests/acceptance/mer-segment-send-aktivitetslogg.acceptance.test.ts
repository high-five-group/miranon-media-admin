import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-201.15 — segment-mailets aktivitetslogg, ände-till-ände genom den
 * RIKTIGA hooken (`useSendSegmentMail`, `src/data/mutations/segment.ts`).
 *
 * ABSOLUT MAILFÖRBUD (uppdragets krav, ADR-067s kontrakt): `send-email` är
 * AVLYSSNAT av fixturvärlden precis som `mer-segment-send.acceptance.test.ts`
 * redan etablerar för sitt UI-flöde — INGET riktigt mail skickas här heller.
 *
 * VARFÖR DENNA FIL FINNS VID SIDAN AV `activity-log-hemvist-statements.test.ts`:
 * api-pure-sviten kör composern med en input som SPEGLAR hookens onSuccess.
 * Den bevisar att composern inte läcker fritext — men en spegel kan glida
 * ifrån originalet. HÄR drivs `SegmentMailCompose`s VERKLIGA compose-flöde,
 * av den VERKLIGA mutationen, och kroppen läses där den faktiskt lämnar
 * klienten — samma bindningsled som
 * `atgarder-betalningsnotering-logg.acceptance.test.ts` etablerar för
 * betalningsnoteringen (AC #3: "genom den RIKTIGA hooken").
 *
 * RÄKNANDET ÄR MEDVETET HÄR — samma motiverade undantag som syskonfilen:
 * för aktivitetsloggen ÄR den utgående posten det externa beteendet.
 */

type EventRow = z.infer<typeof EventSchema>;

function ev(eventNamn: string | null, typ: string | null): EventRow {
  return {
    id: `recEV${Math.random().toString(36).slice(2, 10)}`,
    eventlabel: eventNamn,
    eventNamn,
    typ,
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
  };
}

const TAXONOMY_EVENTS = [ev('Fjärrskådning', 'Utbildning')];

const SAVED_SEGMENT = {
  id: 'recSAVEDhemvist1',
  namn: 'FS-utbildningsdeltagare',
  rule: { include: [{ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }], exclude: [] },
  definition: 'Med: deltog i Fjärrskådning (utbildning).',
};

type Kropp = Record<string, unknown>;

async function skickaMail(
  page: import('@playwright/test').Page,
  amne: string,
  mailtext: string,
): Promise<void> {
  await page.goto('/mer/segment');
  await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

  await page.getByRole('button', { name: 'Segment att skicka till' }).click();
  await page.getByRole('option', { name: 'FS-utbildningsdeltagare' }).click();
  await expect(page.getByText(/Det här segmentet har\s*3\s*personer/)).toBeVisible();

  await page.getByLabel('Ämne').fill(amne);
  await page.getByLabel('Meddelande').fill(mailtext);
  await page.getByRole('button', { name: 'Granska och skicka…' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: /Skriv antalet mottagare/ }).fill('3');
  await dialog.getByRole('button', { name: 'Skicka till 3 personer' }).click();
}

test.describe('Segment-mailets aktivitetslogg (TASK-201.15)', () => {
  test.beforeEach(async ({ network }) => {
    const members = Array.from({ length: 3 }, (_, i) => ({
      id: `recM${i}`,
      namn: `Person ${i}`,
      email: `person${i}@example.se`,
      ejGodkandMail: false,
    }));
    network.use(
      http.get(EF('get-events'), () => json({ events: TAXONOMY_EVENTS })),
      http.get(EF('get-segments'), () => json({ segments: [SAVED_SEGMENT] })),
      http.post(EF('compute-segment'), () => json({ members, count: 3 })),
    );
  });

  test('RIKTNING 1/2 — utskicket LYCKAS (accepted>0): EN aggregerad post, ämne/mailtext läcker INTE', async ({
    page,
    network,
  }) => {
    const HEMLIGT_AMNE = 'Uppföljning: Anna Andersson missade betalningen';
    const HEMLIG_MAILTEXT = 'Hej — kom ihåg att Bo har sagt upp sig från kursen';
    const loggar: Kropp[] = [];

    network.use(
      http.post(EF('send-email'), () =>
        json({
          status: 'sent',
          requested: 3,
          suppressedConsent: 0,
          suppressedNoEmail: 0,
          deduped: 0,
          attempted: 3,
          accepted: 3,
          rejected: 0,
          rejections: [],
          logRecordId: 'recLOGhemvist1',
        }),
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

    await skickaMail(page, HEMLIGT_AMNE, HEMLIG_MAILTEXT);

    await expect(page.getByText('Utskicket skickades')).toBeVisible();
    await expect(page.getByText(/3 mottagare fick mailet/)).toBeVisible();

    // EXAKT EN post — aggregerad, inte en per mottagare (EF-svaret bär ingen
    // per-mottagare-identitet, se segment.ts's docblock).
    await expect.poll(() => loggar.length).toBe(1);

    const payload = JSON.stringify(loggar[0]);
    // INTEGRITETEN FÖRST (samma ordning + skäl som
    // atgarder-betalningsnotering-logg.acceptance.test.ts): fälls detta av
    // en läcka ska felmeddelandet namnge fritext-fragmentet, inte skuggas
    // av en formuleringsavvikelse i verb/objektnamn-assertionerna nedan.
    expect(payload, 'ämnet läckte in i aktivitetsposten').not.toContain(HEMLIGT_AMNE);
    expect(payload, 'mailtexten läckte in i aktivitetsposten').not.toContain(HEMLIG_MAILTEXT);
    expect(payload, 'fragmentet "Anna Andersson" läckte ut').not.toContain('Anna Andersson');
    expect(payload, 'fragmentet "Bo har sagt upp sig" läckte ut').not.toContain(
      'Bo har sagt upp sig',
    );

    const logg = loggar[0] as unknown as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
    };
    expect(logg.verb.display['sv-SE']).toBe('skickade mail till segment');
    expect(logg.object.definition.name['sv-SE']).toBe('FS-utbildningsdeltagare (3 mottagare)');
    expect(logg.object.id).toContain('recSAVEDhemvist1');
  });

  test('RIKTNING 2/2 — accepted===0 (skipped/allt undertryckt): INGEN aktivitetspost', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('send-email'), () =>
        json({
          status: 'skipped',
          requested: 3,
          suppressedConsent: 2,
          suppressedNoEmail: 1,
          deduped: 0,
          attempted: 0,
          accepted: 0,
          rejected: 0,
          rejections: [],
          logRecordId: null,
        }),
      ),
      medvetetOanvand(
        http.post(EF('log-activity'), async ({ request }) => {
          loggar.push((await request.json()) as Kropp);
          return json({ id: 'x', requestId: 'x', occurredAt: '2026-08-14T08:00:00.000Z' }, 201);
        }),
        'NEGATIV SENSOR: log-activity ska ALDRIG anropas när accepted===0 — servern är ' +
          "facit (samma grind som testmailets status!=='sent'). Matchar den ändå har " +
          'instrumenteringen flyttat ut ur grinden.',
      ),
    );

    await skickaMail(page, 'Höstens kurser', 'Hej!');

    await expect(page.getByText('Inga mottagare fick mailet')).toBeVisible();
    expect(loggar).toHaveLength(0);
  });
});
