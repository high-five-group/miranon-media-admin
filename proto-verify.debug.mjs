// [DEBUG-S83] Fristående render-verifiering (L304-formen): loggar in med
// e2e-svitens credentials (.env.test), sparar färsk storageState till
// svitens auth-fil (samma innehåll som auth.setup.ts skriver), och
// verifierar skarpa vyn vs prototyp-kopian på /event. Städas efter passet.
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173';
const OUT = process.env.OUT_DIR ?? '.';
const AUTH = '/Users/marcus/Repon/miranon-media-admin/playwright/.auth/user.json';

const env = Object.fromEntries(
  readFileSync('/Users/marcus/Repon/miranon-media-admin/.env.test', 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()]),
);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const fel = [];
page.on('console', (m) => {
  if (m.type() === 'error') fel.push(m.text());
});
page.on('pageerror', (e) => fel.push(String(e)));

await page.goto(`${BASE}/login`);
await page.locator('#login-email').fill(env.TEST_USER_EMAIL);
await page.locator('#login-password').fill(env.TEST_USER_PASSWORD);
await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);
await ctx.storageState({ path: AUTH });
console.log('Inloggad; storageState uppdaterad.');

for (const [namn, url] of [
  ['skarp', `${BASE}/event`],
  ['proto-k', `${BASE}/event?variant=k`],
  ['proto-k-verklig', `${BASE}/event?variant=k&data=verklig`],
]) {
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${namn}.png`, fullPage: true });
  const h1 = await page.locator('h1').first().textContent();
  const kort = await page.locator('ul[aria-label^="Event"] li').count();
  console.log(`${namn}: h1="${h1}" kort=${kort} url=${page.url()}`);
}
console.log(fel.length ? `KONSOLFEL:\n${fel.join('\n')}` : 'Inga konsolfel.');
await browser.close();
