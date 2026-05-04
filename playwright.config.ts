import { defineConfig } from '@playwright/test';

/**
 * Playwright — visuella regressionstester + API-säkerhetstester.
 *
 * Två projekt:
 *   - api      → tests/api/ (Edge Function deny-path-tester, M2+)
 *   - visual-* → tests/visual/ (skärmdumpar, Fas 3+)
 *
 * API-tester kräver TEST_SUPABASE_URL satt. Saknas den → testerna
 * skippas i runtime (se tests/api/helpers.ts).
 */
export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/visual/__screenshots__/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  use: {
    locale: 'sv-SE',
    timezoneId: 'Europe/Stockholm',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: process.env.TEST_SUPABASE_URL,
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'visual-desktop',
      testDir: './tests/visual',
      use: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'visual-mobile',
      testDir: './tests/visual',
      use: { viewport: { width: 375, height: 812 }, colorScheme: 'light' },
    },
  ],
});
