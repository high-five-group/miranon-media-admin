import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '../../support/fixturvarld/hermetic';

/**
 * Genererar manifestets LIGGANDE skärmbild (TASK-126.4, AC #1 + #2).
 *
 * Se tests/manifest-screenshots/narrow/hem.spec.ts för den fulla motiveringen
 * (körform, hermetik, varför ingen toHaveScreenshot-jämförelse).
 *
 * VYVAL: /event — eventlistan. Vald av samma skäl som Hem: rör ingen av
 * filerna S93 arbetar mot (EventDetail.tsx + detail/*), och har en bevisat
 * stabil hermetisk baseline (tests/visual/event-lista.spec.ts).
 *
 * VIEWPORT: samma dimensioner som visual-desktop-projektet (1440×900,
 * deviceScaleFactor 2) → verklig PNG-storlek 2880×1800, exakt `sizes`-
 * strängen i vite.config.ts.
 */
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUTPUT_PATH = resolve(REPO_ROOT, 'public', 'screenshots', 'wide-event-lista.png');

test('wide — eventlistan för installationsdialogens skärmbild', async ({ page }) => {
  await page.goto('/event');

  // Samma synlighets-vakt som tests/visual/event-lista.spec.ts.
  await expect(page.getByText('Utbildning Skövde').first()).toBeVisible();
  await expect(page.getByText('Föreläsning Göteborg').first()).toBeVisible();

  await page.screenshot({ path: OUTPUT_PATH });
});
