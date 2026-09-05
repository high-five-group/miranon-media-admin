import AxeBuilder from '@axe-core/playwright';
import type { Locator } from '@playwright/test';
import { expect, type Page, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-147.4 — Betalningarnas skrivvertikal på Åtgärds-sidan: den ÄRVDA
 * E2E-skulden från TASK-145.3/145.4 återupprättad HÄR, inte skriven om från
 * noll.
 *
 * SKARVENS HISTORIK: `mark-paid.staging.test.ts` (ursprungligen task-18.8)
 * testade en gång SKRIVANDET på eventdetaljens betalningsyta. TASK-145.4
 * gjorde den ytan READ-ONLY ("BÅDA betalnings-kryssen, noteringsredigeringen
 * och Påminn-knappen flyttar till Åtgärds-sidan (TASK-147, ej byggd)") och
 * konverterade de gamla skriv-testerna till sin motsats — mekaniska bevis
 * att den GAMLA ytan inte kan skriva. Skulden för det verkliga skrivandet
 * bokfördes uttryckligen på TASK-147 (samma fils docblock, samma rader).
 * Åtgärds-sidans egen skrivyta (`AtgardsSida.tsx` § `BetalningsSkrivYta`,
 * produktionskod sedan TASK-171.5) hade fram till denna fil NOLL E2E-
 * täckning för själva skrivandet — skarven flyttar hit.
 *
 * DIVERGENS MOT UPPDRAGET, ÖPPET BOKFÖRD (ADR-086/premiss-passet):
 * uppdraget antog att avprickning av slutbetalning kräver en NY
 * `field-allowlists.ts`-operation. Det stämmer inte — `mark-final-payment-paid`
 * registrerades redan i `c3d39360` ([task-18.8], långt före TASK-147) med
 * deny/allow-test redan grönt i `tests/api/update-record.staging.test.ts`
 * (rad ~291, ~357). Likaså skriver `BetalningsSkrivYta` redan verkligt via
 * `useSetPaymentStatus`/`useUpdatePaymentNote` (real adapter, real bas) sedan
 * ytan promoverades till produktionskod (TASK-171.5, Marcus godkännande
 * 2026-08-09) — inget av detta byggs om här. Vad som FAKTISKT saknades vid
 * granskning: (1) E2E-täckning för skrivandet på den NYA platsen (denna
 * fil), (2) taktvakten (se `registrationPayments.ts` § `TAKTVAKT_SCOPE`,
 * kodad i SAMMA landning som denna fil).
 *
 * Deterministisk via `page.route`-mock av get-events (väljarlistan),
 * get-registrations och update-record — samma split som `mark-paid`/
 * `event-bor-over`: SERVER-write-kontraktet (allowlist, deny/allow) prövas
 * mot skarp staging i `tests/api/update-record.staging.test.ts`; dessa e2e
 * bevisar klientens form och beteende flak-fritt utan att mutera delad
 * staging-data.
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const UPDATE_RECORD = '**/functions/v1/update-record';
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const EVENT_ID = 'recATGBETALNING1';

type Json = Record<string, unknown>;

/** Skrivningen update-record tagit emot (payload-beviset, `event-bor-over`-mönstret). */
type Skrivning = { operationKey: string; recordId: string; fields: Record<string, unknown> };

/** Statementet log-activity tagit emot (TASK-201.3 AC #4) — bara de fält
 * testerna faktiskt behöver bevisa, inte hela xAPI-formen. */
type Aktivitetslogg = {
  actor: { name: string; account: { name: string } };
  verb: { display: Record<string, string> };
  object: { definition: { name: Record<string, string>; type: string } };
};

/** Komplett Registration som passerar RegistrationSchema (samma facit-form
    som `mark-paid.staging.test.ts` § `reg()`). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Betalprövning',
    ort: null,
    status: 'Bekräftad (mail skickat)',
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
    noteringAnmalningsavgift: null,
    noteringSlutbetalning: null,
    paminnelseAnmalningsavgiftSkickad: null,
    paminnelseSlutbetalningSkickad: null,
    ...overrides,
  };
}

/** Airtable-fältnamn → domänens camelCase (mock-tillstånds-mappningen,
    `event-bor-over.staging.test.ts`-mönstret utökat till FYRA fält). */
const FALT_TILL_DOMAN: Record<string, string> = {
  Anmälningsavgift: 'anmalningsavgift',
  Slutbetalning: 'slutbetalning',
  'Notering anmälningsavgift': 'noteringAnmalningsavgift',
  'Notering slutbetalning': 'noteringSlutbetalning',
};

type MockOptioner = {
  /** Fördröjning på VARJE update-record-svar — gör taktvaktens seriella
      exekvering observerbar (utan fördröjning hinner tre snabba klick
      teoretiskt landa "samtidigt" i mockens synkrona kö ändå, men fördröjningen
      gör bortom rimligt tvivel att request N+1 ALDRIG startar innan N avslutat). */
  updateDelayMs?: number;
  /** Svara 500 för denna EXAKTA recordId — fel-vägen. */
  failForRecordId?: string;
  /** [TASK-201.3, AC #1] Svara 500 för VARJE log-activity-anrop — bevisar att
   * en fallerad loggning ALDRIG fäller den riktiga mutationen (recordActivity
   * fire-and-forget:ar, se `recordActivity.ts` filhuvud). */
  failLogActivity?: boolean;
};

async function mocka(
  page: Page,
  registrations: Json[],
  optioner: MockOptioner = {},
): Promise<{
  skrivningar: Skrivning[];
  maxSamtidiga: () => number;
  aktivitetsloggar: Aktivitetslogg[];
}> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Betalprövning', startdatum: '2099-06-01' }),
  ]);

  const rader = registrations.map((r) => ({ ...r }));
  const skrivningar: Skrivning[] = [];
  const aktivitetsloggar: Aktivitetslogg[] = [];
  let samtidiga = 0;
  let maxSamtidiga = 0;

  // [TASK-201.3, AC #4] recordActivity fire-and-forget:ar EFTER update-record
  // redan lyckats — mocken svarar alltid 201 (formen `log-activity/index.ts`
  // faktiskt returnerar) så klientens statement-byggande går att observera
  // utan att skriva någon rad i skarp staging (denna svit muterar ALDRIG
  // delad staging-data, se filhuvudets "Deterministisk"-stycke).
  await page.route(LOG_ACTIVITY, async (route) => {
    const body = route.request().postDataJSON() as Aktivitetslogg & {
      id: string;
      context: { extensions: Record<string, string> };
    };
    aktivitetsloggar.push(body);
    if (optioner.failLogActivity) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-log-activity-fail' }),
      });
      return;
    }
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

  await page.route(GET_REGISTRATIONS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: rader }),
    });
  });

  await page.route(UPDATE_RECORD, async (route) => {
    samtidiga += 1;
    maxSamtidiga = Math.max(maxSamtidiga, samtidiga);
    const body = route.request().postDataJSON() as Skrivning;

    if (optioner.updateDelayMs) {
      await new Promise((r) => setTimeout(r, optioner.updateDelayMs));
    }

    if (optioner.failForRecordId && optioner.failForRecordId === body.recordId) {
      samtidiga -= 1;
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error', requestId: 'req-test-betal' }),
      });
      return;
    }

    skrivningar.push(body);
    const rad = rader.find((r) => r.id === body.recordId);
    if (rad) {
      for (const [airtableFalt, varde] of Object.entries(body.fields)) {
        const domanFalt = FALT_TILL_DOMAN[airtableFalt];
        if (domanFalt) rad[domanFalt] = varde;
      }
    }
    samtidiga -= 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  return { skrivningar, maxSamtidiga: () => maxSamtidiga, aktivitetsloggar };
}

/** Betalningsblocket — egen sektion, se `AtgardsSida.tsx` `grupp-betalningar`. */
function betalningsPanel(page: Page) {
  return page.locator('section[aria-labelledby="grupp-betalningar"]');
}

/**
 * [PASS 10, 2026-09-01] FÄLLNINGEN KLICKAS INTE LÄNGRE — den finns inte.
 *
 * Hjälparen hette (och heter) "öppna sidan OCH betalningarna" därför att
 * betalningsytan låg bakom fällknappen "Pricka av och notera". Med miljöflaggan
 * PÅ är den knappen riven tillsammans med kryss-vertikalen (Marcus GO
 * 2026-09-01): sektionen ÄR betalningsytan, synlig direkt. Namnet står kvar
 * eftersom kontraktet — "efter detta anrop är betalningsytan tillgänglig" — är
 * oförändrat; bara vägen dit är kortare.
 *
 * Väntan på sektionen ersätter klicket som synk-punkt. Utan den hade testerna
 * kunnat läsa en tom sektion innan React hunnit rendera personerna.
 */
async function oppnaSidanOchBetalningar(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
  await expect(betalningsPanel(page)).toBeVisible();
}

function avgiftKryss(page: Page, namn: string) {
  return betalningsPanel(page).getByRole('checkbox', { name: `Anmälningsavgift för ${namn}` });
}

function slutKryss(page: Page, namn: string) {
  return betalningsPanel(page).getByRole('checkbox', { name: `Slutbetalning för ${namn}` });
}

function avgiftNotering(page: Page, namn: string) {
  return betalningsPanel(page).getByRole('textbox', {
    name: `Notering anmälningsavgift för ${namn}`,
  });
}

/**
 * KLICKYTAN för EN kryssruta — INTE inputet självt.
 *
 * RUND-FAS-DIAGNOS (post-merge-run 31380260103, "Test timeout of 30000ms
 * exceeded" på `locator.click`, error-context.md): RAC:s `<Checkbox>`
 * renderar ett VISUELLT DOLT `<input type="checkbox">` inuti en synlig
 * `<label>` (den styrade spanen `KRYSSRUTA_KLASS` ligger ovanpå). Ett klick
 * riktat mot inputets egen bounding box fångas i stället av spanen —
 * Playwrights call log säger det rakt ut: "…subtree intercepts pointer
 * events" — och auto-retry-loopen ger aldrig upp förrän 30 s-taket, eftersom
 * elementet ÄR synligt/enabled/stabilt (det är TRÄFFYTAN som är fel, inte
 * elementets tillstånd).
 *
 * SAMMA MÖNSTER ÄR REDAN ETABLERAT I REPOT — jag läste det men missade att
 * applicera det: `event-bor-over.staging.test.ts` § `klickaKryss` (filtrerar
 * på rad-labeln) och `mark-paid.staging.test.ts` rad 375-378
 * (`.locator('xpath=ancestor::label[1]').click()`). Denna hjälpare är samma
 * fix, generaliserad till en funktion i stället för upprepad på varje
 * anropsplats. `getByRole('checkbox', …)` (ovan) används fortfarande OFÖRÄNDRAT
 * för ASSERTIONER (`toBeChecked()`) — de läser bara `checked`-attributet och
 * kräver ingen hit-testning, så de var aldrig problemet (bekräftat: samma
 * körnings gröna `notering`- och `axe`-tester rör aldrig `.click()` på ett
 * kryss och föll inte).
 */
function klicka(kryss: Locator): Promise<void> {
  return kryss.locator('xpath=ancestor::label[1]').click();
}

const FACIT: Json[] = [
  reg('recEva0000000001', 'Eva Lindqvist'),
  reg('recJohan00000002', 'Johan Berg', { anmalningsavgift: 'Mottagen' }),
  reg('recKarin00000003', 'Karin Sjögren', { anmalningsavgift: 'Mottagen' }),
  reg('recSara000000004', 'Sara Nyström'),
  reg('recPeter00000005', 'Peter Åkesson'),
  reg('recMaria00000006', 'Maria Holm'),
  reg('recAnders0000007', 'Anders Ek'),
  reg('recForel0000008', 'Föreläsnings Person', {
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej relevant (för föreläsningar)',
  }),
  reg('recAvbokad000009', 'Avbokad Person', { status: 'Avbokad/Ombokad' }),
];

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SKIPPAD AV TASK-346.7 — AFFORDANSEN FINNS INTE MED MILJÖFLAGGAN PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * Testerna nedan bevisar att ett KLICK på ett betalningskryss skriver till
 * basen. Sedan TASK-346.7 är kryssen LÄSANDE när `VITE_FEATURE_BETALNINGAR`
 * är `pa` (PRD § Ytorna beslut 10: "kryssen flippas inte längre för hand";
 * facken härleds ur inbetalningarna, ADR-128, och basens två valfält är en
 * app-skriven SPEGEL av härledningen).
 *
 * E2E-KLASSEN KÖR MED FLAGGAN PÅ. `playwright.config.ts`s e2e-webServer
 * sätter bara `VITE_E2E_WARMUP_TIMEOUT_MS`, så `.env.development`s `pa`
 * gäller — till skillnad från acceptance/visual/webblasarbeteende, som får
 * ett explicit `av` (config § VITE_FEATURE_BETALNINGAR). Klicken nedan kan
 * alltså inte längre avfyra någon skrivning, och testerna kan inte passera.
 *
 * SKIPPADE OCH INTE RADERADE, med avsikt: skrivvägen
 * (`useSetPaymentStatus`, taktvakten, aktivitetsloggens två riktningar,
 * rollbacken) är fortfarande LEVANDE PRODUKTIONSKOD med flaggan AV — alltså
 * i prod, tills Marcus slår på flaggan. Att radera bevisen för en väg som
 * fortfarande kör hade tagit bort täckning utan att ta bort risken. En skip
 * gör förlusten SYNLIG i varje testrapport i stället för osynlig i en diff.
 *
 * VEM SOM STÄNGER DET HÄR: `TASK-346.12` river miljöflaggan och därmed
 * skrivvägen. Då ska blocket RADERAS tillsammans med `useSetPaymentStatus`
 * och `SkickaKvittoKnapp` — inte återupplivas.
 *
 * ÖPPEN FRÅGA TILL MORGONGRANSKNINGEN (nattmandat B3): med flaggan på finns
 * ingen e2e-täckning kvar för skrivvägen, eftersom dess enda affordans är
 * borta i den miljö e2e kör i. Alternativet — att sätta flaggan till `av`
 * på e2e-webServern — hade bevarat dessa sex tester men brutit
 * `mer-index.staging.test.ts` (TASK-346.6, som räknar elva rader i
 * Mer-listan just för att flaggan är på) och gjort hela betalningsdomänen
 * osynlig för e2e-klassen. Valet är bokfört, inte fattat i tysthet.
 */
test.describe
  .skip('Betalningarnas skrivvertikal på Åtgärds-sidan — avprickning (TASK-147.4 AC #1) [SKIPPAD: kryssen är läsande med miljöflaggan på, TASK-346.7]', () => {
    test('avprickning: kryssa i Anmälningsavgift skriver mark-registration-fee-paid via adapter-vägen', async ({
      page,
    }) => {
      const { skrivningar } = await mocka(page, FACIT);
      await oppnaSidanOchBetalningar(page);

      const kryss = avgiftKryss(page, 'Eva Lindqvist');
      await expect(kryss).not.toBeChecked();
      await klicka(kryss);
      await expect(kryss).toBeChecked();

      await expect.poll(() => skrivningar.length).toBe(1);
      expect(skrivningar[0]).toEqual({
        operationKey: 'mark-registration-fee-paid',
        recordId: 'recEva0000000001',
        fields: { Anmälningsavgift: 'Mottagen' },
      });
    });

    test('slutbetalning: kryssa i skriver mark-final-payment-paid — DET operationen uppdraget trodde var ny, men som redan fanns (c3d39360)', async ({
      page,
    }) => {
      const { skrivningar } = await mocka(page, FACIT);
      await oppnaSidanOchBetalningar(page);

      const kryss = slutKryss(page, 'Karin Sjögren');
      await expect(kryss).not.toBeChecked();
      await klicka(kryss);
      await expect(kryss).toBeChecked();

      await expect.poll(() => skrivningar.length).toBe(1);
      expect(skrivningar[0]).toEqual({
        operationKey: 'mark-final-payment-paid',
        recordId: 'recKarin00000003',
        fields: { Slutbetalning: 'Mottagen' },
      });
    });

    test('ångra: bocka ur en felaktig avprickning skriver Ej mottagen via SAMMA operation (toggle, ej separat "ångra"-operation)', async ({
      page,
    }) => {
      const { skrivningar } = await mocka(page, FACIT);
      await oppnaSidanOchBetalningar(page);

      const kryss = avgiftKryss(page, 'Johan Berg');
      await expect(kryss).toBeChecked(); // Johan startar Mottagen (facit-listan).
      await klicka(kryss);
      await expect(kryss).not.toBeChecked();

      await expect.poll(() => skrivningar.length).toBe(1);
      expect(skrivningar[0]).toEqual({
        operationKey: 'mark-registration-fee-paid',
        recordId: 'recJohan00000002',
        fields: { Anmälningsavgift: 'Ej mottagen' },
      });
    });

    test('AKTIVITETSLOGGEN (TASK-201.3 AC #4): en avprickning postar log-activity med rätt aktör, verb och objekt-namn', async ({
      page,
    }) => {
      const { skrivningar, aktivitetsloggar } = await mocka(page, FACIT);
      await oppnaSidanOchBetalningar(page);

      await klicka(avgiftKryss(page, 'Eva Lindqvist'));
      await expect.poll(() => skrivningar.length).toBe(1);
      await expect.poll(() => aktivitetsloggar.length).toBe(1);

      const [logg] = aktivitetsloggar;
      // AKTÖR: ett giltigt (icke-tomt) namn skickas klient-sidan — den
      // AUKTORITATIVA identiteten härleds server-side (EF-kontraktet,
      // tests/api/log-activity.staging.test.ts), så denna e2e-svit bevisar
      // FORMEN, inte det slutliga namnet.
      expect(logg.actor.name.length).toBeGreaterThan(0);
      expect(logg.actor.account.name.length).toBeGreaterThan(0);
      // VERB: "markerade betalning" (mottagen-riktningen — Eva startar Ej
      // mottagen i FACIT).
      expect(logg.verb.display['sv-SE']).toBe('markerade betalning');
      // OBJEKT: Gunilla-formen "Namn (Event)" — samma exempel som PRD § Lösning.
      expect(logg.object.definition.name['sv-SE']).toBe('Eva Lindqvist (Betalprövning)');
      expect(logg.object.definition.type).toContain('/activity-types/betalning');
    });

    test('AKTIVITETSLOGGEN (TASK-201.3 AC #4): AVMARKERING loggar den motsatta riktningen ("avmarkerade betalning")', async ({
      page,
    }) => {
      const { aktivitetsloggar } = await mocka(page, FACIT);
      await oppnaSidanOchBetalningar(page);

      // Johan startar Mottagen (FACIT) — klick avmarkerar.
      await klicka(avgiftKryss(page, 'Johan Berg'));
      await expect.poll(() => aktivitetsloggar.length).toBe(1);

      expect(aktivitetsloggar[0].verb.display['sv-SE']).toBe('avmarkerade betalning');
    });

    test('AKTIVITETSLOGGEN (TASK-201.3 AC #1): log-activity 500 FÄLLER ALDRIG den riktiga mutationen — fire-and-forget bevisat i BÅDA riktningarna (framgång ovan, fel här)', async ({
      page,
    }) => {
      const { skrivningar, aktivitetsloggar } = await mocka(page, FACIT, { failLogActivity: true });
      await oppnaSidanOchBetalningar(page);

      const kryss = avgiftKryss(page, 'Eva Lindqvist');
      await expect(kryss).not.toBeChecked();
      await klicka(kryss);

      // DEN RIKTIGA MUTATIONEN lyckas identiskt — update-record ser aldrig att
      // log-activity fallerade (separata, oberoende request-strömmar).
      await expect(kryss).toBeChecked();
      await expect.poll(() => skrivningar.length).toBe(1);
      expect(skrivningar[0]).toEqual({
        operationKey: 'mark-registration-fee-paid',
        recordId: 'recEva0000000001',
        fields: { Anmälningsavgift: 'Mottagen' },
      });
      // Ingen "Kunde inte spara"-larmruta — mutationen VET INGET om att
      // loggningen misslyckades (recordActivity fångar felet internt, `void`-
      // anropat, aldrig awaitat av mutationens egen kedja).
      await expect(page.getByRole('alert')).toHaveCount(0);

      // log-activity ANROPADES (mocken svarade 500, men anropet skedde) — detta
      // skiljer "loggningen fallerade tyst" från "loggningen anropades aldrig".
      await expect.poll(() => aktivitetsloggar.length).toBe(1);
    });
  });

/**
 * NOTERINGSFÄLTEN ÄR KVAR — och det är ett uttryckligt krav, inte en rest.
 * TASK-346.7 AC #2: "noteringsfälten kvar". De skriver ett eget additivt
 * fält (`Notering anmälningsavgift`), inte facken, så härledningen rör dem
 * inte. Testet nedan kör därför OFÖRÄNDRAT med flaggan på.
 */
test.describe('Betalningarnas noteringsfält på Åtgärds-sidan (TASK-147.4 AC #1)', () => {
  test('notering: skriver update-registration-payment-note vid blur — EXAKT det egna additiva fältet, aldrig gamla odelade Notering', async ({
    page,
  }) => {
    const { skrivningar } = await mocka(page, FACIT);
    await oppnaSidanOchBetalningar(page);

    const falt = avgiftNotering(page, 'Sara Nyström');
    await falt.fill('Lovade betala efter lönen');
    await falt.blur();

    await expect.poll(() => skrivningar.length).toBe(1);
    expect(skrivningar[0]).toEqual({
      operationKey: 'update-registration-payment-note',
      recordId: 'recSara000000004',
      fields: { 'Notering anmälningsavgift': 'Lovade betala efter lönen' },
    });
    // ADR-063-avgränsningen: gamla odelade 'Notering' rörs aldrig av denna väg.
    expect(Object.keys(skrivningar[0].fields)).not.toContain('Notering');
  });
});

/** SKIPPAD AV SAMMA SKÄL som skrivvertikalens block ovan — se dess docblock. */
test.describe
  .skip('Betalningarnas fel-väg (TASK-147.4) [SKIPPAD: kryssen är läsande, TASK-346.7]', () => {
    test('fel-väg: update-record 500 → optimistisk flipp rullas tillbaka + role=alert "Kunde inte spara"', async ({
      page,
    }) => {
      await mocka(page, FACIT, { failForRecordId: 'recEva0000000001' });
      await oppnaSidanOchBetalningar(page);

      const kryss = avgiftKryss(page, 'Eva Lindqvist');
      await klicka(kryss);

      await expect(page.getByRole('alert')).toContainText('Kunde inte spara');
      await expect(kryss).not.toBeChecked(); // rollback till föregående (Ej mottagen).
    });
  });

test.describe('Ej relevant-vakten — föreläsnings-semantiken (TASK-147.4 AC #2)', () => {
  test('försök skriva över: INGEN kryssruta finns för en Ej relevant-slutbetalning — strukturellt omöjligt att avfyra, inte bara dolt', async ({
    page,
  }) => {
    const { skrivningar } = await mocka(page, FACIT);
    await oppnaSidanOchBetalningar(page);

    // [PASS 10] UPPLYSNINGEN ÖVERLEVDE RIVNINGEN. Raden som bar den (SkrivRads
    // form utan kryss) finns inte kvar, men texten gör det — nu som en
    // kvalificering direkt under personens namn. Föreläsnings-semantiken
    // förklarar varför den här personen aldrig får en slutbetalning; utan den
    // ser frånvaron ut som en lucka.
    await expect(
      betalningsPanel(page).getByText('Slutbetalning · Ej relevant (föreläsning)'),
    ).toBeVisible();

    // Det mekaniska beviset: noll kryssrutor med det namnet i hela DOM:en.
    // Ett getByRole-sökfilter som ger 0 träffar bevisar att interaktionen
    // strukturellt inte existerar — det finns ingen affordans att missbruka.
    await expect(
      betalningsPanel(page).getByRole('checkbox', {
        name: 'Slutbetalning för Föreläsnings Person',
      }),
    ).toHaveCount(0);

    // [PASS 10] SLUTBEVISET ÄR NU STRUKTURELLT, INTE BETEENDEMÄSSIGT. Raden
    // klickade tidigare på personens EGNA avgiftskryss och mätte att
    // ingenting skrevs. Det krysset finns inte längre — hela vertikalen är
    // riven — så klicket kan inte utföras, och det är ett STARKARE bevis för
    // samma sak: när ingen skrivande affordans existerar kan
    // föreläsnings-semantiken omöjligt skrivas över. Noll skrivningar mäts
    // efter att sidan renderat färdigt, alltså utan att någon interaktion
    // behövde provoceras.
    await expect(betalningsPanel(page).getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(skrivningar).toHaveLength(0);
  });

  test('axe: 0 överträdelser med panelen öppen (inkl. Ej relevant-raden)', async ({ page }) => {
    await mocka(page, FACIT);
    await oppnaSidanOchBetalningar(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

/**
 * PASS 10 (2026-09-01) — SEKTIONENS KONTRAKT EFTER RIVNINGEN.
 *
 * Blocket hette tidigare "läsande kryss" och bevisade att kryssen inte längre
 * SKREV. Marcus GO 2026-09-01 rev dem helt: en kontroll som ser ut som en
 * kontroll men inte är det är sämre än ingen kontroll. Testerna prövar därför
 * inte längre kryssens BETEENDE utan deras FRÅNVARO, plus att det som ersatte
 * dem faktiskt finns — och, viktigast, att noteringarna INTE följde med i
 * rivningen.
 *
 * `hamta-oppna-betalningar` mockas TOMT med avsikt. Sektionen ska fungera —
 * och säga något sant — även när ingen av personerna har en öppen rad; det
 * är exakt det tvetydiga läge `PanelBetalningar` § `rad === null` bokför
 * (fullbetald ELLER okänt pris i basen). Ett mockat innehåll här hade
 * dessutom knutit denna svit till EF-svarets form, som ägs av TASK-346.4.
 */
test.describe('Åtgärds-sidans betalningssektion med miljöflaggan PÅ (pass 10)', () => {
  const OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';

  async function mockaTomBetalningslista(page: Page): Promise<void> {
    await page.route(OPPNA_BETALNINGAR, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ betalningar: [], forfallna: 0 }),
      }),
    );
  }

  /* ERSÄTTER DE TVÅ `aria-readonly`-TESTERNA. De prövade att ett läsande kryss
     varken flippade eller skrev; med vertikalen riven finns inget kryss att
     pröva, och frånvaron är ett starkare och enklare påstående. Noll
     kryssrutor i sektionen ⇒ noll skrivvägar via kryss, oavsett vad någon
     klickar på. */
  test('kryss-vertikalen är RIVEN: noll kryssrutor i sektionen, noll skrivningar', async ({
    page,
  }) => {
    const { skrivningar } = await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);

    await expect(betalningsPanel(page).getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(skrivningar).toHaveLength(0);
  });

  /* FÄLLKNAPPEN ÄR RIVEN, OCH RÄKNAREN ÖVERLEVDE HOS RUBRIKEN. Talet satt på
     knappen "Pricka av och notera"; överblicken får inte försvinna med sin
     bärare. Mönstret matchas i stället för ett exakt tal — testet vaktar att
     räknaren FINNS på sin nya plats, inte FACIT:s aritmetik (den ägs av
     `obetald`-predikatets egna tester). */
  test('fällknappen är riven och "N saknar" bor i sektionsrubriken', async ({ page }) => {
    await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);

    await expect(
      betalningsPanel(page).getByRole('button', { name: /Pricka av och notera/ }),
    ).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Betalningar · \d+ saknar/ })).toBeVisible();
  });

  /* NOTERINGARNA ÄR DET HÅRDA VILLKORET I HELA RIVNINGEN. Panelens två
     noteringsfält är Lottas ENDA skrivväg till anmälans
     `Notering anmälningsavgift`/`Notering slutbetalning` — pass 7 A3 mätte att
     de inte kan nås från registreringsformuläret utan en EF-ändring, och
     stannade därför. Ett kryss som försvinner är ett designbeslut; en
     skrivväg som försvinner är en förlust. Testet vaktar att båda fälten
     finns kvar i den nya formen. */
  test('BÅDA noteringsfälten överlevde rivningen och är skrivbara', async ({ page }) => {
    const { skrivningar } = await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);

    const panel = betalningsPanel(page);
    await expect(
      panel.getByRole('textbox', { name: 'Notering anmälningsavgift för Eva Lindqvist' }),
    ).toBeVisible();
    await expect(
      panel.getByRole('textbox', { name: 'Notering slutbetalning för Eva Lindqvist' }),
    ).toBeVisible();

    const falt = avgiftNotering(page, 'Eva Lindqvist');
    await falt.fill('Ringer på fredag');
    await falt.blur();

    await expect.poll(() => skrivningar.length).toBe(1);
    expect(skrivningar[0].operationKey).toBe('update-registration-payment-note');
    expect(skrivningar[0].fields).toEqual({ 'Notering anmälningsavgift': 'Ringer på fredag' });
  });

  test('gamla "Skicka kvitto"-dialogen är RIVEN ur sektionen', async ({ page }) => {
    await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);

    // Johan och Karin har Mottagen anmälningsavgift i FACIT — det var precis
    // det villkor som tidigare renderade knappen (`vald && …`).
    await expect(betalningsPanel(page).getByRole('button', { name: /^Skicka kvitto/ })).toHaveCount(
      0,
    );
  });

  test('varje person bär saknas-beskedet och fällningen för sina inbetalningar', async ({
    page,
  }) => {
    await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);

    // Ingen av personerna har en öppen rad i den (tomma) listan, så beskedet
    // är det tvetydighets-ärliga — aldrig ett påstått "Allt betalt".
    //
    // ORDALYDELSEN BYTTES 2026-09-01 (Marcus: "'enligt basen' är
    // tekniksvenska — får inte nå Lotta"), och REVIDERADES 2026-09-04
    // (S120, TASK-391): "kvar" förutsatte en skuld nolläget inte vet finns.
    // Skillnaden mot "Allt betalt" är vad testet vaktar, och den står kvar:
    // `rad === null` säger "Inget att betala", ett känt fullbetalt pris
    // säger "Allt betalt". Se `PanelBetalningar.tsx` § `rad === null` för
    // vad hedgen kostade.
    //
    // [PASS 10] Beskedet syns nu UTAN att någon fällning öppnas först —
    // sektionen ÄR betalningsytan. Inbetalnings-fällningen per person är
    // däremot kvar och fortfarande stängd: anropsbudgeten (en läsning per
    // person = tjugo EF-anrop) gäller oförändrat.
    const panel = betalningsPanel(page);
    await expect(panel.getByText('Inget att betala').first()).toBeVisible();

    const fallning = panel.getByRole('button', { name: /Visa inbetalningarna för Eva Lindqvist/ });
    await expect(fallning).toHaveAttribute('aria-expanded', 'false');
  });

  test('axe: 0 överträdelser på den nya sektionen', async ({ page }) => {
    await mocka(page, FACIT);
    await mockaTomBetalningslista(page);
    await oppnaSidanOchBetalningar(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});

/** SKIPPAD AV SAMMA SKÄL som skrivvertikalens block — se dess docblock. */
test.describe
  .skip('Taktvakten — batch-avprickning begränsad parallellitet (TASK-147.4 AC #2) [SKIPPAD: kryssen är läsande, TASK-346.7]', () => {
    test('tre kryss i snabb följd körs SERIELLT — aldrig mer än 1 samtidig update-record (scope.id, TanStack Query)', async ({
      page,
    }) => {
      const { skrivningar, maxSamtidiga } = await mocka(page, FACIT, { updateDelayMs: 250 });
      await oppnaSidanOchBetalningar(page);

      // Klicken avvaktar INTE varandras nätverks-runda — `.click()` returnerar
      // så fort klick-eventet dispatchat, långt före ett 250 ms-fördröjt svar.
      // Utan taktvakten hade detta gett tre SAMTIDIGA update-record-anrop.
      await klicka(avgiftKryss(page, 'Peter Åkesson'));
      await klicka(avgiftKryss(page, 'Maria Holm'));
      await klicka(avgiftKryss(page, 'Anders Ek'));

      await expect.poll(() => skrivningar.length, { timeout: 5000 }).toBe(3);

      // Det mätbara beviset: aldrig mer än 1 request in flight samtidigt, trots
      // tre klick avfyrade i snabb följd.
      expect(maxSamtidiga()).toBe(1);

      // Samtliga tre landade ändå — seriellt är inte samma sak som förlorat.
      const recordIds = skrivningar.map((s) => s.recordId).sort();
      expect(recordIds).toEqual(
        ['recPeter00000005', 'recMaria00000006', 'recAnders0000007'].sort(),
      );
    });
  });
