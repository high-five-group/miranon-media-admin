import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/test-bas';

/**
 * Fas 6e L2 — Mer-landningen (/mer, statiskt skal). Täcker logout-golvet som
 * 6e-arch-auditen (Session 42) fann saknat (AVVIKELSE iv-1, Väg 1: bygg logout,
 * de-scopa Inställningar).
 *
 * Körs i chromium-authenticated-projektet (`.staging.test.ts` = projektets
 * testMatch-kontrakt, inte staging-exklusivt; jfr mer-vantelista.staging.test.ts).
 *
 * Skalet är STATISKT (ingen data-EF) → ingen page.route-mock för render. Logout
 * mockas på Supabase auth-endpointen (`**\/auth/v1/logout`) så testet är
 * deterministiskt utan riktig session-revoke; signOut({scope:'local'}) rensar
 * ändå klient-sessionen + emitar SIGNED_OUT → AuthProvider nollar user →
 * router.invalidate() (main.tsx) → _authenticated-guarden redirectar till /login.
 *
 * Täckning: logout-affordans finns (knapp m. namn, UTANFÖR nav-landmärket,
 * tangentbords-nåbar), INGEN Inställningar-post (de-scopad), axe 0 på skalet,
 * logout → redirect till /login.
 *
 * task-9.2 utökar sviten mot M6-FACITET (sessionsdok S64 Del 3 + bilagor
 * s64-mer-konvergens): synlig h1 "Mer" (30/600) + shell-headern av,
 * NavCard-rader i TVÅ luftgrupper, computed-verifierade mått (L246/L272:
 * renderad mätning slår pixel-titt och klass-närvaro) och Logga ut som
 * centrerad ghost-knapp med ikon. Befintligt kontrakt ovan BESTÅR orört.
 *
 * RIVNING ÖPPET BOKFÖRD (task-19.2, PRD task-19 beslut 2): Skapa nytt
 * event-raden är RIVEN ur Mer — ingången bor nu på event-listans vy-rad
 * (S73-facit-utökningen K74) och sidans hemvist är /event/skapa
 * (Marcus-kvitterad 2026-07-21). M6-facitets sex rader är därmed FEM;
 * gamla routen /mer/skapa-event omdirigerar (bevisas i
 * skapa-event.staging.test.ts).
 */

test.describe('Mer-landningen (Fas 6e L2 — statiskt skal + logout-golv)', () => {
  test('logout-affordans: knapp "Logga ut" finns UTANFÖR nav-landmärket', async ({ page }) => {
    await page.goto('/mer');

    // Knappen finns med tydligt accessible name.
    const logout = page.getByRole('button', { name: 'Logga ut' });
    await expect(logout).toBeVisible();

    // Logout är en HANDLING, ej navigering → får INTE bo i nav-landmärket.
    const navButtons = page
      .getByRole('navigation', { name: 'Mer-sidor' })
      .getByRole('button', { name: 'Logga ut' });
    await expect(navButtons).toHaveCount(0);
  });

  test('logout-knappen är tangentbords-nåbar (fokus-bar)', async ({ page }) => {
    await page.goto('/mer');
    const logout = page.getByRole('button', { name: 'Logga ut' });
    await logout.focus();
    await expect(logout).toBeFocused();
  });

  test('INGEN Inställningar-post (de-scopad till separat doc-landning)', async ({ page }) => {
    await page.goto('/mer');
    await expect(page.getByText('Inställningar', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /inställning/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /inställning/i })).toHaveCount(0);
  });

  test('axe 0 violations på Mer-skalet (med logout-knappen)', async ({ page }) => {
    await page.goto('/mer');
    await expect(page.getByRole('button', { name: 'Logga ut' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} noder`)).toEqual(
      [],
    );
  });

  test('logout → redirect till /login (guard-kedjan)', async ({ page }) => {
    // Mocka auth-revoke så testet ej beror på riktig Supabase-round-trip.
    await page.route('**/auth/v1/logout**', async (route) => {
      await route.fulfill({ status: 204, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/mer');
    await page.getByRole('button', { name: 'Logga ut' }).click();

    // _authenticated-guarden redirectar till /login efter SIGNED_OUT-invalidering.
    await page.waitForURL(/\/login/);
    await expect(page).toHaveURL(/\/login/);
  });
});

/**
 * task-9.2 — Mer-landningen till M6-facitet (S64 Del 3, konvergens-passet
 * M1→M6). Assertionsmetoden är M6-passets: computed-mått (getComputedStyle/
 * boundingBox), aldrig enbart klass-närvaro (L246) och aldrig pixel-titt
 * (L272 — transformerad dev-modul kan rendera stale). Grupp-ordningen,
 * ikonvalen och måtten är facit-låsta; medvetna FK-avvikelser (radhöjd 58
 * vs ~51, rubrikgap 32 vs ~38, h1 30/600 vs 34/700) ägs av PRD TASK-9
 * beslut 8 — de assertas som appens värden, inte FK:s.
 */
test.describe('Mer-landningen till M6-facitet (task-9.2)', () => {
  test('AC 1: synlig h1 "Mer" i appens h1-skala (30/600) + shell-headern AV', async ({ page }) => {
    await page.goto('/mer');

    // Rubrikpolicyn (PRD beslut 1): synlig h1 = vyns namn, Hem-hälsningens skala.
    const h1 = page.getByRole('heading', { level: 1, name: 'Mer' });
    await expect(h1).toBeVisible();
    const h1Style = await h1.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { fontSize: cs.fontSize, fontWeight: cs.fontWeight };
    });
    expect(h1Style.fontSize).toBe('30px');
    expect(h1Style.fontWeight).toBe('600');

    // Per-vy-avslaget (staticData.hideShellHeader, K10-mönstret task-4.2):
    // Mer är header-fri som Hem — landmarken renderas inte alls.
    await expect(page.locator('header')).toHaveCount(0);
  });

  test('AC 1: fem NavCard-rader i TVÅ grupper med facit-ordning, tysta ikoner, chevron per rad', async ({
    page,
  }) => {
    await page.goto('/mer');
    const nav = page.getByRole('navigation', { name: 'Mer-sidor' });
    await expect(nav).toBeVisible();

    // Tvågruppsstrukturen (samsyn C, Revision S64): exakt TVÅ listor i nav
    // (roll-baserat: ul bär implicit list-rollen).
    const grupper = nav.getByRole('list');
    await expect(grupper).toHaveCount(2);

    // Grupp 1 = listorna, grupp 2 = handling före verktyg — exakt ordning.
    // Skapa nytt event-raden RIVEN (task-19.2 — se rivnings-bokföringen i
    // fil-huvudet); grupp 2 bär numera enbart Bygg segment.
    await expect(grupper.nth(0).getByRole('link')).toHaveText([
      'Anmälningar',
      'Väntelista',
      'Intresserade',
      'Maillogg',
    ]);
    await expect(grupper.nth(1).getByRole('link')).toHaveText(['Bygg segment']);
    await expect(nav.getByRole('link')).toHaveCount(5);

    // Varje rad bär EXAKT två dekorativa svg (radikon + chevron, båda
    // aria-hidden) — etiketten ensam bär länknamnet (redan assertat via
    // toHaveText ovan: namnet är etikettexten, utan ikonbrus).
    for (const link of await nav.getByRole('link').all()) {
      await expect(link.locator('svg[aria-hidden="true"]')).toHaveCount(2);
    }

    // Radikonen i tabbar-paritet: 20×20 renderade px (M5-varvet).
    const ikonBox = await nav.getByRole('link').first().locator('svg').first().boundingBox();
    expect(ikonBox?.width).toBe(20);
    expect(ikonBox?.height).toBe(20);

    // Chevron-koherensen (task-18.3): ingen-chevron-regeln är RIVEN ÖPPET
    // (S73 K25-prövningens Marcus-kvitterade konsekvens, PRD task-18
    // beslut 15) — chevron betyder att raden leder vidare, och Mer-menyns
    // rader bär den för app-koherens med eventsidans åtgärdsrader.
    await expect(nav.locator('svg.lucide-chevron-right')).toHaveCount(5);
  });

  test('Skapa nytt event är RIVEN ur Mer (task-19.2) — ingången bor på event-listan', async ({
    page,
  }) => {
    await page.goto('/mer');
    await expect(page.getByRole('navigation', { name: 'Mer-sidor' })).toBeVisible();

    // Rivningen (PRD task-19 beslut 2): ingen länk, ingen text — ingången
    // nås via event-listans vy-rad (events-list.staging.test.ts bevisar den).
    await expect(page.getByRole('link', { name: 'Skapa nytt event' })).toHaveCount(0);
    await expect(page.getByText('Skapa nytt event')).toHaveCount(0);
  });

  test('AC 2: måtten computed-verifierade mot facitet (DoD 6)', async ({ page }) => {
    await page.goto('/mer');
    await expect(page.getByRole('heading', { level: 1, name: 'Mer' })).toBeVisible();

    const main = page.locator('main#main');
    const section = page.locator('main#main > section');
    const rad = page.getByRole('navigation', { name: 'Mer-sidor' }).getByRole('link').first();

    // Sidmarginalen är SKALETS 16 px (main px-4) — vyn adderar ingen egen
    // sidopadding (dubbelkants-fyndet, M6): sektionens padding = 0 och
    // radkanten ligger exakt 16 px från main-kanten (hela kedjan bevisad).
    const sectionPad = await section.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { left: cs.paddingLeft, right: cs.paddingRight };
    });
    expect(sectionPad.left).toBe('0px');
    expect(sectionPad.right).toBe('0px');
    const mainBox = await main.boundingBox();
    const radBox = await rad.boundingBox();
    if (!mainBox || !radBox) throw new Error('main/rad saknar boundingBox');
    expect(radBox.x - mainBox.x).toBe(16);

    // Radhöjd ca 58 px (M6: py-16×2 + radinnehåll 24 + border 1×2; FK ~51
    // medvetet avviken, PRD beslut 8).
    expect(radBox.height).toBeGreaterThanOrEqual(56);
    expect(radBox.height).toBeLessThanOrEqual(60);

    // 10 px radgap inom grupp; 32 px vertikal rytm (h1→nav→Logga ut-blocket
    // och mellan grupperna).
    const grupp1 = page.getByRole('navigation', { name: 'Mer-sidor' }).getByRole('list').first();
    expect(await grupp1.evaluate((el) => getComputedStyle(el).rowGap)).toBe('10px');
    expect(await section.evaluate((el) => getComputedStyle(el).rowGap)).toBe('32px');
    expect(
      await page
        .getByRole('navigation', { name: 'Mer-sidor' })
        .evaluate((el) => getComputedStyle(el).rowGap),
    ).toBe('32px');

    // Logga ut-blockets EXTRA topp-luft (pt-4 = 16 px utöver rytmens 32).
    const logoutBlock = page.locator('main#main > section > div', {
      has: page.getByRole('button', { name: 'Logga ut' }),
    });
    expect(await logoutBlock.evaluate((el) => getComputedStyle(el).paddingTop)).toBe('16px');

    // Topp-luften i HEM-PARITET (pt-2 lg:pt-10): mät sektionens paddingTop på
    // båda vyerna — desktop (1280, lg) och mobil (390) — och kräv likhet.
    const merPadTopDesktop = await section.evaluate((el) => getComputedStyle(el).paddingTop);
    await page.setViewportSize({ width: 390, height: 844 });
    const merPadTopMobil = await section.evaluate((el) => getComputedStyle(el).paddingTop);
    // Facitets FK-mått togs på 390-skärm: radens absoluta vänsterkant = 16 px.
    const radBoxMobil = await rad.boundingBox();
    expect(radBoxMobil?.x).toBe(16);

    await page.goto('/hem');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const hemSection = page.locator('main#main > section');
    const hemPadTopMobil = await hemSection.evaluate((el) => getComputedStyle(el).paddingTop);
    expect(merPadTopMobil).toBe(hemPadTopMobil);
    await page.setViewportSize({ width: 1280, height: 720 });
    const hemPadTopDesktop = await hemSection.evaluate((el) => getComputedStyle(el).paddingTop);
    expect(merPadTopDesktop).toBe(hemPadTopDesktop);
  });

  test('AC 3: Logga ut är ghost-knapp med ikon + text, CENTRERAD under grupperna', async ({
    page,
  }) => {
    await page.goto('/mer');
    const logout = page.getByRole('button', { name: 'Logga ut' });
    await expect(logout).toBeVisible();

    // Ikonen är dekorativ (aria-hidden) — knappnamnet är texten ensam
    // (namnet assertas av selektorn ovan).
    await expect(logout.locator('svg[aria-hidden="true"]')).toHaveCount(1);

    // Centrerad i innehållskolumnen (facit: flex justify-center).
    const mainBox = await page.locator('main#main').boundingBox();
    const btnBox = await logout.boundingBox();
    if (!mainBox || !btnBox) throw new Error('main/knapp saknar boundingBox');
    const mainCenter = mainBox.x + mainBox.width / 2;
    const btnCenter = btnBox.x + btnBox.width / 2;
    expect(Math.abs(btnCenter - mainCenter)).toBeLessThanOrEqual(1.5);

    // UNDER grupperna: knappen börjar nedanför nav-landmärkets slut.
    const navBox = await page.getByRole('navigation', { name: 'Mer-sidor' }).boundingBox();
    if (!navBox) throw new Error('nav saknar boundingBox');
    expect(btnBox.y).toBeGreaterThan(navBox.y + navBox.height);
  });

  test('AC 5: sidtiteln + route-annonseringen oförändrade vid navigation till Mer', async ({
    page,
  }) => {
    // Bevarande-kontrakt (staticData.title är orörd): navigations-formen
    // eftersom initial load medvetet INTE annonseras (shell-testets DoD 3).
    await page.goto('/hem');
    await page
      .getByRole('navigation', { name: 'Huvudnavigation' })
      .getByRole('link', { name: 'Mer' })
      .click();
    await expect(page.locator('div[aria-live="polite"].sr-only')).toHaveText('Mer');
    await expect(page).toHaveTitle('Mer — Miranon Media Admin');
  });
});
