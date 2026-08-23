import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Dokument-ytan (/mer/dokument) — visual-baslinje (TASK-299.11 AC #2). Ytan
 * bär SEDAN TIDIGARE ett facit-stämplat konvergenspass
 * (`tasks/sessions/bilagor/s102-dokument-konvergens/facit.json`, fem
 * PNG-referenser + ariaSnapshot) — denna fil är den FÖRSTA
 * `toHaveScreenshot`-baserade visuella baslinjen för ytan i den delade
 * visual-regressions-sviten, född EFTER att husets delade `SidRam`-sidkrom
 * promoverades hit (dev-växeln `?sidram=ny`, TASK-299.1, riven ADR-103
 * B2 steg 4).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — samma regel som
 * `intresserade.spec.ts`/`vantelista.spec.ts` (TASK-299.7/299.8) och
 * `CONTRIBUTING.md` § Visuell regression: baslinjer föds i CI
 * (`visual-baselines.yml`), aldrig lokalt av en agent.
 *
 * RÄCKVIDDSLÄGET (inget event valt, `GemensamtLage`) väljs som referens —
 * samma läge `dokument-rackviddsval.acceptance.test.ts`s `gotoRackviddslage`
 * använder — eftersom det är läget som renderas UTAN en föregående
 * eventväljning och därmed är stabilast att skärmdumpa.
 */
test('dokument-ytan — sidram och räckviddsläget (Delade dokument) ur fixturvärlden', async ({
  page,
  network,
}) => {
  network.use(
    http.get(EF('get-event-attachments'), () =>
      json({
        attachments: [
          {
            id: 'recBilagaVisual001',
            namn: 'Hörlursinformation.pdf',
            storlekBytes: 51_200,
            skapad: '2026-08-05T09:00:00.000Z',
            eventId: VISUAL_EVENT_ID,
            dokumentklass: 'Uppladdad',
            rackvidd: 'Kurstyp',
            kursfamilj: 'RIM',
            kursniva: null,
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/dokument');

  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Dokument' })).toBeVisible();
  await expect(page.getByText('Hörlursinformation.pdf')).toBeVisible();

  await expect(page).toHaveScreenshot('dokument-yta.png', { fullPage: true });
});
