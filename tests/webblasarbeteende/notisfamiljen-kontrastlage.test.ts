import type { Locator, Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * Notisfamiljen — `prefers-contrast: more` surface-scopat på de TVÅ ytor
 * som saknade en egen kontrast-kontroll (TASK-285.9, AC #2): ChunkBanner
 * och SectionError. De övriga FEM ytorna har redan en computed-style-
 * kontroll (samma familjeregel — ingen kontur i vila, full intent-kontur
 * under `prefers-contrast: more`, S109-facit) i sin egen fil, och skanas
 * INTE om här (samma disciplin som `InstallPrompt.spec.ts`s filhuvud —
 * dubbelarbete utan nytt bevisvärde):
 *
 * - Uppdateringsnotis: `app-update-banner.test.ts` ("prefers-contrast: more
 *   tänder en full kontur i info-färg").
 * - OfflineIndicator: `offline-notis.test.ts` (samma test-titel).
 * - Meddelanderutan, alla fyra intents: `tests/a11y/MessageBox.spec.ts`
 *   ("hög-kontrast-läge (prefers-contrast: more, AC #4)").
 * - Appfel-fallbacken: INGEN kontur under `prefers-contrast: more` — se
 *   § UNDANTAG nedan, en dokumenterad avvikelse, inte en lucka.
 *
 * ChunkBanner OCH SectionError konsumerar samma `MessageBox`-primitiv som
 * ovan (`intent="warning"` respektive `intent="error"`) — computed-style-
 * KONTRAKTET är alltså redan bevisat på PRIMITIV-nivå. Denna fil bevisar
 * att kontraktet HÅLLER på ytornas EGNA monteringspunkter (riktiga
 * `data-testid`/roll, riktig trigger-väg), inte bara i primitivens
 * isolerade demo-sektion — kortets AC #2 vill se det per YTA, inte bara
 * per primitiv.
 *
 * § UNDANTAG — Appfel-fallbacken saknar MEDVETET en `prefers-contrast: more`-
 * kontur. Facit (`tasks/sessions/bilagor/s109-meddelandefamiljen-
 * konvergens/facit.json` § yta "appfel-sidan") låser formen till ENDAST
 * inline `style`-attribut — designvillkoret är att sidan ska rendera även
 * med ett dött stylesheet (se `AppErrorFallback.tsx`s eget doc-block).
 * `contrast-more:`-Tailwind-varianten är en CSS-MEDIA-QUERY-KLASS; en
 * komponent som per design bär NOLL CSS-klasser kan strukturellt inte
 * använda den. Detta är samma familjeregel-avsteg som "ingen kontur —
 * skuggan bär kanten" som facit redan uttalar för just denna yta — inte
 * ett fynd att bygga runt.
 *
 * SKÄRMDUMPAR (AC #2s "skärmdumpar per yta bilagda"): tagna manuellt via
 * chrome-devtools MCP mot den lokala dev-servern under `prefers-contrast:
 * more`-emulering för samtliga sex ytor (inkl. de fyra redan
 * computed-style-bevisade) — se PR-beskrivningen för sökvägarna
 * (scratchpad, ej incheckade: att checka in dem hade krävt en ny
 * bild under `tests/visual/__screenshots__`, vilket AC #6 uttryckligen
 * förbjuder för denna skiva).
 */

const CHUNK_BANNER = '[data-testid="app-reload-required-banner"]';
const CHUNK_LADDA_OM = '[data-testid="app-reload-required-reload"]';

/** Går till demoytan och väntar tills React bevisligen har mountat. */
async function oppnaPrimitives(page: Page) {
  await page.goto('/dev/primitives');
  await page.getByRole('heading', { level: 1 }).first().waitFor();
}

/** Skjuter Vites `vite:preloadError` UPPREPAT (samma retry-loop som syskonfilen). */
async function skjutPreloadError(page: Page) {
  await page.waitForFunction(
    () => {
      if (document.querySelector('[data-testid="app-reload-required-reload"]')) {
        return true;
      }
      window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
      return false;
    },
    undefined,
    { timeout: 15_000, polling: 50 },
  );
}

/** Löser en CSS-custom-property till computed färg via en DOM-probe. */
async function resolvedTokenColor(page: Page, tokenNamn: string): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

async function lasKant(handtag: Locator) {
  return handtag.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      vanster: s.borderLeftWidth,
      topp: s.borderTopWidth,
      hoger: s.borderRightWidth,
      toppStil: s.borderTopStyle,
      toppFarg: s.borderTopColor,
    };
  });
}

test.describe('ChunkBanner (intent=warning) — hög-kontrast-läge (AC #2)', () => {
  test('ingen kontur i vila; full kontur i varning-färg under prefers-contrast: more', async ({
    page,
  }) => {
    await oppnaPrimitives(page);
    await skjutPreloadError(page);
    await expect(page.locator(CHUNK_LADDA_OM)).toBeVisible();

    const banner = page.locator(CHUNK_BANNER);
    const vila = await lasKant(banner);
    expect(vila.vanster).toBe('4px');
    expect(vila.topp).toBe('0px');
    expect(vila.hoger).toBe('0px');

    await page.emulateMedia({ contrast: 'more' });
    const kontrast = await lasKant(banner);
    expect(kontrast.topp).toBe('1px');
    expect(kontrast.hoger).toBe('1px');
    expect(kontrast.toppStil).toBe('solid');
    expect(kontrast.toppFarg).toBe(
      await resolvedTokenColor(page, '--mm-messagebox-warning-border'),
    );

    await page.emulateMedia({ contrast: 'no-preference' });
  });
});

test.describe('SectionError (intent=error) — hög-kontrast-läge (AC #2)', () => {
  async function oppnaSektionsfel(page: Page) {
    await page.goto('/dev/sektionsfel');
    await page.getByRole('heading', { level: 1, name: 'Sektionsfel (dev)' }).waitFor();
  }

  test('vanligt fel: ingen kontur i vila; full kontur i fel-färg under prefers-contrast: more', async ({
    page,
  }) => {
    await oppnaSektionsfel(page);
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen kunde inte visas' });
    await expect(alert).toBeVisible();

    const vila = await lasKant(alert);
    expect(vila.vanster).toBe('4px');
    expect(vila.topp).toBe('0px');
    expect(vila.hoger).toBe('0px');

    await page.emulateMedia({ contrast: 'more' });
    const kontrast = await lasKant(alert);
    expect(kontrast.topp).toBe('1px');
    expect(kontrast.hoger).toBe('1px');
    expect(kontrast.toppStil).toBe('solid');
    expect(kontrast.toppFarg).toBe(await resolvedTokenColor(page, '--mm-messagebox-error-border'));

    await page.emulateMedia({ contrast: 'no-preference' });
  });

  test('chunk-fel: samma kontraktkontur (formen är oberoende av vilken knapp som visas)', async ({
    page,
  }) => {
    await oppnaSektionsfel(page);
    await page.getByRole('button', { name: 'Kasta chunk-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen behöver laddas om' });
    await expect(alert).toBeVisible();

    await page.emulateMedia({ contrast: 'more' });
    const kontrast = await lasKant(alert);
    expect(kontrast.topp).toBe('1px');
    expect(kontrast.hoger).toBe('1px');
    expect(kontrast.toppFarg).toBe(await resolvedTokenColor(page, '--mm-messagebox-error-border'));

    await page.emulateMedia({ contrast: 'no-preference' });
  });
});
