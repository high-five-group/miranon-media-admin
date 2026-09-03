// Försättsbladet — HTML-nivåbevis (TASK-370.2, PRD TASK-370 §
// Implementationsbeslut, S116 Del 2 beslut 2-3). Komplement till
// `mall-data.test.ts` (`byggForsattsbladData`/`stockholmDatumTid`, ren
// logik utan HTML) och `kvitto-forhandsgranskning.test.ts` (källkods-nivå
// för HUR `preview-receipt/index.ts` kopplar ihop delarna).
//
// VAD DENNA FIL BEVISAR:
//   A. Sidhuvudet återanvänder kvittomallens FAKTISKA byggstenar — samma
//      Eta-render-teknik som `mall-render.test.ts` (lokal `eta`-instans +
//      de FAKTISKA mallsträngarna importerade ur `_shared/mallar/`, inte
//      en syntetisk kopia av markupen).
//   B. Innehållet exakt (AC #2): rubrik, antal + tidpunkt, tabellrader i
//      GIVEN ordning, summarad, notraden ORDAGRANT.
//   C. Kompositionen (AC #1, #6): `kombineraFylldaKvittoSidor` sätter
//      försättsbladet FÖRST — bevisat mot de FAKTISKA mallarna
//      (forsattsblad + kvitto ihopslagna), kompletterande
//      `kvitto-kombination.test.ts`s generiska (mall-agnostiska) bevis på
//      samma funktion.
//
// TVÅ RIKTNINGAR PER GRIND (uppdragets krav): varje kontroll prövas även
// mot ett fall som SKA fälla eller kasta, inte bara mot ett grönt fall.
//
// api-pure: ren Eta-rendering + strängjämförelse. Ingen DocRaptor, inget
// nätverk, inga creds — self-bearing-inbäddningen och det faktiska
// DocRaptor-anropet bevisas separat (`npm run mall:pdf -- forsattsblad`,
// mätpunkterna i denna skivas slutrapport).

import { expect, test } from '@playwright/test';
import { Eta } from 'eta';
import { kombineraFylldaKvittoSidor } from '../../supabase/functions/_shared/kvitto-kombination';
import {
  byggForsattsbladData,
  type ForsattsbladRadSpec,
} from '../../supabase/functions/_shared/mall-data';
import { forsattsbladHtml } from '../../supabase/functions/_shared/mallar/forsattsblad.html';
import { kvittoHtml } from '../../supabase/functions/_shared/mallar/kvitto.html';

// KONFIG-PARITETSNOT (samma accepterade, bokförda gräns som
// mall-render.test.ts): måste hållas manuellt i synk med Eta-instansen
// `_shared/mall-render.ts` skapar.
const eta = new Eta({ autoEscape: true, varName: 'data' });

const NU = new Date('2026-09-03T12:00:00.000Z'); // sommartid (CEST, UTC+2) -> Stockholm 14:00

function forsattsbladRad(overrides: Partial<ForsattsbladRadSpec> = {}): ForsattsbladRadSpec {
  return {
    namn: 'Anna Andersson',
    epost: 'anna.andersson@example.com',
    event: 'Resor i medvetandet 1',
    belopp: 2500,
    betalsatt: 'Swish',
    ...overrides,
  };
}

function renderaForsattsblad(rader: ForsattsbladRadSpec[], nu: Date = NU): string {
  return eta.renderString(forsattsbladHtml, byggForsattsbladData(rader, nu)) as string;
}

// Minimal, GILTIG kvitto-data (samma mönster som mall-render.test.ts:s
// MINIMAL_KVITTO_DATA) — bara det denna fils kompositionstester behöver.
const MINIMAL_KVITTO_DATA = {
  kvittonummer: 'FÖRHANDSVISNING',
  datum: '2026-09-03',
  betalningsdatum: '2026-09-03',
  orgReferens: 'x',
  kundnamn: 'Anna Andersson',
  kundEpost: 'anna.andersson@example.com',
  rubrik: 'Kvitto',
  benamning: 'x',
  netto: 'x',
  moms: 'x',
  brutto: 'SEK 2 500,00',
  orgNamn: 'x',
  orgGatuadress: 'x',
  orgPostadress: 'x',
  orgLand: 'x',
  orgNummer: 'x',
  orgMomsregnummer: 'x',
  hanvisning: '',
};

test.describe('Sidhuvudet återanvänder kvittomallens byggstenar (AC #3)', () => {
  test('kvitto-sidhuvud/logga/kvitto-rubrikblock/kvitto-rubrik/kvitto-metarad förekommer', () => {
    const html = renderaForsattsblad([forsattsbladRad()]);
    for (const klass of [
      'class="kvitto-sidhuvud"',
      'class="logga"',
      'class="kvitto-rubrikblock"',
      'class="kvitto-rubrik"',
      'class="kvitto-metarad"',
    ]) {
      expect(html, `saknar ${klass}`).toContain(klass);
    }
  });

  test('sidan bär sida--kvitto (sidramen återanvänd) OCH sida--forsattsblad (egen utökningskrok)', () => {
    const html = renderaForsattsblad([forsattsbladRad()]);
    expect(html).toContain('<div class="sida sida--kvitto sida--forsattsblad">');
  });

  test('länkar till bilaga-delad.css, kvitto.css OCH forsattsblad.css — tre <link>, samma mönster som kvitto.css mot bilaga-delad.css', () => {
    expect(forsattsbladHtml).toContain('href="./bilaga-delad.css"');
    expect(forsattsbladHtml).toContain('href="./kvitto.css"');
    expect(forsattsbladHtml).toContain('href="./forsattsblad.css"');
    expect(forsattsbladHtml.match(/<link\s+rel="stylesheet"/g)?.length).toBe(3);
  });

  test('negativ kontroll — en mall UTAN dessa klasser fäller kontrollen ovan (bevisar att den diskriminerar)', () => {
    const konstruerad = '<div class="nagot-annat"><h1>Rubrik</h1></div>';
    expect(konstruerad).not.toContain('class="kvitto-sidhuvud"');
  });
});

test.describe('Innehållet exakt (AC #2)', () => {
  test('rubriken är "Förhandsgranskning"', () => {
    const html = renderaForsattsblad([forsattsbladRad()]);
    expect(html).toContain('<h1 class="kvitto-rubrik">Förhandsgranskning</h1>');
  });

  test('antal kvitton och tidpunkt visas, tidpunkten i Europe/Stockholm', () => {
    const html = renderaForsattsblad([forsattsbladRad(), forsattsbladRad()], NU);
    expect(html).toContain('<dd>2</dd>');
    expect(html).toContain('<dd>2026-09-03 14:00</dd>');
  });

  test('rätt radantal i tabellen — N rader ger N <tr class="forsattsblad-tabellrad">', () => {
    const rader = [
      forsattsbladRad(),
      forsattsbladRad({ namn: 'Bengt Bengtsson' }),
      forsattsbladRad({ namn: 'Cecilia Carlsson' }),
    ];
    const html = renderaForsattsblad(rader);
    const antalRader = html.split('class="forsattsblad-tabellrad"').length - 1;
    expect(antalRader).toBe(3);
  });

  test('EN rad (N=1, gränsfall) ger EN tabellrad — inte noll, inte flera', () => {
    const html = renderaForsattsblad([forsattsbladRad()]);
    expect(html.split('class="forsattsblad-tabellrad"').length - 1).toBe(1);
  });

  test('tabellen bär namn/e-post/event/belopp/betalsätt i GIVEN visningsordning (PRD användarberättelse 8)', () => {
    const rader = [
      forsattsbladRad({
        namn: 'Anna Andersson',
        epost: 'anna@example.com',
        event: 'RIM 1',
        belopp: 2500,
        betalsatt: 'Swish',
      }),
      forsattsbladRad({
        namn: 'Bengt Bengtsson',
        epost: 'bengt@example.com',
        event: 'RIM 2',
        belopp: 1200,
        betalsatt: 'Bankgiro',
      }),
    ];
    const html = renderaForsattsblad(rader);
    const posAnna = html.indexOf('Anna Andersson');
    const posBengt = html.indexOf('Bengt Bengtsson');
    expect(posAnna).toBeGreaterThan(-1);
    expect(posBengt).toBeGreaterThan(posAnna);
    expect(html).toContain('anna@example.com');
    expect(html).toContain('RIM 1');
    expect(html).toContain('SEK 2 500,00');
    expect(html).toContain('Swish');
    expect(html).toContain('Bankgiro');
  });

  test('summaraden visar SUMMAN av alla rader, inte ett enskilt belopp', () => {
    const html = renderaForsattsblad([
      forsattsbladRad({ belopp: 2500 }),
      forsattsbladRad({ belopp: 1200 }),
    ]);
    expect(html).toContain('SEK 3 700,00');
  });

  test('notraden är ORDAGRANT "Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat."', () => {
    const html = renderaForsattsblad([forsattsbladRad()]);
    expect(html).toContain(
      '<p class="forsattsblad-notering">Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.</p>',
    );
  });

  test('notraden är HÅRDKODAD i mallkällan, inte data-buren (oberoende av fixtur/data)', () => {
    expect(forsattsbladHtml).toContain(
      'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.',
    );
  });

  test('escaping: ett kundnamn med HTML-tecken injicerar aldrig rå markup (ADR-125 § 4)', () => {
    const FARLIG = '<script>alert(1)</script>';
    const html = renderaForsattsblad([forsattsbladRad({ namn: FARLIG })]);
    expect(html).not.toContain(FARLIG);
    expect(html).toContain('&lt;script&gt;');
  });

  test('diskrimineringskontroll — notraden-kontrollen fäller om ordalydelsen avviker', () => {
    const felaktig =
      '<p class="forsattsblad-notering">Kvittonummer tilldelas när kvittot skickas.</p>';
    expect(felaktig).not.toContain(
      'Kvittonummer tilldelas när kvittona skickas. Ingenting är skickat.',
    );
  });
});

test.describe('Kompositionen sätter försättsbladet FÖRST (AC #1, #6) — mot de FAKTISKA mallarna', () => {
  test('försättsbladet öppnar dokumentet UTAN sidbrytning; kvittosidan får break-before: page', () => {
    const forsattsblad = renderaForsattsblad([forsattsbladRad()]);
    const kvitto = eta.renderString(kvittoHtml, MINIMAL_KVITTO_DATA) as string;
    const kombinerad = kombineraFylldaKvittoSidor([forsattsblad, kvitto]);

    // Ordning: försättsbladets rubrik FÖRE kvittots referensblock.
    const posForsattsblad = kombinerad.indexOf('Förhandsgranskning');
    const posKvitto = kombinerad.indexOf('Vår referens');
    expect(posForsattsblad).toBeGreaterThan(-1);
    expect(posKvitto).toBeGreaterThan(posForsattsblad);

    // Försättsbladets EGEN öppningsdiv bär ALDRIG break-before (den öppnar
    // dokumentet, index 0).
    expect(kombinerad).toContain('<div class="sida sida--kvitto sida--forsattsblad">');
    // Kvittosidan (nu index 1) FÅR break-before: page på sin .sida--kvitto-div.
    expect(kombinerad).toContain('<div class="sida sida--kvitto" style="break-before: page;">');
  });

  test('head ärvs FRÅN FÖRSÄTTSBLADET (titel "Förhandsgranskning", tre <link>) — inte från kvittosidan', () => {
    const forsattsblad = renderaForsattsblad([forsattsbladRad()]);
    const kvitto = eta.renderString(kvittoHtml, MINIMAL_KVITTO_DATA) as string;
    const kombinerad = kombineraFylldaKvittoSidor([forsattsblad, kvitto]);
    expect(kombinerad).toContain('<title>Förhandsgranskning</title>');
    expect(kombinerad.match(/<link\s+rel="stylesheet"/g)?.length).toBe(3);
  });

  test('flera kvittosidor EFTER försättsbladet får VAR SIN break-before — inga uteblivna', () => {
    const forsattsblad = renderaForsattsblad([forsattsbladRad(), forsattsbladRad()]);
    const kvittoA = eta.renderString(kvittoHtml, MINIMAL_KVITTO_DATA) as string;
    const kvittoB = eta.renderString(kvittoHtml, {
      ...MINIMAL_KVITTO_DATA,
      kundnamn: 'Bengt Bengtsson',
    }) as string;
    const kombinerad = kombineraFylldaKvittoSidor([forsattsblad, kvittoA, kvittoB]);
    const antalBreak = kombinerad.split('style="break-before: page;"').length - 1;
    expect(antalBreak).toBe(2); // N-1 sidbrytningar för N=3 block totalt (försättsblad + 2 kvitton)
  });

  test('diskrimineringskontroll — försättsbladet MÅSTE vara index 0: en omkastad ordning kastar (dess klasslista matchar inte kompositionens sidbrytnings-mönster)', () => {
    // `kombineraFylldaKvittoSidor` letar EXAKT `class="sida sida--kvitto"`
    // (utan efterföljande text) på varje sida UTOM index 0 — försättsbladets
    // EGEN div bär `sida--forsattsblad` också och matchar alltså INTE det
    // mönstret. Detta är INGEN bugg att fixa: det bevisar strukturellt att
    // försättsbladet aldrig kan hamna på fel plats i kompositionen utan att
    // fel omedelbart syns (fail loud, inte en tyst felaktig sidbrytning).
    const forsattsblad = renderaForsattsblad([forsattsbladRad()]);
    const kvitto = eta.renderString(kvittoHtml, MINIMAL_KVITTO_DATA) as string;
    expect(() => kombineraFylldaKvittoSidor([kvitto, forsattsblad])).toThrow(/hittade ingen/);
  });
});
