import AxeBuilder from '@axe-core/playwright';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { FIXTUR_EPOST } from '../support/fixturvarld/hermetic';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './acceptance-bas';

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

/** Aktivitetsloggens utgående kroppar (TASK-201.13). Normalläget svarar redan
 * rätt på `log-activity` (`handlers.ts`), men exponerar inget att LÄSA — samma
 * lokala överskuggnings-mönster som `anmalan-detalj.acceptance.test.ts` §
 * `mocka()` använder för pilotens bevis. */
type Kropp = Record<string, unknown>;
function fangaAktivitetslogg(loggar: Kropp[]) {
  return http.post(EF('log-activity'), async ({ request }) => {
    const body = (await request.json()) as Kropp;
    loggar.push(body);
    const b = body as unknown as { id: string; context: { extensions: Record<string, string> } };
    return json(
      {
        id: b.id,
        requestId: Object.values(b.context.extensions)[0],
        occurredAt: '2026-08-13T08:00:00.000Z',
      },
      201,
    );
  });
}

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

/** Öppnar en namngiven åtgärd och går vidare till granskningen. */
async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

/** Löser en CSS-custom-property till computed färg via en DOM-probe (samma
    per-fil-lokala mönster som `tests/a11y/NavCard.spec.ts`/
    `ToggleButtonGroup.spec.ts` m.fl. redan bär). */
async function resolvedTokenColor(
  page: import('@playwright/test').Page,
  tokenNamn: string,
): Promise<string> {
  return page.evaluate((namn) => {
    const probe = document.createElement('span');
    probe.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;pointer-events:none';
    probe.style.color = `var(${namn})`;
    document.body.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, tokenNamn);
}

test.describe('Skicka till min inkorg — testmailets sändväg (TASK-147.10 AC #1-#2)', () => {
  test('POST med testSend:true + FÖRSTA mottagaren ensam, lyckat testmail annonserar den inloggade adressen', async ({
    page,
    network,
  }) => {
    let sentBody: Record<string, unknown> | null = null;
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('send-action-email'), async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return json({ status: 'sent' });
      }),
      fangaAktivitetslogg(loggar),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByText(/Skicka bekräftelsemail\s+till\s+2\s+personer/)).toBeVisible();

    await page.getByRole('button', { name: 'Skicka till min inkorg' }).click();

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
    // Annas eller Björns. Ingen `role="status"`-MessageBox (S102-raden är en
    // ren rad) — `aria-live="polite"`-wrappern (AtgardsSida.tsx § TESTMAILET)
    // bär beskedet utan extra announcer-kod. Kopian bytte samtidigt form
    // (S102, Marcus form-beslut A): "Testmail skickat till X." → "Skickat
    // till X" — etiketten "Testmail" står redan till vänster om raden.
    await expect(page.getByText(`Skickat till ${FIXTUR_EPOST}`)).toBeVisible();

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

    // AKTIVITETSLOGGEN (TASK-201.13, riktning 1/2 — Marcus-order "inte en
    // enda lucka"). TASK-201.4 uteslöt denna hook med motiveringen "skriver
    // strukturellt inget fält"; loggen handlar om vad LOTTA GJORDE, och ett
    // mail lämnade systemet på hennes kommando.
    await expect.poll(() => loggar.length).toBe(1);
    const logg = loggar[0] as unknown as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string> } };
    };
    expect(logg.verb.display['sv-SE']).toBe('skickade testmail till sig själv');
    // Objektet är EVENTET — testgrenen rör ingen anmälan, så statementet får
    // inte peka på platshållar-mottagarens.
    expect(logg.object.id).toContain(`/objects/events/${VISUAL_EVENT_ID}`);
    expect(logg.object.id).not.toContain('/objects/registrations/');
    expect(logg.object.definition.name['sv-SE']).toBe('Utbildning Skövde (test: bekraftelse)');
  });

  test('avvisat testmail — ärligt felbesked med serverns skäl, granska-läget orört, knappen kvarstår', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    network.use(
      http.post(EF('send-action-email'), () =>
        json({ status: 'failed', reason: 'E-postadressen studsade (bounced)' }),
      ),
      medvetetOanvand(
        fangaAktivitetslogg(loggar),
        'NEGATIV SENSOR (TASK-201.13, riktning 2/2): EF:en svarar 200 med status "failed", så ' +
          'mutationen LYCKAS medan sändningen FÖLL — servern är facit. Att handlern förblir ' +
          'oanvänd ÄR resultatet: ingen aktivitetspost får skrivas för ett mail som aldrig gick.',
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await page.getByRole('button', { name: 'Skicka till min inkorg' }).click();

    await expect(
      page.getByText('Kunde inte skicka testmailet: E-postadressen studsade (bounced)'),
    ).toBeVisible();

    // AKTIVITETSLOGGEN (riktning 2/2): INGEN post. Detta är den skarpaste av
    // de två riktningarna — mutationen gick igenom (HTTP 200), så en naiv
    // `onSuccess`-instrumentering utan `result.status`-grinden hade loggat ett
    // utskick som aldrig skedde. Se `useSendActionTestEmail` § SERVERN ÄR FACIT.
    expect(loggar).toHaveLength(0);
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();

    // OMKLICKSBESLUTET (S102-iterationen, Marcus 2026-08-11: "Kör på din
    // rekommendation, knappen står kvar, retry-möjlighet."): ett fel-utfall
    // ERSÄTTER inte längre knappen — den ska stå kvar BREDVID/UNDER felraden,
    // aktiverad, redo för ett nytt klick. Full omklicks-cykel (fel → lyckat)
    // bevisas separat nedan.
    await expect(page.getByRole('button', { name: 'Skicka till min inkorg' })).toBeEnabled();
  });

  test('mutationens eget fel (nätverk/EF-avvisning) — felbesked med felmeddelandet, ingen krasch, knappen kvarstår', async ({
    page,
    network,
  }) => {
    network.use(
      http.post(EF('send-action-email'), () => json({ error: 'RESEND_API_KEY not set' }, 503)),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await page.getByRole('button', { name: 'Skicka till min inkorg' }).click();

    await expect(page.getByText(/Kunde inte skicka testmailet/)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Granska och skicka' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skicka till min inkorg' })).toBeEnabled();
  });

  test('omklick/retry: ett andra klick efter fel går genom samma handtag och lyckas', async ({
    page,
    network,
  }) => {
    // Räknaren ÄR testets poäng här (till skillnad från klassens vanliga
    // regel att aldrig testa "anropades N gånger" — se acceptance-bas.ts §
    // VAD KLASSEN BEVISAR): omklicksbeslutet bevisar sig SJÄLVT bara genom
    // att ett ANDRA anrop går ut och lyckas efter att det första fallerat.
    let antalAnrop = 0;
    network.use(
      http.post(EF('send-action-email'), () => {
        antalAnrop += 1;
        return antalAnrop === 1
          ? json({ status: 'failed', reason: 'E-postadressen studsade (bounced)' })
          : json({ status: 'sent' });
      }),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    const knapp = page.getByRole('button', { name: 'Skicka till min inkorg' });

    await knapp.click();
    await expect(
      page.getByText('Kunde inte skicka testmailet: E-postadressen studsade (bounced)'),
    ).toBeVisible();

    // SAMMA knapp, SAMMA `skickaTest`-handtag — ingen särskild retry-väg.
    await knapp.click();
    await expect(page.getByText(`Skickat till ${FIXTUR_EPOST}`)).toBeVisible();
    // Felraden försvinner när retry lyckas — bara ETT utfall visas åt gången.
    await expect(page.getByText(/Kunde inte skicka testmailet/)).toHaveCount(0);
    expect(antalAnrop).toBe(2);
  });

  test('hover-plattan syns mot den mutade panelen (S102, Marcus 2026-08-11: "ingen hover")', async ({
    page,
  }) => {
    // NEGATIV KONTROLL inbyggd i själva jämförelsen: `DetaljGrupp`s kortyta
    // ÄR `--mm-bg-muted` (`DetaljGrupp.tsx` rad 31), och ghost-knappens
    // DEFAULT-hover (`--mm-button-ghost-bg-hover`) är SAMMA token — utan
    // `data-[hovered]:bg-bg-emphasized`-overriden (`AtgardsSida.tsx` §
    // TESTMAILET) skulle hover-färgen vara IDENTISK med panelen, och detta
    // test skulle falla. Samma mätta fälla som
    // `DeltagareHallplatsPrototyp.tsx` § "HOVERN VAR OSYNLIG" dokumenterar.
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    const knapp = page.getByRole('button', { name: 'Skicka till min inkorg' });
    const panel = page.locator('[data-testid="grupp-kort"]').filter({ has: knapp });

    // Token-värdena FÖRE hovern (samma ordning som ToggleButtonGroup.spec.ts
    // § hovraOchMat — en DOM-probe kan slå bort en redan placerad pekare).
    const emphasized = await resolvedTokenColor(page, '--mm-bg-emphasized');
    const panelBg = await panel.evaluate((el) => getComputedStyle(el).backgroundColor);
    const vilaBg = await knapp.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(vilaBg).toBe('rgba(0, 0, 0, 0)'); // ghost = transparent i vila
    expect(emphasized).not.toBe(panelBg); // token-parets egen negativa kontroll

    await knapp.hover();
    await expect(knapp).toHaveAttribute('data-hovered', 'true', { timeout: 2_000 });
    // `transition-colors` animerar bytet — `toHaveCSS` retry:ar (auto-waiting)
    // tills övergången är klar, samma mönster som `hovraTills` i
    // ToggleButtonGroup.spec.ts. Ett synkront `getComputedStyle` direkt efter
    // `.hover()` mätte transparent HÄR (mitt i övergången) innan denna fix.
    await expect(knapp).toHaveCSS('background-color', emphasized, { timeout: 2_000 });
  });

  test('a11y i granska-läget med testmail-knappen — 0 överträdelser', async ({ page }) => {
    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await expect(page.getByRole('button', { name: 'Skicka till min inkorg' })).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
