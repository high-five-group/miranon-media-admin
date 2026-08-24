import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { REQUEST_ID_EXTENSION_IRI, XAPI_IRI_BASE } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Aktivitetshistoriken (/mer/aktivitetshistorik) — visual-baslinje
 * (TASK-299.11 AC #1). Ytan bär SEDAN TIDIGARE ett facit-stämplat
 * konvergenspass (`tasks/sessions/bilagor/s106-aktivitetslogg/facit.json`,
 * ariaSnapshot-baserat, ingen pixel-referens) — denna fil är den FÖRSTA
 * pixel-baserade visuella baslinjen för ytan, född EFTER att husets delade
 * `SidRam`-sidkrom promoverades hit (dev-växeln `?sidram=ny`, TASK-299.1,
 * riven ADR-103 B2 steg 4).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — samma regel som
 * `intresserade.spec.ts`/`vantelista.spec.ts` (TASK-299.7/299.8) och
 * `CONTRIBUTING.md` § Visuell regression: baslinjer föds i CI
 * (`visual-baselines.yml`), aldrig lokalt av en agent.
 *
 * Nätverket överskuggas explicit (i stället för den delade fixturvärldens
 * `resolveActivityLogResponse`-default) för en DETERMINISTISK rad: en
 * kalenderdags-oberoende `timestamp` hade gjort baslinjen instabil beroende
 * på vilken dag den föddes.
 */
test('aktivitetshistorik — sidram och en dagsgrupp ur fixturvärlden', async ({ page, network }) => {
  network.use(
    http.get(EF('get-activity-log'), () =>
      json({
        statements: [
          {
            id: '00000000-0000-4000-8000-000000000101',
            actor: {
              objectType: 'Agent',
              name: 'Lotta',
              account: { homePage: XAPI_IRI_BASE, name: '00000000-0000-4000-8000-000000000102' },
            },
            verb: {
              id: `${XAPI_IRI_BASE}/verbs/test-verb`,
              display: { 'sv-SE': 'markerade betalning' },
            },
            object: {
              objectType: 'Activity',
              id: `${XAPI_IRI_BASE}/objects/registrations/rec-visual-1`,
              definition: {
                name: { 'sv-SE': 'Anna Andersson (Fjärrskådning 2)' },
                type: `${XAPI_IRI_BASE}/activity-types/betalning`,
              },
            },
            context: {
              extensions: { [REQUEST_ID_EXTENSION_IRI]: '00000000-0000-4000-8000-000000000103' },
            },
            timestamp: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      }),
    ),
  );

  await page.goto('/mer/aktivitetshistorik');

  await expect(page.getByTestId('aktivitetshistorik-yta')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Aktivitetshistorik' })).toBeVisible();
  await expect(page.getByText('Anna Andersson (Fjärrskådning 2)')).toBeVisible();

  await expect(page).toHaveScreenshot('aktivitetshistorik.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782.
 * Dagsgruppens `<ul>` (`AktivitetsHistorik.tsx` rad ~903) bär
 * `contrast-more:border-border-strong` — samma token-kedja
 * (`--mm-border-strong`) dörrlistans referens prövar. Samma probe-teknik:
 * DOM-löst token jämfört mot den faktiskt renderade kantfärgen, plus en
 * fullsides pixel-baseline (samma idiom som filens ordinarie test ovan) och
 * axe 0.
 */
test('aktivitetshistorik — hög-kontrast-läge (prefers-contrast: more)', async ({
  page,
  network,
}) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  network.use(
    http.get(EF('get-activity-log'), () =>
      json({
        statements: [
          {
            id: '00000000-0000-4000-8000-000000000201',
            actor: {
              objectType: 'Agent',
              name: 'Lotta',
              account: { homePage: XAPI_IRI_BASE, name: '00000000-0000-4000-8000-000000000202' },
            },
            verb: {
              id: `${XAPI_IRI_BASE}/verbs/test-verb`,
              display: { 'sv-SE': 'markerade betalning' },
            },
            object: {
              objectType: 'Activity',
              id: `${XAPI_IRI_BASE}/objects/registrations/rec-kontrast-1`,
              definition: {
                name: { 'sv-SE': 'Anna Andersson (Fjärrskådning 2)' },
                type: `${XAPI_IRI_BASE}/activity-types/betalning`,
              },
            },
            context: {
              extensions: { [REQUEST_ID_EXTENSION_IRI]: '00000000-0000-4000-8000-000000000203' },
            },
            timestamp: new Date().toISOString(),
          },
        ],
        nextCursor: null,
      }),
    ),
  );

  await page.goto('/mer/aktivitetshistorik');
  await expect(page.getByTestId('aktivitetshistorik-yta')).toBeVisible();
  await expect(page.getByText('Anna Andersson (Fjärrskådning 2)')).toBeVisible();

  const grupp = page.locator('ul[aria-label^="Aktiviteter"]').first();
  const kant = await grupp.evaluate((el) => {
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
    .include('[data-testid="aktivitetshistorik-yta"]')
    .analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('aktivitetshistorik-kontrast.png', { fullPage: true });
});
