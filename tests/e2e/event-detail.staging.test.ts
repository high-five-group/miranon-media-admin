import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * task-18.1 — Eventsidans grundform (S73-facit) + Om eventet-morfen +
 * uppdatera-event-vertikalen.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + update-event —
 * mark-paid-precedentens split: SERVER-write-kontraktet (allowlist, faktisk
 * mutation, omläsning, restore) bevisas av `tests/api/update-event.staging.test.ts`
 * mot skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt
 * utan att mutera delad staging-data.
 *
 * Täckning: toppraden (chevron ensam + h1 + EventKey-pill + tid kvar-raden),
 * grupp-grammatiken (rubrik UTANFÖR tonala kort), Om eventets etikett-värde-rader
 * med långdatum (aldrig rå ISO), MORFEN Δ=0 px DOM-mätt (AC #3) + likbredda fält,
 * "ändrar från"-mönstret, Spara-payloaden (endast satta fält), fel-väg, Avbryt
 * med fokus-retur, 404/fel/laddläge, axe 0 i BÅDA morf-lägena.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const UPDATE_EVENT = '**/functions/v1/update-event';
const EVENT_ID = 'recDETAIL0000001';

type EventMock = Record<string, unknown>;

function eventDetail(overrides: EventMock = {}): EventMock {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1 – 2026-07-31',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-07-31',
    slutdatum: '2026-08-01',
    tidKvarTillEvent: '1 vecka och 3 dagar',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 5,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 6,
    status: 'Planerat',
    eventKey: 'Event-21',
    // Beläggningens innehållsmodell (task-18.2, K16) — facit-lik komposition:
    // 8 + 1 + 1 + 1 = 11 av 12 upptagna (92 %), väntelistan 0 utanför taket.
    reserverade: 1,
    manuelltTillagda: 1,
    viaFormular: 8,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

async function mockEvent(
  // biome-ignore lint/suspicious/noExplicitAny: Playwright Page type i test-scope.
  page: any,
  body: EventMock,
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): Promise<() => void> {
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  await page.route(GET_EVENT, async (route: { fulfill: (r: unknown) => Promise<void> }) => {
    if (gate) await gate;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: status === 200 ? JSON.stringify({ event: body }) : JSON.stringify({ error: 'x' }),
    });
  });
  // Betalningar-gruppen (task-18.8) hämtar anmälningarna — stubbas tom så
  // sviten förblir deterministisk (arbetsytans egen svit: mark-paid-e2e).
  await page.route(
    '**/functions/v1/get-registrations*',
    async (route: { fulfill: (r: unknown) => Promise<void> }) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: [] }),
      });
    },
  );
  return release;
}

test.describe('Eventsidan — grundformen (task-18.1)', () => {
  test('toppraden: chevron ensam + h1 = eventnamn (fokus) + EventKey-pill + tid kvar-rad', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);

    // h1 = eventnamnet, fokuserad efter async-laddning (identiteten är sidrubriken).
    const heading = page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 1' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att eventet anlänt.
    await expect(page.getByText('Event Resor i medvetandet 1 laddat.')).toHaveCount(1);

    // Chevronen ensam bär "detta är en undersida" — rund 44 px-knapp, länk till listan.
    const back = page.getByRole('link', { name: 'Tillbaka till event' });
    await expect(back).toBeVisible();
    await expect(back).toHaveAttribute('href', '/event');
    const backBox = await back.boundingBox();
    expect(backBox?.width).toBe(44);
    expect(backBox?.height).toBe(44);

    // EventKey-pillen på titelraden (metadata, inte titel-storlek).
    await expect(page.getByText('Event-21')).toBeVisible();

    // Tid kvar-raden under titeln — nedräkningsformerna bär suffixet
    // "kvar till eventet" (review-våg 1, Marcus 2026-07-22).
    await expect(page.getByText('1 vecka och 3 dagar kvar till eventet')).toBeVisible();
  });

  test('tid kvar-raden: "Avslutat" renderas rått utan kvar-suffix (formelns enda icke-nedräkningsgren)', async ({
    page,
  }) => {
    // Basens formel (fldcwlblR3JQxXVbe, läst 2026-07-22) ger exakt tre
    // former: "Avslutat" | "N dagar" | "N vecka/veckor [och M dagar]" —
    // suffixet får aldrig ge "Avslutat kvar till eventet".
    await mockEvent(page, eventDetail({ tidKvarTillEvent: 'Avslutat' }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Avslutat', { exact: true })).toBeVisible();
    await expect(page.getByText(/Avslutat kvar till/)).toHaveCount(0);
  });

  test('grupp-grammatiken: rubriker UTANFÖR tonala kort; facit-ordningen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Grupperna i facit-ordning (18.1+18.3:s delmängd — check-in-kortet är
    // rubrikfritt per K26; Gruppdynamik/Anteckningar 18.10/18.11).
    const rubriker = await page.getByRole('heading', { level: 2 }).allTextContents();
    expect(rubriker).toEqual([
      'Åtgärder',
      'Om eventet',
      'Beläggning',
      'Anmälda deltagare',
      'Betalningar',
      'Närvaro',
    ]);

    // Rubriken står UTANFÖR den tonala kortytan: h2:s förälder är sektionen,
    // och kortet (syskonet efter) bär tonal bakgrund (inte transparent).
    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    const kort = omGrupp.locator('[data-testid="grupp-kort"]');
    const kortBg = await kort.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(kortBg).not.toBe('rgba(0, 0, 0, 0)');
    const h2InuteKort = await kort.locator('h2').count();
    expect(h2InuteKort).toBe(0);
  });

  test('Om eventet: etikett-värde-rader med långdatum (aldrig rå ISO)', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await expect(omGrupp.getByText('Utbildning', { exact: true })).toBeVisible();
    await expect(omGrupp.getByText('Skövde', { exact: true })).toBeVisible();
    // Långdatum-spannet (Gunilla — aldrig rå ISO i läsytan).
    await expect(omGrupp.getByText('31 juli – 1 augusti 2026')).toBeVisible();
    await expect(omGrupp.getByText('Planerat', { exact: true })).toBeVisible();
    expect(await omGrupp.getByText('2026-07-31').count()).toBe(0);
  });

  test('MORFEN Δ=0 px DOM-mätt (AC #3): kortets geometri + etikett-positioner identiska; likbredda fält', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    const kort = omGrupp.locator('[data-testid="grupp-kort"]');

    // DOKUMENT-relativa positioner (top + scrollY, 18.2-testets mätform):
    // morfens autoFocus scrollar fältet i vy — sedan 18.3 lade Åtgärder +
    // check-in ovanför ligger kortet lägre och scrollen slår till. Viewport-
    // relativa boundingBox-y skiftar då av SCROLLEN, inte av geometrin;
    // dokument-koordinater är den ärliga Δ=0 px-mätningen.
    const kortBox = () =>
      kort.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height, width: r.width };
      });
    const labelTops = () =>
      kort
        .locator('dt')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top + window.scrollY));

    // Läge 1 (visning): kortets box + varje etiketts y-position.
    const before = await kortBox();
    const labelYBefore = await labelTops();

    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Läge 2 (redigering): exakt samma kort-geometri och rad-positioner (Δ=0 px).
    const after = await kortBox();
    expect(after.height).toBe(before.height);
    expect(after.top).toBe(before.top);
    expect(after.width).toBe(before.width);

    const labelYAfter = await labelTops();
    expect(labelYAfter).toEqual(labelYBefore);

    // Likbredda fält: alla fyra fält-slotar exakt samma bredd (K13-regeln).
    const slotWidths = await kort
      .locator('[data-testid="falt-slot"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(slotWidths.length).toBe(4);
    expect(new Set(slotWidths).size).toBe(1);
  });

  test('"ändrar från"-mönstret: nuvarande värde dämpat bredvid fältet', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Nuvarande värden står kvar synliga (dämpade) genom hela ändringen.
    const nuvarande = omGrupp.locator('[data-testid="nuvarande-varde"]');
    await expect(nuvarande).toHaveText([
      'Utbildning',
      'Skövde',
      '31 juli – 1 augusti 2026',
      'Planerat',
    ]);
  });

  test('Spara skriver via update-event: endast satta fält i payloaden; morfen stängs mot svaret', async ({
    page,
  }) => {
    // Server-sanning i mocken (mark-paid-mönstret): efter update speglar get-event
    // det nya värdet — onSettled-refetchen (ADR-016 E) ska KONVERGERA, inte backa.
    let serverOrt = 'Skövde';
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: eventDetail({ ort: serverOrt }) }),
      });
    });
    let updateBody: Record<string, unknown> | null = null;
    await page.route(UPDATE_EVENT, async (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      serverOrt = 'Falköping'; // server-sanningen efter mutationen
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: eventDetail({ ort: 'Falköping' }),
          record: { id: EVENT_ID, fields: {} },
        }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();

    // Ändra orten och spara.
    const ortFalt = omGrupp.getByRole('textbox', { name: 'Ort' });
    await ortFalt.fill('Falköping');
    await omGrupp.getByRole('button', { name: 'Spara' }).click();

    // Morfen stängs mot svaret; raden visar nya värdet.
    await expect(omGrupp.getByRole('button', { name: 'Ändra' })).toBeVisible();
    await expect(omGrupp.getByText('Falköping', { exact: true })).toBeVisible();

    // Payloaden: eventId + SAMTLIGA sektionens fält (sektions-spara), inga extra.
    expect(updateBody).toEqual({
      eventId: EVENT_ID,
      typ: 'Utbildning',
      ort: 'Falköping',
      startdatum: '2026-07-31',
      slutdatum: '2026-08-01',
      status: 'Planerat',
    });
  });

  test('fel-väg: update-event 500 → role=alert med fel, morfen förblir öppen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.route(UPDATE_EVENT, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-1' }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();
    await omGrupp.getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('alert')).toContainText('Kunde inte spara');
    // Morfen kvar (Spara syns fortfarande — inget tyst tapp av ändringar).
    await expect(omGrupp.getByRole('button', { name: 'Spara' })).toBeVisible();
  });

  test('Avbryt: ändringar kastas; fokus tillbaka till Ändra-knappen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const omGrupp = page.locator('section[aria-labelledby="grupp-om-eventet"]');
    await omGrupp.getByRole('button', { name: 'Ändra' }).click();
    await omGrupp.getByRole('textbox', { name: 'Ort' }).fill('Bortkastat');
    await omGrupp.getByRole('button', { name: 'Avbryt' }).click();

    await expect(omGrupp.getByText('Skövde', { exact: true })).toBeVisible();
    await expect(omGrupp.getByRole('button', { name: 'Ändra' })).toBeFocused();
  });

  test('interim-sektionerna behåller funktionen: länkar till detaljytorna', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Närvaro är den SISTA interim-sektionen (18.9 bygger registret).
    // Betalningar är SKARP sedan 18.8 (inline-arbetsytan, egen svit i
    // mark-paid-e2e) och Anmälda deltagare sedan 18.4 (arbetskön, egen svit i
    // event-deltagare-e2e) — deras länkar till de gamla vyerna är rivna.
    await expect(page.getByRole('link', { name: 'Öppna anmälda-vyn' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Öppna betalnings-vyn' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Öppna närvaro-vyn' })).toHaveAttribute(
      'href',
      `/event/${EVENT_ID}/narvaro`,
    );
  });

  test('namnlöst event → fallback, ingen krasch; pill utelämnas utan eventKey', async ({
    page,
  }) => {
    // eventKey: undefined → nyckeln droppas ur JSON:et (EF-formen när värdet saknas).
    await mockEvent(page, eventDetail({ eventNamn: null, eventlabel: null, eventKey: undefined }));
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Namnlöst event' })).toBeVisible();
    expect(await page.getByText('Event-21').count()).toBe(0);
  });

  test('NOT-FOUND (404) → ej-funnen-UI via role=alert', async ({ page }) => {
    await mockEvent(page, eventDetail(), { status: 404 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('alert')).toContainText('Eventet hittades inte');
  });

  test('övrigt fel (icke-404) → generisk fel-UI via role=alert', async ({ page }) => {
    await mockEvent(page, eventDetail(), { status: 400 });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta eventet');
  });

  test('Lugnt laddläge: skeleton i slutgeometri (aria-busy + sr-besked), ingen "Laddar…"-textrad', async ({
    page,
  }) => {
    const release = await mockEvent(page, eventDetail(), { manualRelease: true });
    await page.goto(`/event/${EVENT_ID}`);

    // Scopa till skeletonens status-region (OfflineIndicator bär också role=status).
    const status = page.getByRole('status').filter({ hasText: 'Laddar event…' });
    await expect(status).toHaveAttribute('aria-busy', 'true');
    // Besked endast sr-only — ingen synlig "Laddar…"-textrad (Lugnt laddläge).
    const synligLaddtext = page.getByText('Laddar event…');
    await expect(synligLaddtext).toHaveClass(/sr-only/);

    release();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Resor i medvetandet 1' }),
    ).toBeVisible();
  });

  test('axe 0 violations — visningsläget OCH morf-lägena (Om eventet + Beläggning)', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const visning = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(visning.violations).toEqual([]);

    await page
      .locator('section[aria-labelledby="grupp-om-eventet"]')
      .getByRole('button', { name: 'Ändra' })
      .click();
    const morf = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(morf.violations).toEqual([]);

    // Stäng Om eventet-morfen och öppna Beläggningens (task-18.2) — nya mönster
    // (RAC NumberField, segmenterad mätare) får axe-0 i sitt öppna läge.
    await page
      .locator('section[aria-labelledby="grupp-om-eventet"]')
      .getByRole('button', { name: 'Avbryt' })
      .click();
    await page
      .locator('section[aria-labelledby="grupp-belaggning"]')
      .getByRole('button', { name: 'Ändra' })
      .click();
    const belaggningsMorf = await new AxeBuilder({ page }).withTags(taggar).analyze();
    expect(belaggningsMorf.violations).toEqual([]);
  });
});

/**
 * task-18.3 — Åtgärds-gruppen + check-in-ingången + chevron-koherensen
 * (S73-facit K19–K26, K47, K72).
 *
 * Renderad verifiering (L245/L246): hover-plattans grammatik, måttpariteten
 * check-in ↔ åtgärdsrad och kuvert-grammatiken bevisas via computed-style/
 * DOM-mätning — aldrig klass-tittande. Utskicks-raderna + Markera betalda är
 * ÄNNU inte kopplade (flödena byggs i 18.6/18.8) och bär aria-disabled tills
 * dess — öppet bokfört interim; Skriv ut är skarp (window.print).
 */
test.describe('Åtgärder + check-in-ingången (task-18.3)', () => {
  test('check-in-ingången: eget rubrikfritt kort ÖVER Åtgärder i exakt åtgärdsradens mått', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Ingången är en LÄNK med belagt mål (PRD beslut 18-mönstret, öppet
    // avgjort i skivan): befintliga närvaro-ytan tills check-in-sidan byggs.
    const checkIn = page.getByRole('link', { name: 'Gå till check-in' });
    await expect(checkIn).toBeVisible();
    await expect(checkIn).toHaveAttribute('href', `/event/${EVENT_ID}/narvaro`);

    // Eget kort-skal (K24/K26): tonal yta + 16 px-radie, UTAN rubrik —
    // det speciella bärs av placeringen + ensamheten, inte avvikande mått.
    const kort = page.locator('[data-testid="checkin-kort"]');
    const kortStil = await kort.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, radie: s.borderRadius };
    });
    expect(kortStil.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(kortStil.radie).toBe('16px');
    expect(await kort.locator('h2').count()).toBe(0);

    // Placeringen: kortet ligger ovanför Åtgärds-gruppen (K23 — eventdagens
    // primärhandling), och raden delar åtgärdsradens mått (K26, DOM-mätt).
    const atgarder = page.locator('section[aria-labelledby="grupp-atgarder"]');
    const kortBox = await kort.boundingBox();
    const atgarderBox = await atgarder.boundingBox();
    expect((kortBox?.y ?? 0) + (kortBox?.height ?? 0)).toBeLessThanOrEqual(atgarderBox?.y ?? 0);

    const checkInHojd = (await checkIn.boundingBox())?.height;
    const atgardsRadHojd = (
      await atgarder.getByRole('link', { name: 'Lägg till manuell anmälan' }).boundingBox()
    )?.height;
    expect(checkInHojd).toBe(atgardsRadHojd);
  });

  test('Åtgärder: sex rader i frekvensordning med kuvert-grammatiken och chevroner', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');

    // Frekvensordningen (K21: vanligaste först) — Lägg till är en LÄNK till
    // manuell anmälan-sidan (K16/K17), resten knappar.
    const lagg = grupp.getByRole('link', { name: 'Lägg till manuell anmälan' });
    await expect(lagg).toHaveAttribute('href', `/event/${EVENT_ID}/ny-anmalan`);
    const radNamn = await grupp
      .locator('a, button')
      .evaluateAll((els) => els.map((el) => (el.textContent ?? '').trim()));
    expect(radNamn).toEqual([
      'Lägg till manuell anmälan',
      'Skicka bekräftelsemail till obekräftade',
      'Skicka betalningspåminnelse till obetalda',
      'Markera alla obetalda som betalda',
      'Skicka eventinfo till alla anmälda',
      'Skriv ut denna detaljsida',
    ]);

    // Kuvert-grammatiken (K47): Mail på VARJE skicka mail-handling — exakt
    // de tre utskicks-raderna; plus/badge-check/printer bär sina rader.
    await expect(grupp.locator('svg.lucide-mail')).toHaveCount(3);
    await expect(grupp.locator('svg.lucide-plus')).toHaveCount(1);
    await expect(grupp.locator('svg.lucide-badge-check')).toHaveCount(1);
    await expect(grupp.locator('svg.lucide-printer')).toHaveCount(1);

    // K25-chevronen på ALLA sex rader (chevron = raden leder vidare).
    await expect(grupp.locator('svg.lucide-chevron-right')).toHaveCount(6);
  });

  test('hover-plattan (K72): emphasized-platta med rundade hörn på hovrad rad, transparent i vila', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
    const rad = grupp.getByRole('button', { name: 'Skicka bekräftelsemail till obekräftade' });

    // Vila: transparent bakgrund (plattan finns bara vid hover).
    const bgVila = await rad.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgVila).toBe('rgba(0, 0, 0, 0)');

    // Hover: emphasized-plattan (K56-grammatiken) — computed mot token-kedjan.
    // toHaveCSS auto-retryar förbi motion-safe-transitionens mellanvärden.
    const emphasized = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-bg-emphasized)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    await rad.hover();
    await expect(rad).toHaveCSS('background-color', emphasized);
    await expect(rad).toHaveCSS('border-radius', '8px');

    // Plattans -mx-2-geometri (K72): knappen skjuter 8 px UTANFÖR kortets
    // 16 px innehålls-inset (kant + padding) — plattan får luft utan att
    // texten flyttas. DOM-mätt mot kortets computed kant/padding-kedja.
    const kortet = grupp.locator('[data-testid="grupp-kort"]');
    const kortMatt = await kortet.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        x: el.getBoundingClientRect().x,
        inset: Number.parseFloat(s.borderLeftWidth) + Number.parseFloat(s.paddingLeft),
      };
    });
    expect(kortMatt.inset).toBe(17); // 1 px kant + 16 px padding (px-4)
    const radX = (await rad.boundingBox())?.x ?? 0;
    expect(radX).toBe(kortMatt.x + kortMatt.inset - 8);
  });

  test('Skriv ut är skarp: raden anropar window.print', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.addInitScript(() => {
      (window as unknown as { __printAnrop: number }).__printAnrop = 0;
      window.print = () => {
        (window as unknown as { __printAnrop: number }).__printAnrop += 1;
      };
    });
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Skriv ut denna detaljsida' }).click();
    const anrop = await page.evaluate(
      () => (window as unknown as { __printAnrop: number }).__printAnrop,
    );
    expect(anrop).toBe(1);
  });

  test('okopplade rader bär aria-disabled tills sina flöden finns (18.6/18.8); de skarpa gör det inte', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
    for (const namn of [
      'Skicka bekräftelsemail till obekräftade',
      'Skicka betalningspåminnelse till obetalda',
      'Markera alla obetalda som betalda',
      'Skicka eventinfo till alla anmälda',
    ]) {
      await expect(grupp.getByRole('button', { name: namn })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
    await expect(
      grupp.getByRole('link', { name: 'Lägg till manuell anmälan' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
    await expect(
      grupp.getByRole('button', { name: 'Skriv ut denna detaljsida' }),
    ).not.toHaveAttribute('aria-disabled', 'true');
  });
});

/**
 * task-18.2 — Beläggningen till S73-facit (K14–K22): innehållsmodellen som
 * mappar basen 1-till-1, segmenterad mätare med streck-markörer, Väntelista-
 * raden alltid med utanför taket, och Ändra-morfen på de tre skrivbara fälten
 * via uppdatera-event-operationen.
 *
 * Deterministisk via `page.route`-mock (mark-paid-precedentens split): SERVER-
 * kontraktet (allowlist, faktisk mutation mot staging, per-källa-aggregationen,
 * omläsning, restore) bevisas av tests/api/update-event.staging.test.ts +
 * tests/api/get-event.staging.test.ts; dessa e2e bevisar KLIENTENS form och
 * beteende flak-fritt (renderad verifiering — L245/L246).
 */
test.describe('Beläggningen (task-18.2)', () => {
  test('K16-modellen renderad mot facit: radordning, värden, väntelistan alltid med', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // Radordningen är Marcus-modellens (K16): taket först, sedan kategorierna
    // som fyller det, väntelistan sist (utanför taket).
    const termer = await grupp.locator('dt').allTextContents();
    expect(termer).toEqual([
      'Max antal platser',
      'Extra platser',
      'Anmälda deltagare',
      'Manuellt tillagda',
      'Medföljande',
      'Väntelista',
    ]);

    // Värdena ur innehållsmodellen (per-källa — inte basens aggregat).
    const varden = await grupp.locator('dd').allTextContents();
    expect(varden).toEqual(['12', '1', '8', '1', '1', '0']);
  });

  test('streck-markörerna: kategorirader bär färgade streck == mätarens segment; väntelistan utan', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // Renderad verifiering (L245): streckens computed background-color per rad —
    // fyra kategorirader har streck, Max/Väntelista har inga.
    const streckFarger = await grupp
      .locator('dt span[aria-hidden="true"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(streckFarger.length).toBe(4);
    // Fyra DISTINKTA kategorifärger (aldrig samma färg två gånger).
    expect(new Set(streckFarger).size).toBe(4);

    // Mätarens segment bär SAMMA färger som strecken (GitHub-storage-klassen:
    // streck på raderna == segment i stapeln) — ordningen är fyllnadsordningen
    // (deltagare först, reserverade sist), inte radordningen.
    const segmentFarger = await grupp
      .locator('[data-testid^="belaggning-segment-"]')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
    expect(segmentFarger.length).toBe(4);
    expect(new Set(segmentFarger)).toEqual(new Set(streckFarger));

    // Deltagar-blå är INTE fokusringens exklusiva #1b4965 (konstitutionen:
    // --p-blue-700 aldrig till annat — medveten facit-avvikelse, öppet bokförd).
    expect(streckFarger).not.toContain('rgb(27, 73, 101)');
  });

  test('mätaren: "11 av 12 platser upptagna" + 92 % + proportionella segment; dekorativ stapel', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');

    // TEXTEN är bäraren (a11y): summering + procent (8+1+1+1 = 11 av 12 = 92 %).
    await expect(grupp.getByText('11 av 12 platser upptagna')).toBeVisible();
    await expect(grupp.getByText('92 %')).toBeVisible();

    // Stapeln är dekorativ (aria-hidden) och segmentbredderna proportionella:
    // formulär-segmentet (8/12) är störst — DOM-mätt (L246).
    const matare = grupp.locator('[data-testid="belaggning-matare"]');
    await expect(matare.locator('[aria-hidden="true"]')).toHaveCount(1);
    const bredder = await matare
      .locator('[data-testid^="belaggning-segment-"]')
      .evaluateAll((els) =>
        els.map((el) => ({
          nyckel: (el as HTMLElement).dataset.testid,
          bredd: el.getBoundingClientRect().width,
        })),
      );
    const formular = bredder.find((b) => b.nyckel === 'belaggning-segment-formular');
    expect(formular).toBeTruthy();
    for (const b of bredder) {
      if (b.nyckel !== 'belaggning-segment-formular') {
        expect(formular?.bredd ?? 0).toBeGreaterThan(b.bredd);
      }
    }
  });

  test('fullt event: " · Fullt" i mätartexten; utan tak: tomt spår', async ({ page }) => {
    await mockEvent(
      page,
      eventDetail({ viaFormular: 9, maxPlatser: 12, reserverade: 1, manuelltTillagda: 1 }),
    );
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('12 av 12 platser upptagna · Fullt')).toBeVisible();
  });

  test('MORFEN Δ=0 px DOM-mätt (AC #2): kortets geometri + etikett-positioner; likbredda w-32-fält', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    const kort = grupp.locator('[data-testid="grupp-kort"]');

    // DOKUMENT-relativa positioner (top + scrollY): morfens autoFocus scrollar
    // fältet i vy → viewport-relativa boundingBox-y skiftar av SCROLLEN, inte
    // av geometrin. Dokument-koordinater är den ärliga Δ=0 px-mätningen.
    const kortBox = () =>
      kort.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height, width: r.width };
      });
    const labelTops = () =>
      kort
        .locator('dt')
        .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top + window.scrollY));

    // Läge 1 (visning): kortets box + varje etiketts y-position.
    const before = await kortBox();
    const labelYBefore = await labelTops();

    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Läge 2 (redigering): exakt samma kort-geometri och rad-positioner (Δ=0 px).
    const after = await kortBox();
    expect(after.height).toBe(before.height);
    expect(after.top).toBe(before.top);
    expect(after.width).toBe(before.width);

    const labelYAfter = await labelTops();
    expect(labelYAfter).toEqual(labelYBefore);

    // Likbredda fält per-FORMULÄR (K15): tre antal-fält-slotar, exakt samma
    // bredd, smalare än Om eventets w-60 (fältbredd speglar förväntat svar).
    const slotBredder = await kort
      .locator('[data-testid="falt-slot"]')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    expect(slotBredder.length).toBe(3);
    expect(new Set(slotBredder).size).toBe(1);
    expect(slotBredder[0]).toBeLessThan(240);
  });

  test('"ändrar från"-mönstret: nuvarande värden dämpade bredvid antal-fälten', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Nuvarande värden står kvar synliga (dämpade) genom hela ändringen —
    // endast de TRE redigerbara raderna bär mönstret (läsraderna är kontext).
    const nuvarande = grupp.locator('[data-testid="nuvarande-varde"]');
    await expect(nuvarande).toHaveText(['12', '1', '1']);

    // Fokus-kontinuitet: första fältet fokuserat när morfen öppnas.
    await expect(grupp.getByRole('textbox', { name: 'Max antal platser' })).toBeFocused();
  });

  test('Spara skriver via update-event: TRE absoluta fält; mergen behåller räkningsraderna', async ({
    page,
  }) => {
    // Server-sanning i mocken: efter update speglar get-event det nya värdet —
    // onSettled-refetchen (ADR-016 E) ska KONVERGERA, inte backa.
    let serverMax = 12;
    await page.route(GET_EVENT, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: eventDetail({ maxPlatser: serverMax }) }),
      });
    });
    let updateBody: Record<string, unknown> | null = null;
    await page.route(UPDATE_EVENT, async (route) => {
      updateBody = route.request().postDataJSON() as Record<string, unknown>;
      serverMax = 14;
      // update-event-svaret bär ALDRIG räkningarna (viaFormular/medfoljande/
      // vantelista) — exakt EF-formen; mergen i useUpdateEvent måste bevara dem.
      const {
        viaFormular: _vf,
        medfoljande: _mf,
        vantelista: _vl,
        ...utanRakningar
      } = eventDetail({ maxPlatser: 14 });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          event: utanRakningar,
          record: { id: EVENT_ID, fields: {} },
        }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();

    // Ändra Max antal platser 12 → 14 (RAC NumberField committar vid blur).
    await grupp.getByRole('textbox', { name: 'Max antal platser' }).fill('14');
    await grupp.getByRole('button', { name: 'Spara' }).click();

    // Morfen stängs mot svaret; raden visar nya värdet.
    await expect(grupp.getByRole('button', { name: 'Ändra' })).toBeVisible();
    await expect(grupp.getByText('14', { exact: true })).toBeVisible();

    // Payloaden: eventId + sektionens TRE fält som absoluta värden, inga extra.
    expect(updateBody).toEqual({
      eventId: EVENT_ID,
      maxPlatser: 14,
      reserverade: 1,
      manuelltTillagda: 1,
    });

    // MERGE-BEVISET: räkningsraderna står kvar direkt efter Spara (utan mergen
    // hade Anmälda deltagare/Medföljande/Väntelista blinkat bort tills refetchen).
    const termer = await grupp.locator('dt').allTextContents();
    expect(termer).toContain('Anmälda deltagare');
    expect(termer).toContain('Väntelista');
    await expect(grupp.getByText('8', { exact: true })).toBeVisible();
  });

  test('fel-väg: update-event 500 → role=alert med fel, morfen förblir öppen', async ({ page }) => {
    await mockEvent(page, eventDetail());
    await page.route(UPDATE_EVENT, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-2' }),
      });
    });

    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();
    await grupp.getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('alert')).toContainText('Kunde inte spara');
    await expect(grupp.getByRole('button', { name: 'Spara' })).toBeVisible();
  });

  test('Avbryt: ändringar kastas; fokus tillbaka till Beläggningens Ändra-knapp', async ({
    page,
  }) => {
    await mockEvent(page, eventDetail());
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    await grupp.getByRole('button', { name: 'Ändra' }).click();
    await grupp.getByRole('textbox', { name: 'Max antal platser' }).fill('99');
    await grupp.getByRole('button', { name: 'Avbryt' }).click();

    // Visningsläget åter med OFÖRÄNDRAT värde; fokus-retur till gruppens Ändra.
    await expect(grupp.getByText('12', { exact: true })).toBeVisible();
    await expect(grupp.getByRole('button', { name: 'Ändra' })).toBeFocused();
  });

  test('stale cache utan beläggningsfält: räkningsrader 0, väntelistan ändå med, ingen krasch', async ({
    page,
  }) => {
    // Optional-fälten frånvarande (äldre EF-svar/get-events-cache-form).
    await mockEvent(
      page,
      eventDetail({
        reserverade: undefined,
        manuelltTillagda: undefined,
        viaFormular: undefined,
        medfoljande: undefined,
        vantelista: undefined,
      }),
    );
    await page.goto(`/event/${EVENT_ID}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const grupp = page.locator('section[aria-labelledby="grupp-belaggning"]');
    const termer = await grupp.locator('dt').allTextContents();
    // Rader med null-värde döljs (K6-normen); Anmälda deltagare + Väntelista
    // står ALLTID (K22) — med 0.
    expect(termer).toEqual(['Max antal platser', 'Anmälda deltagare', 'Väntelista']);
  });
});
