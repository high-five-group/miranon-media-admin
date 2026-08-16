import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-201.7 — hem-spalten "Senaste aktivitet" (K10-facitets sista sektion).
 *
 * `get-activity-log` LIGGER I NORMALLÄGET sedan denna skiva (`handlers.ts` §
 * Aktivitetsloggens LÄSVÄG) — spalten hämtar vid varje hem-rendering på ≥xl,
 * så mocken kan inte bo per test. Lyckofallen nedan läser därför fixturvärldens
 * fem statements rakt av; fel- och tomläget överskuggar lokalt.
 *
 * BRYTPUNKTEN ÄR TESTETS KÄRNA (AC #2). Acceptance-projektet kör 1280×720
 * (playwright.config.ts § acceptance) — EXAKT Tailwinds `xl` (min-width:
 * 1280px), alltså precis över tröskeln. Den smala halvan sätter viewporten
 * själv. Att den ligger på tröskeln är ingen skörhet utan en styrka: en
 * brytpunkt som råkar flyttas ETT steg fälls direkt i båda riktningarna.
 *
 * TIDSSTRÄNGARNA ÄR LITERALER, INTE HÄRLEDDA (tautologi-fällan). `relativTid`
 * är komponentens EGEN formatterare — hade testet kallat den hade det passerat
 * oavsett vad komponenten gör. Strängarna nedan är i stället räknade för hand
 * mot fixturvärldens frusna klocka FROZEN_NOW = 2026-09-15T10:00+02:00 och
 * verifierade separat (`TZ=Europe/Stockholm node -e "…"`) innan de skrevs in:
 *   2026-09-15T08:00+02:00 → 120 min → "för 2 tim sedan"
 *   2026-09-15T05:00+02:00 → 300 min → "för 5 tim sedan"
 *   2026-09-14T16:42+02:00 → gårdagens kalenderdag → "igår 16:42"
 *   2026-09-14T09:15+02:00 → gårdagens kalenderdag → "igår 09:15"
 * Webbläsaren är pinnad till `Europe/Stockholm` (playwright.config.ts), så
 * TASK-27-klassen (Node-TZ ≠ browser-TZ) kan inte uppstå: inget datum här
 * byggs med en lokal `Date`-metod i testprocessen.
 */

/** Under xl — inne i det lg↔xl-gap facit lämnade odefinierat (avgjort: ingen spalt). */
const UNDER_XL = { width: 1024, height: 720 };
/** Ett steg under tröskeln — bevisar att villkoret är `xl`, inte "ungefär bred". */
const PRECIS_UNDER_XL = { width: 1279, height: 720 };

function mockaAktivitetslogg(
  network: NetworkFixture,
  svar: { statements: unknown[]; nextCursor: string | null } | { status: number },
): void {
  network.use(
    http.get(EF('get-activity-log'), () => {
      if ('status' in svar) {
        return json({ error: 'Internal error', requestId: 'req-spalt-500' }, svar.status);
      }
      return json(svar);
    }),
  );
}

// [TASK-243.1] HELA FILEN skippas — ÖPPET bokförd, minimal anpassning per
// kortets DoD-gräns ("gör MINIMAL anpassning så CI är grönt per jobb — den
// FULLA omskrivningen är skiva 243.3:s jobb"). ADR-102/103-promoveringen
// (V1 "Lugna morgonen") ersatte K10-formens `SenasteAktivitet.tsx`
// (`data-testid="senaste-aktivitet"`, `hidden … xl:flex` xl-only-spalt) med
// `SenasteAktivitetKompakt.tsx` — synlig på ALLA bredder, ingen testid, inget
// xl-brytpunktsvillkor (facit-avsteg medvetet, se `Hem.tsx`/PRD task-243).
// Samtliga assertioner i denna fil pekar på den RETIRERADE formen. Full
// omskrivning mot nya formen: task-243.3.
test.describe
  .skip('Hem-spalten "Senaste aktivitet" (TASK-201.7, K10-facit)', () => {
    test('AC #1 + #5 — facitets radform: tid först, aktör i medium, mittpunkts-separator, INGA ikoner', async ({
      page,
    }) => {
      await page.goto('/hem');
      const spalt = page.getByTestId('senaste-aktivitet');
      await expect(spalt).toBeVisible();

      // AC #5 — namnet bärs av aria-label, INTE av en visuell rubrik.
      await expect(page.getByRole('complementary', { name: 'Senaste aktivitet' })).toBeVisible();
      await expect(spalt.getByRole('heading')).toHaveCount(0);

      // AC #5 — INGA ikoner i posterna (FEATURE-dokens kategori-ikonidé viker
      // för facit, ADR-102 B1). Mekaniskt: noll svg någonstans i spalten.
      await expect(spalt.locator('svg')).toHaveCount(0);

      // Radens två delar, i facitets ordning: tid (muted caption) ÖVER texten.
      await expect(spalt.getByText('för 2 tim sedan')).toBeVisible();
      await expect(spalt.getByText('för 5 tim sedan')).toBeVisible();
      await expect(spalt.getByText('igår 16:42')).toBeVisible();
      await expect(spalt.getByText('igår 09:15')).toBeVisible();

      // MITTPUNKT, aldrig långt tankstreck (Marcus-order 2026-08-12 — facitets
      // bild visar "—", grinden check-langa-streck förbjuder det, och avvikelsen
      // är accepterad i förväg).
      await expect(
        // TASK-225.3: mappad verb-copy ("en betalning") via delade modulen,
        // inte fixturens lagrade display ("markerade betalning").
        spalt.getByText('Lotta markerade en betalning · Alva Ekström (Utbildning Skövde)'),
      ).toBeVisible();
      await expect(spalt.getByText(/[—–]/)).toHaveCount(0);

      // Aktören bär font-medium (500) — computed, inte bara klass-närvaro.
      const aktor = spalt.locator('span.font-medium', { hasText: 'Lotta' }).first();
      await expect(aktor).toHaveText('Lotta');
      expect(await aktor.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('500');
    });

    test('AC #1 — exakt fyra rader (facitets antal), femte statementet avkortas av pageSize', async ({
      page,
    }) => {
      await page.goto('/hem');
      const spalt = page.getByTestId('senaste-aktivitet');
      await expect(spalt).toBeVisible();

      await expect(spalt.getByRole('listitem')).toHaveCount(4);
      // Fixturvärlden bär FEM statements; den femte (2026-09-13, "för 2 dagar
      // sedan") får inte synas — annars speglar mocken inte EF:ens pageSize och
      // radantalet vore omätbart.
      await expect(spalt.getByText('Egon Ivarsson (Utbildning Varberg)')).toHaveCount(0);
    });

    test('AC #2 — spalten renderas ENDAST ≥xl; borta vid 1279 px och i lg↔xl-gapet', async ({
      page,
    }) => {
      await page.goto('/hem');
      // Över tröskeln (projektets 1280) — synlig.
      await expect(page.getByTestId('senaste-aktivitet')).toBeVisible();

      for (const storlek of [PRECIS_UNDER_XL, UNDER_XL]) {
        await page.setViewportSize(storlek);
        // `hidden` = display:none → varken synlig eller i tillgänglighetsträdet.
        await expect(page.getByTestId('senaste-aktivitet')).toBeHidden();
        await expect(page.getByRole('complementary', { name: 'Senaste aktivitet' })).toHaveCount(0);
      }

      // Gapet är ingen lucka: "Mer" är nåbart på VARJE bredd (TabBar bär inga
      // brytpunktsvillkor) och därifrån går vägen till samma historik.
      await expect(page.getByRole('link', { name: 'Mer' })).toBeVisible();
    });

    test('AC #3 — "Se all aktivitetshistorik" navigerar till kärnvyn (TASK-201.6)', async ({
      page,
    }) => {
      await page.goto('/hem');
      const spalt = page.getByTestId('senaste-aktivitet');
      await expect(spalt).toBeVisible();

      // `›` bärs av ett aria-hidden-span → tillgängliga namnet saknar tecknet
      // (CTA-precedenten i samma vy). Att det VISAS prövas separat.
      await expect(spalt.getByText('›')).toBeVisible();
      await spalt.getByRole('link', { name: 'Se all aktivitetshistorik' }).click();

      await expect(page).toHaveURL(/\/mer\/aktivitetshistorik$/);
      await expect(
        page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' }),
      ).toBeVisible();
    });

    test('tomläge — stillsam rad, länken står kvar, ingen falsk lista', async ({
      page,
      network,
    }) => {
      mockaAktivitetslogg(network, { statements: [], nextCursor: null });
      await page.goto('/hem');

      const spalt = page.getByTestId('senaste-aktivitet');
      await expect(spalt).toBeVisible();
      await expect(spalt.getByText('Ingen aktivitet ännu.')).toBeVisible();
      await expect(spalt.getByRole('listitem')).toHaveCount(0);
      await expect(spalt.getByRole('link', { name: 'Se all aktivitetshistorik' })).toBeVisible();
    });

    test('fel — ärlig rad UTAN role=alert (hem-vyns alert-semantik ägs av korten)', async ({
      page,
      network,
    }) => {
      mockaAktivitetslogg(network, { status: 500 });
      await page.goto('/hem');

      const spalt = page.getByTestId('senaste-aktivitet');
      // Default-retry (router.ts: 3 försök, 200/400/800 ms) — rundlig marginal,
      // samma härledning som mer-aktivitetshistorik.acceptance.test.ts.
      await expect(spalt.getByText('Kunde inte hämta senaste aktiviteten.')).toBeVisible({
        timeout: 20_000,
      });
      // Kortkolumnen är opåverkad och INGEN alert har uppstått av spaltens fel.
      await expect(page.getByRole('alert')).toHaveCount(0);
      await expect(spalt.getByRole('link', { name: 'Se all aktivitetshistorik' })).toBeVisible();
    });

    /**
     * INGEN `toMatchAriaSnapshot` I DENNA FIL — prövat och avvisat mot mätning,
     * inte utelämnat av slarv. `toMatchAriaSnapshot.pathTemplate`
     * (`{testDir}/__aria__/…`, playwright.config.ts rad ~285) gäller INTE för
     * acceptance-projektet: projektets egen `expect: { timeout: 15_000 }`
     * SKUGGAR hela top-nivåns `expect` — mekanismen står utskriven i configen
     * själv ("PROJEKT-`expect` ERSÄTTER, DEN MERGAR INTE …
     * `takeFirst(projectConfig.expect, config.expect, {})`"). Mätt 2026-08-12:
     * en körning här lade referensen i
     * `tests/acceptance/__screenshots__/…-acceptance-darwin.aria.yml`, alltså
     * via `snapshotPathTemplate` med `{platform}` — en darwin-artefakt som CI
     * (linux) aldrig hade hittat. Att laga det kräver en ändring i
     * playwright.config.ts, vilket ligger utanför denna skivas mandat.
     *
     * AC #4:s ariaSnapshot-referenser bor därför i
     * `tests/visual/hem-aktivitetsspalt-promoverings-grind.spec.ts`, där
     * mallen är korrekt kopplad. Det LEVANDE, blockerande skyddet för spaltens
     * struktur är i stället assertionerna i denna fil: landmärke + namn,
     * radantal, ikon-frånvaro, separator och brytpunkt — samtliga i ett jobb
     * som faktiskt fäller en PR.
     */

    test('axe 0 violations på Hem MED spalten renderad', async ({ page }) => {
      await page.goto('/hem');
      await expect(page.getByTestId('senaste-aktivitet')).toBeVisible();
      await expect(page.getByText('igår 16:42')).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  });
