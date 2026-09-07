import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { berakaAktuellKallhash } from '../../src/data/adapters/mallKallhash';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-431 — PROD-REGRESSION: långa bilagenamn klipps inte längre på
 * Bilagor-sidan (Mer → Bilagor). Marcus i prod 2026-09-07, verbatim: "Jag
 * gick in på RIM 1 i Rönninge 12-13 sep, där ligger en bekräftelsebilaga med
 * långt namn, och HELA namnet skrivs ut långt utanför själva kortet!!! Så var
 * det inte förut. Namnet måste ju klippas!!"
 *
 * ═══ ROTORSAK ═══
 *
 * `DokumentYta.tsx` (oförändrad sedan 2026-08-30) bygger klippningen på
 * `min-w-0` i varje flex-förfader — kolumnen, `Button`, och namn-spannet
 * (`min-w-0 truncate`). TASK-361 r2 (`Button.tsx`, PR #2212, 2026-09-02)
 * lade in ETT NYTT flex-item MELLAN knappen och namn-spannet: ett
 * `<span className="inline-flex items-center justify-center">` som bär
 * `children` ("ETIKETTEN ÄGER MÅTTET, ENSAM"). Det spannet saknade
 * `min-w-0`/`max-w-full` — ett flex-item har `min-width: auto` som default,
 * alltså kan det INTE krympa under sitt innehålls naturliga bredd. Kedjan
 * `kolumn → knapp → ??? → namn-span` bryts därför vid EXAKT detta led:
 * namn-spannets EGEN `min-w-0 truncate` är verkningslös, eftersom dess
 * FÖRÄLDER (etikett-spannet) redan vägrar krympa och tvingar hela knappen
 * (och därmed kortet, om `overflow` inte är dolt högre upp) att svälla.
 *
 * ═══ VAD DETTA TESTET BEVISAR ═══
 *
 * AC #1: boundingBox-mätning på EN UPPLADDAD bilaga (dokumentklass
 * 'Uppladdad', `mall: null` — så DEL B:s visningsnamn-regel inte stör denna
 * mätning) med ett namn längre än kortets bredd, på desktop OCH mobil
 * 390 px. FÖRE fixen (Button.tsx oförändrad): namn-spannets högerkant sticker
 * ut UTANFÖR kortets högerkant. EFTER fixen (`min-w-0 max-w-full` på
 * etikett-spannet): högerkanten ligger INNANFÖR kortet, OCH
 * `scrollWidth > clientWidth` på namn-spannet bevisar att `truncate` faktiskt
 * KLIPPER (inte bara "råkar få plats" av en annan anledning).
 *
 * Selektorn för namn-spannet går via `[title="<namn>"]` i stället för en ny
 * `data-testid` — `title`-attributet bär redan hela namnet (docblockets
 * "HELA NAMNET NÅS PÅ TVÅ VÄGAR"-regel) och är unikt per rad i denna
 * fixturvärld, så ingen produktionskod behöver ändras enbart för testbarhet.
 */

const LANGT_NAMN =
  'Bekräftelsebilaga – Arboga - Utbildning - Resor i medvetandet 1 - RIM 1 i Rönninge 12-13 september 2026, hela kursnamnet plus datum.pdf';

function uppladdRad() {
  return {
    id: 'recLangtNamnUppladdad1',
    namn: LANGT_NAMN,
    storlekBytes: 51_200,
    skapad: '2026-09-01T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Uppladdad',
    rackvidd: null,
    kursfamilj: null,
    kursniva: null,
    mall: null,
    kallhash: null,
  } as const;
}

function mockDokumentYta(network: NetworkFixture) {
  network.use(http.get(EF('get-event-attachments'), () => json({ attachments: [uppladdRad()] })));
}

/** Kortets `data-testid="dokument-fil"`-yttergräns och namn-spannets egen
 *  boundingBox, för en given viewport. Navigerar FÄRSKT per anrop så
 *  mätningen aldrig blandas mellan viewportstorlekar. */
async function mattFoerNamn(
  page: import('@playwright/test').Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('dokument-yta')).toBeVisible();

  const kort = page.getByTestId('dokument-fil').filter({ hasText: 'Bekräftelsebilaga' });
  await expect(kort).toBeVisible();
  const namnSpan = kort.locator(`[title="${LANGT_NAMN}"]`);
  await expect(namnSpan).toBeVisible();

  const kortBox = await kort.boundingBox();
  const namnBox = await namnSpan.boundingBox();
  if (!kortBox || !namnBox) {
    throw new Error('boundingBox saknas — kortet eller namn-spannet är osynligt/borttaget ur DOM');
  }
  const overflow = await namnSpan.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));

  return {
    kortHogerkant: kortBox.x + kortBox.width,
    namnHogerkant: namnBox.x + namnBox.width,
    ...overflow,
  };
}

test.describe('Dokument-ytan — långt bilagenamn klipps i stället för att rinna ut ur kortet (TASK-431)', () => {
  test('desktop (1280×800): namn-spannets högerkant ligger innanför kortets, och truncate klipper faktiskt (scrollWidth > clientWidth)', async ({
    page,
    network,
  }) => {
    mockDokumentYta(network);
    const matt = await mattFoerNamn(page, { width: 1280, height: 800 });

    // Toleransen (1 px) är sub-pixel-avrundning, samma marginal som repots
    // övriga boundingBox-jämförelser (t.ex. event-ny-anmalan.acceptance.test.ts).
    expect(matt.namnHogerkant).toBeLessThanOrEqual(matt.kortHogerkant + 1);
    expect(matt.scrollWidth).toBeGreaterThan(matt.clientWidth);
  });

  test('mobil (390×844): namn-spannets högerkant ligger innanför kortets, och truncate klipper faktiskt (scrollWidth > clientWidth)', async ({
    page,
    network,
  }) => {
    mockDokumentYta(network);
    const matt = await mattFoerNamn(page, { width: 390, height: 844 });

    expect(matt.namnHogerkant).toBeLessThanOrEqual(matt.kortHogerkant + 1);
    expect(matt.scrollWidth).toBeGreaterThan(matt.clientWidth);
  });
});

/**
 * DEL B — Marcus regel om visningsnamn (samma S123 resume 1-fynd, andra
 * hälften): *"Bekräftelsebilagans namn behöver inte ens skrivas ut på
 * kortet. På kortet kan det stå bara 'Bekräftelsebilaga'."*
 *
 * En Event-mallad rad (`current.mall !== null`) visar MALLNAMNET som
 * rubrik i stället för filnamnet — men filnamnet finns ändå kvar på TVÅ
 * vägar (`title`-attributet + knappens `aria-label`), och den gamla
 * mall-badgen (som upprepade `current.mall` en gång till) är borttagen som
 * ren dubblering. En UPPLADDAD rad (`mall === null`) är opåverkad: den
 * visar filnamnet precis som förut (bevisat av `describe`-blocket ovan).
 */
const MALL_NAMN = 'Bekräftelsebilaga';
const MALL_FILNAMN =
  'Bekräftelsebilaga – RIM 1 i Rönninge 12-13 september 2026, hela kursnamnet plus datum.pdf';

const MOCK_SOURCES: DocumentSources = {
  event: {
    id: VISUAL_EVENT_ID,
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Rönninge',
    startdatum: '2026-09-12',
    slutdatum: '2026-09-13',
    eventlabel: 'Rönninge - Utbildning - Resor i medvetandet 1 - 2026-09-12',
  },
  eventinnehall: { id: 'recEventinnehallDelB1', namn: 'Resor i medvetandet 1 · Utbildning' },
  plats: { id: 'recPlatsDelB1', namn: 'Rönninge' },
  agenda: {
    dag1: { standard: [], kopia: null },
    dag2: { standard: [], kopia: null },
  },
  kopior: {
    tid: { standard: 'kl. 10:00 - 17:00', kopia: null },
    pris: { standard: '2.500', kopia: null },
    anmalningsavgift: { standard: '1000:-', kopia: null },
    resterandeBelopp: { standard: '1500:-', kopia: null },
    sistaBetalningsdag: { standard: '2026-09-01', kopia: null },
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

function malladRad(kallhash: string) {
  return {
    id: 'recMalladBilagaDelB1',
    namn: MALL_FILNAMN,
    storlekBytes: 51_200,
    skapad: '2026-09-05T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Event-mallad',
    rackvidd: null,
    kursfamilj: null,
    kursniva: null,
    mall: MALL_NAMN,
    kallhash,
  } as const;
}

function mockMalladDokumentYta(network: NetworkFixture, aktuellHash: string) {
  network.use(
    http.get(EF('get-document-sources'), () =>
      json(MOCK_SOURCES as unknown as Record<string, unknown>),
    ),
    http.get(EF('get-event-attachments'), () => json({ attachments: [malladRad(aktuellHash)] })),
  );
}

test.describe('Dokument-ytan — mall-genererad rad visar mallnamnet, inte filnamnet (TASK-431, DEL B)', () => {
  test('rubriken är exakt mallnamnet; fullt filnamn kvar i title-attributet och aria-label; ingen dubblering', async ({
    page,
    network,
  }) => {
    const aktuellHash = await berakaAktuellKallhash('bekraftelse', MOCK_SOURCES);
    mockMalladDokumentYta(network, aktuellHash);

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const kort = page.getByTestId('dokument-fil').filter({ hasText: MALL_NAMN });
    await expect(kort).toBeVisible();

    // AC: rubriken är EXAKT mallnamnet — inte filnamnet, inte en trunkerad
    // variant av filnamnet.
    await expect(kort.getByText(MALL_NAMN, { exact: true })).toBeVisible();
    await expect(kort.getByText(MALL_FILNAMN)).toHaveCount(0);

    // Fullt filnamn kvar på BÅDA de dokumenterade vägarna.
    await expect(kort.locator(`[title="${MALL_FILNAMN}"]`)).toBeVisible();
    await expect(kort.getByRole('button', { name: `Öppna ${MALL_FILNAMN}` })).toBeVisible();

    // Ingen dubblering: den gamla mall-badgen (som upprepade "Bekräftelsebilaga"
    // en gång till bredvid rubriken) är borta — EXAKT en träff i hela raden.
    await expect(kort.getByText(MALL_NAMN, { exact: true })).toHaveCount(1);
  });

  test('en UPPLADDAD rad (mall === null) är opåverkad: rubriken är fortfarande filnamnet', async ({
    page,
    network,
  }) => {
    mockDokumentYta(network);
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const kort = page.getByTestId('dokument-fil').filter({ hasText: 'Bekräftelsebilaga' });
    await expect(kort.locator(`[title="${LANGT_NAMN}"]`)).toBeVisible();
    // Rubriktexten (namn-spannet) är fortfarande filnamnet, inte "null"
    // eller något annat placeholder-värde.
    await expect(kort.getByText(LANGT_NAMN)).toBeVisible();
  });
});
