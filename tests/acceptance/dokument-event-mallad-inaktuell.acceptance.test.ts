import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { berakaAktuellKallhash } from '../../src/data/adapters/mallKallhash';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.6 — Dokumentlistan mot Event-mallade rader: Mall-badge,
 * INAKTUELL-markering och "Skapa om" (AC #4, ADR-125 § 3+5).
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR):
 * `DokumentYta.tsx` renderar rätt GIVET ett `get-event-attachments`-svar
 * med `mall`/`kallhash` satta och ett `get-document-sources`-svar vars
 * beräknade hash SKILJER SIG från raden kallhash — inte att staging
 * faktiskt returnerar den formen (det är
 * `tests/api/skapa-om-event-bilaga.staging.test.ts`s jobb, som bevisar
 * SAMMA härledning end-to-end mot RIKTIG data).
 *
 * HASHEN ÄR INTE HANDROLLAD: `berakaAktuellKallhash` (samma funktion
 * `AirtableAdapter.berikaMedInaktuell` anropar) körs HÄR, i testfilen, mot
 * en MOCKAD `DocumentSources` — så mock-datan och adapterns härledning
 * kan aldrig glida isär av misstag (ändras mall-hashfunktionen bryts detta
 * test, inte tyst).
 *
 * TÄCKNING:
 *   AC #4 — Mall-badge ("Bekräftelsebilaga") syns på en Event-mallad rad;
 *     INAKTUELL-badge syns när dagens hash ≠ radens Källhash; "Skapa om"
 *     anropar generate-event-attachment MED `ersatt` = radens ID, och
 *     raden blir AKTUELL (badgen försvinner) efter en lyckad regenerering
 *     — SAMMA rad, `attachment.id` oförändrat.
 *   AC #5 — axe 0 violations på listan i båda tillstånden (inaktuell +
 *     aktuell efter Skapa om).
 */

const ATTACHMENT_ID = 'recEventMalladBilaga1';

const MOCK_SOURCES: DocumentSources = {
  event: {
    id: VISUAL_EVENT_ID,
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Arboga',
    startdatum: '2026-10-31',
    slutdatum: '2026-11-01',
    eventlabel: 'Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31',
  },
  eventinnehall: { id: 'recEventinnehall1', namn: 'Resor i medvetandet 1 · Utbildning' },
  plats: { id: 'recPlats1', namn: 'Rönninge' },
  agenda: {
    dag1: { standard: [], kopia: null },
    dag2: { standard: [], kopia: null },
  },
  kopior: {
    tid: { standard: 'kl. 10:00 - 17:00', kopia: null },
    pris: { standard: '2.500', kopia: null },
    anmalningsavgift: { standard: '1000:-', kopia: null },
    resterandeBelopp: { standard: '1500:-', kopia: null },
    sistaBetalningsdag: { standard: '2026-10-17', kopia: null },
    beskrivning: { standard: 'En beskrivning av utbildningen.', kopia: null },
    forberedelser: { standard: null, kopia: null },
    tagMed: { standard: null, kopia: null },
    rokning: { standard: null, kopia: null },
    parfym: { standard: null, kopia: null },
    mat: { standard: null, kopia: null },
    overnattning: { standard: null, kopia: null },
    utrustning: { standard: null, kopia: null },
    adress: { standard: 'Uttringe Hages väg 17, Rönninge', kopia: null },
    parkering: { standard: null, kopia: null },
    transport: { standard: null, kopia: null },
    klader: { standard: null, kopia: null },
  },
};

function bilagaRad(kallhash: string) {
  return {
    id: ATTACHMENT_ID,
    namn: 'Bekräftelsebilaga – Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31.pdf',
    storlekBytes: 51_200,
    skapad: '2026-08-20T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Event-mallad',
    rackvidd: null,
    kursfamilj: null,
    kursniva: null,
    mall: 'Bekräftelsebilaga',
    kallhash,
  } as const;
}

/**
 * Mockar Dokument-ytan i eventläget med EN Event-mallad rad. `network.use`
 * körs INNAN `berakaAktuellKallhash` beräknats (async) — anroparen skickar
 * med den redan uträknade AKTUELLA hashen; handlern startar med en
 * STALE hash (garanterat != aktuell, se `STALE_HASH`) och blir aktuell
 * FÖRST efter en lyckad "Skapa om" (mutable `kallhash`, samma mönster som
 * `event-anteckningar.acceptance.test.ts` § mockSidan).
 */
function mockDokumentYta(
  network: NetworkFixture,
  aktuellHash: string,
): { ersattBody: () => unknown } {
  const STALE_HASH = '0'.repeat(64);
  let kallhash = STALE_HASH;
  let ersattBody: unknown = null;

  network.use(
    http.get(EF('get-document-sources'), () =>
      json(MOCK_SOURCES as unknown as Record<string, unknown>),
    ),
    http.get(EF('get-event-attachments'), () => json({ attachments: [bilagaRad(kallhash)] })),
    http.post(EF('generate-event-attachment'), async ({ request }) => {
      const body = (await request.json()) as { ersatt?: string };
      ersattBody = body;
      kallhash = aktuellHash; // "Skapa om" regenererar med DAGENS underlag → aktuell.
      return json({ attachment: bilagaRad(kallhash) });
    }),
  );

  return { ersattBody: () => ersattBody };
}

test.describe('Dokument-ytan — Event-mallade rader: Mall, INAKTUELL, Skapa om (TASK-309.6)', () => {
  test('Mall-badge + INAKTUELL syns; "Skapa om" anropar ersatt-läget och gör raden aktuell (samma rad)', async ({
    page,
    network,
  }) => {
    const aktuellHash = await berakaAktuellKallhash('bekraftelse', MOCK_SOURCES);
    const { ersattBody } = mockDokumentYta(network, aktuellHash);

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const rad = page.getByTestId('dokument-fil').filter({ hasText: 'Bekräftelsebilaga –' });
    await expect(rad).toBeVisible();
    await expect(rad.getByText('Bekräftelsebilaga', { exact: true })).toBeVisible();
    await expect(rad.getByText('Inaktuell')).toBeVisible();

    const skapaOmKnapp = rad.getByRole('button', { name: /Skapa om/ });
    await expect(skapaOmKnapp).toBeVisible();
    await skapaOmKnapp.click();

    // Efter lyckad regenerering: badgen försvinner, SAMMA rad (samma namn/id
    // — get-event-attachments-mocken speglar samma ATTACHMENT_ID oförändrat).
    await expect(rad.getByText('Inaktuell')).toHaveCount(0);
    await expect(rad).toBeVisible();

    expect(ersattBody()).toMatchObject({
      eventId: VISUAL_EVENT_ID,
      mall: 'bekraftelse',
      ersatt: ATTACHMENT_ID,
    });
  });

  test('AC #5: axe 0 violations — både med INAKTUELL synlig och efter Skapa om', async ({
    page,
    network,
  }) => {
    const aktuellHash = await berakaAktuellKallhash('bekraftelse', MOCK_SOURCES);
    mockDokumentYta(network, aktuellHash);

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByText('Inaktuell')).toBeVisible();

    const forstaGenomgangen = await new AxeBuilder({ page }).analyze();
    expect(forstaGenomgangen.violations).toEqual([]);

    await page.getByRole('button', { name: /Skapa om/ }).click();
    await expect(page.getByText('Inaktuell')).toHaveCount(0);

    const andraGenomgangen = await new AxeBuilder({ page }).analyze();
    expect(andraGenomgangen.violations).toEqual([]);
  });
});
