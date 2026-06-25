// Ren segment-medlemskaps-algebra + regel-validering (Fas 6g L1, ADR-064).
// NOLL Airtable-import, inget I/O → isolerat enhetstestbar (api-pure, samma
// klass som coerce.ts). Beräknings-MOTORN: EF:n (compute-segment) koercerar
// Airtable-rader till AttendanceRow, validerar regeln via parseSegmentRule och
// anropar computeMembership. Lever i _shared så BÅDE EF:n (Deno) OCH api-pure-
// testet (Playwright/Node) kan importera den — src/domain är Vite-sidan och
// onåbar från en Deno-EF (runtime-gräns; jfr coerce.ts ↔ Attendance.schema.ts).
//
// Algebra (ADR-064): närvaro-golvet (Närvaropoäng=1) utvärderas av callern;
// HÄR utvärderas regeln över redan-filtrerade rader:
//   kvalificerad ⟺ deltog i ≥1 include-par (OR) AND deltog i 0 exclude-par (NOT-any).
//   include=[] ⇒ ingen kvalificerar (tom OR).
// kurs bär domän-VÄRDE (sträng, ÖPPEN taxonomi — ADR-064 beslut 2), aldrig fryst enum.

export type Modalitet = 'Utbildning' | 'Föreläsning';
export type Par = { kurs: string; modalitet: Modalitet };
export type SegmentRule = { include: Par[]; exclude: Par[] };
export type AttendanceRow = { personId: string; kurs: string; modalitet: Modalitet };

const MODALITETER: readonly Modalitet[] = ['Utbildning', 'Föreläsning'];

/** Type-guard: en rå sträng är en giltig modalitet (Event typ-enum). */
export function isModalitet(value: unknown): value is Modalitet {
  return typeof value === 'string' && (MODALITETER as readonly string[]).includes(value);
}

// Kanonisk nyckel för ett (kurs × modalitet)-par i en persons närvaro-MÄNGD.
// Set ⇒ tvådagars-event (Dag 1 + Dag 2 = två Närvaropoäng=1-rader, samma par)
// kollapsar gratis → personen räknas EN gång.
function parKey(kurs: string, modalitet: Modalitet): string {
  return `${kurs}|${modalitet}`;
}

/**
 * Distinkta person-ID:n som kvalificerar för regeln över närvaro-raderna.
 * Ren funktion: deterministisk, sidoeffektfri, inget I/O. Utdata-ordning =
 * personernas första-förekomst-ordning i `rows` (Map-iterationsordning).
 */
export function computeMembership(rule: SegmentRule, rows: readonly AttendanceRow[]): string[] {
  // 1) Bygg varje persons närvaro-MÄNGD {(kurs|modalitet)}.
  const attendanceByPerson = new Map<string, Set<string>>();
  for (const row of rows) {
    let set = attendanceByPerson.get(row.personId);
    if (!set) {
      set = new Set<string>();
      attendanceByPerson.set(row.personId, set);
    }
    set.add(parKey(row.kurs, row.modalitet));
  }

  const includeKeys = rule.include.map((p) => parKey(p.kurs, p.modalitet));
  const excludeKeys = rule.exclude.map((p) => parKey(p.kurs, p.modalitet));

  // 2) Kvalificera: ≥1 include-par (OR) AND 0 exclude-par (NOT-any).
  const members: string[] = [];
  for (const [personId, set] of attendanceByPerson) {
    const hasInclude = includeKeys.some((k) => set.has(k));
    if (!hasInclude) continue; // include=[] ⇒ aldrig sann ⇒ [] (tom OR)
    const hasExcluded = excludeKeys.some((k) => set.has(k));
    if (hasExcluded) continue; // deltog i ett exclude-par → diskvalificerad
    members.push(personId);
  }
  return members;
}

/**
 * Kontrakts-fel vid regel-validering. EF:n instanceof-kollar denna och mappar
 * → 400 { error }; allt annat (JSON-syntaxfel) mappas också → 400 (klient-fel).
 */
export class InvalidSegmentRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSegmentRuleError';
  }
}

function parsePar(value: unknown): Par {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidSegmentRuleError('each par must be an object { kurs, modalitet }');
  }
  const { kurs, modalitet } = value as Record<string, unknown>;
  if (typeof kurs !== 'string' || kurs.length === 0) {
    throw new InvalidSegmentRuleError('par.kurs must be a non-empty string');
  }
  // ADR-064 beslut 2: kurs valideras AVSIKTLIGT inte mot en lista (öppen taxonomi).
  if (!isModalitet(modalitet)) {
    throw new InvalidSegmentRuleError("par.modalitet must be 'Utbildning' or 'Föreläsning'");
  }
  return { kurs, modalitet };
}

function parseParArray(value: unknown, field: string): Par[] {
  if (!Array.isArray(value)) {
    throw new InvalidSegmentRuleError(`${field} must be an array of par`);
  }
  return value.map(parsePar);
}

/**
 * Validerar FORMEN på en inkommande regel ({ include: Par[], exclude: Par[] })
 * och modalitet-enum. Ren — ingen Airtable, inget Zod (EF:er använder inte Zod;
 * svars-Zod bor i src/domain). Felformad → InvalidSegmentRuleError (EF → 400).
 */
export function parseSegmentRule(body: unknown): SegmentRule {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new InvalidSegmentRuleError('body must be an object { include, exclude }');
  }
  const { include, exclude } = body as Record<string, unknown>;
  return {
    include: parseParArray(include, 'include'),
    exclude: parseParArray(exclude, 'exclude'),
  };
}
