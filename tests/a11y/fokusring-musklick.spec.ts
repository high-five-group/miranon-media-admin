import { expect, test } from './fixtures';

/**
 * Fokusring vid musklick på textfält (TASK-134, 2026-08-04).
 *
 * Forskningsgrund: docs/research/focus-ring-auth-musklick-2026-08-03.md —
 * textfält är enligt webbläsarnas EGEN `:focus-visible`-spec-heuristik
 * (CSS Selectors L4 §9.4) en uttalad UNDANTAGSKLASS som ALLTID ska visa
 * ring vid musklick, oavsett modalitet (mätt 9/9 hos granskade
 * branschledare). Bugg: `base.css`s `[data-rac]`-släckare (byggd S73 K85
 * för Select-dropdownens autofokuserade listbox vid mus-öppning) matchade
 * tidigare VARJE React-Aria-ägt element — inklusive textfält — och
 * undertryckte ringen där den enligt spec ska visas. Fixen har två delar:
 * (1) släckaren smalnad till `role="listbox"` (base.css), (2)
 * Input-primitiven bär `.mm-fokusring-vid-fokus` (plain `:focus`, ingen
 * modalitetsberoende) för deterministisk ring — samma val som
 * govuk-frontend/USWDS/Carbon gör i sin källkod.
 *
 * MÄTFÄLLA (T117, bekräftad EMPIRISKT i detta pass, 2026-08-04):
 * headless Chromium rapporterar `getComputedStyle(el).outlineColor` FEL
 * för RAC-ägda textfält efter en mus-klickad fokusering — samma element,
 * samma körning, gav olika (och alltid FEL) RGB-värden mellan körningar
 * (t.ex. rgb(28, 67, 90) och rgb(28, 70, 96)) trots att `--mm-focus-ring`
 * (probat via ett separat span-element, samma teknik som
 * tests/e2e/css-cascade.staging.test.ts) konsekvent löser till det
 * korrekta rgb(27, 73, 101). Riktig Chrome (chrome-devtools MCP, headed,
 * Chrome 150.0.0.0) gav rgb(27, 73, 101) — exakt token-värdet — för SAMMA
 * interaktion. `outlineStyle` ("solid"/"none") var stabilt och KORREKT i
 * båda miljöerna i samma mätning. Testerna nedan asserterar därför ALDRIG
 * på outline-FÄRG — bara på `outlineStyle`, som är miljöoberoende bevisat.
 */

test.describe('Fokusring vid musklick — TASK-134', () => {
  test('Input-primitiven visar ring vid musklick (inte bara tangentbord)', async ({ page }) => {
    await page.goto('/dev/primitives');
    const falt = page
      .locator('[aria-labelledby="rubrik-input"]')
      .getByRole('textbox', { name: 'Namn (md)' });
    await falt.click();

    const outlineStyle = await falt.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('solid');
  });

  test('TextArea-primitiven visar ring vid musklick (sidoeffekt av den smalnade släckaren)', async ({
    page,
  }) => {
    // Inte en explicit del av kortets ARBETE (som namngav Input-primitiven),
    // men en direkt, mätt konsekvens av att släckaren smalnades till
    // role="listbox": TextArea konkurrerar inte längre med släckaren och
    // faller tillbaka på webbläsarens EGNA :focus-visible-heuristik, som
    // redan klassar textareor som skriv-ytor. Se slutrapportens notering om
    // asymmetrin mot Input (TextArea saknar den explicita, deterministiska
    // `.mm-fokusring-vid-fokus`-klassen — determinismen vilar här på
    // webbläsarheuristiken, inte på egen CSS).
    await page.goto('/dev/primitives');
    const falt = page
      .locator('[aria-labelledby="rubrik-textarea"]')
      .getByRole('textbox', { name: 'Meddelande (md)' });
    await falt.click();

    const outlineStyle = await falt.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('solid');
  });

  test('Select-dropdownen REGRESSIONSPRÖVAD: släckaren verkar fortsatt för sitt syfte (S73 K85)', async ({
    page,
  }) => {
    // Öppning via mus ska INTE ge en ring runt listboxen/dess alternativ —
    // exakt den yta släckaren byggdes för att fixa. Om den här assertionen
    // fäller efter en framtida ändring har den smalnade selektorn
    // (`[role="listbox"]...`, base.css) tappat sitt ursprungliga syfte.
    await page.goto('/dev/primitives');
    await page
      .locator('[aria-labelledby="rubrik-select"]')
      .getByRole('button', { name: /Välj status Status$/ })
      .click();

    const listbox = page.getByRole('listbox');
    await listbox.waitFor();
    const listboxOutline = await listbox.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(listboxOutline).toBe('none');

    const focusedOption = page.getByRole('option').first();
    const optionOutline = await focusedOption.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(optionOutline).toBe('none');

    await page.keyboard.press('Escape');
  });

  test('ComboBox-mönstret (/dev/patterns, rå RAC utan Input-primitiven) visar ring vid musklick', async ({
    page,
  }) => {
    // Bevisar att den smalnade släckaren (item 1) själv räcker för RAC-ägda
    // textfält som INTE går via Input-primitiven — inte bara de som
    // explicit bär `.mm-fokusring-vid-fokus`. ComboBox-inputen i
    // /dev/patterns använder rå react-aria-components utan primitiv-klassen.
    await page.goto('/dev/patterns');
    const combo = page.getByRole('combobox', { name: 'Sök person' });
    await combo.click();

    const outlineStyle = await combo.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outlineStyle).toBe('solid');
  });
});
