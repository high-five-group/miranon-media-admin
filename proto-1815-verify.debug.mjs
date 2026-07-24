// [DEBUG-S83] Pass 2-verifiering (18.15): skarp Åtgärds-grupp vs numrerade
// boxar-kopian på riktig eventdetaljsida. Städas efter passet.
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
console.log(`Event-länk: ${href}`);

for (const [namn, url] of [
  ['1815-skarp', `${BASE}${href}`],
  ['1815-proto', `${BASE}${href}?variant=k`],
]) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
  await grupp.scrollIntoViewIfNeeded();
  await grupp.screenshot({ path: `${OUT}/${namn}.png` });
  const rader = await grupp.locator('button, a').count();
  const namn1 = await grupp.locator('button, a').first().textContent();
  console.log(`${namn}: rader=${rader} · första="${namn1?.trim()}"`);
}
console.log(fel.length ? `SIDFEL:\n${fel.join('\n')}` : 'Inga sidfel.');
await browser.close();
