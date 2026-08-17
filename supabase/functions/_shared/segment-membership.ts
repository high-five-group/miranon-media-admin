// Ren segment-medlemskaps-algebra + regel-validering (Fas 6g L1, ADR-064;
// AND/DNF-primitiven ADR-115, TASK-249.2). NOLL Airtable-import, inget I/O →
// isolerat enhetstestbar (api-pure, samma klass som coerce.ts). Beräknings-
// MOTORN: EF:n (compute-segment) koercerar Airtable-rader till AttendanceRow,
// validerar regeln via parseSegmentRule och anropar computeMembershipVia (eller
// computeMembership, tunn wrapper). Lever i _shared så BÅDE EF:n (Deno) OCH
// api-pure-testet (Playwright/Node) kan importera den — src/domain är Vite-
// sidan och onåbar från en Deno-EF (runtime-gräns; jfr coerce.ts ↔
// Attendance.schema.ts).
//
// Algebra (ADR-064 + ADR-115): närvaro-golvet (Närvaropoäng=1) utvärderas av
// callern, ORÖRT av AND-primitiven; HÄR utvärderas regeln över redan-
// filtrerade rader:
//   kvalificerad ⟺ deltog i ≥1 include-VILLKOR (OR) AND deltog i 0 exclude-par
//   (NOT-any). Ett include-villkor är ANTINGEN ett enkelt Par (ren OR, dagens
//   form — matchar deltog i det paret) ELLER en Konjunkt-grupp (Par[], AND —
//   matchar bara om ALLA par i gruppen är uppfyllda samtidigt). include=[] ⇒
//   ingen kvalificerar (tom OR), precis som förut.
// `include` är därmed disjunktiv normalform (DNF): union av villkoren, där ett
// villkor kan i sig vara en konjunktion. Ett predikat UTAN någon flerledad
// Konjunkt-grupp (bara enkla Par, eller Konjunkt-grupper med exakt ett par) är
// algebraiskt identiskt med dagens rena OR-lista — noll regression (ADR-115
// EF-krav 4, S104 Del 3: klient-snittet i VariantD-prototypen fick aldrig
// promoveras, AND-stödet SKA in i motorn).
// `exclude` förblir PLATT (Par[]) — exklusiviteten behövde aldrig AND (0 av de
// fjorton verkliga Skool-målen, ADR-115 beslut 1).
// kurs bär domän-VÄRDE (sträng, ÖPPEN taxonomi — ADR-064 beslut 2), aldrig fryst enum.

export type Modalitet = 'Utbildning' | 'Föreläsning';
export type Par = { kurs: string; modalitet: Modalitet };
/**
 * EN AND-GRUPP (konjunktion): alla par i gruppen krävs SAMTIDIGT hos personen.
 * En tom grupp ([]) är per konstruktion ALDRIG uppfylld (fail-closed — en tom
 * AND vore matematiskt vakuöst sann och skulle kvalificera varenda person;
 * parseSegmentRule avvisar den redan vid inparsning, se nedan).
 */
export type Konjunkt = Par[];
/**
 * Ett include-VILLKOR: ett enkelt Par (ren OR — dagens form, oförändrad) eller
 * en hel Konjunkt-grupp (AND, ADR-115). `Array.isArray` skiljer dem entydigt
 * åt vid utvärdering — en Konjunkt ÄR alltid en array, ett Par är alltid ett
 * objekt (aldrig tvetydigt).
 */
export type MedVillkor = Par | Konjunkt;
export type SegmentRule = { include: MedVillkor[]; exclude: Par[] };
export type AttendanceRow = { personId: string; kurs: string; modalitet: Modalitet };
/** En kvalificerad medlem + VILKA par som gjorde henne medlem (ADR-115 EF-krav 1). */
export type MembershipHit = { personId: string; via: Par[] };

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
 * Vilka par (union, deduplicerad) gjorde denna PERSON medlem via `include`?
 * Går igenom varje include-villkor; ett enkelt Par kvalificerar om personen
 * deltog i det paret, en Konjunkt-grupp kvalificerar bara om ALLA dess par är
 * uppfyllda samtidigt (AND). En tom grupp ([]) kvalificerar aldrig
 * (fail-closed — se Konjunkt-docblocket). Resultatet är unionen av paren ur
 * VARJE uppfyllt villkor — en person som matchar flera grupper (eller flera
 * enkla par) får hela unionen tillbaka, inte bara den första träffen.
 * `[]` betyder "inget villkor uppfyllt" (personen kvalificerar inte alls).
 */
function matchedViaPars(include: readonly MedVillkor[], set: ReadonlySet<string>): Par[] {
  const seenKeys = new Set<string>();
  const via: Par[] = [];
  for (const villkor of include) {
    const pars = Array.isArray(villkor) ? villkor : [villkor];
    if (pars.length === 0) continue; // tom Konjunkt-grupp: aldrig uppfylld
    const uppfylld = pars.every((p) => set.has(parKey(p.kurs, p.modalitet)));
    if (!uppfylld) continue;
    for (const p of pars) {
      const key = parKey(p.kurs, p.modalitet);
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        via.push(p);
      }
    }
  }
  return via;
}

/**
 * Kvalificerade personer + VILKA par (via) som gjorde var och en medlem
 * (ADR-115 EF-krav 1 — fördelningen kräver ingen andra fråga). Ren funktion:
 * deterministisk, sidoeffektfri, inget I/O. Utdata-ordning = personernas
 * första-förekomst-ordning i `rows` (Map-iterationsordning) — samma ordning
 * `computeMembership` alltid gav.
 */
export function computeMembershipVia(
  rule: SegmentRule,
  rows: readonly AttendanceRow[],
): MembershipHit[] {
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

  const excludeKeys = rule.exclude.map((p) => parKey(p.kurs, p.modalitet));

  // 2) Kvalificera: ≥1 include-villkor uppfyllt (OR-av-AND, DNF) AND 0
  // exclude-par (NOT-any).
  const hits: MembershipHit[] = [];
  for (const [personId, set] of attendanceByPerson) {
    const via = matchedViaPars(rule.include, set);
    if (via.length === 0) continue; // include=[] eller inget villkor uppfyllt
    const hasExcluded = excludeKeys.some((k) => set.has(k));
    if (hasExcluded) continue; // deltog i ett exclude-par → diskvalificerad
    hits.push({ personId, via });
  }
  return hits;
}

/**
 * Distinkta person-ID:n som kvalificerar för regeln över närvaro-raderna.
 * Tunn wrapper runt `computeMembershipVia` (samma algebra, samma ordning) —
 * bevarad för callare som bara behöver ID:n (send-email-unionen i
 * segment-resolution.ts, hela den befintliga api-pure-sviten).
 */
export function computeMembership(rule: SegmentRule, rows: readonly AttendanceRow[]): string[] {
  return computeMembershipVia(rule, rows).map((hit) => hit.personId);
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
 * Ett include-VILLKOR: antingen ett enkelt par-objekt (ren OR, dagens form —
 * `parsePar` oförändrad) eller en Konjunkt-grupp (AND-array av par, ADR-115).
 * En tom grupp ([]) avvisas HÄR (parse-tid) i stället för att tolkas vakuöst
 * sant vid utvärdering — samma fail-closed-disciplin som resten av filen
 * (jfr `SegmentNotResolvableError` i segment-resolution.ts).
 */
function parseMedVillkor(value: unknown): MedVillkor {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new InvalidSegmentRuleError('a konjunkt-grupp (AND) must contain at least one par');
    }
    return value.map(parsePar);
  }
  return parsePar(value);
}

function parseIncludeArray(value: unknown): MedVillkor[] {
  if (!Array.isArray(value)) {
    throw new InvalidSegmentRuleError('include must be an array of par or konjunkt-grupper');
  }
  return value.map(parseMedVillkor);
}

/**
 * Validerar FORMEN på en inkommande regel — `include` är DNF (Par | Konjunkt)[]
 * (ADR-115: enkla par ELLER AND-grupper, blandbart i samma lista), `exclude`
 * förblir platt Par[] (oförändrad). Modalitet-enum valideras i båda. Ren —
 * ingen Airtable, inget Zod (EF:er använder inte Zod; svars-Zod bor i
 * src/domain). Felformad → InvalidSegmentRuleError (EF → 400).
 */
export function parseSegmentRule(body: unknown): SegmentRule {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new InvalidSegmentRuleError('body must be an object { include, exclude }');
  }
  const { include, exclude } = body as Record<string, unknown>;
  return {
    include: parseIncludeArray(include),
    exclude: parseParArray(exclude, 'exclude'),
  };
}
