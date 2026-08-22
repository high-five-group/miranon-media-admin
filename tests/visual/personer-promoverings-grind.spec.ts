import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Personer-listan (`ADR-103` B4).
 *
 * [BÅDA HALVOR GJORDA — 2026-08-10] B4:s `ariaSnapshot`-PAR är komplett.
 * Referenserna under `__aria__/` fångades ur prototyp-formen (`?variant=a`)
 * INNAN villkoret flippades; de är sedan dess ORÖRDA. Efter flippen pekar
 * samma lokatorer och samma `name:`-nycklar mot den promoverade, ovillkorliga
 * ytan (`gotoPromoverad`). En grön körning betyder därför EN sak: trädet är
 * byte-identiskt före och efter promoveringen — formen följde med, ingenting
 * annat smög in.
 *
 * ORDNINGEN VAR ENKELRIKTAD, och det är skälet FÖRE-halvan låstes i en egen
 * commit före flippen: variant-grenen renderades bara under
 * `import.meta.env.DEV && variant === 'a'`. Hade villkoret flippats först
 * hade FÖRE-läget upphört att existera och paret aldrig kunnat konstrueras i
 * efterhand — inte ens genom att läsa gamla PNG:er, eftersom de inte bär
 * roll/namn-strukturen som `ariaSnapshot` jämför.
 *
 * ROLLBYTET ÄR GJORT (2026-08-10). Marcus godkände formen och rivningen
 * (B2 steg 4) tog `PROTO_VARIANTS`, rail-monteringen och `?variant=`-
 * villkoret; prototyp-filen bytte namn till `PersonsList.tsx`. Denna fil
 * bevisar därför inte längre "variant == promoverad" — den är
 * REGRESSIONSLÅS: att ytan fortsätter rendera exakt den låsta formen, för
 * alla framtida ändringar i `PersonsList.tsx`. Samma rollbyte som
 * `eventsida-promoverings-grind.spec.ts` bokför i sitt eget huvud.
 *
 * De sex referenserna under `__aria__/` är ORÖRDA genom både flippen och
 * rivningen — samma facit, ny innebörd. Att de fortfarande är gröna efter att
 * substansen flyttat fil är det mekaniska beviset för att rivningen tog
 * villkor och växlar, ALDRIG form. Hade filflytten ändrat en enda nod i
 * trädet hade grinden fällt.
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
 * `PERSONS_RESPONSE` bär 15 personer i namn-ordning (räknat 2026-08-22 —
 * `recVisualPers00009`/`00017` är separata person-detalj-sentinels, inte del
 * av listans array) och `get-persons`-mocken är
 * en PARAM-MEDVETEN resolver (inte ett fruset objekt), så sök-lägena nedan
 * filtreras på riktigt. `Gunilla Granqvist` finns (samma namn den befintliga
 * `personer.spec.ts` redan asserterar på) och `zzz` ger noll träffar.
 */

/** Sökfältets tillgängliga namn — `aria-label="Sök person"` (PersonsList). */
const SOKFALT = 'Sök person';

/**
 * EFTER-läget: den PROMOVERADE, ovillkorliga ytan.
 *
 * [FAS 2 GJORD — 2026-08-10] `?variant=a` är borta ur adressen eftersom
 * villkoret är flippat (`ADR-103` B2 steg 1): routen renderar formen
 * ovillkorligt. Detta var den ENDA rad som ändrades — referenserna är
 * ORÖRDA sedan FÖRE-capturen, och det är precis därför en grön körning
 * BEVISAR att promoveringen tog formen och ingenting annat.
 */
async function gotoPromoverad(page: import('@playwright/test').Page) {
  await page.goto('/personer');
  // Ankaret finns på alla tre render-grenarna; att vänta på en KÄND person
  // säkrar att vi är i listläget och att fixturvärlden svarat — inte i
  // skeleton-läget som medvetet står utanför referensen.
  await expect(page.getByTestId('personer-yta')).toBeVisible();
  await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot mot den promoverade ytan (ADR-103 B4)', () => {
  test('listläget — default, ingen sökning', async ({ page }) => {
    await gotoPromoverad(page);
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-listlage.aria.yml',
    });
  });

  test('sökning med träff — "Gunilla"', async ({ page }) => {
    await gotoPromoverad(page);
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
    await gotoPromoverad(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-tomlage.aria.yml',
    });
  });
});

/**
 * STALE `?variant=`-URL — degraderar till den enda formen utan krasch och utan
 * halvbyggd yta. Före rivningen villkorade `?variant=a` vilken form routen
 * renderade; en länk som fortfarande bär den gamla queryn (bokmärke, delad
 * URL, öppen flik) träffar nu en app där INGEN fil läser parametern.
 *
 * Samma referens som regressionslåset ovan bevisar det MEKANISKT, inte bara
 * "sidan kraschar inte": en stale URL måste rendera byte för byte samma träd
 * som ingen query alls — inte en tom yta, inte ett kvarvarande
 * prototyp-fragment. Samma AC-form som `eventsida-promoverings-grind.spec.ts`
 * § TASK-145.6 AC #4.
 */
test.describe('stale ?variant=-URL degraderar till den enda formen', () => {
  test('?variant=a renderar identiskt med ingen query alls', async ({ page }) => {
    await page.goto('/personer?variant=a');
    await expect(page.getByTestId('personer-yta')).toBeVisible();
    await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-listlage.aria.yml',
    });
  });

  test('okänd ?variant=z degraderar likaså', async ({ page }) => {
    await page.goto('/personer?variant=z');
    await expect(page.getByTestId('personer-yta')).toBeVisible();
    await expect(page.getByText('Gunilla Granqvist').first()).toBeVisible();
    await expect(page.getByTestId('personer-yta')).toMatchAriaSnapshot({
      name: 'personer-listlage.aria.yml',
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
    await gotoPromoverad(page);
    await axeNoll(page, '[data-testid="personer-yta"]');
  });

  test('sökning med träff: axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('Gunilla');
    await expect(page.getByText('Hassan Haddad')).toHaveCount(0);
    await axeNoll(page, '[data-testid="personer-yta"]');
  });

  test('tomläget: axe 0 violations', async ({ page }) => {
    await gotoPromoverad(page);
    await page.getByRole('searchbox', { name: SOKFALT }).fill('zzz');
    await expect(page.getByText('Inga träffar')).toBeVisible();
    await axeNoll(page, '[data-testid="personer-yta"]');
  });
});
