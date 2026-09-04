import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import type { z } from 'zod';
import type { IntresseradSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Intresserade-listan (`ADR-103` B4, TASK-374.1/374.2).
 *
 * [BÅDA HALVOR GJORDA — 2026-09-03] B4:s `ariaSnapshot`-PAR är komplett.
 *
 * [FAS 1 — FÖRE-HALVAN, 374.1, fångad UR VARIANT-LÄGET] Referenserna under
 * `__aria__/` fångades ur konvergens-formen (`?variant=a`) INNAN villkoret
 * flippades; de har varit ORÖRDA sedan dess. Formen följde
 * `personer-promoverings-grind.spec.ts`s FAS 1-commit (46c03f6c, samma
 * ordning: `?variant=a`, samma `ariaSnapshot`-val, samma axe-block) och
 * `anmalningssidan-promoverings-grind.spec.ts` (den namngivna mallen i
 * TASK-374.1s uppdrag) — inte en egen uppfinning.
 *
 * [FAS 2 — GJORD, 374.2] Villkoret är flippat (`src/routes/_authenticated/
 * mer/intresserade.tsx`): `Intresserade` (git-mv:ad ur
 * `prototype/IntresseradeKonvergens.tsx`) renderas OVILLKORLIGT. `gotoPromoverad`
 * (tidigare `gotoVariantA`) navigerar nu till `/mer/intresserade` UTAN
 * `?variant=` — SAMMA lokator och SAMMA `name:`-nycklar pekar mot den
 * promoverade ytan, referenserna nedan är HELT ORÖRDA (git status bekräftade
 * att `__aria__/` inte skrevs om under körningen). En grön körning betyder
 * därför EN sak: trädet är byte-identiskt före och efter promoveringen —
 * formen följde med filflytten, ingenting annat smög in.
 *
 * ROLLBYTET: den här filen bevisar inte längre "variant == promoverad" —
 * eftersom promoveringen redan skett i SAMMA gren/PR som denna omskrivning
 * (till skillnad från personer/checkin, där flipp och rivning låg i separata
 * landningar), är FAS 1 och FAS 2 synliga i samma diff. Filen är från och med
 * nu REGRESSIONSLÅS över `src/components/intresserade/Intresserade.tsx`: att
 * ytan fortsätter rendera exakt den låsta formen för alla framtida ändringar.
 * Samma rollbyte som `personer-promoverings-grind.spec.ts`/
 * `eventsida-promoverings-grind.spec.ts` bokför i sina egna huvuden.
 *
 * "STALE `?variant=`-URL DEGRADERAR"-DESCRIBEN (personer-/anmälningssidan-
 * mallen) läggs till i DENNA skiva (374.2) — se describe-blocket längre ned.
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
 *      (`primarText`/`sekundarText` i `Intresserade.tsx`) täcks av
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
 * `&data=fyll` lämnar `fyllnad` falskt (`Intresserade.tsx`s
 * `dataMode === 'fyll'`-villkor), så `useQuery` körs `enabled: true` och
 * träffar den mockade EF:en precis som den promoverade ytan gör (`374.2`).
 *
 * ── AC #3 — LIVE-REGIONEN HÄVDAS BÅDE HÄR OCH I ACCEPTANCE-KLASSEN ────────
 *
 * [OMSKRIVET I 374.2] `tests/acceptance/mer-intresserade-konvergens.
 * acceptance.test.ts` (374.1 runda 2:s nya fil, som navigerade till
 * `?variant=a`) är RIVEN och dess hävdande FLYTTAT IN i den omskrivna
 * `tests/acceptance/mer-intresserade.acceptance.test.ts` (testet "sökning
 * filtrerar och räknaren annonseras…") — nu mot den promoverade adressen
 * utan `?variant=`, eftersom den separata filens enda existensskäl (formen
 * nåddes bara bakom variant-queryn) upphörde när flippen gjordes. Samma två
 * hävdanden som blocket nedan: `aria-live="polite"` + `aria-atomic="true"`
 * på räknaren, och att texten uppdateras vid en sökning.
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
 *      samma fil som formen den härrör ifrån.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FAKTISKT FÄLLER ──────────────────────────────
 *
 * `tests/visual/` körs inte av blockerande CI (samma sak
 * `anmalningssidan-promoverings-grind.spec.ts`/
 * `personer-promoverings-grind.spec.ts` bokför för sina ytor; enda träffen
 * på `npm run test:visual` i `.github/workflows/` är `visual-baselines.yml`,
 * ett `workflow_dispatch`-jobb). Det LEVANDE låset för formen bor i
 * `tests/acceptance/mer-intresserade.acceptance.test.ts` (omskriven i denna
 * skiva). Denna fil är B4:s bevis-par — det mekaniska beviset för att
 * flippen inte rörde formen — och lever vidare som regressionslås.
 */

/** Formens yttersta element — `Intresserade.tsx` § YTANS_ANKARE. */
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
 * EFTER-läget: den PROMOVERADE, ovillkorliga ytan.
 *
 * [FAS 2 GJORD — 374.2] `?variant=a` är borta ur adressen eftersom villkoret
 * är flippat (`ADR-103` B2 steg 1): routen renderar formen ovillkorligt.
 * Detta var den ENDA raden som ändrades i denna helper (tidigare
 * `gotoVariantA`, `await page.goto('/mer/intresserade?variant=a')`) —
 * referenserna nedan är ORÖRDA sedan FÖRE-capturen, och det är precis
 * därför en grön körning BEVISAR att promoveringen tog formen och
 * ingenting annat.
 */
async function gotoPromoverad(page: Page): Promise<void> {
  await page.goto('/mer/intresserade');
  // Ankaret finns på alla tre render-grenar; att invänta det säkrar att vi
  // är förbi laddningsläget (som medvetet står utanför referensen) OCH att
  // fixturvärlden svarat.
  await expect(page.getByTestId(YTA)).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot mot den promoverade ytan (ADR-103 B4)', () => {
  test('fylld — en namngiven och en namnlös intresserad', async ({ page, network }) => {
    mockaYtan(network, fylldaRader());
    await gotoPromoverad(page);

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
    await gotoPromoverad(page);

    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'intresserade-tom.aria.yml',
    });
  });
});

/**
 * STALE `?variant=`-URL — degraderar till den enda formen utan krasch och
 * utan halvbyggd yta (TASK-374.2 AC #4). Före flippen villkorade
 * `?variant=a` vilken form routen renderade; en länk som fortfarande bär
 * den gamla queryn (bokmärke, delad URL, öppen flik) träffar nu en app där
 * INGEN kod läser parametern längre. [UPPDATERAT I TASK-374.4] Vid FAS 2
 * (374.2) fanns `PrototypeSwitcher`-railen kvar på routen och läste
 * `?variant=` internt för sin egen aktiv-knapp — det påverkade bara
 * railens highlight, aldrig den scopade `ariaSnapshot`-ytan nedan. Efter
 * rivningen (374.4, ADR-103 B2 steg 4) är railen borta från routen helt:
 * ingen komponent, inte ens `PrototypeSwitcher`, monteras längre här, så
 * `?variant=` är en helt inert parameter i alla led.
 *
 * Samma referens som regressionslåset ovan bevisar det MEKANISKT, inte bara
 * "sidan kraschar inte": en stale URL måste rendera byte för byte samma
 * träd som ingen query alls. Samma AC-form som
 * `personer-promoverings-grind.spec.ts`/
 * `anmalningssidan-promoverings-grind.spec.ts` § stale `?variant=`.
 */
test.describe('stale ?variant=-URL degraderar till den enda formen', () => {
  test('?variant=a renderar identiskt med ingen query alls', async ({ page, network }) => {
    mockaYtan(network, fylldaRader());
    await page.goto('/mer/intresserade?variant=a');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'intresserade-fylld.aria.yml',
    });
  });

  test('okänd ?variant=z degraderar likaså', async ({ page, network }) => {
    mockaYtan(network, fylldaRader());
    await page.goto('/mer/intresserade?variant=z');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'intresserade-fylld.aria.yml',
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
 * motsvarigheten (samma två hävdanden, mot den promoverade adressen) bor i
 * `tests/acceptance/mer-intresserade.acceptance.test.ts` — se filens § AC #3-
 * docblock ovan för varför båda finns.
 */
test.describe('AC #3 — träffantalet annonseras i en artig live-region', () => {
  test('räknaren bär aria-live/aria-atomic och uppdateras vid sökning', async ({
    page,
    network,
  }) => {
    mockaYtan(network, fylldaRader());
    await gotoPromoverad(page);

    const raknare = page.getByText('2 intresserade');
    await expect(raknare).toBeVisible();
    await expect(raknare).toHaveAttribute('aria-live', 'polite');
    await expect(raknare).toHaveAttribute('aria-atomic', 'true');
    // Rollen är ORÖRD ("paragraph", inte "status") — se filens docblock i
    // `Intresserade.tsx` § TRÄFFANTALET SOM ARTIG LIVE-REGION för varför
    // (role="status" hade dubbelannonserat OCH ändrat ariaSnapshot).
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
    await gotoPromoverad(page);
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await axeNoll(page);
  });

  test('tom: axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, []);
    await gotoPromoverad(page);
    await expect(page.getByText('Inga intresserade än.')).toBeVisible();
    await axeNoll(page);
  });

  test('fel (4xx): axe 0 violations', async ({ page, network }) => {
    network.use(http.get(EF('get-leads'), () => json({ error: 'x' }, 404)));
    await page.goto('/mer/intresserade');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Kunde inte hämta intresserade')).toBeVisible();
    await axeNoll(page);
  });
});
