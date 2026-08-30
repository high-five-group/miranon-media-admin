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
 * Sedan blev raden ett KORT: kortet bär `p-3` + 1 px kant, och `<li>` bär
 * rännan. UPPMÄTT I DENNA RIGG (inte räknat): `radHojder` = [124, …] vid
 * både 1280 px och 375 px. `<li>` är alltså 124 px (kort 116 + ränna 8), och
 * det är viewport-oberoende av samma skäl som förut: kortet bryter aldrig,
 * det trunkerar.
 *
 * ═══ [TASK-309.46, 2026-08-30] 124 → 122: KONSTANTEN ÄR INTE LI-HÖJDEN ═══
 *
 * `<li>` är fortfarande 124. Konstanten är det inte, och skillnaden är hela
 * skivan: rännan ligger sedan dess som en TRANSPARENT `border-bottom` på
 * raden i stället för som `pt-2`, och hooken DRAR BORT den fjärde radens
 * ränna ur låset (`separatorBredd` läser `border-bottom-width`). Låset är
 * därmed **488** = rad1.top → rad4.bottom, och `senastUppmattRadhojd` — som
 * NIVÅ 3 läser, och som denna konstant är reserv för — bär den
 * SEPARATOR-FRIA per-rad-höjden 488 / 4 = **122**.
 *
 * SKÄLET TILL FLYTTEN var inte höjden utan SPÅRET: rullningslistens spår
 * spänner `<ul>`:ets padding-box, så en ränna som padding låg innanför det —
 * även ovanför FÖRSTA kortet. Mätt i prod: `ul.top` 303 mot `kort1.top` 311.
 * Marcus: *"den bör ju börja vid kortet precis."*
 *
 * SKRIV ALDRIG TILLBAKA 124 HÄR "för att li är 124" — se källans egen
 * varning i `LISTA_FALLBACK_RADHOJD`s docblock. Li-höjden och den lagrade
 * per-rad-höjden är olika tal så fort raden bär en separator.
 *
 * ATT NIVÅ 1, 2 OCH 3 GER SAMMA TAL ÄR HELA POÄNGEN MED ATT RÄNNAN BOR
 * I `<li>`: varje rad är exakt lika hög oavsett position, så spannet minus
 * fjärde radens ränna (NIVÅ 1), MAX-av-radhöjder minus radens ränna
 * (NIVÅ 2) och konstanten × 4 (NIVÅ 3) landar alla på 488 px. En tom lista
 * och en full lista delar bounding box exakt.
 */
const FALLBACK_RADHOJD = 122;

/**
 * [TASK-309.46] RÄNNAN MELLAN KORTEN, i px — radens transparenta
 * `border-bottom` (`border-b-8`).
 *
 * DUPLICERAS MEDVETET, samma disciplin som `FALLBACK_RADHOJD` ovan. Hookens
 * NIVÅ 1 och 2 DRAR BORT den sista mätta radens ränna ur låset
 * (`separatorBredd` läser `border-bottom-width`): fyra radhöjder innehåller
 * fyra rännor, men bara TRE ligger mellan rader. En assertion mot
 * `radhöjd × 4` UTAN avdrag kodar därför den form som gällde när rännan var
 * en padding och separatorn 0 px — den var sann av en slump, inte av regeln.
 *
 * Talet står här så att en ändring av rännan fäller testerna i stället för
 * att tyst göra dem till tautologier.
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
 * ...radHojder) * 4 − RANNA`, i stället för att bara mäta "ingen scroll" (sant
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
      overflowY: getComputedStyle(ul).overflowY,
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
/**
 * ═══ [TASK-309.46] EXAKT FYRA RADER — DEN KRITISKA GRÄNSEN, OMFORMULERAD ═══
 *
 * Här stod `expect(scrollHeight).toBe(clientHeight)` med kommentaren *"AC #5
 * fäller här på 1 px-scroll. Ingen tolerans."* Den formen var rätt så länge
 * rännan var en PADDING: fyra rader mätte då 496 px innehåll i en 496 px låst
 * box, och varje avvikelse betydde att något klipptes.
 *
 * SEDAN RÄNNAN BLEV EN TRANSPARENT `border-bottom` GÄLLER DET INTE LÄNGRE, och
 * det är MED AVSIKT: låset EXKLUDERAR fjärde radens ränna (det är hela skälet
 * spåret nu börjar vid kortet och slutar vid kortet), medan rännan fortfarande
 * ligger kvar i innehållet. Fyra rader mäter alltså 496 px innehåll i en
 * 488 px box — 8 px övermått som ÄR den transparenta rännan, inget annat.
 *
 * DET GAMLA TESTET SKULLE ALLTSÅ FÄLLA PÅ EN KORREKT APP. Men att bara ta bort
 * det vore att tappa gränsfallet, så invarianten skrivs i stället UT — och blir
 * strängare än den var, inte mildare. Tre påståenden i stället för ett:
 *
 *   1. LISTAN KAN INTE RULLAS. `overflow-y` är `hidden` vid fyra rader
 *      (`kanRulla` är falskt), så ingen scrollbar visas och ingenting går att
 *      rulla bort. Det är den EGENSKAP AC #5 handlade om.
 *   2. ÖVERMÅTTET ÄR EXAKT EN RÄNNA. `scrollHeight − clientHeight === RANNA`
 *      pinnar både talet och dess orsak. Blir det 9 px, eller 0, har något i
 *      ränn-geometrin ändrats och testet fäller.
 *   3. INGENTING SYNLIGT KLIPPS. `provaKortkanter` (fjärde kortet helt innanför
 *      kanten) plus att det inte finns något femte kort.
 *
 * En regression som klipper ett halvt kort fälls fortfarande av (3), en som
 * gör listan rullbar vid fyra rader av (1), och en som råkar lägga en HEL
 * extra rad i innehållet av (2).
 */
function provaExaktFyraRader(g: Awaited<ReturnType<typeof mataGeometri>>) {
  expect(g.antalKort, 'exakt fyra kort').toBe(4);
  expect(g.femteKortTop, 'inget femte kort att klippa').toBeNull();
  expect(g.overflowY, 'vid fyra rader ska listan inte kunna rullas alls').toBe('hidden');
  expect(
    g.scrollHeight - g.clientHeight,
    `övermåttet ska vara EXAKT fjärde radens transparenta ränna — mätt ${g.scrollHeight} − ${g.clientHeight}`,
  ).toBe(RANNA);
  provaKortkanter(g);
}

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
    provaExaktFyraRader(fyra);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
    // BEVISAR LÅSNING, inte bara "ingen scroll": höjden ska vara fyra raders
    // spann, inte innehållets naturliga.
    const maxRadhojd = Math.max(...fyra.radHojder);
    expect(fyra.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4 - RANNA - 2);
    expect(fyra.hojd).toBeLessThanOrEqual(maxRadhojd * 4 - RANNA + 4);
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
    provaExaktFyraRader(fyra);

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
    expect(tomt.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + TOLERANS);
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

/**
 * ═══ TASK-309.43:s TRE BETEENDEN — PERMANENTA ASSERTIONER ═══
 *
 * Granskarfynd på PR #2128 (runda 1, info/auto-fix), taget i TASK-309.44:s PR
 * eftersom den redan rör denna svit: 309.43 landade tre mätta beteenden —
 * ingen hover-ton på kortet, reserverad ränna i BÅDA overflow-lägena, och en
 * rullningsskugga vars högerkant är låst till den MÄTTA rännbredden — men
 * ingen av dem hade en assertion. Sviten prövade bara att `lista-uttoning`
 * VISAS respektive DÖLJS, aldrig dess geometri, och kortets bakgrund prövades
 * inte alls. Tre beteenden vars enda bevis var en engångsmätning i en agents
 * scratchpad är tre beteenden som kan tyst regrediera.
 *
 * ═══ VARFÖR TALET 11 INTE LÅSES — OCH VAD SOM LÅSES I STÄLLET ═══
 *
 * Rännans bredd i px är en EGENSKAP HOS PLATTFORMEN, inte hos vår kod:
 * `scrollbar-gutter: stable` reserverar plats för en KLASSISK scrollbar, och
 * hur bred den är avgörs av operativsystem och webbläsarbygge (CSS Overflow
 * Module Level 3 säger ingenting om talet). 309.43 mätte 11 px i denna rigg på
 * macOS; Linux-Chromium i CI kan mycket väl ge ett annat tal, och ett test som
 * låser 11 hade då fällt en GRÖN app — precis den falska signal
 * `CONTRIBUTING.md` § Rött-först finns för att förhindra.
 *
 * INVARIANTEN ÄR STABILITETEN, och den är vår: rännan ska vara reserverad
 * (> 0) och EXAKT LIKA BRED i `overflow-y: auto` (fler än fyra kort) som i
 * `hidden` (fyra eller färre), så att kortbredden inte hoppar när listan får
 * sin femte post. Det var hela skälet till att `stable` valdes — se
 * `DokumentYta.tsx` § LISTANS RAM, där det gamla motsatta påståendet också
 * står rättat mot mätning.
 *
 * KÄND KANT, bokförd i stället för dold: `> 0` förutsätter att riggens
 * webbläsare använder KLASSISKA scrollbars. En miljö med overlay-scrollbars
 * (riktiga mobiler, Firefox) reserverar per spec ingenting — där är 0 rätt
 * svar och skuggan går ut i full bredd (kodvägen finns, `DokumentListRam`).
 * Den miljön finns inte i acceptance-klassen, så testet nedan prövar den
 * inte; skulle riggen någon gång byta till overlay är rätt åtgärd att pröva
 * BÅDA utfallen, aldrig att mildra assertionen till `>= 0`.
 */
test.describe('TASK-309.43:s beteenden — hover-ton, reserverad ränna, skuggans högerkant', () => {
  /** `<ul>`:ets ränna + kortets och skuggans kanter, i ETT synkront steg. */
  async function mataRanna(page: Page) {
    return page.evaluate(() => {
      const rund = (n: number) => Math.round(n * 100) / 100;
      const ul = document.querySelector('[data-testid="dokument-lista"]') as HTMLElement | null;
      if (!ul) return null;
      const kort = ul.querySelector('[data-testid="dokument-fil"]');
      const skugga = document.querySelector('[data-testid="lista-uttoning"]');
      return {
        // `borderLeft/RightWidth` är 0 på `<ul>` sedan T176, så
        // `offsetWidth − clientWidth` ÄR rännan — ingen kant att dra bort.
        // Mätt i 309.43; prövas här igen så slutsatsen inte tyst blir falsk.
        kantBredd:
          Number.parseFloat(getComputedStyle(ul).borderLeftWidth) +
          Number.parseFloat(getComputedStyle(ul).borderRightWidth),
        ranna: ul.offsetWidth - ul.clientWidth,
        overflowY: getComputedStyle(ul).overflowY,
        kortBredd: kort ? rund(kort.getBoundingClientRect().width) : null,
        kortHoger: kort ? rund(kort.getBoundingClientRect().right) : null,
        skuggaHoger: skugga ? rund(skugga.getBoundingClientRect().right) : null,
      };
    });
  }

  test('kortet bär INGEN hover-ton: background-color är identisk i vila och under hover', async ({
    page,
    network,
  }) => {
    // Marcus 2026-08-30: *"Ta bort hover på korten."* Tonen
    // (`--mm-bilagekort-bg-hover`, #edeee9) är riven ur BÅDE klassen och
    // `components.css`. Assertionen är tvåsidig i sak: samma element, samma
    // egenskap, före och under hover — en återinförd ton fälls oavsett vilken
    // den är, och `toHaveCSS` retryar så en eventuell övergång hinner landa
    // innan mätningen läses (`transition-colors` revs i 309.43, men den
    // egenskapen är inte denna assertions att lita på).
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const kort = page.getByTestId('dokument-fil').first();
    const vila = await kort.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(vila).toBe('rgb(255, 255, 255)');

    await kort.hover();
    await expect(kort).toHaveCSS('background-color', vila);
  });

  test('rännan är RESERVERAD och LIKA BRED i båda overflow-lägena — kortbredden hoppar aldrig', async ({
    page,
    network,
  }) => {
    // TVÅ laddningar ⇒ samma cache-arrangemang som filens 5-vs-6-test.
    await arrangeraTomCache(page);

    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    const rullar = await mataRanna(page);
    expect(rullar).not.toBeNull();
    expect(rullar?.overflowY).toBe('auto');

    network.use(hojdlasHandler(3, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 3.pdf')).toBeVisible();
    const rullarInte = await mataRanna(page);
    expect(rullarInte).not.toBeNull();
    expect(rullarInte?.overflowY).toBe('hidden');

    // `offsetWidth − clientWidth` ÄR rännan bara så länge `<ul>` är kantlös.
    expect(rullar?.kantBredd, '<ul> ska sakna kant sedan T176').toBe(0);
    expect(rullarInte?.kantBredd).toBe(0);

    // Reserverad — talet självt är plattformens, se describe-docblocket.
    expect(
      rullar?.ranna ?? 0,
      `rännan ska vara reserverad i overflow auto (mätt ${rullar?.ranna} px)`,
    ).toBeGreaterThan(0);
    // …och EXAKT lika bred när listan inte rullar. Det är invarianten.
    expect(
      rullarInte?.ranna,
      `rännan ska vara lika bred i hidden (${rullarInte?.ranna} px) som i auto (${rullar?.ranna} px)`,
    ).toBe(rullar?.ranna);
    expect(
      rullarInte?.kortBredd,
      'kortbredden får inte hoppa när listan går från fler än fyra till färre',
    ).toBe(rullar?.kortBredd);
  });

  test('rullningsskuggan slutar vid KORTETS högerkant, inte vid rännans', async ({
    page,
    network,
  }) => {
    // Marcus 2026-08-30: *"sitter den inuti listytan så blir det fult med
    // skuggningen längst ner."* Skuggans `right` sätts i en `useLayoutEffect`
    // ur den MÄTTA rännbredden — aldrig ur ett hårdkodat tal — så assertionen
    // jämför två renderade kanter mot varandra i stället för mot en konstant.
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    await expect(page.getByTestId('lista-uttoning')).toBeVisible();

    const g = await mataRanna(page);
    expect(g?.skuggaHoger).not.toBeNull();
    expect(
      Math.abs((g?.skuggaHoger ?? 0) - (g?.kortHoger ?? 0)),
      `skuggan slutar vid ${g?.skuggaHoger} px, kortet vid ${g?.kortHoger} px — skuggan får aldrig lägga sig över rännan`,
    ).toBeLessThanOrEqual(1);
  });

  /**
   * [TASK-309.45] TRE KANTER SOM MÅSTE SAMMANFALLA — fjärde kortets, `<ul>`:ets
   * och skuggans underkant.
   *
   * Marcus 5173-granskning 2026-08-30: *"skuggan längst ner ser konstig ut när
   * man scrollar."* Orsaken var 4 px: radens ränna låg som `py-1` (en halv över,
   * en halv under), så `<ul>`:ets underkant hamnade 4 px UNDER fjärde kortets.
   * I VILA syntes det inte — där ligger bara grå behållarton i mellanrummet —
   * men MITT I EN RULLNING klipper `<ul>` sitt innehåll vid sin egen kant, och
   * då stack en vit remsa av det klippta kortet ut under skuggans rundade hörn,
   * med rak kant tvärs över ett i övrigt runt kort.
   *
   * Rännan ligger sedan TASK-309.46 som en transparent `border-bottom` på
   * raden, och hooken drar bort den fjärde radens ur låset, så de tre
   * kanterna är samma tal. (Mellansteget 309.45 nådde samma underkant med
   * `pt-2` + `-mt-2`; det som ändrades i 309.46 var `<ul>`:ets ÖVERkant —
   * se spår-testet nedan.) Assertionen låser just det: inte "skuggan finns"
   * (det prövas ovan) utan att de tre sammanfaller, vilket är det enda som gör
   * klippningen osynlig.
   *
   * `<ul>` bär dessutom `rounded-2xl` så klippningen följer KORTETS radie i
   * stället för att vara rak — utan den hade fixen bytt en vit remsa mot ett
   * fyrkantigt hörn på ett runt kort.
   *
   * ±1 px mot sub-pixel-avrundning, samma marginal som filens övriga
   * kantjämförelser.
   */
  test('fjärde kortets, listboxens och skuggans underkant SAMMANFALLER (annars klipps kortet fyrkantigt vid rullning)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    await expect(page.getByTestId('lista-uttoning')).toBeVisible();

    const kanter = await page.evaluate(() => {
      const rund = (n: number) => Math.round(n * 100) / 100;
      const ul = document.querySelector('[data-testid="dokument-lista"]') as HTMLElement | null;
      if (!ul) return null;
      const kort = Array.from(ul.querySelectorAll('[data-testid="dokument-fil"]'));
      const skugga = document.querySelector('[data-testid="lista-uttoning"]');
      return {
        ulBottom: rund(ul.getBoundingClientRect().bottom),
        kort4Bottom: kort[3] ? rund(kort[3].getBoundingClientRect().bottom) : null,
        kort5Top: kort[4] ? rund(kort[4].getBoundingClientRect().top) : null,
        skuggaBottom: skugga ? rund(skugga.getBoundingClientRect().bottom) : null,
        // Klippningen ska följa kortens radie, inte vara rak.
        ulRadieBotten: Number.parseFloat(getComputedStyle(ul).borderBottomLeftRadius),
      };
    });

    expect(kanter).not.toBeNull();
    expect(kanter?.kort4Bottom).not.toBeNull();
    expect(kanter?.skuggaBottom).not.toBeNull();

    expect(
      Math.abs((kanter?.kort4Bottom ?? 0) - (kanter?.ulBottom ?? 0)),
      `fjärde kortet slutar vid ${kanter?.kort4Bottom} px, listboxen vid ${kanter?.ulBottom} px — varje px emellan blir en klippt remsa vid rullning`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs((kanter?.skuggaBottom ?? 0) - (kanter?.ulBottom ?? 0)),
      `skuggan slutar vid ${kanter?.skuggaBottom} px, listboxen vid ${kanter?.ulBottom} px`,
    ).toBeLessThanOrEqual(1);
    expect(
      kanter?.ulRadieBotten ?? 0,
      'listboxen ska klippa med kortens radie, inte rakt',
    ).toBeGreaterThan(0);

    // Femte kortet ligger fortfarande HELT utanför — fixen får inte ha
    // förskjutit klippkanten så att ett halvt kort blir synligt.
    expect(kanter?.kort5Top ?? 0).toBeGreaterThanOrEqual((kanter?.ulBottom ?? 0) - 0.5);
  });

  /**
   * [TASK-309.46] RULLNINGSLISTENS SPÅR BÖRJAR VID FÖRSTA KORTET.
   *
   * Marcus prod-titt 2026-08-30: *"scrollbaren … börjar för högt upp, den bör
   * ju börja vid kortet precis."* Mätt i prod före fixen: `ul.top` 303 mot
   * `kort1.top` 311 — 8 px.
   *
   * SPÅRET ÄR `<ul>`:ETS PADDING-BOX, och det är därför testet mäter `<ul>`
   * och inte scrollbaren: en scrollbar-tumme går inte att läsa ur DOM, och
   * riggens headless Chromium målar ingen. Padding-boxens överkant ÄR spårets
   * början — mät den, så är frågan besvarad utan att bero på en tumme.
   *
   * ORSAKEN VAR EN BOXMODELL-DETALJ: rännan låg som `padding-top` på raden,
   * alltså INNANFÖR padding-boxen, även ovanför första kortet. Som transparent
   * `border-bottom` ligger den utanför. Samma 8 px, andra sidan av kanten.
   *
   * TILLSAMMANS MED testet ovan (underkanterna sammanfaller) låser de två
   * assertionerna HELA spåret: det börjar vid första kortets överkant och
   * slutar vid fjärde kortets underkant.
   */
  test('rullningslistens spår börjar vid FÖRSTA KORTETS överkant (ul.top === kort1.top)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const topp = await page.evaluate(() => {
      const rund = (n: number) => Math.round(n * 100) / 100;
      const ul = document.querySelector('[data-testid="dokument-lista"]') as HTMLElement | null;
      if (!ul) return null;
      const kort1 = ul.querySelector('[data-testid="dokument-fil"]');
      const li1 = ul.firstElementChild;
      const cs = li1 ? getComputedStyle(li1) : null;
      return {
        ulTop: rund(ul.getBoundingClientRect().top),
        kort1Top: kort1 ? rund(kort1.getBoundingClientRect().top) : null,
        // Rännan SKA vara en border, inte en padding — annars ligger den
        // innanför padding-boxen igen nästa gång någon "städar".
        liPaddingTop: cs ? cs.paddingTop : null,
        liBorderBottom: cs ? cs.borderBottomWidth : null,
      };
    });

    expect(topp).not.toBeNull();
    expect(topp?.kort1Top).not.toBeNull();
    expect(
      Math.abs((topp?.ulTop ?? 0) - (topp?.kort1Top ?? 0)),
      `spåret börjar vid ${topp?.ulTop} px, första kortet vid ${topp?.kort1Top} px`,
    ).toBeLessThanOrEqual(1);
    expect(topp?.liPaddingTop, 'rännan får inte ligga som padding — då hamnar den i spåret').toBe(
      '0px',
    );
    expect(Number.parseFloat(topp?.liBorderBottom ?? '0')).toBeGreaterThan(0);
  });
});

test.describe('GemensamtLage (räckviddsläge) — samma regel (tidigare saknad, TASK-309.24)', () => {
  test('AC #1/#3: 0 rader — tomt läge inom LÅST höjd (nivå 3, FALLBACK), inga kort, axe-rent', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 0));
    await gotoRackviddslage(page);
    await expect(page.getByText('Inga delade bilagor än.')).toBeVisible();

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
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + TOLERANS);
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
    expect(en.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4 - RANNA);
    expect(en.hojd).toBeLessThanOrEqual(maxRadhojd * 4 - RANNA + 8);
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
    expect(tre.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4 - RANNA);
    expect(tre.hojd).toBeLessThanOrEqual(maxRadhojd * 4 - RANNA + 8);
  });

  test('AC #2/#5: exakt 4 rader — scrollHeight === clientHeight, inget femte kort, inget tabb-stopp (den kritiska gränsen)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 4));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    provaExaktFyraRader(geometri);
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

  /**
   * [TASK-309.46] ÖVERGÅNGEN RADER → NOLL RADER — hookens latenta
   * separator-fel, gjort synligt och rättat.
   *
   * NIVÅ 2 lagrade `senastUppmattRadhojd = radhojd` RAKT AV, med radens egen
   * separator kvar, trots att den drar bort separatorn i samma andetag när
   * den sätter höjden — och trots att hookens eget docblock påstod att
   * *"NIVÅ 1/2 redan skrivit separator-fri"*. NIVÅ 1 gjorde det; NIVÅ 2
   * gjorde det inte.
   *
   * FELET VAR OSYNLIGT MED EN 1 px-SEPARATOR (4 px fel, som ingen mätning
   * hade anledning att leta efter) och blir 8 px med 309.46:s ränna: samma
   * lista skulle låsas på 496 i stället för 488 så fort den gick från
   * 1–3 rader till NOLL. Fixen lagrar `(radhojd × 4 − radensSeparator) / 4`.
   *
   * VÄGEN MÅSTE VARA EN RIKTIG RADERING, inte DOM-kirurgi: `antalRiktigaRader`
   * kommer ur Reacts props, så att ta bort `<li>`-noder i webbläsaren driver
   * inte hooken till NIVÅ 3 — den mäter bara om med samma nivå. (Prövat under
   * byggandet: DOM-vägen gav 224 px och bevisade ingenting.)
   *
   * `harPreciserMatt` är falskt här (en rad ⇒ NIVÅ 2), så NIVÅ 3 får faktiskt
   * köra — samma spärr som fryser höjden i 5 → 3-testet ovan hade annars
   * gömt hela frågan.
   */
  test('AC #2 gränsfall (TASK-309.46): 1 rad → 0 rader in-place — NIVÅ 3 ärver en SEPARATOR-FRI radhöjd, låset står kvar', async ({
    page,
    network,
  }) => {
    network.use(gransfallHandler(1, 0));
    network.use(http.post(EF('delete-attachment'), () => json({ deleted: true })));

    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 1.pdf')).toBeVisible();

    const fore = await mataGeometri(page);
    expect(fore.antalKort).toBe(1);
    const radhojd = Math.max(...fore.radHojder);
    // NIVÅ 2: radhöjd × 4 MINUS radens egen ränna.
    expect(fore.hojd).toBeGreaterThanOrEqual(radhojd * 4 - RANNA);
    expect(fore.hojd).toBeLessThanOrEqual(radhojd * 4 - RANNA + 8);

    await valjRadhandling(page, 'Delad 1.pdf', 'Radera');
    // Scopad till listan av samma announcer-skäl som 5 → 3-testet ovan.
    await expect(page.getByTestId('dokument-lista').getByText('Delad 1.pdf')).not.toBeVisible();

    const efter = await mataGeometri(page);
    expect(efter.antalKort).toBe(0);
    // KÄRNAN: höjden ska stå KVAR. Före fixen ärvde NIVÅ 3 en radhöjd med
    // separatorn inbakad och låset växte med exakt en ränna.
    expect(
      efter.hojd,
      `låset ändrades vid övergången till tomt läge: ${fore.hojd} → ${efter.hojd} (skillnaden är radens ränna)`,
    ).toBe(fore.hojd);
    expect(efter.bredd).toBe(fore.bredd);
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
    // ADR-125 § 1 (den ÄR "Delad bilaga" utan satta axlar). I
    // räckviddsläget är dessutom "Bara detta event" avstängd — inget event
    // att koppla mot — så dialogen öppnar redan förvald på "Delad bilaga"
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
      dialog.getByRole('radio', { name: 'Delad bilaga - gäller flera event' }),
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
      const fjardeEl = ul.children[3];
      const fjarde = fjardeEl.getBoundingClientRect();
      // [TASK-309.46] MINUS FJÄRDE RADENS RÄNNA — samma avdrag NIVÅ 1 gör
      // (`separatorBredd`). Referensen ska spegla hookens formel, inte den
      // form den hade när rännan var en padding och avdraget en no-op.
      const fjardesRanna = Number.parseFloat(getComputedStyle(fjardeEl).borderBottomWidth) || 0;
      return fjarde.bottom - forsta.top - fjardesRanna + kantjustering;
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
    provaExaktFyraRader(efter);
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
    await expect(page.getByText('Inga delade bilagor än.')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.antalKort).toBe(0);
    // `LISTA_FALLBACK_RADHOJD` (EN konstant, se `DokumentYta.tsx`s docblock
    // och `FALLBACK_RADHOJD` ovan) × 4 — INTE ~622 px, som en fallback
    // baserad på en BRUTEN `GemensamBilageRadRow`-rad hade gett. [T176]
    // Talet är 122 (den separator-fria per-rad-höjden, se `FALLBACK_RADHOJD`
    // ovan — `<li>` är 124) och `<ul>` bär ingen kant, så
    // väntad höjd är exakt 488 px.
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK_RADHOJD * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK_RADHOJD * 4 + TOLERANS);
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
    expect(geometri.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4 - RANNA);
    expect(geometri.hojd).toBeLessThanOrEqual(maxRadhojd * 4 - RANNA + 8);
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

/**
 * ═══ TASK-309.44:s EGNA FYRA BESLUT — PERMANENTA ASSERTIONER ═══
 *
 * Granskarfynd på PR #2130 (runda 1, warning/auto-fix): skivan landade fyra
 * MÄTTA UI-beslut och tre nya tester — men de tre testerna täckte uteslutande
 * det ÖVERTAGNA fyndet från #2128. Skivans egna beslut vilade alltså på samma
 * grund de själva ersatte: en engångsmätning i en agents scratchpad. En
 * refaktor av `DokumentYta`, `RackviddBadge` eller `Button` hade kunnat riva
 * något av dem utan att en enda grind fällde.
 *
 * HEMVISTEN, bokförd: A (hierarkin), B (⋯-knappen) och D (namnknappen) bor
 * HÄR, eftersom de är GEOMETRI och TILLSTÅND i listytan — samma frågeklass
 * denna fil redan äger, med samma fixturhandler för båda lägena. C (pillens
 * ton och ikon) bor i `dokument-rackviddsval.acceptance.test.ts`, hos den
 * befintliga pill-vakten och hos den ENDA fixturen som ger BÅDA pill-typerna
 * på samma sida (`bilagorHandler` i eventläget) — en tvåsidig prövning
 * ("delad ser annorlunda ut än event-egen") är omöjlig i denna fils handler,
 * som ger en pill-typ per läge.
 *
 * ═══ VAD SOM JÄMFÖRS EXAKT OCH VAD SOM JÄMFÖRS MOT EN LEVANDE TOKEN ═══
 *
 * Samma disciplin som 309.43-blocket ovan. **16 px är VÅRT** — det är
 * innehållskolumnens `gap-4`, en siffra vi valt, och den assertas exakt.
 * **Färgerna är också våra, men deras rgb-form är det inte** — de bor i
 * tokens som kan bytas — så de läses ur en LEVANDE token-probe i samma
 * dokument och jämförs mot elementets `getComputedStyle`. En hårdkodad
 * `rgb(82, 81, 81)` hade fällt en medveten token-ändring som om den vore en
 * bugg, och (värre) hade INTE fällt en klass som slutat peka på tokenen så
 * länge någon annan regel råkade ge samma färg.
 *
 * ═══ ÖVERGÅNGSFÄLLAN — LÄS DEN INNAN DU SKRIVER FLER HOVER-TESTER ═══
 *
 * `Button.tsx`s bas-klass bär `transition-colors`. En `getComputedStyle`-
 * läsning DIREKT efter `hover()` returnerar därför VILO-värdet mitt i
 * övergången: mätt under TASK-309.44 gav en fungerande hover
 * `rgba(0, 0, 0, 0)` och `rgb(82, 81, 81)` trots `data-hovered="true"` —
 * vilket såg ut som en trasig hover men var en mätpunkt vid t≈0. Varje
 * tillstånds-assertion nedan går därför genom `toHaveCSS`, som RETRYAR tills
 * övergången landat. Läs aldrig en färg efter hover med `evaluate`.
 */
test.describe('TASK-309.44:s beslut — hierarkin, ⋯-knappen, namnknappen', () => {
  /** Levande token-värde ur samma dokument som elementet mäts i. Samma
      probe-teknik som `dokument-visual.spec.ts`s `strongToken`. */
  async function tokenFarg(page: Page, namn: string) {
    return page.evaluate((n) => {
      const probe = document.createElement('span');
      probe.style.color = `var(${n})`;
      document.body.appendChild(probe);
      const farg = getComputedStyle(probe).color;
      probe.remove();
      return farg;
    }, namn);
  }

  /** Hierarkin i ETT synkront steg — ingen av kanterna får läsas mot ett
      tillstånd som hunnit ändra sig mellan två `evaluate`-anrop. */
  async function mataHierarki(page: Page) {
    return page.evaluate(() => {
      const rund = (n: number) => Math.round(n * 100) / 100;
      const kant = (el: Element | null) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: rund(b.top), bottom: rund(b.bottom), left: rund(b.left) };
      };
      const block = document.querySelector('[data-testid="grupp-kort"]');
      // Handlingsradens rot är `ladda-upp-ny-fil`-ankarets förälder.
      const rad = document.querySelector('[data-testid="ladda-upp-ny-fil"]')?.parentElement ?? null;
      // KANTERNA LÄSES PÅ SJÄLVA KNAPPARNA, ALDRIG PÅ RADENS WRAPPER — och
      // det är mätt, inte principiellt. En negativ kontroll med `pl-2` på
      // wrappern lämnade testet GRÖNT: padding ligger innanför border-boxen,
      // så wrapperns kanter står stilla medan knapparna flyttar sig. Samma
      // hål fanns lodrätt: det var precis ett `pt-1` på wrappern som revs i
      // denna skiva, och en rytm-mätning på wrappern hade inte sett det.
      // `knappar` är radens EGNA knappar (uppladdningen ligger i sitt
      // testid-ankare, "Skapa bilaga" är ett direkt syskon).
      const knappar = rad ? Array.from(rad.querySelectorAll('button')) : [];
      const rutor = knappar.map((k) => k.getBoundingClientRect());
      return {
        ankareTotalt: document.querySelectorAll('[data-testid="ladda-upp-ny-fil"]').length,
        ankareIBlocket: block
          ? block.querySelectorAll('[data-testid="ladda-upp-ny-fil"]').length
          : null,
        blockBarn: block ? block.children.length : null,
        antalKnappar: knappar.length,
        valjare: kant(document.querySelector('[data-testid="event-valjare-trigger"]')),
        knappar: rutor.length
          ? {
              top: rund(Math.min(...rutor.map((b) => b.top))),
              bottom: rund(Math.max(...rutor.map((b) => b.bottom))),
              left: rund(Math.min(...rutor.map((b) => b.left))),
            }
          : null,
        block: kant(block),
      };
    });
  }

  /**
   * A — handlingsraden ligger i SIDFLÖDET, inte i listans block.
   *
   * Marcus 2026-08-30: *"knapparna inte sitter perfekt där dem sitter just nu,
   * de har en annan rundning än blocket också"*. Fyra invarianter faller ut ur
   * beslutet, och alla prövas: raden finns EN gång, den ligger UTANFÖR
   * blocket, blocket bär bara listan, och de tre kanterna linjerar med 16 px
   * rytm emellan.
   */
  function provaHierarki(h: Awaited<ReturnType<typeof mataHierarki>>) {
    expect(h.ankareTotalt, 'exakt EN handlingsrad på sidan').toBe(1);
    expect(h.ankareIBlocket, 'handlingsraden får aldrig ligga inuti grupp-kort').toBe(0);
    expect(h.blockBarn, 'blocket bär BARA listan (DokumentListRam)').toBe(1);

    expect(h.valjare).not.toBeNull();
    expect(h.knappar, 'handlingsraden ska bära minst en knapp').not.toBeNull();
    expect(h.block).not.toBeNull();

    // VÄNSTERKANTERNA — syskon i samma `px-4`-kolumn kan strukturellt inte
    // hamna ur linje, och det är precis den strukturen som prövas här.
    expect(h.knappar?.left, 'knapparnas vänsterkant === väljarens').toBe(h.valjare?.left);
    expect(h.block?.left, 'blockets vänsterkant === väljarens').toBe(h.valjare?.left);

    // RYTMEN — 16 px är kolumnens `gap-4`, alltså vårt eget tal. Exakt.
    expect(
      (h.knappar?.top ?? 0) - (h.valjare?.bottom ?? 0),
      `väljare.bottom ${h.valjare?.bottom} → knappar.top ${h.knappar?.top} ska vara 16 px`,
    ).toBe(16);
    expect(
      (h.block?.top ?? 0) - (h.knappar?.bottom ?? 0),
      `knappar.bottom ${h.knappar?.bottom} → block.top ${h.block?.top} ska vara 16 px`,
    ).toBe(16);
  }

  test('A: eventläget — handlingsraden utanför blocket, lika vänsterkanter, 16 px rytm', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    provaHierarki(await mataHierarki(page));
  });

  test('A: räckviddsläget — samma hierarki, samma rytm (lägena delar skelett)', async ({
    page,
    network,
  }) => {
    // Att BÅDA lägena prövas är inte dubbelarbete: raden bodde tidigare inuti
    // respektive läges EGEN komponent, och det var just där de kunde glida
    // isär (`sistaRadenBarLinje` saknades en gång helt i räckviddsläget,
    // TASK-309.24). Nu delar de ETT anropsställe — och det är den likheten
    // detta test låser fast.
    network.use(hojdlasHandler(0, 6));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 1.pdf')).toBeVisible();
    provaHierarki(await mataHierarki(page));
  });

  test('B: ⋯-knappen — ghost i vila, rund platta vid hover OCH med menyn öppen, fokus återlämnas', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 6.pdf')).toBeVisible();

    const sekundar = await tokenFarg(page, '--mm-text-secondary');
    const betonad = await tokenFarg(page, '--mm-bg-emphasized');
    // Första kortet i DOM — alltid inom viewport, aldrig under bottennavet.
    const dots = page.getByRole('button', { name: 'Fler val för Bilaga 6.pdf' });

    // VILA: ingen platta alls, bara ikonen i den dämpade tonen.
    await expect(dots).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(dots).toHaveCSS('color', sekundar);

    // RUND OCH 44×44. Radien läses som TAL: `rounded-full` kompilerar till
    // `calc(infinity * 1px)` och renderas som `3.35544e+07px` — ett exakt
    // strängjämförande test hade bundit sig till den representationen.
    const geo = await dots.evaluate((el) => ({
      radie: Number.parseFloat(getComputedStyle(el).borderTopLeftRadius),
      bredd: Math.round(el.getBoundingClientRect().width),
      hojd: Math.round(el.getBoundingClientRect().height),
    }));
    expect(
      geo.radie,
      'plattan ska vara RUND — aldrig en tredje radie mot blockets 16 px',
    ).toBeGreaterThanOrEqual(9999);
    expect(geo.bredd).toBe(44);
    expect(geo.hojd).toBe(44);

    // HOVER: plattan tänds i den EGNA komponent-tokenen, aldrig i ghost-
    // tokenen (den ÄR behållarens ton, ΔE00 0,00 — se IKONKNAPP_KLASS).
    // `toHaveCSS` retryar, se describe-docblockets övergångsfälla.
    await dots.hover();
    await expect(dots).toHaveCSS('background-color', betonad);

    // ÖPPEN MENY: plattan står KVAR även när pekaren lämnat knappen. Musen
    // flyttas medvetet bort först — annars hade hover-regeln ensam kunnat
    // förklara färgen, och testet hade inte prövat det öppna läget alls.
    await dots.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(dots).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(5, 5);
    await expect(dots).not.toHaveAttribute('data-hovered', 'true');
    await expect(dots).toHaveCSS('background-color', betonad);

    // FOKUS ÅTERLÄMNAS till triggern vid Escape — react-arias `MenuTrigger`
    // ger det utan egen kod, och det är den delen handbyggda menyer tappar.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(dots).toBeFocused();
  });

  test('D: namnknappen — understruken vid hover, aldrig i vila, aldrig en platta', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 6.pdf')).toBeVisible();

    const namn = page.getByRole('button', { name: 'Öppna Bilaga 6.pdf' });

    // VILA: ingen understrykning, ingen platta — men `cursor: pointer`, som är
    // det enda som säger "detta går att trycka på" innan man siktar.
    // Webbläsarens default för `<button>` är `cursor: default`; avsteget är
    // medvetet och motiverat i `DokumentRadSkal`s docblock.
    await expect(namn).toHaveCSS('text-decoration-line', 'none');
    await expect(namn).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(namn).toHaveCSS('cursor', 'pointer');

    // HOVER: understrykningen ÄR affordansen sedan kortets hover revs
    // (309.43). Bakgrunden prövas igen — en återinförd platta ska fälla här,
    // inte bara understrykningens frånvaro.
    await namn.hover();
    await expect(namn).toHaveCSS('text-decoration-line', 'underline');
    await expect(namn).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  /**
   * [TASK-309.45 fel 1] KNAPPEN BEHÅLLER SIN FORM UNDER TANGENTBORDSFOKUS.
   *
   * Marcus 5173-granskning 2026-08-30: *"hover på ⋯-knappen är rund i
   * utgångsläget men fyrkantig efter att man tryckt på den en gång."*
   *
   * Orsaken låg inte i knappen utan i `base.css`: den globala
   * `*:focus-visible`-regeln satte `border-radius: 2px` i OLAGRAD author-CSS,
   * och olagrat besegrar varje cascade-lager oavsett specificitet. Varje
   * element med egen radie tappade alltså sin form vid fokus — mätt på denna
   * knapp: 3.35544e+07px → 2px. Radien ligger sedan 309.45 i `@layer base`,
   * där `rounded-*`-utilities vinner; `outline` är kvar olagrad så ingen
   * utility kan släcka ringen.
   *
   * TESTET PRÖVAR MARCUS EGET FALL, inte en abstraktion: klick (öppnar menyn)
   * → Escape (stänger, ger tangentbordsmodalitet) → knappen ska fortfarande
   * vara RUND, bära hover-plattan, OCH visa ringen. Alla tre samtidigt — en
   * fix som räddat radien genom att offra ringen vore en regression, inte en
   * lösning.
   */
  test('fel 1: ⋯-knappen är RUND även under tangentbordsfokus — och ringen finns kvar', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 6.pdf')).toBeVisible();

    const betonad = await tokenFarg(page, '--mm-bg-emphasized');
    const dots = page.getByRole('button', { name: 'Fler val för Bilaga 6.pdf' });

    await dots.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(dots).toHaveAttribute('data-focus-visible', 'true');

    const efter = await dots.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        radie: Number.parseFloat(cs.borderTopLeftRadius),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
      };
    });
    expect(
      efter.radie,
      `knappen ska vara rund även med fokusringen på — mätt ${efter.radie} px`,
    ).toBeGreaterThanOrEqual(9999);
    expect(efter.outlineStyle, 'fokusringen får ALDRIG offras för radiens skull').toBe('solid');
    expect(Number.parseFloat(efter.outlineWidth)).toBeGreaterThan(0);
    // Plattan (musen står kvar över knappen efter klicket) ska vara rund, inte
    // en 2 px-ruta — det var det Marcus såg.
    await expect(dots).toHaveCSS('background-color', betonad);
  });

  /**
   * [TASK-309.45 fel 1, andra halvan] NAMNKNAPPEN BEHÅLLER `rounded-lg`.
   *
   * Samma globala regel drabbade varje element med egen radie, så fixen prövas
   * på ett ANDRA element med en ANNAN radie — annars kunde en lapp som bara
   * gällde `rounded-full` se ut som en rot-fix.
   */
  test('fel 1: namnknappen behåller rounded-lg under fokus', async ({ page, network }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 6.pdf')).toBeVisible();

    const namn = page.getByRole('button', { name: 'Öppna Bilaga 6.pdf' });
    // Referensen läses ur en FÄRSK `rounded-lg`-nod, inte hårdkodad: skalans
    // px-värde är Tailwinds, inte vårt, och ska kunna ändras utan att detta
    // test fäller på fel grund.
    const referens = await page.evaluate(() => {
      const p = document.createElement('span');
      p.className = 'rounded-lg';
      document.body.append(p);
      const v = getComputedStyle(p).borderTopLeftRadius;
      p.remove();
      return v;
    });
    await namn.focus();
    await expect(namn).toHaveCSS('border-top-left-radius', referens);
  });

  /**
   * [TASK-309.45 fel 2] INGEN RING I ⋯-MENYN VID MUS — MEN RING VID TANGENTBORD.
   *
   * Marcus: *"den blå fokusringen kommer fram i menyn. Inte okej."*
   *
   * KEDJAN, mätt: musklick öppnar menyn → RAC skript-fokuserar behållaren
   * asynkront → Chrome klassar skript-fokus som tangentbord i sin
   * `:focus-visible`-heuristik → musen glider över en post, RAC flyttar fokus
   * dit (focus-follows-hover) → posten matchar `:focus-visible` UTAN att bära
   * `data-focus-visible`, och den globala ringen målades. Släckaren i base.css
   * täckte behållaren men inte posterna.
   *
   * TESTET ÄR TVÅSIDIGT I SIG SJÄLVT, och måste vara det: en släckare som tar
   * ringen även vid TANGENTBORD hade "löst" fyndet genom att bryta WCAG 2.4.7.
   * Därför prövas båda modaliteterna i samma test — mus ⇒ ingen ring, Enter ⇒
   * ring. `data-focused`-plattan ska finnas i BÅDA (den bär markeringen när
   * ringen är släckt).
   */
  test('fel 2: menyposten bär ingen ring vid mus-öppning, men ring vid tangentbordsöppning', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 6.pdf')).toBeVisible();

    const dots = page.getByRole('button', { name: 'Fler val för Bilaga 6.pdf' });
    const post = page.getByRole('menuitem', { name: 'Ladda ner' });

    // MUS: klick + hovra posten.
    await dots.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await post.hover();
    await expect(post).toHaveAttribute('data-focused', 'true');
    await expect(post).toHaveCSS('outline-style', 'none');
    // Behållaren likaså — släckaren för den är äldre, men den ska inte
    // regrediera i tysthet när posternas selektor läggs till.
    await expect(page.getByRole('menu')).toHaveCSS('outline-style', 'none');

    // ANDRA mus-öppningen efter en Escape — det var i det läget defekten
    // först syntes, så den prövas explicit och inte bara den första.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await dots.click();
    await expect(page.getByRole('menu')).toBeVisible();
    await post.hover();
    await expect(post).toHaveCSS('outline-style', 'none');

    // TANGENTBORD: Escape, flytta musen bort, fokusera triggern, Enter.
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await page.mouse.move(5, 5);
    await dots.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(post).toHaveAttribute('data-focus-visible', 'true');
    await expect(post).toHaveCSS('outline-style', 'solid');
  });
});
