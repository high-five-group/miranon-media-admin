import AxeBuilder from '@axe-core/playwright';
import { expect, type Route, test } from '@playwright/test';

/**
 * Fas 6h L3 — Skicka-mail-på-segment-yta (compose-UI i SegmentBuilder, /mer/segment).
 * Lotta väljer ETT sparat segment, ser mottagar-antalet, skriver ämne + meddelande,
 * BEKRÄFTAR i en modal och skickar. Send är oåterkalleligt → pessimistiskt + bekräftat
 * + idempotent (ADR-067).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets testMatch-
 * kontrakt, ej staging-exklusivt). DETERMINISTISK via `page.route`-MOCK — den RIKTIGA
 * send-gränsen är L2d-staging-bevisad; här verifieras KLIENT-flödet + resultat-rendering,
 * INGEN riktig mail skickas. Fixtur-formerna speglar EF:ernas riktiga svar:
 *   get-events     → { events: EventSchema[] } (SegmentBuilder-taxonomi)
 *   get-segments   → { segments: SavedSegmentSchema[] } (compose-Select + sparade-listan)
 *   compute-segment→ { members, count } (mottagar-antal före send)
 *   send-email     → BulkSendStatus (MailSendResultSchema) — happy path 'sent'.
 */

const GET_EVENTS = /\/functions\/v1\/get-events/;
const GET_SEGMENTS = /\/functions\/v1\/get-segments/;
const COMPUTE_SEGMENT = /\/functions\/v1\/compute-segment/;
const SEND_EMAIL = /\/functions\/v1\/send-email/;

type EventRow = Record<string, unknown>;

/** En komplett Event-rad (EventSchema) — adaptern .parse():ar, så alla fält måste finnas. */
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
  id: 'recSAVED1',
  namn: 'FS-utbildningsdeltagare',
  rule: { include: [{ kurs: 'Fjärrskådning', modalitet: 'Utbildning' }], exclude: [] },
  definition: 'Med: deltog i Fjärrskådning (utbildning).',
};

/** En lyckad send (BulkSendStatus) — 3 sänt, inget undertryckt/avvisat. */
const SEND_SENT = {
  status: 'sent',
  requested: 3,
  suppressedConsent: 0,
  suppressedNoEmail: 0,
  deduped: 0,
  attempted: 3,
  accepted: 3,
  rejected: 0,
  rejections: [],
  logRecordId: 'recLOG1',
};

test.describe('Skicka mail på segment (Fas 6h L3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(GET_EVENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ events: TAXONOMY_EVENTS }),
      });
    });
    await page.route(GET_SEGMENTS, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ segments: [SAVED_SEGMENT] }),
      });
    });
    await page.route(COMPUTE_SEGMENT, async (route: Route) => {
      const members = Array.from({ length: 3 }, (_, i) => ({
        id: `recM${i}`,
        namn: `Person ${i}`,
        email: `person${i}@example.se`,
        ejGodkandMail: false,
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ members, count: 3 }),
      });
    });
  });

  test('happy path: välj segment → antal → komponera → bekräfta → skickat', async ({ page }) => {
    // Fånga send-email-anropet (verifiera body-kontraktet), svara 'sent'.
    let sentBody: Record<string, unknown> | null = null;
    await page.route(SEND_EMAIL, async (route: Route) => {
      sentBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEND_SENT),
      });
    });

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    // Compose-sektionen finns på segment-ytan.
    await expect(
      page.getByRole('heading', { level: 2, name: 'Skicka mail till ett segment' }),
    ).toBeVisible();

    // Välj det sparade segmentet → mottagar-antal hämtas (compute-segment) och visas FÖRE send.
    await page.getByRole('button', { name: 'Segment att skicka till' }).click();
    await page.getByRole('option', { name: 'FS-utbildningsdeltagare' }).click();
    await expect(page.getByText(/Det här segmentet har\s*3\s*personer/)).toBeVisible();

    // Komponera ämne + meddelande.
    await page.getByLabel('Ämne').fill('Höstens kurser');
    await page.getByLabel('Meddelande').fill('Hej! Här kommer höstens program.');

    // Granska och skicka → härdad bekräftelse-modal (oåterkalleligt) öppnas.
    await page.getByRole('button', { name: 'Granska och skicka…' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Granska och skicka utskick' })).toBeVisible();

    // GRANSKA: antal (fokalt) + segment + ämne + förhandsvisning av meddelandet.
    await expect(dialog.getByText(/Det här skickas till\s*3\s*personer/)).toBeVisible();
    await expect(dialog.getByText('FS-utbildningsdeltagare')).toBeVisible();
    await expect(dialog.getByText('Höstens kurser')).toBeVisible();
    await expect(dialog.getByText('Hej! Här kommer höstens program.')).toBeVisible();

    // SKRIV-FÖR-ATT-BEKRÄFTA: faro-knappen är LÅST tills mottagar-antalet skrivs.
    const sendBtn = dialog.getByRole('button', { name: 'Skicka till 3 personer' });
    await expect(sendBtn).toBeDisabled();

    // Fel antal → fortfarande låst.
    const confirmField = dialog.getByRole('textbox', { name: /Skriv antalet mottagare/ });
    await confirmField.fill('99');
    await expect(sendBtn).toBeDisabled();

    // Rätt antal → upplåst (aviseras i aria-live) → klick skickar (MOCKAT send).
    await confirmField.fill('3');
    await expect(dialog.getByText(/är nu upplåst/)).toBeVisible();
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    await expect(page.getByText('Utskicket skickades')).toBeVisible();
    await expect(page.getByText(/3 mottagare fick mailet/)).toBeVisible();

    // Body-kontrakt: segmentIds = sparade record-ID, ämne/mailtext, UUID-idempotensnyckel.
    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.segmentIds).toEqual(['recSAVED1']);
    expect(body.amne).toBe('Höstens kurser');
    expect(body.mailtext).toBe('Hej! Här kommer höstens program.');
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // A11y: hela det renderade compose-flödet (inkl. resultat) → 0 violations.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('0-mottagar-segment → Skicka client-blockerad + "Inga mottagare"-notis', async ({
    page,
  }) => {
    // 6h arch-audit-fix Del A: ett segment vars regel beräknar 0 medlemmar → ingen
    // round-trip. Override compute-segment till count=0 (sist registrerad vinner).
    await page.route(COMPUTE_SEGMENT, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ members: [], count: 0 }),
      });
    });
    // send-email MÅSTE aldrig anropas — fångar en ev. läckande sändning.
    let sendCalled = false;
    await page.route(SEND_EMAIL, async (route: Route) => {
      sendCalled = true;
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await page.getByRole('button', { name: 'Segment att skicka till' }).click();
    await page.getByRole('option', { name: 'FS-utbildningsdeltagare' }).click();

    // Tydlig notis + Skicka-knappen disabled (även ifyllt ämne/meddelande).
    await expect(page.getByText(/Det här segmentet har inga mottagare just nu/)).toBeVisible();
    await page.getByLabel('Ämne').fill('Test');
    await page.getByLabel('Meddelande').fill('Test');
    await expect(page.getByRole('button', { name: 'Granska och skicka…' })).toBeDisabled();
    expect(sendCalled, 'send-email får ej anropas vid 0 mottagare').toBe(false);
  });

  test('accepted===0 (alla undertryckta) → ärlig icke-success-rendering + breakdown', async ({
    page,
  }) => {
    // compute=3 (beforeEach) → användaren ser "3 personer" och kan skicka; servern
    // undertrycker alla (consent/e-post) → status 'skipped', accepted=0. UI:t får ALDRIG
    // visa grön "Utskicket skickades" — neutral "Inga mottagare fick mailet" + breakdown.
    await page.route(SEND_EMAIL, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
      });
    });

    await page.goto('/mer/segment');
    await expect(page.getByRole('heading', { level: 1, name: 'Bygg segment' })).toBeFocused();

    await page.getByRole('button', { name: 'Segment att skicka till' }).click();
    await page.getByRole('option', { name: 'FS-utbildningsdeltagare' }).click();
    await expect(page.getByText(/Det här segmentet har\s*3\s*personer/)).toBeVisible();
    await page.getByLabel('Ämne').fill('Höstens kurser');
    await page.getByLabel('Meddelande').fill('Hej!');
    await page.getByRole('button', { name: 'Granska och skicka…' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: /Skriv antalet mottagare/ }).fill('3');
    await dialog.getByRole('button', { name: 'Skicka till 3 personer' }).click();

    // Ärlig rendering: INGEN grön framgång; breakdown visar varför.
    await expect(page.getByText('Inga mottagare fick mailet')).toBeVisible();
    await expect(page.getByText(/2 togs bort \(har tackat nej/)).toBeVisible();
    await expect(page.getByText(/1 togs bort \(saknar e-post\)/)).toBeVisible();
    await expect(page.getByText('Utskicket skickades', { exact: true })).toHaveCount(0);
  });
});
