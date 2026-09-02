import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * TASK-361 r2 — Button-primitivens `isLoading` FÅR ALDRIG ändra knappens
 * mått (bredd/höjd), VARKEN i vila ELLER i laddläge. Marcus prod-röktest-
 * fynd, verbatim (S113 resume 8, 2026-09-02): *"när jag förhandsgranska...
 * så växer knappen i bredd. Det gillar jag INTE... det är inte OK, så gör
 * inte proffs."*
 *
 * Rent DOM-mått-test (ADR-094-klassen: webblasarbeteende — fixturfritt,
 * noll nätverksanrop, samma familj som `forberedelseskarm-hojdkedja.test.ts`
 * och `uppdateringsnotis-promoverings-grind.test.ts`). Till skillnad från
 * Förberedelseskärmens HÖJDKEDJA-test är TILLSTÅNDET här INTE transient —
 * `/dev/primitives`s `LaddlageStabilBreddDemo` styrs av en EXTERN
 * togglingsknapp (inte knapparnas egna `onPress`, precis som en riktig
 * `useMutation`s `isPending` styr flera knappar utifrån hos konsumenterna,
 * t.ex. `BetalningsInkorg.tsx`s `koa.isPending`) — så mätningen kan ske med
 * vanlig `boundingBox()` + auto-väntande assertions, ingen
 * MutationObserver/console-polling krävs.
 *
 * ═══ RUNDA 2 — VARFÖR TESTET SKREVS OM ═══
 *
 * Granskning av PR #2212 runda 1 (risk HÖG, warning-fynd som höll): r1:s
 * teknik (CSS Grid-stapling, `[grid-area:1/1]` på två alltid-monterade
 * lager) gjorde knappens mått = MAX(etikett, ladd-lager) — även i VILA,
 * eftersom grid-spårets storlek beräknas av BÅDA lagren oavsett synlighet.
 * En knapp som `login.tsx`s "Logga in" (`loadingText="Loggar in …"` + ikon)
 * blev därför PERMANENT bredare än "Logga in" ensamt — exakt den
 * knappbredd-klass Marcus dömde ut, fast permanent i stället för ett hopp.
 * r1:s TVÅ tester (kort/lång `loadingText`) mätte bara att vila == laddläge
 * för SAMMA knapp — de bevisade ALDRIG att vila-måttet var KORREKT (dvs.
 * lika med etikettens EGET mått, oberoende av `loadingText`). Det kravet
 * ställs nu explicit: varje `size` (sm/md/lg — r1:s demo/test täckte bara
 * md, granskningens info-fynd) har en REFERENS-knapp (`Button` UTAN
 * `isLoading`-prop alls, samma etikett) som facit — target-knappens mått
 * jämförs mot referensen, inte bara mot sig själv.
 *
 * ═══ NEGATIVT BEVIS MOT BÅDA r1 OCH r2:s FÖRLAGA ═══
 *
 * Se PR-kroppen för TASK-361 för det fullständiga utdraget: samma testfil
 * kört mot r1:s `Button.tsx` (commit `c4c65e40`, `git show c4c65e40:
 * src/components/primitives/Button.tsx`, ALDRIG `git stash`) fäller på
 * VILA-bredden — target-knappen är bredare än referensen INNAN `isLoading`
 * någonsin blivit sant.
 */

const STORLEKAR = ['sm', 'md', 'lg'] as const;
type Storlek = (typeof STORLEKAR)[number];

const TOGGLA = '[data-testid="task-361-toggla"]';

interface Matt {
  bredd: number;
  hojd: number;
}

function referens(storlek: Storlek) {
  return `[data-testid="task-361-referens-${storlek}"]`;
}

function target(storlek: Storlek) {
  return `[data-testid="task-361-target-${storlek}"]`;
}

/** Väntar in att `data-loading` matchar förväntat läge INNAN mätning — annars
 * mäter `boundingBox()` ett mellanting mitt i Reacts commit. */
async function vantaLaddlage(el: Locator, vantatLaddar: boolean) {
  if (vantatLaddar) {
    await expect(el).toHaveAttribute('data-loading', 'true');
  } else {
    await expect(el).not.toHaveAttribute('data-loading', 'true');
  }
}

async function matt(el: Locator): Promise<Matt> {
  const box = await el.boundingBox();
  if (!box) {
    throw new Error('Elementet saknar boundingBox — osynligt eller borttaget ur DOM');
  }
  return { bredd: box.width, hojd: box.height };
}

async function oppnaDemon(page: Page) {
  await page.goto('/dev/primitives');
  await expect(page.locator(TOGGLA)).toBeVisible();
  for (const storlek of STORLEKAR) {
    await expect(page.locator(referens(storlek))).toBeVisible();
    await expect(page.locator(target(storlek))).toBeVisible();
  }
  // TASK-361 r2, flake mätt (repeat-each=5, 6/20 röda innan denna rad):
  // ~2 px bredd-diff mellan referens och target, VARIABELT vilken storlek.
  // Samma KÄNDA, redan diagnostiserade Google Fonts-race som
  // `tests/support/mat-cls.ts` löser för samma demosida (`TASK-307`, se
  // den filens fullständiga källbelägg) — `base.css`s `@import` upptäcks
  // sent, "Spara"-etiketten byter fallback-typsnitt → Inter MITT I
  // mätfönstret, och referens/target (mätta vid olika tidpunkter) hinner
  // olika långt i bytet. `document.fonts.ready` ENSAM är bevisat
  // otillräcklig (samma fils källor, #1082/#174030/#225790) — `networkidle`
  // FÖRST täcker båda nätverksstegen (CSS-svaret + `woff2`-hämtningen)
  // oavsett `FontFaceSet`-racets utfall.
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Button — laddläge ändrar aldrig knappens mått, i vila eller laddläge (TASK-361 r2)', () => {
  for (const storlek of STORLEKAR) {
    test(`size="${storlek}": target matchar en isLoading-lös REFERENS i vila, laddläge och tillbaka i vila`, async ({
      page,
    }) => {
      await oppnaDemon(page);
      const referensKnapp = page.locator(referens(storlek));
      const targetKnapp = page.locator(target(storlek));
      const toggla = page.locator(TOGGLA);

      // Referensen har ALDRIG `isLoading` — dess mått är facit, oberoende
      // av vad som händer med target under testet.
      const facit = await matt(referensKnapp);

      await vantaLaddlage(targetKnapp, false);
      const vilaFore = await matt(targetKnapp);
      expect(
        vilaFore,
        `target (${storlek}) ska ha EXAKT samma mått som en isLoading-lös referens i vila`,
      ).toEqual(facit);

      await toggla.click();
      await vantaLaddlage(targetKnapp, true);
      const laddar = await matt(targetKnapp);
      expect(
        laddar,
        `target (${storlek}) får INTE ändra mått i laddläge — den längre loadingText:en får aldrig synas eller breddsätta knappen`,
      ).toEqual(facit);

      await toggla.click();
      await vantaLaddlage(targetKnapp, false);
      const vilaEfter = await matt(targetKnapp);
      expect(vilaEfter, 'round-trip tillbaka till vila ska ge exakt samma mått igen').toEqual(
        facit,
      );
    });
  }

  test('loadingText syns aldrig visuellt — bara sr-only — och annonseras (role=status, polite)', async ({
    page,
  }) => {
    await oppnaDemon(page);
    const targetKnapp = page.locator(target('md'));
    const toggla = page.locator(TOGGLA);

    await vantaLaddlage(targetKnapp, false);
    // Ladd-overlayn är villkorat monterad (TASK-361 r2) — i vila finns
    // varken `role="status"` eller ikonen i DOM:en alls.
    await expect(targetKnapp.getByTestId('button-ladd-overlay')).toHaveCount(0);
    await expect(targetKnapp.getByRole('status')).toHaveCount(0);

    await toggla.click();
    await vantaLaddlage(targetKnapp, true);

    const overlay = targetKnapp.getByTestId('button-ladd-overlay');
    await expect(overlay).toBeVisible();

    const status = targetKnapp.getByRole('status');
    await expect(status).toHaveText('Bearbetar och skickar bekräftelse till alla mottagare …');
    // sr-only: i DOM:en och i a11y-trädet (`getByRole` hittade den precis
    // ovan), men UPPTAR NOLL SYNLIG YTA — `Waitlist.tsx`s etablerade mönster.
    const statusBox = await status.boundingBox();
    expect(statusBox?.width ?? 0, 'sr-only-texten ska inte uppta synlig bredd').toBeLessThan(2);
    expect(statusBox?.height ?? 0, 'sr-only-texten ska inte uppta synlig höjd').toBeLessThan(2);
  });
});
