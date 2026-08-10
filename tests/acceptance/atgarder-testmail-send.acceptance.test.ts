import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { FIXTUR_EPOST } from '../support/fixturvarld/hermetic';
import { expect, test } from './support/acceptance-bas';

/**
 * TASK-147.10 — "Skicka test till mig" (T53 väg C, ADR-067 D10) skarpt
 * ände-till-ände.
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR): att
 * GRANSKNINGSLÄGET, givet ett svar av `send-action-email`-EF:ens testgren-
 * form (`SendActionTestEmailResultSchema`), (1) sänder EN POST med EXAKT
 * kontraktet — `testSend: true`, `registrationIds` = den FÖRSTA mottagaren i
 * urvalet ENSAM, samma ämne/text som granskningen visar, (2) annonserar ett
 * lyckat testmail med den INLOGGADE fixtur-sessionens egen adress
 * (`FIXTUR_EPOST`, ALDRIG en mottagares), (3) annonserar ett misslyckat
 * testmail med serverns skäl, och (4) lämnar den VERKLIGA sändvägens
 * tillstånd (armerings-handtaget, urvalet) ORÖRT — testmailet är en helt
 * separat handling. Att EF:ens testgren SJÄLV renderar/adresserar rätt är
 * TASK-147.10s orkestrator-bevis (`tests/api/send-action-email.test.ts` §
 * `runActionTestSend`) — inte upprepat här.
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, samma "Utbildning
 * Skövde"-event och samma fyra seedade mottagare som `atgardssida-
 * promoverings-grind.spec.ts` och `atgarder-bekraftelsemail-send.acceptance.
 * test.ts` redan låser som facit). Åtgärden "Skicka bekräftelsemail"
 * (`urvalsfilter: obekraftad`) biter fyra-urvalet ned till Anna + Björn —
 * FÖRSTA mottagaren (`mottagare[0]`) är alltså Anna, verifierat mot
 * `REGISTRATIONS_RESPONSE` i `fixture-data.ts` (samma ordning 147.2:s
 * acceptance-test redan låser), inte antaget.
 *
 * `send-action-email` ÄR MEDVETET INTE I NORMALLÄGET (`handlers.ts`, samma
 * skäl som 147.2:s syskonfil): varje test överskuggar det självt.
 */

const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar en namngiven åtgärd och går vidare till granskningen. */
async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

test.describe('Skicka test till mig — testmailets sändväg (TASK-147.10 AC #1-#2)', () => {
  test('POST med testSend:true + FÖRSTA mottagaren ensam, lyckat testmail annonserar den inloggade adressen', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({ status: 'sent' });
      }),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();

    await page.getByRole('button', { name: 'Skicka test till mig' }).click();

    // Body-kontraktet: EXAKT det EF:ens testgren (TASK-147.10) förväntar sig.
    await expect.poll(() => sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.actionType).toBe('bekraftelse');
    expect(body.eventId).toBe(VISUAL_EVENT_ID);
    // FÖRSTA mottagaren ENSAM — INTE hela tvåpersonersurvalet (Anna, Björn).
    expect(body.registrationIds).toEqual([ANNA]);
    expect(body.testSend).toBe(true);
    expect(body.amne).toBe('Din plats är bekräftad');
    expect(body.mailtext).toBe(
      'Hej {förnamn},\n\nDin plats på {event} är bekräftad. Vi ses {datum} i {ort}.\n\nVarmt välkommen!\nRoger och Lotta',
    );
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // Bekräftelsen annonserar den INLOGGADE sessionens egen adress — ALDRIG
    // Annas eller Björns. `role="status"` (aria-live="polite" + <p>, ingen
    // MessageBox) — live-regionen bär beskedet utan extra announcer-kod.
    await expect(page.getByText(`Testmail skickat till ${FIXTUR_EPOST}.`)).toBeVisible();

    // FORTFARANDE GRANSKA-LÄGET — testmailet flyttar ingen mottagare och
    // armerar ingen sändning. Huvudknappen är fortfarande i sitt ursprungliga
    // (oarmerade) tillstånd.
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka till 2 personer' })).toBeDisabled();
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();

    // Björn är INTE Anna — ingen adress ur urvalet utöver den första
    // kontaktades av testvägen (AC #2, kroppens registrationIds bevisar det
    // redan ovan; denna rad bevisar att Björns kort inte fick ett eget
    // testutfall renderat).
    expect(body.registrationIds).not.toContain(BJORN);
  });

  test('avvisat testmail — ärligt felbesked med serverns skäl, granska-läget orört', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-action-email'), () =>
        json({ status: 'failed', reason: 'E-postadressen studsade (bounced)' }),
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await page.getByRole('button', { name: 'Skicka test till mig' }).click();

    await expect(
      page.getByText('Kunde inte skicka testmailet: E-postadressen studsade (bounced)'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
  });

  test('mutationens eget fel (nätverk/EF-avvisning) — felbesked med felmeddelandet, ingen krasch', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-action-email'), () => json({ error: 'RESEND_API_KEY not set' }, 503)),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await page.getByRole('button', { name: 'Skicka test till mig' }).click();

    await expect(page.getByText(/Kunde inte skicka testmailet/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
  });

  test('a11y i granska-läget med testmail-knappen — 0 överträdelser', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByRole('button', { name: 'Skicka test till mig' })).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
