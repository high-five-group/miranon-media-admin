import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-456 — Fynd: betalningsinkorgens kort blir lägre när ingen pill visas.
 *
 * Källa: `docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md`
 * § O1. `RadInnehall` (`BetalningsInkorg.tsx:2523-2576`) monterar pill-raden
 * (rad 2540) OVILLKORLIGT, men den bar ursprungligen ingen `min-h` — är
 * `rad.forfallen`, `rad.obekraftad` OCH `rad.spegelSlapar` alla falska blev
 * raden 0 px och kortet lägre än syskonen. Marcus i prod 2026-09-18: "alla
 * kort ska alltid vara exakt lika höga".
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RUNDA 2 (Marcus beslut via granskningsfynd, samma dag): "alla kort ska
 * vara exakt lika höga i VARJE pill-kombination" — inte bara "aldrig
 * lägre". Runda 1:s "namngivna undantag" (tre samtidiga pillar radbryter,
 * kortet blir 32 px högre) förkastades: granskaren bedömde kombinationen
 * INTE sällsynt. Denna svit prövar därför ALLA ÅTTA FALL (0/1/2/3 pillar ×
 * mobil 390/desktop 1280) mot EN gemensam baslinje.
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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VAD SVITEN BEVISAR
 * ═══════════════════════════════════════════════════════════════════════════
 * A. RÖTT-FÖRST (AC #1, runda 1): ett kort utan någon pill mäter EXAKT
 *    samma höjd (`getBoundingClientRect().height` på
 *    `[data-testid="betalningar-kort"]`) som ett syskonkort med en pill,
 *    vid mobil (390 px) och desktop (1280 px).
 * B. AC #2 (runda 2 — HÅRDARE FORM): alla FYRA korten (0/1/2/3 pillar) har
 *    EXAKT samma höjd vid BÅDA viewports — åtta jämförelser totalt. Pill-
 *    radens EGEN `boundingBox`-höjd (`[data-testid="rad-pillar"]`) är
 *    dessutom mätt till EXAKT 24 px (en rad) i alla åtta fall — beviset att
 *    raden aldrig radbryter, inte bara att kortets yttre höjd råkar stämma.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';

const EVENT_ID = 'recTASK456EVENT1';

type Json = Record<string, unknown>;

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
    saknas: 500,
    gallandePris: 500,
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
    spegeln i fas → ingen pill alls. `oppenBetalning()`s DEFAULT är redan
    exakt detta tillstånd — inga overrides behövs. */
const PILLFRI = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL0',
  personNamn: 'Task456 Pillfri Persson',
});
/** EN pill: Obekräftad (neutral, ingen ikon). */
const ENPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL1',
  personNamn: 'Task456 Enpill Persson',
  anmalanStatus: 'Obekräftad',
});
/** TVÅ pillar: Obekräftad + Basen släpar (`spegelIFas: false`). */
const TVAPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL2',
  personNamn: 'Task456 Tvapill Persson',
  anmalanStatus: 'Obekräftad',
  spegelIFas: false,
});
/** TRE pillar: Förfallen (deadline passerad) + Obekräftad + Basen släpar —
    den ENDA 3-pill-kombinationen som finns (bara tre pillar existerar). */
const TREPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL3',
  personNamn: 'Task456 Trepill Persson',
  anmalanStatus: 'Obekräftad',
  spegelIFas: false,
  deadlineSlutbetalning: '2026-01-01',
});

/** Namn → antal pillar den raden bär, för läsbara assertion-meddelanden. */
const RADER: { namn: string; antalPillar: 0 | 1 | 2 | 3 }[] = [
  { namn: 'Task456 Pillfri Persson', antalPillar: 0 },
  { namn: 'Task456 Enpill Persson', antalPillar: 1 },
  { namn: 'Task456 Tvapill Persson', antalPillar: 2 },
  { namn: 'Task456 Trepill Persson', antalPillar: 3 },
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

const VIEWPORTS: { namn: string; width: number; height: number }[] = [
  { namn: 'mobil (390×844)', width: 390, height: 844 },
  { namn: 'desktop (1280×900)', width: 1280, height: 900 },
];

test.describe('TASK-456 — betalningsinkorgens kort-höjd (pill-raden reserverar plats, bryts aldrig)', () => {
  for (const { namn, width, height } of VIEWPORTS) {
    test(`alla FYRA korten (0/1/2/3 pillar) har EXAKT samma höjd @ ${namn}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mocka(page);
      await page.goto('/mer/betalningar');

      const kort = new Map<number, ReturnType<typeof page.getByTestId>>();
      for (const { namn: personNamn, antalPillar } of RADER) {
        const locator = page.getByTestId('betalningar-kort').filter({ hasText: personNamn });
        await expect(locator).toBeVisible();
        kort.set(antalPillar, locator);
      }

      const hojder = new Map<number, number>();
      for (const [antalPillar, locator] of kort) {
        hojder.set(antalPillar, await locator.evaluate((el) => el.getBoundingClientRect().height));
      }

      const baslinje = hojder.get(0) as number;
      const rapport = [0, 1, 2, 3].map((n) => `${n} pill(ar)=${hojder.get(n)}px`).join(', ');

      // ÅTTA-FALLS-KRAVET (runda 2): varje korts höjd === 0-pill-baslinjen,
      // vid DENNA viewport. Loopen över båda viewports (390 + 1280) ger de
      // åtta jämförelserna totalt.
      for (const antalPillar of [1, 2, 3]) {
        expect(hojder.get(antalPillar), `${namn}: ${rapport}`).toBe(baslinje);
      }

      // Pill-radens EGEN boundingBox — beviset att den ALDRIG radbryter,
      // inte bara att kortets yttre höjd råkar stämma (t.ex. via ett
      // annat kompenserande hopp någon annanstans i kortet).
      for (const [antalPillar, locator] of kort) {
        const pillradHojd = await locator
          .getByTestId('rad-pillar')
          .evaluate((el) => el.getBoundingClientRect().height);
        expect(pillradHojd, `${namn}: ${antalPillar} pill(ar), rad-pillar-höjd`).toBe(24);
      }
    });
  }

  /**
   * Kompakt-formen (AC #2-designfrågan): `BasenSlaparPill`s "Släpar" i
   * trepills-fallet är en KORTARE, FULLSTÄNDIG etikett — inget döljs bakom
   * hover/fokus, så full text är alltid direkt synlig. Skärmläsare hör ändå
   * den ORDAGRANNA originaltexten ("Basen släpar") via `aria-label`. Denna
   * assertion bevisar att INGEN information tappas för AT-användare, bara
   * att den SYNLIGA formen är kortare.
   */
  test('trepills-kortets kompakta "Släpar"-pill bär den fullständiga originaltexten som tillgängligt namn (ingen infoförlust för skärmläsare)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');

    const trepillKort = page
      .getByTestId('betalningar-kort')
      .filter({ hasText: 'Task456 Trepill Persson' });
    await expect(trepillKort).toBeVisible();

    const kompaktPill = trepillKort.getByTestId('rad-pillar').locator('span', {
      hasText: 'Släpar',
    });
    await expect(kompaktPill).toBeVisible();

    // Skärmläsartexten (`sr-only`, samma husteknik som `event-detail.
    // staging.test.ts`s "Laddar event…"-kontroll) — "Basen " finns KVAR i
    // DOM:en, bara visuellt dold, så det ackumulerade textinnehållet är
    // fortfarande "Basen Släpar", ordagrant samma ord som förut.
    const srOnlyPrefix = kompaktPill.getByText('Basen', { exact: false });
    await expect(srOnlyPrefix).toHaveClass(/sr-only/);
    const heltTextinnehall = await kompaktPill.evaluate((el) => el.textContent?.trim());
    expect(heltTextinnehall).toBe('Basen Släpar');
  });

  /**
   * Negativ kontroll: tvåpills-kortet (Obekräftad + Basen släpar, INTE
   * förfallen) ska INTE gå in i kompakt-läget — bara den enda 3-pill-
   * kombinationen som finns gör det. Full text "Basen släpar" ska synas
   * som förut, oförändrat av denna skiva.
   */
  test('tvåpills-kortets Basen släpar-pill är OFÖRÄNDRAD (full text, inget kompakt-läge)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');

    const tvapillKort = page
      .getByTestId('betalningar-kort')
      .filter({ hasText: 'Task456 Tvapill Persson' });
    await expect(tvapillKort).toBeVisible();
    await expect(tvapillKort.getByText('Basen släpar', { exact: true })).toBeVisible();
  });
});
