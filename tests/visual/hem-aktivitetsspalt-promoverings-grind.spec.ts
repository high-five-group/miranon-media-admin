import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för hem-spalten "Senaste aktivitet" (`ADR-103` B4,
 * TASK-201.7).
 *
 * ── VAD DEN LÅSER, OCH VAD SOM SKILJER DEN FRÅN SYSKONFILERNA ─────────────
 *
 * `personer-`/`eventsida-`/`atgardssida-promoverings-grind.spec.ts` bär ett
 * PAR: en referens fångad ur variant-läget FÖRE flippen, jämförd mot den
 * promoverade ytan EFTER. Den ordningen går inte att upprepa här, och det är
 * ingen genväg: hem-spalten hade ALDRIG någon variant-gren i skarpa koden.
 * Facit-formen levde i en prototypfil som revs med sin prototyp
 * (`src/components/hem/prototype/K10.tsx`, sist sedd i `bb31a12`), och
 * TASK-201.7 promoverade den DÄRIFRÅN — klasser, element och ordning hämtade
 * verbatim ur `AktivitetK10`. FÖRE-halvan finns alltså bara i git-historiken
 * och i facit-bilden, aldrig som ett körbart läge.
 *
 * Denna fil är därför REGRESSIONSLÅS från dag ett, inte ett par: den fäster
 * spaltens ARIA-träd som det ser ut i den promoverade formen, så varje
 * framtida ändring i `SenasteAktivitet.tsx` som rör struktur eller
 * tillgängliga namn fäller — precis det rollbyte syskonfilerna genomgick
 * EFTER Marcus godkännande, bara utan mellansteget.
 *
 * ── DEN RESPONSIVA GRENEN ÄR SJÄLVA POÄNGEN ──────────────────────────────
 *
 * `playwright.config.ts` § `toMatchAriaSnapshot` behöll `{projectName}` i sitt
 * pathTemplate med motiveringen att "en responsiv gren skulle kunna divergera
 * dem — omätt tills en sådan gren faktiskt finns". Spalten ÄR den grenen: den
 * renderas endast ≥xl (AC #2). Vyporterna sätts därför EXPLICIT i testerna i
 * stället för att ärvas från projektet — annars hade visual-desktop (1440) och
 * visual-mobile (375) mätt olika saker och referenserna varit ojämförbara.
 * Med explicit vyport mäter båda projekten samma två lägen, och referenserna
 * blir identiska par.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FAKTISKT FÄLLER (mätt 2026-08-12) ────────────
 *
 * `tests/visual/` körs INTE av blockerande CI. Sökning över `.github/
 * workflows/` ger EN träff på `npm run test:visual`: `visual-baselines.yml`
 * rad 97, ett `workflow_dispatch`-jobb som kör med `--update-snapshots` och
 * committar enbart `tests/visual/__screenshots__`. Referenserna här skyddar
 * alltså ingenting förrän någon kör sviten. Det LEVANDE låset för samma yta
 * bor i `tests/acceptance/hem-senaste-aktivitet.acceptance.test.ts` — samma
 * ariaSnapshot plus beteende-assertionerna, i ett jobb som faktiskt fäller en
 * PR. Denna fil är precedent-formen och den responsiva mätningen; den är inte
 * ett skydd som kan åberopas.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff är den
 * bokförda eskaleringsvägen OM ariaSnapshot empiriskt missar en formskillnad.
 */

/** Över `xl` (1280) — spalten renderad. Facit-bildens läge. */
const DESKTOP = { width: 1440, height: 900 };
/** Under `xl`, inne i lg↔xl-gapet — ingen spalt (AC #2:s avgjorda gap). */
const UNDER_XL = { width: 1024, height: 768 };

test.describe('promoverings-grinden — hem-spalten "Senaste aktivitet" (ADR-103 B4)', () => {
  test('≥xl — spaltens ARIA-träd i den promoverade formen', async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.goto('/hem');

    const spalt = page.getByTestId('senaste-aktivitet');
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

    const spalt = page.getByTestId('senaste-aktivitet');
    await expect(spalt.getByText('Ingen aktivitet ännu.')).toBeVisible();

    await expect(spalt).toMatchAriaSnapshot({ name: 'hem-aktivitetsspalt-tomlage.aria.yml' });
  });

  test('under xl — ingen spalt, och inget spår av den i tillgänglighetsträdet', async ({
    page,
  }) => {
    await page.setViewportSize(UNDER_XL);
    await page.goto('/hem');

    // Anmälningskortet bevisar att hem faktiskt renderat — annars kunde
    // frånvaron nedan vara "sidan laddade inte" i stället för "spalten är
    // borta", vilket är exakt den falska grönhet en frånvaro-assertion
    // riskerar utan förankring.
    await expect(page.getByRole('region', { name: 'Nya anmälningar att hantera' })).toBeVisible();

    await expect(page.getByTestId('senaste-aktivitet')).toBeHidden();
    await expect(page.getByRole('complementary', { name: 'Senaste aktivitet' })).toHaveCount(0);
  });
});
