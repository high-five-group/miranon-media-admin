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
});
