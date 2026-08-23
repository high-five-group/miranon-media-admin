import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för anmälningssidan `/mer/anmalningar` (`ADR-103` B4,
 * TASK-299.5).
 *
 * ── PARET, OCH VARFÖR ORDNINGEN ÄR ENKELRIKTAD ───────────────────────────
 *
 * [FAS 1 — 2026-08-23] Referenserna under `__aria__/` fångades ur
 * VARIANT-LÄGET (`/dev/anmalningar-prototyp?variant=b`) i en EGEN commit
 * INNAN villkoret flippades, precis som `personer-promoverings-grind.spec.ts`
 * bokför för sin yta. Skälet är att FÖRE-läget UPPHÖR ATT EXISTERA vid
 * flippen: variant B renderades bara bakom `?variant=b` på en dev-route som
 * `ADR-103` B2 steg 4 river. Hade flippen kommit först hade paret aldrig
 * kunnat konstrueras i efterhand — inte ens ur facit-PNG:erna, eftersom de
 * inte bär roll/namn-strukturen `ariaSnapshot` jämför.
 *
 * [FAS 2 — GJORD] Efter flippen pekar `gotoYta()` mot `/mer/anmalningar`
 * medan referenserna är ORÖRDA. En grön körning betyder därför EN sak: trädet är
 * identiskt före och efter promoveringen — formen följde med filflytten
 * (`VariantB.tsx` → `registrations/AnmalningarSida.tsx`), ingenting annat
 * smög in.
 *
 * ── VAD PARET FAKTISKT FÅNGADE (mätt 2026-08-23) ─────────────────────────
 *
 * Paret var RÖTT vid första körningen mot den promoverade ytan, och det är
 * värt att bokföra vad det fällde på — annars läser en framtida läsare
 * regenereringen nedan som att facit böjdes när det inte passade.
 *
 * Diffen var EN nod, identisk i alla tre lägen och båda vyporterna:
 *
 *     - banner:
 *       - heading "Anmälningar" [level=1]
 *     + heading "Anmälningar" [level=1]
 *
 * Varenda annan nod, roll, tillgängligt namn och URL var oförändrad;
 * indenteringsskiftet i resten av diffen följde av att `banner`-noden föll
 * bort, inte av någon egen skillnad.
 *
 * ORSAKEN ÄR SIDKROMET, INTE FORMEN. `<header>` mappas till landmärket
 * `banner` ENDAST när den saknar en sectioning-content-förfader (HTML-AAM).
 * Prototyp-routen renderade utanför app-skalet och hade inget `<main>` alls,
 * så formens `<header>` blev en banner-landmark. Den skarpa sidan bor i
 * `AppShell`s `<main id="main">`, så samma `<header>` är inte längre ett
 * landmärke.
 *
 * DEN SKARPA FORMEN ÄR DEN RIKTIGA. En banner-landmark inuti `<main>` är
 * fel — banner är per definition sidnivå, och prototypen bar den bara som
 * artefakt av att dev-routen saknar skalet. Alternativet, att tvinga
 * tillbaka rollen med ett `role="banner"`, hade varit att införa en
 * a11y-defekt för att få en grind grön. Referenserna regenererades därför i
 * en EGEN commit efter flippen, med denna diff som hela motiveringen. Axe
 * gav 0 violations före OCH efter — båda formerna är valida, men bara den
 * ena är rätt i app-skalet.
 *
 * Kvarstår som strukturell, ej mätbar-i-aria skillnad: containern är 600 px
 * här (`<main class="max-w-[600px]">`) mot prototypens 576 (`max-w-xl`).
 * `ariaSnapshot` bär ingen bredd, så paret säger ingenting om den.
 *
 * ── ANKARET: FORMEN, INTE SIDKROMET ──────────────────────────────────────
 *
 * Snapshotten scopas till `[data-testid="anmalningar-yta"]`. Det är inte
 * bekvämlighet utan en NÖDVÄNDIGHET för att paret ska mäta rätt sak: de två
 * sidorna bär olika sidkrom. Prototypen har sin `max-w-xl`-wrapper, en
 * "← Tillbaka till Mer"-länk i routen och den flytande `PrototypeSwitcher`-
 * railen; den skarpa sidan har `AppShell`s header, `<main class="max-w-[600px]">`
 * och tab bar, med samma tillbakalänk buren av komponenten själv. En snapshot
 * av hela sidan hade fällt på kromet varje gång och aldrig sagt något om
 * formen. Ankaret sitter på formens yttersta element i BÅDA lägena, och
 * tillbakalänken står utanför det i båda.
 *
 * ── SCOPE: TRE LÄGEN (kortets AC #1) ─────────────────────────────────────
 *
 *   1. **Listläget** — ofiltrerad lista. Här sitter merparten av formen:
 *      radanatomin (`InitialAvatar`, namnet som helradslänk, identiteten via
 *      `eventIdentitet`, tiden i egen kolumn, chevron) och filterraden.
 *   2. **Åtgärdskö-läget** — `behoverAtgard`-filtrerat. Egen rubrik-copy,
 *      "Behöver kopplas"-badgarna, återvägen till hela listan, och rader vars
 *      namn är en KNAPP (resolutionen) i stället för en länk.
 *   3. **Tomläget** — "Inga anmälningar än." Eget formbeslut, egen referens.
 *
 * Tomläget nås i BÅDA halvorna via DATA (en tom `get-registrations`), inte
 * via prototypens `?lage=tomt`-växel. Det är avsiktligt: växeln rivs, och ett
 * par vars ena halva vilar på en riven mekanism kan inte jämföras. Med
 * data-vägen är de två halvorna symmetriska — enda skillnaden är adressen.
 *
 * MEDVETET UTANFÖR referensen: laddningsläget (`isPending`, skeleton-raderna).
 * Det är tidsberoende och hade gjort referensen spröd av skäl som inte rör
 * formen — samma undantag `personer-promoverings-grind.spec.ts` bokför.
 * Felläget står också utanför `ariaSnapshot` (dess `MessageBox` bär ett
 * EF-genererat felmeddelande), men INTE utanför axe-golvet nedan.
 *
 * ── DATAN ÄR MOCKAD, INTE FIXTURVÄRLDENS EGNA RADER ──────────────────────
 *
 * `REGISTRATIONS_RESPONSE` (fixture-data.ts) bär 29 rader UTAN
 * `eventmatchning` — fältet är `.nullable().optional()` i
 * `Registration.schema.ts`, så `behoverAtgard()` är falskt för samtliga och
 * åtgärdskö-läget hade varit TOMT mot normalläget. Överskuggningen nedan ger
 * en liten, exakt datamängd som täcker alla tre eventmatchning-lägen, och
 * används IDENTISKT i båda halvorna av paret. `network.use()` (inte
 * `page.route`) av samma skäl som acceptance-sviten bokför: page-routes prövas
 * före MSW:s context-routes.
 *
 * Datumen är satta mot FROZEN_NOW (2026-09-15T10:00+02:00, fryst i
 * `hermetic.ts`), aldrig mot verklig systemtid — annars hade `relativTid()`
 * skrivit om undertexterna när kalendertiden passerade.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, och det jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff
 * (BackstopJS-klassen) är den bokförda eskaleringsvägen OM `ariaSnapshot`
 * empiriskt missar en formskillnad — inte default.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FAKTISKT FÄLLER ──────────────────────────────
 *
 * `tests/visual/` körs inte av blockerande CI (enda träffen på
 * `npm run test:visual` i `.github/workflows/` är `visual-baselines.yml`, ett
 * `workflow_dispatch`-jobb) — samma sak `hem-aktivitetsspalt-promoverings-
 * grind.spec.ts` bokför för sin yta. Det LEVANDE låset för samma form bor i
 * `tests/acceptance/mer-anmalningar-form.acceptance.test.ts` och
 * `tests/acceptance/mer-anmalningar.acceptance.test.ts`, i ett jobb som
 * faktiskt fäller en PR. Denna fil är `ADR-103` B4:s bevis-par.
 */

/** Formens yttersta element — `AnmalningarSida.tsx` § YTANS_ANKARE. */
const YTA = 'anmalningar-yta';

/** Ett event-ID som finns i mock-eventlistan nedan. */
const EVENT_KURS = 'recGrindEventKurs1';
/** Ett andra event, annan typ och ort — så typ/ort-axlarna kan särskiljas. */
const EVENT_FORELASNING = 'recGrindEventForel1';

/** Två event, båda daterade mot FROZEN_NOW (2026-09-15). */
function grindEvents() {
  return [
    {
      id: EVENT_KURS,
      eventlabel: null,
      eventNamn: 'Resor i medvetandet 1',
      typ: 'Kurs',
      ort: 'Skövde',
      startdatum: '2026-10-05',
      slutdatum: null,
      tidKvarTillEvent: null,
      maxPlatser: null,
      antalAnmalda: 0,
      platserKvar: null,
      anmaldBelaggning: null,
      bekraftadBelaggning: null,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 0,
      antalSlutbetalningar: 0,
      antalSlutbetalningFelande: 0,
      status: 'Planerat',
    },
    {
      id: EVENT_FORELASNING,
      eventlabel: null,
      eventNamn: 'Ledarskap i grupp',
      typ: 'Föreläsning',
      ort: 'Göteborg',
      startdatum: '2026-10-20',
      slutdatum: null,
      tidKvarTillEvent: null,
      maxPlatser: null,
      antalAnmalda: 0,
      platserKvar: null,
      anmaldBelaggning: null,
      bekraftadBelaggning: null,
      antalNyaAnmalningar: 0,
      antalAnmalningsavgifter: 0,
      antalSlutbetalningar: 0,
      antalSlutbetalningFelande: 0,
      status: 'Planerat',
    },
  ];
}

/** En komplett anmälningsrad i EF-svarets form. */
function reg(overrides: Record<string, unknown>) {
  return {
    id: `recGrind${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: null,
    ort: 'Skövde',
    status: 'Bekräftad (mail skickat)',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-13T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: EVENT_KURS,
    personId: 'recGrindPerson1',
    eventmatchning: 'OK',
    ...overrides,
  };
}

/**
 * TRE rader som täcker samtliga eventmatchning-lägen: OK (länk-rad),
 * Avviker (knapp-rad med badge) och Utan event (knapp-rad, identiteten
 * "Utan event"). Sorteringen är senaste-först, så DOM-ordningen är
 * Anna → Bo → Disa.
 */
function grindRader() {
  return [
    reg({
      fornamn: 'Anna',
      efternamn: 'Andersson',
      eventId: EVENT_KURS,
      eventmatchning: 'OK',
      inskickad: '2026-09-15T06:00:00.000Z',
    }),
    reg({
      fornamn: 'Bo',
      efternamn: 'Bengtsson',
      eventId: EVENT_FORELASNING,
      eventmatchning: 'Avviker',
      inskickad: '2026-09-14T06:00:00.000Z',
    }),
    reg({
      fornamn: 'Disa',
      efternamn: 'Danielsson',
      eventId: null,
      eventmatchning: 'Utan event',
      inskickad: '2026-09-10T08:00:00.000Z',
    }),
  ];
}

function mockaYtan(network: NetworkFixture, rader: ReturnType<typeof grindRader> | []): void {
  network.use(
    http.get(EF('get-events'), () => json({ events: grindEvents() })),
    http.get(EF('get-registrations'), () => json({ registrations: rader })),
  );
}

/**
 * EFTER-läget: den PROMOVERADE, ovillkorliga ytan.
 *
 * [FAS 2 GJORD — 2026-08-23] Detta är den ENDA funktion som ändrades vid
 * flippen. Den pekade mot `?variant=b` och prototypens `?lage=`-växel; nu
 * pekar den mot `/mer/anmalningar` respektive den skarpa sidans egen
 * `?visa=atgardskon`, medan referenserna under `__aria__/` är ORÖRDA sedan
 * FAS 1. Det är precis den asymmetrin som gör en grön körning till ett
 * bevis: adressen bytte, formen fick inte göra det.
 */
async function gotoYta(page: Page, lage: 'lista' | 'atgardskon'): Promise<void> {
  await page.goto(lage === 'atgardskon' ? '/mer/anmalningar?visa=atgardskon' : '/mer/anmalningar');
  await expect(page.getByTestId(YTA)).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot mot den promoverade ytan (ADR-103 B4)', () => {
  test('listläget — ofiltrerad lista, hela radanatomin', async ({ page, network }) => {
    mockaYtan(network, grindRader());
    await gotoYta(page, 'lista');

    // Fixtur-förankrad skarv före snapshotten: en KÄND rad bevisar att datat
    // landat — laddläget står medvetet utanför referensen.
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'anmalningssidan-lista.aria.yml',
    });
  });

  test('åtgärdskö-läget — behoverAtgard-filtrerat, med återvägen', async ({ page, network }) => {
    mockaYtan(network, grindRader());
    await gotoYta(page, 'atgardskon');

    // Bo (Avviker) + Disa (Utan event); Anna (OK) filtreras bort.
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toHaveCount(0);
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'anmalningssidan-atgardskon.aria.yml',
    });
  });

  test('tomläget — ingen data alls, "Inga anmälningar än."', async ({ page, network }) => {
    mockaYtan(network, []);
    await gotoYta(page, 'lista');

    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'anmalningssidan-tomt.aria.yml',
    });
  });
});

/**
 * STALE PROTOTYP-URL — degraderar utan krasch och utan halvbyggd yta.
 *
 * Före rivningen villkorade `?variant=` och `?lage=` vad routen renderade.
 * En länk som fortfarande bär den gamla queryn (bokmärke, delad URL, öppen
 * flik) träffar nu en app där INGEN fil läser `?variant=`. Samma AC-form som
 * `personer-promoverings-grind.spec.ts` § stale `?variant=`, och beviset är
 * MEKANISKT: en stale URL måste rendera byte för byte samma träd som ingen
 * query alls — inte en tom yta, inte ett kvarvarande prototyp-fragment.
 *
 * ATT DEN GAMLA ADRESSEN `/dev/anmalningar-prototyp` ÄR BORTA är en annan
 * sak och prövas inte här: routen är riven, så den träffar router-trädets
 * egen 404-gren, inte denna yta.
 */
test.describe('stale ?variant=-URL degraderar till den enda formen', () => {
  test('?variant=b renderar identiskt med ingen query alls', async ({ page, network }) => {
    mockaYtan(network, grindRader());
    await page.goto('/mer/anmalningar?variant=b');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByTestId(YTA)).toMatchAriaSnapshot({
      name: 'anmalningssidan-lista.aria.yml',
    });
  });
});

/**
 * A11Y-GOLVET (kortets DoD #5: *"axe 0 på varje ny/ändrad yta i alla
 * tillstånd (lista, filtrerat, tomt, fel)"*). Axe körs på SAMMA lokator som
 * `ariaSnapshot`-grinden ovan, plus felläget — som medvetet står utanför
 * referensen men INTE utanför a11y-golvet.
 *
 * "Filtrerat" täcks i TVÅ betydelser, eftersom sidan har två oberoende
 * filtermekanismer: åtgärdskö-läget (route-search) och filterpanelens
 * dimensioner (`?typ=`). Den senare körs med panelen ÖPPEN, så
 * `EventValjare`-kontrollen ingår i mätningen.
 */
test.describe('a11y-golvet — axe på samma ytor som formgrinden (DoD #5)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  /** Kör axe scopat till ytan; violations skrivs ut läsbart vid fällning. */
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

  test('listläget: axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, grindRader());
    await gotoYta(page, 'lista');
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await axeNoll(page);
  });

  test('filtrerat (åtgärdskön): axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, grindRader());
    await gotoYta(page, 'atgardskon');
    await expect(page.getByText('Bo Bengtsson')).toBeVisible();
    await axeNoll(page);
  });

  test('filtrerat (filterpanelen öppen, dimension aktiv): axe 0 violations', async ({
    page,
    network,
  }) => {
    mockaYtan(network, grindRader());
    await page.goto('/mer/anmalningar?typ=Kurs');
    await expect(page.getByTestId(YTA)).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await page.getByRole('button', { name: /^(Visa|Dölj) filter/ }).click();
    await expect(page.getByTestId('filter-panel')).toBeVisible();
    await axeNoll(page);
  });

  test('tomt: axe 0 violations', async ({ page, network }) => {
    mockaYtan(network, []);
    await gotoYta(page, 'lista');
    await expect(page.getByText('Inga anmälningar än.')).toBeVisible();
    await axeNoll(page);
  });

  test('fel (4xx): axe 0 violations', async ({ page, network }) => {
    network.use(
      http.get(EF('get-events'), () => json({ events: grindEvents() })),
      http.get(EF('get-registrations'), () => json({ error: 'x' }, 404)),
    );
    await page.goto('/mer/anmalningar');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta anmälningarna');
    await axeNoll(page);
  });
});
