import type { Page } from '@playwright/test';
import { delay, http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.39 — höjdlåsets TIDPUNKT (S1) och den fjärde separatorns LÄGE (S2).
 *
 * Marcus prod-röktest 2026-08-29 (S113), ordagrant: *"När jag växlade flik
 * från delade dokument till ett specifikt event så laggade dokumentlistan.
 * Den följde först innehållet och växte och krympte med innehållet för att
 * några sekunder senare ligga låst på att visa '4 rader' … Dessutom så har
 * vi sagt att listan ska sluta precis över den nedersta separatorn men det
 * gör den inte just nu, jag ser den nedersta separatorn."*
 *
 * SYSTERFIL, INTE ERSÄTTARE: `dokument-lista-hojdlas.acceptance.test.ts`
 * (TASK-309.24) bevisar att den låsta geometrin är RÄTT när den väl finns.
 * Denna fil bevisar de två saker den filen strukturellt inte kunde se —
 * NÄR låsningen inträffar, och VAR den fjärde separatorlinjen hamnar
 * relativt ytans klippkant.
 *
 * ── VARFÖR 309.24 INTE KUNDE SE DEM ────────────────────────────────────
 *
 * S1: varje test i 309.24 öppnade sidan i default-filtret 'alla', som ÄR en
 * mätkälla (`reservMatbar`). Höjden var därför alltid redan låst innan
 * mätningen skedde, och filterbyten därefter läste samma bevarade
 * React-state. Ingen väg in i komponenten via ett ICKE-mätbart filter fanns i
 * sviten — och det var precis den vägen `?typ=` öppnade, eftersom
 * nuqs-nyckeln överlevde räckviddsväxlingen medan komponenten monterades om.
 *
 * [T176, 2026-08-29] TYPFILTRET ÄR RIVET (`DokumentLista` § docblock: listan
 * visar bara bilagor, så ett filter med tre alternativ varav två är tomma är
 * sämre än inget). Båda de ICKE-mätbara vägarna är därmed borta, och S1:s
 * kvarvarande innehåll är växlingen i sig: komponenten monteras OM vid ett
 * räckviddsbyte, alla refs och `hojd`-state nollställs, och höjden ska vara
 * låst i VARJE ram listan existerar — nu buren av `reservMatbar` (ovillkorat
 * `true` sedan filtret försvann) i stället för av nödmätningen. Nödmätningen
 * är ORÖRD i hooken och täcks av 0-raderstestet.
 *
 * S2: 309.24:s femradersfall mätte `rad4.bottom <= ulRect.bottom + 0.5` och
 * kallade utfallet "klippt bort". Den olikheten är SANN när linjen ligger
 * på ytans SISTA synliga pixelrad — alltså exakt när den syns. Testet
 * mätte rätt tal mot fel gräns.
 *
 * [T176, 2026-08-29] S2 HANDLAR NU OM KORT, INTE OM LINJER. Separatorerna
 * är rivna med kortformen (Marcus kvitterade rivningen av höjdlåsets
 * separator-halva samma dag; fyra-synliga-med-inline-rullning står kvar).
 * Klippkanten prövas därför direkt: fjärde kortet HELT innanför, femte
 * kortet HELT utanför — se `kortensLage` nedan. Lärdomen ur den gamla
 * gränsen bärs vidare där: mät den kant frågan faktiskt gäller, inte den
 * som råkar vara lätt att läsa.
 */

/** [TASK-338.3, ADR-125 § Beslut 1] Två levande räckvidder, inte tre —
 *  `Kurstyp`/`Alla event` ÄR `Gemensam` med respektive utan axlar. */
type Rad = { namn: string; rackvidd: 'Event' | 'Gemensam' };

function attachment(id: string, { namn, rackvidd }: Rad) {
  return {
    id,
    namn,
    storlekBytes: 10_240,
    skapad: '2026-08-20T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Uppladdad',
    rackvidd,
    kursfamilj: null,
    kursniva: null,
    plats: null,
  };
}

/**
 * EN handler, grenar på `?eventId=` — samma form som systerfilens
 * `hojdlasHandler`, men med en LATENS på event-grenen. Fördröjningen är
 * inte kosmetik: den skiljer "listan monteras med data" från "listan
 * monteras tom och fylls sedan", vilket är hela S1:s tidsfönster.
 */
function handler(antalEgna: number, antalGemensamma: number, latensMs = 0) {
  return http.get(EF('get-event-attachments'), async ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (eventId) {
      if (latensMs > 0) await delay(latensMs);
      return json({
        attachments: Array.from({ length: antalEgna }, (_, i) =>
          attachment(`recEgen39${String(i).padStart(4, '0')}`, {
            namn: `Bilaga ${i + 1}.pdf`,
            rackvidd: 'Event',
          }),
        ),
      });
    }
    return json({
      attachments: Array.from({ length: antalGemensamma }, (_, i) =>
        attachment(`recGem39${String(i).padStart(4, '0')}`, {
          namn: `Delad ${i + 1}.pdf`,
          rackvidd: 'Gemensam',
        }),
      ),
    });
  });
}

/**
 * [TASK-309.46] RÄNNAN MELLAN KORTEN, i px — radens transparenta
 * `border-bottom` (`border-b-8`).
 *
 * DUPLICERAS MEDVETET, samma disciplin som `FALLBACK` nedan: hookens NIVÅ 1
 * och 2 DRAR BORT den sista mätta radens ränna ur låset (`separatorBredd`
 * läser `border-bottom-width`), så en assertion mot `radhöjd × 4` utan avdrag
 * kodar den form som gällde när rännan var en padding och separatorn 0 px.
 * Talet står här så att en ändring av rännan fäller testet i stället för att
 * tyst göra det till en tautologi.
 */
const RANNA = 8;

/**
 * [TASK-309.46] ÖVRE TOLERANS FÖR NIVÅ 3:s HÖJD — 2 px, inte 8.
 *
 * SKÄRPT PÅ EN NEGATIV KONTROLL, inte på en känsla. Bandet var
 * `FALLBACK × 4 + 8`, valt när "fel svar" låg långt utanför det. Sedan
 * TASK-309.46 är det NÄRMASTE felsvaret exakt EN RÄNNA fel (konstanten 124 i
 * stället för 122 ⇒ 496 i stället för 488), alltså precis 8 px — och den
 * gamla toleransen SVALDE det: en isolerad kontroll som satte tillbaka 124
 * lämnade testet GRÖNT.
 *
 * `<ul>` bär ingen kant (mätt), så `kantjustering` är 0 och den uppmätta
 * höjden är exakt 488 vid både 1280 och 390 px. 2 px räcker för sub-pixel-brus
 * och utesluter ränn-felet. Vidga inte bandet igen utan att först fråga vilket
 * felsvar som då släpps in.
 */
const TOLERANS = 2;

const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/**
 * Tom cache-arrangemang (ADR-072) — persist-nyckeln bort FÖRE app-boot.
 *
 * SAMMA form som `hem-laddlage.acceptance.test.ts` och
 * `events-list.staging.test.ts` redan bär: ett init-script, alltså
 * test-ARRANGEMANG före start — INTE runtime-tömning (den vägen är
 * `queryClient.clear()`, ADR-072 skyddsräcke 1).
 *
 * ── VARFÖR ETT TEST HÄR BEHÖVER DET (TASK-309.41) ────────────────────────
 *
 * Ett test som laddar samma route TVÅ gånger med olika fixturdata delar
 * `queryKeys.attachments.gemensamma` mellan laddningarna. Nyckeln är en
 * KONSTANT (`['attachments', 'gemensamma']`, keys.ts) och bär inget id, så
 * TASK-28:s vanliga fix-mönster (distinkta id per scenario, se
 * `event-deltagare.staging.test.ts`) är inte tillämpligt utan att
 * produktionskoden ändras för testets skull. Arrangemanget nedan är i
 * stället det som tar bort den delade tillståndsbäraren.
 *
 * MEKANISMEN, MÄTT (differential-probe 2026-08-29, TASK-309.41):
 * localStorage-synken är throttlad till 1 s (biblioteksdefault,
 * `src/queries/persist.ts`). Hinner den fyra mellan laddningarna ligger
 * scenario 1:s svar i lagringen när sidan startas om, och den globala
 * `staleTime` på 5 min (`src/router.ts`) gör den restaurerade datan FÄRSK
 * — alltså ingen bakgrundshämtning alls, och scenario 2:s svar når aldrig
 * skärmen. Med nyckeln kvar: 0 EF-anrop, fyra rader renderade. Med
 * nyckeln rensad, allt annat lika: 1 EF-anrop, fem rader renderade.
 * Det är ADR-072:s AVSEDDA varmstart, inte en produktbugg (samma klassning
 * som TASK-28) — testet måste därför arrangera bort den, inte appen.
 *
 * Init-script-formen är dessutom den enda race-fria: den kör på det NYA
 * dokumentet innan app-JS vaknar, så ingen kvarvarande throttle-timer från
 * den gamla sidan kan hinna skriva tillbaka scenario 1:s cache efter
 * rensningen.
 */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
}

/**
 * Startar en `requestAnimationFrame`-slinga som samplar listan VARJE ram.
 *
 * RAM-FÖR-RAM, INTE `waitForTimeout` + EN mätning: S1 är ett TIDSFÖNSTER,
 * och ett fönster går inte att bevisa bort med ett stickprov efteråt. AC
 * #1:s t=0/100/500/3000-krav uppfylls med marginal av en slinga som
 * fångar varje ram i hela intervallet — de fyra tidpunkterna är en
 * DELMÄNGD av det som mäts, inte en svagare approximation.
 */
async function startaSampling(page: Page) {
  await page.evaluate(() => {
    const prover: Array<{ t: number; finns: boolean; last: boolean; hojd: number | null }> = [];
    (window as unknown as { __hojdProver: typeof prover }).__hojdProver = prover;
    const t0 = performance.now();
    const tick = () => {
      const ul = document.querySelector('[data-testid="dokument-lista"]');
      prover.push({
        t: Math.round(performance.now() - t0),
        finns: ul != null,
        last: ul instanceof HTMLElement ? ul.style.height !== '' : false,
        hojd: ul != null ? Math.round(ul.getBoundingClientRect().height * 100) / 100 : null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function lasProver(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __hojdProver: Array<{ t: number; finns: boolean; last: boolean; hojd: number | null }>;
        }
      ).__hojdProver,
  );
}

/**
 * Det fjärde och femte KORTET mot ytans KLIPPKANT.
 *
 * `innehallBottom` är innehållsytans nederkant uttryckt i samma rymd som
 * kortens `bottom`: ytans egen `border-top` plus `clientHeight`.
 *
 * ═══ [T176, 2026-08-29] FRÅN SEPARATOR TILL KORT — SAMMA FRÅGA, DIREKT ═══
 *
 * Funktionen hette `separatornsLage` och mätte om fjärde radens
 * `border-bottom` hamnade innanför klippkanten. Separatorlinjerna är rivna
 * med kortformen (rännan mellan korten ÄR avdelaren, Marcus kvitterat), så
 * frågan ställs nu direkt: ligger fjärde kortet HELT innanför kanten, och
 * femte kortet HELT utanför?
 *
 * DEN GAMLA GRÄNSEN VAR ÄNDÅ RÄTT LÄRDOM, OCH DEN BÄRS VIDARE: `bottom <=
 * innehallBottom` (309.24) besvarade en ANNAN fråga än den som ställdes,
 * eftersom linjen kunde ligga PÅ ytans sista synliga pixelrad och ändå
 * "rymmas". Samma sorts fel vore här att bara mäta fjärde kortet: ett
 * FEMTE kort som sticker upp en halv centimeter under kanten bryter regeln
 * lika mycket, och syns inte i fjärde kortets tal. Båda mäts därför.
 */
async function kortensLage(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => {
    const rund = (n: number) => Math.round(n * 100) / 100;
    const ulRect = ul.getBoundingClientRect();
    const innehallBottom = Number.parseFloat(getComputedStyle(ul).borderTopWidth) + ul.clientHeight;
    const kort = Array.from(ul.querySelectorAll('[data-testid="dokument-fil"]'));
    const fjarde = kort[3];
    const femte = kort[4];
    if (!fjarde) return null;
    const fjardeBottom = fjarde.getBoundingClientRect().bottom - ulRect.top;
    const femteTop = femte ? femte.getBoundingClientRect().top - ulRect.top : null;
    return {
      antalKort: kort.length,
      fjardeBottom: rund(fjardeBottom),
      femteTop: femteTop === null ? null : rund(femteTop),
      innehallBottom: rund(innehallBottom),
      // ±0,5 px mot sub-pixel-avrundning — en VERKLIG regression lägger
      // hela kortkanten på fel sida.
      fjardeHeltInne: fjardeBottom <= innehallBottom + 0.5,
      femteHeltUte: femteTop === null ? true : femteTop >= innehallBottom - 0.5,
    };
  });
}

async function matGeometri(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => ({
    hojd: Math.round(ul.getBoundingClientRect().height * 100) / 100,
    last: ul instanceof HTMLElement ? ul.style.height !== '' : false,
    scrollHeight: ul.scrollHeight,
    overflowY: getComputedStyle(ul).overflowY,
    clientHeight: ul.clientHeight,
    radHojder: Array.from(ul.children).map((li) => li.getBoundingClientRect().height),
  }));
}

async function vaxlaTillEvent(page: Page) {
  await page.getByTestId('event-valjare-trigger').click();
  await page.getByRole('option', { name: 'Skövde', exact: false }).first().click();
}

/** Var listan OLÅST i någon ram där den fanns? Returnerar första sådana. */
function forstaOlasta(
  prover: Array<{ t: number; finns: boolean; last: boolean; hojd: number | null }>,
) {
  return prover.find((p) => p.finns && !p.last) ?? null;
}

test.describe('S1 — höjden är låst från listans FÖRSTA målade ram', () => {
  test('AC #1/#2: växling delade → event med FÄRRE än fyra bilagor', async ({ page, network }) => {
    // Marcus flöde, exakt: två delade dokument i räckviddsläget, sedan ett
    // event valt i väljaren. Det nya eventet har TVÅ bilagor.
    //
    // [T176, 2026-08-29] URL:en bar tidigare `?typ=bilaga` — den nuqs-nyckeln
    // var halva rotorsaken 2026-08-29 (den överlevde räckviddsbytet medan
    // komponenten monterades om, och räckviddsläget hade ingen filterrad som
    // visade att filtret var satt). Filterraden är riven, så vägen finns inte
    // längre. VÄXLINGEN kvarstår som den intressanta delen: komponenten
    // monteras OM, alla refs och `hojd`-state nollställs, och höjden måste
    // vara låst i varje ram listan existerar — nu buren av `reservMatbar`
    // (ovillkorat `true`) i stället för av nödmätningen.
    network.use(handler(2, 2, 400));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 2.pdf')).toBeVisible();

    await startaSampling(page);
    await vaxlaTillEvent(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    await page.waitForTimeout(3000);

    const prover = await lasProver(page);
    const olast = forstaOlasta(prover);
    expect(
      olast,
      `listan var OLÅST i ram t=${olast?.t} ms (höjd ${olast?.hojd}) — höjden ska vara låst i varje ram listan existerar`,
    ).toBeNull();

    // Slutläget: fyra raders låst höjd trots att bara två rader finns.
    const slut = await matGeometri(page);
    expect(slut.last).toBe(true);
    // [TASK-309.46] AVDRAGET ÄR NYTT I TALEN, INTE I HOOKEN. NIVÅ 2 har
    // alltid satt `radhöjd × 4 − radens egen separator`; separatorn var bara
    // 0 px så länge rännan låg som padding. Sedan rännan blev en transparent
    // `border-bottom` (8 px) har avdraget ett föremål, och den låsta höjden är
    // 488 = 124 × 4 − 8. Att skriva `maxRad * 4` utan avdrag hade alltså
    // kodat den GAMLA formen — bounds:en är oförändrade i sin bredd.
    const maxRad = Math.max(...slut.radHojder);
    expect(slut.hojd).toBeGreaterThanOrEqual(maxRad * 4 - RANNA - 2);
    expect(slut.hojd).toBeLessThanOrEqual(maxRad * 4 - RANNA + 4);
  });

  // [T176, 2026-08-29] TESTET "sidladdning direkt i ?typ=mall" ÄR RIVET, INTE
  // TAPPAT. Det prövade väg 2 i `useLastaListhojd`s "EN OMÄTT LISTA"-stycke:
  // `MALLAR` har två poster och `GENERATORER` en, så filtren 'mall'/'generator'
  // kunde ALDRIG nå fyra rader och en sidladdning i något av dem lämnade
  // höjden permanent olåst. Både filtren och mall-/generatorraderna är rivna
  // (mallarna är handlingar nu, se `SkapaDokumentMeny`), så vägen finns inte
  // att pröva. Nödmätningen den fällde är ORÖRD i hooken och täcks fortfarande
  // av 0-raderstestet nedan.

  test('AC #2/#5: NIVÅ 3 är nåbar även i DokumentLista — ett event UTAN bilagor', async ({
    page,
    network,
  }) => {
    // Låser den nåbarhet `LISTA_FALLBACK_RADHOJD`s docblock beskriver efter
    // 309.39: noll RIKTIGA rader i DOM och ingen tidigare mätning i
    // komponentens liv, alltså NIVÅ 3 (konstanten).
    //
    // [T176] Vägen dit gick tidigare via `?typ=bilaga` på ett event vars
    // mallar/generatorer ändå fyllde 'alla'. Filtret är rivet — nu är det det
    // ÄRLIGA fallet: eventet HAR inga bilagor, och listan har inget annat att
    // visa.
    network.use(handler(0, 0));
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByText('Inga bilagor för det här eventet än.')).toBeVisible();

    const geometri = await matGeometri(page);
    expect(geometri.last).toBe(true);
    // Talet DUPLICERAS medvetet, samma disciplin som systerfilens
    // `FALLBACK_RADHOJD` — se dess kommentar. [T176] 99 → 107 → 124, och
    // [TASK-309.46] 124 → 122: konstanten är NIVÅ 3:s reserv för den
    // SEPARATOR-FRIA per-rad-höjden (488 / 4), inte för `<li>`-höjden 124.
    // `<li>` är fortfarande 124 (kort 116 + 8 px ränna); det som ändrades är
    // att rännan ligger som transparent `border-bottom` och därmed dras bort
    // ur låset. Uppmätt i denna rigg vid både 1280 px och 375 px.
    const FALLBACK = 122;
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK * 4 + TOLERANS);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
  });

  test('AC #1/#4: samma invariant vid 375 px', async ({ page, network }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(handler(2, 2, 400));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 2.pdf')).toBeVisible();

    await startaSampling(page);
    await vaxlaTillEvent(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    await page.waitForTimeout(3000);

    const olast = forstaOlasta(await lasProver(page));
    expect(olast, `listan var OLÅST i ram t=${olast?.t} ms (höjd ${olast?.hojd})`).toBeNull();
  });
});

test.describe('S2 — fjärde kortet ligger HELT innanför klippkanten, femte HELT utanför', () => {
  for (const [etikett, antalGemensamma] of [
    ['fem rader', 5],
    ['sju rader', 7],
  ] as const) {
    test(`AC #3: GemensamtLage, ${etikett} — inget halvt kort vid kanten`, async ({
      page,
      network,
    }) => {
      network.use(handler(0, antalGemensamma));
      await page.goto('/mer/dokument');
      await expect(page.getByText(`Delad ${antalGemensamma}.pdf`)).toBeVisible();

      const lage = await kortensLage(page);
      expect(lage).not.toBeNull();
      // Ett FEMTE kort FINNS (annars vore invarianten trivialt sann) —
      // samma disciplin som den gamla `separatorBredd > 0`-kontrollen.
      expect(lage?.femteTop).not.toBeNull();
      expect(
        lage?.fjardeHeltInne,
        `fjärde kortet slutar vid ${lage?.fjardeBottom} px, innehållsytan vid ${lage?.innehallBottom} px`,
      ).toBe(true);
      expect(
        lage?.femteHeltUte,
        `femte kortet börjar vid ${lage?.femteTop} px, innehållsytan slutar vid ${lage?.innehallBottom} px`,
      ).toBe(true);
    });
  }

  test('AC #3/#4: DokumentLista (eventläge), sju rader — samma invariant', async ({
    page,
    network,
  }) => {
    // [T176] Sju rader kommer nu från SJU BILAGOR. Före filterrivningen var
    // samma sjua "4 bilagor + 2 mallar + 1 generator" i default-filtret —
    // mall- och generatorraderna finns inte i listan längre.
    network.use(handler(7, 0));
    await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const lage = await kortensLage(page);
    expect(lage?.femteTop).not.toBeNull();
    expect(
      lage?.fjardeHeltInne,
      `fjärde kortet slutar vid ${lage?.fjardeBottom} px, innehållsytan vid ${lage?.innehallBottom} px`,
    ).toBe(true);
    expect(
      lage?.femteHeltUte,
      `femte kortet börjar vid ${lage?.femteTop} px, innehållsytan slutar vid ${lage?.innehallBottom} px`,
    ).toBe(true);
  });

  test('AC #3/#4: samma invariant vid 375 px (radbrytningens brytpunkt)', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(handler(0, 6));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 6.pdf')).toBeVisible();

    const lage = await kortensLage(page);
    expect(lage?.femteTop).not.toBeNull();
    expect(lage?.fjardeHeltInne).toBe(true);
    expect(lage?.femteHeltUte).toBe(true);
  });

  test('AC #4: exakt fyra rader — ingen 1 px-scroll, och inget femte kort att klippa', async ({
    page,
    network,
  }) => {
    // Gränsfallet får inte betalas av regeln: vid exakt fyra rader finns
    // inget femte kort alls, och fjärde kortet ska ligga helt innanför
    // kanten med luft kvar (radens `py-1`). [T176] Prövade förut att
    // fjärde raden saknade `border-bottom`; separatorn finns inte längre,
    // så frågan ställs mot korten i stället.
    network.use(handler(0, 4));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();

    // [TASK-309.46] `scrollHeight === clientHeight` STOD HÄR och skulle nu
    // fälla på en KORREKT app. Rännan är sedan dess en transparent
    // `border-bottom`, och låset EXKLUDERAR fjärde radens (det är det som gör
    // att spåret börjar OCH slutar vid korten) medan rännan ligger kvar i
    // innehållet — fyra rader mäter alltså 496 px innehåll i en 488 px box.
    //
    // Invarianten skrivs därför ut i stället för att mätas indirekt, och blir
    // strängare: listan går inte att rulla (`overflow-y: hidden`, alltså ingen
    // scrollbar), övermåttet är EXAKT en ränna och inget annat, och fjärde
    // kortet ligger helt innanför kanten. Se systerfilens
    // `provaExaktFyraRader` för hela resonemanget.
    const geometri = await matGeometri(page);
    expect(geometri.overflowY, 'vid fyra rader ska listan inte kunna rullas alls').toBe('hidden');
    expect(
      geometri.scrollHeight - geometri.clientHeight,
      `övermåttet ska vara EXAKT fjärde radens transparenta ränna — mätt ${geometri.scrollHeight} − ${geometri.clientHeight}`,
    ).toBe(RANNA);
    const lage = await kortensLage(page);
    expect(lage?.antalKort).toBe(4);
    expect(lage?.femteTop).toBeNull();
    expect(lage?.fjardeHeltInne).toBe(true);
  });

  test('AC #3/#4: fyra och fem rader delar EXAKT samma låsta bounding box', async ({
    page,
    network,
  }) => {
    // Före TASK-309.39 skilde de sig med den fjärde separatorns bredd: fyra
    // rader gav ingen linje att räkna in, fem gav en. [T176] Termen finns
    // inte längre alls — rännan bor INUTI varje `<li>` (`py-1`) och är
    // därför lika stor i varje rad oavsett position, så NIVÅ 1:s spann och
    // NIVÅ 2:s radhöjd ger samma tal. Regel 5 prövas fortsatt som EXAKT
    // likhet i det par som tidigare bar hela avvikelsen.
    //
    // ENDA testet i filen med TVÅ laddningar, och därför det enda som
    // behöver arrangemanget — se `arrangeraTomCache` för mekanismen och
    // mätningen (TASK-309.41). Utan det bar den andra laddningen scenario
    // 1:s fyra rader ur persist-lagret: 7 av 10 fällda med
    // `--repeat-each=10` (2026-08-29), alltid på `Delad 5.pdf`.
    await arrangeraTomCache(page);

    network.use(handler(0, 4));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();
    const fyra = await matGeometri(page);

    network.use(handler(0, 5));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 5.pdf')).toBeVisible();
    const fem = await matGeometri(page);

    expect(fem.hojd).toBe(fyra.hojd);
  });
});
