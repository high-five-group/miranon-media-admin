import { HttpResponse, http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-340.4 (PRD TASK-340, ADR-124 beslut 5) — mätytans EGET acceptance-
 * bevis, AC #1. Detta test bevisar bara att `/dev/matyta-option-c` renderar
 * bakom dev-gaten, att "Hämta förhandsgranskning" faktiskt sätter iframens
 * `src`/`title` till den mockade preview-URL:en (MSW), och att mätfältets
 * tre rubriker + huvudmätningens värden syns. Det bevisar INTE Marcus
 * scroll-dom (AC #2, kortets MARCUS-STEG) — det kan inget mekaniskt test
 * göra.
 *
 * Att PRODUKTVÄGEN är orörd bevisas INTE här utan av att de befintliga
 * `dokument-*`-acceptance-sviterna förblir gröna (se skivans slutrapport) —
 * denna fil rör ingen av dem, konsumerar bara samma fixturvärld/`EF`-
 * hjälpare.
 *
 * `get-events` behöver INGEN egen mock: normalläget
 * (`tests/support/fixturvarld/handlers.ts`) bär redan tre event, inklusive
 * `VISUAL_EVENT_ID` ("Utbildning Skövde") — samma ankare som
 * `dokument-rackviddsval.acceptance.test.ts` använder för samma väljare.
 */

const PREVIEW_URL = 'https://storage.example.test/utkast-bekraftelse.pdf';

test.describe('TASK-340.4 — mätyta för option C (dev-only)', () => {
  test('AC #1: bakom dev-gate, hämtar en förhandsgranskning och visar iframe + mätfält', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('generate-event-attachment'), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({
          eventId: VISUAL_EVENT_ID,
          mall: 'bekraftelse',
          preview: true,
        });
        return json({
          url: PREVIEW_URL,
          utgar: new Date(Date.now() + 300_000).toISOString(),
        });
      }),
      // Den signerade utkast-URL:en är INTE en Edge Function (samma
      // diskriminator som `dokument-generering-fonster-direkt.acceptance.test.ts`
      // § `mockaLagradPdf`) — den måste ha sin EGEN handler. `Access-Control-
      // Allow-Origin: *` är INTE pynt: mätfältets Range-anrop (§ 2) är ett
      // riktigt cross-origin `fetch()` i sidans egen kontext, och en riktig
      // webbläsare tillämpar CORS på interceptade svar precis som på äkta.
      //
      // OVÄNTAT FYND (körd, inte antaget): utan `Access-Control-Expose-
      // Headers` läser `Headers.get()` BARA Fetch-specens CORS-safelist
      // (Content-Type/Content-Length m.fl.) — `Accept-Ranges` och
      // `Content-Disposition` är INTE med i den listan och kommer alltså
      // tillbaka `null` ("(saknas)" i mätfältet) även om servern satte dem,
      // om servern inte OCKSÅ exponerar dem explicit. Mocken sätter dem
      // ändå (verklighetstroget mot vad Storage troligen svarar) för att
      // detta test ska bevisa att mätfältet visar EXAKT den riktiga CORS-
      // begränsningen — inte att headrarna alltid syns.
      http.get(
        PREVIEW_URL,
        () =>
          new HttpResponse('fejk-pdf-innehall', {
            status: 206,
            headers: {
              'access-control-allow-origin': '*',
              'accept-ranges': 'bytes',
              'content-type': 'application/pdf',
              'content-disposition': 'inline; filename="bekraftelsebilaga.pdf"',
              'content-length': '17',
            },
          }),
      ),
    );

    await page.goto('/dev/matyta-option-c');
    await expect(page.getByTestId('matyta-option-c')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Matyta');

    // Ingen iframe/mätfält-slutsats innan ett event är valt.
    await expect(page.getByTestId('matyta-option-c-iframe')).toHaveCount(0);

    await page.getByTestId('event-valjare-trigger').click();
    await page
      .getByRole('option', { name: /Skövde/ })
      .first()
      .click();

    // Mall-radion: "Bekräftelsebilaga" är default (matchar mockens
    // `mall: 'bekraftelse'`-assertion ovan) och tangentbordsstyrd (native
    // radio-input i ett fieldset).
    await expect(page.getByRole('radio', { name: 'Bekräftelsebilaga' })).toBeChecked();
    await expect(page.getByRole('radio', { name: 'Deltagarinformation' })).not.toBeChecked();

    await page.getByRole('button', { name: 'Hämta förhandsgranskning' }).click();

    const iframe = page.getByTestId('matyta-option-c-iframe');
    await expect(iframe).toHaveAttribute('src', PREVIEW_URL);
    await expect(iframe).toHaveAttribute('title', 'Förhandsgranskning av bekräftelsebilagan');

    // "Öppna i egen flik" — referensen ADR-124 beslut 5 ber Marcus jämföra mot.
    const oppnaLank = page.getByRole('link', { name: /Öppna i egen flik/ });
    await expect(oppnaLank).toHaveAttribute('href', PREVIEW_URL);
    await expect(oppnaLank).toHaveAttribute('target', '_blank');
    await expect(oppnaLank).toHaveAttribute('rel', /noopener/);

    // Mätfältets TRE rubriker.
    const matfalt = page.getByTestId('matyta-option-c-matfalt');
    await expect(matfalt).toBeVisible();
    await expect(matfalt).toContainText('Service Worker');
    await expect(matfalt).toContainText('Svarshuvuden');
    await expect(matfalt).toContainText('Webbläsare och enhet');

    // Huvudmätningens VÄRDEN, ur den mockade 206-headern ovan — bevisar att
    // Range-anropet faktiskt gick och att svaret parsades, inte bara att
    // rubriken finns. `Content-Type`/`Content-Length` är CORS-safelistade
    // och läses; `Accept-Ranges`/`Content-Disposition` är det INTE (utan
    // `Access-Control-Expose-Headers`) och mätfältet visar därför "(saknas)"
    // för dem — se handler-kommentaren ovan, ett verkligt CORS-fynd, inte en
    // bugg i mätytan.
    await expect(matfalt).toContainText('206');
    await expect(matfalt).toContainText('application/pdf');
    await expect(matfalt).toContainText('17');
    const svarshuvudBlock = matfalt.locator('dl').filter({ hasText: 'HTTP-status' });
    await expect(svarshuvudBlock.getByText('Accept-Ranges')).toBeVisible();
    await expect(svarshuvudBlock).toContainText('(saknas)');

    // navigator.userAgent/platform (statiska, alltid mätbara utan mock).
    await expect(matfalt).toContainText('navigator.userAgent:');
    await expect(matfalt).toContainText('navigator.platform:');
  });

  test('mall-bytet styr iframens title och EF-anropets kropp', async ({ page, network }) => {
    const DELTAGARINFO_URL = 'https://storage.example.test/utkast-deltagarinfo.pdf';

    network.use(
      http.post(EF('generate-event-attachment'), async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body).toMatchObject({
          eventId: VISUAL_EVENT_ID,
          mall: 'deltagarinfo',
          preview: true,
        });
        return json({
          url: DELTAGARINFO_URL,
          utgar: new Date(Date.now() + 300_000).toISOString(),
        });
      }),
      http.get(
        DELTAGARINFO_URL,
        () =>
          new HttpResponse('fejk-pdf-innehall', {
            status: 206,
            headers: { 'access-control-allow-origin': '*' },
          }),
      ),
    );

    await page.goto('/dev/matyta-option-c');
    await page.getByTestId('event-valjare-trigger').click();
    await page
      .getByRole('option', { name: /Skövde/ })
      .first()
      .click();

    await page.getByRole('radio', { name: 'Deltagarinformation' }).click();
    await expect(page.getByRole('radio', { name: 'Deltagarinformation' })).toBeChecked();

    await page.getByRole('button', { name: 'Hämta förhandsgranskning' }).click();

    const iframe = page.getByTestId('matyta-option-c-iframe');
    await expect(iframe).toHaveAttribute('src', DELTAGARINFO_URL);
    await expect(iframe).toHaveAttribute('title', 'Förhandsgranskning av deltagarinformationen');
  });
});
