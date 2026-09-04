import { delay, HttpResponse, http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * Patchar den lagrade sessionens `display_name` FÖRE app-boot (samma teknik
 * som `hem.acceptance.test.ts`s `patchStoredDisplayName`, TASK-220 — ingen
 * delad testhjälpare finns ännu, duplicerad med avsikt, samma litenhet).
 * Fixturvärldens session bär `display_name: 'Lotta'` som DEFAULT
 * (`tests/support/fixturvarld/hermetic.ts`), så BARA fallback-testet
 * (TASK-309.38 AC #1) behöver detta — `null` tar bort fältet helt.
 */
function patchStoredDisplayName(page: Page, displayName: string | null) {
  return page.addInitScript((name) => {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const session = JSON.parse(raw);
      if (!session?.user) continue;
      session.user.user_metadata = { ...session.user.user_metadata };
      if (name === null) delete session.user.user_metadata.display_name;
      else session.user.user_metadata.display_name = name;
      localStorage.setItem(key, JSON.stringify(session));
    }
  }, displayName);
}

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
 * `startaForhandsgranskning`/`skrivLaddningssida`-docblock för hela
 * resonemanget):
 *
 *   - 22 aug 2026: avvisade ett fönster som öppnas "helt abrupt" och tomt,
 *     med bara en anonym statusrad i ett hörn ("Va? Seriöst?").
 *   - 26 aug 2026, prod-röktest (S108 resume 11), ordagrant: *"Jag tryckte
 *     sedan på förhandsgranska och pdf:en skapades och när den va klar kom
 *     de grön inforuta upp […] Webbläsaren stoppade det nya fönstret. Öppna
 *     det härifrån i stället. […] Skarpt så måste ju ett chromefönster
 *     öppnas direkt."*
 *
 * TVÅ URSPRUNGLIGA DEFEKTER, samma ställe (`GenereringsVy.tsx`s dåvarande
 * `skapaDokument`, sedan TASK-340.2 delad i `startaForhandsgranskning` +
 * `startaSkapande` — se filens eget docblock för hela resonemanget och
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
 * (en flik som öppnas med en läsbar sida, en ruta utan prototyp-text, ett
 * fel som visas i stället för en tom flik) — aldrig att en handler
 * anropades eller hur.
 *
 * ── VAD TASK-340.2 ÄNDRADE I DENNA FIL ───────────────────────────────────
 *
 * Filen hette (och heter) "fönster-direkt" därför att TASK-309.26 gällde
 * BÅDA knapparna: både Förhandsgranska och Skapa öppnade ett fönster
 * synkront i klicket. Sedan TASK-340.2 gäller det bara den FÖRSTA.
 *
 * Skapa öppnar inget fönster alls längre — Marcus prod-röktest 2026-08-29
 * ("Detta känns så ologiskt och klumpigt byggt … Detta kan omöjligen vara
 * branschstandard") gällde precis det andra fönstret, och PRD `TASK-340`
 * § Implementationsbeslut river det: dokumentet SPARAS, och nästa steg är
 * Lottas val i en bekräftelse på plats. Två tester bytte därför skepnad:
 *
 *   · "Skapa (skarpt): samma popup-blockerar-säkra mönster" → ersatt av
 *     TASK-340.2 AC #1:s KONTRASTPAR (positiv kontroll på Förhandsgranska,
 *     negativt bevis på Skapa, i samma sida).
 *   · "review-runda 2: Lotta stänger fliken vid Skapa" → RIVET, med skälet
 *     skrivet på sin plats i filen nedan.
 *
 * Bekräftelseytans egen täckning (fokus, textvarianter, de två valen, axe,
 * tangentbord, annonseringar) bor i
 * `dokument-generering-bekraftelse.acceptance.test.ts`.
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

    const knapp = page.getByRole('button', { name: 'Förhandsgranska' });
    const [nyFlik] = await Promise.all([context.waitForEvent('page'), knapp.click()]);

    // Fönstret existerar DIREKT — INNAN mutationen (fördröjd
    // SVARSFORDROJNING_MS) hunnit svara. Beviset att öppningen skedde
    // synkront i klicket, inte efter ett asynkrt svar: URL:en är
    // fortfarande `about:blank` (ingen navigering till PDF:en ännu)...
    await expect.poll(() => nyFlik.url()).toBe('about:blank');
    // ...MEN INNEHÅLLET är INTE tomt (22 aug-domen, "helt abrupt"): en
    // document.write-skriven sida med titel + läsbar text syns REDAN här,
    // långt innan mutationen (4 s fördröjd) svarar.
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');
    await expect(
      nyFlik.getByText(
        'Ett ögonblick Lotta, förhandsgranskningen av bekräftelsebilagan skapas och visas här om några sekunder.',
      ),
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
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    expect(nyFlik.url()).toBe('about:blank');
    // Laddningssidan hann synas innan felet stängde fönstret — den öppnade
    // fliken var aldrig bara ett tomt `about:blank`, ens i felvägen.
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');

    await expect(page.getByText(/DocRaptor svarade inte i tid/)).toBeVisible();
    await expect.poll(() => nyFlik.isClosed()).toBe(true);
  });

  test('TASK-340.2 AC #1: Skapa öppnar INGET fönster, medan Förhandsgranska fortfarande gör det', async ({
    page,
    context,
    network,
  }) => {
    /*
     * KONTRASTPAR I SAMMA SIDA — samma disciplin som
     * `tabbar-personer-prefetch.acceptance.test.ts`s par, och samma bevisform
     * (`context.waitForEvent('page')`) som resten av denna fil. Skillnaden är
     * riktningen: för Förhandsgranska är eventet BEVISET, för Skapa är
     * UTEBLIVANDET beviset.
     *
     * VARFÖR ETT PAR OCH INTE TVÅ FRISTÅENDE TESTER: ett negativt bevis
     * ensamt är svagt — "ingen flik öppnades" är också vad man ser när
     * mekanismen som öppnar flikar är trasig, när klicket inte träffade,
     * eller när fixturen inte svarade. Att FÖRST se en flik öppnas i EXAKT
     * samma sida, med samma fixturvärld och samma klick-mekanik, gör
     * uteblivandet till en utsaga om SKAPA-grenen i stället för om
     * uppsättningen.
     *
     * Ordningen är också den enda möjliga: bekräftelsen ERSÄTTER formuläret,
     * så Förhandsgranska-knappen finns inte kvar efter ett lyckat Skapa.
     */
    const ATTACHMENT_ID = 'recNySkarpBilaga1';
    const PREVIEW_URL = 'https://storage.example.test/preview-innan-skapa.pdf';

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        if (body.preview === true) {
          return json({
            url: PREVIEW_URL,
            utgar: new Date(Date.now() + 300_000).toISOString(),
            kallhash: 'a'.repeat(64),
          });
        }
        return json({
          attachment: {
            id: ATTACHMENT_ID,
            namn: 'Bekräftelsebilaga – Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31.pdf',
            storlekBytes: 51_200,
            skapad: '2026-08-29T09:00:00.000Z',
            eventId: VISUAL_EVENT_ID,
            dokumentklass: 'Event-mallad',
            rackvidd: null,
            kursfamilj: null,
            kursniva: null,
            mall: 'Bekräftelsebilaga',
            kallhash: 'a'.repeat(64),
          },
          promoverad: true,
          underlagAndrat: false,
          ersatte: false,
        });
      }),
      /* INGEN `get-attachment-download-url`-överskuggning här, och det är en
         ÄNDRING (TASK-340.2 review-runda 2 → runda 4). Skapa slog tidigare upp
         filens nedladdnings-URL i samma andetag som den skapade raden; sedan
         den frysta URL:en revs (bekräftelsen lagrar `attachmentId` och
         signerar färskt per klick) görs det uppslaget inte längre — så
         handlern satt kvar som en DÖD registrering och fälldes av
         överskuggnings-vakten i CI (run 33249389118).

         Den är BORTTAGEN, inte märkt `medvetetOanvand`. Märkningen är till för
         en negativ sensor där frånvaron av anropet ÄR beviset; här är
         frånvaron redan MÄTT på ett starkare sätt, med en räknare, i
         `dokument-generering-bekraftelse.acceptance.test.ts` ("0 anrop vid
         Skapa"). En andra, svagare sensor i en fil som handlar om FÖNSTER
         hade varit brus. Samma skäl gäller `mockaLagradPdf`-handlern för
         nedladdnings-URL:en: ingen flik navigerar dit i detta test. */
      mockaLagradPdf(PREVIEW_URL),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    // POSITIV KONTROLL: förhandsgranskningen öppnar fortfarande sitt fönster
    // synkront i klicket (TASK-309.26:s form, orörd av TASK-340.2).
    const [forhandsFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    // INGEN titel-assertion här, med avsikt: preview-handlern svarar utan
    // fördröjning i detta test, så laddningssidan hinner ersättas av PDF:en
    // innan assertionen körs (mätt: `toHaveTitle` fick "" efter navigering).
    // Laddningssidans egen text är redan bevisad i filens FÖRSTA test, som
    // fördröjer svaret just för att kunna se den. Vad DETTA test behöver av
    // förhandsgranskningen är bara att ett fönster ÖPPNADES — eventet ovan —
    // och att det gick dit det skulle.
    await expect.poll(() => forhandsFlik.url(), { timeout: 10_000 }).toBe(PREVIEW_URL);

    // NEGATIVT BEVIS (AC #1): Skapa öppnar ingen flik alls. 3 s är långt över
    // den synkrona `window.open`-tick klicket hade behövt — hade anropet
    // funnits kvar skulle eventet ha firat omedelbart, precis som ovan.
    const nyFlikFirade = await Promise.all([
      context
        .waitForEvent('page', { timeout: 3000 })
        .then(() => true)
        .catch(() => false),
      page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click(),
    ]).then(([firade]) => firade);
    expect(nyFlikFirade).toBe(false);

    // Och det som HÄNDE i stället: bekräftelsen står på plats, i appens egen
    // sida. Ingen laddningssida finns kvar att skriva (den skrevs bara i det
    // fönster som inte längre öppnas).
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    await expect(page.getByText('Bekräftelsebilagan är sparad')).toBeVisible();
    await expect(context.pages()).toHaveLength(2); // appens sida + förhandsgranskningens flik
  });

  test('review-runda 1: Lotta stänger fliken själv medan EF:en arbetar — ingen exception, toast med fallback-knapp', async ({
    page,
    context,
    network,
  }) => {
    const PREVIEW_URL = 'https://storage.example.test/preview-bekraftelse-stangd-flik.pdf';

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({ url: PREVIEW_URL, utgar: new Date(Date.now() + 300_000).toISOString() });
      }),
      mockaLagradPdf(PREVIEW_URL),
    );

    const sidfel: Error[] = [];
    page.on('pageerror', (fel) => sidfel.push(fel));

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');

    // Lotta ångrar sig och stänger fliken SJÄLV — INNAN mutationen (4 s
    // fördröjd) svarar. `fonster` i appen är därefter icke-null men
    // `.closed`.
    await nyFlik.close();
    await expect.poll(() => nyFlik.isClosed()).toBe(true);

    // Mutationen löser ut ÄNDÅ (servern brydde sig inte om att fliken
    // stängdes) — `onSuccess` körs mot ett stängt fönster. Det får INTE
    // kasta ett fel i appens egen sida, och toasten ska INTE påstå att
    // dokumentet öppnades: `blockerad` blir `true`, fallback-knappen visas.
    await expect(
      page.getByText('Webbläsaren stoppade det nya fönstret.', { exact: false }),
    ).toBeVisible({
      timeout: SVARSFORDROJNING_MS + 10_000,
    });
    await expect(page.getByRole('button', { name: 'Öppna bekräftelsebilagan' })).toBeVisible();
    await expect(page.getByText('Den öppnades i ett nytt fönster.')).toHaveCount(0);

    // Ingen JS-exception i appens sida (samma `page`, inte den stängda fliken).
    expect(sidfel).toEqual([]);
  });

  /*
   * [RIVET, TASK-340.2] Här stod "review-runda 2: Lotta stänger fliken vid
   * Skapa (skarpt) — samma vakt, nu vittnad för BÅDA grenarna". Testet
   * bevisade att `onSuccess` inte kastar när Lotta hunnit stänga det fönster
   * SKAPA-grenen öppnat, och att rutan då visade fallback-knappen i stället
   * för att påstå att dokumentet öppnades.
   *
   * Den grenen öppnar inget fönster längre (AC #1 ovan), så det finns
   * strukturellt ingen flik att stänga och ingen `blockerad`-fallback att
   * falla tillbaka på. Att behålla testet hade krävt att vi först byggde
   * tillbaka defekten det vaktade.
   *
   * VAKTEN SJÄLV LEVER KVAR där den fortfarande gäller: runda 1-testet ovan
   * bevittnar exakt samma `fonster !== null && !fonster.closed`-kontroll i
   * FÖRHANDSGRANSKNINGENS gren, som är oförändrad.
   */

  test('TASK-309.38 AC #1: väntetexten bär rätt dokumentnamn för deltagarinformation också', async ({
    page,
    context,
    network,
  }) => {
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({
          url: 'https://storage.example.test/preview-deltagarinfo.pdf',
          utgar: new Date(Date.now() + 300_000).toISOString(),
        });
      }),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=deltagarinfo`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');
    // `MALL_META.deltagarinfo.namnBestamd` — EXPLICIT bestämd form
    // (TASK-309.38 review-runda 1), inte längre `${namn.toLowerCase()}n`
    // (som gav "deltagarinformationn", en dubbel-n-bugg — AC #4).
    await expect(
      nyFlik.getByText(
        'Ett ögonblick Lotta, förhandsgranskningen av deltagarinformationen skapas och visas här om några sekunder.',
      ),
    ).toBeVisible();
  });

  test('TASK-309.38 AC #1: väntetexten faller tillbaka till den anonyma formen utan visningsnamn', async ({
    page,
    context,
    network,
  }) => {
    await patchStoredDisplayName(page, null);

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({
          url: 'https://storage.example.test/preview-utan-namn.pdf',
          utgar: new Date(Date.now() + 300_000).toISOString(),
        });
      }),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');
    // Ingen `displayName` → "Ett ögonblick, " utan namn — inget hängande
    // komma, inget dubbelt mellanslag (AC #1).
    await expect(
      nyFlik.getByText(
        'Ett ögonblick, förhandsgranskningen av bekräftelsebilagan skapas och visas här om några sekunder.',
      ),
    ).toBeVisible();
  });

  test('TASK-309.38 AC #1: väntetexten faller tillbaka till den anonyma formen utan visningsnamn — deltagarinformation', async ({
    page,
    context,
    network,
  }) => {
    // Matrisens fjärde cell (INFO, review-runda 2): fallback-utan-namn var
    // tidigare bara bevisad för bekräftelsebilagan — AC #1 kräver BÅDA
    // dokumenttyperna, och det gäller korsprodukten (med/utan namn) ×
    // (bekräftelse/deltagarinfo), inte bara var axel för sig.
    await patchStoredDisplayName(page, null);

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(SVARSFORDROJNING_MS);
        return json({
          url: 'https://storage.example.test/preview-deltagarinfo-utan-namn.pdf',
          utgar: new Date(Date.now() + 300_000).toISOString(),
        });
      }),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=deltagarinfo`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');
    await expect(
      nyFlik.getByText(
        'Ett ögonblick, förhandsgranskningen av deltagarinformationen skapas och visas här om några sekunder.',
      ),
    ).toBeVisible();
  });
});
