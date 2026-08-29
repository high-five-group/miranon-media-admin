import { delay, http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.25 — Marcus prod-röktest 2026-08-26, ordagrant: "Jag gick till
 * plats och skrev in en adress bara för att testa, och tryckte på spara,
 * men sparandet laggade typ lite, det såg inte ut att bli sparat först men
 * sedan rätt var det va så var det sparat." Event: RIM 1 i Rönninge (prod),
 * som saknade Plats-länk — allt utom plats var förifyllt.
 *
 * ROTORSAKEN (diagnosen, se `useSaveEventText.ts`s uppdaterade docblock):
 * `GenereringsVy.tsx`s block-dialog/sektionsmorf stänger SYNKRONT i samma
 * klick som Spara (`onSpara`-callbacken, rad ~1088–1091, och
 * `InforutanMorf`-anropet, rad ~870) — `spara`/`sparaSektion` (rad ~605–648)
 * skriver mot `useSaveEventText`, som FÖRE denna skiva var rent
 * PESSIMISTISK (ingen `onMutate`). Listan las alltså kvar det GAMLA värdet
 * (React Query-cachen orörd) tills `onSettled`s invalidering hunnit
 * refetcha — ett sekventiellt dubbel-nätverksanrop.
 *
 * Denna fil bevisar den optimistiska fixen i BÅDA riktningar, för samtliga
 * TRE kategorier AC #4 namnger:
 *   1. text (plats/adress — Marcus EGEN repro)
 *   2. agenda (Dag 1)
 *   3. plats/"spara som platsens standard" (bunden till Skapa-mutationen,
 *      `useGenereraEventBilaga.ts` — AC #2:s ACCEPTABLA ALTERNATIV, ett
 *      explicit "Skapar …"-läge, redan finns där och ändras inte i denna
 *      skiva; testet nedan är ett REGRESSIONS-VÄRN, inte ett bevis på en ny
 *      kodändring)
 * …samt felvägen (AC #3): ett EF-fel rullar tillbaka till föregående värde
 * och visar felmeddelandet, ingen tyst förlust.
 *
 * MOCK-FÖRDRÖJNINGEN (700 ms på `save-event-text`) är avsiktligt STOR nog
 * att ett test som RÅKAR vänta på nätverket alltid skulle falla på den korta
 * assertions-timeouten (250 ms) nedan — det är själva poängen: ett UI som
 * väntar på EF-svaret KAN INTE klara detta test, oavsett hur snabb den
 * riktiga staging-EF:en råkar vara den dagen.
 */

const NY_ADRESS = 'Storgatan 5, Skövde';

function buildSources(
  adress: string | null,
  dag1Kopia: DocumentSources['agenda']['dag1']['kopia'],
): DocumentSources {
  return {
    event: {
      id: VISUAL_EVENT_ID,
      eventNamn: 'Utbildning Skövde',
      typ: 'Utbildning',
      ort: 'Skövde',
      startdatum: '2026-09-26',
      slutdatum: '2026-09-27',
      eventlabel: 'Skövde - Utbildning - Utbildning Skövde - 2026-09-26',
    },
    eventinnehall: { id: 'recEventinnehall1', namn: 'Utbildning Skövde · Utbildning' },
    plats: adress ? { id: 'recPlats1', namn: 'Skövde' } : null,
    agenda: {
      dag1: { standard: [], kopia: dag1Kopia },
      dag2: { standard: [], kopia: null },
    },
    kopior: {
      tid: { standard: 'kl. 10:00 - 17:00', kopia: null },
      pris: { standard: '2.500', kopia: null },
      anmalningsavgift: { standard: '1000:-', kopia: null },
      resterandeBelopp: { standard: '1500:-', kopia: null },
      sistaBetalningsdag: { standard: '2026-09-12', kopia: null },
      beskrivning: { standard: 'En beskrivning av utbildningen.', kopia: null },
      forberedelser: { standard: null, kopia: null },
      tagMed: { standard: null, kopia: null },
      rokning: { standard: null, kopia: null },
      parfym: { standard: null, kopia: null },
      mat: { standard: null, kopia: null },
      overnattning: { standard: null, kopia: null },
      utrustning: { standard: null, kopia: null },
      // Marcus egen repro: eventet saknade Plats-länk — standard OCH kopia
      // är båda null, "Fyll i plats" (inte "Ändra plats").
      adress: { standard: null, kopia: adress },
      parkering: { standard: null, kopia: null },
      transport: { standard: null, kopia: null },
      klader: { standard: null, kopia: null },
    },
  };
}

async function oppnaGenereringsVy(page: import('@playwright/test').Page) {
  await page.goto(`/mer/dokument?vy=generering&mall=bekraftelse&event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('generering-vy')).toBeVisible();
}

/**
 * BESLUT 5 (utelämnade block-varningen, `GenereringsVy.tsx` rad ~815–843)
 * bär SIN EGEN "Fyll i …"-genväg för varje tomt block, bredvid raden i
 * gruppen — samma synliga text, ett ANNAT `<Button>`-element. Ett
 * oskopat `getByRole('button', { name: 'Fyll i plats' })` matchar därför
 * BÅDA och faller i Playwrights strict mode. Skopa alltid till gruppens
 * `region` (sektionens `aria-labelledby`, se `section aria-labelledby=`)
 * för att träffa radens egen länk.
 */
function inforutan(page: import('@playwright/test').Page) {
  return page.getByRole('region', { name: 'Inforutan' });
}
function agenda(page: import('@playwright/test').Page) {
  return page.getByRole('region', { name: 'Agenda' });
}

test.describe('GenereringsVy — optimistisk sparning (TASK-309.25)', () => {
  test('text (plats/adress): nytt värde syns omedelbart efter Spara, innan EF:en svarat', async ({
    page,
    network,
  }) => {
    let adress: string | null = null;
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(buildSources(adress, null) as unknown as Record<string, unknown>),
      ),
      http.post(EF('save-event-text'), async ({ request }) => {
        const body = (await request.json()) as { falt?: { adress?: string | null } };
        await delay(700);
        if (body.falt && 'adress' in body.falt) adress = body.falt.adress ?? null;
        return json({ record: { id: 'recDebug309-25', fields: {} } });
      }),
    );

    await oppnaGenereringsVy(page);

    await inforutan(page).getByRole('button', { name: 'Fyll i plats' }).click();
    await page.getByRole('textbox', { name: 'Plats' }).fill(NY_ADRESS);
    await page.getByRole('button', { name: 'Spara' }).click();

    // KÄRNAN: värdet syns INNAN den 700 ms-fördröjda EF:en ens hunnit svara.
    await expect(page.getByText(NY_ADRESS)).toBeVisible({ timeout: 250 });
    await expect(page.getByRole('button', { name: 'Fyll i plats' })).toHaveCount(0);

    // Ingen flimmer-tillbaka när den riktiga refetchen väl landar (samma
    // värde ekas av mock-servern ovan — `onSettled`s invalidering ska
    // BEKRÄFTA det optimistiska värdet, aldrig motsäga det).
    await page.waitForTimeout(900);
    await expect(page.getByText(NY_ADRESS)).toBeVisible();
  });

  test('agenda (Dag 1): ny punkt syns omedelbart efter Spara, innan EF:en svarat', async ({
    page,
    network,
  }) => {
    let dag1: DocumentSources['agenda']['dag1']['kopia'] = null;
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(buildSources(null, dag1) as unknown as Record<string, unknown>),
      ),
      http.post(EF('save-event-text'), async ({ request }) => {
        const body = (await request.json()) as {
          agenda?: { dag: number; rader: { text: string; tid: string; meditation: boolean }[] };
        };
        await delay(700);
        if (body.agenda?.dag === 1) dag1 = body.agenda.rader;
        return json({ record: { id: 'recDebug309-25', fields: {} } });
      }),
    );

    await oppnaGenereringsVy(page);

    await agenda(page).getByRole('button', { name: 'Fyll i dag 1' }).click();
    await page.getByRole('button', { name: 'Lägg till punkt' }).click();
    // `exact: true` — "Tid, punkt 1" innehåller "punkt 1" som (skiftlägesokänslig)
    // delsträng och matchar annars också.
    await page.getByRole('textbox', { name: 'Punkt 1', exact: true }).fill('Inledning');
    await page.getByRole('button', { name: 'Spara' }).click();

    await expect(agenda(page).getByRole('button', { name: 'Ändra dag 1' })).toBeVisible({
      timeout: 250,
    });
    await expect(page.getByRole('button', { name: 'Fyll i dag 1' })).toHaveCount(0);
  });

  test('felväg: EF-fel → värdet återställs + felmeddelande, ingen tyst förlust (AC #3)', async ({
    page,
    network,
  }) => {
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(buildSources(null, null) as unknown as Record<string, unknown>),
      ),
      http.post(EF('save-event-text'), async () => json({ error: 'Kunde inte spara texten' }, 500)),
    );

    await oppnaGenereringsVy(page);

    await inforutan(page).getByRole('button', { name: 'Fyll i plats' }).click();
    await page.getByRole('textbox', { name: 'Plats' }).fill(NY_ADRESS);
    await page.getByRole('button', { name: 'Spara' }).click();

    // Optimistiskt värde syns FÖRST (samma mekanism som lyckad-testet ovan)…
    await expect(page.getByText(NY_ADRESS)).toBeVisible({ timeout: 250 });

    // …men rullas TILLBAKA när EF:en (efter fetchWithRetrys 3 försök) till
    // sist fäller — default Playwright-timeout räcker gott om marginal mot
    // retry-kedjans ~1,4–1,7 s (200 ms bas, exponentiell backoff + jitter).
    await expect(inforutan(page).getByRole('button', { name: 'Fyll i plats' })).toBeVisible();
    await expect(page.getByText(NY_ADRESS)).toHaveCount(0);
    await expect(page.getByText(/Ändringen kunde inte sparas/)).toBeVisible();
  });

  test('plats/"spara som platsens standard": Skapa-knappen visar tydligt Skapar-läge, aldrig ett osparat-utseende (AC #2/#4)', async ({
    page,
    network,
  }) => {
    // REGRESSIONS-VÄRN, INGEN NY KODÄNDRING: denna skrivväg är bunden till
    // Skapa-mutationen (`useGenereraEventBilaga.ts`, platsstandard-grenen)
    // och saknar egen optimistisk uppdatering — men mutationen är BLOCKERANDE
    // (knappens `aria-disabled` + text-byte) och stänger ingenting förrän den
    // löst ut, så AC #2:s "explicit Sparar…-läge tills EF:en svarat" håller
    // redan. `delay('infinite')`: testet behöver bara BEVISA att ingenting
    // (ingen resultat-yta, inget "klart"-utseende) visas förrän mutationen
    // avgörs — att den faktiskt löser ut hör till `useGenereraEventBilaga.ts`s
    // egna acceptance-täckning, inte denna fils.
    network.use(
      http.get(EF('get-document-sources'), () =>
        json(buildSources(null, null) as unknown as Record<string, unknown>),
      ),
      http.post(EF('generate-event-attachment'), async () => {
        await delay('infinite');
        return json({ attachment: {} });
      }),
    );

    await oppnaGenereringsVy(page);

    await page.getByRole('button', { name: 'Skapa Bekräftelsebilaga' }).click();

    await expect(page.getByRole('button', { name: 'Skapar …' })).toBeVisible();
    // [UPPDATERAD, TASK-340.2] Assertionen läste tidigare den gamla
    // resultattextens ord ("är skapad och ligger nu bland eventets
    // dokument"). Den texten finns inte längre — resultatet är nu en
    // bekräftelseYTA som ERSÄTTER formuläret — och en `toHaveCount(0)` mot en
    // sträng ingen kod kan producera är sann av fel skäl, alltså inget bevis
    // alls. Nu läses ytan själv (`data-testid="bekraftelse"`), som är exakt
    // det som INTE får ha dykt upp medan mutationen fortfarande väntar.
    await expect(page.getByTestId('bekraftelse')).toHaveCount(0);
  });
});
