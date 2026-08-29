import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Dokument-ytan (/mer/dokument) — visual-baslinje (TASK-299.11 AC #2). Ytan
 * bar SEDAN TIDIGARE ett facit-stämplat konvergenspass
 * (`tasks/sessions/archive/bilagor/s102-dokument-konvergens/facit.json`, fem
 * PNG-referenser + ariaSnapshot — PENSIONERAT och arkivflyttat i
 * TASK-309.29, se `ARKIVERAD.md` i samma katalog) — denna fil är den FÖRSTA
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
test('dokument-ytan — sidram och räckviddsläget (Delade bilagor) ur fixturvärlden', async ({
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
            // [TASK-338.3, ADR-125 § Beslut 1] `Kurstyp` finns inte längre
            // som räckvidd — det ÄR `Gemensam` med en familje-axel satt.
            // Plats-axeln lämnas tom här: baslinjen ska visa den ENKLASTE
            // gemensamma formen, och badgens axelkomposition provas i
            // `dokument-rackviddsval.acceptance.test.ts` + enhetstesterna.
            rackvidd: 'Gemensam',
            kursfamilj: 'RIM',
            kursniva: null,
            plats: null,
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/dokument');

  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Bilagor' })).toBeVisible();
  await expect(page.getByText('Hörlursinformation.pdf')).toBeVisible();

  await expect(page).toHaveScreenshot('dokument-yta.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782.
 * Räckviddsgruppens kort (`data-testid="grupp-kort"`, `DokumentYta.tsx` rad
 * ~1277) bär `contrast-more:border-border-strong` — samma token-kedja
 * (`--mm-border-strong`) dörrlistans referens prövar. Samma probe-teknik:
 * DOM-löst token jämfört mot den faktiskt renderade kantfärgen, plus en
 * fullsides pixel-baseline (samma idiom som filens ordinarie test ovan) och
 * axe 0.
 */
test('dokument-ytan — hög-kontrast-läge (prefers-contrast: more)', async ({ page, network }) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  network.use(
    http.get(EF('get-event-attachments'), () =>
      json({
        attachments: [
          {
            id: 'recBilagaKontrast001',
            namn: 'Hörlursinformation.pdf',
            storlekBytes: 51_200,
            skapad: '2026-08-05T09:00:00.000Z',
            eventId: VISUAL_EVENT_ID,
            dokumentklass: 'Uppladdad',
            // [TASK-338.3, ADR-125 § Beslut 1] `Kurstyp` finns inte längre
            // som räckvidd — det ÄR `Gemensam` med en familje-axel satt.
            // Plats-axeln lämnas tom här: baslinjen ska visa den ENKLASTE
            // gemensamma formen, och badgens axelkomposition provas i
            // `dokument-rackviddsval.acceptance.test.ts` + enhetstesterna.
            rackvidd: 'Gemensam',
            kursfamilj: 'RIM',
            kursniva: null,
            plats: null,
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/dokument');
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByText('Hörlursinformation.pdf')).toBeVisible();

  const kort = page.getByTestId('grupp-kort').first();
  const kant = await kort.evaluate((el) => {
    const s = getComputedStyle(el);
    return { farg: s.borderTopColor, bredd: s.borderTopWidth, stil: s.borderTopStyle };
  });
  expect(kant.stil).toBe('solid');
  expect(kant.bredd).toBe('1px');

  const strongToken = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mm-border-strong)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  expect(kant.farg).toBe(strongToken);

  const resultat = await new AxeBuilder({ page })
    .withTags(WCAG_TAGGAR)
    .include('[data-testid="dokument-yta"]')
    .analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('dokument-yta-kontrast.png', { fullPage: true });
});
