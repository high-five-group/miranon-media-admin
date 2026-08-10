import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Personer-listan (`ADR-103` B4).
 *
 * [FAS 1 — FÖRE-HALVAN, fångad UR VARIANT-LÄGET] Detta är den första halvan
 * av B4:s `ariaSnapshot`-PAR: referenserna fångas ur prototyp-formen
 * (`?variant=a`) INNAN villkoret flippas. Efter flippen pekas SAMMA lokatorer
 * och SAMMA `name:`-nycklar mot den promoverade skarpa ytan — skiljer sig
 * trädet på en enda byte fäller grinden, och det är exakt beviset för att
 * promoveringen tog FORMEN och inte något annat.
 *
 * ORDNINGEN ÄR ENKELRIKTAD, och det är skälet denna fil skrivs före flippen:
 * variant-grenen renderas bara under `import.meta.env.DEV && variant === 'a'`
 * (`src/routes/_authenticated/personer/index.tsx`). Flippas villkoret först
 * upphör FÖRE-läget att existera, och paret kan aldrig konstrueras i
 * efterhand — inte ens genom att läsa gamla PNG:er, eftersom de inte bär
 * roll/namn-strukturen som `ariaSnapshot` jämför.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, och det jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff
 * (BackstopJS-klassen) är den bokförda eskaleringsvägen OM `ariaSnapshot`
 * empiriskt missar en formskillnad — inte default. Samma val, samma skäl som
 * `eventsida-promoverings-grind.spec.ts` (precedenten denna fil följer).
 *
 * SCOPE — TRE LÄGEN, valda mot de faktiska formbesluten i konvergensen:
 *
 *   1. **Listläget** (default, ingen sökning) — bär k03:s tonala kortyta med
 *      `divide-y`-avdelare, k14:s statuskolumn med reserverad plats och k15:s
 *      4 px före interaktionsraden. Det är HÄR merparten av formen sitter.
 *   2. **Sökning med träff** — samma kortform genom det filtrerade urvalet;
 *      bevisar att sökvägen inte renderar en annan rad-form än listläget.
 *   3. **Tomläget** — k11:s EGET steg (`Inga träffar`, inte en grå metarad).
 *      Har ett eget formbeslut och därmed en egen referens.
 *
 * MEDVETET UTANFÖR: laddningsläget (`isPending`, skeleton-raderna). Det är
 * tidsberoende — referensen hade blivit spröd av skäl som inte har med formen
 * att göra, och `ADR-103` B4:s syfte är att fälla FORMSKILLNADER, inte att
 * mäta hur snabbt fixturvärlden svarar. Ankaret (`data-testid="personer-yta"`)
 * sitter ändå på grenen, så läget kan låsas senare utan strukturändring.
 *
 * FIXTURVÄRLDEN, verifierade fakta (`tests/support/fixturvarld/fixture-data.ts`):
 * `PERSONS_RESPONSE` bär 17 personer i namn-ordning och `get-persons`-mocken är
 * en PARAM-MEDVETEN resolver (inte ett fruset objekt), så sök-lägena nedan
 * filtreras på riktigt. `Gunilla Granqvist` finns (samma namn den befintliga
 * `personer.spec.ts` redan asserterar på) och `zzz` ger noll träffar.
 */

/** Sökfältets tillgängliga namn — `aria-label="Sök person"` (PersonsListPrototyp). */
const SOKFALT = 'Sök person';

/**
 * FÖRE-läget: prototyp-formen via `?variant=a`.
 *
 * [FAS 2, EFTER FLIPPEN] Denna helper är den ENDA rad som ändras när
 * promoveringen är gjord: `?variant=a` faller bort och samma lokatorer pekar
 * mot den ovillkorliga ytan. Referenserna nedan rörs ALDRIG — de är facit.
 */
async function gotoVariantA(page: import('@playwright/test').Page) {
  await page.goto('/personer?variant=a');
  // Ankaret finns på alla tre render-grenarna; att vänta på en KÄND person
  // säkrar att vi är i listläget och att fixturvärlden svarat — inte i
  // skeleton-läget som medvetet står utanför referensen.
  await expect(page.getByTestId('personer-yta')).toBeVisible();
  await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot ur variant-läget (ADR-103 B4)', () => {
  test('listläget — default, ingen sökning', async ({ page }) => {
    await gotoVariantA(page);
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-listlage.aria.yml',
    });
  });

  test('sökning med träff — "Gunilla"', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('Gunilla');
    // Sökningen är debouncad (PersonsListPrototyp § useEffect/clearTimeout);
    // att vänta ut det bortfiltrerade namnet är den deterministiska skarven —
    // inte en tidsgräns.
    await expect(page.getByText('Hassan Haddad')).toHaveCount(0);
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-sokning-traff.aria.yml',
    });
  });

  test('tomläget — "zzz" ger noll träffar (k11:s egna form)', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-tomlage.aria.yml',
    });
  });
});

/**
 * A11Y-GOLVET (`ADR-103` B4 + PRD-testbeslutet: *"promoverade ytor behåller
 * nivå 11; axe-pass ingår i härdningen"*). Axe körs på EXAKT samma lokator och
 * samma tre lägen som `ariaSnapshot`-grinden ovan bevisar formen på.
 *
 * Att den står här och inte i en staging-svit har samma skäl som precedenten
 * bokför: staging-projekten kräver riktig inloggning och port 5173, vilket en
 * agent-worktree strukturellt inte kan köra. Denna fil kör i den hermetiska
 * fixturvärlden på `VISUAL_DEV_PORT` (5299) — alltså den faktiska lokala
 * motsvarigheten för en yta `npm run test:a11y` inte når.
 */
test.describe('a11y-golvet — axe på samma ytor som formgrinden (ADR-103, härdningen)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  /** Kör axe scopat till en lokator; violations skrivs ut läsbart vid fällning. */
  async function axeNoll(page: import('@playwright/test').Page, selector: string) {
    const resultat = await new AxeBuilder({ page })
      .withTags(WCAG_TAGGAR)
      .include(selector)
      .analyze();
    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`)
        .join('\n'),
    ).toEqual([]);
  }

  test('listläget: axe 0 violations', async ({ page }) => {
    await gotoVariantA(page);
    await axeNoll(page, '[data-testid="personer-yta"]');
  });

  test('sökning med träff: axe 0 violations', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('Gunilla');
    await expect(page.getByText('Hassan Haddad')).toHaveCount(0);
    await axeNoll(page, '[data-testid="personer-yta"]');
  });

  test('tomläget: axe 0 violations', async ({ page }) => {
    await gotoVariantA(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await axeNoll(page, '[data-testid="personer-yta"]');
  });
});
