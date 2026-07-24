// [DEBUG-S83] Filter-iterationens render-verifiering (iteration 2: dropdowns):
// öppnar panelen, väljer i selects, kollar räknare + tomläge + print. Städas efter passet.
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

const valj = async (dim, varde) => {
  await page.getByRole('button', { name: new RegExp(dim) }).click();
  await page.getByRole('option', { name: varde, exact: true }).click();
};

await page.goto(`${BASE}/event?variant=k`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Visa filter/ }).click();
await page.screenshot({ path: `${OUT}/steg2b-panel-oppen.png`, fullPage: true });

await valj('Typ', 'Kurs');
await valj('Ort', 'Skövde');
await page.waitForTimeout(300);
const kort = await page.locator('ul[aria-label^="Event"] li').count();
const raknare = await page
  .getByText(/Visar \d+ av \d+ event/)
  .first()
  .textContent();
console.log(`Filtrerat (Typ=Kurs, Ort=Skövde): kort=${kort} · "${raknare}"`);
await page.screenshot({ path: `${OUT}/steg2b-filtrerat.png`, fullPage: true });

// Tomläget: kombination som inte finns i demon.
await valj('Typ', 'Retreat');
await valj('Ort', 'Stockholm');
await page.waitForTimeout(300);
const tomtext = await page.getByText('Inga event matchar filtren').count();
console.log(`Tomläge (Retreat+Stockholm): synlig=${tomtext === 1}`);

// "Alla orter" nollställer ort-dimensionen; print-emulering med Typ=Retreat.
await valj('Ort', 'Alla orter');
await page.waitForTimeout(200);
await page.emulateMedia({ media: 'print' });
await page.screenshot({ path: `${OUT}/steg2b-print.png`, fullPage: true });
await page.emulateMedia({ media: 'screen' });
console.log('Print-emulering tagen (Typ=Retreat aktivt).');
console.log(fel.length ? `SIDFEL:\n${fel.join('\n')}` : 'Inga sidfel.');
await browser.close();
