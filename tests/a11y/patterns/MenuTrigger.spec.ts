import { expect, test } from '../fixtures';

/**
 * MenuTrigger-mönstret (MenuTrigger + Menu i Popover) — test-MALL för Fas 6.
 *
 * Vid konsumtion anpassas: (1) devPagePath → vyn, (2) include-selektorn,
 * (3) trigger-aria-label (descriptive per checklist §6.4, inte bara en
 * glyf) + menyval-namnen. Skann-strukturen (vilande sektion → öppnad meny
 * som helsides-skan eftersom popovern portalas) behålls.
 */
test.use({ devPagePath: '/dev/patterns' });

test('MenuTrigger — vilande + öppnad meny: 0 violations', async ({ page, checkA11y }) => {
  await checkA11y({ include: ['[aria-labelledby="rubrik-menutrigger"]'] });

  const trigger = page.getByRole('button', { name: 'Åtgärder för Anna Andersson' });
  await trigger.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await checkA11y();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).not.toBeVisible();
});
