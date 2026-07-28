import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type AnyHandler, RequestHandler } from 'msw';
import { efNamn, narmasteHandler } from './ef-namnforslag';

/**
 * Överskuggnings-vakten för fixturvärlden (task-62).
 *
 * SPEGELBILDEN AV HERMETIK-VAKTEN. Den fångar `request utan handler` — ett
 * anrop som ingen mock täcker. Denna fångar det omvända: `handler utan
 * request`. En `network.use()` vars mönster aldrig matchar något anrop.
 *
 * ── VARFÖR FELKLASSEN ÄR FARLIGARE ÄN DEN FÖRSTA ─────────────────────────
 *
 * Ett omockat anrop fäller. En oanvänd överskuggning gör INGENTING: handlern
 * läggs först i listan, matchar aldrig, anropet faller igenom till normalläget
 * (`handlers.ts`), och testet ser fixturens vanliga svar i stället för sitt
 * specialfall. Hermetik-vakten kan inte se det — anropet ÄR mockat, bara inte
 * av den handler testet trodde.
 *
 * MÄTT, INTE ANTAGET (task-59.8 steg 5, 2026-07-28). I
 * `persons-list.acceptance.test.ts` ändrades `EF('get-persons')` →
 * `EF('get-persosn')`, ett stavfel av exakt den klass `hermetic.ts` § Överskugga
 * en delad handler varnar för i klartext. Utfallet: 3 av 4 tester föll, 1
 * PASSERADE — och inget av de tre felmeddelandena nämnde överskuggningen.
 * Verbatim: `Expected: 2, Received: 10` och `element(s) not found: "2 personer
 * laddade (fler finns)."`. De pekar utvecklaren mot testdata, paginering eller
 * respondPage — aldrig mot mönstersträngen. Det fjärde testet var nöjt med
 * normallägets svar och blev grönt på fel data.
 *
 * ── TVÅ MEKANISMER, INTE EN SKARPARE TRÖSKEL (research 2026-07-28) ────────
 *
 * `docs/research/oanvand-mock-branschpraxis-2026-07-28.md` undersökte sex
 * ekosystem. Mockito är det enda med båda mekanismerna namngivna och åtskilda,
 * och delningen är hela poängen:
 *
 *   · IVRIG (`PotentialStubbingProblem`) — fäller MITT I TESTET, på ett bevis
 *     som redan finns. Äger stavfelsklassen. Här: `granskaRegistrering()` som
 *     körs när `network.use()` anropas, och `granskaTest()` vid testets slut.
 *
 *   · TRÖG (`UnnecessaryStubbingException`) — samlar hela körningen och
 *     rapporterar DEKLARATIONSSTÄLLEN som ingen använde
 *     (`getUnusedStubbingsByLocation`). Här: `aggregeraDodaStallen()`, körd av
 *     reportern i `overskuggnings-rapport.ts`.
 *
 * VARFÖR DEN TRÖGA MÅSTE VARA PER FIL, INTE PER TEST. Mätt 2026-07-28 över hela
 * acceptance-sviten (321 observationer, 18 filer, 55 deklarationsställen): en
 * per-TEST-vakt fäller 51 handler-instanser i 36 tester i 8 filer. Samma vakt
 * aggregerad per (fil, `callFrame`) fäller 4 — 7,8 % överlever. Skillnaden är
 * nästan uteslutande `beforeEach`-registrerade batchar som bara en delmängd av
 * filens tester utlöser; det är ett IDIOM, inte en bugg. Steg 2 i kortets plan
 * bar alltså 92 % av lösningen, och `medvetetOanvand` blev därmed en ren
 * undantagsventil (2 ställen, inte 36).
 *
 * ── VAD VAKTEN INTE GÖR ──────────────────────────────────────────────────
 *
 * Den granskar ENDAST testets egna överskuggningar, aldrig normalläget.
 * `handlers.ts` exporterar en modul-nivå array vars handler-OBJEKT delas av alla
 * tester i samma worker-process; `isUsed` ackumuleras därför tvärs tester på
 * dem. En normallägeshandler som ingen vy råkar behöva är dessutom helt legitim.
 * Urvalet görs i `hermetic.ts` på objekt-identitet mot normalläget.
 *
 * ── MEKANISMEN, KÄLLVERIFIERAD I INSTALLERAD VERSION ──────────────────────
 *
 * `RequestHandler.isUsed: boolean` — "Indicates whether this request handler has
 * been used (its resolver has successfully executed)" (msw 2.15.0,
 * `lib/core/HttpResponse-DL-P1EeG.d.ts` rad 213–218). Verifierad mot
 * IMPLEMENTATIONEN och inte bara mot doc-kommentaren: `RequestHandler.js` rad
 * 149 sätter `this.isUsed = true` direkt efter att `predicate()` gett träff,
 * alltså innan resolvern kört klart. Skillnaden spelar ingen roll här — vi
 * frågar "matchade denna handler något anrop", och det är precis vad flaggan
 * svarar på.
 *
 * `RequestHandler.info.callFrame?: string` (samma fil, rad 163–165) bär
 * registreringens plats i källkoden, satt av `getCallFrame(new Error())` i
 * `RequestHandler.js` rad 51. Den är det som gör per-fil-aggregeringen möjlig —
 * utan den finns ingen stabil identitet för ett deklarationsställe. Typen är
 * optional, och koden nedan degraderar mjukt när den saknas.
 *
 * DEN KÄNDA LUCKAN, ÖPPET BOKFÖRD: en resolver som returnerar en ITERATOR
 * (generator-resolver) sätter tillfälligt tillbaka `isUsed = false` mitt i
 * iterationen och `true` först när den är färdig (`RequestHandler.js` rad
 * 231/238). En generator-överskuggning som står mitt i sin sekvens när testet
 * slutar skulle därför kunna se oanvänd ut. Fixturvärlden har noll
 * generator-resolvers i dag (verifierat med sökning över `tests/`), och den dag
 * en införs är `medvetetOanvand` nedan rätt ventil.
 */

// ---------------------------------------------------------------------------
// EDGE FUNCTION-KATALOGEN — den ivriga kontrollens sanningskälla
// ---------------------------------------------------------------------------

/**
 * DE FAKTISKA EDGE FUNCTIONS SOM REPOT BÄR, lästa ur `supabase/functions/`.
 *
 * ── VARFÖR KATALOGEN OCH INTE ETT AVSTÅNDSMÅTT ───────────────────────────
 *
 * Kortets plan föreslog att den ivriga kontrollen skulle fälla på NÄRHET:
 * oanvänd överskuggning vars EF-namn ligger nära ett namn testet faktiskt
 * anropade. Det kriteriet MÄTTES före bygget och föll — närhetströskeln
 * (`floor(0,4 × längd)`, lånad från TypeScripts `getSpellingSuggestion`) är
 * kalibrerad för FÖRSLAG, inte för FÄLLNING, och parar ihop Edge Functions som
 * båda är äkta:
 *
 *     create-registration ~ get-registrations   avstånd 5, tak 7
 *     create-event-note   ~ get-event-notes     avstånd 5, tak 6
 *     get-segments        ~ get-events          avstånd 3, tak 4
 *
 * Just de paren är fixturvärldens vanligaste batch-registreringar: ett test
 * registrerar `create-registration` i `beforeEach` och anropar
 * `get-registrations`. Ett närhetskriterium hade alltså fällt precis den
 * population steg 2 finns för att tysta. Ett självsäkert FEL är dyrare än inget
 * fynd — samma princip som redan styr `narmasteHandler`s tröskel.
 *
 * Katalogen ger i stället ett SKARPT kriterium utan avstånd i sig: heter
 * mönstrets Edge Function inget som finns, kan mönstret per definition aldrig
 * matcha ett anrop. Det är sant oberoende av vad testet gör, och kan därför
 * avgöras redan vid `network.use()` — den tidigaste möjliga punkten, med
 * stack-tracen pekande rakt på registreringsraden.
 *
 * Avståndsmåttet behålls där det hör hemma: som "Menade du"-FÖRSLAG i
 * meddelandet, aldrig som fällningsgrund.
 *
 * BONUSEN, VÄRD ATT KÄNNA TILL: byter en Edge Function namn eller tas bort
 * fäller varje test som fortfarande mockar det gamla namnet. Det är kontrakts-
 * drift fångad vid källan, inte en bieffekt att designa bort.
 *
 * Kataloger med understreck-prefix (`_shared`) är delad kod, inte deployade
 * funktioner, och räknas därför inte.
 */
const EF_KATALOG_SOKVAG = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/functions',
);

function laddaEfKatalog(): ReadonlySet<string> {
  let poster: readonly string[];
  try {
    poster = readdirSync(EF_KATALOG_SOKVAG, { withFileTypes: true })
      .filter((post) => post.isDirectory() && !post.name.startsWith('_'))
      .map((post) => post.name);
  } catch (orsak) {
    // HÖGT, INTE TYST. En vakt som tappar sin sanningskälla och fortsätter i
    // tystnad är exakt den felklass `hermetic.ts` § onUnhandledRequest beskriver:
    // sviten ser bevakad ut medan den släpper igenom allt.
    throw new Error(
      [
        'Överskuggnings-vakten kunde inte läsa Edge Function-katalogen.',
        '',
        `  ${EF_KATALOG_SOKVAG}`,
        `  ${orsak instanceof Error ? orsak.message : String(orsak)}`,
        '',
        'Katalogen är den ivriga kontrollens sanningskälla — utan den kan vakten',
        'inte avgöra om ett mönster pekar på en Edge Function som finns.',
      ].join('\n'),
    );
  }

  if (poster.length === 0) {
    throw new Error(`Överskuggnings-vakten hittade noll Edge Functions i ${EF_KATALOG_SOKVAG}.`);
  }

  return new Set(poster);
}

let efKatalog: ReadonlySet<string> | undefined;

/** Lat laddning: en `readdirSync` per worker-process, inte per test. */
export function kandaEfNamn(): ReadonlySet<string> {
  efKatalog ??= laddaEfKatalog();
  return efKatalog;
}

// ---------------------------------------------------------------------------
// VENTILEN — medvetetOanvand
// ---------------------------------------------------------------------------

/**
 * Minsta längd på skälet i `medvetetOanvand`. Talet är VÅRT EGET, inte lånat —
 * det finns ingen branschstandard för hur långt ett undantagsskäl ska vara, och
 * ett påhittat prejudikat vore sämre än ett ärligt val.
 *
 * Baren den kodar: en MENING, inte ett ord. `'temp'`, `'ok'` och `'fixme'` ska
 * inte gå igenom, eftersom ett skäl som inte förklarar något gör undantaget
 * till en avstängningsknapp — precis vad kortet säger att det inte får bli.
 * Precedensen för att alls kräva ett skäl är Biomes `// biome-ignore
 * lint/rule: <explanation>`, som avvisar suppressionen utan förklaring.
 */
const MINSTA_SKAL_LANGD = 20;

/**
 * Märkningen bärs av en Symbol-egenskap på handlern — icke-uppräkningsbar,
 * icke-skrivbar, icke-konfigurerbar. Formen är MSW:s egen: biblioteket märker
 * syskon-handlers likadant (`kSiblingHandlers` i
 * `lib/core/utils/internal/attachSiblingHandlers.js`). Symbolen är modul-privat,
 * så märkningen kan inte sättas utifrån utan att gå via `medvetetOanvand()` —
 * och därmed inte utan ett skäl.
 */
const MEDVETET_OANVAND = Symbol('medvetetOanvand');

interface Markt {
  [MEDVETET_OANVAND]?: string;
}

function markningsSkal(handler: AnyHandler): string | undefined {
  return (handler as AnyHandler & Markt)[MEDVETET_OANVAND];
}

/**
 * Undantar EN överskuggning från vakten, med ett nedskrivet skäl.
 *
 * ── VENTIL, INTE DÄMPARE — OCH KALIBRERINGEN ÄR NU BEVISAD ───────────────
 *
 * Kortet ställde villkoret rakt ut: "Behövs ventilen på 36 ställen är vakten
 * fel kalibrerad." Mätningen 2026-07-28 svarade: efter per-fil-aggregeringen
 * behövs den på TVÅ ställen i hela repot, båda av samma slag —
 * `mer-segment-send.acceptance.test.ts` (`send-email`) och
 * `person-note-edit.acceptance.test.ts` (`update-record`).
 *
 * Klassen heter NEGATIV SENSOR: `let sendCalled = false`, en handler som sätter
 * flaggan, och en senare assertion att den är FALSE. Handlern registreras för
 * att bevisa att anropet ALDRIG sker — att den förblir oanvänd ÄR testets
 * resultat. Det är vaktens farligaste falska positiv: utan ventil fäller den
 * exakt de tester vars korrekthet består i att handlern inte används. Nocks
 * `.optionally()`, testifys `.Maybe()` och Mockitos `lenient()` finns för samma
 * klass; kravet på nedskrivet skäl går utöver alla tre.
 *
 * ── VARFÖR FORMEN SER UT SÅ HÄR ──────────────────────────────────────────
 *
 * Kortet kräver att en legitim oanvänd överskuggning kan undantas explicit och
 * att undantaget SYNS I KODEN. Tre val gör det svårt att sätta av slentrian:
 *
 *   1. DEN OMSLUTER HANDLERN, inte testet. Ett test-scopat undantag hade
 *      stängt av vakten för allt testet gör; detta märker exakt den handler som
 *      får vara oanvänd. Övriga överskuggningar i samma test vaktas vidare.
 *
 *   2. SKÄLET ÄR OBLIGATORISKT och prövas direkt vid anropet, inte vid
 *      teardown. Ett tomt eller ordkort skäl fäller på plats med en förklaring
 *      — man kan alltså inte råka skriva undantaget färdigt.
 *
 *   3. MÄRKNINGEN FÄLLER NÄR DEN BLIR INAKTUELL. Matchar handlern ändå ett
 *      anrop fälls testet på att undantaget inte längre behövs. Kontraktet är
 *      TypeScripts `@ts-expect-error`, som är ett fel när felet det undertrycker
 *      har försvunnit — till skillnad från dess tysta syskon (ignorerings-
 *      direktivet, som Biome av samma skäl förbjuder i detta repo), vilket
 *      ruttnar utan besked. Ett undantag som inte kan bli inaktuellt är ett
 *      undantag som aldrig städas.
 *
 * Kostnaden är alltså både att skriva det (ett skäl) och att behålla det (det
 * måste fortsätta vara sant). Det är avsikten.
 *
 * @example
 * network.use(
 *   medvetetOanvand(
 *     http.post(EF('send-email'), () => json({ ok: true })),
 *     'Mailgrenen nås först efter bekräftelse-dialogen, som detta test inte öppnar.',
 *   ),
 * );
 */
export function medvetetOanvand<T extends AnyHandler>(handler: T, skal: string): T {
  const rensat = skal.trim();

  if (rensat.length < MINSTA_SKAL_LANGD) {
    throw new Error(
      [
        'medvetetOanvand() kräver ett SKÄL, inte en etikett.',
        '',
        `  fick: ${JSON.stringify(skal)} (${rensat.length} tecken, minst ${MINSTA_SKAL_LANGD} krävs)`,
        '',
        'Skriv vilken gren handlern täcker och varför just detta test inte når',
        'den. Nästa läsare ska kunna avgöra om undantaget fortfarande gäller utan',
        'att köra testet.',
      ].join('\n'),
    );
  }

  if (markningsSkal(handler) !== undefined) {
    throw new Error(
      'medvetetOanvand() är redan satt på denna handler — märk den en gång, med ett skäl.',
    );
  }

  Object.defineProperty(handler, MEDVETET_OANVAND, {
    value: rensat,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return handler;
}

// ---------------------------------------------------------------------------
// GEMENSAM AVLÄSNING
// ---------------------------------------------------------------------------

/**
 * Handlerns header — metod plus mönster, t.ex. `GET ` följt av
 * `'*' + '/functions/v1/get-persons'`. Samma källa som hermetik-vakten listar
 * ur, alltså handlarens egen och omöjlig att drifta ifrån matchningen.
 * (Mönstret skrivs delat här av samma skäl som i `hermetic.ts`: en asterisk
 * följd av snedstreck stänger blockkommentaren.)
 */
function header(handler: RequestHandler): string {
  return handler.info.header;
}

/** Mönstret ur en header — allt efter första blanksteget. */
function monster(rad: string): string {
  return rad.slice(rad.indexOf(' ') + 1);
}

/** Repo-roten, för att korta callFrame-sökvägar till något läsbart. */
const REPO_ROT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

/**
 * Registreringens plats som `tests/acceptance/hem.acceptance.test.ts:216:18`.
 *
 * MSW ger den råa formen `    at file:///abs/path/fil.ts:216:18`
 * (`getCallFrame`). Sökvägen kortas mot repo-roten så att aggregeringsnyckeln
 * blir densamma oavsett var repot ligger på disk — en agent-worktree och
 * huvudkatalogen ska ge samma nyckel.
 */
export function platsUrCallFrame(callFrame: string | undefined): string | undefined {
  if (callFrame === undefined) return undefined;
  const trad = callFrame.trim();
  const utanAt = trad.startsWith('at ') ? trad.slice(3) : trad;
  const filDel = utanAt.replace(/^file:\/\//, '');
  if (filDel === '') return undefined;
  return path.isAbsolute(filDel.replace(/:\d+:\d+$/, ''))
    ? path.relative(REPO_ROT, filDel)
    : filDel;
}

/**
 * Annotation-typen som bär observationerna från Playwright-workern till
 * reportern. Bor här, hos beslutet, så att varken `hermetic.ts` (som skriver
 * den) eller `overskuggnings-rapport.ts` (som läser den) behöver importera den
 * andra — och så att strängen inte kan drifta isär mellan skrivare och läsare.
 */
export const ANNOTATION_TYP = 'overskuggnings-vakt';

/**
 * En observation per överskuggning och test — det reportern aggregerar över.
 *
 * SERIALISERBAR MED FLIT: den reser från Playwright-workern till reportern som
 * en test-annotation (JSON), eftersom reportern är den enda komponent som ser
 * ALLA tester i en fil även när de splittras över workers vid retry.
 */
export interface Overskuggningsobservation {
  /** Deklarationsstället, `fil.ts:rad:kol`, eller headern när callFrame saknas. */
  readonly stalle: string;
  /** Handlerns header — metod plus mönster, t.ex. `GET ` följt av mönstret. */
  readonly header: string;
  /** Matchade handlern ett anrop under testet? */
  readonly anvand: boolean;
  /** Skälet från `medvetetOanvand`, när stället är märkt. */
  readonly markningsSkal?: string;
  /** Har stället redan fällt ivrigt? Då ska den tröga rapporten tiga om det. */
  readonly falldeIvrigt: boolean;
}

// ---------------------------------------------------------------------------
// FELKLASSER
// ---------------------------------------------------------------------------

/**
 * EGNA KLASSER PER FELKLASS, till skillnad från hermetik-vakten som bär två
 * meddelanden i EN klass. Där är de två meddelandena två råd om samma händelse
 * (ett omockat anrop). Här är händelserna olika, och felets NAMN är det första
 * utvecklaren läser i terminalen — ett gemensamt namn hade lett felsökningen
 * fel på första raden.
 */
export class OkantEfNamnError extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = 'OkantEfNamnError';
  }
}

/** Edge Function:en anropades, men överskuggningen matchade ändå inte. */
export class OmatchadOverskuggningError extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = 'OmatchadOverskuggningError';
  }
}

/** En överskuggning är märkt `medvetetOanvand` men matchade ändå ett anrop. */
export class InaktuellMarkeringError extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = 'InaktuellMarkeringError';
  }
}

// ---------------------------------------------------------------------------
// IVRIG KONTROLL 1 — vid network.use()
// ---------------------------------------------------------------------------

function stalleRad(handler: RequestHandler): string[] {
  const plats = platsUrCallFrame(handler.info.callFrame);
  return plats === undefined ? [] : [`                ${plats}`];
}

function byggOkantEfMeddelande(handler: RequestHandler, kanda: ReadonlySet<string>): string {
  const soktNamn = efNamn(monster(header(handler)));
  // Kandidat-kartan är EF-namn → EF-namn: `narmasteHandler` returnerar värdet,
  // och här ÄR namnet svaret (till skillnad från hermetik-vakten, där värdet är
  // en handler-header).
  const kandidater = new Map([...kanda].sort().map((namn) => [namn, namn] as const));
  const narmaste = soktNamn === undefined ? undefined : narmasteHandler(soktNamn, kandidater);

  const rader = [
    'Överskuggnings-vakten stoppade en network.use() vars Edge Function inte finns.',
    '',
    `  registrerad:  ${header(handler)}`,
    ...stalleRad(handler),
    '',
  ];

  if (narmaste !== undefined) {
    rader.push(`  Menade du:    ${narmaste}`, '');
  }

  rader.push(
    `Ingen Edge Function heter "${soktNamn}". supabase/functions/ bär ${kanda.size} st,`,
    'och mönstret kan därför ALDRIG matcha ett anrop: handlern läggs först i',
    'listan, missar varje request, och anropet faller igenom till normalläget',
    '(tests/support/fixturvarld/handlers.ts). Testet ser då fixturens vanliga svar',
    'i stället för sitt specialfall — och en assertion som ändå passerar bevisar',
    'inget om det fall testet påstår sig pröva.',
    '',
    'Är namnet rätt men Edge Function:en nyss omdöpt eller borttagen? Då är detta',
    'kontraktsdrift, inte ett stavfel — rätta mocken mot supabase/functions/.',
  );

  return rader.join('\n');
}

/**
 * IVRIG KONTROLL, KÖRD NÄR ÖVERSKUGGNINGEN REGISTRERAS.
 *
 * Mockitos `PotentialStubbingProblem` fäller mitt i testet, på ett bevis som
 * redan finns. Detta är den tidigast möjliga punkten för stavfelsklassen: att
 * mönstrets Edge Function inte existerar är sant oberoende av vad testet sedan
 * gör, så det finns ingen anledning att vänta till teardown. Vinsten är
 * stack-tracen — den pekar rakt på `network.use()`-raden i testfilen, i stället
 * för på en fixtur långt bort.
 *
 * WEBSOCKET-HANDLERS FILTRERAS BORT. `WebSocketHandler` (msw 2.15.0,
 * `handlers/WebSocketHandler.d.ts` rad 25–30) har varken `info.header` eller
 * `isUsed` — den bär `url`, `id`, `kind` och `callFrame`. Den kan alltså varken
 * bedömas eller felaktigt fällas, och sorteras därför bort explicit i stället
 * för att tyst räknas som godkänd. Samma urval i den tröga kontrollen.
 */
export function granskaRegistrering(overskuggningar: readonly AnyHandler[]): void {
  const kanda = kandaEfNamn();

  for (const handler of overskuggningar) {
    if (!(handler instanceof RequestHandler)) continue;
    const soktNamn = efNamn(monster(header(handler)));
    // `undefined` betyder att mönstret inte ens pekar under /functions/v1/ —
    // det är inte denna vakts felklass.
    if (soktNamn === undefined) continue;
    if (kanda.has(soktNamn)) continue;
    throw new OkantEfNamnError(byggOkantEfMeddelande(handler, kanda));
  }
}

// ---------------------------------------------------------------------------
// IVRIG KONTROLL 2 — vid testets slut
// ---------------------------------------------------------------------------

/** Ett Edge Function-anrop testet faktiskt gjorde. */
export interface EfAnrop {
  readonly metod: string;
  readonly namn: string;
  readonly url: string;
}

function byggOmatchadMeddelande(handler: RequestHandler, anrop: readonly EfAnrop[]): string {
  return [
    'Överskuggnings-vakten stoppade en överskuggning som inte matchade — trots att',
    'dess Edge Function anropades.',
    '',
    `  registrerad:  ${header(handler)}`,
    ...stalleRad(handler),
    '  testet anropade:',
    ...anrop.map((a) => `                ${a.metod} ${a.url}`),
    '',
    'Samma Edge Function, ingen träff. Skillnaden sitter alltså i METODEN eller i',
    'mönstrets form — glömd värd-joker (mönstret ska börja med en asterisk), extra',
    'path-segment, eller query-sträng inbakad i mönstret.',
    '',
    'Anropet togs i stället av normalläget (tests/support/fixturvarld/handlers.ts),',
    'så testet såg fixturens vanliga svar i stället för sitt specialfall.',
    '',
    'Bygg mönstret med EF(namn) ur handlers.ts och sätt metoden efter vad appen',
    'faktiskt gör — http.get för läsningar, http.post för skrivningar.',
  ].join('\n');
}

function byggInaktuellMeddelande(inaktuella: readonly RequestHandler[]): string {
  const flera = inaktuella.length > 1;
  return [
    flera
      ? `Överskuggnings-vakten stoppade ${inaktuella.length} INAKTUELLA medvetetOanvand-märkningar.`
      : 'Överskuggnings-vakten stoppade en INAKTUELL medvetetOanvand-märkning.',
    '',
    ...inaktuella.flatMap((handler) => [
      `  ${header(handler)}`,
      ...stalleRad(handler),
      `    skäl: ${markningsSkal(handler)}`,
    ]),
    '',
    flera
      ? 'Handlarna är märkta som medvetet oanvända, men de matchade anrop. Skälen'
      : 'Handlern är märkt som medvetet oanvänd, men den matchade ett anrop. Skälet',
    'ovan gäller alltså inte längre — antingen har testet vuxit in i grenen, eller',
    'så stämde beskrivningen aldrig.',
    '',
    'Ta bort medvetetOanvand()-omslutningen. Kontraktet är @ts-expect-error:s —',
    'ett undantag som slutat behövas är i sig ett fel, annars ruttnar det tyst.',
  ].join('\n');
}

/**
 * IVRIG KONTROLL VID TESTETS SLUT, plus observationerna den tröga behöver.
 *
 * TVÅ FELKLASSER FÄLLS HÄR, båda med bevis som gäller det ENSKILDA testet:
 *
 *   1. OMATCHAD ÖVERSKUGGNING — handlern är oanvänd, testet anropade SAMMA
 *      Edge Function, och INGEN annan av testets överskuggningar för den
 *      Edge Function:en tog anropet. Då är namnet rätt och något annat fel:
 *      metoden, värd-jokern, ett extra path-segment. Kriteriet är EXAKT
 *      namnlikhet, aldrig närhet.
 *
 *      SISTA LEDET ÄR MÄTT FRAM, INTE TEORETISKT. Utan det föll två tester i
 *      den fulla sviten på ett fullt legitimt idiom: en `beforeEach` sätter ett
 *      grundsvar (`POST compute-segment`, `GET get-segments`) och ETT test
 *      registrerar sin egen variant i testkroppen. `use()` prepend:ar
 *      (`handlers-controller.js` rad 82), så den senare vinner och
 *      beforeEach-handlern blir oanvänd — trots att Edge Function:en anropades.
 *      Den är SKUGGAD, inte felskriven, och testfilerna säger det rakt ut i
 *      sina egna kommentarer. En skuggad handler är alltså ett normalt
 *      överskuggnings-mönster, och vakten ska tiga om det.
 *
 *   2. INAKTUELL MÄRKNING — `medvetetOanvand` satt på en handler som ändå
 *      matchade. Behöver ingen aggregering: beviset finns i detta test.
 *
 * ORDNINGEN ÄR MEDVETEN. Den första klassen betyder att testet tyst kördes mot
 * fel data; den andra att en anteckning blivit gammal. Finns båda ska den som
 * förstörde beviset stå överst.
 *
 * ALLT ANNAT LÄMNAS TILL DEN TRÖGA KONTROLLEN. En oanvänd överskuggning vars
 * Edge Function testet aldrig anropade är i 92 % av fallen en batch-registrering
 * som ett ANNAT test i samma fil använder — den frågan kan bara besvaras när
 * hela filen körts.
 *
 * FELET RETURNERAS, DET KASTAS INTE. Anroparen måste hinna bokföra
 * observationerna innan testet fälls — annars hade en ivrig fällning tagit med
 * sig testets ÖVRIGA observationer i fallet, och ett fullt levande
 * deklarationsställe kunnat se dött ut för den tröga kontrollen.
 */
export function granskaTest(argument: {
  readonly overskuggningar: readonly AnyHandler[];
  readonly anrop: readonly EfAnrop[];
}): { readonly observationer: readonly Overskuggningsobservation[]; readonly fel?: Error } {
  // WebSocket-handlers saknar både `isUsed` och `info.header` (msw 2.15.0) —
  // se `granskaRegistrering` ovan. Sorteras bort explicit i stället för att
  // tyst räknas som använda.
  const handlers = argument.overskuggningar.filter(
    (handler): handler is RequestHandler => handler instanceof RequestHandler,
  );
  if (handlers.length === 0) return { observationer: [] };

  const anropadeNamn = new Set(argument.anrop.map((anrop) => anrop.namn));

  /** EF-namn vars anrop redan togs av en ANNAN av testets överskuggningar. */
  const skuggande = new Set(
    handlers
      .filter((handler) => handler.isUsed)
      .map((handler) => efNamn(monster(header(handler))))
      .filter((namn): namn is string => namn !== undefined),
  );

  const omatchade = handlers.filter((handler) => {
    if (handler.isUsed) return false;
    if (markningsSkal(handler) !== undefined) return false;
    const soktNamn = efNamn(monster(header(handler)));
    if (soktNamn === undefined) return false;
    if (skuggande.has(soktNamn)) return false;
    return anropadeNamn.has(soktNamn);
  });

  const inaktuella = handlers.filter(
    (handler) => handler.isUsed && markningsSkal(handler) !== undefined,
  );

  const observationer = handlers.map<Overskuggningsobservation>((handler) => ({
    stalle: platsUrCallFrame(handler.info.callFrame) ?? `<utan callFrame> ${header(handler)}`,
    header: header(handler),
    anvand: handler.isUsed,
    markningsSkal: markningsSkal(handler),
    falldeIvrigt: omatchade.includes(handler) || inaktuella.includes(handler),
  }));

  if (omatchade.length > 0) {
    const skyldig = omatchade[0];
    const soktNamn = efNamn(monster(header(skyldig)));
    return {
      observationer,
      fel: new OmatchadOverskuggningError(
        byggOmatchadMeddelande(
          skyldig,
          argument.anrop.filter((anrop) => anrop.namn === soktNamn),
        ),
      ),
    };
  }

  if (inaktuella.length > 0) {
    return { observationer, fel: new InaktuellMarkeringError(byggInaktuellMeddelande(inaktuella)) };
  }

  return { observationer };
}

// ---------------------------------------------------------------------------
// TRÖG KONTROLL — per deklarationsställe och fil
// ---------------------------------------------------------------------------

/** Ett deklarationsställe som ingen test i sin fil använde. */
export interface DottStalle {
  readonly fil: string;
  readonly stalle: string;
  readonly header: string;
  /** Antal tester i filen som registrerade stället. */
  readonly registreratAv: number;
}

/** En fils observationer, som reportern samlar dem. */
export interface FilObservationer {
  readonly fil: string;
  readonly testerSomKorde: number;
  readonly observationer: readonly Overskuggningsobservation[];
}

/**
 * MOCKITOS `getUnusedStubbingsByLocation`, PORTAD.
 *
 * Aggregerar på (fil, deklarationsställe) och rapporterar bara ställen som
 * INGET test i filen använde. Ett ställe som märkts `medvetetOanvand` av något
 * test räknas som förklarat och rapporteras inte; ett som redan fällt ivrigt
 * rapporteras heller inte, eftersom samma fynd då hade kommit två gånger.
 *
 * REN FUNKTION MED FLIT. Verkan — att läsa annotations och fälla körningen —
 * bor i `overskuggnings-rapport.ts`. Beslutet kan därmed prövas i självtestet
 * utan att en Playwright-körning behövs, precis som hermetik-vaktens beslut.
 */
export function aggregeraDodaStallen(filer: readonly FilObservationer[]): readonly DottStalle[] {
  const doda: DottStalle[] = [];

  for (const fil of filer) {
    const perStalle = new Map<
      string,
      { header: string; anvand: boolean; markt: boolean; ivrigt: boolean; antal: number }
    >();

    for (const obs of fil.observationer) {
      const rad = perStalle.get(obs.stalle) ?? {
        header: obs.header,
        anvand: false,
        markt: false,
        ivrigt: false,
        antal: 0,
      };
      rad.anvand ||= obs.anvand;
      rad.markt ||= obs.markningsSkal !== undefined;
      rad.ivrigt ||= obs.falldeIvrigt;
      rad.antal += 1;
      perStalle.set(obs.stalle, rad);
    }

    for (const [stalle, rad] of perStalle) {
      if (rad.anvand || rad.markt || rad.ivrigt) continue;
      doda.push({ fil: fil.fil, stalle, header: rad.header, registreratAv: rad.antal });
    }
  }

  return doda;
}

/**
 * Den tröga rapportens form — Mockitos, med båda ställena namngivna.
 *
 * DEN FÄLLER MILDARE ÄN DEN IVRIGA, och gradienten är avsiktlig. Den ivriga
 * kontrollen avbryter det enskilda testet, för där finns beviset att testet är
 * trasigt NU. Den tröga rapporterar samlat vid körningens slut och pekar ut ett
 * deklarationsställe som ska städas — den vet inte vilket test som är fel,
 * eftersom svaret är "inget av dem, registreringen är död". Mockito gör samma
 * delning: `PotentialStubbingProblem` kastas mitt i testet,
 * `UnnecessaryStubbingException` rapporteras av `UnnecessaryStubbingsReporter`
 * när hela körningen är klar.
 */
export function byggDodaMeddelande(
  doda: readonly DottStalle[],
  testerPerFil: ReadonlyMap<string, number>,
): string {
  const flera = doda.length > 1;
  const rader = [
    '═══ ÖVERSKUGGNINGS-VAKTEN — DÖDA REGISTRERINGAR ═══',
    '',
    flera
      ? `${doda.length} deklarationsställen registrerade en network.use()-överskuggning`
      : 'Ett deklarationsställe registrerade en network.use()-överskuggning',
    'som INGET test i sin fil använde.',
    '',
  ];

  for (const dott of doda) {
    rader.push(
      `  ${dott.stalle}`,
      `    ${dott.header}`,
      `    registrerad av ${dott.registreratAv} av ${testerPerFil.get(dott.fil) ?? '?'} körda tester i filen — använd av 0`,
      '',
    );
  }

  rader.push(
    'Handlern läggs först i listan men matchar aldrig, så anropet faller igenom',
    'till normalläget (tests/support/fixturvarld/handlers.ts). Testet ser då',
    'fixturens vanliga svar i stället för sitt specialfall.',
    '',
    'Aggregeringen är per DEKLARATIONSSTÄLLE och per FIL (Mockitos',
    'getUnusedStubbingsByLocation): en överskuggning som något ANNAT test i samma',
    'fil använder är inte död, bara oanvänd i just detta test. Därför står fyndet',
    'här, vid körningens slut, och inte på ett enskilt test.',
    '',
    'Är registreringen legitimt oanvänd — en negativ sensor som bevisar att ett',
    'anrop ALDRIG sker — märk den explicit i stället:',
    '',
    '    network.use(',
    '      medvetetOanvand(',
    '        http.post(EF(namn), resolver),',
    '        "Skäl: vad frånvaron av anropet bevisar, och varför den mäts så här.",',
    '      ),',
    '    );',
    '',
    'Märkningen är ingen avstängning: matchar handlern ändå fälls testet på att',
    'märkningen blivit inaktuell (samma kontrakt som @ts-expect-error).',
    '',
    'KÖRDES BARA EN DELMÄNGD AV FILEN — `fil.ts:rad`, `--last-failed`, UI-läget?',
    'Då kan fyndet vara falskt: aggregeringen ser bara de tester som kördes. Kör',
    'hela filen innan du ändrar något. (--grep och --shard stänger av vakten helt.)',
    '═══════════════════════════════════════════════════',
  );

  return rader.join('\n');
}
