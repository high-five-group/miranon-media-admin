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
 * Ett `ariaSnapshot`-PAR per radtyp och vyport. Referensen fångades ur
 * PROTOTYPENS variant-läge (`/dev/hem-atgardsko-prototyp?variant=a`, den form
 * Marcus godkände i S111 Del 5) och jämförs mot den PROMOVERADE ytan
 * (`/hem`, `src/components/hem/Bevakningsrad.tsx`). En grön körning betyder
 * EN sak: raden har samma tillgänglighetsträd i prototypen och i
 * produktionen — formen följde med promoveringen, ingenting annat smög in.
 *
 * ── VARFÖR BÅDA HALVORNA LIGGER I SAMMA FIL, TILL SKILLNAD FRÅN SYSKONEN ──
 *
 * `personer-`/`eventsida-`-grindarna kunde bara bära EFTER-halvan i koden:
 * deras variant-gren låg bakom ett `?variant=`-villkor i SAMMA komponent, så
 * FÖRE-läget upphörde att existera i samma sekund villkoret flippades — de
 * fick låsa referensen i en egen commit före flippen och sedan peka om
 * lokatorn. Här är prototypen en EGEN fil på en EGEN route
 * (`AtgardskoRadVarianter.tsx`), orörd av promoveringen. Båda ytorna finns
 * alltså samtidigt, och då är det starkare att låta grinden mäta dem MOT
 * VARANDRA än att bara låsa den ena: prototyp-halvan nedan skyddar mot att
 * referensen tyst regenereras från den promoverade ytan (vilket hade gjort
 * paret cirkulärt och därmed värdelöst).
 *
 * VID RIVNINGEN (`ADR-103` B2 steg 4, EFTER Marcus granskat den promoverade
 * ytan) försvinner prototyp-routen. Då ska FÖRE-testerna nedan tas bort och
 * filen byta roll till REGRESSIONSLÅS — samma rollbyte
 * `personer-promoverings-grind.spec.ts` bokför i sitt eget huvud.
 * Referenserna under `__aria__/` rörs INTE av det bytet; att de förblir
 * gröna är hela poängen.
 *
 * ── VARFÖR RADEN, INTE LISTAN ────────────────────────────────────────────
 *
 * Snapshotten tas per `<li>`, inte på hela `<ul aria-label="Bevakningar">`.
 * Skälet är ordningen: prototyp-routen visar deltagarinfo-raden först (den är
 * jämförelse-referensen fyndet pekar ut), medan `/hem` visar åtgärdskö-raden
 * först (en app-bred datakorrekthetsflagga före en per-event-observation, se
 * `Bevakningsrad.tsx` § ORDNING). Den ordningen är redan låst av
 * `tests/acceptance/hem.acceptance.test.ts` § Blockordningen; att blanda in
 * den här hade bara gjort paret ojämförbart utan att bevisa något nytt.
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
 * Fixturen speglar prototyp-routens hårdkodade demodata EXAKT
 * (`src/routes/dev/hem-atgardsko-prototyp.tsx`): eventnamnet
 * "Demo: Fjärrskådning", 10 dagar kvar, 3 kvarstående i eftersläntrar-läget
 * och 12 i åtgärdskön. Talen är inte valda för att vara snygga — de MÅSTE
 * vara prototypens, annars jämför paret två olika strängar och blir grönt av
 * fel skäl.
 */
const DEMO_EVENT_ID = 'recBevDemoPromo';
const DEMO_EVENT_NAMN = 'Demo: Fjärrskådning';
/** `bevakningar()` avrundar `(start − idagStart)/dygn`; fixturvärldens klocka
    står på 2026-09-15 (`fixture-data.ts` FROZEN_NOW), så detta datum ger
    exakt "10 dagar kvar" — samma sträng prototypen visar. */
const DEMO_STARTDATUM = '2026-09-25';
/** Prototypens `ANTAL_DEMO` — talet ur QA-fyndet 284.5. */
const ATGARDSKO_ANTAL = 12;
/** Prototypens `REFERENS_EVENTINFO_RAD.antalUtanEventinfo`. */
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
 * Registreringarna som ger EXAKT prototypens två rader.
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
 * Skarven båda halvorna delar — och den är INTE bara en väntan.
 *
 * `toMatchAriaSnapshot` generaliserar siffror till `\d+` när referensen
 * skrivs (mätt: referensfilerna nedan bär `/\d+ dagar kvar/` och
 * `/\d+ kräver åtgärd/`). Paret skulle därför förbli grönt även om de två
 * ytorna visade OLIKA tal. De tre literalerna här stänger det hålet: exakt
 * samma strängar krävs på båda sidor, så snapshotten bevisar strukturen och
 * dessa assertions bevisar copyn.
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

/** FÖRE-halvan: prototypens variant-läge, den form Marcus godkände. */
async function gotoPrototyp(page: Page) {
  await page.goto('/dev/hem-atgardsko-prototyp?variant=a');
  await forankraRaderna(page);
}

/** EFTER-halvan: den promoverade, ovillkorliga ytan i produktionsvyn. */
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
  test('FÖRE — deltagarinfo-raden i prototypens variant-läge', async ({ page }) => {
    await gotoPrototyp(page);
    await expect(deltagarinfoRad(page)).toMatchAriaSnapshot({
      name: 'bevakningsrad-deltagarinfo.aria.yml',
    });
  });

  test('FÖRE — åtgärdskö-raden i prototypens variant-läge', async ({ page }) => {
    await gotoPrototyp(page);
    await expect(atgardskoRad(page)).toMatchAriaSnapshot({
      name: 'bevakningsrad-atgardsko.aria.yml',
    });
  });

  test('EFTER — deltagarinfo-raden på den promoverade Hem-ytan', async ({ page, network }) => {
    network.use(
      http.get(EF('get-registrations'), () => json({ registrations: fixturRader() })),
      http.get(EF('get-events'), () => json({ events: [ev()] })),
    );
    await gotoPromoverad(page);
    await expect(deltagarinfoRad(page)).toMatchAriaSnapshot({
      name: 'bevakningsrad-deltagarinfo.aria.yml',
    });
  });

  test('EFTER — åtgärdskö-raden på den promoverade Hem-ytan', async ({ page, network }) => {
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
