import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-147.7, ADR-109 — "Skicka kvitto" skarpt ände-till-ände (kvittoseriens
 * ENDA UI-ingång, `AtgardsSida.tsx` § `SkickaKvittoKnapp`).
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR): att
 * knappen (1) syns ENDAST när betalningen redan är Mottagen (AKTIV-handling-
 * regeln, Marcus-beslut a — aldrig automatik), (2) skickar en VERKLIG POST
 * med rätt kroppskontrakt (registrationId/eventId/betalning/belopp/
 * betalsätt/idempotencyKey), (3) redovisar servernumret (kvittonummer) på
 * lyckad sändning och skälet på en avvisad, (4) annonserar utfallet för
 * skärmläsare. Att EF:en SJÄLV allokerar unikt/beständigt/server-side är
 * TASK-147.7:s EGET bevis (`tests/api/receipt-numbering.test.ts` AC #2,
 * `tests/api/send-receipt.test.ts`) — inte upprepat här.
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, delade `get-events`/
 * `get-registrations`-handlers, samma "Utbildning Skövde"-event som
 * `atgardssida-promoverings-grind.spec.ts` redan låser som facit): Cecilia
 * Ceder (`recVisualReg000003`) har `anmalningsavgift: 'Mottagen'` +
 * `slutbetalning: 'Ej mottagen'` — EXAKT den asymmetrin testet behöver
 * (kvitto-knappen ska synas för avgiften, INTE för slutbetalningen).
 * `send-receipt-email` är MEDVETET INTE i normalläget (`handlers.ts`) —
 * samma hermetik-disciplin som `send-action-email` (147.2:s fils egen
 * motivering): överskuggas per test.
 */

const CECILIA = 'recVisualReg000003';

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Betalningsblocket — egen sektion (samma locator som atgarder-betalningar.staging.test.ts). */
function betalningsPanel(page: import('@playwright/test').Page) {
  return page.locator('section[aria-labelledby="grupp-betalningar"]');
}

async function oppnaBetalningar(page: import('@playwright/test').Page) {
  await betalningsPanel(page)
    .getByRole('button', { name: /Pricka av och notera/ })
    .click();
}

test.describe('Skicka kvitto — verklig sändväg (TASK-147.7 AC #2, #3)', () => {
  test('knappen syns ENDAST för den Mottagna betalningen (avgift), inte för den obetalda (slutbetalning)', async ({
    page,
  }) => {
    await gotoAtgarder(page);
    await oppnaBetalningar(page);

    const panel = betalningsPanel(page);
    await expect(
      panel.getByRole('button', { name: `Skicka kvitto - Anmälningsavgift för Cecilia Ceder` }),
    ).toBeVisible();
    await expect(
      panel.getByRole('button', { name: `Skicka kvitto - Slutbetalning för Cecilia Ceder` }),
    ).toHaveCount(0);

    // Nytt aria-delta (facit-ytan är stämpel-väntande, se PR-notes): knappen
    // ÄR ny DOM i betalningspanelen — verifiera att den ändå inte introducerar
    // en AXE-överträdelse, oberoende av det separata facit-godkännandet.
    const resultat = await new AxeBuilder({ page })
      .include('section[aria-labelledby="grupp-betalningar"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('lyckad sändning: rätt kroppskontrakt, kvittonumret redovisas, skärmläsaren annonserar', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-receipt-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({ status: 'sent', kvittonummer: 'MM-2026-1001', lopnummer: 1001, ar: 2026 });
      }),
    );

    await gotoAtgarder(page);
    await oppnaBetalningar(page);

    const panel = betalningsPanel(page);
    await panel
      .getByRole('button', { name: 'Skicka kvitto - Anmälningsavgift för Cecilia Ceder' })
      .click();

    // Dialogen — belopp + betalsätt, "Skicka" avstängd tills båda är ifyllda.
    const dialog = page.getByRole('dialog', { name: 'Skicka kvitto - Anmälningsavgift' });
    await expect(dialog).toBeVisible();
    const skickaKnapp = dialog.getByRole('button', { name: 'Skicka' });
    await expect(skickaKnapp).toBeDisabled();

    await dialog.getByRole('textbox', { name: 'Belopp (kr)' }).fill('1250');
    await expect(skickaKnapp).toBeDisabled();
    await dialog.getByRole('button', { name: 'Betalsätt' }).click();
    await page.getByRole('option', { name: 'Swish' }).click();
    await expect(skickaKnapp).toBeEnabled();

    await skickaKnapp.click();

    await expect(dialog.getByText('MM-2026-1001 skickat till Cecilia Ceder.')).toBeVisible();

    await expect.poll(() => sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.registrationId).toBe(CECILIA);
    expect(body.eventId).toBe(VISUAL_EVENT_ID);
    expect(body.betalning).toBe('avgift');
    expect(body.belopp).toBe(1250);
    expect(body.betalsatt).toBe('Swish');
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // Skärmläsar-annonseringen — `alertScreenReader`s globala aria-live-div
    // (`data-mm-announcer`, INTE role=status — samma locator-form som
    // person-note-edit.acceptance.test.ts, den etablerade precedenten för
    // detta mekanism).
    await expect(page.locator('[data-mm-announcer]')).toContainText(
      'Kvitto MM-2026-1001 skickat till Cecilia Ceder',
    );

    // A11y i det verkliga resultatläget — 0 överträdelser.
    const resultat = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('avvisad sändning: dialogen redovisar servens skäl ärligt, INGET kvittonummer påstås', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-receipt-email'), async () =>
        json({ status: 'failed', reason: 'Bounced — ogiltig adress' }),
      ),
    );

    await gotoAtgarder(page);
    await oppnaBetalningar(page);

    const panel = betalningsPanel(page);
    await panel
      .getByRole('button', { name: 'Skicka kvitto - Anmälningsavgift för Cecilia Ceder' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Skicka kvitto - Anmälningsavgift' });
    await dialog.getByRole('textbox', { name: 'Belopp (kr)' }).fill('1250');
    await dialog.getByRole('button', { name: 'Betalsätt' }).click();
    await page.getByRole('option', { name: 'Bankgiro' }).click();
    await dialog.getByRole('button', { name: 'Skicka' }).click();

    await expect(dialog.getByText('Bounced — ogiltig adress')).toBeVisible();
    await expect(dialog.getByText(/MM-\d{4}-\d+/)).toHaveCount(0);
  });
});
