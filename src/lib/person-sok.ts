// Personregistrets klientfilter (ADR-123 beslut 2, TASK-286.2) — BYTE-FÖR-BYTE
// paritet med EF:ens SEARCH()-formel, aldrig en breddning.
//
// `get-persons`s sök-/cursor-gren bygger
// `OR(SEARCH(LOWER(term), LOWER(field)), ...)` per fält (Namn, E-post, Telefon,
// Ort) via `buildSearchAcrossFieldsFilter`
// (`supabase/functions/_shared/airtable-filter.ts`). SEARCH() är MÄTT i staging
// (ADR-123 § Kontext, `docs/research/forladdat-personregister-klientsok-
// branschmonster-2026-08-21.md`): skiftläges-OKÄNSLIG (båda sidor `LOWER()`:as)
// men diakritik-KÄNSLIG (`SEARCH("asa", LOWER({Namn}))` → 0 träffar,
// `SEARCH("åsa", ...)` → 1 träff — ingen Unicode-normalisering). Denna modul
// replikerar EXAKT den semantiken: `toLowerCase()` (samma case-fold,
// ingen diakritik-normalisering) + `String.prototype.includes` (samma
// delsträngs-test SEARCH() gör).
//
// Breddning (diakritik-TOLERANT sök, "asa" hittar Åsa) är ett SEPARAT,
// oavgjort produktbeslut (TASK-286.5, HITL) — smygs INTE in här.
//
// ARRAYFÄLT (`Ort`, rollup 1→många): EF:en kör `SEARCH(term, LOWER(ARRAYJOIN(
// {Ort})))` — sökningen kan i teorin (aldrig mätt i verklig data) matcha en
// söksträng som spänner över ARRAYJOIN:s kommaseparator mellan två element.
// PRD-beslutet (task-286.2 § HUR) väljer explicit "arrayfält: något element"
// för klienten i stället — samma val ADR-123 tar. Paritetstestet
// (`tests/api/get-persons-sok-paritet.staging.test.ts`) bevisar båda vägarna
// ÖVERENS för den faktiska termlistan; en söksträng konstruerad för att
// träffa just kommaseparatorn är en känd, bokförd kant (se den filens
// huvud), inte en gissning som byggs bort här.
//
// Tom sökterm ("" — falsy, samma JS-falsy-check som EF:ens `if (search)` på
// query-parametern): INGEN filtrering, hela registret matchar — spegling av
// `get-persons/index.ts`s `filterByFormula = BAS_FILTER` (utan sök-AND) när
// `search` saknas/är tom.

import type { Person } from '@/domain/models/Person';

/** Sant om `term` (case-fold, ingen normalisering) är en delsträng av `value`. */
function delstrangTraff(value: string | null, term: string): boolean {
  return typeof value === 'string' && value.toLowerCase().includes(term);
}

/**
 * Matchar EN person mot EN redan gemen sökterm — SAMMA fyra fält som EF:ens
 * `SEARCH_FIELDS` (`get-persons/index.ts`): Namn, E-post, Telefon, Ort.
 * `rawTerm` är RÅ (ej gemenifierad) — funktionen gör själv `toLowerCase()`,
 * exakt en gång, på SAMMA sätt som `buildSearchAcrossFieldsFilter` gör mot
 * termen innan den escapas in i formeln.
 */
export function personMatcharSokterm(person: Person, rawTerm: string): boolean {
  if (!rawTerm) return true;
  const term = rawTerm.toLowerCase();
  return (
    delstrangTraff(person.namn, term) ||
    delstrangTraff(person.email, term) ||
    delstrangTraff(person.telefon, term) ||
    // Arrayfält — "något element", PRD-beslutet (se filhuvudet). `stringArray`
    // (EF-sidan) filtrerar redan bort null/tomma element, så ingen extra guard
    // krävs här.
    person.ort.some((ort) => ort.toLowerCase().includes(term))
  );
}

/**
 * Filtrera HELA registret mot en sökterm — den enda operationen `PersonsList`
 * behöver. Tom/`undefined` term returnerar registret OFÖRÄNDRAT (samma
 * referens vid tom sökning är en medveten mikro-optimering, ingen kopiering
 * krävs när inget filtreras bort).
 */
export function filtreraPersonregister(personer: readonly Person[], rawTerm: string): Person[] {
  if (!rawTerm) return personer as Person[];
  return personer.filter((person) => personMatcharSokterm(person, rawTerm));
}
