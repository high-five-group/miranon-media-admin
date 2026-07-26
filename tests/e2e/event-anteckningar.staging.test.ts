import AxeBuilder from '@axe-core/playwright';
import { mockValjarLista } from './helpers/valjar-lista';
import { expect, test } from './support/test-bas';

/**
 * task-18.11 — Anteckningar (S73-facit K66–K71, ADR-075): tidsstämplad ström
 * (composer överst, nyast först), server-satt författare, HÄRLEDD Under/Efter-fas
 * (Innan omärkt) och auto-grow-composern.
 *
 * Körs i chromium-authenticated-projektet. **Deterministisk via `page.route`-mock**
 * av get-event/get-event-notes/create-event-note (samma split som eventsidans övriga
 * e2e): SERVER-kontraktet (allowlist, faktisk skrivning, server-satt författare,
 * omläsning) bevisas av tests/api/*-event-note*.staging.test.ts mot skarp staging;
 * dessa e2e bevisar KLIENTENS form och beteende renderat (L245/L246) utan att mutera
 * delad staging-data.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const GET_ATTENDANCE = '**/functions/v1/get-attendance*';
const GET_EVENT_NOTES = '**/functions/v1/get-event-notes*';
const CREATE_EVENT_NOTE = '**/functions/v1/create-event-note';
const EVENT_ID = 'recNOTES000000001';

type Json = Record<string, unknown>;

// Genomfört event 10–11 juni 2026 → fas-etiketterna kan bevisas (Under/Efter/Innan).
function eventGenomfort(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-06-10',
    slutdatum: '2026-06-11',
    tidKvarTillEvent: 'Avslutat',
    maxPlatser: 12,
    antalAnmalda: 0,
    platserKvar: 12,
    anmaldBelaggning: 0,
    bekraftadBelaggning: 0,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Genomfört',
    eventKey: 'Event-42',
    ...overrides,
  };
}

// Demo-strömmen som EF:en levererar (redan sorterad nyast först). Tidpunkterna är
// alla mitt på dagen → fas-härledningen (dag mot eventdagarna) är tidszons-robust.
const NOTE_EFTER = {
  id: 'recNoteC',
  forfattare: 'Roger',
  text: 'Uppföljningsmail skickat till alla deltagare.',
  tidpunkt: '2026-06-15T09:00:00.000Z', // efter slut (06-11) → Efter eventet
  eventId: EVENT_ID,
};
const NOTE_UNDER = {
  id: 'recNoteB',
  forfattare: 'Lotta',
  text: 'Fin energi i gruppen efter förmiddagspasset.\nEn deltagare åkte hem tidigare.',
  tidpunkt: '2026-06-10T12:00:00.000Z', // på startdagen → Under eventet
  eventId: EVENT_ID,
};
const NOTE_INNAN = {
  id: 'recNoteA',
  forfattare: 'Roger',
  text: 'Lokalen bokad och betald.',
  tidpunkt: '2026-06-01T10:00:00.000Z', // före start → Innan (omärkt, tysta normen)
  eventId: EVENT_ID,
};
const DEMO_NOTES = [NOTE_EFTER, NOTE_UNDER, NOTE_INNAN];

interface MockOpts {
  notes?: Json[];
  notesStatus?: number;
}

/**
 * Mockar hela eventsidan för Anteckningar-fokus. get-event-notes är STATEFUL: en
 * `mutable` lista så att create-event-note kan prepend:a den nya noten och den
 * efterföljande refetchen (onSettled-invalidering) ser den. `captured` fångar
 * create-payloaden (för server-side-författar-beviset).
 */
async function mockSidan(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  opts: MockOpts = {},
): Promise<{ captured: () => Json | null }> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  const notesStatus = opts.notesStatus ?? 200;
  let notesList: Json[] = opts.notes ?? DEMO_NOTES;
  let capturedBody: Json | null = null;

  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventGenomfort() }),
    });
  });
  // Betalningar/Deltagare/Gruppdynamik + Närvaro (genomfört) — stubbas tomma.
  for (const pattern of [GET_REGISTRATIONS, GET_ATTENDANCE]) {
    await page.route(pattern, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
      const key = pattern === GET_REGISTRATIONS ? 'registrations' : 'attendance';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ [key]: [] }),
      });
    });
  }
  await page.route(GET_EVENT_NOTES, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    await route.fulfill({
      status: notesStatus,
      contentType: 'application/json',
      body:
        notesStatus === 200 ? JSON.stringify({ notes: notesList }) : JSON.stringify({ error: 'x' }),
    });
  });
  await page.route(
    CREATE_EVENT_NOTE,
    async (route: {
      request: () => { postDataJSON: () => Json };
      fulfill: (r: unknown) => Promise<void>;
    }) => {
      capturedBody = route.request().postDataJSON();
      const created = {
        id: `recNew${notesList.length}`,
        forfattare: 'Lotta',
        text: String(capturedBody.text ?? ''),
        tidpunkt: new Date().toISOString(),
        eventId: EVENT_ID,
      };
      notesList = [created, ...notesList]; // nyast först
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          note: created,
          record: { id: created.id, fields: {}, createdTime: created.tidpunkt },
        }),
      });
    },
  );

  return { captured: () => capturedBody };
}

// biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
const gruppen = (page: any) => page.locator('section[aria-labelledby="grupp-anteckningar"]');

test.describe('Anteckningar — strömmen + faserna (task-18.11)', () => {
  test('strömmen renderas nyast först med författare + tidpunkt (aldrig rå ISO) + text', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    await expect(grupp.getByRole('heading', { level: 2, name: 'Anteckningar' })).toBeVisible();

    // Nyast först: författarna i kort-ordning (Roger[efter] → Lotta[under] → Roger[innan]).
    const forfattare = await grupp.locator('article span.font-semibold').allTextContents();
    expect(forfattare).toEqual(['Roger', 'Lotta', 'Roger']);

    // Texten renderad; radbrytningen bevarad (whitespace-pre-line).
    await expect(grupp.getByText('Uppföljningsmail skickat till alla deltagare.')).toBeVisible();
    await expect(grupp.getByText('Lokalen bokad och betald.')).toBeVisible();

    // Långdatum (Gunilla — aldrig rå ISO i läsytan).
    await expect(grupp.getByText(/1 juni 2026/)).toBeVisible();
    expect(await grupp.getByText('2026-06-01T10:00:00.000Z').count()).toBe(0);
  });

  test('fas-etiketterna härleds: Efter/Under markeras, Innan är omärkt (tysta normen)', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const kort = grupp.locator('article');

    // Kort 0 (nyast, 15 juni) = Efter; kort 1 (10 juni, startdagen) = Under;
    // kort 2 (1 juni, före start) = Innan → INGEN fas-etikett.
    await expect(kort.nth(0)).toContainText('Efter eventet');
    await expect(kort.nth(1)).toContainText('Under eventet');
    await expect(kort.nth(2)).not.toContainText('Under eventet');
    await expect(kort.nth(2)).not.toContainText('Efter eventet');
  });

  test('composern skriver via create-event-note: payloaden bär ENDAST eventId + text (författaren är server-side)', async ({
    page,
  }) => {
    const { captured } = await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const ruta = grupp.getByRole('textbox', { name: 'Ny anteckning' });
    await ruta.fill('Ny testanteckning från composern');
    await grupp.getByRole('button', { name: 'Spara', exact: true }).click();

    // Den nya noten dyker upp (refetch efter settle) och rutan töms.
    await expect(grupp.getByText('Ny testanteckning från composern')).toBeVisible();
    await expect(ruta).toHaveValue('');

    // SERVER-SIDE-FÖRFATTAR-BEVIS: klienten skickade ALDRIG forfattare (ADR-075).
    expect(captured()).toEqual({ eventId: EVENT_ID, text: 'Ny testanteckning från composern' });
  });

  test('composern är auto-grow: field-sizing content + resize avstängd (facit-formen)', async ({
    page,
  }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const ruta = gruppen(page).getByRole('textbox', { name: 'Ny anteckning' });
    const stil = await ruta.evaluate((el: Element) => {
      const s = getComputedStyle(el);
      return {
        resize: s.resize,
        fieldSizing: (s as unknown as { fieldSizing?: string }).fieldSizing,
      };
    });
    expect(stil.resize).toBe('none');
    // Chromium stöder field-sizing (autoGrow); värdet ska vara 'content'.
    expect(stil.fieldSizing).toBe('content');
  });

  test('tomt läge: lugn textrad när eventet saknar anteckningar', async ({ page }) => {
    await mockSidan(page, { notes: [] });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Review-våg 2 (Marcus 2026-07-23): "Inga anteckningar ännu" och inget
    // mer — förklarings-svansen riven.
    await expect(gruppen(page).getByText('Inga anteckningar ännu', { exact: true })).toBeVisible();
  });

  test('läs-fel: get-event-notes 500 → role=alert i gruppen, resten av sidan intakt', async ({
    page,
  }) => {
    await mockSidan(page, { notesStatus: 500 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // 500 är retry-bart (fetchWithRetry 5xx × React Query non-4xx-retry) → fel-ytan
    // dyker upp först när retry-kedjan uttömts; timeout rymmer den (app-retry-kontraktet).
    await expect(gruppen(page).getByRole('alert')).toContainText(
      'Kunde inte hämta anteckningarna',
      {
        timeout: 12_000,
      },
    );
  });

  test('axe 0 violations — Anteckningar-gruppen (ström + composer)', async ({ page }) => {
    await mockSidan(page);
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      gruppen(page).getByRole('heading', { level: 2, name: 'Anteckningar' }),
    ).toBeVisible();

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const resultat = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-anteckningar"]')
      .withTags(taggar)
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('review-våg 3: composern — Spara + Rensa som visas först vid innehåll (CRM-formen)', async ({
    page,
  }) => {
    // Marcus (2026-07-23): 'Lägg till anteckning' → 'Spara' + sekundär Rensa
    // som progressive disclosure vid dirty state (CRM-notes-klassens form —
    // HubSpot/Pipedrive-composern; K68–K71 revideras öppet). Rensa tömmer
    // fältet och fokus återförs till skrivrutan (knappen försvinner —
    // fokus får aldrig tappas till body).
    await mockSidan(page, { notes: [] });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = gruppen(page);
    const skrivruta = grupp.getByRole('textbox', { name: 'Ny anteckning' });
    const spara = grupp.getByRole('button', { name: 'Spara', exact: true });
    await expect(spara).toBeVisible();
    await expect(spara).toBeDisabled();
    await expect(grupp.getByRole('button', { name: 'Rensa', exact: true })).toHaveCount(0);

    await skrivruta.fill('Utkast som ångras');
    const rensa = grupp.getByRole('button', { name: 'Rensa', exact: true });
    await expect(rensa).toBeVisible();
    await expect(spara).toBeEnabled();

    await rensa.click();
    await expect(skrivruta).toHaveValue('');
    await expect(grupp.getByRole('button', { name: 'Rensa', exact: true })).toHaveCount(0);
    await expect(spara).toBeDisabled();
    await expect(skrivruta).toBeFocused();
  });
});
