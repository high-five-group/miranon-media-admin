import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Begär-återställning-sidan `/glomt-losenord` (TASK-127.7, ADR-093) —
 * DATALÖSA beteendetester (ADR-094). Kriteriet (ADR-094 Beslut 2): "har
 * testet ett databeteende att bevisa formen av?" — nej för samtliga tester
 * i denna fil. Det tomma-fält-fallet short-circuitar FÖRE nätverket
 * (`src/routes/glomt-losenord.tsx`s handleSubmit) — precis som
 * `valkommen.tsx`s längd-check — så det kräver ingen fixturvärld.
 *
 * De DATABEROENDE tillstånden (lyckat/fel-svar från `/auth/v1/recover`,
 * fail-open-beviset) hör hemma i — och bor i —
 * `tests/acceptance/glomt-losenord.acceptance.test.ts`.
 */
test.describe('/glomt-losenord — klientvalidering (AC #1 förutsättning)', () => {
  test('tomt e-postfält → vänligt felmeddelande, INGET nätverksanrop görs, formuläret kvarstår', async ({
    page,
  }) => {
    const natverksanrop: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/auth/v1/recover')) natverksanrop.push(request.url());
    });

    await page.goto('/glomt-losenord');
    await page.getByRole('button', { name: 'Skicka återställningslänk' }).click();

    const fel = page.getByRole('alert');
    await expect(fel).toContainText('Ange din e-postadress');
    // Formuläret kvarstår — INGEN övergång till bekräftelseläget.
    await expect(page.getByRole('heading', { level: 1, name: 'Glömt lösenord?' })).toBeVisible();
    expect(natverksanrop).toHaveLength(0);
  });

  test('"Tillbaka till inloggningen"-länken pekar mot /login', async ({ page }) => {
    await page.goto('/glomt-losenord');
    const lank = page.getByRole('link', { name: 'Tillbaka till inloggningen' });
    await expect(lank).toBeVisible();
    await expect(lank).toHaveAttribute('href', '/login');
  });

  test('axe 0 violations på formulär-tillståndet', async ({ page }) => {
    await page.goto('/glomt-losenord');
    await expect(page.getByRole('heading', { level: 1, name: 'Glömt lösenord?' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

test.describe('/login — "Glömt lösenord?"-länken (TASK-127.7)', () => {
  test('navigerar till /glomt-losenord i stället för att toggla en lokal notis', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Glömt lösenord?' }).click();
    await expect(page).toHaveURL(/\/glomt-losenord$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Glömt lösenord?' })).toBeVisible();
  });
});
