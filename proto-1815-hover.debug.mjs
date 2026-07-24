// [DEBUG-S83] Hover-verifiering (18.15 iteration 2): siffer-rutan ska förbli
// synlig mot hover-plattan. Städas efter passet.
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? '.';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  storageState: '/Users/marcus/Repon/miranon-media-admin/playwright/.auth/user.json',
  viewport: { width: 1440, height: 900 },
});
const page = await ctx.newPage();
await page.goto(`${BASE}/event/recigcY12dDllUkYt?variant=k`, { waitUntil: 'networkidle' });
const grupp = page.locator('section[aria-labelledby="grupp-atgarder"]');
await grupp.scrollIntoViewIfNeeded();
const rad3 = grupp.locator('button, a').nth(2);
await rad3.hover();
await page.waitForTimeout(250);
const bakgrunder = await page.evaluate(() => {
  const rad = document.querySelectorAll('section[aria-labelledby="grupp-atgarder"] button, section[aria-labelledby="grupp-atgarder"] a')[2];
  const ruta = rad.querySelector('span[aria-hidden]');
  return {
    rad: getComputedStyle(rad).backgroundColor,
    ruta: getComputedStyle(ruta).backgroundColor,
  };
});
console.log(`Hover-bakgrunder: rad=${bakgrunder.rad} · ruta=${bakgrunder.ruta} · distinkta=${bakgrunder.rad !== bakgrunder.ruta}`);
await grupp.screenshot({ path: `${OUT}/1815-hover.png` });
await browser.close();
