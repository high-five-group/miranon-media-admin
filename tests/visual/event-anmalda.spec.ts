import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { expect, test } from '../support/fixturvarld/hermetic';

/** Anmälda-vyn (eventets deltagarlista) i den frusna fixturvärlden
 *  (task-36.7 steg 2) — get-registrations eventId-filtret speglas i mocken. */
test('anmälda — eventets deltagarlista ur fixturvärlden', async ({ page }) => {
  await page.goto(`/event/${VISUAL_EVENT_ID}/anmalda`);

  await expect(page.getByText('Cecilia Ceder').first()).toBeVisible();
  await expect(page.getByText('Filip Forsberg').first()).toBeVisible();

  await expect(page).toHaveScreenshot('event-anmalda.png', { fullPage: true });
});
