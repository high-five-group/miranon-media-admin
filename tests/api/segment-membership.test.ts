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
  computeMembershipVia,
  InvalidSegmentRuleError,
  type Konjunkt,
  type MedVillkor,
  type Par,
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

// ============================================================================
// AND/DNF-primitiven (ADR-115, TASK-249.2 EF-krav 4) — konjunkt-grupper i
// `include`, platt `exclude` oförändrad. Sorterar bort exakt den tysta
// felklassen S104 falsifierade: en ren OR-lista kan aldrig säga "gått BÅDA".
// ============================================================================

function sortPars(pars: readonly Par[]): Par[] {
  return [...pars].sort((a, b) =>
    `${a.kurs}|${a.modalitet}`.localeCompare(`${b.kurs}|${b.modalitet}`),
  );
}

test.describe('computeMembership — Konjunkt-grupper (AND, ADR-115)', () => {
  test('AND-grupp: person med BÅDA paren i gruppen matchar', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'RIM 2', U)];
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    expect(computeMembership(rule([konjunkt]), rows)).toEqual(['p1']);
  });

  test('AND-grupp: person med BARA ETT av paren matchar EJ (kärnfyndet — ren OR kunde ej säga detta)', () => {
    const rows = [row('p1', 'RIM 1', U)]; // saknar RIM 2
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    expect(computeMembership(rule([konjunkt]), rows)).toEqual([]);
    // Kontrast: samma två par som REN OR (platt include, ingen grupp) hade
    // matchat p1 — exakt skillnaden mellan OR och AND, och skälet till att
    // 10 av de fjorton Skool-grupperna var outtryckbara i den gamla formen.
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

  test('DNF: flera AND-grupper är OR mellan grupperna — person matchar om ≥1 grupp uppfylls', () => {
    const rows = [row('p1', 'Psionautics', U), row('p2', 'RIM 1', U), row('p2', 'RIM 2', U)];
    const grupp1: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    const grupp2: Konjunkt = [{ kurs: 'Psionautics', modalitet: U }];
    const members = computeMembership(rule([grupp1, grupp2]), rows);
    expect(members.sort()).toEqual(['p1', 'p2']);
  });

  test('blandad include-lista: enkla Par och Konjunkt-grupper samtidigt', () => {
    const rows = [row('p1', 'Fjärrskådning', U), row('p2', 'RIM 1', U), row('p2', 'RIM 2', U)];
    const mixed: MedVillkor[] = [
      { kurs: 'Fjärrskådning', modalitet: U }, // enkelt par (OR)
      [
        { kurs: 'RIM 1', modalitet: U },
        { kurs: 'RIM 2', modalitet: U },
      ], // Konjunkt-grupp (AND)
    ];
    expect(computeMembership(rule(mixed), rows).sort()).toEqual(['p1', 'p2']);
  });

  test('exclude förblir platt och verkar EFTER AND-grupperna: person i en uppfylld grupp diskvalificeras ändå av ett exclude-par', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'RIM 2', U), row('p1', 'Psionautics', U)];
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    expect(
      computeMembership(rule([konjunkt], [{ kurs: 'Psionautics', modalitet: U }]), rows),
    ).toEqual([]);
  });

  test('tom Konjunkt-grupp ([]) kvalificerar aldrig (fail-closed, ej vakuöst sann)', () => {
    const rows = [row('p1', 'RIM 1', U)];
    const tomGrupp: Konjunkt = [];
    expect(computeMembership(rule([tomGrupp]), rows)).toEqual([]);
  });

  test('NOLL REGRESSION (AC1): ett predikat utan flerledade grupper ger IDENTISK medlemsmängd som dagens par-lista', () => {
    const rows = [
      row('p1', 'RIM 1', U),
      row('p2', 'RIM 2', U),
      row('p3', 'Fjärrskådning', U),
      row('p3', 'Psionautics', U),
    ];
    const platt: Par[] = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    const somSingeltonGrupper: MedVillkor[] = platt.map((p) => [p] as Konjunkt);
    const exclude = [{ kurs: 'Psionautics', modalitet: U }];

    const viaPlattForm = computeMembership(rule(platt, exclude), rows);
    const viaSingeltonGrupper = computeMembership(rule(somSingeltonGrupper, exclude), rows);
    expect(viaSingeltonGrupper).toEqual(viaPlattForm);
    expect(viaPlattForm).toEqual(['p1', 'p2']); // p3 exkluderad (Psionautics)
  });
});

test.describe('computeMembershipVia — via: Par[] per medlem (ADR-115 EF-krav 1)', () => {
  test('enkelt par: via = exakt det matchande paret', () => {
    const rows = [row('p1', 'RIM 1', U)];
    const hits = computeMembershipVia(rule([{ kurs: 'RIM 1', modalitet: U }]), rows);
    expect(hits).toEqual([{ personId: 'p1', via: [{ kurs: 'RIM 1', modalitet: U }] }]);
  });

  test('AND-grupp: via = HELA gruppens par (alla krävdes för att kvalificera)', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'RIM 2', U)];
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U },
      { kurs: 'RIM 2', modalitet: U },
    ];
    const hits = computeMembershipVia(rule([konjunkt]), rows);
    expect(hits).toHaveLength(1);
    expect(sortPars(hits[0]?.via ?? [])).toEqual(
      sortPars([
        { kurs: 'RIM 1', modalitet: U },
        { kurs: 'RIM 2', modalitet: U },
      ]),
    );
  });

  test('person som matchar FLERA grupper: via = unionen av alla uppfyllda gruppers par (deduplicerad)', () => {
    const rows = [row('p1', 'RIM 1', U), row('p1', 'Psionautics', U)];
    const grupp1: Konjunkt = [{ kurs: 'RIM 1', modalitet: U }];
    const grupp2: Konjunkt = [{ kurs: 'Psionautics', modalitet: U }];
    const hits = computeMembershipVia(rule([grupp1, grupp2]), rows);
    expect(hits).toHaveLength(1);
    expect(sortPars(hits[0]?.via ?? [])).toEqual(
      sortPars([
        { kurs: 'RIM 1', modalitet: U },
        { kurs: 'Psionautics', modalitet: U },
      ]),
    );
  });

  test('ingen matchning ⇒ personen är inte med i träfflistan alls', () => {
    const rows = [row('p1', 'Fjärrskådning', U)];
    const hits = computeMembershipVia(rule([{ kurs: 'RIM 1', modalitet: U }]), rows);
    expect(hits).toEqual([]);
  });

  test('computeMembership(...) === computeMembershipVia(...).map(h => h.personId) (samma algebra, samma ordning)', () => {
    const rows = [
      row('pC', 'RIM 1', U),
      row('pA', 'RIM 1', U),
      row('pA', 'RIM 2', U),
      row('pB', 'Psionautics', U),
    ];
    const r = rule([
      [
        { kurs: 'RIM 1', modalitet: U },
        { kurs: 'RIM 2', modalitet: U },
      ] as Konjunkt,
      { kurs: 'RIM 1', modalitet: U },
    ]);
    expect(computeMembership(r, rows)).toEqual(
      computeMembershipVia(r, rows).map((h) => h.personId),
    );
  });
});

test.describe('parseSegmentRule — Konjunkt-grupper (ADR-115)', () => {
  test('en Konjunkt-grupp (array av par) parsas som AND-villkor', () => {
    const parsed = parseSegmentRule({
      include: [
        [
          { kurs: 'RIM 1', modalitet: 'Utbildning' },
          { kurs: 'RIM 2', modalitet: 'Utbildning' },
        ],
      ],
      exclude: [],
    });
    expect(parsed.include).toEqual([
      [
        { kurs: 'RIM 1', modalitet: 'Utbildning' },
        { kurs: 'RIM 2', modalitet: 'Utbildning' },
      ],
    ]);
  });

  test('blandad include (enkelt par + Konjunkt-grupp) parsas korrekt', () => {
    const parsed = parseSegmentRule({
      include: [
        { kurs: 'Psionautics', modalitet: 'Utbildning' },
        [
          { kurs: 'RIM 1', modalitet: 'Utbildning' },
          { kurs: 'RIM 2', modalitet: 'Utbildning' },
        ],
      ],
      exclude: [],
    });
    expect(parsed.include).toHaveLength(2);
    expect(parsed.include[0]).toEqual({ kurs: 'Psionautics', modalitet: 'Utbildning' });
    expect(parsed.include[1]).toEqual([
      { kurs: 'RIM 1', modalitet: 'Utbildning' },
      { kurs: 'RIM 2', modalitet: 'Utbildning' },
    ]);
  });

  test('tom Konjunkt-grupp ([]) i include → InvalidSegmentRuleError (fail-closed, parse-tid)', () => {
    expect(() => parseSegmentRule({ include: [[]], exclude: [] })).toThrow(InvalidSegmentRuleError);
  });

  test('ogiltigt par INUTI en Konjunkt-grupp → InvalidSegmentRuleError', () => {
    expect(() =>
      parseSegmentRule({ include: [[{ kurs: 'RIM 1', modalitet: 'Kurs' }]], exclude: [] }),
    ).toThrow(InvalidSegmentRuleError);
  });
});

// ============================================================================
// De fjorton Skool-grupperna (ADR-115 EF-krav 2, TASK-249.2 AC#2) —
// källa: tasks/sessions/bilagor/s104-segment-divergens/underlag-de-fjorton-
// skool-grupperna.md. Fyra kurser {Fjärrskådning, RIM1, RIM2, Psionautics} ×
// Utbildning ger 15 icke-tomma kombinationer; dokumentet listar 14 (den
// femtonde, Fjärrskådning+RIM2+Psionautics, är obefolkad — 0 personer i
// verkligheten, men algebraiskt fullt giltig och testas här för korrekthet).
// 10 av 14 grupper (4–11, 13, 14) KRÄVER AND — outtryckbara i ren OR
// (S104 Del 3-fyndet). Varje grupp = snittet av sina kurser MINUS övriga
// (disjunkt per konstruktion, ADR-115 § Semantiken).
// ============================================================================

test.describe('De fjorton Skool-grupperna — uttryckbara, korrekta, disjunkta (ADR-115)', () => {
  const FS = 'Fjärrskådning';
  const R1 = 'Resor i medvetandet 1';
  const R2 = 'Resor i medvetandet 2';
  const PS = 'Psionautics';
  const par = (kurs: string): Par => ({ kurs, modalitet: U });

  // De 15 icke-tomma kombinationerna av {FS, R1, R2, PS} — en synteisk person
  // per kombination. sk15 är den obefolkade kombinationen (facit: 0 personer).
  const combos: Record<string, string[]> = {
    sk1: [R1],
    sk2: [FS],
    sk3: [PS],
    sk4: [R1, R2],
    sk5: [FS, R1],
    sk6: [FS, R1, R2],
    sk7: [FS, R1, R2, PS],
    sk8: [R1, PS],
    sk9: [R1, R2, PS],
    sk10: [FS, R1, PS],
    sk11: [FS, PS],
    sk12: [R2],
    sk13: [R2, PS],
    sk14: [FS, R2],
    sk15: [FS, R2, PS], // obefolkad i verkligheten — testas ändå för korrekthet
  };
  const rows: AttendanceRow[] = Object.entries(combos).flatMap(([personId, kurser]) =>
    kurser.map((kurs) => row(personId, kurs, U)),
  );

  // Grupp N → { med: konjunkt-grupp av "har", utan: platt lista av "har inte" }.
  // Följer ADR-115 § Semantiken verbatim: en grupp är snittet av sina kurser
  // MINUS alla övriga kurser i universumet {FS, R1, R2, PS}.
  const ALLA = [FS, R1, R2, PS];
  function grupp(har: string[]): SegmentRule {
    const utan = ALLA.filter((k) => !har.includes(k));
    return {
      include: [har.map(par) as Konjunkt],
      exclude: utan.map(par),
    };
  }

  const grupper: { nr: number; personId: string; har: string[]; kravAnd: boolean }[] = [
    { nr: 1, personId: 'sk1', har: [R1], kravAnd: false },
    { nr: 2, personId: 'sk2', har: [FS], kravAnd: false },
    { nr: 3, personId: 'sk3', har: [PS], kravAnd: false },
    { nr: 4, personId: 'sk4', har: [R1, R2], kravAnd: true },
    { nr: 5, personId: 'sk5', har: [FS, R1], kravAnd: true },
    { nr: 6, personId: 'sk6', har: [FS, R1, R2], kravAnd: true },
    { nr: 7, personId: 'sk7', har: [FS, R1, R2, PS], kravAnd: true },
    { nr: 8, personId: 'sk8', har: [R1, PS], kravAnd: true },
    { nr: 9, personId: 'sk9', har: [R1, R2, PS], kravAnd: true },
    { nr: 10, personId: 'sk10', har: [FS, R1, PS], kravAnd: true },
    { nr: 11, personId: 'sk11', har: [FS, PS], kravAnd: true },
    { nr: 12, personId: 'sk12', har: [R2], kravAnd: false },
    { nr: 13, personId: 'sk13', har: [R2, PS], kravAnd: true },
    { nr: 14, personId: 'sk14', har: [FS, R2], kravAnd: true },
  ];

  test('sanity: exakt 10 av 14 grupper kräver en flerledad AND-grupp (S104 Del 3-talet)', () => {
    expect(grupper.filter((g) => g.kravAnd).length).toBe(10);
  });

  for (const g of grupper) {
    test(`grupp ${g.nr} (${g.har.join('+')}): matchar EXAKT ${g.personId}, ingen annan`, () => {
      const members = computeMembership(grupp(g.har), rows);
      expect(members).toEqual([g.personId]);
    });
  }

  test('disjunkthet: de 14 gruppernas medlemsmängder är parvis disjunkta och täcker exakt sk1–sk14 (ej sk15)', () => {
    const alla = grupper.flatMap((g) => computeMembership(grupp(g.har), rows));
    expect(alla.length).toBe(14); // ingen dubbelträff — varje grupp gav exakt 1
    expect(new Set(alla).size).toBe(14); // alla distinkta — disjunkt per konstruktion
    expect(new Set(alla)).toEqual(
      new Set([
        'sk1',
        'sk2',
        'sk3',
        'sk4',
        'sk5',
        'sk6',
        'sk7',
        'sk8',
        'sk9',
        'sk10',
        'sk11',
        'sk12',
        'sk13',
        'sk14',
      ]),
    );
    expect(alla).not.toContain('sk15'); // den obefolkade kombinationen hör till INGEN av de 14
  });

  test('den femtonde (obefolkade) kombinationen Fjärrskådning+RIM2+Psionautics är algebraiskt uttryckbar och korrekt (0 personer i denna fixtur, sk15 matchar sig själv)', () => {
    const denFemtonde = grupp([FS, R2, PS]);
    expect(computeMembership(denFemtonde, rows)).toEqual(['sk15']);
  });
});
