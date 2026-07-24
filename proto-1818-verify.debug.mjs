// [DEBUG-S83] Pass 4-verifiering (18.18+18.19): väljaren på ny-anmälan (k)
// + eventsidans A/B; bytet ska navigera URL:en. Städas efter passet.
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? '.';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: '/Users/marcus/Repon/miranon-media-admin/playwright/.auth/user.json',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
const fel = [];
page.on('pageerror', (e) => fel.push(String(e)));

await page.goto(`${BASE}/event`, { waitUntil: 'networkidle' });
const href = await page.locator('ul[aria-label^="Event"] li a').first().getAttribute('href');
const eventId = href.split('/').pop();
console.log(`Utgångs-event: ${eventId}`);

// 18.18 — ny-anmälan med väljaren
await page.goto(`${BASE}/event/${eventId}/ny-anmalan?variant=k`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/1818-stangd.png`, fullPage: false });
await page.getByRole('button', { name: 'Byt event' }).click();
await page.waitForTimeout(300);
const alternativ = await page.getByRole('option').count();
await page.screenshot({ path: `${OUT}/1818-oppen.png`, fullPage: false });
// Byt till ett ANNAT event (option som inte är vald)
const annat = page.getByRole('option').filter({ hasNot: page.locator('[aria-selected="true"]') });
const ejValda = await page.locator('[role="option"]:not([aria-selected="true"])').count();
if (ejValda > 0) {
  await page.locator('[role="option"]:not([aria-selected="true"])').first().click();
  await page.waitForTimeout(600);
  console.log(`Efter byte: url=${page.url()}`);
}
console.log(`18.18: ${alternativ} alternativ i listan`);

// 18.19 A + B på eventsidan
for (const v of ['a', 'b']) {
  await page.goto(`${BASE}/event/${eventId}?variant=${v}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/1819-${v}.png`, fullPage: false });
  const h1 = await page.locator('h1').first().textContent();
  console.log(`1819-${v}: h1="${h1?.trim()}"`);
}
console.log(fel.length ? `SIDFEL:\n${fel.join('\n')}` : 'Inga sidfel.');
await browser.close();
