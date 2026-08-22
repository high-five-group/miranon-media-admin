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

// ---------------------------------------------------------------------------
// BOKSTAVSHINKARNA (TASK-283.2, ADR-123 beslut 3)
// ---------------------------------------------------------------------------
//
// Bokstavsraden är en HÄRLEDNING ur samma array listan redan sorterar och
// söker (ADR-123 beslut 3) — ingen serverparameter, ingen andra genomgång.
// PRD:ns ursprungliga implementationsbeslut lade filtret i EF:ens formel
// (`TASK-283.1`); den skivan UTGICK med ADR-123 väg B och kortets egen
// amendering 2026-08-21. Hemvisten här, inte i komponenten, är den denna
// modul redan utpekat åt sig själv i sorterings-avsnittet ovan.
//
// ═══ EN ENDA HINKFUNKTION, INTE ETT FILTER PER KNAPP ═══
//
// `personensBokstavshink()` nedan är den ENDA platsen en person tilldelas en
// hink. Sentinel-undantaget (fälla 43/51) blir därmed sant GENOM KONSTRUKTION
// i stället för genom en extra villkorsrad som kan glömmas: en namnlös person
// bär strängen `Ej tillgängligt`, som bokstavligen börjar på E, och ett naivt
// E-filter hade dragit med sig samtliga (186 av 559 i prod, ADR-123 § Kontext).
// Här kan den strukturellt aldrig få hinken `E`, eftersom sentinel-grenen
// returnerar före bokstavsgrenen. Låst i BÅDA riktningar av
// `tests/api/person-sok.test.ts`.
//
// ═══ JÄMFÖRELSEN ÄR DIAKRITIK-KORREKT, TILL SKILLNAD FRÅN SÖKNINGEN ═══
//
// Detta är modulens TREDJE axel, och den delar collator med ingen av de två
// andra — den använder ingen alls. Hinken avgörs av teckenlikhet (`===`), så
// `Å` kan strukturellt aldrig hamna i `A`-hinken. Det är avsiktligt motsatsen
// till sökningen (som viker å mot a sedan TASK-286.7) och samma riktning som
// sorteringen (som separerar dem, ADR-123 beslut 4). Tre frågor, tre svar:
//
//   sortering  Å efter Z          svensk ortografi
//   sökning    "asa" hittar Åsa   en förlåtande sökruta
//   hink       Å skilt från A     Lotta tryckte på Å, inte på A
//
// ═══ NYCKELN ÄR VISNINGSNAMNET, INTE `namn` ═══
//
// Samma nyckel som sorteringen och som raden VISAR (`personVisningsnamn`).
// En hink räknad på ett annat fält än det ögat läser är en garanti som inte
// håller — samma skäl som flyttade `personVisningsnamn` hit i TASK-286.3.

/**
 * Raden av bokstavshinkar, i svensk kollationsordning: A till Z, sedan Å, Ä,
 * Ö (ADR-123 beslut 4, PRD TASK-283 användarberättelse 7).
 *
 * HÅRDKODAD och inte härledd ur en collator, med avsikt: raden är ett stabilt
 * alfabet, inte en sortering av data. `Intl.Collator('sv')` kan ordna en given
 * mängd tecken, men den kan inte svara på VILKA 29 tecken raden ska bära.
 */
export const BOKSTAVSHINKAR: readonly string[] = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'Å', 'Ä', 'Ö'];

/**
 * Hinken för personer utan namn, sist i raden (PRD TASK-283
 * användarberättelse 8).
 *
 * VÄRDET ÄR OCKSÅ URL-VÄRDET, och formen är vald för att inte kunna kollidera
 * med en bokstavshink: gemener med bindestreck kan aldrig vara lika med en av
 * de 29 versalerna ovan. Nummertecknet (iOS-konventionen) förkastades redan i
 * PRD:n — det betyder "icke-alfabetisk sorteringsnyckel", inte "saknar namn",
 * och en namngiven hink är begripligare (Gunilla-principen).
 */
export const HINK_UTAN_NAMN = 'utan-namn';

/** Etiketten hinken bär i gränssnittet. */
export const HINK_UTAN_NAMN_ETIKETT = 'Utan namn';

/**
 * Vilken hink en person hör till, eller `null` för en som inte hör till någon
 * (ett namn som börjar på ett tecken utanför de 29 — en siffra, `É`, `Ø`).
 *
 * Den mängden är i praktiken tom i dagens register men hanteras ändå: en
 * person UTAN hink är osynlig när ett filter är valt och synlig när inget är,
 * vilket är det ärliga utfallet. Att tvinga in den i en granne-hink hade varit
 * en gissning om vilken.
 */
export function personensBokstavshink(person: Person): string | null {
  // Sentinel-grenen FÖRST — se avsnittets not. Rör aldrig E.
  if (arNamnlosSentinel(person)) return HINK_UTAN_NAMN;
  // Spread, inte `[0]`: ett namn som börjar med ett tecken utanför BMP skulle
  // annars klyvas mitt i sitt surrogatpar och jämföras som en halv kodpunkt.
  const forsta = [...personVisningsnamn(person)][0]?.toUpperCase() ?? '';
  return BOKSTAVSHINKAR.includes(forsta) ? forsta : null;
}

/**
 * Sant för ett värde som faktiskt ÄR en hink — en av de 29 bokstäverna eller
 * namnlös-hinken.
 *
 * Vaktar URL-ingången: `?bokstav=xyz` (bokmärke, handredigerad adress, gammal
 * länk) normaliseras till "inget filter" i stället för att tömma listan. Ett
 * ogiltigt filter som ser ut som noll träffar är ett tystare fel än inget
 * filter alls.
 */
export function arGiltigHink(varde: string | null | undefined): varde is string {
  return varde === HINK_UTAN_NAMN || (typeof varde === 'string' && BOKSTAVSHINKAR.includes(varde));
}

/**
 * Filtrera registret på EN hink. Inget (eller ogiltigt) val returnerar
 * registret OFÖRÄNDRAT och med samma referens, exakt som
 * `filtreraPersonregister` gör vid tom sökterm.
 *
 * AND-as med sökfiltret i `PersonsList`; ordningen mellan de två påverkar bara
 * hur många poster det andra filtret behöver läsa, aldrig utfallet.
 */
export function filtreraPaBokstavshink(personer: readonly Person[], hink: string | null): Person[] {
  if (!arGiltigHink(hink)) return personer as Person[];
  return personer.filter((person) => personensBokstavshink(person) === hink);
}

/**
 * Vilka hinkar som faktiskt HAR minst en person (TASK-283.3, AC #1/#2).
 *
 * ═══ INDATAN ÄR HELA REGISTRET — DET ÄR HELA POÄNGEN ═══
 *
 * Kortets enda icke förhandlingsbara rad: nedtoningen binds till HELA
 * registret, ALDRIG till aktuell sökterm. Bunden till söktermen hade nästan
 * varenda knapp slocknat medan Lotta skriver "ann", och raden hade flimrat vid
 * varje tangenttryck. Funktionen tar därför emot registret som helhet och vet
 * ingenting om vare sig sökfältet eller ett valt bokstavsfilter — den kan
 * strukturellt inte råka bli söktermsberoende, eftersom söktermen aldrig når
 * in hit.
 *
 * `PersonsList` vaktar samma sak från andra hållet: anropet läser `register`
 * (frågans egen data), inte `bokstavsfiltrerat` eller `filteredPersons`.
 *
 * ═══ SAMMA HINKFUNKTION SOM FILTRET — INVARIANTEN FÖLJER AV KONSTRUKTIONEN ═══
 *
 * Mängden byggs med `personensBokstavshink`, exakt den funktion
 * `filtreraPaBokstavshink` filtrerar med. Följden är den egenskap raden lovar
 * ögat: **en knapp är aktiv om och endast om ett tryck på den ger minst en
 * rad.** Hade nedtoningen räknats med en egen förstabokstavs-jämförelse (den
 * uppenbara genvägen) kunde de två glidit isär — och den första som glidit
 * hade varit sentinelen, som bokstavligen börjar på E men aldrig hör hemma i
 * E-hinken (fälla 43/51). Här kan det inte hända: en post som `filtreraPa...`
 * lägger i `utan-namn` tänder `utan-namn`, aldrig `E`.
 *
 * Invarianten är låst i BÅDA riktningar av `tests/api/person-sok.test.ts` —
 * för varje hink i raden korsprövas "aktiv" mot `filtreraPaBokstavshink`s
 * faktiska utfall på samma register.
 *
 * ═══ EN PERSON UTAN HINK TÄNDER INGEN KNAPP ═══
 *
 * `personensBokstavshink` returnerar `null` för ett namn utanför de 29
 * (en siffra, `É`, `Ø`). Sådana poster hoppas över: de är synliga när inget
 * filter är valt och nås inte av någon knapp, så att tända en granne hade
 * varit en gissning om vilken. Samma ärliga utfall som filtret redan ger.
 *
 * Returnerar en `Set` och inte en array: raden slår upp 30 gånger per
 * rendering, och `has` är O(1) där `includes` hade varit O(n).
 */
export function bokstavshinkarMedPersoner(personer: readonly Person[]): ReadonlySet<string> {
  const hinkar = new Set<string>();
  for (const person of personer) {
    const hink = personensBokstavshink(person);
    if (hink !== null) hinkar.add(hink);
  }
  return hinkar;
}
