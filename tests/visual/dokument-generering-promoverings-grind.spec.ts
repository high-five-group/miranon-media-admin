import { http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from '../support/fixturvarld/hermetic';

/**
 * PROMOVERINGS-GRINDEN för Genereringsvyn (`ADR-103` B4, `TASK-309.8`).
 *
 * ORDNINGEN VAR ENKELRIKTAD, samma disciplin som
 * `personer-promoverings-grind.spec.ts`/`eventsida-promoverings-grind.spec.ts`
 * (precedenten denna fil följer): referenserna under `__aria__/` FÅNGADES
 * i variant-läge (`?variant=a&vy=generering&mall=…`, DEV-gatead,
 * `GenereringsPrototyp.tsx` — nu riven) FÖRE flippen, eftersom det läget
 * upphör att existera i samma sekund flaggan rivs. Konkret sekvens (körd
 * manuellt i denna landning, TASK-309.8): `git stash` (återställer
 * pre-flip-koden i arbetsträdet utan att röra den då-otrackade testfilen)
 * → denna fil temporärt navigerad mot `&variant=a` → `TASK_309_8_CAPTURE_
 * BEFORE_FLIP=1 PLAYWRIGHT_VISUAL_DEV_SERVER=1 npx playwright test
 * --project=visual-desktop tests/visual/dokument-generering-promoverings-
 * grind.spec.ts --update-snapshots` → alla fem gröna, referenserna
 * committade → `git stash pop` (återställer promoveringen) → capture-
 * växeln borttagen ur denna fil → samma svit körd IGEN utan
 * `--update-snapshots` mot den promoverade routen (nedan) → alla fem
 * gröna igen, oförändrade referenser. De är ORÖRDA sedan capturen. Denna
 * fil bevisar ATT den promoverade genereringsvyn (`GenereringsVy.tsx`,
 * monterad direkt av `dokument.tsx`s routekomponent utan `?variant=a`)
 * renderar EXAKT samma träd som variant-läget gjorde — formen följde med
 * promoveringen, ingenting annat smög in (`ADR-103` B2 steg 4).
 *
 * VARFÖR ARIASNAPSHOT OCH INTE PIXLAR: samma skäl som precedenten —
 * deterministiskt, noll nya beroenden, jämför STRUKTUR + TILLGÄNGLIGT
 * NAMN. Pixel-diff är den bokförda eskaleringsvägen om `ariaSnapshot`
 * empiriskt missar en formskillnad, inte default.
 *
 * SCOPE — fem lägen, valda mot de faktiska formbesluten i konvergensen:
 *
 *   1–2. **Genereringsvyns huvudyta**, en gång per mall (`bekraftelse` och
 *        `deltagarinfo`) — `data-testid="generering-vy"`. Bär huvuddelen
 *        av formen: Inforutan-sektionen, rubrikgrupperna, varnings-rutan
 *        för utelämnade block, Skapa/Förhandsgranska-knapparna.
 *   3. **Block-dialogen, TEXT-läget** (`beskrivning`, mallen `bekraftelse`)
 *      — löptext-textarean, standard/egen-hjälptexten.
 *   4. **Block-dialogen, AGENDA-läget** (`dagEtt`, mallen `bekraftelse`)
 *      — `AgendaEditor`s radlista.
 *   5. **Block-dialogen, PLATS-fält-läget** (`klader`, mallen
 *      `deltagarinfo`) — samma textläge som (3) men MED
 *      "Använd som standard för <ort>"-kryssrutan (`def.platsFalt`).
 *
 * MEDVETET UTANFÖR — "DATUM"-LÄGET (öppen skuld, bokförd, INTE
 * fabricerad): `BlockDialog.tsx` har en fjärde intern gren
 * (`def.datum ? <DatumEnkel .../> : …`), men det ENDA blocket i `GRUPPER`
 * som bär `datum: true` (`sistaBetalningsdag`) hör till Inforutan-gruppen
 * — och Inforutans rader öppnar ALDRIG `BlockDialog` (de redigeras som
 * SEKTION via `InforutanMorf`, se `GenereringsVy.tsx`s `arInforutan`-
 * villkor: varje Inforuta-rad är `lasEndast`). Datum-grenen är därför
 * strukturellt ONÅBAR via den levande UI:n i dagens `GRUPPER`-karta —
 * att tvinga fram den hade krävt att FLYTTA `sistaBetalningsdag` ut ur
 * Inforutan, vilket är en FORMÄNDRING (`GRUPPER` är del av formen
 * `ADR-103` B2 steg 4 fredar). Verifierat via källäsning
 * (`blockDefinitioner.ts` § GRUPPER, `GenereringsVy.tsx` §
 * `arInforutan`/`lasEndast`), inte antaget.
 *
 * FIXTURVÄRLDEN: `get-events` är GLOBALT mockad (`EVENTS_RESPONSE`,
 * `VISUAL_EVENT_ID`) — `EventValjare`/dispatchern i `dokument.tsx` hittar
 * eventet utan extra uppsättning. `get-document-sources` mockas HÄR, per
 * test, med `MOCK_SOURCES` — samma `DocumentSources`-shape som
 * `dokument-event-mallad-inaktuell.acceptance.test.ts` etablerade
 * (TASK-309.6), utökad med en agenda-rad och ett `klader`-värde så
 * agenda-/plats-lägena har verkligt innehåll att visa i stället för
 * tomma varningstillstånd.
 */

const MOCK_SOURCES: DocumentSources = {
  event: {
    id: VISUAL_EVENT_ID,
    eventNamn: 'Resor i medvetandet 1',
    typ: 'Utbildning',
    ort: 'Arboga',
    startdatum: '2026-10-31',
    slutdatum: '2026-11-01',
    eventlabel: 'Arboga - Utbildning - Resor i medvetandet 1 - 2026-10-31',
  },
  eventinnehall: { id: 'recEventinnehall1', namn: 'Resor i medvetandet 1 · Utbildning' },
  plats: { id: 'recPlats1', namn: 'Rönninge' },
  agenda: {
    dag1: {
      standard: [
        { text: 'Samling och incheckning', tid: '09:00', meditation: false },
        { text: 'Morgonmeditation', tid: '09:30', meditation: true },
        { text: 'Lunch', tid: '12:00', meditation: false },
      ],
      kopia: null,
    },
    dag2: { standard: [], kopia: null },
  },
  kopior: {
    tid: { standard: 'kl. 10:00 - 17:00', kopia: null },
    pris: { standard: '2.500', kopia: null },
    anmalningsavgift: { standard: '1000:-', kopia: null },
    resterandeBelopp: { standard: '1500:-', kopia: null },
    sistaBetalningsdag: { standard: '2026-10-17', kopia: null },
    beskrivning: { standard: 'En beskrivning av utbildningen.', kopia: null },
    forberedelser: { standard: null, kopia: null },
    tagMed: { standard: null, kopia: null },
    rokning: { standard: null, kopia: null },
    parfym: { standard: null, kopia: null },
    mat: { standard: null, kopia: null },
    overnattning: { standard: null, kopia: null },
    utrustning: { standard: null, kopia: null },
    adress: { standard: 'Uttringe Hages väg 17, Rönninge', kopia: null },
    parkering: { standard: null, kopia: null },
    transport: { standard: null, kopia: null },
    klader: { standard: 'Varma kläder och bekväma inneskor.', kopia: null },
  },
};

test.beforeEach(({ network }) => {
  network.use(
    http.get(EF('get-document-sources'), () =>
      json(MOCK_SOURCES as unknown as Record<string, unknown>),
    ),
  );
});

/**
 * EFTER-läget: den PROMOVERADE, ovillkorliga ytan — `dokument.tsx`s
 * routekomponent dispatchar direkt till `GenereringsVy` på `?vy=generering`,
 * ingen `?variant=a`. Detta (adressen utan `variant`) var den ENDA raden
 * som ändrades mellan FÖRE- och EFTER-capturen.
 */
async function gotoGenerering(
  page: import('@playwright/test').Page,
  mall: 'bekraftelse' | 'deltagarinfo',
) {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=${mall}`);
  await expect(page.getByTestId('generering-vy')).toBeVisible();
  // Vänta ut den riktiga hämtningen (get-document-sources) — annars kan
  // snapshotten fångas mitt i "Hämtar underlag …"-laddningsläget, som
  // MEDVETET står utanför denna grinds scope (samma skäl som
  // personer-promoverings-grind.spec.ts § laddningsläget).
  await expect(page.getByText('Hämtar underlag …')).toHaveCount(0);
}

test.describe('promoverings-grinden — genereringsvyns huvudyta (ADR-103 B4)', () => {
  test('bekräftelsebilagan', async ({ page }) => {
    await gotoGenerering(page, 'bekraftelse');
    await expect(page.getByRole('heading', { level: 1, name: 'Bekräftelsebilaga' })).toBeVisible();
    await expect(page.getByTestId('generering-vy')).toMatchAriaSnapshot({
      name: 'generering-bekraftelse.aria.yml',
    });
  });

  test('deltagarinformationen', async ({ page }) => {
    await gotoGenerering(page, 'deltagarinfo');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Deltagarinformation' }),
    ).toBeVisible();
    await expect(page.getByTestId('generering-vy')).toMatchAriaSnapshot({
      name: 'generering-deltagarinfo.aria.yml',
    });
  });
});

test.describe('promoverings-grinden — block-dialogens lägen (ADR-103 B4)', () => {
  test('text-läget — Beskrivning (bekräftelsebilagan)', async ({ page }) => {
    await gotoGenerering(page, 'bekraftelse');
    await page.getByRole('button', { name: /Ändra beskrivning/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Beskrivning' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toMatchAriaSnapshot({ name: 'block-dialog-text.aria.yml' });
  });

  test('agenda-läget — Dag 1 (bekräftelsebilagan)', async ({ page }) => {
    await gotoGenerering(page, 'bekraftelse');
    await page.getByRole('button', { name: /Ändra dag 1/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Dag 1' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toMatchAriaSnapshot({ name: 'block-dialog-agenda.aria.yml' });
  });

  test('plats-fält-läget — Kläder (deltagarinformationen)', async ({ page }) => {
    await gotoGenerering(page, 'deltagarinfo');
    await page.getByRole('button', { name: /Ändra kläder/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Kläder' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toMatchAriaSnapshot({ name: 'block-dialog-plats.aria.yml' });
  });
});
