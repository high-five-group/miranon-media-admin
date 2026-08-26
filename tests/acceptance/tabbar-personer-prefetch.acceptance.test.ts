import { delay, http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TabBar — prefetch på avsikt för personregistret (`ADR-078` beslut 3,
 * `ADR-123` beslut 7, TASK-286.2 AC #4).
 *
 * Hover/fokus på Personer-fliken i huvudnavigationen startar
 * `fetchPersonsRegister()` (samma `queryKeys.persons.register`-nyckel som
 * `PersonsList`s egen `useQuery`) INNAN klicket — React Query dedupar, så
 * navigeringen möter en redan varm cache i stället för att starta om.
 *
 * BEVISFORMEN är ett KONTRASTPAR mot en KONSTGJORD, lång fördröjning på
 * registret: utan hover hinner skelettet visas (baslinjen — bevisar att
 * fördröjningen är verklig, inte en tillfällighet); med hover, synkroniserad
 * via `page.waitForResponse` (deterministiskt, ingen godtycklig sömn), ska
 * skelettet ALDRIG synas. Samma "aldrig räkna handler-anrop"-disciplin som
 * `persons-list.acceptance.test.ts` — beviset är vad Lotta SER, inte hur
 * många gånger en mock träffades.
 *
 * Tom fixtur (`{ persons: [] }`) räcker: testet handlar om NÄR datan landar,
 * inte om vilken data det är — "Inga personer ännu" är en lika giltig
 * "laddningen är klar"-signal som en fylld lista.
 */

const SVARSFORDROJNING_MS = 1500;

function tomtRegisterMedFordrojning() {
  return http.get(EF('get-persons'), async () => {
    await delay(SVARSFORDROJNING_MS);
    return json({ persons: [] });
  });
}

test.describe('TabBar — Personer-flikens prefetch på avsikt (ADR-078/ADR-123, TASK-286.2 AC #4)', () => {
  test('baslinje — utan hover hinner skelettet visas innan registret landar', async ({
    page,
    network,
  }) => {
    network.use(tomtRegisterMedFordrojning());

    await page.goto('/hem');
    await page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Personer' })
      .click();

    await expect(page.getByText('Laddar personer…')).toBeVisible();
    await expect(page.getByText('Inga personer ännu')).toBeVisible({
      timeout: SVARSFORDROJNING_MS + 2000,
    });
  });

  test('AC #4 — hover värmer registret; navigeringen visar aldrig skelettet', async ({
    page,
    network,
  }) => {
    network.use(tomtRegisterMedFordrojning());

    await page.goto('/hem');
    const personerLank = page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Personer' });

    // Registrera väntan FÖRE avsikts-signalen (hover) — annars kan svaret
    // hinna landa innan lyssnaren är på plats.
    const prefetchSvar = page.waitForResponse(
      (res) => res.url().includes('/functions/v1/get-persons') && res.status() === 200,
    );
    await personerLank.hover();
    await prefetchSvar;

    await personerLank.click();

    // Skelettet syns ALDRIG — cachen var redan varm när navigeringen skedde.
    await expect(page.getByText('Laddar personer…')).toHaveCount(0);
    await expect(page.getByText('Inga personer ännu')).toBeVisible();
  });
});
