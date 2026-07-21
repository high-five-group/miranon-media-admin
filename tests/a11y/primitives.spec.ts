import { expect, test } from './fixtures';

/**
 * A11y-runner mot samtliga 6 primitiver (Fas 3 DoD 4 + Fas 3.5, ADR-045).
 *
 * Varje demo-sektion på /dev/primitives skannas scopad via sektionens
 * aria-labelledby; Modal/Dialog skannas dessutom i ÖPPNAT tillstånd som
 * helsides-skan, eftersom overlay-DOM:en portalas utanför sektionen.
 * 0 violations per skan (ADR-045 beslut 2).
 */

const BUTTON_INTENTS = ['primary', 'secondary', 'danger', 'ghost'] as const;

test.describe('Primitiver — axe-core 0 violations (ADR-045)', () => {
  test('demo-sidan som helhet — baseline', async ({ checkA11y }) => {
    await checkA11y();
  });

  test('Button — alla fyra intent-sektioner', async ({ checkA11y }) => {
    for (const intent of BUTTON_INTENTS) {
      await checkA11y({ include: [`[aria-labelledby="rubrik-${intent}"]`] });
    }
  });

  test('Input — sektion', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-input"]'] });
  });

  test('Select — sektion', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-select"]'] });
  });

  test('TextArea — sektion', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-textarea"]'] });
  });

  test('MessageBox — sektion', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-messagebox"]'] });
  });

  test('Modal + Dialog — trigger-sektion (stängd)', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-dialog"]'] });
  });

  test('Modal + Dialog — öppnat tillstånd (overlay-DOM skannas)', async ({ page, checkA11y }) => {
    await page.getByRole('button', { name: 'Öppna bekräftelse-dialog' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await checkA11y();
  });

  test('NavCard — sektion', async ({ checkA11y }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-navcard"]'] });
  });

  test('ToggleButtonGroup — sektion (radiogroup-semantiken i alla fyra demo-formerna)', async ({
    checkA11y,
  }) => {
    await checkA11y({ include: ['[aria-labelledby="rubrik-togglebuttongroup"]'] });
  });

  test('SlideToConfirm — sektion (oarmerad huvudinstans + armerad tyst-instans)', async ({
    checkA11y,
  }) => {
    // Båda tillstånden i EN skan: huvudinstansen oarmerad + demo-instansen
    // med defaultSelected armerad. Tillstånds-cyklad skan bor i
    // mönster-specen SlideToConfirm.spec.ts (AC 1, task-19.1).
    await checkA11y({ include: ['[aria-labelledby="rubrik-slidetoconfirm"]'] });
  });

  test('Skeleton — sektion (Roselli-markupen i laddläge)', async ({ page, checkA11y }) => {
    // Sektionen renderar laddläget statiskt (aria-busy-container med
    // aria-hidden-block + sr-only-besked) — skannas i exakt det tillstånd
    // task-8.2 AC 3 kräver 0 violations för.
    await expect(
      page.locator('[aria-labelledby="rubrik-skeleton"] [aria-busy="true"]'),
    ).toBeVisible();
    await checkA11y({ include: ['[aria-labelledby="rubrik-skeleton"]'] });
  });
});
