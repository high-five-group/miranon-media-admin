import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, type Route, test } from '@playwright/test';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-48 — MARKERA-LÄGET i Anmälda deltagare (S86-prototypens facit).
 *
 * Ersätter task-18.6:s hantera-flöde: per-kort-knappen (K46) och Bekräfta
 * alla-pillen med kontrollfråga på rubriken (K47/K48) är RIVNA; batch-
 * bekräftelse via ett explicit markera-läge tog deras plats. Auto-utskicks-
 * krysset (K44) står orört och behåller sina två tester.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event, get-registrations,
 * send-registration-confirmation och update-event — samma split som 18.4/18.5/18.8:
 * SERVER-kontraktet (mail + status-flip, deny-by-default, icke-prod-spärren) bevisas av
 * `tests/api/send-registration-confirmation.staging.test.ts` + `confirm-registrations.test.ts`
 * mot skarp staging; dessa e2e bevisar KLIENTENS form och beteende flak-fritt.
 *
 * Mockarna är TILLSTÅNDSBÄRANDE: bekräftelse-anropet muterar listan som
 * get-registrations serverar, så batchens utfall bevisas överleva
 * onSettled-refetchen (annars hade korten studsat tillbaka — en falsk grön).
 *
 * Täckning: rivningarna (AC #2), markera-lägets in-/utgång inkl. Esc, valt
 * korts form + pill-växlingen, batch-barens tre knappar + breddlåset,
 * kontrollfrågan med båda vägarna, länkarnas vila, live-räknaren, köns
 * scroll-form, axe 0 i läget (AC #1).
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
  /** Varje POST-body mot bekräftelse-EF:en (kontrollfrågans bevis: noll = inget hänt). */
  confirmCalls: Json[];
  /** Varje POST-body mot update-event (auto-krysset). */
  updateEventCalls: Json[];
  /** Antal get-registrations-svar som FAKTISKT landat (fördröjningen inräknad). */
  hamtningarKlara: number;
};

/** Fördröj varje omhämtning EFTER den första — staging-latensen i miniatyr. */
type MockOptioner = { refetchFordrojningMs?: number };

/**
 * TILLSTÅNDSBÄRANDE mockar: bekräftelse-anropet muterar `deltagare`-listan som
 * get-registrations serverar (status + tidsstämpel) — precis som servern gör — så att
 * refetchen efter mutationen bekräftar utfallet i stället för att rulla tillbaka det.
 */
async function mocka(
  page: Page,
  event: Json,
  deltagare: Json[] = grundData(),
  optioner: MockOptioner = {},
): Promise<Mockar> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  const mockar: Mockar = { confirmCalls: [], updateEventCalls: [], hamtningarKlara: 0 };
  let aktuellt = event;
  const lista = [...deltagare];
  let hamtningar = 0;

  await page.route(GET_EVENT, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event: aktuellt }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route: Route) => {
    hamtningar += 1;
    // Första hämtningen (sidladdningen) är snabb; omhämtningarna bär
    // fördröjningen, så testet kan skilja "svaret drev vyn" från "refetchen
    // drev vyn" utan att mäta klocka.
    if (hamtningar > 1 && optioner.refetchFordrojningMs) {
      await new Promise((r) => setTimeout(r, optioner.refetchFordrojningMs));
    }
    mockar.hamtningarKlara += 1;
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

/**
 * Knappens inset mot sin rubrikrad (review-våg 3-precedenten): handling-slotten
 * är knappens förälder och rubrikraden dess farförälder. Två knappar med samma
 * inset står på SAMMA plats — en stabilare mätning än absoluta koordinater.
 */
async function insetIRubrikraden(knapp: ReturnType<typeof gruppen>) {
  return knapp.evaluate((el) => {
    const rad = (el.parentElement as HTMLElement).parentElement as HTMLElement;
    const b = el.getBoundingClientRect();
    const r = rad.getBoundingClientRect();
    return { top: b.top - r.top, bottom: r.bottom - b.bottom, right: r.right - b.right };
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

test.describe('Markera-läget — batch-bekräftelse (task-48)', () => {
  test('AC #2: rivningarna — per-kort-knappen (K46) och Bekräfta alla-pillen (K47/K48) finns inte', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
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

    // Rivningen gäller även arkivet — inga kvarglömda knappar bland bekräftade.
    await gruppen(page).getByRole('button', { name: 'Bekräftade (1)', exact: true }).click();
    await expect(
      gruppen(page).getByRole('button', { name: /^Skicka bekräftelse till/ }),
    ).toHaveCount(0);
  });

  test('byggkrav 1: Markera → Avbryt står på SAMMA plats i rubrikraden', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const markera = gruppen(page).getByRole('button', { name: 'Markera anmälningar' });
    const foreInset = await insetIRubrikraden(markera);
    await markera.click();

    const avbryt = gruppen(page).getByRole('button', { name: 'Avbryt markering' });
    await expect(avbryt).toBeVisible();
    await expect(markera).toHaveCount(0);

    // SAMMA PLATS mätt som inset mot rubrikraden (review-våg 3-precedenten):
    // båda knapparna sitter i handling-slotten med identiskt avstånd till
    // radens kanter. Bredden skiljer — etiketterna skiljer — men platsen är
    // densamma. Absoluta viewport-koordinater duger inte: rubrikraden flyttar
    // sig i sidled när batch-baren monteras under den.
    const efterInset = await insetIRubrikraden(avbryt);
    expect(Math.abs(efterInset.right - foreInset.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(efterInset.top - foreInset.top)).toBeLessThanOrEqual(1);
    expect(Math.abs(efterInset.bottom - foreInset.bottom)).toBeLessThanOrEqual(1);

    // Avbryt lämnar läget och återställer Markera-knappen.
    await avbryt.click();
    await expect(gruppen(page).getByRole('button', { name: 'Markera anmälningar' })).toBeVisible();
    await expect(markerbaraKort(page)).toHaveCount(0);
  });

  test('byggkrav 2: hela kortet är klickyta med checkbox-semantik; valt kort byter form och tappar Obekräftad-pillen', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    // Kön har två obekräftade → två markerbara kort med checkbox-roll.
    const kort = markerbaraKort(page);
    await expect(kort).toHaveCount(2);
    const anna = kort.filter({ hasText: 'Anna Ek' });
    await expect(kryssI(anna)).not.toBeChecked();

    // Vilande: Obekräftad-pillen står, kategori-pillen står.
    await expect(anna.getByText('Obekräftad')).toBeVisible();
    await expect(anna.getByText('Manuellt tillagd')).toBeVisible();

    // Hela kortet är klickytan — ett klick mitt i kortet väljer.
    await anna.click();
    await expect(kryssI(anna)).toBeChecked();

    // VALT: success-bakgrund + success-kant (byggkrav 2, token-kedjan).
    await expect(anna).toHaveCSS('background-color', await tokenColor(page, '--mm-success-bg'));
    await expect(anna).toHaveCSS('border-top-color', await tokenColor(page, '--mm-success'));

    // Obekräftad-pillen FÖRSVINNER (ingen 'Vald'-pill ersätter den);
    // kategori-pillen står kvar.
    await expect(anna.getByText('Obekräftad')).toHaveCount(0);
    await expect(anna.getByText('Manuellt tillagd')).toBeVisible();

    // WCAG 1.4.1 (byggkrav 7, REVIDERAT 2026-07-26 i Marcus design-review):
    // check-glyfen är riven. Bäraren är kanten, och det som gör den till en
    // icke-färg-signal är att den OVALDA kanten är transparent — markeringen
    // är alltså att en kontur uppstår, inte att en färg byts. Testet vaktar
    // därför frånvaron av glyf OCH den transparenta ovalda kanten; tonas den
    // senare upp till en synlig neutral kant blir skillnaden ren nyans och
    // 1.4.1 faller, vilket detta fall då fångar.
    await expect(anna.getByTestId('markering-check')).toHaveCount(0);
    const ovald = kort.filter({ hasNotText: 'Anna Ek' });
    await expect(ovald).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  });

  test('byggkrav 3: batch-baren — Bekräfta X mutad vid 0, Markera alla, Rensa vid ≥1, live-räknare', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    const bar = gruppen(page).getByTestId('markering-batchbar');
    const bekrafta = bar.getByRole('button', { name: /^Bekräfta \d+ anmäl/ });
    const markeraAlla = bar.getByRole('button', { name: 'Markera alla' });
    const rensa = bar.getByRole('button', { name: 'Rensa' });

    // 0 valda: bekräfta-knappen mutad (primitivens isDisabled — appens etablerade
    // form; soft-disable-frågan är T54 och avgörs inte i en skiva), Rensa finns
    // inte, Markera alla är aktiv.
    await expect(bekrafta).toHaveText(/Bekräfta 0 anmälningar/);
    await expect(bekrafta).toBeDisabled();
    await expect(rensa).toHaveCount(0);
    await expect(markeraAlla).toBeEnabled();

    // Markera alla → båda valda; knappen muteras när allt är valt, Rensa dyker upp.
    await markeraAlla.click();
    await expect(bekrafta).toHaveText(/Bekräfta 2 anmälningar/);
    await expect(bekrafta).toBeEnabled();
    await expect(markeraAlla).toBeDisabled();
    await expect(rensa).toBeVisible();

    // Live-räknaren för skärmläsare (byggkrav 3). Lokaliseras via ROLLEN, inte
    // testid:t: rivs `role="status"`/`aria-live` är räknarens enda AT-bärare död
    // medan texten står kvar — ett testid-baserat test hade förblivit grönt.
    // Elementet är sr-only, så inget visuellt test fångar bortfallet heller.
    const live = gruppen(page)
      .getByRole('status')
      .filter({ hasText: /markerade$/ });
    await expect(live).toHaveText('2 av 2 markerade');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveAttribute('aria-atomic', 'true');

    // Rensa → tillbaka till noll.
    await rensa.click();
    await expect(bekrafta).toHaveText(/Bekräfta 0 anmälningar/);
    await expect(bekrafta).toBeDisabled();
    await expect(rensa).toHaveCount(0);
    await expect(kryssI(markerbaraKort(page).first())).not.toBeChecked();
  });

  test('byggkrav 3: bekräfta-knappens bredd är LÅST på tvåsiffrig maxform', async ({ page }) => {
    // Sex obekräftade: 0 → 1 → 6 valda ändrar etikettens teckenlängd
    // ("0 anmälningar" / "1 anmälan" / "6 anmälningar") utan att bredden rör sig.
    await mocka(page, eventDetail(), mangaObekraftade());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    const bar = gruppen(page).getByTestId('markering-batchbar');
    const bekrafta = bar.getByRole('button', { name: /^Bekräfta \d+ anmäl/ });
    const vid0 = await bekrafta.boundingBox();

    await markerbaraKort(page).first().click();
    await expect(bekrafta).toHaveText(/Bekräfta 1 anmälan/);
    const vid1 = await bekrafta.boundingBox();

    await bar.getByRole('button', { name: 'Markera alla' }).click();
    await expect(bekrafta).toHaveText(/Bekräfta 6 anmälningar/);
    const vid6 = await bekrafta.boundingBox();

    expect(vid0).not.toBeNull();
    if (vid0 && vid1 && vid6) {
      // Låst av den osynliga platshållaren 'Bekräfta 99 anmälningar' + tabular-nums.
      expect(Math.abs(vid1.width - vid0.width)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(vid6.width - vid0.width)).toBeLessThanOrEqual(0.5);
    }
  });

  test('byggkrav 6: kontrollfrågan står FÖRE sändning — avbryt skickar ingenting', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    await markerbaraKort(page).filter({ hasText: 'Bertil Sund' }).click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta 1 anmälan/ })
      .click();

    // Massmutations-grinden: dialogen står, INGET har skickats.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/1 obekräftad anmälan/)).toBeVisible();
    expect(mockar.confirmCalls).toHaveLength(0);

    await dialog.getByRole('button', { name: 'Avbryt' }).click();
    await expect(dialog).toBeHidden();
    expect(mockar.confirmCalls).toHaveLength(0);

    // Markeringen står kvar efter avbrytet — arbetet får inte tappas.
    await expect(kryssI(markerbaraKort(page).filter({ hasText: 'Bertil Sund' }))).toBeChecked();
  });

  test('AC #1: bekräftad kontrollfråga skickar EXAKT de markerade och tömmer dem ur kön', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    // Markera BARA Bertil — Anna ska stå kvar obekräftad efteråt.
    await markerbaraKort(page).filter({ hasText: 'Bertil Sund' }).click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta 1 anmälan/ })
      .click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Skicka 1 bekräftelse/ }).click();

    // ETT anrop med EXAKT det markerade record-ID:t (bulk är en operation).
    await expect.poll(() => mockar.confirmCalls.length).toBe(1);
    expect(mockar.confirmCalls[0].registrationIds).toEqual(['recBertil']);
    expect(typeof mockar.confirmCalls[0].idempotencyKey).toBe('string');

    await expect(dialog).toBeHidden();
    // Kön krymper till Anna; summeringsraderna följer med. Rubriken är ren
    // text sedan S91 (kön är inte längre fällbar) — därför getByText.
    await expect(gruppen(page).getByText('Obekräftade (1)')).toBeVisible();
    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar1');
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ })).toHaveText(
      'Anmälningsbekräftelse skickad2 av 3−1',
    );
    // Läget stängs när batchen gått igenom — arbetet är utfört.
    await expect(gruppen(page).getByRole('button', { name: 'Markera anmälningar' })).toBeVisible();
  });

  test('fynd (a): kön töms av SERVERNS svar — inte av omhämtningen', async ({ page }) => {
    // Marcus design-review 2026-07-26 (S91): vyn stod oförändrad i ~5,5 s efter
    // att läget stängt, eftersom svaret kastades och koden väntade på en full
    // get-registrations-runda. Omhämtningen bär här 5 s fördröjning; kön ska
    // vara tom INNAN den landat. Ingen klock-assertion — räknaren
    // `hamtningarKlara` avgör deterministiskt VEM som drev vyn.
    const mockar = await mocka(page, eventDetail(), grundData(), { refetchFordrojningMs: 5000 });
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    const bar = gruppen(page).getByTestId('markering-batchbar');
    await bar.getByRole('button', { name: 'Markera alla' }).click();
    await bar.getByRole('button', { name: /^Bekräfta 2 anmäl/ }).click();

    const foreSandning = mockar.hamtningarKlara;
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Skicka 2 bekräftelser/ })
      .click();

    await expect(gruppen(page).getByText('Inga obekräftade — alla är bekräftade.')).toBeVisible({
      timeout: 3000,
    });
    // Kärnan: ingen omhämtning har hunnit landa — serverns svar drev vyn.
    expect(mockar.hamtningarKlara).toBe(foreSandning);
    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar0');

    // Patchen skriver serverns EGNA fält: status flyttar korten till arkivet
    // och tidsstämpeln syns på metaraden.
    const arkiv = gruppen(page).getByRole('button', { name: 'Bekräftade (3)', exact: true });
    await expect(arkiv).toBeVisible();
    await expect(gruppen(page).getByText('Bekräftelse 22 juli')).toHaveCount(2);

    // …och när omhämtningen väl landar står bilden kvar (ingen tillbakarullning).
    await expect
      .poll(() => mockar.hamtningarKlara, { timeout: 15000 })
      .toBeGreaterThan(foreSandning);
    await expect(gruppen(page).getByText('Inga obekräftade — alla är bekräftade.')).toBeVisible();
  });

  test('fynd (b): arkivet fälls ut när kön töms I SESSIONEN, inte bara vid sidladdning', async ({
    page,
  }) => {
    // Regressionsvakt mot monteringstidpunktens värde: `bekraftadeOppen` var
    // ett engångsberäknat startvärde, så samma sluttillstånd såg olika ut
    // beroende på hur man kom dit (uppmätt aria-expanded=false efter batch,
    // true efter reload).
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const arkivFore = gruppen(page).getByRole('button', { name: 'Bekräftade (1)', exact: true });
    await expect(arkivFore).toHaveAttribute('aria-expanded', 'false');

    await oppnaMarkeringslaget(page);
    const bar = gruppen(page).getByTestId('markering-batchbar');
    await bar.getByRole('button', { name: 'Markera alla' }).click();
    await bar.getByRole('button', { name: /^Bekräfta 2 anmäl/ }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Skicka 2 bekräftelser/ })
      .click();

    await expect(gruppen(page).getByText('Inga obekräftade — alla är bekräftade.')).toBeVisible();
    await expect(
      gruppen(page).getByRole('button', { name: 'Bekräftade (3)', exact: true }),
    ).toHaveAttribute('aria-expanded', 'true');
    // Utfällt betyder verkligen synligt innehåll, inte bara ett attribut.
    await expect(gruppen(page).getByTestId('deltagar-namn')).toHaveCount(3);
  });

  test('fynd (c): en ren framgång KVITTERAS — med antal, för AT, och utan att bli kvarliggande', async ({
    page,
  }) => {
    // Förr var det lyckade utfallet flödets enda tysta väg: utfalls-ytan tändes
    // bara vid partial/failed/fel. Sex i kön så det finns arbete kvar efteråt.
    await mocka(page, eventDetail(), mangaObekraftade());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    // TVÅ markerade ⇒ pluralform med serverns antal ur `confirmed`.
    await markerbaraKort(page).nth(0).click();
    await markerbaraKort(page).nth(1).click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta 2 anmäl/ })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Skicka 2 bekräftelser/ })
      .click();

    const kvittens = gruppen(page).getByTestId('bekraftelse-utfall');
    await expect(kvittens).toBeVisible();
    await expect(kvittens.getByText('Skickat')).toBeVisible();
    await expect(
      kvittens.getByText('2 bekräftelser är skickade. Anmälningarna står nu som Bekräftade.'),
    ).toBeVisible();
    // AT-bäraren: MessageBox intent="success" ⇒ role="status" (artigt), samma
    // live-region-form som batch-barens räknare. Rivs rollen är kvittensen
    // stum för den som inte ser plattan — därför lokaliseras den via ROLLEN.
    await expect(kvittens.getByRole('status')).toBeVisible();

    // INTE en kvarliggande artefakt: nästa arbetssteg i blocket rensar den.
    await gruppen(page).getByRole('button', { name: 'Markera anmälningar' }).click();
    await expect(kvittens).toHaveCount(0);

    // …och singularformen, som dessutom går att stänga för hand — kontrollen
    // en självförsvinnande toast saknar (Polaris a11y-not).
    await markerbaraKort(page).nth(0).click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta 1 anmälan/ })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Skicka 1 bekräftelse/ })
      .click();
    await expect(
      kvittens.getByText('Bekräftelsen är skickad. Anmälan står nu som Bekräftad.'),
    ).toBeVisible();
    await kvittens.getByRole('button', { name: 'Stäng meddelande' }).click();
    await expect(kvittens).toHaveCount(0);
  });

  test('fynd (e): korthöjden är oberoende av kategori-pillen — mellan kort OCH genom lägena', async ({
    page,
  }) => {
    // Sågtanden: pill-slotten var innehålls-styrd (`max-w-[45%]`), så
    // identitetskolumnen ärvde variationen och e-posten radbröts bara på korten
    // MED kategori-pill. Uppmätt på 430 px före fixen: 166/145/166/145, och
    // samma kort hoppade 166 → 145 när Obekräftad-pillen vek vid val.
    await page.setViewportSize({ width: 430, height: 900 });
    await mocka(page, eventDetail(), blandadeObekraftade());
    await oppnaEventsidan(page);

    const hojder = async (testid: string) =>
      gruppen(page)
        .getByTestId(testid)
        .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)));

    // Kön bär två kort MED och två UTAN kategori-pill.
    await expect(gruppen(page).getByText('Manuellt tillagd')).toHaveCount(2);
    const vilande = await hojder('deltagar-kort');
    expect(vilande).toHaveLength(4);
    expect(Math.max(...vilande) - Math.min(...vilande)).toBeLessThanOrEqual(1);

    // Samma höjd i markera-läget…
    await oppnaMarkeringslaget(page);
    const iLage = await hojder('markerbart-kort');
    expect(Math.max(...iLage) - Math.min(...iLage)).toBeLessThanOrEqual(1);
    expect(Math.abs(iLage[0] - vilande[0])).toBeLessThanOrEqual(1);

    // …och när Obekräftad-pillen viker för markeringen. Både ett kort MED
    // kategori-pill och ett UTAN, eftersom det var just skillnaden dem emellan
    // som drev hoppet.
    await markerbaraKort(page).filter({ hasText: 'Anna Ekstrand' }).click();
    await markerbaraKort(page).filter({ hasText: 'Bertil Sundberg' }).click();
    const valda = await hojder('markerbart-kort');
    expect(Math.max(...valda) - Math.min(...valda)).toBeLessThanOrEqual(1);
    expect(Math.abs(valda[0] - vilande[0])).toBeLessThanOrEqual(1);

    // Pill-slotten är RESERVERAD: identisk bredd oavsett om pillen finns.
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

  test('review-fynd 2: ett icke-rent utfall BEHÅLLER urvalet och läget', async ({ page }) => {
    // Servern svarar 200 även vid partial/failed — att nolla markeringen då
    // hade tvingat Lotta att markera om allt för att försöka igen. Endast ett
    // RENT skickat utfall betyder att arbetet är utfört.
    const mockar = await mocka(page, eventDetail());
    await page.route(CONFIRM, async (route: Route) => {
      const body = route.request().postDataJSON() as { registrationIds: string[] };
      mockar.confirmCalls.push(body as unknown as Json);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'partial',
          requested: body.registrationIds.length,
          attempted: body.registrationIds.length,
          confirmed: [body.registrationIds[0]],
          skipped: [],
          // failed-shapen är {registrationId, reason} per
          // ConfirmRegistrations.schema.ts:36 — en array av strängar faller på
          // zod-parsningen och landar i catch-grenen i stället för partial-grenen.
          failed: body.registrationIds.slice(1).map((id) => ({
            registrationId: id,
            reason: 'send_failed',
          })),
          bekraftelseSkickad: '2026-07-22T12:00:00.000Z',
        }),
      });
    });
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', {
        name: 'Markera alla',
      })
      .click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta \d+ anmäl/ })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Skicka 2 bekräftelser/ })
      .click();

    await expect.poll(() => mockar.confirmCalls.length).toBe(1);
    // Utfallet visas ärligt — och läget står KVAR med urvalet intakt.
    await expect(gruppen(page).getByText(/1 bekräftelser skickade, 1 misslyckades/)).toBeVisible();
    await expect(gruppen(page).getByRole('button', { name: 'Avbryt markering' })).toBeVisible();
    await expect(
      gruppen(page).getByTestId('markering-batchbar').getByRole('button', { name: 'Rensa' }),
    ).toBeVisible();
  });

  test('review-fynd 5: Esc med kontrollfrågan uppe stänger BARA dialogen', async ({ page }) => {
    // Rivningsskydd: Esc-hanteraren sitter på document och modalen fångar
    // Escape i sin egen onKeyDown med stopPropagation. Att de inte krockar
    // hänger på Reacts eventdelegering — utan detta test är regressionen tyst.
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);

    await markerbaraKort(page).first().click();
    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta \d+ anmäl/ })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    // Läget och urvalet överlever — bara dialogen stängdes.
    await expect(gruppen(page).getByRole('button', { name: 'Avbryt markering' })).toBeVisible();
    await expect(kryssI(markerbaraKort(page).first())).toBeChecked();
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
    // är oförändrad, prototypens avsaknad var förenkling.
    const ko = gruppen(page).getByTestId('obekraftade-ko');
    await expect(ko.locator('a[href*="/personer/"]')).toHaveCount(1);
    await expect(ko.locator('a[href*="/anmalan/"]')).toHaveCount(2);
    // Historikraden (K45) står kvar — Anna har två tidigare event.
    await expect(ko.getByTestId('deltagar-historik').first()).toHaveText(
      '2 tidigare event hos Miranon Media',
    );

    // MARKERA-LÄGET: länkarna vilar (iOS edit-mode-konventionen) — noll ankare
    // i kön, så L303:s interaktivt-i-interaktivt hålls med kortet som checkbox.
    await oppnaMarkeringslaget(page);
    await expect(ko.locator('a')).toHaveCount(0);
    // Innehållet finns kvar som text — bara affordansen vilar.
    await expect(ko.getByText('Anmäld 1 juli')).toBeVisible();
    await expect(ko.getByTestId('deltagar-historik').first()).toBeVisible();
  });

  test('byggkrav 4: kön scrollar inline med ~3 kort synliga i stället för att växa', async ({
    page,
  }) => {
    await mocka(page, eventDetail(), mangaObekraftade());
    await oppnaEventsidan(page);

    const ko = gruppen(page).getByTestId('obekraftade-ko');
    const matt = await ko.evaluate((el) => ({
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

    // Scrollregionen är tangentbordsnåbar (byggkrav 7) — fokuserbar rullningsyta.
    await expect(ko).toHaveAttribute('tabindex', '0');
  });

  test('axe 0 i markera-läget med valda kort och med kontrollfrågan uppe', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    await oppnaMarkeringslaget(page);
    await markerbaraKort(page).first().click();

    const lage = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(lage.violations).toEqual([]);

    await gruppen(page)
      .getByTestId('markering-batchbar')
      .getByRole('button', { name: /^Bekräfta 1 anmälan/ })
      .click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Vänta ut modalens IN-transition innan scanningen: mitt i fade:en komposit-
    // beräknar axe färgen ur en HALVGENOMSKINLIG knapp (mätt 4,17:1 mot #767f6e —
    // en animations-artefakt, inte tokenens kontrast). Färdig-läget = success-
    // tokenens faktiska värde (--mm-success #606b57, vitt på det = 5,6:1).
    await expect(dialog.getByRole('button', { name: /^Skicka 1 bekräftelse/ })).toHaveCSS(
      'background-color',
      await tokenColor(page, '--mm-button-success-bg'),
    );
    await expect(page.locator('[data-entering]')).toHaveCount(0);
    await expect(page.locator('div.fixed.inset-0.z-50')).toHaveCSS('opacity', '1');
    const dialoglage = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
    expect(dialoglage.violations).toEqual([]);
  });
});

test.describe('Auto-utskicks-krysset (task-18.6 K44 — orört av task-48)', () => {
  test('AC #3: auto-krysset står i signal-slotten, speglar bas-fälten och skriver dem', async ({
    page,
  }) => {
    const mockar = await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Utanför tvåveckorsfönstret → badgen är släckt och slotten bär krysset.
    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    const kryss = slot.getByRole('checkbox');
    // RAC-kryssets input är visuellt gömd — LABELN är den verkliga träffytan
    // (mark-paid-svitens klickaKryss-precedent; hit-target-checken fäller inputen).
    const kryssYta = kryss.locator('xpath=ancestor::label[1]');
    await expect(kryss).toBeVisible();
    // deltagarinfoAutoAvstangt=false ⇒ auto-utskicket är PÅ (ikryssat).
    await expect(kryss).toBeChecked();
    await expect(slot.getByText(/^Schemalagt att skickas automatiskt/)).toBeVisible();

    // Kryssa UR → opt-out skrivs till basen via update-event.
    await kryssYta.click();
    await expect.poll(() => mockar.updateEventCalls.length).toBe(1);
    expect(mockar.updateEventCalls[0].deltagarinfoAutoAvstangt).toBe(true);
    expect(mockar.updateEventCalls[0].eventId).toBe(EVENT_ID);
    await expect(kryss).not.toBeChecked();
    await expect(slot.getByText('Skickas inte automatiskt')).toBeVisible();

    // Kryssa I igen → opt-out av + schemalagt datum sätts (härlett ur tvåveckorsgränsen).
    await kryssYta.click();
    await expect.poll(() => mockar.updateEventCalls.length).toBe(2);
    expect(mockar.updateEventCalls[1].deltagarinfoAutoAvstangt).toBe(false);
    expect(mockar.updateEventCalls[1].deltagarinfoSchemalagd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('AC #3: schemalagt datum ur BASEN vinner över den härledda gränsen', async ({ page }) => {
    await mocka(
      page,
      eventDetail({ deltagarinfoSchemalagd: '2026-12-24', deltagarinfoAutoAvstangt: false }),
    );
    await oppnaEventsidan(page);

    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slot.getByText('Schemalagt att skickas automatiskt 24 december')).toBeVisible();
  });
});
