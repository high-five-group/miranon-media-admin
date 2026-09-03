import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationDetailSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-368.5 — "Boka om till annat event" på anmälans sida: eventväljaren, det
 * automatiskt ifyllda skälet, väntelistepåminnelsen, landningen på den NYA
 * anmälans sida och prisskillnaden i kvittot.
 *
 * FÖRLAGA: `anmalan-avbokning.acceptance.test.ts` (TASK-368.3) — samma sida,
 * samma hermetiska fixturvärld, samma `EF(namn)`/`json(...)`-mönster och samma
 * TILLSTÅNDSBÄRANDE mock-form. Egen fil av samma skäl som den var det: den
 * filen bevisar avbokningens handling, denna bevisar ombokningens, och de har
 * olika fixturvärldar (ombokningen behöver TVÅ anmälningar och TRE event).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SOM BEVISAS EXTERNT — OCH VAD SOM INTE GÅR ATT BEVISA HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Klassens regel (`acceptance-bas.ts`): externt beteende, aldrig att en
 * handler anropades. Ombokningens väg genom systemet bevisas därför DÄR LOTTA
 * SER DEN — mocken speglar serverns kontrakt (ny anmälan, statusbyte på den
 * gamla, Notering-append per `_shared/rebook-registration.ts`
 * § `byggOmbokningsrad`), och testerna asserterar den NYA anmälans sida med
 * dess kvitto samt den gamlas status och notering. Payload-fångsten står vid
 * sidan av, av samma skäl som förlagans `cancelCalls`: den prövar KONTRAKTET
 * (att klienten skickar exakt `registrationId` + `nyttEventId` och ingenting
 * annat — `RebookRegistrationInput`s hela yta), vilket ingen annan yta visar.
 *
 * PRISSKILLNADEN PRÖVAS EFTER BEKRÄFTELSEN, inte före — och det är en MÄTT
 * gräns, inte en lucka i testet. Kortets AC #3 vill ha beloppet i båda lägena,
 * men ingen klient-läsbar yta bär eventets pris: `get-event`/`get-events`
 * returnerar inget prisfält (`_shared/event-map.ts`, `Event.schema.ts`,
 * disk-verifierat 2026-09-03) och `rebook-registration` har inget
 * torrkörningsläge. Steget säger därför vad som händer med pengarna, och
 * kvittot säger beloppet. Se `OmbokningsSteg` § PRISSKILLNADEN.
 *
 * SKÄLET PRÖVAS SOM TEXT, INTE SOM FÄLT, av samma sort av skäl: serverns
 * `RebookRegistrationInput` bär inget `skal` (TASK-368.4, medvetet — se
 * `rebook-registration/index.ts`), så ett redigerbart fält hade tagit emot
 * text och kastat den. Testet asserterar att förhandsvisningen står där OCH
 * att steget inte bär något textfält alls.
 *
 * BETALNINGSKNAPPEN I KVITTOT SAKNAR TÄCKNING, samma öppna läge som förlagans
 * betalläge: `playwright.config.ts` sätter `VITE_FEATURE_BETALNINGAR: 'av'`
 * för hela acceptance-webServern, så Betalningar-gruppen monteras aldrig och
 * det finns ingen trigger att rulla till. PRISSKILLNADSTEXTEN är oflaggad och
 * prövas i full bredd.
 *
 * `rebook-registration` SKRIVER INTE SKARPT: anropet är avlyssnat.
 * Serverkontraktet (övergångarna, adoptionsvillkoret, flytten av
 * inbetalningar, idempotensen) bor i TASK-368.4:s egna tester.
 */

const EVENT_FRAN = 'recOMBOKFRAN0001';
const EVENT_SAMMA = 'recOMBOKSAMMA001';
const EVENT_DYRARE = 'recOMBOKDYRARE01';
const EVENT_BILLIGARE = 'recOMBOKBILLIG01';

const ANNA = 'recOmbokAnna';
/** Andra exemplaret av samma person — axe-testet behöver en OANVÄND anmälan per bredd. */
const ANNA_TVA = 'recOmbokAnna2';
const NY_ANMALAN = 'recOmbokAnnaNy';

type DetaljRow = z.infer<typeof RegistrationDetailSchema>;
type EventRow = z.infer<typeof EventSchema>;
type RebookBody = { registrationId: string; nyttEventId: string };

/** Serverns svarsform per `RebookRegistrationResultSchema` — de fält appen läser. */
type RebookSvar = {
  prisskillnad: number | null;
  nyttPris: number | null;
  summaNyAnmalan: number;
  aterupptaget?: boolean;
};

function event(overrides: Partial<EventRow> & Pick<EventRow, 'id'>): EventRow {
  return {
    eventlabel: 'Skövde 26-27 sep',
    eventNamn: 'Utbildning Skövde',
    typ: 'Utbildning - 2 dagar',
    ort: 'Skövde',
    // FROZEN_NOW är 2026-09-15 (`fixture-data.ts`), så samtliga datum nedan
    // ligger i FRAMTIDEN och väljaren visar dem: `EventValjare`s default-
    // omfattning är `'kommande'` (`dateValue(e) >= idagStart`), och ett
    // passerat datum hade gjort raden osynlig utan att något fällde.
    startdatum: '2026-10-10',
    slutdatum: '2026-10-11',
    tidKvarTillEvent: '25 dagar',
    maxPlatser: 12,
    antalAnmalda: 8,
    platserKvar: 4,
    anmaldBelaggning: 0.67,
    bekraftadBelaggning: 0.5,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 4,
    antalSlutbetalningar: 2,
    antalSlutbetalningFelande: 1,
    status: 'Planerat',
    ...overrides,
  };
}

const EVENT_LISTA: EventRow[] = [
  event({ id: EVENT_FRAN, eventNamn: 'Resor i medvetandet 2', startdatum: '2026-10-01' }),
  event({ id: EVENT_SAMMA, eventNamn: 'Resor i medvetandet 3', startdatum: '2026-11-05' }),
  event({ id: EVENT_DYRARE, eventNamn: 'Fjärrskådning steg 2', startdatum: '2026-11-20' }),
  event({ id: EVENT_BILLIGARE, eventNamn: 'Introduktionskväll', startdatum: '2026-12-02' }),
];

/** Bekräftad anmälan med en befintlig notering (så appendet syns som append). */
function detalj(overrides: Partial<DetaljRow> = {}): DetaljRow {
  return {
    id: ANNA,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna.andersson@example.se',
    telefon: '070-123 45 67',
    eventNamn: 'Resor i medvetandet 2',
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-30T12:32:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: 'Vill sitta nära dörren.',
    eventId: EVENT_FRAN,
    personId: 'recPersonOmbok01',
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: '2026-07-01T07:15:00.000Z',
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: 1,
    borOver: false,
    erfarenhetsbadge: null,
    kurshistorik: null,
    anmalanId: 247,
    franFormular: 'Huvudformulär',
    franFormularId: 'selQyiMaRVXuu7Nm5',
    fragorFunderingar: null,
    villkorOk: true,
    eventTyp: 'Utbildning',
    eventOrt: 'Skövde',
    startdatum: '2026-10-01',
    slutdatum: '2026-10-02',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-31',
    deadlineSlutbetalning: '2026-09-27',
    dagarKvarTillDeadline: 3,
    plusOneForfraganSkickad: null,
    medfoljandeTillNamn: null,
    plusEttor: [],
    sidUrl: null,
    utm: null,
    ...overrides,
  };
}

/**
 * TILLSTÅNDSBÄRANDE mock (förlagans mönster): `rebook-registration` SKAPAR den
 * nya anmälans detalj, sätter den gamlas status och SPEGLAR serverns
 * Notering-append (`_shared/rebook-registration.ts` § `byggOmbokningsrad`:
 * `[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event>, <datum>`). Utan speglingen
 * hade beviset för skälet fallit tillbaka på payloaden ensam.
 *
 * `vantelistaPerEvent` speglar `get-event`s `vantelista` — antalet AKTIVA
 * väntelisteplatser på eventet. Handlern läser `?id=` så olika event kan bära
 * olika tal i samma test.
 */
function mocka(
  network: NetworkFixture,
  {
    detaljer,
    svar,
    vantelistaPerEvent = {},
    avvisaMed = null,
    nyAnmalanPlusEttor = [],
  }: {
    detaljer: DetaljRow[];
    svar?: RebookSvar;
    vantelistaPerEvent?: Record<string, number>;
    avvisaMed?: { status: number; body: Record<string, unknown> } | null;
    /**
     * +1-relationer på den NYA anmälan. Ger dess sida en klient-sidig
     * `PersonMiniKort`-länk till en annan anmälan — den enda vägen mellan två
     * anmälningar som INTE laddar om appen, och därmed en förutsättning för
     * att kunna pröva varm målcache i samma app-instans.
     */
    nyAnmalanPlusEttor?: DetaljRow['plusEttor'];
  },
): { rebookCalls: RebookBody[] } {
  const rebookCalls: RebookBody[] = [];
  const perId = new Map(detaljer.map((d) => [d.id, d]));

  network.use(
    // Anmälans route hämtar listan för sin placeholder-seedning; tom är rätt
    // svar här — testerna djuplänkar och ska se detaljhämtningens data.
    http.get(EF('get-registrations'), () => json({ registrations: [] })),
    http.get(EF('get-registration'), ({ request }) => {
      const id = new URL(request.url).searchParams.get('id');
      const hit = id ? perId.get(id) : undefined;
      return hit ? json({ registration: hit }) : json({ error: 'Not found' }, 404);
    }),
    // Eventväljarens datakälla (`queryKeys.events.list`).
    http.get(EF('get-events'), () => json({ events: EVENT_LISTA })),
    // Väntelistepåminnelsens datakälla. Talet UTELÄMNAS när eventet inte står
    // i kartan — `vantelista` är `optional` i schemat, och komponenten ska då
    // vara tyst i stället för att påstå noll.
    http.get(EF('get-event'), ({ request }) => {
      const id = new URL(request.url).searchParams.get('id') ?? EVENT_FRAN;
      const rad = EVENT_LISTA.find((e) => e.id === id) ?? EVENT_LISTA[0];
      const antal = vantelistaPerEvent[id];
      return json({ event: antal === undefined ? rad : { ...rad, vantelista: antal } });
    }),
    http.post(EF('rebook-registration'), async ({ request }) => {
      const body = (await request.json()) as RebookBody;
      rebookCalls.push(body);

      if (avvisaMed !== null) {
        return json({ ...avvisaMed.body, requestId: 'req-test-rebook' }, avvisaMed.status);
      }

      const gammal = perId.get(body.registrationId);
      if (!gammal) return json({ error: 'Not found' }, 404);

      const malEvent = EVENT_LISTA.find((e) => e.id === body.nyttEventId);
      const rad = `[Ombokad 2026-09-15 av Test Testsson] till ${malEvent?.eventNamn}, ${malEvent?.startdatum}`;
      const notering = gammal.notering ? `${gammal.notering}\n${rad}` : rad;

      perId.set(body.registrationId, { ...gammal, status: 'Avbokad/Ombokad', notering });
      perId.set(NY_ANMALAN, {
        ...gammal,
        id: NY_ANMALAN,
        anmalanId: 248,
        status: 'Obekräftad',
        bekraftelseSkickad: null,
        notering: null,
        plusEttor: nyAnmalanPlusEttor,
        eventId: body.nyttEventId,
        eventNamn: malEvent?.eventNamn ?? null,
        startdatum: malEvent?.startdatum ?? null,
        slutdatum: malEvent?.slutdatum ?? null,
      });

      return json({
        gammalAnmalanId: body.registrationId,
        nyAnmalanId: NY_ANMALAN,
        nyAnmalanSkapad: !(svar?.aterupptaget ?? false),
        aterupptaget: svar?.aterupptaget ?? false,
        nyttEventId: body.nyttEventId,
        status: 'Avbokad/Ombokad',
        notering,
        flyttadeRader: 1,
        flyttadSumma: svar?.summaNyAnmalan ?? 0,
        summaNyAnmalan: svar?.summaNyAnmalan ?? 0,
        nyttPris: svar?.nyttPris ?? null,
        prisskillnad: svar?.prisskillnad ?? null,
        // `skal` är OBLIGATORISKT i `SpegelUtfallSchema` (nullable, inte
        // optional). Utan nyckeln kastar adapterns `.parse()` och mutationen
        // faller — vilket den gjorde i första körningen, och är precis den
        // form-bindning `acceptance-bas.ts` § "parsningen binder fixtur →
        // schema" beskriver.
        spegelGammal: { skrivet: true, forsok: 1, skal: null },
        spegelNy: { skrivet: true, forsok: 1, skal: null },
      });
    }),
  );

  return { rebookCalls };
}

const AVBOKA_KNAPP = { name: 'Avboka anmälan' } as const;
const BOKA_OM_KNAPP = { name: 'Boka om till annat event' } as const;
const BEKRAFTA_KNAPP = { name: 'Boka om anmälan' } as const;
const STEG_NAMN = { name: 'Boka om anmälan för Anna Andersson till ett annat event' } as const;

/** Öppnar avbokningssteget och växlar till ombokningsvyn. */
async function oppnaOmbokningen(page: import('./acceptance-bas').Page, anmalan: string = ANNA) {
  await page.goto(`/event/${EVENT_FRAN}/anmalan/${anmalan}`);
  await page.getByRole('button', AVBOKA_KNAPP).click();
  await page.getByRole('button', BOKA_OM_KNAPP).click();
  const steg = page.getByRole('group', STEG_NAMN);
  await expect(steg).toBeVisible();
  return steg;
}

/** Väljer ett event i husets eventväljare (popover + lista). */
async function valjEvent(page: import('./acceptance-bas').Page, namn: string) {
  await page.getByRole('button', { name: 'Välj event' }).click();
  await page.getByRole('option', { name: new RegExp(namn) }).click();
}

test.describe('Boka om till annat event (TASK-368.5)', () => {
  test('valet är TREDJE knappen i avbokningssteget och ersätter avbokningsformen', async ({
    page,
    network,
  }) => {
    mocka(network, { detaljer: [detalj()] });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);

    await page.getByRole('button', AVBOKA_KNAPP).click();
    const avbokningssteget = page.getByRole('group', {
      name: 'Avboka anmälan för Anna Andersson',
    });

    // Ordningen är låst: Avbryt först (APG:s minst destruktiva väg närmast),
    // den destruktiva näst, alternativet SIST.
    const knappar = avbokningssteget.getByRole('button');
    await expect(knappar.nth(0)).toHaveText('Avbryt');
    await expect(knappar.nth(1)).toHaveText('Avboka anmälan');
    await expect(knappar.nth(2)).toHaveText('Boka om till annat event');

    await page.getByRole('button', BOKA_OM_KNAPP).click();

    // Vyerna ERSÄTTER varandra: avbokningens skälfält och dess knapp är borta.
    await expect(page.getByRole('group', STEG_NAMN)).toBeVisible();
    await expect(avbokningssteget).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Skäl (frivilligt)' })).toHaveCount(0);
  });

  test('skälet står i klartext som serverns EGEN rad, och steget bär inget textfält', async ({
    page,
    network,
  }) => {
    mocka(network, { detaljer: [detalj()] });
    const steg = await oppnaOmbokningen(page);

    // Före valet finns ingen skälrad — det finns inget event att peka på.
    await expect(steg).not.toContainText('Ombokad till');

    await valjEvent(page, 'Resor i medvetandet 3');

    // EXAKT serverns mål-del (`byggOmbokningsmal`): namn + ISO-datum.
    await expect(steg).toContainText('Ombokad till Resor i medvetandet 3, 2026-11-05');
    await expect(steg).toContainText('Skälet fylls i automatiskt');

    // AC #2 säger "(redigerbart)". Serverkontraktet tillåter det inte
    // (TASK-368.4 § INGET `skal`-FÄLT), så steget bär medvetet INGET fält —
    // ett som tog emot text och kastade den vore värre än inget.
    await expect(steg.getByRole('textbox')).toHaveCount(0);
  });

  test('samma pris: kvittot på den NYA anmälans sida säger det rakt ut', async ({
    page,
    network,
  }) => {
    const { rebookCalls } = mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    // LANDNINGEN: URL:en är den NYA anmälans, på det NYA eventet (AC #2).
    await expect(page).toHaveURL(`/event/${EVENT_SAMMA}/anmalan/${NY_ANMALAN}`);

    const kvitto = page.getByTestId('ombokningskvitto');
    await expect(kvitto).toBeVisible();
    await expect(kvitto).toContainText('Anmälan är ombokad till Resor i medvetandet 3');
    await expect(kvitto).toContainText('2 500 kr sitter nu på den här anmälan.');
    await expect(kvitto).toContainText('Nya eventet kostar 2 500 kr, samma pris.');

    // Ingen betalningsväg vid jämnt pris.
    await expect(kvitto.getByRole('button', { name: 'Registrera betalning' })).toHaveCount(0);
    await expect(kvitto.getByRole('button', { name: 'Registrera återbetalning' })).toHaveCount(0);

    // AVBOKNINGSGRUPPEN ÄR I SITT VILOLÄGE PÅ DEN NYA ANMÄLAN (review #2267
    // runda 1). Navigeringen går till SAMMA route-mönster med bara nya
    // param-värden, och ett param-byte remountar inte komponenten
    // (`OmbokningsKvitto` § HÄRLETT VID VARJE RENDER, mätt i denna svit). Utan
    // en identitetsbunden nollställning hade `AvbokningsYta`s `oppen`/`vy` och
    // `OmbokningsSteg`s `nyttEventId` överlevt hit — Lotta hade landat på den
    // NYA anmälan med ombokningsformuläret öppet och det FÖREGÅENDE målet
    // ifyllt, ett tryck från att boka om den nyss skapade anmälan.
    await expect(page.getByRole('group', STEG_NAMN)).toHaveCount(0);
    await expect(page.getByRole('group', { name: /^Avboka anmälan för/ })).toHaveCount(0);
    await expect(page.getByRole('button', BEKRAFTA_KNAPP)).toHaveCount(0);
    // Gruppen finns kvar i sitt STÄNGDA läge — den nya anmälan är aktiv.
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeVisible();

    // Kontraktet: EXAKT de två ID:na, ingenting annat (`RebookRegistrationInput`).
    expect(rebookCalls).toEqual([{ registrationId: ANNA, nyttEventId: EVENT_SAMMA }]);
  });

  /**
   * REGRESSIONSVAKT, review `#2267` runda 2 — det ENDA läge där kvarhängande
   * steg-state faktiskt kan uppstå, och därför det enda som bevisar något.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * VARFÖR DE ANDRA FALLEN INTE RÄCKER
   * ═══════════════════════════════════════════════════════════════════════
   * Ingenting i routern remountar på ett param-byte: `MatchInner`s `key`
   * härleds UTESLUTANDE ur `route.options.remountDeps ??
   * router.options.defaultRemountDeps` (källäst i
   * `node_modules/@tanstack/react-router/dist/esm/Match.js` 1.170.21, rad
   * 75-95), och varken routern eller anmälans route sätter någon av dem
   * (`grep -rn remountDeps src/` → noll träffar). En tidigare version av denna
   * fil påstod motsatsen; påståendet var fel och är rättat.
   *
   * Det som FAKTISKT nollställer `AvbokningsYta` i normalfallet är
   * `AnmalanDetail`s `isPending`-gren: vid cache-miss byts hela grenen mot en
   * skeleton och ytan avmonteras som bieffekt. Den maskeringen försvinner så
   * fort mål-anmälans detalj REDAN ligger i cachen vid landningen — och med
   * persist-lagret (`ADR-072`, `staleTime` 5 min) är det inget kantfall.
   *
   * ═══════════════════════════════════════════════════════════════════════
   * VILLKOREN SOM MÅSTE HÅLLA SAMTIDIGT — OCH VARFÖR `page.goto` FÖRSTÖR DEM
   * ═══════════════════════════════════════════════════════════════════════
   *   1. mål-anmälans detalj är VARM när ombokningen landar, OCH
   *   2. `AvbokningsYta`-instansen som utför ombokningen har levt i SAMMA
   *      app-instans hela vägen fram.
   *
   * En `page.goto` mellan stegen laddar om appen och river varje
   * komponentinstans — då startar den kritiska övergången alltid från en
   * frisk mount, och testet kan aldrig se läckan. Källsidan nås därför via
   * appens EGEN länk (`PersonMiniKort` för `plusEttor`), alltså en
   * klient-sidig navigering.
   */
  test('varm målcache i samma app-instans: steget står INTE kvar öppet', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj(), detalj({ id: ANNA_TVA, anmalanId: 249 })],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500 },
      // Den nya anmälan bär en +1-relation till ANNA_TVA, så dess sida får en
      // klient-sidig länk dit. Utan den finns ingen väg mellan två anmälningar
      // som inte går via en omladdning.
      nyAnmalanPlusEttor: [{ id: ANNA_TVA, namn: 'Anna Andersson' }],
    });

    // ── Steg 1: ombokning 1 värmer `registrations.detail(NY_ANMALAN)` ──
    const forsta = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await forsta.getByRole('button', BEKRAFTA_KNAPP).click();
    await expect(page).toHaveURL(`/event/${EVENT_SAMMA}/anmalan/${NY_ANMALAN}`);
    await expect(page.getByTestId('ombokningskvitto')).toBeVisible();

    // ── Steg 2: KLIENT-SIDIGT till källsidan — ingen omladdning ──
    await page.getByRole('link', { name: /Medföljande/ }).click();
    await expect(page).toHaveURL(`/event/${EVENT_SAMMA}/anmalan/${ANNA_TVA}`);
    await expect(page.getByText('Anmälan #249')).toBeVisible();

    // ── Steg 3: ombokning 2 mot det NU VARMA målet, i samma app-instans ──
    await page.getByRole('button', AVBOKA_KNAPP).click();
    await page.getByRole('button', BOKA_OM_KNAPP).click();
    const andra = page.getByRole('group', STEG_NAMN);
    await expect(andra).toBeVisible();
    await valjEvent(page, 'Resor i medvetandet 3');
    await andra.getByRole('button', BEKRAFTA_KNAPP).click();
    await expect(page).toHaveURL(`/event/${EVENT_SAMMA}/anmalan/${NY_ANMALAN}`);

    // ── Invarianten: steget är stängt, oavsett cache-timing ──
    await expect(page.getByTestId('ombokningskvitto')).toBeVisible();
    await expect(page.getByRole('group', STEG_NAMN)).toHaveCount(0);
    await expect(page.getByRole('button', BEKRAFTA_KNAPP)).toHaveCount(0);
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeVisible();
  });

  /**
   * Samma felklass som ovan, prövad på det state som är LÄSBART utifrån:
   * avbokningsvyns fritextskäl. Överlever det navigeringen bär `AvbokningsYta`
   * med sig sitt tillstånd till en annan anmälan — och då gäller det `oppen`,
   * `vy` och `OmbokningsSteg`s valda event lika mycket, eftersom allt sitter i
   * samma komponentinstans.
   *
   * Detta är den DIREKTA mätningen av granskarens hypotes: skältexten är den
   * enda av de fyra tillstånden som går att observera genom UI:t utan ett
   * instrument i produktionskoden.
   */
  test('inget steg-tillstånd läcker mellan anmälningar över en ombokning', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500 },
    });

    // Skriv i avbokningsvyns skälfält, byt sedan till ombokningen och bekräfta.
    await page.goto(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await page.getByRole('button', AVBOKA_KNAPP).click();
    await page
      .getByRole('group', { name: 'Avboka anmälan för Anna Andersson' })
      .getByRole('textbox', { name: 'Skäl (frivilligt)' })
      .fill('Detta får aldrig följa med till en annan anmälan.');

    await page.getByRole('button', BOKA_OM_KNAPP).click();
    const steg = page.getByRole('group', STEG_NAMN);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();
    await expect(page).toHaveURL(`/event/${EVENT_SAMMA}/anmalan/${NY_ANMALAN}`);

    // På den NYA anmälan: öppna avbokningssteget och läs fältet. Ett kvarhängande
    // skäl vore samma läcka som ett kvarhängande ombokningsval.
    await page.getByRole('button', AVBOKA_KNAPP).click();
    const nyttSteg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await expect(nyttSteg.getByRole('textbox', { name: 'Skäl (frivilligt)' })).toHaveValue('');

    // Och ombokningsvyn börjar från noll — inget förvalt event.
    await page.getByRole('button', BOKA_OM_KNAPP).click();
    const nyttOmbokningssteg = page.getByRole('group', STEG_NAMN);
    await expect(nyttOmbokningssteg).not.toContainText('Ombokad till');
    await expect(nyttOmbokningssteg.getByRole('button', BEKRAFTA_KNAPP)).toBeDisabled();
  });

  test('dyrare event: kvittot säger att beloppet saknas', async ({ page, network }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 3200, prisskillnad: 700, summaNyAnmalan: 2500 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Fjärrskådning steg 2');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    await expect(page).toHaveURL(`/event/${EVENT_DYRARE}/anmalan/${NY_ANMALAN}`);
    const kvitto = page.getByTestId('ombokningskvitto');
    await expect(kvitto).toContainText('2 500 kr sitter nu på den här anmälan.');
    await expect(kvitto).toContainText('Nya eventet kostar 3 200 kr, 700 kr saknas');
  });

  test('billigare event: kvittot säger att beloppet blir att återbetala', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 1800, prisskillnad: -700, summaNyAnmalan: 2500 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Introduktionskväll');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    await expect(page).toHaveURL(`/event/${EVENT_BILLIGARE}/anmalan/${NY_ANMALAN}`);
    const kvitto = page.getByTestId('ombokningskvitto');
    await expect(kvitto).toContainText('Nya eventet kostar 1 800 kr, 700 kr blir att återbetala.');
  });

  test('okänt pris påstås aldrig vara "samma pris"', async ({ page, network }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: null, prisskillnad: null, summaNyAnmalan: 0 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    const kvitto = page.getByTestId('ombokningskvitto');
    await expect(kvitto).toContainText('Inga inbetalningar följde med');
    await expect(kvitto).toContainText('går inte att räkna ut');
    await expect(kvitto).not.toContainText('samma pris');
  });

  test('den GAMLA anmälan blir Avbokad/Ombokad med skälet i noteringen', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();
    await expect(page.getByTestId('ombokningskvitto')).toBeVisible();

    // Tillbaka till den gamla anmälan: statusen är bytt och skälet står som
    // datumstämplad rad APPENDAD efter den befintliga texten.
    //
    // BAKÅT, INTE `page.goto` — och det är en MÄTT skillnad, inte en smaksak.
    // `goBack` är Lottas egen väg tillbaka och en client-side-navigering, så
    // den prövar det mutationen faktiskt lovar: cache-patchen
    // (`anmalan-detaljcache.ts`) plus invalideringen. En full omladdning hade
    // i stället prövat PERSIST-lagrets throttle-synk (~1 s,
    // `src/queries/persist.ts`) och blivit en tävling mellan reloaden och
    // skrivningen till localStorage — grön eller röd beroende på timing, och
    // därmed värdelös som bevis. Reload-fallet är oförändrat ett känt fönster
    // och bokfört i `anmalan-detaljcache.ts`s huvud.
    await page.goBack();
    await expect(page).toHaveURL(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await expect(page.locator('header').getByText('Avbokad/Ombokad')).toBeVisible();
    const noteringar = page.locator('section[aria-labelledby="grupp-noteringar"]');
    await expect(noteringar).toContainText('Vill sitta nära dörren.');
    await expect(noteringar).toContainText(
      '[Ombokad 2026-09-15 av Test Testsson] till Resor i medvetandet 3, 2026-11-05',
    );
  });

  test('kvittot står bara på SIN anmälan och försvinner när det stängs', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500 },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    const kvitto = page.getByTestId('ombokningskvitto');
    await expect(kvitto).toBeVisible();
    await page.getByRole('button', { name: 'Stäng meddelande' }).click();
    await expect(kvitto).toHaveCount(0);

    // Den GAMLA anmälans sida bär aldrig den nyas kvitto.
    await page.goto(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await expect(page.getByTestId('ombokningskvitto')).toHaveCount(0);
  });

  test('omkörning: kvittot säger att ingenting ändrades', async ({ page, network }) => {
    mocka(network, {
      detaljer: [detalj()],
      svar: { nyttPris: 2500, prisskillnad: 0, summaNyAnmalan: 2500, aterupptaget: true },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    const kvitto = page.getByTestId('ombokningskvitto');
    // Summan är TILLSTÅNDET (`summaNyAnmalan`), inte anropets räknare — en
    // omkörning flyttar noll rader men pengarna sitter kvar rätt.
    await expect(kvitto).toContainText('2 500 kr sitter nu på den här anmälan.');
    await expect(kvitto).toContainText('Ombokningen var redan gjord sedan tidigare.');
  });

  test('väntelistepåminnelsen visas med väntande och är TYST utan', async ({ page, network }) => {
    mocka(network, {
      detaljer: [detalj()],
      vantelistaPerEvent: { [EVENT_FRAN]: 3 },
    });

    // MED väntande: talet plus länken, i BÅDA bekräftelsestegen.
    await page.goto(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await page.getByRole('button', AVBOKA_KNAPP).click();
    const avbokningssteget = page.getByRole('group', {
      name: 'Avboka anmälan för Anna Andersson',
    });
    await expect(avbokningssteget).toContainText('3 personer väntar på plats.');
    await expect(avbokningssteget.getByRole('link', { name: 'Öppna väntelistan' })).toHaveAttribute(
      'href',
      '/mer/vantelista',
    );

    await page.getByRole('button', BOKA_OM_KNAPP).click();
    await expect(page.getByRole('group', STEG_NAMN)).toContainText('3 personer väntar på plats.');
  });

  test('utan väntande påstås aldrig "0 personer väntar"', async ({ page, network }) => {
    mocka(network, { detaljer: [detalj()], vantelistaPerEvent: { [EVENT_FRAN]: 0 } });

    await page.goto(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await page.getByRole('button', AVBOKA_KNAPP).click();
    const steg = page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await expect(steg).toBeVisible();
    await expect(steg).not.toContainText('väntar på plats');
    await expect(steg.getByRole('link', { name: 'Öppna väntelistan' })).toHaveCount(0);
  });

  test('serverfel 409: begriplig text, ingen navigering, steget kvar med sitt val', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      avvisaMed: {
        status: 409,
        body: {
          error: 'Personen är redan anmäld på det eventet.',
          code: 'redan_anmald_pa_malet',
        },
      },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    const fel = page.getByRole('alert');
    await expect(fel).toBeVisible();
    await expect(fel).toContainText('Personen är redan anmäld på det eventet.');
    await expect(fel).toContainText('Anmälan är oförändrad.');
    await expect(fel).not.toContainText('Edge Function');
    await expect(fel).not.toContainText('requestId');

    // Ingen navigering, och valet står kvar så Lotta kan byta event i stället.
    await expect(page).toHaveURL(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
    await expect(steg).toContainText('Ombokad till Resor i medvetandet 3, 2026-11-05');
  });

  test('steg-märkt 500: serverns egen mening om VAD som hann hända visas', async ({
    page,
    network,
  }) => {
    mocka(network, {
      detaljer: [detalj()],
      avvisaMed: {
        status: 500,
        body: {
          error:
            'Pengarna flyttades till den nya anmälan, men den gamla kunde inte avbokas. Kör ombokningen igen.',
          code: 'steg_fel',
          steg: 'statusbyte',
        },
      },
    });

    const steg = await oppnaOmbokningen(page);
    await valjEvent(page, 'Resor i medvetandet 3');
    await steg.getByRole('button', BEKRAFTA_KNAPP).click();

    // 5xx retryas av båda lagren (`acceptance-bas.ts` § TIDEN HÖR TILL
    // KONTRAKTET): ~7-8 s ren backoff innan felytan finns. Timeouten är räknad
    // ur de konstanterna, inte gissad.
    const fel = page.getByRole('alert');
    await expect(fel).toContainText('men den gamla kunde inte avbokas', { timeout: 15_000 });
    await expect(page).toHaveURL(`/event/${EVENT_FRAN}/anmalan/${ANNA}`);
  });

  test('Avbryt och Escape stänger ombokningen utan att röra anmälan', async ({ page, network }) => {
    const { rebookCalls } = mocka(network, { detaljer: [detalj()] });

    const steg = await oppnaOmbokningen(page);
    await steg.getByRole('button', { name: 'Avbryt' }).click();
    await expect(steg).toHaveCount(0);
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeFocused();

    // Nästa öppning börjar i AVBOKNINGSVYN, inte där hon var sist.
    await page.getByRole('button', AVBOKA_KNAPP).click();
    await expect(
      page.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' }),
    ).toBeVisible();

    await page.getByRole('button', BOKA_OM_KNAPP).click();
    await expect(page.getByRole('group', STEG_NAMN)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('group', STEG_NAMN)).toHaveCount(0);
    await expect(page.getByRole('button', AVBOKA_KNAPP)).toBeFocused();

    await expect(page.locator('header').getByText('Bekräftad', { exact: true })).toBeVisible();
    expect(rebookCalls).toEqual([]);
  });

  test('bekräftelsen är avstängd tills ett event är valt', async ({ page, network }) => {
    mocka(network, { detaljer: [detalj()] });
    const steg = await oppnaOmbokningen(page);

    await expect(steg.getByRole('button', BEKRAFTA_KNAPP)).toBeDisabled();
    await valjEvent(page, 'Resor i medvetandet 3');
    await expect(steg.getByRole('button', BEKRAFTA_KNAPP)).toBeEnabled();
  });

  test('axe 0 violations i ombokningssteget och i kvittot, desktop och iPad-bredd', async ({
    page,
    network,
  }) => {
    mocka(network, {
      // EN ANMÄLAN PER BREDD, och det är inte kosmetik: mocken är
      // TILLSTÅNDSBÄRANDE, så anmälan som bokades om i första varvet står som
      // "Avbokad/Ombokad" i det andra och bär då "Återta avbokning" i stället
      // för "Avboka anmälan". Att återanvända samma id hade gjort andra varvet
      // rött av fel skäl (mätt 2026-09-03: timeout på triggerknappen).
      detaljer: [detalj(), detalj({ id: ANNA_TVA, anmalanId: 249 })],
      svar: { nyttPris: 3200, prisskillnad: 700, summaNyAnmalan: 2500 },
      vantelistaPerEvent: { [EVENT_FRAN]: 3 },
    });

    for (const [bredd, anmalan] of [
      [1280, ANNA],
      [768, ANNA_TVA],
    ] as const) {
      await page.setViewportSize({ width: bredd, height: 1024 });

      // Läge 1: ombokningssteget öppet med ett valt event (skälraden,
      // väntelistepåminnelsen och knappraden är det som är nytt).
      const steg = await oppnaOmbokningen(page, anmalan);
      await valjEvent(page, 'Fjärrskådning steg 2');
      await expect(steg).toContainText('Ombokad till Fjärrskådning steg 2');
      const oppetSteg = await new AxeBuilder({ page }).analyze();
      expect(oppetSteg.violations).toEqual([]);

      // Läge 2: den nya anmälans sida med kvittot.
      await steg.getByRole('button', BEKRAFTA_KNAPP).click();
      await expect(page.getByTestId('ombokningskvitto')).toBeVisible();
      const medKvitto = await new AxeBuilder({ page }).analyze();
      expect(medKvitto.violations).toEqual([]);
    }
  });
});
