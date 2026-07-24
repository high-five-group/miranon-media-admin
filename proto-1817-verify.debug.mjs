// [DEBUG-S83] Pass 3-verifiering (18.17): per-anmälan-detaljvyn, båda
// demo-anmälningarna. Städas efter passet.
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? '.';
const EVENT = 'recigcY12dDllUkYt';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: '/Users/marcus/Repon/miranon-media-admin/playwright/.auth/user.json',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
const fel = [];
page.on('pageerror', (e) => fel.push(String(e)));

for (const id of ['demo-anna', 'demo-bjorn']) {
  await page.goto(`${BASE}/event/${EVENT}/anmalan/${id}?variant=k`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const h1 = await page.locator('h1').first().textContent();
  const grupper = await page.locator('section section h2, section > div h2').count();
  await page.screenshot({ path: `${OUT}/1817-${id}.png`, fullPage: true });
  console.log(`${id}: h1="${h1}" grupprubriker=${grupper}`);
}
console.log(fel.length ? `SIDFEL:\n${fel.join('\n')}` : 'Inga sidfel.');
await browser.close();
