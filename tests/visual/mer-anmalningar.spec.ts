import { expect, test } from './support/hermetic';

/** Anmälningslistan under Mer i den frusna fixturvärlden (task-36.7 steg 2). */
test('mer/anmälningar — hela anmälningslistan ur fixturvärlden', async ({ page }) => {
  await page.goto('/mer/anmalningar');

  await expect(page.getByText('Anna Andersson').first()).toBeVisible();
  await expect(page.getByText('Emma Eklund').first()).toBeVisible();

  await expect(page).toHaveScreenshot('mer-anmalningar.png', { fullPage: true });
});
