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
 *   AC #1 — uppladdningsflödet bär räckviddsval. [OMSKRIVET, TASK-338.3,
 *     ADR-125 § Beslut 1] TVÅ radioval ("Bara detta event" / "Delat dokument
 *     - gäller flera event"), och under det senare TRE valfria Select:ar —
 *     Familj, Steg (bara för en nivåbärande familj, RIM) och Plats — plus en
 *     sammanfattningsrad som säger i klartext vad valet betyder. De tre
 *     räckvidderna blev två: `Kurstyp`/`Alla event` ÄR `Gemensam` med
 *     respektive utan axlar.
 *
 *   UI-SPRÅKET BYTTE VID S107 QA-VANDRINGEN, VÄRDENA GJORDE DET INTE —
 *   OCH NU BYTTE VÄRDENA OCKSÅ (TASK-338.3). Etiketterna heter "Familj" /
 *   "Steg" / "Plats" (Marcus: ordet "Kurs" ska bort ur produktspråket;
 *   "Eventtyp" var upptaget av ett annat begrepp och valdes bort). Det som
 *   skickas till basen är sedan ADR-125 § 1 `AttachmentScope.GEMENSAM` =
 *   'Gemensam' — den nya optionen i Airtable-fältet `Räckvidd`. Testet låser
 *   fortfarande etiketterna via `getByLabel`/`getByRole`, och rör värde-
 *   strängen på exakt ETT ställe: ände-till-ände-testet som läser EF-kroppen
 *   (räckvidden ÄR det testets fråga). Ett framtida copy-byte ska fälla HÄR,
 *   ett värdebyte i staging-API-testerna OCH i det ena kropps-assertet.
 *   AC #2 — Dokument-sidan har ett läge UTAN valt event som visar gemensamma
 *     dokument (räckviddsläget); "Bara detta event" är avstängd där (inget
 *     event att koppla mot).
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
  plats: null,
} as const;

/**
 * [OMSKRIVEN, TASK-338.3, ADR-125 § Beslut 1] VÄRDET bytte: `Kurstyp` finns
 * inte längre som räckvidd, det ÄR `Gemensam` med en familje-axel satt.
 * Fixturen bär dessutom PLATS-axeln, så eventlägets renderade badge prövar
 * en KOMBINERAD form ("RIM · Rönninge") i stället för den enklaste — det är
 * kombinationen PRD TASK-338 berättelse 4 handlar om (sushimenyn: RIM-event
 * i Rönninge), och den enda som kan avslöja att axlarna fogas ihop fel.
 *
 * Plats-ID:t är fixturvärldens Rönninge (`PLACES_RESPONSE`,
 * `fixture-data.ts`), samma post dialogens Plats-select erbjuder.
 */
const BILAGA_GEMENSAM = {
  id: 'recBilagaGemensam01',
  namn: 'Hörlursinformation.pdf',
  storlekBytes: 51_200,
  skapad: '2026-08-05T09:00:00.000Z',
  eventId: VISUAL_EVENT_ID,
  dokumentklass: 'Uppladdad',
  rackvidd: 'Gemensam',
  kursfamilj: 'RIM',
  kursniva: null,
  plats: { id: 'recPlatsRonninge01', namn: 'Rönninge' },
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
/** [TASK-338.3] Tredje axeln — samma `aria-label`-wrapper-ankare som ovan. */
const platsValjare = (page: Page) => page.locator('button[aria-label="Plats"]');

/** Räckviddsradions två etiketter, på ETT ställe (TASK-338.3). */
const EVENT_RADIO = 'Bara detta event';
const DELAT_RADIO = 'Delat dokument - gäller flera event';

/**
 * RAC:s `<Radio>` renderar sin `<input>` VISUELLT täckt av ett dekorativt
 * `<span>` — ett direkt `.click()` på rollen hit-testar mot spannet och
 * timeoutar. Klicka ancestor-`<label>` i stället (etablerat repo-mönster,
 * samma som `klickaKryss` i atgarder-bilageval-send).
 */
async function valjRackvidd(page: Page, namn: string) {
  await page
    .getByRole('dialog')
    .getByRole('radio', { name: namn })
    .locator('xpath=ancestor::label[1]')
    .click();
}

/** Väljer ett alternativ i en av de tre axel-selectarna. */
async function valjIAxel(
  page: Page,
  valjare: (p: Page) => ReturnType<Page['locator']>,
  alternativ: string,
) {
  await valjare(page).click();
  await page.getByRole('option', { name: alternativ, exact: true }).click();
}

test.describe('Dokument-ytan — räckviddsval, gemensamt läge, badges (TASK-275.3)', () => {
  test('AC #1: uppladdningsflödet bär TVÅ radioval + tre valfria axel-selectar med defaults', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const radioGroup = page.getByRole('radiogroup', { name: 'Räckvidd' });
    await expect(radioGroup).toBeVisible();
    const dettaEvent = radioGroup.getByRole('radio', { name: EVENT_RADIO });
    const delat = radioGroup.getByRole('radio', { name: DELAT_RADIO });
    await expect(dettaEvent).toBeChecked();
    await expect(delat).toBeVisible();
    // I eventläget är "Bara detta event" INTE avstängd (ett event ÄR valt).
    await expect(dettaEvent).toBeEnabled();

    // [TASK-338.3] TVÅ val, inte tre — "Alla event" var ett eget radioval i
    // ADR-118:s modell och ÄR nu "Delat dokument" utan satta axlar. Att
    // assertera dess FRÅNVARO är hela poängen: en kvarlämnad tredje knapp
    // hade skrivit ett legacy-värde till basen.
    await expect(radioGroup.getByRole('radio')).toHaveCount(2);
    await expect(radioGroup.getByRole('radio', { name: 'Alla event' })).toHaveCount(0);

    // [TASK-309.23] Axel-selectarna är sedan layout-shift-fixen ALLTID
    // monterade (platsen reserveras för att dialogens höjd aldrig ska hoppa
    // när räckvidden växlar) — men osynliga och `inert` (icke-fokuserbara,
    // borta ur tillgänglighetsträdet) i event-läget.
    // `not.toBeVisible()` är rätt prövning för "syns inte", inte
    // `toHaveCount(0)`: elementen FINNS i DOM, bara dolda.
    await expect(familjValjare(page)).not.toBeVisible();
    await expect(platsValjare(page)).not.toBeVisible();

    await valjRackvidd(page, DELAT_RADIO);

    // Familj och Plats syns nu, BÅDA i sitt nolläge. Nolläget är ett eget
    // alternativ (inte en platshållare) just för att axlarna är valfria och
    // måste gå att ångra tillbaka till — se dialogens kommentar.
    await expect(familjValjare(page)).toBeVisible();
    await expect(familjValjare(page)).toContainText('Alla familjer');
    await expect(platsValjare(page)).toBeVisible();
    await expect(platsValjare(page)).toContainText('Alla platser');

    // Steg-selecten är "alltid monterad, osynlig tills tillämplig" — den
    // syns INTE förrän en nivåbärande familj är vald.
    await expect(stegValjare(page)).not.toBeVisible();

    await valjIAxel(page, familjValjare, 'RIM');
    await expect(stegValjare(page)).toBeVisible();
    await expect(stegValjare(page)).toContainText('Alla steg');

    // Byte till en nivålös familj (Fjärrskådning) döljer Steg-selecten
    // igen (ORDLISTA.md § Steg: nivålösa familjer har inga steg alls).
    //
    // SELECTARNA SÖKS PÅ SIN `aria-label`-WRAPPER, inte på trigger-texten.
    // Etiketterna är `hideLabel` sedan Marcus 2026-08-17 ("rubriken Familj
    // till dropdownlistan kan tas bort"), och react-aria sätter då BÅDE
    // `aria-label` och ett `aria-labelledby` som pekar på trigger-innehållet.
    // `aria-labelledby` VINNER över `aria-label` i namnberäkningen, så det
    // tillgängliga namnet blir trigger-texten — inte "Familj". Mätt i
    // renderad yta 2026-08-17, därav helpers ovan.
    //
    // Trigger-TEXTEN duger inte heller som ankare: den byter från nolläget
    // till det valda värdet ("RIM") så fort ett val gjorts, och testet
    // klickar selecten flera gånger. `aria-label`-wrappern är det enda som
    // står stilla genom hela flödet.
    await valjIAxel(page, familjValjare, 'Fjärrskådning');
    await expect(stegValjare(page)).not.toBeVisible();

    // Och vägen TILLBAKA till nolläget finns — det var omöjligt före
    // TASK-338.3, då familjen var obligatorisk och alltså aldrig ångrades.
    await valjIAxel(page, familjValjare, 'Alla familjer');
    await expect(familjValjare(page)).toContainText('Alla familjer');
  });

  test('AC #1: sammanfattningsraden speglar valet LIVE i kortets fyra former', async ({
    page,
    network,
  }) => {
    // PRD TASK-338 berättelse 6: *"se i klartext vad mitt räckviddsval
    // betyder innan jag sparar"*. Raden är `aria-live="polite"`, så den
    // annonseras för skärmläsare utan att flytta fokus.
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const dialog = page.getByRole('dialog');
    const sammanfattning = dialog.locator('[aria-live="polite"]');

    await valjRackvidd(page, DELAT_RADIO);

    // FORM 1 — inga axlar satta.
    await expect(sammanfattning).toHaveText('Gäller: alla event');

    // FORM 2 — bara plats (parkeringsbilagan, PRD:ns drivande fall).
    await valjIAxel(page, platsValjare, 'Rönninge');
    await expect(sammanfattning).toHaveText('Gäller: alla event i Rönninge');

    // FORM 3 — familj + plats (sushimenyn, berättelse 4).
    await valjIAxel(page, familjValjare, 'RIM');
    await expect(sammanfattning).toHaveText('Gäller: RIM-event i Rönninge');

    // FORM 4 — alla tre axlarna. Steget visas som "Steg 1", ALDRIG "Nivå 1"
    // (ORDLISTA.md § Steg) — basvärdet 'Nivå 1' är det som skickas.
    await valjIAxel(page, stegValjare, 'Steg 1');
    await expect(sammanfattning).toHaveText('Gäller: RIM-event, Steg 1, i Rönninge');

    // Och tillbaka: att nolla plats-axeln smalnar meningen igen, live.
    await valjIAxel(page, platsValjare, 'Alla platser');
    await expect(sammanfattning).toHaveText('Gäller: RIM-event, Steg 1');
  });

  test('platslistan fallerar: felet SYNS, Plats-axeln stängs av, och sammanfattningen ljuger inte', async ({
    page,
    network,
  }) => {
    // ═══ FRÅNVARON AV BESKED ÄR FARLIGARE ÄN BESKEDET ═══
    //
    // `usePlacesList` som fallerar ger `data === undefined` → tom lista →
    // visuellt oskiljbar från "basen har inga platser". Lotta hade kunnat
    // ladda upp en bilaga hon TROR blir platsbunden, medan den blir
    // `Gemensam` utan axlar = ALLA event (PRD TASK-338 berättelse 3).
    network.use(bilagorHandler());
    network.use(http.get(EF('get-places'), () => new Response(null, { status: 500 })));

    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);
    const dialog = page.getByRole('dialog');
    await valjRackvidd(page, DELAT_RADIO);

    // Notistrappans klass "uppgiftsgenererat fel, knutet till en yta"
    // (DESIGN-SYSTEM-SPEC.md § 21, ADR-121 beslut 4): inline MessageBox,
    // intill det som gick fel.
    await expect(dialog.getByText('Platserna kunde inte hämtas')).toBeVisible();

    // Plats-axeln är AVSTÄNGD i stället för tomt lockande.
    await expect(platsValjare(page)).toBeDisabled();

    // Den DELADE vägen stängs INTE av — en axellös gemensam bilaga ("alla
    // event") är ett fullt legitimt val som inte behöver platslistan, och i
    // räckviddsläget hade ett avstängt "Delat dokument" (där "Bara detta
    // event" redan är avstängd) lämnat dialogen utan något giltigt val alls.
    await expect(dialog.getByRole('radio', { name: DELAT_RADIO })).toBeEnabled();
    await expect(dialog.getByRole('button', { name: 'Ladda upp' })).toBeEnabled();

    // Och sammanfattningen säger fortfarande SANNINGEN om vad som skickas,
    // så ingen kan tro att en plats är vald.
    await expect(dialog.locator('[aria-live="polite"]')).toHaveText('Gäller: alla event');

    // De två axlar som INTE beror på platslistan fungerar oförändrat.
    await valjIAxel(page, familjValjare, 'RIM');
    await expect(dialog.locator('[aria-live="polite"]')).toHaveText('Gäller: RIM-event');
  });

  test('AC #2: räckviddsläget (utan valt event) visar gemensamma dokument, "Bara detta event" avstängd', async ({
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
    await expect(radioGroup.getByRole('radio', { name: EVENT_RADIO })).toBeDisabled();
    await expect(radioGroup.getByRole('radio', { name: DELAT_RADIO })).toBeChecked();
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
    // [TASK-338.3] Badgen KOMPONERAS ur axlarna: familj + plats ger
    // "RIM · Rönninge". Formen "RIM · Alla steg" (ADR-118-eran, tom axel
    // utskriven) finns inte längre — se `rackviddsText.ts` för varför.
    await expect(gemensamRadEventlage.getByText('RIM · Rönninge')).toBeVisible();
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

  // ═══ "ERSÄTT" FÅR ALDRIG TAPPA EN AXEL (runda 2, WARNING) ═══
  //
  // `useReplaceAttachment` laddar upp den NYA filen med DEN GAMLA radens
  // räckvidd och raderar sedan den gamla posten. Tappas `plats` på vägen blir
  // den nya raden `Gemensam` med noll axlar — vilket per ADR-125 § 1 betyder
  // ALLA EVENT. Lotta hade alltså bytt en fil och oavsiktligt lagt
  // Rönninge-parkeringsbilagan på varje Falköping- och Gotland-event (PRD
  // TASK-338 berättelse 3). En tyst UPPVIDGNING syns inte i UI:t och fångas
  // inte av något annat test — därför dessa två.

  test('Ersätt i räckviddsläget bär den ersatta radens ALLA axlar vidare (plats inkluderad)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());

    let skickadKropp: Record<string, unknown> | null = null;
    let skickadeNycklar: string[] = [];
    let raderadId: string | null = null;
    network.use(
      http.post(EF('upload-attachment'), async ({ request }) => {
        skickadKropp = (await request.json()) as Record<string, unknown>;
        skickadeNycklar = Object.keys(skickadKropp);
        return json({ attachment: { ...BILAGA_GEMENSAM, id: 'recBilagaErsatt0001' } });
      }),
      http.post(EF('delete-attachment'), async ({ request }) => {
        const kropp = (await request.json()) as { attachmentId?: string };
        raderadId = kropp.attachmentId ?? null;
        return json({ deleted: true });
      }),
    );

    // RÄCKVIDDSLÄGET är enda platsen en gemensam bilaga FÅR ersättas
    // (ADR-118 beslut 3, oförändrat) — därför prövas fallet här.
    await gotoRackviddslage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(rad.getByRole('button', { name: 'Ersätt' })).toBeVisible();

    // "Ersätt" är en egen `FileTrigger` per rad — inputen SCOPAS till raden,
    // annars träffar `setInputFiles` vilken som helst av ytans filväljare.
    await rad.locator('input[type="file"]').setInputFiles({
      name: 'Parkering-v2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 ersatt-fixtur'),
    });

    await expect.poll(() => raderadId).toBe(BILAGA_GEMENSAM.id);

    // HELA räckvidden följer med — inte bara `rackvidd`.
    expect(skickadKropp).toMatchObject({
      rackvidd: 'Gemensam',
      kursfamilj: 'RIM',
      plats: 'recPlatsRonninge01',
    });
    // Plats-axeln bär den ERSATTA radens rec-ID, aldrig platsnamnet.
    const kropp: Record<string, unknown> = { ...(skickadKropp ?? {}) };
    expect(kropp.plats).toBe(BILAGA_GEMENSAM.plats.id);
    // Tom axel förblir UTELÄMNAD (raden har ingen kursnivå).
    expect(skickadeNycklar).not.toContain('kursniva');
  });

  test('Ersätt på en EVENT-EGEN rad skickar INGEN plats-axel (negativ kontroll)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());

    let skickadKropp: Record<string, unknown> | null = null;
    let skickadeNycklar: string[] = [];
    let raderadId: string | null = null;
    network.use(
      http.post(EF('upload-attachment'), async ({ request }) => {
        skickadKropp = (await request.json()) as Record<string, unknown>;
        skickadeNycklar = Object.keys(skickadKropp);
        return json({ attachment: { ...BILAGA_EGEN, id: 'recBilagaErsatt0002' } });
      }),
      http.post(EF('delete-attachment'), async ({ request }) => {
        const kropp = (await request.json()) as { attachmentId?: string };
        raderadId = kropp.attachmentId ?? null;
        return json({ deleted: true });
      }),
    );

    // Eventläget: den EGNA raden bär Ersätt (den gemensamma gör det inte,
    // AC #4 ovan).
    await gotoEventlage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_EGEN.namn });
    await rad.locator('input[type="file"]').setInputFiles({
      name: 'Program-v2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 ersatt-fixtur'),
    });

    await expect.poll(() => raderadId).toBe(BILAGA_EGEN.id);

    expect(skickadKropp).toMatchObject({ rackvidd: 'Event' });
    // Axlarna får INTE läcka in på en event-egen rad — EF:ens write-schema
    // avvisar dem uttryckligen för räckvidd Event, så en läcka blir en 400
    // i drift, inte ett testfel.
    expect(skickadeNycklar).not.toContain('plats');
    expect(skickadeNycklar).not.toContain('kursfamilj');
    expect(skickadeNycklar).not.toContain('kursniva');
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
    // NYCKLARNA fångas HÄR, inte läses ur `skickadKropp` efteråt: TS:s
    // flödesanalys ser bara initialiseringen `= null` (tilldelningen sker i
    // en MSW-callback den inte kan följa) och smalnar varje senare uppslag
    // till `never`. Att fånga listan i callbacken är dessutom en STARKARE
    // prövning än `?.x === undefined` — den skiljer "nyckeln saknas" från
    // "nyckeln finns med värdet undefined", och det är utelämnandet som är
    // kontraktet mot EF:ens `buildScopeFields`.
    let skickadeNycklar: string[] = [];
    network.use(
      http.post(EF('upload-attachment'), async ({ request }) => {
        skickadKropp = (await request.json()) as Record<string, unknown>;
        skickadeNycklar = Object.keys(skickadKropp);
        return json({
          attachment: {
            ...BILAGA_GEMENSAM,
            id: 'recBilagaNy00000001',
            namn: 'Testfil.pdf',
            rackvidd: 'Gemensam',
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

    await valjRackvidd(page, DELAT_RADIO);

    // Plats-axeln sätts — det är HELA skivans skäl att finnas (PRD TASK-338:
    // parkeringsbilagan laddas upp EN gång och binds till Rönninge).
    await valjIAxel(page, platsValjare, 'Rönninge');
    await dialog.getByRole('button', { name: 'Ladda upp' }).click();

    // Dialogen stänger av sig själv när uppladdningen lyckats — Lotta ska
    // inte behöva stänga en dialog vars jobb är gjort.
    await expect(dialog).toHaveCount(0);

    // KROPPEN, INTE BARA ATT NÅGOT SKICKADES. `plats` är ett RECORD-ID
    // (`_shared/attachments.ts` § AttachmentScopeInputSchema kräver `rec…`),
    // aldrig platsnamnet — en namn-skrivning hade drivit isär från EF:ens
    // ID-baserade matchning och tyst slutat träffa eventen.
    expect(skickadKropp).toMatchObject({
      rackvidd: 'Gemensam',
      plats: 'recPlatsRonninge01',
    });
    // Osatta axlar UTELÄMNAS — aldrig tom sträng. EF:ens `buildScopeFields`
    // utelämnar i sin tur fältet i basen, så "ingen axel" betyder samma sak
    // hela vägen ner; en tomsträng hade skrivits som ett värde.
    expect(skickadeNycklar).toContain('plats');
    expect(skickadeNycklar).not.toContain('kursfamilj');
    expect(skickadeNycklar).not.toContain('kursniva');
  });

  test('flödet ände-till-ände: "Bara detta event" skickar Event UTAN axlar', async ({
    page,
    network,
  }) => {
    // Negativ kontroll mot testet ovan: axlarna får inte läcka med när Lotta
    // väljer den event-egna räckvidden. EF:ens write-schema avvisar
    // uttryckligen "Kursfamilj, Kursnivå och Plats" för räckvidd Event, så en
    // läcka hade blivit en 400 i drift — inte ett testfel.
    network.use(bilagorHandler());
    let skickadKropp: Record<string, unknown> | null = null;
    let skickadeNycklar: string[] = [];
    network.use(
      http.post(EF('upload-attachment'), async ({ request }) => {
        skickadKropp = (await request.json()) as Record<string, unknown>;
        skickadeNycklar = Object.keys(skickadKropp);
        return json({ attachment: { ...BILAGA_EGEN, id: 'recBilagaNy00000002' } });
      }),
    );

    await gotoEventlage(page);
    await oppnaRackviddsdialog(page, 'Eventfil.pdf');
    const dialog = page.getByRole('dialog');

    // Gå via "Delat dokument", sätt en axel, och gå TILLBAKA — så testet
    // bevisar att bytet NOLLAR axlarna, inte bara att de aldrig sattes.
    await valjRackvidd(page, DELAT_RADIO);
    await valjIAxel(page, platsValjare, 'Rönninge');
    await valjRackvidd(page, EVENT_RADIO);

    await dialog.getByRole('button', { name: 'Ladda upp' }).click();
    await expect(dialog).toHaveCount(0);

    expect(skickadKropp).toMatchObject({ rackvidd: 'Event' });
    // Se nyckel-fångsten i testet ovan för varför detta mäts på nycklarna.
    // HÄR är det extra viktigt: plats-axeln SATTES och nollades sedan, så
    // ett kvarhängande `plats: undefined` hade varit en verklig defekt som
    // ett `?.plats === undefined`-test inte kunnat se.
    expect(skickadeNycklar).not.toContain('plats');
    expect(skickadeNycklar).not.toContain('kursfamilj');
    expect(skickadeNycklar).not.toContain('kursniva');
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

    const pill = page.getByText('RIM · Rönninge');
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
 *
 * ═══ [UTVIDGAT, TASK-338.3] SAMMA LÅS, MER ATT LÅSA ═══
 *
 * Räckvidden bär nu TRE valfria axlar i stället för en obligatorisk familj,
 * plus en sammanfattningsrad vars TEXT byter längd vid varje val. Kravet är
 * oförändrat och prövningen densamma — men den reserverade ytan är större
 * (tre selects + sammanfattningsraden), och sammanfattningen har därför en
 * EGEN höjdlåsning (`line-clamp-2` + `min-h-12`) så att en tvåradig mening
 * inte kan göra dialogen högre än en enradig. Valideringsmeddelandet som
 * lägena nedan tidigare mätte är RIVET: noll axlar är giltigt sedan
 * ADR-125 § 1, så det finns inget att validera mot.
 *
 * De fem lägena är omdefinierade mot den nya kontrollytan, men täcker samma
 * sak: default, delat-utan-axlar, delat-med-mest-innehåll, tillbaka till
 * event-läget, och pågående uppladdning.
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

    // LÄGE 1: "Bara detta event" — dialogens defaultläge i eventkontext.
    // Hela axel-blocket är reserverat men `invisible`/`inert`.
    const dettaEvent = await matt();

    // LÄGE 2: "Delat dokument", inga axlar satta — Familj- och Plats-
    // selecten syns, Steg-selecten är fortfarande dold, sammanfattningen
    // står på sin kortaste form ("Gäller: alla event").
    await valjRackvidd(page, DELAT_RADIO);
    await expect(familjValjare(page)).toBeVisible();
    const enFamilj = await matt();

    // LÄGE 3: MEST INNEHÅLL — nivåbärande familj (RIM, så Steg-selecten
    // blir synlig), plats vald, och sammanfattningen på sin LÄNGSTA form
    // ("Gäller: RIM-event, Steg 1, i Rönninge"). Detta är den hårdaste
    // prövningen av reservationen: tre synliga selects OCH den text som
    // först av alla skulle radbryta till två rader.
    await valjIAxel(page, familjValjare, 'RIM');
    await expect(stegValjare(page)).toBeVisible();
    await valjIAxel(page, stegValjare, 'Steg 1');
    await valjIAxel(page, platsValjare, 'Rönninge');
    await expect(dialog.locator('[aria-live="polite"]')).toHaveText(
      'Gäller: RIM-event, Steg 1, i Rönninge',
    );
    const familjVald = await matt();

    // LÄGE 4: tillbaka till "Bara detta event" — samma tomma yta som läge 1,
    // men via en annan väg (byte FRÅN delat med alla tre axlarna satta, inte
    // bara aldrig dit).
    await valjRackvidd(page, EVENT_RADIO);
    const allaEvent = await matt();

    // LÄGE 5: under pågående uppladdning. Mutationen hålls pending med
    // håll-bar-mocken — deterministiskt, ingen gissad väntetid.
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

  test('AC #2: de dolda axel-kontrollerna är INTE i tabordningen (event-läget)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    const dialog = page.getByRole('dialog');
    const dettaEvent = dialog.getByRole('radio', { name: EVENT_RADIO });
    await expect(dettaEvent).toBeChecked();

    // Axel-blocket är monterat men `inert` i event-läget. Tab FRÅN den
    // markerade radioknappen (RadioGroups roving tabindex ger EN tabbstation
    // för hela gruppen) ska hoppa RAKT till "Avbryt" — hade blocket varit
    // fokuserbart hade Tab i stället landat i Familj-selecten.
    await dettaEvent.focus();
    await expect(dettaEvent).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Avbryt' })).toBeFocused();

    // Samma prövning EFTER en tur genom det delade läget — en annan väg dit,
    // samma dolda block. (I ADR-118-eran var detta "Alla event"-radion; med
    // två val är återgången till event-läget den andra vägen.)
    await valjRackvidd(page, DELAT_RADIO);
    await expect(familjValjare(page)).toBeVisible();
    await valjRackvidd(page, EVENT_RADIO);
    await dettaEvent.focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByRole('button', { name: 'Avbryt' })).toBeFocused();

    // `.focus()` (JS-anrop, inte tangentbord) ska INTE heller kunna flytta
    // fokus in i en `inert` kontroll — spec-beteendet `inert` bygger på.
    // Prövas på ALLA TRE axlarna: `inert` sitter på blocket, men en framtida
    // ändring som flyttar en select ut ur det ska fälla här.
    for (const valjare of [familjValjare, stegValjare, platsValjare]) {
      await valjare(page).evaluate((el: HTMLElement) => el.focus());
      await expect(valjare(page)).not.toBeFocused();
    }
  });

  test('AC #2: "Familj vald" (RIM) — alla tre selecten synliga/fokuserbara, axe-rent', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);

    await valjRackvidd(page, DELAT_RADIO);
    await valjIAxel(page, familjValjare, 'RIM');

    await expect(familjValjare(page)).toBeVisible();
    await expect(stegValjare(page)).toBeVisible();
    await expect(platsValjare(page)).toBeVisible();

    // VALIDERINGSMEDDELANDET ÄR RIVET, inte dolt (TASK-338.3): noll axlar är
    // giltigt sedan ADR-125 § 1, så det finns inget krav att påminna om.
    // `toHaveCount(0)` — inte `not.toBeVisible()` — är rätt prövning för
    // "finns inte längre i DOM", till skillnad mot de reserverade
    // kontrollerna ovan som FINNS men är dolda.
    await expect(page.getByText('Välj en familj för att gå vidare.')).toHaveCount(0);

    // Och "Ladda upp" är följaktligen ALDRIG avstängd av räckviddsskäl.
    await expect(page.getByRole('dialog').getByRole('button', { name: 'Ladda upp' })).toBeEnabled();

    // Varje axel nås med tangentbord (AC #2s explicita krav) — de tre
    // selectarna är de riktiga kontrollerna i tabbordningen nu.
    for (const valjare of [familjValjare, stegValjare, platsValjare]) {
      await valjare(page).focus();
      await expect(valjare(page)).toBeFocused();
    }

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

/**
 * [TASK-309.40] Typfiltret (`?typ=`) ÖVERLEVDE tidigare ett räckviddsbyte —
 * diagnos i TASK-309.39 (Marcus prod-röktest 2026-08-29): Lotta bytte från
 * Delade dokument till ett event och fick ett "Bilagor"-filter kvar från
 * förra sammanhanget, utan att räckviddsläget (som saknar en filterrad) gav
 * någon ledtråd om varför listan var smalare. Produktbeslutet (review-agenten
 * klassade frågan `ask-user`; orkestreraren avgjorde på Marcus mandat,
 * TASK-309.40 kortets Description): filtret nollställs till 'alla' vid VARJE
 * byte av räckvidd, i BÅDA riktningarna — men INTE vid navigering IN i vyn
 * (en direktlänk med `?typ=bilaga`, TASK-340.2s "Till dokumenten", ska
 * fortsätta fungera oförändrat).
 *
 * Fixen (`DokumentYta.tsx`s `handleRackviddsByte`) sitter i räckviddsväxlingens
 * EN handler — den enda vägen in i ett räckviddsbyte är `EventValjare`s
 * `onByte`/`gemensamtAlternativ.onValj` (se `EventValjare.tsx`s
 * `onSelectionChange`), så testerna nedan täcker samma tre vägar: delade →
 * event, event → delade, event → annat event — plus regressionsvakten att
 * en sidladdning i `?typ=` fortfarande fungerar (den passerar aldrig
 * handlern).
 *
 * "räckvidds-axeln"-testerna ovan (samma fil) övar redan delade↔event-
 * NAVIGERINGEN utan `?typ=` inblandat — dessa fyra är dedikerade åt
 * NOLLSTÄLLNINGEN.
 */
test.describe('TASK-309.40 — typfiltret nollställs vid byte av räckvidd', () => {
  test('delade → event nollställer ?typ (URL saknar nyckeln, listan visar "alla")', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    // Räckviddsläget har ingen filterrad — `?typ=bilaga` sitter kvar i
    // URL:en osynligt, precis det TASK-309.39 diagnosen beskriver.
    await page.goto('/mer/dokument?typ=bilaga');
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();
    await expect(page).toHaveURL(/typ=bilaga/);

    await page.getByTestId('event-valjare-trigger').click();
    await page
      .getByRole('option', { name: /Skövde/ })
      .first()
      .click();

    await expect(page).toHaveURL(new RegExp(`event=${VISUAL_EVENT_ID}`));
    await expect(page).not.toHaveURL(/typ=/);
    // Listan visar 'alla' — mallarna (som 'bilaga'-filtret hade dolt) syns.
    await expect(page.getByText('Bekräftelsebilaga')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Alla', exact: true })).toBeChecked();
  });

  test('event → delade nollställer ?typ (URL saknar nyckeln)', async ({ page, network }) => {
    network.use(bilagorHandler());
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&typ=bilaga`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bilagor' })).toBeChecked();
    // 'bilaga'-filtret döljer mallarna — kvitto på att filtret faktiskt är
    // aktivt innan bytet, inte bara att chippet råkar se markerat ut.
    await expect(page.getByText('Bekräftelsebilaga')).toHaveCount(0);

    await page.getByTestId('event-valjare-trigger').click();
    await page.getByRole('option', { name: 'Delade dokument', exact: true }).click();

    await expect(page).toHaveURL(/\/mer\/dokument$/);
    await expect(page).not.toHaveURL(/typ=/);
  });

  test('event → annat event nollställer ?typ (URL saknar nyckeln)', async ({ page, network }) => {
    network.use(bilagorHandler());
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&typ=bilaga`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bilagor' })).toBeChecked();

    await page.getByTestId('event-valjare-trigger').click();
    // Göteborg (`EVENTS_RESPONSE`s andra event, fixture-data.ts) — det ENDA
    // sättet att öva "event → ANNAT event" i stället för event ↔ delade,
    // som räckvidds-axeln-testerna redan täcker.
    await page
      .getByRole('option', { name: /Göteborg/ })
      .first()
      .click();

    const url = new URL(page.url());
    const nyttEventId = url.searchParams.get('event');
    expect(nyttEventId).not.toBeNull();
    expect(nyttEventId).not.toBe(VISUAL_EVENT_ID);
    expect(url.searchParams.has('typ')).toBe(false);
    // Listan om-monterades i 'alla' — mallarna syns igen.
    await expect(page.getByText('Bekräftelsebilaga')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Alla', exact: true })).toBeChecked();
  });

  test('direktlänk med ?typ=bilaga IN i vyn fortsätter fungera (navigering, inte byte)', async ({
    page,
    network,
  }) => {
    // Regressionsvakt för TASK-340.2s "Till dokumenten": en sidladdning
    // passerar aldrig `handleRackviddsByte` (den körs bara vid ett VAL i
    // `EventValjare`), så filtret ska stå kvar oförändrat.
    network.use(bilagorHandler());
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}&typ=bilaga`);
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    await expect(page.getByRole('radio', { name: 'Bilagor' })).toBeChecked();
    await expect(page.getByText(BILAGA_EGEN.namn)).toBeVisible();
    await expect(page.getByText('Bekräftelsebilaga')).toHaveCount(0);
    await expect(page).toHaveURL(/typ=bilaga/);
  });
});

/**
 * TASK-338.4 — "ÄNDRA RÄCKVIDD" (ADR-125 § Beslut 1, PRD TASK-338 berättelse 8)
 *
 * Lotta laddade upp parkeringsbilagan som "alla event" när den egentligen bara
 * gäller Rönninge. Före denna skiva var enda vägen tillbaka att radera raden
 * och ladda upp filen igen. Nu öppnar hon SAMMA räckviddsdialog, förifylld med
 * radens nuvarande axlar, ändrar och sparar — filen rör sig aldrig.
 *
 * VAD SVITEN PRÖVAR, och varför var och en:
 *   1. Åtgärden finns BARA i räckviddsläget (ADR-118 beslut 3 gäller vidare —
 *      ur ett events kontext är en delad bilaga oredigerbar).
 *   2. Dialogen öppnar FÖRIFYLLD med radens axlar, inte i nolläget. Utan det
 *      vore "ändra" i praktiken "skriv om från början".
 *   3. Alla event → Rönninge: EF-KROPPEN bär `plats`, och badgen byter.
 *   4. Rönninge → alla event: tomma axlar UTELÄMNAS ur kroppen (servern
 *      rensar dem, `buildScopeUpdateFields`) — riktningen som avslöjar en
 *      fältbyggare som råkat återanvända CREATE-formen.
 *   5. "Bara detta event" är AVSTÄNGD — servern svarar 400 på räckvidd Event
 *      här, så ett valbart alternativ vore en fälla.
 *   6. Serverns fel SYNS i dialogen, och dialogen står kvar.
 *   7. Tangentbord + axe.
 *
 * KROPPS-FÅNGSTEN följer samma rigg som "Ersätt"-testerna ovan: en egen
 * MSW-handler som sparar undan `request.json()` och listan av NYCKLAR —
 * nycklarna är hela poängen i fall 4, eftersom en utelämnad nyckel och en
 * `null`-nyckel ser identiska ut för `toMatchObject`.
 */
test.describe('TASK-338.4 — Ändra räckvidd på en delad bilaga', () => {
  /** Radens "Ändra räckvidd"-knapp i räckviddsläget. */
  const andraKnapp = (page: Page) =>
    page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn })
      .getByRole('button', { name: `Ändra räckvidd för ${BILAGA_GEMENSAM.namn}` });

  /**
   * Fångar `update-attachment-scope`-anropets kropp OCH dess nyckel-lista.
   * Svarar med den bilaga anroparen bad om, så den optimistiska cachen och
   * serversvaret säger samma sak (annars hade `onSettled`-invalideringen
   * dragit tillbaka badgen och gjort testet flakigt av rätt skäl).
   */
  function fangaScopeAnrop(network: NetworkFixture) {
    const fangst: { kropp: Record<string, unknown> | null; nycklar: string[] } = {
      kropp: null,
      nycklar: [],
    };
    network.use(
      http.post(EF('update-attachment-scope'), async ({ request }) => {
        const kropp = (await request.json()) as Record<string, unknown>;
        fangst.kropp = kropp;
        fangst.nycklar = Object.keys(kropp);
        return json({
          attachment: {
            ...BILAGA_GEMENSAM,
            kursfamilj: (kropp.kursfamilj as string | undefined) ?? null,
            kursniva: (kropp.kursniva as string | undefined) ?? null,
            plats: kropp.plats ? { id: kropp.plats as string, namn: 'Rönninge' } : null,
          },
        });
      }),
    );
    return fangst;
  }

  test('åtgärden finns BARA i räckviddsläget — aldrig i eventläget (ADR-118 beslut 3)', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());

    // EVENTLÄGET: samma bilaga, samma id — ingen "Ändra räckvidd".
    await gotoEventlage(page);
    const radIEventlage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(radIEventlage).toBeVisible();
    await expect(radIEventlage.getByRole('button', { name: /Ändra räckvidd/ })).toHaveCount(0);

    // RÄCKVIDDSLÄGET: här FINNS den.
    await gotoRackviddslage(page);
    await expect(andraKnapp(page)).toBeVisible();
  });

  test('dialogen öppnar FÖRIFYLLD med radens axlar, inte i nolläget', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    await andraKnapp(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Radens namn står i dialogen — svaret gäller något konkret.
    await expect(dialog.getByText(BILAGA_GEMENSAM.namn)).toBeVisible();

    // FÖRIFYLLNINGEN: raden bär RIM + Rönninge, ingen nivå. Triggerns TEXT är
    // beviset — ett nolläge hade sagt "Alla familjer"/"Alla platser".
    await expect(familjValjare(page)).toContainText('RIM');
    await expect(platsValjare(page)).toContainText('Rönninge');
    await expect(stegValjare(page)).toContainText('Alla steg');

    // Sammanfattningen speglar samma sak i klartext (PRD berättelse 6).
    await expect(dialog.getByText('Gäller: RIM-event i Rönninge')).toBeVisible();
  });

  test('"Bara detta event" är AVSTÄNGD i ändra-läget — en delad bilaga kan inte göras event-egen', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    await andraKnapp(page).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('radio', { name: EVENT_RADIO })).toBeDisabled();
    await expect(dialog.getByRole('radio', { name: DELAT_RADIO })).toBeChecked();
    // Knappen säger "Spara", inte "Ladda upp" — ingen fil rör sig här.
    await expect(dialog.getByRole('button', { name: 'Spara' })).toBeVisible();
  });

  test('Alla event → Rönninge: kroppen bär plats-ID, och badgen byter', async ({
    page,
    network,
  }) => {
    // En AXELLÖS gemensam bilaga ("Alla event") är utgångsläget PRD:n
    // beskriver: de två dokument Marcus laddade upp 2026-08-29.
    const AXELLOS = {
      ...BILAGA_GEMENSAM,
      id: 'recBilagaAxellos01',
      namn: 'Parkering.pdf',
      kursfamilj: null,
      kursniva: null,
      plats: null,
    };
    network.use(http.get(EF('get-event-attachments'), () => json({ attachments: [AXELLOS] })));
    const fangst = fangaScopeAnrop(network);

    await page.goto('/mer/dokument');
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    const rad = page.getByTestId('dokument-fil').filter({ hasText: AXELLOS.namn });
    await expect(rad).toBeVisible();
    // BADGEN FÖRE: axellös = "Alla event".
    await expect(rad.getByText('Alla event')).toBeVisible();

    await rad.getByRole('button', { name: `Ändra räckvidd för ${AXELLOS.namn}` }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await valjIAxel(page, platsValjare, 'Rönninge');
    await expect(page.getByRole('dialog').getByText('Gäller: alla event i Rönninge')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    // EF-KROPPEN — plats som RECORD-ID, aldrig ett namn.
    await expect.poll(() => fangst.kropp).not.toBeNull();
    expect(fangst.kropp).toMatchObject({ rackvidd: 'Gemensam', plats: 'recPlatsRonninge01' });
    // Tomma axlar UTELÄMNAS ur kroppen (servern rensar dem server-side).
    expect(fangst.nycklar).not.toContain('kursfamilj');
    expect(fangst.nycklar).not.toContain('kursniva');

    // Dialogen stänger vid framgång, och badgen bär den nya räckvidden.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(rad.getByText('Rönninge')).toBeVisible();
  });

  test('Rönninge → alla event: tomma axlar UTELÄMNAS, badgen breddas', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    const fangst = fangaScopeAnrop(network);

    await gotoRackviddslage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });
    // BADGEN FÖRE: den kombinerade formen.
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();

    await andraKnapp(page).click();
    // Tillbaka till nolläget på BÅDA axlarna — riktningen som avslöjar en
    // fältbyggare som utelämnar i stället för att rensa.
    await valjIAxel(page, familjValjare, 'Alla familjer');
    await valjIAxel(page, platsValjare, 'Alla platser');
    await expect(page.getByRole('dialog').getByText('Gäller: alla event')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    await expect.poll(() => fangst.kropp).not.toBeNull();
    expect(fangst.kropp).toMatchObject({ rackvidd: 'Gemensam' });
    // KÄRNAN: INGEN av de tre axlarna får följa med. Att pröva NYCKLARNA och
    // inte värdena är avsiktligt — `{ plats: undefined }` och en utelämnad
    // nyckel ser identiska ut för `toMatchObject`.
    expect(fangst.nycklar).not.toContain('kursfamilj');
    expect(fangst.nycklar).not.toContain('kursniva');
    expect(fangst.nycklar).not.toContain('plats');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(rad.getByText('Alla event')).toBeVisible();
  });

  test('serverns fel SYNS i dialogen, dialogen står kvar, och badgen ROLLBACKAS', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    // Serverns dokumentklass-vakt (403). Notera att UI:t renderar husets
    // `EdgeFunctionError`-form runt skälet (`Edge Function "…" 403: <skäl>`,
    // se DokumentYta.tsx § VAD FELRUTAN FAKTISKT VISAR) — testet ankrar
    // därför på RUBRIKEN, som är den del Lotta faktiskt kan läsa.
    network.use(
      http.post(EF('update-attachment-scope'), () =>
        json(
          {
            error:
              'Bara uppladdade dokument kan byta räckvidd. Mall-genererade bilagor följer sitt event.',
          },
          403,
        ),
      ),
    );

    await gotoRackviddslage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });
    // BADGEN FÖRE: radens verkliga räckvidd.
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();

    await andraKnapp(page).click();
    // Nollställ BÅDA axlarna, så den optimistiska badgen hinner bli "Alla
    // event" innan servern nekar — utan en synlig optimistisk ändring hade
    // rollbacken varit oskiljbar från att ingenting hände.
    await valjIAxel(page, familjValjare, 'Alla familjer');
    await valjIAxel(page, platsValjare, 'Alla platser');
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Räckvidden kunde inte ändras')).toBeVisible();
    // DIALOGEN STÅR KVAR — felet bor intill valet som orsakade det, till
    // skillnad mot uppladdningsfelet som bor på sidan (dialogen rivs där).
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spara' })).toBeEnabled();

    // ═══ ROLLBACK-ARMEN (useUpdateAttachmentScope § onError) ═══
    // Utan detta är `queryClient.setQueryData(key, context.previous)` en
    // oprövad gren: den optimistiska skrivningen hade lämnat badgen på "Alla
    // event" medan basen fortfarande säger "RIM · Rönninge", alltså en yta
    // som ljuger om vad som gäller — precis den skada PRD TASK-338
    // berättelse 3 finns för att förhindra.
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();
    await expect(rad.getByText('Alla event')).toHaveCount(0);
  });

  test('tangentbord: fokus flyttas IN i dialogen och ÅTERLÄMNAS efter Escape', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    await andraKnapp(page).focus();
    await expect(andraKnapp(page)).toBeFocused();
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // ═══ FOKUS ÄR FAKTISKT INNE I DIALOGEN ═══
    // Mätt, inte antaget: `document.activeElement` måste vara en ÄTTLING till
    // dialogen. En tidigare version av detta test assertade `toContainText`,
    // vilket bara bevisade att namnet RENDERADES — det hade varit grönt även
    // med fokus kvar bakom overlayen, alltså precis den skada assertionen
    // påstod sig skydda mot.
    await expect
      .poll(() =>
        dialog.evaluate((el) => el.contains(document.activeElement)),
      )
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // ═══ ÅTERLÄMNINGEN ═══
    // Dialogen monteras VILLKORLIGT (`andrasRackvidd != null`), så
    // react-arias fokus-restore måste överleva en unmount av hela trädet.
    // Landar fokus på <body> i stället står tangentbordsanvändaren utan
    // position i listan och får börja om från sidans topp.
    await expect(andraKnapp(page)).toBeFocused();
  });

  test('tangentbord: fokus återlämnas till knappen även efter LYCKAD Spara', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    fangaScopeAnrop(network);

    await gotoRackviddslage(page);
    await andraKnapp(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();

    await valjIAxel(page, platsValjare, 'Alla platser');
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // SVÅRARE FALL ÄN ESCAPE, och därför ett eget test: knappen är
    // `isDisabled` medan `scopeMutation.isPending` — en disabled knapp kan
    // inte ta fokus. Stängningen sker dessutom i mutationens `onSuccess`,
    // alltså i samma vända som `isPending` faller tillbaka. Att fokus ändå
    // landar rätt är inget man kan läsa sig till ur koden; det måste mätas.
    await expect(andraKnapp(page)).toBeFocused();
  });

  test('ändra-dialogen är axe-ren', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    await andraKnapp(page).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
