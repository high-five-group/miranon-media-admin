import { delay, http } from 'msw';
import type { PlaceListItem } from '../../src/domain/schemas';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.36 — samma buggklass som TASK-309.25/PR #1998, denna gång i
 * Mer → Platser (`PlatserYta.tsx`). `sparaBlock`s `onSpara`-callback
 * (rad ~273–274) stänger block-dialogen SYNKRONT i samma klick som Spara —
 * utan en optimistisk cache-write i `useSavePlace.ts` (FÖRE denna skiva:
 * ingen `onMutate`, ren `mutationFn` → `onSuccess` → `onSettled`) låg
 * `queryKeys.places.list`-cachen kvar med det GAMLA fältvärdet tills
 * `onSettled`s invalidering hunnit refetcha — precis det sekventiella
 * dubbel-nätverksanrop `useSaveEventText.ts`s docblock beskriver för
 * genereringsvyn. Blocklistans rader visar ALDRIG fältets rå-text (bara
 * etiketten + en "Tomt"-badge om fältet är tomt, se `PlatserYta.tsx`s
 * `<ul data-testid="plats-block-lista">`), så det EXTERNT observerbara
 * osparad-symptomet är tvåfaldigt: (1) återöppnar man samma rad omedelbart
 * visar textrutan det GAMLA värdet, och (2) ett fält som just fylldes i
 * behåller sin "Tomt"-badge tills refetchen landar.
 *
 * MOCK-FÖRDRÖJNINGEN (700 ms på `save-place-standard`) är avsiktligt STOR
 * nog att ett test som RÅKAR vänta på nätverket alltid skulle falla på den
 * korta assertions-timeouten (250 ms) nedan — samma disciplin som
 * `dokument-genereringsvy-optimistisk-sparning.acceptance.test.ts`
 * (TASK-309.25): ett UI som väntar på EF-svaret KAN INTE klara dessa test,
 * oavsett hur snabb den riktiga staging-EF:en råkar vara den dagen.
 *
 * EF:en är `save-place-standard` (i sitt event-lösa `platsId`/`namn`-läge,
 * TASK-309.7) — samma EF-namn `mer-platser.acceptance.test.ts` redan
 * använder för denna yta (`DataSourceAdapter.savePlace`, se
 * `AirtableAdapter.ts`s `savePlace`).
 */

const RONNINGE: PlaceListItem = {
  id: 'recPlatsRonninge01',
  namn: 'Rönninge',
  falt: {
    adress: 'Uttringe Hages väg 17, Rönninge',
    parkering: '15 parkeringsplatser.',
    transport: 'Vi kan hämta på stationen.',
    klader: 'Mjukiskläder.',
  },
};

const NY_PARKERING = '20 platser numera.';

async function oppnaRonninge(page: import('@playwright/test').Page) {
  await page.goto('/mer/platser');
  await page.getByRole('button', { name: RONNINGE.namn }).click();
  await expect(page.getByRole('heading', { level: 2, name: RONNINGE.namn })).toBeVisible();
}

/** Delad handler-uppsättning: `plats` är den muterbara "servern" — samma
 *  mönster som `mer-platser.acceptance.test.ts`s `listan`-variabel. */
function nätverk(
  network: import('@msw/playwright').NetworkFixture,
  plats: { current: PlaceListItem },
  fördröjMs: number,
) {
  network.use(http.get(EF('get-places'), () => json({ places: [plats.current] })));
  network.use(
    http.post(EF('save-place-standard'), async ({ request }) => {
      const body = (await request.json()) as { platsId?: string; falt?: Record<string, string> };
      await delay(fördröjMs);
      if (body.falt) {
        plats.current = { ...plats.current, falt: { ...plats.current.falt, ...body.falt } };
      }
      return json({
        ok: true,
        plats: { id: plats.current.id, namn: plats.current.namn, skapad: false },
      });
    }),
  );
}

test.describe('Mer — Platser — optimistisk sparning (TASK-309.36)', () => {
  test('fält: nytt värde syns direkt vid återöppning av dialogen, innan EF:en svarat', async ({
    page,
    network,
  }) => {
    const plats = { current: RONNINGE };
    nätverk(network, plats, 700);

    await oppnaRonninge(page);

    await page.getByRole('button', { name: 'Parkering' }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(NY_PARKERING);
    await dialog.getByRole('button', { name: 'Spara' }).click();
    await expect(dialog).toBeHidden();

    // KÄRNAN: återöppnar man raden OMEDELBART (innan den 700 ms-fördröjda
    // EF:en ens hunnit svara) ska det NYA värdet redan synas — inte det
    // gamla.
    await page.getByRole('button', { name: 'Parkering' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toHaveValue(NY_PARKERING, { timeout: 250 });
    await dialog.getByRole('button', { name: 'Avbryt' }).click();
    await expect(dialog).toBeHidden();

    // Ingen flimmer-tillbaka när den riktiga refetchen väl landar (samma
    // värde ekas av mock-servern ovan — `onSettled`s invalidering ska
    // BEKRÄFTA det optimistiska värdet, aldrig motsäga det).
    await page.waitForTimeout(900);
    await page.getByRole('button', { name: 'Parkering' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toHaveValue(NY_PARKERING);
  });

  test('tomt fält: "Tomt"-badgen försvinner direkt efter Spara, innan EF:en svarat', async ({
    page,
    network,
  }) => {
    const plats = { current: { ...RONNINGE, falt: { ...RONNINGE.falt, transport: null } } };
    nätverk(network, plats, 700);

    await oppnaRonninge(page);

    const transportRad = page.getByRole('button', { name: 'Transport' });
    await expect(transportRad.getByText('Tomt')).toBeVisible();

    await transportRad.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill('Vi kan hämta på stationen igen.');
    await dialog.getByRole('button', { name: 'Spara' }).click();
    await expect(dialog).toBeHidden();

    await expect(transportRad.getByText('Tomt')).toHaveCount(0, { timeout: 250 });
  });

  test('felväg: EF-fel → värdet återställs (rollback), ingen tyst förlust (AC #1)', async ({
    page,
    network,
  }) => {
    const plats = { current: RONNINGE };
    network.use(http.get(EF('get-places'), () => json({ places: [plats.current] })));
    network.use(
      http.post(EF('save-place-standard'), async () =>
        json({ error: 'Kunde inte spara platsen' }, 500),
      ),
    );

    await oppnaRonninge(page);

    await page.getByRole('button', { name: 'Parkering' }).click();
    let dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(NY_PARKERING);
    await dialog.getByRole('button', { name: 'Spara' }).click();
    await expect(dialog).toBeHidden();

    // Optimistiskt värde syns FÖRST (samma mekanism som ovan)…
    await page.getByRole('button', { name: 'Parkering' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toHaveValue(NY_PARKERING, { timeout: 250 });
    await dialog.getByRole('button', { name: 'Avbryt' }).click();
    await expect(dialog).toBeHidden();

    // …men rullas TILLBAKA när EF:en (efter fetchWithRetrys 3 försök) till
    // sist fäller. DETERMINISTISK väntan (TASK-309.36, review-runda 1 på
    // #2055, F1/F3 — en tidigare version väntade en FAST 2,5 s i stället,
    // vilket bara flyttade gissningen till en annan konstant): felmedde-
    // landet är den observerbara signalen att `onError` (och därmed
    // rollbacken, SAMMA callback) har körts, samma mönster som
    // `dokument-genereringsvy-optimistisk-sparning.acceptance.test.ts`
    // (TASK-309.25) väntar in `/Ändringen kunde inte sparas/`.
    await expect(page.getByText(/Ändringen kunde inte sparas/)).toBeVisible();

    await page.getByRole('button', { name: 'Parkering' }).click();
    dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('textbox')).toHaveValue(RONNINGE.falt.parkering ?? '');
    await dialog.getByRole('button', { name: 'Avbryt' }).click();
    await expect(dialog).toBeHidden();
  });

  test('fel på Plats A rensas vid platsbyte — läcker INTE till Plats B (review-runda 2 på #2055)', async ({
    page,
    network,
  }) => {
    /**
     * NYTT ERROR från F1-fixen (review-runda 2 på #2055): `spara` (rad ~88)
     * är EN delad `useSavePlace()`-instans för HELA `PlatserYta`-komponenten
     * — den remountas ALDRIG när `valdId` byter plats, till skillnad från
     * `GenereringsVy.tsx`s precedent (`dokument.tsx` rad ~48–52,
     * `key={`${valtEvent.id}-${mall}`}`). Utan `spara.reset()` i BÅDA
     * `setValdId`-anropen ("‹ Alla platser", platsvalet) hade `isError`
     * legat kvar sant efter ett fel på Plats A och visats igen under
     * Plats B — fel plats, samma felmeddelande.
     */
    const UPPSALA: PlaceListItem = {
      id: 'recPlatsUppsala01',
      namn: 'Uppsala',
      falt: { adress: 'Kungsgatan 1, Uppsala', parkering: null, transport: null, klader: null },
    };
    network.use(http.get(EF('get-places'), () => json({ places: [RONNINGE, UPPSALA] })));
    network.use(
      http.post(EF('save-place-standard'), async () =>
        json({ error: 'Kunde inte spara platsen' }, 500),
      ),
    );

    await page.goto('/mer/platser');

    // Fel på Plats A (Rönninge).
    await page.getByRole('button', { name: RONNINGE.namn }).click();
    await expect(page.getByRole('heading', { level: 2, name: RONNINGE.namn })).toBeVisible();
    await page.getByRole('button', { name: 'Parkering' }).click();
    const dialogA = page.getByRole('dialog');
    await dialogA.getByRole('textbox').fill(NY_PARKERING);
    await dialogA.getByRole('button', { name: 'Spara' }).click();
    await expect(dialogA).toBeHidden();
    await expect(page.getByText(/Ändringen kunde inte sparas/)).toBeVisible();

    // Tillbaka till listan, öppna Plats B (Uppsala) — INGEN ny sparning görs.
    await page.getByRole('button', { name: 'Alla platser' }).click();
    await page.getByRole('button', { name: UPPSALA.namn }).click();
    await expect(page.getByRole('heading', { level: 2, name: UPPSALA.namn })).toBeVisible();

    // KÄRNAN: Plats A:s felmeddelande får INTE läcka till Plats B.
    await expect(page.getByText(/Ändringen kunde inte sparas/)).toHaveCount(0);
  });
});
