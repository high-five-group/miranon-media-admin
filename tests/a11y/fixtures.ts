import AxeBuilder from '@axe-core/playwright';
import { test as base, expect } from '@playwright/test';

/**
 * A11y-fixtures (Fas 3.5, ADR-045).
 *
 * - `devPagePath` (option): vilken DEV-guardad demo-yta testfilen kör mot.
 *   Default /dev/primitives; mönster-specar sätter
 *   `test.use({ devPagePath: '/dev/patterns' })`.
 * - `gotoDevPage` (auto): navigerar varje test till `devPagePath` (ADR-044-
 *   ytorna). Runnern kräver dev-server: webServer-blocket i
 *   playwright.config.ts startar en alltid-färsk server på dedikerad port
 *   när PLAYWRIGHT_TEST_BASE_URL är osatt (ADR-045 beslut 1 + Session 15
 *   K2-fyndens port-härdning).
 * - `checkA11y`: kör AxeBuilder med WCAG 2.2 AA-taggsetet, valfritt scopad
 *   via include/exclude-selektorer. 0 violations är kanonisk fail-regel
 *   (ADR-045 beslut 2) — ingen impact-filtrering; varje violation skrivs
 *   ut läsbart (impact, regel-id, hjälptext, träffade noder).
 */

type CheckA11yOptions = {
  include?: string[];
  exclude?: string[];
};

type A11yFixtures = {
  devPagePath: string;
  gotoDevPage: undefined;
  checkA11y: (options?: CheckA11yOptions) => Promise<void>;
};

export const test = base.extend<A11yFixtures>({
  devPagePath: ['/dev/primitives', { option: true }],
  gotoDevPage: [
    async ({ page, devPagePath }, use) => {
      await page.goto(devPagePath);
      // .first(): sidans EGEN rubrik är alltid FÖRST i DOM-ordning. Sedan
      // TASK-285.3 bär /dev/primitives ytterligare två h1-rubriker längre
      // ner (AppError-fallbackens demo-sektion, facit-formen kräver en
      // riktig rubrik-roll) — ett oscopat getByRole('heading', { level: 1 })
      // blev en strict-mode-krock för VARJE test i denna klass.
      await page.getByRole('heading', { level: 1 }).first().waitFor();
      await use(undefined);
    },
    { auto: true },
  ],
  checkA11y: async ({ page }, use) => {
    await use(async (options) => {
      let builder = new AxeBuilder({ page }).withTags([
        'wcag2a',
        'wcag2aa',
        'wcag21a',
        'wcag21aa',
        'wcag22aa',
      ]);
      for (const selector of options?.include ?? []) {
        builder = builder.include(selector);
      }
      for (const selector of options?.exclude ?? []) {
        builder = builder.exclude(selector);
      }
      const results = await builder.analyze();

      if (results.violations.length > 0) {
        const summary = results.violations
          .map((violation) => {
            const targets = violation.nodes.map((node) => node.target.join(' ')).join('; ');
            return `[${violation.impact ?? 'utan impact'}] ${violation.id}: ${violation.help}\n    noder: ${targets}`;
          })
          .join('\n');
        throw new Error(`${results.violations.length} accessibility violation(s):\n${summary}`);
      }
    });
  },
});

export { expect };
