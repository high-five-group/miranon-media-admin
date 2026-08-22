import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * `SectionError`s knappval vid chunk-fel (TASK-285.7, ADR-121 § Tre fynd
 * punkt 3; chunk-grenen omskriven av TASK-285.13).
 *
 * VAD SOM BEVISAS: "Försök igen" kör om samma import mot samma saknade
 * chunk och kan strukturellt aldrig lyckas i det läget (mätt,
 * `src/lib/chunk-laddningsfel.ts`s filhuvud). Vid ett chunk-fel visar
 * `SectionError` därför INGEN åtgärdsknapp alls — chunk-bannern äger
 * "Ladda om" (Marcus beslut 2026-08-22, `ADR-121` § Updates 2026-08-22).
 * För alla andra fel står "Försök igen" (reset + invalidate) oförändrat kvar.
 *
 * VAD SOM FLYTTADE HÄRIFRÅN (TASK-285.13): testet `"Ladda om" laddar om hela
 * sidan` prövade den knapp som denna skiva tar bort och kan inte skrivas om
 * på denna yta — `/dev/sektionsfel` ligger utanför `AppShell` och monterar
 * därför ingen chunk-banner alls. Bevisningen av att den KVARVARANDE
 * "Ladda om" (bannerns) laddar om hela sidan flyttade till det SAMMANSATTA
 * läget, `tests/acceptance/chunk-fel-skalet.acceptance.test.ts`. Där bevisas
 * också AC #2: att knappen finns EXAKT en gång på sidan.
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
 * Att `SectionError` ändå väljer rätt gren bevisar att klassningen sitter i
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
// Brödtexten bär LÖSNINGEN i ord sedan TASK-285.13 tog bort knappen på denna
// gren (copy-golvet: problem + orsak + lösning, DESIGN-SYSTEM-SPEC § 21).
const BRODTEXT_CHUNK_FEL =
  'En ny version av appen gör att den här delen inte kunde visas. Ladda om sidan för att hämta den nya versionen.';

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

  test('ett chunk-fel visar INGEN åtgärdsknapp alls (TASK-285.13)', async ({ page }) => {
    await oppnaSidan(page);
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();

    const alert = page.getByRole('alert').filter({ hasText: TITEL_CHUNK_FEL });
    await expect(alert).toBeVisible();
    // Brödtexten prövas EXAKT (TASK-285.8, AC #4) — inte bara rubriken. Den
    // bär numera LÖSNINGEN i ord, eftersom knappen är borta.
    await expect(alert).toContainText(BRODTEXT_CHUNK_FEL);

    // Chunk-bannern äger åtgärden (Marcus 2026-08-22). Sektionsfelet bär
    // varken "Ladda om" (löftet som inte kan hållas per del) eller
    // "Försök igen" (kör om samma saknade import) — NOLL knappar, inte en
    // annan knapp.
    await expect(alert.getByRole('button', { name: LADDA_OM, exact: true })).toHaveCount(0);
    await expect(alert.getByRole('button', { name: FORSOK_IGEN, exact: true })).toHaveCount(0);
    await expect(alert.getByRole('button')).toHaveCount(0);

    // Denna yta ligger UTANFÖR AppShell och monterar därför ingen
    // chunk-banner: hela sidan bär noll "Ladda om"-knappar i chunk-läget.
    // Det SAMMANSATTA läget (banner + sektionsfel samtidigt) prövas i
    // acceptance-klassen, se filhuvudet.
    await expect(page.getByRole('button', { name: LADDA_OM, exact: true })).toHaveCount(0);
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
});
