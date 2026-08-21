import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * `SectionError`s knappval vid chunk-fel (TASK-285.7, ADR-121 § Tre fynd
 * punkt 3).
 *
 * VAD SOM BEVISAS: "Försök igen" kör om samma import mot samma saknade
 * chunk och kan strukturellt aldrig lyckas i det läget (mätt,
 * `src/lib/chunk-laddningsfel.ts`s filhuvud). Vid ett chunk-fel visar
 * `SectionError` därför "Ladda om" (hel omladdning) i stället — för alla
 * andra fel står "Försök igen" (reset + invalidate) oförändrat kvar.
 *
 * KLASSVALET är `webblasarbeteende`, inte `acceptance` eller `e2e`, av
 * samma skäl som `app-chunk-laddningsfel.test.ts` (se dess filhuvud): ytan
 * har NOLL databeteende — klassningen läser ett modul-nivå `window`-event,
 * aldrig ett nätverkssvar. Dev-sidan (`/dev/sektionsfel`) är MEDVETET
 * fixture-fri (inte `/dev-fel` under `/_authenticated`) av exakt den
 * anledningen: denna klass kör utan `storageState`
 * (`playwright.config.ts`s `webblasarbeteende`-projekt), och en
 * `/_authenticated`-route hade omdirigerat till `/login` här — se
 * `src/routes/dev/sektionsfel.tsx`s eget doc-block.
 *
 * INGEN EGEN STRÄNGMATCHNING BEVISAS HÄR (AC #3): testet skiljer inte de
 * två lägena åt genom att undersöka `Error`-objektet över huvud taget —
 * `/dev/sektionsfel`s "Kasta chunk-fel"-knapp kastar en Error med SAMMA
 * form som den vanliga, den enda skillnaden är att den FÖRST dispatchar
 * Vites `vite:preloadError`-event (samma konstruktor som Vites egen
 * preload-helper och som `app-chunk-laddningsfel.test.ts` redan använder).
 * Att `SectionError` ändå visar rätt knapp bevisar att klassningen sitter i
 * modul-tillståndet (`laesChunkLaddningsfel()`), inte i felets text.
 */

const FORSOK_IGEN = 'Försök igen';
const LADDA_OM = 'Ladda om';
// Rubrikerna villkoras på samma flagga som knappen sedan TASK-285.8 (copy-
// svepet) — tidigare var rubriken statisk ("Något gick fel") oavsett läge.
const TITEL_VANLIGT_FEL = 'Den här delen kunde inte visas';
const TITEL_CHUNK_FEL = 'Den här delen behöver laddas om';
const BRODTEXT_VANLIGT_FEL =
  'Resten av sidan fungerar. Prova igen, eller ladda om hela sidan om det inte hjälper.';
const BRODTEXT_CHUNK_FEL = 'En ny version av appen gör att den här delen behöver laddas om.';

/** Går till feltrigger-sidan och väntar tills React bevisligen har mountat. */
async function oppnaSidan(page: Page) {
  await page.goto('/dev/sektionsfel');
  await page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' }).waitFor();
}

test.describe('SectionError — knappval vid chunk-fel (TASK-285.7)', () => {
  test('ett vanligt fel visar "Försök igen"; "Ladda om" syns inte', async ({ page }) => {
    await oppnaSidan(page);
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();

    const alert = page.getByRole('alert').filter({ hasText: TITEL_VANLIGT_FEL });
    await expect(alert).toBeVisible();
    // Brödtexten prövas EXAKT (TASK-285.8, AC #4) — inte bara rubriken.
    await expect(alert).toContainText(BRODTEXT_VANLIGT_FEL);
    await expect(alert.getByRole('button', { name: FORSOK_IGEN, exact: true })).toBeVisible();
    await expect(alert.getByRole('button', { name: LADDA_OM, exact: true })).toHaveCount(0);
  });

  test('ett chunk-fel visar "Ladda om"; "Försök igen" syns inte', async ({ page }) => {
    await oppnaSidan(page);
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();

    const alert = page.getByRole('alert').filter({ hasText: TITEL_CHUNK_FEL });
    await expect(alert).toBeVisible();
    // Brödtexten prövas EXAKT (TASK-285.8, AC #4) — inte bara rubriken.
    await expect(alert).toContainText(BRODTEXT_CHUNK_FEL);
    await expect(alert.getByRole('button', { name: LADDA_OM, exact: true })).toBeVisible();
    await expect(alert.getByRole('button', { name: FORSOK_IGEN, exact: true })).toHaveCount(0);
  });

  test('"Försök igen" resettar sektionen (oförändrat beteende, AC #2)', async ({ page }) => {
    await oppnaSidan(page);
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();

    const alert = page.getByRole('alert').filter({ hasText: TITEL_VANLIGT_FEL });
    await expect(alert).toBeVisible();
    await page.getByRole('button', { name: FORSOK_IGEN, exact: true }).click();

    // Reset + invalidate remountar routen — feltriggerns knappar syns igen,
    // ingen omladdning har skett (samma sida, samma module-state).
    await expect(page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kasta sektions-fel' })).toBeVisible();
    await expect(alert).toHaveCount(0);
  });

  test('"Ladda om" laddar om hela sidan (AC #1, hel omladdning — inte reset)', async ({ page }) => {
    await oppnaSidan(page);
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();

    const alert = page.getByRole('alert').filter({ hasText: TITEL_CHUNK_FEL });
    await expect(alert).toBeVisible();

    // Lokatorn scopas till SectionErrors EGEN alert-region, inte hela sidan:
    // chunk-läget monterar ÄVEN chunk-bannern (`AppUpdateBanner.tsx`s
    // `ChunkBanner`, en SYSKON-alert-region som läser samma modul-flagga,
    // TASK-285.5) och DEN bär också en knapp med namnet "Ladda om" — mätt
    // (strict mode violation) första körningen av detta test. De två är
    // AVSIKTLIGT samma ord (samma åtgärd, samma copy-golv), men två
    // element med samma tillgängliga namn på samma sida måste disambigueras
    // i lokatorn, inte i produkten — se PR-beskrivningen för den upptäckten.
    await Promise.all([
      page.waitForEvent('load'),
      alert.getByRole('button', { name: LADDA_OM, exact: true }).click(),
    ]);

    // Efter en RIKTIG omladdning är modul-tillståndet nollställt: sidan
    // visar feltriggerns normalläge, inte kvarvarande felläge. En reset
    // hade INTE nollställt `omladdningKravs` (modul-nivå, oberoende av
    // React-trädet) — bara en hel omladdning gör det.
    await expect(page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kasta chunk-fel' })).toBeVisible();
    await expect(alert).toHaveCount(0);
  });
});
