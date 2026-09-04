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
 *   6. **Inforutans sektionsmorf — DATUM-läget** (`sistaBetalningsdag`,
 *      mallen `bekraftelse`) — `DatumEnkel`s segment-form. Se
 *      § DATUM-LÄGET nedan för varför den bor HÄR och inte bland
 *      block-dialogens lägen.
 *
 * DATUM-LÄGET SITTER I MORFEN, INTE I DIALOGEN (`TASK-309.17` avtäckte
 * det 2026-08-24, `TASK-309.19` rev den döda dialog-grenen 2026-08-26,
 * Marcus mandat väg A). `TASK-309.17`s premiss var att `BlockDialog`s
 * datum-gren saknade ariaSnapshot-par; mätningen visade i stället att
 * grenen ALDRIG gick att nå. Det ENDA blocket i `GRUPPER` som bär
 * `datum: true` (`sistaBetalningsdag`) hör till Inforutan-gruppen, och
 * DIT nådde dialogen aldrig — tre oberoende spärrar i källan, var och en
 * tillräcklig:
 *
 *   a. `GenereringsVy.tsx` § `lasEndast = r.def.last || arInforutan` —
 *      varje Inforuta-rad renderas som `<div>`, inte som knapp, så det
 *      finns ingen `oppnaBlock`-ingång att klicka.
 *   b. `GenereringsVy.tsx` § varningsrutans "Fyll i …"-knappar dispatchar
 *      `INFORUTA_IDN.has(id) ? oppnaMorf(id) : oppnaBlock(id)`.
 *   c. `GenereringsVy.tsx` § `dialogRader()` filtrerar bort
 *      `INFORUTA_IDN` ur `navSyskon`, så inte heller dialogens
 *      Föregående/Nästa-bläddring kunde nå blocket.
 *
 * `BlockDialog.tsx` bar därför en DÖD gren (`def.datum ? <DatumEnkel
 * .../> : …`, se dess egen `datumUtanAr`/`resterandeBeloppHjalp`).
 * `TASK-309.19` river den: att i stället FLYTTA `sistaBetalningsdag` ut
 * ur Inforutan hade varit en FORMÄNDRING som `ADR-103` B2 steg 4 fredar,
 * och rivning av onåbar kod rör ingen renderad yta. `blockDefinitioner.
 * ts`s `datum`-flagga och `DatumEnkel` lever kvar — `sistaBetalningsdag`
 * bär flaggan fortfarande, och Inforutans sektionsmorf i
 * `GenereringsVy.tsx` läser den (`r.def.datum ? <DatumEnkel .../> :
 * <Input .../>`), en helt annan renderingsväg än den rivna
 * dialog-grenen. Det datum-läge en användare FAKTISKT ser är alltså
 * morfens `DatumEnkel` (samma komponent, importerad ur `BlockDialog.
 * tsx`), och det är den ytan test 6 låser. `TASK-309.17`:s AC #1 (som
 * antog att den döda grenen kunde få ett par) är stängt som obsolet med
 * falsifieringen bokförd i kortets notes.
 *
 * TÄCKNINGEN, MÄTT 2026-08-24 (`TASK-309.16` AC #3 + `TASK-309.17` AC #3
 * — bokförd HÄR därför att den gäller just den här grindens familj):
 *
 *   · VYPORT-AXELN. Denna grind var den ENDA av repots tolv
 *     promoverings-grindar som hade facit för bara en vyport. Räknat per
 *     katalog under `tests/visual/__aria__/`: anmalningssidan 3/3,
 *     appfel 1/1, atgardssida 6/6, dorrlista 6/6, eventsida 6/6,
 *     hem-aktivitetsspalt 3/3, hem-bevakningsrad 2/2, messagebox 4/4,
 *     persondetalj 2/2, personer 3/3, segment 7/7 (desktop/mobile) —
 *     och `dokument-generering` 5/0. Efter `TASK-309.16` är den 6/6.
 *     Ingen annan grind bär alltså samma halva täckning.
 *   · LÄGES-AXELN för `BlockDialog`, mätt 2026-08-24 vid `TASK-309.17`
 *     (komponenten bar DÅ exakt TRE kropps-grenar: `def.agenda` →
 *     `AgendaEditor`, `def.datum` → `DatumEnkel`, annars → `TextArea`,
 *     plus ETT ortogonalt tillägg `def.platsFalt && ort` → `Kryss`).
 *     Grinden täckte samtliga: agenda (test 4), ren `TextArea` (test 3,
 *     Beskrivning), `TextArea` + `Kryss` (test 5, Kläder), och datum
 *     (test 6, i morfen — se § DATUM-LÄGET). Sedan `TASK-309.19`s
 *     rivning har `BlockDialog` bara TVÅ kropps-grenar kvar (`def.agenda`
 *     → `AgendaEditor`, annars → `TextArea`) plus samma `Kryss`-tillägg —
 *     test 3–5 täcker dem fullt ut, ingen fjärde gren finns kvar.
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

test.describe('promoverings-grinden — Inforutans sektionsmorf (ADR-103 B4)', () => {
  /**
   * DATUM-LÄGET, där det faktiskt går att nå (`TASK-309.17`). Inforutan
   * redigeras som SEKTION via `InforutanMorf`, inte rad för rad via
   * `BlockDialog` — se filhuvudets § DATUM-LÄGET för de tre spärrarna som
   * GJORDE dialogens datum-gren onåbar (`TASK-309.19` har sedan rivit
   * den grenen — den finns inte längre att nå ALLS, i BlockDialog eller
   * annars). Morfen bär `DatumEnkel` för `sistaBetalningsdag`
   * (`def.datum`), och mallen `bekraftelse` är den ENDA vars Inforuta har
   * blocket alls (`deltagarinfo` bär bara `INFORUTA_BAS`).
   *
   * REFERENSEN ÄR FÖDD EFTER FLIPPEN, till skillnad från de fem ovan.
   * Den kan därför INTE bevisa identitet med variant-läget — det läget
   * upphörde att existera i `1ec70a85`. Vad den gör är att LÅSA den
   * promoverade formen framåt, och den granskas som facit i skiva 9:s
   * eget pass (`tasks/sessions/bilagor/s108-generering/facit.json`, där
   * filen är deklarerad under `referenser` och innehållslåses av Marcus
   * stämpel). Skillnaden står här i klartext i stället för att jämnas ut.
   */
  test('datum-läget — Sista betalningsdag (bekräftelsebilagan)', async ({ page }) => {
    await gotoGenerering(page, 'bekraftelse');
    await page.getByRole('button', { name: 'Ändra', exact: true }).click();
    const morf = page.getByRole('region', { name: 'Inforutan' });
    await expect(morf.getByRole('group', { name: 'Sista betalningsdag' })).toBeVisible();
    await expect(morf).toMatchAriaSnapshot({ name: 'inforutan-morf-datum.aria.yml' });
  });
});
