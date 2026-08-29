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
 *     ersatte / platsstandard, en MSW-fixtur per fall) · "Till dokumenten"
 *     landar på dokumentvyn med `?typ=bilaga` · axe 0 · tangentbords-
 *     vandringen bokförd · 375 px utan horisontell scroll.
 *   AC #3 — knappens etikett i BÅDA lägena, och att `kallhash` följer med
 *     anropet EFTER en förhandsgranskning (men inte utan).
 *   AC #4 — exakt EN annonsering vid bekräftelsen, och vad "Till dokumenten"
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

const NEDLADDNINGS_URL = 'https://storage.example.test/bekraftelsebilaga-skarp.pdf';
const PREVIEW_URL = 'https://storage.example.test/preview-bekraftelse.pdf';
const KALLHASH = 'a'.repeat(64);

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
): { skarpKropp: () => Record<string, unknown> | null } {
  let skarpKropp: Record<string, unknown> | null = null;

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
    http.get(EF('get-attachment-download-url'), () =>
      json({ url: NEDLADDNINGS_URL, expiresInSeconds: 300 }),
    ),
    // Den signerade PDF-URL:en är INTE en Edge Function utan den faktiska
    // adress förhandsgranskningens flik navigerar till. Hermetik-vakten
    // fäller varje omockat anrop, så den behöver sin egen handler — och
    // `text/plain` (inte `application/pdf`), annars tar Chromes PDF-visare
    // över navigeringen och stör load-livscykeln. Hela resonemanget:
    // `dokument-generering-fonster-direkt.acceptance.test.ts` § mockaLagradPdf.
    http.get(
      PREVIEW_URL,
      () =>
        new HttpResponse('fejk-innehall-for-test', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
    ),
  );

  return { skarpKropp: () => skarpKropp };
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
    await expect(bekraftelse.getByRole('button', { name: 'Visa dokumentet' })).toBeVisible();
    await expect(bekraftelse.getByRole('button', { name: 'Till dokumenten' })).toBeVisible();
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
      bekraftelse.getByText('Den ligger nu bland eventets dokument, redo att bifogas i utskick.'),
    ).toBeVisible();
    // `promoverad` bär MEDVETET ingen egen mening (se `GenereringsVy.tsx`s
    // bekräftelse-docblock): normalfallet berättas inte, avvikelserna gör det.
    // Att INGEN av de tre andra meningarna står här är dess textvariant.
    await expect(bekraftelse.getByText('gjordes om')).toHaveCount(0);
    await expect(bekraftelse.getByText('ersätter den tidigare')).toHaveCount(0);
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
          'Underlaget hade ändrats sedan förhandsgranskningen, så dokumentet gjordes om. Förhandsgranska gärna igen.',
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
    await expect(bekraftelse.getByText('Den ersätter den tidigare bilagan.')).toBeVisible();
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

  test('AC #2: "Till dokumenten" landar på dokumentvyn med ?typ=bilaga', async ({
    page,
    network,
  }) => {
    mockaFlodet(network);
    await oppnaGenerering(page);
    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    await page.getByRole('button', { name: 'Till dokumenten' }).click();

    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('typ')).toBe('bilaga');
    // Genereringsvyns adress är helt borta — inte bara överskuggad.
    expect(new URL(page.url()).searchParams.get('vy')).toBeNull();
    expect(new URL(page.url()).searchParams.get('mall')).toBeNull();
    // Eventet följer med: Lotta ska se DET här eventets dokument.
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

  test('AC #2: tangentbordsvandringen går fokus → Visa dokumentet → Till dokumenten', async ({
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
    await expect(page.getByRole('button', { name: 'Visa dokumentet' })).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Till dokumenten' })).toBeFocused();

    // Bakåt igen — ordningen är symmetrisk, inget fokusfällt-mönster.
    await page.keyboard.press('Shift+Tab');
    await expect(page.getByRole('button', { name: 'Visa dokumentet' })).toBeFocused();
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

  test('AC #4: "Till dokumenten" annonserar högst en gång, aldrig dubbelt', async ({
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
     * ("Dokument"), så antalet beror på vilket värde regionen redan bär:
     *
     *   · Direktlänk hit (detta test): regionen är TOM, och navigeringen
     *     sätter "Dokument" → EXAKT EN annonsering.
     *   · Inifrån appen (Lotta klickade sig hit från listan): regionen bär
     *     redan "Dokument" → INGEN ny annonsering.
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
    await page.getByRole('button', { name: 'Till dokumenten' }).click();
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    const efterNavigering = await lasAnnonseringar(page);
    expect(efterNavigering.length).toBeLessThanOrEqual(1);
    expect(efterNavigering).toEqual([{ roll: 'polite', text: 'Dokument' }]);
  });

  test('AC #4: inifrån appen annonserar "Till dokumenten" NOLL gånger — mätt, inte antaget', async ({
    page,
    network,
  }) => {
    /*
     * DEN ANDRA VÄGEN, mätt i stället för resonerad. Lotta kommer normalt
     * INTE via en direktlänk: hon står på dokumentlistan och klickar sig in i
     * genereringsvyn. Då bär `RouteAnnouncer`s region redan "Dokument" när
     * hon trycker "Till dokumenten", och `setMessage('Dokument')` ger ingen
     * DOM-ändring — alltså ingen annonsering.
     *
     * NOLL ÄR INTE ETT FEL I DENNA SKIVA. Det är `RouteAnnouncer`s egen,
     * äldre egenskap: den annonserar routens TITEL, och listan och
     * genereringsvyn är samma route ("Dokument"). Det som AC #4 skyddar mot
     * — att bekräftelsen och en route-annonsering krockar — kan alltså inte
     * hända i någondera vägen. Fyndet är bokfört i skivans slutrapport i
     * stället för att jämnas ut i en assertion som påstår "exakt en".
     */
    mockaFlodet(network);
    await installeraAnnonseringsvakt(page);

    // Start på LISTAN, som Lotta gör.
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();

    // Mallkatalogens entré sätter `?vy`/`?mall` → href ändras → regionen får
    // "Dokument" för första gången. DEN annonseringen är väntad och mäts här
    // som kontrollpunkt: mekanismen ÄR igång.
    await nollstallAnnonseringar(page);
    await page.getByRole('button', { name: 'Skapa Bekräftelsebilaga' }).first().click();
    await expect(page.getByTestId('generering-vy')).toBeVisible();
    await expect(page.getByText('Hämtar underlag …')).toHaveCount(0);
    expect(await lasAnnonseringar(page)).toContainEqual({ roll: 'polite', text: 'Dokument' });

    await page.getByRole('button', { name: 'Skapa bekräftelsebilaga' }).click();
    await expect(page.getByTestId('bekraftelse')).toBeVisible();

    await nollstallAnnonseringar(page);
    await page.getByRole('button', { name: 'Till dokumenten' }).click();
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect.poll(() => new URL(page.url()).searchParams.get('typ')).toBe('bilaga');

    // MÄTT UTFALL: noll. Regionen bar redan "Dokument".
    expect(await lasAnnonseringar(page)).toEqual([]);
  });
});
