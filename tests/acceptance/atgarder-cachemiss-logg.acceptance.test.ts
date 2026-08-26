import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-201.14 — `useSendActionEmail`s VILLKORLIGA LUCKA, stängd och bevisad
 * genom den RIKTIGA hooken på den väg Lotta faktiskt använder.
 *
 * VAD FILEN BEVISAR: att en aktivitetspost skrivs för VARJE ID i serverns
 * `result.completed` — även när klientens uppslag mot `mottagare` missar.
 * Raden löd tidigare `if (!reg) continue` (`actionEmail.ts` § `onSuccess`)
 * och släppte då posten TYST: ett mail hade lämnat systemet utan ett spår i
 * historiken.
 *
 * VARFÖR ACCEPTANCE OCH INTE api-pure: testet HAR databeteende — det driver
 * Åtgärds-sidans verkliga sändväg (`AtgardsSida.tsx` rad ~2212, dagens
 * bulk-bekräftelseväg) och läser den FAKTISKA utgående `log-activity`-
 * kroppen där den lämnar klienten. Ett statement-test på composer-nivå kan
 * strukturellt inte se `onSuccess`-loopens grenval, som är precis det som
 * ändrats. Hermetik-vakten (ADR-080) är nöjd: varje svar kommer ur
 * fixturvärlden.
 *
 * ABSOLUT MAILFÖRBUD: `send-action-email` överskuggas i VARJE test nedan och
 * är medvetet utanför normalläget (`handlers.ts`) — ingen sändväg utlöses
 * skarpt, ingen adress lämnar fixturvärlden.
 *
 * FIXTUREN ÅTERANVÄNDS OFÖRÄNDRAD (`VISUAL_EVENT_ID`, samma "Utbildning
 * Skövde"-event som `atgarder-bekraftelsemail-send.acceptance.test.ts`):
 * åtgärden "Skicka bekräftelsemail" (`urvalsfilter: obekraftad`) biter ned
 * urvalet till TVÅ — Anna och Björn — verifierat mot `REGISTRATIONS_RESPONSE`
 * i `fixture-data.ts`, inte antaget.
 */

const ANNA = 'recVisualReg000001';
const BJORN = 'recVisualReg000002';
/** Annas Person-länk i fixturen — kontrasten mot det okända ID:t nedan. */
const ANNA_PERSON = 'recVisualPers00001';

/**
 * Ett ID servern rapporterar som `completed` men som INTE finns i klientens
 * `mottagare`-lista — exakt det läge `if (!reg) continue` tystade.
 *
 * ATT DET INTE KAN UPPSTÅ I DAGENS UI ÄR POÄNGEN, INTE EN INVÄNDNING:
 * `AtgardsSida` skickar `registrationIds: mottagare.map(r => r.id)`, så de
 * två listorna är alltid parade på den levande vägen. Luckan var därför en
 * TYST försvarslinje mot ett läge "som inte kan hända" — och den sortens
 * försvarslinje är precis vad som brister obemärkt när kontraktet en dag
 * ändras (idempotens-återspelning, batch-sammanslagning, en framtida
 * EF-gren). Fixturvärlden kan framkalla läget; produktionen ska inte behöva
 * det för att loggen ska vara sann.
 */
const OKANT_ID = 'recServernsEgna01';

async function gotoAtgarder(page: import('@playwright/test').Page) {
  await page.goto(`/event/${VISUAL_EVENT_ID}/atgarder`);
  await expect(page.getByTestId('eventet-block')).toBeVisible();
}

async function oppnaOchGranska(page: import('@playwright/test').Page, atgardsnamn: string) {
  await page.getByRole('button', { name: new RegExp(atgardsnamn) }).click();
  await page.getByRole('button', { name: 'Granska och skicka' }).click();
}

/** Armerar SlideToConfirm via tangentbord (samma väg som sändvägs-sviten). */
async function armera(page: import('@playwright/test').Page) {
  const vaxel = page.getByRole('switch', { name: 'Bekräfta utskicket' });
  await vaxel.focus();
  await vaxel.press('Enter');
}

/** Ett `log-activity`-statement i den form EF:en tar emot. */
interface FangatStatement {
  verb: { display: Record<string, string> };
  object: { id: string; definition: { name: Record<string, string>; type: string } };
  context: { extensions: Record<string, string> };
}

/**
 * Överskuggar normallägets `log-activity`-handler och samlar VARJE utgående
 * kropp. MSW prövar senast-registrerade handler först (samma mönster som
 * `event-anteckningar.acceptance.test.ts` § integritets-testet), så denna
 * vinner över `handlers.ts`s normalläges-svar.
 */
function fangaAktivitetsposter(network: { use: (...h: ReturnType<typeof http.post>[]) => void }) {
  const poster: FangatStatement[] = [];
  network.use(
    http.post(EF('log-activity'), async ({ request }) => {
      const body = (await request.json()) as FangatStatement & { id: string; timestamp: string };
      poster.push(body);
      return json(
        {
          id: body.id,
          requestId: Object.values(body.context.extensions)[0],
          occurredAt: body.timestamp,
        },
        201,
      );
    }),
  );
  return poster;
}

test.describe('Aktivitetsloggens villkorliga lucka i useSendActionEmail (TASK-201.14)', () => {
  test('POSTEN SKRIVS ÄVEN NÄR UPPSLAGET MISSAR — okänt completed-ID ger "Okänd anmälan" utan person-koppling', async ({
    page,
    network,
  }) => {
    const poster = fangaAktivitetsposter(network);

    network.use(
      http.post(EF('send-action-email'), async () =>
        json({
          status: 'partial',
          requested: 2,
          attempted: 2,
          // KÄRNAN: Anna finns i klientens urval, OKANT_ID gör det inte.
          // Servern säger att BÅDA fick sitt mail — loggen ska spegla det.
          completed: [ANNA, OKANT_ID],
          skipped: [{ registrationId: BJORN, reason: 'already_confirmed' }],
          failed: [],
        }),
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    // Sändningen gick igenom på riktigt — utan detta steg vore
    // räkne-assertionen nedan sann på ett flöde som aldrig startade.
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toBeVisible();

    // Fire-and-forget → vänta in BÅDA anropen. Räkningen ÄR beviset: med
    // `if (!reg) continue` stannade den på 1.
    await expect.poll(() => poster.length).toBe(2);

    const namn = poster.map((p) => p.object.definition.name['sv-SE']).sort();
    expect(namn).toEqual(['Anna Andersson (Utbildning Skövde)', 'Okänd anmälan']);

    // Den kända mottagaren är oförändrad — fallbacken får inte kosta det
    // namn vi FAKTISKT har.
    const annas = poster.find((p) => p.object.definition.name['sv-SE'].startsWith('Anna'));
    expect(annas).toBeDefined();
    const annasPost = annas as FangatStatement;
    expect(annasPost.verb.display['sv-SE']).toBe('skickade bekräftelsemail');
    expect(annasPost.object.id).toContain(ANNA);
    // Person-kopplingen FINNS när raden finns.
    expect(Object.values(annasPost.context.extensions)).toContain(ANNA_PERSON);

    const okand = poster.find((p) => p.object.definition.name['sv-SE'] === 'Okänd anmälan');
    expect(okand).toBeDefined();
    const okandPost = okand as FangatStatement;
    // Posten är i övrigt FULLVÄRDIG: rätt verb, rätt objekt-identitet, rätt
    // kategori — bara namnet är en platshållare.
    expect(okandPost.verb.display['sv-SE']).toBe('skickade bekräftelsemail');
    expect(okandPost.object.id).toContain(OKANT_ID);
    expect(okandPost.object.definition.type).toContain('/activity-types/mail');

    // PERSON-KOPPLINGENS ÖDE, MÄTT OCH ÖPPET: den går förlorad — `mottagare`
    // är hookens enda källa till `personId`. Nyckeln UTELÄMNAS helt hellre än
    // att bära ett gissat ID (`recordActivity.ts` § personId). Assertionen
    // låser den ärligheten: ett påhittat person-ID här hade fällt testet.
    expect(Object.values(okandPost.context.extensions)).not.toContain(ANNA_PERSON);
    expect(JSON.stringify(okandPost.context.extensions)).not.toContain('recVisualPers');

    // INTEGRITETEN: ingen fritext ur utskicket når statementet. Ämnet och
    // mailtexten finns i mutationens variabler men destruktureras aldrig in
    // i `onSuccess`s scope — assertionen fäller om det någonsin ändras.
    const helaPayloaden = JSON.stringify(poster);
    expect(helaPayloaden).not.toContain('Din plats är bekräftad');
    expect(helaPayloaden).not.toContain('Varmt välkommen');
    expect(helaPayloaden).not.toContain('{förnamn}');
  });

  test('INGEN POST NÄR MUTATIONEN MISSLYCKAS — ett fallet utskick loggas aldrig', async ({
    page,
    network,
  }) => {
    const poster = fangaAktivitetsposter(network);

    network.use(
      http.post(EF('send-action-email'), async () =>
        json({ error: 'Utskicket kunde inte behandlas' }, 500),
      ),
    );

    await gotoAtgarder(page);
    await oppnaOchGranska(page, 'Skicka bekräftelsemail');
    await armera(page);
    await page.getByRole('button', { name: 'Skicka till 2 personer' }).click();

    // Mutationen föll PÅ RIKTIGT — felytan är ankaret. Utan detta steg vore
    // frånvaro-assertionen nedan sann även på ett flöde som aldrig startade,
    // och kunde därmed aldrig fälla (samma ordningsberoende som
    // `event-anteckningar.acceptance.test.ts` § integritets-testet beskriver).
    await expect(page.getByText('Kunde inte skicka utskicket')).toBeVisible();

    // Ingen "Skickat"-yta — flödet återvände till granskningen.
    await expect(page.getByRole('heading', { level: 1, name: 'Skickat' })).toHaveCount(0);

    // KÄRNAN: `recordActivity` sitter i `onSuccess` och nås aldrig. Att
    // stänga luckan får INTE göra loggen lögnaktig åt andra hållet — en post
    // för ett mail som aldrig skickades vore lika fel som en saknad post för
    // ett som skickades.
    expect(poster).toHaveLength(0);
  });
});
