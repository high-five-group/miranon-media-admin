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
