import { type AnyHandler, RequestHandler } from 'msw';
import { efKandidater, efNamn, narmasteHandler } from './ef-namnforslag';

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
 * Task-58 dokumenterade fällan; detta är samma kunskap som GRIND. En lärdom
 * utan grind tillämpas inkonsekvent.
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
 * `listHandlers(): ReadonlyArray<AnyHandler>` bor på `SetupApi`
 * (`lib/core/experimental/setup-api.d.ts` rad 30), som `NetworkFixture` ärver
 * via `Omit<SetupApi<LifeCycleEventsMap>, 'dispose'>` (`@msw/playwright` 0.6.7,
 * `build/index.d.mts` rad 18). Den är alltså tillgänglig på fixturen — inte bara
 * på `setupWorker`, där kortets källhänvisning pekade.
 *
 * DEN KÄNDA LUCKAN, ÖPPET BOKFÖRD: en resolver som returnerar en ITERATOR
 * (generator-resolver) sätter tillfälligt tillbaka `isUsed = false` mitt i
 * iterationen och `true` först när den är färdig (`RequestHandler.js` rad
 * 231/238). En generator-överskuggning som står mitt i sin sekvens när testet
 * slutar skulle därför kunna se oanvänd ut. Fixturvärlden har noll
 * generator-resolvers i dag (verifierat med sökning över `tests/`), och den dag
 * en införs är märkningen nedan rätt ventil. Att flaggan är MSW:s egen och inte
 * vår bokföring är värt den lucka den kostar.
 *
 * ── VAD VAKTEN INTE GÖR ──────────────────────────────────────────────────
 *
 * Den granskar ENDAST testets egna överskuggningar, aldrig normalläget.
 * `handlers.ts` exporterar en modul-nivå array vars handler-OBJEKT delas av alla
 * tester i samma worker-process; `isUsed` ackumuleras därför tvärs tester på
 * dem. En normallägeshandler som ingen vy råkar behöva är dessutom helt legitim.
 * Urvalet görs i `hermetic.ts` på objekt-identitet mot normalläget.
 */

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

/**
 * En överskuggning registrerades men matchade aldrig något anrop. Testet såg
 * normalläget i stället för sitt specialfall.
 */
export class OanvandOverskuggningError extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = 'OanvandOverskuggningError';
  }
}

/**
 * En överskuggning är märkt `medvetetOanvand` men matchade ändå ett anrop —
 * märkningen är inaktuell.
 *
 * EGEN KLASS, till skillnad från hermetik-vakten som bär två meddelanden i EN
 * klass. Där är de två meddelandena två råd om samma händelse (ett omockat
 * anrop). Här är händelserna varandras motsatser, och felets NAMN är det första
 * utvecklaren läser i terminalen — att kalla en handler som matchade för
 * "oanvänd" hade lett felsökningen fel på första raden.
 */
export class InaktuellMarkeringError extends Error {
  constructor(meddelande: string) {
    super(meddelande);
    this.name = 'InaktuellMarkeringError';
  }
}

function byggOanvandMeddelande(
  oanvanda: readonly RequestHandler[],
  alla: readonly RequestHandler[],
  normallage: readonly string[],
): string {
  const flera = oanvanda.length > 1;
  const rader = [
    flera
      ? `Överskuggnings-vakten stoppade ${oanvanda.length} överskuggningar som aldrig matchade något anrop.`
      : 'Överskuggnings-vakten stoppade en överskuggning som aldrig matchade något anrop.',
    '',
    ...oanvanda.map((handler) => `  ${header(handler)}`),
    '',
    flera
      ? 'De registrerades med network.use() men inget anrop nådde dem. Testet såg'
      : 'Den registrerades med network.use() men inget anrop nådde den. Testet såg',
    'därför NORMALLÄGET (tests/support/fixturvarld/handlers.ts) i stället för sitt',
    'specialfall — och en assertion som ändå passerar bevisar inget om det fall',
    'testet påstår sig pröva.',
    '',
  ];

  // "Menade du" bara när det finns EN oanvänd — med flera blir förslagen en
  // gissningsvägg av samma slag som task-57 tog bort ur hermetik-vaktens lista.
  if (!flera) {
    const soktNamn = efNamn(monster(header(oanvanda[0])));
    const narmaste =
      soktNamn === undefined ? undefined : narmasteHandler(soktNamn, efKandidater(normallage));
    if (narmaste !== undefined && narmaste !== header(oanvanda[0])) {
      rader.push(`Menade du:  ${narmaste}`, '');
    }
  }

  if (alla.length > 1) {
    const oanvandaSet = new Set(oanvanda);
    rader.push(
      `Testets överskuggningar (${alla.length}):`,
      ...alla.map((handler) => `  ${oanvandaSet.has(handler) ? '✗' : '✓'} ${header(handler)}`),
      '',
    );
  }

  rader.push(
    'Vanligaste orsakerna:',
    '  · stavfel i EF-namnet — bygg mönstret med EF(namn) ur handlers.ts, aldrig',
    '    som egen sträng, så kan det per konstruktion inte drifta',
    '  · glömd värd-joker — mönstret är host-agnostiskt och börjar med *',
    '  · testet nådde aldrig den gren som gör anropet',
    '',
    'Är den oanvända överskuggningen AVSIKTLIG — registrerad för en gren just',
    'detta test inte når — märk den explicit i stället:',
    '',
    '    network.use(',
    '      medvetetOanvand(',
    '        http.get(EF(namn), resolver),',
    '        "Skäl: vilken gren handlern täcker och varför testet inte når den.",',
    '      ),',
    '    );',
    '',
    'Märkningen är ingen avstängning: matchar handlern ändå fälls testet på att',
    'märkningen blivit inaktuell (samma kontrakt som @ts-expect-error).',
  );

  return rader.join('\n');
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
 * Bygger vaktens beslutsfunktion. Formen speglar `skapaHermetikVakt(handlers)`
 * med avsikt: samma fixturvärld, samma normalläge som källa till "menade du",
 * samma tvådelning mellan beslut (här) och verkan (`hermetic.ts`).
 *
 * `normallage` används ENBART för stavfelsförslaget. Bedömningen av vad som är
 * använt vilar helt på handlarnas egen `isUsed`.
 */
export function skapaOverskuggningsVakt(normallage: readonly RequestHandler[]) {
  const mockade = normallage.map((handler) => handler.info.header);

  return (overskuggningar: readonly AnyHandler[]): void => {
    // WebSocket-handlers saknar `isUsed` helt (msw 2.15.0) — de kan varken
    // bedömas eller felaktigt fällas, och filtreras därför bort i stället för
    // att tyst räknas som använda.
    const requestHandlers = overskuggningar.filter(
      (handler): handler is RequestHandler => handler instanceof RequestHandler,
    );
    if (requestHandlers.length === 0) return;

    const oanvanda = requestHandlers.filter(
      (handler) => !handler.isUsed && markningsSkal(handler) === undefined,
    );

    // OANVÄND FÖRST, INAKTUELL MÄRKNING SEDAN. Den första klassen betyder att
    // testet tyst kördes mot fel data; den andra att en anteckning är gammal.
    // Finns båda ska den som förstörde beviset stå överst.
    if (oanvanda.length > 0) {
      throw new OanvandOverskuggningError(
        byggOanvandMeddelande(oanvanda, requestHandlers, mockade),
      );
    }

    const inaktuella = requestHandlers.filter(
      (handler) => handler.isUsed && markningsSkal(handler) !== undefined,
    );
    if (inaktuella.length > 0) {
      throw new InaktuellMarkeringError(byggInaktuellMeddelande(inaktuella));
    }
  };
}
