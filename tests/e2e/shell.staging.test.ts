import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/test-bas';

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
    // TASK-236 (218.3-regression): FÖRSTA renderingen på en fräsch, kall
    // chromium-authenticated-kontext går genom hela warmup-gaten
    // (ADR-112/main.tsx InnerApp) — default-timeouten (5000ms) räcker inte
    // längre. Samma mönster som persist-cache.staging.test.ts:s fix.
    await expect(page.getByRole('heading', { name: /^Hej/, level: 1 })).toBeVisible({
      timeout: 12_000,
    });
  });

  test('DoD 1 — skal + tab bar med 4 flikar på /hem', async ({ page }) => {
    // K10-facit (task-4.2 AC #1): Hem är header-FRI — skalet stänger av
    // headern per vy via staticData; övriga vyer behåller den (beviset sist).
    await expect(page.locator('header')).toHaveCount(0);
    await expect(page.locator('main#main')).toHaveCount(1);
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    await expect(nav).toBeVisible();
    for (const label of ['Hem', 'Event', 'Personer', 'Mer']) {
      const link = nav.getByRole('link', { name: label });
      await expect(link).toBeVisible();
      // FK-mönstret (task-1.2 AC #1): varje flik bär ikon + etikett; ikonen
      // är dekorativ (aria-hidden) — etiketten ensam bär länknamnet.
      await expect(link.locator('svg[aria-hidden="true"]')).toHaveCount(1);
    }
    // APP-REGELN (Marcus-beslut S73): ingen sida i appen har shell-header —
    // per-vy-flaggan är riven, regeln är global. Beviset på en icke-Hem-yta:
    await page.goto('/event');
    await expect(page.locator('header')).toHaveCount(0);
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
    // Titeln bär ENBART sidnamnet sedan 2026-08-06 (S96, Marcus-beslut):
    // Chrome sätter själv appnamnet först i det installerade fönstrets
    // namnlist, så vårt eget suffix gav "Miranon Media Admin - Event —
    // Miranon Media Admin". Sidnamnet i sig är WCAG 2.4.2-golv och står kvar.
    await expect(page).toHaveTitle('Event');
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
    // Rubriken villkoras på felläget sedan TASK-285.8 (copy-svepet) — detta
    // är det icke-chunk-fallet ("Kasta sektions-fel"), samma sträng som
    // SectionError.tsx renderar när `kravsOmladdning` är false.
    const alert = page.getByRole('alert').filter({ hasText: 'Den här delen kunde inte visas' });
    await expect(alert).toBeVisible();
    // Skalet intakt i felläget: ingen header (app-regeln S73) och nav kvar.
    await expect(page.locator('header')).toHaveCount(0);
    const nav = page.getByRole('navigation', { name: 'Huvudnavigation' });
    await expect(nav).toBeVisible();
    await page.getByRole('button', { name: 'Försök igen' }).click();
    await expect(page.getByRole('heading', { name: 'Feltrigger (dev)' })).toBeVisible();
    // Navigation från fel-läge fungerar.
    await page.getByRole('button', { name: 'Kasta sektions-fel' }).click();
    await expect(alert).toBeVisible();
    await nav.getByRole('link', { name: 'Hem' }).click();
    // /hem:s h1 är hälsningen. ÅTERBESÖK i sessionen visar bara namnet utan
    // "Hej" (B2, task-4.2) och namn-delen är miljöberoende → assertionen är
    // navigations-beviset (h1 finns), inte hälsningsformen (hem-specen äger den).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('ADR-047 B5 — offline-banner visas och försvinner', async ({ context, page }) => {
    // TASK-285.6: offline-beskedet är den ÖVERLAGRADE `Notis`-primitivens
    // kort (`position: fixed`), inte längre en normal-flow `<p>` i sin
    // region. Regionen (`role=status`) är alltid monterad men SJÄLV
    // nollstor (samma invariant som uppdateringsnotisens region,
    // `app-update-banner.test.ts`s "den tomma live-regionen tar ingen
    // visuell plats") — `position: fixed`-barn bidrar aldrig till en
    // normal-flow förälders utbredning. `toBeVisible()` hör därför hemma på
    // KORTET, inte regionen; regionens egen närvaro/frånvaro av matchande
    // text prövas separat via `toHaveCount`.
    const region = page.getByRole('status').filter({ hasText: 'Du är offline' });
    const kort = page.getByTestId('offline-notis');
    await expect(region).toHaveCount(0);
    await expect(kort).toHaveCount(0);
    await context.setOffline(true);
    await expect(kort).toBeVisible();
    await expect(region).toHaveCount(1);
    await context.setOffline(false);
    await expect(kort).toHaveCount(0);
    await expect(region).toHaveCount(0);
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
