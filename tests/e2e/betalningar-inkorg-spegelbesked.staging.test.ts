import { expect, type Page, type Route, test } from '../support/test-bas';
import { mockValjarLista, valjarRad } from './helpers/valjar-lista';

/**
 * TASK-475 — Fynd: beskedet om databasens eftersläpning var obegripligt för
 * användaren, och dess förklaring var inte nåbar utan hover.
 *
 * Marcus efter ögonmätning av PR #2541 (2026-09-19, S127), ordagrant:
 *   *"Ser bra ut, men vad betyder 'Basen släpar'? Den texten kan vi inte visa
 *   för användaren (Lotta)."*
 * och om lösningen:
 *   *"det bästa kanske är som du sa att hela meningen står en gång synligt
 *   överst i listan när minst en rad berörs, typ 'Databasen har inte hunnit
 *   uppdateras för två betalningar. Beloppen här i appen stämmer.'"*
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * RÖTT-FÖRST — DE TVÅ FEL SVITEN FINNS FÖR
 * ═══════════════════════════════════════════════════════════════════════════
 * (a) FÖRKLARINGEN VAR INTE NÅBAR UTAN HOVER. På `origin/main` (`168dd403`,
 *     PR #2541 runda 3) bar raden texten "Basen släpar" plus ett
 *     `title="Basen har inte hunnit uppdateras än"`. `title` visas bara vid
 *     mus-hover — på pekskärm och för tangentbord fanns alltså INGEN
 *     förklaring alls, och den text som syntes var den Marcus fällde.
 *     Prövas av § A och § D.
 *
 * (b) SÖKLÄGET GAV SPEGEL-RADERNA EGEN HÖJD. Med `visaEvent` (sökträfflistan)
 *     lägger samma span `${eventNamn} · ` FÖRE beloppet, och `sm:truncate`
 *     klipper först vid 640 px — under den bredden radbryter raden i stället.
 *     Runda 3:s tolv extra tecken gjorde brytningen inträffa TIDIGARE för just
 *     spegel-raderna: med ett långt eventnamn och ett sexsiffrigt belopp blev
 *     de en rad högre än sina syskon. Detta var granskningens runda 3-fynd på
 *     #2541 (`warning`, `ask-user`), uttryckligen obevisat då — inget test
 *     övade sökläget. Prövas av § B.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FIXTUREN ÄR EXTREMFALLET, MED AVSIKT
 * ═══════════════════════════════════════════════════════════════════════════
 * Båda raderna bär SAMMA långa eventnamn och SAMMA sexsiffriga belopp, så
 * spegel-markören är den ENDA skillnaden mellan dem — ett rent experiment i
 * stället för ett där namn- eller beloppslängden också varierar. Talen är
 * valda för att vara de värsta realistiska, inte de bekvämaste: ett
 * retreat-namn med ort och säsong, och ett sexsiffrigt belopp.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * DEN NAMNGIVNA GRÄNSEN — ÄRVD ORDAGRANT FRÅN TASK-456, INTE UTVIDGAD
 * ═══════════════════════════════════════════════════════════════════════════
 * | Bredd | Krav |
 * |---|---|
 * | **390 px** | EXAKT samma korthöjd med och utan markör — i BÅDA lägena |
 * | **1280 px** | EXAKT samma korthöjd med och utan markör — i BÅDA lägena |
 * | 360 px · 320 px · 200 % @ 390 px | INGEN horisontell overflow. Lika höjd krävs INTE. |
 *
 * Skälet är oförändrat (`betalningar-inkorg-pillrad-hojd.staging.test.ts`
 * § filhuvud): under 390 px är RADBRYTNING det tillgänglighetsriktiga
 * beteendet (WCAG 1.4.10 reflow), och att tvinga en rad ger exakt den
 * horisontella overflow kriteriet förbjuder.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR STAGING-E2E OCH INTE ACCEPTANCE-KLASSEN
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma strukturella hinder som syskonsviten bokför: `VITE_FEATURE_BETALNINGAR`
 * är `'av'` för HELA den delade acceptance-fixturvärlden
 * (`playwright.config.ts`), så `/mer/betalningar` kan inte renderas i den
 * klassen. Deterministisk via `page.route`; ingen delad staging-data rörs.
 */

const HAMTA_OPPNA_BETALNINGAR = '**/functions/v1/hamta-oppna-betalningar*';

const EVENT_ID = 'recTASK475EVENT1';

/** Det värsta realistiska eventnamnet — ort och säsong, inte ett testord. */
const EVENTNAMN = 'Retreat för kropp och sinne i Rongne, hösten 2026';

/** Sexsiffrigt belopp ⇒ "123 456 kr kvar att betala", den längsta beloppstext
    ytan realistiskt kan visa. */
const BELOPP = 123456;

/** Gemensamt namnfragment: sökfältet filtrerar på namn, och BÅDA raderna måste
    överleva filtreringen för att § B ska jämföra rätt saker. */
const SOKTERM = 'Task475';

type Json = Record<string, unknown>;

function oppenBetalning(overrides: Json): Json {
  return {
    anmalanRecordId: 'recTASK475BAS',
    personNamn: 'Task475 Basperson',
    personEpost: null,
    personTelefon: null,
    eventId: EVENT_ID,
    eventNamn: EVENTNAMN,
    eventStartdatum: '2099-06-01',
    eventTyp: 'Utbildning',
    anmalanStatus: 'Bekräftad (mail skickat)',
    saknas: BELOPP,
    gallandePris: BELOPP,
    anmalningsavgift: null,
    summaInbetalt: 0,
    summaInbetaltSpegel: 0,
    spegelIFas: true,
    deadlineSlutbetalning: null,
    kvittonAttSkicka: 0,
    ...overrides,
  };
}

/** Spegeln I FAS — ingen markör. Baslinjen varje höjdjämförelse mäts mot. */
const UTAN_MARKOR = oppenBetalning({
  anmalanRecordId: 'recTASK475UTAN',
  personNamn: `${SOKTERM} Utanmarkor Persson`,
});
/** Spegeln SLÄPAR (`spegelIFas: false`) — bär markören. */
const MED_MARKOR = oppenBetalning({
  anmalanRecordId: 'recTASK475MED',
  personNamn: `${SOKTERM} Medmarkor Persson`,
  spegelIFas: false,
});
/** En ANDRA släpande rad — enbart för numerus-provningen (§ C). */
const MED_MARKOR_2 = oppenBetalning({
  anmalanRecordId: 'recTASK475MED2',
  personNamn: `${SOKTERM} Medmarkor Andersson`,
  spegelIFas: false,
});

async function mocka(page: Page, betalningar: Json[]): Promise<void> {
  await mockValjarLista(page, [
    valjarRad({ id: EVENT_ID, namn: EVENTNAMN, startdatum: '2099-06-01' }),
  ]);
  await page.route(HAMTA_OPPNA_BETALNINGAR, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ betalningar, forfallna: 0 }),
    });
  });
}

type Lokator = ReturnType<Page['getByTestId']>;

function kortMed(page: Page, namnfragment: string): Lokator {
  return page.getByTestId('betalningar-kort').filter({ hasText: namnfragment });
}

/** Slår om till SÖKLÄGET — `visaEvent` är satt bara där, och det är den enda
    axel som skiljer lägena åt (`RadInnehall` § docblock). */
async function sok(page: Page): Promise<void> {
  await page.getByRole('searchbox', { name: 'Sök på namn, telefon eller belopp' }).fill(SOKTERM);
  await expect(page.getByRole('heading', { name: /träff/ })).toBeVisible();
}

async function hojd(lokator: Lokator): Promise<number> {
  return lokator.evaluate((el) => el.getBoundingClientRect().height);
}

/**
 * Elementets text MINUS varje `sr-only`-nod — alltså exakt det ögat ser.
 *
 * VARFÖR INTE `innerText`: den utelämnar `display:none` och
 * `visibility:hidden`, men sr-only-mönstret döljer med `position:absolute` +
 * `clip`, vilket `innerText` RÄKNAR MED. Mätt i denna svits första körning:
 * `innerText` på markören gav hela sr-only-meningen. Att klona och ta bort
 * noderna mäter det som faktiskt påstås.
 */
async function synligText(lokator: Lokator): Promise<string> {
  return lokator.evaluate((el) => {
    const kopia = el.cloneNode(true) as HTMLElement;
    for (const n of kopia.querySelectorAll('.sr-only')) n.remove();
    return (kopia.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
}

/**
 * Horisontell overflow i BÅDA de former den kan ta — ordagrant syskonsvitens
 * mätare (`betalningar-inkorg-pillrad-hojd.staging.test.ts` § matOverflow), och
 * av samma skäl: form (b) syns inte i (a) när en förälder saknar
 * `overflow: hidden`, vilket är precis fallet här.
 */
async function matOverflow(kort: Lokator): Promise<{
  scrollWidth: number;
  clientWidth: number;
  vardstaHogerkant: number;
  kortHogerkant: number;
  utstickare: string | null;
}> {
  return kort.evaluate((el) => {
    const kortRect = el.getBoundingClientRect();
    let vardsta = kortRect.right;
    let utstickare: string | null = null;
    for (const barn of el.querySelectorAll('*')) {
      const r = barn.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > vardsta) {
        vardsta = r.right;
        const klass = typeof barn.className === 'string' ? barn.className : '';
        utstickare = `${barn.tagName.toLowerCase()}${klass ? `.${klass.split(' ').join('.')}` : ''}`;
      }
    }
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      vardstaHogerkant: vardsta,
      kortHogerkant: kortRect.right,
      utstickare,
    };
  });
}

const HOJDKRAV_VIEWPORTS = [
  { namn: 'mobil (390×844)', width: 390, height: 844 },
  { namn: 'desktop (1280×900)', width: 1280, height: 900 },
] as const;

const SMALA_VIEWPORTS = [
  { namn: 'smal (360×780)', width: 360, height: 780 },
  { namn: 'smalast (320×720)', width: 320, height: 720 },
] as const;

const MENING_TVA =
  'Databasen har inte hunnit uppdateras för 2 betalningar. Beloppen här i appen stämmer.';
const MENING_EN =
  'Databasen har inte hunnit uppdateras för 1 betalning. Beloppet här i appen stämmer.';
const RADMENING =
  'Databasen har inte hunnit uppdateras för den här betalningen. Beloppet här i appen stämmer.';

test.describe('TASK-475 — spegel-beskedet: en synlig mening överst, en neutral ikon per rad', () => {
  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § A — RÖTT-FÖRST (a): FÖRKLARINGEN ÄR SYNLIG TEXT, INTE ETT `title`
   * ─────────────────────────────────────────────────────────────────────────
   * Kravet har tre delar, och alla tre fälls var för sig av `main`s form:
   * meningen FINNS som synlig text, den står ÖVERST (före första kortet), och
   * den gamla `title`-bäraren är BORTA. Utan den tredje delen hade en fix som
   * la till meningen men lämnade kvar `title` gått grön — och då vore
   * förklaringen fortfarande dubbelt bokförd, en gång onåbart.
   */
  for (const { namn, width, height } of HOJDKRAV_VIEWPORTS) {
    test(`§A gruppvyn: hela meningen står som SYNLIG text överst i listan @ ${namn}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await mocka(page, [UTAN_MARKOR, MED_MARKOR, MED_MARKOR_2]);
      await page.goto('/mer/betalningar');

      const besked = page.getByTestId('spegel-slapar-besked');
      await expect(besked).toBeVisible();
      await expect(besked).toHaveText(MENING_TVA);

      // ÖVERST: beskedets underkant ligger ovanför första kortets överkant.
      const beskedRuta = await besked.evaluate((el) => el.getBoundingClientRect().bottom);
      const forstaKortTopp = await page
        .getByTestId('betalningar-kort')
        .first()
        .evaluate((el) => el.getBoundingClientRect().top);
      expect(beskedRuta, `${namn}: beskedet står inte ovanför korten`).toBeLessThanOrEqual(
        forstaKortTopp,
      );

      // DEN ONÅBARA BÄRAREN ÄR BORTA: inget `title` någonstans i något kort.
      const titlar = await page
        .getByTestId('betalningar-kort')
        .first()
        .evaluate((el) => [...el.querySelectorAll('[title]')].map((n) => n.getAttribute('title')));
      expect(titlar, `${namn}: title-attribut kvar i kortet`).toEqual([]);
    });
  }

  test('§A sökläget: samma mening, samma nivå — teckenförklaringen följer med', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page, [UTAN_MARKOR, MED_MARKOR, MED_MARKOR_2]);
    await page.goto('/mer/betalningar');
    await sok(page);

    const besked = page.getByTestId('spegel-slapar-besked');
    await expect(besked).toBeVisible();
    await expect(besked).toHaveText(MENING_TVA);

    const beskedBotten = await besked.evaluate((el) => el.getBoundingClientRect().bottom);
    const forstaKortTopp = await page
      .getByTestId('betalningar-kort')
      .first()
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(beskedBotten).toBeLessThanOrEqual(forstaKortTopp);
  });

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § B — RÖTT-FÖRST (b): SÖKLÄGETS KORTHÖJD
   * ─────────────────────────────────────────────────────────────────────────
   * Kortets yttre höjd OCH beloppsradens egen höjd mäts båda. Den yttre
   * ensam räcker inte: en radbrytning kunde teoretiskt kompenseras av något
   * annat i kortet, och det är just beloppsraden fyndet gäller.
   */
  for (const { namn, width, height } of HOJDKRAV_VIEWPORTS) {
    test(`§B sökläget: kort MED och UTAN markör är exakt lika höga @ ${namn}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
      await page.goto('/mer/betalningar');
      await sok(page);

      const utan = kortMed(page, 'Utanmarkor');
      const med = kortMed(page, 'Medmarkor');
      await expect(utan).toBeVisible();
      await expect(med).toBeVisible();

      // Eventnamnet MÅSTE faktiskt renderas — annars mäter testet fel läge och
      // skulle gå grönt av fel skäl. Det bor sedan TASK-475 på EGEN rad, och
      // beloppsraden ska därför INTE längre bära det: båda halvorna asserteras,
      // så en återgång till den gamla, klippande formen fälls här.
      await expect(med.getByTestId('rad-event')).toHaveText(EVENTNAMN);
      await expect(med.getByTestId('rad-belopp')).not.toContainText(EVENTNAMN);

      const [hUtan, hMed] = [await hojd(utan), await hojd(med)];
      expect(hMed, `${namn}: korthöjd utan=${hUtan}px, med=${hMed}px`).toBe(hUtan);

      const bUtan = await hojd(utan.getByTestId('rad-belopp'));
      const bMed = await hojd(med.getByTestId('rad-belopp'));
      expect(bMed, `${namn}: beloppsradens höjd utan=${bUtan}px, med=${bMed}px`).toBe(bUtan);
    });
  }

  for (const { namn, width, height } of HOJDKRAV_VIEWPORTS) {
    test(`§B gruppvyn: kort MED och UTAN markör är exakt lika höga @ ${namn}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
      await page.goto('/mer/betalningar');

      const utan = kortMed(page, 'Utanmarkor');
      const med = kortMed(page, 'Medmarkor');
      await expect(utan).toBeVisible();
      await expect(med).toBeVisible();

      const [hUtan, hMed] = [await hojd(utan), await hojd(med)];
      expect(hMed, `${namn}: korthöjd utan=${hUtan}px, med=${hMed}px`).toBe(hUtan);
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § B2 — BELOPPET OCH MARKÖREN KLIPPS ALDRIG BORT AV EVENTNAMNET
   * ─────────────────────────────────────────────────────────────────────────
   * TREDJE RÖTT-FÖRST-FYNDET, upptäckt av denna skivas egen mätrigg och INTE
   * av uppdraget: fram till TASK-475 stod eventnamnet i SAMMA `sm:truncate`-
   * span som beloppet. Vid 1280 px i sökläget klipptes raden vid "… hösten
   * 202…" och både beloppet och spegel-markören låg utanför klippet — mätt
   * innehåll 458 px mot 306 px tillgängligt. Beloppet är radens hela ärende, så
   * felet fanns oberoende av spegel-beskedet; det syntes bara aldrig, eftersom
   * inget test övade sökläget med ett långt eventnamn.
   *
   * Testet mäter BÅDA halvorna: att beloppsraden inte klipps alls, och att
   * markörens egen ruta ligger innanför radens högerkant med verklig bredd.
   */
  for (const { namn, width, height } of HOJDKRAV_VIEWPORTS) {
    test(`§B2 sökläget: beloppet och markören klipps inte av eventnamnet @ ${namn}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
      await page.goto('/mer/betalningar');
      await sok(page);

      const med = kortMed(page, 'Medmarkor');
      await expect(med.getByTestId('rad-event')).toHaveText(EVENTNAMN);

      // BELOPPSRADEN KLIPPS INTE: dess innehåll får plats på raden.
      const belopp = await med
        .getByTestId('rad-belopp')
        .evaluate((el) => ({ scroll: el.scrollWidth, klient: el.clientWidth }));
      expect(
        belopp.scroll,
        `${namn}: beloppsraden klipps (scrollWidth ${belopp.scroll} > clientWidth ${belopp.klient})`,
      ).toBeLessThanOrEqual(belopp.klient);

      // BELOPPET SYNS SOM TEXT — inte bara "fick plats".
      expect(await synligText(med.getByTestId('rad-belopp'))).toContain('kr kvar att betala');

      // MARKÖREN HAR VERKLIG BREDD OCH LIGGER INNANFÖR RADENS HÖGERKANT.
      const geometri = await med.getByTestId('rad-belopp').evaluate((rad) => {
        const m = rad.querySelector('[data-testid="rad-spegel-slapar"]');
        if (!m) return null;
        const mr = m.getBoundingClientRect();
        return { bredd: mr.width, hoger: mr.right, radHoger: rad.getBoundingClientRect().right };
      });
      expect(geometri, `${namn}: markören saknas i beloppsraden`).not.toBeNull();
      expect(geometri?.bredd ?? 0, `${namn}: markören har noll bredd`).toBeGreaterThan(0);
      expect(
        geometri?.hoger ?? 0,
        `${namn}: markören ligger utanför radens högerkant`,
      ).toBeLessThanOrEqual((geometri?.radHoger ?? 0) + 0.5);
    });
  }

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § C — NUMERUS, OCH ATT TALET FÖLJER DEN SYNLIGA MÄNGDEN
   * ─────────────────────────────────────────────────────────────────────────
   * Meningen är en TECKENFÖRKLARING: räknar den fler rader än den har ikoner
   * ovanför slutar den förklara och börjar förvirra. Testet binder därför
   * talet till antalet faktiska markörer, inte bara till en förväntad sträng.
   */
  test('§C en enda släpande rad ⇒ entalsform, och talet matchar antalet markörer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
    await page.goto('/mer/betalningar');

    await expect(page.getByTestId('spegel-slapar-besked')).toHaveText(MENING_EN);
    await expect(page.getByTestId('rad-spegel-slapar')).toHaveCount(1);
  });

  test('§C ingen släpande rad ⇒ ingen mening alls (tyst vid noll)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page, [UTAN_MARKOR]);
    await page.goto('/mer/betalningar');

    await expect(kortMed(page, 'Utanmarkor')).toBeVisible();
    await expect(page.getByTestId('spegel-slapar-besked')).toHaveCount(0);
    await expect(page.getByTestId('rad-spegel-slapar')).toHaveCount(0);
  });

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § D — MARKÖREN: IKON UTAN TEXT, MEN FULL MENING FÖR SKÄRMLÄSARE
   * ─────────────────────────────────────────────────────────────────────────
   * Tillgänglighet är alltid 11 i detta repo. Att ta bort synlig text från
   * raden får därför inte ta bort utsagan för den som inte ser ikonen: seende
   * får den ur meningen överst, skärmläsaren ur `sr-only` PER RAD.
   *
   * `aria-label` på markörens `<span>` vore fel väg och det är mätt, inte
   * befarat — `biome`s `lint/a11y/useAriaPropsSupportedByRole` fällde exakt
   * det försöket i TASK-456 runda 2.
   */
  test('§D markören är en ikon utan synlig text, med full mening i sr-only', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
    await page.goto('/mer/betalningar');

    const markor = kortMed(page, 'Medmarkor').getByTestId('rad-spegel-slapar');
    await expect(markor).toBeVisible();

    // INGEN SYNLIG TEXT — mätt genom att RÄKNA BORT sr-only-noden, inte genom
    // `innerText`. Den skillnaden är mätt, inte antagen: `innerText` utelämnar
    // `display:none`/`visibility:hidden`, men sr-only-mönstret använder
    // `position:absolute` + `clip`, så noden RÄKNAS MED där. Ett första försök
    // asserterade `innerText === ''` och föll med hela meningen i `Received` —
    // exakt den falska trygghet ett fel instrument ger.
    expect(await synligText(markor)).toBe('');

    // MEN FULL MENING I TILLGÄNGLIGHETSTRÄDET, per rad.
    await expect(markor.locator('.sr-only')).toHaveText(RADMENING);

    // IKONEN SJÄLV ÄR DOLD FÖR SKÄRMLÄSARE — annars hade den lästs som brus
    // ovanpå meningen.
    await expect(markor.locator('svg')).toHaveAttribute('aria-hidden', 'true');

    // OCH DEN GAMLA, ONÅBARA BÄRAREN FINNS INTE KVAR.
    await expect(markor).not.toHaveAttribute('title', /.*/);
  });

  /**
   * ─────────────────────────────────────────────────────────────────────────
   * § E — DEN NAMNGIVNA GRÄNSEN, PRÖVAD I BÅDA LÄGENA
   * ─────────────────────────────────────────────────────────────────────────
   * Vid 360/320 px och vid 200 % textförstoring krävs INTE lika höjd — där är
   * radbrytning det riktiga beteendet. Vad som alltid krävs är att ingenting
   * svämmar över horisontellt (WCAG 1.4.10, `ACCESSIBILITY-CHECKLIST.md` §4).
   * Sökläget prövas uttryckligen: det är där raden bär mest innehåll.
   */
  for (const { namn, width, height } of SMALA_VIEWPORTS) {
    test(`§E sökläget svämmar inte över horisontellt @ ${namn}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
      await page.goto('/mer/betalningar');
      await sok(page);

      for (const [etikett, lokator] of [
        ['utan markör', kortMed(page, 'Utanmarkor')],
        ['med markör', kortMed(page, 'Medmarkor')],
      ] as const) {
        const m = await matOverflow(lokator);
        expect(
          m.scrollWidth,
          `${namn}: ${etikett} — kortet scrollar i sidled (${m.scrollWidth} > ${m.clientWidth})`,
        ).toBeLessThanOrEqual(m.clientWidth);
        expect(
          m.vardstaHogerkant,
          `${namn}: ${etikett} — ${m.utstickare} når ${m.vardstaHogerkant}px, kortet slutar ${m.kortHogerkant}px`,
        ).toBeLessThanOrEqual(m.kortHogerkant + 0.5);
      }
    });
  }

  test('§E sökläget svämmar inte över vid 200 % textförstoring @ 390 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mocka(page, [UTAN_MARKOR, MED_MARKOR]);
    await page.goto('/mer/betalningar');
    await sok(page);

    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.waitForFunction(
      () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) >= 30,
    );

    for (const [etikett, lokator] of [
      ['utan markör', kortMed(page, 'Utanmarkor')],
      ['med markör', kortMed(page, 'Medmarkor')],
    ] as const) {
      await expect(lokator).toBeVisible();
      const m = await matOverflow(lokator);
      expect(
        m.scrollWidth,
        `200 %: ${etikett} — kortet scrollar i sidled (${m.scrollWidth} > ${m.clientWidth})`,
      ).toBeLessThanOrEqual(m.clientWidth);
      expect(
        m.vardstaHogerkant,
        `200 %: ${etikett} — ${m.utstickare} når ${m.vardstaHogerkant}px, kortet slutar ${m.kortHogerkant}px`,
      ).toBeLessThanOrEqual(m.kortHogerkant + 0.5);
    }
  });
});
