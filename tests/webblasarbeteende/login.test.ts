import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

/**
 * `/login` (TASK-127.3 skarpa omskrivningen; TASK-127.8 lägger till
 * passkey-knappen) — DATALÖSA beteendetester (ADR-094) för den nytillkomna
 * "Logga in med passkey"-knappens SYNLIGHET.
 *
 * Kriteriet (ADR-094 Beslut 2): knappens synlighet avgörs av
 * `webblasarenStodjerPasskey()` — en synkron klient-check (`window`/
 * `navigator`-läsning), inget nätverksanrop. Sidans EGNA `beforeLoad`
 * (`context.auth.isAuthenticated`) läser också bara lokal storage.
 *
 * VAD SOM INTE TESTAS HÄR: allt som faktiskt loggar in (lösenord ELLER
 * passkey) konsumerar ett nätverkssvar (`POST .../token?grant_type=password`
 * respektive passkey-ceremonins anrop) — det hör hemma i
 * `tests/acceptance/login.acceptance.test.ts`. Login-formulärets
 * FÖRE-127.8-beteende (fältvalidering, felmeddelande-fokus m.m.) hade
 * ALDRIG en egen testfil (verifierat — `git log`/`grep` hittar ingen
 * `tests/**\/*login*` före denna fil); denna fil bygger inte ikapp den
 * skulden, den täcker bara det TASK-127.8 faktiskt lägger till.
 */
const SAKERT_MAL = '/mer/installera-appen';

function taBortWebAuthnStod(page: Page) {
  return page.addInitScript(() => {
    // @ts-expect-error — medvetet ta bort en global för att simulera en
    // webbläsare utan WebAuthn-stöd.
    delete window.PublicKeyCredential;
  });
}

test.describe('/login — "Logga in med passkey"-knappens synlighet (AC #2, #4)', () => {
  test('webbläsaren stödjer WebAuthn (standardläget i Chromium) → knappen syns', async ({
    page,
  }) => {
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await expect(page.getByRole('button', { name: 'Logga in med passkey' })).toBeVisible();
    // "eller"-avdelaren är rent dekorativ (aria-hidden) — den ska INTE
    // exponeras som ett landmärke/separator för skärmläsare.
    await expect(page.getByRole('separator')).toHaveCount(0);
  });

  test('WebAuthn-API:er saknas → knappen visas ALDRIG, lösenordsformuläret opåverkat', async ({
    page,
  }) => {
    await taBortWebAuthnStod(page);
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);

    await expect(page.getByRole('button', { name: 'Logga in med passkey' })).toHaveCount(0);
    // Lösenordet är ALLTID kvar — degraderingen rör bara det extra
    // alternativet (ADR-093 beslut 2).
    await expect(page.getByLabel('E-postadress')).toBeVisible();
    await expect(page.getByLabel('Lösenord')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logga in' })).toBeVisible();
  });

  test('axe 0 violations med passkey-knappen synlig', async ({ page }) => {
    await page.goto(`/login?redirect=${encodeURIComponent(SAKERT_MAL)}`);
    await expect(page.getByRole('button', { name: 'Logga in med passkey' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
