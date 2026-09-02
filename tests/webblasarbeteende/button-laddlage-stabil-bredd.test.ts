import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * TASK-361 — Button-primitivens `isLoading` FÅR ALDRIG ändra knappens mått
 * (bredd/höjd). Marcus prod-röktest-fynd, verbatim (S113 resume 8,
 * 2026-09-02): *"när jag förhandsgranska... så växer knappen i bredd. Det
 * gillar jag INTE... det är inte OK, så gör inte proffs."*
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
 * TVÅ RIKTNINGAR TÄCKS (Button.tsx:s docblock § "STABILA MÅTT UNDER
 * LADDLÄGE"s kontrakt "mått = bredaste/högsta av de två lagren"):
 * - KORT etikett + KORTARE `loadingText` — ladd-laget FÅR INTE bli smalare.
 * - Etikett + LÄNGRE `loadingText` — vila-laget FÅR INTE bli smalare än
 *   ladd-laget (den medvetna avvägningen docblocket beskriver: en
 *   konsument som vill ha en smal viloknapp väljer en kort `loadingText`).
 *
 * NEGATIVT BEVIS: samma test kört mot FÖRLAGAN (`Button.tsx`s innehåll i
 * `origin/main` före denna PR, hämtat med `git show`, ALDRIG `git stash` —
 * se PR-kroppen för kommandot och det fällda utdraget). Ingen kod i denna
 * fil skiljer mellan de två lägena; skillnaden är ENDAST vilken
 * `Button.tsx` som är monterad när testet körs.
 */

const TOGGLA = '[data-testid="task-361-toggla"]';
const KORT = '[data-testid="task-361-kort-etikett"]';
const LANG = '[data-testid="task-361-lang-loadingtext"]';

interface Matt {
  bredd: number;
  hojd: number;
}

/** Väntar in att `data-loading` matchar förväntat läge INNAN mätning — annars
 * mäter `boundingBox()` ett mellanting mitt i Reacts commit. */
async function vantaLaddlage(target: Locator, vantatLaddar: boolean) {
  if (vantatLaddar) {
    await expect(target).toHaveAttribute('data-loading', 'true');
  } else {
    await expect(target).not.toHaveAttribute('data-loading', 'true');
  }
}

async function matt(target: Locator): Promise<Matt> {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Målknappen saknar boundingBox — osynlig eller borttagen ur DOM');
  }
  return { bredd: box.width, hojd: box.height };
}

async function oppnaDemon(page: Page) {
  await page.goto('/dev/primitives');
  await expect(page.locator(KORT)).toBeVisible();
  await expect(page.locator(LANG)).toBeVisible();
  await expect(page.locator(TOGGLA)).toBeVisible();
}

test.describe('Button — laddläge ändrar aldrig knappens mått (TASK-361)', () => {
  test('KORT etikett, KORTARE loadingText: bredd och höjd identiska i vila → laddläge → vila', async ({
    page,
  }) => {
    await oppnaDemon(page);
    const target = page.locator(KORT);
    const toggla = page.locator(TOGGLA);

    await vantaLaddlage(target, false);
    const vilaFore = await matt(target);

    await toggla.click();
    await vantaLaddlage(target, true);
    const laddar = await matt(target);

    await toggla.click();
    await vantaLaddlage(target, false);
    const vilaEfter = await matt(target);

    expect(laddar.bredd, 'bredden ska vara IDENTISK i laddläge som i vila').toBe(vilaFore.bredd);
    expect(laddar.hojd, 'höjden ska vara IDENTISK i laddläge som i vila').toBe(vilaFore.hojd);
    expect(vilaEfter, 'round-trip tillbaka till vila ska ge exakt samma mått igen').toEqual(
      vilaFore,
    );
  });

  test('etikett + LÄNGRE loadingText: bredd och höjd identiska i vila → laddläge', async ({
    page,
  }) => {
    await oppnaDemon(page);
    const target = page.locator(LANG);
    const toggla = page.locator(TOGGLA);

    await vantaLaddlage(target, false);
    const vila = await matt(target);

    await toggla.click();
    await vantaLaddlage(target, true);
    const laddar = await matt(target);

    expect(laddar.bredd, 'en LÄNGRE loadingText får inte göra knappen bredare').toBe(vila.bredd);
    expect(laddar.hojd, 'en LÄNGRE loadingText får inte göra knappen högre').toBe(vila.hojd);
  });

  test('laddläget annonseras (role=status, polite) utan att bredden rörs eller döljs', async ({
    page,
  }) => {
    await oppnaDemon(page);
    const target = page.locator(KORT);
    const toggla = page.locator(TOGGLA);

    await vantaLaddlage(target, false);
    // Vilo-laget bär den SYNLIGA etiketten och INGEN `role="status"` —
    // ladd-lagets status-span ska vara `aria-hidden` (osynlig för AT) i
    // vila, se Button.tsx render-kommentaren.
    await expect(target.getByRole('status')).toBeHidden();

    await toggla.click();
    await vantaLaddlage(target, true);

    const status = target.getByRole('status');
    await expect(status).toBeVisible();
    await expect(status).toHaveText('Laddar …');
  });
});
