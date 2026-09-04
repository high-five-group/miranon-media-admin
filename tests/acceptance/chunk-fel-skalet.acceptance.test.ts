import { expect, type Page, test } from './acceptance-bas';

/**
 * Vem äger "Ladda om" vid en chunk-krasch (TASK-285.13, Marcus beslut
 * 2026-08-22, bokfört i `ADR-121` § Updates 2026-08-22).
 *
 * ── VAD SOM BEVISAS ─────────────────────────────────────────────────────
 *
 * Att ett chunk-fel i det INLOGGADE SKALET lämnar EXAKT EN knapp med det
 * tillgängliga namnet "Ladda om" på sidan, och att den knappen är
 * chunk-bannerns. Sektionsfelet visar ingen åtgärdsknapp alls i det läget.
 *
 * BAKGRUNDEN, mätt: `TASK-285.7` gav `SectionError` knapptexten "Ladda om"
 * vid chunk-fel (dess "Försök igen" kör om samma saknade import och kan
 * strukturellt aldrig lyckas). Chunk-bannern (`TASK-285.5`) bär samma ord.
 * Vid ett verkligt chunk-fel monterades därmed TVÅ samtidigt fyllda
 * `role="alert"`-regioner med IDENTISKT tillgängligt namn — upptäckt av att
 * `TASK-285.7`:s eget test föll på `strict mode violation` för en OSCOPAD
 * `getByRole('button', { name: 'Ladda om' })`. Alternativet att ge dem olika
 * namn uteslöts av copy-regeln *"Ladda om", inte "Uppdatera"*
 * (`docs/specs/DESIGN-SYSTEM-SPEC.md` § 21 § Copy-golvet).
 *
 * ── VARFÖR TESTET LIGGER HÄR OCH INTE I `webblasarbeteende` ──────────────
 *
 * Kollisionen finns bara i det SAMMANSATTA läget. `TASK-285.9`:s härdning
 * kunde strukturellt inte se den, eftersom dess testyta `/dev/sektionsfel`
 * ligger UTANFÖR `AppShell` och därför aldrig monterar någon chunk-banner —
 * ett test på den ytan kan inte bevisa den här egenskapen. `AppShell`
 * monteras av `_authenticated`-layouten och kräver en inloggad,
 * fixturvärlds-backad session; det är exakt vad `acceptance`-klassen ger.
 * Samma motivering som `hem.acceptance.test.ts` describe "Chunk-bannern —
 * placering i skalet" (`TASK-285.5`) och "Notisfamiljens
 * tangentbordsnavigering" (`TASK-285.9`) redan bär: INTEGRATIONS-egenskaper
 * i det riktiga skalet hör hemma i den här klassen.
 *
 * ── ANKARET I FIXTURVÄRLDEN ─────────────────────────────────────────────
 *
 * Varje test öppnar `/hem` först. Det är inte pynt: `/hem` konsumerar
 * fixturvärldens två EF-svar (`get-registrations`, `get-events`) ur
 * NORMALLÄGET (`tests/support/fixturvarld/handlers.ts`), och
 * `scripts/hermetik-sjalvtest.mjs` (ADR-080 beslut 3) kräver att VARJE test i
 * klassen faller på `OmockadRequestError` när svaren tas bort. En körning som
 * bara besökte `/dev-fel` hade passerat självtestet och därmed bevisat att
 * den inte hänger på fixturvärlden. Ingen `network.use()`-överskuggning
 * behövs — normalläget räcker, och då kan den tysta fällan (ett
 * överskuggnings-mönster som inte matchar) inte uppstå.
 *
 * ── FELET SKJUTS SYNTETISKT ─────────────────────────────────────────────
 *
 * `vite:preloadError` fyras ur Vites preload-helper, som bara injiceras i
 * BYGGET ("Build only", `buildImportAnalysisPlugin`). Dev-servern som denna
 * klass kör mot serverar varje modul separat via native ESM och har ingen
 * helper att fela i. Eventet konstrueras därför med samma namn, konstruktor
 * och `cancelable`-flagga som Vites egen kod använder — identiskt med
 * `tests/webblasarbeteende/app-chunk-laddningsfel.test.ts` och med
 * `hem.acceptance.test.ts`s placeringstest. Retry-loopen finns av samma skäl
 * som där: en engångs-dispatch racar mot att app-bundeln (och därmed modulens
 * `window`-lyssnare i `src/lib/chunk-laddningsfel.ts`) hunnit laddas.
 */

const LADDA_OM = 'Ladda om';
const BANNER = '[data-testid="app-reload-required-banner"]';
const BANNER_KNAPP = 'app-reload-required-reload';
const H1_HALSNING = /^Hej/;
const TITEL_CHUNK_FEL = 'Den här delen behöver laddas om';

/**
 * Öppnar dev-feltriggern INUTI skalet, via `/hem` som fixturvärlds-ankare.
 *
 * `/dev-fel` ligger under `_authenticated` (till skillnad från `/dev/*`) och
 * renderas därför i `AppShell`s `<main id="main">`, samma yta där
 * `ChunkBanner` monteras som första barn. DEV-guarden i routen släpper
 * igenom eftersom klassen kör mot en dev-server.
 */
async function oppnaFeltriggernISkalet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1, name: H1_HALSNING })).toBeVisible();

  await page.goto('/dev-fel');
  await expect(page.getByRole('heading', { level: 1, name: 'Feltrigger (dev)' })).toBeVisible();
}

/** Skjuter Vites `vite:preloadError` tills chunk-bannern syns i DOM:en. */
async function tandChunkFlaggan(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-reload-required-banner"]')) return true;
      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

test.describe('Chunk-fel i skalet — "Ladda om" ägs av EN yta (TASK-285.13)', () => {
  test('banner och sektionsfel samtidigt: "Ladda om" finns EXAKT en gång, och den är bannerns (AC #2)', async ({
    page,
  }) => {
    await oppnaFeltriggernISkalet(page);
    await tandChunkFlaggan(page);
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();

    // BÅDA regionerna är fyllda samtidigt — det är hela poängen med ytan.
    const banner = page.locator(BANNER);
    const sektionsfel = page.getByRole('alert').filter({ hasText: TITEL_CHUNK_FEL });
    await expect(banner).toBeVisible();
    await expect(sektionsfel).toBeVisible();

    // OSCOPAD lokator, MED AVSIKT: exakt den form vars strict mode-fällning
    // avslöjade dubbleringen. Regredierar någon av ytorna till en andra
    // "Ladda om"-knapp fäller `toHaveCount` på talet och `toBeVisible` på
    // `strict mode violation` — samma signal som gav upptäckten.
    const laddaOm = page.getByRole('button', { name: LADDA_OM, exact: true });
    await expect(laddaOm).toHaveCount(1);
    await expect(laddaOm).toBeVisible();
    await expect(laddaOm).toHaveAttribute('data-testid', BANNER_KNAPP);

    // Sektionsfelet bär NOLL knappar i chunk-läget: varken "Ladda om"
    // (löftet som inte kan hållas per del) eller "Försök igen" (kör om samma
    // saknade import).
    await expect(sektionsfel.getByRole('button')).toHaveCount(0);

    // Lösningen ska ändå finnas i sektionsfelets egen text (copy-golvet:
    // problem + orsak + lösning, DESIGN-SYSTEM-SPEC § 21).
    await expect(sektionsfel).toContainText('Ladda om sidan för att hämta den nya versionen.');
  });

  test('den enda "Ladda om" laddar om HELA sidan (flyttad från TASK-285.7:s svit)', async ({
    page,
  }) => {
    await oppnaFeltriggernISkalet(page);
    await tandChunkFlaggan(page);
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();

    const sektionsfel = page.getByRole('alert').filter({ hasText: TITEL_CHUNK_FEL });
    await expect(sektionsfel).toBeVisible();

    await Promise.all([
      page.waitForEvent('load'),
      page.getByRole('button', { name: LADDA_OM, exact: true }).click(),
    ]);

    // Efter en RIKTIG omladdning är modul-tillståndet nollställt: bannern och
    // sektionsfelet är borta och feltriggerns normalläge syns igen. En
    // router-reset hade INTE nollställt `omladdningKravs` (modul-nivå,
    // oberoende av React-trädet) — bara en hel omladdning gör det.
    await expect(page.getByRole('heading', { level: 1, name: 'Feltrigger (dev)' })).toBeVisible();
    await expect(page.locator(BANNER)).toHaveCount(0);
    await expect(sektionsfel).toHaveCount(0);
  });
});
