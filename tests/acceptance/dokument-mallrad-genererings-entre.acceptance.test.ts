import { http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.8, ADR-125 § 6 — `DokumentYta.tsx`s mallkatalog (`MallRad`) är
 * genereringsvyns ENTRÉ efter promoveringen. Prototypens egen listvy
 * (`ListaVy`, riven) hade samma sorts rad — men denna fil bevisar den
 * SKARPA, RIKTIGA raden: att "Skapa Bekräftelsebilaga"/"Skapa
 * Deltagarinformation" faktiskt navigerar in i `GenereringsVy` (inte bara
 * att ariaSnapshot-paret matchar OM man redan står i genereringsvyn — se
 * `dokument-generering-promoverings-grind.spec.ts` för den delen), och att
 * "Tillbaka till Dokument" tar Lotta hela vägen tillbaka till listan.
 *
 * ARBETET SOM GJORDES INTE ÄR ETT ARIASNAPSHOT-PAR (registrerat, avsiktligt
 * gap): `MallRad`s EGEN form (namn/täckning/knapp) ÄR ny mot den gamla,
 * generiska katalogposten (`ADR-125` § 6-kommentaren i `DokumentYta.tsx`)
 * — det finns inget "före" att jämföra den mot i den skarpa listan. Detta
 * test bevisar i stället att den NYA formen fungerar, inte att den är
 * identisk med något föregående.
 */

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

test.describe('Dokument-ytan — mallkatalogens entré in i genereringsvyn (TASK-309.8)', () => {
  test('"Skapa Bekräftelsebilaga" navigerar in i genereringsvyn och tillbaka igen', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.get(EF('get-event-attachments'), () => json({ attachments: [] })),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const skapaKnapp = page.getByRole('button', { name: 'Skapa Bekräftelsebilaga' });
    await expect(skapaKnapp).toBeVisible();
    await skapaKnapp.click();

    await expect(page.getByTestId('generering-vy')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Bekräftelsebilaga' })).toBeVisible();
    await expect(page).toHaveURL(/vy=generering/);
    await expect(page).toHaveURL(/mall=bekraftelse/);
    // Eventvalet ÄR delat mellan de två lägena (samma queryKey, ADR-125 § 6)
    // — navigeringen in i genereringsvyn tappar inte vilket event Lotta stod på.
    await expect(page).toHaveURL(new RegExp(`event=${VISUAL_EVENT_ID}`));

    await page.getByRole('button', { name: 'Tillbaka till Dokument' }).click();
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skapa Bekräftelsebilaga' })).toBeVisible();
  });

  test('"Skapa Deltagarinformation" navigerar in i genereringsvyn med rätt mall', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.get(EF('get-event-attachments'), () => json({ attachments: [] })),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    await page.getByRole('button', { name: 'Skapa Deltagarinformation' }).click();

    await expect(page.getByTestId('generering-vy')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Deltagarinformation' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/mall=deltagarinfo/);
  });
});
