import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { http } from 'msw';
import type { z } from 'zod';
import type { MailLogEntrySchema } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

/**
 * Fas 6e L2 Landning 2 — Maillogg-vy (/mer/maillogg, LÄS-vy via get-mail-log,
 * GLOBAL lista, hela Utskickslogg, createdTime desc).
 *
 * ACCEPTANCE-KLASSEN (task-59.5, ADR-080): filen flyttades hit ur e2e-sviten
 * med hela sitt bevisinnehåll intakt — a11y-assertionerna inkluderade.
 * Klassningen är HÄRLEDD ur hermetik-mätningen (`.hermetik/rapport.jsonl`): 18
 * restanrop, samtliga typsnitt, noll skarpa.
 *
 * **Deterministisk via `network.use()`** — inte `page.route`: page-routes prövas
 * FÖRE MSW:s context-routes och hade lagt en andra avlyssningsmekanism ovanpå
 * fixturvärlden (tudelningen task-54.2 tog bort). Mönstret byggs med
 * `EF('get-mail-log')` ur handlers-modulen, aldrig som handskriven sträng — en
 * överskuggning vars mönster inte matchar faller igenom UTAN att något fälls
 * (den tysta fällan, `hermetic.ts` § Överskugga en delad handler).
 *
 * `get-mail-log` LIGGER INTE I NORMALLÄGET: ett test här som glömmer sin
 * överskuggning fälls av hermetik-vakten med adressen namngiven i stället för
 * att tyst rendera en främmande logg. Svarsformen är EF:ens egen
 * (`{ maillog }`, MailLogEntrySchema-rader) — snittet ligger vid protokollet.
 *
 * TOM-TILLSTÅND ÄR PRIMÄRT: Utskickslogg är tom tills L3 send-email loggar utskick.
 * Tom-vyn måste vara ärlig (icke-alarmerande) OCH axe-ren. Täckning: tom-tillstånd,
 * roster, öppningsgrad-formatering (decimal→%, null→"—", aldrig NaN/null), namn-
 * fallback, fel (role=alert), loading (manualRelease), axe 0 på BÅDE tom + ifylld.
 */

/** Härledd ur schemat, ej beskriven bredvid det (TASK-63) — se `acceptance-bas.ts` § fogen. */
type Row = z.infer<typeof MailLogEntrySchema>;

/** En komplett MailLogEntry-rad (EF-svarets form, MailLogEntrySchema). oppningsgrad
 * är DECIMAL 0–1; utskicksIds/skickatTill är rec-ID-arrayer (länkfält). */
function row(overrides: Partial<Row> = {}): Row {
  return {
    id: `recML${Math.random().toString(36).slice(2, 10)}`,
    utskicksNamn: 'Vårnyhetsbrev',
    utskicksIds: ['recBULK01'],
    skickatTill: ['recPER01', 'recPER02'],
    antalSkickade: 2,
    datum: '2026-05-02T10:00:00.000Z',
    oppningsgrad: 0.5,
    filterSnapshot: 'Segment: aktiva deltagare',
    mailutskickCopy: null,
    ...overrides,
  };
}

function mockMailLog(
  network: NetworkFixture,
  rows: Row[],
  { status = 200, manualRelease = false }: { status?: number; manualRelease?: boolean } = {},
): () => void {
  // manualRelease (opt-in): håll EF-svaret öppet tills testet kallar release() →
  // deterministiskt loading-fönster (ingen race mot fast delayMs / cold-chunk
  // lazy-load); speglar event-anmalda/mer-intresserade (T26 Landning B).
  // Parkeringen bärs av ett obesvarat löfte i MSW-resolvern (task-59.4:s form).
  let release = () => {};
  const gate = manualRelease ? new Promise<void>((resolve) => (release = resolve)) : null;
  network.use(
    http.get(EF('get-mail-log'), async () => {
      if (gate) await gate;
      return status === 200 ? json({ maillog: rows }) : json({ error: 'x' }, status);
    }),
  );
  return release;
}

test.describe('Maillogg-vy (Fas 6e L2 L2 — LÄS-vy via get-mail-log)', () => {
  test('tom-tillstånd (NORMALT): ärlig icke-alarmerande text, 0 utskick, ej fel, fokus→h1', async ({
    page,
    network,
  }) => {
    mockMailLog(network, []);
    await page.goto('/mer/maillogg');

    // <h1> = "Maillogg", fokuserad efter async-laddning (tom är giltigt laddat).
    const heading = page.getByRole('heading', { level: 1, name: 'Maillogg' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // Ärlig tom-text (systemet är nytt, inte trasigt) — INGEN fel-yta.
    await expect(page.getByText('Inga mailutskick har loggats än.')).toBeVisible();
    await expect(page.getByText('0 utskick')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('roster renderas (namn + datum + mottagare + öppningsgrad) + summa; fokus → <h1>', async ({
    page,
    network,
  }) => {
    mockMailLog(network, [
      row({
        utskicksNamn: 'Vårnyhetsbrev',
        datum: '2026-05-02T10:00:00.000Z',
        antalSkickade: 2,
        oppningsgrad: 0.5,
      }),
      row({
        utskicksNamn: 'Höstkampanj',
        datum: '2026-05-01T09:00:00.000Z',
        antalSkickade: 5,
        oppningsgrad: 0.2,
      }),
    ]);
    await page.goto('/mer/maillogg');

    const heading = page.getByRole('heading', { level: 1, name: 'Maillogg' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();

    // aria-live bekräftar att loggen anlänt.
    await expect(page.getByText('Maillogg laddad.')).toHaveCount(1);

    // Antal-summa som TEXT.
    await expect(page.getByText('2 utskick')).toBeVisible();

    // Utskicksnamn (aldrig record-ID).
    await expect(page.getByText('Vårnyhetsbrev')).toBeVisible();
    await expect(page.getByText('Höstkampanj')).toBeVisible();

    // Datum formaterat sv-SE (aldrig rå ISO).
    await expect(page.getByText('2026-05-02')).toBeVisible();
    await expect(page.getByText('2026-05-01')).toBeVisible();

    // Mottagar-antal + öppningsgrad (decimal → %).
    await expect(page.getByText('2 mottagare')).toBeVisible();
    await expect(page.getByText('5 mottagare')).toBeVisible();
    await expect(page.getByText('50 %')).toBeVisible();
    await expect(page.getByText('20 %')).toBeVisible();

    // Tillbaka-länk → Mer-landningen. SIDRAM (TASK-299.9): namnet är EXAKT
    // `tillbakaEtikett` — ingen "←"-prefix, det var den äldre textlänkens
    // form. Chevronen bär det tillgängliga namnet ensam (ikon-ENSAM knapp).
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('öppningsgrad-formatering: decimal → "%", null (0 skickade) → "—", aldrig NaN/null', async ({
    page,
    network,
  }) => {
    mockMailLog(network, [
      row({ utskicksNamn: 'Med öppningar', antalSkickade: 10, oppningsgrad: 0.5 }),
      // Div-by-zero: 0 skickade → Airtable ger null → vyn visar "—", ALDRIG "NaN %".
      row({ utskicksNamn: 'Inga skickade', antalSkickade: 0, oppningsgrad: null }),
    ]);
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();

    await expect(page.getByText('50 %')).toBeVisible();
    await expect(page.getByText('—')).toBeVisible();
    // Ingen NaN/null läcker till UI:t (null hanteras före formatering).
    await expect(page.getByText(/NaN/)).toHaveCount(0);
    await expect(page.getByText(/null\s*%/)).toHaveCount(0);
  });

  test('namn-fallback: utskicksNamn=null + mailutskickCopy=null → "Namnlöst utskick"', async ({
    page,
    network,
  }) => {
    mockMailLog(network, [row({ utskicksNamn: null, mailutskickCopy: null })]);
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Namnlöst utskick')).toBeVisible();
  });

  test('fel (4xx, klient-fel) → fel-UI via role=alert (ingen retry)', async ({ page, network }) => {
    // 4xx → no-retry-grenen: isError direkt, ingen backoff.
    mockMailLog(network, [], { status: 404 });
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('alert')).toContainText('Kunde inte hämta maillogg');
  });

  test('SidRam-sidkrom (TASK-299.9): chevronen navigerar till Mer, närvarande i tomt OCH felläge', async ({
    page,
    network,
  }) => {
    // Tomt läge — sidkromet ska bära samma chevron/länk som ifylld vy.
    mockMailLog(network, []);
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();

    const tillbaka = page.getByRole('link', { name: 'Tillbaka till Mer' });
    await expect(tillbaka).toBeVisible();
    await tillbaka.click();
    // Round-trip: chevronen navigerar VERKLIGEN till Mer-landningen, inte
    // bara ett `href`-attribut som aldrig prövas.
    await expect(page.getByRole('heading', { level: 1, name: 'Mer' })).toBeVisible();
    await expect(page).toHaveURL('/mer');
  });

  test('SidRam-sidkrom (TASK-299.9): chevronen närvarande i felläge (404)', async ({
    page,
    network,
  }) => {
    mockMailLog(network, [], { status: 404 });
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toHaveAttribute(
      'href',
      '/mer',
    );
  });

  test('loading-state är tillgängligt (aria-busy + status)', async ({ page, network }) => {
    // Håll EF-svaret öppet → loading deterministiskt synligt (ingen realtids-race).
    const release = mockMailLog(network, [row()], { manualRelease: true });
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Laddar maillogg…')).toBeVisible();
    // Släpp svaret → laddat tillstånd renderas.
    release();
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();
  });

  test('axe 0 violations på TOM vy (primärt tillstånd)', async ({ page, network }) => {
    mockMailLog(network, []);
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Inga mailutskick har loggats än.')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på IFYLLD vy', async ({ page, network }) => {
    mockMailLog(network, [
      row({ utskicksNamn: 'Vårnyhetsbrev', oppningsgrad: 0.5 }),
      row({ utskicksNamn: 'Inga skickade', antalSkickade: 0, oppningsgrad: null }),
    ]);
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('heading', { level: 1, name: 'Maillogg' })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  // TASK-299.9 DoD #5 ("axe 0 … i alla tillstånd … fel"): de två axe-testen
  // ovan täckte TOM och IFYLLD men aldrig FEL-läget — hålet fanns redan
  // före denna skiva. SidRam-sidkromet ändrar samma DOM i alla fyra
  // tillstånd (pending/error/tom/ifylld), så täckningen utvidgas här.
  test('axe 0 violations på FELLÄGE (404, role=alert)', async ({ page, network }) => {
    mockMailLog(network, [], { status: 404 });
    await page.goto('/mer/maillogg');
    await expect(page.getByRole('alert')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('axe 0 violations på LADDLÄGE (aria-busy skeleton)', async ({ page, network }) => {
    // manualRelease: håll svaret öppet så laddläget är deterministiskt
    // synligt när axe scannar (ingen race mot ett svar som redan hunnit in).
    mockMailLog(network, [row()], { manualRelease: true });
    await page.goto('/mer/maillogg');
    await expect(page.getByText('Laddar maillogg…')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
