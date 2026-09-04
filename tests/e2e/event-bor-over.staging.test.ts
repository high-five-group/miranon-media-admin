import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.7 — Bor över: summeringsraden + KRYSS-LÄGET (S73-facit K50/K52).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations och
 * update-record — samma split som 18.1/18.4/18.8: SERVER-kontraktet
 * (`Bor över`-fältets läs-mappning, operationens allowlist och teardown) bevisas
 * av `tests/api/*.staging.test.ts` mot skarp staging; dessa e2e bevisar
 * KLIENTENS form och beteende flak-fritt utan delad staging-data.
 *
 * Täckning (AC #2): raden med HÄRLETT antal, näst SIST i summeringen (under
 * Avbokade sedan TASK-145.2) · kryss-läget i EN kolumn med ALLA anmälda
 * (även urkryssade) · ikryssade överst · STABIL ordning under markeringen
 * (raderna hoppar inte under fingret) · live-räknaren · write-operationens
 * payload · axe 0.
 *
 * RADUPPSÄTTNINGEN UPPDATERAD (TASK-145.2, E2E-disciplinen — "uppdatera
 * assertioner som prövar den yta du medvetet ändrat"): de fem gamla
 * summeringsraderna (Obekräftade anmälningar/Anmälningsbekräftelse skickad/
 * Betalningspåminnelse skickad/Deltagarinfo skickad/Bor över) är ersatta av de
 * sju facit-låsta raderna (grillad samsyn beslut 2, S93 Del 3) — Väntar på
 * bekräftelse/Anmälningsavgifter/Slutbetalningar/Klara/Deltagarinfo skickad/
 * Bor över/Avbokade. Bor över-RADENS EGEN form (term, ikon, klick →
 * kryss-läget, härlett antal) är ORÖRD — bara dess plats i raduppsättningen
 * och de rader som omger den har ändrats.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const EVENT_ID = 'recBOROVER000001';

function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type Json = Record<string, unknown>;

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: omDagar(60),
    slutdatum: omDagar(61),
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 4,
    platserKvar: 8,
    anmaldBelaggning: 0.33,
    bekraftadBelaggning: 0.17,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 2,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 4,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 1,
    viaFormular: 2,
    medfoljande: 1,
    vantelista: 0,
    ...overrides,
  };
}

function registrering(overrides: Json): Json {
  return {
    id: 'recX',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: null,
    telefon: null,
    eventNamn: 'Resor i medvetandet 1',
    ort: 'Skövde',
    status: 'Obekräftad',
    flagga: null,
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: null,
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_ID,
    personId: null,
    kalla: null,
    medfoljandeTill: null,
    bekraftelseSkickad: null,
    deltagarinfoSkickad: null,
    antalGenomfordaEvent: null,
    borOver: false,
    ...overrides,
  };
}

/**
 * Fyra AKTIVA anmälningar (data-ordning Anna → Bertil → Cecilia → David) + en
 * avbokad som ska räknas bort överallt. David bor över från start — han är
 * SIST i data-ordningen, så "ikryssade överst" kan inte bli sant av en slump.
 */
const DELTAGARE: Json[] = [
  registrering({ id: 'recAnna', namn: 'Anna Ek', inskickad: '2026-07-01T09:00:00.000Z' }),
  registrering({
    id: 'recBertil',
    namn: 'Bertil Sund',
    inskickad: '2026-06-20T09:00:00.000Z',
    kalla: 'Manuell',
  }),
  registrering({
    id: 'recCecilia',
    namn: 'Cecilia Lund',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-07-05T09:00:00.000Z',
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
  }),
  registrering({
    id: 'recDavid',
    namn: 'David Nord',
    status: 'Bekräftad (mail skickat)',
    inskickad: '2026-06-25T09:00:00.000Z',
    kalla: '+1',
    bekraftelseSkickad: '2026-06-26T09:00:00.000Z',
    borOver: true,
  }),
  registrering({
    id: 'recEva',
    namn: 'Eva Sten',
    status: 'Avbokad/Ombokad',
    inskickad: '2026-06-10T09:00:00.000Z',
    borOver: true,
  }),
];

/** Skrivningar update-record tagit emot under testet (payload-beviset). */
type Skrivning = { operationKey: string; recordId: string; fields: Record<string, unknown> };

/** Statementet log-activity tagit emot (TASK-201.4 AC #3) — samma minimala
 * form som `atgarder-betalningar.staging.test.ts` § `Aktivitetslogg`. */
type Aktivitetslogg = {
  actor: { name: string; account: { name: string } };
  verb: { display: Record<string, string> };
  object: { definition: { name: Record<string, string>; type: string } };
};

async function mocka(
  page: Page,
): Promise<{ skrivningar: Skrivning[]; aktivitetsloggar: Aktivitetslogg[] }> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  const skrivningar: Skrivning[] = [];
  const aktivitetsloggar: Aktivitetslogg[] = [];
  // Serverns rader muteras av skrivningarna så en refetch (mutationens
  // onSettled-invalidering) inte "ångrar" den optimistiska flippen.
  const rader = DELTAGARE.map((r) => ({ ...r }));

  await page.route(GET_EVENT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: eventDetail() }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: rader }),
    });
  });
  await page.route(UPDATE_RECORD, async (route) => {
    const body = route.request().postDataJSON() as Skrivning;
    skrivningar.push(body);
    const rad = rader.find((r) => r.id === body.recordId);
    if (rad) rad.borOver = body.fields['Bor över'];
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
  // [TASK-201.4, AC #3] recordActivity fire-and-forget:ar EFTER update-record
  // redan lyckats (samma mönster som `atgarder-betalningar.staging.test.ts`)
  // — mocken svarar alltid 201 med EF:ens faktiska form.
  await page.route(LOG_ACTIVITY, async (route) => {
    const body = route.request().postDataJSON() as Aktivitetslogg & {
      id: string;
      context: { extensions: Record<string, string> };
    };
    aktivitetsloggar.push(body);
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        id: body.id,
        requestId: Object.values(body.context.extensions)[0],
        occurredAt: new Date().toISOString(),
      }),
    });
  });
  // Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event —
  // stubbas tom via delade sömmen (TASK-47, tidigare TASK-205/TASK-212) så
  // eventsidans övriga sviter förblir deterministiska.
  await mockTommaAnteckningar(page);
  return { skrivningar, aktivitetsloggar };
}

function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/**
 * [ÄNDRAT, TASK-166 — disambiguering mot registrets "Visa"-dropdown] Sedan
 * TASK-162.3 promoverade registerpanelen (`RegisterFilterRad`) till den
 * OVILLKORLIGA formen ovanför registret i BÅDA lägena (facitkartan § A5:
 * "Bor över-kryssläget behåller filterpanelen som ram") bär panelens "Visa"-
 * dropdown VALDA värdes etikett som en del av sitt eget tillgängliga namn.
 * `REGISTER_STEG_LABEL['bor-over']` (hallplats-steg-prototyp.ts) är just
 * "Bor över" — SAMMA sträng som denna summeringsrads egen term — och när
 * raden klickas skriver den samma `registerFilter.steg`-tillstånd som
 * dropdownen läser (`vaxlaSteg`, Deltagare.tsx), så dropdownens tillgängliga
 * namn blir "Bor över Visa" i samma ögonblick som raden själv bär
 * "Bor över 1".
 *
 * BEVISAT I CI (post-merge run 31270539778, `event-bor-over.staging.test.ts:262`):
 * `getByRole('button', { name: /^Bor över/ })` gav ett strict-mode-brott —
 * "resolved to 2 elements" — mellan `aria-pressed="true"` raden (`aka
 * getByRole('button', { name: 'Bor över 1' })`) och Select-triggern
 * (`aria-expanded`/`aria-haspopup`, `aka getByRole('button', { name: 'Bor
 * över Visa' })`).
 *
 * `[aria-pressed]` skiljer dem — SAMMA disambiguerings-mekanism som
 * `event-deltagare.staging.test.ts`s `summeringsRad()`-helper redan
 * etablerade för den identiska kollisionsklassen (dropdownens valda värde
 * kan dela prefix med en summeringsrads egen term). Select-triggern bär
 * ALDRIG `aria-pressed`. `src/` är facit-låst (ADR-103) — disambigueringen
 * hör hemma här, i testet, inte i produktkoden.
 */
function borOverRaden(page: Page) {
  return gruppen(page)
    .getByRole('button', { name: /^Bor över/ })
    .and(page.locator('[aria-pressed]'));
}

function kryssen(page: Page) {
  return gruppen(page).getByTestId('bor-over-rad');
}

/** Namnen i kryss-lägets ordning (raden bär även sin kategori-pill). */
function kryssNamn(page: Page) {
  return gruppen(page).getByTestId('bor-over-namn');
}

/**
 * Kryssrutan för EN person — det tillgängliga namnet börjar med personens namn.
 * För ASSERTIONER (toBeChecked). RAC lägger `role="checkbox"` på det dolda
 * <input>-elementet.
 */
function krysset(page: Page, namn: string) {
  return gruppen(page).getByRole('checkbox', { name: new RegExp(`^${namn}`) });
}

/**
 * KLICKYTAN för EN persons kryss — RAC renderar en <label> (radens `bor-over-rad`)
 * som omsluter ett dolt <input>; klick måste träffa labeln, inte inputen (labeln
 * fångar pekaren). Filtrerar rad-labeln på personens namn.
 */
function klickaKryss(page: Page, namn: string) {
  return kryssen(page).filter({ hasText: namn });
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

test.describe('Bor över — raden + kryss-läget (task-18.7)', () => {
  test('raden bär HÄRLETT antal och står näst SIST — under den, sist av alla, Avbokade (avbokade borträknade ur Bor över)', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);

    // TASK-145.2 (facit-låst, grillad samsyn beslut 2): sju rader — fyra
    // steg-räknare (Väntar på bekräftelse/Anmälningsavgifter/
    // Slutbetalningar/Klara) + logistik-gruppen (Deltagarinfo skickad/Bor
    // över/Avbokade). Bor övers EGNA form (term "Bor över", härlett antal)
    // är oförändrad — bara raderna omkring den har bytt form.
    const etiketter = await gruppen(page).locator('button[aria-pressed]').allTextContents();
    expect(etiketter).toEqual([
      'Väntar på bekräftelse2',
      'Anmälningsavgifter0 av 4 mottagna−4',
      'Slutbetalningar0 klara−4',
      'Klara0',
      'Deltagarinfo skickad0 av 4−4',
      'Bor över1',
      'Avbokade1',
    ]);

    // Eva (Avbokad/Ombokad) bär borOver i mocken men räknas ALDRIG in i
    // Bor över-radens tal — 1, inte 2. Hon räknas i stället i Avbokade-
    // radens EGET tal (1, ovan), oberoende av Bor över.
    //
    // [ÄNDRAT, TASK-162.3 AC #2 → TASK-166] Fram till promoveringen var Eva
    // helt bortfiltrerad ur REGISTRET (denna assertion löd `toHaveCount(0)`);
    // registrets bas inkluderar numera avbokade (grå-märkta, sist), så hon
    // syns nu i registret — men fortfarande inte i Bor över-radens tal ovan.
    // Samma facit `event-deltagare.staging.test.ts` redan bevisar för samma
    // fixturperson: synlig, sist i ordningen, grått "Avbokad"-märke i stället
    // för ett steg-märke.
    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register.getByText('Eva Sten')).toBeVisible();
    const namn = await register.getByTestId('deltagar-namn').allTextContents();
    expect(namn[namn.length - 1]).toBe('Eva Sten');
    // `.last()`: HallplatsMarke:s breddlås staplar alla sex etiketterna i
    // samma grid-cell (fem aria-hidden-platshållare + den synliga sist i
    // DOM-ordningen) — `getByText('Avbokad')` matchar annars två noder med
    // identisk text (samma disambiguering som event-deltagare.staging.test.ts
    // redan använder för denna exakta situation).
    await expect(
      register.getByTestId('deltagar-kort').last().getByText('Avbokad').last(),
    ).toBeVisible();
  });

  test('klicket öppnar KRYSS-LÄGET: alla anmälda i EN kolumn, ikryssade överst', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);

    await borOverRaden(page).click();
    await expect(borOverRaden(page)).toHaveAttribute('aria-pressed', 'true');

    // ALLA anmälda står i läget — inte bara de ikryssade (det är en ARBETSRAD,
    // inte en filterlista, K52). Ikryssade överst: David (sist i data-ordningen).
    const rader = kryssen(page);
    await expect(rader).toHaveCount(4);
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // EN kolumn: varje rad ligger på sin egen y och de delar vänsterkant.
    const boxar = await rader.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y) };
      }),
    );
    const xar = new Set(boxar.map((b) => b.x));
    expect(xar.size, 'kryss-läget ska vara EN kolumn — alla rader delar vänsterkant').toBe(1);
    for (let i = 1; i < boxar.length; i++) {
      expect(boxar[i].y, `rad ${i} ska ligga UNDER föregående (en kolumn)`).toBeGreaterThan(
        boxar[i - 1].y,
      );
    }

    // Personkorten är ersatta av kryss-raderna — inte båda formerna samtidigt.
    await expect(gruppen(page).getByTestId('deltagar-kort')).toHaveCount(0);

    // Kryss-tillståndet speglar basen.
    await expect(krysset(page, 'David Nord')).toBeChecked();
    await expect(krysset(page, 'Anna Ek')).not.toBeChecked();
  });

  test('krysset skriver via set-registration-lodging och live-räknaren tickar', async ({
    page,
  }) => {
    const { skrivningar } = await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();

    await klickaKryss(page, 'Anna Ek').click();
    await expect(krysset(page, 'Anna Ek')).toBeChecked();

    // LIVE-RÄKNAREN: summeringsradens siffra är HÄRLEDD ur samma cache-rad —
    // den tickar 1 → 2 utan omladdning.
    await expect(borOverRaden(page)).toHaveText('Bor över2');

    // Av-bock med samma operation (allowlisten gatar fältet, inte värdet).
    await klickaKryss(page, 'David Nord').click();
    await expect(krysset(page, 'David Nord')).not.toBeChecked();
    await expect(borOverRaden(page)).toHaveText('Bor över1');

    expect(skrivningar).toEqual([
      {
        operationKey: 'set-registration-lodging',
        recordId: 'recAnna',
        fields: { 'Bor över': true },
      },
      {
        operationKey: 'set-registration-lodging',
        recordId: 'recDavid',
        fields: { 'Bor över': false },
      },
    ]);
  });

  test('AKTIVITETSLOGGEN (TASK-201.4 AC #3): ett Bor över-kryss postar log-activity med rätt aktör, verb och objekt-namn — BÅDA riktningarna', async ({
    page,
  }) => {
    const { aktivitetsloggar } = await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();

    await klickaKryss(page, 'Anna Ek').click();
    await expect.poll(() => aktivitetsloggar.length).toBe(1);

    const [markerad] = aktivitetsloggar;
    // AKTÖR: ett giltigt (icke-tomt) namn skickas klient-sidan — samma
    // form-bevis som `atgarder-betalningar.staging.test.ts`, den
    // AUKTORITATIVA identiteten härleds server-side.
    expect(markerad.actor.name.length).toBeGreaterThan(0);
    expect(markerad.actor.account.name.length).toBeGreaterThan(0);
    expect(markerad.verb.display['sv-SE']).toBe('markerade bor över');
    expect(markerad.object.definition.name['sv-SE']).toBe('Anna Ek (Resor i medvetandet 1)');
    expect(markerad.object.definition.type).toContain('/activity-types/boende');

    // Av-bock (David) loggar den MOTSATTA riktningen.
    await klickaKryss(page, 'David Nord').click();
    await expect.poll(() => aktivitetsloggar.length).toBe(2);
    expect(aktivitetsloggar[1].verb.display['sv-SE']).toBe('avmarkerade bor över');
    expect(aktivitetsloggar[1].object.definition.name['sv-SE']).toBe(
      'David Nord (Resor i medvetandet 1)',
    );
  });

  test('ordningen är STABIL under markeringen — nykryssad rad hoppar inte under fingret', async ({
    page,
  }) => {
    await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();

    await klickaKryss(page, 'Cecilia Lund').click();
    await expect(krysset(page, 'Cecilia Lund')).toBeChecked();

    // Cecilia står KVAR sist trots att hon nu är ikryssad (K52: sorteringen är
    // en ögonblicksbild från när läget öppnades).
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // Vid OMÖPPNING sätter sig ordningen om — då står de ikryssade överst
    // (inbördes i listans ordning: Cecilia före David).
    // [ÄNDRAT, TASK-162.3 → TASK-166] Knappen heter "Rensa filter" (panelens
    // badge-bärande knapp, `RegisterFilterRad`), inte längre "Rensa filtret"
    // (den rivna flik-formens länk, TASK-162.3 AC #1). Namnet bär en
    // sr-only-räknare ("Rensa filter, 1 aktivt filterval") — regex matchar
    // prefixet oavsett räknarens värde, samma mönster som
    // `event-deltagare.staging.test.ts` redan använder.
    await gruppen(page)
      .getByRole('button', { name: /^Rensa filter/ })
      .click();
    await expect(kryssen(page)).toHaveCount(0);
    await borOverRaden(page).click();
    expect(await kryssNamn(page).allTextContents()).toEqual([
      'Cecilia Lund',
      'David Nord',
      'Anna Ek',
      'Bertil Sund',
    ]);
  });

  test('axe 0 i kryss-läget', async ({ page }) => {
    await mocka(page);
    await oppnaEventsidan(page);
    await borOverRaden(page).click();
    await expect(kryssen(page)).toHaveCount(4);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });
});
