import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för persondetaljen (`ADR-103` B4).
 *
 * [FÖRE-HALVAN LÅST — 2026-08-12] Referenserna under `__aria__/` fångas ur
 * prototyp-formen (`?variant=d`) INNAN villkoret flippas, och är därefter
 * ORÖRDA. Efter flippen pekar samma lokatorer och samma `name:`-nycklar mot
 * den promoverade, ovillkorliga ytan (`gotoPromoverad`). En grön körning
 * betyder därför EN sak: trädet är byte-identiskt före och efter
 * promoveringen — formen följde med, ingenting annat smög in.
 *
 * ORDNINGEN ÄR ENKELRIKTAD, och det är skälet FÖRE-halvan låses i en EGEN
 * commit före flippen: variant-grenen renderas bara under
 * `import.meta.env.DEV && variant === 'd'`. Flippas villkoret först upphör
 * FÖRE-läget att existera och paret kan aldrig konstrueras i efterhand — inte
 * ens genom att läsa bilagans PNG:er, eftersom de inte bär den roll/namn-
 * struktur `ariaSnapshot` jämför. Samma enkelriktning som
 * `personer-promoverings-grind.spec.ts` bokför i sitt huvud.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, och det jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff är
 * den bokförda eskaleringsvägen OM `ariaSnapshot` empiriskt missar en
 * formskillnad — inte default.
 *
 * SCOPE — TVÅ LÄGEN, valda mot var formbesluten faktiskt sitter:
 *
 *   1. **Den RIKA personen** (`recVisualPers00009`) — bär alla sju block med
 *      innehåll: kontaktraderna, "Just nu" med aktiv anmälan, flaggan,
 *      interaktionsströmmen med sina tre posttyper, eventhistoriken,
 *      hämtningarna och motiveringarna. Merparten av D:s form sitter här.
 *   2. **Den TUNNA personen** (`recVisualPers00017`) — tomlägena. Varje
 *      blocks frånvaro-form är ett eget formbeslut ("Inga aktiva
 *      anmälningar.", "Inga motiveringar registrerade." m.fl.) och kan
 *      regressera oberoende av det rika läget. Carry 3:s granskningsmetod i
 *      mekanisk form: en varianta svaghet är osynlig på fel person.
 *
 * MEDVETET UTANFÖR: laddningsläget (`isPending`, skeleton-raderna) — samma
 * skäl som personlistans grind anger, det är tidsberoende och `ADR-103` B4:s
 * syfte är att fälla FORMSKILLNADER. Ankaret sitter ändå på sidramen, så
 * läget kan låsas senare utan strukturändring.
 *
 * FIXTURVÄRLDEN, verifierade fakta
 * (`tests/support/fixturvarld/fixture-data.ts`): `PERSON_DETAIL_RESPONSE` bär
 * exakt två kuraterade ID:n — `VISUAL_PERSON_RIK_ID` (`recVisualPers00009`)
 * och `VISUAL_PERSON_TUNN_ID` (`recVisualPers00017`). `get-person`-mocken är
 * en resolver som slår upp dem; ett ID utanför fixturvärlden ger `undefined`,
 * vilket `hermetic.ts` besvarar med 501 i klartext.
 */

const RIK_ID = 'recVisualPers00009';
const TUNN_ID = 'recVisualPers00017';

/**
 * EFTER-läget: den PROMOVERADE, ovillkorliga ytan.
 *
 * `?variant=d` saknas i adressen med avsikt — efter flippen (`ADR-103` B2
 * steg 1) renderar routen formen ovillkorligt. Denna funktion är den ENDA
 * som ska ändras när flippen sker (queryn faller bort); referenserna förblir
 * orörda, och det är precis därför en grön körning BEVISAR att promoveringen
 * tog formen och ingenting annat.
 */
async function gotoPromoverad(page: import('@playwright/test').Page, id: string) {
  await page.goto(`/personer/${id}`);
  // Ankaret finns på alla render-grenar; att vänta ut det sr-only
  // laddbeskedet säkrar att fixturvärlden svarat och att vi INTE står i
  // skeleton-läget som medvetet ligger utanför referensen.
  await expect(page.getByTestId('persondetalj-yta')).toBeVisible();
  await expect(page.getByText('Laddar persondetaljer…')).toHaveCount(0);
}

test.describe('promoverings-grinden — ariaSnapshot mot persondetaljens form (ADR-103 B4)', () => {
  test('rik person — alla sju block med innehåll', async ({ page }) => {
    await gotoPromoverad(page, RIK_ID);
    await expect(page.getByTestId('persondetalj-yta')).toMatchAriaSnapshot({
      name: 'persondetalj-rik.aria.yml',
    });
  });

  test('tunn person — blockens tomlägen', async ({ page }) => {
    await gotoPromoverad(page, TUNN_ID);
    await expect(page.getByTestId('persondetalj-yta')).toMatchAriaSnapshot({
      name: 'persondetalj-tunn.aria.yml',
    });
  });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782. `Sektion`
 * (`PersonDetail.tsx` § `Sektion`, delad av alla blocken) bär
 * `contrast-more:border-border-strong` — samma token-kedja
 * (`--mm-border-strong`) dörrlistans referens prövar. Flagga-blocket
 * (`id="proto-d-flagga"`) valdes som probe: det finns för den RIKA personen
 * (docblockets scope-punkt 1). Ankaret är `#proto-d-flagga + div` — samma
 * struktur `Sektion` alltid renderar (`<h2 id>` direkt följt av kortets
 * `<div>`), inte en ariaSnapshot: dörrlistans eget kontrast-test bär ingen
 * heller, strukturen ändras inte av emuleringen, bara beräknade stilar.
 */
test.describe('TASK-314 — prefers-contrast: more (299.10 steg 10)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  test('hög-kontrast-läge: Flagga-sektionens kort får synlig kantlinje', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' });
    await gotoPromoverad(page, RIK_ID);

    const kort = page.locator('#proto-d-flagga + div');
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
      .include('[data-testid="persondetalj-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
