import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { medvetetOanvand } from '../support/fixturvarld/overskuggnings-vakt';
import { expect, test } from './acceptance-bas';

/**
 * TASK-201.13 — betalningsnoteringens aktivitetslogg, ände-till-ände genom
 * den RIKTIGA hooken (`useUpdatePaymentNote`, `registrationPayments.ts`).
 *
 * VARFÖR DENNA FIL FINNS VID SIDAN AV `activity-log-luckor-statements.test.ts`:
 * api-pure-sviten kör composern (`recordActivity`) med en input som SPEGLAR
 * hookens. Den bevisar att composern inte läcker — men en spegel kan glida
 * ifrån originalet, och då bevisar den fel sak. HÄR drivs Åtgärds-sidans
 * verkliga noteringsfält, av den verkliga mutationen, och kroppen läses där
 * den faktiskt lämnar klienten. Det är det ledet som binder INTEGRITETEN till
 * hooken i stället för till en testfixtur.
 *
 * RÄKNANDET ÄR MEDVETET HÄR (klassens vanliga regel är att aldrig testa att en
 * handler anropades — `acceptance-bas.ts` § VAD KLASSEN BEVISAR). Samma
 * motiverade undantag som `anmalan-detalj.acceptance.test.ts` § AKTIVITETS-
 * LOGGEN och `atgarder-testmail-send.acceptance.test.ts` § omklick redan bär:
 * för aktivitetsloggen ÄR den utgående posten det externa beteendet — det
 * finns ingen annan yta i denna vy där den syns.
 *
 * `update-record` ligger MEDVETET INTE i normalläget (`handlers.ts`): ingen
 * annan acceptance-fil rör betalningarnas skrivyta, och en delad
 * skriv-handler hade svarat 200 på mutationer andra filer inte menar att
 * göra. Varje test här överskuggar den självt — samma skäl som
 * `send-action-email`s syskonfiler anger för sin.
 */

/** Anna Andersson, `fixture-data.ts` § REGISTRATIONS_RESPONSE (rad ~157) —
 * eventNamn "Utbildning Skövde", personId `recVisualPers00001`. */
const ANNA_NOTERINGSFALT = 'Notering anmälningsavgift för Anna Andersson';

/**
 * Precis den sortens känsliga fritext Lotta faktiskt skriver i fältet — och
 * som ALDRIG får hamna i en logg som andra kan läsa (S105 Del 2 beslut 2).
 */
const HEMLIG_NOTERING = 'Sjukskriven, betalar efter lönen den 25:e — ring inte igen';
const FRAGMENT = ['Sjukskriven', 'lönen', '25:e', 'ring inte igen'];

type Kropp = Record<string, unknown>;

/** Öppnar Åtgärds-sidans betalnings-panel och returnerar noteringsfältet.
 * Knappens namn är "Pricka av och notera" — INTE sektionsrubriken
 * "Betalningar" (`AtgardsSida.tsx` rad ~3079; "…och påminn" ströks i varv 12). */
async function oppnaBetalningar(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
  await page.getByRole('button', { name: /Pricka av och notera/ }).click();
  const falt = page.getByLabel(ANNA_NOTERINGSFALT);
  await expect(falt).toBeVisible();
  return falt;
}

test.describe('Betalningsnoteringens aktivitetslogg (TASK-201.13)', () => {
  test('RIKTNING 1/2 — noteringen SPARAS: posten skapas, och fritexten finns INTE någonstans i den', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];
    let skrivKropp: Kropp | null = null;

    network.use(
      http.post(EF('update-record'), async ({ request }) => {
        skrivKropp = (await request.json()) as Kropp;
        return json({ ok: true });
      }),
      http.post(EF('log-activity'), async ({ request }) => {
        const body = (await request.json()) as Kropp;
        loggar.push(body);
        const b = body as unknown as {
          id: string;
          context: { extensions: Record<string, string> };
        };
        return json(
          {
            id: b.id,
            requestId: Object.values(b.context.extensions)[0],
            occurredAt: '2026-08-13T08:00:00.000Z',
          },
          201,
        );
      }),
    );

    const falt = await oppnaBetalningar(page);
    await falt.fill(HEMLIG_NOTERING);
    await falt.blur(); // commit-punkten (`SkrivRad` § spara)

    // Den riktiga skrivningen bär fritexten — det SKA den (det är basens fält).
    await expect.poll(() => skrivKropp).not.toBeNull();
    expect(JSON.stringify(skrivKropp)).toContain('Sjukskriven');

    // Aktivitetsposten skapas — EN post för EN sparad notering.
    await expect.poll(() => loggar.length).toBe(1);

    // INTEGRITETEN FÖRST, mätt på HELA den utgående kroppen — inte på de fält
    // vi råkade tänka på. Detta är assertionen som fälls om någon framtida
    // ändring trär noteringen genom `useUpdatePaymentNote`s onSuccess.
    //
    // ORDNINGEN ÄR MEDVETEN: form-assertionerna nedan (verb, objektnamn) fälls
    // OCKSÅ av en läcka som byggs in i namnet, och skulle då skugga integritets-
    // assertionen så att fällningen såg ut att handla om en formulering.
    // Verifierat 2026-08-13 genom att skarpt injicera `: ${notering}` i hookens
    // object.name: med denna ordning namnger fällningen fritext-fragmentet.
    const payload = JSON.stringify(loggar[0]);
    expect(payload, 'HELA noteringen läckte in i aktivitetsposten').not.toContain(HEMLIG_NOTERING);
    for (const fragment of FRAGMENT) {
      expect(
        payload,
        `fritext-fragmentet "${fragment}" läckte in i aktivitetsposten`,
      ).not.toContain(fragment);
    }

    const logg = loggar[0] as unknown as {
      verb: { display: Record<string, string> };
      object: { id: string; definition: { name: Record<string, string>; type: string } };
    };
    expect(logg.verb.display['sv-SE']).toBe('uppdaterade noteringen för anmälningsavgiften');
    expect(logg.object.definition.name['sv-SE']).toBe('Anna Andersson (Utbildning Skövde)');
    expect(logg.object.id).toContain('recVisualReg000001');
  });

  test('RIKTNING 2/2 — skrivningen MISSLYCKAS: ingen aktivitetspost skapas alls', async ({
    page,
    network,
  }) => {
    const loggar: Kropp[] = [];

    network.use(
      // Basen avvisar — mutationen går aldrig till onSuccess.
      http.post(EF('update-record'), () => json({ error: 'Airtable 422' }, 422)),
      medvetetOanvand(
        http.post(EF('log-activity'), async ({ request }) => {
          loggar.push((await request.json()) as Kropp);
          return json({ id: 'x', requestId: 'x', occurredAt: '2026-08-13T08:00:00.000Z' }, 201);
        }),
        'NEGATIV SENSOR: handlern finns för att bevisa att log-activity ALDRIG anropas när ' +
          'skrivningen föll. Att den förblir oanvänd ÄR testets resultat — `loggar` ska vara tom. ' +
          'Matchar den ändå har instrumenteringen flyttat ut ur onSuccess och testet ska falla.',
      ),
    );

    const falt = await oppnaBetalningar(page);
    await falt.fill(HEMLIG_NOTERING);
    await falt.blur();

    // Felytan bekräftar att mutationen FAKTISKT föll (utan denna rad kunde
    // testet vara grönt för att inget hände alls). 422 kortsluter båda
    // retry-lagren (`acceptance-bas.ts` § TIDEN HÖR TILL KONTRAKTET: 4xx
    // retryas inte), så den normala expect-timeouten räcker.
    await expect(page.getByText('Kunde inte spara')).toBeVisible();

    // INGEN aktivitetspost — en logg som antecknar något som aldrig hände
    // vore värre än ingen logg (PRD TASK-201 användarberättelse 9).
    expect(loggar).toHaveLength(0);
  });
});
