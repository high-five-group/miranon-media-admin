import { expect, test } from '../fixtures';

/**
 * ComboBox-mönstret (ComboBox + Input + ListBox i Popover) — test-MALL
 * för Fas 6.
 *
 * Vid konsumtion anpassas: (1) devPagePath → vyn, (2) include-selektorerna,
 * (3) fält-labeln + förslags-namnen, (4) filtrerings-assertionen mot vyns
 * datakälla.
 *
 * Scope-not (avviker från Overlay/MenuTrigger-mallarna): det expanderade
 * tillståndet skannas scopat (sektion + listbox), INTE helsides. React
 * Arias ariaHideOutside sätter aria-hidden på bakgrunden utan inert för
 * den icke-modala listbox-popovern → axe flaggar aria-hidden-focus på
 * bakgrundens fokuserbara element. Tillståndet är onåbart i praktiken
 * (tab-ut stänger popovern och aria-hidden lyfts), så helsides-flaggan är
 * en false positive på RAC-mönstret — det interaktiva skannas i stället.
 */
test.use({ devPagePath: '/dev/patterns' });

test('ComboBox — vilande + expanderad listbox: 0 violations', async ({ page, checkA11y }) => {
  await checkA11y({ include: ['[aria-labelledby="rubrik-combobox"]'] });

  const falt = page.getByRole('combobox', { name: 'Sök person' });
  await falt.fill('An');
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(falt).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option', { name: 'Anna Andersson' })).toBeVisible();
  await checkA11y({ include: ['[aria-labelledby="rubrik-combobox"]', '[role="listbox"]'] });
});
