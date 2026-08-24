import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Hem-vyns BEVAKNINGSRAD, båda radtyperna
 * (`ADR-103` B4; TASK-291 AC #3 + TASK-303).
 *
 * ── VAD DEN LÅSER ────────────────────────────────────────────────────────
 *
 * Ett `ariaSnapshot`-PAR per radtyp och vyport, mätt mot den PROMOVERADE ytan
 * (`/hem`, `src/components/hem/Bevakningsrad.tsx`). En grön körning betyder
 * EN sak: raden har samma tillgänglighetsträd som Marcus godkände — ingen
 * ny regression har smugit in sedan promoveringen.
 *
 * [FÖRE-LÄGET ÄR RIVET — TASK-291/TASK-303, 2026-08-23] Filen bar
 * ursprungligen BÅDA halvorna: FÖRE mot prototypens variant-läge
 * (`/dev/hem-atgardsko-prototyp?variant=a`, en EGEN fil på en EGEN route,
 * `AtgardskoRadVarianter.tsx`) och EFTER mot den promoverade ytan, mätta MOT
 * VARANDRA så referensen inte kunde regenereras cirkulärt från den
 * promoverade ytan självt. `ADR-103` B2 steg 4 (rivningen, EFTER Marcus
 * granskat och godkänt den promoverade ytan) tog bort prototyp-routen och
 * `AtgardskoRadVarianter.tsx` i sin helhet — FÖRE-testerna och
 * `gotoPrototyp` nedan är därför tagna bort, och filen har bytt roll till
 * REN REGRESSIONSLÅS, samma rollbyte `messagebox-promoverings-grind.spec.ts`
 * bokför i sitt eget huvud efter s109. Referenserna under `__aria__/` är
 * INTE rörda av rivningen — de är historikens enda bevis på att
 * promoveringen tog rätt form, och att de förblir gröna är hela poängen.
 *
 * ── VARFÖR RADEN, INTE LISTAN ────────────────────────────────────────────
 *
 * Snapshotten tas per `<li>`, inte på hela `<ul aria-label="Bevakningar">`.
 * Skälet är ordningen: den rivna prototyp-routen visade deltagarinfo-raden
 * först (den var jämförelse-referensen fyndet pekade ut), medan `/hem` visar
 * åtgärdskö-raden först (en app-bred datakorrekthetsflagga före en
 * per-event-observation, se `Bevakningsrad.tsx` § ORDNING). Den ordningen är
 * redan låst av `tests/acceptance/hem.acceptance.test.ts` § Blockordningen;
 * att blanda in den här hade bara gjort paret ojämförbart utan att bevisa
 * något nytt.
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR (`ADR-103` B4): deterministiskt, noll
 * nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT NAMN. Pixel-diff är den
 * bokförda eskaleringsvägen OM `ariaSnapshot` empiriskt missar en
 * formskillnad — eskalering på evidens, inte misstanke.
 *
 * ── ÄRLIGHET OM VAR GRINDEN FÄLLER ───────────────────────────────────────
 *
 * `tests/visual/` körs INTE av blockerande CI (enda träffen på
 * `npm run test:visual` i `.github/workflows/` är `visual-baselines.yml`, ett
 * `workflow_dispatch`-jobb). Det LEVANDE låset för samma yta bor i
 * `tests/acceptance/hem.acceptance.test.ts` (höjdlåset, copyn, axe) i ett
 * jobb som faktiskt fäller en PR. Denna fil är promoverings-BEVISET och
 * form-referensen; den är inte ett skydd som kan åberopas.
 */

type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

/**
 * Fixturen speglade ursprungligen den (sedan rivna) prototyp-routens
 * hårdkodade demodata EXAKT: eventnamnet "Demo: Fjärrskådning", 10 dagar
 * kvar, 3 kvarstående i eftersläntrar-läget och 12 i åtgärdskön. Talen är
 * inte valda för att vara snygga — de måste matcha referensfilerna under
 * `__aria__/`, som fångades ur den formen, annars jämför testet två olika
 * strängar och blir grönt av fel skäl.
 */
const DEMO_EVENT_ID = 'recBevDemoPromo';
const DEMO_EVENT_NAMN = 'Demo: Fjärrskådning';
/** `bevakningar()` avrundar `(start − idagStart)/dygn`; fixturvärldens klocka
    står på 2026-09-15 (`fixture-data.ts` FROZEN_NOW), så detta datum ger
    exakt "10 dagar kvar" — samma sträng referensfilerna bär. */
const DEMO_STARTDATUM = '2026-09-25';
/** Den rivna prototypens `ANTAL_DEMO` — talet ur QA-fyndet 284.5. */
const ATGARDSKO_ANTAL = 12;
/** Den rivna prototypens `REFERENS_EVENTINFO_RAD.antalUtanEventinfo`. */
const UTAN_DELTAGARINFO = 3;

function reg(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: DEMO_EVENT_NAMN,
    ort: 'Uppsala',
    status: 'Bekräftad (mail skickat)',
    flagga: null,
    anmalningsavgift: 'Mottagen',
    slutbetalning: 'Mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-09-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: DEMO_EVENT_ID,
    personId: null,
    eventmatchning: 'OK',
    deltagarinfoSkickad: null,
    ...overrides,
  };
}

function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: DEMO_EVENT_ID,
    eventlabel: 'Demo',
    eventNamn: DEMO_EVENT_NAMN,
    typ: 'Kurs',
    ort: 'Uppsala',
    startdatum: DEMO_STARTDATUM,
    slutdatum: DEMO_STARTDATUM,
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 14,
    platserKvar: 6,
    anmaldBelaggning: 0.7,
    bekraftadBelaggning: 0.6,
    antalNyaAnmalningar: 0,
    antalAnmalningsavgifter: 0,
    antalSlutbetalningar: 0,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

/**
 * Registreringarna som ger EXAKT de två rader referensfilerna bär.
 *
 * Eftersläntrar-läget kräver att NÅGON bekräftad redan bär stämpeln (annars
 * blir läget `'ej-skickad'` och copyn en annan) — därav den fjärde raden.
 * Åtgärdskö-raderna är eventlösa och obekräftade, så de kan inte råka läcka in
 * i eventets egen räkning.
 */
function fixturRader(): RegRow[] {
  const utanStampel = Array.from({ length: UTAN_DELTAGARINFO }, (_, i) =>
    reg({ fornamn: `Utan${i + 1}`, deltagarinfoSkickad: null }),
  );
  const medStampel = reg({ fornamn: 'Redan', deltagarinfoSkickad: '2026-09-10T08:00:00.000Z' });
  const atgardsko = Array.from({ length: ATGARDSKO_ANTAL }, (_, i) =>
    reg({
      fornamn: `Flagg${i + 1}`,
      eventId: null,
      status: 'Obekräftad',
      eventmatchning: 'Utan event',
    }),
  );
  return [...utanStampel, medStampel, ...atgardsko];
}

/**
 * Väntar in raderna — och det är INTE bara en väntan.
 *
 * `toMatchAriaSnapshot` generaliserar siffror till `\d+` när referensen
 * skrivs (mätt: referensfilerna bär `/\d+ dagar kvar/` och
 * `/\d+ kräver åtgärd/`). Snapshotten skulle därför förbli grön även om
 * ytan visade ANDRA tal än de referensen fångades med. De tre literalerna
 * här stänger det hålet: exakt samma strängar krävs, så snapshotten
 * bevisar strukturen och dessa assertions bevisar copyn.
 */
async function forankraRaderna(page: Page) {
  // Scopat till listan, inte till sidan: `/hem` visar "10 dagar kvar" även i
  // "Nästa event"-heroet (samma fixtur-event), och en sidbred lokator hade
  // fällt på strict mode i stället för på det den mäter.
  const lista = page.getByRole('list', { name: 'Bevakningar' });
  await expect(lista).toBeVisible();
  await expect(lista.getByText(`${ATGARDSKO_ANTAL} kräver åtgärd`)).toBeVisible();
  await expect(lista.getByText('10 dagar kvar')).toBeVisible();
  await expect(lista.getByText(`${UTAN_DELTAGARINFO} nya saknar deltagarinfo`)).toBeVisible();
}

/** Den promoverade, ovillkorliga ytan i produktionsvyn. */
async function gotoPromoverad(page: Page) {
  await page.goto('/hem');
  await forankraRaderna(page);
}

/**
 * Radtyperna plockas på sin INTERAKTIONS-primitiv, inte på sin position:
 * deltagarinfo-raden är en knapp (öppnar svepet PÅ Hem), åtgärdskö-raden en
 * länk (navigerar bort). Det är exakt den skillnad `Bevakningsrad.tsx`
 * § TVÅ RADTYPER beskriver, och den håller på båda ytorna oavsett ordning.
 */
function deltagarinfoRad(page: Page) {
  return page
    .getByRole('list', { name: 'Bevakningar' })
    .getByRole('listitem')
    .filter({ has: page.getByRole('button') });
}

function atgardskoRad(page: Page) {
  return page
    .getByRole('list', { name: 'Bevakningar' })
    .getByRole('listitem')
    .filter({ has: page.getByRole('link') });
}

test.describe('promoverings-grinden — bevakningsradens två radtyper (ADR-103 B4)', () => {
  test('deltagarinfo-raden på den promoverade Hem-ytan', async ({ page, network }) => {
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: fixturRader() })),
      http.get(EF('get-events'), () => json({ events: [ev()] })),
    );
    await gotoPromoverad(page);
    await expect(deltagarinfoRad(page)).toMatchAriaSnapshot({
      name: 'bevakningsrad-deltagarinfo.aria.yml',
    });
  });

  test('åtgärdskö-raden på den promoverade Hem-ytan', async ({ page, network }) => {
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: fixturRader() })),
      http.get(EF('get-events'), () => json({ events: [ev()] })),
    );
    await gotoPromoverad(page);
    await expect(atgardskoRad(page)).toMatchAriaSnapshot({
      name: 'bevakningsrad-atgardsko.aria.yml',
    });
  });
});

/**
 * [TASK-314, 299.10 steg 10] prefers-contrast: more. Samma `emulateMedia`-
 * mönster som `dorrlista-promoverings-grind.spec.ts` rad ~746-782. `RAD_YTA`
 * (`Bevakningsrad.tsx` rad ~191, gemensam för båda radtyperna) bär
 * `contrast-more:border-(--mm-navcard-border-contrast)`, som i sin tur löser
 * till SAMMA `--mm-border-strong`-token dörrlistans referens prövar
 * (`components.css` rad 241). Åtgärdskö-raden valdes som probe — samma
 * `RAD_YTA`-klass som deltagarinfo-raden, så en mätning täcker båda
 * radtyperna strukturellt. Ingen `ariaSnapshot` här — dörrlistans eget
 * kontrast-test bär ingen heller, strukturen ändras inte av emuleringen,
 * bara beräknade stilar.
 */
test.describe('TASK-314 — prefers-contrast: more (299.10 steg 10)', () => {
  const WCAG_TAGGAR = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  test('hög-kontrast-läge: bevakningsradens kant får synlig kantlinje', async ({
    page,
    network,
  }) => {
    await page.emulateMedia({ contrast: 'more' });
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: fixturRader() })),
      http.get(EF('get-events'), () => json({ events: [ev()] })),
    );
    await gotoPromoverad(page);

    const rad = atgardskoRad(page).getByRole('link');
    const kant = await rad.evaluate((el) => {
      const s = getComputedStyle(el);
      return { farg: s.borderTopColor, bredd: s.borderTopWidth, stil: s.borderTopStyle };
    });
    expect(kant.stil).toBe('solid');
    expect(kant.bredd).toBe('1px');

    const contrastToken = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-navcard-border-contrast)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(kant.farg).toBe(contrastToken);

    const resultat = await new AxeBuilder({ page })
      .withTags(WCAG_TAGGAR)
      .include('[aria-label="Bevakningar"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
