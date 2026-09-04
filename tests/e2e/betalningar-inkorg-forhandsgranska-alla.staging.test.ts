import AxeBuilder from '@axe-core/playwright';
import type { BrowserContext } from '@playwright/test';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/** Samma granskningsblock-region som `betalningar-inkorg-utskicksflode
 *  .staging.test.ts`s `REGION` (TASK-362) — `aria-label="Registrerat nu"`
 *  på `BetalningsInkorg.tsx`s C1-sektion. */
const REGION = 'Registrerat nu';

/**
 * TASK-370.4 — den KOMBINERADE förhandsgranskningen i betalningsinkorgen
 * (S116 Del 2 beslut 1, 4, 5, 6): en knapp bredvid "Skicka N kvitton" som
 * öppnar ETT fönster med ETT kombinerat dokument för HELA den väntande kön,
 * oberoende av per-rad-knapparna (samma per-nyckel-Set-mekanik som
 * `TASK-369` byggde).
 *
 * [AMENDERAD TASK-393, Marcus fynd S121] Den synliga texten OCH aria-label
 * bar tidigare ordet "alla" ("Förhandsgranska alla N kvitton") — knappen
 * lyder nu ALLTID "Förhandsgranska" med N i ett upphöjt räknarchip, samma
 * form som ett-kvitto-knappen och `FilterRad`s hörn-badge
 * (`RaknarChip`-primitiven). Denna svit är UPPDATERAD att asertera den nya
 * formen, inte omskriven — beteendet (fönster, kombinerat dokument, tak 30,
 * oberoende av radknapparna) som beskrivs nedan är HELT ORÖRT av TASK-393.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN (samma ADR-086-divergens
 * som TASK-369 redan bokför)
 * ═══════════════════════════════════════════════════════════════════════════
 * `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR: 'av'` för HELA
 * den delade acceptance/visual/webblasarbeteende/manifest-screenshots-
 * fixturvärlden, och routens `beforeLoad`
 * (`src/routes/_authenticated/mer/betalningar.tsx`) kastar en `redirect`
 * till `/mer` när `betalningarPa()` är falskt. Samma strukturella
 * blockerare som `betalningar-inkorg-forhandsgranskning-oberoende
 * .staging.test.ts` (TASK-369) redan löser för SAMMA komponent: e2e-klassen
 * (`chromium-authenticated`, egen lokal dev-server med
 * `.env.development`s `VITE_FEATURE_BETALNINGAR=pa`), deterministisk via
 * `page.route()`/`context.route()` — ALDRIG `network.use()`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SVITEN BEVISAR
 * ═══════════════════════════════════════════════════════════════════════════
 * A. AC #1 (TASK-393): knappen lyder ALLTID "Förhandsgranska" + räknarchip,
 *    för N = 1 OCH N ≥ 2 — ordet "alla" finns varken i synlig text eller
 *    aria-label, i NÅGOT läge. Vid N ≥ 2 finns den kombinerade knappen
 *    BREDVID "Skicka N kvitton"; vid N = 1 finns bara den ensamma knappen
 *    (samma ett-kvitto-form som TASK-353, nu med samma etikett-form som
 *    N ≥ 2-fallet).
 * B. AC #2/#3: klicket öppnar fönstret SYNKRONT med laddningssida; medan
 *    "alla"-anropet hänger är VARJE radknapp ÄNDÅ enabled (S116 beslut 5,
 *    "Oberoende") — och tvärtom: en radknapps eget anrop blockerar inte
 *    "alla"-knappen. Adressen sätts när svaret kommer.
 * C. AC #4 (person): ett allt-eller-inget-fel stänger fönstret och sägs på
 *    SIDAN (`role="alert"`) med personens namn — samma text-form EF:en
 *    (`preview-receipt/index.ts`s `vem`-variabel) redan bygger, oförändrad
 *    genom klienten.
 * D. AC #4 (tak): ett mockat taköverskridande-fel från EF:en översätts till
 *    ett begripligt svenskt meddelande i stället för EF:ens engelska
 *    valideringstext — `BetalningsInkorg.tsx`s `TAK_FELMATCH`.
 * E. [DESIGNVAL, bevisat] `forhandsgranskaFel` är DELAD mellan rad-flödet
 *    och "alla"-flödet: ett nytt försök i ENA flödet gör ett kvarstående
 *    fel i det ANDRA inaktuellt (samma "nytt försök städar" princip som
 *    TASK-369s REVIEW RUNDA 1-test bevisar INOM rad-flödet, här bevisad
 *    ÖVER flödesgränsen).
 *
 * NEGATIVT BEVIS (AC #5, "samma test mot origin/main-komponenten fäller"):
 * körd av byggaren, inte kodad i filen (en e2e-svit kan inte parametrisera
 * SUT:et i sig) — `git diff > <patch>` + `git checkout --
 * src/components/betalningar/BetalningsInkorg.tsx src/data/mutations/kvitton.ts
 * src/data/adapters/AirtableAdapter.ts src/data/adapters/DataSourceAdapter.ts
 * src/data/adapters/SupabaseAdapter.ts` (husets `git stash`-ersättning,
 * delad `.git` mellan worktrees gör `stash` osäkert), testet OMKÖRT mot den
 * återställda origin/main-komponenten (RÖTT, dokumenterat i slutrapporten),
 * patchen återapplicerad, testet omkört (GRÖNT).
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';
const PREVIEW_RECEIPT = '**/functions/v1/preview-receipt';

const EVENT_ID = 'recTASK3704EVENT01';
const ANMALAN_A = 'recTASK3704ANMALNA';
const ANMALAN_B = 'recTASK3704ANMALNB';
const ANMALAN_C = 'recTASK3704ANMALNC';
const INBETALNING_A = 'a1b2c3d4-0370-4001-8001-00000000000a';
const INBETALNING_B = 'a1b2c3d4-0370-4002-8002-00000000000b';
const INBETALNING_C = 'a1b2c3d4-0370-4003-8003-00000000000c';
const NAMN_A = 'Task3704 Aprilsson';
const NAMN_B = 'Task3704 Bengtsson';
const NAMN_C = 'Task3704 Cecilsson';
const PREVIEW_URL_A = 'https://storage.example.test/task3704-kvitto-a.pdf';
const PREVIEW_URL_ALLA = 'https://storage.example.test/task3704-kvitto-alla.pdf';

/** SAMMA sentinel-NYCKEL-form som `BetalningsInkorg.tsx`s interna
 *  `FORHANDSGRANSKA_ALLA_NYCKEL` — men denna är testfilens EGEN, intern mot
 *  mock-routern (nyckel i grind-Mapen nedan), inte en import av
 *  produktionskonstanten. En kollision med ett riktigt `inbetalningId` är
 *  strukturellt omöjlig av samma skäl som produktionskonstantens docblock
 *  ger: riktiga ID:n är UUID:er, denna sträng är det aldrig. */
const ALLA_MOCK_NYCKEL = '__mock_alla__';

type Json = Record<string, unknown>;

function oppenBetalning(overrides: Json = {}): Json {
  return {
    anmalanRecordId: ANMALAN_A,
    personNamn: NAMN_A,
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task3704-kurs',
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

const ANMALAN_TILL_SVAR: Record<string, { inbetalningId: string; namn: string }> = {
  [ANMALAN_A]: { inbetalningId: INBETALNING_A, namn: NAMN_A },
  [ANMALAN_B]: { inbetalningId: INBETALNING_B, namn: NAMN_B },
  [ANMALAN_C]: { inbetalningId: INBETALNING_C, namn: NAMN_C },
};

/** Mockar väljaren, listan (default TRE öppna rader) och registreringen.
 *  `antalRader` gör N = 1-fallet (AC #1) och N ≥ 2-fallet samma helper. */
async function mockaGrund(page: Page, antalRader: 1 | 2 | 3 = 3): Promise<void> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Task3704-kurs', startdatum: '2099-06-01' }),
  ]);

  const alla = [
    oppenBetalning(),
    oppenBetalning({ anmalanRecordId: ANMALAN_B, personNamn: NAMN_B }),
    oppenBetalning({ anmalanRecordId: ANMALAN_C, personNamn: NAMN_C }),
  ];

  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: alla.slice(0, antalRader), forfallna: 0 }),
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
          ogonblicksbildEvent: 'Task3704-kurs',
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
 * Grindat `preview-receipt`-svar för BÅDA formerna: rad-anropet (nycklat på
 * `inbetalningId`) och "alla"-anropet (`inbetalningIds`, nycklat på
 * `ALLA_MOCK_NYCKEL` — bara ETT "alla"-anrop kan vara i flykt åt gången,
 * spärrat av produktionskodens egen `forhandsgranskaPagar`-vakt, så en
 * enda delad nyckel räcker). Samma retry-medvetna `beslutade`-karta som
 * `TASK-369`s test — se den filens docblock för `fetchWithRetry`-skälet.
 */
function mockaPreviewReceipt(page: Page) {
  const grindar = new Map<string, (svar: { status: number; body: Json }) => void>();
  const beslutade = new Map<string, { status: number; body: Json }>();

  function nyckelFor(body: { inbetalningId?: unknown; inbetalningIds?: unknown }): string {
    return Array.isArray(body.inbetalningIds) ? ALLA_MOCK_NYCKEL : String(body.inbetalningId);
  }

  page.route(PREVIEW_RECEIPT, async (route: Route) => {
    const body = route.request().postDataJSON() as {
      inbetalningId?: string;
      inbetalningIds?: string[];
    };
    const nyckel = nyckelFor(body);
    const befintligt = beslutade.get(nyckel);
    const svar =
      befintligt ??
      (await new Promise<{ status: number; body: Json }>((resolve) => {
        grindar.set(nyckel, resolve);
      }));
    await route.fulfill({
      status: svar.status,
      contentType: 'application/json',
      body: JSON.stringify(svar.body),
    });
  });

  function slapp(nyckel: string, svar: { status: number; body: Json }) {
    beslutade.set(nyckel, svar);
    const resolve = grindar.get(nyckel);
    if (resolve) {
      grindar.delete(nyckel);
      resolve(svar);
    }
  }

  return {
    slappRad: (inbetalningId: string, svar: { status: number; body: Json }) =>
      slapp(inbetalningId, svar),
    slappAlla: (svar: { status: number; body: Json }) => slapp(ALLA_MOCK_NYCKEL, svar),
  };
}

/** Samma teknik som `TASK-369`s `mockaLagradPdf`: `text/plain`, inte
 *  `application/pdf` — Chromes inbyggda PDF-visare tar annars över
 *  navigeringen. `BrowserContext.route()`, INTE `page.route()`: adressen
 *  navigeras av det FÖNSTER `window.open` skapade. */
async function mockaLagradPdf(context: BrowserContext, url: string): Promise<void> {
  await context.route(url, async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'text/plain', body: 'fejk-innehall-task3704' });
  });
}

async function registreraUtanAttSkicka(page: Page, namn: string): Promise<void> {
  const rad = page.getByRole('listitem').filter({ hasText: namn });
  await rad.getByRole('button', { name: 'Registrera betalning' }).click();
  await page
    .getByRole('form', { name: /Registrera betalning för/ })
    .getByRole('button', { name: 'Registrera', exact: true })
    .click();
}

test.describe('TASK-370.4/TASK-393 — den kombinerade förhandsgranskningen i betalningsinkorgen', () => {
  test('AC #1: knappen finns BARA vid N ≥ 2, med rätt tillgängligt namn; per-rad-knapparna opåverkade', async ({
    page,
  }) => {
    await mockaGrund(page, 3);
    await page.goto('/mer/betalningar');

    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    await expect(allaKnapp).toBeVisible();
    await expect(allaKnapp).toHaveText('Förhandsgranska 3');

    // Bredvid "Skicka 3 kvitton" — samma knapprad.
    await expect(page.getByRole('button', { name: 'Skicka 3 kvitton' })).toBeVisible();

    // Per-rad-knapparna finns KVAR, oförändrade (S116 beslut 1: "Båda").
    await expect(
      page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_B}` }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_C}` }),
    ).toBeVisible();
  });

  test('AC #1/#4 (TASK-393): N = 1 visar EN "Förhandsgranska"-knapp med räknarchip "1", singular aria-label', async ({
    page,
  }) => {
    await mockaGrund(page, 1);
    await page.goto('/mer/betalningar');

    await registreraUtanAttSkicka(page, NAMN_A);

    // EXAKT EN knapp vars namn börjar med "Förhandsgranska" — ingen andra,
    // separat "alla"-knapp för ett ensamt kvitto (samma form-val som förut,
    // se `enSamKo` i produktionskoden), och per-rad-knapparna renderar
    // ALDRIG vid N = 1 (bara vid `!enSamKo`).
    await expect(page.getByRole('button', { name: /^Förhandsgranska/ })).toHaveCount(1);

    // AC #4: singular ("kvitto", inte "kvitton") — det tillgängliga namnet
    // är nu räknarformen, INTE längre personnamnet
    // ("Förhandsgranska kvittot till {namn}"), se `BetalningsInkorg.tsx`s
    // AMENDERAD TASK-393-kommentar vid ensamKandidat-knappen för skälet.
    const knapp = page.getByRole('button', { name: 'Förhandsgranska 1 kvitto' });
    await expect(knapp).toBeVisible();
    await expect(knapp).toHaveText('Förhandsgranska 1');

    await expect(page.getByRole('button', { name: 'Skicka 1 kvitto' })).toBeVisible();
  });

  test('AC #2/#3: klicket öppnar fönstret SYNKRONT; "alla" och raderna är OBEROENDE i båda riktningarna', async ({
    page,
    context,
  }) => {
    await mockaGrund(page, 3);
    const preview = mockaPreviewReceipt(page);
    await mockaLagradPdf(context, PREVIEW_URL_A);
    await mockaLagradPdf(context, PREVIEW_URL_ALLA);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });
    const knappB = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_B}` });

    // KLICK "ALLA" — fönstret öppnas SYNKRONT, anropet HÄNGER (grindat).
    const [fonsterAlla] = await Promise.all([context.waitForEvent('page'), allaKnapp.click()]);
    await expect(fonsterAlla).toHaveTitle('Skapar förhandsgranskningen …');
    expect(fonsterAlla.url()).toBe('about:blank');

    // KÄRNPÅSTÅENDET (AC #3, S116 beslut 5): "alla" väntar — VARJE radknapp
    // är ÄNDÅ enabled, ingen delad vakt blockerar dem.
    await expect(allaKnapp).toBeDisabled();
    await expect(allaKnapp.getByRole('status')).toHaveCount(1);
    await expect(knappA).toBeEnabled();
    await expect(knappB).toBeEnabled();
    await expect(knappA.getByRole('status')).toHaveCount(0);

    // KLICK A, MEDAN "ALLA" FORTFARANDE VÄNTAR — öppnar sitt EGET fönster.
    const [fonsterA] = await Promise.all([context.waitForEvent('page'), knappA.click()]);
    await expect(fonsterA).toHaveTitle('Skapar förhandsgranskningen …');
    await expect(knappA).toBeDisabled();
    await expect(allaKnapp).toBeDisabled(); // "alla" ÄR FORTFARANDE laddande, opåverkad av A
    await expect(knappB).toBeEnabled(); // B är HELT oberört av BÅDA de andra

    // LÖS UT I OMVÄND ORDNING — A FÖRE "ALLA". Bevisar att de två
    // mutationsinstanserna (`forhandsgranska`/`forhandsgranskaAllaMutation`)
    // aldrig kopplar loss varandras callbacks.
    preview.slappRad(INBETALNING_A, {
      status: 200,
      body: { url: PREVIEW_URL_A, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => fonsterA.url()).toBe(PREVIEW_URL_A);
    await expect(knappA).toBeEnabled();
    await expect(allaKnapp).toBeDisabled(); // "alla" fortfarande opåverkad

    preview.slappAlla({
      status: 200,
      body: {
        url: PREVIEW_URL_ALLA,
        utgar: new Date(Date.now() + 300_000).toISOString(),
        requestId: 'req-task3704-alla',
      },
    });
    await expect.poll(() => fonsterAlla.url()).toBe(PREVIEW_URL_ALLA);
    await expect(allaKnapp).toBeEnabled();
    await expect(allaKnapp).toHaveText('Förhandsgranska 3');
  });

  test('AC #2: ett STÄNGT fönster hanteras UTAN FEL när svaret kommer sent', async ({
    page,
    context,
  }) => {
    await mockaGrund(page, 3);
    const preview = mockaPreviewReceipt(page);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    const [fonsterAlla] = await Promise.all([context.waitForEvent('page'), allaKnapp.click()]);

    // LOTTA STÄNGER FÖNSTRET SJÄLV, INNAN SVARET KOMMIT — `forhandsgranskaAlla`s
    // `fonster.closed`-vakt (samma mönster som `forhandsgranskaKvitto`) måste
    // hindra ett kastat fel när `location.href` annars hade satts på ett
    // stängt fönster.
    await fonsterAlla.close();

    const sidfel: Error[] = [];
    page.on('pageerror', (fel) => sidfel.push(fel));

    preview.slappAlla({
      status: 200,
      body: { url: PREVIEW_URL_ALLA, utgar: new Date(Date.now() + 300_000).toISOString() },
    });

    // Knappen återgår till VILA (mutationens `.finally()` körde) — beviset
    // att svaret faktiskt behandlades klart, utan att kasta.
    await expect(allaKnapp).toBeEnabled();
    expect(sidfel, 'inget sidfel fick kastas när fönstret redan var stängt').toHaveLength(0);
  });

  test('AC #4 (person): allt-eller-inget-felet stänger fönstret och namnger personen i role="alert"', async ({
    page,
    context,
  }) => {
    await mockaGrund(page, 3);
    const preview = mockaPreviewReceipt(page);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });

    const [fonsterAlla] = await Promise.all([context.waitForEvent('page'), allaKnapp.click()]);

    // SAMMA TEXTFORM SOM EF:en FAKTISKT BYGGER (`preview-receipt/index.ts`s
    // `vem`-variabel): "NAMN (kvitto I av N): kvittot kunde inte skapas — …".
    preview.slappAlla({
      status: 500,
      body: {
        error: `${NAMN_B} (kvitto 2 av 3): kvittot kunde inte skapas — bakomliggande fel (TASK-370.4-fixtur)`,
      },
    });

    const felruta = page.getByRole('alert');
    await expect(felruta).toBeVisible();
    await expect(felruta).toContainText(NAMN_B);
    await expect(felruta).toContainText('bakomliggande fel (TASK-370.4-fixtur)');
    await expect.poll(() => fonsterAlla.isClosed()).toBe(true);

    // Radknapparna är HELT OBERÖRDA av "alla"s fel.
    await expect(knappA).toBeEnabled();
  });

  test('AC #4 (tak): ett mockat taköverskridande-fel visar det begripliga svenska meddelandet', async ({
    page,
    context,
  }) => {
    await mockaGrund(page, 3);
    const preview = mockaPreviewReceipt(page);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    const [fonsterAlla] = await Promise.all([context.waitForEvent('page'), allaKnapp.click()]);

    // EF:ens valideringstext (`_shared/kvitto-kombination.ts`s
    // `valideraInbetalningIdLista`), HANDSKRIVEN HÄR — detta test mockar bara
    // SVARET och bevisar RENDERINGEN av det begripliga meddelandet, INTE att
    // regexen faktiskt matchar EF:ens VERKLIGA text (review-runda 1 FYND 1).
    // Den bindningen — `tolkaTakfel` körd på EF-modulens FAKTISKT kastade
    // fel, inget mockat — bevisas i
    // `tests/api/forhandsgranska-alla-tak-bindning.test.ts`.
    preview.slappAlla({
      status: 400,
      body: { error: 'inbetalningIds may contain at most 30 entries (got 35)' },
    });

    const felruta = page.getByRole('alert');
    await expect(felruta).toBeVisible();
    await expect(felruta).toContainText(
      'Förhandsgranskningen klarar högst 30 kvitton åt gången. Ta bort några från kön och försök igen.',
    );
    // EF:ens RÅA engelska text ska INTE nå Lotta.
    await expect(felruta).not.toContainText('may contain at most');
    await expect.poll(() => fonsterAlla.isClosed()).toBe(true);
  });

  test('[DESIGNVAL] ett nytt försök i VILKET SOM HELST flöde gör ett kvarstående fel i det ANDRA inaktuellt', async ({
    page,
    context,
  }) => {
    await mockaGrund(page, 3);
    const preview = mockaPreviewReceipt(page);
    await mockaLagradPdf(context, PREVIEW_URL_ALLA);

    await page.goto('/mer/betalningar');
    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    const knappA = page.getByRole('button', { name: `Förhandsgranska kvittot till ${NAMN_A}` });

    // 1) RAD A FELAR FÖRST.
    const [fonsterA] = await Promise.all([context.waitForEvent('page'), knappA.click()]);
    preview.slappRad(INBETALNING_A, {
      status: 500,
      body: { error: 'Kunde inte rendera kvittot (TASK-370.4-fixtur)' },
    });
    const felruta = page.getByRole('alert');
    await expect(felruta).toBeVisible();
    await expect(felruta).toContainText(NAMN_A);
    await expect.poll(() => fonsterA.isClosed()).toBe(true);

    // 2) NYTT FÖRSÖK I DET ANDRA FLÖDET ("alla") — anropet hänger ÄNNU
    // (ingen `preview.slappAlla` körd). Rutan ska försvinna vid FÖRSÖKETS
    // START, inte vid dess (ännu ohända) utfall — samma bevisform som
    // TASK-369s REVIEW RUNDA 1-test, nu ÖVER flödesgränsen.
    const [fonsterAlla] = await Promise.all([context.waitForEvent('page'), allaKnapp.click()]);
    await expect(felruta).toHaveCount(0);

    // Sanity: "alla"-försöket fungerar normalt när svaret väl kommer.
    preview.slappAlla({
      status: 200,
      body: { url: PREVIEW_URL_ALLA, utgar: new Date(Date.now() + 300_000).toISOString() },
    });
    await expect.poll(() => fonsterAlla.url()).toBe(PREVIEW_URL_ALLA);
  });

  test('AC #4 (TASK-393): axe 0 fel på granskningsblocket med räknarchippet synligt, N ≥ 2', async ({
    page,
  }) => {
    // N = 3: den kombinerade knappens `RaknarChip` visar "3" — samma
    // house-mönster som `betalningar-inkorg-utskicksflode.staging.test.ts`s
    // "axe: 0 fel på granskningsblocket"-test (TASK-362), scopat till SAMMA
    // region. Ett-kvitto-fallets chip ("1") täcks redan av DET testet
    // (`enSamKo`-läget bär numera också ett `RaknarChip`).
    await mockaGrund(page, 3);
    await page.goto('/mer/betalningar');

    await registreraUtanAttSkicka(page, NAMN_A);
    await registreraUtanAttSkicka(page, NAMN_B);
    await registreraUtanAttSkicka(page, NAMN_C);

    const allaKnapp = page.getByRole('button', { name: 'Förhandsgranska 3 kvitton' });
    await expect(allaKnapp).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .include(`section[aria-label="${REGION}"]`)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
