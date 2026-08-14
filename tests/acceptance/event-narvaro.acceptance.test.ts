import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { AttendanceSchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6b L3 — Närvaro-vy (sessions-grupperad LÄS-vy via get-attendance).
 *
 * ACCEPTANCE-KLASSEN (task-59.6, ADR-080): filen flyttades hit ur e2e-sviten med
 * hela sitt bevisinnehåll intakt — a11y-assertionen inkluderad. Klassningen är
 * HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 17 restanrop,
 * samtliga typsnitt, noll skarpa.
 *
 * NAMNGRANNEN STANNAR: `event-narvaro-register.staging.test.ts` (det INLINE:ade
 * registret på detaljsidan) heter nästan samma sak men mäter 8 SKARPA anrop
 * (get-event-notes ×8) och hör därför till den skarpa klassen. Denna fil är den
 * STANDALONE /narvaro-routen. Snittet är mätdatans, aldrig filnamnets.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med `EF(namn)`
 * ur handlers-modulen och svaret med `json(...)`, aldrig som handskrivna strängar
 * — en överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * Mocken speglar EF-svaret `{ attendance: [...] }` (AttendanceSchema-rader, INKL.
 * personNamn). `get-attendance` ligger AVSIKTLIGT inte i normalläget: en delad
 * läsväg hade gjort ett glömt `use()` osynligt — här överskuggas den per test, och
 * ett test som glömmer sin överskuggning fälls av hermetik-vakten med adressen
 * namngiven.
 *
 * Täckning: sessions-gruppering i fast ordning, närvarande-räkning (lynchpin
 * Närvarande+Deltog online), "Ej avstämt"-kommande-event (förväntat, ej fel),
 * tom-state, fel (role=alert), läsbart personNamn (aldrig rec-ID), fokus→<h1> +
 * aria-live, loading aria-busy, axe 0. LÄS-vy → INGEN markera-knapp.
 */

const EVENT_ID = 'recNARVARO0000001';

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof AttendanceSchema>;

/** En komplett Attendance-rad (EF-svarets form, AttendanceSchema). */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recATT${Math.random().toString(36).slice(2, 10)}`,
    anmalanId: 'recANM0000000001',
    eventId: EVENT_ID,
    personId: 'recPER0000000001',
    personNamn: 'Anna Andersson',
    session: 'Dag 1',
    status: 'Närvarande',
    noteringar: null,
    avstamt: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

function mockAttendance(
  network: NetworkFixture,
  rows: Row[],
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release().
  // Gör loading-fönstret DETERMINISTISKT i stället för att racea en fast delayMs
  // mot realtid under parallell worker-last (T26 Landning B). Bärs nu av ett
  // obesvarat löfte i MSW-resolvern i stället för ett uppskjutet Route-objekt —
  // samma bevis, en mekanism (task-59.4:s form).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-attendance'), async () => {
      if (gate) await gate;
      return status === 200 ? json({ attendance: rows }) : json({ error: 'x' }, status);
    }),
  );
  return release;
}

/**
 * PARKERAD 2026-08-15 (TASK-214.4, ADR-103 B2 steg 1) — INTE riven, och
 * skillnaden är hela poängen.
 *
 * Närvaro-routens (`/event/$eventId/narvaro`) form är flippad: `CheckinPrototyp`
 * (dörrlistan, variant D) renderas OVILLKORLIGT. `EventAttendance` — den rena,
 * sessions-grupperade LÄS-listan denna svit prövar — renderas numera bara av
 * ingenting: routen monterar den inte längre. Komponenten finns kvar i koden
 * (`src/components/events/EventAttendance.tsx`) men är inte nåbar via normal
 * app-navigering, så samtliga sju fall i denna fil kan inte längre passera
 * (fel DOM, och `get-registrations` är dessutom omockad här eftersom D:s join
 * kräver den — testet skulle fela på fixtur-nivå innan det ens nådde sin
 * egen assertion).
 *
 * VARFÖR PARKERAD OCH INTE BORTTAGEN: ADR-102 B3 förbjuder rivning av det
 * gamla substratet före Marcus godkännande av den promoverade ytan.
 * `EventAttendance.tsx` + denna fil rivs TILLSAMMANS i TASK-214.7, i samma
 * landning — samma regel `.facit-policy.conf` bokför för markörer ("städas i
 * SAMMA landning som rivningen som gör den död, aldrig 'sen'") och samma
 * precedent som persondetaljens `person-note-edit.acceptance.test.ts`
 * (commit `f3c25520`). Att ta bort testet nu vore att förekomma godkännandet
 * med den ena halvan av en rivning.
 *
 * D-formens EGET täckande acceptance-test — läs, kvittensfönster, skriv-
 * vägen — bor i `event-checkin-dorrlistan.acceptance.test.ts` (TASK-214.2)
 * och `dorrlista-promoverings-grind.spec.ts` (TASK-214.3); ingen täckning
 * tappas genom att parkera denna fil.
 */
test.describe
  .skip('Närvaro-vy (Fas 6b L3 — sessions-grupperad LÄS-vy)', () => {
    test('sessions-gruppering + närvarande-räkning; fokus → <h1>', async ({ page, network }) => {
      mockAttendance(network, [
        row({ personNamn: 'Anna Andersson', session: 'Dag 1', status: 'Närvarande' }),
        row({ personNamn: 'Bo Bengtsson', session: 'Dag 1', status: 'Frånvarande' }),
        row({ personNamn: 'Cecilia Carlsson', session: 'Dag 1', status: 'Deltog online' }),
        row({ personNamn: 'Anna Andersson', session: 'Dag 2', status: 'Närvarande' }),
      ]);
      await page.goto(`/event/${EVENT_ID}/narvaro`);

      // <h1> = "Närvaro", fokuserad efter async-laddning.
      const heading = page.getByRole('heading', { level: 1, name: 'Närvaro' });
      await expect(heading).toBeVisible();
      await expect(heading).toBeFocused();

      // aria-live bekräftar att närvaron anlänt.
      await expect(page.getByText('Närvaro laddad.')).toHaveCount(1);

      // Två sessions-grupper (Dag 1, Dag 2) som h2-rubriker.
      await expect(page.getByRole('heading', { level: 2, name: 'Dag 1' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Dag 2' })).toBeVisible();

      // Dag 1: Närvarande + Deltog online = 2 av 3 (lynchpin-mängden).
      await expect(page.getByText('2 av 3 närvarande')).toBeVisible();
      // Dag 2: 1 av 1.
      await expect(page.getByText('1 av 1 närvarande')).toBeVisible();

      // Person-NAMN syns (aldrig record-ID), status som TEXT.
      await expect(page.getByText('Anna Andersson').first()).toBeVisible();
      await expect(page.getByText('Frånvarande')).toBeVisible();
      await expect(page.getByText('Deltog online')).toBeVisible();

      // LÄS-vy: ingen markera-/spara-närvarande-kontroll finns (write = framtida slice).
      // Namn-scopad (ej total button-count) så app-skalets chrome ej ger falskt negativ.
      await expect(
        page.getByRole('button', { name: /markera|spara|närvar|ändra|avstäm/i }),
      ).toHaveCount(0);

      // Tillbaka-länk → info-vyn.
      await expect(page.getByRole('link', { name: '← Tillbaka till eventet' })).toHaveAttribute(
        'href',
        `/event/${EVENT_ID}`,
      );
    });

    test('endast vissa sessioner: bara Föreläsning renderas (ingen tom Dag 1/Dag 2)', async ({
      page,
      network,
    }) => {
      mockAttendance(network, [
        row({ personNamn: 'Doris Dahl', session: 'Föreläsning', status: 'Närvarande' }),
      ]);
      await page.goto(`/event/${EVENT_ID}/narvaro`);

      await expect(page.getByRole('heading', { level: 2, name: 'Föreläsning' })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: 'Dag 1' })).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 2, name: 'Dag 2' })).toHaveCount(0);
    });

    test('kommande event: allt "Ej avstämt" → visas rakt av, ingen varnings-/fel-yta', async ({
      page,
      network,
    }) => {
      mockAttendance(network, [
        row({ personNamn: 'Erik Ek', session: 'Dag 1', status: 'Ej avstämt' }),
        row({ personNamn: 'Frida Falk', session: 'Dag 1', status: 'Ej avstämt' }),
      ]);
      await page.goto(`/event/${EVENT_ID}/narvaro`);

      // 0 av 2 närvarande — förväntat tillstånd för kommande event, ej fel.
      await expect(page.getByText('0 av 2 närvarande')).toBeVisible();
      await expect(page.getByText('Ej avstämt').first()).toBeVisible();
      // INGEN fel-yta (role=alert) för "Ej avstämt".
      await expect(page.getByRole('alert')).toHaveCount(0);
    });

    test('tomt event (inga deltaganden) → vänlig tom-text, ej fel', async ({ page, network }) => {
      mockAttendance(network, []);
      await page.goto(`/event/${EVENT_ID}/narvaro`);

      await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();
      await expect(
        page.getByText('Inga deltaganden registrerade för det här eventet än.'),
      ).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
    });

    test('personNamn null → "Namn saknas" (graciöst), aldrig krasch/tomt', async ({
      page,
      network,
    }) => {
      mockAttendance(network, [row({ personNamn: null, session: 'Dag 1', status: 'Närvarande' })]);
      await page.goto(`/event/${EVENT_ID}/narvaro`);
      await expect(page.getByText('Namn saknas')).toBeVisible();
    });

    test('fel (icke-2xx) → fel-UI via role=alert', async ({ page, network }) => {
      mockAttendance(network, [], { status: 404 });
      await page.goto(`/event/${EVENT_ID}/narvaro`);
      await expect(page.getByRole('alert')).toContainText('Kunde inte hämta närvaron');
    });

    test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
      // Håll EF-svaret öppet → loading-tillståndet är deterministiskt synligt medan
      // handlern väntar (ingen realtids-race mot en fast delayMs under parallell last).
      const release = mockAttendance(network, [row()], { manualRelease: true });
      await page.goto(`/event/${EVENT_ID}/narvaro`);
      await expect(page.getByText('Laddar närvaro…')).toBeVisible();
      // Släpp svaret → laddat tillstånd renderas.
      release();
      await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();
    });

    test('axe 0 violations på den renderade närvaro-vyn', async ({ page, network }) => {
      mockAttendance(network, [
        row({ personNamn: 'Anna Andersson', session: 'Dag 1', status: 'Närvarande' }),
        row({ personNamn: 'Bo Bengtsson', session: 'Föreläsning', status: 'Ej avstämt' }),
      ]);
      await page.goto(`/event/${EVENT_ID}/narvaro`);
      await expect(page.getByRole('heading', { level: 1, name: 'Närvaro' })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  });
