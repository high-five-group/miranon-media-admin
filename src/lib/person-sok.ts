// Personregistrets klientfilter (ADR-123 beslut 2 + § Updates 2026-08-22,
// TASK-286.7) — DIAKRITIK-TOLERANT matchning, likvärdig med eventväljarens
// filter. "asa" hittar Åsa.
//
// BESLUTET (Marcus, TASK-286.5, 2026-08-22, JA), hans egen motivering:
// svenska namn bär diakritiker som vardag, inte som kant (Åsa, Östergren,
// Ängström); två sökytor med olika beteende i samma app är en inkonsekvens
// användaren omöjligt kan förutse, och eventväljaren är redan tolerant.
// Paritet med Airtables `SEARCH()` var en MÄTNING av dagens läge, aldrig ett
// mål. Träffmängden växer dessutom åt rätt håll — fler namn, aldrig färre.
//
// VAD SOM UPPHÄVDES: modulen replikerade tidigare EF:ens `SEARCH()`-semantik
// byte för byte (`toLowerCase()` + `String.prototype.includes`), eftersom
// `SEARCH()` är diakritik-KÄNSLIG (mätt i staging, ADR-123 § Kontext fynd 3:
// `SEARCH("asa", LOWER({Namn}))` → 0 träffar, `"åsa"` → 1). Den pariteten är
// hädanefter INTE ett mål. EF:ens sök-/cursor-gren lever kvar oförändrad och
// har kvar sin egen täckning (`tests/api/get-persons.staging.test.ts`,
// cursor-conformance mot `?search=`) — det är facit-KÄLLAN för klientfiltret
// som bytts, inte EF:en.
//
// ═══ MEKANISMEN: eventväljarens, inte en ny ═══
//
// `EventValjare.tsx` rad 177 kör `useFilter({ sensitivity: 'base' })`
// (`react-aria-components` 1.20.0 → `react-aria` 3.51.0) och skickar dess
// `contains` till `<Autocomplete filter>` (rad 393). Den hooken kan INTE
// anropas härifrån — `person-sok.ts` är rena funktioner utan render-kontext,
// och både `PersonsList` och de två testsviterna anropar dem som vanliga
// funktioner. Vad som återanvänds är därför hookens SEMANTIK, tagen ur dess
// källa i stället för uppfunnen på nytt: `useFilter` bygger en
// `Intl.Collator` med `{ usage: 'search', ...options }` (`useCollator.mjs`)
// och implementerar `contains` som NFC-normalisering plus ett glidande
// fönster av `collator.compare(...) === 0`. `innehaller()` nedan ÄR den
// algoritmen, rad för rad.
//
// ═══ LOKALEN ÄR MÄTT, INTE GISSAD — och den är MEDVETET INTE 'sv' ═══
//
// TASK-286.5:s kortformulering föreslog `Intl.Collator('sv',
// { sensitivity: 'base' })`. Den vägen levererar INTE beslutet, och det är
// mätt (node 24.13.1, full ICU, `Intl.Collator(loc, { usage: 'search',
// sensitivity: 'base' }).compare(a, b)`):
//
//   lokal    a/å   a/ä   o/ö   o/ø   e/é     asa/åsa
//   'sv'      -1    -1    -1    -1    0        -1   (INGEN tolerans)
//   'en-US'    0     0     0     0    0         0   (tolerant)
//
// Skälet är inte en bugg utan svensk ortografi: Å, Ä och Ö är EGNA bokstäver
// i svensk kollation, inte accenttecken på A och O, så `sensitivity: 'base'`
// har ingenting att vika bort. Varken `sv-u-co-search` eller `sv-u-ks-level1`
// ändrar det (båda mätta: resolved `co=default`, samma utfall som 'sv').
// Utelämnad lokal duger inte heller: `undefined`/`'und'` löses mot RUNTIMENS
// standardlokal, som i en svensk webbläsare är just `sv` — tolerans hade då
// blivit en egenskap hos användarens språkinställning i stället för hos
// produkten.
//
// Därför pinnas vikningslokalen explicit. Den är ett SÖK-verktyg, inte ett
// språkval för appen, och den är låst i båda riktningar av
// `tests/api/person-sok.test.ts` (som asserterar både att vikningen sker och
// att en 'sv'-kollation INTE hade gett den) — byts konstanten till 'sv' blir
// sviten röd på raden, inte tyst fel i produktion.
//
// ═══ SORTERING OCH SÖKNING ÄR OLIKA AXLAR — ingen motsägelse ═══
//
// Listan SORTERAS med `Intl.Collator('sv')` (ADR-123 beslut 4, TASK-286.3):
// A–Z och sedan Å, Ä, Ö, alltså å/ä/ö SEPARERADE från a/o. Listan SÖKS med
// vikningskollationen nedan, alltså å/ä/ö LIKSTÄLLDA med a/o. Det är två
// frågor med två rätta svar: bokstavsordningen i en svensk lista följer
// svensk ortografi, medan en sökruta ska förlåta att Lotta inte träffar rätt
// tangent. Se `SVENSK_KOLLATION` längre ned.
//
// ARRAYFÄLT (`Ort`, rollup 1→många): PRD-beslutet (task-286.2 § HUR, samma
// val ADR-123 tar) är "arrayfält: något element" — oförändrat av detta kort.
//
// Tom sökterm ("" — falsy): INGEN filtrering, hela registret matchar.
// Oförändrat, och samma tomsträngs-regel `useFilter`s egen `contains` bär
// (`if (substring.length === 0) return true`).
//
// KOSTNAD, mätt lokalt (node 24.13.1, 559 poster = ADR-123 § Kontext:s
// prod-siffra, fyra fält, varm loop, 30 varv): 0,84–4,54 ms per filtrering
// mot 0,06–0,14 ms för den gamla `toLowerCase().includes()`. Det ryms i en
// bildruta, och ADR-123 beslut 5:s `useDeferredValue` håller fältet
// responsivt oavsett. Talet är LOKALT — ingen mätning på Lottas enhet finns.

import type { Person } from '@/domain/models/Person';

/**
 * Vikningslokalen — vilken kollation som får avgöra att å ≡ a.
 *
 * MEDVETET INTE 'sv': se filhuvudets mättabell. Namnet säger vad den gör
 * (viker diakritiker för SÖK), inte vilket språk appen talar.
 */
const SOK_VIKNINGSLOKAL = 'en-US';

/**
 * Sök-kollationen — EXAKT de optioner `useFilter({ sensitivity: 'base' })`
 * ger sin collator (`useCollator({ usage: 'search', ...options })`).
 *
 * Skapad EN gång: `Intl.Collator` är dyr att konstruera, och `innehaller()`
 * anropar `compare` en gång per glidfönster-position.
 */
const SOK_KOLLATION = new Intl.Collator(SOK_VIKNINGSLOKAL, {
  usage: 'search',
  sensitivity: 'base',
});

/**
 * `useFilter`s `contains`, samma algoritm (`react-aria` 3.51.0,
 * `dist/private/i18n/useFilter.mjs`): NFC-normalisera båda sidor, glid sedan
 * ett fönster med söktermens längd genom texten och fråga kollationen om de
 * är LIKA på bas-nivå.
 *
 * VARFÖR INTE `String.prototype.includes` på en förnormaliserad sträng:
 * kollationen kan likställa tecken som inte har någon gemensam
 * NFD-nedbrytning — `ø` mot `o` är det mätta fallet (nordiska namn som Søren
 * är inte en hypotetisk kant i det här registret). Ett eget vikningsbord
 * hade varit en gissning; kollationen bär Unicode-datan.
 */
function innehaller(text: string, delstrang: string): boolean {
  if (delstrang.length === 0) return true;
  const hostack = text.normalize('NFC');
  const nal = delstrang.normalize('NFC');
  const langd = nal.length;
  for (let start = 0; start + langd <= hostack.length; start++) {
    if (SOK_KOLLATION.compare(nal, hostack.slice(start, start + langd)) === 0) return true;
  }
  return false;
}

/**
 * Sant om `term` är en diakritik- och skiftlägestolerant delsträng av
 * `value`. Ingen `toLowerCase()` behövs: `sensitivity: 'base'` ignorerar
 * BÅDE skiftläge och diakritik, så en manuell case-fold hade varit en andra,
 * överflödig mekanism för samma sak.
 */
function delstrangTraff(value: string | null, term: string): boolean {
  return typeof value === 'string' && innehaller(value, term);
}

/**
 * Matchar EN person mot EN sökterm — SAMMA fyra fält som EF:ens
 * `SEARCH_FIELDS` (`get-persons/index.ts`): Namn, E-post, Telefon, Ort.
 * Fältmängden är oförändrad av TASK-286.7; bara matchningens semantik bytte.
 *
 * `rawTerm` är RÅ och lämnas rå — kollationen (se filhuvudet) äger både
 * skiftläge och diakritik, så ingen förbehandling av termen sker här.
 */
export function personMatcharSokterm(person: Person, rawTerm: string): boolean {
  if (!rawTerm) return true;
  return (
    delstrangTraff(person.namn, rawTerm) ||
    delstrangTraff(person.email, rawTerm) ||
    delstrangTraff(person.telefon, rawTerm) ||
    // Arrayfält — "något element", PRD-beslutet (se filhuvudet). `stringArray`
    // (EF-sidan) filtrerar redan bort null/tomma element, så ingen extra guard
    // krävs här.
    person.ort.some((ort) => innehaller(ort, rawTerm))
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
 * beslutat.
 *
 * INGEN `sensitivity`-nedskruvning, och ingen delning med `SOK_KOLLATION`:
 * sortering och sökning är olika axlar med olika rätta svar (se filhuvudet
 * § SORTERING OCH SÖKNING). Sorteringen SEPARERAR å/ä/ö från a/o; sökningen
 * LIKSTÄLLER dem sedan TASK-286.7. Att låta den ena ärva den andras collator
 * hade brutit exakt en av dem.
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
