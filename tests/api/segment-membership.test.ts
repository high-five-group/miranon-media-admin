// Uttömmande enhetstest för segment-medlemskaps-MOTORN (Fas 6g L1, ADR-064;
// AND/DNF ADR-115/TASK-249.2; tidsperioden ADR-115 EF-krav 2/5/TASK-249.3).
//
// api-pure (ren logik, ingen staging, inga creds) → körs lokalt + CI. Låser
// algebran in-memory: kvalificerad ⟺ ≥1 include-par (OR) AND 0 exclude-par
// (NOT-any); include=[] ⇒ []; (kurs × modalitet)-MÄNGD ⇒ tvådagars-dedup gratis;
// modalitet-skiljande korrekthet (golv); `par.period` filtrerar VILKET datum
// som räknas för ett par (TASK-249.3). Bevisar OCKSÅ parseSegmentRule:
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

// Kortform för att bygga närvaro-rader: row(person, kurs, modalitet, datum?).
// `datum` defaultar till ett neutralt ISO-datum — de flesta tester bryr sig
// inte om VILKET datum, bara att paret finns i personens mängd (TASK-249.3
// gjorde `datum` obligatoriskt på AttendanceRow; defaulten håller alla
// FÖRE-249.3-tester oförändrade, noll regression).
function row(
  personId: string,
  kurs: string,
  modalitet: 'Utbildning' | 'Föreläsning',
  datum = '2025-01-01',
): AttendanceRow {
  return { personId, kurs, modalitet, datum };
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

// ============================================================================
// TIDSPERIODEN — par.period (ADR-115 EF-krav 2/5, TASK-249.3 AC#2/AC#3).
// "Villkorets tidsperiod verkställs server-side: deltagandets datum följer med
// i källfrågan och tidsfönstret filtrerar medlemskapet" — de TRE namngivna
// testfallen ur kortets AC#2 (datumspann/tomt spann/spann utan träffar), plus
// gräns-, AND-grupp- och exclude-symmetri-fall. AC#3 (räkne-ärligheten flyttar
// till servern) är en NATURLIG konsekvens av dessa — `computeMembership(Via)`s
// utdata ÄR redan det tidsfiltrerade antalet, inget extra steg testas separat.
// ============================================================================

test.describe('computeMembership — par.period (tidsperiod, TASK-249.3)', () => {
  test('DATUMSPANN: period täcker det enda deltagandet ⇒ medlem inkluderas', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } },
    ]);
    expect(computeMembership(r, rows)).toEqual(['p1']);
  });

  test('TOMT SPANN: period täcker INGET datum i hela raddatan (annan tidsålder) ⇒ []', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15'), row('p2', 'RIM 2', U, '2025-07-01')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2099-01-01', end: '2099-12-31' } },
    ]);
    expect(computeMembership(r, rows)).toEqual([]);
  });

  test('SPANN UTAN TRÄFFAR: perioden är giltig och andra rader FINNS i den allmänna tidrymden, men ingen träff för DETTA par ⇒ []', () => {
    // p1s RIM 1 ligger 2025-06-15 (utanför spannet); p2s RIM 2 2025-07-01 visar
    // att spannet inte är "tomt" i meningen att ingenting alls hände då — bara
    // att INGET RIM 1-deltagande föll i just detta fönster.
    const rows = [row('p1', 'RIM 1', U, '2025-06-15'), row('p2', 'RIM 2', U, '2025-07-01')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-07-01', end: '2025-07-31' } },
    ]);
    expect(computeMembership(r, rows)).toEqual([]);
  });

  test('GRÄNS — INKLUSIV: start === slut === deltagandets datum ⇒ medlem inkluderas', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-15', end: '2025-06-15' } },
    ]);
    expect(computeMembership(r, rows)).toEqual(['p1']);
  });

  test('GRÄNS — en dag UTANFÖR i vardera riktningen diskvalificerar (av-en-fel-testat)', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15')];
    const fore = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-01', end: '2025-06-14' } },
    ]);
    const efter = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-16', end: '2025-06-30' } },
    ]);
    expect(computeMembership(fore, rows)).toEqual([]);
    expect(computeMembership(efter, rows)).toEqual([]);
  });

  test('par UTAN period räknar deltagande NÄR SOM HELST (dagens beteende, noll regression) — även bredvid ett period-bärande par i SAMMA regel', () => {
    const rows = [row('p1', 'RIM 1', U, '1999-01-01'), row('p2', 'RIM 2', U, '2025-06-15')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U }, // ingen period ⇒ p1 matchar oavsett datum
      { kurs: 'RIM 2', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } },
    ]);
    expect(computeMembership(r, rows).sort()).toEqual(['p1', 'p2']);
  });

  test('AND-grupp: period gäller PER PAR — bägge parens EGNA fönster måste hålla, oberoende av varandra', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15'), row('p1', 'RIM 2', U, '2025-08-01')];
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } },
      { kurs: 'RIM 2', modalitet: U, period: { start: '2025-08-01', end: '2025-08-31' } },
    ];
    expect(computeMembership(rule([konjunkt]), rows)).toEqual(['p1']);

    // Flytta RIM 2:s fönster så det INTE täcker 2025-08-01 → gruppen faller.
    const konjunktSomFaller: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } },
      { kurs: 'RIM 2', modalitet: U, period: { start: '2025-09-01', end: '2025-09-30' } },
    ];
    expect(computeMembership(rule([konjunktSomFaller]), rows)).toEqual([]);
  });

  test('exclude respekterar period SYMMETRISKT: deltagande UTANFÖR exclude-parets fönster diskvalificerar EJ', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15'), row('p1', 'Psionautics', U, '2025-01-01')];
    // p1 deltog i Psionautics, men INTE inom exclude-parets period → kvalificerar ändå.
    const r = rule(
      [{ kurs: 'RIM 1', modalitet: U }],
      [{ kurs: 'Psionautics', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } }],
    );
    expect(computeMembership(r, rows)).toEqual(['p1']);
  });

  test('exclude respekterar period SYMMETRISKT: deltagande INOM exclude-parets fönster diskvalificerar', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15'), row('p1', 'Psionautics', U, '2025-06-20')];
    const r = rule(
      [{ kurs: 'RIM 1', modalitet: U }],
      [{ kurs: 'Psionautics', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } }],
    );
    expect(computeMembership(r, rows)).toEqual([]);
  });

  test('flera datum på SAMMA par (t.ex. omtagning): matchar om NÅGOT av datumen faller i fönstret', () => {
    const rows = [row('p1', 'RIM 1', U, '1999-01-01'), row('p1', 'RIM 1', U, '2025-06-15')];
    const r = rule([
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-06-01', end: '2025-06-30' } },
    ]);
    expect(computeMembership(r, rows)).toEqual(['p1']);
  });

  test('computeMembershipVia: via-paret BÄR sin period (transparent mot fördelningen)', () => {
    const rows = [row('p1', 'RIM 1', U, '2025-06-15')];
    const periodPar: Par = {
      kurs: 'RIM 1',
      modalitet: U,
      period: { start: '2025-06-01', end: '2025-06-30' },
    };
    const hits = computeMembershipVia(rule([periodPar]), rows);
    expect(hits).toEqual([{ personId: 'p1', via: [periodPar] }]);
  });
});

test.describe('parseSegmentRule — par.period (ADR-115 EF-krav 2/5, TASK-249.3)', () => {
  test('giltig period parsas igenom oförändrad', () => {
    const parsed = parseSegmentRule({
      include: [
        {
          kurs: 'RIM 1',
          modalitet: 'Utbildning',
          period: { start: '2025-01-01', end: '2025-12-31' },
        },
      ],
      exclude: [],
    });
    expect(parsed.include[0]).toEqual({
      kurs: 'RIM 1',
      modalitet: 'Utbildning',
      period: { start: '2025-01-01', end: '2025-12-31' },
    });
  });

  test('period utelämnad ⇒ par utan `period`-fält (dagens form, bakåtkompatibelt)', () => {
    const parsed = parseSegmentRule({
      include: [{ kurs: 'RIM 1', modalitet: 'Utbildning' }],
      exclude: [],
    });
    expect(parsed.include[0]).toEqual({ kurs: 'RIM 1', modalitet: 'Utbildning' });
    expect(Object.hasOwn(parsed.include[0], 'period')).toBe(false);
  });

  test('period: null behandlas som utelämnad (samma resultat)', () => {
    const parsed = parseSegmentRule({
      include: [{ kurs: 'RIM 1', modalitet: 'Utbildning', period: null }],
      exclude: [],
    });
    expect(parsed.include[0]).toEqual({ kurs: 'RIM 1', modalitet: 'Utbildning' });
  });

  test('exclude-par kan också bära period', () => {
    const parsed = parseSegmentRule({
      include: [{ kurs: 'RIM 1', modalitet: 'Utbildning' }],
      exclude: [
        {
          kurs: 'Psionautics',
          modalitet: 'Utbildning',
          period: { start: '2025-01-01', end: '2025-01-31' },
        },
      ],
    });
    expect(parsed.exclude[0]).toEqual({
      kurs: 'Psionautics',
      modalitet: 'Utbildning',
      period: { start: '2025-01-01', end: '2025-01-31' },
    });
  });

  for (const bad of [
    { start: '2025-01-01' }, // saknar end
    { end: '2025-01-01' }, // saknar start
    { start: 20250101, end: '2025-01-31' }, // start ej sträng
    { start: '2025-01-01', end: '31 januari 2025' }, // end ej ISO
    { start: '25-01-01', end: '2025-01-31' }, // start fel format (kort år)
    { start: '2025-06-30', end: '2025-06-01' }, // start EFTER end (omvänd)
    'sträng',
    [],
    42,
  ]) {
    test(`felformad period → InvalidSegmentRuleError: ${JSON.stringify(bad)}`, () => {
      expect(() =>
        parseSegmentRule({
          include: [{ kurs: 'RIM 1', modalitet: 'Utbildning', period: bad }],
          exclude: [],
        }),
      ).toThrow(InvalidSegmentRuleError);
    });
  }
});

// ============================================================================
// SEND-EMAIL-PARITETEN (ADR-115 EF-krav 4 send-email-halvan, TASK-249.3 AC#1).
// `resolveSegmentMembers` (send-email-unionen, segment-resolution.ts) anropar
// `computeMembership`; `resolveRuleMembers` (compute-segment) anropar
// `computeMembershipVia`. Båda konsumerar SAMMA algebra i denna fil — detta
// test bevisar explicit, för en regel med konjunkt-grupper (AND) OCH ett
// period-fönster, att de två vägarna ger IDENTISK mottagarmängd. Ingen
// produktionskod behövde ändras för AC#1 (`computeMembership` var redan denna
// funktion sedan TASK-249.2) — detta test är beviset, inte en migrering.
// ============================================================================

test.describe('send-email vs compute-segment — identisk mottagarmängd (TASK-249.3 AC#1)', () => {
  test('AND-konjunkt-regel: send-email-vägen (computeMembership) === compute-segment-vägen (computeMembershipVia → id:n)', () => {
    const rows = [
      row('pA', 'RIM 1', U, '2025-06-10'),
      row('pA', 'RIM 2', U, '2025-06-20'),
      row('pB', 'RIM 1', U, '2025-06-10'), // saknar RIM 2 → matchar EJ AND-gruppen
      row('pC', 'Psionautics', U, '2025-01-01'),
    ];
    const andRule = rule([
      [
        { kurs: 'RIM 1', modalitet: U },
        { kurs: 'RIM 2', modalitet: U },
      ] as Konjunkt,
      { kurs: 'Psionautics', modalitet: U },
    ]);

    const sendEmailVagen = computeMembership(andRule, rows); // resolveSegmentMembers
    const computeSegmentVagen = computeMembershipVia(andRule, rows).map((h) => h.personId); // resolveRuleMembers

    expect(sendEmailVagen).toEqual(computeSegmentVagen);
    expect(sendEmailVagen.sort()).toEqual(['pA', 'pC']);
  });

  test('AND-konjunkt-regel MED tidsperiod: samma parität håller när period-filtret snävar mängden', () => {
    const rows = [
      row('pA', 'RIM 1', U, '2025-06-10'),
      row('pA', 'RIM 2', U, '2025-06-20'),
      row('pD', 'RIM 1', U, '2020-01-01'), // utanför RIM 1-periodens fönster
      row('pD', 'RIM 2', U, '2025-06-20'),
    ];
    const konjunkt: Konjunkt = [
      { kurs: 'RIM 1', modalitet: U, period: { start: '2025-01-01', end: '2025-12-31' } },
      { kurs: 'RIM 2', modalitet: U },
    ];
    const periodRule = rule([konjunkt]);

    const sendEmailVagen = computeMembership(periodRule, rows);
    const computeSegmentVagen = computeMembershipVia(periodRule, rows).map((h) => h.personId);

    expect(sendEmailVagen).toEqual(computeSegmentVagen);
    expect(sendEmailVagen).toEqual(['pA']); // pD:s RIM 1 föll utanför fönstret
  });
});
