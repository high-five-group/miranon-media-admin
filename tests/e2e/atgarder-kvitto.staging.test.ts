import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { bekraftelseFixtur } from '../../src/components/betalningar/prototype/fixtur';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/** Denna testfils egen katalog (ESM — `__dirname` finns inte). */
const TESTFIL_KATALOG = dirname(fileURLToPath(import.meta.url));

/**
 * TASK-147.7, ADR-109 — "Skicka kvitto" skarpt ände-till-ände, e2e-täckning
 * i `chromium-authenticated`-projektet.
 *
 * SAMMA SPLIT SOM `atgarder-bekraftelsemail.staging.test.ts` (TASK-147.2)
 * OCH `atgarder-betalningar.staging.test.ts` (TASK-147.4): SERVER-kontraktet
 * (numrering, idempotens, atomicitet) är prövat mot skarp logik i
 * `tests/api/receipt-numbering.test.ts` + `tests/api/send-receipt.test.ts`
 * (api-pure, injicerade gränser). Denna fil bevisar KLIENTENS form och
 * beteende, deterministiskt via `page.route`-mock av get-events,
 * get-registrations och send-receipt-email — ingen delad staging-data rörs.
 *
 * ACCEPTANCE-KLASSEN (`tests/acceptance/atgarder-kvitto-send.acceptance.
 * test.ts`) BÄR REDAN DEN HERMETISKA VERSIONEN AV DETTA BEVIS — kropps-
 * kontraktet, det ärliga avvisnings-fallet och skärmläsar-annonseringen är
 * alla prövade DÄR, mot MSW-mockad fixturvärld. Denna fil kör i stället i
 * `chromium-authenticated` (staging-inloggad browser-kontext) — samma "två
 * lager samma bevis, olika miljö"-form 147.2:s egen fil etablerar.
 */

const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const SEND_RECEIPT_EMAIL = '**/functions/v1/send-receipt-email';
const LOG_ACTIVITY = '**/functions/v1/log-activity';
const EVENT_ID = 'recATGKVITTO00001';
const REG_ID = 'recAtgKvittoAnna1';

/** Statementet log-activity tagit emot (TASK-201.4 AC #3) — samma minimala
 * form som `atgarder-betalningar.staging.test.ts` § `Aktivitetslogg`. */
type Aktivitetslogg = {
  actor: { name: string; account: { name: string } };
  verb: { display: Record<string, string> };
  object: { definition: { name: Record<string, string>; type: string } };
};

type Json = Record<string, unknown>;

/** Komplett Registration som passerar RegistrationSchema (samma `reg()`-form som syskonfilerna). */
function reg(id: string, namn: string, overrides: Json = {}): Json {
  return {
    id,
    namn,
    fornamn: namn.split(' ')[0],
    efternamn: namn.split(' ')[1] ?? null,
    email: `${namn.toLowerCase().replace(' ', '.')}@example.com`,
    telefon: null,
    eventNamn: 'Kvittoprövning',
    ort: null,
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
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

const FACIT: Json[] = [reg(REG_ID, 'Anna Andersson')];

async function mocka(
  page: Page,
): Promise<{ sentBody: () => Json | null; aktivitetsloggar: Aktivitetslogg[] }> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Kvittoprövning', startdatum: '2099-06-01' }),
  ]);

  let sentBody: Json | null = null;
  const aktivitetsloggar: Aktivitetslogg[] = [];

  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: FACIT }),
    });
  });

  await page.route(SEND_RECEIPT_EMAIL, async (route: Route) => {
    sentBody = route.request().postDataJSON() as Json;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        kvittonummer: 'MM-2026-1001',
        lopnummer: 1001,
        ar: 2026,
      }),
    });
  });

  // [TASK-201.4, AC #3] recordActivity fire-and-forget:ar EFTER
  // send-receipt-email redan lyckats (samma mönster som
  // `atgarder-betalningar.staging.test.ts`) — mocken svarar alltid 201 med
  // EF:ens faktiska form.
  await page.route(LOG_ACTIVITY, async (route: Route) => {
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

  return { sentBody: () => sentBody, aktivitetsloggar };
}

async function oppnaSidanOchBetalningar(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
  await page
    .locator('section[aria-labelledby="grupp-betalningar"]')
    .getByRole('button', { name: /Pricka av och notera/ })
    .click();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SKIPPAD AV TASK-346.7 — DIALOGEN FINNS INTE MED MILJÖFLAGGAN PÅ
 * ═══════════════════════════════════════════════════════════════════════════
 * Båda testerna nedan öppnar knappen "Skicka kvitto - …" i Åtgärds-panelen.
 * Sedan TASK-346.7 renderas den knappen bara med `VITE_FEATURE_BETALNINGAR`
 * satt till annat än `pa` — och e2e-klassen kör med `pa` (`.env.development`;
 * `playwright.config.ts`s e2e-webServer sätter ingen egen flagga).
 *
 * VARFÖR DIALOGEN RIVS: den bygger på ADR-109 beslut 7-flödet, där Lotta
 * skriver kvittobeloppet för hand i en ruta utan felmeddelanden. Det beslutet
 * är rivet (PRD TASK-346 § ADR-koppling). Kvittot avser numera exakt EN
 * inbetalning och bär dess belopp och datum (ADR-128), så ett handskrivet
 * belopp kan inte längre peka på någon inbetalning — Roger hade fått en
 * verifikation utan motpost.
 *
 * SKIPPAD OCH INTE RADERAD, med avsikt: `send-receipt-email` är fortfarande
 * deployad, och med flaggan AV är dialogen Lottas enda kvittoväg i PROD tills
 * Marcus slår på flaggan. Bevisen för den vägen får inte försvinna medan
 * vägen kör.
 *
 * ATT DIALOGEN FAKTISKT ÄR BORTA med flaggan på bevisas positivt i
 * `atgarder-betalningar.staging.test.ts` § "gamla 'Skicka kvitto'-dialogen är
 * RIVEN ur panelen" — den nya kvittovägen (Visa/Skicka igen per
 * inbetalningsrad) prövas i `tests/api/kvitto-visa-skicka-igen.test.ts` och i
 * acceptansvandringen mot staging.
 *
 * VEM SOM STÄNGER DET HÄR: `TASK-346.12` river flaggan och därmed dialogen,
 * `useSendReceipt` och denna fil.
 */
test.describe
  .skip('Skicka kvitto — verklig sändväg mot send-receipt-email (TASK-147.7 AC #2, #3) [SKIPPAD: dialogen är riven med miljöflaggan på, TASK-346.7]', () => {
    test('POST med rätt kontrakt, kvittonumret redovisas i dialogen', async ({ page }) => {
      const { sentBody } = await mocka(page);
      await oppnaSidanOchBetalningar(page);

      const panel = page.locator('section[aria-labelledby="grupp-betalningar"]');
      await panel
        .getByRole('button', { name: 'Skicka kvitto - Anmälningsavgift för Anna Andersson' })
        .click();

      const dialog = page.getByRole('dialog', { name: 'Skicka kvitto - Anmälningsavgift' });
      await dialog.getByRole('textbox', { name: 'Belopp (kr)' }).fill('1250');
      await dialog.getByRole('button', { name: 'Betalsätt' }).click();
      await page.getByRole('option', { name: 'Swish' }).click();
      await dialog.getByRole('button', { name: 'Skicka' }).click();

      await expect(dialog.getByText('MM-2026-1001 skickat till Anna Andersson.')).toBeVisible();

      await expect.poll(() => sentBody()).not.toBeNull();
      const body = sentBody() as unknown as Json;
      expect(body.registrationId).toBe(REG_ID);
      expect(body.eventId).toBe(EVENT_ID);
      expect(body.betalning).toBe('avgift');
      expect(body.belopp).toBe(1250);
      expect(body.betalsatt).toBe('Swish');
      expect(String(body.idempotencyKey)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    test('AKTIVITETSLOGGEN (TASK-201.4 AC #3): ett skickat kvitto postar log-activity med rätt aktör, verb och objekt-namn', async ({
      page,
    }) => {
      const { aktivitetsloggar } = await mocka(page);
      await oppnaSidanOchBetalningar(page);

      const panel = page.locator('section[aria-labelledby="grupp-betalningar"]');
      await panel
        .getByRole('button', { name: 'Skicka kvitto - Anmälningsavgift för Anna Andersson' })
        .click();

      const dialog = page.getByRole('dialog', { name: 'Skicka kvitto - Anmälningsavgift' });
      await dialog.getByRole('textbox', { name: 'Belopp (kr)' }).fill('1250');
      await dialog.getByRole('button', { name: 'Betalsätt' }).click();
      await page.getByRole('option', { name: 'Swish' }).click();
      await dialog.getByRole('button', { name: 'Skicka' }).click();
      await expect(dialog.getByText('MM-2026-1001 skickat till Anna Andersson.')).toBeVisible();

      await expect.poll(() => aktivitetsloggar.length).toBe(1);
      const [logg] = aktivitetsloggar;
      // AKTÖR: ett giltigt (icke-tomt) namn skickas klient-sidan — samma
      // form-bevis som `atgarder-betalningar.staging.test.ts`, den
      // AUKTORITATIVA identiteten härleds server-side.
      expect(logg.actor.name.length).toBeGreaterThan(0);
      expect(logg.actor.account.name.length).toBeGreaterThan(0);
      expect(logg.verb.display['sv-SE']).toBe('skickade kvitto');
      expect(logg.object.definition.name['sv-SE']).toBe('Anna Andersson (Kvittoprövning)');
      expect(logg.object.definition.type).toContain('/activity-types/kvitto');
    });
  });

/**
 * [TASK-402.5, AC #1/#2/#3/#4/#5/#6] ÅTGÄRDS-SIDANS MATARE mot
 * Bekräftelsesteget — "Registrera inbetalning för N markerade".
 *
 * SAMMA SKARV SOM RESTEN AV DENNA FIL: `chromium-authenticated`-projektet,
 * en verkligt inloggad session, `page.route` deterministiskt mockad — ingen
 * delad staging-data rörs. `VITE_FEATURE_BETALNINGAR` är `pa` i e2e-klassen
 * (`atgarder-betalningar.staging.test.ts` § "E2E-KLASSEN KÖR MED FLAGGAN PÅ"),
 * så betalningsblocket (`BetalningsSkrivYta`) och mataren är synliga utan
 * någon fällning att öppna först.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SAMMA FIXTUR SOM `TASK-402.3` — DET ÄR HELA MEKANIKEN BAKOM AC #2
 * ═══════════════════════════════════════════════════════════════════════════
 * `bekraftelseFixtur()` ("Lottas morgon", tio rader/tre event) är EXAKT den
 * data `hamta-oppna-betalningar` mockas med i BÅDE
 * `bekraftelsesteget-promoverings-grind.staging.test.ts` och
 * `bekraftelsesteget.staging.test.ts`. Åtgärds-sidans EGNA `get-registrations`
 * mockas här med tio `Registration`-poster vars `id` är EXAKT samma tio
 * `anmalanRecordId` — samma nyckel `raderPerAnmalan`/`PanelBetalningar`
 * redan slår upp på. Klickar man mataren blir `ids` därför BYTE-IDENTISK med
 * `bekraftelsesteget-promoverings-grind.staging.test.ts`s egen `IDS`-konstant,
 * och steget som öppnas är SAMMA KOMPONENT med SAMMA DATA — mekaniken bakom
 * AC #2:s ariaSnapshot-jämförelse mot 402.3:s COMMITTADE referens
 * (`__aria__/bekraftelsesteget-promoverings-grind.staging.test.ts/
 * bekraftelsesteget-utgangslage-desktop-chromium-authenticated.aria.yml`)
 * längre ner, läst in som INLINE-förväntan (`toMatchAriaSnapshot(sträng)`) i
 * stället för en egen fil — `playwright.config.ts`s `pathTemplate` skopar
 * annars snapshot-filer per `{testFileName}`, så en namngiven referens i
 * DENNA fil hade landat i en NY, egen fil och aldrig prövat mot 402.3:s.
 *
 * `anmalningsavgift: 'Ej mottagen'` sätts på ALLA tio Registration-poster
 * (oavsett fixturens egen `summaInbetalt`) — det garanterar att samtliga tio
 * är `obetald` (`atgardsmallar.ts`) och därmed DEFAULT-MARKERADE av
 * Åtgärds-sidans egen seedning (`obekraftad || obetald`, ingen
 * `mmAtgardsUrval` i denna navigering) utan någon manuell markering i
 * testet. Räkningen "10 markerade" och steget-ankaret "10 av 10 inbetalningar
 * markerade" är därför samma tal, inte en slump.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ERIK HOLM (`rec-rim-005`) BÄR AC #5 GRATIS
 * ═══════════════════════════════════════════════════════════════════════════
 * Fixturen sätter redan `anmalanStatus: 'Obekräftad'` på just den raden
 * (`fixtur.ts` § "Erik (obekräftad anmälan, normalt för en ny)"). `Registration`-
 * mocken speglar samma status. Registreringen går genom
 * `useBekraftelsesteg`/`registrera-inbetalning` — samma väg 402.3 redan bevisat
 * bär NOLL nya Edge Functions och ingen bekräftelse-mutation
 * (`useRegistreraInbetalning`/`useKoaKvitton`/`useRaderaInbetalning`, aldrig
 * `send-action-email`). Denna svit lägger en EGEN spionväg på
 * `send-action-email` som FÄLLER om den någonsin anropas, som ett andra,
 * oberoende bevis för "ingen bekräftelse skickas" — inte bara en upprepning
 * av 402.3:s statiska kod-läsning.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "MARKERINGEN KVAR" (AC #3) — VAD TESTET BEVISAR, OCH VAD DET INTE GÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * `AtgardsSida.tsx` bär ingen egen persistens för `valda`/`synligaIds` över en
 * route-avmontering: `Bekraftelesteget.tsx`s tillbaka-pil är historik-tillbaka
 * (`router.history.back()`), vilket REMONTERAR `AtgardsSida` och kör dess
 * seedning på nytt (`mmAtgardsUrval` eller `obekraftad || obetald`-fallbacken).
 * I DETTA test är `get-registrations`-mocken STATISK — den återspeglar inte
 * någon effekt av registreringen — så reseedningen reproducerar exakt samma
 * tio ID:n, och "markeringen kvar" håller MEKANISKT. Ett scenario där basens
 * egen spegling av betalningsstatus (`anmalningsavgift`/`slutbetalning`, den
 * APP-SKRIVNA spegeln — se `PanelBetalningar.tsx`s docblock) redan hunnit
 * uppdateras INNAN Lotta trycker tillbaka skulle kunna krympa reseedningen
 * (en nu fullbetald person slutar vara `obetald`) — det är INTE prövat här.
 * Uppdragets egen instruktion ("verifiera att den överlever navigeringen,
 * annars är det ett fynd att bokföra, inte en tyst fix i steget") pekar
 * uttryckligen mot att bokföra i stället för att bygga en ny
 * persistensmekanism i `AtgardsSida.tsx` för ett läge testet inte kan
 * framkalla utan att själv hitta på en spegel-uppdateringsväg ingen
 * verklig kod i denna skiva äger. Bokfört som ÖPPET FYND i PR-kroppen.
 */
test.describe('TASK-402.5 — "Registrera inbetalning för N markerade" (AC #1-#6)', () => {
  const EVENT_ID = 'recATGKVITTO00002';
  const GET_REGISTRATIONS_MATARE = '**/functions/v1/get-registrations*';
  const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
  const REGISTRERA_INBETALNING = '**/functions/v1/registrera-inbetalning';
  const SEND_ACTION_EMAIL = '**/functions/v1/send-action-email';

  const DESKTOP = { width: 1440, height: 900 };

  const FIXTUR = bekraftelseFixtur();
  const IDS = FIXTUR.map((b) => b.anmalanRecordId).join(',');
  const ERIK_ID = 'rec-rim-005';

  /** Deterministiskt inbetalnings-UUID per anmälan (samma mönster som
      `bekraftelsesteget.staging.test.ts` § `inbetalningsId` — klientens
      responsschema kräver GILTIG UUID-form, inte bara en unik sträng; mätt
      här: en icke-UUID `id` föll på `zod`s `.uuid()`-validering och läste
      som "fel" trots ett 200-svar). */
  function inbetalningsId(anmalanRecordId: string): string {
    const index = FIXTUR.findIndex((b) => b.anmalanRecordId === anmalanRecordId);
    const suffix = String(index + 1).padStart(12, '0');
    return `c0ffee00-0402-4005-8402-${suffix}`;
  }

  /** Komplett Registration som passerar RegistrationSchema — samma `reg()`-
      form som `atgarder-betalningar.staging.test.ts`/`atgarder-kvitto.
      staging.test.ts`s egen `reg()` ovan, men med `Json`-fälten denna svit
      faktiskt behöver skilja per rad (id/namn/status). */
  function reg(id: string, namn: string, overrides: Json = {}): Json {
    return {
      id,
      namn,
      fornamn: namn.split(' ')[0],
      efternamn: namn.split(' ').slice(1).join(' ') || null,
      email: `${namn.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      telefon: null,
      eventNamn: 'Bulkbetalprövning',
      ort: null,
      status: 'Bekräftad (mail skickat)',
      flagga: null,
      // ALLA obetald (AC #1: default-markerade utan manuell interaktion) —
      // se filhuvudets docblock.
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

  const FACIT: Json[] = FIXTUR.map((b) =>
    reg(b.anmalanRecordId, b.personNamn, {
      status: b.anmalanRecordId === ERIK_ID ? 'Obekräftad' : 'Bekräftad (mail skickat)',
    }),
  );

  function betalningsPanel(page: Page) {
    return page.locator('section[aria-labelledby="grupp-betalningar"]');
  }

  function steget(page: Page) {
    return page.getByTestId('bekraftelsesteget');
  }

  async function mocka(page: Page): Promise<{
    registreringsAnrop: string[];
    bekraftelsemailAnrop: number;
  }> {
    await mockValjarLista(page, [
      valjarRad({ id: EVENT_ID, namn: 'Bulkbetalprövning', startdatum: '2099-06-01' }),
    ]);

    await page.route(GET_REGISTRATIONS_MATARE, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: FACIT }),
      });
    });

    await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ betalningar: FIXTUR, forfallna: 1 }),
      });
    });

    const registreringsAnrop: string[] = [];
    await page.route(REGISTRERA_INBETALNING, async (route: Route) => {
      const body = route.request().postDataJSON() as {
        anmalanRecordId: string;
        belopp: string;
        betalsatt: string;
        betalningsdatum?: string;
      };
      registreringsAnrop.push(body.anmalanRecordId);
      const rad = FIXTUR.find((b) => b.anmalanRecordId === body.anmalanRecordId);
      const nu = new Date().toISOString();
      const belopp = Number(body.belopp.replace(/\s/g, '').replace(',', '.'));
      const summa = (rad?.summaInbetalt ?? 0) + belopp;
      const gallandePris = rad?.gallandePris ?? null;
      // INGEN INDUCERAD FEL-RAD: till skillnad från 402.3:s egen `mocka()`
      // (som alltid fäller `FIXTUR_FEL_ID` en gång) ska ALLA tio lyckas här
      // — felvägen är redan bevisad i `bekraftelsesteget.staging.test.ts`,
      // och en ren "alla lyckades"-körning är det tydligaste beviset för
      // AC #5 (Erik Holm registreras UTAN undantag och UTAN bekräftelse).
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          inbetalning: {
            id: inbetalningsId(body.anmalanRecordId),
            anmalanRecordId: body.anmalanRecordId,
            ogonblicksbildNamn: rad?.personNamn ?? '',
            ogonblicksbildEvent: rad?.eventNamn ?? '',
            ogonblicksbildEventdatum: rad?.eventStartdatum ?? '2099-01-01',
            belopp,
            betalsatt: body.betalsatt,
            betalningsdatum: body.betalningsdatum ?? nu.slice(0, 10),
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
            summa,
            gallandePris,
            saknas: gallandePris === null ? null : gallandePris - summa,
            avgiftKlar: true,
            alltKlart: gallandePris !== null && summa >= gallandePris,
            arForelasning: false,
          },
          spegel: { skrivet: true, forsok: 1, skal: null },
        }),
      });
    });

    // [AC #5] SPIONVÄG: fäller testet om NÅGOT i flödet skulle skicka ett
    // bekräftelsemail. `send-action-email` är den ENDA vägen på denna sida
    // som kan bekräfta en anmälan (`ATGARDER[0]`, "Skicka bekräftelsemail").
    let bekraftelsemailAnrop = 0;
    await page.route(SEND_ACTION_EMAIL, async (route: Route) => {
      bekraftelsemailAnrop += 1;
      await route.fulfill({ status: 500, body: 'send-action-email ska ALDRIG anropas här' });
    });

    return {
      registreringsAnrop,
      get bekraftelsemailAnrop() {
        return bekraftelsemailAnrop;
      },
    };
  }

  test('knappen navigerar med markerades ID:n, steget matchar 402.3s facit, Erik Holm (obekräftad) registreras utan bekräftelse, tillbaka-pilen återställer markeringen, axe utan fel', async ({
    page,
  }) => {
    const mockar = await mocka(page);
    await page.setViewportSize(DESKTOP);
    // `no-preference` explicit — headless Chromium rapporterar annars
    // `reduce`, samma mätning som `bekraftelsesteget-promoverings-grind.
    // staging.test.ts` § `oppna()`.
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    await page.goto(`/event/${EVENT_ID}/atgarder`);
    await expect(page.getByTestId('eventet-block')).toBeVisible();
    const panel = betalningsPanel(page);
    await expect(panel).toBeVisible();

    // ── AC #4: per-person-panelen är OFÖRÄNDRAD ──────────────────────────
    // Tio "Registrera betalning"-knappar (en per person, `PanelBetalningar`
    // ovan) och lika många "Kvar att betala"-rader — mataren adderar en
    // knapp, den tar ingen bort.
    await expect(panel.getByRole('button', { name: 'Registrera betalning' })).toHaveCount(
      FIXTUR.length,
    );
    await expect(panel.getByText('Kvar att betala').first()).toBeVisible();

    // ── AC #1: knappen syns med rätt räkning och navigerar med rätt urval ─
    const knapp = panel.getByRole('button', {
      name: `Registrera inbetalning för ${FIXTUR.length} markerade`,
    });
    await expect(knapp).toBeVisible();
    await knapp.click();

    await expect(page).toHaveURL(/\/mer\/betalningar\/registrera/);
    const stegUrl = new URL(page.url());
    expect(stegUrl.searchParams.get('ids')).toBe(IDS);

    // ── AC #2: steget öppnat härifrån är identiskt med 402.3s facit-
    //    bevisade "utgångsläget" — inline mot den COMMITTADE referensen. ──
    const form = steget(page);
    await expect(
      form.getByText(`${FIXTUR.length} av ${FIXTUR.length} inbetalningar markerade`),
    ).toBeVisible({
      timeout: 15_000,
    });
    const facitYaml = readFileSync(
      join(
        TESTFIL_KATALOG,
        '__aria__',
        'bekraftelsesteget-promoverings-grind.staging.test.ts',
        'bekraftelsesteget-utgangslage-desktop-chromium-authenticated.aria.yml',
      ),
      'utf-8',
    );
    await expect(form).toMatchAriaSnapshot(facitYaml);

    // ── AC #5: Erik Holm (obekräftad) ingår, registreras, och förblir
    //    obekräftad — ingen bekräftelse skickas. Kortets tillgängliga namn
    //    bär INTE längre "Obekräftad" (TASK-402.8, PR #2378 → 6c999f2f:
    //    pillen togs bort ur `KortHuvud`, se VariantC.tsx rad ~868) — formen
    //    efter 402.8 är `"{namn} Markerad"`, verifierad mot
    //    `bekraftelsesteget-promoverings-grind.staging.test.ts`s ariaSnapshot
    //    (`checkbox "Erik Holm Markerad"`). ─────────────────────────────────
    await expect(form.getByRole('checkbox', { name: /Erik Holm Markerad/ })).toBeChecked();

    await form.getByRole('button', { name: `Registrera ${FIXTUR.length} inbetalningar` }).click();
    await expect(form.getByText('Alla inbetalningar registrerade')).toBeVisible({
      timeout: 20_000,
    });
    expect(mockar.registreringsAnrop).toContain(ERIK_ID);
    expect(mockar.registreringsAnrop).toHaveLength(FIXTUR.length);
    expect(mockar.bekraftelsemailAnrop).toBe(0);

    // ── AC #3: tillbaka-pilen återvänder till Åtgärds-sidan, markeringen
    //    är densamma (samma tal, samma urval — se filhuvudets docblock om
    //    vad som INTE prövas). `get-registrations`-mocken är statisk, så
    //    Erik Holm står KVAR som Obekräftad efter round-tripen: hans
    //    registrering skrev aldrig till den mockade posten. ──────────────
    await page.getByRole('button', { name: 'Tillbaka' }).click();
    await expect(page).toHaveURL(new RegExp(`/event/${EVENT_ID}/atgarder`));
    const panelEfter = betalningsPanel(page);
    await expect(panelEfter).toBeVisible();
    await expect(
      panelEfter.getByRole('button', {
        name: `Registrera inbetalning för ${FIXTUR.length} markerade`,
      }),
    ).toBeVisible();

    // ── AC #6: axe utan fel på Åtgärds-sidan efter hela round-tripen ──────
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);
  });
});
