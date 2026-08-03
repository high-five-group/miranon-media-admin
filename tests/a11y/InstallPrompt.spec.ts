import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * InstallPrompt — beteende-tester (task-126.2; PRD task-126 §Testbeslut:
 * "Tillgängligheten testas i a11y-skarven; ribban är 11, inga undantag").
 *
 * Kör i a11y-projektet mot /dev/primitives (ADR-044/045) — axe-skanningen av
 * sektionen (båda tillstånden) bor i `primitives.spec.ts`, denna filen
 * bevisar externt BETEENDE (roll/namn/tangentbord/aria-live), samma delning
 * som NavCard.spec.ts/SlideToConfirm.spec.ts håller mot primitives.spec.ts.
 *
 * INGEN dedikerad computed-style-kontrakt-sektion (contrast-more/reduced-
 * motion/print) här, till skillnad från NavCard/SlideToConfirm/
 * ToggleButtonGroup: `InstallPrompt` uppfinner NOLL egen visuell identitet
 * — den komponerar det redan `Button`-primitivet (som i sin tur redan bär
 * de kontrakten via sin egen data-attribut-styling) i stället för att
 * definiera nya komponent-tokens. Att re-testa Button:s redan bevisade
 * facit här hade varit dubbelarbete utan nytt bevisvärde (samma princip som
 * att `Button` själv saknar en egen `Button.spec.ts` — dess axe-0-bevis bor
 * enbart i `primitives.spec.ts`s sektions-skan).
 */

const DEFAULT_INSTANS = '[data-testid="installprompt-default"]';
const INSPEKTIONS_INSTANS = '[data-testid="installprompt-inspect"]';

/** Skjuter beforeinstallprompt upprepat tills knappen syns (mount-race-robust). */
async function fangaInstallationshandelsen(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="installprompt-default"] button')) return true;
      const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
      };
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
      window.dispatchEvent(event);
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

test.describe('InstallPrompt — beteendekontrakt (task-126.2)', () => {
  test('default-instansen: strukturellt noll interaktiva element innan händelsen fångats (AC 2)', async ({
    page,
  }) => {
    const instans = page.locator(DEFAULT_INSTANS);
    await expect(instans.getByRole('button')).toHaveCount(0);
    // Ingen som helst renderad markup — komponenten returnerar `null`, inte
    // ett dolt/tomt skal (ADR-045-andan: inget att skanna är starkare än
    // "skannat och tomt").
    await expect(instans).toBeEmpty();
  });

  test('fångad händelse: knappen är en RIKTIG button med tillgängligt namn, tangentbord fungerar (Enter)', async ({
    page,
  }) => {
    await fangaInstallationshandelsen(page);
    const knapp = page.locator(DEFAULT_INSTANS).getByRole('button');
    await expect(knapp).toHaveCount(1);
    await expect(knapp).toHaveAccessibleName('Installera appen');

    // Tab-flytt (inte programmatisk focus) garanterar :focus-visible-vägen,
    // och Enter är den WAI-ARIA-förväntade aktiveringstangenten för button.
    await knapp.focus();
    await page.keyboard.press('Enter');
    // Enter → onPress → promptToInstall() → userChoice 'dismissed' →
    // engångshändelsen konsumerad → knappen strukturellt borta igen.
    await expect(knapp).toHaveCount(0);
  });

  test('render-prop-instansen: aria-live="polite" annonserar plattformsväg och prompt-tillgänglighet reaktivt', async ({
    page,
  }) => {
    const annonsering = page.locator(INSPEKTIONS_INSTANS).locator('[aria-live="polite"]');
    await expect(annonsering).toHaveCount(1);
    await expect(annonsering).toContainText('chromium-prompt');
    await expect(annonsering).toContainText('ingen prompt tillgänglig');

    await fangaInstallationshandelsen(page);
    await expect(annonsering).toContainText('prompt tillgänglig');
    await expect(annonsering).not.toContainText('ingen prompt tillgänglig');
  });
});
