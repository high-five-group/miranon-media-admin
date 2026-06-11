import { expect, test } from '../fixtures';

/**
 * Listbox-mönstret (ListBox med selektion) — test-MALL för Fas 6.
 *
 * Vid konsumtion anpassas: (1) devPagePath → vyn, (2) include-selektorn,
 * (3) listbox-namnet + option-namnen. Skann-strukturen (vilande →
 * selekterat tillstånd) behålls; listboxen är alltid-renderad så båda
 * skanningarna scopas mot sektionen.
 */
test.use({ devPagePath: '/dev/patterns' });

test('Listbox — vilande + selekterat tillstånd: 0 violations', async ({ page, checkA11y }) => {
  await checkA11y({ include: ['[aria-labelledby="rubrik-listbox"]'] });

  const option = page.getByRole('option', { name: 'Betald' });
  await option.click();
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await checkA11y({ include: ['[aria-labelledby="rubrik-listbox"]'] });
});
