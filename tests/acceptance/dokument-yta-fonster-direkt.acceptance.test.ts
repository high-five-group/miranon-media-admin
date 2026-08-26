import { delay, HttpResponse, http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-309.26, review-runda 1, AC #4 — Dokument-ytans förhandsvisning
 * (`DokumentAtgardsKnappar`/`useForhandsvisaDokument.ts`) delar NU samma
 * laddningssida som Genereringsvyns "Förhandsgranska"/"Skapa"
 * (`dokument-generering-fonster-direkt.acceptance.test.ts`).
 *
 * BAKGRUND: reviewern påpekade att kvittoförhandsgranskningen (denna yta)
 * redan hade det popup-blockerar-säkra `window.open('', '_blank')`-
 * mönstret (TASK-273.4), men lämnade fönstret TOMT (`about:blank`) under
 * hela hämtningen — samma "abrupt tomt fönster"-defekt Marcus avvisade
 * 22 aug 2026 för genereringsvyn, bara aldrig påtalad för DENNA yta förrän
 * konsekvens-kravet (AC #4) synliggjorde den. Fixen: `skrivLaddningssida`
 * (`@/lib/skriv-laddningssida`, delad med `GenereringsVy.tsx`) anropas nu
 * direkt efter `window.open`, innan `forhandsvisaMutation.mutate(...)` —
 * se `DokumentYta.tsx`s IKONPAR-docblock och `useForhandsvisaDokument.ts`s
 * eget docblock för hela resonemanget.
 *
 * DENNA FIL RÖR ALDRIG FELVÄGEN (den befintliga `handle.document.write`-
 * felsidan i `useForhandsvisaDokument.ts` är oförändrad, redan bevisad via
 * sitt eget throwaway-pass, TASK-273.4 AC #1) — bara att den NYA,
 * FÖRVÄNTADE laddningssidan syns innan navigeringen.
 *
 * SCOPE: en enda, enkel klass A-rad (`dokumentklass: 'Uppladdad'`) — inga
 * Event-mallade rader, så `berikaMedInaktuell` (adaptern) aldrig anropar
 * `get-document-sources` (den grenen körs bara när minst en rad är
 * Event-mallad, se `AirtableAdapter.ts` § `berikaMedInaktuell`s
 * `bedombara`-filter) — enklast möjliga fixturvärld för just detta bevis.
 */

const ATTACHMENT_ID = 'recEnkelUppladdadFil1';
const FIL_NAMN = 'Deltagarlista.pdf';

function uppladdRad() {
  return {
    id: ATTACHMENT_ID,
    namn: FIL_NAMN,
    storlekBytes: 20_480,
    skapad: '2026-08-20T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Uppladdad',
    rackvidd: null,
    kursfamilj: null,
    kursniva: null,
    mall: null,
    kallhash: null,
  } as const;
}

/**
 * Samma teknik/motivering som
 * `dokument-generering-fonster-direkt.acceptance.test.ts`s `mockaLagradPdf`:
 * `text/plain`, INTE `application/pdf` — Chromes inbyggda PDF-visare
 * avbryter annars navigationens load-livscykel (mätt, samma fil). Testet
 * bevisar att fönstret NAVIGERAR till rätt URL, inte att en riktig PDF
 * renderas.
 */
function mockaLagradFil(url: string) {
  return http.get(
    url,
    () =>
      new HttpResponse('fejk-innehall-for-test', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
  );
}

test.describe('Dokument-ytan — förhandsvisningens fönster bär laddningssidan (TASK-309.26, AC #4)', () => {
  test('Öppna-knappen: fönstret öppnas direkt med "Öppnar dokument…", navigerar till den signerade URL:en när hämtningen är klar', async ({
    page,
    context,
    network,
  }) => {
    const SIGNERAD_URL = 'https://storage.example.test/deltagarlista.pdf';
    const SVARSFORDROJNING_MS = 4000;

    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [uppladdRad()] })),
      http.get(EF('get-attachment-download-url'), async ({ request }) => {
        const params = new URL(request.url).searchParams;
        expect(params.get('attachmentId')).toBe(ATTACHMENT_ID);
        await delay(SVARSFORDROJNING_MS);
        return json({ url: SIGNERAD_URL, expiresInSeconds: 300 });
      }),
      mockaLagradFil(SIGNERAD_URL),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByText(FIL_NAMN)).toBeVisible();

    const knapp = page.getByRole('button', { name: `Öppna ${FIL_NAMN}` });
    const [nyFlik] = await Promise.all([context.waitForEvent('page'), knapp.click()]);

    // Fönstret existerar DIREKT — INNAN get-attachment-download-url (4 s
    // fördröjd) svarar. URL:en är fortfarande about:blank (ingen
    // navigering ännu)...
    await expect.poll(() => nyFlik.url()).toBe('about:blank');
    // ...MEN INNEHÅLLET är INTE tomt: laddningssidan syns REDAN här.
    await expect(nyFlik).toHaveTitle('Öppnar dokument…');
    await expect(nyFlik.getByText('Öppnar dokument…')).toBeVisible();

    // Efter att hämtningen löst ut: SAMMA fönster navigerar till filen.
    await expect
      .poll(() => nyFlik.url(), { timeout: SVARSFORDROJNING_MS + 10_000 })
      .toBe(SIGNERAD_URL);
  });

  test('review-runda 2: EF-fel ERSÄTTER laddningssidan med felsidan — ingen stapling av "Öppnar dokument…" och felmeddelandet', async ({
    page,
    context,
    network,
  }) => {
    const SVARSFORDROJNING_MS = 1000;

    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [uppladdRad()] })),
      http.get(EF('get-attachment-download-url'), async () => {
        // Fördröjd (inte omedelbar) — ger testet ett fönster att observera
        // laddningssidan i INNAN felet skriver över den (samma disciplin
        // som `dokument-generering-fonster-direkt...`s AC #3-test).
        await delay(SVARSFORDROJNING_MS);
        return json({ error: 'Filen kunde inte hittas' }, 404);
      }),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const knapp = page.getByRole('button', { name: `Öppna ${FIL_NAMN}` });
    const [nyFlik] = await Promise.all([context.waitForEvent('page'), knapp.click()]);

    // Laddningssidan syns DIREKT.
    await expect(nyFlik).toHaveTitle('Öppnar dokument…');
    await expect(nyFlik.getByText('Öppnar dokument…')).toBeVisible();

    // Efter felet: felsidan ERSÄTTER (inte APPENDAS efter) laddningssidan —
    // det granskade felet (review-runda 2, severity ERROR, empiriskt
    // reproducerat i skarp Chromium via Playwright MCP). Utan
    // `document.close()`/den explicita `open()`+`close()`-fixen i
    // `useForhandsvisaDokument.ts`s catch-block hade BÅDA texterna synts
    // samtidigt.
    await expect(
      nyFlik.getByText('Kunde inte öppna dokumentet. Stäng fliken och försök igen.'),
    ).toBeVisible({ timeout: SVARSFORDROJNING_MS + 10_000 });
    await expect(nyFlik.getByText('Öppnar dokument…')).toHaveCount(0);

    // Appens egen felruta (befintligt beteende, oförändrat av denna fix).
    await expect(page.getByText('Kunde inte öppna filen')).toBeVisible();
  });

  test('review-runda 3: Lotta stänger fliken själv innan hämtningen svarar — inget rått fel, läsbar text i MessageBox', async ({
    page,
    context,
    network,
  }) => {
    const SIGNERAD_URL = 'https://storage.example.test/deltagarlista-stangd-flik.pdf';
    const SVARSFORDROJNING_MS = 1000;

    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [uppladdRad()] })),
      http.get(EF('get-attachment-download-url'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({ url: SIGNERAD_URL, expiresInSeconds: 300 });
      }),
    );

    const sidfel: Error[] = [];
    page.on('pageerror', (fel) => sidfel.push(fel));

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const knapp = page.getByRole('button', { name: `Öppna ${FIL_NAMN}` });
    const [nyFlik] = await Promise.all([context.waitForEvent('page'), knapp.click()]);
    await expect(nyFlik).toHaveTitle('Öppnar dokument…');

    // Lotta stänger fliken SJÄLV — INNAN get-attachment-download-url (1 s
    // fördröjd) svarar. `handle` i mutationFn är därefter icke-null men
    // `.closed`.
    await nyFlik.close();
    await expect.poll(() => nyFlik.isClosed()).toBe(true);

    // Mutationen ska INTE kasta ett rått, oformaterat webbläsarfel (t.ex.
    // "Failed to set the 'href' property on 'Location'") — den kastar ett
    // eget, Gunilla-läsbart fel som visas i appens befintliga MessageBox.
    await expect(
      page.getByText('Fönstret stängdes innan dokumentet hann öppnas. Tryck på Visa igen.'),
    ).toBeVisible({ timeout: SVARSFORDROJNING_MS + 10_000 });

    // Ingen JS-exception i appens sida.
    expect(sidfel).toEqual([]);
  });
});
