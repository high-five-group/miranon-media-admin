/**
 * [PROTOTYPE] S106 — fristående snapshot-rigg (L304-formen: fristående
 * Playwright med e2e-svitens login-steg, mot den REDAN KÖRANDE dev-servern
 * på 5173 — config-webServerns stale-vakt är avsiktligt inte inblandad).
 * Otrackad, rivs med prototypen. Kör: node proto-snap.mjs
 *
 * Tar helvy-par (ADR-074: deviceScaleFactor 2) till sessionens bilage-
 * katalog: baslinje (skarpa vyn) + steg-k2 (omdesignen) × desktop/mobil.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const env = Object.fromEntries(
  readFileSync('.env.test', 'utf8')
    .split('\n')
    .filter((r) => r.includes('=') && !r.trim().startsWith('#'))
    .map((r) => [r.slice(0, r.indexOf('=')).trim(), r.slice(r.indexOf('=') + 1).trim()]),
);
const email = env.TEST_USER_EMAIL;
const password = env.TEST_USER_PASSWORD;
if (!email || !password) throw new Error('TEST_USER_EMAIL/PASSWORD saknas i .env.test');

const BAS = 'http://localhost:5173';
const KATALOG = 'tasks/sessions/bilagor/s106-aktivitetslogg';
mkdirSync(KATALOG, { recursive: true });

const browser = await chromium.launch();

/** Logga in en gång, returnera storageState. */
async function loggaIn() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BAS}/login`);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await Promise.all([page.waitForURL('**/hem'), page.locator('button[type="submit"]').click()]);
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function skott(state, { namn, url, viewport }) {
  const ctx = await browser.newContext({
    storageState: state,
    viewport,
    deviceScaleFactor: 2,
    // Lottas miljö, inte Playwrights default (en-US/UTC): utan detta visar
    // RAC:s datumsegment amerikansk ordning i bilderna men inte i din browser.
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  });
  const page = await ctx.newPage();
  await page.goto(`${BAS}${url}`);
  // Maska dev-överlägget (rail) via CSS — snapshot-hooken data-proto-rail.
  await page.addStyleTag({ content: '[data-proto-rail]{display:none !important}' });
  // Vänta bort skelettet: laddat läge, tomläge eller felruta.
  await page
    .locator('p', { hasText: /Visar (de |alla )?\d|Ingen aktivitet|Inga träffar|Kunde inte/ })
    .first()
    .waitFor({ timeout: 20000 })
    .catch(() => console.warn(`${namn}: inget slut-tillstånd inom 20 s — tar bilden ändå`));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${KATALOG}/${namn}.png`, fullPage: true });
  console.log(`${KATALOG}/${namn}.png`);
  await ctx.close();
}

const state = await loggaIn();
const desktop = { width: 1440, height: 900 };
const mobil = { width: 390, height: 844 };
await skott(state, { namn: 'baslinje-desktop', url: '/mer/aktivitetshistorik', viewport: desktop });
await skott(state, { namn: 'baslinje-mobil', url: '/mer/aktivitetshistorik', viewport: mobil });
await skott(state, {
  namn: 'steg-k2-desktop',
  url: '/mer/aktivitetshistorik?variant=a',
  viewport: desktop,
});
await skott(state, {
  namn: 'steg-k2-mobil',
  url: '/mer/aktivitetshistorik?variant=a',
  viewport: mobil,
});
await browser.close();
