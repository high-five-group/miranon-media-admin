import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import {
  EVENT_DETAIL_RESPONSE,
  FROZEN_NOW,
  REGISTRATIONS_RESPONSE,
} from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-214.2 — dörrlistans MUTATIONS-KOPPLING (PRD task-214, S103 Del 15 F2/F3).
 *
 * BEVISAR KVITTENSFÖNSTRETS KONTRAKT, inte bara att en skrivning sker:
 *
 *   1. Skrivningen går EXAKT när kvittensfönstret (1,2 s) löpt ut — aldrig vid
 *      trycket.
 *   2. Ångra INOM fönstret ⇒ NOLL skrivanrop. Ett feltryck vid dörren lämnar
 *      inget spår i basen.
 *   3. Ångra EFTER fönstret (urbockning i klargruppen) ⇒ vanlig skrivning
 *      tillbaka till 'Ej avstämt'.
 *   4. Saknas Deltaganden-raden skapas den via `create-attendance` i
 *      skrivögonblicket — dörren säger aldrig nej.
 *   5. Misslyckad skrivning återför raden till arbetslistan med synligt fel.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  VARFÖR DENNA FIL RÄKNAR ANROP — motiverat undantag från klassregeln
 * ══════════════════════════════════════════════════════════════════════════
 *
 * `acceptance-bas.ts` slår fast att klassen testar EXTERNT BETEENDE, aldrig att
 * en handler anropades eller hur många gånger. Undantaget här är detsamma som
 * `atgarder-betalningsnotering-logg.acceptance.test.ts` bär, och av samma slag
 * av skäl: kontraktet som ska bevisas ÄR frånvaron av ett nätverksanrop.
 * "Ångra inom fönstret" har per definition ingen renderad skillnad mot "ångra
 * efter fönstret" — raden ser likadan ut i båda fallen. Skillnaden lever
 * uteslutande i vad som nådde basen, och det enda sättet att observera den är
 * att räkna anropen. Kortets AC #1/#2 och DoD #9 kräver uttryckligen
 * nätverks-observationen.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  DETERMINISMEN — FRYST KLOCKA, INTE VÄNTAN I REALTID
 * ══════════════════════════════════════════════════════════════════════════
 *
 * `page.clock.install()` fryser browserns timers, så kvittensfönstret löper
 * ENBART när testet självt driver klockan (`fastForward`). Utan den hade
 * beviset blivit ett race: "0 anrop direkt efter trycket" är sant bara om
 * assertionen hinner före 1,2 s realtid, och "ångra inom fönstret" hade krävt
 * att två klick hann inom samma budget. Ett tidsberoende bevis som blir rött av
 * långsam maskin mäter maskinen, inte koden.
 *
 * `time: FROZEN_NOW` (inte default systemtid) är samma fälla
 * `events-list-kalender.acceptance.test.ts` bokför: fixturvärldens seedade
 * session är en JWT som går ut FROZEN_NOW + 24 h. En klocka på verklig tid gör
 * testet grönt i dag och rött av sig självt när kalendern passerat den
 * utgången — utan att någon rört koden.
 *
 * RÄCKEN (PRD task-214 § Testbeslut): ingen assertion rör 'Avstämt' (A8 äger
 * fältet och dess latens gör varje sådan assertion flakig per konstruktion).
 * Skrivkropparna granskas i stället på att de bär EXAKT `Status` — vilket är
 * det starkare beviset: appen KAN inte röra tidsstämpeln.
 */

const EVENT_ID = 'recDORRLISTA000001';
/** Anmälan MED förskapad Deltaganden-rad → `set-attendance-status`-vägen. */
const ANMALAN_MED = 'recDORRANM00000001';
/** Anmälan UTAN Deltaganden-rad → `create-attendance`-vägen (dörrens backup). */
const ANMALAN_UTAN = 'recDORRANM00000002';
const DELTAGANDE_ID = 'recDORRDELT0000001';
/** Record-ID:t `create-attendance` svarar med i fixturvärlden. */
const SKAPAT_DELTAGANDE_ID = 'recDORRDELT0000002';

const NAMN_MED = 'Anna Andersson';
const NAMN_UTAN = 'Björn Bergström';

/** Kvittensfönstret i millisekunder — samma tal som `EventCheckin.tsx`. */
const KVITTENSFONSTER_MS = 1200;

/** Kroppen `update-record` tar emot (EF-kontraktet, `update-record/index.ts`). */
type UppdateringsKropp = {
  operationKey: string;
  recordId: string;
  fields: Record<string, unknown>;
};

/** Kroppen `create-attendance` tar emot (EF-kontraktet, TASK-214.1). */
type SkapaKropp = { anmalanId: string; eventId: string; session: string };

function dorrEvent() {
  return {
    ...EVENT_DETAIL_RESPONSE.event,
    id: EVENT_ID,
    eventlabel: 'Dörrtest 15 sep',
    eventNamn: 'Föreläsning Dörrtest',
    typ: 'Föreläsning',
    ort: 'Skövde',
    startdatum: '2026-09-15',
    slutdatum: '2026-09-15',
  };
}

/** En anmälan i dörrlistans form — fixturens rad som mall, identiteten vår. */
function anmalan(id: string, fornamn: string, efternamn: string) {
  return {
    ...REGISTRATIONS_RESPONSE.registrations[0],
    id,
    namn: `${fornamn} ${efternamn}`,
    fornamn,
    efternamn,
    email: `${fornamn.toLowerCase()}@example.se`,
    eventId: EVENT_ID,
    eventNamn: 'Föreläsning Dörrtest',
    // Basens faktiska optionsträng (`RegistrationStatus.BEKRAFTAD`), inte
    // "Bekräftad" — schemat är en enum och parsen fäller varje avvikelse.
    status: 'Bekräftad (mail skickat)',
  };
}

/**
 * Deltagandet för `ANMALAN_MED`. `ANMALAN_UTAN` saknar medvetet rad — det är
 * dörrens verkliga läge (prod-mätt 2026-08-14: fyra aktiva anmälningar på
 * kommande event utan Deltaganden-rad) och hela skälet till CREATE-backupen.
 *
 * Att listan innehåller EXAKT en session ('Föreläsning') är avsiktligt: dörrens
 * sessionsval härleds ur närvarodatan, och ett enda värde ger ett
 * deterministiskt val utan att sessionsraden ens renderas.
 */
function deltagande() {
  return {
    id: DELTAGANDE_ID,
    anmalanId: ANMALAN_MED,
    eventId: EVENT_ID,
    personId: 'recDORRPERS0000001',
    personNamn: NAMN_MED,
    session: 'Föreläsning',
    status: 'Ej avstämt',
    noteringar: null,
    avstamt: null,
  };
}

/** Läsvägen — identisk i varje test, så skrivvägen är den enda variabeln. */
function mockaLasning(network: NetworkFixture) {
  network.use(
    http.get(EF('get-event'), () => json({ event: dorrEvent() })),
    http.get(EF('get-registrations'), () =>
      json({
        registrations: [
          anmalan(ANMALAN_MED, 'Anna', 'Andersson'),
          anmalan(ANMALAN_UTAN, 'Björn', 'Bergström'),
        ],
      }),
    ),
    http.get(EF('get-attendance'), () => json({ attendance: [deltagande()] })),
  );
}

/** Skrivvägen med räknare + kropps-fångst. `status` styr `update-record`s svar. */
function mockaSkrivning(network: NetworkFixture, { status = 200 }: { status?: number } = {}) {
  const uppdateringar: UppdateringsKropp[] = [];
  const skapelser: SkapaKropp[] = [];

  network.use(
    http.post(EF('update-record'), async ({ request }) => {
      uppdateringar.push((await request.json()) as UppdateringsKropp);
      return status === 200 ? json({ ok: true }) : json({ error: 'nej' }, status);
    }),
    http.post(EF('create-attendance'), async ({ request }) => {
      skapelser.push((await request.json()) as SkapaKropp);
      return json({ record: { id: SKAPAT_DELTAGANDE_ID, fields: {} }, created: true }, 201);
    }),
  );

  return { uppdateringar, skapelser };
}

/**
 * NAVIGERAR MOT DEN PROMOVERADE ROUTEN, UTAN `?variant=d` (TASK-214.5,
 * kortets AC #2). Fram till flippen (TASK-214.4) navigerade denna funktion
 * via `?variant=d` — nödvändigt då, eftersom D bara renderades bakom
 * variant-villkoret. `narvaro.tsx` (§ `?variant=`-LÄSNINGEN HÄRIFRÅN ÄR
 * BORTA) bekräftar att parametern är död sedan flippen: ingen kod läser den
 * längre, så den gamla adressen renderade redan samma träd. Ändringen här
 * är alltså bevis, inte reparation — den PROMOVERADE routen prövas nu
 * uttryckligen, i stället för att luta på att en ignorerad parameter råkar
 * vara harmlös. Testinnehållet (assertions, fixturvärld, kvittensfönstrets
 * kontrakt) är OFÖRÄNDRAT.
 */
async function oppnaDorren(page: import('@playwright/test').Page) {
  await page.goto(`/event/${EVENT_ID}/narvaro`);
  await expect(page.getByRole('heading', { level: 1, name: 'Check-in' })).toBeVisible();
}

const kryssruta = (page: import('@playwright/test').Page, namn: string) =>
  page.getByRole('checkbox', { name: `Närvarande: ${namn}` });

/**
 * RAC-kryssets `<input>` är VISUELLT täckt av sitt eget dekorativa
 * `<span>`/`<svg>`, så ett direkt `.click()` hit-testar mot det täckande
 * elementet och timeoutar. Etablerat repo-mönster (`atgarder-bilageval-send`
 * § `klickaKryss`, `atgarder-betalningar.staging` § `klicka`): klicka
 * ancestor-`<label>`. Rollen används ändå för att HITTA och verifiera rutan —
 * bara inte för att trigga klicket.
 */
const tryck = (page: import('@playwright/test').Page, namn: string): Promise<void> =>
  kryssruta(page, namn).locator('xpath=ancestor::label[1]').click();

test.describe('Dörrlistan skriver skarpt efter kvittensfönstret (TASK-214.2)', () => {
  test.beforeEach(async ({ page }) => {
    // Frusna timers — se filhuvudet § DETERMINISMEN. Måste stå före goto.
    await page.clock.install({ time: FROZEN_NOW });
  });

  test('incheckning: NOLL skrivanrop före fönstrets utgång, exakt ett efter', async ({
    page,
    network,
  }) => {
    mockaLasning(network);
    const { uppdateringar, skapelser } = mockaSkrivning(network);
    await oppnaDorren(page);

    await tryck(page, NAMN_MED);

    // Raden har KVITTERAT (grön, ikryssad, "Incheckad HH:MM") medan klockan
    // står still — beviset att UI:t svarar direkt och basen inte rörts.
    await expect(kryssruta(page, NAMN_MED)).toBeChecked();
    await expect(page.getByText(/^Incheckad \d{2}:\d{2}$/)).toBeVisible();
    expect(uppdateringar).toHaveLength(0);
    expect(skapelser).toHaveLength(0);

    // Fönstret löper ut → skrivningen går, och först nu.
    await page.clock.fastForward(KVITTENSFONSTER_MS);
    await expect.poll(() => uppdateringar.length).toBe(1);

    expect(uppdateringar[0]).toEqual({
      operationKey: 'set-attendance-status',
      recordId: DELTAGANDE_ID,
      fields: { Status: 'Närvarande' },
    });
    // RÄCKET: exakt ETT fält. 'Avstämt' ägs av automationen A8 och kan inte
    // nås härifrån — bevisat på formen, inte på ett värde vi väntat in.
    expect(Object.keys(uppdateringar[0].fields)).toEqual(['Status']);
    expect(skapelser).toHaveLength(0);

    // Raden har lämnat arbetslistan för klargruppen.
    await expect(page.getByRole('button', { name: '1 incheckade' })).toBeVisible();
  });

  test('ångra INOM fönstret: noll skrivanrop, även efter att fönstret passerat', async ({
    page,
    network,
  }) => {
    mockaLasning(network);
    // BÅDA skrivvägarna är NEGATIVA SENSORER här: matchar någon av dem fälls
    // testet av överskuggnings-vakten, vilket är exakt det utfall som ska
    // fälla. Räknaren nedan står kvar som explicit assertion i testkroppen —
    // vakten är skyddsnätet, inte beviset.
    const uppdateringar: UppdateringsKropp[] = [];
    network.use(
      medvetetOanvand(
        http.post(EF('update-record'), async ({ request }) => {
          uppdateringar.push((await request.json()) as UppdateringsKropp);
          return json({ ok: true });
        }),
        'Ångra inom kvittensfönstret ska ge NOLL skrivanrop — handlern är en negativ sensor. Matchar den har timern skrivit trots att fönstret avbröts, och kontraktets kärna är bruten.',
      ),
      medvetetOanvand(
        http.post(EF('create-attendance'), () =>
          json({ record: { id: SKAPAT_DELTAGANDE_ID, fields: {} }, created: true }, 201),
        ),
        'CREATE-vägen gäller raden UTAN deltaganderad. Detta test rör bara raden som HAR en, och ångrar dessutom inom fönstret — ingen skrivning av något slag ska gå.',
      ),
    );
    await oppnaDorren(page);

    const rutan = kryssruta(page, NAMN_MED);
    await tryck(page, NAMN_MED);
    await expect(rutan).toBeChecked();

    // Klockan står still, så detta ÄR inom fönstret — oavsett hur långsam
    // maskinen är. Ångran river timern innan den hunnit skriva.
    await tryck(page, NAMN_MED);
    await expect(rutan).not.toBeChecked();

    // Driv klockan långt förbi fönstret: hade skrivningen bara skjutits upp
    // hade den fyrat här. Den finns inte — den avbröts.
    await page.clock.fastForward(KVITTENSFONSTER_MS * 3);
    expect(uppdateringar).toHaveLength(0);

    // Raden står kvar i arbetslistan; ingen klargrupp har uppstått.
    await expect(page.getByRole('button', { name: /incheckade$/ })).toHaveCount(0);
  });

  test('ångra EFTER fönstret (urbockning i klargruppen) skriver Ej avstämt', async ({
    page,
    network,
  }) => {
    mockaLasning(network);
    const { uppdateringar } = mockaSkrivning(network);
    await oppnaDorren(page);

    await tryck(page, NAMN_MED);
    await page.clock.fastForward(KVITTENSFONSTER_MS);
    await expect.poll(() => uppdateringar.length).toBe(1);

    // Fäll ut klargruppen och bocka ur — vägen kortet pekar ut.
    await page.getByRole('button', { name: '1 incheckade' }).click();
    await tryck(page, NAMN_MED);

    await expect.poll(() => uppdateringar.length).toBe(2);
    expect(uppdateringar[1]).toEqual({
      operationKey: 'set-attendance-status',
      recordId: DELTAGANDE_ID,
      fields: { Status: 'Ej avstämt' },
    });

    // EXAKT en skrivning per urbockning — ingen extra vid tillbakaflytten.
    await page.clock.fastForward(KVITTENSFONSTER_MS * 3);
    expect(uppdateringar).toHaveLength(2);
  });

  test('rad utan deltaganderad: create-attendance i skrivögonblicket, dörren säger aldrig nej', async ({
    page,
    network,
  }) => {
    mockaLasning(network);
    const { uppdateringar, skapelser } = mockaSkrivning(network);
    await oppnaDorren(page);

    // Förbehållet är synligt: personen visas trots att basen saknar raden.
    await expect(page.getByText(/saknar deltaganderad för Föreläsning i basen/)).toBeVisible();

    await tryck(page, NAMN_UTAN);
    expect(skapelser).toHaveLength(0);

    await page.clock.fastForward(KVITTENSFONSTER_MS);
    await expect.poll(() => skapelser.length).toBe(1);

    expect(skapelser[0]).toEqual({
      anmalanId: ANMALAN_UTAN,
      eventId: EVENT_ID,
      session: 'Föreläsning',
    });
    // Klienten skickar ALDRIG Status — EF:en sätter 'Närvarande' server-side.
    expect(Object.keys(skapelser[0]).sort()).toEqual(['anmalanId', 'eventId', 'session']);
    // CREATE ersätter uppdateringen; den skickas inte också.
    expect(uppdateringar).toHaveLength(0);

    // Urbockning EFTER skapelsen träffar den NYA raden — inte en andra create.
    await page.getByRole('button', { name: '1 incheckade' }).click();
    await tryck(page, NAMN_UTAN);
    await expect.poll(() => uppdateringar.length).toBe(1);
    expect(uppdateringar[0]).toEqual({
      operationKey: 'set-attendance-status',
      recordId: SKAPAT_DELTAGANDE_ID,
      fields: { Status: 'Ej avstämt' },
    });
    expect(skapelser).toHaveLength(1);
  });

  test('misslyckad skrivning återför raden till arbetslistan med synligt fel', async ({
    page,
    network,
  }) => {
    mockaLasning(network);
    // 400, inte 500: `fetchWithRetry` retryar 5xx med setTimeout-backoff, och
    // med fryst klocka hade felet inte nått vyn förrän testet drev klockan
    // genom hela kedjan. 4xx propagerar direkt — och är dessutom det EF:en
    // faktiskt svarar vid en avvisad operation (deny-by-default).
    const { uppdateringar } = mockaSkrivning(network, { status: 400 });
    await oppnaDorren(page);

    await tryck(page, NAMN_MED);
    await page.clock.fastForward(KVITTENSFONSTER_MS);
    await expect.poll(() => uppdateringar.length).toBe(1);

    // Felet syns, namnger personen och säger var hon finns.
    const fel = page.getByRole('alert');
    await expect(fel).toContainText('Incheckningen kunde inte sparas');
    await expect(fel).toContainText(NAMN_MED);

    // Raden är TILLBAKA i arbetslistan, urbockad — ingen tyst förlust, och
    // ingen klargrupp som felaktigt påstår att hon är inne.
    await expect(kryssruta(page, NAMN_MED)).not.toBeChecked();
    await expect(page.getByRole('button', { name: /incheckade$/ })).toHaveCount(0);
    await expect(
      page.getByRole('list', { name: 'Anmälda att checka in' }).getByText(NAMN_MED),
    ).toBeVisible();

    // Ett nytt försök rensar felet — felytan speglar nuläget, inte historien.
    await tryck(page, NAMN_MED);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

/**
 * TASK-299.6 — husets delade `SidRam`-primitiv är PROMOVERAD till dörrlistan;
 * dev-växeln `?sidram=ny` (TASK-299.1) är riven (`ADR-103` B2 steg 4). Blocket
 * testade tidigare växelns EGEN mekanik och navigerade med flaggan; nu täcker
 * det den promoverade formen som DEFAULT — samma assertion, ingen parameter.
 * Det är också filens enda axe-svep över dörrlistans grundvy, och behålls
 * därför i stället för att rivas med växeln (motsatt val mot TASK-299.11:s
 * ytor, som bar egna axe-tester att flytta assertionen till).
 */
test.describe('Dörrlistan — husets delade sidram (TASK-299.6)', () => {
  test('axe 0 violations med den promoverade sidramen synlig', async ({ page, network }) => {
    mockaLasning(network);
    await page.goto(`/event/${EVENT_ID}/narvaro`);
    await expect(page.getByRole('heading', { level: 1, name: 'Check-in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till eventet' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
