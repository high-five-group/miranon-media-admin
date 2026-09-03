import type { BrowserContext } from '@playwright/test';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-369 — Betalningsinkorgens förhandsgranskning är OBEROENDE per rad,
 * inte delad (S116 beslut 5, "Oberoende"). Marcus prod (S116 start):
 * registrerade två inbetalningar, tryckte Förhandsgranska på den översta —
 * den NEDRE radens knapp gick också i laddläge, och bara ETT kvitto
 * renderades.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN (ADR-086-divergens, bokförd)
 * ═══════════════════════════════════════════════════════════════════════════
 * Uppdraget bad om ett "acceptance/Playwright-test". Repots Acceptance-klass
 * (hermetisk MSW-fixturvärld) kan STRUKTURELLT INTE rendera `/mer/betalningar`
 * i dag: `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR: 'av'` för
 * HELA den delade acceptance/visual/webblasarbeteende/manifest-screenshots-
 * fixturvärlden, och routens `beforeLoad`
 * (`src/routes/_authenticated/mer/betalningar.tsx`) kastar en `redirect` till
 * `/mer` när `betalningarPa()` är falskt — verifierat mot BÅDA källorna
 * innan denna fil skrevs. Samma strukturella blockerare som
 * `betalningar-inkorg-utskicksflode.staging.test.ts` (TASK-362) redan
 * dokumenterar och löser för SAMMA komponent: den etablerade,
 * SANKTIONERADE vägen är e2e-klassen (`chromium-authenticated`, egen lokal
 * dev-server med `.env.development`s `VITE_FEATURE_BETALNINGAR=pa`),
 * deterministisk via `page.route()` — ALDRIG `network.use()` (ingen delad
 * staging-data rörs). Denna fil följer samma mönster, inte en ny uppfinning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SVITEN BEVISAR
 * ═══════════════════════════════════════════════════════════════════════════
 * A. AC #1/#2: två rader i kön kan förhandsgranskas EFTER VARANDRA utan att
 *    vänta — rad B:s knapp är enabled och utan laddtext MEDAN rad A:s
 *    `preview-receipt`-anrop hänger, och båda öppnar SINA EGNA fönster.
 * B. AC #2/#5, DEN SKARPA REGRESSIONEN: raderna löses ut i OMVÄND ORDNING
 *    mot klick-ordningen (B FÖRE A). Detta är den enda formen som fäller
 *    TanStack Querys verkliga bugg (verifierad mot källan,
 *    `BetalningsInkorg.tsx`s `forhandsgranskaKvitto`-docblock): en
 *    `.mutate(id, { onSuccess, onError })`-form på en DELAD mutation lagrar
 *    per-anrops-callbacks på OBSERVATÖREN, inte på den enskilda mutationen —
 *    två överlappande anrop skriver över varandras callbacks, så rad A:s
 *    fönster ALDRIG får sin adress satt om rad B:s `.mutate()`-anrop hann
 *    starta emellan. Ett test som bara löser ut i KLICK-ordningen (A, sen B)
 *    hade missat exakt detta — se `git checkout --`-kontrollen nedan.
 * C. AC #3: samma rad kan inte startas två gånger medan den renderar —
 *    andra klicket på en PENDING rad öppnar INGET nytt fönster.
 * D. AC #4: ett fel på en rad namnger PERSONEN och blockerar inte den andra
 *    radens förhandsgranskning.
 *
 * NEGATIVT BEVIS (AC #5, "samma test mot origin/main-komponenten fäller"):
 * körd av byggaren, inte kodad i filen (en e2e-svit kan inte parametrisera
 * SUT:et i sig) — `git diff > <patch>` + `git checkout --
 * src/components/betalningar/BetalningsInkorg.tsx src/data/mutations/kvitton.ts`
 * (husets egen rekommenderade `git stash`-ersättning, delad `.git` mellan
 * worktrees gör `stash` osäkert), testet OMKÖRT mot den återställda
 * origin/main-komponenten (RÖTT, dokumenterat i PR-beskrivningen/
 * slutrapporten), patchen återapplicerad, testet omkört (GRÖNT).
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';
const PREVIEW_RECEIPT = '**/functions/v1/preview-receipt';

const EVENT_ID = 'recTASK369EVENT01';
const ANMALAN_A = 'recTASK369ANMALNA';
const ANMALAN_B = 'recTASK369ANMALNB';
const INBETALNING_A = 'a1b2c3d4-0369-4001-8001-00000000000a';
const INBETALNING_B = 'a1b2c3d4-0369-4002-8002-00000000000b';
const NAMN_A = 'Task369 Aprilsson';
const NAMN_B = 'Task369 Bengtsson';
const PREVIEW_URL_A = 'https://storage.example.test/task369-kvitto-a.pdf';
const PREVIEW_URL_B = 'https://storage.example.test/task369-kvitto-b.pdf';

type Json = Record<string, unknown>;

function oppenBetalning(overrides: Json = {}): Json {
  return {
    anmalanRecordId: ANMALAN_A,
    personNamn: NAMN_A,
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task369-kurs',
    eventStartdatum: '2099-06-01',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: 500,
    gallandePris: 500,
    anmalningsavgift: null,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    ...overrides,
  };
}

/** Samma uppslagsmönster som `betalningar-inkorg-utskicksflode.staging.test.ts`s
 *  `ANMALAN_TILL_SVAR`: `registrera-inbetalning`-mocken svarar OLIKA per
 *  anmälan, så BÅDA raderna kan registreras var för sig i samma test. */
const ANMALAN_TILL_SVAR: Record<string, { inbetalningId: string; namn: string }> = {
  [ANMALAN_A]: { inbetalningId: INBETALNING_A, namn: NAMN_A },
  [ANMALAN_B]: { inbetalningId: INBETALNING_B, namn: NAMN_B },
};

/** Mockar väljaren, listan (TVÅ öppna rader) och registreringen. Rör aldrig
 *  `preview-receipt` — den mockas separat per test via `mockaPreviewReceipt`,
 *  eftersom varje test styr SVARSORDNINGEN olika. */
async function mockaGrund(page: Page): Promise<void> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Task369-kurs', startdatum: '2099-06-01' }),
  ]);

  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        betalningar: [
          oppenBetalning(),
          oppenBetalning({ anmalanRecordId: ANMALAN_B, personNamn: NAMN_B }),
        ],
        forfallna: 0,
      }),
    });
  });

  await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
    const nu = new Date().toISOString();
    const body = route.request().postDataJSON() as { anmalanRecordId: string };
    const svar = ANMALAN_TILL_SVAR[body.anmalanRecordId];
    if (!svar) {
      await route.fulfill({
        status: 400,
        body: `okänd anmalanRecordId i testfixturen: ${body.anmalanRecordId}`,
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        inbetalning: {
          id: svar.inbetalningId,
          anmalanRecordId: body.anmalanRecordId,
          ogonblicksbildNamn: svar.namn,
          ogonblicksbildEvent: 'Task369-kurs',
          ogonblicksbildEventdatum: '2099-06-01',
          belopp: 500,
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
          summa: 500,
          gallandePris: 500,
          saknas: 0,
          avgiftKlar: true,
          alltKlart: true,
          arForelasning: false,
        },
        spegel: { skrivet: true, forsok: 1, skal: null },
      }),
    });
  });
}

/**
 * Grindat `preview-receipt`-svar: varje anrop hänger tills testet EXPLICIT
 * släpper igenom det med `slapp(inbetalningId, svar)` — så testet kan styra
 * SVARSORDNINGEN oberoende av i vilken ordning knapparna klickades (se
 * filhuvudets § B för varför just detta är den skarpa regressions-formen).
 */
function mockaPreviewReceipt(page: Page) {
  const grindar = new Map<string, (svar: { status: number; body: Json }) => void>();
  /**
   * BESLUT PER INBETALNING, ÅTERANVÄNT ÖVER RETRIES. `fetchWithRetry`
   * (`src/data/utils.ts`) gör ETT NYTT POST-anrop mot `preview-receipt` för
   * varje 5xx-svar (default `maxRetries: 3`) — ett FELTEST som bara gate:ar
   * FÖRSTA anropet hade lämnat retry #2/#3 hängande på en NY, aldrig löst
   * promise, och knappen hade stått i laddläge för evigt (mätt: exakt detta
   * hände innan denna karta fanns). Ett 200-svar retryas aldrig
   * (`fetchWithRetry` returnerar direkt på `res.ok`), så kartan är
   * overksam — men ofarlig — för de gröna testerna.
   */
  const beslutade = new Map<string, { status: number; body: Json }>();

  page.route(PREVIEW_RECEIPT, async (route: Route) => {
    const body = route.request().postDataJSON() as { inbetalningId: string };
    const befintligt = beslutade.get(body.inbetalningId);
    const svar =
      befintligt ??
      (await new Promise<{ status: number; body: Json }>((resolve) => {
        grindar.set(body.inbetalningId, resolve);
      }));
    await route.fulfill({
      status: svar.status,
      contentType: 'application/json',
      body: JSON.stringify(svar.body),
    });
  });

  return {
    /** Släpper igenom DET väntande anropet för `inbetalningId` med `svar`,
     *  och bokför beslutet så EVENTUELLA retries (5xx) får SAMMA svar i
     *  stället för att hänga på en ny, olöst gate. */
    slapp(inbetalningId: string, svar: { status: number; body: Json }) {
      beslutade.set(inbetalningId, svar);
      const resolve = grindar.get(inbetalningId);
      if (resolve) {
        grindar.delete(inbetalningId);
        resolve(svar);
      }
    },
  };
}

/** Samma teknik som `dokument-generering-fonster-direkt.acceptance.test.ts`s
 *  `mockaLagradPdf`: `text/plain`, inte `application/pdf` — Chromes
 *  inbyggda PDF-visare tar annars över navigeringen och avbryter den
 *  vanliga load-livscykeln. Testet bevisar att fönstret NAVIGERAR till rätt
 *  URL, inte att en riktig PDF renderas.
 *
 *  `context.route()`, INTE `page.route()`: adressen navigeras av det
 *  FÖNSTER `window.open` skapade (en ANNAN `Page`-instans än `page`), och en
 *  route registrerad på `page` gäller bara den sidan (mätt: en `page.route()`
 *  -variant av denna funktion lämnade popupen på `chrome-error://chromewebdata/`
 *  — DNS-felet för en domän som aldrig är tänkt att slå upp på riktigt).
 *  `BrowserContext.route()` gäller VARJE sida i kontexten, inklusive nya
 *  fönster öppnade efter att routen registrerats. */
async function mockaLagradPdf(context: BrowserContext, url: string): Promise<void> {
  await context.route(url, async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'fejk-innehall-task369' });
  });
}

/** Registrerar EN rad via UI:t: öppnar dess kort, trycker "Registrera" (INTE
 *  "Registrera och skicka") — kvittot hamnar i kön (`vantande`) i stället
 *  för att skickas. "Skicka kvitto" är förkryssad som default
 *  (`RegistreraForm.tsx` rad 219), ingen egen interaktion behövs. */
async function registreraUtanAttSkicka(page: Page, namn: string): Promise<void> {
  const rad = page.getByRole('listitem').filter({ hasText: namn });
  await rad.getByRole('button', { name: 'Registrera betalning' }).click();
  await page
    .getByRole('form', { name: /Registrera betalning för/ })
    .getByRole('button', { name: 'Registrera', exact: true })
    .click();
}

test.describe('TASK-369 — betalningsinkorgens förhandsgranskning är oberoende per rad', () => {
  test('AC #1/#2/#5: rad B är fri MEDAN rad A väntar, och båda navigerar till RÄTT kvitto när svaren löser ut i OMVÄND ordning', async ({
    page,
    context,
  }) => {
    await mockaGrund(page);
    const preview = mockaPreviewReceipt(page);
    await mockaLagradPdf(context, PREVIEW_URL_A);
    await mockaLagradPdf(context, PREVIEW_URL_B);

    await page.goto('/mer/betalningar');

    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);

    // TVÅ rader i kön ⇒ `enSamKo` är falskt ⇒ PER-RAD-knapparna (inte
    // ett-kvitto-fallets) är de som visas — se `kanForhandsgranska`/
    // `enSamKo` i `BetalningsInkorg.tsx`.
    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });
    const knappB = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_B}` });
    await expect(knappA).toBeEnabled();
    await expect(knappB).toBeEnabled();

    // KLICK A — fönstret öppnas SYNKRONT (popup-blockerar-säkert mönster,
    // TASK-353/309.26), och `preview-receipt`-anropet HÄNGER (grindad).
    const [fonsterA] = await Promise.all([context.waitForEvent('page'), knappA.click()]);
    await expect(fonsterA).toHaveTitle('Skapar förhandsgranskningen …');
    expect(fonsterA.url()).toBe('about:blank');

    // KÄRNPÅSTÅENDET (AC #1): rad A väntar — rad B:s knapp är ÄNDÅ enabled,
    // och ladd-overlayen (`role="status"`, `Button.tsx` § "ÖVERLAGD, ALDRIG
    // I FLÖDET") är monterad HOS A men INTE hos B. Den GAMLA, delade
    // `forhandsgranska.isPending` hade satt BÅDA knapparna i laddläge här —
    // `aria-disabled` styrs 1:1 av samma `isLoading`-prop som overlayen, så
    // `toBeDisabled()`/`toBeEnabled()` är det robusta, otvetydiga beviset
    // (`toHaveText` hade läst BÅDA `<span>`-lagren oavsett `visibility`,
    // se `Button.tsx` § "ETIKETTEN ÄGER MÅTTET" — fel instrument här).
    await expect(knappA).toBeDisabled();
    await expect(knappB).toBeEnabled();
    await expect(knappA.getByRole('status')).toHaveCount(1);
    await expect(knappB.getByRole('status')).toHaveCount(0);

    // KLICK B — öppnar sitt EGET fönster, oberoende av att A fortfarande väntar.
    const [fonsterB] = await Promise.all([context.waitForEvent('page'), knappB.click()]);
    await expect(fonsterB).toHaveTitle('Skapar förhandsgranskningen …');
    expect(fonsterB.url()).toBe('about:blank');
    await expect(knappA).toBeDisabled(); // A:s EGEN knapp bär nu laddningen
    await expect(knappB).toBeDisabled(); // B:s EGEN knapp bär nu laddningen

    // LÖS UT I OMVÄND ORDNING — B FÖRE A. Detta är den enda ordningen som
    // fäller den verkliga TanStack Query-bugen (se filhuvudet § B): en
    // implementation som fortfarande använder `.mutate(id, { onSuccess })`
    // på den DELADE mutationen hade här antingen navigerat FEL fönster
    // (A:s callback ersatt av B:s) eller lämnat A:s fönster utan callback
    // alls — se assertionen på `fonsterA` nedan.
    preview.slapp(INBETALNING_B, {
      status: 200,
      body: { url: PREVIEW_URL_B, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => fonsterB.url()).toBe(PREVIEW_URL_B);

    // A ÄR HELT OPÅVERKAT av att B löste ut — fortfarande på sin egen
    // laddningssida, ingen adress satt. En cross-wired implementation hade
    // antingen navigerat A hit (fel dokument) eller lämnat A för evigt på
    // laddningssidan (ingen callback kvar att köra alls).
    expect(fonsterA.url()).toBe('about:blank');
    await expect(fonsterA).toHaveTitle('Skapar förhandsgranskningen …');

    // Släpp A — NU navigerar A till SIN EGEN, rätta URL.
    preview.slapp(INBETALNING_A, {
      status: 200,
      body: { url: PREVIEW_URL_A, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => fonsterA.url()).toBe(PREVIEW_URL_A);

    // Båda knapparna är fria igen — laddläget var PER RAD, inte permanent.
    await expect(knappA).toBeEnabled();
    await expect(knappB).toBeEnabled();
    await expect(knappA).toHaveText('Förhandsgranska');
    await expect(knappB).toHaveText('Förhandsgranska');
  });

  test('AC #3: samma rad kan inte startas två gånger medan den renderar', async ({
    page,
    context,
  }) => {
    await mockaGrund(page);
    const preview = mockaPreviewReceipt(page);
    await mockaLagradPdf(context, PREVIEW_URL_A);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);

    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });

    const [forstaFonstret] = await Promise.all([context.waitForEvent('page'), knappA.click()]);
    await expect(knappA).toBeDisabled();

    // ANDRA KLICKET, medan A fortfarande väntar — knappen är `aria-disabled`
    // (inte `isDisabled`, se knappens egen kommentar), så DOM:en är INTE
    // native `disabled`. `{ force: true }` KRÄVS ändå: Playwrights vanliga
    // aktionsberedskaps-kontroll läser `aria-disabled` som "not enabled" och
    // vägrar annars klicka (retryar tyst tills testets EGEN 30 s-timeout,
    // mätt) — `force` hoppar över DEN kontrollen, precis som ett fysiskt
    // musklick hade träffat elementet oavsett `aria-disabled`. Spärren mot
    // att handlingen faktiskt UTFÖRS ligger i `forhandsgranskaKvitto` själv
    // (den per-rad `forhandsgranskaPagar`-vakten) OCH i `Button.tsx`s
    // `onPress={isLoading ? undefined : onPress}` — inte i klickbarheten.
    // `Promise.all`, INTE `Promise.race` (samma teknik som
    // `dokument-generering-fonster-direkt.acceptance.test.ts`s AC #1-negativa
    // bevis): `.click()` löser ut nästan omedelbart, så en `race` hade
    // avgjort resultatet INNAN 2-sekundersfönstret ens hunnit prövas.
    const nyttFonsterHann = await Promise.all([
      context
        .waitForEvent('page', { timeout: 2000 })
        .then(() => true)
        .catch(() => false),
      knappA.click({ force: true }),
    ]).then(([firade]) => firade);
    expect(nyttFonsterHann).toBe(false);
    expect(context.pages()).toHaveLength(2); // appens sida + DET FÖRSTA fönstret, inget mer

    preview.slapp(INBETALNING_A, {
      status: 200,
      body: { url: PREVIEW_URL_A, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => forstaFonstret.url()).toBe(PREVIEW_URL_A);
  });

  test('AC #4: ett fel på rad A namnger PERSONEN och blockerar inte rad B', async ({
    page,
    context,
  }) => {
    await mockaGrund(page);
    const preview = mockaPreviewReceipt(page);
    await mockaLagradPdf(context, PREVIEW_URL_B);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);

    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });
    const knappB = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_B}` });

    const [fonsterA] = await Promise.all([context.waitForEvent('page'), knappA.click()]);

    preview.slapp(INBETALNING_A, {
      status: 500,
      body: { error: 'Kunde inte rendera kvittot (TASK-369-fixtur)' },
    });

    // Felet namnger PERSONEN (AC #4) — den gamla texten gjorde det inte
    // (`Kvittot kunde inte förhandsgranskas: …`, utan namn). EN alert-ruta,
    // och DEN bär BÅDE namnet och fixturens felmeddelande.
    const felruta = page.getByRole('alert');
    await expect(felruta).toBeVisible();
    await expect(felruta).toContainText(NAMN_A);
    await expect(felruta).toContainText('Kunde inte rendera kvittot (TASK-369-fixtur)');
    // Det tomma fönstret stängs — felet sägs på sidan, inte i en kvarlämnad flik.
    await expect.poll(() => fonsterA.isClosed()).toBe(true);

    // Rad B är HELT OBERÖRD av rad A:s fel — fortfarande enabled, och en
    // förhandsgranskning FÖR DEN raden fungerar normalt.
    await expect(knappB).toBeEnabled();
    const [fonsterB] = await Promise.all([context.waitForEvent('page'), knappB.click()]);
    preview.slapp(INBETALNING_B, {
      status: 200,
      body: { url: PREVIEW_URL_B, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => fonsterB.url()).toBe(PREVIEW_URL_B);
  });
});
