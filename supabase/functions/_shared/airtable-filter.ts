// Pure helpers för säker konstruktion av Airtable filterByFormula-uttryck.
//
// Bakgrund (M5): get-registrations och get-persons interpolerade tidigare
// query-parametrar direkt in i Airtable-formler. Det öppnade för
// formula-injection där en illvillig client kunde bryta ut citationer
// och köra OR(TRUE(),...) eller liknande.
//
// Designprincip: alla user-supplied värden går genom escapeFormulaValue
// och wrappas i dubbla citat. Field-namn är hårdkodade i caller-koden
// och valideras endast defensivt mot kontrolltecken.
//
// K6-respekt: filter-buildern vet ingenting om source-koncept eller
// integration_sources. Hanterar bara Airtable-formler. När S-track
// ersätter Airtable-Edge-Functions med target queries blir denna
// helper obsolet, inte migrerad.
//
// Pure ESM, inga Deno-globaler — kan importeras av både Deno (Edge
// Functions) och Node (Playwright-tester) utan modifikation.

const MAX_VALUE_LENGTH = 1000;

// Reject:ade tecken (input throws istället för att eskaperas):
//   U+0000–U+001F   ASCII-kontrolltecken (NUL, BEL, BS, TAB, LF, CR, ...)
//   U+007F          DEL
//   U+200B–U+200F   Zero-width chars (ZWSP, ZWNJ, ZWJ, LRM, RLM)
//   U+202A–U+202E   Bidi-formaterare (LRE, RLE, PDF, LRO, RLO)
//   U+2066–U+2069   Isolate-formaterare (LRI, RLI, FSI, PDI)
//
// Konstrueras via new RegExp() med explicit \u-escapes så filens
// visuella encoding inte spelar roll. Strikt sett är bara NUL och
// unbalanced-quotes formula-syntax-farliga, men resten reject:as
// defensivt eftersom de kan trasa runtime, displayet eller signal-
// analys i Airtable-loggar utan att synas i UI.
const FORBIDDEN_CHARS_REGEX = new RegExp(
  '[\\u0000-\\u001f\\u007f\\u200b-\\u200f\\u202a-\\u202e\\u2066-\\u2069]',
);

function validateInput(s: string): void {
  if (typeof s !== 'string') {
    throw new TypeError(`escapeFormulaValue: expected string, got ${typeof s}`);
  }
  if (s.length > MAX_VALUE_LENGTH) {
    throw new Error(
      `escapeFormulaValue: input too long (${s.length} > ${MAX_VALUE_LENGTH})`,
    );
  }
  if (FORBIDDEN_CHARS_REGEX.test(s)) {
    throw new Error(
      'escapeFormulaValue: input contains forbidden control or bidi characters',
    );
  }
}

// Eskapera ett user-supplied värde till en Airtable string-litteral.
// Returnerar `"<escaped>"` (inklusive omgivande citat) som kan
// inserteras direkt i en formula. Round-trip-säker: input kan
// återställas via parseAirtableString (inverse).
//
// Airtable string-syntax: \\ → \, \" → ". Inga andra escape-sekvenser.
// Parenteser, komma, citationer (inom strängen) bryter inte syntax så
// länge \" och \\ används korrekt. Funktionsnamn (TRUE(), OR(), etc.)
// och {field}-referenser är inerta inom strängar.
export function escapeFormulaValue(s: string): string {
  validateInput(s);
  // ORDNING KRITISK: \-escape måste komma FÖRST, annars dubbel-escapas
  // de \-tecken vi själva lägger in framför ".
  const escaped = s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

// Inverse av escapeFormulaValue. Används endast i tester för att
// verifiera INVARIANT (round-trip förlustfri). Throws vid invalid
// input — vilket bevisar att escapeFormulaValue:s output är
// väldefinierad enligt Airtable string-syntax.
export function parseAirtableString(formulaString: string): string {
  if (formulaString.length < 2) {
    throw new Error('parseAirtableString: string too short');
  }
  if (!formulaString.startsWith('"') || !formulaString.endsWith('"')) {
    throw new Error('parseAirtableString: expected wrapped string');
  }
  const inner = formulaString.slice(1, -1);
  let result = '';
  let i = 0;
  while (i < inner.length) {
    const c = inner[i];
    if (c === '\\') {
      i++;
      if (i >= inner.length) {
        throw new Error('parseAirtableString: trailing backslash');
      }
      const next = inner[i];
      if (next !== '\\' && next !== '"') {
        throw new Error(`parseAirtableString: invalid escape sequence \\${next}`);
      }
      result += next;
      i++;
    } else if (c === '"') {
      throw new Error('parseAirtableString: unescaped quote in middle');
    } else {
      result += c;
      i++;
    }
  }
  return result;
}

// Field-namn är HÅRDKODADE i caller (t.ex. 'Status', 'Event') och
// kommer inte från user-input. Vi validerar dock defensivt mot
// kontrolltecken och {/}-tecken som skulle bryta {field}-syntax.
const FORBIDDEN_FIELD_CHARS_REGEX = new RegExp('[\\u0000-\\u001f{}\\\\]');

function validateFieldName(name: string): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('field name must be a non-empty string');
  }
  if (name.length > 100) {
    throw new Error(`field name too long (${name.length})`);
  }
  if (FORBIDDEN_FIELD_CHARS_REGEX.test(name)) {
    throw new Error(`field name contains forbidden character: ${name}`);
  }
}

// FIND("recordId", ARRAYJOIN({Field})) — sök efter recordId inom array
// av länkade ID:n. recordId valideras med Airtable rec*-prefix.
export function buildLinkedRecordFilter(field: string, recordId: string): string {
  validateFieldName(field);
  if (typeof recordId !== 'string' || !/^rec[A-Za-z0-9]+$/.test(recordId)) {
    throw new Error(`invalid recordId format: ${recordId}`);
  }
  return `FIND(${escapeFormulaValue(recordId)}, ARRAYJOIN({${field}}))`;
}

// {Field} = "value" — exakt-equals jämförelse.
export function buildEqualsFilter(field: string, value: string): string {
  validateFieldName(field);
  return `{${field}} = ${escapeFormulaValue(value)}`;
}

// SEARCH-baserad sökning över flera fält. Varje fält kan vara scalar
// (`{Field}`) eller länkad/multi (`ARRAYJOIN({Field})`). Returnerar
// `OR(SEARCH(LOWER("term"), LOWER(field1)), ...)`.
export interface SearchField {
  name: string;
  isArray: boolean;
}

export function buildSearchAcrossFieldsFilter(
  term: string,
  fields: readonly SearchField[],
): string {
  if (fields.length === 0) {
    throw new Error('buildSearchAcrossFieldsFilter: at least one field required');
  }
  const escapedTerm = escapeFormulaValue(term.toLowerCase());
  const conditions = fields.map((f) => {
    validateFieldName(f.name);
    const fieldRef = f.isArray ? `ARRAYJOIN({${f.name}})` : `{${f.name}}`;
    return `SEARCH(${escapedTerm}, LOWER(${fieldRef}))`;
  });
  return `OR(${conditions.join(', ')})`;
}

// Kombinera flera filter-uttryck till AND(f1, f2, ...). Returnerar
// undefined om listan är tom (callern skickar då ingen filterByFormula).
// Returnerar enskilt filter oförändrat om bara ett finns.
export function combineWithAnd(filters: readonly string[]): string | undefined {
  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return `AND(${filters.join(', ')})`;
}

// Kombinera flera filter-uttryck till OR(f1, f2, ...) — symmetrisk motsvarighet
// till combineWithAnd (TASK-275.2, ADR-118 union-hämtningen: "tom-nivå-regeln"
// behöver `OR({Kursnivå} = "", {Kursnivå} = "<eventets nivå>")`). Samma
// tomlista-/singel-beteende som combineWithAnd.
export function combineWithOr(filters: readonly string[]): string | undefined {
  if (filters.length === 0) return undefined;
  if (filters.length === 1) return filters[0];
  return `OR(${filters.join(', ')})`;
}
