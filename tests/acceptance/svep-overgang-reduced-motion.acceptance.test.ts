import { http } from 'msw';
import type { z } from 'zod';
import type { EventSchema, RegistrationSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-241.5 — WOW-övergångens AC #2: prefers-reduced-motion neutraliserar
 * HELA transitionen (Modal-skalningen/origin + `--animate-mm-avsloj`-stagern
 * på triadens sektioner). SAMMA fixtur-/mock-mönster som
 * `svep-bekraftelse-send.acceptance.test.ts` (TASK-241.3) — egen, minimal
 * kopia (ETT event, EN mottagare räcker för att öppna ytan; sändvägen
 * testas inte här, den söms redan av den filen).
 *
 * MÖNSTRET ÄR SAMMA SOM `tests/e2e/shell.staging.test.ts`s "DoD 8"-test
 * (`base.css`s globala `prefers-reduced-motion: reduce`-regel):
 * `page.emulateMedia({ reducedMotion: 'reduce' })` + `getComputedStyle(...)
 * .transitionDuration`/`.animationDuration` — `> 0` OCH `< 0,001` (0,01 ms,
 * base.css:s `!important`-klampning) i stället för `=== 0`, eftersom `0`
 * hade betytt att regeln INTE ens träffade elementet (samma kommentar som
 * det testet bär).
 *
 * BÅDA RIKTNINGARNA BEVISADE (dubbelriktad grind-disciplin, CLAUDE.md
 * § Verifiera med CI:s exakta kommandon): det FÖRSTA testet nedan är den
 * POSITIVA kontrollen (reduced-motion klampar) — det ANDRA är den NEGATIVA
 * kontrollen (normal motion gör INTE det, samma element, samma selektorer)
 * så att den positiva kontrollen inte råkar vara en vacuous sanning (t.ex.
 * en selektor som aldrig matchar något och därför alltid "består").
 */

type RegRow = z.infer<typeof RegistrationSchema>;
type EventRow = z.infer<typeof EventSchema>;

function reg(overrides: Partial<RegRow> = {}): RegRow {
  return {
    id: `recR${Math.random().toString(36).slice(2, 10)}`,
    namn: null,
    fornamn: 'Anna',
    efternamn: 'Andersson',
    email: 'anna@example.se',
    telefon: '070-1111111',
    eventNamn: 'Sommarkurs i akvarell',
    ort: 'Uppsala',
    status: 'Obekräftad',
    flagga: 'Ny anmälan',
    anmalningsavgift: 'Ej mottagen',
    slutbetalning: 'Ej mottagen',
    betalningspaminnelseSkickad: null,
    inskickad: '2026-06-01T10:00:00.000Z',
    motivering: null,
    tidigareErfarenhet: null,
    antalPlatser: 1,
    notering: null,
    eventId: 'recEventOvergang',
    personId: 'recPersonOvergang',
    ...overrides,
  };
}

function ev(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: 'recEventOvergang',
    eventlabel: 'EVT',
    eventNamn: 'Sommarkurs i akvarell',
    typ: 'Kurs',
    ort: 'Uppsala',
    startdatum: '2026-12-01',
    slutdatum: '2026-12-02',
    tidKvarTillEvent: null,
    maxPlatser: 20,
    antalAnmalda: 5,
    platserKvar: 15,
    anmaldBelaggning: 0.25,
    bekraftadBelaggning: 0.2,
    antalNyaAnmalningar: 1,
    antalAnmalningsavgifter: 3,
    antalSlutbetalningar: 1,
    antalSlutbetalningFelande: 0,
    status: 'Planerat',
    ...overrides,
  };
}

const EVENTS = [ev()];
const REGISTRATIONS = [reg()];

function mockDashboard(network: { use: (...h: ReturnType<typeof http.get>[]) => void }) {
  network.use(
    http.get(EF('get-registrations'), () => json({ registrations: REGISTRATIONS })),
    http.get(EF('get-events'), () => json({ events: EVENTS })),
  );
}

async function gotoHemOchOppnaSvepet(page: Page) {
  await page.goto('/hem');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Bekräfta alla', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bekräfta alla', exact: true })).toBeVisible();
}

/** Läser precis de element/egenskaper som TASK-241.5 lade till/ändrade i
    `Hem.tsx` (Modal-skalningen, `origin-top`-elementet) och `SvepOverlay.tsx`
    (`--animate-mm-avsloj`-stagern på triadens första sektion). */
async function lasOvergangsstilar(page: Page) {
  return page.evaluate(() => {
    const modal = document.querySelector('[class*="origin-top"]');
    const avsloj = document.querySelector('[class*="animate-mm-avsloj"]');
    return {
      modalFound: !!modal,
      modalTransitionDuration: modal ? getComputedStyle(modal).transitionDuration : null,
      avslojFound: !!avsloj,
      avslojAnimationDuration: avsloj ? getComputedStyle(avsloj).animationDuration : null,
    };
  });
}

test.describe('WOW-övergången — prefers-reduced-motion neutraliserar hela transitionen (TASK-241.5 AC #2)', () => {
  test('POSITIV KONTROLL: reduced-motion klampar Modal-skalningen OCH avslöj-stagern till ~0,01 ms', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHemOchOppnaSvepet(page);

    const stilar = await lasOvergangsstilar(page);
    expect(stilar.modalFound).toBe(true);
    expect(stilar.avslojFound).toBe(true);

    const modalMs = Number.parseFloat(stilar.modalTransitionDuration ?? '');
    const avslojMs = Number.parseFloat(stilar.avslojAnimationDuration ?? '');
    // base.css sätter 0.01ms !important — > 0 (annars träffade regeln inte
    // elementet alls) men < 1ms (samma dubbla golv som shell.staging.test.ts
    // "DoD 8"). Enheten är sekunder i getComputedStyle-strängen.
    expect(modalMs).toBeGreaterThan(0);
    expect(modalMs).toBeLessThan(0.001);
    expect(avslojMs).toBeGreaterThan(0);
    expect(avslojMs).toBeLessThan(0.001);
  });

  test('NEGATIV KONTROLL: normal motion (ingen emulering) klampar INTE — Modal-durationen är 300ms, ett äkta bevis att testet ovan mäter något verkligt', async ({
    page,
    network,
  }) => {
    mockDashboard(network);
    // INGEN emulateMedia här — standardläget (no-preference).
    await gotoHemOchOppnaSvepet(page);

    const stilar = await lasOvergangsstilar(page);
    expect(stilar.modalFound).toBe(true);
    expect(stilar.avslojFound).toBe(true);

    const modalMs = Number.parseFloat(stilar.modalTransitionDuration ?? '');
    // Vilostilens duration (se Hem.tsx:s docblock § WOW-ÖVERGÅNGEN för VARFÖR
    // den sitter på vilostilen och inte på `data-[entering]:`) — 0.3s.
    expect(modalMs).toBeCloseTo(0.3, 2);
  });
});
