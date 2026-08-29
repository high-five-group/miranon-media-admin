import { chromium } from '@playwright/test';
import { delay, HttpResponse, http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * AC #2:s ÄKTA POPUP-POLICY-BEVIS (TASK-309.26, S108 resume 13).
 *
 * ── VARFÖR DENNA FIL FINNS VID SIDAN AV DEN ANDRA ────────────────────────
 *
 * `dokument-generering-fonster-direkt.acceptance.test.ts` (PR #1996 + dess
 * tre review-rundor) bevisar SYNKRONITETEN: att fönstret finns, med sin
 * laddningssida, INNAN det fördröjda EF-svaret kommit. Det är den KAUSALA
 * egenskapen webbläsarens popup-skydd bryr sig om — men det är INTE samma
 * sak som effekten "blockeras inte", och den skillnaden ska sägas rakt ut i
 * stället för att antas. Skälet är MÄTT 2026-08-28, inte gissat:
 *
 *   PLAYWRIGHTS BUNDLADE CHROMIUM BLOCKERAR ALDRIG EN POPUP.
 *
 * `playwright-core`s egna `chromiumSwitches` (installerad 1.62.1,
 * `lib/coreBundle.js`) skickar `--disable-popup-blocking` vid VARJE
 * Chromium-launch. Men att ta bort flaggan räcker inte heller. Mätserien,
 * med `ignoreDefaultArgs: ['--disable-popup-blocking']` och flaggans
 * frånvaro verifierad i processens FAKTISKA kommandorad via `ps`:
 *
 *   | binär / läge                        | synkron | asynkron 3/6/10 s | utan gest |
 *   |-------------------------------------|---------|-------------------|-----------|
 *   | Chromium, Playwright-default        | öppnad  | öppnad            | öppnad    |
 *   | Chromium, UTAN flaggan              | öppnad  | öppnad            | ÖPPNAD    |
 *   | Google Chrome, Playwright-default   | öppnad  | öppnad            |     —     |
 *   | Google Chrome, UTAN flaggan         | öppnad  | BLOCKERAD         |     —     |
 *
 * Rad 2 är den avgörande: Playwrights Chromium öppnade en popup även HELT
 * UTAN användargest (ett `window.open` i en `setTimeout` vid sidladdning,
 * och ett rakt ur `page.evaluate`). Popup-blockeraren är alltså strukturellt
 * frånvarande i den binären, inte bara avstängd av en flagga. Ett test som
 * körs där kan därför inte skilja dagens (synkrona) kod från den gamla
 * (asynkrona) som Marcus fick blockerad i skarp drift 2026-08-26 — det hade
 * passerat för båda, och därmed inte bevisat AC #2:s "utan popup-blockering".
 *
 * DÄRFÖR KÖR DENNA FIL MOT RIKTIG GOOGLE CHROME med popup-blockeraren
 * PÅSLAGEN, och bevisar kontrasten i BÅDA riktningar i samma browser, samma
 * kontext, samma sida:
 *
 *   LED 1 (positivt)  appens Förhandsgranska-knapp öppnar sitt fönster trots
 *                     att EF-svaret dröjer POPUP_FORDROJNING_MS.
 *   LED 2 (negativt)  en knapp injicerad i SAMMA sida, som gör exakt det
 *                     GAMLA mönstret (`await` först, `window.open` sedan),
 *                     får `null` tillbaka.
 *
 * LED 2 ÄR INTE DEKORATION. Utan den vore led 1 värdelöst: det är den
 * negativa kontrollen som bevisar att blockeraren faktiskt var PÅ under led
 * 1. Ett grönt led 1 ensamt är precis den falska trygghet den andra filen
 * (utan egen förskyllan) råkade ge.
 *
 * ── VARFÖR FÖRDRÖJNINGEN ÄR 6 s OCH INTE 4 s ─────────────────────────────
 *
 * MDN (`Window.open()` § transient activation, `UserActivation`): ett
 * `window.open`-anrop kräver TRANSIENT activation, som förfaller ett kort
 * fönster efter användargesten (Chrome: ~5 s). Under det taket släpps även
 * ett asynkront anrop igenom — då bevisar led 2 ingenting. 6 s ligger över
 * taket med marginal, vilket mätserien ovan bekräftar (BLOCKERAD vid både
 * 6 s och 12 s, ÖPPNAD vid 3 s).
 *
 * Det förklarar också hur den mätning som stod i `GenereringsVy.tsx` fram
 * till 26 aug ("Chrome tillåter `window.open` även efter flera sekunders
 * väntan") kunde se rätt ut och ändå vara fel: den mätte under taket, och
 * DocRaptor-renderingen i Marcus prod-röktest tog längre.
 *
 * ── SKIP-VILLKORET ÄR EN MILJÖSANNING, INTE EN TYSTNING ──────────────────
 *
 * `channel: 'chrome'` kräver en INSTALLERAD Google Chrome — en annan binär
 * än Playwrights egen Chromium, och den enda som har en popup-blockerare att
 * mäta mot. Saknas den skippas filen MED SKÄL i stället för att fälla på
 * något som inte är appens fel. Vill man göra detta till en hård CI-grind
 * räcker `npx playwright install chrome` i workflowen — det är ett
 * CI-beslut, medvetet inte taget här (flaggat i kortets Implementation
 * Notes).
 *
 * MOCK_SOURCES ÄR DUPLICERAD, inte importerad: en `.test.ts` som importeras
 * av en annan `.test.ts` skulle registrera sina describe-block i den
 * importerande filens körning. Duplicering av fixturen är klassens
 * etablerade konvention (samma form i `dokument-event-mallad-inaktuell`,
 * `dokument-mallrad-genererings-entre`, `dokument-genereringsvy-optimistisk-
 * sparning`). Filen har dessutom EGEN launchOptions, vilket Playwright bara
 * tillåter top-level i en fil — aldrig i ett `describe`-block ("Cannot
 * use({ launchOptions }) in a describe group, because it forces a new
 * worker", mätt) — så en egen fil var påtvingad, inte vald.
 */

test.use({
  channel: 'chrome',
  launchOptions: { ignoreDefaultArgs: ['--disable-popup-blocking'] },
});

/** Över Chromes transient-activation-tak (~5 s) med marginal — se docblocket. */
const POPUP_FORDROJNING_MS = 6000;

/**
 * Samma skäl som i systerfilen: destinationen måste ha en egen handler
 * (hermetik-vakten fäller varje omockat anrop), och den svarar `text/plain`
 * i stället för `application/pdf` för att inte väcka Chromes PDF-visare, som
 * avbryter den vanliga load-livscykeln.
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

let chromeFinns = false;

test.beforeAll(async () => {
  // Proben startar sin EGEN browser (inte testfixturens) just för att
  // frånvaron ska kunna upptäckas UTAN att en fixtur redan kastat.
  try {
    const b = await chromium.launch({ channel: 'chrome' });
    await b.close();
    chromeFinns = true;
  } catch {
    chromeFinns = false;
  }
});

test.beforeEach(() => {
  // Anropas FÖRE `page`/`context` begärs, så ingen browser startas i onödan
  // när Chrome saknas.
  test.skip(
    !chromeFinns,
    'Google Chrome (channel: chrome) är inte installerad. AC #2:s popup-policy-bevis kräver den binären — Playwrights egen Chromium blockerar aldrig popups, se filens docblock.',
  );
});

test.describe('AC #2: äkta popup-policy i riktig Chrome (TASK-309.26)', () => {
  test('appens synkrona öppning passerar popup-skyddet, och det gamla asynkrona mönstret blockeras i samma sida', async ({
    page,
    context,
    network,
  }) => {
    const PREVIEW_URL = 'https://storage.example.test/preview-popup-policy.pdf';

    network.use(
      http.get(EF('get-document-sources'), () =>
        json(MOCK_SOURCES as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay(POPUP_FORDROJNING_MS);
        return json({ url: PREVIEW_URL, utgar: new Date(Date.now() + 300_000).toISOString() });
      }),
      mockaLagradPdf(PREVIEW_URL),
    );

    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=bekraftelse`);
    await expect(page.getByTestId('generering-vy')).toBeVisible();

    // ── LED 1 (positivt): appens egen knapp, äkta popup-policy påslagen ──
    const [nyFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(nyFlik).toHaveTitle('Skapar förhandsgranskningen…');
    await expect
      .poll(() => nyFlik.url(), { timeout: POPUP_FORDROJNING_MS + 10_000 })
      .toBe(PREVIEW_URL);
    // Fallback-vägen syns INTE: fönstret öppnades på riktigt. (Att
    // fallback-knappen FINNS när den behövs bevisas av systerfilens
    // stängda-flik-tester, som framkallar den.)
    await expect(page.getByText('Den öppnades i ett nytt fönster.')).toBeVisible();

    // ── LED 2 (negativ kontroll): var blockeraren ens på? ──
    // FÖRST: stäng den öppnade fliken och lyft fram appens egen igen.
    // Detta är INTE kosmetik. `nyFlik` har fokus efter led 1, vilket gör
    // appens sida till en BAKGRUNDSFLIK — och Chrome strypar timers i
    // bakgrundsflikar, så den 6 s-timer led 2 hänger på drar långt över sin
    // tid under parallell last (mätt: testet passerade ensamt men fällde
    // med `undefined`, alltså "handlern hann aldrig köra", i full svit).
    // Stängningen påverkar inte vad som mäts: en öppen respektive stängd
    // flik gav båda BLOCKERAD i förmätningen.
    await nyFlik.close();
    await page.bringToFront();
    // Samma sida, samma kontext, samma gest-semantik — men det GAMLA
    // mönstret: `await` först, `window.open` efteråt. Detta är formen Marcus
    // fick blockerad i prod 2026-08-26.
    await page.evaluate((ms) => {
      const knapp = document.createElement('button');
      knapp.id = 'popup-negativ-kontroll';
      knapp.textContent = 'negativ kontroll';
      knapp.addEventListener('click', async () => {
        await new Promise((r) => setTimeout(r, ms));
        const w = window.open('', '_blank');
        (window as unknown as Record<string, unknown>).__popupNegativKontroll =
          w === null ? 'BLOCKERAD' : 'OPPNAD';
        // Avläst i SAMMA ögonblick som `window.open` — se § FÄLLAN nedan.
        (window as unknown as Record<string, unknown>).__popupAktivVidOpen =
          navigator.userActivation.isActive;
      });
      document.body.appendChild(knapp);
    }, POPUP_FORDROJNING_MS);

    await page.locator('#popup-negativ-kontroll').click();

    // TYST VÄNTAN — ALDRIG `expect.poll` HÄR. Detta är inte en stilfråga
    // utan skillnaden mellan ett giltigt och ett meningslöst mått; se
    // filens § FÄLLAN nedanför testet.
    // Marginalen (+8 s) är tilltagen med avsikt: den enda väntan som är
    // giltig här är en TYST, och en tyst väntan kan inte anpassa sig efter
    // last. Hellre några sekunder för mycket än ett mått som inte mäter.
    await page.waitForTimeout(POPUP_FORDROJNING_MS + 8000);

    const utfall = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__popupNegativKontroll,
    );
    // `undefined` betyder att klick-handlern aldrig hann köra klart — ett
    // TIMING-fel, inte ett popup-fynd. Skilj dem åt, annars läses en
    // långsam maskin som ett bevis.
    expect(utfall, 'klick-handlern hann inte köra klart — höj marginalen').toBeDefined();
    const aktivVidOpen = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__popupAktivVidOpen,
    );

    // Båda assertionerna behövs. Den första är fyndet; den andra är dess
    // FÖRKLARING, och fäller om fällan nedan smyger sig tillbaka: skulle en
    // framtida ändring återinföra pollning under väntan blir `isActive`
    // sant, och DÅ säger ett "OPPNAD" ingenting om popup-skyddet.
    expect(utfall).toBe('BLOCKERAD');
    expect(aktivVidOpen).toBe(false);
  });
});

/**
 * ── FÄLLAN: `page.evaluate` FÖRNYAR SIDANS TRANSIENT USER ACTIVATION ─────
 *
 * MÄTT 2026-08-28, i exakt denna konfiguration (riktig Chrome, popup-
 * blockeraren på, samma 6 s fördröjning), med `navigator.userActivation.
 * isActive` avläst i samma ögonblick som `window.open` anropades:
 *
 *   | väntan under de 6 sekunderna              | utfall    | isActive |
 *   |-------------------------------------------|-----------|----------|
 *   | `page.waitForTimeout` (tyst)              | BLOCKERAD | false    |
 *   | `page.evaluate` var 100:e ms (= poll)     | ÖPPNAD    | **true** |
 *
 * Varje `page.evaluate` räknas alltså som en användargest och STARTAR OM
 * transient activation-fönstret. Ett `expect.poll(() => page.evaluate(…))`
 * — husets normala, och annars helt riktiga, sätt att vänta på ett värde —
 * håller därmed popup-tillståndet vid liv under hela sin egen väntan, och
 * den negativa kontrollen öppnar sitt fönster i stället för att blockeras.
 *
 * DET ÄR EN TYST FÄLLA, inte ett synligt fel: testet blir GRÖNT på fel
 * grund (eller, som här, rött med en förvirrande orsak), och en poll som
 * skrivs in "för robusthetens skull" tar bort precis det mätvärde filen
 * finns för. Första versionen av detta test gick i fällan — den mätte att
 * en popup öppnades och trodde att den mätte popup-policyn.
 *
 * REGELN: mät aldrig popup-blockering med en väntan som rör sidan. Tyst
 * `waitForTimeout`, sedan EN avläsning. Det gäller bara den NEGATIVA
 * kontrollen — led 1 ovan pollar fritt, eftersom dess `window.open` redan
 * har skett synkront i klicket innan pollningen börjar.
 */
