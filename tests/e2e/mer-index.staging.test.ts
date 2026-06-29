import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Fas 6e L2 — Mer-landningen (/mer, statiskt skal). Täcker logout-golvet som
 * 6e-arch-auditen (Session 42) fann saknat (AVVIKELSE iv-1, Väg 1: bygg logout,
 * de-scopa Inställningar).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * Skalet är STATISKT (ingen data-EF) → ingen page.route-mock för render. Logout
 * mockas på Supabase auth-endpointen (`**\/auth/v1/logout`) så testet är
 * deterministiskt utan riktig session-revoke; signOut({scope:'local'}) rensar
 * ändå klient-sessionen + emitar SIGNED_OUT → AuthProvider nollar user →
 * router.invalidate() (main.tsx) → _authenticated-guarden redirectar till /login.
 *
 * Täckning: logout-affordans finns (knapp m. namn, UTANFÖR nav-landmärket,
 * tangentbords-nåbar), INGEN Inställningar-post (de-scopad), axe 0 på skalet,
 * logout → redirect till /login.
 */

test.describe('Mer-landningen (Fas 6e L2 — statiskt skal + logout-golv)', () => {
  test('logout-affordans: knapp "Logga ut" finns UTANFÖR nav-landmärket', async ({ page }) => {
    await page.goto('/mer');

    // Knappen finns med tydligt accessible name.
    const logout = page.getByRole('button', { name: 'Logga ut' });
    await expect(logout).toBeVisible();

    // Logout är en HANDLING, ej navigering → får INTE bo i nav-landmärket.
    const navButtons = page
      .getByRole('navigation', { name: 'Mer-sidor' })
      .getByRole('button', { name: 'Logga ut' });
    await expect(navButtons).toHaveCount(0);
  });

  test('logout-knappen är tangentbords-nåbar (fokus-bar)', async ({ page }) => {
    await page.goto('/mer');
    const logout = page.getByRole('button', { name: 'Logga ut' });
    await logout.focus();
    await expect(logout).toBeFocused();
  });

  test('INGEN Inställningar-post (de-scopad till separat doc-landning)', async ({ page }) => {
    await page.goto('/mer');
    await expect(page.getByText('Inställningar', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /inställning/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /inställning/i })).toHaveCount(0);
  });

  test('axe 0 violations på Mer-skalet (med logout-knappen)', async ({ page }) => {
    await page.goto('/mer');
    await expect(page.getByRole('button', { name: 'Logga ut' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} noder`)).toEqual(
      [],
    );
  });

  test('logout → redirect till /login (guard-kedjan)', async ({ page }) => {
    // Mocka auth-revoke så testet ej beror på riktig Supabase-round-trip.
    await page.route('**/auth/v1/logout**', async (route) => {
      await route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/mer');
    await page.getByRole('button', { name: 'Logga ut' }).click();

    // _authenticated-guarden redirectar till /login efter SIGNED_OUT-invalidering.
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});
