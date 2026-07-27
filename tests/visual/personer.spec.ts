import { expect, test } from '../support/fixturvarld/hermetic';

/** Personlistan i den frusna fixturvärlden (task-36.7 steg 2). */
test('personer — personlistan ur fixturvärlden', async ({ page }) => {
  await page.goto('/personer');

  await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
  await expect(page.getByText('Hassan Haddad').first()).toBeVisible();

  await expect(page).toHaveScreenshot('personer.png', { fullPage: true });
});
