import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

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

    // Ingen Familj-select innan familj-läget är valt.
    await expect(familjValjare(page)).toHaveCount(0);

    // RAC:s `<Radio>` renderar (som `<Checkbox>`, se klickaKryss-mönstret i
    // atgarder-bilageval-send.acceptance.test.ts) sin `<input>` VISUELLT
    // täckt av ett eget dekorativt `<span>` — ett direkt `.click()` på
    // rollen hit-testar mot spannet och timeoutar. Klicka ANCESTOR-`<label>`
    // i stället (samma etablerade repo-mönster).
    await enKurstyp.locator('xpath=ancestor::label[1]').click();
    await expect(familjValjare(page)).toBeVisible();
    // Steg-selecten syns INTE förrän en nivåbärande familj är vald.
    await expect(stegValjare(page)).toHaveCount(0);

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
    await expect(stegValjare(page)).toHaveCount(0);
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
    // Fixturen ger fyra poster i eventläget (2 bilagor + 1 mall + 1 generator)
    // — precis PÅ gränsen, alltså ingen rullning och inget tomt tabb-stopp.
    network.use(bilagorHandler());
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
    const geometri = await rullande.evaluate((ul) => {
      const items = Array.from(ul.children) as HTMLElement[];
      const forsta = items[0].getBoundingClientRect();
      const fjarde = items[3].getBoundingClientRect();
      return {
        listHojd: ul.getBoundingClientRect().height,
        fyraRader: fjarde.bottom - forsta.top,
        rullar: ul.scrollHeight > ul.clientHeight,
      };
    });
    expect(geometri.listHojd).toBe(geometri.fyraRader);
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
