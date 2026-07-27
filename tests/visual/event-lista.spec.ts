import { expect, test } from '../support/fixturvarld/hermetic';

/** Event-listan i den frusna fixturvärlden (task-36.7 steg 2). */
test('event-listan — kommande och genomförda ur fixturvärlden', async ({ page }) => {
  await page.goto('/event');

  // Default-läget är Kommande — Varberg (Genomfört) bor under Tidigare och
  // ska INTE synas här; de två kommande fixtur-eventen bär beviset.
  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();
  await expect(page.getByText('Föreläsning Göteborg').first()).toBeVisible();

  await expect(page).toHaveScreenshot('event-lista.png', { fullPage: true });
});
