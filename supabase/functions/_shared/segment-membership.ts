// Ren segment-medlemskaps-algebra + regel-validering (Fas 6g L1, ADR-064;
// AND/DNF-primitiven ADR-115, TASK-249.2; tidsperioden ADR-115 EF-krav 2/5,
// TASK-249.3). NOLL Airtable-import, inget I/O → isolerat enhetstestbar
// (api-pure, samma klass som coerce.ts). Beräknings-MOTORN: EF:n
// (compute-segment) koercerar Airtable-rader till AttendanceRow, validerar
// regeln via parseSegmentRule och anropar computeMembershipVia (eller
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
//
// TIDSPERIODEN (ADR-115 EF-krav 2/5, TASK-249.3): ett Par kan bära ett
// VALFRITT ISO-datumintervall `period` (inklusive båda ändar) — matchar
// VariantD.tsx `Villkor.period`. Ett period-bärande Par kvalificerar en
// person bara om NÅGON av hennes rader för det (kurs, modalitet)-paret har
// `datum` inom fönstret; ett Par UTAN `period` (`undefined`, dagens form)
// räknar deltagande NÄR SOM HELST, precis som förut — additiv, noll
// regression. Gäller SYMMETRISKT i både `include` och `exclude` (samma
// `Villkor`-typ i VariantD.tsx bär period för båda grenarna).

export type Modalitet = 'Utbildning' | 'Föreläsning';
/**
 * ISO-datumpar (från/till), INKLUSIVE båda ändar — VariantD.tsx `Villkor.period`s
 * serverspegel (ADR-115 EF-krav 2/5).
 */
export type Period = { start: string; end: string };
export type Par = { kurs: string; modalitet: Modalitet; period?: Period };
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
/**
 * `datum` = deltagandets ISO-datum (YYYY-MM-DD), KRÄVS (TASK-249.3 EF-krav 2 —
 * "deltagandets datum följer med i källfrågan"). Callern (segment-resolution.ts)
 * hoppar rader utan giltigt datum, samma fail-closed-disciplin som person/kurs.
 */
export type AttendanceRow = { personId: string; kurs: string; modalitet: Modalitet; datum: string };
/** En kvalificerad medlem + VILKA par som gjorde henne medlem (ADR-115 EF-krav 1). */
export type MembershipHit = { personId: string; via: Par[] };

const MODALITETER: readonly Modalitet[] = ['Utbildning', 'Föreläsning'];

/** Type-guard: en rå sträng är en giltig modalitet (Event typ-enum). */
export function isModalitet(value: unknown): value is Modalitet {
  return typeof value === 'string' && (MODALITETER as readonly string[]).includes(value);
}

// Kanonisk nyckel för ett (kurs × modalitet)-par i en persons närvaro-MÄNGD.
// Set/Map ⇒ tvådagars-event (Dag 1 + Dag 2 = två Närvaropoäng=1-rader, samma
// par) kollapsar gratis → personen räknas EN gång. `period` ingår MEDVETET
// INTE i nyckeln — perioden är ett FILTER som prövas vid matchning
// (`harPar` nedan), inte en del av parets IDENTITET/dedup.
function parKey(kurs: string, modalitet: Modalitet): string {
  return `${kurs}|${modalitet}`;
}

/**
 * Indexerar närvaro-raderna: personId → (kurs|modalitet) → MÄNGD av datum
 * personen deltog i det paret (flera datum vid t.ex. omtagning). Bevarar
 * exakt den information `computeMembership`/`Via` behöver för att pröva ett
 * Pars `period`-filter (TASK-249.3) UTAN att tappa tvådagars-dedupen ovan.
 */
function attendanceIndex(rows: readonly AttendanceRow[]): Map<string, Map<string, Set<string>>> {
  const byPerson = new Map<string, Map<string, Set<string>>>();
  for (const row of rows) {
    let byPar = byPerson.get(row.personId);
    if (!byPar) {
      byPar = new Map<string, Set<string>>();
      byPerson.set(row.personId, byPar);
    }
    const key = parKey(row.kurs, row.modalitet);
    let datum = byPar.get(key);
    if (!datum) {
      datum = new Set<string>();
      byPar.set(key, datum);
    }
    datum.add(row.datum);
  }
  return byPerson;
}

/**
 * Har personen (representerad av sitt `byPar`-index) deltagit i paret `p` —
 * inom `p.period`, om satt (TASK-249.3)? ISO-datumsträngar (YYYY-MM-DD)
 * jämförs lexikografiskt = kronologiskt, samma trick `Deltog sortkey`/
 * `Genomfört event datekey` redan bygger på i basen. `period` saknas
 * (`undefined`) ⇒ dagens beteende — deltagande NÄR SOM HELST räknas.
 */
function harPar(p: Par, byPar: ReadonlyMap<string, ReadonlySet<string>>): boolean {
  const datum = byPar.get(parKey(p.kurs, p.modalitet));
  if (!datum || datum.size === 0) return false;
  if (!p.period) return true;
  const { start, end } = p.period;
  for (const d of datum) {
    if (d >= start && d <= end) return true;
  }
  return false;
}

/**
 * Vilka par (union, deduplicerad) gjorde denna PERSON medlem via `include`?
 * Går igenom varje include-villkor; ett enkelt Par kvalificerar om personen
 * deltog i det paret (inom dess `period`, om satt), en Konjunkt-grupp
 * kvalificerar bara om ALLA dess par är uppfyllda samtidigt (AND). En tom
 * grupp ([]) kvalificerar aldrig (fail-closed — se Konjunkt-docblocket).
 * Resultatet är unionen av paren ur VARJE uppfyllt villkor — en person som
 * matchar flera grupper (eller flera enkla par) får hela unionen tillbaka,
 * inte bara den första träffen. `[]` betyder "inget villkor uppfyllt"
 * (personen kvalificerar inte alls).
 */
function matchedViaPars(
  include: readonly MedVillkor[],
  byPar: ReadonlyMap<string, ReadonlySet<string>>,
): Par[] {
  const seenKeys = new Set<string>();
  const via: Par[] = [];
  for (const villkor of include) {
    const pars = Array.isArray(villkor) ? villkor : [villkor];
    if (pars.length === 0) continue; // tom Konjunkt-grupp: aldrig uppfylld
    const uppfylld = pars.every((p) => harPar(p, byPar));
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
  // 1) Indexera varje persons närvaro: (kurs|modalitet) → datum-MÄNGD.
  const index = attendanceIndex(rows);

  // 2) Kvalificera: ≥1 include-villkor uppfyllt (OR-av-AND, DNF, period-
  // filtrerat) AND 0 exclude-par (NOT-any, SYMMETRISKT period-filtrerat).
  const hits: MembershipHit[] = [];
  for (const [personId, byPar] of index) {
    const via = matchedViaPars(rule.include, byPar);
    if (via.length === 0) continue; // include=[] eller inget villkor uppfyllt
    const hasExcluded = rule.exclude.some((p) => harPar(p, byPar));
    if (hasExcluded) continue; // deltog i ett exclude-par (inom dess period) → diskvalificerad
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

// ISO-datum (YYYY-MM-DD) — VariantD.tsx:s datumkontroll bär samma form
// (`periodText`s `new Date(iso + 'T00:00:00')`-parsning).
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `par.period` (TASK-249.3, ADR-115 EF-krav 2/5): valfritt, `undefined`/
 * `null` ⇒ inget filter (dagens beteende). Satt ⇒ BÅDA ändarna måste vara
 * ISO-datum OCH `start` får inte ligga EFTER `end` — samma fail-closed-
 * disciplin som Konjunkt-gruppens tom-array-avvisning: en omvänd/orimlig
 * period avvisas vid parse-tid i stället för att tyst räknas som "matchar
 * aldrig" längre fram i algebran.
 */
function parsePeriod(value: unknown): Period | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidSegmentRuleError('par.period must be an object { start, end } or omitted');
  }
  const { start, end } = value as Record<string, unknown>;
  if (typeof start !== 'string' || !ISO_DATE_RE.test(start)) {
    throw new InvalidSegmentRuleError('par.period.start must be an ISO date string (YYYY-MM-DD)');
  }
  if (typeof end !== 'string' || !ISO_DATE_RE.test(end)) {
    throw new InvalidSegmentRuleError('par.period.end must be an ISO date string (YYYY-MM-DD)');
  }
  if (start > end) {
    throw new InvalidSegmentRuleError('par.period.start must not be after par.period.end');
  }
  return { start, end };
}

function parsePar(value: unknown): Par {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InvalidSegmentRuleError('each par must be an object { kurs, modalitet }');
  }
  const { kurs, modalitet, period } = value as Record<string, unknown>;
  if (typeof kurs !== 'string' || kurs.length === 0) {
    throw new InvalidSegmentRuleError('par.kurs must be a non-empty string');
  }
  // ADR-064 beslut 2: kurs valideras AVSIKTLIGT inte mot en lista (öppen taxonomi).
  if (!isModalitet(modalitet)) {
    throw new InvalidSegmentRuleError("par.modalitet must be 'Utbildning' or 'Föreläsning'");
  }
  const parsedPeriod = parsePeriod(period);
  return parsedPeriod === undefined ? { kurs, modalitet } : { kurs, modalitet, period: parsedPeriod };
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
