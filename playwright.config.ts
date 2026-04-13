import { defineConfig } from '@playwright/test';

/**
 * Playwright — visuella regressionstester.
 * Konfiguration portad från DESIGN-SYSTEM-SPEC §6.
 *
 * Baselines skapas per fas-avslut i Fas 3+. I Fas 0 finns bara konfiguration.
 */
export default defineConfig({
  testDir: './tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Tolerans för anti-aliasing
      maxDiffPixelRatio: 0.01,
      // Threshold per pixel (0 = exakt, 1 = allt tillåtet)
      threshold: 0.2,
      // Animationer ska vara klara
      animations: 'disabled',
    },
  },
  use: {
    // Konsekvent rendering
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
    },
  ],
});
