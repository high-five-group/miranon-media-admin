import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '../support/test-bas';
import { mockValjarLista } from './helpers/valjar-lista';

/**
 * TASK-145.1 — Registret som EN lista (steg-hinkar, steg-märken, FIFO).
 *
 * ERSÄTTER task-18.4:s skelett-svit. Obekräftade-kön och Bekräftade-arkivet
 * (var sin GruppRubrik, var sin sorteringsordning, kategori-flikarna, de
 * fem gamla klickbara summeringsraderna) är RIVNA ur produktionsvyn — se
 * `Deltagare.tsx`s `ArbetsKo`-docblock för den fullständiga skivgränsen och
 * `backlog/tasks/task-145.1`. I deras ställe: EN ovillkorlig lista sorterad
 * på fyra steg-hinkar (väntar på bekräftelse → anmälningsavgift saknas →
 * slutbetalning saknas → klara, med inställt/på-väg-till-väntelista sist,
 * avbokade allra sist) och INOM varje hink i anmälningsordning (äldst
 * registrerad först — samma FIFO-semantik den gamla Obekräftade-kön hade,
 * nu tillämpad enhetligt över hela registret). Steg-märket ÄR grupperingen:
 * inga sektionsrubriker renderas, och exakt ETT märke visas per person.
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt).
 *
 * **Deterministisk via `page.route`-mock** av get-event + get-registrations —
 * samma split som 18.1/18.8: SERVER-kontraktet bevisas av
 * `tests/api/get-registrations.staging.test.ts` mot skarp staging; detta
 * e2e-testet bevisar KLIENTENS form och beteende flak-fritt.
 *
 * Täckning: rubrikerna är BORTA (AC #1), steg-hinkarnas ordning (AC #2),
 * FIFO inom hink (AC #3), steg-märket är grupperingen — inga rubriker
 * (AC #4), exakt ETT märke per person inkl. undantagens egna ärliga märken
 * (AC #5), inline-scrollens klipphöjd återanvänd oförändrad (AC #6),
 * scroll-ytans egen aria-label (AC #7), tomt register, axe 0.
 */

const GET_EVENT = /\/functions\/v1\/get-event\?/;
const GET_REGISTRATIONS = '**/functions/v1/get-registrations*';
const EVENT_ID = 'recDELTAGARE0001';

type Json = Record<string, unknown>;

function eventDetail(overrides: Json = {}): Json {
  return {
    id: EVENT_ID,
    eventlabel: 'Skövde – Utbildning – RIM 1',
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Skövde',
    startdatum: '2026-12-01',
    slutdatum: '2026-12-02',
    tidKvarTillEvent: '8 veckor',
    maxPlatser: 12,
    antalAnmalda: 7,
    platserKvar: 5,
    anmaldBelaggning: 0.58,
    bekraftadBelaggning: 0.42,
    antalNyaAnmalningar: 2,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 4,
    status: 'Planerat',
    eventKey: 'Event-99',
    reserverade: 0,
    manuelltTillagda: 0,
    viaFormular: 7,
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
 * SJU aktiva registreringar — en per steg-hink plus BÅDA undantagen — plus en
 * avbokad. Två i samma hink (Bertil/Anna, väntar-bekräftelse) bevisar FIFO;
 * övriga hinkar har en post var, tillräckligt för ordningsbeviset.
 *
 *   Bertil  Obekräftad          06-20 (äldst av de två väntande)
 *   Anna    Obekräftad          07-01
 *   Cecilia Bekräftad, avgift saknas   07-05
 *   David   Bekräftad, avgift ok, slut saknas  06-25
 *   Erik    Bekräftad, BÅDA mottagna (klar)    06-15
 *   Frida   Inställt                            07-06
 *   Gustav  Flytta till väntelista               07-07
 *   Hanna   Avbokad/Ombokad — sist av alla
 */
const DELTAGARE: Json[] = [
  registrering({
    id: 'recBertil',
    namn: 'Bertil Sund',
    inskickad: '2026-06-20T09:00:00.000Z',
  }),
  registrering({
    id: 'recAnna',
    namn: 'Anna Ek',
    inskickad: '2026-07-01T09:00:00.000Z',
  }),
  registrering({
    id: 'recCecilia',
    namn: 'Cecilia Lund',
    status: 'Bekräftad (mail skickat)',
    bekraftelseSkickad: '2026-07-04T09:00:00.000Z',
    inskickad: '2026-07-05T09:00:00.000Z',
  }),
  registrering({
    id: 'recDavid',
    namn: 'David Nord',
    status: 'Bekräftad (mail skickat)',
    bekraftelseSkickad: '2026-06-24T09:00:00.000Z',
    anmalningsavgift: 'Mottagen',
    inskickad: '2026-06-25T09:00:00.000Z',
  }),
  registrering({
    id: 'recErik',
    namn: 'Erik Berg',
    status: 'Bekräftad (mail skickat)',
    bekraftelseSkickad: '2026-06-14T09:00:00.000Z',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Mottagen',
    inskickad: '2026-06-15T09:00:00.000Z',
  }),
  registrering({
    id: 'recFrida',
    namn: 'Frida Holm',
    status: 'Inställt',
    bekraftelseSkickad: '2026-07-05T09:00:00.000Z',
    inskickad: '2026-07-06T09:00:00.000Z',
  }),
  registrering({
    id: 'recGustav',
    namn: 'Gustav Wik',
    status: 'Flytta till väntelista',
    bekraftelseSkickad: '2026-07-06T09:00:00.000Z',
    inskickad: '2026-07-07T09:00:00.000Z',
  }),
  registrering({
    id: 'recHanna',
    namn: 'Hanna Ström',
    status: 'Avbokad/Ombokad',
    inskickad: '2026-06-01T09:00:00.000Z',
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

async function oppnaEventsidan(page: Page): Promise<void> {
  await page.goto(`/event/${EVENT_ID}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(gruppen(page).getByRole('heading', { name: 'Anmälda deltagare' })).toBeVisible();
}

/** Registrets kort, i renderad DOM-ordning. */
function registerKort(page: Page) {
  return gruppen(page).getByTestId('deltagar-register').getByTestId('deltagar-kort');
}

test.describe('Registret som EN lista (TASK-145.1)', () => {
  test('AC #1: Obekräftade-/Bekräftade-rubrikerna finns inte — registret är EN lista', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Ingen av de gamla rubrikerna/knapparna finns kvar, i någon form.
    await expect(gruppen(page).getByText(/^Obekräftade \(/)).toHaveCount(0);
    await expect(gruppen(page).getByText(/^Bekräftade \(/)).toHaveCount(0);
    await expect(gruppen(page).getByRole('button', { name: /^Obekräftade/ })).toHaveCount(0);
    await expect(
      gruppen(page).getByRole('button', { name: 'Bekräftade (1)', exact: true }),
    ).toHaveCount(0);
    // EN lista, alla åtta (inkl. avbokad) synliga direkt utan att fälla ut något.
    await expect(registerKort(page)).toHaveCount(8);
  });

  test('AC #2 + #5: steg-hinkarnas ordning, avbokade sist, undantagen bär egna märken', async ({
    page,
  }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Väntar på bekräftelse → avgift saknas → slut saknas → klar → Inställt →
    // väntelista → Avbokad (registerOrdning, hallplats-steg-prototyp.ts).
    expect(await registerKort(page).getByTestId('deltagar-namn').allTextContents()).toEqual([
      'Bertil Sund',
      'Anna Ek',
      'Cecilia Lund',
      'David Nord',
      'Erik Berg',
      'Frida Holm',
      'Gustav Wik',
      'Hanna Ström',
    ]);

    // Varje kort bär EXAKT ETT steg-märke, med rätt text.
    //
    // BREDDLÅSET (`HallplatsMarke`, DeltagareHallplatsPrototyp.tsx): märket
    // renderar ALLA SEX etiketterna staplade i samma grid-cell — fem
    // `aria-hidden` platshållare (`invisible`, för bredd-låsningen) + DEN
    // FAKTISKA, synliga etiketten sist i DOM-ordningen. `toHaveText` på hela
    // `hallplats-marke`-noden läser därför ALLA sex sammanslagna — `marke()`
    // nedan filtrerar bort `aria-hidden`-platshållarna med `.and()`, så bara
    // den verkliga (synliga) etiketten återstår.
    const marke = (namn: string) =>
      registerKort(page)
        .filter({ hasText: namn })
        .getByTestId('hallplats-marke')
        .locator('span')
        .and(page.locator(':not([aria-hidden])'))
        .last();
    await expect(marke('Bertil Sund')).toHaveText('Väntar på bekräftelse');
    await expect(marke('Anna Ek')).toHaveText('Väntar på bekräftelse');
    // Cecilia och David delar BÅDA badgen "Väntar på betalning" — märket
    // (`hallplatsSteg()`) är GROVARE än sorteringen (`registerOrdning()`,
    // som delar "väntar på betalning" i avgift-/slut-hinkarna ovan). Cecilia
    // SORTERAS före David (hon saknar ännu avgiften), men de bär samma
    // etikett — det är sorteringen, inte märket, som är finmaskig.
    await expect(marke('Cecilia Lund')).toHaveText('Väntar på betalning');
    await expect(marke('David Nord')).toHaveText('Väntar på betalning');
    await expect(marke('Erik Berg')).toHaveText('Klar');
    await expect(marke('Frida Holm')).toHaveText('Inställt');
    await expect(marke('Gustav Wik')).toHaveText('På väg till väntelistan');
    await expect(marke('Hanna Ström')).toHaveText('Avbokad');

    // Varje kort bär EXAKT ETT märke — aldrig noll, aldrig två.
    for (const namn of [
      'Bertil Sund',
      'Anna Ek',
      'Cecilia Lund',
      'David Nord',
      'Erik Berg',
      'Frida Holm',
      'Gustav Wik',
      'Hanna Ström',
    ]) {
      await expect(
        registerKort(page).filter({ hasText: namn }).getByTestId('hallplats-marke'),
      ).toHaveCount(1);
    }
  });

  test('AC #3: FIFO inom hink — äldst registrerad står överst', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Bertil (06-20) och Anna (07-01) delar hink (väntar på bekräftelse) —
    // Bertil registrerade sig FÖRST och står överst.
    const namn = await registerKort(page).getByTestId('deltagar-namn').allTextContents();
    expect(namn.indexOf('Bertil Sund')).toBeLessThan(namn.indexOf('Anna Ek'));
  });

  test('AC #4: steg-märket ÄR grupperingen — inga sektionsrubriker i DOM:en', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    // Ingen rubriknivå (h2/h3 etc.) mellan gruppens egen <h2> och korten —
    // grupperingen bärs enbart av märket på varje kort.
    await expect(
      gruppen(page).locator('h2, h3, h4').filter({ hasNotText: 'Anmälda deltagare' }),
    ).toHaveCount(0);
  });

  test('AC #6: inline-scrollen har SAMMA klipphöjd som kön hade (byggkrav 4, ~25.5rem)', async ({
    page,
  }) => {
    const manga = Array.from({ length: 6 }, (_, i) =>
      registrering({
        id: `recManga${i}`,
        namn: `Deltagare ${i + 1}`,
        inskickad: `2026-07-0${i + 1}T09:00:00.000Z`,
      }),
    );
    await mocka(page, eventDetail(), manga);
    await oppnaEventsidan(page);

    const register = gruppen(page).getByTestId('deltagar-register');
    const matt = await register.evaluate((el) => ({
      client: el.clientHeight,
      scroll: el.scrollHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));

    // Fler kort än ryms — innehållet är högre än rutan och rutan scrollar.
    expect(matt.scroll).toBeGreaterThan(matt.client);
    expect(matt.overflowY).toBe('auto');
    // max-h ≈ 25.5rem (408 px) — samma gräns byggkrav 4 låste för kön,
    // ÅTERANVÄND oförändrad, ingen ny klipphöjd mintad.
    expect(matt.client).toBeLessThanOrEqual(408);
    expect(matt.client).toBeGreaterThan(240);
    await expect(register).toHaveAttribute('tabindex', '0');
  });

  test('AC #7: scroll-ytans aria-label är "Deltagarregister" — ärver INTE köns hårdkodade namn', async ({
    page,
  }) => {
    const manga = Array.from({ length: 6 }, (_, i) =>
      registrering({
        id: `recManga${i}`,
        namn: `Deltagare ${i + 1}`,
        inskickad: `2026-07-0${i + 1}T09:00:00.000Z`,
      }),
    );
    await mocka(page, eventDetail(), manga);
    await oppnaEventsidan(page);

    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register).toHaveAttribute('aria-label', 'Deltagarregister');
    await expect(register).not.toHaveAttribute('aria-label', 'Obekräftade anmälningar');
  });

  test('tomt event: ingen krasch, vänlig tom-text', async ({ page }) => {
    await mocka(page, eventDetail(), []);
    await oppnaEventsidan(page);

    await expect(gruppen(page).getByText('Inga anmälningar ännu.')).toBeVisible();
    await expect(registerKort(page)).toHaveCount(0);
  });

  test('axe 0 på det enade registret', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('section[aria-labelledby="grupp-deltagare"]')
      .analyze();
    expect(
      results.violations,
      results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'),
    ).toEqual([]);
  });

  /**
   * MEKANISKT BEVIS (DoD #7, skivans EGEN scope — inte hela eventsidans, se
   * TASK-145.5): registret som DENNA skiva bygger bär noll skriv-affordanser.
   * Markera-läget och Bekräfta-flödet är RIVNA i samma steg som rubrikerna
   * (docblocket ovan `ArbetsKo`) — det gamla GruppRubrik-anchor:ade
   * "Markera anmälningar"-läget hade en checkbox per kort och en
   * Bekräfta-mutation; ingendera finns kvar. Kortet är en ren länk
   * (navigation, ingen skrivning).
   */
  test('DoD #7 (skivans scope): registret bär noll skriv-affordanser', async ({ page }) => {
    await mocka(page, eventDetail());
    await oppnaEventsidan(page);

    const register = gruppen(page).getByTestId('deltagar-register');
    await expect(register.getByRole('button')).toHaveCount(0);
    await expect(register.getByRole('checkbox')).toHaveCount(0);
    await expect(register.locator('input, textarea, select')).toHaveCount(0);
    await expect(register.getByRole('button', { name: /^Markera/ })).toHaveCount(0);
    await expect(gruppen(page).getByRole('button', { name: /^Markera/ })).toHaveCount(0);
    await expect(gruppen(page).getByRole('button', { name: /^Bekräfta/ })).toHaveCount(0);
    // Varje kort är en NAVIGATIONS-länk (person + anmälan), aldrig en knapp.
    await expect(registerKort(page).first().locator('a')).not.toHaveCount(0);
  });
});
