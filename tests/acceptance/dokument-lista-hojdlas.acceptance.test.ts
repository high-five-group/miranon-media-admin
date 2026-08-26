import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { http } from 'msw';
import { VISUAL_EVENT_ID } from '../support/fixturvarld/fixture-data';
import { EF, json } from '../support/fixturvarld/handlers';
import { expect, test } from './support/acceptance-bas';

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
 * TÄCKNING:
 *   AC #1 — bounding box (bredd, höjd) identisk över alla FYRA typfilter
 *     (Alla/Bilagor/Mallar/Generatorer) vid ett FIXERAT totalt antal — mätt
 *     desktop OCH 375 px.
 *   AC #2 — exakt fyra synliga rader: `scrollHeight === clientHeight`,
 *     ingen linje synlig på sista raden; fem-plus: scrollbart, linjen syns
 *     EFTER scroll (mätt via sista radens `border-bottom-width` — se
 *     `mataGeometri`); 1–3: sista raden bär linje.
 *   AC #3 — tomt läge (`GemensamtLage`, 0 rader) inom (o-låst) höjd, ingen
 *     linje; `prefers-contrast: more` visar separatorlinjerna; axe 0
 *     violations.
 *   AC #5 — samma mätning fäller på filterhoppning (test-grupp 1) OCH på
 *     1 px-scroll vid exakt fyra rader (test-grupp 2) — se § "Bevis i båda
 *     riktningar" i PR-beskrivningen för en negativ kontroll.
 *
 * KÄND, VERIFIERAD BEGRÄNSNING (rapporteras, inte gömd): `antalSynliga === 0`
 * SAMTIDIGT SOM `lasHojd` (totaltAntal > 4) är sann är ONÅBART i
 * `DokumentLista` (eventläget) via dagens UI. `MALLAR.length === 2` och
 * `GENERATORER.length === 1` (`DokumentYta.tsx`, disk-verifierat 2026-08-26)
 * är FASTA — de kan aldrig visa 0 för sig själva, och filtret 'bilaga' kan
 * bara visa 0 när `rader.length === 0`, vilket ger `totaltAntal === 3`
 * (aldrig `> 4`). Egenskapen är verifierad via KOD i stället
 * (`sistaRadenBarLinje = antalSynliga > 0 && …`, ovillkorat sant för
 * `antalSynliga === 0`) och via `GemensamtLage` nedan, där 0 rader ÄR nåbart
 * (men där, symmetriskt, alltid o-låst — `totaltAntal === antalSynliga`
 * där finns inget filter som kan hålla totalen uppe medan den synliga
 * delen är 0).
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
    rackvidd: 'Kurstyp',
    kursfamilj: 'RIM',
    kursniva: null,
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

async function gotoEventlage(page: Page) {
  await page.goto(`/mer/dokument?event=${VISUAL_EVENT_ID}`);
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
}

async function gotoRackviddslage(page: Page) {
  await page.goto('/mer/dokument');
  await expect(page.getByTestId('dokument-yta')).toBeVisible();
}

async function valjFilter(page: Page, etikett: string) {
  // `exact: true` — annars matchar 'Alla' ÄVEN 'Mallar' (Playwrights
  // namn-matchning är substräng som default, och "Mallar" innehåller
  // bokstavligen "alla"). Mätt, TASK-309.24: `strict mode violation`.
  await page.getByRole('radio', { name: etikett, exact: true }).click();
}

/** Mäter listans FULLA geometri i ETT synkront steg — ingen mätning här får
 * bero på VILKET av flera separata `evaluate`-anrop som råkar köras när,
 * annars mäter man mot ett tillstånd som redan hunnit ändra sig. */
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
    };
  });
}

test.describe('DokumentLista (eventläge) — filterbyte ändrar aldrig bounding box (regel 5)', () => {
  test('AC #1/#5: bounding box IDENTISK över Alla/Bilagor/Mallar/Generatorer vid totaltAntal=7 — desktop', async ({
    page,
    network,
  }) => {
    // 4 bilagor + 2 mallar (MALLAR, fast) + 1 generator (GENERATORER, fast)
    // = 7 — över gränsen, så `lasHojd` är sann oavsett vilket filter som
    // råkar vara aktivt. 'Bilagor' ger EXAKT fyra (gränsfallet), 'Mallar'
    // två och 'Generatorer' en — täcker därmed 1–3, exakt 4 och 5+ i EN
    // fixtur.
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

  test('AC #1/#6: samma invariant vid 375 px (radbrytningens brytpunkt, TASK-309.20)', async ({
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
  test('AC #3: 0 rader — tomt läge inom o-låst höjd, ingen linje, axe-rent', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 0));
    await gotoRackviddslage(page);
    await expect(page.getByText('Inga delade dokument än.')).toBeVisible();

    const geometri = await mataGeometri(page);
    // Ingen lasHojd (totaltAntal 0, ej > 4): scrollHeight === clientHeight
    // trivialt (overflow: visible, inget att klippa).
    expect(geometri.scrollHeight).toBe(geometri.clientHeight);
    expect(geometri.sistaBorderBottomWidth).toBe('0px');
    await expect(page.getByTestId('dokument-lista')).not.toHaveAttribute('tabindex', '0');

    const resultat = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .include('[data-testid="dokument-yta"]')
      .analyze();
    expect(resultat.violations).toEqual([]);
  });

  test('AC #2: 1 rad — naturlig höjd, sista (enda) raden bär sin linje', async ({
    page,
    network,
  }) => {
    network.use(hojdlasHandler(0, 1));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 1.pdf')).toBeVisible();
    const en = await mataGeometri(page);
    expect(en.scrollHeight).toBe(en.clientHeight);
    expect(en.sistaBorderBottomWidth).not.toBe('0px');
  });

  // EGET test, INTE en fortsättning av ovanstående via `page.reload()` —
  // ett `network.use`-omregistrerat svar efter en reload visade sig flakigt
  // (MSW-handlerns nya gren hann inte alltid vinna före sidans egen
  // laddning), samma klass av instabilitet som redan är dokumenterad för
  // `dokument-rackviddsval.acceptance.test.ts`s filbytesmönster. En fräsch
  // `goto` per test är den etablerade, stabila vägen.
  test('AC #2: 3 rader — naturlig höjd, sista raden bär sin linje', async ({ page, network }) => {
    network.use(hojdlasHandler(0, 3));
    await gotoRackviddslage(page);
    await expect(page.getByText('Delad 3.pdf')).toBeVisible();
    const tre = await mataGeometri(page);
    expect(tre.scrollHeight).toBe(tre.clientHeight);
    expect(tre.sistaBorderBottomWidth).not.toBe('0px');
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
});
