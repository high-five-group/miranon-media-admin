import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockTommaAnteckningar } from './helpers/tomma-anteckningar';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * task-48 — MARKERA-LÄGET i Anmälda deltagare (S86-prototypens facit).
 *
 * Ersätter task-18.6:s hantera-flöde: per-kort-knappen (K46) och Bekräfta
 * alla-pillen med kontrollfråga på rubriken (K47/K48) är RIVNA; batch-
 * bekräftelse via ett explicit markera-läge tog deras plats.
 *
 * AUTO-UTSKICKS-KRYSSET (K44) — RIVET av TASK-145.2, inte längre "orört av
 * task-48": grillad samsyn beslut 2 (S93 Del 3, `tasks/sessions/2026-08-02-
 * session-93.md` rad 158–162) namnger auto-kryssen som en av exakt tre
 * rivningar ur summeringsblocket. De två gamla testerna som verifierade
 * krysset (`AC #3: auto-krysset står i signal-slotten…` / `AC #3: schemalagt
 * datum ur BASEN…`) är ERSATTA av ETT test som mekaniskt bevisar att krysset
 * är BORTA — samma E2E-disciplin som TASK-145.1s AC #11 ("uppdatera
 * assertioner i stället för att lämna dem röda"), tillämpad på en yta vars
 * subjekt är RIVET, inte flyttat. `update-event`-mocken (`UPDATE_EVENT`) och
 * `Mockar.updateEventCalls` lämnas orörda — det nya testet återanvänder dem
 * för att bevisa att anropet ALDRIG sker.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations,
 * send-registration-confirmation, update-event OCH get-event-notes — samma split
 * som 18.4/18.5/18.8: SERVER-kontraktet (mail + status-flip, deny-by-default,
 * icke-prod-spärren) bevisas av
 * `tests/api/send-registration-confirmation.staging.test.ts` + `confirm-registrations.test.ts`
 * mot skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt.
 *
 * TASK-205 (2026-08-14): get-event-notes SAKNADES i mockningen fram till denna
 * rad. Anteckningar-gruppen (task-18.11) fetchar den UNMOCKAD för VARJE event —
 * med `EVENT_ID` (en fixtur, aldrig seedad i skarp staging) svarade skarpa
 * EF:en 404 (bekräftat via `page.on('response')` mot
 * `pqtshyierkdgwdnxuirz.supabase.co`), vilket välte `Strommen` från
 * "Laddar anteckningar…" till felboxen `MessageBox` NÅGON gång under testets
 * gång — ett DOM-childList-hopp på exakt +57px i `div.pt-3.pb-4`
 * (`Anteckningar.tsx`), bekräftat med en `MutationObserver`-tidslinje. Timingen
 * (äkta nätverks-roundtrip mot verklig staging) race:ade mot testets synkrona
 * mätpunkter — landade omslaget MELLAN två `geometri()`-anrop föll AC #1:s
 * dok-invariant med `Received: 57`, annars föll det INTE (falsk grön, inte
 * bevis). Detta var hela mekanismen bakom TASK-205 (post-merge-svepets
 * "layout-invarianten i event-bekräftelse faller på dokumenthöjd") och det
 * "deterministiska 57px" TASK-188 mätte — INGENDERA av kortens ursprungliga
 * hypoteser (kodregression / stagings datavolym) stämde; test-mockningen var
 * bara ofullständig, i strid mot denna docblocks eget påstådda kontrakt och
 * mot syskonkonventionen (idag den delade sömmen `mockTommaAnteckningar()`,
 * `helpers/tomma-anteckningar.ts`, TASK-47 — tidigare `mockNotes()` lokalt i
 * `event-detail.staging.test.ts`).
 *
 * Mockarna är TILLSTÅNDSBÄRANDE: bekräftelse-anropet muterar listan som
 * get-registrations serverar, så batchens utfall bevisas överleva
 * onSettled-refetchen (annars hade korten studsat tillbaka — en falsk grön).
 *
 * BATCH-BEKRÄFTELSEN ÄR RIVEN UR EVENTSIDAN (TASK-145.3 AC #2) — filens namn
 * är därmed historiskt, inte beskrivande. Den behålls ändå: `git mv` hade
 * kostat historiken på ett innehåll som till största delen lever vidare
 * (markera-läget), och filnamnet är inte en yta någon läser för att förstå
 * täckningen. Vilka test som adapterats, tagits bort och tillkommit — och var
 * skulden för de borttagna bokförts — står i describe-blockets eget docblock
 * nedan.
 *
 * Täckning: rivningarna inkl. batch-bekräftelsens (AC #2), markera-lägets
 * in-/utgång inkl. Esc, den vertikala stabiliteten (AC #1), valt korts form +
 * det enda steg-märket, batch-barens tre knappar + live-räknaren, markering i
 * FILTRERAT läge (AC #2), länkarnas vila, registrets scroll-form, axe 0 i
 * läget. [ÄNDRAT, TASK-228] utgångens forna "ärlighet" (AC #3, en disclosure
 * UTAN navigation) är ERSATT av utgångens RIKTIGA navigation — se
 * describe-blockets egen [ÄNDRAT, TASK-228]-not nedan.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const CONFIRM = '**/functions/v1/send-registration-confirmation';
const UPDATE_EVENT = '**/functions/v1/update-event';
const EVENT_ID = 'recBEKRAFTELSE001';

type Json = Record<string, unknown>;

/** Resolva en tokens computed-färg (probe-mönstret — token-kedjan, ej hårdkod). */
async function tokenColor(page: Page, cssVar: string): Promise<string> {
  return page.evaluate((v) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${v})`;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  }, cssVar);
}

/** YYYY-MM-DD `n` dagar från idag (toleranta fönster — T27-klassen). */
function omDagar(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    // Långt fram = utanför tvåveckorsfönstret → signal-slotten bär AUTO-KRYSSET.
    startdatum: omDagar(60),
    slutdatum: omDagar(61),
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 3,
    platserKvar: 9,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.08,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 1,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 3,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 3,
    medfoljande: 0,
    vantelista: 0,
    deltagarinfoAutoAvstangt: false,
    ...overrides,
  };
}

function registrering(overrides: Json): Json {
  return {
    id: 'recX',
    namn: null,
    fornamn: null,
    efternamn: null,
    email: 'namn@example.com',
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
    ...overrides,
  };
}

/**
 * Två OBEKRÄFTADE (Bertil äldst) + en BEKRÄFTAD. Kön är alltså 2 och arkivet 1.
 * Anna bär person-koppling + kategori-pill: hennes kort är formprovet för både
 * pill-växlingen och länkarnas vila i markera-läget.
 */
function grundData(): Json[] {
  return [
    registrering({
      id: 'recAnna',
      namn: 'Anna Ek',
      inskickad: '2026-07-01T09:00:00.000Z',
      personId: 'recPersonAnna',
      kalla: 'Manuell',
      antalGenomfordaEvent: 2,
    }),
    registrering({ id: 'recBertil', namn: 'Bertil Sund', inskickad: '2026-06-20T09:00:00.000Z' }),
    registrering({
      id: 'recCecilia',
      namn: 'Cecilia Lund',
      status: 'Bekräftad (mail skickat)',
      inskickad: '2026-07-05T09:00:00.000Z',
      bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
    }),
  ];
}

/** Sex obekräftade — köns scroll-form kräver fler kort än de ~3 som ryms. */
function mangaObekraftade(): Json[] {
  return Array.from({ length: 6 }, (_, i) =>
    registrering({
      id: `recKo${i}`,
      namn: `Deltagare ${i + 1}`,
      inskickad: `2026-07-0${i + 1}T09:00:00.000Z`,
    }),
  );
}

/**
 * Fyra obekräftade där VARANNAN bär kategori-pillen "Manuellt tillagd" —
 * sågtandens fixtur (fynd (e)). Namn och e-postadresser i verklig längd: det
 * var just den kombinationen som avslöjade felet, eftersom identitetskolumnens
 * radbrytning är det som slår om när pill-slotten stjäl bredd.
 */
function blandadeObekraftade(): Json[] {
  const rader = [
    { namn: 'Anna Ekstrand', post: 'anna.ekstrand@example.se', kalla: 'Manuell' },
    { namn: 'Bertil Sundberg', post: 'bertil.sundberg@example.se', kalla: null },
    { namn: 'Cecilia Lundgren', post: 'cecilia.lundgren@example.se', kalla: 'Manuell' },
    { namn: 'David Nordqvist', post: 'david.nordqvist@example.se', kalla: null },
  ];
  return rader.map((r, i) =>
    registrering({
      id: `recBland${i}`,
      namn: r.namn,
      email: r.post,
      kalla: r.kalla,
      inskickad: `2026-07-0${i + 1}T09:00:00.000Z`,
    }),
  );
}

type Mockar = {
  /** Varje POST-body mot bekräftelse-EF:en. Noll anrop är AC #2:s mekaniska
      bevis: en RIVEN mutation kan inte avfyras, en dold hade kunnat. */
  confirmCalls: Json[];
  /** Varje POST-body mot update-event (auto-krysset, rivet av TASK-145.2). */
  updateEventCalls: Json[];
};

/**
 * TILLSTÅNDSBÄRANDE mockar: bekräftelse-anropet muterar `deltagare`-listan som
 * get-registrations serverar (status + tidsstämpel) — precis som servern gör.
 *
 * [RIVEN, TASK-145.3] `MockOptioner.refetchFordrojningMs` och
 * `Mockar.hamtningarKlara` bodde här. De fanns för `fynd (a)` ("kön töms av
 * SERVERNS svar — inte av omhämtningen"), som prövade batch-bekräftelsens
 * cache-patch. Det testet är borttaget med sitt subjekt (se describe-blockets
 * docblock), och kvarlämnad mät-ställning utan mätare är död kod.
 *
 * CONFIRM-routen står däremot KVAR, med avsikt: den är inte längre en
 * fixtur för ett flöde utan en FÄLLA — om en bekräfta-väg någonsin smyger
 * tillbaka in i eventsidan fångar `confirmCalls` den.
 */
async function mocka(page: Page, event: Json, deltagare: Json[] = grundData()): Promise<Mockar> {
  // task-18.19: väljarens listquery — aldrig staging i deterministisk svit.
  // EVENT_ID ingår (utöver default-raden) sedan TASK-228: Åtgärder-knappen
  // navigerar dit, och destinationens EGEN events.list-query (samma
  // GET_EVENTS_GLOB) behöver kunna slå upp EVENT_ID deterministiskt.
  await mockValjarLista(page, [
    valjarRad({
      id: EVENT_ID,
      namn: event.eventNamn as string,
      startdatum: event.startdatum as string,
    }),
  ]);
  const mockar: Mockar = { confirmCalls: [], updateEventCalls: [] };
  let aktuellt = event;
  const lista = [...deltagare];

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: aktuellt }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations: lista }),
    });
  });
  await page.route(CONFIRM, async (route: Route) => {
    const body = route.request().postDataJSON() as { registrationIds: string[] };
    mockar.confirmCalls.push(body as unknown as Json);
    const nu = '2026-07-22T12:00:00.000Z';
    for (const id of body.registrationIds) {
      const i = lista.findIndex((r) => r.id === id);
      if (i >= 0) {
        lista[i] = { ...lista[i], status: 'Bekräftad (mail skickat)', bekraftelseSkickad: nu };
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'sent',
        requested: body.registrationIds.length,
        attempted: body.registrationIds.length,
        confirmed: body.registrationIds,
        skipped: [],
        failed: [],
        bekraftelseSkickad: nu,
      }),
    });
  });
  await page.route(UPDATE_EVENT, async (route: Route) => {
    const body = route.request().postDataJSON() as Json;
    mockar.updateEventCalls.push(body);
    aktuellt = { ...aktuellt, ...body, id: EVENT_ID };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: aktuellt, record: { id: EVENT_ID, fields: {} } }),
    });
  });
  // Anteckningar-gruppen (task-18.11) fetchar get-event-notes för VARJE event —
  // stubbas tom via delade sömmen (TASK-47) så eventsidans övriga sviter
  // förblir deterministiska. TASK-205: obemockad gick anropet mot SKARP
  // staging med denna fixtur-EVENT_ID (aldrig seedad där), fick 404, och
  // Strommen växlade från laddläge till felboxen någon gång under
  // testkörningen — ett äkta nätverks-race, inte flake i klassisk mening
  // (antecknings-strömmens EGNA beteenden bevisas i
  // `tests/acceptance/event-anteckningar.acceptance.test.ts`).
  await mockTommaAnteckningar(page);
  return mockar;
}

function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/**
 * Markera-lägets kort — RAC Checkbox-formen (rå checkbox per BorOverRad-
 * precedenten). RAC renderar en `<label>` som träffyta med checkbox-ROLLEN på
 * en visuellt gömd `<input>` inuti: labeln bär formen (bakgrund, kant, text),
 * inputen bär tillståndet. Mät därför form på kortet och `toBeChecked()` på
 * `kryssI(kort)` — aldrig aria-checked på labeln (AutoKryss-precedenten).
 */
function markerbaraKort(page: Page) {
  return gruppen(page).getByTestId('markerbart-kort');
}

/** Kortets tillståndsbärare — den dolda inputen med checkbox-rollen. */
function kryssI(kort: ReturnType<typeof markerbaraKort>) {
  return kort.getByRole('checkbox');
}

/** Registret — EN lista sedan TASK-145.1 (kön/arkivet är rivna). */
function registret(page: Page) {
  return gruppen(page).getByTestId('deltagar-register');
}

/**
 * Knappens inset mot BATCH-BAREN (TASK-145.1 AC #11 flyttade knappen dit;
 * rubrikraden den satt på är riven). Knappen är barns barn av baren, så baren
 * är dess förälder. Två knappar med samma inset står på SAMMA plats — en
 * stabilare mätning än absoluta koordinater, eftersom baren själv kan flytta
 * i sidled när innehållet växer ut åt höger.
 */
async function insetIBatchbaren(knapp: ReturnType<typeof gruppen>) {
  return knapp.evaluate((el) => {
    const bar = el.closest('[data-testid="markering-batchbar"]') as HTMLElement;
    const b = el.getBoundingClientRect();
    const r = bar.getBoundingClientRect();
    return { top: b.top - r.top, bottom: r.bottom - b.bottom, left: b.left - r.left };
  });
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

/** Öppna markera-läget via rubrikradens knapp (den ENDA vägen in — byggkrav 5). */
async function oppnaMarkeringslaget(page: Page): Promise<void> {
  await gruppen(page).getByRole('button', { name: 'Markera anmälningar' }).click();
  await expect(gruppen(page).getByRole('button', { name: 'Avbryt markering' })).toBeVisible();
}

/**
 * TASK-145.3 — MARKERA-LÄGET ÖVER VISAD LISTA OCH UTGÅNGEN MOT ÅTGÄRDS-SIDAN.
 *
 * AC #4, EXPLICIT HANTERING AV TÄCKNINGEN (kortets ordalydelse: "filen tas inte
 * bort tyst utan att TASK-147 bär skulden"). Filen står kvar. Det som ändrats:
 *
 * ADAPTERADE (subjektet lever, ytan har flyttat): rivningarna, Markera→Avbryt
 * på samma plats, kortet som klickyta, batch-barens knappar + live-räknaren,
 * korthöjden, fokus-återlämningen, Esc, länkarnas vila, registrets scroll-form
 * och axe. Kön (`obekraftade-ko`) och arkivet är rivna av TASK-145.1 — samtliga
 * lokalisatorer pekar nu på REGISTRET (`deltagar-register`), och antalen är
 * registrets (alla aktiva) i stället för köns (bara obekräftade).
 *
 * BORTTAGNA, med skulden bokförd på `TASK-147` (Åtgärds-sidan är den yta som
 * ska återupprätta dem, eftersom SUBJEKTET flyttar dit — inte försvinner):
 *   1. `byggkrav 3: bekräfta-knappens bredd är LÅST på tvåsiffrig maxform`
 *   2. `byggkrav 6: kontrollfrågan står FÖRE sändning — avbryt skickar ingenting`
 *   3. `AC #1: bekräftad kontrollfråga skickar EXAKT de markerade`
 *   4. `fynd (a): kön töms av SERVERNS svar — inte av omhämtningen`
 *   5. `fynd (c): en ren framgång KVITTERAS`
 *   6. `review-fynd 2: ett icke-rent utfall BEHÅLLER urvalet och läget`
 *   7. `review-fynd 5: Esc med kontrollfrågan uppe stänger BARA dialogen`
 * Samtliga sju prövade bekräfta-flödet från eventsidan — det flöde AC #2 river
 * ("RIVET ur eventsidan, inte dolt"). Ett test som öppnar en dialog som inte
 * finns kan inte hållas grönt, och att skriva om dem mot en yta som ännu inte
 * är byggd vore att testa spekulation.
 *
 * BORTTAGET UTAN SKULD: `fynd (b): arkivet fälls ut när kön töms I SESSIONEN`.
 * Dess subjekt är Bekräftade-arkivets `aria-expanded`, och arkivet självt är
 * rivet av TASK-145.1 (registret är EN lista utan fällbara sektioner). Det
 * finns ingen yta kvar att återupprätta täckningen på — varken här eller på
 * Åtgärds-sidan.
 *
 * TILLKOMNA (skivans egna AC): den vertikala stabiliteten (AC #1), att
 * bekräfta-flödet FAKTISKT är borta och att bekräftelse-EF:en aldrig anropas
 * (AC #2), markera-läget i FILTRERAT läge (AC #2, PRD användarberättelse 12)
 * och utgångens ärlighet (AC #3).
 *
 * [ÄNDRAT, TASK-228] AC #3:s bokstav ("ärlig interim … ingen navigation som
 * saknas") gällde bara SÅ LÄNGE Åtgärds-sidan inte fanns — dess egen text sade
 * det rakt ut ("Formen byts mot en riktig väg vidare när TASK-147 landar").
 * TASK-147 landade och TASK-228 kopplar om Åtgärder-knappen till en RIKTIG
 * navigation; testerna nedan som en gång bevisade disclosure-formen
 * (`atgarder-platshallare`) är omskrivna mot navigationen i stället —
 * se varje tests egen [ÄNDRAT]/[ERSÄTTER]-not.
 */
test.describe('Markera-läget — urvalet och utgången mot Åtgärds-sidan (task-48 + TASK-145.3)', () => {
  test('AC #2: rivningarna — per-kort-knappen (K46), Bekräfta alla-pillen (K47/K48) OCH batch-bekräftelsen finns inte', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // K46: kortfotens Skicka bekräftelse är riven HELT — även i vilande läge.
    await expect(
      gruppen(page).getByRole('button', { name: /^Skicka bekräftelse till/ }),
    ).toHaveCount(0);
    // K47/K48: pillen på Obekräftade-rubriken är ersatt av Markera-knappen.
    await expect(
      gruppen(page).getByRole('button', { name: 'Bekräfta alla obekräftade' }),
    ).toHaveCount(0);
    await expect(gruppen(page).getByRole('button', { name: 'Markera anmälningar' })).toBeVisible();

    // TASK-145.3 AC #2 — batch-bekräftelsen är RIVEN, inte dold: varken i
    // vilande läge eller i markera-läget finns en Bekräfta-knapp kvar, och
    // ingen dialog kan öppnas.
    await expect(gruppen(page).getByRole('button', { name: /^Bekräfta \d+ anmäl/ })).toHaveCount(0);
    await oppnaMarkeringslaget(page);
    await expect(gruppen(page).getByRole('button', { name: /^Bekräfta \d+ anmäl/ })).toHaveCount(0);
    await expect(gruppen(page).getByRole('button', { name: 'Åtgärder' })).toBeVisible();

    // Hela vägen igenom utgången: markera allt, tryck Åtgärder — navigerar
    // till Åtgärds-sidan (TASK-228) — bekräftelse-EF:en anropas ALDRIG. Det
    // är det mekaniska beviset för "rivet, inte dolt": en dold knapp hade
    // fortfarande kunnat avfyra mutationen, en riven kan inte.
    await gruppen(page).getByRole('button', { name: 'Markera alla' }).click();
    await gruppen(page).getByRole('button', { name: 'Åtgärder' }).click();
    await expect(page).toHaveURL(new RegExp(`/event/${EVENT_ID}/atgarder$`));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(mockar.confirmCalls).toHaveLength(0);
  });

  test('AC #1: markera-läget förskjuter inte sidans innehåll vertikalt — vilande, aktivt och med urval', async ({
    page,
  }) => {
    // Mätt i RENDERAD DOM, inte resonerat: registrets överkant och sidans
    // totala höjd före/efter växlingen. Baren monteras ALLTID (även i vilande
    // läge, med enbart Markera-knappen) och knapparna växer ut åt HÖGER när
    // läget slås på — en horisontell utvidgning i stället för en ny rad.
    await mocka(page, eventDetail(), mangaObekraftade());
    await oppnaEventsidan(page);

    const geometri = async () =>
      registret(page).evaluate((el) => {
        // Baren är registrets SYSKON i samma wrapper. Ingen optional chaining:
        // saknas den ska mätningen falla synligt (−1), inte kasta.
        const bar = el.parentElement
          ? (el.parentElement.querySelector('[data-testid="markering-batchbar"]') as HTMLElement)
          : null;
        return {
          top: Math.round(el.getBoundingClientRect().top + window.scrollY),
          dok: Math.round(document.documentElement.scrollHeight),
          bar: bar === null ? -1 : Math.round(bar.getBoundingClientRect().height),
        };
      });

    const vilande = await geometri();
    await oppnaMarkeringslaget(page);
    const aktivt = await geometri();
    expect(Math.abs(aktivt.top - vilande.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(aktivt.dok - vilande.dok)).toBeLessThanOrEqual(1);
    expect(Math.abs(aktivt.bar - vilande.bar)).toBeLessThanOrEqual(1);

    // …och när Rensa dyker upp vid första markeringen (den tredje knappen på
    // raden) står geometrin fortfarande still.
    await markerbaraKort(page).first().click();
    const medUrval = await geometri();
    expect(Math.abs(medUrval.top - vilande.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(medUrval.dok - vilande.dok)).toBeLessThanOrEqual(1);

    // Vägen ut lämnar den också still.
    await gruppen(page).getByRole('button', { name: 'Avbryt markering' }).click();
    const efter = await geometri();
    expect(Math.abs(efter.top - vilande.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(efter.dok - vilande.dok)).toBeLessThanOrEqual(1);
  });

  test('byggkrav 1: Markera → Avbryt står på SAMMA plats i batch-barens vänsterkant', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const markera = gruppen(page).getByRole('button', { name: 'Markera anmälningar' });
    const foreInset = await insetIBatchbaren(markera);
    await markera.click();

    const avbryt = gruppen(page).getByRole('button', { name: 'Avbryt markering' });
    await expect(avbryt).toBeVisible();
    await expect(markera).toHaveCount(0);

    // SAMMA PLATS mätt som inset mot baren (review-våg 3-precedenten, nu mot
    // knappens nya förankring). Bredden skiljer — etiketterna skiljer — men
    // platsen är densamma: vänsterkanten är förankringen.
    const efterInset = await insetIBatchbaren(avbryt);
    expect(Math.abs(efterInset.left - foreInset.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(efterInset.top - foreInset.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(efterInset.bottom - foreInset.bottom)).toBeLessThanOrEqual(1);

    // Avbryt lämnar läget och återställer Markera-knappen.
    await avbryt.click();
    await expect(gruppen(page).getByRole('button', { name: 'Markera anmälningar' })).toBeVisible();
    await expect(markerbaraKort(page)).toHaveCount(0);
  });

  test('byggkrav 2: hela kortet är klickyta med checkbox-semantik; valt kort byter form och behåller sitt ENDA steg-märke', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    // Registret bär ALLA aktiva (TASK-145.1) — tre kort, inte köns två.
    const kort = markerbaraKort(page);
    await expect(kort).toHaveCount(3);
    const anna = kort.filter({ hasText: 'Anna Ek' });
    await expect(kryssI(anna)).not.toBeChecked();

    // EXAKT ETT märke per person i BÅDA lägena (PRD användarberättelse 5).
    // Steg-märket ERSATTE både Obekräftad-pillen och kategori-pillen i
    // registret (TASK-145.1/145.2) — det är alltså inte längre pill-växlingen
    // som prövas här, utan att märket är ETT och står kvar genom valet.
    await expect(anna.getByTestId('hallplats-marke')).toHaveCount(1);
    await expect(anna.getByText('Obekräftad', { exact: true })).toHaveCount(0);
    await expect(anna.getByText('Manuellt tillagd')).toHaveCount(0);

    // Hela kortet är klickytan — ett klick mitt i kortet väljer.
    await anna.click();
    await expect(kryssI(anna)).toBeChecked();

    // VALT: success-bakgrund + success-kant (byggkrav 2, token-kedjan).
    await expect(anna).toHaveCSS('background-color', await tokenColor(page, '--mm-success-bg'));
    await expect(anna).toHaveCSS('border-top-color', await tokenColor(page, '--mm-success'));
    await expect(anna.getByTestId('hallplats-marke')).toHaveCount(1);

    // WCAG 1.4.1 (byggkrav 7, REVIDERAT 2026-07-26 i Marcus design-review):
    // check-glyfen är riven. Bäraren är kanten, och det som gör den till en
    // icke-färg-signal är att den OVALDA kanten är transparent — markeringen
    // är alltså att en kontur uppstår, inte att en färg byts. Testet vaktar
    // därför frånvaron av glyf OCH den transparenta ovalda kanten; tonas den
    // senare upp till en synlig neutral kant blir skillnaden ren nyans och
    // 1.4.1 faller, vilket detta fall då fångar.
    await expect(anna.getByTestId('markering-check')).toHaveCount(0);
    const ovald = kort.filter({ hasNotText: 'Anna Ek' });
    await expect(ovald.first()).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  });

  test('byggkrav 3: batch-baren — Åtgärder mutad vid 0, Markera alla, Rensa vid ≥1, live-räknare', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    const bar = gruppen(page).getByTestId('markering-batchbar');
    const atgarder = bar.getByRole('button', { name: 'Åtgärder' });
    const markeraAlla = bar.getByRole('button', { name: 'Markera alla' });
    const rensa = bar.getByRole('button', { name: 'Rensa' });

    // 0 valda: Åtgärder mutad (primitivens isDisabled — appens etablerade form;
    // soft-disable-frågan är T54 och avgörs inte i en skiva), Rensa finns inte,
    // Markera alla är aktiv.
    await expect(atgarder).toBeDisabled();
    await expect(rensa).toHaveCount(0);
    await expect(markeraAlla).toBeEnabled();

    // Markera alla → alla tre valda; knappen muteras när allt är valt, Rensa
    // dyker upp, Åtgärder blir tryckbar.
    await markeraAlla.click();
    await expect(atgarder).toBeEnabled();
    await expect(markeraAlla).toBeDisabled();
    await expect(rensa).toBeVisible();

    // Live-räknaren för skärmläsare (byggkrav 3). Lokaliseras via ROLLEN, inte
    // testid:t: rivs `role="status"`/`aria-live` är räknarens enda AT-bärare död
    // medan texten står kvar — ett testid-baserat test hade förblivit grönt.
    // Elementet är sr-only, så inget visuellt test fångar bortfallet heller.
    const live = gruppen(page)
      .getByRole('status')
      .filter({ hasText: /markerade$/ });
    await expect(live).toHaveText('3 av 3 markerade');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveAttribute('aria-atomic', 'true');

    // Rensa → tillbaka till noll.
    await rensa.click();
    await expect(atgarder).toBeDisabled();
    await expect(rensa).toHaveCount(0);
    await expect(live).toHaveText('0 av 3 markerade');
    await expect(kryssI(markerbaraKort(page).first())).not.toBeChecked();
  });

  test('AC #2: markera-läget verkar över VISAD lista — ett filtrerat läge markeras utan att filtret rensas', async ({
    page,
  }) => {
    // PRD användarberättelse 12: "markera inom ett filtrerat läge … utan att
    // bocka tjugo kort". Fram till TASK-145.3 bar produktionens filtrerade gren
    // ingen batch-bar alls — vägen fanns inte.
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Ofiltrerat: registret bär alla tre aktiva.
    await expect(registret(page).getByTestId('deltagar-kort')).toHaveCount(3);

    // Filtrera på steg-räknaren "Väntar på bekräftelse" → två av tre.
    await gruppen(page)
      .getByRole('button', { name: /^Väntar på bekräftelse/ })
      .click();
    await expect(registret(page).getByTestId('deltagar-kort')).toHaveCount(2);
    // [ÄNDRAT, TASK-162.3 → TASK-166] Knappen heter "Rensa filter" (den
    // promoverade filterpanelens badge-bärande knapp, `RegisterFilterRad`),
    // inte längre "Rensa filtret" (den rivna flik-formens länk, TASK-162.3
    // AC #1). Namnet bär en sr-only-räknare ("Rensa filter, 1 aktivt
    // filterval") — regex matchar prefixet oavsett räknarens värde, samma
    // mönster som `event-deltagare.staging.test.ts` redan använder.
    await expect(gruppen(page).getByRole('button', { name: /^Rensa filter/ })).toBeVisible();

    // Markera-läget finns HÄR, och verkar över den filtrerade listan.
    await oppnaMarkeringslaget(page);
    await expect(markerbaraKort(page)).toHaveCount(2);
    await gruppen(page).getByRole('button', { name: 'Markera alla' }).click();
    const live = gruppen(page)
      .getByRole('status')
      .filter({ hasText: /markerade$/ });
    await expect(live).toHaveText('2 av 2 markerade');

    // Urvalet följer med ut i utgången (TASK-228) — EXAKT det filtrerade
    // urvalet (Anna + Bertil), inte hela registret (Cecilia utelämnad),
    // buret i navigeringens history-state (Deltagare.tsx § mmAtgardsUrval).
    await gruppen(page).getByRole('button', { name: 'Åtgärder' }).click();
    await expect(page).toHaveURL(new RegExp(`/event/${EVENT_ID}/atgarder$`));
    const urval = await page.evaluate(() => window.history.state.mmAtgardsUrval as string[]);
    expect([...urval].sort()).toEqual(['recAnna', 'recBertil'].sort());
  });

  /**
   * [ERSÄTTER, TASK-228] Den forna "AC #3: utgången är en ÄRLIG interim" —
   * TASK-145.3s AC #3 krävde en disclosure UTAN navigation, exakt för att
   * Åtgärds-sidan då inte fanns (§ "Formen byts mot en riktig väg vidare när
   * TASK-147 landar"). TASK-147 landade och TASK-228 kopplar om knappen — AC
   * #3:s bokstav är därmed medvetet UPPHÄVD, inte bruten. Detta test bevisar
   * i stället TASK-228s eget AC #1: en RIKTIG navigation som landar med
   * EXAKT urvalet som mottagare (QA 147.9 steg 1: "Markera 2 deltagare på
   * eventdetaljen → Åtgärder → mottagarna är SAMMA kort, avmarkera en").
   */
  test('AC #1 (TASK-228): Åtgärder navigerar till Åtgärds-sidan med EXAKT urvalet som mottagare, avmarkering fungerar där', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);
    await markerbaraKort(page).filter({ hasText: 'Anna Ek' }).click();
    await markerbaraKort(page).filter({ hasText: 'Bertil Sund' }).click();

    const atgarder = gruppen(page).getByRole('button', { name: 'Åtgärder' });
    // [RIVEN, TASK-228] Knappen var en DISCLOSURE (aria-expanded/aria-
    // controls) mot en interim-platshållare — nu en RIKTIG navigation, utan
    // disclosure-semantik kvar.
    await expect(atgarder).not.toHaveAttribute('aria-expanded');
    await expect(atgarder).not.toHaveAttribute('aria-controls');

    await atgarder.click();
    await expect(page).toHaveURL(new RegExp(`/event/${EVENT_ID}/atgarder$`));
    await expect(page.getByTestId('eventet-block')).toBeVisible();

    // Mottagarräkningen: exakt 2 av 3 — Cecilia (omarkerad) är INTE med.
    await expect(page.getByTestId('markering-rakning')).toHaveText('2 av 3 deltagare markerade');

    // Fäll ut listan — SAMMA kort som markerades på eventdetaljen (PRD-kravet
    // "EXAKT SAMMA KORT IGEN … i markeringsläge, alltså gröna").
    await page.getByRole('button', { name: /deltagare markerade$/ }).click();
    const mottagarkort = page.getByTestId('markerbart-kort');
    await expect(mottagarkort).toHaveCount(2);
    await expect(mottagarkort.filter({ hasText: 'Anna Ek' })).toBeVisible();
    await expect(mottagarkort.filter({ hasText: 'Bertil Sund' })).toBeVisible();
    await expect(mottagarkort.filter({ hasText: 'Cecilia Lund' })).toHaveCount(0);

    // Avmarkera en (QA 147.9 steg 1) — kortet ligger KVAR i listan, bara
    // avkryssat: samma grammatik som eventdetaljens markera-läge (§
    // MottagarYta "Ett avmarkerat kort ligger kvar i listan"). Klick på
    // KORTET (labeln), inte på `kryssI()` direkt — samma idiom som
    // `markerbaraKort(page).filter(...).click()` ovan (RAC-labeln bär
    // träffytan, `kryssI()` är bara assertion-lokatorn).
    await mottagarkort.filter({ hasText: 'Anna Ek' }).click();
    await expect(page.getByTestId('markering-rakning')).toHaveText('1 av 3 deltagare markerade');
    await expect(mottagarkort).toHaveCount(2);
    await expect(kryssI(mottagarkort.filter({ hasText: 'Anna Ek' }))).not.toBeChecked();
    await expect(kryssI(mottagarkort.filter({ hasText: 'Bertil Sund' }))).toBeChecked();
  });

  test('fynd (e): korthöjden är oberoende av märkets innehåll — mellan kort OCH genom lägena', async ({
    page,
  }) => {
    // Sågtanden: pill-slotten var innehålls-styrd (`max-w-[45%]`), så
    // identitetskolumnen ärvde variationen och e-posten radbröts bara på korten
    // MED märke. Uppmätt på 430 px före fixen: 166/145/166/145, och samma kort
    // hoppade 166 → 145 när Obekräftad-pillen vek vid val. Slotten är sedan
    // dess RESERVERAD; märkets egen bredd är dessutom låst av dess interna
    // grid över alla sex etiketter (HallplatsMarke).
    await page.setViewportSize({ width: 430, height: 900 });
    await mocka(page, eventDetail(), blandadeObekraftade());
    await oppnaEventsidan(page);

    const hojder = async (testid: string) =>
      gruppen(page)
        .getByTestId(testid)
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));

    // Fyra kort, varannat med "Manuellt tillagd" som VÄG IN — vägen in syns
    // inte längre på kortet (den är en filteraxel sedan TASK-145.1), så alla
    // fyra bär samma ENDA märke. Det är exakt den likformighet som ska hålla.
    await expect(registret(page).getByTestId('hallplats-marke')).toHaveCount(4);
    const vilande = await hojder('deltagar-kort');
    expect(vilande).toHaveLength(4);
    expect(Math.max(...vilande) - Math.min(...vilande)).toBeLessThanOrEqual(1);

    // Samma höjd i markera-läget…
    await oppnaMarkeringslaget(page);
    const iLage = await hojder('markerbart-kort');
    expect(Math.max(...iLage) - Math.min(...iLage)).toBeLessThanOrEqual(1);
    expect(Math.abs(iLage[0] - vilande[0])).toBeLessThanOrEqual(1);

    // …och när två kort väljs.
    await markerbaraKort(page).filter({ hasText: 'Anna Ekstrand' }).click();
    await markerbaraKort(page).filter({ hasText: 'Bertil Sundberg' }).click();
    const valda = await hojder('markerbart-kort');
    expect(Math.max(...valda) - Math.min(...valda)).toBeLessThanOrEqual(1);
    expect(Math.abs(valda[0] - vilande[0])).toBeLessThanOrEqual(1);

    // Pill-slotten är RESERVERAD: identisk bredd på varje kort.
    const slotBredder = await gruppen(page)
      .getByTestId('markerbart-kort')
      .evaluateAll((els) =>
        els.map((el) => {
          const namn = el.querySelector('[data-testid="deltagar-namn"]') as HTMLElement;
          const slot = namn.parentElement?.nextElementSibling as HTMLElement;
          return Math.round(slot.getBoundingClientRect().width);
        }),
      );
    expect(new Set(slotBredder).size).toBe(1);
  });

  test('review-fynd 1: fokus återlämnas till Markera-knappen när läget stängs', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);
    await gruppen(page).getByRole('button', { name: 'Avbryt markering' }).click();

    const markera = gruppen(page).getByRole('button', { name: 'Markera anmälningar' });
    await expect(markera).toBeVisible();
    await expect(markera).toBeFocused();
  });

  test('byggkrav 7: Esc lämnar markera-läget', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    await markerbaraKort(page).first().click();
    await expect(kryssI(markerbaraKort(page).first())).toBeChecked();

    await page.keyboard.press('Escape');
    await expect(gruppen(page).getByRole('button', { name: 'Markera anmälningar' })).toBeVisible();
    await expect(markerbaraKort(page)).toHaveCount(0);
  });

  test('byggkrav 5 + Marcus-beslut 1: länkarna VILAR i markera-läget men står i vilande läge', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // VILANDE: personkortet bär BÅDA länkarna (person + anmälan) — 18.17/K62-formen
    // är oförändrad, prototypens avsaknad var förenkling. Registret bär alla
    // tre aktiva: en person-koppling (Anna) och tre anmälnings-länkar.
    const reg = registret(page);
    await expect(reg.locator('a[href*="/personer/"]')).toHaveCount(1);
    await expect(reg.locator('a[href*="/anmalan/"]')).toHaveCount(3);
    // Historikraden (K45) står kvar — Anna har två tidigare event.
    await expect(
      reg
        .getByTestId('deltagar-kort')
        .filter({ hasText: 'Anna Ek' })
        .getByTestId('deltagar-historik'),
    ).toHaveText('2 tidigare event hos Miranon Media');

    // MARKERA-LÄGET: länkarna vilar (iOS edit-mode-konventionen) — noll ankare
    // i registret, så L303:s interaktivt-i-interaktivt hålls med kortet som checkbox.
    await oppnaMarkeringslaget(page);
    await expect(reg.locator('a')).toHaveCount(0);
    // Innehållet finns kvar som text — bara affordansen vilar.
    await expect(reg.getByText('Anmäld 1 juli')).toBeVisible();
    await expect(reg.getByTestId('deltagar-historik').first()).toBeVisible();
  });

  test('byggkrav 4: registret scrollar inline med ~3 kort synliga i stället för att växa', async ({
    page,
  }) => {
    await mocka(page, eventDetail(), mangaObekraftade());
    await oppnaEventsidan(page);

    const reg = registret(page);
    const matt = await reg.evaluate((el) => ({
      client: el.clientHeight,
      scroll: el.scrollHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));

    // Sex kort ryms inte — innehållet är högre än rutan och rutan scrollar.
    expect(matt.scroll).toBeGreaterThan(matt.client);
    expect(matt.overflowY).toBe('auto');
    // max-h ≈ 25.5rem (408 px): klippet mitt i kort 4 ÄR scroll-affordansen.
    expect(matt.client).toBeLessThanOrEqual(408);
    expect(matt.client).toBeGreaterThan(240);

    // Scrollregionen är tangentbordsnåbar (byggkrav 7) — fokuserbar rullningsyta,
    // med registrets EGEN etikett (TASK-145.1 AC #7), inte köns ärvda.
    await expect(reg).toHaveAttribute('tabindex', '0');
    await expect(reg).toHaveAttribute('aria-label', 'Deltagarregister');
  });

  /**
   * [ÄNDRAT, TASK-228] Scannade tidigare EN andra gång med utgångens
   * interim-platshållare utfälld på SAMMA sida (disclosure-formen, TASK-
   * 145.3 AC #3). Åtgärder navigerar nu bort från eventdetaljen — det finns
   * ingen "utfälld" DOM kvar HÄR att scanna. Åtgärds-sidans egen axe-
   * täckning i mottagarurvalet-öppet-läget bärs redan av
   * `atgardssida-promoverings-grind.spec.ts` ("mottagarurvalet öppet …
   * axe 0"), så täckningen flyttar med subjektet, den försvinner inte.
   */
  test('axe 0 i markera-läget med valda kort', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);
    await markerbaraKort(page).first().click();

    const lage = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(lage.violations).toEqual([]);
  });
});

test.describe('Eventinfo-radens signal-slot — auto-utskicks-krysset RIVET (TASK-145.2)', () => {
  test('signal-slotten bär ALDRIG längre ett kryss — bara "Dags att skicka"-badgen eller tomt, och update-event anropas aldrig', async ({
    page,
  }) => {
    // Utanför tvåveckorsfönstret (eventDetail()s default startdatum, 60 dagar
    // fram) visade den gamla koden AutoKryss-fallbacken här. Efter rivningen
    // (grillad samsyn beslut 2) ska slotten stå HELT TOM i samma läge —
    // reserverad höjd (K44/AC #3 i TASK-145.1), men utan innehåll.
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slot).toBeVisible();
    await expect(slot.getByRole('checkbox')).toHaveCount(0);
    await expect(slot).toBeEmpty();

    // Ingen skrivväg kvar på denna yta: update-event (auto-krysset skrev hit)
    // anropas aldrig, oavsett vad Lotta gör på sidan.
    expect(mockar.updateEventCalls).toHaveLength(0);
  });

  test('inom tvåveckorsfönstret visas ENDAST "Dags att skicka"-badgen, aldrig ett kryss bredvid den', async ({
    page,
  }) => {
    // Samma bas som `deltagarinfoSchemalagd`-testet ovan hade (schemalagt
    // datum ur BASEN) demonstrerade tidigare — men nu prövas att badgen och
    // krysset aldrig samexisterar, sedan krysset revs helt.
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }));
    await oppnaEventsidan(page);

    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slot.getByText(/^Dags att skicka/)).toBeVisible();
    await expect(slot.getByRole('checkbox')).toHaveCount(0);
  });
});
