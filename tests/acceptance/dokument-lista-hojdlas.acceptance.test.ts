import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.24 — Dokumentlistan: alltid fyra raders låst höjd, fjärde raden
 * klipps aldrig halvt av kanten — ingen hoppning, ingen 1 px-scroll.
 * (Ursprungsformen bar separatorlinjer mellan raderna; se T176-stycket
 * nedan för vad som ersatte dem och varför.)
 *
 * Marcus 2026-08-26 (S108 resume 11), ordagrant: *"Vi kan ha låst höjd med
 * separatorlinje på alla OM vi låser höjden så den fjärde separatorlinjen
 * inte syns. Är 5 dokument i listan så syns inte linjen förrän du
 * scrollar."*
 *
 * VAD DENNA FIL BEVISAR (acceptance-bas.ts § VAD KLASSEN BEVISAR):
 * `DokumentYta.tsx`s geometri (`berakaListgeometri`/`useLastaListhojd`)
 * renderar rätt GIVET ett `get-event-attachments`-svar med N poster — inte
 * att staging faktiskt returnerar N poster.
 *
 * [RUNDA 2, review-fynd 1] Regeln är ALLTID exakt fyra raders hög — INTE
 * bara när totalen överstiger fyra. Körning 1:s `lasHojd = totaltAntal > 4`
 * lämnade 0–3 rader innehållsstyrda; AC #3 var därför FELAKTIGT avbockad
 * (testet nedan hette "tomt läge inom (O-LÅST) höjd" — döpt om, se
 * `berakaListgeometri`/`useLastaListhojd`s docblock i källan för hela
 * omdesignen: tre mätnivåer, PRECIS/ESTIMAT/FALLBACK, fallande precision,
 * ALDRIG nedåt (`harPreciserMatt`).
 *
 * ═══ [T176, 2026-08-29] SEPARATOR-HALVAN ÄR RIVEN, KORT-HALVAN ERSÄTTER ═══
 *
 * Marcus kvitterade rivningen explicit samma dag: höjdlåsets
 * SEPARATOR-halva (*"fjärde linjen klipps / sista raden bär linje"*) går
 * bort med kortformen — rännan mellan korten ÄR avdelaren — medan
 * FYRA-SYNLIGA-MED-INLINE-RULLNING står kvar oförändrad. Assertsen som
 * läste `border-bottom-width` på sista `<li>` är därför ERSATTA, inte
 * mildrade: de prövade klippkanten INDIREKT (en linje som inte syns ⇒
 * kanten ligger rätt), och samma fråga ställs nu DIREKT — fjärde kortet
 * helt innanför kanten, femte kortet helt utanför, aldrig ett halvt kort
 * (`provaKortkanter`). Den nya formen fäller på en regressionsklass den
 * gamla inte kunde se: ett kort som sticker upp halvvägs under kanten
 * bär ingen linje att mäta.
 *
 * TÄCKNING:
 *   AC #1 — bounding box (bredd, höjd) identisk oavsett antal poster
 *     (4 mot 7, 5 mot 6) — mätt desktop OCH 375 px. Utökat (runda 2):
 *     `DokumentLista`s EGNA 0-raders-läge delar boxen.
 *   AC #2 — exakt fyra synliga kort: `scrollHeight === clientHeight`,
 *     inget femte kort i DOM; fem-plus: scrollbart, femte kortet HELT
 *     utanför klippkanten, sista kortet nåbart EFTER scroll; 1–3: LÅST
 *     höjd (bevisat mot radernas egen uppmätta höjd, inte bara "ingen
 *     scroll" — se `mataGeometri`s `radHojder`).
 *   AC #3 — tomt läge (`DokumentLista` OCH `GemensamtLage`) renderas INOM
 *     samma LÅSTA höjd, utan kort; `prefers-contrast: more` tänder
 *     KORTENS kanter; axe 0 violations.
 *   AC #5 — samma mätning fäller på 1 px-scroll vid exakt fyra rader — se
 *     § "Bevis i båda riktningar" i PR-beskrivningen för en negativ
 *     kontroll.
 *
 * GRÄNSFALLET (review-fynd 3, runda 2): när radantalet minskar IN-PLACE
 * (en riktig Radera-åtgärd, INGEN `page.goto`) under `LISTA_SYNLIGA_RADER`
 * från en redan PRECIS låst höjd, ska höjden INTE krympa till en ny,
 * sämre ESTIMAT-mätning — den ska stå EXAKT kvar. Testat på `GemensamtLage`
 * (enda ytan med en riktig standalone Radera-knapp att trigga via — se
 * `useDeleteAttachment.ts`s `onSettled`-invalidering); mekanismen
 * (`harPreciserMatt` i `useLastaListhojd`) är DELAD med `DokumentLista`,
 * som saknar en motsvarande UI-åtgärd för event-bilagor och därför inte
 * har ett eget dubblerande test här.
 *
 * [RUNDA 2, ANDRA VARVET — review-utlåtande på 8e34827f] Tre tillägg:
 *
 *   1. Fallback-konstanten (NIVÅ 3) var satt mot en BRUTEN radform (155 px,
 *      mobil) — orimligt för ett tomt läge (622 px låst höjd, 78 % luft på
 *      en 800 px-skärm). Nu EN viewport-oberoende konstant (99, mätt mot
 *      `MallRad`, som strukturellt aldrig bryter) — se
 *      `LISTA_FALLBACK_RADHOJD`s docblock i källan. Nytt: en HEL
 *      `GemensamtLage`-svit vid 375 px (test.describe nedan) som speglar
 *      desktop-sviten över alla tre nivåer, så regressionen fångas på BÅDA
 *      brytpunkterna, inte bara desktop.
 *   2. NIVÅ 2 → NIVÅ 1-övergången (3 riktiga rader → en fjärde dyker upp
 *      IN-PLACE, ingen `page.goto`) hade inget eget test — bara NEDÅT-
 *      gränsfallet (review-fynd 3, ovan) var täckt. Nytt sista test i
 *      `GemensamtLage`-sviten: en riktig uppladdning tar en instans från
 *      ESTIMAT till PRECIS, och höjden får (avsiktligt) ÖKA — se
 *      `useLastaListhojd`s "MONOTONIN ÄR RIKTAD, INTE ABSOLUT"-stycke.
 *   3. Tomt-lägets mobila höjd (~400 px, INTE ~622 px) är ETT PRODUKTBESLUT
 *      Marcus kan justera efter helgen (S108 Del 26-frågan), inte en
 *      slutgiltig teknisk sanning — bokfört i `LISTA_FALLBACK_RADHOJD`s
 *      docblock och i PR-beskrivningen, inte bara här.
 */

function bilaga(i: number) {
  return {
    id: `recBilagaHojdlas${String(i).padStart(4, '0')}`,
    namn: `Bilaga ${i}.pdf`,
    storlekBytes: 10_240,
    skapad: '2026-08-20T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Uppladdad',
    rackvidd: 'Event',
    kursfamilj: null,
    kursniva: null,
    plats: null,
  };
}

function gemensamBilaga(i: number) {
  return {
    id: `recGemensamHojdlas${String(i).padStart(4, '0')}`,
    namn: `Delad ${i}.pdf`,
    storlekBytes: 10_240,
    skapad: '2026-08-20T09:00:00.000Z',
    eventId: VISUAL_EVENT_ID,
    dokumentklass: 'Uppladdad',
    // [TASK-338.3, ADR-125 § Beslut 1] `Kurstyp` ÄR `Gemensam` med en
    // familje-axel satt. Läsvägen normaliserar visserligen legacy-värdet
    // (`normaliseraRaAttachment`), men en fixtur ska visa den LEVANDE
    // modellen — annars läser nästa läsare den som en levande form.
    rackvidd: 'Gemensam',
    kursfamilj: 'RIM',
    kursniva: null,
    plats: null,
  };
}

/** EN handler, grenar på `?eventId=` — samma form som `bilagorHandler()` i
 * `dokument-rackviddsval.acceptance.test.ts`, men med KONTROLLERBART antal
 * i vardera grenen (så testerna kan sätta totaltAntal exakt). */
function hojdlasHandler(antalEgna: number, antalGemensamma: number) {
  return http.get(EF('get-event-attachments'), ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (eventId) {
      return json({
        attachments: Array.from({ length: antalEgna }, (_, i) => bilaga(i + 1)),
      });
    }
    return json({
      attachments: Array.from({ length: antalGemensamma }, (_, i) => gemensamBilaga(i + 1)),
    });
  });
}

/**
 * GRÄNSFALLETS handler (review-fynd 3): den GEMENSAMMA grenen returnerar
 * `antalForst` vid FÖRSTA hämtningen och `antalSedan` vid VARJE hämtning
 * därefter — en `useDeleteAttachment`-triggad `invalidateQueries` gör exakt
 * EN andra hämtning, så en enkel 1-vs-resten-räknare räcker (ingen tredje
 * hämtning förväntas i dessa tester).
 */
function gransfallHandler(antalForst: number, antalSedan: number) {
  let hamtningar = 0;
  return http.get(EF('get-event-attachments'), ({ request }) => {
    const eventId = new URL(request.url).searchParams.get('eventId');
    if (eventId) return json({ attachments: [] });
    hamtningar += 1;
    const antal = hamtningar === 1 ? antalForst : antalSedan;
    return json({ attachments: Array.from({ length: antal }, (_, i) => gemensamBilaga(i + 1)) });
  });
}

async function gotoEventlage(page: Page) {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
}

async function gotoRackviddslage(page: Page) {
  await page.goto('/mer/dokument');
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
}

const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

/**
 * `LISTA_FALLBACK_RADHOJD` (`DokumentYta.tsx`) — NIVÅ 3:s enda tal.
 *
 * DUPLICERAS MEDVETET (samma disciplin som talet hade när det var 99): en
 * fallback som bara jämförs mot sig själv bevisar ingenting, så testet bär
 * sin egen kopia och fälls när källan ändras utan att mätningen gjorts om.
 *
 * [T176, 2026-08-29] 99 → 107 → 124, i två steg samma dag. Först föll
 * referensraden bort: 99 var uppmätt på `MallRad`, den enda radform som
 * strukturellt aldrig kunde bryta, och den raden är riven (mallarna är
 * handlingar nu, inte listrader). Referensen blev en BILAGERAD vars
 * namnknapp bär 44 px träffyta — 107 px.
 *
 * Sedan blev raden ett KORT: `<li>` bär `py-1` (8 px ränna) och kortet
 * `p-3` + 1 px kant i stället för `py-2`. UPPMÄTT I DENNA RIGG (inte
 * räknat): `radHojder` = [124, 124, 124, 124] vid 1280 px och
 * [124, 124] vid 375 px, med `hojd` 496 = 124 × 4 i båda fallen. Talet är
 * alltså LI-höjden (kort + ränna), och det är viewport-oberoende av samma
 * skäl som förut: kortet bryter aldrig, det trunkerar.
 *
 * ATT NIVÅ 1, 2 OCH 3 NU GER SAMMA TAL ÄR HELA POÄNGEN MED ATT RÄNNAN BOR
 * I `<li>`: varje rad är exakt lika hög oavsett position, så spannet
 * (NIVÅ 1), MAX-av-radhöjder (NIVÅ 2) och konstanten (NIVÅ 3) landar på
 * 496 px. En tom lista och en full lista delar bounding box exakt.
 */
const FALLBACK_RADHOJD = 124;

/**
 * Tom cache-arrangemang (ADR-072) — persist-nyckeln bort FÖRE app-boot.
 *
 * SAMMA form och skäl som systerfilens `arrangeraTomCache`
 * (`dokument-lista-hojdlas-tidpunkt.acceptance.test.ts`, TASK-309.41), och
 * samma etablerade mönster som `hem-laddlage.acceptance.test.ts` redan bär:
 * test-ARRANGEMANG före start, INTE runtime-tömning (den vägen är
 * `queryClient.clear()`, ADR-072 skyddsräcke 1).
 *
 * Behövs av testet som laddar räckviddsläget TVÅ gånger med olika
 * fixturdata. Båda laddningarna delar `queryKeys.attachments.gemensamma` —
 * en KONSTANT nyckel utan id, så TASK-28:s vanliga fix (distinkta id per
 * scenario) är inte tillämpligt utan att produktionskoden ändras för
 * testets skull. Hinner localStorage-synken fyra mellan laddningarna
 * (throttlad 1 s, `src/queries/persist.ts`) restaureras scenario 1:s svar,
 * och den globala `staleTime` på 5 min (`src/router.ts`) gör det FÄRSKT —
 * ingen bakgrundshämtning, och scenario 2:s rader når aldrig skärmen.
 * Mätt före fixen: 8 av 10 fällda med `--repeat-each=10` (2026-08-29),
 * alltid på `Delad 6.pdf`. Kommentaren vid den andra laddningen sade att
 * `goto` valdes framför `reload()` av stabilitetsskäl; det hjälper inte mot
 * DENNA klass, eftersom båda formerna startar om dokumentet och därmed
 * restaurerar lagringen.
 */
function arrangeraTomCache(page: Page) {
  return page.addInitScript((nyckel) => localStorage.removeItem(nyckel), PERSIST_KEY);
}

/** Mäter listans FULLA geometri i ETT synkront steg — ingen mätning här får
 * bero på VILKET av flera separata `evaluate`-anrop som råkar köras när,
 * annars mäter man mot ett tillstånd som redan hunnit ändra sig.
 *
 * `radHojder` (runda 2, review-fynd 1) — VARJE synligt barns EGEN
 * `getBoundingClientRect().height`, i DOM-ordning. Ger testerna samma
 * underlag som källkodens `useLastaListhojd`s NIVÅ 2 (`Math.max(...)`) —
 * ett test kan därför bevisa "detta ÄR en LÅST fyra-raders-höjd, inte bara
 * innehållets naturliga höjd" genom att jämföra `hojd` mot `Math.max(
 * ...radHojder) * 4`, i stället för att bara mäta "ingen scroll" (sant
 * även för en OLÅST kort lista). */
/**
 * Radens ⋯-meny → posten `etikett`.
 *
 * SELEKTOR-UPPDATERING, INTE EN MILDRAD ASSERT (2026-08-29): radhandlingarna
 * (Ladda ner/Ersätt/Skapa om/Ändra räckvidd/Radera) bodde tidigare som
 * ikonknappar direkt i raden, med filnamnet i `aria-label`
 * ("Radera Delad 5.pdf"). De bor nu i en `Meny` bakom EN ⋯-knapp — menyn bär
 * filnamnet i sitt eget namn ("Fler val för Delad 5.pdf"), posterna bär bara
 * verbet. Det är WAI-ARIA:s egen menygrammatik (kontexten namnger listan,
 * posten namnger handlingen) och samma form GitHub/Drive använder.
 */
async function valjRadhandling(page: Page, namn: string, etikett: string) {
  await page.getByRole('button', { name: `Fler val för ${namn}` }).click();
  await page.getByRole('menuitem', { name: etikett }).click();
}

async function mataGeometri(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => {
    const rund = (n: number) => Math.round(n * 100) / 100;
    const rect = ul.getBoundingClientRect();
    const kort = Array.from(ul.querySelectorAll('[data-testid="dokument-fil"]'));
    const kortRect = (i: number) => {
      const el = kort[i];
      return el ? el.getBoundingClientRect() : null;
    };
    // Innehållsytans nederkant i SAMMA rymd som kortens `bottom` — ytans egen
    // `border-top` plus `clientHeight`. Se systerfilens `kortensLage` för
    // varför `getBoundingClientRect().bottom` ensamt vore fel gräns.
    const innehallBottom =
      rect.top + Number.parseFloat(getComputedStyle(ul).borderTopWidth) + ul.clientHeight;
    const fjarde = kortRect(3);
    const femte = kortRect(4);
    return {
      bredd: rund(rect.width),
      hojd: rund(rect.height),
      scrollHeight: ul.scrollHeight,
      clientHeight: ul.clientHeight,
      scrollTop: ul.scrollTop,
      antalKort: kort.length,
      innehallBottom: rund(innehallBottom),
      fjardeKortBottom: fjarde ? rund(fjarde.bottom) : null,
      femteKortTop: femte ? rund(femte.top) : null,
      sistaKortBottom: kort.length > 0 ? rund(kortRect(kort.length - 1)?.bottom ?? 0) : null,
      radHojder: Array.from(ul.children).map((li) => rund(li.getBoundingClientRect().height)),
    };
  });
}

/**
 * [T176, 2026-08-29] KORT-INVARIANTEN som ersätter separator-assertsen.
 *
 * Före kortformen prövades klippkanten indirekt, via sista radens
 * `border-bottom-width`: en linje som inte syntes betydde "kanten ligger
 * rätt". Korten har inga linjer — rännan mellan dem ÄR avdelaren — så
 * frågan ställs nu direkt i stället: ligger fjärde kortet HELT innanför
 * klippkanten, och femte kortet HELT utanför? Ett HALVT kort är den
 * regression regeln finns för att fånga, och den vore osynlig för en
 * `scrollHeight === clientHeight`-mätning.
 *
 * ±0,5 px tolerans mot sub-pixel-avrundning, samma marginal systerfilens
 * `kortensLage` bär.
 */
function provaKortkanter(g: Awaited<ReturnType<typeof mataGeometri>>) {
  expect(g.fjardeKortBottom).not.toBeNull();
  expect(
    g.fjardeKortBottom ?? 0,
    `fjärde kortet slutar vid ${g.fjardeKortBottom} px, innehållsytan vid ${g.innehallBottom} px`,
  ).toBeLessThanOrEqual(g.innehallBottom + 0.5);
  if (g.femteKortTop !== null) {
    expect(
      g.femteKortTop,
      `femte kortet börjar vid ${g.femteKortTop} px, innehållsytan slutar vid ${g.innehallBottom} px — ett halvt kort får aldrig synas`,
    ).toBeGreaterThanOrEqual(g.innehallBottom - 0.5);
  }
}

test.describe('DokumentLista (eventläge) — låst fyra-radershöjd, nu UTAN filterrad (T176)', () => {
  test('AC #2/#5: EXAKT fyra bilagor — scrollHeight === clientHeight, inget femte kort, inget tabb-stopp (den kritiska gränsen) — desktop', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const fyra = await mataGeometri(page);
    // Regel 3 + AC #2: exakt fyra kort — INGEN scroll, inget femte kort.
    // AC #5 fäller här på 1 px-scroll. Ingen tolerans.
    expect(fyra.scrollHeight).toBe(fyra.clientHeight);
    expect(fyra.antalKort).toBe(4);
    expect(fyra.femteKortTop).toBeNull();
    provaKortkanter(fyra);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
    // BEVISAR LÅSNING, inte bara "ingen scroll": höjden ska vara fyra raders
    // spann, inte innehållets naturliga.
    const maxRadhojd = Math.max(...fyra.radHojder);
    expect(fyra.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4 - 2);
    expect(fyra.hojd).toBeLessThanOrEqual(maxRadhojd * 4 + 4);
  });

  test('AC #1/#2: sju bilagor delar EXAKT samma låsta bounding box som fyra; scrollbart; femte kortet helt utanför kanten', async ({
    page,
    network,
  }) => {
    // TVÅ laddningar av SAMMA route → samma `queryKeys.attachments`-nyckel,
    // därför arrangemanget (se `arrangeraTomCache` för mekanismen och
    // mätningen, TASK-309.41).
    await arrangeraTomCache(page);

    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 4.pdf')).toBeVisible();
    const fyra = await mataGeometri(page);

    network.use(hojdlasHandler(7, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 7.pdf')).toBeVisible();
    const sju = await mataGeometri(page);

    // Regel 2: låsningen är EXAKT fyra raders höjd oavsett hur många fler som
    // väntar bortom kanten — fyra och sju rader delar alltså bounding box.
    expect(sju.bredd).toBe(fyra.bredd);
    expect(sju.hojd).toBe(fyra.hojd);
    // 5+: scrollbart, tabb-stopp finns, och det FEMTE kortet ligger HELT
    // utanför klippkanten — aldrig ett halvt kort (T176:s kort-invariant,
    // se `provaKortkanter`).
    expect(sju.scrollHeight).toBeGreaterThan(sju.clientHeight);
    expect(sju.antalKort).toBe(7);
    provaKortkanter(sju);
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('aria-label', 'Bilagor');
  });

  test('AC #1 / regel 6: samma invariant vid 375 px', async ({ page, network }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await arrangeraTomCache(page);

    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 4.pdf')).toBeVisible();
    const fyra = await mataGeometri(page);
    expect(fyra.scrollHeight).toBe(fyra.clientHeight);
    expect(fyra.femteKortTop).toBeNull();
    provaKortkanter(fyra);

    network.use(hojdlasHandler(7, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 7.pdf')).toBeVisible();
    const sju = await mataGeometri(page);
    expect(sju.bredd).toBe(fyra.bredd);
    expect(sju.hojd).toBe(fyra.hojd);
    expect(sju.scrollHeight).toBeGreaterThan(sju.clientHeight);
    provaKortkanter(sju);
  });

  test('AC #2/#5: fem-plus rader — fjärde kortet helt inne, femte helt ute; scroll till botten når sista kortet', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const lista = page.getByTestId('dokument-lista');
    const foreScroll = await mataGeometri(page);
    expect(foreScroll.scrollTop).toBe(0);
    expect(foreScroll.scrollHeight).toBeGreaterThan(foreScroll.clientHeight);

    // [T176] Vid scrollTop 0: fjärde kortet HELT innanför klippkanten,
    // femte kortet HELT utanför. Det ersätter den tidigare separator-
    // mätningen och prövar samma sak direkt i stället för via en linje.
    provaKortkanter(foreScroll);

    await lista.evaluate((ul) => {
      ul.scrollTo({ top: ul.scrollHeight });
    });
    const efterScroll = await mataGeometri(page);
    expect(efterScroll.scrollTop).toBeGreaterThan(0);
    // Efter scroll till botten är SISTA kortet (kort 6) helt synligt — hela
    // listan har alltså gått att nå, inte bara de fyra första.
    expect(efterScroll.sistaKortBottom).not.toBeNull();
    expect(efterScroll.sistaKortBottom ?? 0).toBeLessThanOrEqual(efterScroll.innehallBottom + 0.5);
  });

  test('AC #1/#3: 0 bilagor — tomt läge inom LÅST höjd (nivå 3, FALLBACK), inga kort, inget tabb-stopp', async ({
    page,
    network,
  }) => {
    // [T176] Före filterrivningen nåddes detta läge via 'bilaga'-filtret på
    // ett event vars mallar/generatorer ändå fyllde 'alla' — nu är det det
    // ÄRLIGA fallet: eventet har inga bilagor, listan har noll RIKTIGA rader,
    // och `useLastaListhojd` faller till NIVÅ 3 (`LISTA_FALLBACK_RADHOJD`).
    network.use(hojdlasHandler(0, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Inga bilagor för det här eventet än.')).toBeVisible();

    const tomt = await mataGeometri(page);
    // `overflow-y-hidden` (regel 3, ≤ 4) gör `scrollHeight === clientHeight`
    // trivialt sant OAVSETT låsning, så den ENSAM bevisar ingenting —
    // höjdvärdet gör. Talet DUPLICERAS medvetet ur källans konstant, samma
    // disciplin som `GemensamtLage`-sviten nedan.
    expect(tomt.scrollHeight).toBe(tomt.clientHeight);
    expect(tomt.antalKort).toBe(0);
    expect(tomt.hojd).toBeGreaterThanOrEqual(FALLBACK_RADHOJD * 4);
    expect(tomt.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + 8);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
  });

  test('AC #3: prefers-contrast: more tänder kortens kanter; axe 0 violations', async ({
    page,
    network,
  }) => {
    // TRE bilagor — 1–3-läget. [T176] Separatorlinjerna är rivna med
    // kortformen; det som ska tändas under `prefers-contrast: more` är
    // KORTENS egen kant (`--mm-bilagekort-border-contrast`, som alias:ar
    // `--mm-border-strong`). Samma invariant, ny bärare: en kortyta som
    // bara skiljs av sin bakgrundston måste få en synlig kant när
    // användaren bett om hög kontrast.
    network.use(hojdlasHandler(3, 0));
    await page.emulateMedia({ contrast: 'more' });
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 3.pdf')).toBeVisible();

    const strongToken = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-border-strong)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });

    const kortetsKant = await page.getByTestId('dokument-lista').evaluate((ul) => {
      const kort = ul.querySelector('[data-testid="dokument-fil"]') as HTMLElement;
      const cs = getComputedStyle(kort);
      return { farg: cs.borderTopColor, bredd: cs.borderTopWidth };
    });
    expect(kortetsKant.farg).toBe(strongToken);
    expect(kortetsKant.bredd).not.toBe('0px');

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="dokument-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('T176: uttoningen syns när listan rullar, försvinner vid botten, och finns aldrig när den inte rullar', async ({
    page,
    network,
  }) => {
    // UTTONINGEN ÄR EN SIGNAL, INTE DEKORATION: prod 2026-08-29 visade sex
    // rader med `scrollHeight 594 / clientHeight 395` utan någon antydan om
    // att två låg under kanten (macOS overlay-scrollbars syns först vid
    // rullning). Den ligger på WRAPPERN, aldrig i `<ul>` — därför prövas
    // också att `<ul>`:ets barnräkning är oförändrad.
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const uttoning = page.getByTestId('lista-uttoning');
    await expect(uttoning).toBeVisible();
    // Uttoningen är ett SYSKON till `<ul>`, inte ett barn — annars hade
    // `useLastaListhojd` räknat den som en rad.
    await expect(page.getByTestId('dokument-lista').getByTestId('lista-uttoning')).toHaveCount(0);
    await expect(page.getByTestId('dokument-lista').locator('> li')).toHaveCount(6);

    await page.getByTestId('dokument-lista').evaluate((ul) => {
      ul.scrollTo({ top: ul.scrollHeight });
    });
    await expect(uttoning).toHaveCount(0);
  });

  test('T176: EXAKT fyra rader bär INGEN uttoning (listan rullar inte)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 4.pdf')).toBeVisible();
    await expect(page.getByTestId('lista-uttoning')).toHaveCount(0);
  });
});

test.describe('GemensamtLage (räckviddsläge) — samma regel (tidigare saknad, TASK-309.24)', () => {
  test('AC #1/#3: 0 rader — tomt läge inom LÅST höjd (nivå 3, FALLBACK), inga kort, axe-rent', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 0));
    await gotoRackviddslage(page);
    await expect(page.getByText('Inga delade dokument än.')).toBeVisible();

    const geometri = await mataGeometri(page);
    // Regel 2 (runda 2): höjden är ALLTID låst, även vid 0 rader — INGEN
    // riktig rad finns att mäta, så `useLastaListhojd` faller till NIVÅ 3
    // (`LISTA_FALLBACK_RADHOJD_DESKTOP`, `DokumentYta.tsx`). Talet
    // DUPLICERAS här medvetet (samma 2026-08-26-mätning som källans egen
    // docblock) — se filhuvudets TÄCKNING-stycke. `overflow-y-hidden`
    // (regel 3, ≤ 4) gör `scrollHeight === clientHeight` trivialt sant
    // OAVSETT låsning, så den ENSAM bevisar ingenting — höjdvärdet gör.
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.antalKort).toBe(0);
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK_RADHOJD * 4);
    // Övre gräns generös (kantjustering + typsnitt/webbläsar-brus) — ändå
    // långt under vad en NATURLIG (o-låst) tomt-lägesrad hade mätt (en
    // enda `py-3`-textrad, typiskt < 60 px), vilket är den regression
    // denna gräns skulle fånga.
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + 8);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="dokument-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #1/#2: 1 rad — LÅST höjd (regel 2: "0–3 rader, luft under"), ETT kort med luft under', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 1));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 1.pdf')).toBeVisible();
    const en = await mataGeometri(page);
    expect(en.scrollHeight).toBe(en.clientHeight);
    expect(en.antalKort).toBe(1);
    // BEVISAR LÅSNING, INTE BARA "INGEN SCROLL" (den senare vore sann även
    // o-låst): höjden ska vara ~4 × den enda radens EGEN uppmätta höjd
    // (NIVÅ 2, ESTIMAT — `useLastaListhojd`s `Math.max`, trivialt en enda
    // rad här), inte ~1 × (radens naturliga, o-låsta höjd).
    const maxRadhojd = Math.max(...en.radHojder);
    expect(en.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4);
    expect(en.hojd).toBeLessThanOrEqual(maxRadhojd * 4 + 8);
  });

  // EGET test, INTE en fortsättning av ovanstående via `page.reload()` —
  // ett `network.use`-omregistrerat svar efter en reload visade sig flakigt
  // (MSW-handlerns nya gren hann inte alltid vinna före sidans egen
  // laddning), samma klass av instabilitet som redan är dokumenterad för
  // `dokument-rackviddsval.acceptance.test.ts`s filbytesmönster. En fräsch
  // `goto` per test är den etablerade, stabila vägen.
  test('AC #1/#2: 3 rader — LÅST höjd, tre kort med luft under', async ({ page, network }) => {
    network.use(hojdlasHandler(0, 3));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 3.pdf')).toBeVisible();
    const tre = await mataGeometri(page);
    expect(tre.scrollHeight).toBe(tre.clientHeight);
    expect(tre.antalKort).toBe(3);
    const maxRadhojd = Math.max(...tre.radHojder);
    expect(tre.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4);
    expect(tre.hojd).toBeLessThanOrEqual(maxRadhojd * 4 + 8);
  });

  test('AC #2/#5: exakt 4 rader — scrollHeight === clientHeight, inget femte kort, inget tabb-stopp (den kritiska gränsen)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 4));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight); // AC #5: fäller på 1 px-scroll
    expect(geometri.antalKort).toBe(4);
    expect(geometri.femteKortTop).toBeNull();
    provaKortkanter(geometri);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
  });

  test('AC #1/#2: 5 och 6 rader delar EXAKT samma låsta bounding box; scrollbart; femte kortet helt utanför kanten', async ({
    page,
    network,
  }) => {
    // ENDA testet i filen med TVÅ laddningar, och därför det enda som
    // behöver arrangemanget — se `arrangeraTomCache` för mekanismen och
    // mätningen (TASK-309.41).
    await arrangeraTomCache(page);

    network.use(hojdlasHandler(0, 5));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 5.pdf')).toBeVisible();
    const fem = await mataGeometri(page);
    expect(fem.scrollHeight).toBeGreaterThan(fem.clientHeight);
    provaKortkanter(fem);
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute(
      'aria-label',
      'Delade bilagor',
    );

    // `goto` i stället för `reload()` — samma stabilitetsskäl som
    // 1/3-radertestets kommentar ovan.
    network.use(hojdlasHandler(0, 6));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 6.pdf')).toBeVisible();
    const sex = await mataGeometri(page);
    // Regel 2: låsningen är EXAKT fyra raders höjd oavsett hur många fler
    // som väntar bortom kanten — 5 och 6 rader ska alltså dela bounding box.
    expect(sex.bredd).toBe(fem.bredd);
    expect(sex.hojd).toBe(fem.hojd);
    expect(sex.scrollHeight).toBeGreaterThan(sex.clientHeight);
    provaKortkanter(sex);
  });

  test('AC #2 gränsfall (review-fynd 3): radantalet minskar IN-PLACE via en riktig Radera-åtgärd (ingen page.goto) — höjden fryser vid den PRECISA mätningen', async ({
    page,
    network,
  }) => {
    // 5 → 3: FÖRSTA hämtningen ger 5 rader (>= LISTA_SYNLIGA_RADER, NIVÅ 1
    // PRECIS omedelbart). `useDeleteAttachment`s `onSettled` invaliderar
    // `queryKeys.attachments.all` OAVSETT utfall, vilket triggar EXAKT en
    // andra hämtning — den returnerar 3 (under gränsen).
    network.use(gransfallHandler(5, 3));
    network.use(http.post(EF('delete-attachment'), () => json({ deleted: true })));

    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 5.pdf')).toBeVisible();

    const fore = await mataGeometri(page);
    expect(fore.scrollHeight).toBeGreaterThan(fore.clientHeight); // 5 rader: scrollbart

    await valjRadhandling(page, 'Delad 5.pdf', 'Radera');
    // Väntar in refetchen (den nya, kortare listan) — `not.toBeVisible()`
    // pollar tills DOM:en faktiskt hunnit uppdateras.
    //
    // [TASK-309.40, kö-fynd 2026-08-29] SKOPAD till `dokument-lista` — ett
    // OSKOPAT `page.getByText('Delad 5.pdf')` matchar även
    // `alertScreenReader`s SR-only `<p>` (`useDeleteAttachment.ts`:
    // `${namn} har raderats`), som lever i `document.body` UTANFÖR listan
    // i exakt 1000 ms (100–1100 ms efter mutationen, `alert-screen-reader.ts`
    // § APPEND_DELAY/REMOVE_DELAY). Träffar assertionen det fönstret ger
    // lokatorn TVÅ element och Playwright kastar strict-mode-fel i stället
    // för att fortsätta polla — reproducerat 2/10 (kö-trädet) och 1/10
    // (ren `main`, UTAN TASK-309.40s ändring — alltså förprogrammerat i
    // denna testfil, inte orsakat av den skivan). Scopet utesluter
    // announcer-noden helt: den ligger aldrig under `dokument-lista`.
    await expect(page.getByTestId('dokument-lista').getByText('Delad 5.pdf')).not.toBeVisible();

    const efter = await mataGeometri(page);
    // MONOTON PRECISION (`harPreciserMatt`, `useLastaListhojd`s filhuvud,
    // "PRECISIONEN ÄR MONOTON"-stycket): 3 < LISTA_SYNLIGA_RADER hade UTAN
    // spärren gett en NY, SÄMRE estimat-mätning — höjden ska i stället stå
    // EXAKT KVAR vid den precisa 5-raders-mätningen. Detta ÄR testet
    // review-fynd 3 efterfrågade ("radera en bilaga så listan går 5 → 3").
    expect(efter.hojd).toBe(fore.hojd);
    expect(efter.bredd).toBe(fore.bredd);
    // 3 rader ryms nu inom den FRUSNA höjden — ingen scroll längre.
    expect(efter.scrollHeight).toBe(efter.clientHeight);
    // [T176] Tre kort kvar, alla helt synliga inom den frusna höjden — det
    // som förut prövades via sista radens återkomna separatorlinje.
    expect(efter.antalKort).toBe(3);
    expect(efter.sistaKortBottom ?? 0).toBeLessThanOrEqual(efter.innehallBottom + 0.5);
  });

  test('AC #2 gränsfall (NIVÅ 2 → NIVÅ 1, orkestrerar-fynd runda 2 andra varvet): en fjärde RIKTIG rad dyker upp in-place (uppladdning, ingen page.goto) — höjden får ÖKA till den precisa mätningen', async ({
    page,
    network,
  }) => {
    // 3 → 4: FÖRSTA hämtningen ger 3 rader (NIVÅ 2, ESTIMAT). En lyckad
    // uppladdning (`useUploadAttachment`s `onSettled`) invaliderar HELA
    // `attachments`-prefixet oavsett utfall — EXAKT en andra hämtning,
    // som returnerar 4 (korsar tröskeln till NIVÅ 1, PRECIS).
    network.use(gransfallHandler(3, 4));
    network.use(http.post(EF('upload-attachment'), () => json({ attachment: gemensamBilaga(4) })));

    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 3.pdf')).toBeVisible();

    const fore = await mataGeometri(page);
    // 3 rader, NIVÅ 2 (ESTIMAT): ingen scroll — samma signatur som det
    // separata "3 rader"-testet ovan.
    expect(fore.scrollHeight).toBe(fore.clientHeight);

    // Ladda upp en fjärde GEMENSAM bilaga, ingen `page.goto` — samma
    // FileTrigger-väg som `dokument-rackviddsval.acceptance.test.ts`s
    // `oppnaRackviddsdialog`.
    //
    // [TASK-338.3] INGET RADIOKLICK BEHÖVS LÄNGRE. Testet klickade tidigare
    // radion "Alla event"; den räckvidden finns inte som eget val sedan
    // ADR-125 § 1 (den ÄR "Delat dokument" utan satta axlar). I
    // räckviddsläget är dessutom "Bara detta event" avstängd — inget event
    // att koppla mot — så dialogen öppnar redan förvald på "Delat dokument"
    // med noll axlar, vilket är exakt den räckvidd detta test vill ha.
    await page
      .getByTestId('ladda-upp-ny-fil')
      .locator('input[type="file"]')
      .setInputFiles({
        name: 'Ny.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 acceptance-fixtur'),
      });
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Förvalet ÄR den räckvidd testet behöver — assertat, inte antaget, så
    // en framtida ändring av defaultlogiken fälls här i stället för att
    // tyst ladda upp med fel räckvidd.
    await expect(
      dialog.getByRole('radio', { name: 'Delat dokument - gäller flera event' }),
    ).toBeChecked();
    await dialog.getByRole('button', { name: 'Ladda upp' }).click();
    await expect(dialog).not.toBeVisible();
    // [TASK-309.40, kö-fynd 2026-08-29] SKOPAD — samma rotorsak som
    // Radera-testets kommentar ovan i denna fil: `alertScreenReader`s
    // SR-only `<p>` ("Delad 4.pdf har laddats upp",
    // `useUploadAttachment.ts`) lever i `document.body`, utanför listan, i
    // ett 1000 ms-fönster efter mutationen och kan annars kollidera med
    // listradens EGNA "Delad 4.pdf"-text i ett oskopat sök.
    await expect(page.getByTestId('dokument-lista').getByText('Delad 4.pdf')).toBeVisible();

    const efter = await mataGeometri(page);
    // Oberoende, FRÅN TESTET SJÄLVT beräknad PRECIS-referens — SAMMA
    // matematik som källans NIVÅ 1 (`useLastaListhojd`s `mat()`), men
    // räknad direkt mot DOM:en i stället för att läsa appens interna
    // state. Bevisar att appen FAKTISKT applicerat en precis mätning, inte
    // bara "något större".
    const referens = await page.getByTestId('dokument-lista').evaluate((ul) => {
      const kant = getComputedStyle(ul);
      const kantjustering =
        Number.parseFloat(kant.borderTopWidth) + Number.parseFloat(kant.borderBottomWidth);
      const forsta = ul.children[0].getBoundingClientRect();
      const fjarde = ul.children[3].getBoundingClientRect();
      return fjarde.bottom - forsta.top + kantjustering;
    });
    // Regel 5 gäller FILTERBYTE — detta är INGET filterbyte, det är en mätning
    // av VERKLIGT innehåll som nu går att mäta precist. Se `useLastaListhojd`s
    // "MONOTONIN ÄR RIKTAD, INTE ABSOLUT"-stycke: detta är det ENDA läget
    // höjden får ändras utan att en `ResizeObserver` på en BEFINTLIG rad
    // triggat om.
    //
    // ≤ 1 PX-TOLERANS PÅ "ÖKAR" — SAMMA KÄNDA KVIRK SOM ALDRIG STÄNGS UTE,
    // ALDRIG DÖLJS (se `AC #1/#5`-testets docblock ovan för hela diagnosen):
    // `fore` mättes med 3 SYSKON i DOM (ESTIMAT), `efter` med 4 (PRECIS) —
    // olika sub-pixel-avrundning för en OFÖRÄNDRAD radform ger ±1 px, precis
    // som 'alla' kontra 'bilaga' gör i eventläget. Mätt HÄR: 398 → 397 (en
    // MINSKNING på exakt 1 px), inte en ökning — toleransen fångar ändå en
    // riktig regression (t.ex. en helt utebliven NIVÅ 1-mätning), eftersom
    // EN sådan hade gett en helt annan (mindre) `hojd`, inte en 1 px-skillnad
    // åt fel håll. Den RIGGOROSA bevisningen är nästa rad — `referens` är
    // beräknad OBEROENDE av appens state, direkt mot DOM:en efter uppladdningen.
    expect(efter.hojd).toBeGreaterThanOrEqual(fore.hojd - 1);
    expect(efter.hojd).toBeCloseTo(referens, 1);
    expect(efter.scrollHeight).toBe(efter.clientHeight); // exakt 4: ingen scroll
    expect(efter.antalKort).toBe(4); // exakt 4: inget femte kort
    expect(efter.femteKortTop).toBeNull();
    provaKortkanter(efter);
  });
});

test.describe('GemensamtLage vid 375 px — samma tre nivåer som desktop (review-fynd, runda 2 andra varvet)', () => {
  test('NIVÅ 3 (FALLBACK): 0 rader — låst höjd, INTE den bruta radformens 622 px', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(hojdlasHandler(0, 0));
    await gotoRackviddslage(page);
    await expect(page.getByText('Inga delade dokument än.')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.antalKort).toBe(0);
    // `LISTA_FALLBACK_RADHOJD` (EN konstant, se `DokumentYta.tsx`s docblock
    // och `FALLBACK_RADHOJD` ovan) × 4 — INTE ~622 px, som en fallback
    // baserad på en BRUTEN `GemensamBilageRadRow`-rad hade gett. [T176]
    // Talet är 124 (kort + ränna) och `<ul>` bär ingen kant längre, så
    // väntad höjd är exakt 496 px.
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK_RADHOJD * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + 8);
  });

  test('NIVÅ 2 (ESTIMAT): 2 rader — låst höjd bevisad mot radens EGEN uppmätta höjd', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(hojdlasHandler(0, 2));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 2.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.antalKort).toBe(2);
    // Samma "bevisar LÅSNING, inte bara ingen scroll"-mönster som desktop-
    // testerna ovan: `hojd` ska vara ~4× radens EGNA uppmätta höjd, inte
    // listans naturliga 2-radershöjd.
    const maxRadhojd = Math.max(...geometri.radHojder);
    expect(geometri.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(maxRadhojd * 4 + 8);
  });

  test('NIVÅ 1 (PRECIS): 5 rader — scrollbart, samma exakta geometri-invariant som desktop', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(hojdlasHandler(0, 5));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 5.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBeGreaterThan(geometri.clientHeight);
    provaKortkanter(geometri);
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
  });
});
