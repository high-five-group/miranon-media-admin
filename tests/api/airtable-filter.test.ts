// M5 fuzz- och INVARIANT-tester för airtable-filter helpers (LAGER 1, pure).
//
// Pure-logik (importerar helpers direkt — ingen HTTP):
//   - INVARIANT round-trip: escape → parse → exakt samma input
//   - Per-kategori fuzz: quote/escape, funktionsnamn, unicode,
//     långa strängar
//   Atomär verifiering — om alla 30+ inputs round-trip:as förlustfritt
//   så vet vi att Airtable inte kan tolka outputen som något annat än
//   input-strängen.
//
// LAGER 2 (end-to-end fuzz mot deployad runtime) flyttades till
// airtable-filter.staging.test.ts i K0åc.1 2026-05-11 för Playwright-
// projekt-split (api-pure vs api-staging).

import { expect, test } from '@playwright/test';
import {
  buildEqualsFilter,
  buildLinkedRecordFilter,
  buildSearchAcrossFieldsFilter,
  combineWithAnd,
  escapeFormulaValue,
  parseAirtableString,
} from '../../supabase/functions/_shared/airtable-filter';

// =============================================================
// LAGER 1: Pure-logik tester
// =============================================================

// Konstrueras via String.fromCharCode så filens visuella encoding inte
// spelar roll och tester förblir deterministiska.
const ch = (code: number): string => String.fromCharCode(code);

const SAFE_INPUTS: ReadonlyArray<{ label: string; input: string }> = [
  { label: 'tom strang', input: '' },
  { label: 'enkel ASCII', input: 'hello world' },
  { label: 'svenska tecken', input: 'Bekraftad (mail skickat)' },
  { label: 'siffror + bindestreck', input: '2026-04-15' },
  { label: 'rec-prefix-record-id', input: 'recABC123def456' },
  { label: 'mellanslag fore+efter', input: '  trim me  ' },
];

const QUOTE_ESCAPE_INPUTS: ReadonlyArray<{ label: string; input: string }> = [
  { label: 'enkelt dubbelcitat', input: '"' },
  { label: 'enkelt backslash', input: '\\' },
  { label: 'backslash + citat', input: '\\"' },
  { label: 'citat-injection-attempt', input: '") OR TRUE() OR ("' },
  { label: 'backslash-injection', input: '\\\\\\' },
  { label: 'apostrof', input: "it's" },
];

const FORMULA_FUNCTION_INPUTS: ReadonlyArray<{ label: string; input: string }> = [
  { label: 'TRUE()', input: 'TRUE()' },
  { label: 'FALSE()', input: 'FALSE()' },
  { label: 'OR-tautology', input: 'OR(TRUE(),TRUE())' },
  { label: 'AND-injection', input: 'AND({Status}="X","Y")' },
  { label: 'NOT-attempt', input: 'NOT({Status}="X")' },
  { label: 'IF-attempt', input: 'IF(TRUE(),"a","b")' },
  { label: 'curly-field-ref', input: '{Status}' },
  { label: 'curly-break', input: '}' },
  { label: 'parenthesis-comma', input: '(),' },
];

// Alla ASCII-kontrolltecken (U+0000–U+001F) reject:as defensivt — det
// finns ingen legitim anledning för en klient att skicka TAB/LF/CR i
// ett filter-värde. Plus DEL, zero-width och bidi-tecken.
const UNICODE_DANGEROUS: ReadonlyArray<{ label: string; input: string }> = [
  { label: 'NUL (U+0000)', input: `a${ch(0x00)}b` },
  { label: 'BEL (U+0007)', input: `a${ch(0x07)}b` },
  { label: 'BS (U+0008)', input: `a${ch(0x08)}b` },
  { label: 'TAB (U+0009)', input: `a${ch(0x09)}b` },
  { label: 'LF (U+000a)', input: `line${ch(0x0a)}break` },
  { label: 'CR (U+000d)', input: `cr${ch(0x0d)}here` },
  { label: 'ESC (U+001b)', input: `a${ch(0x1b)}b` },
  { label: 'DEL (U+007f)', input: `a${ch(0x7f)}b` },
  { label: 'zero-width space (U+200b)', input: `a${ch(0x200b)}b` },
  { label: 'right-to-left override (U+202e)', input: `evil${ch(0x202e)}good` },
  { label: 'isolate LRI (U+2066)', input: `a${ch(0x2066)}b` },
];

const UNICODE_SAFE: ReadonlyArray<{ label: string; input: string }> = [
  { label: 'svenska AAO (U+00c5/c4/d6)', input: `${ch(0xc5)}${ch(0xc4)}${ch(0xd6)}` },
  { label: 'CJK 2-tecken', input: `${ch(0x4f60)}${ch(0x597d)}` },
  { label: 'Latin-1 supplement', input: `caf${ch(0xe9)}` }, // café
];

const LONG_INPUTS: ReadonlyArray<{ label: string; input: string }> = [
  { label: '999 tecken (just under limit)', input: 'a'.repeat(999) },
  { label: '1000 tecken (at limit)', input: 'a'.repeat(1000) },
];

const TOO_LONG_INPUTS: ReadonlyArray<{ label: string; input: string }> = [
  { label: '1001 tecken (just over limit)', input: 'a'.repeat(1001) },
  { label: '10000 tecken DoS-attempt', input: 'a'.repeat(10000) },
];

test.describe('airtable-filter — INVARIANT round-trip', () => {
  // For alla SAFE inputs (de som ska accepteras av escapeFormulaValue):
  // escapeFormulaValue → parseAirtableString → exakt samma input.
  // Detta bevisar att Airtable kan tolka output som input-strangen
  // och inget annat.
  const accepted = [
    ...SAFE_INPUTS,
    ...QUOTE_ESCAPE_INPUTS,
    ...FORMULA_FUNCTION_INPUTS,
    ...UNICODE_SAFE,
    ...LONG_INPUTS,
  ];

  for (const { label, input } of accepted) {
    test(`round-trip: ${label}`, () => {
      const escaped = escapeFormulaValue(input);
      const restored = parseAirtableString(escaped);
      expect(restored).toBe(input);
    });
  }
});

test.describe('airtable-filter — fuzz quote/escape', () => {
  for (const { label, input } of QUOTE_ESCAPE_INPUTS) {
    test(`accepterar och eskaperar: ${label}`, () => {
      const escaped = escapeFormulaValue(input);
      expect(escaped.startsWith('"')).toBe(true);
      expect(escaped.endsWith('"')).toBe(true);
      expect(() => parseAirtableString(escaped)).not.toThrow();
    });
  }
});

test.describe('airtable-filter — fuzz formula-functions kan inte bryta ut', () => {
  for (const { label, input } of FORMULA_FUNCTION_INPUTS) {
    test(`accepterar men haller inert: ${label}`, () => {
      const escaped = escapeFormulaValue(input);
      // Output ar fortfarande en string-litteral — inte ett uttryck.
      // parseAirtableString lyckas → outputen IS en valid string-lit.
      expect(parseAirtableString(escaped)).toBe(input);
    });
  }
});

test.describe('airtable-filter — fuzz unicode-dangerous reject:as', () => {
  for (const { label, input } of UNICODE_DANGEROUS) {
    test(`reject:ar: ${label}`, () => {
      expect(() => escapeFormulaValue(input)).toThrow(/forbidden control or bidi/);
    });
  }
});

test.describe('airtable-filter — fuzz unicode-safe accepteras', () => {
  for (const { label, input } of UNICODE_SAFE) {
    test(`accepterar: ${label}`, () => {
      const escaped = escapeFormulaValue(input);
      expect(parseAirtableString(escaped)).toBe(input);
    });
  }
});

test.describe('airtable-filter — fuzz langa strangar', () => {
  for (const { label, input } of LONG_INPUTS) {
    test(`accepterar: ${label}`, () => {
      const escaped = escapeFormulaValue(input);
      expect(parseAirtableString(escaped)).toBe(input);
    });
  }

  for (const { label, input } of TOO_LONG_INPUTS) {
    test(`reject:ar: ${label}`, () => {
      expect(() => escapeFormulaValue(input)).toThrow(/too long/);
    });
  }
});

test.describe('airtable-filter — buildLinkedRecordFilter', () => {
  test('valid recordId producerar FIND-uttryck', () => {
    const result = buildLinkedRecordFilter('Event', 'recABC123');
    expect(result).toBe('FIND("recABC123", ARRAYJOIN({Event}))');
  });

  test('reject:ar recordId utan rec-prefix', () => {
    expect(() => buildLinkedRecordFilter('Event', 'invalidId')).toThrow(/invalid recordId/);
  });

  test('reject:ar recordId med specialtecken', () => {
    expect(() => buildLinkedRecordFilter('Event', 'rec"; DROP --')).toThrow(/invalid recordId/);
  });

  test('reject:ar field-namn med curly bracket', () => {
    expect(() => buildLinkedRecordFilter('Field}', 'recABC123')).toThrow(/forbidden character/);
  });
});

test.describe('airtable-filter — buildEqualsFilter', () => {
  test('valid input producerar eq-uttryck', () => {
    const result = buildEqualsFilter('Status', 'Bekraftad');
    expect(result).toBe('{Status} = "Bekraftad"');
  });

  test('eskaperar citat i vardet', () => {
    const result = buildEqualsFilter('Status', '") OR TRUE() OR ("');
    expect(result).toBe('{Status} = "\\") OR TRUE() OR (\\""');
  });

  test('reject:ar field-namn med backslash', () => {
    expect(() => buildEqualsFilter('Field\\', 'x')).toThrow(/forbidden character/);
  });
});

test.describe('airtable-filter — buildSearchAcrossFieldsFilter', () => {
  test('OR med scalar och array falt', () => {
    const result = buildSearchAcrossFieldsFilter('foo', [
      { name: 'Namn', isArray: false },
      { name: 'Ort', isArray: true },
    ]);
    expect(result).toBe('OR(SEARCH("foo", LOWER({Namn})), SEARCH("foo", LOWER(ARRAYJOIN({Ort}))))');
  });

  test('reject:ar tom field-lista', () => {
    expect(() => buildSearchAcrossFieldsFilter('foo', [])).toThrow(/at least one field/);
  });

  test('lowercase:ar termen', () => {
    const result = buildSearchAcrossFieldsFilter('FOO', [{ name: 'Namn', isArray: false }]);
    expect(result).toContain('"foo"');
  });
});

test.describe('airtable-filter — combineWithAnd', () => {
  test('tom lista → undefined', () => {
    expect(combineWithAnd([])).toBe(undefined);
  });

  test('en filter → samma filter', () => {
    expect(combineWithAnd(['{Status} = "X"'])).toBe('{Status} = "X"');
  });

  test('flera filter → AND-uttryck', () => {
    expect(combineWithAnd(['{A} = "1"', '{B} = "2"'])).toBe('AND({A} = "1", {B} = "2")');
  });
});
