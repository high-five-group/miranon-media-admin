import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * Hem-blocket "Senaste aktivitet" — Morgonkollens sjätte och sista block
 * (TASK-243.3, full omskrivning ur `tests/acceptance/hem-senaste-
 * aktivitet.acceptance.test.ts` som testade den RETIRERADE K10-formen och
 * raderades helt i `27288c3e` ["testar den rivna K10-formen, full
 * omskrivning i task-243.3"]). Facit: `tasks/sessions/bilagor/s102-hem-
 * konvergens/facit.json`; komponenten: `src/components/hem/
 * SenasteAktivitetKompakt.tsx`.
 *
 * AVSTEG MOT K10-FACITET, ÖPPET BOKFÖRT (`SenasteAktivitetKompakt.tsx`s
 * docblock — PRD task-243 kräver explicit "alla bredder"): ingen
 * `data-testid`, inget xl-only-brytpunktsvillkor, ingen `complementary`-roll.
 * Landmärket nås i STÄLLET via `aria-labelledby` (sektionens `role="region"`,
 * namnet ur h2:n "Senaste aktivitet") — SAMMA mönster resten av hem-
 * acceptance-sviterna redan använder för sina block. Raden är fortfarande
 * EN sammanhängande `<span>` (aktör + verb-copy + " · " + objekt) — den delen
 * av K10-facitets form ÄR promoverad oförändrad.
 *
 * TIDSSTRÄNGARNA ÄR LITERALER, INTE HÄRLEDDA (tautologi-fällan, samma
 * disciplin som den raderade filens egen kommentar): räknade för hand mot
 * fixturvärldens frusna klocka FROZEN_NOW = 2026-09-15T10:00+02:00
 * (`tests/support/fixturvarld/fixture-data.ts`) och `ACTIVITY_LOG_STATEMENTS`
 * (samma fil, fem statements, fallande tidsordning) — klockan är REDAN frusen
 * av fixturvärlden (`hermetic.ts`: `page.clock.setFixedTime(FROZEN_NOW)`),
 * inget eget `page.clock`-arrangemang krävs här:
 *   2026-09-15T08:00+02:00 → 120 min → "för 2 tim sedan"
 *   2026-09-15T05:00+02:00 → 300 min → "för 5 tim sedan"
 *   2026-09-14T16:42+02:00 → gårdagens kalenderdag → "igår 16:42"
 *   2026-09-14T09:15+02:00 → gårdagens kalenderdag → "igår 09:15"
 *   2026-09-13T11:05+02:00 → FEMTE statementet, avkortas av pageSize (4)
 * Verb-copyn är den MAPPADE presentationsformen (`verbCopy.ts`, TASK-225.3),
 * INTE radens lagrade `display` — "markerade betalning" (lagrat) blir
 * "markerade en betalning" (mappat); "lade-till-person"/"skickade-
 * bekraftelsemail" saknas i mappningstabellen och faller tillbaka till sin
 * lagrade display oförändrad.
 *
 * `get-events`/`get-registrations` mockas INTE i denna fil — normalläget
 * (`handlers.ts`) räcker: testerna nedan rör sig aldrig utanför "Senaste
 * aktivitet"-regionen, så resten av Hem må rendera vad normalläget ger.
 */

const SPALT_NAMN = 'Senaste aktivitet';

/** Överskuggar `get-activity-log` för ETT test. Samma `EF()`/`json()`-
 * disciplin som `hem.acceptance.test.ts` — en egen sträng hade kunnat falla
 * igenom till normalläget UTAN att fällas (den tysta fällan). */
function mockAktivitetslogg(
  network: NetworkFixture,
  svar: { statements: unknown[]; nextCursor: string | null } | { status: number },
): void {
  network.use(
    http.get(EF('get-activity-log'), () => {
      if ('status' in svar) {
        return json({ error: 'Internal error', requestId: 'req-hem-spalt-500' }, svar.status);
      }
      return json(svar);
    }),
  );
}

test.describe('Senaste aktivitet — facit-formen (PRD task-243 användarberättelse 10)', () => {
  test('AC #1 — fyra rader i fallande tidsordning: mappad verb-copy, mittpunkts-separator, INGA ikoner', async ({
    page,
  }) => {
    await page.goto('/hem');
    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await expect(spalt).toBeVisible();

    // Namnet bärs av h2:n (aria-labelledby) — INGEN separat komplementär roll
    // (K10-facitets `role="complementary"` är INTE promoverad).
    await expect(page.getByRole('heading', { level: 2, name: SPALT_NAMN })).toBeVisible();
    await expect(page.getByRole('complementary', { name: SPALT_NAMN })).toHaveCount(0);

    // INGA ikoner i posterna (samma avsteg K10-facitet hade — oförändrat).
    await expect(spalt.locator('svg')).toHaveCount(0);

    // Exakt fyra rader — `HEM_SENASTE_AKTIVITET_ANTAL` (queries/keys.ts) — i
    // fixturvärldens fallande tidsordning; femte statementet (Egon) avkortas.
    await expect(spalt.getByRole('listitem')).toHaveCount(4);
    await expect(spalt.getByText('Egon Ivarsson (Utbildning Varberg)')).toHaveCount(0);

    // Tid ÖVER raden, muted caption — de fyra exakta facit-formerna.
    await expect(spalt.getByText('för 2 tim sedan', { exact: true })).toBeVisible();
    await expect(spalt.getByText('för 5 tim sedan', { exact: true })).toBeVisible();
    await expect(spalt.getByText('igår 16:42', { exact: true })).toBeVisible();
    await expect(spalt.getByText('igår 09:15', { exact: true })).toBeVisible();

    // Aktör + MAPPAD verb-copy + " · " + objekt, EN sammanhängande rad.
    // "markerade-betalning" → mappad "markerade en betalning" (TASK-225.3),
    // INTE fixturens lagrade "markerade betalning".
    await expect(
      spalt.getByText('Lotta markerade en betalning · Alva Ekström (Utbildning Skövde)'),
    ).toBeVisible();
    await expect(
      spalt.getByText('Roger bekräftade en anmälan · Bosse Frisk (Utbildning Skövde)'),
    ).toBeVisible();
    // "lade-till-person" saknas i verb-copy-tabellen → faller tillbaka till
    // radens lagrade display oförändrad ("lade till person").
    await expect(spalt.getByText('Marcus lade till person · Cilla Grahn')).toBeVisible();
    await expect(
      spalt.getByText('Lotta markerade en betalning · Doris Hallin (Föreläsning Göteborg)'),
    ).toBeVisible();

    // MITTPUNKT, aldrig långt tankstreck (Marcus-order 2026-08-12, ärvd
    // oförändrad ur K10-facitet).
    await expect(spalt.getByText(/[—–]/)).toHaveCount(0);

    // Aktören bär font-medium (500) — computed, inte bara klass-närvaro.
    const aktor = spalt.locator('span.font-medium', { hasText: 'Lotta' }).first();
    await expect(aktor).toHaveText('Lotta');
    expect(await aktor.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('500');

    // "Se all aktivitetshistorik" — chevronen är aria-hidden (rent namn).
    const lank = spalt.getByRole('link', { name: 'Se all aktivitetshistorik' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/mer/aktivitetshistorik');
  });

  test('AC #2 — visas på ALLA bredder (avsteg mot K10:s xl-only-spalt, PRD-kravet "alla bredder")', async ({
    page,
  }) => {
    // Under K10-facitets gamla xl-tröskel (1280) — den nya formen visar
    // blocket ändå, till skillnad från den retirerade xl-only-spalten.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/hem');
    await expect(page.getByRole('region', { name: SPALT_NAMN })).toBeVisible();
    // Fixturvärlden bär TVÅ rader vars text delar prefixet "Lotta markerade
    // en betalning" — full sträng krävs (strict-mode-säkert).
    await expect(
      page.getByText('Lotta markerade en betalning · Alva Ekström (Utbildning Skövde)'),
    ).toBeVisible();

    // Och över den gamla tröskeln — samma block, samma innehåll.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole('region', { name: SPALT_NAMN })).toBeVisible();
  });

  test('"Se all aktivitetshistorik" navigerar till kärnvyn (TASK-201.6)', async ({ page }) => {
    await page.goto('/hem');
    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await spalt.getByRole('link', { name: 'Se all aktivitetshistorik' }).click();

    await expect(page).toHaveURL(/\/mer\/aktivitetshistorik$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();
  });

  test('tomläge — stillsam rad, länken står kvar, ingen falsk lista', async ({ page, network }) => {
    mockAktivitetslogg(network, { statements: [], nextCursor: null });
    await page.goto('/hem');

    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await expect(spalt).toBeVisible();
    await expect(spalt.getByText('Ingen aktivitet ännu.')).toBeVisible();
    await expect(spalt.getByRole('listitem')).toHaveCount(0);
    await expect(spalt.getByRole('link', { name: 'Se all aktivitetshistorik' })).toBeVisible();
  });

  test('fel — ärlig rad UTAN role=alert (blockets fel-semantik delas inte med hem-kortens alerts)', async ({
    page,
    network,
  }) => {
    mockAktivitetslogg(network, { status: 500 });
    await page.goto('/hem');

    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    // Default-retry (router.ts: 3 försök, 200/400/800 ms) — rundlig marginal,
    // samma härledning som `mer.aktivitetshistorik`-sviterna.
    await expect(spalt.getByText('Kunde inte hämta senaste aktiviteten.')).toBeVisible({
      timeout: 20_000,
    });
    // INGEN alert har uppstått av blockets fel — de andra hem-blockens
    // MessageBox-fel (role=alert) är en separat, oberoende mekanism.
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(spalt.getByRole('link', { name: 'Se all aktivitetshistorik' })).toBeVisible();
  });

  test('axe 0 violations på Hem vid smal bredd (blocket är nu synligt där K10-formen aldrig var det)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/hem');
    await expect(page.getByRole('region', { name: SPALT_NAMN })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
