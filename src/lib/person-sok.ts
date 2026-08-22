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

// ---------------------------------------------------------------------------
// SVENSK SORTERING (ADR-123 beslut 4, TASK-286.3)
// ---------------------------------------------------------------------------
//
// Airtables egen `sort: [{ field: 'Namn' }]` var en VÄGG: den gav Å bland A
// vid bläddring medan bokstavsindexet (TASK-283) hinkar Å för sig — fälla 51:s
// synliga inkonsekvens. Vår egen array är ingen vägg, så ordningen räknas om i
// klienten och inkonsekvensen stängs för första gången.
//
// Hemvisten är denna modul, inte komponenten, med avsikt: TASK-283.2–283.4
// (bokstavsraden) ska kunna läsa SAMMA sorterade array och SAMMA hink-regel
// utan att räkna om något — och en `reduce` över registret per bokstav är
// bara korrekt om den läser exakt den ordning listan visar.

/**
 * Basens namnlös-sentinel (fälla 43): `Personer.Namn` är formeln
 * `IF(AND(Förnamn="", Efternamn=""), "Ej tillgängligt", …)`, så en person utan
 * namn bär STRÄNGEN, aldrig null. Exporterad för att bokstavsindexets
 * hink-logik (TASK-283) och sorteringen nedan ska läsa EN konstant i stället
 * för två literaler som kan drifta isär.
 */
export const SENTINEL_NAMNLOS = 'Ej tillgängligt';

/**
 * Sammansatt visningsnamn ur de namnfält Airtable kan leverera.
 *
 * [FLYTTAD HIT, TASK-286.3] Bodde som lokal `displayName` i `PersonsList.tsx`.
 * Sorteringen MÅSTE använda exakt den nyckel raden VISAR — annars läser Lotta
 * en lista vars ordning inte följer det hon ser — och en kopia i två filer är
 * precis den drift som gör en sådan garanti osann över tid.
 */
export function personVisningsnamn(person: Person): string {
  if (person.namn) return person.namn;
  const composed = [person.fornamn, person.efternamn].filter(Boolean).join(' ');
  return composed || 'Okänt namn';
}

/**
 * Sant för basens namnlös-sentinel — den enda posten som bryter ur den
 * alfabetiska ordningen (ADR-123 beslut 4: sorteras sist, i sin hink).
 *
 * MEDVETET SMAL: `personVisningsnamn`s egen tomform `Okänt namn` (vår UI-
 * fallback när `namn` är null OCH båda namnfälten är tomma) räknas INTE som
 * sentinel här. Skälet är mätbarhet, inte slarv: `Namn`-formeln levererar
 * alltid en sträng, så den mängden är i praktiken tom och därmed omätt —
 * att hinka en omätt klass vore en gissning. Den sorteras som vanligt namn
 * (under O). Dyker den upp i verklig data är det en egen, bokförbar
 * observation, inte något denna rad ska föregripa.
 */
export function arNamnlosSentinel(person: Person): boolean {
  return person.namn === SENTINEL_NAMNLOS;
}

/**
 * Svensk kollation, skapad EN gång: `Intl.Collator` är dyr att konstruera och
 * `sort` anropar `compare` O(n log n) gånger. Default-optionerna är rätt här
 * — `sv` ger A–Z följt av Å, Ä, Ö, exakt den ordning bokstavsindexet redan
 * beslutat. (Ingen `sensitivity`-nedskruvning: det är SÖKNINGENS
 * diakritik-fråga, ADR-123 beslut 2, och den avgörs inte av sorteringen.)
 */
const SVENSK_KOLLATION = new Intl.Collator('sv');

/**
 * Sortera HELA registret i svensk bokstavsordning med sentinelen sist.
 *
 * Returnerar en NY array — `Array.prototype.sort` muterar in-place, och
 * argumentet här är React Querys cachade data som aldrig får muteras.
 *
 * Ordningen är STABIL genom den efterföljande filtreringen: `Array.filter`
 * bevarar ordning, så listan sorteras EN gång per hämtat register och varje
 * sökning ärver ordningen gratis.
 */
export function sorteraPersonregister(personer: readonly Person[]): Person[] {
  return [...personer].sort((a, b) => {
    const aSentinel = arNamnlosSentinel(a);
    const bSentinel = arNamnlosSentinel(b);
    if (aSentinel !== bSentinel) return aSentinel ? 1 : -1;
    return SVENSK_KOLLATION.compare(personVisningsnamn(a), personVisningsnamn(b));
  });
}
