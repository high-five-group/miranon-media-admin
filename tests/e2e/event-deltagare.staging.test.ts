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

    // K42: bekräftelse (mail 1) → betalningspåminnelse → eventinfo (mail 2).
    // Bor över-raden SIST sedan task-18.7 (bas-fältet föddes där; denna fixtur
    // sätter ingen borOver → 0). Dess kryss-läge har egen svit event-bor-over.
    const rader = gruppen(page).locator('button[aria-pressed="false"]');
    const etiketter = await gruppen(page).locator('button[aria-pressed]').allTextContents();
    expect(etiketter).toEqual([
      'Obekräftade anmälningar2',
      'Anmälningsbekräftelse skickad2 av 4−2',
      'Betalningspåminnelse skickad1',
      'Eventinfo skickad1 av 4−3',
      'Bor över0',
    ]);
    // Alla fem står otryckta i grundläget (inget filter aktivt).
    await expect(rader).toHaveCount(5);

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
    const rad = gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ });
    await rad.click();
    await expect(register).toBeHidden();
    await gruppen(page).getByRole('button', { name: 'Rensa filtret' }).click();
    await expect(register).toBeVisible();
    await expect(register.getByTestId('deltagar-namn')).toHaveCount(4);
  });

  test('summeringsradens klick FILTRERAR till flat lista + Rensa filtret; klick igen rensar', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const obekraftadeRad = gruppen(page).getByRole('button', {
      name: /^Obekräftade anmälningar/,
    });
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'true');

    // [ÄNDRAT, TASK-145.1] Accordion-rubrikerna (GruppRubrik) är rivna
    // (AC #1) — urvalet stod redan som flat lista, men "registret" (den
    // OVILLKORLIGA listan, ny sedan denna skiva) är en HELT ANNAN render-gren
    // än `traffar`-filtrets flata lista och ska därför vara BORTA medan
    // filtret är aktivt (samma `traffar != null`-villkor som döljer den).
    await expect(gruppen(page).getByTestId('deltagar-register')).toHaveCount(0);
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Anna Ek',
      'Bertil Sund',
    ]);
    const rensa = gruppen(page).getByRole('button', { name: 'Rensa filtret' });
    await expect(rensa).toBeVisible();

    // Eventinfo-raden filtrerar på dem som SAKNAR eventinfo (det åtgärdbara):
    // alla utom David.
    await gruppen(page)
      .getByRole('button', { name: /^Eventinfo skickad/ })
      .click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'false');
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Anna Ek',
      'Bertil Sund',
      'Cecilia Lund',
    ]);

    // Rensa filtret → registret tillbaka (AC #1: ingen accordion kvar att
    // "gå tillbaka till" — den OVILLKORLIGA listan återuppstår i stället).
    await rensa.click();
    await expect(gruppen(page).getByTestId('deltagar-register')).toBeVisible();

    // Klick på en AKTIV rad rensar också (toggle-semantiken).
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'true');
    await obekraftadeRad.click();
    await expect(obekraftadeRad).toHaveAttribute('aria-pressed', 'false');
    await expect(gruppen(page).getByTestId('deltagar-register')).toBeVisible();
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
    expect(await gruppen(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
    ]);
    await expect(gruppen(page).getByText('Manuellt tillagd')).toHaveCount(0);
    await expect(
      kortet(page, 'Bertil Sund').getByText('Väntar på bekräftelse').last(),
    ).toBeVisible();
    // Summeringarna står kvar på hela eventet (K38) — flikvalet rör bara listan.
    await expect(gruppen(page).getByRole('button', { name: /^Anmälningsbekräftelse/ })).toHaveText(
      'Anmälningsbekräftelse skickad2 av 4−2',
    );

    // [ÄNDRAT, TASK-145.1] Medföljande → bara David (Källa '+1'). Han syns
    // DIREKT i den ovillkorliga registerlistan — inget arkiv att fälla ut,
    // och kategori-pillen ("Medföljande") har likaså vikit för steg-märket.
    await flikar.getByRole('radio', { name: 'Medföljande (1)' }).click();
    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register).toBeVisible();
    expect(await register.getByTestId('deltagar-namn').allTextContents()).toEqual(['David Nord']);
    await expect(gruppen(page).getByText('Medföljande', { exact: true })).toHaveCount(0);
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

    await expect(
      gruppen(page).getByRole('button', { name: /^Obekräftade anmälningar/ }),
    ).toHaveText('Obekräftade anmälningar0');
    await expect(gruppen(page).getByText('Inga deltagare i denna kategori.')).toBeVisible();
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
    await gruppen(page)
      .getByRole('button', { name: /^Obekräftade anmälningar/ })
      .click();
    await kor();
  });
});

/**
 * TASK-145.1 DoD #7 — mekaniskt bevis för skrivvägs-frånvaro, SKOPAT till
 * registret självt (`deltagar-register`), inte hela `grupp-deltagare`-
 * sektionen: `AutoKryss` (auto-utskicks-krysset i eventinfo-signalens slot,
 * task-18.6, summeringsblocket — TASK-145.1 AC #8 rör det INTE) är en KÄND,
 * redan existerande skrivaffordans DÄR när `signalText` är falsy (händer med
 * `eventDetail()`s default `startdatum` — 60 dagar fram, utanför
 * `EVENTINFO_DAGAR_FORE`-fönstret). Att räkna checkboxar i HELA sektionen
 * hade alltså gett en falsk positiv redan idag, oberoende av denna skiva.
 *
 * "Eventsidan är bara för översyn nu ju" (Marcus, S93 Del 7) är alltså ÄNNU
 * INTE sant för HELA sidan — Bor över-krysslaget och markera-lägets egna
 * kort-checkboxar (när läget aktivt trycks på) är ANDRA, avsiktliga
 * skrivvägar som lever kvar tills TASK-145.4/145.5. Vad DENNA gate bevisar
 * är smalare och specifikt TASK-145.1s eget ansvar: registrets EGEN
 * DEFAULT-rendering (Lotta har inte tryckt Markera) bär noll
 * checkbox-affordanser — `DeltagarListan` väljer `DeltagarKort` (länkar,
 * ingen mutation) framför `MarkerbartKort` (checkbox) exakt när
 * `markering` är `null`, se `ArbetsKo`s render.
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
