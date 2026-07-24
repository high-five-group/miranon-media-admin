import { VISUAL_EVENT_ID } from './support/fixture-data';
import { expect, test } from './support/hermetic';

/** Eventsidan (aggregerande detaljen) i den frusna fixturvärlden
 *  (task-36.7 steg 2) — beläggning, arbetskö och anteckningar ur fixturen. */
test('eventsidan — operations-översikten ur fixturvärlden', async ({ page }) => {
  await page.goto(`/event/${VISUAL_EVENT_ID}`);

  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();
  // Antecknings-strömmen bevisar get-event-notes-mocken.
  await expect(page.getByText('Lokalen bokad och bekräftad', { exact: false })).toBeVisible();

  await expect(page).toHaveScreenshot('eventsida.png', { fullPage: true });
});
