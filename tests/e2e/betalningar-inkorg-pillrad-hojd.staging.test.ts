import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-456 — Fynd: betalningsinkorgens kort blir lägre när ingen pill visas.
 *
 * Källa: `docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md`
 * § O1. `RadInnehall` (`BetalningsInkorg.tsx`) monterar pill-raden
 * OVILLKORLIGT, men den bar ursprungligen ingen `min-h` — är
 * `rad.forfallen`, `rad.obekraftad` OCH `rad.spegelSlapar` alla falska blev
 * raden 0 px och kortet lägre än syskonen. Marcus i prod 2026-09-18: "alla
 * kort ska alltid vara exakt lika höga".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RUNDA 3 (Marcus beslut 2026-09-19) — FORMEN SOM PRÖVAS HÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Runda 2 löste trängseln med `flex-nowrap` + en kompakt "Släpar"-etikett.
 * Granskningen fällde den på två punkter, båda upptagna av Marcus:
 *   1. en rad som inte FÅR brytas kan inte heller KRYMPA (obrytbara ord,
 *      ingen `truncate`, ingen klippande förälder) — vid 320/360 px och vid
 *      200 % textförstoring svämmade den över horisontellt i stället
 *      (`ACCESSIBILITY-CHECKLIST.md` §4 / WCAG 1.4.10, §10 / WCAG 1.4.4);
 *   2. "Släpar" utan subjekt bredvid "Förfallen"/"Obekräftad" läste som att
 *      BETALNINGEN släpar — men beskedet gäller Airtable-spegeln.
 *
 * Runda 3:s form: spegel-beskedet flyttar UR pill-raden till BELOPPSRADEN
 * ("… kr kvar att betala"), som löpande caption-text med FULLSTÄNDIG text
 * "Basen släpar" intill det belopp det kvalificerar. Pill-raden får
 * `flex-wrap` tillbaka som skyddsnät och bär därefter högst TVÅ pillar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * "EXAKT LIKA HÖGA" HAR EN NAMNGIVEN GRÄNS — DEN ENDA SOM FINNS
 * ═══════════════════════════════════════════════════════════════════════════
 * | Bredd | Krav |
 * |---|---|
 * | **390 px** (mobil) | EXAKT samma korthöjd i alla fyra pill-lägen |
 * | **1280 px** (desktop) | EXAKT samma korthöjd i alla fyra pill-lägen |
 * | **360 px** | INGEN horisontell overflow. Lika höjd krävs INTE. |
 * | **320 px** | INGEN horisontell overflow. Lika höjd krävs INTE. |
 * | **200 % textförstoring** @ 390 px | INGEN horisontell overflow. Lika höjd krävs INTE. |
 *
 * Gränsen är avsiktlig, inte en eftergift: under 390 px är RADBRYTNING det
 * tillgänglighetsriktiga beteendet (WCAG 1.4.10 kräver att innehåll flödar
 * om, inte att det hålls på en rad till varje pris). Att i stället tvinga en
 * rad ger exakt den horisontella overflow reflow-kriteriet förbjuder. 390 px
 * och 1280 px är de ytor Marcus ögonmäter; där — och bara där — är
 * höjdlikheten ett krav.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma strukturella hinder som `betalningar-inkorg-utskicksflode.staging.
 * test.ts` § filhuvud bokför (läst FÖRE denna fil skrevs, ADR-086):
 * `VITE_FEATURE_BETALNINGAR` är `'av'` för HELA den delade acceptance-
 * fixturvärlden (`playwright.config.ts`), så `/mer/betalningar` kan inte
 * renderas i den klassen. Denna fil följer samma etablerade mönster:
 * deterministisk via `page.route`, ingen delad staging-data rörs.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';

const EVENT_ID = 'recTASK456EVENT1';

type Json = Record<string, unknown>;

/**
 * FEMSIFFRIGT BELOPP PÅ SAMTLIGA RADER (runda 3): beloppsraden bär nu även
 * spegel-beskedet, så det är DEN raden som kan radbryta och göra korten
 * olika höga. Att ge alla fyra korten samma, LÅNGA belopp ("12 500 kr kvar
 * att betala") gör spegel-beskedet till den enda skillnaden mellan dem —
 * ett rent experiment i stället för ett där beloppslängden också varierar.
 * 12 500 kr är dessutom ett realistiskt slutbetalningsbelopp i basen, inte
 * ett konstruerat extremvärde.
 */
const BELOPP = 12500;

function oppenBetalning(overrides: Json): Json {
  return {
    anmalanRecordId: 'recTASK456SAKNAS',
    personNamn: 'Task456 Saknasson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: 'Task456-kurs',
    eventStartdatum: '2099-06-01',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: BELOPP,
    gallandePris: BELOPP,
    anmalningsavgift: null,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    ...overrides,
  };
}

/** Prod-belagt legitimt datatillstånd (O1): Bekräftad, inte förfallen,
    spegeln i fas → ingen pill OCH inget spegel-besked. */
const PILLFRI = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL0',
  personNamn: 'Task456 Pillfri Persson',
});
/** EN pill: Obekräftad (neutral, ingen ikon). Inget spegel-besked. */
const ENPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL1',
  personNamn: 'Task456 Enpill Persson',
  anmalanStatus: 'Obekräftad',
});
/** EN pill + SPEGEL-BESKED: Obekräftad, spegeln släpar (`spegelIFas: false`).
    Före runda 3 var detta "två pillar" — beskedet bor nu på beloppsraden. */
const TVAPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL2',
  personNamn: 'Task456 Tvapill Persson',
  anmalanStatus: 'Obekräftad',
  spegelIFas: false,
});
/** TVÅ pillar + SPEGEL-BESKED: Förfallen + Obekräftad, spegeln släpar — det
    TÄTASTE tillstånd en rad kan anta. Före runda 3 var detta "tre pillar". */
const TREPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL3',
  personNamn: 'Task456 Trepill Persson',
  anmalanStatus: 'Obekräftad',
  spegelIFas: false,
  deadlineSlutbetalning: '2026-01-01',
});

/**
 * `tillstand` räknar radens SAMLADE besked (pillar + spegel-beskedet), inte
 * bara pillarna — det är den axeln kravet "exakt lika höga" gäller. Namnet
 * `antalPillar` från runda 1–2 vore missvisande nu när ett av beskeden
 * flyttat till en annan rad i kortet.
 */
const RADER: { namn: string; tillstand: 0 | 1 | 2 | 3 }[] = [
  { namn: 'Task456 Pillfri Persson', tillstand: 0 },
  { namn: 'Task456 Enpill Persson', tillstand: 1 },
  { namn: 'Task456 Tvapill Persson', tillstand: 2 },
  { namn: 'Task456 Trepill Persson', tillstand: 3 },
];

async function mocka(page: Page): Promise<void> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: 'Task456-kurs', startdatum: '2099-06-01' }),
  ]);
  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        betalningar: [PILLFRI, ENPILL, TVAPILL, TREPILL],
        forfallna: 1,
      }),
    });
  });
}

/** `Locator` exporteras inte av `test-bas` — härled den ur `Page` i stället
    för att öppna en andra import-väg till `@playwright/test` i denna klass. */
type Kort = ReturnType<Page['getByTestId']>;

/** Hämtar de fyra korten i tillstånds-ordning, väntade som synliga. */
async function hamtaKort(page: Page): Promise<Map<number, Kort>> {
  const kort = new Map<number, Kort>();
  for (const { namn, tillstand } of RADER) {
    const locator = page.getByTestId('betalningar-kort').filter({ hasText: namn });
    await expect(locator).toBeVisible();
    kort.set(tillstand, locator);
  }
  return kort;
}

/**
 * Horisontell overflow, mätt i BÅDA de former den kan ta:
 *   (a) kortet självt scrollar i sidled (`scrollWidth > clientWidth`), och
 *   (b) någon ättling sticker ut FÖRBI kortets egen högerkant — den formen
 *       syns INTE i (a) när en förälder saknar `overflow: hidden`, vilket är
 *       precis fallet här (granskningsfynd 1, runda 2).
 * Returnerar de mätta talen så ett fel rapporterar VAD som stack ut.
 */
async function matOverflow(kort: Kort): Promise<{
  scrollWidth: number;
  clientWidth: number;
  vardstaHogerkant: number;
  kortHogerkant: number;
  utstickare: string | null;
}> {
  return kort.evaluate((el) => {
    const kortRect = el.getBoundingClientRect();
    let vardsta = kortRect.right;
    let utstickare: string | null = null;
    for (const barn of el.querySelectorAll('*')) {
      const r = barn.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > vardsta) {
        vardsta = r.right;
        // SVG-noders `className` är ett `SVGAnimatedString`, inte en sträng —
        // bara riktiga strängar tas med i felmeddelandet.
        const klass = typeof barn.className === 'string' ? barn.className : '';
        utstickare = `${barn.tagName.toLowerCase()}${klass ? `.${klass.split(' ').join('.')}` : ''}`;
      }
    }
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      vardstaHogerkant: vardsta,
      kortHogerkant: kortRect.right,
      utstickare,
    };
  });
}

/** De två bredder där EXAKT lika höjd är ett krav (Marcus ögonmätta ytor). */
const HOJDKRAV_VIEWPORTS: { namn: string; width: number; height: number }[] = [
  { namn: 'mobil (390×844)', width: 390, height: 844 },
  { namn: 'desktop (1280×900)', width: 1280, height: 900 },
];

/** De smala bredder där bara "ingen horisontell overflow" krävs. */
const SMALA_VIEWPORTS: { namn: string; width: number; height: number }[] = [
  { namn: 'smal (360×780)', width: 360, height: 780 },
  { namn: 'smalast (320×720)', width: 320, height: 720 },
];

test.describe('TASK-456 — betalningsinkorgens kort-höjd (beskeden delade mellan beloppsrad och pill-rad)', () => {
  for (const { namn, width, height } of HOJDKRAV_VIEWPORTS) {
    test(`alla FYRA korten (0/1/2/3 besked) har EXAKT samma höjd @ ${namn}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mocka(page);
      await page.goto('/mer/betalningar');

      const kort = await hamtaKort(page);

      const hojder = new Map<number, number>();
      for (const [tillstand, locator] of kort) {
        hojder.set(tillstand, await locator.evaluate((el) => el.getBoundingClientRect().height));
      }

      const baslinje = hojder.get(0) as number;
      const rapport = [0, 1, 2, 3].map((n) => `${n} besked=${hojder.get(n)}px`).join(', ');

      // ÅTTA-FALLS-KRAVET: varje korts höjd === 0-besked-baslinjen, vid DENNA
      // viewport. Loopen över båda viewports (390 + 1280) ger de åtta
      // jämförelserna totalt.
      for (const tillstand of [1, 2, 3]) {
        expect(hojder.get(tillstand), `${namn}: ${rapport}`).toBe(baslinje);
      }

      // BELOPPSRADEN RADBRYTER INTE (runda 3:s egna risk). Kortets yttre höjd
      // kunde teoretiskt stämma trots en radbrytning, om något annat i kortet
      // kompenserade — därför mäts raden DIREKT, och mot 0-besked-kortets
      // egen beloppsrad, inte mot ett hårdkodat px-tal.
      const beloppsradHojder = new Map<number, number>();
      for (const [tillstand, locator] of kort) {
        beloppsradHojder.set(
          tillstand,
          await locator
            .getByTestId('rad-belopp')
            .evaluate((el) => el.getBoundingClientRect().height),
        );
      }
      const beloppsradBaslinje = beloppsradHojder.get(0) as number;
      const beloppsradRapport = [0, 1, 2, 3]
        .map((n) => `${n} besked=${beloppsradHojder.get(n)}px`)
        .join(', ');
      for (const tillstand of [1, 2, 3]) {
        expect(
          beloppsradHojder.get(tillstand),
          `${namn}: beloppsraden radbryter — ${beloppsradRapport}`,
        ).toBe(beloppsradBaslinje);
      }

      // Pill-radens EGEN boundingBox — den reserverade höjden (`min-h-6`)
      // håller i alla fyra lägen och raden bryts aldrig vid dessa bredder.
      for (const [tillstand, locator] of kort) {
        const pillradHojd = await locator
          .getByTestId('rad-pillar')
          .evaluate((el) => el.getBoundingClientRect().height);
        expect(pillradHojd, `${namn}: ${tillstand} besked, rad-pillar-höjd`).toBe(24);
      }
    });
  }

  /**
   * DEN NAMNGIVNA GRÄNSEN, prövad: vid 360 px och 320 px krävs INTE lika
   * höjd — där är radbrytning det riktiga beteendet. Vad som däremot ALLTID
   * krävs är att ingenting svämmar över horisontellt (WCAG 1.4.10 reflow,
   * `ACCESSIBILITY-CHECKLIST.md` §4). Det var exakt vad runda 2:s
   * `flex-nowrap` bröt mot, och skälet till att `flex-wrap` är tillbaka.
   */
  for (const { namn, width, height } of SMALA_VIEWPORTS) {
    test(`inget kort svämmar över horisontellt @ ${namn} (lika höjd krävs INTE här)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await mocka(page);
      await page.goto('/mer/betalningar');

      const kort = await hamtaKort(page);

      for (const [tillstand, locator] of kort) {
        const m = await matOverflow(locator);
        expect(
          m.scrollWidth,
          `${namn}: ${tillstand} besked — kortet scrollar i sidled (scrollWidth ${m.scrollWidth} > clientWidth ${m.clientWidth})`,
        ).toBeLessThanOrEqual(m.clientWidth);
        expect(
          m.vardstaHogerkant,
          `${namn}: ${tillstand} besked — innehåll utanför kortet: ${m.utstickare} når ${m.vardstaHogerkant}px, kortet slutar ${m.kortHogerkant}px`,
        ).toBeLessThanOrEqual(m.kortHogerkant + 0.5);
      }
    });
  }

  /**
   * 200 % TEXTFÖRSTORING (WCAG 1.4.4, `ACCESSIBILITY-CHECKLIST.md` §10) —
   * den andra halvan av granskningsfynd 1. Rot-`font-size` fördubblas, vilket
   * skalar allt rem-baserat (`--text-caption: 0.75rem` → 24 px). Kravet är
   * detsamma som för de smala bredderna: innehållet får flöda om och korten
   * får bli olika höga, men INGENTING får sticka ut horisontellt.
   */
  test('inget kort svämmar över horisontellt vid 200 % textförstoring @ 390 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');
    await hamtaKort(page);

    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    // Layouten måste hinna räknas om innan boundingBox läses.
    await page.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) >= 30,
    );

    const kort = await hamtaKort(page);
    for (const [tillstand, locator] of kort) {
      const m = await matOverflow(locator);
      expect(
        m.scrollWidth,
        `200 %: ${tillstand} besked — kortet scrollar i sidled (scrollWidth ${m.scrollWidth} > clientWidth ${m.clientWidth})`,
      ).toBeLessThanOrEqual(m.clientWidth);
      expect(
        m.vardstaHogerkant,
        `200 %: ${tillstand} besked — innehåll utanför kortet: ${m.utstickare} når ${m.vardstaHogerkant}px, kortet slutar ${m.kortHogerkant}px`,
      ).toBeLessThanOrEqual(m.kortHogerkant + 0.5);
    }
  });

  /**
   * RUNDA 3:s PLACERINGSKRAV: spegel-beskedet står på BELOPPSRADEN, med
   * FULLSTÄNDIG text och sin förklarande `title` — och det står INTE kvar i
   * pill-raden. Båda halvorna asserteras: en fix som lade till beskedet på
   * beloppsraden men glömde ta bort pillen hade annars gått grön.
   */
  test('spegel-beskedet står på beloppsraden med fullständig text — aldrig i pill-raden', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');

    const kort = await hamtaKort(page);
    const trepill = kort.get(3) as Kort;

    const besked = trepill.getByTestId('rad-belopp').getByTestId('rad-spegel-slapar');
    await expect(besked).toBeVisible();
    await expect(besked).toHaveText('Basen släpar');
    await expect(besked).toHaveAttribute('title', 'Basen har inte hunnit uppdateras än');

    // Beloppet och beskedet står i SAMMA rad, i den ordningen — beskedet
    // kvalificerar beloppet och måste därför läsas efter det.
    const beloppsradText = await trepill.getByTestId('rad-belopp').innerText();
    expect(beloppsradText.replace(/\s+/g, ' ')).toContain('kr kvar att betala · Basen släpar');

    // Pill-raden bär BARA pillar — aldrig spegel-beskedet, i någon form.
    await expect(trepill.getByTestId('rad-pillar').getByTestId('rad-spegel-slapar')).toHaveCount(0);
    const pillradText = (await trepill.getByTestId('rad-pillar').innerText()).replace(/\s+/g, ' ');
    expect(pillradText).toContain('Förfallen');
    expect(pillradText).toContain('Obekräftad');
    expect(pillradText).not.toContain('Basen');
    expect(pillradText).not.toContain('släpar');
  });

  /**
   * Negativ kontroll: en rad vars spegel är i fas bär INGET besked alls —
   * varken på beloppsraden eller i pill-raden. Utan den kunde en ovillkorlig
   * rendering ha passerat höjdtesterna (alla kort lika höga, men alla med ett
   * besked de inte ska ha).
   */
  test('rad med spegeln i fas bär inget spegel-besked alls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');

    const kort = await hamtaKort(page);
    const pillfri = kort.get(0) as Kort;

    await expect(pillfri.getByTestId('rad-spegel-slapar')).toHaveCount(0);
    await expect(pillfri.getByText('Basen släpar')).toHaveCount(0);
    // `sv-SE` grupperar med U+00A0 (hårt blanksteg), inte vanligt mellanslag —
    // normaliseras därför före jämförelsen i stället för att skrivas in rått.
    const beloppsrad = (await pillfri.getByTestId('rad-belopp').innerText()).replace(/\s+/g, ' ');
    expect(beloppsrad).toBe('12 500 kr kvar att betala');
  });
});
