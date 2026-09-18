import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-456 — Fynd: betalningsinkorgens kort blir lägre när ingen pill visas.
 *
 * Källa: `docs/research/betalningsytan-tre-prodobservationer-2026-09-18.md`
 * § O1. `RadInnehall` (`BetalningsInkorg.tsx:2523-2576`) monterar pill-raden
 * (rad 2540) OVILLKORLIGT, men den bär ingen `min-h` — är `rad.forfallen`,
 * `rad.obekraftad` OCH `rad.spegelSlapar` alla falska blir raden 0 px och
 * kortet lägre än syskonen. Marcus i prod 2026-09-18: "alla kort ska alltid
 * vara exakt lika höga".
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
 * A. RÖTT-FÖRST (AC #1): ett kort utan någon pill mäter EXAKT samma höjd
 *    (`getBoundingClientRect().height` på `[data-testid="betalningar-kort"]`)
 *    som ett syskonkort med en pill, vid mobil (390 px) och desktop
 *    (1280 px). Innan fixen skiljer höjden med precis pillens egen höjd
 *    (24 px, `StatusBadge storlek="sm"` — se `RadInnehall`s pill-rad).
 * B. AC #2 (designfrågan): vid 390 px mäts pill-radens EGEN höjd
 *    (`[data-testid="rad-pillar"]`) för TVÅ och TRE samtidiga pillar —
 *    boundingBox avgör om de radbryter, i stället för att gissas fram.
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
/** TRE pillar: Förfallen (deadline passerad) + Obekräftad + Basen släpar. */
const TREPILL = oppenBetalning({
  anmalanRecordId: 'recTASK456PILL3',
  personNamn: 'Task456 Trepill Persson',
  anmalanStatus: 'Obekräftad',
  spegelIFas: false,
  deadlineSlutbetalning: '2026-01-01',
});

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

test.describe('TASK-456 — betalningsinkorgens kort-höjd (pill-raden reserverar plats)', () => {
  for (const { namn, width, height } of VIEWPORTS) {
    test(`kort UTAN pill mäter EXAKT samma höjd som kort MED en pill @ ${namn}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await mocka(page);
      await page.goto('/mer/betalningar');

      const pillfriKort = page
        .getByTestId('betalningar-kort')
        .filter({ hasText: 'Task456 Pillfri Persson' });
      const enpillKort = page
        .getByTestId('betalningar-kort')
        .filter({ hasText: 'Task456 Enpill Persson' });
      await expect(pillfriKort).toBeVisible();
      await expect(enpillKort).toBeVisible();

      const pillfriHojd = await pillfriKort.evaluate((el) => el.getBoundingClientRect().height);
      const enpillHojd = await enpillKort.evaluate((el) => el.getBoundingClientRect().height);

      // Toleransen är 0 — samma husregel som `betalningar-inkorg-
      // utskicksflode.staging.test.ts`s statusyta-golv.
      expect(pillfriHojd, `${namn}: pillfri=${pillfriHojd}px, enpill=${enpillHojd}px`).toBe(
        enpillHojd,
      );
    });
  }

  /**
   * AC #2 — DESIGNFRÅGAN, MÄTT MED boundingBox VID 390 PX, INTE GISSAD.
   * Två pillar (Obekräftad + Basen släpar) radbryter INTE på 390 px — den
   * pillraden håller sig på EN rad, och kortet ska alltså hålla EXAKT samma
   * höjd som en-pill-baslinjen. Tre samtidiga pillar (+ Förfallen)
   * RADBRYTER till två rader — ett NAMNGIVET, MEDVETET UNDANTAG (se
   * kod-kommentaren vid `data-testid="rad-pillar"` i `BetalningsInkorg.tsx`
   * för skälet): kortet FÅR bli högre, exakt en extra pillrad plus `gap-2`
   * (32 px), aldrig lägre och aldrig mer än så — en framtida regression som
   * gör det annorlunda högt ska fällas, inte tystas.
   */
  test('AC #2 @ mobil 390 px: två pillar radbryter INTE (samma höjd som baslinjen); tre pillar radbryter MEDVETET (+32 px, namngivet undantag)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page);
    await page.goto('/mer/betalningar');

    const enpillKort = page
      .getByTestId('betalningar-kort')
      .filter({ hasText: 'Task456 Enpill Persson' });
    const tvapillKort = page
      .getByTestId('betalningar-kort')
      .filter({ hasText: 'Task456 Tvapill Persson' });
    const trepillKort = page
      .getByTestId('betalningar-kort')
      .filter({ hasText: 'Task456 Trepill Persson' });
    await expect(enpillKort).toBeVisible();
    await expect(tvapillKort).toBeVisible();
    await expect(trepillKort).toBeVisible();

    const baslinjeHojd = await enpillKort.evaluate((el) => el.getBoundingClientRect().height);
    const tvapillHojd = await tvapillKort.evaluate((el) => el.getBoundingClientRect().height);
    const trepillHojd = await trepillKort.evaluate((el) => el.getBoundingClientRect().height);

    // TVÅ pillar: pillraden håller EN rad — kortet är IDENTISKT med
    // baslinjen (mätt: 144 px == 144 px).
    expect(tvapillHojd, `baslinje=${baslinjeHojd}px, tvapill=${tvapillHojd}px`).toBe(baslinjeHojd);

    // Pillradens EGEN boundingBox bevisar VARFÖR: fortfarande en rad
    // (`min-h-6` = 24 px, ingen extra rad tillkommen).
    const tvapillPillradHojd = await tvapillKort
      .getByTestId('rad-pillar')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(tvapillPillradHojd).toBe(24);

    // TRE pillar: NAMNGIVET UNDANTAG — kortet är EXAKT 32 px högre (en
    // extra pillrad, 24 px, plus `gap-2`, 8 px), aldrig lägre än baslinjen
    // och aldrig ett annat tal.
    expect(trepillHojd, `baslinje=${baslinjeHojd}px, trepill=${trepillHojd}px`).toBe(
      baslinjeHojd + 32,
    );
    const trepillPillradHojd = await trepillKort
      .getByTestId('rad-pillar')
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(trepillPillradHojd).toBe(56);
  });
});
