// Uttömmande enhetstest för segment-medlemskaps-MOTORN (Fas 6g L1, ADR-064).
//
// api-pure (ren logik, ingen staging, inga creds) → körs lokalt + CI. Låser
// algebran in-memory: kvalificerad ⟺ ≥1 include-par (OR) AND 0 exclude-par
// (NOT-any); include=[] ⇒ []; (kurs × modalitet)-MÄNGD ⇒ tvådagars-dedup gratis;
// modalitet-skiljande korrekthet (golv). Bevisar OCKSÅ parseSegmentRule:
// felformad regel → InvalidSegmentRuleError (EF mappar → 400) utan att deploya.

import { expect, test } from '@playwright/test';
import {
  type AttendanceRow,
  computeMembership,
  InvalidSegmentRuleError,
  parseSegmentRule,
  type SegmentRule,
} from '../../supabase/functions/_shared/segment-membership';

// Kortform för att bygga närvaro-rader: row(person, kurs, modalitet).
function row(
  personId: string,
  kurs: string,
  modalitet: 'Utbildning' | 'Föreläsning',
): AttendanceRow {
  return { personId, kurs, modalitet };
}
const U = 'Utbildning' as const;
const F = 'Föreläsning' as const;

function rule(include: SegmentRule['include'], exclude: SegmentRule['exclude'] = []): SegmentRule {
  return { include, exclude };
}

test.describe('computeMembership — algebra (ADR-064)', () => {
  test('include=[] ⇒ [] (tom OR kvalificerar ingen)', () => {
    const rows = [row('p1', 'RIM 1', U), row('p2', 'Fjärrskådning', U)];
    expect(computeMembership(rule([]), rows)).toEqual([]);
    // exclude utan include kvalificerar fortfarande ingen.
    expect(computeMembership(rule([], [{ kurs: 'RIM 1', modalitet: U }]), rows)).toEqual([]);
  });

  test('tomma rader ⇒ []', () => {
    expect(computeMembership(rule([{ kurs: 'RIM 1', modalitet: U }]), [])).toEqual([]);
  });

  test('enkel hit: person med (RIM 1, Utbildning) matchar include[(RIM 1, Utbildning)]', () => {
    const rows = [row('p1', 'RIM 1', U)];
    expect(computeMembership(rule([{ kurs: 'RIM 1', modalitet: U }]), rows)).toEqual(['p1']);
  });

  test('GOLV — modalitet-skiljande: (Fjärrskådning, Föreläsning) matchar EJ include[(Fjärrskådning, Utbildning)]', () => {
    const rows = [row('p1', 'Fjärrskådning', F)];
    expect(computeMembership(rule([{ kurs: 'Fjärrskådning', modalitet: U }]), rows)).toEqual([]);
    // ...men matchar include[(Fjärrskådning, Föreläsning)].
    expect(computeMembership(rule([{ kurs: 'Fjärrskådning', modalitet: F }]), rows)).toEqual([
      'p1',
    ]);
  });

  test('include-OR: person med bara (RIM 2, U) matchar include[(RIM 1, U), (RIM 2, U)]', () => {
    const rows = [row('p1', 'RIM 2', U)];
    expect(
      computeMembership(
        rule([
          { kurs: 'RIM 1', modalitet: U },
          { kurs: 'RIM 2', modalitet: U },
        ]),
        rows,
      ),
    ).toEqual(['p1']);
  });

  test('exclude NOT-any: include[(RIM 1, U)] exclude[(RIM 2, U)] ⇒ person med BÅDA diskvalificeras', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'RIM 2', U)];
    expect(
      computeMembership(
        rule([{ kurs: 'RIM 1', modalitet: U }], [{ kurs: 'RIM 2', modalitet: U }]),
        rows,
      ),
    ).toEqual([]);
  });

  test('exclude icke-matchande: include[(RIM 1, U)] exclude[(Psionautics, U)] ⇒ person utan Psionautics kvalificerar', () => {
    const rows = [row('p1', 'RIM 1', U)];
    expect(
      computeMembership(
        rule([{ kurs: 'RIM 1', modalitet: U }], [{ kurs: 'Psionautics', modalitet: U }]),
        rows,
      ),
    ).toEqual(['p1']);
  });

  test('"enbart X" (explicit expanderad regel): include[(RIM 1, U)] exclude[övriga domän-par]', () => {
    // p1 har BARA RIM 1 → kvalificerar. p2 har RIM 1 + RIM 2 → exkluderas av exclude[(RIM 2)].
    const rows = [row('p1', 'RIM 1', U), row('p2', 'RIM 1', U), row('p2', 'RIM 2', U)];
    const enbartRim1 = rule(
      [{ kurs: 'RIM 1', modalitet: U }],
      [
        { kurs: 'RIM 2', modalitet: U },
        { kurs: 'RIM 3', modalitet: U },
        { kurs: 'Fjärrskådning', modalitet: U },
        { kurs: 'Psionautics', modalitet: U },
      ],
    );
    expect(computeMembership(enbartRim1, rows)).toEqual(['p1']);
  });

  test('tvådagars-dedup: två (RIM 1, U)-rader (Dag 1 + Dag 2) ⇒ EN medlem', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'RIM 1', U)];
    expect(computeMembership(rule([{ kurs: 'RIM 1', modalitet: U }]), rows)).toEqual(['p1']);
  });

  test('multi-person + count: bara matchande personer returneras, distinkt', () => {
    const rows = [
      row('pA', 'RIM 1', U),
      row('pA', 'RIM 1', U), // dubblett samma par
      row('pB', 'Psionautics', U),
      row('pC', 'RIM 1', U),
    ];
    const members = computeMembership(rule([{ kurs: 'RIM 1', modalitet: U }]), rows);
    expect(members).toEqual(['pA', 'pC']); // pB (Psionautics) ej med
    expect(members.length).toBe(2);
  });
});

test.describe('parseSegmentRule — form-validering (EF mappar fel → 400)', () => {
  test('giltig regel parsas igenom', () => {
    const parsed = parseSegmentRule({
      include: [{ kurs: 'RIM 1', modalitet: 'Utbildning' }],
      exclude: [{ kurs: 'Psionautics', modalitet: 'Föreläsning' }],
    });
    expect(parsed.include).toHaveLength(1);
    expect(parsed.exclude[0]).toEqual({ kurs: 'Psionautics', modalitet: 'Föreläsning' });
  });

  test('tomma include/exclude är giltig form', () => {
    expect(parseSegmentRule({ include: [], exclude: [] })).toEqual({ include: [], exclude: [] });
  });

  for (const bad of [
    null,
    42,
    'sträng',
    [],
    {}, // saknar include/exclude
    { include: [], exclude: 'x' }, // exclude ej array
    { include: 'x', exclude: [] }, // include ej array
    { include: [{ kurs: 'RIM 1' }], exclude: [] }, // saknar modalitet
    { include: [{ kurs: '', modalitet: 'Utbildning' }], exclude: [] }, // tom kurs
    { include: [{ kurs: 'RIM 1', modalitet: 'Kurs' }], exclude: [] }, // ogiltig modalitet
    { include: [{ kurs: 'RIM 1', modalitet: 'utbildning' }], exclude: [] }, // fel skiftläge
    { include: ['RIM 1'], exclude: [] }, // par ej objekt
  ]) {
    test(`felformad regel → InvalidSegmentRuleError: ${JSON.stringify(bad)}`, () => {
      expect(() => parseSegmentRule(bad)).toThrow(InvalidSegmentRuleError);
    });
  }
});
