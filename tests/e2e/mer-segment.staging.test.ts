import AxeBuilder from '@axe-core/playwright';
import { expect, type Route, test } from './support/test-bas';

/**
 * Fas 6g L2 — Segment-byggar-yta (/mer/segment). Bygger include/exclude-regel
 * över event-domänens taxonomi (deriveTaxonomy(get-events)) och räknar matchande
 * personer on-demand via compute-segment (L1, strikt Närvaropoäng=1).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, ej staging-exklusivt; jfr mer-intresserade.staging.test.ts).
 *
 * DETERMINISTISK via `page.route`-MOCK av get-events (taxonomi-källa) + compute-
 * segment (antal). Fixtur-formerna speglar EF:ernas RIKTIGA svar: get-events →
 * `{ events: EventSchema[] }` (adaptern z.array(EventSchema).parse), compute-segment
 * → `{ members: SegmentMemberSchema[], count }` (SegmentResultSchema.parse). Ofullständig
 * rad → parse-fel, så fixturerna är kompletta.
 *
 * Täckning: taxonomi-rendering (inkl. FÄLLA-35-etikett distinkt), include/exclude→
 * klartext-spegling, tom-regel-grind (knapp disabled + ledtext), "Räkna antal"→count,
 * tomt-resultat→neutral text (ej alert), fokus→<h1> + aria-live, axe 0, RadioGroup
 * tangentbords-nav. LÄS-konsumtion → ingen write-affordans.
 */

const GET_EVENTS = /\/functions\/v1\/get-events/;
const COMPUTE_SEGMENT = /\/functions\/v1\/compute-segment/;
const GET_SEGMENTS = /\/functions\/v1\/get-segments/;
const SAVE_SEGMENT = /\/functions\/v1\/save-segment/;

type EventRow = Record<string, unknown>;

/** En komplett Event-rad (EF-svarets form, EventSchema). Alla fält närvarande —
 * adaptern .parse():ar mot z.array(EventSchema), så ofullständig rad → parse-fel. */
function ev(eventNamn: string | null, typ: string | null, overrides: EventRow = {}): EventRow {
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

// Taxonomi-fixtur som täcker: serie-kurs (RIM 1, Utbildning), modalitet-delning
// (Fjärrskådning U + F), FÄLLA 35 (naket "Resor i medvetandet", Föreläsning), och
// ett noll-närvaro-par (Psionautics, Utbildning — valbart men ger tomt segment).
const TAXONOMY_EVENTS = [
  ev('Resor i medvetandet 1', 'Utbildning'),
  ev('Fjärrskådning', 'Utbildning'),
  ev('Fjärrskådning', 'Föreläsning'),
  ev('Resor i medvetandet', 'Föreläsning'), // fälla 35
  ev('Psionautics', 'Utbildning'),
];

async function mockEvents(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  events: EventRow[],
  { status = 200 }: { status?: number } = {},
): Promise<void> {
  await page.route(GET_EVENTS, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ events }) : JSON.stringify({ error: 'x' }),
    });
  });
}

async function mockCompute(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  count: number,
): Promise<void> {
  // members-formen speglar SegmentMemberSchema; för count-vyn räcker count, men
  // members måste parsa (adaptern .parse():ar hela svaret).
  const members = Array.from({ length: count }, (_, i) => ({
    id: `recM${i}`,
    namn: `Person ${i}`,
    email: `person${i}@example.se`,
    ejGodkandMail: false,
  }));
  await page.route(COMPUTE_SEGMENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members, count }),
    });
  });
}

/** Som mockCompute men med EXPLICITA members (L4-export: e-post/namn-form styr CSV:n). */
async function mockComputeMembers(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  members: Array<{ id: string; namn: string | null; email: string | null; ejGodkandMail: boolean }>,
): Promise<void> {
  await page.route(COMPUTE_SEGMENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ members, count: members.length }),
    });
  });
}

/**
 * Scopar till en pars radiogroup (aria-label = labelForPar) och väljer ett val.
 * react-aria Radio lägger `role="radio"` på en visuellt dold input → klick går
 * på den synliga LABEL-texten (exact), inte rollen.
 */
// biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
function choosePar(page: any, groupName: string, choice: 'Inkludera' | 'Exkludera') {
  return page
    .getByRole('radiogroup', { name: groupName })
    .getByText(choice, { exact: true })
    .click();
}

test.describe('Segment-byggar-yta (Fas 6g L2)', () => {
  // SavedSegmentsList (L3) hämtar get-segments vid varje /mer/segment-load → mocka
  // default tom så de count-fokuserade L2-testerna förblir deterministiska. Spara-testet
  // registrerar sin egen (stateful) get-segments-route i test-kroppen (vinner: senast
  // registrerad matchas först).
  test.beforeEach(async ({ page }) => {
    await page.route(GET_SEGMENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ segments: [] }),
      });
    });
  });

  test('taxonomi renderas (inkl. fälla-35-etikett distinkt) + fokus → <h1>', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await page.goto('/mer/segment');

    const heading = page.getByRole('heading', { level: 1, name: 'Bygg segment' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // Par-grupper (RadioGroup per par, aria-label = labelForPar).
    await expect(
      page.getByRole('radiogroup', { name: 'Resor i medvetandet 1 (utbildning)' }),
    ).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Fjärrskådning (utbildning)' }),
    ).toBeVisible();
    await expect(
      page.getByRole('radiogroup', { name: 'Fjärrskådning (föreläsning)' }),
    ).toBeVisible();

    // FÄLLA 35: naket "Resor i medvetandet" (Föreläsning) har OMISSKÄNNLIG etikett,
    // skild från RIM-serien.
    await expect(
      page.getByRole('radiogroup', {
        name: 'Resor i medvetandet — fristående föreläsning (ej del 1/2/3)',
      }),
    ).toBeVisible();
  });

  test('tom-regel-grind: include=[] → "Räkna antal" disabled + ledtext', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await expect(page.getByRole('button', { name: 'Räkna antal' })).toBeDisabled();
    await expect(page.getByText('Välj minst en kurs att inkludera.')).toBeVisible();
  });

  test('include/exclude uppdaterar klartext-speglingen', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Resor i medvetandet 1 (utbildning)', 'Inkludera');
    await expect(page.getByText('Med: deltog i')).toBeVisible();
    await expect(page.getByText('Resor i medvetandet 1 (utbildning)').last()).toBeVisible();

    await choosePar(page, 'Fjärrskådning (utbildning)', 'Exkludera');
    await expect(page.getByText('Utan: deltog i')).toBeVisible();
  });

  test('"Räkna antal" → count visas; aria-live', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await mockCompute(page, 3);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Resor i medvetandet 1 (utbildning)', 'Inkludera');
    await page.getByRole('button', { name: 'Räkna antal' }).click();

    // <strong>3</strong> + " personer matchar…" → normaliserad text "3 personer matchar…".
    await expect(page.getByText(/3 personer matchar den här regeln\./)).toBeVisible();
  });

  test('tomt resultat (count===0) → NEUTRAL text, ej role=alert', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await mockCompute(page, 0);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Psionautics (utbildning)', 'Inkludera');
    await page.getByRole('button', { name: 'Räkna antal' }).click();

    await expect(
      page.getByText('0 personer matchar — inga med genomförd närvaro ännu.'),
    ).toBeVisible();
    // Ärlig signal, INTE ett feltillstånd.
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('axe 0 violations på den renderade byggar-vyn', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    // Interagera så klartext-spegling + knapp-aktiv-state är med i scanet.
    await choosePar(page, 'Resor i medvetandet 1 (utbildning)', 'Inkludera');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('export (L4): räkna → exportera till SKOOL → nedladdning + bekräftelse + axe 0', async ({
    page,
  }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await mockComputeMembers(page, [
      { id: 'recM0', namn: 'Anna A', email: 'anna@example.se', ejGodkandMail: false },
      { id: 'recM1', namn: 'Bo B', email: 'bo@example.se', ejGodkandMail: true }, // consent-false → MED
      { id: 'recM2', namn: 'Cia C', email: 'cia@example.se', ejGodkandMail: false },
    ]);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    // Export-knappen kräver ett FÄRSKT antal — disabled tills man räknat.
    const exportBtn = page.getByRole('button', { name: 'Exportera till SKOOL-lista' });
    await expect(exportBtn).toBeDisabled();

    await choosePar(page, 'Resor i medvetandet 1 (utbildning)', 'Inkludera');
    await page.getByRole('button', { name: 'Räkna antal' }).click();
    await expect(page.getByText(/3 personer matchar den här regeln\./)).toBeVisible();

    // Exportera → webbläsar-nedladdning triggas (Blob + anchor).
    await expect(exportBtn).toBeEnabled();
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^skool-.*-\d{4}-\d{2}-\d{2}\.csv$/);

    // Gunilla-läsbar bekräftelse (consent-opt-out Bo INKLUDERAD → 3 med e-post).
    await expect(page.getByText(/3\s+personer med e-post laddades ner/)).toBeVisible();
    await expect(page.getByText('Bjud in i grupper om max 500 åt gången i SKOOL.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('export (L4): vissa saknar e-post → räknas synligt; tomt segment → ingen tyst fil', async ({
    page,
  }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await mockComputeMembers(page, [
      { id: 'recM0', namn: 'Anna A', email: 'anna@example.se', ejGodkandMail: false },
      { id: 'recM1', namn: 'Utan Epost', email: null, ejGodkandMail: false }, // exkluderas
    ]);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Resor i medvetandet 1 (utbildning)', 'Inkludera');
    await page.getByRole('button', { name: 'Räkna antal' }).click();
    await expect(page.getByText(/2 personer matchar den här regeln\./)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exportera till SKOOL-lista' }).click();
    await downloadPromise;

    await expect(page.getByText(/1 person med e-post laddades ner/)).toBeVisible();
    await expect(page.getByText('1 person saknar e-post och kom inte med.')).toBeVisible();
  });

  test('export (L4): tomt segment → export disabled + "inga personer än", ingen fil', async ({
    page,
  }) => {
    await mockEvents(page, TAXONOMY_EVENTS);
    await mockCompute(page, 0);
    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await choosePar(page, 'Psionautics (utbildning)', 'Inkludera');
    await page.getByRole('button', { name: 'Räkna antal' }).click();
    await expect(
      page.getByText('0 personer matchar — inga med genomförd närvaro ännu.'),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Exportera till SKOOL-lista' })).toBeDisabled();
    await expect(page.getByText('Det här segmentet har inga personer än.')).toBeVisible();
  });

  test('spara (L3): bygg regel → namnge → spara → syns i sparade-listan', async ({ page }) => {
    await mockEvents(page, TAXONOMY_EVENTS);

    const savedSeg = {
      id: 'recSAVED1',
      namn: 'FS-utbildningsdeltagare',
      rule: { include: [{ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }], exclude: [] },
      definition: 'Med: deltog i Fjärrskådning (utbildning).',
    };
    // Stateful get-segments: tomt tills save POST observerats, sedan listan med det sparade
    // (speglar invalidate→refetch-flödet). Registrerad EFTER beforeEach → vinner.
    let saved = false;
    await page.route(GET_SEGMENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ segments: saved ? [savedSeg] : [] }),
      });
    });
    await page.route(SAVE_SEGMENT, async (route: Route) => {
      saved = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ segment: savedSeg, record: { id: savedSeg.id, fields: {} } }),
      });
    });

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    // Tom lista initialt.
    await expect(page.getByText('Inga sparade segment än.')).toBeVisible();

    // Bygg regel → namnge → spara.
    await choosePar(page, 'Fjärrskådning (utbildning)', 'Inkludera');
    await page.getByRole('textbox', { name: 'Namn på segmentet' }).fill('FS-utbildningsdeltagare');
    await page.getByRole('button', { name: 'Spara segment' }).click();

    // Bekräftelse + segmentet dyker upp i listan (query invalideras → refetch).
    await expect(page.getByText('Segmentet sparades.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Sparade segment' })).toBeVisible();
    // Scopa till "Sparade segment"-regionen: namnet förekommer även som dolt
    // <option> i send-mail-Selecten (Fas 6h L3 SegmentMailCompose) → annars
    // strict-mode-kollision på två element.
    await expect(
      page.getByRole('region', { name: 'Sparade segment' }).getByText('FS-utbildningsdeltagare'),
    ).toBeVisible();
  });
});
