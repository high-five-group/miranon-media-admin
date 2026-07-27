import type { RequestHandler } from 'msw';

/**
 * Hermetik-vakten för fixturvärlden (task-54.2).
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
 */

/** Fixtur-serverns egna värdar — appen själv, aldrig ett omockat beroende. */
const LOKALA_VARDAR = new Set(['localhost', '127.0.0.1']);

export class OmockadRequestError extends Error {
  constructor(request: Request, mockade: readonly string[]) {
    const lista = mockade.map((header) => `  · ${header}`).join('\n');
    super(
      [
        'Hermetik-vakten stoppade ett omockat anrop i fixturvärlden.',
        '',
        `  ${request.method} ${request.url}`,
        '',
        `Mockat här (${mockade.length}):`,
        lista,
        '',
        'Saknas anropet helt i listan behövs en ny handler. Står ett snarlikt',
        'mönster där är det sannolikt ett stavfel i metod eller path.',
        'Handlers bor i tests/visual/support/handlers.ts.',
      ].join('\n'),
    );
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
