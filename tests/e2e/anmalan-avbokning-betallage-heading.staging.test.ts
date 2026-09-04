import AxeBuilder from '@axe-core/playwright';
import type { z } from 'zod';
import type { RegistrationDetailSchema } from '../../src/domain/schemas';
import { expect, type Page, test } from '../support/test-bas';

/**
 * TASK-382 — Regressionsbevis för h2→h3-rubrikordningen i avbokningsstegets
 * betalläge (`AvbokningsBetallage`, monterad av `AvbokningsYta` inuti
 * `DetaljGrupp`s `<h2>`). Symptomet (368.5-byggarens fynd, PR #2267): en
 * `<h4>` direkt under `DetaljGrupp`s `<h2>` — ett axe `heading-order`-hopp —
 * osynligt i den hermetiska acceptance-sviten eftersom komponenten aldrig
 * MONTERAS där. Fixen (denna skiva) bytte `<h4>` mot `<h3>` i
 * `AvbokningsBetallage.tsx`; detta test bevisar att den håller.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN — SAMMA SKÄL, SAMMA FORM
 * SOM `tests/e2e/persondetalj-betalningar-fellage.staging.test.ts`
 * ═══════════════════════════════════════════════════════════════════════════
 * `VITE_FEATURE_BETALNINGAR` är explicit `'av'` för HELA den delade
 * acceptance/visual/webblasarbeteende/manifest-screenshots-fixturvärlden
 * (`playwright.config.ts`, kommentaren vid `VITE_FEATURE_BETALNINGAR: 'av'`):
 * flaggan på UTAN att samtidigt mocka `JobbLyssnare`s Supabase Realtime-kanal
 * hade fällt VARJE autentiserad test i den delade klassen som
 * `OmockadWebSocketError` (mätt 48/48 innan flaggan sattes av, samma
 * kommentar). Att flippa den delade flaggan — eller bygga ett eget
 * hermetiskt webServer/CI-jobb bara för denna skiva — är exakt den typ av
 * bred, riskfylld ändring `TASK-346.6`/`346.7` (öppen, egna skivor) äger,
 * inte detta smala a11y-fynd (`anmalan-avbokning.acceptance.test.ts`s egen
 * docblock, § "BETALLÄGET I STEGET TESTAS INTE HÄR", säger samma sak för
 * exakt denna yta).
 *
 * Staging bär redan `VITE_FEATURE_BETALNINGAR=pa` (`.env.staging`, samma som
 * `.env.development`), och `chromium-authenticated`-projektet körs mot
 * verklig staging med en verklig inloggad session
 * (`playwright/.auth/user.json`) — INGEN hermetik-vakt i denna klass, så en
 * riktig WebSocket-uppkoppling mot riktig infrastruktur är oproblematisk.
 * Deterministiskt via `page.route`, ALDRIG `network.use()` (den senare är
 * acceptance-klassens MSW-mekanism): `get-registration`,
 * `hamta-oppna-betalningar` och `hamta-inbetalningar` mockas alla tre
 * lokalt per test, ingen delad staging-data muteras eller läses.
 *
 * ÖPPEN AVVIKELSE MOT AC #2:S ORDALYDELSE ("hermetiskt") — bokförd, inte
 * tyst (TASK-382-uppdragets egen eskaleringsväg: "finns ingen [mekanism],
 * bokför öppet vilken form du valde och varför"). Det finns i dag INGEN
 * runtime-väg att sätta `VITE_FEATURE_BETALNINGAR` per test i den hermetiska
 * acceptance-världen — flaggan läses en gång vid Vite-serverns start
 * (`src/lib/funktionsflaggor.ts`s egen docblock: "Värdet bestäms vid BYGGTID
 * ... och kan inte ändras i drift"), och den delade acceptance-webServern
 * körs EN gång för samtliga ~30 filer i klassen. Detta test är alltså
 * DETERMINISTISKT och NÄTVERKSMOCKAT (samma disciplin som hermetik-vakten
 * kräver), men det körs mot en riktig inloggad staging-session snarare än
 * MSW-fixturvärlden — den enda skillnaden mot "hermetiskt" i sitt strikta
 * MSW-sinne.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SCOPE — RÖR ALDRIG #2267:S FILER
 * ═══════════════════════════════════════════════════════════════════════════
 * `AvbokningsYta.tsx`, `OmbokningsSteg.tsx` och
 * `tests/acceptance/anmalan-ombokning.acceptance.test.ts` ägs av
 * TASK-368.5-byggaren (PR #2267, gren `feat/task-368-5-ombokningssteget`,
 * pågående när denna skiva byggdes) — denna fil är NY och rör ingen av dem.
 */

const EVENT_ID = 'recAVBOKNING38200';
const REG_ID = 'recAvbok38200Anna';

type DetaljRow = z.infer<typeof RegistrationDetailSchema>;

/** Samma bekräftade-anmälan-form som `anmalan-avbokning.acceptance.test.ts`s
    `detalj()` — `lage === 'aktiv'` kräver en av de tre AKTIVA_STATUSAR
    (`AvbokningsYta.tsx` § `harledAvbokningslage`); "Bekräftad (mail skickat)"
    är en av dem. */
function detalj(overrides: Partial<DetaljRow> = {}): DetaljRow {
  return {
    id: REG_ID,
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
    notering: null,
    eventId: EVENT_ID,
    personId: 'recPerson3820001',
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
    anmalanId: 38200,
    franFormular: 'Huvudformulär',
    franFormularId: 'selQyiMaRVXuu7Nm5',
    fragorFunderingar: null,
    villkorOk: true,
    eventTyp: 'Utbildning',
    eventOrt: 'Skövde',
    startdatum: '2026-08-10',
    slutdatum: '2026-08-12',
    tidKvar: '2 veckor och 3 dagar',
    eventKey: 'Event-382',
    deadlineSlutbetalning: '2026-07-27',
    dagarKvarTillDeadline: 3,
    plusOneForfraganSkickad: null,
    medfoljandeTillNamn: null,
    plusEttor: [],
    sidUrl: null,
    utm: null,
    ...overrides,
  };
}

// PREFIX-KOLLISIONEN (samma fälla `persondetalj-betalningar-fellage.staging.test.ts`
// § `GET_PERSON` beskriver): "get-registration" är ett prefix av
// "get-registrations" (listan, TabBar/eventsidans prefetch). RegExp med
// literalt `?` (query-delimitern `get-registration` ALLTID bär, `{ id }`)
// håller isär dem — "get-registrations" har `s` där mönstret kräver `?`.
const GET_REGISTRATION = /\/functions\/v1\/get-registration\?/;
const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';
const HAMTA_INBETALNINGAR = '**/functions/v1/hamta-inbetalningar*';

async function mockGetRegistration(page: Page, rad: DetaljRow): Promise<void> {
  await page.route(GET_REGISTRATION, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registration: rad }),
    });
  });
}

/** Tomt betalläge — `kvar === null` i `AvbokningsBetallage`, "Inget att
    betala." (reviderad 2026-09-04, S120, TASK-391, ur "Inget kvar att
    betala."). Testet prövar rubrikordningen, inte beloppen. */
async function mockOppnaBetalningarTom(page: Page): Promise<void> {
  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar: [], forfallna: 0 }),
    });
  });
}

async function mockInbetalningarTom(page: Page): Promise<void> {
  await page.route(HAMTA_INBETALNINGAR, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        inbetalningar: [],
        kvitton: [],
        jobbfel: [],
        spegel: { summaPostgres: 0, summaBasen: 0, iFas: true },
      }),
    });
  });
}

function avbokningssektion(page: Page) {
  return page.locator('section[aria-labelledby="grupp-avbokning"]');
}

test.describe('Avbokningsstegets betalläge — rubrikordning med VITE_FEATURE_BETALNINGAR på (TASK-382)', () => {
  test('AvbokningsBetallage renderar h3 (inte h4) direkt under DetaljGrupps h2 — axe heading-order 0 överträdelser', async ({
    page,
  }) => {
    await mockGetRegistration(page, detalj());
    await mockOppnaBetalningarTom(page);
    await mockInbetalningarTom(page);

    await page.goto(`/event/${EVENT_ID}/anmalan/${REG_ID}`);

    const sektion = avbokningssektion(page);
    await expect(sektion.getByRole('heading', { level: 2, name: 'Avbokning' })).toBeVisible();

    await sektion.getByRole('button', { name: 'Avboka anmälan' }).click();

    const steg = sektion.getByRole('group', { name: 'Avboka anmälan för Anna Andersson' });
    await expect(steg).toBeVisible();

    // FUNKTIONELLT BEVIS: rubriken är monterad och bär rätt roll/nivå — axe-
    // scanningen nedan bevisar strukturen (DOM-ordningen mot h2:an), denna
    // rad bevisar att komponenten (och därmed flaggan) faktiskt är PÅ.
    await expect(steg.getByRole('heading', { level: 3, name: 'Betalläge' })).toBeVisible();

    // KÄRNBEVISET (AC #1): 0 axe heading-order-överträdelser för sektionen
    // som bär BÅDA rubrikerna (DetaljGrupps h2 "Avbokning" + AvbokningsBetallages
    // h3 "Betalläge") — samma tagset som a11y-projektets `checkA11y`-fixture
    // och `persondetalj-betalningar-fellage.staging.test.ts`.
    const results = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-avbokning"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
