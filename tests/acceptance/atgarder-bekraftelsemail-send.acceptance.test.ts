import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-147.2 — "Skicka bekräftelsemail" skarpt ände-till-ände (åtgärd 1).
 *
 * VAD DENNA FIL BEVISAR, OCH VAD DEN INTE GÖR (acceptance-bas.ts § VAD KLASSEN
 * BEVISAR): att ÅTGÄRDS-SIDAN, givet ett svar av send-action-email-EF:ens
 * egen form (`SendActionEmailResultSchema`), (1) sänder en VERKLIG POST med
 * rätt body-kontrakt, (2) redovisar ett ärligt delutfall utan att låtsas en
 * blandad körning vara helt lyckad, (3) lämnar de fallna kvar markerade så en
 * omkörning träffar EXAKT dem, och (4) annonserar förloppet och resultatet
 * för skärmläsare (PRD task-147 berättelse 26). Att EF:en SJÄLV producerar
 * rätt idempotens/delutfall är TASK-147.1s bevis
 * (`tests/api/send-action-email.test.ts`) — inte upprepat här.
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, delade `get-events`/
 * `get-registrations`-handlers): samma "Utbildning Skövde"-event och samma
 * fyra seedade mottagare (Anna, Björn, Cecilia, Filip — obekräftade eller
 * obetalda) som `atgardssida-promoverings-grind.spec.ts` redan låser som
 * facit. `send-action-email` är MEDVETET INTE i normalläget
 * (`handlers.ts`): en delad skrivväg hade gjort tyst lyckad sändning till
 * default för hela klassen — den överskuggas per test, och ett test som
 * skickar utan överskuggning fälls av hermetik-vakten med adressen namngiven.
 *
 * ÅTGÄRDEN "Skicka bekräftelsemail" (`urvalsfilter: obekraftad`) biter ned
 * fyra-urvalet till TVÅ — Anna och Björn (Cecilia/Filip är redan bekräftade,
 * bara obetalda) — verifierat mot `REGISTRATIONS_RESPONSE` i `fixture-data.ts`,
 * inte antaget.
 */

const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar mottagar-ytans infällda lista — accordion-huvudet, se AtgardsSida.tsx. */
async function oppnaMottagarlista(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /deltagare markerade/ }).click();
}

/** Öppnar en namngiven åtgärd och går vidare till granskningen. */
async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som promoverings-grinden). */
async function armera(page: import('@playwright/test').Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

test.describe('Skicka bekräftelsemail — verklig sändväg (TASK-147.2 AC #1-#4)', () => {
  test('delutfall: en lyckad, en redan bekräftad — fallen kvar markerad, omkörning träffar bara den', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({
          status: 'partial',
          requested: 2,
          attempted: 2,
          completed: [ANNA],
          // 'already_confirmed' är en ÄKTA server-skip-kod (send-action-email.ts
          // § SkipReason) — inte en påhittad textrad. Prövar `skalForSkip`s
          // mappning i AtgardsSida.tsx, inte bara den fria `failed`-passthrougen.
          skipped: [{ registrationId: BJORN, reason: 'already_confirmed' }],
          failed: [],
        });
      }),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');

    // GRANSKA: åtgärdens urvalsfilter bitit ned till Anna + Björn.
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();
    await expect(page.getByText('Anna Andersson')).toBeVisible();
    await expect(page.getByText('Björn Bergström')).toBeVisible();

    // [TASK-147.2] Riggen är UTELÄMNAD för bekräftelse — se AtgardsSida.tsx
    // § PrototypRigg (den villkorade monteringen). Ett DEV-läge som visade
    // "Inget skickas" bredvid en verklig sändväg vore en lögn i ytan.
    await expect(page.getByText('Prototyp-rigg.')).toHaveCount(0);

    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    // RESULTATET: ärligt delutfall, aldrig framställt som helt lyckat.
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    // Skärmläsar-annonseringen (berättelse 26) — `MessageBox` sätter
    // `role="status"` för intent 'info' (partial-fallet), ingen extra
    // announcer-rad. Läses via ROLLEN, inte testid, så en riven live-region
    // fälls testet i stället för att lämnas grön av en textmatchning.
    const utfallStatus = page.getByRole('status').filter({ hasText: 'Utskicket lyckades delvis' });
    await expect(utfallStatus).toContainText('1 av 2 person fick mailet.');
    await expect(utfallStatus).toContainText(
      '1 fick det inte - skälet står på kortet ovanför. De ligger kvar markerade, så du kan gå tillbaka och köra om just dem.',
    );

    // Kortnivån: Anna "Skickat", Björn bär serverns skäl (svenska mappningen).
    // `ancestor::div[2]`: `deltagar-namn` sitter i DeltagarKortInnehalls FÖRSTA
    // div (rad 1 ur ancestor-räkningen); UtfallsKorts egen omslutande div (rad
    // 2) är den som bär syskon-diven med "Skickat"/skälet (UtfallsKort § JSX).
    const annaKort = page.getByTestId('deltagar-namn').filter({ hasText: 'Anna Andersson' });
    await expect(annaKort.locator('xpath=ancestor::div[2]').getByText('Skickat')).toBeVisible();
    const bjornKort = page.getByTestId('deltagar-namn').filter({ hasText: 'Björn Bergström' });
    await expect(
      bjornKort.locator('xpath=ancestor::div[2]').getByText('Redan bekräftad'),
    ).toBeVisible();

    // Body-kontraktet: EXAKT det EF:en (TASK-147.1) förväntar sig.
    expect(sentBody).not.toBeNull();
    const body = sentBody as unknown as Record<string, unknown>;
    expect(body.actionType).toBe('bekraftelse');
    expect(body.eventId).toBe(VISUAL_EVENT_ID);
    expect(body.registrationIds).toEqual([ANNA, BJORN]);
    expect(body.amne).toBe('Din plats är bekräftad');
    expect(body.mailtext).toBe(
      'Hej {förnamn},\n\nDin plats på {event} är bekräftad. Vi ses {datum} i {ort}.\n\nVarmt välkommen!\nRoger och Lotta',
    );
    expect(String(body.idempotencyKey)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    // A11y i det verkliga resultatläget — 0 överträdelser.
    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);

    // AC #3: FALLEN KVAR MARKERAD, LYCKAD AVMARKERAD — mätt i HUBBEN, inte
    // antaget ur mutationens svar. Anna lämnade urvalet, Björn (+ Cecilia +
    // Filip, orörda av denna åtgärd) står kvar.
    // `getByRole('button', { name: … })` matchar BÅDA — sidhuvudets
    // chevron-länk BÄR SAMMA aria-label ("Tillbaka till åtgärderna") som
    // knappens text. `locator('button', { hasText })` filtrerar på RENDERAD
    // text i stället för tillgängligt namn — chevronen har ingen (ikonen är
    // aria-hidden) — och ger därför exakt EN träff.
    await page.locator('button', { hasText: 'Tillbaka till åtgärderna' }).click();
    await oppnaMottagarlista(page);
    // NÄMNAREN ÄR 5 — Skövde-eventets samtliga registreringar (Anna, Björn,
    // Cecilia, David, Filip), inte bara de fyra SEEDADE (David är varken
    // obekräftad eller obetald, alltså utanför seedet men fortfarande en av
    // "alla", se `MottagarYta`s räknare i AtgardsSida.tsx). Verifierat mot
    // `REGISTRATIONS_RESPONSE` i fixture-data.ts, inte antaget.
    await expect(page.getByText('3 av 5 deltagare markerade')).toBeVisible();

    // AVMARKERING LÄMNAR KORTET KVAR I LISTAN, VITT (MottagarYta § docblock)
    // — Annas kort försvinner alltså INTE, det blir bara omarkerat. Björns
    // kort står kvar MARKERAT.
    const annaKryss = page.getByRole('checkbox', { name: /Anna Andersson/ });
    await expect(annaKryss).toBeVisible();
    await expect(annaKryss).not.toBeChecked();
    const bjornKryss = page.getByRole('checkbox', { name: /Björn Bergström/ });
    await expect(bjornKryss).toBeChecked();

    // OMKÖRNINGEN TRÄFFAR BARA BJÖRN: samma åtgärd, samma urvalsfilter, men
    // urvalet (mottagare.length, INTE nämnaren ovan) krympt till en enda
    // kvarstående person — mottagare = de MARKERADE (Björn+Cecilia+Filip = 3).
    await page.getByRole('button', { name: /Skicka bekräftelsemail/ }).click();
    await expect(page.getByText(/\d+\s+av\s+3/)).toHaveText('1 av 3');
  });

  test('helt fel-utfall: noll lyckade, blandade skäl — ärlig varning, inte tystnad', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-action-email'), () =>
        json({
          status: 'failed',
          requested: 2,
          attempted: 2,
          completed: [],
          skipped: [],
          // `failed`s skäl är FRI TEXT (servern citerar Resends avvisning
          // eller atomicitets-felet ordagrant) — passthrough utan mappning,
          // till skillnad från `skipped` i första testet.
          failed: [
            { registrationId: ANNA, reason: 'E-postadressen studsade (bounced)' },
            { registrationId: BJORN, reason: 'Mailet skickades men fältet kunde inte uppdateras' },
          ],
        }),
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Inget skickades' })).toBeVisible();

    // Noll lyckade → ALDRIG grön framgång (samma D3-regel som SegmentMailCompose
    // bär) — `role="alert"` (warning-intent), inte "status".
    const varning = page.getByRole('alert').filter({ hasText: 'Ingen fick mailet' });
    await expect(varning).toContainText('2 fick det inte - skälet står på korten ovanför.');
    await expect(page.getByText('E-postadressen studsade (bounced)')).toBeVisible();
    await expect(page.getByText('Mailet skickades men fältet kunde inte uppdateras')).toBeVisible();
  });

  test('mutationens eget fel (nätverk/EF-avvisning) — felyta i granska-läget, handtaget nollställs', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-action-email'), () =>
        json({ error: 'RESEND_API_KEY not set', requestId: 'req-test-147-2' }, 503),
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    // INGET Utfall att visa — tillbaka i granska-läget med felet synligt.
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
    const fel = page.getByRole('alert').filter({ hasText: 'Kunde inte skicka utskicket' });
    await expect(fel).toContainText('RESEND_API_KEY not set');
    await expect(fel).toContainText('req-test-147-2');

    // Handtaget nollställt: "dra igen för att försöka igen"-grammatiken.
    await expect(page.getByRole('switch', { name: 'Bekräfta utskicket' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(page.getByRole('button', { name: /^Skicka till \d+/ })).toBeDisabled();
  });
});
