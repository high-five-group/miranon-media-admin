import { expect, test } from './fixtures';

/**
 * A11y-runner mot samtliga primitiver i sektionslistan nedan (Fas 3 DoD 4 +
 * Fas 3.5, ADR-045). Antalet uttrycks MEDVETET räknings-neutralt (TASK-20) —
 * ett hårdkodat tal ('6 primitiver') drev tyst stale när NavCard/Skeleton/
 * ToggleButtonGroup m.fl. tillkom (S75-batchen, task-17.1-fyndet); testerna
 * nedan är den enda källa som behöver hållas i synk.
 *
 * Varje demo-sektion på /dev/primitives skannas scopad via sektionens
 * aria-labelledby; Modal/Dialog skannas dessutom i ÖPPNAT tillstånd som
 * helsides-skan, eftersom overlay-DOM:en portalas utanför sektionen.
 * 0 violations per skan (ADR-045 beslut 2).
 */

// 'success' = grön primär-intent (task-19.3; skapa-sidans "Skapa event" per
// S73-facit K77) — samma intent-yta som övriga, egen demo-sektion.
const BUTTON_INTENTS = ['primary', 'secondary', 'danger', 'ghost', 'success'] as const;

test.describe('Primitiver — axe-core 0 violations (ADR-045)', () => {
  test('demo-sidan som helhet — baseline', async ({ checkA11y }) => {
    await checkA11y();
  });

  test('Button — alla fem intent-sektioner', async ({ checkA11y }) => {
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

  test('SidRam — sektion (smal + bred omfattning, TASK-299.1)', async ({ page, checkA11y }) => {
    // Båda instanserna renderar samtidigt (samma precedent som
    // Forberedelseskarm-sektionen ovan) — den bredare (rubrik-ägande) grenen
    // exerceras ANNARS ingenstans i svitens, se sektionens egen kommentar.
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer (smal sidram)' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Exempelrubrik' })).toBeVisible();
    await checkA11y({ include: ['[aria-labelledby="rubrik-sidram"]'] });
  });

  test('ToggleButtonGroup — sektion (radiogroup-semantiken i alla fem demo-formerna)', async ({
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

  test('InstallPrompt — sektion (default: ingen knapp innan händelsen fångats)', async ({
    checkA11y,
  }) => {
    // AC 2 sedd genom axe: default-instansen renderar `null` innan
    // Chromiums installationshändelse fångats — noll interaktiva element,
    // noll violations att ens ha.
    await checkA11y({ include: ['[aria-labelledby="rubrik-installprompt"]'] });
  });

  test('InstallPrompt — sektion (chromium-prompt fångad: knappen synlig)', async ({
    page,
    checkA11y,
  }) => {
    // Skjuter UPPREPAT (samma robusta mönster som webbläsarbeteende-klassen,
    // `tests/webblasarbeteende/install-prompt.test.ts` — TASK-131/ADR-094;
    // tidigare `tests/acceptance/install-prompt.acceptance.test.ts`) tills
    // knappen syns — ett enda synkront dispatch-anrop kan racea mot Reacts
    // useEffect-mount.
    await page.waitForFunction(
      () => {
        if (document.querySelector('[data-testid="installprompt-default"] button')) return true;
        const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
          prompt: () => Promise<void>;
          userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
        };
        event.prompt = () => Promise.resolve();
        event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
        window.dispatchEvent(event);
        return false;
      },
      undefined,
      { timeout: 15_000, polling: 50 },
    );
    await expect(
      page.locator('[data-testid="installprompt-default"]').getByRole('button'),
    ).toHaveCount(1);
    await checkA11y({ include: ['[aria-labelledby="rubrik-installprompt"]'] });
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

  test('Forberedelseskarm — sektion (tre förloppslägen: 0 %, delvis, full — AC 3, task-218.2)', async ({
    page,
    checkA11y,
  }) => {
    // Alla tre instanser renderar SAMTIDIGT (AC 3) — varje instans har sin
    // egen useId()-genererade progressbar-etikett, så en dubblett-id-
    // kollision (som skulle fälla axe) är strukturellt uteslutet.
    await expect(page.getByRole('progressbar')).toHaveCount(3);
    await checkA11y({ include: ['[aria-labelledby="rubrik-forberedelseskarm"]'] });
  });

  test('AppError — appfel-sidan (TASK-285.3, AC #3): båda formerna, 0 violations', async ({
    page,
    checkA11y,
  }) => {
    // Två instanser i sektionen — inbäddad (utan role="alert", promoverings-
    // grindens EFTER-ankare) och skarp (default-props, role="alert" behållet,
    // exakt vad AppErrorBoundary renderar). Samma precedent som MessageBox-
    // sektionen ovan: /dev/primitives bär redan flera äkta alert-regioner i
    // normalläget (mätt, tests/webblasarbeteende/app-chunk-laddningsfel.test.ts),
    // så ännu en är strukturellt oproblematisk för axe.
    const inbaddad = page.getByTestId('appfel-fallback');
    await expect(inbaddad.getByRole('heading', { level: 1 })).toHaveText('Appen kunde inte visas');
    await expect(page.getByTestId('appfel-fallback-skarp').getByRole('alert')).toBeVisible();
    await checkA11y({ include: ['[aria-labelledby="rubrik-appfel"]'] });
  });
});
