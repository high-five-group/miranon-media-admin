import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN (TASK-171.1, ADR-103 B4) — ariaSnapshot-referenser
 * för åtgärds-/granskningsytan, FÅNGADE FÖRE NÅGON FLIP.
 *
 * FACIT-LÅSNINGEN (kortets AC #1) — Marcus, i klartext, 2026-08-09
 * (S93-resumen, kanonisk trail `tasks/sessions/archive/2026-08/2026-08-02-session-93.md`
 * Del 15; verbatim-citatet är bokfört i `task-171`s Implementation Notes):
 *
 *   "Du får göra bedömningen om granulariteten och beroendena. Och inget
 *   borde väl blockera nu, jag låser Åtgärdssidan och Granskningsidan (och
 *   granskningssidans olika ytor/lägen) som facit. Det är okej för v1, jag
 *   vill att de blir 'skarpa' sidor i appen nu."
 *
 * Låsningen täcker S100:s tidigare odömda formval (delutfallets
 * ruta-placering, fallna kortens gröna form, avmarkerings-beteendet,
 * hover-scopet) som de står, för v1 — referenstagningen nedan mäter alltså
 * mot ett GODKÄNT facit, inte mot en obedömd prototyp.
 *
 * DIVERGENS MOT UPPDRAGET, ÖPPET BOKFÖRD (ADR-086/premiss-passet): uppdraget
 * antog en `?variant=`-URL-mekanik analog med eventsidans (`PrototypeSwitcher`
 * + `ADR-074`s URL-state). Koden säger något annat, verifierat genom läsning
 * av `AtgardsSida.tsx` och båda routerna (`routes/_authenticated/atgarder.tsx`,
 * `routes/_authenticated/event/$eventId/atgarder.tsx`): `PrototypeSwitcher`
 * MONTERAS (DEV-grindad) och bär internt `useQueryState('variant')`, men
 * `PROTO_VARIANTS` har EN enda post (`key: 'a'`) och `AtgardsSida`/`Atgarder`-
 * routerna läser `variantParam` INGENSTANS (grep-verifierat, noll träffar) —
 * till skillnad från eventsidans `EventDetail.tsx`/`Deltagare.tsx`, som
 * FAKTISKT grenade på `isHallplatsVariant(variantParam)`. Åtgärds-/
 * granskningssidan har med andra ord ingen andra form att flippa MOT ännu;
 * den enda existerande renderingen ÄR variant-läget. Referenserna nedan tas
 * därför genom att navigera direkt till de skarpa URL:erna, utan query-param
 * — exakt vad `gotoAtgarder()` gör. TASK-171.2 äger den faktiska
 * villkors-flippen och avgör vad "före/efter" betyder för denna yta; den
 * bedömningen görs INTE här.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (ADR-103 B4): deterministiskt, noll nya
 * beroenden, jämför STRUKTUR OCH TILLGÄNGLIGT NAMN. Samma metod som
 * `eventsida-promoverings-grind.spec.ts` (TASK-162.1) etablerade.
 *
 * SCOPE — SEX REFERENSER, VALDA MOT KORTETS AC #2 (fyra namngivna lägen, tre
 * utfall):
 *   1. Tomt läge — `/atgarder` utan event, bara eventväljaren.
 *   2. Mottagarurval — mottagar-ytan med listan öppnad, seedad ur
 *      "obekräftad eller obetald" (`AtgardsSida`s egen seeding-regel):
 *      Anna, Björn, Cecilia, Filip markerade av fyra möjliga fem
 *      (David är obekräftad OCH betald i BÅDA avgifterna — utanför seedet,
 *      kvar som kandidat i plockaren). Verifierat mot
 *      `tests/support/fixturvarld/fixture-data.ts` `REGISTRATIONS_RESPONSE`,
 *      inte antaget.
 *   3. Granskningsläge — åtgärden "Skicka bekräftelsemail" (`urvalsfilter:
 *      obekraftad`) ÖPPNAS OCH GRANSKAS: filtret biter (4 markerade → 2 i
 *      urvalet, Anna + Björn), och mallens `{förnamn}`/`{event}`/`{datum}`/
 *      `{ort}` fylls fullt ur `VISUAL_EVENT_ID`s eventdata + första
 *      mottagaren — noll ofyllda platshållare, verifierat mot fixturen.
 *   4–6. De tre utfallslägena — åtgärden "Skicka betalningspåminnelse"
 *      (`urvalsfilter: obetald`, matchar alla fyra markerade — bredare
 *      urval ger en tydligare 3/1-delning i "delvis") skickas verkligt
 *      (TASK-147.3: alla fyra åtgärdstyper går genom `useSendActionEmail`,
 *      `AtgardsSida.tsx` § `GranskningsSida.skicka()`) mot ett MOCKAT
 *      `send-action-email`-nätverkssvar (`valjArmeraSkicka` nedan), format
 *      efter det som TIDIGARE var `simuleraUtfall`s tre deterministiska
 *      lägen — SAMMA mottagar-ID:n, SAMMA ordning, SAMMA skäl-text, så
 *      `verkligtUtfallTillUtfall` (`AtgardsSida.tsx`) mappar det mockade
 *      svaret till exakt det `Utfall` prototypen en gång byggde i minnet:
 *      "allt" → 4 lyckade/0 fallna, "delvis" → 3 lyckade/1 fallen (tackat
 *      nej), "inget" → 0 lyckade/4 fallna (ej levererat). Facit-låsningen
 *      (kortets AC #1) gäller den RENDERADE ytan, inte navigeringsvägen dit
 *      — se `TASK-147.3`s rapport för den fulla motiveringen.
 *
 * VARFÖR `granskning-yta` EXKLUDERAR `PrototypRigg` (se anker-kommentaren i
 * `AtgardsSida.tsx`): riggen är simulerings-byggställning, inte formen —
 * dess egen docblock säger det rakt ut ("riggen, inte ytan"). En referens
 * som fångat debug-knapparna hade blivit ogiltig i onödan den dag riggen
 * rivs (`TASK-147.8`s uttryckliga scope) — riggens knappar klickas inte
 * längre av testerna nedan (se § 4–6 ovan) men komponenten står ännu kvar,
 * DEV-grindad och nu funktionellt inert (`AtgardsSida.tsx`s egen docblock).
 *
 * INGEN OMOCKAD DATA-MUTATION: prototypens skrivytor (betalningsblocket)
 * rörs ALDRIG av dessa tester. De fyra första körningarna (tomt läge,
 * mottagarurval, granskning, bekräftelsemail-förhandsvisningen) är helt
 * läsande. De tre utfallslägena GÖR ett nätverksanrop — mot `send-action-
 * email` — men det anropet är mockat av testet självt (§ 4–6 ovan), aldrig
 * verkligt. Fixturvärlden är hermetisk: alla nätverksanrop mockas av
 * `tests/support/fixturvarld/handlers.ts` eller av testets egen
 * `network.use()`-överskuggning, och ett anrop som slinker förbi bådadera
 * fäller testet via hermetik-vakten.
 */

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar en namngiven åtgärd i menyn och går vidare till granskningen. */
async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

/**
 * De fyra Skövde-mottagarna som "Skicka betalningspåminnelse" (`urvalsfilter:
 * obetald`) väljer ut, i FIXTURENS registrerings-ordning (`REGISTRATIONS_
 * RESPONSE`, `fixture-data.ts`) — Cecilia är #3, Filip är #6 (David, #4, är
 * varken obekräftad eller obetald och alltså aldrig med), inte #1–4 i rad.
 * Verifierat mot fixturen, inte antaget.
 */
const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';
const CECILIA = 'recVisualReg000003';
const FILIP = 'recVisualReg000006';

/**
 * [TASK-147.3] De tre utfallslägena — TIDIGARE `simuleraUtfall`s tre
 * deterministiska grenar (`AtgardsSida.tsx`, riven i denna skiva), nu ett
 * mockat `send-action-email`-serversvar med IDENTISK avsikt: samma
 * mottagar-ID:n i samma ordning, samma fri-text-skäl för de fallna.
 * `verkligtUtfallTillUtfall` mappar detta till exakt det `Utfall` prototypen
 * en gång byggde i minnet — facit (aria-referenserna) rörs alltså inte.
 */
const PAMINNELSE_UTFALL = {
  allt: {
    status: 'sent',
    requested: 4,
    attempted: 4,
    completed: [ANNA, BJORN, CECILIA, FILIP],
    skipped: [],
    failed: [],
  },
  delvis: {
    status: 'partial',
    requested: 4,
    attempted: 4,
    completed: [ANNA, BJORN, CECILIA],
    skipped: [],
    failed: [{ registrationId: FILIP, reason: 'Har tackat nej till utskick' }],
  },
  inget: {
    status: 'failed',
    requested: 4,
    attempted: 4,
    completed: [],
    skipped: [],
    failed: [ANNA, BJORN, CECILIA, FILIP].map((registrationId) => ({
      registrationId,
      reason: 'Kunde inte levereras',
    })),
  },
} as const;

/**
 * Mockar `send-action-email` med ett av de tre deterministiska utfallen,
 * armerar och skickar; väntar in resultatet. Ersätter (TASK-147.3) den
 * tidigare klick-i-`PrototypRigg`-mekaniken: `skicka()` (`AtgardsSida.tsx`)
 * går sedan denna skiva ALLTID den verkliga vägen, oavsett åtgärdstyp — ett
 * klick på riggens knappar skulle inte längre påverka utfallet (se dess
 * uppdaterade docblock), så testet mockar nätverket i stället.
 */
async function valjArmeraSkicka(
  page: import('@playwright/test').Page,
  network: import('@msw/playwright').NetworkFixture,
  lage: keyof typeof PAMINNELSE_UTFALL,
) {
  network.use(http.post(EF('send-action-email'), () => json(PAMINNELSE_UTFALL[lage])));

  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');

  await page.getByRole('button', { name: /^Skicka till \d+/ }).click();
  await expect(page.getByRole('heading', { name: /Skickat|Inget skickades/ })).toBeVisible();
}

test.describe('promoverings-grinden — ariaSnapshot-referenser för åtgärds-/granskningsytan (ADR-103 B4, TASK-171.1)', () => {
  test('tomt läge — eventväljaren utan event', async ({ page }) => {
    await page.goto('/atgarder');
    await expect(page.getByTestId('atgardssida-tomt')).toBeVisible();
    await expect(page.getByTestId('atgardssida-tomt')).toMatchAriaSnapshot({
      name: 'atgardssida-tomt.aria.yml',
    });
  });

  test('mottagarurval — markerade deltagarkort medförda', async ({ page }) => {
    await gotoAtgarder(page);
    // Räknar-raden ÄR accordion-huvudet (se AtgardsSida.tsx § MottagarYta) —
    // listan är infälld från start, öppna den så deltagarkorten syns.
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByTestId('mottagar-kort')).toMatchAriaSnapshot({
      name: 'atgarder-mottagarurval.aria.yml',
    });
  });

  test('granskningsläge — urvalsfilter som biter, ifyllda platshållare', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-granskning.aria.yml',
    });
  });

  test('utfallsläge — allt gick fram', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'allt');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-allt.aria.yml',
    });
  });

  test('utfallsläge — delutfall', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'delvis');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-delvis.aria.yml',
    });
  });

  test('utfallsläge — inget gick fram', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'inget');
    await expect(page.getByTestId('granskning-yta')).toMatchAriaSnapshot({
      name: 'atgarder-utfall-inget.aria.yml',
    });
  });
});

/**
 * [TASK-171.5, AC #2, ADR-103 B2 steg 4] STALE-URL-BEVISET — samma mönster
 * som `eventsida-promoverings-grind.spec.ts` (TASK-145.6 AC #4), anpassat
 * till DENNA ytas faktiska mekanik: `PrototypeSwitcher`-monteringen är
 * riven ur båda routerna (`routes/_authenticated/atgarder.tsx`,
 * `routes/_authenticated/event/$eventId/atgarder.tsx`), men railens
 * URL-kontrakt (`?variant=<nyckel>&data=verklig`, ADR-074 beslut 1) är
 * generellt — en gammal bokmärkt eller delad länk kan fortfarande bära
 * dessa query-parametrar. Ingen kod i `AtgardsSida.tsx` eller de två
 * routerna har NÅGONSIN läst `variantParam`/`dataMode` (171.1/171.2:s
 * grep-verifierade fynd, upprepat här som del av detta bevis) — skillnaden
 * mot eventsidan är alltså att det inte finns någon gren att degradera
 * FRÅN, bara att bevisa att en stale query-sträng inte gör något alls.
 *
 * Båda testerna återanvänder de OFÖRÄNDRADE referensfilerna ovan
 * (`atgardssida-tomt.aria.yml` / `atgarder-mottagarurval.aria.yml`) —
 * exakt samma bevis-form som referens-grinden, bara med en stale
 * query-sträng i `page.goto`.
 */
test.describe('TASK-171.5 — stale-URL-beviset (rivningens AC #2)', () => {
  test('stale ?variant=&data= på /atgarder påverkar inte tomt läge', async ({ page }) => {
    await page.goto('/atgarder?variant=a&data=verklig');
    await expect(page.getByTestId('atgardssida-tomt')).toBeVisible();
    await expect(page.getByTestId('atgardssida-tomt')).toMatchAriaSnapshot({
      name: 'atgardssida-tomt.aria.yml',
    });
  });

  test('stale ?variant=&data= på /event/$eventId/atgarder påverkar inte mottagarurvalet', async ({
    page,
  }) => {
    await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder?variant=a&data=verklig`);
    await expect(page.getByTestId('eventet-block')).toBeVisible();
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByTestId('mottagar-kort')).toMatchAriaSnapshot({
      name: 'atgarder-mottagarurval.aria.yml',
    });
  });
});

/**
 * [TASK-171.3, PRD TASK-171 § Testbeslut — "A11y-golvet 11 består; axe-pass
 * i härdningen"] Axe-pass på den promoverade åtgärds-/granskningsytan, i
 * SAMTLIGA lägen referens-grinden ovan navigerar genom.
 *
 * SAMMA VENUE-VAL SOM TASK-162.4 (sibling-härdningen för eventsidans
 * promovering — se `eventsida-promoverings-grind.spec.ts` rad ~166–191 för
 * den fullständiga motiveringen, återgiven i korthet här): åtgärds-/
 * granskningsytan är en `_authenticated`-route, inte DEV-guardad — så
 * `npm run test:a11y` (skannar bara `/dev/primitives`+`/dev/patterns`) kan
 * inte nå den. Den strukturellt "rätta" staging-motsvarigheten
 * (`.staging.test.ts`, `chromium-authenticated`-projektet) kräver en riktig
 * staging-inloggning och port 5173 — en agent-worktree kan inte köra den
 * (mätt i denna skiva: port 5173 var upptagen av huvudkatalogens EGEN
 * dev-server vid körningstillfället, `lsof -i :5173`/`ps` verifierat mot
 * cwd `/Users/marcus/Repon/miranon-media-admin`, inte denna worktree — att
 * peka en `chromium-authenticated`-körning dit hade krockat med en
 * pågående session i huvudkatalogen, inte bara varit tekniskt olämpligt).
 * Den hermetiska fixturvärlden ovan är därför PRIMÄR skarv för a11y-golvet
 * här också, av samma skäl PRD TASK-162 § Testbeslut redan drog för
 * eventsidan.
 *
 * ÅTERANVÄNDER `gotoAtgarder`/`oppnaOchGranska`/`valjArmeraSkicka` DEKLARERADE
 * OVAN I SAMMA FIL — samma navigering som referens-grindens sex tester,
 * ingen andra sanning om hur man tar sig till varje läge.
 *
 * BETALNINGSPANELEN (`BetalningsSkrivYta`) ÖPPNAS i sista testet men INGEN
 * kryssruta/notering klickas — `useSetPaymentStatus`/`useUpdatePaymentNote`
 * instansieras vid montering men `mutate()` anropas aldrig av testet, så
 * ingen `update-record`-mock krävs i fixturvärlden: ingen begäran görs.
 * Skrivvägen i sig (vilka EF-operationer, mot vilken bas) är kartlagd som
 * statisk analys i kortets Implementation Notes — denna svit bevisar att
 * PANELENS FORM är ren, inte att servern svarar rätt.
 */
test.describe('TASK-171.3 — axe-pass på den promoverade åtgärds-/granskningsytan (ADR-103, härdningen)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  /** Kör axe över hela sidan; violations skrivs ut läsbart vid fällning. */
  async function axeNoll(page: import('@playwright/test').Page) {
    const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
    expect(
      resultat.violations,
      resultat.violations
        .map((v) => `[${v.impact ?? 'utan impact'}] ${v.id}: ${v.help}`)
        .join('\n'),
    ).toEqual([]);
  }

  test('tomt läge — eventväljaren utan event: axe 0', async ({ page }) => {
    await page.goto('/atgarder');
    await expect(page.getByTestId('atgardssida-tomt')).toBeVisible();
    await axeNoll(page);
  });

  test('hubben i vila — eventväljare + mottagar-yta, accordion stängd: axe 0', async ({ page }) => {
    await gotoAtgarder(page);
    await axeNoll(page);
  });

  test('mottagarurvalet öppet — markerade deltagarkort synliga: axe 0', async ({ page }) => {
    await gotoAtgarder(page);
    await page.getByRole('button', { name: /deltagare markerade/ }).click();
    await expect(page.getByTestId('mottagar-kort')).toBeVisible();
    await axeNoll(page);
  });

  test('åtgärdsraden expanderad i hubben (utan granskning) — förhandsvisningen synlig: axe 0', async ({
    page,
  }) => {
    // Skiljer sig från nästa test: HÄR stannar vi i hubben (ArbetsYta, rad
    // ~1516) i stället för att gå vidare till granskning-yta — den andra av
    // sidans TVÅ `TEXTYTA_KLASS`-rutor (den låsta förhandsvisningen i
    // GranskningsSida) täcks separat nedan.
    await gotoAtgarder(page);
    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();
    await expect(page.getByText('Din plats är bekräftad')).toBeVisible();
    await axeNoll(page);
  });

  test('granskningsläget öppet — urvalsfilter tillämpat, ifyllda platshållare: axe 0', async ({
    page,
  }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByTestId('granskning-yta')).toBeVisible();
    await axeNoll(page);
  });

  test('utfallsläge — allt gick fram: axe 0', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'allt');
    await axeNoll(page);
  });

  test('utfallsläge — delutfall: axe 0', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'delvis');
    await axeNoll(page);
  });

  test('utfallsläge — inget gick fram: axe 0', async ({ page, network }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka betalningspåminnelse');
    await valjArmeraSkicka(page, network, 'inget');
    await axeNoll(page);
  });

  test('betalningspanelen öppen (BetalningsSkrivYta) — ingen mutation triggad: axe 0', async ({
    page,
  }) => {
    await gotoAtgarder(page);
    await page.getByRole('button', { name: 'Pricka av och notera' }).click();
    // Scopat till betalningssektionen — "Anna Andersson" står även i
    // mottagar-ytans preview-pill och deltagarkortet ovanför (strict mode
    // ger flera träffar på osscopad text).
    const betalningar = page.locator('section[aria-labelledby="grupp-betalningar"]');
    await expect(betalningar.getByText('Anna Andersson')).toBeVisible();
    await axeNoll(page);
  });
});

/**
 * [TASK-171.3, kortets AC #1 andra hälften] Kvalitetsribbans tre lägen
 * (CLAUDE.md § Design-system: "Varje komponent ska klara prefers-contrast:
 * more, prefers-reduced-motion, print"). Samma `emulateMedia`-mönster som
 * `tests/a11y/NavCard.spec.ts`, tillämpat på HELA den promoverade ytan i
 * stället för en enskild bibliotekskomponent — plus en axe-scan i varje
 * läge: en strukturell CSS-punktkoll ensam bevisar inte att RESTEN av sidan
 * förblir grön i samma renderade tillstånd.
 */
test.describe('TASK-171.3 — kvalitetsribbans tre lägen på den promoverade ytan', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  test('hög-kontrast-läge: KORT_KLASS-ytorna får synlig kantlinje (prefers-contrast: more)', async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: 'more' });
    await gotoAtgarder(page);

    const eventetBlock = page.getByTestId('eventet-block');
    const kant = await eventetBlock.evaluate((el) => {
      const s = getComputedStyle(el);
      return { farg: s.borderTopColor, bredd: s.borderTopWidth, stil: s.borderTopStyle };
    });
    expect(kant.stil).toBe('solid');
    expect(kant.bredd).toBe('1px');

    // Färgen löses ur SAMMA token-kedja som klassen deklarerar
    // (`contrast-more:border-border-strong` → `--mm-border-strong`) via en
    // DOM-probe — computed-assertion, aldrig hårdkodad färg (L272).
    const strongToken = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-border-strong)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(kant.farg).toBe(strongToken);

    const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('reduced-motion: radernas hover-övergångar neutraliseras (prefers-reduced-motion: reduce)', async ({
    page,
  }) => {
    await gotoAtgarder(page);
    const rad = page.getByRole('button', { name: 'Pricka av och notera' });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const varaktighet = await rad.evaluate(
      (el) => Number.parseFloat(getComputedStyle(el).transitionDuration) || 0,
    );
    expect(varaktighet).toBeLessThanOrEqual(0.001);

    const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('print: sidhuvud, eventväljare och mottagar-yta förblir synliga', async ({ page }) => {
    await gotoAtgarder(page);
    await page.emulateMedia({ media: 'print' });

    await expect(page.getByRole('heading', { level: 1, name: 'Åtgärder' })).toBeVisible();
    await expect(page.getByTestId('eventet-block')).toBeVisible();
    await expect(page.getByRole('button', { name: /deltagare markerade/ })).toBeVisible();

    const resultat = await new AxeBuilder({ page }).withTags(WCAG_TAGGAR).analyze();
    expect(resultat.violations).toEqual([]);
  });
});
