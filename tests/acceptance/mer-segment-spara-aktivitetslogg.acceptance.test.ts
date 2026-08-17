import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, type Page, test } from './support/acceptance-bas';

/**
 * TASK-201.15 — "spara segment"s aktivitetslogg, ände-till-ände genom den
 * RIKTIGA hooken (`useSaveSegment`, `src/data/mutations/segment.ts`).
 *
 * Samma bindningsled som syskonfilerna
 * (`skapa-event-aktivitetslogg.acceptance.test.ts`,
 * `mer-segment-send-aktivitetslogg.acceptance.test.ts`): statement-FORMEN
 * (NY kategori `segment`) är redan bevisad api-pure
 * (`activity-log-hemvist-statements.test.ts` § 1); den här filen binder
 * formen till den RIKTIGA hooken genom `/mer/segment`s verkliga
 * spara-flöde (samma flöde `mer-segment.acceptance.test.ts`s "spara (L3)"
 * -test redan driver för UI-beteendet).
 *
 * RÄKNANDET ÄR MEDVETET HÄR — samma motiverade undantag som syskonfilerna.
 * `save-segment` ligger MEDVETET INTE i normalläget (samma skäl som
 * `mer-segment.acceptance.test.ts`).
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

/** Samma form som `mer-segment.acceptance.test.ts`s `choosePar`. */
function choosePar(page: Page, groupName: string, choice: 'Inkludera' | 'Exkludera') {
  return page
    .getByRole('radiogroup', { name: groupName })
    .getByText(choice, { exact: true })
    .click();
}

type Kropp = Record<string, unknown>;

const SAVED_SEG = {
  id: 'recSAVEDaktivitet1',
  namn: 'FS-utbildningsdeltagare',
  rule: { include: [{ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }], exclude: [] },
  definition: 'Med: deltog i Fjärrskådning (utbildning).',
};

// [TASK-249.5] Båda testerna i denna describe skippas individuellt — ÖPPET
// bokförd, minimal anpassning (TASK-243.1/243.3-precedentet). ADR-102/103-
// promoveringen flippade /mer/segment till `VariantD`: `SegmentBuilder`-UI:t
// (`choosePar`-hjälparen ovan, "Spara segment"-knappen) renderas inte längre
// där, OCH VariantD:s skaparflöden (mallvyn/verkstaden/generatorn) lägger
// nya segment i LOKALT React-state (AC#1 i TASK-249.5 — `useSaveSegment`/
// `log-activity` anropas aldrig), så denna filens HELA bevisyta (den RIKTIGA
// hookens aktivitetslogg-sidoeffekt) saknar motsvarighet i den promoverade
// formen. Se TASK-249.9.
test.describe('Spara-segments aktivitetslogg (TASK-201.15)', () => {
  test.beforeEach(async ({ network }) => {
    // Skip:et sitter HÄR (inte i varje test-kropp) så att beforeEach:s egna
    // network.use()-registreringar aldrig körs — annars flaggar
    // överskuggnings-vakten dem som döda (se TASK-249.5-kommentaren ovan).
    test.skip(true, '[TASK-249.5] SegmentBuilder-UI retirerad, spara lokalt-state — se TASK-249.9');
    network.use(
      http.get(EF('get-events'), () => json({ events: TAXONOMY_EVENTS })),
      http.get(EF('get-segments'), () => json({ segments: [] })),
    );
  });

  test('RIKTNING 1/2 — segmentet SPARAS: posten skapas, NY kategori (segment)', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('save-segment'), () =>
        json({ segment: SAVED_SEG, record: { id: SAVED_SEG.id, fields: {} } }, 201),
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

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Fjärrskådning (utbildning)', 'Inkludera');
    await page.getByRole('textbox', { name: 'Namn på segmentet' }).fill('FS-utbildningsdeltagare');
    await page.getByRole('button', { name: 'Spara segment' }).click();

    await expect(page.getByText('Segmentet sparades.')).toBeVisible();

    await expect.poll(() => loggar.length).toBe(1);
    const logg = loggar[0] as unknown as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
    };
    expect(logg.verb.display['sv-SE']).toBe('sparade segment');
    expect(logg.object.definition.name['sv-SE']).toBe('FS-utbildningsdeltagare');
    expect(logg.object.id).toContain(SAVED_SEG.id);
    // NY kategori (segment) — inte återanvänd från event/mail/etc.
    expect(logg.object.definition.type).toContain('/activity-types/segment');
  });

  test('RIKTNING 2/2 — sparandet MISSLYCKAS: ingen aktivitetspost skapas alls', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('save-segment'), () => json({ error: 'Airtable 422' }, 422)),
      medvetetOanvand(
        http.post(EF('log-activity'), async ({ request }) => {
          loggar.push((await request.json()) as Kropp);
          return json({ id: 'x', requestId: 'x', occurredAt: '2026-08-14T08:00:00.000Z' }, 201);
        }),
        'NEGATIV SENSOR: log-activity ska ALDRIG anropas när save-segment föll. ' +
          'Matchar den ändå har instrumenteringen flyttat ut ur onSuccess.',
      ),
    );

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Fjärrskådning (utbildning)', 'Inkludera');
    await page.getByRole('textbox', { name: 'Namn på segmentet' }).fill('Test');
    await page.getByRole('button', { name: 'Spara segment' }).click();

    await expect(page.getByText('Kunde inte spara segmentet')).toBeVisible();
    expect(loggar).toHaveLength(0);
  });
});
