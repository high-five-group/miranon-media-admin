import { expect, test } from '../fixtures';

/**
 * Disclosure-mönstret (Disclosure + DisclosureGroup, accordion) —
 * test-MALL för Fas 6.
 *
 * Vid konsumtion anpassas: (1) devPagePath → vyn, (2) include-selektorn,
 * (3) trigger-namnen. Skann-strukturen (kollapsat → expanderat tillstånd,
 * båda scopade mot sektionen — panelen portalas inte) behålls;
 * aria-expanded-assertionen bevisar state-synk per checklist §6.3.
 */
test.use({ devPagePath: '/dev/patterns' });

test('Disclosure — kollapsat + expanderat tillstånd: 0 violations', async ({ page, checkA11y }) => {
  await checkA11y({ include: ['[aria-labelledby="rubrik-disclosure"]'] });

  const trigger = page.getByRole('button', { name: 'Anmälningar' });
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await checkA11y({ include: ['[aria-labelledby="rubrik-disclosure"]'] });
});
