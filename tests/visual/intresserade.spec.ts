import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Intresserade-vyn (/mer/intresserade) — visual-baslinje (TASK-299.8 AC #4).
 *
 * SPEC-FILEN FINNS, BASLINJEN TAS INTE HÄR — samma regel som
 * `notis-visual.spec.ts`/`chunk-banner-visual.spec.ts` (TASK-285.9) och
 * `CONTRIBUTING.md` § Visuell regression: "Baselines föds i CI, aldrig
 * lokalt" (endast `-linux`-bilder checkas in). Denna fil har därför ingen
 * incheckad `-linux.png` under `tests/visual/__screenshots__/` — den föds
 * via `visual-baselines.yml` (riktad körning, `specfilter=intresserade`)
 * EFTER att den promoverade formen (chevron + `InitialAvatar`, TASK-299.1)
 * landat, en baseline-PR granskad separat.
 *
 * Speglar `personer.spec.ts`/`mer-anmalningar.spec.ts`s form: navigera,
 * bevisa att den nya sidramen och radernas initialcirklar faktiskt
 * renderat, skärmdumpa. `get-leads` bär INGET default-fixturinnehåll i den
 * delade fixturvärlden (`handlers.ts` § "de fyra sviter som äger FAKTISKT
 * innehåll" — `{ intresserade: [] }` är normalläget), så VÄRLDEN
 * överskuggas här precis som `mer-intresserade.acceptance.test.ts`s
 * `mockLeads()`, med samma radform.
 */
type Row = z.infer<typeof IntresseradSchema>;

function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recINTvisual${Math.random().toString(36).slice(2, 10)}`,
    namn: 'Anna Andersson',
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1234567',
    ort: [],
    manuellFlagga: null,
    aiFlagga: null,
    anteckningar: null,
    antalAnmalningar: 0,
    antalDeltaganden: 0,
    erfarenhetsniva: null,
    erfarenhetsbadge: null,
    senasteInteraktion: 'Laddade ner guide',
    senasteInteraktionDatum: '2026-05-01',
    dagarSedanSenaste: 30,
    harAktivAnmalan: null,
    ejGodkandMail: false,
    radSkapad: '2026-05-01T10:00:00.000Z',
    anmalningIds: [],
    deltagandeIds: [],
    antalHamtningar: 2,
    allaHamtningar: ['Gratis guide', 'Webinar'],
    ...overrides,
  };
}

function mockLeads(network: NetworkFixture, rows: Row[]) {
  network.use(http.get(EF('get-leads'), () => json({ intresserade: rows, nextCursor: null })));
}

test('intresserade — sidram + initialcirklar (TASK-299.8) ur mockad lead-lista', async ({
  page,
  network,
}) => {
  mockLeads(network, [
    row({
      namn: 'Anna Andersson',
      email: 'anna@example.se',
      antalHamtningar: 2,
      allaHamtningar: ['Gratis guide', 'Webinar'],
      senasteInteraktion: 'Laddade ner guide',
    }),
    row({
      namn: 'Bo Bengtsson',
      email: 'bo@example.se',
      antalHamtningar: 1,
      allaHamtningar: ['Nyhetsbrev'],
      senasteInteraktion: 'Öppnade välkomstmail',
    }),
  ]);
  await page.goto('/mer/intresserade');

  await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();
  await expect(page.getByText('Anna Andersson')).toBeVisible();
  await expect(page.getByText('Bo Bengtsson')).toBeVisible();

  await expect(page).toHaveScreenshot('intresserade.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782.
 *
 * UPPGRADERAD TILL TOKEN-PROBE (TASK-317, Marcus-beslut 2026-08-24):
 * `IntresseradRow` (`Intresserade.tsx`) bar tidigare INGEN egen
 * `contrast-more:`-klass — raddelaren var en STATISK `border-text-muted/20
 * border-b`, redan synlig i normalläget, så grinden kunde bara bevisa att
 * gränsen förblev renderad (solid, bredd > 0), inte att kontrastläget
 * faktiskt GJORDE något. TASK-317 lade till `contrast-more:border-border-strong`
 * på raden — samma token-kedja (`--mm-border-strong`) dörrlistans/
 * `AnmalningarSida.tsx`s referens prövar. Probeteknik identisk med
 * `anmalningssidan-promoverings-grind.spec.ts`: DOM-löst token jämfört mot
 * den faktiskt renderade kantfärgen, plus axe 0 och pixel-baseline.
 */
test('intresserade — hög-kontrast-läge (prefers-contrast: more)', async ({ page, network }) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  mockLeads(network, [
    row({
      namn: 'Anna Andersson',
      email: 'anna@example.se',
      antalHamtningar: 2,
      allaHamtningar: ['Gratis guide', 'Webinar'],
      senasteInteraktion: 'Laddade ner guide',
    }),
  ]);
  await page.goto('/mer/intresserade');

  await expect(page.getByRole('heading', { level: 1, name: 'Intresserade' })).toBeVisible();
  await expect(page.getByText('Anna Andersson')).toBeVisible();

  const rad = page.getByRole('list').getByRole('listitem').first();
  const kant = await rad.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bredd: s.borderBottomWidth, stil: s.borderBottomStyle, farg: s.borderBottomColor };
  });
  expect(kant.stil).toBe('solid');
  expect(Number.parseFloat(kant.bredd)).toBeGreaterThan(0);

  const strongToken = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--mm-border-strong)';
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  expect(kant.farg).toBe(strongToken);

  const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('intresserade-kontrast.png', { fullPage: true });
});
