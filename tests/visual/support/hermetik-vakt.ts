import type { RequestHandler } from 'msw';

/**
 * Hermetik-vakten för fixturvärlden (task-54.2, meddelandet skärpt i task-57).
 *
 * Vakten är villkoret för att fixturvärlden bevisar något: ett anrop som ingen
 * handler täcker ska fälla testet HÖGT, aldrig gå ut på riktiga nätet. Går det
 * ut blir pixlarna miljöberoende och den visuella grinden mäter nätet i stället
 * för appen — tyst, och just därför farligt.
 *
 * FORMEN ÄR LÅNAD FRÅN GHOST: felet pekas på TESTET med den saknade requesten
 * namngiven och en lista över vad som faktiskt var mockat. Ett anonymt fel ur
 * avlyssningslagret tvingar utvecklaren att gissa; listan skiljer "jag stavade
 * fel" från "jag glömde helt". Deras uppställning är en annan — annan
 * testrunner — men felformen är bättre oavsett vilken mekanism som bär den.
 *
 * VARFÖR CALLBACK OCH INTE EN INBYGGD STRÄNGNIVÅ: MSW:s `'error'`/`'warn'`
 * körs bara för anrop som INTE är tillgångar (`onUnhandledRequest.mjs`
 * rad 49–51 tillämpar strategin bakom `!isCommonAssetRequest(request)`).
 * En callback körs ovillkorligt (rad 42–48) och tar hela beslutet själv.
 * Strängnivåerna vore alltså en vakt med ett hål exakt i den form som är
 * lättast att missa.
 *
 * TVÅ FELKLASSER, TVÅ MEDDELANDEN (task-57). Att lista EF-mockarna och peka på
 * `handlers.ts` är rätt svar bara när anropet FÖRSÖKTE nå en Edge Function.
 * För en adress utanför fixturvärlden är det aktivt fel vägledning: rätt fråga
 * är inte vilken handler som saknas utan varför appen ringer dit i ett test.
 * Vakten fäller likadant i båda fallen — det är rådet som skiljer sig.
 */

/** Fixtur-serverns egna värdar — appen själv, aldrig ett omockat beroende. */
const LOKALA_VARDAR = new Set(['localhost', '127.0.0.1']);

/** Pathen alla Edge Functions bor under. Klassgränsen i vaktens meddelande. */
const EF_PREFIX = '/functions/v1/';

/**
 * NÄRHETS-TRÖSKELN ÄR LÅNAD, INTE PÅHITTAD.
 *
 * TypeScripts `getSpellingSuggestion` utesluter kandidater vars
 * Levenshtein-avstånd överstiger **0,4 gånger** det sökta namnets längd, och
 * hoppar över avståndsberäkning helt för namn kortare än **3 tecken** (där
 * bara skiftlägesokänslig likhet prövas). Kvoten 0,4 tillåter ungefär en
 * ersättning per fem tecken och en insättning/borttagning vid tre.
 *
 * Samma konstanter används här, av samma skäl: en tröskel som är för generös
 * föreslår fel handler med självförtroende, vilket är värre än att inte
 * föreslå något alls.
 *
 * Källa: microsoft/TypeScript, `getSpellingSuggestion` i `checker.ts`
 * (införd i PR #15507).
 */
const NARHETS_KVOT = 0.4;
const MINSTA_NAMNLANGD = 3;

/**
 * Levenshtein-avstånd i tvåradsform — O(a·b) tid, O(b) minne.
 *
 * Egen implementation i stället för ett beroende: vakten är testkod som ska
 * kunna läsas i sin helhet av den som felsöker den, och funktionen är kortare
 * än den installations-rad som annars hade behövts.
 */
function levenshteinAvstand(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let forra = Array.from({ length: b.length + 1 }, (_, i) => i);
  let denna = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    denna[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const kostnad = a[i - 1] === b[j - 1] ? 0 : 1;
      denna[j] = Math.min(
        denna[j - 1] + 1, // insättning
        forra[j] + 1, // borttagning
        forra[j - 1] + kostnad, // ersättning
      );
    }
    [forra, denna] = [denna, forra];
  }

  // Efter sista växlingen ligger den färdiga raden i `forra`.
  return forra[b.length];
}

/**
 * Plockar Edge Function-namnet ur en path. `undefined` betyder att anropet inte
 * ens försökte nå en EF — alltså den andra felklassen.
 */
function efNamn(path: string): string | undefined {
  const index = path.indexOf(EF_PREFIX);
  if (index === -1) return undefined;
  const namn = path.slice(index + EF_PREFIX.length).split('/')[0];
  return namn === '' ? undefined : namn;
}

/**
 * Närmaste registrerade handler för ett EF-namn, eller `undefined` när ingen är
 * rimligt nära. Skiftlägesskillnad vinner alltid — den är säkraste träffen.
 *
 * MÄTNINGEN GÖRS PÅ EF-NAMNET, INTE PÅ HELA MÖNSTRET. Alla handlers delar
 * prefixet `*` + `/functions/v1/`, så ett avstånd över hela strängen hade
 * dränkts av det gemensamma och fått varje kandidat att se nära ut.
 */
function narmasteHandler(
  soktNamn: string,
  kandidater: ReadonlyMap<string, string>,
): string | undefined {
  for (const [namn, header] of kandidater) {
    if (namn.toLowerCase() === soktNamn.toLowerCase()) return header;
  }

  if (soktNamn.length < MINSTA_NAMNLANGD) return undefined;

  const tak = Math.floor(soktNamn.length * NARHETS_KVOT);
  let bastaHeader: string | undefined;
  let bastaAvstand = Number.POSITIVE_INFINITY;

  for (const [namn, header] of kandidater) {
    const avstand = levenshteinAvstand(soktNamn, namn);
    if (avstand <= tak && avstand < bastaAvstand) {
      bastaHeader = header;
      bastaAvstand = avstand;
    }
  }

  return bastaHeader;
}

/** EF-namn → handlerns fulla header, byggd ur samma källa som matchningen. */
function efKandidater(mockade: readonly string[]): ReadonlyMap<string, string> {
  const karta = new Map<string, string>();
  for (const header of mockade) {
    const monster = header.slice(header.indexOf(' ') + 1);
    const namn = efNamn(monster);
    if (namn !== undefined && !karta.has(namn)) karta.set(namn, header);
  }
  return karta;
}

function byggMeddelande(request: Request, mockade: readonly string[]): string {
  const rader = [
    'Hermetik-vakten stoppade ett omockat anrop i fixturvärlden.',
    '',
    `  ${request.method} ${request.url}`,
    '',
  ];

  const soktNamn = efNamn(new URL(request.url).pathname);

  if (soktNamn === undefined) {
    rader.push(
      'Detta är INTE en Edge Function, utan ett anrop till en adress utanför',
      'fixturvärlden.',
      '',
      'Rätt fråga är därför inte vilken handler som saknas, utan varför appen',
      'ringer dit i ett test. En handler för en främmande tjänst är nästan',
      'aldrig rätt åtgärd — den gör beroendet permanent i stället för synligt.',
      '',
      'Undersök anropets ursprung i appkoden. Ska det inte ske under test: ta',
      'bort eller villkora det. Ska det ske: det kräver ett medvetet beslut,',
      'inte en handler.',
    );
    return rader.join('\n');
  }

  const narmaste = narmasteHandler(soktNamn, efKandidater(mockade));
  if (narmaste !== undefined) {
    rader.push(`Menade du:  ${narmaste}`, '');
  }

  rader.push(
    `Ingen handler matchar denna Edge Function. Mockat här (${mockade.length}):`,
    ...mockade.map((header) => `  · ${header}`),
    '',
    'Ska svaret gälla ALLA tester: lägg till en handler i',
    'tests/visual/support/handlers.ts. Ska det gälla bara detta test:',
    'överskugga lokalt med network.use() — se hermetic.ts § Överskugga en',
    'delad handler.',
  );

  return rader.join('\n');
}

export class OmockadRequestError extends Error {
  constructor(request: Request, mockade: readonly string[]) {
    super(byggMeddelande(request, mockade));
    this.name = 'OmockadRequestError';
  }
}

/**
 * Bygger vaktens beslutsfunktion — formen `onUnhandledRequest` förväntar sig.
 *
 * Listan över mockade mönster hämtas ur handlarnas egen `info.header` — metod
 * plus handlerns path-mönster, alltså ur samma källa som matchningen använder.
 * En handskriven lista hade kunnat drifta från verkligheten; denna kan det
 * inte.
 */
export function skapaHermetikVakt(handlers: readonly RequestHandler[]) {
  const mockade = handlers.map((handler) => handler.info.header);

  return (request: Request): void => {
    if (LOKALA_VARDAR.has(new URL(request.url).hostname)) return;
    throw new OmockadRequestError(request, mockade);
  };
}
