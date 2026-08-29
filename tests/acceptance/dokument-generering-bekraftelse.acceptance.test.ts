import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import { HttpResponse, http } from 'msw';
import type { DocumentSources } from '../../src/domain/models/DocumentSources';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, type Page, test } from './acceptance-bas';

/**
 * TASK-340.2 — BEKRÄFTELSEN PÅ PLATS (PRD `TASK-340` § Implementationsbeslut
 * "Bekräftelsen på plats", AC #2/#3/#4).
 *
 * Marcus prod-röktest 2026-08-29, ordagrant: *"Detta känns så ologiskt och
 * klumpigt byggt … Detta kan omöjligen vara branschstandard."* Han hade just
 * granskat bekräftelsebilagan i ett fönster, tryckt Skapa, fått ETT ANDRA
 * fönster med "samma" PDF och en grön ruta med en Öppna-knapp under
 * knapparna.
 *
 * Efter denna skiva: Skapa öppnar inget fönster (bevisat i
 * `dokument-generering-fonster-direkt.acceptance.test.ts`, AC #1), och
 * formuläret ERSÄTTS av en bekräftelse i husets egen form — samma mönster
 * som `CreateEventForm` (*"skapandet ska KVITTERAS, inte bara hända"*).
 *
 * ── VAD DENNA FIL BEVISAR ────────────────────────────────────────────────
 *
 * Externt beteende, som resten av klassen (`acceptance-bas.ts` § VAD KLASSEN
 * BEVISAR): vad Lotta SER och kan GÖRA givet ett EF-svar av rätt form.
 *
 *   AC #2 — bekräftelsen ersätter formuläret · tar fokus · bär EXAKT två
 *     val · rätt textvariant per svarsform (promoverad / underlagAndrat /
 *     ersatte / platsstandard, en MSW-fixtur per fall) · "Till bilagorna"
 *     landar på dokumentvyn (T176: UTAN `?typ=bilaga` — filtret är rivet,
 *     se AC #2-testet) · axe 0 · tangentbords-
 *     vandringen bokförd · 375 px utan horisontell scroll.
 *   AC #3 — knappens etikett i BÅDA lägena, och att `kallhash` följer med
 *     anropet EFTER en förhandsgranskning (men inte utan).
 *   AC #4 — exakt EN annonsering vid bekräftelsen, och vad "Till bilagorna"
 *     faktiskt annonserar (mätt, se `annonseringsvakten` nedan).
 *
 * ── ETT NÄTVERKSPÅSTÅENDE, MED AVSIKT ────────────────────────────────────
 *
 * Klassens regel är att den aldrig testar ATT en handler anropades. AC #3
 * kräver ändå ett påstående om `kallhash` i anropets KROPP, och det är en
 * annan sak: kroppen är vad APPEN SÄGER vid protokollgränsen, inte hur
 * fixturen råkar vara uppsatt. Samma form finns redan i
 * `dokument-generering-fonster-direkt.acceptance.test.ts` (`expect(body)
 * .toMatchObject({ preview: true })`). Skillnaden här är att kroppen fångas
 * i en variabel och prövas EFTER interaktionen — ett `expect` inne i en
 * handler rapporteras utanför testets egen assertion-kedja och kan tystas.
 */

/** En NY signerad URL per anrop — se `mockaFlodet` § nedladdningsAnrop. */
const nedladdningsUrl = (n: number) =>
  `https://storage.example.test/bekraftelsebilaga-skarp-${n}.pdf`;
const PREVIEW_URL = 'https://storage.example.test/preview-bekraftelse.pdf';
const KALLHASH = 'a'.repeat(64);

/**
 * De signerade PDF-adresserna är INTE Edge Functions utan de faktiska mål
 * flikarna navigerar till. Hermetik-vakten fäller varje omockat anrop, och
 * svaret måste vara `text/plain` — `application/pdf` låter Chromes egen
 * PDF-visare ta över navigeringen och störa load-livscykeln (mätt,
 * TASK-309.26; hela resonemanget i
 * `dokument-generering-fonster-direkt.acceptance.test.ts` § mockaLagradPdf).
 */
function mockaLagradPdf(url: string) {
  return http.get(
    url,
    () =>
      new HttpResponse('fejk-innehall-for-test', {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
  );
}

/**
 * TVÅ KÄLLOR TILL "EVENTET", OCH BARA DEN ENA STYR YTAN — en fälla värd att
 * skriva ut. `GenereringsVy`s `event`-prop kommer ur ROUTENS `fetchEvents()`
 * (globalt mockad i fixturvärlden, `EVENTS_RESPONSE`), medan
 * `get-document-sources` bara bär UNDERLAGET. Det är alltså fixturvärldens
 * ort ("Skövde") som står i rubriken, i kryssrutans etikett och i
 * platsstandard-meningen — inte den här funktionens `event.ort`. Fixturen
 * nedan speglar därför `EVENTS_RESPONSE`s Skövde-event i stället för att
 * bära ett eget, motstridigt event.
 */
function byggSources(over?: { klader?: string | null }): DocumentSources {
  return {
    event: {
      id: VISUAL_EVENT_ID,
      eventNamn: 'Utbildning Skövde',
      typ: 'Utbildning',
      ort: 'Skövde',
      startdatum: '2026-09-26',
      slutdatum: '2026-09-27',
      eventlabel: 'Skövde 26-27 sep',
    },
    eventinnehall: { id: 'recEventinnehall1', namn: 'Utbildning Skövde · Utbildning' },
    plats: { id: 'recPlats1', namn: 'Rönninge' },
    agenda: {
      dag1: { standard: [], kopia: null },
      dag2: { standard: [], kopia: null },
    },
    kopior: {
      tid: { standard: 'kl. 10:00 - 17:00', kopia: null },
      pris: { standard: '2.500', kopia: null },
      anmalningsavgift: { standard: '1000:-', kopia: null },
      resterandeBelopp: { standard: '1500:-', kopia: null },
      sistaBetalningsdag: { standard: '2026-10-17', kopia: null },
      beskrivning: { standard: 'En beskrivning av utbildningen.', kopia: null },
      forberedelser: { standard: 'Läs igenom materialet.', kopia: null },
      tagMed: { standard: 'Anteckningsblock.', kopia: null },
      rokning: { standard: 'Rökning sker utomhus.', kopia: null },
      parfym: { standard: 'Undvik starka dofter.', kopia: null },
      mat: { standard: 'Lunch och fika ingår.', kopia: null },
      overnattning: { standard: 'Boka själv.', kopia: null },
      utrustning: { standard: 'Finns på plats.', kopia: null },
      adress: { standard: 'Uttringe Hages väg 17, Rönninge', kopia: null },
      parkering: { standard: 'Gratis parkering.', kopia: null },
      transport: { standard: 'Buss 703.', kopia: null },
      klader: { standard: over?.klader ?? 'Varma kläder och bekväma inneskor.', kopia: null },
    },
  };
}

/**
 * En Event-mallad Bilagor-rad — formen `get-event-attachments` svarar med.
 * Används för "Skapa om"-etikettens JA-läge (AC #3): genereringsvyn frågar
 * SAMMA query som dokumentlistan (`useEventAttachments`), så en rad här är
 * det enda som skiljer de två etiketterna åt.
 */
function malladRad(mall: 'Bekräftelsebilaga' | 'Deltagarinformation') {
  return {
    id: 'recBefintligMalladRad1',
    namn: `${mall} – Skövde 26-27 sep.pdf`,
    storlekBytes: 51_200,
    skapad: '2026-08-28T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Event-mallad',
    rackvidd: null,
    kursfamilj: null,
    kursniva: null,
    mall,
    kallhash: KALLHASH,
  } as const;
}

interface SkarptSvar {
  promoverad?: boolean;
  underlagAndrat?: boolean;
  ersatte?: boolean;
}

/**
 * Mockar hela flödet. Returnerar en läsare för den SKARPA requestens kropp
 * (AC #3) — fångad i en variabel, prövad efter interaktionen.
 *
 * `status` är parametriserat därför att EF:en svarar **201** för en ny rad
 * och **200** när den ersätter (`TASK-340.1`s kontrakt). Klienten läser
 * `ersatte` i kroppen, aldrig koden — men den invarianten är värd att
 * BEVITTNA från utsidan i stället för att antas, så ersätt-fallet nedan
 * körs med 200 och de övriga med 201.
 */
function mockaFlodet(
  network: NetworkFixture,
  opt?: {
    svar?: SkarptSvar;
    bilagor?: readonly unknown[];
    sources?: DocumentSources;
    status?: 200 | 201;
  },
): {
  skarpKropp: () => Record<string, unknown> | null;
  nedladdningsAnrop: () => number;
} {
  let skarpKropp: Record<string, unknown> | null = null;
  // VARJE anrop får en EGEN URL. Det är simuleringen av TTL:en: en signerad
  // Storage-URL lever 300 s, så servern ger en NY adress varje gång man
  // frågar. En yta som lagrat sitt svar visar därför alltid den FÖRSTA
  // adressen, medan en yta som frågar om öppnar den SENASTE — skillnaden är
  // mätbar utan att testet behöver vänta fem minuter.
  let nedladdningsAnrop = 0;

  network.use(
    http.get(EF('get-document-sources'), () =>
      json((opt?.sources ?? byggSources()) as unknown as Record<string, unknown>),
    ),
    http.get(EF('get-event-attachments'), () => json({ attachments: opt?.bilagor ?? [] })),
    http.post(EF('save-event-text'), () => json({ ok: true })),
    http.post(EF('save-place-standard'), () => json({ ok: true })),
    http.post(EF('generate-event-attachment'), async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      if (body.preview === true) {
        return json({
          url: PREVIEW_URL,
          utgar: new Date(Date.now() + 300_000).toISOString(),
          kallhash: KALLHASH,
        });
      }
      skarpKropp = body;
      return json(
        {
          attachment: malladRad('Bekräftelsebilaga'),
          promoverad: opt?.svar?.promoverad ?? true,
          underlagAndrat: opt?.svar?.underlagAndrat ?? false,
          ersatte: opt?.svar?.ersatte ?? false,
        },
        opt?.status ?? 201,
      );
    }),
    http.get(EF('get-attachment-download-url'), () => {
      nedladdningsAnrop += 1;
      return json({ url: nedladdningsUrl(nedladdningsAnrop), expiresInSeconds: 300 });
    }),
    mockaLagradPdf(PREVIEW_URL),
    // TVÅ adresser, inte tre: den enda vägen som klickar "Visa bilagan"
    // gör det EXAKT två gånger (färsk-URL-beviset). En tredje handler hade
    // varit en registrering ingen väg kan nå.
    mockaLagradPdf(nedladdningsUrl(1)),
    mockaLagradPdf(nedladdningsUrl(2)),
  );

  return { skarpKropp: () => skarpKropp, nedladdningsAnrop: () => nedladdningsAnrop };
}

async function oppnaGenerering(page: Page, mall: 'bekraftelse' | 'deltagarinfo' = 'bekraftelse') {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&vy=generering&mall=${mall}`);
  await expect(page.getByTestId('generering-vy')).toBeVisible();
  await expect(page.getByText('Hämtar underlag …')).toHaveCount(0);
}

/* ══════════════════════════════════════════════════════════════════════ *
 * ANNONSERINGSVAKTEN (AC #4)
 *
 * Playwright kan inte höra en skärmläsare. Vad den KAN mäta är det som en
 * skärmläsare faktiskt reagerar på: en live-region vars innehåll ÄNDRAS.
 * Vakten installeras före app-boot, observerar hela dokumentet, och bokför
 * varje gång en `[aria-live]`/`role="status"`/`role="alert"`-nod får ett
 * NYTT icke-tomt textinnehåll (WeakMap per nod, whitespace-normaliserat).
 *
 * VAD DEN INTE ÄR: ett bevis på vad JAWS/VoiceOver läser upp. Den mäter
 * ANTALET tillfällen en skärmläsare får något att läsa — vilket är exakt
 * det AC #4 gäller ("exakt en annonsering, inte dubbelt"), och exakt det
 * som gick fel innan: `useGenereraEventBilaga` annonserade via
 * `alertScreenReader` SAMTIDIGT som bekräftelserutan är en `role="status"`.
 * ══════════════════════════════════════════════════════════════════════ */

interface Annonsering {
  roll: string;
  text: string;
}
interface FonsterMedVakt {
  __annonseringar: Annonsering[];
}

function installeraAnnonseringsvakt(page: Page) {
  return page.addInitScript(() => {
    const w = window as unknown as FonsterMedVakt;
    w.__annonseringar = [];
    const sett = new WeakMap<Element, string>();
    const las = () => {
      const noder = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
      for (const el of Array.from(noder)) {
        const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
        if (sett.get(el) === text) continue;
        sett.set(el, text);
        if (text) {
          w.__annonseringar.push({
            roll: el.getAttribute('role') ?? el.getAttribute('aria-live') ?? '',
            text,
          });
        }
      }
    };
    new MutationObserver(las).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
}

const lasAnnonseringar = (page: Page) =>
  page.evaluate(() => (window as unknown as FonsterMedVakt).__annonseringar);

const nollstallAnnonseringar = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as FonsterMedVakt).__annonseringar.length = 0;
  });

/**
 * `RouteAnnouncer`s region SOM TILLSTÅND, inte som händelse
 * (`AppShell/RouteAnnouncer.tsx`: `<div aria-live="polite" aria-atomic="true"
 * className="sr-only">`). Vakten ovan mäter FÖRÄNDRINGAR; denna läser vad
 * regionen bär just nu.
 *
 * Skillnaden är hela poängen i testet nedan: annonseringen uteblir EXAKT när
 * regionen redan bär det värde navigeringen skulle ha satt, och det är ett
 * tillstånd man kan läsa av — till skillnad från frånvaron av en händelse,
 * som aldrig går att skilja från "inte än".
 */
const lasAnnonseringsregion = (page: Page) =>
  page.evaluate(
    () =>
      document.querySelector('div[aria-live="polite"][aria-atomic="true"]')?.textContent?.trim() ??
      '',
  );

/* ══════════════════════════════════════════════════════════════════════ */

test.describe('Genereringsvyn — bekräftelsen på plats (TASK-340.2)', () => {
  test('AC #2: bekräftelsen ersätter formuläret, tar fokus och bär exakt två val', async ({
    page,
    network,
  }) => {
    mockaFlodet(network);
    await oppnaGenerering(page);

    // Formuläret finns FÖRE: knapparna och blockgrupperna.
    await expect(page.getByRole('button', { name: 'Skapa bekräftelsebilaga' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Inforutan' })).toBeVisible();

    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();

    const bekraftelse = page.getByTestId('bekraftelse');
    await expect(bekraftelse).toBeVisible();

    // …och ERSATT efter: varken knapparna eller blockgrupperna finns kvar.
    await expect(page.getByRole('button', { name: 'Skapa bekräftelsebilaga' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Förhandsgranska' })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 2, name: 'Inforutan' })).toHaveCount(0);
    // Sidkromet står kvar — Lotta ska veta var hon är.
    await expect(page.getByRole('heading', { level: 1, name: 'Bekräftelsebilaga' })).toBeVisible();

    // FOKUS ligger INUTI bekräftelseytan (`CreateEventForm`-precedenten: den
    // knapp som trycktes finns inte kvar, så fokus måste flyttas någonstans
    // — annars står Lotta på `document.body`).
    const fokusInutiBekraftelsen = await page.evaluate(() => {
      const yta = document.querySelector('[data-testid="bekraftelse"]');
      return (
        yta !== null && document.activeElement !== null && yta.contains(document.activeElement)
      );
    });
    expect(fokusInutiBekraftelsen).toBe(true);

    // EXAKT TVÅ VAL — inte tre, inte en. Räknat inom ytan, så sidkromets
    // tillbaka-knapp inte smyger med.
    await expect(bekraftelse.getByRole('button')).toHaveCount(2);
    await expect(bekraftelse.getByRole('button', { name: 'Visa bilagan' })).toBeVisible();
    await expect(bekraftelse.getByRole('button', { name: 'Till bilagorna' })).toBeVisible();
  });

  test('review-runda 2: "Visa bilagan" hämtar en FÄRSK signerad URL vid VARJE klick', async ({
    page,
    context,
    network,
  }) => {
    /*
     * DEN TIDSINSTÄLLDA DEFEKT DENNA RUNDA RÖJDE UNDAN. Bekräftelsen höll
     * först den URL som hämtades vid Skapa. Signerade Storage-URL:er lever
     * **300 sekunder** (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`) — och bekräftelsen
     * är just den yta Lotta får STÅ KVAR på, eftersom vi medvetet inte
     * omdirigerar henne. Ett klick sex minuter senare hade därför öppnat en
     * flik mot en utgången adress: ett rått Storage-fel, i ett nytt fönster,
     * utan besked i appen.
     *
     * TESTET SIMULERAR TIDEN UTAN ATT VÄNTA. Fixturen ger en NY adress vid
     * varje `get-attachment-download-url` — precis som en riktig server gör,
     * eftersom varje signering är ny. Tre mätpunkter faller då ut:
     *
     *   1. Skapa hämtar INGEN URL alls (`nedladdningsAnrop() === 0`) — det
     *      finns ingenting lagrat som KAN hinna gå ut.
     *   2. Första klicket hämtar adress nr 1 och navigerar dit.
     *   3. ANDRA klicket hämtar adress nr 2 och navigerar till DEN. Hade ytan
     *      lagrat sitt svar skulle andra fliken visat adress nr 1 igen — det
     *      är exakt den skillnad en utgången URL gör i skarp drift.
     */
    const { nedladdningsAnrop } = mockaFlodet(network);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // (1) Ingenting hämtat vid Skapa — inget att frysa.
    expect(nedladdningsAnrop()).toBe(0);

    // (2) Första klicket: fönstret öppnas SYNKRONT (popup-skyddet), bär en
    //     läsbar laddningssida, och navigerar till den nyss hämtade adressen.
    const [forstaFliken] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Visa bilagan' }).click(),
    ]);
    await expect.poll(() => forstaFliken.url(), { timeout: 10_000 }).toBe(nedladdningsUrl(1));
    expect(nedladdningsAnrop()).toBe(1);

    // (3) Andra klicket: en NY adress, inte den lagrade.
    const [andraFliken] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Visa bilagan' }).click(),
    ]);
    await expect.poll(() => andraFliken.url(), { timeout: 10_000 }).toBe(nedladdningsUrl(2));
    expect(nedladdningsAnrop()).toBe(2);
    expect(nedladdningsUrl(2)).not.toBe(nedladdningsUrl(1));
  });

  test('review-runda 2: blockerat fönster vid "Visa bilagan" visar felet I YTAN', async ({
    page,
    network,
  }) => {
    // Popup-skyddet ger `window.open` → `null`. `useForhandsvisaDokument`
    // kastar då ett Gunilla-läsbart fel, och bekräftelseytan bär det — samma
    // `blockerad`-princip som förhandsgranskningens ruta, fast här finns
    // ingen flik att skriva i, så appens egen yta är enda platsen.
    mockaFlodet(network);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    await page.evaluate(() => {
      window.open = () => null;
    });
    await page.getByRole('button', { name: 'Visa bilagan' }).click();

    await expect(
      page.getByText('Webbläsaren blockerade den nya fliken.', { exact: false }),
    ).toBeVisible();
  });

  test('AC #2: textvarianten för PROMOVERAD är basbeskedet, utan omgjord-mening', async ({
    page,
    network,
  }) => {
    mockaFlodet(network, { svar: { promoverad: true } });
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();

    const bekraftelse = page.getByTestId('bekraftelse');
    await expect(bekraftelse.getByText('Bekräftelsebilagan är sparad')).toBeVisible();
    await expect(
      bekraftelse.getByText('Den ligger nu bland eventets bilagor, redo att bifogas i utskick.'),
    ).toBeVisible();
    // `promoverad` bär MEDVETET ingen egen mening (se `GenereringsVy.tsx`s
    // bekräftelse-docblock): normalfallet berättas inte, avvikelserna gör det.
    // Att INGEN av de tre andra meningarna står här är dess textvariant.
    await expect(bekraftelse.getByText('gjordes om')).toHaveCount(0);
    await expect(bekraftelse.getByText('ersatte den tidigare')).toHaveCount(0);
    await expect(bekraftelse.getByText('som standard')).toHaveCount(0);
  });

  test('AC #2: textvarianten för UNDERLAGANDRAT ber Lotta granska igen', async ({
    page,
    network,
  }) => {
    mockaFlodet(network, { svar: { promoverad: false, underlagAndrat: true } });
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();

    await expect(
      page
        .getByTestId('bekraftelse')
        .getByText(
          'Underlaget hade ändrats sedan förhandsgranskningen, så bilagan gjordes om. Förhandsgranska gärna igen.',
        ),
    ).toBeVisible();
  });

  test('AC #2: textvarianten för ERSATTE säger att den tidigare skrevs över (svar 200)', async ({
    page,
    network,
  }) => {
    // STATUS 200, inte 201 — EF:ens ersätt-gren. Klienten läser `ersatte` i
    // kroppen; att 200 behandlas identiskt med 201 är vad detta fall
    // bevittnar utifrån (`postEdgeFunction` släpper hela 2xx via `res.ok`).
    mockaFlodet(network, {
      svar: { promoverad: true, ersatte: true },
      bilagor: [malladRad('Bekräftelsebilaga')],
      status: 200,
    });
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa om bekräftelsebilagan' }).click();

    const bekraftelse = page.getByTestId('bekraftelse');
    await expect(bekraftelse.getByText('Den ersatte den tidigare bilagan.')).toBeVisible();
    await expect(bekraftelse.getByText('Bekräftelsebilagan är sparad')).toBeVisible();
  });

  test('AC #2: textvarianten för PLATSSTANDARD kvitterar ortens nya standard', async ({
    page,
    network,
  }) => {
    /*
     * Platsstandarden är den ENDA av de fyra meningarna som INTE kommer ur
     * EF-svaret — den kommer ur Lottas eget kryss i block-dialogen
     * (`somStandard`, "vid Skapa, inte vid krysset"). Den måste därför sättas
     * genom ytan, inte genom en fixtur: dialogen kräver en FAKTISK
     * textändring för att krysset ska räknas (`BlockDialog` § `utkast()`:
     * `blirStandard && !!text.trim()`, och `nytt` blir `null` när texten är
     * oförändrad mot standarden).
     *
     * `deltagarinfo`-mallen används därför att `klader` är dess plats-fält
     * som nås via block-dialogen — samma väg promoverings-grinden redan
     * låser ("plats-fält-läget — Kläder").
     */
    mockaFlodet(network);
    await oppnaGenerering(page, 'deltagarinfo');

    await page.getByRole('button', { name: /Ändra kläder/i }).click();
    const dialog = page.getByRole('dialog', { name: 'Kläder' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Kläder' }).fill('Mjuka kläder och tofflor.');
    // KLICKA ETIKETTEN, INTE `<input>`:et. React Arias `Checkbox` renderar en
    // visuellt dold `<input type="checkbox">` under en stylad `<span>`, så ett
    // klick på rollen fastnar i "element is not stable / subtree intercepts
    // pointer events" (mätt: 60 s timeout). Etikett-texten ÄR kryssrutans
    // klickyta för Lotta, och därför den ärliga interaktionen att testa.
    const kryss = dialog.getByRole('checkbox', { name: /Använd som standard för Skövde/ });
    await dialog.getByText('Använd som standard för Skövde framöver').click();
    await expect(kryss).toBeChecked();
    await dialog.getByRole('button', { name: 'Spara' }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole('button', { name: 'Skapa deltagarinformation' }).click();

    await expect(
      page.getByTestId('bekraftelse').getByText('Skövde har nu kläder som standard.'),
    ).toBeVisible();
  });

  test('AC #2: "Till bilagorna" landar på dokumentvyn med eventet kvar', async ({
    page,
    network,
  }) => {
    mockaFlodet(network);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    await page.getByRole('button', { name: 'Till bilagorna' }).click();

    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    // [T176, 2026-08-29] `?typ=bilaga` SÄTTS INTE LÄNGRE — och nyckeln får
    // inte heller smyga tillbaka. Dokumentlistans typfilter är rivet (listan
    // visar bara bilagor, se `DokumentLista`s docblock), så landningen visar
    // samma sak utan parametern. Assertionen är VÄND, inte struken: en
    // återinförd `setTyp('bilaga')` fälls här.
    expect(new URL(page.url()).searchParams.get('typ')).toBeNull();
    // Genereringsvyns adress är helt borta — inte bara överskuggad.
    expect(new URL(page.url()).searchParams.get('vy')).toBeNull();
    expect(new URL(page.url()).searchParams.get('mall')).toBeNull();
    // Eventet följer med: Lotta ska se DET här eventets bilagor.
    expect(new URL(page.url()).searchParams.get('event')).toBe(VISUAL_EVENT_ID);
  });

  test('AC #2: axe 0 violations på bekräftelseytan', async ({ page, network }) => {
    mockaFlodet(network, { svar: { promoverad: false, underlagAndrat: true, ersatte: true } });
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('AC #2: tangentbordsvandringen går fokus → Visa bilagan → Till bilagorna', async ({
    page,
    network,
  }) => {
    mockaFlodet(network);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // Startpunkten är bekräftelsebehållaren själv (`tabIndex={-1}`), så
    // FÖRSTA Tab landar på det första valet — ingen omväg via sidans topp.
    const efterEttTab = await page.evaluate(() => {
      // (mätpunkt, inte interaktion — vandringen körs med riktiga Tab nedan)
      return document.activeElement?.getAttribute('data-testid') ?? null;
    });
    expect(efterEttTab).toBe('bekraftelse');

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Visa bilagan' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Till bilagorna' })).toBeFocused();

    // Bakåt igen — ordningen är symmetrisk, inget fokusfällt-mönster.
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Visa bilagan' })).toBeFocused();
  });

  test('AC #2: 375 px bär bekräftelsen utan horisontell scroll', async ({ page, network }) => {
    mockaFlodet(network, { svar: { promoverad: false, underlagAndrat: true, ersatte: true } });
    await page.setViewportSize({ width: 375, height: 812 });
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // Den längsta textvarianten OCH båda knapparna, på den smalaste ytan.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('AC #3: etiketten är "Skapa …" utan befintlig rad och "Skapa om …" med', async ({
    page,
    network,
  }) => {
    mockaFlodet(network);
    await oppnaGenerering(page);
    await expect(page.getByRole('button', { name: 'Skapa bekräftelsebilaga' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skapa om bekräftelsebilagan' })).toHaveCount(0);
  });

  test('AC #3: etiketten blir "Skapa om …" när en Event-mallad rad finns för mallen', async ({
    page,
    network,
  }) => {
    mockaFlodet(network, { bilagor: [malladRad('Bekräftelsebilaga')] });
    await oppnaGenerering(page);
    await expect(page.getByRole('button', { name: 'Skapa om bekräftelsebilagan' })).toBeVisible();
  });

  test('AC #3: en rad för ANNAN mall ändrar inte etiketten', async ({ page, network }) => {
    // Uppslaget är per (event × MALL), inte per event. En deltagarinformation
    // säger ingenting om huruvida bekräftelsebilagan redan finns.
    mockaFlodet(network, { bilagor: [malladRad('Deltagarinformation')] });
    await oppnaGenerering(page);
    await expect(page.getByRole('button', { name: 'Skapa bekräftelsebilaga' })).toBeVisible();
  });

  test('AC #3: kallhash skickas EFTER en förhandsgranskning, men inte utan', async ({
    page,
    context,
    network,
  }) => {
    const utanForhandsgranskning = mockaFlodet(network);
    await oppnaGenerering(page);

    // (a) UTAN förhandsgranskning: ingen hash finns att skicka, och att
    //     hitta på en vore att be servern promovera ett utkast som aldrig
    //     skapades.
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    expect(utanForhandsgranskning.skarpKropp()).not.toBeNull();
    expect(utanForhandsgranskning.skarpKropp()).not.toHaveProperty('kallhash');

    // (b) MED förhandsgranskning: hashen ur preview-svaret följer med.
    await page.reload();
    await expect(page.getByTestId('generering-vy')).toBeVisible();
    await expect(page.getByText('Hämtar underlag …')).toHaveCount(0);

    const [forhandsFlik] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Förhandsgranska' }).click(),
    ]);
    await expect(page.getByText('Bekräftelsebilagan är klar att granska.')).toBeVisible();
    await forhandsFlik.close();

    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();
    expect(utanForhandsgranskning.skarpKropp()).toMatchObject({
      eventId: VISUAL_EVENT_ID,
      mall: 'bekraftelse',
      kallhash: KALLHASH,
    });
  });

  test('AC #4: bekräftelsen annonseras EXAKT en gång', async ({ page, network }) => {
    mockaFlodet(network, { svar: { promoverad: true } });
    await installeraAnnonseringsvakt(page);
    await oppnaGenerering(page);

    // Nollställ efter laddningen: skelettets "Hämtar underlag …" och den
    // gula rutan för utelämnade block är egna live-regioner, och de hör till
    // sidans uppbyggnad — inte till det AC #4 mäter.
    await nollstallAnnonseringar(page);

    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    const efterSkapa = await lasAnnonseringar(page);
    expect(efterSkapa).toHaveLength(1);
    expect(efterSkapa[0].roll).toBe('status');
    expect(efterSkapa[0].text).toContain('Bekräftelsebilagan är sparad');
    // Den gamla globala live-regionen ("<namn> har skapats",
    // `alertScreenReader` i `useGenereraEventBilaga`) är BORTA — hade den
    // funnits kvar vore längden 2, och Lotta hade hört samma sak dubbelt.
    expect(efterSkapa.map((a) => a.text).join(' | ')).not.toContain('har skapats');
  });

  test('AC #4: "Till bilagorna" annonserar högst en gång, aldrig dubbelt', async ({
    page,
    network,
  }) => {
    /*
     * MÄTT UTFALL, inte ett antagande (research § 3.3 bad uttryckligen om
     * mätningen: RouteAnnouncer-beteendet var "härlett ur källkod, INTE
     * kört").
     *
     * `RouteAnnouncer` annonserar routens `staticData.title` när `href`
     * ändras — men bara när det SATTA MEDDELANDET faktiskt byter värde
     * (`setMessage(title)`; samma sträng ger ingen DOM-ändring och därmed
     * ingen annonsering). Genereringsvyn och dokumentlistan är SAMMA route
     * ("Bilagor"), så antalet beror på vilket värde regionen redan bär:
     *
     *   · Direktlänk hit (detta test): regionen är TOM, och navigeringen
     *     sätter "Bilagor" → EXAKT EN annonsering.
     *   · Inifrån appen (Lotta klickade sig hit från listan): regionen bär
     *     redan "Bilagor" → INGEN ny annonsering.
     *
     * BÅDA är förenliga med AC #4:s syfte, som är att bekräftelsen inte ska
     * krocka med en route-annonsering. Det som INTE får hända — två
     * annonseringar för en handling — händer i ingetdera fallet. Att den
     * andra vägen ger noll är RouteAnnouncers egen, äldre begränsning
     * (samma titel = tyst navigering), inte något denna skiva införde;
     * bokförd som fynd i skivans slutrapport.
     */
    mockaFlodet(network);
    await installeraAnnonseringsvakt(page);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    await nollstallAnnonseringar(page);
    await page.getByRole('button', { name: 'Till bilagorna' }).click();
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const efterNavigering = await lasAnnonseringar(page);
    expect(efterNavigering.length).toBeLessThanOrEqual(1);
    expect(efterNavigering).toEqual([{ roll: 'polite', text: 'Bilagor' }]);
  });

  test('AC #4: inifrån appen annonserar "Till bilagorna" HÖGST en gång, och noll när regionen redan bär titeln', async ({
    page,
    network,
  }) => {
    /*
     * DEN ANDRA VÄGEN, mätt i stället för resonerad. Lotta kommer normalt
     * INTE via en direktlänk: hon står på dokumentlistan och klickar sig in i
     * genereringsvyn.
     *
     * `RouteAnnouncer` annonserar routens TITEL vid varje `href`-ändring — men
     * bara när det SATTA MEDDELANDET faktiskt byter värde (`setMessage(title)`;
     * samma sträng ger ingen DOM-ändring och därmed ingenting att läsa upp).
     * Bilagelistan och genereringsvyn är SAMMA route ("Bilagor"), så
     * utfallet vid "Till bilagorna" beror på vad regionen redan bär:
     *
     *   · bär den redan "Bilagor"  → 0 annonseringar
     *   · är den tom                → 1 annonsering
     *
     * VILKETDERA som gäller avgörs av om någon TIDIGARE href-ändring hann sätta
     * värdet — och den frågan är genuint tidsberoende: nuqs kan normalisera
     * adressen redan när listan monteras, eller inte, beroende på när
     * bilage-frågan landar. Ett tidigare varv av detta test PÅSTOD noll och
     * föll när cachen var kall (mätt två gånger: en gång med "Laddar bilagor…"
     * i loggen, en gång utan).
     *
     * Testet mäter därför REGELN i stället för ett av dess två utfall: läs
     * regionens tillstånd FÖRE navigeringen, och kräv exakt det antal den
     * avläsningen förutsäger. Båda utfallen är förenliga med AC #4 — det som
     * inte får hända, TVÅ annonseringar för en handling, kan inte hända i
     * någondera.
     */
    mockaFlodet(network);
    await installeraAnnonseringsvakt(page);

    // Start på LISTAN, som Lotta gör.
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    // [T176] Mallkatalogen är en meny i kortets handlingsrad, inte en listrad.
    await page.getByRole('button', { name: 'Skapa bilaga' }).click();
    await page.getByRole('menuitem', { name: 'Bekräftelsebilaga' }).click();
    await expect(page.getByTestId('generering-vy')).toBeVisible();
    await expect(page.getByText('Hämtar underlag …')).toHaveCount(0);

    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    // TILLSTÅNDET FÖRE — det som avgör utfallet.
    const regionFore = await lasAnnonseringsregion(page);
    const vantatAntal = regionFore === 'Bilagor' ? 0 : 1;

    await nollstallAnnonseringar(page);
    await page.getByRole('button', { name: 'Till bilagorna' }).click();
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    // [T176] `?typ` sätts inte längre — se AC #2-testet ovan.
    expect(new URL(page.url()).searchParams.get('typ')).toBeNull();

    const efter = await lasAnnonseringar(page);
    // ALDRIG TVÅ — det är hela AC #4.
    expect(efter.length).toBeLessThanOrEqual(1);
    // …och exakt det som regionens tillstånd förutsade.
    expect(efter.length).toBe(vantatAntal);
    // Kom en annonsering, var den routens titel och inget annat.
    if (efter.length === 1) expect(efter[0]).toEqual({ roll: 'polite', text: 'Bilagor' });
    // Regionen bär "Bilagor" efteråt, oavsett väg — Lotta är på bilagevyn.
    expect(await lasAnnonseringsregion(page)).toBe('Bilagor');
  });
});
