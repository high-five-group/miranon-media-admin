import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * "Installera appen" — Mer-flikens install-yta (task-126.3; PRD task-126,
 * AC 5: "a11y-sviten grön på hela ytan — ribban är 11, inga undantag").
 *
 * Kör mot `/dev/installera-appen` (dev-guardad demo-route — se routens egen
 * kommentar för varför den finns i stället för att gå via den äkta
 * `/mer/installera-appen`, som ligger bakom `_authenticated`).
 *
 * INGEN `satt()`-navigator-override här (till skillnad från
 * `tests/webblasarbeteende/installera-appen.test.ts`, som bevisar AC 1:s
 * plattforms-DETEKTERING): a11y-fixturens `gotoDevPage` är en AUTO-fixture
 * som navigerar innan testkroppen körs, så ett `page.addInitScript`-anrop i
 * testet hade racat mot en redan skedd navigering. Plattformsdetekteringens
 * KORREKTHET bevisas i webbläsarbeteende-klassen; denna filen bevisar i
 * stället att VARJE innehållsblock — oavsett vilken väg som råkar vara
 * primär vid sidladdning — är fritt från axe-violations. Det är möjligt utan
 * override eftersom ALLA fyra block (iOS, Mac, Chromium-med-knapp,
 * redan-installerad) är nåbara från EN OCH SAMMA Chromium-sida: de två
 * icke-primära vägarna via `<details>`-togglingen (AC 1: "nås men dominerar
 * inte"), Chromium-knappen via en dispatchad `beforeinstallprompt`, och
 * redan-installerad genom att faktiskt fullfölja det flödet (klicka
 * knappen, acceptera) — ingen av dem kräver att sidan laddats med en
 * annan `navigator.userAgent`.
 */

test.use({ devPagePath: '/dev/installera-appen' });

/**
 * Skjuter beforeinstallprompt upprepat tills knappen syns (mount-race-robust,
 * samma teknik som InstallPrompt.spec.ts/install-prompt.test.ts). Kollen är
 * NAMN-scopad (`textContent`), inte `document.querySelector('button')` rakt
 * av: dev-servern monterar TanStack Router/Query Devtools-knapparna (lazy,
 * asynkront) på VARJE `/dev/*`-sida, och en obetingad `button`-sökning kan
 * träffa dem i stället för vår egen — precis vad som hände första gången
 * (a11y-fixturens extra väntan på `<h1>` innan testkroppen kör ger
 * devtools-knapparna tid att hinna montera före dispatchen).
 */
async function skjutBeforeInstallPrompt(page: Page, utfall: 'accepted' | 'dismissed') {
  await page.waitForFunction(
    (utfallArg) => {
      const knappFinns = Array.from(document.querySelectorAll('button')).some((b) =>
        b.textContent?.includes('Installera appen'),
      );
      if (knappFinns) return true;
      const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
      };
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: utfallArg, platform: 'web' });
      window.dispatchEvent(event);
      return false;
    },
    utfall,
    { timeout: 15_000, polling: 50 },
  );
}

test.describe('Installera appen — axe 0 violations per innehållsblock (AC 5)', () => {
  test('default (chromium-prompt, ingen händelse fångad ännu — fallback-guidningen)', async ({
    page,
    checkA11y,
  }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Installera appen' })).toBeVisible();
    await expect(page.getByText('Leta efter en installationsikon')).toBeVisible();
    await checkA11y();
  });

  test('chromium-prompt MED fångad händelse (installationsknappen synlig)', async ({
    page,
    checkA11y,
  }) => {
    await skjutBeforeInstallPrompt(page, 'dismissed');
    await expect(page.getByRole('button', { name: 'Installera appen' })).toBeVisible();
    await checkA11y();
  });

  test('iOS/iPadOS-instruktionen öppnad via details (sekundär väg, AC 1)', async ({
    page,
    checkA11y,
  }) => {
    await page.locator('summary', { hasText: 'Har du en iPhone eller iPad?' }).click();
    await expect(page.getByText('Öppna Safari.')).toBeVisible();
    await checkA11y();
  });

  test('Mac-instruktionen öppnad via details (sekundär väg, AC 1)', async ({ page, checkA11y }) => {
    await page.locator('summary', { hasText: 'Har du en Mac?' }).click();
    await expect(page.getByText('Öppna menyn "Arkiv".')).toBeVisible();
    await checkA11y();
  });

  test('redan-installerad-bekräftelsen (nådd via fullföljt installations-flöde, AC 4)', async ({
    page,
    checkA11y,
  }) => {
    await skjutBeforeInstallPrompt(page, 'accepted');
    await page.getByRole('button', { name: 'Installera appen' }).click();
    await expect(page.getByText('Appen är redan installerad')).toBeVisible();
    // AC 4: ingen instruktion kvar när appen redan är installerad.
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(0);
    await checkA11y();
  });
});
