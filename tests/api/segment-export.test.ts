// Enhetstest för SKOOL-export-helpern (Fas 6g L4, ADR-062 b4/6).
//
// api-pure (ren logik, ingen staging) → körs lokalt + CI. Låser dedup på
// normaliserad e-post, exklusion av e-post-lösa (räknad), normalisering
// (case/whitespace), tomt segment, CSV-formen (header + e-post först), att
// consent IGNORERAS (SKOOL = access-ström), samt filnamns-byggaren.

import { expect, test } from '@playwright/test';
import type { SegmentMember } from '../../src/domain/schemas';
import { buildSkoolExport, skoolExportFilename } from '../../src/lib/segment-export';

/** En SegmentMember (compute-segment-formen) — namn/email nullbara, consent boolean. */
function m(overrides: Partial<SegmentMember> = {}): SegmentMember {
  return {
    id: `recM${Math.random().toString(36).slice(2, 8)}`,
    namn: 'Anna Andersson',
    email: 'anna@example.se',
    ejGodkandMail: false,
    ...overrides,
  };
}

test.describe('buildSkoolExport — dedup, exklusion, normalisering', () => {
  test('dedup: samma normaliserade e-post kollapsar till EN rad (behåller första)', () => {
    const out = buildSkoolExport([
      m({ namn: 'Första', email: 'dup@example.se' }),
      m({ namn: 'Andra', email: 'dup@example.se' }),
    ]);
    expect(out.exportedCount).toBe(1);
    expect(out.excludedCount).toBe(0);
    // Första förekomsten vinner.
    expect(out.csv).toContain('dup@example.se,Första');
    expect(out.csv).not.toContain('Andra');
  });

  test('normalisering: case + whitespace → samma e-post → dedup', () => {
    const out = buildSkoolExport([
      m({ email: 'Person@Example.SE' }),
      m({ email: '  person@example.se  ' }),
    ]);
    expect(out.exportedCount).toBe(1);
    // Normaliserad form lagras (lowercase + trim).
    expect(out.csv).toContain('person@example.se');
    expect(out.csv).not.toContain('Person@Example.SE');
  });

  test('exklusion: null / whitespace-only / saknar @ → räknas i excludedCount', () => {
    const out = buildSkoolExport([
      m({ email: 'giltig@example.se' }),
      m({ email: null }),
      m({ email: '   ' }),
      m({ email: 'utan-snabel-a.example.se' }),
    ]);
    expect(out.exportedCount).toBe(1);
    expect(out.excludedCount).toBe(3);
  });

  test('tomt segment: [] → endast header, counts 0/0', () => {
    const out = buildSkoolExport([]);
    expect(out.exportedCount).toBe(0);
    expect(out.excludedCount).toBe(0);
    expect(out.csv).toBe('email,name');
  });
});

test.describe('buildSkoolExport — CSV-form + consent', () => {
  test('CSV: header-rad + e-post FÖRST, namn-kolumn (CRLF)', () => {
    const out = buildSkoolExport([m({ namn: 'Bo Berg', email: 'bo@example.se' })]);
    const lines = out.csv.split('\r\n');
    expect(lines[0]).toBe('email,name');
    expect(lines[1]).toBe('bo@example.se,Bo Berg');
  });

  test('CSV: blank-tolerant namn (null → tom namn-kolumn, e-post kvar)', () => {
    const out = buildSkoolExport([m({ namn: null, email: 'noname@example.se' })]);
    expect(out.csv.split('\r\n')[1]).toBe('noname@example.se,');
  });

  test('CSV: namn med komma/citattecken omsluts + escapas (RFC 4180)', () => {
    const out = buildSkoolExport([m({ namn: 'Berg, "Bo"', email: 'x@example.se' })]);
    expect(out.csv.split('\r\n')[1]).toBe('x@example.se,"Berg, ""Bo"""');
  });

  test('consent IGNORERAS: ejGodkandMail=true kommer MED (SKOOL = access-ström)', () => {
    const out = buildSkoolExport([
      m({ email: 'optout@example.se', ejGodkandMail: true }),
      m({ email: 'optin@example.se', ejGodkandMail: false }),
    ]);
    expect(out.exportedCount).toBe(2);
    expect(out.csv).toContain('optout@example.se');
    expect(out.csv).toContain('optin@example.se');
  });
});

test.describe('skoolExportFilename', () => {
  test('slug + datum: namn → fil-säkert, svenska tecken translittererade', () => {
    const name = skoolExportFilename('Fjärrskådning-deltagare', new Date(2026, 5, 27));
    expect(name).toBe('skool-fjarrskadning-deltagare-2026-06-27.csv');
  });

  test('tomt/null namn → "segment"-fallback (aldrig naket bindestreck)', () => {
    expect(skoolExportFilename(null, new Date(2026, 0, 5))).toBe('skool-segment-2026-01-05.csv');
    expect(skoolExportFilename('   ', new Date(2026, 0, 5))).toBe('skool-segment-2026-01-05.csv');
  });
});
