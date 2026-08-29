import AxeBuilder from '@axe-core/playwright';
import type { NetworkFixture } from '@msw/playwright';
import type { Locator, Page } from '@playwright/test';
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

/**
 * Radens ⋯-meny → posten `etikett`.
 *
 * [T176, 2026-08-29] SELEKTOR-UPPDATERING: radhandlingarna (Ladda ner /
 * Ersätt / Skapa om / Ändra räckvidd / Radera) bodde som ikonknappar direkt i
 * raden med filnamnet i `aria-label` ("Radera <namn>"). De bor nu i en `Meny`
 * bakom EN ⋯-knapp — menyn bär filnamnet i sitt eget namn ("Fler val för
 * <namn>"), posterna bär verbet. WAI-ARIA:s menygrammatik: kontexten namnger
 * listan, posten namnger handlingen (samma form GitHub och Drive använder).
 */
async function oppnaRadmeny(rad: Locator) {
  await rad.getByRole('button', { name: /^Fler val för / }).click();
}

async function valjRadhandling(rad: Locator, page: Page, etikett: string) {
  await oppnaRadmeny(rad);
  await page.getByRole('menuitem', { name: etikett, exact: true }).click();
  // VÄNTA IN STÄNGNINGEN — inte kosmetik. RAC:s `Popover` renderar
  // `role="dialog"` (mätt i renderad yta), och menyns popover lever kvar under
  // sin 150 ms uttoning. En handling som öppnar en MODAL (Ändra räckvidd) ger
  // därför ett fönster där `getByRole('dialog')` matchar TVÅ element och
  // Playwright kastar strict-mode-fel i stället för att vänta.
  await page.waitForFunction(() => document.querySelectorAll('[role="menu"]').length === 0);
}

/** Menyposternas etiketter för en rad — den nya formen av "vilka handlingar
    finns på raden?". Stänger menyn efteråt (och väntar in uttoningen) så
    nästa rad kan öppna sin utan strict-mode-krock. */
async function radensHandlingar(rad: Locator, page: Page): Promise<string[]> {
  await oppnaRadmeny(rad);
  const poster = await page.getByRole('menuitem').allInnerTexts();
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.querySelectorAll('[role="menu"]').length === 0);
  return poster.map((t) => t.trim());
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

const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/**
 * Tom cache-arrangemang (ADR-072) — persist-nyckeln bort FÖRE app-boot.
 *
 * SAMMA form och skäl som `dokument-lista-hojdlas-tidpunkt`- och
 * `dokument-lista-hojdlas`-filernas `arrangeraTomCache` (TASK-309.41), och
 * samma etablerade mönster som `hem-laddlage.acceptance.test.ts` redan bär:
 * test-ARRANGEMANG före start, INTE runtime-tömning (den vägen är
 * `queryClient.clear()`, ADR-072 skyddsräcke 1).
 *
 * Behövs av testet som laddar EVENTLÄGET två gånger med olika fixturdata.
 * Båda laddningarna delar `queryKeys.attachments.byEvent(VISUAL_EVENT_ID)`,
 * och till skillnad från TASK-28:s fall kan de två scenarierna inte ges
 * skilda id: hela poängen är att SAMMA event visar olika många bilagor.
 * Hinner localStorage-synken fyra mellan laddningarna (throttlad 1 s,
 * `src/queries/persist.ts`) restaureras scenario 1:s enda bilaga, och den
 * globala `staleTime` på 5 min (`src/router.ts`) gör den FÄRSK — ingen
 * bakgrundshämtning alls. Mätt före fixen: 8 av 10 fällda med
 * `--repeat-each=10` (2026-08-29), alltid på `Bilaga 1.pdf`.
 *
 * ÖVERSKUGGNINGS-VAKTEN SÅG SAMMA SAK FRÅN HANDLER-SIDAN: den andra
 * `network.use()`-registreringen rapporterades "använd av 0", eftersom den
 * andra laddningen aldrig gjorde något EF-anrop att matcha. Ett dött-
 * registrerings-fynd i ett flerladdningstest är därför värt att läsa som
 * möjligt persist-symptom innan handlern misstänks.
 *
 * Testet på rad ~209 gör också två navigeringar men behåller SAMMA
 * fixturdata över båda, och är därför strukturellt oberört av mekanismen.
 */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
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
const DELAT_RADIO = 'Delad bilaga - gäller flera event';

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
    // Och den är en RIKTIG alert i tillgänglighetsträdet, inte bara synlig
    // text — se det egna testet nedan för varför tidpunkten är hela poängen.
    await expect(dialog.getByRole('alert')).toBeVisible();

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

  test('platslistans fel MONTERAS först när det delade läget aktiveras — annars annonseras alerten aldrig', async ({
    page,
    network,
  }) => {
    // ═══ REGRESSIONSVAKT FÖR EN TYST A11Y-DEFEKT (runda 3) ═══
    //
    // `MessageBox intent="error"` renderar `role="alert"`. En alert annonseras
    // när noden DYKER UPP i tillgänglighetsträdet — inte när den blir synlig.
    //
    // Villkorad bara på `platserFel` monterades rutan redan vid dialogens
    // öppning, alltså INUTI axelblocket som är `inert` i eventläget (och
    // dialogen initieras till EVENT när ett event är valt). `inert` tar bort
    // hela underträdet ur tillgänglighetsträdet, så alerten fyrade där ingen
    // kunde höra den — och när Lotta sedan växlade till "Delat dokument"
    // fanns noden redan, så det fyrade inget då heller. Felet var SYNLIGT men
    // aldrig ANNONSERAT: tyst för precis den grupp som inte kan se att
    // Plats-selecten är avstängd.
    //
    // ═══ VARFÖR `locator('[role="alert"]')` OCH INTE `getByRole('alert')` ═══
    //
    // MÄTT, inte resonerat: en första version av detta test använde
    // `getByRole('alert')` för BÅDA halvorna och PASSERADE mot den buggiga
    // koden (mutation: `gemensam &&` borttaget → exit 0). `getByRole` gör
    // ARIA-uppslag och utesluter därför noder som är dolda/`inert` — alltså
    // exakt de noder buggen producerar. Assertionen kunde inte skilja "aldrig
    // monterad" från "monterad men inert", och var en tyst falsk grön.
    //
    // `locator('[role="alert"]')` är ett CSS-attributuppslag och räknar noden
    // oavsett `inert`/synlighet. DEN skiljer de två fallen. Paret nedan mäter
    // därför två OLIKA saker med avsikt: DOM-närvaro (får inte finnas) före
    // växlingen, och tillgänglighetsträdet (ska annonseras) efter.
    network.use(bilagorHandler());
    network.use(http.get(EF('get-places'), () => new Response(null, { status: 500 })));

    await gotoEventlage(page);
    await oppnaRackviddsdialog(page);
    const dialog = page.getByRole('dialog');
    const alertINagonForm = dialog.locator('[role="alert"]');

    // Eventläget: axelblocket är `inert`. Alerten får INTE vara monterad ens
    // i DOM — hade den varit det (osynlig/inert) vore annonseringen förbrukad.
    await expect(dialog.getByRole('radio', { name: EVENT_RADIO })).toBeChecked();
    await expect(alertINagonForm).toHaveCount(0);

    // Växlingen aktiverar blocket OCH monterar alerten i samma ögonblick.
    await valjRackvidd(page, DELAT_RADIO);
    await expect(alertINagonForm).toHaveCount(1);
    // ...och nu ÄR den i tillgänglighetsträdet (`getByRole` gör ARIA-uppslag
    // och hade inte hittat en `inert` nod).
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(dialog.getByRole('alert')).toContainText('Platserna kunde inte hämtas');

    // Och tillbaka: alerten avmonteras igen, så nästa växling till det delade
    // läget annonserar på nytt i stället för att stå kvar som en död nod.
    await valjRackvidd(page, EVENT_RADIO);
    await expect(alertINagonForm).toHaveCount(0);
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
    // [T176] Handlingarna bor i radens ⋯-meny — frånvaron prövas alltså i
    // menyns POSTLISTA i stället för bland radens knappar.
    expect(await radensHandlingar(gemensamRadEventlage, page)).toEqual(['Ladda ner']);

    // SAMMA bilaga (samma id/namn), i räckviddsläget: BÅDA handlingarna finns.
    await gotoRackviddslage(page);
    const gemensamRadRackviddslage = page
      .getByTestId('dokument-fil')
      .filter({ hasText: BILAGA_GEMENSAM.namn });
    expect(await radensHandlingar(gemensamRadRackviddslage, page)).toEqual([
      'Ladda ner',
      'Ersätt',
      'Ändra räckvidd',
      'Radera',
    ]);
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
    expect(await radensHandlingar(rad, page)).toContain('Ersätt');

    // "Ersätt" har en egen dold `<input type="file">` per rad — inputen SCOPAS
    // till raden, annars träffar `setInputFiles` vilken som helst av ytans
    // filväljare. [T176] Inputen renderas numera av raden själv i stället för
    // av en `FileTrigger` (react-arias `FileTrigger` driver sin input via
    // `PressResponder`, som `MenuItem` inte konsumerar — se `oppnaFilvaljare`
    // i `DokumentYta.tsx`). Den ligger kvar PÅ SAMMA plats i DOM, så
    // scopingen nedan är oförändrad.
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
    // [ÄNDRAD, T176 2026-08-29] Räkningen görs om EN gång till, av samma skäl
    // som TASK-309.8 gjorde den: katalogen ändrade storlek. Nu är den ute ur
    // listan helt — mallar och generatorer är HANDLINGAR i kortets
    // handlingsrad (`SkapaDokumentMeny`), inte rader. Listan innehåller bara
    // bilagor, så gränsfallet "precis PÅ fyra, ingen rullning" byggs av FYRA
    // bilagor i stället för "1 bilaga + 2 mallar + 1 generator".
    //
    // ENDA testet i filen som laddar om med ÄNDRAD fixturdata, och därför
    // det enda som behöver arrangemanget — se `arrangeraTomCache` för
    // mekanismen och mätningen (TASK-309.41).
    await arrangeraTomCache(page);

    network.use(
      http.get(EF('get-event-attachments'), () =>
        json({
          attachments: Array.from({ length: 4 }, (_, i) => ({
            ...BILAGA_GEMENSAM,
            id: `recBilagaFyra${String(i).padStart(5, '0')}`,
            namn: i === 0 ? BILAGA_GEMENSAM.namn : `Fyllnad ${i}.pdf`,
          })),
        }),
      ),
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
    await expect(rullande).toHaveAttribute('aria-label', 'Bilagor');
    // ═══ EXAKT FYRA KORT, DET FEMTE HELT UTANFÖR KANTEN ═══
    //
    // Marcus 2026-08-18: *"se till att listan visar exakt 4 dokumentrader,
    // alltså att den fjärde längst ner klipps exakt precis över separatorn."*
    // Höjden MÄTS mot radernas faktiska geometri i stället för mot en
    // hårdkodad siffra — då fäller testet om radhöjden någonsin ändras, i
    // stället för att tyst acceptera en halv rad i underkanten.
    //
    // [TASK-309.24] `listHojd` jämförs mot `ul.clientHeight` (innehålls-
    // höjden), INTE `getBoundingClientRect().height`. Skälet gällde `<ul>`s
    // egen `border` och står kvar som historik; sedan T176 bär `<ul>` ingen
    // kant alls, så de två talen sammanfaller — jämförelsen mot
    // `clientHeight` är ändå den rätta, eftersom det är innehållsytan
    // klippkanten faktiskt går vid.
    //
    // ═══ [T176, 2026-08-29] SEPARATOR-TERMEN ÄR BORTA — MED KVITTENS ═══
    //
    // Fram till kortformen drog detta test bort fjärde radens `border-bottom`
    // ur spannet (TASK-309.39: Tailwind 4:s `divide-y` lägger linjen på raden
    // OVANFÖR mellanrummet, så den låg innanför spannet och reserverade plats
    // åt en linje som inte skulle synas — precis vad Marcus såg i prod
    // 2026-08-29: *"listan ska sluta precis över den nedersta separatorn men
    // det gör den inte just nu, jag ser den nedersta separatorn."*).
    //
    // Separatorerna FINNS INTE LÄNGRE: varje `<li>` är ett kort med ränna
    // omkring sig, `divide-y` är riven och `sistaRadenBarLinje` med den
    // (Marcus kvitterade rivningen av höjdlåsets separator-halva samma dag;
    // fyra-synliga-med-inline-rullning står kvar). Termen som drogs bort är
    // därför konstant 0, och assertionen `fjardeSeparator > 0` — som fanns
    // för att avdraget inte skulle passera av fel skäl — hade blivit en
    // permanent falsk vakt.
    //
    // ERSÄTTAREN PRÖVAR SAMMA SAK DIREKT, INTE SVAGARE: fjärde kortet ska
    // ligga HELT innanför klippkanten och det femte HELT utanför. Ett halvt
    // kort i underkanten är den regression regeln finns för, och den fångas
    // nu utan att gå omvägen via en linje. Rännan bor INUTI `<li>` (`py-1`),
    // så `fjarde.bottom - forsta.top` är fyra hela li-höjder och `listHojd`
    // ska matcha det exakt.
    const geometri = await rullande.evaluate((ul) => {
      const items = Array.from(ul.children) as HTMLElement[];
      const kort = Array.from(ul.querySelectorAll('[data-testid="dokument-fil"]'));
      const ulTop = ul.getBoundingClientRect().top;
      const forsta = items[0].getBoundingClientRect();
      const fjarde = items[3].getBoundingClientRect();
      const fjardeKort = kort[3].getBoundingClientRect();
      const femteKort = kort[4] ? kort[4].getBoundingClientRect() : null;
      return {
        listHojd: ul.clientHeight,
        fyraRader: fjarde.bottom - forsta.top,
        antalKort: kort.length,
        // Innehållsytans nederkant i samma rymd som kortens kanter.
        innehallBottom: Number.parseFloat(getComputedStyle(ul).borderTopWidth) + ul.clientHeight,
        fjardeKortBottom: fjardeKort.bottom - ulTop,
        femteKortTop: femteKort ? femteKort.top - ulTop : null,
        rullar: ul.scrollHeight > ul.clientHeight,
      };
    });
    // Ett FEMTE kort finns i denna fixtur (sex rader) — utan det hade
    // invarianten varit trivialt sann, samma disciplin som den gamla
    // `fjardeSeparator > 0`-kontrollen bar.
    expect(geometri.antalKort).toBe(6);
    expect(geometri.femteKortTop).not.toBeNull();
    expect(geometri.listHojd).toBeCloseTo(geometri.fyraRader, 0);
    expect(geometri.rullar).toBe(true);
    expect(geometri.fjardeKortBottom).toBeLessThanOrEqual(geometri.innehallBottom + 0.5);
    expect(geometri.femteKortTop ?? 0).toBeGreaterThanOrEqual(geometri.innehallBottom - 0.5);

    // ═══ [T176] FILTERVÄXLINGS-BLOCKET ÄR RIVET, INTE TAPPAT ═══
    //
    // Här stod en mätning av Marcus fynd *"nu ser skillnaden genom att växla
    // mellan 'Alla' och 'Bilagor', för då hoppar layouten/listan i höjd."*
    // Typfiltret finns inte längre (`DokumentLista` § docblock: listan visar
    // bara bilagor), så det finns ingen växling att pröva. Regeln den
    // skyddade — att listans bounding box är LÅST och inte följer
    // radantalet — är inte tappad: den prövas i
    // `dokument-lista-hojdlas.acceptance.test.ts` mot fyra/sju rader, som
    // dessutom är en STARKARE prövning (två verkliga innehållsmängder mot
    // samma box, inte två vyer av samma data).
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

  test('räckvidds-axeln: väljaren bär "Delade bilagor" och tar en till förvaltningsläget', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoEventlage(page);

    // Den rivna knappen får inte återuppstå — varken i listan eller ovanför.
    await expect(page.getByRole('button', { name: 'Visa gemensamma dokument' })).toHaveCount(0);

    await page.getByTestId('event-valjare-trigger').click();
    const alternativ = page.getByRole('option', { name: 'Delade bilagor', exact: true });
    await expect(alternativ).toBeVisible();
    await alternativ.click();

    // Valet nollar `?event=` → förvaltningsläget, där eventets EGNA bilaga
    // inte hör hemma och Radera (räckviddslägets ensamrätt) finns.
    await expect(page).toHaveURL(/\/mer\/dokument$/);
    await expect(page.getByText(BILAGA_EGEN.namn)).toHaveCount(0);
    // [T176] Radera bor i radens ⋯-meny.
    expect(
      await radensHandlingar(
        page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn }),
        page,
      ),
    ).toContain('Radera');
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
    await expect(trigger).toContainText('Delade bilagor');
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
 * [T176, 2026-08-29] SVITEN "TASK-309.40 — typfiltret nollställs vid byte av
 * räckvidd" ÄR RIVEN, INTE TAPPAD.
 *
 * Den prövade fyra vägar genom en nollställning av nuqs-nyckeln `?typ` vid
 * räckviddsbyte (delade → event, event → delade, event → annat event, plus
 * regressionsvakten att en direktlänk med `?typ=bilaga` fortfarande
 * fungerade). Typfiltret finns inte längre: dokumentlistan visar BARA bilagor
 * sedan mallarna och generatorerna flyttat upp i kortets handlingsrad
 * (`DokumentLista` § docblock, `SkapaDokumentMeny`), och nyckeln är riven i
 * samma drag — både `handleRackviddsByte`s nollställning och `dokument.tsx`s
 * `setTyp('bilaga')` i "Till bilagorna" (knappen hette "Till dokumenten"
 * fram till T176).
 *
 * DEFEKTEN DEN SKYDDADE MOT KAN INTE UPPSTÅ IGEN: den krävde ett filter som
 * överlevde ett räckviddsbyte osynligt. Att `?typ` inte SÄTTS av "Till
 * dokumenten" prövas i stället i
 * `dokument-generering-bekraftelse.acceptance.test.ts` § AC #2 (vänd
 * assertion: nyckeln ska vara `null`), så en återinförd `setTyp` fälls där.
 *
 * "räckvidds-axeln"-testerna ovan (samma fil) övar fortfarande
 * delade↔event-NAVIGERINGEN.
 */

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
  /** Radens "Ändra räckvidd" i räckviddsläget — [T176] en menypost bakom
      radens ⋯-knapp, inte längre en egen ikonknapp med filnamnet i
      `aria-label`. `oppnaAndraRackvidd` gör de två stegen. */
  const gemensamRad = (page: Page) =>
    page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });

  const oppnaAndraRackvidd = (page: Page) =>
    valjRadhandling(gemensamRad(page), page, 'Ändra räckvidd');

  /** Radens ⋯-knapp — fokus-ANKARET sedan handlingarna flyttade in i menyn.
      Det är hit react-aria ska återlämna fokus när dialogen stänger. */
  const menyTrigger = (page: Page) =>
    gemensamRad(page).getByRole('button', { name: /^Fler val för / });

  /** Ren TANGENTBORDSVÄG in i dialogen: fokusera ⋯, Enter (menyn öppnas med
      första posten fokuserad), pil ner till "Ändra räckvidd", Enter. Prövar
      alltså menyns egen tangentbordsnavigation på köpet. */
  async function oppnaAndraRackviddMedTangentbord(page: Page) {
    await menyTrigger(page).focus();
    await expect(menyTrigger(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Ladda ner' })).toBeFocused();
    await page.keyboard.press('ArrowDown'); // Ersätt
    await page.keyboard.press('ArrowDown'); // Ändra räckvidd
    await expect(page.getByRole('menuitem', { name: 'Ändra räckvidd' })).toBeFocused();
    await page.keyboard.press('Enter');
    // Samma väntan som `valjRadhandling` — se dess kommentar om `role="dialog"`.
    await page.waitForFunction(() => document.querySelectorAll('[role="menu"]').length === 0);
  }

  /**
   * ═══ STATEFUL FIXTURVÄRLD FÖR SKRIVVÄGEN ═══
   *
   * VARFÖR STATEFUL, och inte en handler som svarar samma sak varje gång.
   * MÄTT, inte antaget (CI-körning 33254282367, head 82edb19d): två av
   * testen nedan föll i CI men gick grönt lokalt med `--workers=1`. Orsaken
   * var INTE timing i UI:t utan att listnings-handlern var STATISK: den
   * returnerade oförändrad fixturdata även efter en lyckad skrivning.
   *
   * Kedjan blir då: `onMutate` skriver badgen optimistiskt →
   * `onSettled` invaliderar `attachments.all` → refetchen hämtar den GAMLA
   * raden → badgen går TILLBAKA. Assertionen efter Spara mätte alltså ett
   * ÖVERGÅENDE tillstånd, och utfallet avgjordes av om assertionen hann före
   * refetchen. På en obelastad maskin hann den; under CI:s parallella last
   * gjorde den inte det. Ett rent race, inbyggt i riggen.
   *
   * Fixen är inte att vänta längre eller att polla — det hade bara flyttat
   * racet. Fixen är att fixturen BETER SIG SOM EN SERVER: skrivningen
   * uppdaterar den rad efterföljande listningar serverar. Då är
   * sluttillståndet stabilt och assertionen mäter hela kedjan
   * (skrivning → refetch → badge) i stället för ett ögonblick i den.
   *
   * `slappSvar` finns för de fall som behöver observera det OPTIMISTISKA
   * fönstret: POST-svaret hålls tillbaka tills testet släpper det. En FAST
   * fördröjning hade återinfört samma klass av race under last.
   *
   * ═══ VÄNTA PÅ REFETCHEN, ALDRIG PÅ TID ═══
   * Den stateful fixturen gör de två utfallen IDENTISKA (optimistisk badge
   * och post-refetch-badge säger samma sak), vilket ensamt räcker för att
   * fälla ut racet. Testen väntar ÄNDÅ explicit på att `listningar` ökat
   * efter en skrivning innan badgen assertas. Skälet är mätt: lokalt stod
   * räknaren kvar på 1 genom hela testet, alltså kördes post-refetch-vägen
   * bara i CI — och det var just den vägen som föll där. Med väntan körs
   * BÅDA vägarna på varje maskin, och assertionen mäter det Lotta faktiskt
   * ser en sekund senare i stället för ett ögonblick i mitten.
   */
  function riggaScopeVarld(
    network: NetworkFixture,
    startrad: Record<string, unknown> = { ...BILAGA_GEMENSAM },
    val: { hallTillbakaSvar?: boolean; svarStatus?: number; svarFel?: string } = {},
  ) {
    const rigg = {
      /** Raden som listnings-handlern serverar just nu. */
      aktuell: { ...startrad } as Record<string, unknown>,
      /** Sista skrivningens kropp och dess NYCKLAR (utelämnade axlar syns bara här). */
      kropp: null as Record<string, unknown> | null,
      nycklar: [] as string[],
      /** Antal LISTNINGS-hämtningar. Testen väntar på att denna ökar efter
       *  en skrivning, i stället för på tid — se § VÄNTA PÅ REFETCHEN. */
      listningar: 0,
      /** Anropas för att släppa ett tillbakahållet POST-svar. */
      slappSvar: () => {},
    };

    let vantaPaSlapp: Promise<void> = Promise.resolve();
    if (val.hallTillbakaSvar) {
      vantaPaSlapp = new Promise<void>((resolve) => {
        rigg.slappSvar = resolve;
      });
    }

    network.use(
      http.get(EF('get-event-attachments'), ({ request }) => {
        rigg.listningar += 1;
        // Eventläget ser eventets egna + den gemensamma; räckviddsläget bara
        // den gemensamma — samma grening som `bilagorHandler()`.
        const eventId = new URL(request.url).searchParams.get('eventId');
        if (eventId) return json({ attachments: [BILAGA_EGEN, rigg.aktuell] });
        return json({ attachments: [rigg.aktuell] });
      }),
      http.post(EF('update-attachment-scope'), async ({ request }) => {
        const kropp = (await request.json()) as Record<string, unknown>;
        rigg.kropp = kropp;
        rigg.nycklar = Object.keys(kropp);
        await vantaPaSlapp;

        if (val.svarStatus && val.svarStatus >= 400) {
          // FELVÄG: raden ändras INTE, precis som servern inte skriver något
          // när en vakt fäller. Det är vad som gör rollbacken observerbar som
          // ett stabilt sluttillstånd.
          return json({ error: val.svarFel ?? 'Nekad.' }, val.svarStatus);
        }

        // LYCKAD SKRIVNING: fixturen uppdateras som en riktig server hade
        // gjort — tomma axlar RENSADE, aldrig kvarlämnade (samma semantik som
        // `buildScopeUpdateFields`, se dess docblock).
        rigg.aktuell = {
          ...rigg.aktuell,
          rackvidd: kropp.rackvidd ?? 'Gemensam',
          kursfamilj: (kropp.kursfamilj as string | undefined) ?? null,
          kursniva: (kropp.kursniva as string | undefined) ?? null,
          plats: kropp.plats ? { id: kropp.plats as string, namn: 'Rönninge' } : null,
        };
        return json({ attachment: rigg.aktuell });
      }),
    );

    return rigg;
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
    // [T176] Handlingen bor i radens ⋯-meny — frånvaron prövas i postlistan.
    expect(await radensHandlingar(radIEventlage, page)).not.toContain('Ändra räckvidd');

    // RÄCKVIDDSLÄGET: här FINNS den.
    await gotoRackviddslage(page);
    expect(await radensHandlingar(gemensamRad(page), page)).toContain('Ändra räckvidd');
  });

  test('dialogen öppnar FÖRIFYLLD med radens axlar, inte i nolläget', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    await oppnaAndraRackvidd(page);

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
    await oppnaAndraRackvidd(page);

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
    // STATEFUL rigg — skrivningen uppdaterar den rad listningen serverar, så
    // badge-assertionen nedan mäter ett STABILT sluttillstånd i stället för
    // att kapplöpa med `onSettled`-refetchen (se riggaScopeVarld § VARFÖR
    // STATEFUL för CI-fallet som avslöjade racet).
    const rigg = riggaScopeVarld(network, AXELLOS);

    await page.goto('/mer/dokument');
    await expect(page.getByTestId('dokument-yta')).toBeVisible();
    const rad = page.getByTestId('dokument-fil').filter({ hasText: AXELLOS.namn });
    await expect(rad).toBeVisible();
    // BADGEN FÖRE: axellös = "Alla event".
    await expect(rad.getByText('Alla event')).toBeVisible();

    await valjRadhandling(rad, page, 'Ändra räckvidd');
    await expect(page.getByRole('dialog')).toBeVisible();
    await valjIAxel(page, platsValjare, 'Rönninge');
    await expect(page.getByRole('dialog').getByText('Gäller: alla event i Rönninge')).toBeVisible();
    const listningarFore = rigg.listningar;
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    // VÄNTA PÅ REFETCHEN, inte på tid (se riggens docblock): först när
    // `onSettled`-invalideringen faktiskt hämtat om listan mäter assertionen
    // nedan hela kedjan skrivning → listning → badge. Utan detta kunde ett
    // grönt utfall komma enbart ur det optimistiska fönstret.
    await expect.poll(() => rigg.listningar).toBeGreaterThan(listningarFore);
    await expect(rad.getByText('Rönninge')).toBeVisible();
    await expect(rad.getByText('Alla event')).toHaveCount(0);

    // EF-KROPPEN — plats som RECORD-ID, aldrig ett namn.
    expect(rigg.kropp).toMatchObject({ rackvidd: 'Gemensam', plats: 'recPlatsRonninge01' });
    // Tomma axlar UTELÄMNAS ur kroppen (servern rensar dem server-side).
    expect(rigg.nycklar).not.toContain('kursfamilj');
    expect(rigg.nycklar).not.toContain('kursniva');
  });

  test('Rönninge → alla event: tomma axlar UTELÄMNAS, badgen breddas', async ({
    page,
    network,
  }) => {
    const rigg = riggaScopeVarld(network);

    await gotoRackviddslage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });
    // BADGEN FÖRE: den kombinerade formen.
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();

    await oppnaAndraRackvidd(page);
    // Tillbaka till nolläget på BÅDA axlarna — riktningen som avslöjar en
    // fältbyggare som utelämnar i stället för att rensa.
    await valjIAxel(page, familjValjare, 'Alla familjer');
    await valjIAxel(page, platsValjare, 'Alla platser');
    await expect(page.getByRole('dialog').getByText('Gäller: alla event')).toBeVisible();
    const listningarFore = rigg.listningar;
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    // VÄNTA PÅ REFETCHEN (se riggens docblock) — sedan är sluttillståndet
    // stabilt: fixturen har skrivits om, så badgen står kvar på "Alla event"
    // även efter att listningen hämtats om.
    await expect.poll(() => rigg.listningar).toBeGreaterThan(listningarFore);
    await expect(rad.getByText('Alla event')).toBeVisible();
    await expect(rad.getByText('RIM · Rönninge')).toHaveCount(0);

    expect(rigg.kropp).toMatchObject({ rackvidd: 'Gemensam' });
    // KÄRNAN: INGEN av de tre axlarna får följa med. Att pröva NYCKLARNA och
    // inte värdena är avsiktligt — `{ plats: undefined }` och en utelämnad
    // nyckel ser identiska ut för `toMatchObject`.
    expect(rigg.nycklar).not.toContain('kursfamilj');
    expect(rigg.nycklar).not.toContain('kursniva');
    expect(rigg.nycklar).not.toContain('plats');
  });

  test('serverns fel: dialogen står kvar, den optimistiska badgen skrivs OCH tas tillbaka', async ({
    page,
    network,
  }) => {
    // Serverns dokumentklass-vakt (403), med svaret HÅLLET TILLBAKA tills
    // testet släpper det. En FAST fördröjning (1,5 s stod här förut) är samma
    // klass av race som CI avslöjade i de två testen ovan: under last kan
    // vilken tidsgräns som helst passeras. En signal är deterministisk
    // oavsett maskin.
    const rigg = riggaScopeVarld(
      network,
      { ...BILAGA_GEMENSAM },
      {
        hallTillbakaSvar: true,
        svarStatus: 403,
        svarFel:
          'Bara uppladdade dokument kan byta räckvidd. Mall-genererade bilagor följer sitt event.',
      },
    );

    await gotoRackviddslage(page);
    const rad = page.getByTestId('dokument-fil').filter({ hasText: BILAGA_GEMENSAM.namn });
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();

    await oppnaAndraRackvidd(page);
    // Nollställ BÅDA axlarna, så den optimistiska badgen blir "Alla event".
    await valjIAxel(page, familjValjare, 'Alla familjer');
    await valjIAxel(page, platsValjare, 'Alla platser');
    const listningarFore = rigg.listningar;
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();

    // ═══ ARM 1: onMutate SKRIVER FAKTISKT (isolerbar, tvåsidigt bevisad) ═══
    // Servern har tagit emot anropet men svarar inte förrän vi säger till, så
    // badgen kan bara bära det nya valet genom den optimistiska skrivningen i
    // `useUpdateAttachmentScope.onMutate`. Inget serversvar har kommit än.
    await expect(rad.getByText('Alla event')).toBeVisible();
    await expect(rad.getByText('RIM · Rönninge')).toHaveCount(0);

    // Släpp 403:an.
    rigg.slappSvar();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Räckvidden kunde inte ändras')).toBeVisible();
    // DIALOGEN STÅR KVAR — felet bor intill valet som orsakade det, till
    // skillnad mot uppladdningsfelet som bor på sidan (dialogen rivs där).
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Spara' })).toBeEnabled();

    // ═══ ARM 2: BADGEN LJUGER INTE EFTER FELET ═══
    // Riggen lämnar raden ORÖRD på felvägen (precis som servern inte skriver
    // något när en vakt fäller), så detta är ett STABILT sluttillstånd:
    // badgen är tillbaka på radens verkliga räckvidd, och ytan påstår aldrig
    // en spridning basen inte har (PRD TASK-338 berättelse 3).
    //
    // VAD DEN INTE BEVISAR, och det är MÄTT, inte antaget: att just
    // `onError`-grenens `setQueryData(key, context.previous)` är det som
    // återställde den. En mutation som tog BORT hela `onError`-kroppen fällde
    // INTE detta test — `onSettled`-invalideringen hämtar om listan, och
    // eftersom felvägen lämnar fixturen orörd ger rollbacken och refetchen
    // samma synliga utfall. Rollbacken är ett FLIMMER-skydd i fönstret före
    // refetchen, inte den enda sanningskällan, och därför inte isolerbar på
    // denna yta. Att skriva "rollback-armen bevisad" här hade varit ett
    // påstående testet inte bär (ADR-083). Arm 1 ovan är den del som ÄR
    // isolerbar, och den är bevisad i båda riktningar.
    await expect.poll(() => rigg.listningar).toBeGreaterThan(listningarFore);
    await expect(rad.getByText('RIM · Rönninge')).toBeVisible();
    await expect(rad.getByText('Alla event')).toHaveCount(0);
  });

  test('tangentbord: fokus flyttas IN i dialogen och ÅTERLÄMNAS efter Escape', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);

    await oppnaAndraRackviddMedTangentbord(page);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // ═══ FOKUS ÄR FAKTISKT INNE I DIALOGEN ═══
    // Mätt, inte antaget: `document.activeElement` måste vara en ÄTTLING till
    // dialogen. En tidigare version av detta test assertade `toContainText`,
    // vilket bara bevisade att namnet RENDERADES — det hade varit grönt även
    // med fokus kvar bakom overlayen, alltså precis den skada assertionen
    // påstod sig skydda mot.
    await expect
      .poll(() => dialog.evaluate((el) => el.contains(document.activeElement)))
      .toBe(true);

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // ═══ ÅTERLÄMNINGEN ═══
    // Dialogen monteras VILLKORLIGT (`andrasRackvidd != null`), så
    // react-arias fokus-restore måste överleva en unmount av hela trädet.
    // Landar fokus på <body> i stället står tangentbordsanvändaren utan
    // position i listan och får börja om från sidans topp.
    //
    // [T176] ANKARET ÄR ⋯-KNAPPEN, inte den gamla "Ändra räckvidd"-ikonknappen:
    // menyn stänger vid `onAction` och lämnar fokus till sin trigger, och det
    // är den positionen dialogen sedan ska återlämna till. Kedjan meny →
    // dialog → tillbaka är alltså EN länk längre än förut, och det är precis
    // därför den mäts.
    await expect(menyTrigger(page)).toBeFocused();
  });

  test('tangentbord: fokus återlämnas till knappen även efter LYCKAD Spara', async ({
    page,
    network,
  }) => {
    network.use(bilagorHandler());
    riggaScopeVarld(network);

    await gotoRackviddslage(page);
    await oppnaAndraRackviddMedTangentbord(page);
    await expect(page.getByRole('dialog')).toBeVisible();

    await valjIAxel(page, platsValjare, 'Alla platser');
    await page.getByRole('dialog').getByRole('button', { name: 'Spara' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // SVÅRARE FALL ÄN ESCAPE, och därför ett eget test: knappen är
    // `isDisabled` medan `scopeMutation.isPending` — en disabled knapp kan
    // inte ta fokus. Stängningen sker dessutom i mutationens `onSuccess`,
    // alltså i samma vända som `isPending` faller tillbaka. Att fokus ändå
    // landar rätt är inget man kan läsa sig till ur koden; det måste mätas.
    // [T176] Ankaret är ⋯-knappen — se Escape-testet ovan.
    await expect(menyTrigger(page)).toBeFocused();
  });

  test('ändra-dialogen är axe-ren', async ({ page, network }) => {
    network.use(bilagorHandler());
    await gotoRackviddslage(page);
    await oppnaAndraRackvidd(page);
    await expect(page.getByRole('dialog')).toBeVisible();

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});
