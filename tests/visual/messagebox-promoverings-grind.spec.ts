import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för `MessageBox` (`ADR-103` B4, `TASK-285.2`).
 *
 * [BÅDA HALVOR GJORDA — 2026-08-21] `ariaSnapshot`-PARET är komplett för de
 * fyra intenterna kortets AC #6 pekar ut. Referenserna under `__aria__/`
 * fångades ur prototyp-formen (`MessageBoxPrototyp.tsx` via
 * `/dev/notis-prototyp?variant=1`, ORÖRD av denna skiva) INNAN `MessageBox`
 * promoverades (`gotoProto`, tillfälligt navigationsmål, se git-historik för
 * exakt lydelse); de är sedan dess ORÖRDA. `gotoPromoverad` nedan pekar mot
 * den PROMOVERADE, ovillkorliga primitiven (`src/components/primitives/
 * MessageBox.tsx`) på SAMMA route utan `?variant` — samma lokatorer, samma
 * `name:`-nycklar. En grön körning betyder därför EN sak: trädet är
 * byte-identiskt mellan prototyp-formen och den promoverade primitiven —
 * formen (kontur/vänsterkant/actions-slot/kryss-regel) följde med,
 * ingenting annat smög in.
 *
 * ORDNINGEN ÄR ENKELRIKTAD (samma skäl som samtliga syskonfiler): variant-
 * grenen renderas bara under `import.meta.env.DEV && variantParam === '1'`
 * (`notis-prototyp.tsx`). Flippas `MessageBoxPrototyp`/routen bort i en
 * framtida rivningsskiva (ADR-103 B2 steg 4, väntar på `TASK-285.10`/HITL)
 * upphör FÖRE-läget att existera — referenserna nedan är då historikens enda
 * bevis på att promoveringen tog rätt form, exakt det syskonfilerna redan
 * visar (`personer-`/`eventsida-`/`atgardssida-promoverings-grind.spec.ts`).
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT NAMN (roll, rubrik,
 * brödtext, knapp-namn) — exakt det S109-facitet (`facit.json` § yta
 * "meddelanderutan") beskriver i prosa. Pixel-diff (BackstopJS-klassen) är
 * den bokförda eskaleringsvägen OM `ariaSnapshot` empiriskt missar en
 * formskillnad — inte default.
 *
 * SCOPE — FYRA INTENTER, kortets AC #6-ord ("alla fyra intents"):
 *   1. `notis-formularfel` (error) — `actions`-sloten (knapprad, INGEN
 *      kryss-knapp: familjeregeln, `error` kan aldrig stängas manuellt).
 *   2. `notis-varning` (warning) — varken actions eller kryss: den enklaste
 *      formen, bevisar att INGEN knapp alls är en giltig rendering.
 *   3. `notis-kvitto` (success) — kryss-knappen (`onDismiss`), ingen actions.
 *   4. `notis-info` (info) — samma kryss-form som kvitto, annan intent-färg.
 *
 * MEDVETET UTANFÖR PARET: `notis-sectionerror`-exemplet (routens femte block,
 * `data-testid="notis-sectionerror"`) visar SAMMA STRUKTUR (alert, rubrik,
 * brödtext, en actions-knapp "Försök igen"). FÖRE `TASK-285.8` (copy-svepet)
 * skilde sig COPYN medvetet mellan grenarna: prototypen visade den
 * FÖRESLAGNA framtida texten ("Den här delen kunde inte visas"), skarpt-
 * grenen speglade `SectionError.tsx`s DÅVARANDE copy ("Något gick fel" — ett
 * löfte texten inte kunde hålla i chunk-fallet, se `SectionError.tsx`s eget
 * doc-block). `TASK-285.8` landade den föreslagna texten VERBATIM i
 * `SectionError.tsx` för icke-chunk-läget, så copyn för DETTA läge är nu
 * identisk mellan grenarna — men exemplet ingår ÄNDÅ inte i det formella
 * `ariaSnapshot`-paret: det var aldrig en av de FYRA intenterna kortets
 * AC #6 pekar ut (§ SCOPE ovan), bara en illustrativ femte demo, och
 * `SectionError`s CHUNK-läge (en andra, villkorad rubrik/brödtext/knapp)
 * har ingen motsvarighet i prototypens statiska demo över huvud taget.
 * STRUKTUR-paritet (roll, antal noder, knappens NAMN) är verifierad separat
 * i `tests/a11y/MessageBox.spec.ts` ("actions-sloten … SectionError
 * konsumerar den").
 */

/** EFTER-läget: den PROMOVERADE, ovillkorliga `MessageBox`-formen. */
async function gotoPromoverad(page: import('@playwright/test').Page) {
  await page.goto('/dev/notis-prototyp');
  await expect(page.getByRole('heading', { level: 1, name: 'Meddelanden' })).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot mot MessageBox-formen (ADR-103 B4)', () => {
  test('error — actions-sloten (knapprad), ingen kryss-knapp', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('notis-formularfel')).toMatchAriaSnapshot({
      name: 'notis-formularfel.aria.yml',
    });
  });

  test('warning — varken actions eller kryss', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('notis-varning')).toMatchAriaSnapshot({
      name: 'notis-varning.aria.yml',
    });
  });

  test('success — kryss-knappen (onDismiss), ingen actions', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('notis-kvitto')).toMatchAriaSnapshot({
      name: 'notis-kvitto.aria.yml',
    });
  });

  test('info — kryss-knappen, egen intent-färg', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('notis-info')).toMatchAriaSnapshot({
      name: 'notis-info.aria.yml',
    });
  });
});
