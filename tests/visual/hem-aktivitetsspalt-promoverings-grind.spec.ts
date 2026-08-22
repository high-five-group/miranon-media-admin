import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för hem-blocket "Senaste aktivitet" (`ADR-103` B4,
 * TASK-201.7; omriktad mot den FAKTISKA formen i TASK-243.6).
 *
 * ── VAD DEN LÅSER, OCH VAD SOM SKILJER DEN FRÅN SYSKONFILERNA ─────────────
 *
 * `personer-`/`eventsida-`/`atgardssida-promoverings-grind.spec.ts` bär ett
 * PAR: en referens fångad ur variant-läget FÖRE flippen, jämförd mot den
 * promoverade ytan EFTER. Den ordningen går inte att upprepa här, och det är
 * ingen genväg: hem-blocket hade ALDRIG någon variant-gren i skarpa koden.
 * Filen är därför REGRESSIONSLÅS från dag ett, inte ett par.
 *
 * ── VARFÖR FILEN SKREVS OM (TASK-243.6) ──────────────────────────────────
 *
 * Grinden föddes i `d72e9c90` (TASK-201.7) mot K10-facitets form och fästes
 * vid `src/components/hem/SenasteAktivitet.tsx`. `d794669f` (TASK-243.1)
 * RADERADE den filen (203 rader) och ersatte den med
 * `SenasteAktivitetKompakt.tsx` (87 rader) — utan att röra någon fil under
 * `tests/visual/`. Grinden vaktade från den dagen en form som inte längre
 * fanns, och föll på tre oberoende axlar (samtliga disk-mätta 2026-08-22):
 *
 *   1. `getByTestId('senaste-aktivitet')` — attributet finns inte i `src/`.
 *      Frånvaron är INGEN glömska utan ett öppet bokfört designbeslut, se
 *      `tests/acceptance/hem-senaste-aktivitet.acceptance.test.ts` § AVSTEG.
 *      Landmärket nås i stället via `aria-labelledby` (sektionens
 *      `role="region"`, namnet ur h2:n) — SAMMA fix TASK-243.3 gjorde för
 *      `tests/e2e/aktivitetslogg-skarv.staging.test.ts` när dess `spalten()`
 *      föll på exakt samma testid (dess Implementation Notes, punkt 3).
 *   2. Ankaret `region "Nya anmälningar att hantera"` — regionens verkliga,
 *      DYNAMISKA namn är "N nya anmälningar att bekräfta" resp. "1 ny anmälan
 *      att bekräfta" (`NyaAnmalningar.tsx` rad 62). Därav regexen nedan.
 *   3. Referenserna bar `complementary "Senaste aktivitet"` (rollen finns inte
 *      i `src/components/hem/` — noll träffar på `complementary`/`<aside>`)
 *      och den OMAPPADE verb-copyn "Roger bekräftade anmälan"; den mappade
 *      formen "bekräftade en anmälan" är skarp sedan TASK-225.3.
 *
 * ── DEN RESPONSIVA GRENEN: MÄTNINGEN KVARSTÅR, UTFALLET ÄR OMVÄNT ────────
 *
 * `playwright.config.ts` § `toMatchAriaSnapshot` behöll `{projectName}` i sitt
 * pathTemplate med motiveringen att "en responsiv gren skulle kunna divergera
 * dem — omätt tills en sådan gren faktiskt finns". Blocket VAR den grenen så
 * länge det renderades `hidden … xl:flex`. Det gör det inte längre: PRD
 * task-243 kräver explicit "alla bredder" (`Hem.tsx` rad 396, "6. SENASTE
 * AKTIVITET — kompakt, alla bredder."), och blocket är inte längre en
 * positionerad sidokolumn utan ett normalt block sist i flödet.
 *
 * Det gamla fallet — "under xl — ingen spalt, och inget spår av den i
 * tillgänglighetsträdet" — beskrev alltså ett RIVET beteende. Det är omskrivet
 * i stället för borttaget, av två skäl: den responsiva mätningen är filens
 * egen poäng och ska inte tappas, och en frånvaro-assertion mot en form som
 * inte finns blir FALSKT GRÖN — `toBeHidden()` och `toHaveCount(0)` passerar
 * båda trivialt mot element som aldrig renderas. Fallet asserterar därför nu
 * NÄRVARO, vilket inte kan bli falskt grönt, och tar ett eget ariaSnapshot vid
 * UNDER_XL. Att de två referenserna blir identiska är resultatet, inte
 * redundans: det ÄR beviset för att formen inte divergerar över brytpunkten.
 *
 * Vyporterna sätts EXPLICIT i testerna i stället för att ärvas från projektet
 * — annars hade visual-desktop (1440) och visual-mobile (375) mätt olika
 * saker och referenserna varit ojämförbara.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FAKTISKT FÄLLER (mätt 2026-08-12) ────────────
 *
 * `tests/visual/` körs INTE av blockerande CI. Sökning över `.github/
 * workflows/` ger EN träff på `npm run test:visual`: `visual-baselines.yml`,
 * ett `workflow_dispatch`-jobb som kör med `--update-snapshots` och committar
 * enbart `tests/visual/__screenshots__`. Referenserna här skyddar alltså
 * ingenting förrän någon kör sviten. Det LEVANDE låset för samma yta bor i
 * `tests/acceptance/hem-senaste-aktivitet.acceptance.test.ts` — samma
 * ariaSnapshot-yta plus beteende-assertionerna, i ett jobb som faktiskt fäller
 * en PR. Denna fil är precedent-formen och den responsiva mätningen; den är
 * inte ett skydd som kan åberopas.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff är den
 * bokförda eskaleringsvägen OM ariaSnapshot empiriskt missar en formskillnad.
 */

/** Facit-bildens läge (`facit-hem-v1-verklig-desktop.png`). */
const DESKTOP = { width: 1440, height: 900 };
/** Inne i lg↔xl-gapet — under K10-formens gamla `xl`-tröskel (1280). */
const UNDER_XL = { width: 1024, height: 768 };

/** Regionens tillgängliga namn — h2:n via `aria-labelledby`. */
const SPALT_NAMN = 'Senaste aktivitet';

/**
 * Systerblocket, som ANKARE: dess h2 bär ett dynamiskt antal ("2 nya
 * anmälningar att bekräfta" / "1 ny anmälan att bekräfta"), så namnet matchas
 * på den stabila svansen i stället för på en räknad literal.
 */
const ANKARE = /att bekräfta$/;

test.describe('promoverings-grinden — hem-blocket "Senaste aktivitet" (ADR-103 B4)', () => {
  test('≥xl — blockets ARIA-träd i den promoverade formen', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/hem');

    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await expect(spalt).toBeVisible();
    // Fixtur-förankrad skarv före snapshotten: en KÄND rad ur fixturvärldens
    // aktivitetslogg bevisar att datat landat — laddläget (skeleton) står
    // medvetet utanför referensen, av samma skäl som personer-grindens
    // isPending-undantag: det är tidsberoende, inte formbärande.
    await expect(spalt.getByText('igår 16:42')).toBeVisible();

    await expect(spalt).toMatchAriaSnapshot({ name: 'hem-aktivitetsspalt.aria.yml' });
  });

  test('≥xl — tomläget bär sin egen form (rad + kvarstående länk)', async ({ page, network }) => {
    network.use(http.get(EF('get-activity-log'), () => json({ statements: [], nextCursor: null })));

    await page.setViewportSize(DESKTOP);
    await page.goto('/hem');

    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await expect(spalt.getByText('Ingen aktivitet ännu.')).toBeVisible();

    await expect(spalt).toMatchAriaSnapshot({ name: 'hem-aktivitetsspalt-tomlage.aria.yml' });
  });

  test('under xl — SAMMA block, samma ARIA-träd (PRD task-243: alla bredder)', async ({ page }) => {
    await page.setViewportSize(UNDER_XL);
    await page.goto('/hem');

    // Systerblocket bevisar att hela hem renderat, inte bara detta block —
    // annars kunde ett grönt utfall nedan vara "en halvrenderad sida råkade
    // bära rätt region".
    await expect(page.getByRole('region', { name: ANKARE })).toBeVisible();

    const spalt = page.getByRole('region', { name: SPALT_NAMN });
    await expect(spalt).toBeVisible();
    await expect(spalt.getByText('igår 16:42')).toBeVisible();

    await expect(spalt).toMatchAriaSnapshot({ name: 'hem-aktivitetsspalt-under-xl.aria.yml' });
  });
});
