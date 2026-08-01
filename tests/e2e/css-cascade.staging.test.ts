import { expect, test } from '../support/test-bas';

/**
 * CSS-kaskad-invarianten (task-4.1, byggkrav B-NYTT ur S55 Del 12):
 * globala typografi-defaults (h1–h6-regeln i base.css) ska ligga i
 * `@layer base` så att komponent- och utility-klasser vinner kaskaden.
 * Olagrad author-CSS besegrar ALLA lager — S55 brände tre iterationsvarv
 * ("ingen färgskillnad") på exakt denna fälla innan rotorsaken hittades
 * (lessons L246: visuell egenskap verifieras mot det RENDERADE).
 *
 * Testet asserterar båda sidorna av invarianten RENDERAT (computed-style):
 * 1. En rubrik UTAN färg-utility får basregelns färg (--mm-text) —
 *    @layer-flytten får inte tappa defaulten.
 * 2. En rubrik MED färg-utility (här: text-text-muted, injicerad på
 *    hälsnings-h1:an) renderar utility-färgen — utilities vinner.
 *
 * Injektionen är avsiktlig: invarianten ska hålla OAVSETT om någon vy
 * just nu bär färg-utilities på rubriker (facit-skivorna 4.2–4.4 bygger
 * på den). text-text-muted finns garanterat i CSS-bundeln (används av
 * bl.a. DashboardCard-innehåll). Hälsnings-h1:an renderar oberoende av
 * datafetch → inga route-mockar behövs.
 */

/** Löser en CSS-custom-property till renderad färg via temporärt element. */
const PROBE = (el: Element) => {
  const resolve = (varName: string): string => {
    const tmp = document.createElement('span');
    tmp.style.color = `var(${varName})`;
    document.body.appendChild(tmp);
    const color = getComputedStyle(tmp).color;
    tmp.remove();
    return color;
  };
  const utan = getComputedStyle(el).color;
  el.classList.add('text-text-muted');
  const med = getComputedStyle(el).color;
  el.classList.remove('text-text-muted');
  return {
    baseToken: resolve('--mm-text'),
    mutedToken: resolve('--mm-text-muted'),
    utanUtility: utan,
    medUtility: med,
  };
};

test('rubrik-defaulten ligger i @layer base — färg-utility på rubrik vinner renderat', async ({
  page,
}) => {
  await page.goto('/hem');
  const h1 = page.locator('main h1');
  await expect(h1).toBeVisible();

  const probe = await h1.evaluate(PROBE);

  // Sanity: tokenparet är faktiskt åtskilt (annars bevisar testet inget).
  expect(probe.mutedToken).not.toBe(probe.baseToken);

  // Sida 1: defaulten kvar — rubrik utan utility renderar basfärgen.
  expect(probe.utanUtility).toBe(probe.baseToken);

  // Sida 2: utility vinner — olagrad basregel skulle ge baseToken här.
  expect(probe.medUtility).toBe(probe.mutedToken);
});
