import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * Väntelistan — visuell baslinje (TASK-299.7, AC #4).
 *
 * FÖDS HÄR FÖR FÖRSTA GÅNGEN: sidan hade en acceptance-skarv
 * (`tests/acceptance/mer-vantelista.acceptance.test.ts`) men ingen visuell
 * referens innan denna skiva. Baslinjebilderna föds ur CI (`task-36.7`,
 * `visual-baselines.yml`), inte lokalt av en agent — se `personer.spec.ts`/
 * `mer-anmalningar.spec.ts` för samma mönster (enkel sidnamn-spec, ingen
 * `-promoverings-grind`-svit — väntelistan har inget facit-stämplat
 * divergenspass att regressionslåsa mot, den är en direkt sidkrom-promovering).
 *
 * Normalläget (`handlers.ts`) returnerar en TOM väntelista — sviten
 * överskuggar med tre riktiga rader (`network.use()`, `hermetic.ts` §
 * "Överskugga en delad handler") så sidkromet, initialcirkeln och den
 * riktiga radgeometrin syns i bilden, inte tomlägets enda textrad.
 */
test('väntelista — sidram, initialcirkel och tre rader ur fixturvärlden', async ({
  page,
  network,
}) => {
  network.use(
    http.get(EF('get-waitlist'), () =>
      json({
        waitlist: [
          {
            id: 'recVisualWait001',
            fornamn: 'Anna',
            efternamn: 'Andersson',
            email: 'anna@example.se',
            telefon: '070-1234567',
            informationsmail1Skickad: '2026-05-01T06:37:58.949Z',
            createdTime: '2026-05-03T10:00:00.000Z',
          },
          {
            id: 'recVisualWait002',
            fornamn: 'Bo',
            efternamn: 'Bengtsson',
            email: 'bo@example.se',
            telefon: null,
            informationsmail1Skickad: null,
            createdTime: '2026-05-02T09:00:00.000Z',
          },
          {
            id: 'recVisualWait003',
            fornamn: 'Cecilia',
            efternamn: 'Carlsson',
            email: 'cecilia@example.se',
            telefon: '070-9876543',
            informationsmail1Skickad: null,
            createdTime: '2026-05-01T08:00:00.000Z',
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/vantelista');

  await expect(page.getByTestId('vantelista-yta')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'Väntelista' })).toBeVisible();
  await expect(page.getByText('Anna Andersson')).toBeVisible();
  await expect(page.getByText('Cecilia Carlsson')).toBeVisible();

  await expect(page).toHaveScreenshot('vantelista.png', { fullPage: true });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782, men
 * väntelistans rader (`WaitlistRow`, `Waitlist.tsx`) bär INGEN egen
 * `contrast-more:`-klass — verifierat (`grep -rn "contrast-more"
 * src/components/waitlist/`, noll träffar). Raddelaren är i stället en
 * STATISK `border-text-muted/20 border-b`, redan synlig i normalläget. Grinden
 * bevisar därför att den befintliga gränsen förblir renderad (icke-transparent,
 * solid, bredd > 0) under förstärkt kontrast i stället för att jämföra mot ett
 * kontrast-specifikt token-byte som inte finns här — plus en fullsides
 * pixel-baseline (samma idiom som filens ordinarie test ovan) och axe 0, så att
 * "tappar sin gräns eller sin betydelse" (299.10 steg 10) är mekaniskt prövat
 * i båda leden.
 */
test('väntelista — hög-kontrast-läge (prefers-contrast: more)', async ({ page, network }) => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  await page.emulateMedia({ contrast: 'more' });
  network.use(
    http.get(EF('get-waitlist'), () =>
      json({
        waitlist: [
          {
            id: 'recKontrastWait001',
            fornamn: 'Anna',
            efternamn: 'Andersson',
            email: 'anna@example.se',
            telefon: '070-1234567',
            informationsmail1Skickad: null,
            createdTime: '2026-05-03T10:00:00.000Z',
          },
        ],
      }),
    ),
  );

  await page.goto('/mer/vantelista');
  await expect(page.getByTestId('vantelista-yta')).toBeVisible();
  await expect(page.getByText('Anna Andersson')).toBeVisible();

  const rad = page.getByRole('list').getByRole('listitem').first();
  const kant = await rad.evaluate((el) => {
    const s = getComputedStyle(el);
    return { bredd: s.borderBottomWidth, stil: s.borderBottomStyle };
  });
  expect(kant.stil).toBe('solid');
  expect(Number.parseFloat(kant.bredd)).toBeGreaterThan(0);

  const resultat = await new AxeBuilder({ page })
    .withTags(WCAG_TAGGAR)
    .include('[data-testid="vantelista-yta"]')
    .analyze();
  expect(resultat.violations).toEqual([]);

  await expect(page).toHaveScreenshot('vantelista-kontrast.png', { fullPage: true });
});
