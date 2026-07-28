import type { RequestHandler } from 'msw';
import { efKandidater, efNamn, narmasteHandler } from './ef-namnforslag';

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
 *
 * SPEGELBILDEN BOR BREDVID (task-62). Denna vakt ser `request utan handler`.
 * Den motsatta felklassen — `handler utan request`, alltså en `network.use()`
 * vars mönster aldrig matchar — är osynlig härifrån: anropet ÄR mockat, bara
 * inte av den handler testet trodde. Den vaktas av `overskuggnings-vakt.ts`.
 * Stavfelsmaskineriet som föreslår "menade du" delas av båda och bor sedan
 * task-62 i `ef-namnforslag.ts`.
 */

/** Fixtur-serverns egna värdar — appen själv, aldrig ett omockat beroende. */
const LOKALA_VARDAR = new Set(['localhost', '127.0.0.1']);

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
    'tests/support/fixturvarld/handlers.ts. Ska det gälla bara detta test:',
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
