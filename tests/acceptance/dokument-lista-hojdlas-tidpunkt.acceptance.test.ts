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
 * mätte rätt tal mot fel gräns; se `separatornsLage` nedan för den gräns
 * som faktiskt skiljer synlig från klippt.
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
 * Den fjärde radens separator mot ytans KLIPPKANT.
 *
 * `innehallBottom` är innehållsytans nederkant uttryckt i samma rymd som
 * radernas `bottom`: ytans egen `border-top` plus `clientHeight`. En rads
 * `getBoundingClientRect().bottom` ligger PÅ radens egen `border-bottom`s
 * yttre kant (`box-sizing: border-box`), så linjen upptar intervallet
 * `[bottom - borderBottomWidth, bottom]`.
 *
 * LINJEN SYNS precis när det intervallet överlappar `[…, innehallBottom]` —
 * alltså när `bottom - borderBottomWidth < innehallBottom`. Att i stället
 * mäta `bottom <= innehallBottom` (309.24) besvarar en ANNAN fråga: om
 * radens underkant ryms, vilket den gör ÄVEN när linjen ligger på ytans
 * sista synliga pixelrad.
 */
async function separatornsLage(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => {
    const ulRect = ul.getBoundingClientRect();
    const innehallBottom = Number.parseFloat(getComputedStyle(ul).borderTopWidth) + ul.clientHeight;
    const fjarde = ul.children[3];
    if (!fjarde) return null;
    const bredd = Number.parseFloat(getComputedStyle(fjarde).borderBottomWidth);
    const bottom = fjarde.getBoundingClientRect().bottom - ulRect.top;
    return {
      separatorBredd: bredd,
      separatorTopp: Math.round((bottom - bredd) * 100) / 100,
      innehallBottom: Math.round(innehallBottom * 100) / 100,
      // Tolerans nedåt: sub-pixel-avrundning får inte läsas som en synlig
      // linje. En VERKLIG regression lägger hela linjebredden innanför.
      syns: bredd > 0 && bottom - bredd < innehallBottom - 0.5,
    };
  });
}

async function matGeometri(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => ({
    hojd: Math.round(ul.getBoundingClientRect().height * 100) / 100,
    last: ul instanceof HTMLElement ? ul.style.height !== '' : false,
    scrollHeight: ul.scrollHeight,
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
    const maxRad = Math.max(...slut.radHojder);
    expect(slut.hojd).toBeGreaterThanOrEqual(maxRad * 4 - 2);
    expect(slut.hojd).toBeLessThanOrEqual(maxRad * 4 + 4);
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
    // `FALLBACK_RADHOJD` — se dess kommentar. [T176] 99 → 107: referensraden
    // `MallRad` är riven, och en bilagerad mäter 107 px.
    const FALLBACK = 107;
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK * 4 + 8);
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

test.describe('S2 — den fjärde separatorn ligger UTANFÖR ytans klippkant', () => {
  for (const [etikett, antalGemensamma] of [
    ['fem rader', 5],
    ['sju rader', 7],
  ] as const) {
    test(`AC #3: GemensamtLage, ${etikett} — fjärde radens linje är klippt, inte synlig`, async ({
      page,
      network,
    }) => {
      network.use(handler(0, antalGemensamma));
      await page.goto('/mer/dokument');
      await expect(page.getByText(`Delad ${antalGemensamma}.pdf`)).toBeVisible();

      const lage = await separatornsLage(page);
      expect(lage).not.toBeNull();
      // Linjen FINNS (divide-y ger den, eftersom en femte rad följer) —
      // testet skulle annars kunna passera på att den saknas helt.
      expect(lage?.separatorBredd).toBeGreaterThan(0);
      expect(
        lage?.syns,
        `fjärde separatorn börjar vid ${lage?.separatorTopp} px, innehållsytan slutar vid ${lage?.innehallBottom} px`,
      ).toBe(false);
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

    const lage = await separatornsLage(page);
    expect(lage?.separatorBredd).toBeGreaterThan(0);
    expect(
      lage?.syns,
      `fjärde separatorn börjar vid ${lage?.separatorTopp} px, innehållsytan slutar vid ${lage?.innehallBottom} px`,
    ).toBe(false);
  });

  test('AC #3/#4: samma invariant vid 375 px (radbrytningens brytpunkt)', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(handler(0, 6));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 6.pdf')).toBeVisible();

    const lage = await separatornsLage(page);
    expect(lage?.separatorBredd).toBeGreaterThan(0);
    expect(lage?.syns).toBe(false);
  });

  test('AC #4: exakt fyra rader — ingen 1 px-scroll, och fjärde raden bär ingen linje att klippa', async ({
    page,
    network,
  }) => {
    // Fixens andra halva får inte betalas av gränsfallet: vid exakt fyra
    // rader ÄR fjärde raden sista, `divide-y` ger den ingen `border-bottom`
    // och `sistaRadenBarLinje` är falsk — det finns alltså ingenting att
    // dra bort, och höjden ska vara oförändrad mot före fixen.
    network.use(handler(0, 4));
    await page.goto('/mer/dokument');
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();

    const geometri = await matGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    const lage = await separatornsLage(page);
    expect(lage?.separatorBredd).toBe(0);
  });

  test('AC #3/#4: fyra och fem rader delar EXAKT samma låsta bounding box', async ({
    page,
    network,
  }) => {
    // Före fixen skilde de sig med den fjärde separatorns bredd: fyra rader
    // gav ingen linje att räkna in, fem gav en. Fixen tar bort just den
    // termen, så boxen blir densamma — regel 5, skärpt från "≤ 1 px" till
    // exakt likhet i det par som tidigare bar hela avvikelsen.
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
