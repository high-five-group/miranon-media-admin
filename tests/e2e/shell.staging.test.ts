import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * App-skalets varaktiga DoD-tester (Fas 5, Session 16 K5) — kodifierar
 * K3/K4-ad-hoc-bevisen. Täcker byggplan §4 Fas 5 DoD 1, 2, 3 (mekanisk
 * del), 6, 8, 9, 10 + offline-bannern (ADR-047 B5).
 *
 * Körs i chromium-authenticated-projektet (suffixet `.staging.test.ts` är
 * projektets testMatch-kontrakt — inte staging-exklusivt). Lokal körning
 * mot egen-startad server (Session 15 K2-disciplin: aldrig default-portens
 * reuseExistingServer):
 *
 *   npm run dev -- --port 5180 --strictPort
 *   PLAYWRIGHT_TEST_BASE_URL=http://localhost:5180 \
 *     npx playwright test --project=chromium-authenticated tests/e2e/shell.staging.test.ts
 *
 * Sektions-fel-testet (DoD 6) kräver dev-läge (/dev-fel är DEV-guardad,
 * ADR-044-mönstret) och auto-skippar mot prod-build.
 */

test.describe('App-skal (Fas 5 DoD)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hem');
    // /hem:s h1 är hälsningen (task-1.3 AC #6) — namn-delen miljöberoende.
    await expect(page.getByRole('heading', { name: /^Hej/, level: 1 })).toBeVisible();
  });

  test('DoD 1 — skal + tab bar med 4 flikar på /hem', async ({ page }) => {
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    await expect(nav).toBeVisible();
    for (const label of ['Hem', 'Event', 'Personer', 'Mer']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('DoD 2 — skip-länk: Tab → synlig → Enter → fokus i #main', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Hoppa till innehåll' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('DoD 1+9 — tab-navigation med aria-current på alla breakpoints', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    for (const { label, path } of [
      { label: 'Event', path: '/event' },
      { label: 'Personer', path: '/personer' },
      { label: 'Mer', path: '/mer' },
      { label: 'Hem', path: '/hem' },
    ]) {
      await nav.getByRole('link', { name: label }).click();
      await page.waitForURL(`**${path}`);
      await expect(nav.locator('a[aria-current="page"]')).toHaveText(label);
    }
    // DoD 9: tab baren användbar på 375/768/1024 — touch-target ≥ 44 px,
    // ingen horisontell scroll.
    for (const width of [375, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      const box = await nav.getByRole('link', { name: 'Hem' }).boundingBox();
      expect(box?.height, `länkhöjd vid ${width}px`).toBeGreaterThanOrEqual(44);
      const hscroll = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hscroll, `h-scroll vid ${width}px`).toBe(false);
    }
  });

  test('DoD 3 (mekanisk del) — announcer-region + document.title vid navigation', async ({
    page,
  }) => {
    const announcer = page.locator('div[aria-live="polite"].sr-only');
    await expect(announcer).toBeEmpty(); // Initial load annonseras INTE.
    await page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Event' })
      .click();
    await expect(announcer).toHaveText('Event');
    await expect(page).toHaveTitle('Event — Miranon Media Admin');
  });

  test('DoD 6 — sektions-fel: fallback i Outlet, skal överlever, Försök igen resettar', async ({
    page,
  }) => {
    await page.goto('/dev-fel');
    // /dev-fel är DEV-guardad (redirect → /hem i prod-build) — auto-skip.
    if (!page.url().includes('/dev-fel')) {
      test.skip(true, 'DEV-guardad feltrigger ej tillgänglig mot prod-build');
    }
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    const alert = page.getByRole('alert').filter({ hasText: 'Något gick fel' });
    await expect(alert).toBeVisible();
    await expect(page.locator('header')).toHaveCount(1);
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    await expect(nav).toBeVisible();
    await page.getByRole('button', { name: 'Försök igen' }).click();
    await expect(page.getByRole('heading', { name: 'Feltrigger (dev)' })).toBeVisible();
    // Navigation från fel-läge fungerar.
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    await expect(alert).toBeVisible();
    await nav.getByRole('link', { name: 'Hem' }).click();
    // /hem:s h1 är hälsningen (task-1.3 AC #6) — namn-delen miljöberoende.
    await expect(page.getByRole('heading', { name: /^Hej/, level: 1 })).toBeVisible();
  });

  test('ADR-047 B5 — offline-banner visas och försvinner', async ({ context, page }) => {
    const banner = page.getByRole('status').filter({ hasText: 'Du är offline' });
    await expect(banner).toHaveCount(0);
    await context.setOffline(true);
    await expect(banner).toBeVisible();
    await context.setOffline(false);
    await expect(banner).toHaveCount(0);
  });

  test('DoD 8 — prefers-reduced-motion: globala regeln klampar durations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const applied = await page.evaluate(() => {
      const link = document.querySelector('nav a');
      if (!link) return null;
      return {
        matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        duration: Number.parseFloat(getComputedStyle(link).transitionDuration),
      };
    });
    expect(applied?.matches).toBe(true);
    // base.css-regeln sätter 0.01ms !important på allt → > 0 men < 1ms.
    // (0 hade betytt att regeln INTE träffade elementet.)
    expect(applied?.duration).toBeGreaterThan(0);
    expect(applied?.duration).toBeLessThan(0.001);
  });

  test('DoD 10 — axe 0 violations på inloggat skal (/hem)', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} noder`)).toEqual(
      [],
    );
  });
});
