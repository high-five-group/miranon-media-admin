import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6g L2 — Segment-yta (/mer/segment).
 *
 * [TASK-249.5, ADR-102/103] ADR-102/103-promoveringen flippade routen till
 * `VariantD` (mallvyn/verkstaden/segment-listan/generatorn/utskicksvyn) —
 * den gamla `SegmentBuilder`-ytan ("Bygg segment"-rubriken, RadioGroup
 * Inkludera/Exkludera/Ignorera per kurs, "Räkna antal", SKOOL-export,
 * spara-flödet) renderas inte längre här. De NIO SegmentBuilder-specifika
 * testerna som stod i denna fil är BORTTAGNA, inte skippade —
 * `tasks/lessons.d/acceptance-klassens-sjalvtest-tillater-ingen-parkering.md`
 * (TASK-214.4-precedentet, PR #1306): hermetik-självtestet
 * (`scripts/hermetik-sjalvtest.mjs`) kräver att VARJE test i klassen fälls
 * med `OmockadRequestError` när fixturvärlden töms — ett `test.skip`:at test
 * rapporterar `skipped` i stället och räknas som en AVVIKELSE ("Testet
 * överlever utan fixturens svar och bevisar därför inget om appens
 * databeteende"), inte som en neutral parkering. Innehållet finns kvar i
 * git-historien (denna fil, före TASK-249.5); full omskrivning mot
 * VariantD:s faktiska flöden: TASK-249.9.
 *
 * KVARVARANDE TEST — axe-smoke mot den PROMOVERADE ytan: a11y-golvet (11
 * utan undantag) ska aldrig stå obevakat mellan flippen och TASK-249.9:s
 * fulla omskrivning.
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080). **Deterministisk via
 * `network.use()`** — inte `page.route`: page-routes prövas FÖRE MSW:s
 * context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstren byggs med
 * `EF(namn)` ur handlers-modulen och svaren med `json(...)`, aldrig som
 * handskrivna strängar — en överskuggning vars mönster inte matchar faller
 * igenom UTAN att något fälls (den tysta fällan, `hermetic.ts` §
 * Överskugga en delad handler).
 *
 * Fixtur-formerna speglar EF:ernas RIKTIGA svar: get-events →
 * `{ events: EventSchema[] }` (adaptern z.array(EventSchema).parse),
 * compute-segment → `{ members: SegmentMemberSchema[], count }`
 * (SegmentResultSchema.parse). Ofullständig rad → parse-fel, så fixturerna
 * är kompletta.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type EventRow = z.infer<typeof EventSchema>;

/** En komplett Event-rad (EF-svarets form, EventSchema). Alla fält närvarande —
 * adaptern .parse():ar mot z.array(EventSchema), så ofullständig rad → parse-fel.
 * `kursfamilj`/`kursniva` (TASK-249.5) matchar basens verifierade backfill
 * (`course-dimensions.ts`). */
function ev(
  eventNamn: string | null,
  typ: string | null,
  overrides: Partial<EventRow> = {},
): EventRow {
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
    ...overrides,
  };
}

/** Överskuggar get-events. */
function mockEvents(network: NetworkFixture, events: EventRow[]): void {
  network.use(http.get(EF('get-events'), () => json({ events })));
}

test.describe('Segment-yta (Fas 6g L2, promoverad TASK-249.5)', () => {
  // SavedSegmentsList (L3, gamla ytan) hämtar get-segments — VariantD gör det
  // också (`listSegments()`, TASK-249.5) → mocka default tom.
  test.beforeEach(async ({ network }) => {
    network.use(http.get(EF('get-segments'), () => json({ segments: [] })));
  });

  /**
   * [TASK-249.5] ERSÄTTER det gamla SegmentBuilder-axe-testet (borttaget,
   * se filhuvudet) — a11y-golvet (11 utan undantag) ska aldrig stå obevakat
   * mellan flippen och den fulla omskrivningen (TASK-249.9). Minimal, men
   * ÄKTA: navigerar mot den PROMOVERADE ytan UTAN variant-param (AC#1),
   * väntar in segment-listans fokusmål, kör axe mot HELA sidan (samma
   * tag-uppsättning som resten av klassen).
   */
  test('axe 0 violations på den promoverade segment-ytan', async ({ page, network }) => {
    // Egen fixtur med kursfamilj/kursniva satta — VariantD:s `harledKursAtomer`
    // kräver `familj !== null` per par (`byggParInfo`, TASK-249.5); en
    // okänd-familj-fixtur hade gett en TOM de-fjorton-lista i stället för den
    // realistiska ytan axe ska granska.
    mockEvents(network, [
      ev('Resor i medvetandet 1', 'Utbildning', { kursfamilj: 'RIM', kursniva: 'Nivå 1' }),
      ev('Resor i medvetandet 2', 'Utbildning', { kursfamilj: 'RIM', kursniva: 'Nivå 2' }),
      ev('Fjärrskådning', 'Utbildning', { kursfamilj: 'Fjärrskådning', kursniva: null }),
      ev('Psionautics', 'Utbildning', { kursfamilj: 'Psionautics', kursniva: null }),
    ]);
    network.use(http.post(EF('compute-segment'), () => json({ members: [], count: 0 })));

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Segment' })).toBeVisible();
    await expect(page.getByTestId('segment-listan')).toBeVisible();
    await expect(page.getByText(/Räknar/)).toHaveCount(0);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
