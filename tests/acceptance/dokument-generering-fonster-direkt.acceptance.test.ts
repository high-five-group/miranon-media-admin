import { delay, HttpResponse, http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Den signerade PDF-URL:en är INTE en Edge Function — det är den faktiska
 * destinationen fönstret navigerar till (`ADR-124`: en signerad Storage-URL,
 * aldrig en `blob:`). Hermetik-vakten (`hermetik-vakt.ts`) fäller varje
 * omockat anrop i fixturvärlden, så den måste ha sin EGEN handler, precis
 * som EF-anropen ovanför — annars blockeras webbläsarens egen navigering dit.
 *
 * SVARAR MED `text/plain`, INTE `application/pdf` (mätt, TASK-309.26): Chromes
 * inbyggda PDF-visare tar över en `application/pdf`-navigering (en egen
 * MimeHandlerView), vilket avbryter den vanliga load-livscykeln
 * (`net::ERR_ABORTED; maybe frame was detached?`) och lämnar `page.url()` kvar
 * på `about:blank` — ett Playwright/Chromium-beteende hos PDF-VISAREN, inte
 * hos appkoden detta test bevisar. Testet bevisar att fönstret NAVIGERAR till
 * rätt URL, inte att en riktig PDF renderas (det är EF-svitens jobb, se
 * `preview-receipt.staging.test.ts`/`generate-event-attachment.staging.test.ts`)
 * — `text/plain` ger samma navigerings-bevis utan att trigga PDF-visaren.
 */
function mockaLagradPdf(url: string) {
  return http.get(
    url,
    () =>
      new HttpResponse('fejk-innehall-for-test', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
  );
}

/**
 * TASK-309.26 — förhandsgranskningens PDF-fönster öppnas DIREKT, popup-
 * blockerar-säkert, OCH bär en läsbar sida i stället för att stå tomt
 * (Marcus TVÅ doms, båda löses av samma ändring — se `GenereringsVy.tsx`s
 * `skapaDokument`/`skrivLaddningssida`-docblock för hela resonemanget):
 *
 *   - 22 aug 2026: avvisade ett fönster som öppnas "helt abrupt" och tomt,
 *     med bara en anonym statusrad i ett hörn ("Va? Seriöst?").
 *   - 26 aug 2026, prod-röktest (S108 resume 11), ordagrant: *"Jag tryckte
 *     sedan på förhandsgranska och pdf:en skapades och när den va klar kom
 *     de grön inforuta upp […] Webbläsaren stoppade det nya fönstret. Öppna
 *     det härifrån i stället. […] Skarpt så måste ju ett chromefönster
 *     öppnas direkt."*
 *
 * TVÅ URSPRUNGLIGA DEFEKTER, samma ställe (`GenereringsVy.tsx`s
 * `skapaDokument` — se filens eget docblock för hela resonemanget och
 * källorna):
 *
 *   1. `window.open` anropades EFTER mutationens `onSuccess`, utanför
 *      klickets synkrona user-activation-fönster — webbläsarens popup-
 *      skydd stoppar ett sådant anrop så fort svaret dröjer (mätt i skarp
 *      drift; branschmönstret + `DokumentYta.tsx`s redan bevisade motpart,
 *      `useForhandsvisaDokument.ts`, TASK-273.4 AC #1).
 *   2. Toasten bar en prototyp-kvarleva, "(Prototyp: ingen PDF sparas.)",
 *      kvar i den PROMOVERADE, skarpa ytan (ADR-103 B2 steg 4 kräver att
 *      sådana rivs).
 *
 * BEVISFORM (AC #2): `context.waitForEvent('page')` racead mot klicket
 * (`Promise.all`) — samma disciplin som
 * `tabbar-personer-prefetch.acceptance.test.ts`s kontrastpar. EF-svaret
 * fördröjs `SVARSFORDROJNING_MS` (långt över varje assert-budget i denna
 * fil): fönstret måste alltså existera REDAN innan svaret kommer, annars
 * hinner testet aldrig se det inom sin egen väntan. Fönstrets URL är
 * `about:blank` direkt efter klicket (INNAN svaret hunnit komma) — men dess
 * INNEHÅLL är INTE tomt: en `document.write`-skriven sida med titel + en
 * läsbar text syns direkt (22 aug-domen), och SAMMA fönster navigerar till
 * PDF-URL:en FÖRST när mutationen löser ut (26 aug-domen).
 *
 * AC #3 (negativ kontroll): en EF som svarar 400 lämnar INGEN tom flik
 * kvar — `stangOanvantFonster` stänger den, felet visas i appens egen
 * `MessageBox` (husets mönster, inte en tom flik utan förklaring).
 *
 * AC #1 + #4 verifieras i samma pass: ingen "Prototyp"-text i toasten, och
 * samma öppningsmekanism (`window.open('', '_blank')` synkront, adress
 * satt efteråt) som `DokumentYta.tsx`s kvittoförhandsgranskning redan
 * använder.
 *
 * DENNA FIL BEVISAR EXTERNT BETEENDE (samma disciplin som resten av
 * klassen, `acceptance-bas.ts` § VAD KLASSEN BEVISAR): vad Lotta SER
 * (en flik som öppnas med en läsbar sida, en toast utan prototyp-text, ett
 * fel som visas i stället för en tom flik) — aldrig att en handler
 * anropades eller hur.
 */

const SVARSFORDROJNING_MS = 4000;

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

test.describe('Genereringsvyn — förhandsgranskningens fönster öppnas direkt (TASK-309.26)', () => {
  test('AC #2/#1/#4: fönstret öppnas SYNKRONT vid klick och navigerar till PDF:en när mutationen löser ut; ingen prototyp-text', async ({
    page,
    context,
    network,
  }) => {
    const PREVIEW_URL = 'https://storage.example.test/preview-bekraftelse.pdf';

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({
          eventId: VISUAL_EVENT_ID,
          mall: 'bekraftelse',
          preview: true,
        });
        await delay(SVARSFORDROJNING_MS);
        return json({ url: PREVIEW_URL, utgar: new Date(Date.now() + 300_000).toISOString() });
      }),
      mockaLagradPdf(PREVIEW_URL),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const knapp = page.getByRole('button', { name: 'Förhandsgranska först' });
    const [nyFlik] = await Promise.all([context.waitForEvent('page'), knapp.click()]);

    // Fönstret existerar DIREKT — INNAN mutationen (fördröjd
    // SVARSFORDROJNING_MS) hunnit svara. Beviset att öppningen skedde
    // synkront i klicket, inte efter ett asynkrt svar: URL:en är
    // fortfarande `about:blank` (ingen navigering till PDF:en ännu)...
    await expect.poll(() => nyFlik.url()).toBe('about:blank');
    // ...MEN INNEHÅLLET är INTE tomt (22 aug-domen, "helt abrupt"): en
    // document.write-skriven sida med titel + läsbar text syns REDAN här,
    // långt innan mutationen (4 s fördröjd) svarar.
    await expect(nyFlik).toHaveTitle('Skapar dokument…');
    await expect(
      nyFlik.getByText('Skapar förhandsgranskningen. Sidan byter till PDF:en när den är klar.'),
    ).toBeVisible();

    // Efter att mutationen löst ut: SAMMA fönster navigerar till PDF:en —
    // ingen ny flik, ingen omdirigering av appens egen sida. Poll på `.url()`
    // i stället för `waitForURL`/`load`-eventet: Chromes inbyggda PDF-visare
    // tar över navigeringen (`application/pdf`) och kan avbryta den vanliga
    // load-livscykeln (`net::ERR_ABORTED`, mätt) — men frames `.url()`
    // uppdateras oavsett så fort navigeringen COMMIT:ats.
    await expect
      .poll(() => nyFlik.url(), { timeout: SVARSFORDROJNING_MS + 10_000 })
      .toBe(PREVIEW_URL);
    expect(page.url()).toContain('vy=generering');

    // AC #1 — ingen prototyp-kvarleva; en sann, Gunilla-begriplig text i stället.
    await expect(page.getByText('Prototyp', { exact: false })).toHaveCount(0);
    await expect(
      page.getByText('Förhandsgranskningen sparas inte. Tryck Skapa för att spara bilagan.'),
    ).toBeVisible();
    // `blockerad` var false (fönstret öppnades) — samma besked som förut.
    await expect(page.getByText('Den öppnades i ett nytt fönster.')).toBeVisible();
  });

  test('AC #3: EF-fel stänger det öppnade fönstret i stället för att lämna en tom flik kvar', async ({
    page,
    context,
    network,
  }) => {
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        // Fördröjd (inte omedelbar): ger testet ett fönster att observera
        // laddningssidan i INNAN felet stänger den — ett omedelbart fel
        // racear annars mot document.write-anropet (samma mutate-anrop
        // gör båda i samma tick).
        await delay(1000);
        return json({ error: 'DocRaptor svarade inte i tid' }, 400);
      }),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska först' }).click(),
    ]);
    expect(nyFlik.url()).toBe('about:blank');
    // Laddningssidan hann synas innan felet stängde fönstret — den öppnade
    // fliken var aldrig bara ett tomt `about:blank`, ens i felvägen.
    await expect(nyFlik).toHaveTitle('Skapar dokument…');

    await expect(page.getByText(/DocRaptor svarade inte i tid/)).toBeVisible();
    await expect.poll(() => nyFlik.isClosed()).toBe(true);
  });

  test('Skapa (skarpt): samma popup-blockerar-säkra mönster som Förhandsgranska', async ({
    page,
    context,
    network,
  }) => {
    const ATTACHMENT_ID = 'recNySkarpBilaga1';
    const NEDLADDNINGS_URL = 'https://storage.example.test/bekraftelsebilaga.pdf';

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({
          attachment: {
            id: ATTACHMENT_ID,
            namn: 'Bekräftelsebilaga – Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31.pdf',
            storlekBytes: 51_200,
            skapad: '2026-08-26T09:00:00.000Z',
            eventId: VISUAL_EVENT_ID,
            dokumentklass: 'Event-mallad',
            rackvidd: null,
            kursfamilj: null,
            kursniva: null,
            mall: 'Bekräftelsebilaga',
            kallhash: 'a'.repeat(64),
          },
        });
      }),
      http.get(EF('get-attachment-download-url'), () =>
        json({ url: NEDLADDNINGS_URL, expiresInSeconds: 300 }),
      ),
      mockaLagradPdf(NEDLADDNINGS_URL),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click(),
    ]);

    await expect.poll(() => nyFlik.url()).toBe('about:blank');
    await expect(nyFlik).toHaveTitle('Skapar dokument…');
    await expect(
      nyFlik.getByText('Skapar bekräftelsebilagan. Sidan byter till PDF:en när den är klar.'),
    ).toBeVisible();
    // Se motiveringen ovan i första testet: poll på `.url()`, inte `waitForURL`
    // — Chromes PDF-visare stör load-eventet för en `application/pdf`-navigering.
    await expect
      .poll(() => nyFlik.url(), { timeout: SVARSFORDROJNING_MS + 10_000 })
      .toBe(NEDLADDNINGS_URL);

    await expect(
      page.getByText(`Bekräftelsebilagan är skapad och ligger nu bland eventets dokument`, {
        exact: false,
      }),
    ).toBeVisible();
  });
});
