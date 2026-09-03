import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Intresserade-listan (`ADR-103` B4, TASK-374.1).
 *
 * [FAS 1 — FÖRE-HALVAN, fångad UR VARIANT-LÄGET] Detta är den första halvan
 * av B4:s `ariaSnapshot`-PAR: referenserna fångas ur konvergens-formen
 * (`?variant=a`) INNAN villkoret flippas (`374.2`). Efter flippen pekar
 * SAMMA lokator och SAMMA `name:`-nycklar mot den promoverade, ovillkorliga
 * ytan — skiljer sig trädet på en enda byte fäller grinden, och det är
 * exakt beviset för att promoveringen tog FORMEN och ingenting annat.
 *
 * ORDNINGEN ÄR ENKELRIKTAD, och det är skälet denna fil skrivs FÖRE flippen:
 * variant-grenen renderas bara under `import.meta.env.DEV && variant === 'a'`
 * (`src/routes/_authenticated/mer/intresserade.tsx`). Flippas villkoret
 * först upphör FÖRE-läget att existera, och paret kan aldrig konstrueras i
 * efterhand — inte ens genom att läsa gamla PNG:er, eftersom de inte bär
 * roll/namn-strukturen `ariaSnapshot` jämför. Formen följer
 * `personer-promoverings-grind.spec.ts`s FAS 1-commit (46c03f6c, samma
 * ordning: `?variant=a`, samma `ariaSnapshot`-val, samma axe-block) och
 * `anmalningssidan-promoverings-grind.spec.ts` (den namngivna mallen i
 * TASK-374.1s uppdrag) — inte en egen uppfinning.
 *
 * FAS 2 (samma namn mot den promoverade adressen, `?variant=a` borta ur
 * `gotoVariantA`) skrivs av `374.2`. Den "stale `?variant=`-URL degraderar"-
 * describen som `personer-promoverings-grind.spec.ts`/
 * `anmalningssidan-promoverings-grind.spec.ts` bär hör LIKASÅ till FAS 2 —
 * före flippen finns inget "stale" läge att bevisa (queryn är fortfarande
 * den ENDA vägen in i formen), så den describen står MEDVETET UTANFÖR denna
 * fil (orkestrerarens uppdrag till TASK-374.1, 2026-09-03: "stale-URL-describe
 * LÄMNAS TILL 374.2").
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, och det jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff
 * (BackstopJS-klassen) är den bokförda eskaleringsvägen OM `ariaSnapshot`
 * empiriskt missar en formskillnad — inte default.
 *
 * ── SCOPE: TVÅ LÄGEN (kortets AC #4 — inte tre som personer/anmälningar) ──
 *
 *   1. **Fylld** — minst en NAMNGIVEN och en NAMNLÖS intresserad (kortets
 *      egen ordalydelse), så primär-/sekundärradens BÅDA grenar
 *      (`primarText`/`sekundarText` i `IntresseradeKonvergens.tsx`) täcks av
 *      samma referens: en rad med namn+e-post, en rad med bara e-post och
 *      den dämpade "Namnlös intresserad"-sekundärraden.
 *   2. **Tom** — `get-leads` ger noll rader. Eget formbeslut ("Inga
 *      intresserade än."), egen referens.
 *
 * MEDVETET UTANFÖR (samma skäl som personer/anmälningar-precedenten):
 * laddningsläget (`isPending`, skeleton-raderna) — tidsberoende, hade gjort
 * referensen spröd av skäl som inte rör formen. Ankaret
 * (`data-testid="intresserade-yta"`) sitter ändå på DEN grenen (kortets
 * AC #2), så läget kan låsas senare utan strukturändring — se probe-beviset
 * i skivans Final Summary.
 *
 * ── DATAN ÄR EN LITEN MOCKAD RAD-MÄNGD, INTE `?data=fyll`-GENERATORN ──────
 *
 * Prototypens `?data=fyll` föder 60 syntetiska rader för Marcus VISUELLA
 * formbedömning (facit-bilden) — utmärkt för ett öga, ohanterligt för en
 * `ariaSnapshot`-referens som en människa ska kunna läsa och granska i en
 * PR-diff. Denna fil mockar i stället `get-leads` med `network.use()` (samma
 * mönster som `tests/visual/intresserade.spec.ts` och
 * `tests/acceptance/mer-intresserade.acceptance.test.ts`s `mockLeads`/`row()`)
 * och kör därför den RIKTIGA datavägen (`fetchIntresserade()` →
 * `dataSource`), inte fyllnadsfabrikens minnesdata — `?variant=a` UTAN
 * `&data=fyll` lämnar `fyllnad` falskt (`IntresseradeKonvergens.tsx`s
 * `dataMode === 'fyll'`-villkor), så `useQuery` körs `enabled: true` och
 * träffar den mockade EF:en precis som den skarpa ytan gör efter `374.2`.
 *
 * ── AC #3 — LIVE-REGIONEN HÄVDAS BÅDE HÄR OCH I ACCEPTANCE-KLASSEN ────────
 *
 * [RÄTTAT I RUNDA 2 — review-utlåtande PR #2248, fynd 2] Denna sektion
 * citerade tidigare "Kortets § Källmärkta premisser" som källa för att
 * lägga live-region-assertionen ENBART här. Den sektionen finns inte i
 * något kort (`git grep -n "Källmärkta premisser" origin/main --
 * 'backlog/tasks/*.md'` gav noll träffar) — rubriken stod i
 * ORKESTRERARENS uppdragstext till bygg-agenten (2026-09-03, S114 resume 1),
 * inte i backloggens kort. Ett citat mot en källa som inte finns är exakt
 * den `ADR-086`-felklass repot bekämpar, så den rättas här i stället för
 * att lämnas för `374.2`s implementerare att leta förgäves efter.
 *
 * Den FAKTISKA ändringen runda 2 gjorde: AC #3s ordalydelse ("acceptance-
 * sviten hävdar annonseringen") gjordes SANN i stället för omformulerad.
 * `tests/acceptance/mer-intresserade-konvergens.acceptance.test.ts` (ny fil,
 * CI-blockerande Acceptance-klassen) navigerar till samma `?variant=a` och
 * hävdar EXAKT samma sak som blocket nedan: `aria-live="polite"` +
 * `aria-atomic="true"` på räknaren, och att texten uppdateras vid en
 * sökning. Att `import.meta.env.DEV` är sant där är EMPIRISKT verifierat,
 * inte antaget — samma `webServer`-gren (`isVisualRun || isAcceptanceRun ||
 * …` i `playwright.config.ts`) startar `npm run dev` för BÅDA projekten, och
 * en riktad körning mot `?variant=a` under `PLAYWRIGHT_ACCEPTANCE_DEV_SERVER=1`
 * bekräftade att ankaret och räknaren renderar där precis som i `visual`.
 *
 * Blocket HÄR BEHÅLLS ändå (inte bara flyttat) av två skäl:
 *
 *   1. **Precedent.** `personer-promoverings-grind.spec.ts`s FAS 1-commit
 *      lade SIN a11y-svit i grind-specen, inte enbart i en acceptance-fil —
 *      grind-specen är den yta som ackompanjerar formen genom HELA
 *      promoveringen (se § VAD FILEN INTE GÖR nedan) och förblir ett
 *      körbart bevis lokalt och i `visual-baselines.yml` oavsett vad
 *      acceptance-klassen gör.
 *   2. **Redundans är avsiktlig, inte dubbelarbete.** Acceptance-testet är
 *      den CI-BLOCKERANDE grinden (gör AC #3 sann); detta block är den
 *      snabba, hermetiska ariaSnapshot-granne-kontrollen som redan finns i
 *      samma fil som formen den härrör ifrån. Den `374.2`-skrivna
 *      EFTER-halvan ärver SAMMA assertion mot den promoverade, ovillkorliga
 *      ytan.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FAKTISKT FÄLLER ──────────────────────────────
 *
 * `tests/visual/` körs inte av blockerande CI (samma sak
 * `anmalningssidan-promoverings-grind.spec.ts`/
 * `personer-promoverings-grind.spec.ts` bokför för sina ytor; enda träffen
 * på `npm run test:visual` i `.github/workflows/` är `visual-baselines.yml`,
 * ett `workflow_dispatch`-jobb). Det LEVANDE låset för K0-formen bor i
 * `tests/acceptance/mer-intresserade.acceptance.test.ts` (rörs INTE av denna
 * skiva — skrivs om i `374.2` när formen blir skarp). Denna fil är B4:s
 * bevis-par, och den enda plats där `374.2` kan bevisa att flippen inte rörde
 * formen. UNDANTAGET är AC #3: den claimen har SIN egna CI-blockerande lås i
 * `tests/acceptance/mer-intresserade-konvergens.acceptance.test.ts` (ny fil,
 * runda 2) — se § AC #3 ovan.
 */

/** Formens yttersta element — `IntresseradeKonvergens.tsx` § YTANS_ANKARE. */
const YTA = 'intresserade-yta';

/** Sökfältets tillgängliga namn — `<label><span>Sök intresserad</span>…`. */
const SOKFALT = 'Sök intresserad';

type Row = z.infer<typeof IntresseradSchema>;

/** En komplett Intresserad-rad (IntresseradSchema = PersonSchema.extend +
 * antalHamtningar/allaHamtningar) — samma fält-form som
 * `tests/acceptance/mer-intresserade.acceptance.test.ts`s `row()` och
 * `tests/visual/intresserade.spec.ts`s `row()`. Alla fält närvarande —
 * adaptern `.parse()`:ar mot `z.array(IntresseradSchema)`, så en
 * ofullständig rad ger parse-fel i stället för en tyst tom lista. */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recGRINDINT${Math.random().toString(36).slice(2, 10)}`,
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
    dagarSedanSenaste: 5,
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

/** Två rader — en NAMNGIVEN, en NAMNLÖS (kortets AC #4-ordalydelse). Täcker
 * `primarText`/`sekundarText`s båda grenar i samma referens. */
function fylldaRader(): Row[] {
  return [
    row({
      id: 'recGRINDINTanna',
      namn: 'Anna Andersson',
      fornamn: 'Anna',
      efternamn: 'Andersson',
      email: 'anna@example.se',
      senasteInteraktion: 'Laddade ner guide',
      dagarSedanSenaste: 5,
      antalHamtningar: 2,
      allaHamtningar: ['Gratis guide', 'Webinar'],
    }),
    row({
      id: 'recGRINDINTnamnlos',
      namn: null,
      fornamn: null,
      efternamn: null,
      email: 'bo@example.se',
      senasteInteraktion: 'Hämtade Meditation för nybörjare',
      dagarSedanSenaste: 12,
      antalHamtningar: 1,
      allaHamtningar: ['Meditation för nybörjare'],
    }),
  ];
}

function mockaYtan(network: NetworkFixture, rows: Row[]): void {
  network.use(http.get(EF('get-leads'), () => json({ intresserade: rows, nextCursor: null })));
}

/**
 * FÖRE-läget: konvergens-formen via `?variant=a`.
 *
 * [FAS 2, EFTER FLIPPEN — `374.2`] Denna helper är den ENDA rad som ändras
 * när promoveringen är gjord: `?variant=a` faller bort och samma lokator
 * pekar mot den ovillkorliga ytan. Referenserna nedan rörs ALDRIG — de är
 * facit.
 */
async function gotoVariantA(page: Page): Promise<void> {
  await page.goto('/mer/intresserade?variant=a');
  // Ankaret finns på alla tre render-grenar; att invänta det säkrar att vi
  // är förbi laddningsläget (som medvetet står utanför referensen) OCH att
  // fixturvärlden svarat.
  await expect(page.getByTestId(YTA)).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot ur variant-läget (ADR-103 B4)', () => {
  test('fylld — en namngiven och en namnlös intresserad', async ({ page, network }) => {
    mockaYtan(network, fylldaRader());
    await gotoVariantA(page);

    // Fixtur-förankrad skarv före snapshotten: KÄNDA rader bevisar att datat
    // faktiskt landat via den riktiga hämtningsvägen.
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Namnlös intresserad')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'intresserade-fylld.aria.yml',
    });
  });

  test('tom — inga intresserade', async ({ page, network }) => {
    mockaYtan(network, []);
    await gotoVariantA(page);

    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'intresserade-tom.aria.yml',
    });
  });
});

/**
 * AC #3 — TRÄFFANTALET ÄR EN ARTIG LIVE-REGION.
 *
 * `ariaSnapshot` bär inte `aria-live`/`aria-atomic` i sin yaml-form
 * (verifierat mot samtliga incheckade referenser under `tests/visual/__aria__/`
 * innan denna fils egna föddes: noll `[live]`-annoteringar någonstans i
 * repot), så paret ovan kan inte bevisa att räknaren annonseras — bara att
 * TEXTEN är rätt. Detta block hävdar attributen direkt och att texten
 * faktiskt UPPDATERAS vid en sökning, vilket är den beteendebiten AC #3
 * kräver ("Träffantalet vid sökning annonseras"). Den CI-BLOCKERANDE
 * motsvarigheten (samma två hävdanden, samma `?variant=a`) bor i
 * `tests/acceptance/mer-intresserade-konvergens.acceptance.test.ts` — se
 * filens § AC #3-docblock ovan för varför båda finns.
 */
test.describe('AC #3 — träffantalet annonseras i en artig live-region', () => {
  test('räknaren bär aria-live/aria-atomic och uppdateras vid sökning', async ({
    page,
    network,
  }) => {
    mockaYtan(network, fylldaRader());
    await gotoVariantA(page);

    const raknare = page.getByText('2 intresserade');
    await expect(raknare).toBeVisible();
    await expect(raknare).toHaveAttribute('aria-live', 'polite');
    await expect(raknare).toHaveAttribute('aria-atomic', 'true');
    // Rollen är ORÖRD ("paragraph", inte "status") — se filens docblock i
    // `IntresseradeKonvergens.tsx` § TRÄFFANTALET SOM ARTIG LIVE-REGION för
    // varför (role="status" hade dubbelannonserat OCH ändrat ariaSnapshot).
    await expect(raknare).not.toHaveAttribute('role', 'status');

    await page.getByRole('searchbox', { name: SOKFALT }).fill('Anna');
    const traffRaknare = page.getByText('1 träffar av 2 intresserade');
    await expect(traffRaknare).toBeVisible();
    await expect(page.getByText('Namnlös intresserad')).toHaveCount(0);
    // SAMMA nod (React uppdaterar textnoden in place, monterar inte om
    // elementet) bär fortfarande attributen efter uppdateringen.
    await expect(traffRaknare).toHaveAttribute('aria-live', 'polite');
  });
});

/**
 * A11Y-GOLVET (`ADR-103` B4 + PRD-testbeslutet: promoverade ytor behåller
 * nivå 11; axe-pass ingår i härdningen). Axe körs på EXAKT samma lokator och
 * samma två lägen som `ariaSnapshot`-grinden ovan bevisar formen på, plus
 * felläget (medvetet utanför `ariaSnapshot`-paret, INTE utanför a11y-golvet
 * — samma undantagsform som `anmalningssidan-promoverings-grind.spec.ts`).
 */
test.describe('a11y-golvet — axe på samma ytor som formgrinden (ADR-103, härdningen)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  /** Kör axe scopat till ankaret; violations skrivs ut läsbart vid fällning. */
  async function axeNoll(page: Page): Promise<void> {
    const resultat = await new AxeBuilder({ page })
      .withTags(WCAG_TAGGAR)
      .include(`[data-testid="${YTA}"]`)
      .analyze();
    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`)
        .join('\n'),
    ).toEqual([]);
  }

  test('fylld: axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, fylldaRader());
    await gotoVariantA(page);
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await axeNoll(page);
  });

  test('tom: axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, []);
    await gotoVariantA(page);
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await axeNoll(page);
  });

  test('fel (4xx): axe 0 violations', async ({ page, network }) => {
    network.use(http.get(EF('get-leads'), () => json({ error: 'x' }, 404)));
    await page.goto('/mer/intresserade?variant=a');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Kunde inte hämta intresserade')).toBeVisible();
    await axeNoll(page);
  });
});
