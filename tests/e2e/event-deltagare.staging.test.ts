import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * task-18.4 — Anmälda deltagare som ARBETSKÖ (S73-facit K35–K58): summeringsrader
 * med klickfilter, kategori-flikar och eventinfo-signalens alltid reserverade
 * slot. [ÄNDRAT, TASK-145.1] Obekräftade-kön/Bekräftade-arkivet (var sin
 * `GruppRubrik`, fällbar accordion) är RIVNA — registret är sedan denna
 * skiva EN ovillkorlig lista, steg-hink- + FIFO-sorterad, med steg-märket
 * som enda grupperingssignal (se `Deltagare.tsx`s `ArbetsKo`-docblock för
 * hela skivgränsen). Summeringsraderna, klickfiltret och kategori-flikarna
 * är OFÖRÄNDRADE.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + get-registrations —
 * samma split som 18.1/18.8: SERVER-kontraktet (deltagar-shapens fält-mappning,
 * Källa-semantiken, person-batchen) bevisas av
 * `tests/api/get-registrations.staging.test.ts` mot skarp staging; dessa e2e
 * bevisar KLIENTENS form och beteende flak-fritt utan delad staging-data.
 *
 * Täckning: summeringsradernas ordning + värden (AC #2), klickfiltret med
 * Rensa filtret, registrets steg-hink- + FIFO-gruppering (TASK-145.1 AC #2/#3),
 * kategori-flikarna, signal-slottens båda lägen utan geometri-hopp (AC #3),
 * avbokade räknas bort, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const EVENT_ID = 'recDELTAGARE0001';

/** YYYY-MM-DD `n` dagar från idag. Assertionerna nedan är MEDVETET toleranta mot
 *  ±1 dags TZ-drift mellan Node och browsern (T27-klassen) — datumen ligger med
 *  bred marginal inne i respektive fönster. */
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
    // Långt fram = utanför tvåveckorsfönstret → signal-slotten står TOM.
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
    ...overrides,
  };
}

/**
 * Fyra AKTIVA anmälningar + en avbokad (som ska räknas bort överallt):
 *   Bertil  Obekräftad  06-20 (äldst av kön)   Källa Manuell
 *   Anna    Obekräftad  07-01
 *   Cecilia Bekräftad   07-05 (senast av arkivet)  bekräftelse skickad
 *   David   Bekräftad   06-25  Källa +1 · bekräftelse + eventinfo + påminnelse
 *   Eva     Avbokad/Ombokad — aldrig med i någon räkning eller lista
 */
const DELTAGARE: Json[] = [
  registrering({
    id: 'recAnna',
    namn: 'Anna Ek',
    inskickad: '2026-07-01T09:00:00.000Z',
  }),
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
    medfoljandeTill: 'recCecilia',
    bekraftelseSkickad: '2026-06-26T09:00:00.000Z',
    deltagarinfoSkickad: '2026-07-10T09:00:00.000Z',
    betalningspaminnelseSkickad: '2026-07-08T09:00:00.000Z',
    antalGenomfordaEvent: 3,
  }),
  registrering({
    id: 'recEva',
    namn: 'Eva Sten',
    status: 'Avbokad/Ombokad',
    inskickad: '2026-06-10T09:00:00.000Z',
  }),
];

async function mocka(page: Page, event: Json, registrations: Json[] = DELTAGARE): Promise<void> {
  await mockValjarLista(page); // task-18.19: väljarens listquery — aldrig staging i deterministisk svit
  await page.route(GET_EVENT, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ event }),
    });
  });
  await page.route(GET_REGISTRATIONS, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ registrations }),
    });
  });
}

/** Deltagar-gruppen (rubriken står utanför kortet — sektionen bär båda). */
function gruppen(page: Page) {
  return page.locator('section[aria-labelledby="grupp-deltagare"]');
}

/** [TASK-145.1] Kortet för en namngiven deltagare — samma konvention som
    `event-detail.staging.test.ts`s `kortet()`. */
function kortet(page: Page, namn: string) {
  return gruppen(page).getByTestId('deltagar-kort').filter({ hasText: namn });
}

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

test.describe('Anmälda deltagare — arbetsköns skelett (task-18.4)', () => {
  test('summeringsraderna står i Lottas utskicksordning med räknade värden (avbokade borträknade)', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // [ÄNDRAT, TASK-145.2 → uppdaterat i TASK-145.3] Blocket har SJU rader, inte
    // fem. De fyra STEG-raderna (Väntar på bekräftelse → Anmälningsavgifter →
    // Slutbetalningar → Klara) ersatte de tre gamla utskicks-raderna
    // (Obekräftade anmälningar / Anmälningsbekräftelse skickad /
    // Betalningspåminnelse skickad), och Avbokade tillkom sist — grillad samsyn
    // beslut 2 (S93 Del 3) namnger exakt tre rivningar och åtta rader.
    // LOGISTIK-GRUPPEN (Eventinfo skickad / Bor över / Avbokade) står kvar
    // efter dem, i den ordningen.
    //
    // Testet lämnades rött när TASK-145.2 landade. Det rättas HÄR, i den skiva
    // som konsoliderar registret, i stället för att skrivas om till något
    // ytligare: samma DJUP (hela raduppsättningen, i ordning, med räknade
    // värden) mot den nya formen.
    const rader = gruppen(page).locator('button[aria-pressed="false"]');
    const etiketter = await gruppen(page).locator('button[aria-pressed]').allTextContents();
    expect(etiketter).toEqual([
      'Väntar på bekräftelse2',
      'Anmälningsavgifter0 av 4 mottagna−4',
      'Slutbetalningar0 klara−4',
      'Klara0',
      'Eventinfo skickad1 av 4−3',
      'Bor över0',
      'Avbokade1',
    ]);
    // Alla sju står otryckta i grundläget (inget filter aktivt).
    await expect(rader).toHaveCount(7);

    // Eva (Avbokad/Ombokad) syns aldrig i kön — 4 aktiva, inte 5.
    await expect(gruppen(page).getByText('Eva Sten')).toHaveCount(0);
  });

  // [ÄNDRAT, TASK-145.1] Obekräftade-kön och Bekräftade-arkivet (var sin
  // `GruppRubrik`, egen äldst-/senast-först-sortering, fällbar accordion) är
  // rivna (AC #1) — registret är sedan denna skiva EN ovillkorlig lista,
  // sorterad på fyra steg-hinkar (väntar på bekräftelse → avgift saknas →
  // slut saknas → klara, AC #2) och FIFO (äldst-registrerad-först) inom
  // varje hink (AC #3). Steg-märket ÄR grupperingen — inga sektionsrubriker
  // (AC #4/#5). Ersätter det gamla testet med samma DJUP mot den nya formen
  // i stället för att lämnas rött (AC #11 klausul 1).
  test('registret är EN steg-hink + FIFO-sorterad lista — ingen fällbar arkiv-rubrik längre', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Regressionsvakt: den gamla accordion-knappen/rubriktexten får aldrig
    // återuppstå (Marcus design-review S91 gäller nu båda de forna grupperna).
    await expect(gruppen(page).getByRole('button', { name: /^Bekräftade/ })).toHaveCount(0);
    await expect(gruppen(page).getByText('Obekräftade (2)')).toHaveCount(0);
    await expect(gruppen(page).getByText('Bekräftade (2)', { exact: true })).toHaveCount(0);

    // Steg-hink (AC #2): Bertil/Anna (väntar på bekräftelse) FÖRE David/
    // Cecilia (väntar på betalning — ingen har mottagen anmälningsavgift).
    // FIFO inom hink (AC #3): Bertil (06-20) före Anna (07-01); David
    // (06-25) före Cecilia (07-05).
    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register).toBeVisible();
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'Anna Ek',
      'David Nord',
      'Cecilia Lund',
    ]);

    // Steg-märket ÄR grupperingen (AC #4) — exakt ETT märke per person
    // (AC #5). `.last()`: HallplatsMarke:s breddlås staplar alla sex
    // etiketterna i samma grid-cell (fem aria-hidden-platshållare + den
    // synliga sist i DOM-ordningen) — texten matchar annars flera noder.
    await expect(
      kortet(page, 'Bertil Sund').getByText('Väntar på bekräftelse').last(),
    ).toBeVisible();
    await expect(kortet(page, 'David Nord').getByText('Väntar på betalning').last()).toBeVisible();
  });

  // [ÄNDRAT, TASK-145.1] Bekräftade-arkivets forna fäll-/öppna-tillstånd
  // (`bekraftadeVal`/`bekraftadeOppen`, "fynd (b)") är riven tillsammans med
  // GruppRubrik-accordionen (AC #1) — det finns inget dolt tillstånd kvar
  // att växla mellan. Ersätter det gamla testet: samma underliggande värde
  // för Lotta (hon ska aldrig behöva jaga fram bekräftade i ett dolt läge)
  // bevisas nu genom att registret ALLTID visar alla direkt, oavsett fixtur
  // eller filterbyten (AC #11 klausul 1 — uppdatera i stället för att lämna rött).
  test('registret visar ALLA direkt när ingen väntar på bekräftelse — inget dolt tillstånd kvar', async ({
    page,
  }) => {
    const allaBekraftade = DELTAGARE.map((r) =>
      r.status === 'Obekräftad'
        ? {
            ...r,
            status: 'Bekräftad (mail skickat)',
            bekraftelseSkickad: '2026-07-07T09:00:00.000Z',
          }
        : r,
    );
    await mocka(page, eventDetail(), allaBekraftade);
    await oppnaEventsidan(page);

    // Alla fyra i registret direkt (steg-hink: samtliga saknar mottagen
    // anmälningsavgift ⇒ EN hink, FIFO: Bertil 06-20 → David 06-25 →
    // Anna 07-01 → Cecilia 07-05) — ingen accordion att fälla ut.
    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register).toBeVisible();
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'David Nord',
      'Anna Ek',
      'Cecilia Lund',
    ]);

    // …och registret överlever en omrendering av hela grenen (filter på och
    // av): den gamla arkiv-knappens `aria-expanded`-mätning ersätts med
    // registrets egen synlighet genom samma filter-cykel.
    //
    // [ÄNDRAT, TASK-145.3 AC #2] Registret FÖRSVINNER inte längre när ett
    // filter är valt. Fram till denna skiva var filtrerat och ofiltrerat läge
    // två separata render-grenar, och den filtrerade saknade både `testId`,
    // `rullande` och batch-bar. Nu är det EN gren: samma `deltagar-register`
    // krymper till träffarna och växer tillbaka när filtret rensas.
    // Raden som klickas är dessutom en av de NYA steg-raderna — den gamla
    // `Anmälningsbekräftelse skickad` revs av TASK-145.2 och testet stod rött.
    const rad = gruppen(page).getByRole('button', { name: /^Eventinfo skickad/ });
    await rad.click();
    await expect(rad).toHaveAttribute('aria-pressed', 'true');
    await expect(register).toBeVisible();
    // Alla utom David saknar eventinfo (fixturen) ⇒ tre av fyra.
    await expect(register.getByTestId('deltagar-namn')).toHaveCount(3);
    await gruppen(page).getByRole('button', { name: 'Rensa filtret' }).click();
    await expect(register).toBeVisible();
    await expect(register.getByTestId('deltagar-namn')).toHaveCount(4);
  });

  test('summeringsradens klick FILTRERAR till flat lista + Rensa filtret; klick igen rensar', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // [ÄNDRAT, TASK-145.2 → TASK-145.3] Raden heter "Väntar på bekräftelse"
    // sedan de tre gamla utskicks-raderna revs. Testet stod rött på den gamla
    // etiketten.
    const vantarRad = gruppen(page).getByRole('button', {
      name: /^Väntar på bekräftelse/,
    });
    const register = gruppen(page).getByTestId('deltagar-register');
    await vantarRad.click();
    await expect(vantarRad).toHaveAttribute('aria-pressed', 'true');

    // [ÄNDRAT, TASK-145.3 AC #2] Registret FÖRSVINNER inte längre när ett
    // filter är valt — filtrerat och ofiltrerat läge är EN render-gren. Det är
    // det som gör markera-läget nåbart ur ett filtrerat läge (PRD
    // användarberättelse 12), och det som gör listan steg-/FIFO-sorterad även
    // filtrerad (samma jämförare, `registerLista`).
    await expect(register).toBeVisible();
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'Anna Ek',
    ]);
    const rensa = gruppen(page).getByRole('button', { name: 'Rensa filtret' });
    await expect(rensa).toBeVisible();

    // Eventinfo-raden filtrerar på dem som SAKNAR eventinfo (det åtgärdbara):
    // alla utom David. FIFO inom steg-hink: Bertil (06-20) och Anna (07-01)
    // väntar på bekräftelse (hink 0), Cecilia saknar avgift (hink 1).
    await gruppen(page)
      .getByRole('button', { name: /^Eventinfo skickad/ })
      .click();
    await expect(vantarRad).toHaveAttribute('aria-pressed', 'false');
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'Anna Ek',
      'Cecilia Lund',
    ]);

    // Rensa filtret → hela registret tillbaka.
    await rensa.click();
    await expect(register).toBeVisible();
    await expect(register.getByTestId('deltagar-namn')).toHaveCount(4);

    // Klick på en AKTIV rad rensar också (toggle-semantiken).
    await vantarRad.click();
    await expect(vantarRad).toHaveAttribute('aria-pressed', 'true');
    await vantarRad.click();
    await expect(vantarRad).toHaveAttribute('aria-pressed', 'false');
    await expect(register.getByTestId('deltagar-namn')).toHaveCount(4);
  });

  test('kategori-flikarna filtrerar listorna; summeringarna räknar ALLTID hela eventet', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const flikar = gruppen(page).getByRole('radiogroup', { name: 'Visa deltagare' });
    await expect(flikar.getByRole('radio', { name: 'Alla (4)' })).toBeChecked();
    await expect(flikar.getByRole('radio', { name: 'Manuella (1)' })).toBeVisible();
    await expect(flikar.getByRole('radio', { name: 'Medföljande (1)' })).toBeVisible();

    // Manuella → bara Bertil (Källa 'Manuell'). [ÄNDRAT, TASK-145.1]
    // Kategori-pillen ("Manuellt tillagd") har vikit för steg-märket
    // (AC #4/#5, samma redan Marcus-beslutade princip som `?variant=a`:
    // "det räcker att den är filtrerbar" — flik-togglen lever kvar orörd).
    await flikar.getByRole('radio', { name: 'Manuella (1)' }).click();
    const register = gruppen(page).getByTestId('deltagar-register');
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual(['Bertil Sund']);
    // [ÄNDRAT, TASK-145.4 → uppdaterat i TASK-145.3] Räkningen scopas till
    // REGISTRET, inte hela sektionen. Sedan betalningsytan flyttade in under
    // registret (TASK-145.4) bär `grupp-deltagare` även den INFÄLLDA arbetsytan
    // (`hidden`, men i DOM), och dess personrader har en egen kategori-pill —
    // `toHaveCount` räknar dolda noder, så sektions-scopet gav en falsk röd.
    // Påståendet som ska gälla är registrets: där bär kortet inget kategori-
    // märke, bara steg-märket.
    await expect(register.getByText('Manuellt tillagd')).toHaveCount(0);
    await expect(
      kortet(page, 'Bertil Sund').getByText('Väntar på bekräftelse').last(),
    ).toBeVisible();
    // Summeringarna står kvar på hela eventet (K38) — flikvalet rör bara listan.
    // [ÄNDRAT, TASK-145.2] Raden heter "Anmälningsavgifter" sedan de tre gamla
    // utskicks-raderna revs.
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsavgifter/ })).toHaveText(
      'Anmälningsavgifter0 av 4 mottagna−4',
    );

    // [ÄNDRAT, TASK-145.1] Medföljande → bara David (Källa '+1'). Han syns
    // DIREKT i den ovillkorliga registerlistan — inget arkiv att fälla ut,
    // och kategori-pillen ("Medföljande") har likaså vikit för steg-märket.
    await flikar.getByRole('radio', { name: 'Medföljande (1)' }).click();
    await expect(register).toBeVisible();
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual(['David Nord']);
    await expect(register.getByText('Medföljande', { exact: true })).toHaveCount(0);
    await expect(kortet(page, 'David Nord').getByText('Väntar på betalning').last()).toBeVisible();
  });

  test('AC #3: signal-slotten renderar i BÅDA lägena med identisk geometri (badge / tom reserv)', async ({
    page,
  }) => {
    // TVÅ event-ID:n i stället för route-byte + reload: persist-hydreringen
    // serverar annars scenario 1-data under samma query-nyckel efter en reload
    // (TASK-28-fyndets klass). Skilda ID:n ⇒ skilda nycklar ⇒ inget överlapp.
    const UTANFOR = EVENT_ID;
    const INNE = 'recDELTAGARE0002';
    const perEvent: Record<string, Json> = {
      [UTANFOR]: eventDetail(),
      [INNE]: eventDetail({
        id: INNE,
        startdatum: omDagar(7),
        slutdatum: omDagar(8),
      }),
    };
    await page.route(GET_EVENT, async (route) => {
      const id = new URL(route.request().url()).searchParams.get('id') ?? UTANFOR;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ event: perEvent[id] ?? perEvent[UTANFOR] }),
      });
    });
    await page.route(GET_REGISTRATIONS, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ registrations: DELTAGARE }),
      });
    });

    // Läge 1 — utanför tvåveckorsfönstret (start om 60 dagar): TOM RESERV.
    await oppnaEventsidan(page);
    const slotTom = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slotTom).toHaveCount(1);
    await expect(gruppen(page).getByText(/Dags att skicka/)).toHaveCount(0);
    const hojdTom = (await slotTom.boundingBox())?.height;
    expect(hojdTom).toBeGreaterThan(0);

    // Läge 2 — inne i fönstret (start om 7 dagar): BADGEN tänds.
    await page.goto(`/event/${INNE}`);
    await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
    const slotBadge = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slotBadge.getByText(/^Dags att skicka/)).toBeVisible();
    const hojdBadge = (await slotBadge.boundingBox())?.height;

    // Geometrin får ALDRIG hoppa mellan lägena (L303: slotten alltid reserverad).
    expect(hojdBadge).toBe(hojdTom);

    // Slotten ligger UTANFÖR filter-knappen — interaktivt i interaktivt är förbjudet.
    const knappIslot = await slotBadge.locator('button').count();
    expect(knappIslot).toBe(0);
  });

  test('signalen tystnar när ALLA fått eventinfo, även inne i fönstret', async ({ page }) => {
    const allaFatt = DELTAGARE.map((r) =>
      r.status === 'Avbokad/Ombokad'
        ? r
        : { ...r, deltagarinfoSkickad: '2026-07-10T09:00:00.000Z' },
    );
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }), allaFatt);
    await oppnaEventsidan(page);

    await expect(gruppen(page).getByRole('button', { name: /^Eventinfo skickad/ })).toHaveText(
      'Eventinfo skickad4 av 4',
    );
    await expect(gruppen(page).getByText(/Dags att skicka/)).toHaveCount(0);
    // Slotten står kvar reserverad även när signalen är släckt.
    await expect(gruppen(page).getByTestId('eventinfo-signal-slot')).toHaveCount(1);
  });

  test('tomt event: inga anmälda → lugn text, inga grupp-rubriker', async ({ page }) => {
    await mocka(page, eventDetail(), []);
    await oppnaEventsidan(page);

    // [ÄNDRAT, TASK-145.2] Raden heter "Väntar på bekräftelse" sedan de tre
    // gamla utskicks-raderna revs; noll är noll i båda formerna.
    await expect(gruppen(page).getByRole('button', { name: /^Väntar på bekräftelse/ })).toHaveText(
      'Väntar på bekräftelse0',
    );
    await expect(gruppen(page).getByText('Inga deltagare i denna kategori.')).toBeVisible();
    // TASK-145.3: batch-baren monteras aldrig över en tom lista — Markera är
    // inte en affordans när det inte finns något att markera.
    await expect(gruppen(page).getByTestId('markering-batchbar')).toHaveCount(0);
  });

  // [ÄNDRAT, TASK-145.1] "Arkivet utfällt" fanns som ett tredje meningsfullt
  // a11y-läge eftersom accordionen introducerade extra interaktiva element
  // (chevron-knappen, `aria-expanded`/`aria-controls`). Den ytan är riven
  // (AC #1). Markera-läget fyller samma roll nu — DET är registrets nya
  // extra-interaktiva tillstånd (checkboxar, batch-baren) och förtjänar
  // därför axe-täckningen den gamla accordion-expansionen hade.
  test('axe 0 i grundläget, i filtrerat läge och med markera-läget aktivt', async ({ page }) => {
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }));
    await oppnaEventsidan(page);

    const kor = async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .include('section[aria-labelledby="grupp-deltagare"]')
        .analyze();
      expect(
        results.violations,
        results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
      ).toEqual([]);
    };

    await kor();
    await gruppen(page).getByRole('button', { name: 'Markera anmälningar' }).click();
    await kor();
    await gruppen(page).getByRole('button', { name: 'Avbryt markering' }).click();
    // [ÄNDRAT, TASK-145.2] Raden heter "Väntar på bekräftelse" sedan de tre
    // gamla utskicks-raderna revs.
    await gruppen(page)
      .getByRole('button', { name: /^Väntar på bekräftelse/ })
      .click();
    await kor();
    // [TILLKOMMET, TASK-145.3 AC #2] Det FILTRERADE läget bär numera också
    // markera-läget — ett fjärde a11y-läge som inte fanns förut och som därför
    // aldrig scannats.
    await gruppen(page).getByRole('button', { name: 'Markera anmälningar' }).click();
    await kor();
  });
});

/**
 * TASK-145.1 DoD #7 — mekaniskt bevis för skrivvägs-frånvaro, SKOPAT till
 * registret självt (`deltagar-register`): registrets EGEN DEFAULT-rendering
 * (Lotta har inte tryckt Markera) bär noll checkbox-affordanser —
 * `DeltagarListan` väljer `DeltagarKort` (länkar, ingen mutation) framför
 * `MarkerbartKort` (checkbox) exakt när `markering` är `null`, se `ArbetsKo`s
 * render.
 *
 * [RÄTTAT, TASK-145.5 AC #3] Docblocket motiverade tidigare det smala scopet
 * med att `AutoKryss` (auto-utskicks-krysset i eventinfo-signalens slot) var en
 * "KÄND, redan existerande skrivaffordans" i summeringsblocket som hade gett en
 * falsk positiv vid ett bredare scope. Det är INTE längre sant: `AutoKryss` revs
 * av TASK-145.2 (grillad samsyn beslut 2 — se `Deltagare.tsx`s RIVEN-docblock
 * och `event-bekraftelse.staging.test.ts` § Eventinfo-radens signal-slot).
 * Motiveringen stod kvar som en beskrivning av ett tillstånd som upphört, vilket
 * är exakt den klass av stale prosa som CLAUDE.md § verify:ci-parity bokför som
 * dyrast. Scopet BEHÅLLS ändå — men av det smalare, sanna skälet ovan, och den
 * breda grinden bor nu i `TASK-145.5`-sviten nedan.
 */
test.describe('TASK-145.1 — registret som EN lista (DoD #7)', () => {
  test('registret renderar noll checkbox-affordanser förrän Markera-läget öppnas', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // `data-testid="deltagar-register"` sitter på `<ul>` (DeltagarListan) —
    // Markera-knappen är en SYSKON-nod i batch-baren OVANFÖR listan (AC #11),
    // inte ett barn av den. Checkbox-räkningen scopas till listan (§ docblock
    // ovan: precis DÄR ska noll-påståendet gälla); knapp-klicken scopas till
    // hela `gruppen` som redan alla andra tester i denna fil gör.
    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register).toBeVisible();
    // Fyra aktiva personkort (Eva/Avbokad räknas bort), inga checkboxar.
    await expect(register.getByTestId('deltagar-kort')).toHaveCount(4);
    await expect(register.getByRole('checkbox')).toHaveCount(0);

    // Negativ kontroll, INLINE (inget att injicera utifrån via page.route —
    // Markera-knappen sitter i registrets EGEN batch-bar sedan AC #11):
    // öppnas läget på riktigt SKA gaten tillåta exakt det, annars vore den
    // för sträng och skulle fälla en legitim, avsiktlig arbetsyta.
    await gruppen(page).getByRole('button', { name: 'Markera anmälningar' }).click();
    await expect(register.getByRole('checkbox')).toHaveCount(4);
    await gruppen(page).getByRole('button', { name: 'Avbryt markering' }).click();
    await expect(register.getByRole('checkbox')).toHaveCount(0);
  });
});

/**
 * TASK-145.5 — EVENTSIDAN ÄR EN REN ÖVERSYN (AC #1/#2, DoD #7).
 *
 * "Som Roger vill jag att eventsidan aldrig ändrar data av misstag, så att den
 * kan visas och läsas utan risk" (PRD TASK-145, användarberättelse 24). AC #2
 * kräver att detta är MEKANISKT fällt, inte kontrollerat med ögat.
 *
 * VAD GRINDEN MÄTER, OCH VARFÖR JUST DET. Den skannar eventsidan SOM DEN
 * RENDERAS VID LADDNING — Lotta har inte tryckt på något. I det läget ska ytan
 * bära noll skriv-affordanser överhuvudtaget. Formen är vald för att den är
 * ofrånkomlig: varje kvarvarande skrivväg måste då antingen synas direkt (och
 * fällas här) eller kräva en explicit handling, och varje sådan handling har
 * sin EGEN grind i en egen svit. Ett gate som i stället försökte räkna upp
 * "tillåtna" kontroller hade behövt en undantagslista, och en undantagslista är
 * precis vägen tillbaka till en yta ingen längre överblickar.
 *
 * DE TRE AVSIKTLIGA UNDANTAGEN, var och en bakom en explicit handling och var
 * och en gatead på annat håll — inte glömda, utan namngivna:
 *
 *  1. BETALNINGSYTANS kryss (bakom "Öppna detaljer"). De renderas men är
 *     ALLTID `disabled` — bevisat i `mark-paid.staging.test.ts` § Betalningsytan
 *     — LÄSYTA, som dessutom visar att ett genuint klickförsök TIMEOUTAR och
 *     att update-record aldrig anropas. Andra testet nedan mäter samma sak från
 *     SEKTIONENS nivå, så påståendet håller även om arbetsytans egen lokalisator
 *     skulle ändras.
 *  2. MARKERA-LÄGETS kort-checkboxar (bakom Markera-knappen). De MUTERAR
 *     INGENTING — de väljer. `TASK-145.3` rev bekräfta-flödet som var deras enda
 *     mutation, och `event-bekraftelse.staging.test.ts` bevisar att
 *     bekräftelse-EF:en aldrig anropas.
 *  3. BOR ÖVER-KRYSSLÄGET (bakom Bor över-raden). Detta är den ENDA
 *     kvarvarande, verkliga mutationen på ytan — `useSetBorOver`. Den har egen
 *     svit (`event-bor-over.staging.test.ts`).
 *
 * ÖPPEN FRÅGA TILL MARCUS, EJ AVGJORD HÄR (rapporterad i slutrapporten): AC #1
 * säger ordagrant "inga muterande kryssrutor", och undantag 3 ÄR en muterande
 * kryssruta. Den rivs ändå INTE här, av två skäl som pekar åt samma håll:
 * grillad samsyn beslut 2 (S93 Del 3) räknar upp åtta rader och namnger exakt
 * tre rivningar — Bor över är inte en av dem, och det kvitterandet verifierades
 * av Marcus när `TASK-145.1` av misstag raderade radens E2E-svit. PRD:ns egen
 * enumeration är dessutom smalare än AC-texten: "båda betalnings-kryssen
 * (anmälningsavgift och slutbetalning), noterings-redigeringen och
 * påminn-knappen lämnar eventsidan" — Bor över nämns inte. Att riva en kontroll
 * som en annan yta kvitterat som överlevande, på en AC-formulering som redan är
 * omöjlig att läsa bokstavligt (markera-lägets kryss är också kryssrutor), vore
 * att kompensera för ett spec-fel i tysthet.
 */
test.describe('TASK-145.5 — eventsidan är en REN ÖVERSYN (AC #1/#2)', () => {
  test('den laddade eventsidan bär noll skriv-affordanser i deltagar- och åtgärdsytan', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const atgardsytan = page.locator('section[aria-labelledby="grupp-atgarder"]');
    await expect(atgardsytan).toBeVisible();

    for (const yta of [gruppen(page), atgardsytan]) {
      // Inga kryssrutor alls — varken muterande eller markerande. Var och en av
      // de tre avsiktliga undantagen kräver en handling Lotta inte gjort än.
      await expect(yta.getByRole('checkbox')).toHaveCount(0);
      // Inget redigerbart fält: `getByRole('textbox')` täcker både
      // `<input type="text">` och `<textarea>`, alltså både den rivna
      // notering-inputen och varje handrullad ersättare.
      await expect(yta.getByRole('textbox')).toHaveCount(0);
      await expect(yta.locator('[contenteditable="true"]')).toHaveCount(0);
      // Ingen påminn-avfyrning, i någon av dess två historiska former (knapp
      // med mutation, länk med mailto).
      await expect(yta.getByRole('button', { name: /påminn/i })).toHaveCount(0);
      await expect(yta.getByRole('link', { name: /påminn/i })).toHaveCount(0);
    }

    // MAILTO-VÄGARNA mäts på HELA sidan, inte per sektion: en mailto-länk är en
    // utgång ur appen och hör inte hemma någonstans på en översyn. Del 3
    // beslut 4 stängde mailto-eran.
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);

    // AC #4 — de fyra grå löftena är RIVNA, inte nedtonade. Ett `aria-disabled`
    // element är fortfarande ett löfte; noll element är inget löfte alls.
    for (const namn of [
      'Skicka bekräftelsemail till obekräftade',
      'Skicka betalningspåminnelse till obetalda',
      'Markera alla obetalda som betalda',
      'Skicka eventinfo till alla anmälda',
    ]) {
      await expect(atgardsytan.getByRole('button', { name: namn })).toHaveCount(0);
    }
    // …och ingen rad i gruppen bär kvar interim-tillståndet.
    await expect(atgardsytan.locator('[aria-disabled="true"]')).toHaveCount(0);
  });

  test('den öppnade betalningsytan är LÄSYTA — mätt från sektionens nivå, inte arbetsytans', async ({
    page,
  }) => {
    // Samma påstående som `mark-paid.staging.test.ts` bevisar inifrån
    // arbetsytan, men mätt UTIFRÅN: alla kryss i hela `grupp-deltagare` är
    // inaktiverade när detaljerna är öppna. Två oberoende lokalisatorer på
    // samma egenskap är avsiktligt — den inre kan bytas ut utan att någon
    // märker att den yttre garantin försvann.
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    await gruppen(page).getByRole('button', { name: 'Öppna detaljer' }).click();
    const kryssen = gruppen(page).getByRole('checkbox');
    const antal = await kryssen.count();
    expect(antal).toBeGreaterThan(0);
    for (let i = 0; i < antal; i++) {
      await expect(kryssen.nth(i)).toBeDisabled();
    }

    // Och ytan bär fortfarande inget redigerbart fält och ingen mailto —
    // noterings-redigeringen är riven, inte dold bakom disclosure:n.
    await expect(gruppen(page).getByRole('textbox')).toHaveCount(0);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });

  test('AC #3: eventinfo-radens signal-slot bär inget kryss i något av sina lägen', async ({
    page,
  }) => {
    // Rivningen gjordes av TASK-145.2; denna skiva äger att den är bevisad som
    // en del av SKRIVVÄGS-frånvaron, inte bara som en egen assertion om en
    // saknad glyf. GEOMETRIN (identisk höjd i båda lägena) mäts av testet
    // "AC #3: signal-slotten renderar i BÅDA lägena med identisk geometri"
    // ovan i samma fil — det påståendet dupliceras inte här.
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);
    const slotTom = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slotTom).toBeVisible();
    await expect(slotTom.getByRole('checkbox')).toHaveCount(0);
    // Tom reserv: slotten står kvar men bär ingenting alls — varken badge
    // eller det rivna fallback-krysset.
    await expect(slotTom).toBeEmpty();
    expect((await slotTom.boundingBox())?.height).toBeGreaterThan(0);
  });

  test('AC #3: inne i tvåveckorsfönstret bär slotten ENDAST badgen — aldrig ett kryss bredvid den', async ({
    page,
  }) => {
    await mocka(page, eventDetail({ startdatum: omDagar(7), slutdatum: omDagar(8) }));
    await oppnaEventsidan(page);
    const slot = gruppen(page).getByTestId('eventinfo-signal-slot');
    await expect(slot.getByText(/^Dags att skicka/)).toBeVisible();
    await expect(slot.getByRole('checkbox')).toHaveCount(0);
    // Slotten är inte heller en interaktiv yta i sig (L303/K44).
    await expect(slot.locator('button')).toHaveCount(0);
  });
});
