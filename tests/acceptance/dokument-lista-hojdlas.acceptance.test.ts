import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './acceptance-bas';

/**
 * TASK-309.24 — Dokumentlistan: alltid fyra raders låst höjd, linje under
 * varje rad, fjärde linjen klipps av kanten — ingen hoppning, ingen
 * 1 px-scroll.
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
 * TÄCKNING:
 *   AC #1 — bounding box (bredd, höjd) identisk över alla FYRA typfilter
 *     (Alla/Bilagor/Mallar/Generatorer) vid ett FIXERAT totalt antal — mätt
 *     desktop OCH 375 px. Utökat (runda 2): DokumentListas EGNA 0-rader-läge
 *     ('bilaga'-filtret utan bilagor) delar boxen 'alla' redan etablerat.
 *   AC #2 — exakt fyra synliga rader: `scrollHeight === clientHeight`,
 *     ingen linje synlig på sista raden; fem-plus: scrollbart, linjen syns
 *     EFTER scroll (mätt via sista radens `border-bottom-width` — se
 *     `mataGeometri`); 1–3: sista raden bär linje, LÅST höjd (bevisat mot
 *     radernas egen uppmätta höjd, inte bara "ingen scroll" — se
 *     `mataGeometri`s `radHojder`).
 *   AC #3 — tomt läge (`DokumentLista` 'bilaga'-filtret OCH `GemensamtLage`)
 *     renderas INOM samma LÅSTA höjd, ingen linje; `prefers-contrast: more`
 *     visar separatorlinjerna; axe 0 violations.
 *   AC #5 — samma mätning fäller på filterhoppning (test-grupp 1) OCH på
 *     1 px-scroll vid exakt fyra rader (test-grupp 2) — se § "Bevis i båda
 *     riktningar" i PR-beskrivningen för en negativ kontroll.
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

async function valjFilter(page: Page, etikett: string) {
  // `exact: true` — annars matchar 'Alla' ÄVEN 'Mallar' (Playwrights
  // namn-matchning är substräng som default, och "Mallar" innehåller
  // bokstavligen "alla"). Mätt, TASK-309.24: `strict mode violation`.
  await page.getByRole('radio', { name: etikett, exact: true }).click();
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
async function mataGeometri(page: Page) {
  return page.getByTestId('dokument-lista').evaluate((ul) => {
    const rect = ul.getBoundingClientRect();
    const sista = ul.lastElementChild as HTMLElement | null;
    return {
      bredd: rect.width,
      hojd: rect.height,
      scrollHeight: ul.scrollHeight,
      clientHeight: ul.clientHeight,
      scrollTop: ul.scrollTop,
      sistaBorderBottomWidth: sista ? getComputedStyle(sista).borderBottomWidth : null,
      radHojder: Array.from(ul.children).map((li) => li.getBoundingClientRect().height),
    };
  });
}

test.describe('DokumentLista (eventläge) — filterbyte ändrar aldrig bounding box (regel 5)', () => {
  test('AC #1/#5: bounding box IDENTISK över Alla/Bilagor/Mallar/Generatorer vid totaltAntal=7 — desktop', async ({
    page,
    network,
  }) => {
    // 4 bilagor + 2 mallar (MALLAR, fast) + 1 generator (GENERATORER, fast)
    // = 7 — över gränsen, så BÅDA 'alla' och 'bilaga' når NIVÅ 1 (PRECIS,
    // >= LISTA_SYNLIGA_RADER riktiga rader) redan från start. 'Bilagor' ger
    // EXAKT fyra (gränsfallet), 'Mallar' två och 'Generatorer' en — täcker
    // därmed 1–3, exakt 4 och 5+ i EN fixtur.
    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const alla = await mataGeometri(page);
    expect(alla.scrollHeight).toBeGreaterThan(alla.clientHeight); // 5+ (7 rader)

    await valjFilter(page, 'Bilagor');
    const bilagor = await mataGeometri(page);
    expect(bilagor.bredd).toBe(alla.bredd);
    // ═══ KÄND, DOKUMENTERAD ≤ 1 PX-SKILLNAD — INTE HOPPNING (se
    // `DokumentLista`s `bilagaKanMataExakt`-stycke i källan för hela
    // diagnosen) ═══
    //
    // 'Alla' mäter (reserv, `reservMatbar`) FÖRSTA gången sidan öppnas —
    // 7 rader i DOM. 'Bilagor' mäter (företräde, `foretradesMatbar`) sina
    // EGNA fyra rader i EN KONTEXT MED BARA DE FYRA I DOM. En rads
    // renderade höjd beror MÄTT på hur många syskon den har (layout-
    // avrundning fördelad över hela flödet, inte en bugg i vår kod) — rad 4
    // mätte 99 px bland sju syskon, 98 px bland fyra. Höjden "sätter sig"
    // därför med som MEST 1 px första gången 'Bilagor' besöks; efter det
    // är värdet LÅST (`harForetradesMatt`) och ändras aldrig igen.
    //
    // Detta ÄR skillnaden mot en verklig hoppnings-BUGG: en riktig
    // regression (t.ex. ett hårdkodat 396 px som INTE räknar med
    // TASK-309.20:s radbrytning) ger tiotals pixlars diff, inte 1. Toleransen
    // nedan fångar alltså fortfarande den bugg-klassen medan den tolererar
    // webbläsarens egen sub-pixel-avrundning.
    expect(Math.abs(bilagor.hojd - alla.hojd)).toBeLessThanOrEqual(1);
    // Regel 3 + AC #2: exakt fyra rader — INGEN scroll, ingen synlig linje.
    // Detta är den AUKTORITATIVA (företrädda, precisa) mätningen, och den
    // MÅSTE hålla exakt — ingen tolerans här.
    expect(bilagor.scrollHeight).toBe(bilagor.clientHeight);
    expect(bilagor.sistaBorderBottomWidth).toBe('0px');
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');

    // Från och med HÄR är höjden LÅST vid `bilagor.hojd` (företrädet har
    // mätt, `harForetradesMatt` spärrar all vidare skrivning) — resten av
    // filtren jämförs därför mot `bilagor`, inte mot den tidiga `alla`-
    // reserven, och ska hålla EXAKT (regel 5, ingen ytterligare tolerans).
    await valjFilter(page, 'Mallar');
    const mallar = await mataGeometri(page);
    expect(mallar.bredd).toBe(bilagor.bredd);
    expect(mallar.hojd).toBe(bilagor.hojd);
    // 1–3 rader (två mallar): ingen scroll, men sista raden BÄR linje.
    expect(mallar.scrollHeight).toBe(mallar.clientHeight);
    expect(mallar.sistaBorderBottomWidth).not.toBe('0px');

    await valjFilter(page, 'Generatorer');
    const generatorer = await mataGeometri(page);
    expect(generatorer.bredd).toBe(bilagor.bredd);
    expect(generatorer.hojd).toBe(bilagor.hojd);
    expect(generatorer.scrollHeight).toBe(generatorer.clientHeight);
    expect(generatorer.sistaBorderBottomWidth).not.toBe('0px');

    await valjFilter(page, 'Alla');
    const allaIgen = await mataGeometri(page);
    expect(allaIgen.bredd).toBe(bilagor.bredd);
    expect(allaIgen.hojd).toBe(bilagor.hojd);
    // 5+ (7 rader): scrollbart, sista raden (rad 7) bär linje.
    expect(allaIgen.scrollHeight).toBeGreaterThan(allaIgen.clientHeight);
    expect(allaIgen.sistaBorderBottomWidth).not.toBe('0px');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
  });

  test('AC #1 / regel 6: samma invariant vid 375 px (radbrytningens brytpunkt, TASK-309.20)', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(hojdlasHandler(4, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const alla = await mataGeometri(page);
    await valjFilter(page, 'Bilagor');
    const bilagor = await mataGeometri(page);
    expect(bilagor.bredd).toBe(alla.bredd);
    // KÄND, DOKUMENTERAD ≤ 1 PX-SKILLNAD — se motsvarande stycke i
    // desktop-testet ovan för hela diagnosen (webbläsarens egen
    // sub-pixel-avrundning, inte en hoppnings-bugg).
    expect(Math.abs(bilagor.hojd - alla.hojd)).toBeLessThanOrEqual(1);
    expect(bilagor.scrollHeight).toBe(bilagor.clientHeight);
    expect(bilagor.sistaBorderBottomWidth).toBe('0px');

    // Låst vid `bilagor.hojd` från och med här (samma motiv som desktop-testet).
    await valjFilter(page, 'Mallar');
    const mallar = await mataGeometri(page);
    expect(mallar.bredd).toBe(bilagor.bredd);
    expect(mallar.hojd).toBe(bilagor.hojd);

    await valjFilter(page, 'Generatorer');
    const generatorer = await mataGeometri(page);
    expect(generatorer.bredd).toBe(bilagor.bredd);
    expect(generatorer.hojd).toBe(bilagor.hojd);
  });

  test('AC #2/#5: fem-plus rader — scroll till botten avslöjar linjen under rad 4 och sista radens egen linje', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(6, 0)); // 6 + 2 + 1 = 9, gott om marginal över 4
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();

    const lista = page.getByTestId('dokument-lista');
    const foreScroll = await mataGeometri(page);
    expect(foreScroll.scrollTop).toBe(0);
    expect(foreScroll.scrollHeight).toBeGreaterThan(foreScroll.clientHeight);

    // Rad 4 (index 3) — dess EGEN border-bottom (`sistaRadenBarLinje` gäller
    // inte den specifikt, men `divide-y` ger rad 5 en border-top som
    // visuellt är SAMMA linje) ska ligga UTANFÖR den synliga ytan vid
    // scrollTop 0.
    const rad4SynligForeScroll = await lista.evaluate((ul) => {
      const rad4 = ul.children[3] as HTMLElement;
      const ulRect = ul.getBoundingClientRect();
      const rad4Rect = rad4.getBoundingClientRect();
      // Linjen mellan rad 4/5 sitter vid rad4Rect.bottom (≈ rad5.top).
      // "Syns" betyder: ligger inom listans synliga ram.
      return rad4Rect.bottom <= ulRect.bottom + 0.5;
    });
    expect(rad4SynligForeScroll).toBe(true); // klippt bort — inte VISUELLT synlig som "nästa rad"

    await lista.evaluate((ul) => {
      ul.scrollTo({ top: ul.scrollHeight });
    });
    const efterScroll = await mataGeometri(page);
    expect(efterScroll.scrollTop).toBeGreaterThan(0);
    // Sista raden (rad 9) bär nu sin egen synliga linje.
    expect(efterScroll.sistaBorderBottomWidth).not.toBe('0px');
  });

  test('AC #1/#3: 0 bilagor (bilaga-filtret) — tomt läge inom SAMMA låsta höjd som "alla" redan etablerat, ingen hoppning', async ({
    page,
    network,
  }) => {
    // 0 bilagor + 2 mallar (fast) + 1 generator (fast) = 3 riktiga rader i
    // 'alla' (default-filtret) — under LISTA_SYNLIGA_RADER, så 'alla' tar
    // NIVÅ 2 (ESTIMAT) redan vid FÖRSTA renderingen. 'bilaga' visar sedan 0
    // riktiga rader (bara tomt-lägets placeholder-`<li>`) — `foretradesMatbar`
    // och `reservMatbar` är BÅDA falska där (se `bilagaKanMataExakt`-stycket
    // i källan), så `useLastaListhojd` returnerar tidigt och höjden fryser
    // vid 'alla's redan etablerade ESTIMAT — exakt det AC #3/regel 5 kräver.
    network.use(hojdlasHandler(0, 0));
    await gotoEventlage(page);
    await expect(page.getByText('Bekräftelsebilaga')).toBeVisible(); // mall, 'alla' visar den

    const alla = await mataGeometri(page);
    expect(alla.scrollHeight).toBe(alla.clientHeight); // 3 rader, ingen scroll
    expect(alla.sistaBorderBottomWidth).not.toBe('0px'); // 3 !== 4: sista raden bär linje

    await valjFilter(page, 'Bilagor');
    await expect(page.getByText('Inga bilagor för det här eventet än.')).toBeVisible();
    const bilagor = await mataGeometri(page);

    // INGEN HOPPNING (regel 5) — värdet är samma REACT-STATE, inte en ny
    // mätning, så jämförelsen är EXAKT (ingen sub-pixel-tolerans behövs här:
    // `useLastaListhojd`s guard hindrar 'bilaga' från att mäta alls i detta
    // läge).
    expect(bilagor.hojd).toBe(alla.hojd);
    expect(bilagor.bredd).toBe(alla.bredd);
    expect(bilagor.scrollHeight).toBe(bilagor.clientHeight);
    // AC #3: tomt läge (antalSynliga === 0) bär ALDRIG linje.
    expect(bilagor.sistaBorderBottomWidth).toBe('0px');
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
  });

  test('AC #3: prefers-contrast: more visar separatorlinjerna; axe 0 violations', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(4, 0));
    await page.emulateMedia({ contrast: 'more' });
    await gotoEventlage(page);
    await expect(page.getByText('Bilaga 1.pdf')).toBeVisible();
    await valjFilter(page, 'Mallar'); // 1–3-läget: sista raden bär en RIKTIG linje att pröva färgen på

    const strongToken = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mm-border-strong)';
      document.body.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });

    const sistaRadensLinje = await page.getByTestId('dokument-lista').evaluate((ul) => {
      const sista = ul.lastElementChild as HTMLElement;
      return getComputedStyle(sista).borderBottomColor;
    });
    expect(sistaRadensLinje).toBe(strongToken);

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="dokument-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });
});

test.describe('GemensamtLage (räckviddsläge) — samma regel (tidigare saknad, TASK-309.24)', () => {
  test('AC #1/#3: 0 rader — tomt läge inom LÅST höjd (nivå 3, FALLBACK), ingen linje, axe-rent', async ({
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
    const FALLBACK_DESKTOP = 99;
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.sistaBorderBottomWidth).toBe('0px');
    expect(geometri.hojd).toBeGreaterThanOrEqual(FALLBACK_DESKTOP * 4);
    // Övre gräns generös (kantjustering + typsnitt/webbläsar-brus) — ändå
    // långt under vad en NATURLIG (o-låst) tomt-lägesrad hade mätt (en
    // enda `py-3`-textrad, typiskt < 60 px), vilket är den regression
    // denna gräns skulle fånga.
    expect(geometri.hojd).toBeLessThanOrEqual(FALLBACK_DESKTOP * 4 + 8);
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="dokument-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #1/#2: 1 rad — LÅST höjd (regel 2: "0–3 rader, luft under"), sista (enda) raden bär sin linje', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 1));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 1.pdf')).toBeVisible();
    const en = await mataGeometri(page);
    expect(en.scrollHeight).toBe(en.clientHeight);
    expect(en.sistaBorderBottomWidth).not.toBe('0px');
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
  test('AC #1/#2: 3 rader — LÅST höjd, sista raden bär sin linje', async ({ page, network }) => {
    network.use(hojdlasHandler(0, 3));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 3.pdf')).toBeVisible();
    const tre = await mataGeometri(page);
    expect(tre.scrollHeight).toBe(tre.clientHeight);
    expect(tre.sistaBorderBottomWidth).not.toBe('0px');
    const maxRadhojd = Math.max(...tre.radHojder);
    expect(tre.hojd).toBeGreaterThanOrEqual(maxRadhojd * 4);
    expect(tre.hojd).toBeLessThanOrEqual(maxRadhojd * 4 + 8);
  });

  test('AC #2/#5: exakt 4 rader — scrollHeight === clientHeight, ingen linje, inget tabb-stopp (den kritiska gränsen)', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 4));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 4.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight); // AC #5: fäller på 1 px-scroll
    expect(geometri.sistaBorderBottomWidth).toBe('0px');
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');
  });

  test('AC #1/#2: 5 och 6 rader delar EXAKT samma låsta bounding box; scrollbart; sista raden bär linje', async ({
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
    expect(fem.sistaBorderBottomWidth).not.toBe('0px');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute(
      'aria-label',
      'Delade dokument',
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
    expect(sex.sistaBorderBottomWidth).not.toBe('0px');
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

    await page.getByRole('button', { name: 'Radera Delad 5.pdf' }).click();
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
    // 3 !== 4: sista raden bär sin linje igen (den klipptes bort av scroll
    // innan, nu är den permanent synlig inom den frusna höjden).
    expect(efter.sistaBorderBottomWidth).not.toBe('0px');
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
    expect(efter.sistaBorderBottomWidth).toBe('0px'); // exakt 4: ingen linje
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
    expect(geometri.sistaBorderBottomWidth).toBe('0px');
    // `LISTA_FALLBACK_RADHOJD` (99, EN konstant, se `DokumentYta.tsx`s
    // docblock) × 4 + kant ≈ 396–400 px. Övre gräns 410 px (Marcus/
    // orkestrerarens egen gräns i review-fyndet) — INTE ~622 px, som en
    // fallback baserad på en BRUTEN `GemensamBilageRadRow`-rad hade gett.
    expect(geometri.hojd).toBeGreaterThanOrEqual(99 * 4);
    expect(geometri.hojd).toBeLessThanOrEqual(410);
  });

  test('NIVÅ 2 (ESTIMAT): 2 rader — låst höjd bevisad mot radens EGEN uppmätta höjd (bruten rad, 155 px)', async ({
    page,
    network,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    network.use(hojdlasHandler(0, 2));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 2.pdf')).toBeVisible();

    const geometri = await mataGeometri(page);
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.sistaBorderBottomWidth).not.toBe('0px');
    // Samma "bevisar LÅSNING, inte bara ingen scroll"-mönster som desktop-
    // testerna ovan — här är raderna FAKTISKT brutna (155 px, mätt) och
    // `hojd` ska ändå vara ~4× det, inte radens egen naturliga 2-raders-höjd.
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
    expect(geometri.sistaBorderBottomWidth).not.toBe('0px');
    await expect(page.getByTestId('dokument-lista')).toHaveAttribute('tabindex', '0');
  });
});
