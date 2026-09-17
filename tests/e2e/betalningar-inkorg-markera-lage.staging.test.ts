import AxeBuilder from '@axe-core/playwright';
import type { Locator } from '@playwright/test';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockTomNarvaro } from './helpers/tom-narvaro';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockTommaInbetalningar } from './helpers/tomma-betalningar';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-402.1 — MARKERA-LÄGET I BETALNINGSINKORGEN.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SAMMA SKARV SOM INKORGENS UTSKICKSFLÖDES-TEST, AV SAMMA SKÄL
 * ═══════════════════════════════════════════════════════════════════════════
 * PRD TASK-402 § Testbeslut punkt 2 och kortets AC #6 pekar båda på
 * `betalningar-inkorg-utskicksflode.staging.test.ts`s skarv, och skälet står i
 * den filens eget huvud: `VITE_FEATURE_BETALNINGAR` är explicit `'av'` för
 * HELA den delade acceptance/visual/webblasarbeteende-fixturvärlden
 * (`playwright.config.ts`), så `/mer/betalningar` kan strukturellt inte
 * renderas där. Staging bär `VITE_FEATURE_BETALNINGAR=pa` (`.env.staging`) och
 * `chromium-authenticated` kör mot en verklig inloggad session.
 *
 * DETERMINISTISK VIA `page.route`, ALDRIG `network.use()`: ingen delad
 * staging-data rörs. `get-events`, `hamta-oppna-betalningar`,
 * `registrera-inbetalning`, `hamta-jobbstatus`, `get-event` och
 * `get-registrations` mockas alla lokalt.
 *
 * EGEN FIL OCH INTE EN PÅBYGGNAD AV UTSKICKSFLÖDET: den filen är 863 rader om
 * EN sak (kvittots väg genom kön), och markera-läget är en annan sak med en
 * annan fixtur — två event, en klar rad och en eventdetalj att jämföra mot.
 * "Samma skarv" i AC #6 är testKLASSEN (staging-e2e mot inkorgen med mockade
 * svarsvägar), inte samma filnamn.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SVITEN BEVISAR
 * ═══════════════════════════════════════════════════════════════════════════
 *   AC #1  Formen är eventdetaljens — mätt som en STRUKTUR-JÄMFÖRELSE av
 *          åtgärdsraden mellan de två ytorna i samma körning (se
 *          `atgardsradsSignatur`), plus kryss-affordansen och Esc.
 *   AC #2  Markeringen överlever sök OCH filter; räknaren visar rätt tal när
 *          varje markerad rad är bortfiltrerad.
 *   AC #3  En klar rad bär inget kryss ens när sökningen lyfter fram den.
 *   AC #4  "Registrera N" navigerar med `ids`; tillbaka-pilen återvänder med
 *          markeringen kvar.
 *   AC #5  Minnet rensas av Rensa, av en registrering i steget, och av
 *          navigation utanför betalningsfamiljen.
 *   AC #6  axe-svep utan fel över den markerade listan.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';
const HAMTA_JOBBSTATUS = '**/functions/v1/hamta-jobbstatus*';
const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';

const EVENT_A = 'rec402p1EventAlfa';
const EVENT_B = 'rec402p1EventBeta';
/** Eventdetaljen som AC #1:s DOM-jämförelse läser förlagan ur. */
const EVENT_FORLAGA = 'rec402p1Forlagan';

const ALFA_1 = 'rec402p1AlfaEttt';
const ALFA_2 = 'rec402p1AlfaTvaa';
const BETA_1 = 'rec402p1BetaEttt';
/** Fullbetald rad — bär AC #3. `saknas`/`kvar` blir 0 ⇒ `InkorgsRad.klar`. */
const ALFA_KLAR = 'rec402p1AlfaKlar';

type Json = Record<string, unknown>;

function oppenBetalning(over: Json): Json {
  return {
    anmalanRecordId: ALFA_1,
    personNamn: 'Alva Alfasson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_A,
    eventNamn: 'Alfakursen',
    eventStartdatum: '2099-06-01',
    eventTyp: 'Kurs',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 2500,
    gallandePris: 2500,
    anmalningsavgift: 1000,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    ...over,
  };
}

/** Tre öppna rader över två event, plus en klar rad i event A. */
const RADER: Json[] = [
  oppenBetalning({}),
  oppenBetalning({ anmalanRecordId: ALFA_2, personNamn: 'Assar Alfasson' }),
  oppenBetalning({
    anmalanRecordId: BETA_1,
    personNamn: 'Bodil Betasson',
    eventId: EVENT_B,
    eventNamn: 'Betakursen',
    eventTyp: 'Utbildning',
    eventStartdatum: '2099-07-01',
  }),
  oppenBetalning({
    anmalanRecordId: ALFA_KLAR,
    personNamn: 'Klara Klarsson',
    saknas: 0,
    summaInbetalt: 2500,
    summaInbetaltSpegel: 2500,
  }),
];

/** Eventdetaljens fixtur — minsta mängd som ger ett register med kort och
    därmed en batch-bar att jämföra mot (`event-deltagare.staging.test.ts`s
    `eventDetail`/`registrering`, nedskuret till det denna svit läser). */
function forlageEvent(): Json {
  return {
    id: EVENT_FORLAGA,
    eventlabel: 'Skövde – Utbildning – Förlagan',
    eventNamn: 'Förlagan',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2099-06-01',
    slutdatum: '2099-06-02',
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 2,
    platserKvar: 10,
    anmaldBelaggning: 0.17,
    bekraftadBelaggning: 0.0,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 2,
    status: 'Planerat',
    eventKey: 'Event-402p1',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 2,
    medfoljande: 0,
    vantelista: 0,
  };
}

function forlageRegistrering(id: string, namn: string): Json {
  return {
    id,
    namn,
    fornamn: null,
    efternamn: null,
    email: null,
    telefon: null,
    eventNamn: 'Förlagan',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-07-01T09:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_FORLAGA,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: null,
  };
}

type Mockar = { registreringsAnrop: string[] };

/**
 * Mockar BÅDA ytorna i samma kontext: inkorgens läsväg och eventdetaljens.
 * De rör olika Edge Functions, så en enda `mocka()` räcker för hela sviten och
 * DOM-jämförelsen kan göras utan att byta testkontext.
 */
async function mocka(page: Page, rader: Json[] = RADER): Promise<Mockar> {
  const tillstand: Mockar = { registreringsAnrop: [] };

  /* TYPEN SÄTTS EXPLICIT — `valjarRad` hårdkodar `typ: 'Utbildning'` för
     ALLA rader, och inkorgens typ-/ort-axlar läser EVENTET, aldrig
     betalningen (`BetalningsInkorg.tsx` § "DIMENSIONERNA ÄR EVENTETS FÄLT").
     Utan överstyrningen blir varje rad "Utbildning" och filtret matchar bort
     ingenting — mätt: filterbyte-testet såg "Visar 4 av 4" med Typ satt. */
  await mockValjarLista(page, [
    { ...valjarRad({ id: EVENT_A, namn: 'Alfakursen', startdatum: '2099-06-01' }), typ: 'Kurs' },
    {
      ...valjarRad({
        id: EVENT_B,
        namn: 'Betakursen',
        startdatum: '2099-07-01',
        ort: 'Göteborg',
      }),
      typ: 'Utbildning',
    },
  ]);
  await mockTommaAnteckningar(page);
  // TASK-416.16: eventsidan (förlagan, `EVENT_FORLAGA`) prefetchar nu
  // get-attendance ovillkorligt (sidmount + Check-in-hover) — se
  // helpers/tom-narvaro.ts.
  await mockTomNarvaro(page);
  // TASK-442: eventsidan förvärmer nu inbetalnings-batchen vid sidmontering
  // (belopps-mocken finns redan ovan) — se helpers/tomma-betalningar.ts.
  await mockTommaInbetalningar(page);

  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: rader, forfallna: 0 }),
    });
  });

  await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
    const body = route.request().postDataJSON() as { anmalanRecordId: string };
    tillstand.registreringsAnrop.push(body.anmalanRecordId);
    const nu = new Date().toISOString();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        inbetalning: {
          id: `c0ffee00-0001-4001-8001-${String(tillstand.registreringsAnrop.length).padStart(12, '0')}`,
          anmalanRecordId: body.anmalanRecordId,
          ogonblicksbildNamn: 'Alva Alfasson',
          ogonblicksbildEvent: 'Alfakursen',
          ogonblicksbildEventdatum: '2099-06-01',
          belopp: 1000,
          betalsatt: 'Swish',
          betalningsdatum: nu.slice(0, 10),
          typ: 'inbetalning',
          status: 'aktiv',
          makuleradSkal: null,
          makuleradNar: null,
          bankreferens: null,
          kvittoId: null,
          notering: null,
          skapadAv: 'staging-user@miranon.test',
          skapadNar: nu,
        },
        harledning: {
          summa: 1000,
          gallandePris: 2500,
          saknas: 1500,
          avgiftKlar: true,
          alltKlart: false,
          arForelasning: false,
        },
        spegel: { skrivet: true, forsok: 1, skal: null },
      }),
    });
  });

  await page.route(HAMTA_JOBBSTATUS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobb: null,
        rader: [],
        sammanfattning: { totalt: 0, skickade: 0, fel: 0, kvar: 0 },
      }),
    });
  });

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: forlageEvent() }),
    });
  });

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        registrations: [
          forlageRegistrering('recForlagaEtt', 'Frida Förlaga'),
          forlageRegistrering('recForlagaTva', 'Folke Förlaga'),
        ],
      }),
    });
  });

  return tillstand;
}

const BATCHBAR = '[data-testid="markering-batchbar"]';
const LIVE = '[data-testid="markering-live"]';

/**
 * AC #1:S MÄTINSTRUMENT — åtgärdsradens STRUKTUR, läst ur renderad DOM.
 *
 * Vad som ingår är valt av vad AC #1 räknar upp: knapparnas ANTAL, ORDNING och
 * TAGGNAMN, vilka av dem som är avstängda, om var och en bär ett tillgängligt
 * namn, och live-regionens roll/`aria-live`/`aria-atomic`/`sr-only`.
 *
 * Vad som medvetet INTE ingår: knapptexterna. De två ytorna säger olika ord om
 * samma sak, och båda avvikelserna är bokförda i `BetalningsInkorg.tsx`
 * § TVÅ AVSIKTLIGA AVSTEG (eventsidan navigerar till Åtgärder, inkorgen till
 * bekräftelsesteget; inkorgen har sök och filter och därför "alla synliga";
 * räknaren kan inte säga "av M" när M är antalet synliga). Att jämföra
 * TEXTERNA hade alltså mätt kortets egna AC som ett fel. Texterna prövas
 * i stället var för sig i sviterna nedan, mot AC:ns exakta ordalydelse.
 */
async function atgardsradsSignatur(rad: Locator): Promise<Json> {
  return rad.evaluate((rad) => {
    const barn = [...rad.children];
    return {
      barnTaggar: barn.map((b) => b.tagName),
      knappar: barn
        .filter((b) => b.tagName === 'BUTTON')
        .map((b, i) => ({
          position: i,
          avstangd: b.hasAttribute('disabled') || b.getAttribute('aria-disabled') === 'true',
          harNamn: (b.getAttribute('aria-label') ?? b.textContent ?? '').trim().length > 0,
        })),
      live: (() => {
        const l = rad.querySelector('[data-testid="markering-live"]');
        if (!l) return null;
        return {
          tagg: l.tagName,
          role: l.getAttribute('role'),
          ariaLive: l.getAttribute('aria-live'),
          ariaAtomic: l.getAttribute('aria-atomic'),
          srOnly: l.className.split(/\s+/).includes('sr-only'),
        };
      })(),
    };
  });
}

/** Deltagar-gruppen på eventsidan — förlagans batch-bar bor i den. */
function forlagansGrupp(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/** Inkorgens kortlista (både gruppvyn och sökläget bär `<ul>` med korten). */
function inkorgensKryss(page: Page) {
  return page.getByTestId('markerbart-betalningskort');
}

async function oppnaInkorgen(page: Page): Promise<void> {
  await page.goto('/mer/betalningar');
  await expect(page.getByRole('heading', { level: 1, name: 'Betalningar' })).toBeVisible({
    timeout: 15_000,
  });
}

async function slaPaMarkeraLaget(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Markera betalningar' }).click();
  await expect(page.locator(LIVE)).toBeAttached();
}

/**
 * TASK-410 — Marcus prod-fynd (S121 resume 4): ihopfälld som förut lät
 * Markera-knappen stå ensam på egen rad, vilket "ser konstigt ut". Utfälld
 * som default löser det utan att röra togglingen (tratten stänger/öppnar
 * fortfarande som förut).
 */
test.describe('TASK-410 — filterraden utfälld som default (AC #1)', () => {
  test('filterpanelen är synlig direkt vid besök, utan klick på tratt-knappen', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);

    // Utfälld ⇒ sr-only-namnet säger "Dölj filter" och panelen är synlig
    // UTAN att någon tryckt på tratten.
    await expect(page.getByRole('button', { name: /^Dölj filter/ })).toBeVisible();
    await expect(page.getByTestId('filter-panel')).toBeVisible();
    await expect(page.getByTestId('filter-typ')).toBeVisible();

    // Dölj filter fungerar som förut — togglingen är oförändrad, bara
    // start-läget flyttades.
    await page.getByRole('button', { name: /^Dölj filter/ }).click();
    await expect(page.getByRole('button', { name: /^Visa filter/ })).toBeVisible();
    await expect(page.getByTestId('filter-panel')).toBeHidden();
  });
});

test.describe('TASK-402.1 — markera-lägets form (AC #1)', () => {
  test('åtgärdsradens STRUKTUR är identisk med eventdetaljens batch-bar, mätt i DOM', async ({
    page,
  }) => {
    await mocka(page);

    // FÖRLAGAN först, så jämförelsen aldrig kan råka läsa inkorgens egen
    // signatur två gånger.
    await page.goto(`/event/${EVENT_FORLAGA}`);
    await expect(
      forlagansGrupp(page).getByRole('heading', { name: 'Anmälda deltagare' }),
    ).toBeVisible({ timeout: 15_000 });
    await forlagansGrupp(page).getByRole('button', { name: 'Markera anmälningar' }).click();
    // Markera en rad så "Rensa" (som bara renderas vid antal > 0) finns i
    // BÅDA signaturerna — annars hade jämförelsen tystnat om just den knappen.
    await forlagansGrupp(page).getByTestId('markerbart-kort').first().click();
    await expect(forlagansGrupp(page).locator(LIVE)).toContainText('1 av 2 markerade');
    const forlagan = await atgardsradsSignatur(forlagansGrupp(page).locator(BATCHBAR));

    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);
    await inkorgensKryss(page).first().click();
    await expect(page.locator(LIVE)).toHaveText('1 markerade');
    const inkorgen = await atgardsradsSignatur(page.locator(BATCHBAR));

    // FYRA KNAPPAR I SAMMA ORDNING (Markera/Avbryt · primärhandlingen ·
    // "alla" · Rensa) plus live-regionen sist, och samma avstängnings- och
    // namn-form per position.
    expect(inkorgen).toEqual(forlagan);
    expect(inkorgen.barnTaggar).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON', 'SPAN']);
  });

  test('etiketterna är kortets: Markera · Registrera N · Markera alla synliga · Rensa', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);

    const rad = page.locator(BATCHBAR);
    // AV-LÄGET: enbart Markera-knappen, geometrin ändå på plats.
    await expect(rad.getByRole('button')).toHaveText(['Markera']);

    await slaPaMarkeraLaget(page);
    // "Rensa" saknas vid noll markerade — förlagans `aktivt && antal > 0`.
    await expect(rad.getByRole('button')).toHaveText([
      'Avbryt',
      'Registrera 0',
      'Markera alla synliga',
    ]);
    await expect(rad.getByRole('button', { name: 'Registrera 0' })).toBeDisabled();

    await inkorgensKryss(page).first().click();
    await expect(rad.getByRole('button')).toHaveText([
      'Avbryt',
      'Registrera 1',
      'Markera alla synliga',
      'Rensa',
    ]);
    await expect(rad.getByRole('button', { name: 'Registrera 1' })).toBeEnabled();
  });

  test('kryss-affordansen finns ENBART i läget, och ett tryck på raden bockar', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);

    // Negativ kontroll, förlagans egen form: noll kryssrutor före läget.
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Registrera betalning' })).toHaveCount(3);

    await slaPaMarkeraLaget(page);
    // Tre ÖPPNA rader får kryss; den klara raden ligger i "Klara"-fällningen
    // och har aldrig något (AC #3).
    await expect(inkorgensKryss(page)).toHaveCount(3);
    // I läget bockar ett tryck i stället för att öppna radformuläret —
    // "Registrera betalning" finns inte kvar att trycka på.
    await expect(page.getByRole('button', { name: 'Registrera betalning' })).toHaveCount(0);

    const alva = inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' });
    await expect(alva).not.toBeChecked();
    await alva.click();
    await expect(alva).toBeChecked();
    await expect(page.getByRole('form', { name: /Registrera betalning för/ })).toHaveCount(0);
  });

  test('Esc avbryter läget och lämnar fokus på Markera-knappen', async ({ page }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);
    await expect(inkorgensKryss(page)).toHaveCount(3);

    await page.keyboard.press('Escape');

    await expect(inkorgensKryss(page)).toHaveCount(0);
    const markera = page.getByRole('button', { name: 'Markera betalningar' });
    await expect(markera).toBeVisible();
    await expect(markera).toBeFocused();
  });
});

test.describe('TASK-402.1 — markeringen över sök och filter (AC #2, #3)', () => {
  test('markeringen överlever SÖK, och räknaren visar rätt tal när raden är bortfiltrerad', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await inkorgensKryss(page).filter({ hasText: 'Assar Alfasson' }).click();
    await expect(page.locator(LIVE)).toHaveText('2 markerade');

    // Sök fram BARA Bodil — båda de markerade raderna försvinner ur vyn.
    await page.getByRole('searchbox', { name: 'Sök på namn, telefon eller belopp' }).fill('Bodil');
    await expect(inkorgensKryss(page)).toHaveCount(1);
    await expect(inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' })).toHaveCount(0);

    // AC #2:s kärna: talet står kvar, i BÅDA bärarna.
    await expect(page.locator(LIVE)).toHaveText('2 markerade');
    await expect(page.getByRole('button', { name: 'Registrera 2' })).toBeVisible();

    // Och den kommer tillbaka intakt när sökningen tas bort.
    await page.getByRole('searchbox', { name: 'Sök på namn, telefon eller belopp' }).fill('');
    await expect(inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' })).toBeChecked();
    await expect(inkorgensKryss(page).filter({ hasText: 'Assar Alfasson' })).toBeChecked();
  });

  test('markeringen överlever ett FILTERBYTE, och "Markera alla synliga" är en union', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await expect(page.locator(LIVE)).toHaveText('1 markerade');

    // Filtrera på Typ = Utbildning ⇒ bara Betakursens rad syns.
    // Filterraden är UTFÄLLD SOM DEFAULT sedan TASK-410 (Marcus prod-fynd
    // S121) — ingen "Visa filter"-klick behövs längre för att nå panelen.
    await page.getByTestId('filter-typ').getByRole('button').click();
    await page.getByRole('option', { name: 'Utbildning' }).click();
    await expect(inkorgensKryss(page)).toHaveCount(1);
    await expect(page.locator(LIVE)).toHaveText('1 markerade');

    // UNIONEN: "Markera alla synliga" lägger till Bodil UTAN att radera Alva
    // (`markeraAllaSynliga`, api-pure-testets "UNION, INTE ERSÄTTNING").
    await page.getByRole('button', { name: 'Markera alla synliga' }).click();
    await expect(page.locator(LIVE)).toHaveText('2 markerade');
    await expect(page.getByRole('button', { name: 'Markera alla synliga' })).toBeDisabled();

    // Tillbaka till hela listan: båda är fortfarande i.
    await page.getByRole('button', { name: 'Rensa filter' }).click();
    await expect(inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' })).toBeChecked();
    await expect(inkorgensKryss(page).filter({ hasText: 'Bodil Betasson' })).toBeChecked();
    await expect(inkorgensKryss(page).filter({ hasText: 'Assar Alfasson' })).not.toBeChecked();
  });

  test('AC #3: en KLAR rad bär inget kryss ens när sökningen lyfter fram den', async ({ page }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    // Sökläget blandar klara och öppna rader (`rankaTraffar`), till skillnad
    // från gruppvyn där `grupperaPerEvent` redan delat upp dem. Det är den
    // enda vy där AC #3 kan brytas, och därför den vy som mäts.
    await page.getByRole('searchbox', { name: 'Sök på namn, telefon eller belopp' }).fill('Klar');
    await expect(page.getByText('1 träff')).toBeVisible();
    await expect(page.getByText('Klara Klarsson')).toBeVisible();

    await expect(inkorgensKryss(page)).toHaveCount(0);
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    // Inert i läget: raden bär heller ingen primärknapp — se kortets
    // § MARKERA-LÄGETS TRE KORTFORMER.
    await expect(page.getByRole('button', { name: 'Registrera betalning' })).toHaveCount(0);
  });
});

test.describe('TASK-402.1 — Registrera N och tillbaka-pilen (AC #4)', () => {
  test('"Registrera N" öppnar steget med de markerades ids; tillbaka-pilen behåller markeringen', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await inkorgensKryss(page).filter({ hasText: 'Bodil Betasson' }).click();
    await page.getByRole('button', { name: 'Registrera 2' }).click();

    await expect(page).toHaveURL(/\/mer\/betalningar\/registrera\?ids=/);
    // ORDNINGEN ÄR RADERNAS (EF-svarets), inte bock-ordningens.
    const url = new URL(page.url());
    expect(url.searchParams.get('ids')).toBe(`${ALFA_1},${BETA_1}`);
    await expect(page.getByTestId('bekraftelsesteget')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('2 av 2 inbetalningar markerade')).toBeVisible();

    // TILLBAKA-PILEN: historik-tillbaka, och markeringen står kvar.
    await page.getByRole('button', { name: 'Tillbaka' }).click();
    await expect(page).toHaveURL(/\/mer\/betalningar$/);
    await expect(page.locator(LIVE)).toHaveText('2 markerade');
    await expect(inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' })).toBeChecked();
    await expect(inkorgensKryss(page).filter({ hasText: 'Bodil Betasson' })).toBeChecked();
    await expect(inkorgensKryss(page).filter({ hasText: 'Assar Alfasson' })).not.toBeChecked();
  });
});

test.describe('TASK-402.1 — markeringsminnets tre rensningstillfällen (AC #5)', () => {
  test('Rensa tömmer urvalet men lämnar läget på', async ({ page }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await expect(page.locator(LIVE)).toHaveText('1 markerade');

    await page.getByRole('button', { name: 'Rensa', exact: true }).click();

    await expect(page.locator(LIVE)).toHaveText('0 markerade');
    await expect(inkorgensKryss(page)).toHaveCount(3);
    await expect(inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' })).not.toBeChecked();
    // Minnet är tomt, inte bara vyn: en omladdning startar utan läge.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Markera betalningar' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(inkorgensKryss(page)).toHaveCount(0);
  });

  test('en REGISTRERING i steget rensar minnet (krokpunkten efterRegistrering)', async ({
    page,
  }) => {
    const mockar = await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await page.getByRole('button', { name: 'Registrera 1' }).click();

    const steget = page.getByTestId('bekraftelsesteget');
    await expect(steget).toBeVisible({ timeout: 15_000 });
    await steget.getByRole('button', { name: /^Registrera 1 inbetalning/ }).click();
    await expect.poll(() => mockar.registreringsAnrop).toEqual([ALFA_1]);

    // Tillbaka till inkorgen: markeringen är BORTA — steget bokförde raden.
    await page.getByRole('button', { name: 'Tillbaka' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Betalningar' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'Markera betalningar' })).toBeVisible();
    await expect(inkorgensKryss(page)).toHaveCount(0);
  });

  test('navigation UTANFÖR betalningsfamiljen rensar; inom familjen gör den inte det', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);
    await inkorgensKryss(page).filter({ hasText: 'Alva Alfasson' }).click();
    await expect(page.locator(LIVE)).toHaveText('1 markerade');

    /* SPA-NAVIGATION, INTE `page.goto`. Vakten sitter i inkorgens
       React-unmount, och en hård omladdning kör ingen cleanup alls — den
       hade mätt webbläsarens beteende i stället för appens. Inkorgens egen
       tillbaka-pil (`SidRam to="/mer"`) är exakt den väg Lotta tar.

       KONTROLLGRUPPEN (navigation INOM familjen bevarar markeringen) är
       AC #4-testet ovan, som går till bekräftelsesteget och tillbaka med
       samma mekanism. Halvorna ligger isär eftersom de kräver olika mål. */
    await page.getByRole('link', { name: 'Tillbaka till Mer' }).click();
    await expect(page).toHaveURL(/\/mer$/);

    await oppnaInkorgen(page);
    await expect(page.getByRole('button', { name: 'Markera betalningar' })).toBeVisible();
    await expect(inkorgensKryss(page)).toHaveCount(0);
    await slaPaMarkeraLaget(page);
    await expect(page.locator(LIVE)).toHaveText('0 markerade');
  });
});

test.describe('TASK-402.1 — tillgänglighet (AC #6)', () => {
  test('axe: 0 fel i markera-läget, både med och utan markerade rader', async ({ page }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    const taggar = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const tomtResultat = await new AxeBuilder({ page }).include('main').withTags(taggar).analyze();
    expect(tomtResultat.violations).toEqual([]);

    await inkorgensKryss(page).first().click();
    await expect(page.locator(LIVE)).toHaveText('1 markerade');
    const markeratResultat = await new AxeBuilder({ page })
      .include('main')
      .withTags(taggar)
      .analyze();
    expect(markeratResultat.violations).toEqual([]);
  });

  test('varje kryss-kort bär ett eget tillgängligt namn ur kortets text', async ({ page }) => {
    await mocka(page);
    await oppnaInkorgen(page);
    await slaPaMarkeraLaget(page);

    // PRD berättelse 27: tio lika kryssrutor måste gå att skilja åt. Namnet
    // kommer ur kortets egen text (namn · belopp), som i förlagan.
    for (const namn of ['Alva Alfasson', 'Assar Alfasson', 'Bodil Betasson']) {
      await expect(page.getByRole('checkbox', { name: new RegExp(namn) })).toHaveCount(1);
    }
  });
});
