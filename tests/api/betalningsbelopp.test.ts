// Beloppsnormaliseringens kontraktstest — TASK-346.4 AC #4, DoD #5.
//
// api-pure (ren logik, ingen staging, inga creds): modulen
// `_shared/betalningsbelopp.ts` är importfri och Deno-fri, så den kan köras
// rakt i Node. Samma klass som `tests/api/kvittoserie.test.ts`.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARJE REGEL BÄR SIN EGEN NEGATIVA KONTROLL (DoD #5)
// ═══════════════════════════════════════════════════════════════════════════
// DoD #5 kräver att testet "fäller en trasig implementation". Ett test som
// bara påstår `normaliseraBelopp('2500') === 2500` uppfyller inte det: den
// enklaste trasiga implementationen — `Number(text)` — är grön på precis den
// raden.
//
// Varje regel prövas därför i TVÅ riktningar:
//   (a) den riktiga implementationen ger rätt svar, och
//   (b) en TRASIG implementation (skriven här, aldrig i produktionskoden) ger
//       ETT ANNAT svar på samma indata — vilket bevisar att raden i (a)
//       faktiskt diskriminerar.
//
// De trasiga varianterna är inte påhittade halmgubbar: `Number(...)` och
// `parseFloat(...)` är exakt de två som en förbipasserande skulle skriva, och
// båda är tyst fel för pengar (se modulens filhuvud).

import { expect, test } from '@playwright/test';
import {
  BELOPP_MAX,
  lasNumeric,
  normaliseraBelopp,
  summeraKronor,
} from '../../supabase/functions/_shared/betalningsbelopp';

/** DEN TRASIGA VARIANTEN: den självklara, och den tyst felaktiga. */
function trasigNumber(text: string): number | null {
  const tal = Number(text);
  return Number.isNaN(tal) ? null : tal;
}

/** DEN ANDRA TRASIGA VARIANTEN: läser ett prefix och slänger resten. */
function trasigParseFloat(text: string): number | null {
  const tal = Number.parseFloat(text.replace(',', '.'));
  return Number.isNaN(tal) ? null : tal;
}

// ═══════════════════════════════════════════════════════════════════════════
// § 1 — De fyra fallen kortet namnger (AC #4)
// ═══════════════════════════════════════════════════════════════════════════

test.describe('normaliseraBelopp — kortets fyra namngivna fall', () => {
  test("'2 500,00' (som banken visar det) blir 2500", () => {
    expect(normaliseraBelopp('2 500,00')).toBe(2500);
  });

  test("NEGATIV KONTROLL: Number('2 500,00') ger NaN — raden ovan diskriminerar", () => {
    // Utan denna rad kunde `normaliseraBelopp` vara `Number` i förklädnad.
    expect(trasigNumber('2 500,00')).toBeNull();
  });

  test("'2500,50' blir 2500.5", () => {
    expect(normaliseraBelopp('2500,50')).toBe(2500.5);
  });

  test("NEGATIV KONTROLL: Number('2500,50') ger NaN", () => {
    expect(trasigNumber('2500,50')).toBeNull();
  });

  test("'abc' avvisas", () => {
    expect(normaliseraBelopp('abc')).toBeNull();
  });

  test("'1e3' AVVISAS — och det är hela poängen", () => {
    // Exponentnotation är den farligaste av de fyra: den ger ett TAL, och
    // talet är tusen gånger fel mot vad Lotta skrev.
    expect(normaliseraBelopp('1e3')).toBeNull();
  });

  test("NEGATIV KONTROLL: Number('1e3') ger 1000 — ett tal där ett fel var rätt svar", () => {
    expect(trasigNumber('1e3')).toBe(1000);
    // Och den trasiga varianten är alltså INTE utbytbar mot den riktiga:
    expect(trasigNumber('1e3')).not.toBe(normaliseraBelopp('1e3'));
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 2 — Formerna Lotta och banken faktiskt producerar
// ═══════════════════════════════════════════════════════════════════════════

test.describe('normaliseraBelopp — accepterade former', () => {
  test('hela kronor, med och utan avgränsare', () => {
    expect(normaliseraBelopp('2500')).toBe(2500);
    expect(normaliseraBelopp('2 500')).toBe(2500);
    expect(normaliseraBelopp('1 000 000')).toBe(1000000);
  });

  test('hårt blanksteg och smalt hårt blanksteg (kopierad bankrad)', () => {
    // Det är DE HÄR tecknen en klistrad bankrad faktiskt bär, och de är
    // osynligt olika från ett vanligt blanksteg i en editor.
    expect(normaliseraBelopp(`2${String.fromCodePoint(0x00a0)}500,00`)).toBe(2500);
    expect(normaliseraBelopp(`2${String.fromCodePoint(0x202f)}500,00`)).toBe(2500);
    expect(normaliseraBelopp(`2${String.fromCodePoint(0x2009)}500`)).toBe(2500);
  });

  test('valutasuffix strippas', () => {
    expect(normaliseraBelopp('2 500 kr')).toBe(2500);
    expect(normaliseraBelopp('1000:-')).toBe(1000);
    expect(normaliseraBelopp('2500 SEK')).toBe(2500);
    expect(normaliseraBelopp('2500 kronor')).toBe(2500);
  });

  test('punkt som decimaltecken (numeriska tangentbordet)', () => {
    expect(normaliseraBelopp('12.50')).toBe(12.5);
  });

  test('negativt belopp (återbetalning)', () => {
    expect(normaliseraBelopp('-500')).toBe(-500);
    expect(normaliseraBelopp('-2 500,00')).toBe(-2500);
  });

  test('noll är ett TAL, inte ett parse-fel', () => {
    // Skillnaden är inte akademisk: "obegripligt" och "noll" måste kunna ge
    // OLIKA felmeddelanden för Lotta. Domänen avvisar noll (check-constraint
    // `inbetalningar_belopp_ej_noll`), parsern gör det inte.
    expect(normaliseraBelopp('0')).toBe(0);
    expect(Object.is(normaliseraBelopp('-0'), -0)).toBe(false);
  });
});

test.describe('normaliseraBelopp — avvisade former (negativ kontroll som mängd)', () => {
  test('allt som inte ENTYDIGT är ett belopp blir null', () => {
    for (const skrap of [
      '',
      '   ',
      'abc',
      '1e3',
      '1E3',
      '0x10',
      'Infinity',
      '-Infinity',
      'NaN',
      '12abc',
      '1,2,3',
      '1.2.3',
      '1,234', // tre decimaler — kolumnen är numeric(12,2)
      '2.500', // tvetydig tusentalsform, se modulens filhuvud
      '--5',
      '+5',
      '5-',
      'kr',
    ]) {
      expect(normaliseraBelopp(skrap), `"${skrap}" ska avvisas`).toBeNull();
    }
  });

  test('NEGATIV KONTROLL: parseFloat läser prefixet och tiger om resten', () => {
    // Detta är felklassen ovanstående mängd finns för att stänga.
    expect(trasigParseFloat('12abc')).toBe(12);
    expect(trasigParseFloat('1,2,3')).toBe(1.2);
    expect(normaliseraBelopp('12abc')).toBeNull();
    expect(normaliseraBelopp('1,2,3')).toBeNull();
  });

  test('icke-strängar avvisas utan att kasta', () => {
    for (const skrap of [null, undefined, 42, {}, [], true]) {
      expect(normaliseraBelopp(skrap)).toBeNull();
    }
  });

  test('bortom kolumnens bredd avvisas', () => {
    expect(normaliseraBelopp(String(BELOPP_MAX))).toBe(BELOPP_MAX);
    expect(normaliseraBelopp('99999999999')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 3 — Summan: flyttalsdriften som annars når basens spegel
// ═══════════════════════════════════════════════════════════════════════════

test.describe('summeraKronor', () => {
  test('summerar utan flyttalsdrift', () => {
    expect(summeraKronor([1000.1, 2000.2])).toBe(3000.3);
    expect(summeraKronor([0.1, 0.2])).toBe(0.3);
    expect(summeraKronor([])).toBe(0);
  });

  test('NEGATIV KONTROLL: den naiva summan driver — och driften skrivs till basen', () => {
    const naiv = [0.1, 0.2].reduce((a, b) => a + b, 0);
    expect(naiv).not.toBe(0.3);
    expect(summeraKronor([0.1, 0.2])).toBe(0.3);
  });

  test('negativa poster (återbetalningar) drar ned summan', () => {
    expect(summeraKronor([2500, -500])).toBe(2000);
    expect(summeraKronor([1000, 1500, -2500])).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// § 4 — `numeric` som sträng: PostgREST-sidan
// ═══════════════════════════════════════════════════════════════════════════

test.describe('lasNumeric', () => {
  test('läser PostgREST:s strängform', () => {
    expect(lasNumeric('2500.00')).toBe(2500);
    expect(lasNumeric('-500.50')).toBe(-500.5);
    expect(lasNumeric(1000)).toBe(1000);
  });

  test('tomt, null och skräp ger null i stället för 0', () => {
    // `Number('')` är 0 — och en kolumn som saknar värde är INTE ett
    // nollbelopp.
    expect(lasNumeric('')).toBeNull();
    expect(lasNumeric(null)).toBeNull();
    expect(lasNumeric(undefined)).toBeNull();
    expect(lasNumeric('abc')).toBeNull();
  });

  test('SKILJER SIG MEDVETET från normaliseraBelopp', () => {
    // `lasNumeric` läser ett värde databasen redan validerat; den får därför
    // vara tillåtande. `normaliseraBelopp` läser vad en människa skrev och
    // måste vara strikt. Att blanda ihop dem vore precis den fälla modulens
    // filhuvud beskriver.
    expect(lasNumeric('1e3')).toBe(1000);
    expect(normaliseraBelopp('1e3')).toBeNull();
  });
});
