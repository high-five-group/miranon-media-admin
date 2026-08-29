import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-275.3 — Dokument-ytan utbyggd: räckviddsval, gemensamt läge, badges
 * (PRD task-275, ADR-118).
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR): att
 * DokumentYta.tsx renderar rätt GIVET ett EF-svar av rätt form — inte att
 * staging faktiskt returnerar den formen (det är api-staging-sviternas jobb,
 * `tests/api/*.staging.test.ts`, se `upload-attachment.staging.test.ts` §
 * TASK-275.3-tillägget m.fl. för den skarpa halvan).
 *
 * TÄCKNING:
 *   AC #1 — uppladdningsflödet bär räckviddsval (radio: Detta event/En
 *     familj/Alla event; familj-läget visar Familj-select + Steg-select
 *     BARA för en nivåbärande familj, RIM).
 *
 *   UI-SPRÅKET BYTTE VID S107 QA-VANDRINGEN, VÄRDENA GJORDE DET INTE.
 *   Etiketterna heter numera "En familj" / "Familj" / "Nivå" (Marcus:
 *   ordet "Kurs" ska bort ur produktspråket; "Eventtyp" var upptaget av
 *   ett annat begrepp och valdes bort). Det som skickas till basen är
 *   OFÖRÄNDRAT `AttachmentScope.KURSTYP` = 'Kurstyp' — optionsnamnet i
 *   Airtable-fältet `Räckvidd`. Testet låser därför etiketterna via
 *   `getByLabel`/`getByRole` men rör aldrig värde-strängen; ett framtida
 *   copy-byte ska fälla HÄR, ett värdebyte ska fälla i staging-API-testerna.
 *   AC #2 — Dokument-sidan har ett läge UTAN valt event som visar gemensamma
 *     dokument (räckviddsläget); "Detta event" är avstängd där (inget event
 *     att koppla mot).
 *   AC #4 — Ersätt/Radera är INTE tillgängliga i eventkontext för en
 *     GEMENSAM bilaga (badgen bär förklaringen i stället) men ÄR
 *     tillgängliga i räckviddsläget (samma bilaga, samma id).
 *   AC #5 — axe 0 violations i BÅDA lägena (eventläge + räckviddsläge).
 *
 * `get-event-attachments` grenar på `?eventId=` (samma sätt som
 * `get-registrations` redan gör i `handlers.ts`) — EN handler, delad mellan
 * alla test i filen: MED `eventId` = eventlägets union (egen + gemensam),
 * UTAN = räckviddslägets lista (bara gemensam, EXAKT så servern beter sig
 * sedan TASK-275.3, se `get-event-attachments/index.ts` § filhuvudet).
 */

const BILAGA_EGEN = {
  id: 'recBilagaEgen00001',
  namn: 'Programöversikt.pdf',
  storlekBytes: 102_400,
  skapad: '2026-08-10T09:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Event',
  kursfamilj: null,
  kursniva: null,
} as const;

const BILAGA_GEMENSAM = {
  id: 'recBilagaGemensam01',
  namn: 'Hörlursinformation.pdf',
  storlekBytes: 51_200,
  skapad: '2026-08-05T09:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Kurstyp',
  kursfamilj: 'RIM',
  kursniva: null,
} as const;

function bilagorHandler() {
  return http.get(EF('get-event-attachments'), ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (eventId) return json({ attachments: [BILAGA_EGEN, BILAGA_GEMENSAM] });
    return json({ attachments: [BILAGA_GEMENSAM] });
  });
}

async function gotoEventlage(page: import('@playwright/test').Page) {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
}

async function gotoRackviddslage(page: import('@playwright/test').Page) {
  await page.goto('/mer/dokument');
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
  await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
}

/**
 * Öppnar räckviddsdialogen genom att välja en fil (S107 2026-08-18).
 *
 * FRÅGAN OM RÄCKVIDD STÄLLS NU EFTER FILVALET, inte före: sidan bär en
 * knapp, och dialogen kommer när det finns en fil att fråga om. Testerna
 * nedan prövar samma AC som förut — räckviddsvalets form, värden och
 * validering — bara via den nya vägen dit.
 *
 * `setInputFiles` mot `FileTrigger`s dolda `<input type="file">` är enda
 * vägen: en native filväljardialog kan Playwright inte styra. Inputen SCOPAS
 * till `[data-testid="ladda-upp-ny-fil"]` eftersom ytan bär flera
 * FileTriggers — varje "Ersätt"-knapp är en, och `.first()` på en oscopad
 * sökning hade träffat vilken som helst av dem beroende på DOM-ordning.
 */
async function oppnaRackviddsdialog(page: Page, filnamn = 'Testfil.pdf') {
  await page
    .getByTestId('ladda-upp-ny-fil')
    .locator('input[type="file"]')
    .setInputFiles({
      name: filnamn,
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 acceptance-fixtur'),
    });
  await expect(page.getByRole('dialog')).toBeVisible();
}

/**
 * Select-ankare som överlever ett val.
 *
 * Etiketterna är `hideLabel` (Marcus 2026-08-17), och react-aria sätter då
 * både `aria-label` och ett `aria-labelledby` som pekar på trigger-innehållet
 * — `aria-labelledby` vinner namnberäkningen, så `getByLabel('Familj')`
 * hittar ingenting. Trigger-texten byter dessutom värde vid val. Wrappern
 * bär `aria-label` oförändrat hela vägen och är därför ankaret.
 */
const familjValjare = (page: Page) => page.locator('button[aria-label="Familj"]');
const stegValjare = (page: Page) => page.locator('button[aria-label="Steg"]');

test.describe('Dokument-ytan — räckviddsval, gemensamt läge, badges (TASK-275.3)', () => {
  test('AC #1: uppladdningsflödet bär räckviddsval — radio Detta event/En familj/Alla event, Familj-select vid familj-läget', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const radioGroup = page.getByRole('radiogroup', { name: 'Räckvidd' });
    await expect(radioGroup).toBeVisible();
    const dettaEvent = radioGroup.getByRole('radio', { name: 'Detta event' });
    const enKurstyp = radioGroup.getByRole('radio', { name: 'En familj' });
    const allaEvent = radioGroup.getByRole('radio', { name: 'Alla event' });
    await expect(dettaEvent).toBeChecked();
    await expect(enKurstyp).toBeVisible();
    await expect(allaEvent).toBeVisible();
    // I eventläget är "Detta event" INTE avstängd (ett event ÄR valt).
    await expect(dettaEvent).toBeEnabled();

    // [TASK-309.23] Familj-selecten är sedan layout-shift-fixen ALLTID
    // monterad (platsen reserveras för att dialogens höjd aldrig ska hoppa
    // när räckvidden växlar) — men osynlig och `inert` (icke-fokuserbar,
    // borta ur tillgänglighetsträdet) innan familj-läget är valt.
    // `not.toBeVisible()` är rätt prövning för "syns inte", inte
    // `toHaveCount(0)`: elementet FINNS i DOM, bara dolt.
    await expect(familjValjare(page)).not.toBeVisible();

    // RAC:s `<Radio>` renderar (som `<Checkbox>`, se klickaKryss-mönstret i
    // atgarder-bilageval-send.acceptance.test.ts) sin `<input>` VISUELLT
    // täckt av ett eget dekorativt `<span>` — ett direkt `.click()` på
    // rollen hit-testar mot spannet och timeoutar. Klicka ANCESTOR-`<label>`
    // i stället (samma etablerade repo-mönster).
    await enKurstyp.locator('xpath=ancestor::label[1]').click();
    await expect(familjValjare(page)).toBeVisible();
    // Steg-selecten är samma "alltid monterad, osynlig tills tillämplig"
    // — syns INTE förrän en nivåbärande familj är vald.
    await expect(stegValjare(page)).not.toBeVisible();

    await familjValjare(page).click();
    await page.getByRole('option', { name: 'RIM', exact: true }).click();
    await expect(stegValjare(page)).toBeVisible();

    // Byte till en nivålös familj (Fjärrskådning) döljer Steg-selecten
    // igen (ADR-118 beslut 1: nivålösa familjer lämnar alltid nivån tom).
    //
    // SELECTARNA SÖKS PÅ SIN `aria-label`-WRAPPER, inte på trigger-texten.
    // Etiketterna är `hideLabel` sedan Marcus 2026-08-17 ("rubriken Familj
    // till dropdownlistan kan tas bort"), och react-aria sätter då BÅDE
    // `aria-label` och ett `aria-labelledby` som pekar på trigger-innehållet.
    // `aria-labelledby` VINNER över `aria-label` i namnberäkningen, så det
    // tillgängliga namnet blir trigger-texten — inte "Familj". Mätt i
    // renderad yta 2026-08-17, därav helpers nedan.
    //
    // Trigger-TEXTEN duger inte heller som ankare: den byter från "Välj
    // familj" till det valda värdet ("RIM") så fort ett val gjorts, och
    // testet klickar selecten TVÅ gånger. `aria-label`-wrappern är det enda
    // som står stilla genom hela flödet.
    await familjValjare(page).click();
    await page.getByRole('option', { name: 'Fjärrskådning', exact: true }).click();
    await expect(stegValjare(page)).not.toBeVisible();
  });

  test('AC #2: räckviddsläget (utan valt event) visar gemensamma dokument, "Detta event" avstängd', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    // Event-scopade bilagor ("Programöversikt.pdf") hör INTE hemma i
    // räckviddsläget — bara den gemensamma bilagan listas.
    await expect(page.getByText(BILAGA_EGEN.namn)).toHaveCount(0);

    await oppnaRackviddsdialog(page);
    const radioGroup = page.getByRole('radiogroup', { name: 'Räckvidd' });
    await expect(radioGroup.getByRole('radio', { name: 'Detta event' })).toBeDisabled();
    await expect(radioGroup.getByRole('radio', { name: 'En familj' })).toBeChecked();
  });

  test('AC #4: gemensam bilaga — Ersätt/Radera SAKNAS i eventläget (badge bär förklaringen), men FINNS i räckviddsläget', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    const gemensamRadEventlage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(gemensamRadEventlage).toBeVisible();
    await expect(gemensamRadEventlage.getByText('RIM · Alla steg')).toBeVisible();
    await expect(gemensamRadEventlage.getByRole('button', { name: 'Ersätt' })).toHaveCount(0);
    await expect(gemensamRadEventlage.getByRole('button', { name: 'Radera' })).toHaveCount(0);

    // SAMMA bilaga (samma id/namn), i räckviddsläget: BÅDA knapparna finns.
    await gotoRackviddslage(page);
    const gemensamRadRackviddslage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(gemensamRadRackviddslage.getByRole('button', { name: 'Ersätt' })).toBeVisible();
    await expect(gemensamRadRackviddslage.getByRole('button', { name: 'Radera' })).toBeVisible();
  });

  test('AC #5: eventläget är axe-rent (badge + räckviddsval synliga)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    // TASK-299.11 — husets delade SidRam-primitiv (promoverad, dev-växeln
    // `?sidram=ny` riven ADR-103 B2 steg 4): chevronens tillgängliga namn.
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #5: räckviddsläget är axe-rent', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    // TASK-299.11 — husets delade SidRam-primitiv (promoverad, dev-växeln
    // `?sidram=ny` riven ADR-103 B2 steg 4): chevronens tillgängliga namn.
    await expect(page.getByRole('link', { name: 'Tillbaka till Mer' })).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  // ═══ FILEN FÖRST, RÄCKVIDDEN SEDAN (Marcus 2026-08-18) ═══
  //
  // Det permanenta tvåstegs-blocket på sidan är rivet. Sidan bär en knapp;
  // räckviddsfrågan ställs i en dialog EFTER filvalet, med filnamnet synligt
  // så svaret gäller något konkret. Testerna nedan låser det som inte får
  // gå sönder i den flytten: dialogen är axe-ren, och flödet fungerar hela
  // vägen till EF-anropet med RÄTT räckvidd.

  test('uppladdningsdialogen är axe-ren (ny yta sedan blocket revs)', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('flödet ände-till-ände: fil → dialog → räckvidd → EF-anropet bär valet, dialogen stänger', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());

    // Fångar EF-kroppen så testet kan bevisa VAD som skickades, inte bara
    // att något skickades. Räckvidden är hela poängen med dialogen.
    let skickadKropp: Record<string, unknown> | null = null;
    network.use(
      http.post(EF('upload-attachment'), async ({ request }) => {
        skickadKropp = (await request.json()) as Record<string, unknown>;
        return json({
          attachment: {
            ...BILAGA_GEMENSAM,
            id: 'recBilagaNy00000001',
            namn: 'Testfil.pdf',
            rackvidd: 'Alla event',
            kursfamilj: null,
          },
        });
      }),
    );

    await gotoEventlage(page);
    await oppnaRackviddsdialog(page, 'Testfil.pdf');

    const dialog = page.getByRole('dialog');
    // Filnamnet står i dialogen — frågan gäller något konkret, inte "en fil".
    await expect(dialog.getByText('Testfil.pdf')).toBeVisible();

    // RAC:s `<Radio>` täcks visuellt av ett dekorativt `<span>`; klicka
    // ancestor-`<label>` (samma repo-mönster som AC #1 ovan).
    await dialog
      .getByRole('radio', { name: 'Alla event' })
      .locator('xpath=ancestor::label[1]')
      .click();
    await dialog.getByRole('button', { name: 'Ladda upp' }).click();

    // Dialogen stänger av sig själv när uppladdningen lyckats — Lotta ska
    // inte behöva stänga en dialog vars jobb är gjort.
    await expect(dialog).toHaveCount(0);
    expect(skickadKropp).toMatchObject({ rackvidd: 'Alla event' });
  });

  test('inline-rullningen: tabb-stopp och max-höjd bara när listan faktiskt rullar', async ({
    page,
    network,
  }) => {
    // [ÄNDRAD, TASK-309.8] `MALLAR` bär nu TVÅ poster (Bekräftelsebilaga +
    // Deltagarinformation, ADR-125 § 6 — se `DokumentYta.tsx`s filhuvud)
    // i stället för den tidigare enda generiska platshållaren. Fixturen ger
    // därför EN bilaga (i stället för `bilagorHandler()`s två) + 2 mallar +
    // 1 generator = fyra poster, precis PÅ gränsen, alltså ingen rullning
    // och inget tomt tabb-stopp — samma avsikt som förut, räknat om mot den
    // nya katalogstorleken. Bilagan är `BILAGA_GEMENSAM` (inte `_EGEN`) i
    // BÅDA lägena: `gotoEventlage`s eget assert letar efter just den, delat
    // med alla andra tester i filen.
    network.use(
      http.get(EF('get-event-attachments'), () => json({ attachments: [BILAGA_GEMENSAM] })),
    );
    await gotoEventlage(page);

    const lista = page.getByTestId('dokument-lista');
    await expect(lista).not.toHaveAttribute('tabindex', '0');

    // Sex bilagor tippar över gränsen: rullningen blir verklig, och DÅ är
    // tabb-stoppet ett WCAG 2.1.1-golv (axe scrollable-region-focusable).
    //
    // ETT ANDRA `network.use` RÄCKER — MSW prependar runtime-handlers, så den
    // senast tillagda vinner. `page.unrouteAll()` vore FEL verktyg: det river
    // fixturvärldens samtliga grundmockar och fäller hermetik-vakten på nästa
    // omockade anrop (mätt: OmockadRequestError, första försöket).
    network.use(
      http.get(EF('get-event-attachments'), ({ request }) => {
        const eventId = new URL(request.url).searchParams.get('eventId');
        if (!eventId) return json({ attachments: [BILAGA_GEMENSAM] });
        return json({
          attachments: Array.from({ length: 6 }, (_, i) => ({
            ...BILAGA_EGEN,
            id: `recBilagaManga${String(i).padStart(5, '0')}`,
            namn: `Bilaga ${i + 1}.pdf`,
          })),
        });
      }),
    );
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const rullande = page.getByTestId('dokument-lista');
    await expect(rullande).toHaveAttribute('tabindex', '0');
    await expect(rullande).toHaveAttribute('aria-label', 'Dokument');
    // ═══ EXAKT FYRA RADER, KLIPPT VID SEPARATORN ═══
    //
    // Marcus 2026-08-18: *"se till att listan visar exakt 4 dokumentrader,
    // alltså att den fjärde längst ner klipps exakt precis över separatorn."*
    // Höjden MÄTS mot radernas faktiska geometri i stället för mot en
    // hårdkodad siffra — då fäller testet om radhöjden någonsin ändras, i
    // stället för att tyst acceptera en halv rad i underkanten.
    //
    // [TASK-309.24] `listHojd` jämförs mot `ul.clientHeight` (innehålls-
    // höjden), INTE `getBoundingClientRect().height` (ul:ens EGNA border-box,
    // border inkluderad). `<ul>` bär `border border-transparent` +
    // `box-sizing: border-box` (Tailwind preflight) — `useLastaListhojd`
    // (`DokumentYta.tsx`) kompenserar sin satta `style.height` med exakt
    // kantbredden (mätt: utan kompensationen klipptes fjärde radens
    // underkant 2 px för tidigt), så ul:ens EGEN border-box är nu MEDVETET
    // 2 px större än radspannet — `clientHeight` (som utesluter border) är
    // det jämförbara talet.
    //
    // [TASK-309.39] FJÄRDE RADENS EGEN SEPARATOR DRAS BORT — och det är
    // testets förväntan som ändrades, inte produktregeln.
    //
    // Marcus regel ovan säger *"klipps exakt precis över separatorn"*.
    // Fram till 309.39 mätte detta test `fjarde.bottom - forsta.top` rakt
    // av, och det spannet INKLUDERAR fjärde radens `border-bottom`:
    // Tailwind 4:s `divide-y` genererar `:where(& > :not(:last-child))
    // { border-bottom-… }` (verifierat i `tailwindcss/dist/lib.js`), så
    // linjen tillhör raden OVANFÖR mellanrummet — inte raden nedanför som
    // i Tailwind 3. Att jämföra `clientHeight` mot det spannet krävde
    // alltså att boxen slutade UNDER linjen i stället för över den, vilket
    // är precis vad Marcus såg i prod 2026-08-29: *"listan ska sluta precis
    // över den nedersta separatorn men det gör den inte just nu, jag ser
    // den nedersta separatorn."*
    //
    // Mätt vid övergången (denna fixtur, 9 rader): `clientHeight` gick
    // 396 → 395 medan det gamla `fyraRader` stod kvar på 396 — differensen
    // är exakt linjens 1 px. `fyraRader` nedan drar därför bort samma term
    // som `useLastaListhojd`s NIVÅ 1 gör, och testet mäter åter samma sak
    // som produktregeln säger.
    //
    // Vid EXAKT fyra rader är fjärde raden `:last-child`, bär ingen
    // `divide-y`-linje, och avdraget blir 0 — invarianten gäller alltså
    // oförändrat i det gränsfallet (se `dokument-lista-hojdlas-tidpunkt`s
    // negativa kontroll).
    const geometri = await rullande.evaluate((ul) => {
      const items = Array.from(ul.children) as HTMLElement[];
      const forsta = items[0].getBoundingClientRect();
      const fjarde = items[3].getBoundingClientRect();
      const fjardeSeparator = Number.parseFloat(getComputedStyle(items[3]).borderBottomWidth) || 0;
      return {
        listHojd: ul.clientHeight,
        fyraRader: fjarde.bottom - forsta.top - fjardeSeparator,
        fjardeSeparator,
        rullar: ul.scrollHeight > ul.clientHeight,
      };
    });
    // Linjen FINNS i denna fixtur (nio rader, så fjärde raden är inte
    // sista) — utan detta hade testet kunnat passera på att avdraget var
    // noll av fel skäl.
    expect(geometri.fjardeSeparator).toBeGreaterThan(0);
    expect(geometri.listHojd).toBeCloseTo(geometri.fyraRader, 0);
    expect(geometri.rullar).toBe(true);

    // ═══ LAYOUTEN HOPPAR INTE NÄR FILTRET VÄXLAR ═══
    //
    // Marcus: *"nu ser skillnaden genom att växla mellan 'Alla' och
    // 'Bilagor', för då hoppar layouten/listan i höjd."* Höjden låses på
    // TOTALEN, inte på det filtrerade antalet, så allt under listan —
    // inklusive uppladdningsknappen — står stilla.
    const foreVaxling = (await rullande.boundingBox())?.height;
    await page.getByRole('radio', { name: 'Bilagor' }).click();
    await expect(page.getByText('Deltagarinformation')).toHaveCount(0);
    const efterVaxling = (await page.getByTestId('dokument-lista').boundingBox())?.height;
    expect(efterVaxling).toBe(foreVaxling);
  });

  test('täckningspillen är SYNLIG mot sitt underlag — mätt, inte antaget', async ({
    page,
    network,
  }) => {
    // ═══ VAKT MOT EN FELKLASS SOM SLAGIT SEX GÅNGER PÅ DENNA YTA ═══
    //
    // `bg-bg-muted` bär BÅDE kortbakgrunden och rollen "svag yta för element
    // inuti kortet", och `bg-surface` gör detsamma en nivå ner. Varje gång en
    // behållare bytt bakgrund har något inuti den blivit osynligt: ghost-hovern
    // på Visa-knappen (två gånger), Ersätt/Radera, räckviddspillen,
    // uppladdningsskalet, och senast pillen igen när listan fick sin egen
    // `bg-surface`-yta 2026-08-18.
    //
    // Varje instans har hittills fångats av Marcus öga eller av en kommentar
    // som ingen läste. Detta är vakten: den mäter FAKTISK `backgroundColor` i
    // renderad yta och bryr sig inte om vilka klassnamn som råkar stå där.
    network.use(bilagorHandler());
    await gotoEventlage(page);

    const pill = page.getByText('RIM · Alla steg');
    await expect(pill).toBeVisible();
    const pillFarg = await pill.evaluate((el) => getComputedStyle(el).backgroundColor);
    const listFarg = await page
      .getByTestId('dokument-lista')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(pillFarg).not.toBe(listFarg);
  });

  // ═══ RÄCKVIDDS-AXELN ÄR EN KONTROLL (Marcus 2026-08-18, S107 QA-vandringen) ═══
  //
  // Lägesbytet bars tidigare av en knapp längst ner i dokumentlistan ("Visa
  // gemensamma dokument"), vilket gav ytan TVÅ kontroller på samma axel — och
  // knappen kolliderade visuellt med typfiltrets "Alla", som opererar på en
  // HELT ANNAN axel. Marcus: *"vi kan ju inte ha toggle-valet 'ALLA' i
  // eventläget och även ha knappen 'Visa gemensamma dokument' … detta är inte
  // bra."* Knappen är riven; `EventValjare` bär nu ett kontextlöst alternativ
  // (`gemensamtAlternativ`, opt-in) överst i sin lista, etiketterat "Delade
  // dokument" sedan Marcus copy-beslut samma dag. MODELLBEGREPPET är
  // oförändrat — ORDLISTA.md § Gemensam bilaga och `AttachmentScope`-värdena
  // rörs inte; detta är UI-språk, samma skiktning som `Nivå`→`Steg`.
  //
  // Testerna nedan låser BÅDA halvorna: att knappen är borta (annars kan den
  // smyga tillbaka vid en framtida ändring), och att väljarvägen faktiskt
  // fungerar i båda riktningarna.

  test('räckvidds-axeln: väljaren bär "Delade dokument" och tar en till förvaltningsläget', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    // Den rivna knappen får inte återuppstå — varken i listan eller ovanför.
    await expect(page.getByRole('button', { name: 'Visa gemensamma dokument' })).toHaveCount(0);

    await page.getByTestId('event-valjare-trigger').click();
    const alternativ = page.getByRole('option', { name: 'Delade dokument', exact: true });
    await expect(alternativ).toBeVisible();
    await alternativ.click();

    // Valet nollar `?event=` → förvaltningsläget, där eventets EGNA bilaga
    // inte hör hemma och Radera (räckviddslägets ensamrätt) finns.
    await expect(page).toHaveURL(/\/mer\/dokument$/);
    await expect(page.getByText(BILAGA_EGEN.namn)).toHaveCount(0);
    await expect(
      page
        .getByTestId('dokument-fil')
        .filter({ hasText: BILAGA_GEMENSAM.namn })
        .getByRole('button', { name: 'Radera' }),
    ).toBeVisible();
  });

  test('räckvidds-axeln: stängda väljaren säger VAR man är, inte att ett val saknas', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    // Före denna ändring stod "Välj event" här — vilket läser som ett ogjort
    // val trots att förvaltningsläget ÄR ett valt läge.
    const trigger = page.getByTestId('event-valjare-trigger');
    await expect(trigger).toContainText('Delade dokument');
    await expect(trigger).not.toContainText('Välj event');

    // Och vägen tillbaka in i ett event fungerar från samma kontroll.
    await trigger.click();
    // Fixturens Skövde-event ÄR `VISUAL_EVENT_ID` (fixture-data.ts:
    // `eventNamn: 'Utbildning Skövde'`, startdatum 2026-09-26 = kommande, så
    // väljarens kommande-filter släpper igenom det). Matchas på orten: den är
    // unik bland fixturens tre event (Skövde/Göteborg/Varberg) och står i
    // både namnet och `KontextRad`s ort-led.
    await page
      .getByRole('option', { name: /Skövde/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`event=${VISUAL_EVENT_ID}`));
    await expect(page.getByText(BILAGA_EGEN.namn)).toBeVisible();
  });
});

/**
 * [TASK-309.23] REGRESSIONSVAKT — dialogens geometri är LÅST, inte
 * villkorad. Marcus prod-röktest 2026-08-26: *"När jag laddar upp dokument
 * ... och om jag väljer 'Alla event' så ändrar rutan storlek, sånt avskyr
 * ju jag ... Åtgärda så rutan aldrig ändrar storlek och läge vad jag än
 * väljer eller trycker på."*
 *
 * ROTORSAKEN (tre separata villkorade block i `RackviddsDialog`, alla i
 * `DokumentYta.tsx`) är fixad med samma "reservera alltid plats"-teknik
 * som `Pill`s `dold`-prop i `PersonsList.tsx` (Marcus S103): Familj/Steg-
 * raden, Steg-selecten för sig och valideringsmeddelandet renderas nu
 * ALLTID och döljs med `invisible` (+ `inert` på de två förstnämnda, som
 * bär fokuserbara kontroller) i stället för att monteras/avmonteras.
 *
 * Testerna nedan bevisar BÅDA hälfterna av fixen: att geometrin verkligen
 * står stilla (AC #1) OCH att de dolda kontrollerna är riktigt dolda för
 * tangentbord och skärmläsare (AC #2) — en `invisible`-yta som ändå går
 * att tabba till hade bytt ett synligt problem mot ett osynligt.
 */
test.describe('TASK-309.23 — uppladdningsdialogens geometri är låst', () => {
  /**
   * Håll-bar uppladdningsmock (samma mönster som `hallbarMock` i
   * `hem-laddlage.acceptance.test.ts`, task-4.5): `hall = true` parkerar
   * EF-anropet obesvarat så `uploadMutation.isPending` — och därmed
   * dialogens "Laddar upp …"-läge — står deterministiskt tills testet
   * släpper det, i stället för en gissad `setTimeout`-fördröjning
   * (TASK-3-klassen).
   */
  function hallbarUppladdningsmock(network: NetworkFixture) {
    const st = {
      hall: true,
      parkerade: [] as Array<() => void>,
      slapp() {
        for (const slapp of this.parkerade.splice(0)) slapp();
      },
    };
    network.use(
      http.post(EF('upload-attachment'), async () => {
        if (st.hall) await new Promise<void>((slapp) => st.parkerade.push(slapp));
        return json({
          attachment: { ...BILAGA_GEMENSAM, id: 'recBilagaGeometri01', namn: 'GeometriTest.pdf' },
        });
      }),
    );
    return st;
  }

  /**
   * Kärnflödet, delat mellan desktop- och mobil-testet: samma FEM lägen,
   * samma sekvens, samma dialog-instans genom hela vandringen (ingen
   * stängning/öppning mellan mätpunkterna — det är just STABILITETEN inom
   * en sittning som är kravet). Returnerar de fem uppmätta rutorna.
   *
   * `page.emulateMedia({ reducedMotion: 'reduce' })` slår av `Modal`s
   * in-animation (`base.css`s globala `prefers-reduced-motion: reduce`-
   * regel nollar `transition-duration`) INNAN dialogen öppnas — annars
   * mäter den FÖRSTA rutan potentiellt mitt i `data-entering`s
   * `scale-95`-transform, vilket testar en övergångsram i stället för det
   * stabila läget (samma fälla som `prototyp-verifiering-runbook.md`
   * § Bildtagningens andra fälla varnar för, fast för `getBoundingClientRect`
   * i stället för en skärmdump).
   */
  async function matUppLagen(page: Page, network: NetworkFixture) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    network.use(bilagorHandler());
    const uppladdning = hallbarUppladdningsmock(network);
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page, 'GeometriTest.pdf');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const matt = async () => {
      const box = await dialog.boundingBox();
      if (!box) throw new Error('Dialogen har ingen bounding box — inte synlig?');
      return box;
    };

    // LÄGE 1: "Detta event" — dialogens defaultläge i eventkontext.
    const dettaEvent = await matt();

    // LÄGE 2: "En familj", ingen familj vald ännu — Familj-selecten syns,
    // Steg-selecten är fortfarande dold, valideringsmeddelandet ("Välj en
    // familj för att gå vidare.") syns.
    await dialog
      .getByRole('radio', { name: 'En familj' })
      .locator('xpath=ancestor::label[1]')
      .click();
    await expect(familjValjare(page)).toBeVisible();
    const enFamilj = await matt();

    // LÄGE 3: "Familj vald" (RIM) — Steg-selecten blir synlig,
    // valideringsmeddelandet försvinner. Detta är det läge som adderar MEST
    // innehåll (två selects + inget meddelande i stället för ett), så det är
    // den hårdaste prövningen av reservationen.
    await familjValjare(page).click();
    await page.getByRole('option', { name: 'RIM', exact: true }).click();
    await expect(stegValjare(page)).toBeVisible();
    const familjVald = await matt();

    // LÄGE 4: "Alla event" — tillbaka till samma tomma yta som läge 1, men
    // via en annan väg (byte FRÅN Kurstyp, inte bara aldrig dit).
    await dialog
      .getByRole('radio', { name: 'Alla event' })
      .locator('xpath=ancestor::label[1]')
      .click();
    const allaEvent = await matt();

    // LÄGE 5: under pågående uppladdning. Räckvidden växlas tillbaka till
    // "Detta event" (enklaste giltiga valet) och mutationen hålls pending
    // med håll-bar-mocken — deterministiskt, ingen gissad väntetid.
    await dialog
      .getByRole('radio', { name: 'Detta event' })
      .locator('xpath=ancestor::label[1]')
      .click();
    await dialog.getByRole('button', { name: 'Ladda upp' }).click();
    await expect(dialog.getByRole('button', { name: 'Laddar upp…' })).toBeVisible();
    const underUppladdning = await matt();

    // Släpp mutationen — annars lämnar testet ett hängande nätverksanrop
    // (samma disciplin som `slappAlla` i hem-laddlage-mönstret).
    uppladdning.slapp();
    await expect(dialog).toHaveCount(0);

    return { dettaEvent, enFamilj, familjVald, allaEvent, underUppladdning };
  }

  test('AC #1: dialogens bounding box är IDENTISK i alla fem lägen — desktop 1280×720', async ({
    page,
    network,
  }) => {
    const lagen = await matUppLagen(page, network);
    expect(lagen.enFamilj).toEqual(lagen.dettaEvent);
    expect(lagen.familjVald).toEqual(lagen.dettaEvent);
    expect(lagen.allaEvent).toEqual(lagen.dettaEvent);
    expect(lagen.underUppladdning).toEqual(lagen.dettaEvent);
  });

  test('AC #1: dialogens bounding box är IDENTISK i alla fem lägen — mobil 375 px (sm:-brytpunkten kolumn→rad)', async ({
    page,
    network,
  }) => {
    // 375 px är den kritiska brytpunkten: `sm:flex-row` växlar till
    // `flex-col`, så Familj-/Steg-raden STAPLAR sina två selects i stället
    // för att lägga dem sida vid sida. Reservationen måste hålla här också
    // — annars döljer desktop-mätningen ovan exakt den höjdskillnad
    // rad-kommentaren i `DokumentYta.tsx` varnar för.
    await page.setViewportSize({ width: 375, height: 800 });
    const lagen = await matUppLagen(page, network);
    expect(lagen.enFamilj).toEqual(lagen.dettaEvent);
    expect(lagen.familjVald).toEqual(lagen.dettaEvent);
    expect(lagen.allaEvent).toEqual(lagen.dettaEvent);
    expect(lagen.underUppladdning).toEqual(lagen.dettaEvent);
  });

  test('AC #2: dolda Familj-/Steg-kontroller är INTE i tabordningen (Detta event/Alla event)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const dialog = page.getByRole('dialog');
    const dettaEvent = dialog.getByRole('radio', { name: 'Detta event' });
    await expect(dettaEvent).toBeChecked();

    // Familj-/Steg-raden är monterad men `inert` i "Detta event"-läget.
    // Tab FRÅN den markerade radioknappen (RadioGroups roving tabindex ger
    // EN tabbstation för hela gruppen) ska hoppa RAKT till "Avbryt" — hade
    // raden varit fokuserbar hade Tab i stället landat i Familj-selecten.
    await dettaEvent.focus();
    await expect(dettaEvent).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Avbryt' })).toBeFocused();

    // Samma prövning i "Alla event" — en annan väg dit, samma dolda rad.
    await dialog
      .getByRole('radio', { name: 'Alla event' })
      .locator('xpath=ancestor::label[1]')
      .click();
    const allaEvent = dialog.getByRole('radio', { name: 'Alla event' });
    await allaEvent.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Avbryt' })).toBeFocused();

    // `.focus()` (JS-anrop, inte tangentbord) ska INTE heller kunna flytta
    // fokus in i en `inert` kontroll — spec-beteendet `inert` bygger på.
    await familjValjare(page).evaluate((el: HTMLElement) => el.focus());
    await expect(familjValjare(page)).not.toBeFocused();
  });

  test('AC #2: "Familj vald" (RIM) — båda selecten synliga/fokuserbara, meddelandet dolt, axe-rent', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    await page
      .getByRole('dialog')
      .getByRole('radio', { name: 'En familj' })
      .locator('xpath=ancestor::label[1]')
      .click();
    await familjValjare(page).click();
    await page.getByRole('option', { name: 'RIM', exact: true }).click();

    await expect(familjValjare(page)).toBeVisible();
    await expect(stegValjare(page)).toBeVisible();
    // Valideringsmeddelandet är dolt (en familj ÄR vald) men kvar i DOM —
    // `not.toBeVisible()`, inte `toHaveCount(0)` (se AC #1-testets kommentar
    // ovan i filen för samma distinktion på Familj-/Steg-selecten).
    await expect(page.getByText('Välj en familj för att gå vidare.')).not.toBeVisible();

    // Familj-valet nås fortfarande med tangentbord (AC #2s explicita krav)
    // — Steg-selecten är den ANDRA riktiga kontrollen i tabbordningen nu.
    await stegValjare(page).focus();
    await expect(stegValjare(page)).toBeFocused();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
