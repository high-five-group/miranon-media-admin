import { expect, test } from '../fixtures';

/**
 * Overlay-mönstret (Modal + Dialog) — test-MALL för Fas 6.
 *
 * Vid konsumtion anpassas: (1) devPagePath → vyn som bär overlayen,
 * (2) include-selektorn → vyns sektion, (3) trigger-namnet, (4) ev.
 * vy-specifika assertioner. Skann-strukturen (vilande sektion → aktiverat
 * tillstånd som helsides-skan eftersom overlayen portalas) behålls.
 */
test.use({ devPagePath: '/dev/patterns' });

test('Overlay — vilande + öppnad modal: 0 violations', async ({ page, checkA11y }) => {
  await checkA11y({ include: ['[aria-labelledby="rubrik-overlay"]'] });

  await page.getByRole('button', { name: 'Öppna overlay-exemplet' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-labelledby');
  await checkA11y();

  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});
