import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6h L3 — Skicka-mail-på-segment-yta (compose-UI i SegmentBuilder, /mer/segment).
 * Lotta väljer ETT sparat segment, ser mottagar-antalet, skriver ämne + meddelande,
 * BEKRÄFTAR i en modal och skickar. Send är oåterkalleligt → pessimistiskt + bekräftat
 * + idempotent (ADR-067).
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 6
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * INGEN RIKTIG MAIL SKICKAS, OCH DET ÄR HELA POÄNGEN MED KLASSNINGEN.
 * `send-email` är muterande, men anropet är avlyssnat av fixturvärlden: det som
 * bevisas här är PAYLOADEN appen skickar (segmentIds, ämne, mailtext,
 * UUID-idempotensnyckel) plus hur gränssnittet reagerar på svaret — låst
 * faro-knapp, skriv-för-att-bekräfta-grinden, ärlig icke-success-rendering.
 * SKRIVBEVISET LIGGER KVAR I API-SVITEN (`tests/api/send-email.staging.test.ts`,
 * L2d-staging-bevisad) och ska inte flyttas hit; flyttades det vore klassningen
 * fel.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstren byggs med `EF(namn)`
 * ur handlers-modulen och svaren med `json(...)` — en handskriven sträng som inte
 * matchar faller igenom UTAN att något fälls (den tysta fällan, `hermetic.ts`
 * § Överskugga en delad handler).
 *
 * `send-email`, `compute-segment` och `get-segments` ligger AVSIKTLIGT INTE i
 * normalläget: en delad skrivväg hade gjort tyst lyckat utskick till default för
 * hela klassen. De överskuggas per test, och ett test som skickar utan
 * överskuggning fälls av hermetik-vakten med adressen namngiven.
 *
 * Fixtur-formerna speglar EF:ernas riktiga svar:
 *   get-events     → { events: EventSchema[] } (SegmentBuilder-taxonomi)
 *   get-segments   → { segments: SavedSegmentSchema[] } (compose-Select + sparade-listan)
 *   compute-segment→ { members, count } (mottagar-antal före send)
 *   send-email     → BulkSendStatus (MailSendResultSchema) — happy path 'sent'.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type EventRow = z.infer<typeof EventSchema>;

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

  test('happy path: välj segment → antal → komponera → bekräfta → skickat', async ({
    page,
    network,
  }) => {
    // Fånga send-email-anropet (verifiera body-kontraktet), svara 'sent'.
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json(SEND_SENT);
      }),
    );

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

    // Grön-knapp-regeln (task-18.16): utskicket NÅR UTOMSTÅENDE → success
    // (#606B57), aldrig danger — skyddet mot oåterkalleligheten bärs av
    // skriv-för-att-bekräfta-grinden, inte av rött (Bekräfta alla-precedenten).
    await expect(sendBtn).toHaveCSS('background-color', 'rgb(96, 107, 87)');
    await expect(sendBtn).toHaveCSS('color', 'rgb(255, 255, 255)');

    // Fel antal → fortfarande låst.
    const confirmField = dialog.getByRole('textbox', { name: /Skriv antalet mottagare/ });
    await confirmField.fill('99');
    await expect(sendBtn).toBeDisabled();

    // Rätt antal → upplåst (aviseras i aria-live) → klick skickar (AVLYSSNAT send).
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
    network,
  }) => {
    // 6h arch-audit-fix Del A: ett segment vars regel beräknar 0 medlemmar → ingen
    // round-trip. Överskugga compute-segment till count=0 (prepend → vinner över
    // beforeEach-handlern).
    //
    // Flaggan mäter APPENS beteende — att 0 mottagare INTE utlöser ett utskick —
    // inte att en handler anropades; klassen testar aldrig fixturen. Den är
    // nödvändig här eftersom ett uteblivet utskick saknar varje annan observerbar
    // effekt: vyn ser likadan ut vare sig anropet gick iväg eller ej.
    let sendCalled = false;
    network.use(
      http.post(EF('compute-segment'), () => json({ members: [], count: 0 })),
      medvetetOanvand(
        http.post(EF('send-email'), () => {
          sendCalled = true;
          return json({});
        }),
        'Negativ sensor: att send-email ALDRIG anropas är testets resultat, så handlern ska förbli oanvänd. Matchar den fälls testet på inaktuell märkning — vilket är rätt, för då har appen börjat skicka vid 0 mottagare.',
      ),
    );

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
    network,
  }) => {
    // compute=3 (beforeEach) → användaren ser "3 personer" och kan skicka; servern
    // undertrycker alla (consent/e-post) → status 'skipped', accepted=0. UI:t får ALDRIG
    // visa grön "Utskicket skickades" — neutral "Inga mottagare fick mailet" + breakdown.
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
    );

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
