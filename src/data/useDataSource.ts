import { useRouteContext } from '@tanstack/react-router';
import type { DataSourceAdapter } from './adapters/DataSourceAdapter';

/**
 * Läser den injicerade datakällan ur **router-context** (ADR-055) — INTE ur en
 * separat React Context-provider (det avvisade alternativ 2 i ADR-055; namnlikheten
 * är ytlig, mekanismen är router-context-läsning).
 *
 * `strict: false` gör hooken **route-agnostisk** — den kan anropas från vilken
 * komponent/mutation-hook som helst utan att binda mot ett specifikt route-id.
 * Det är avsiktligt: `dataSource` injiceras i root-context (`src/router.ts`) och
 * är därför garanterat närvarande på varje matchad route. Detta är åtkomst-
 * precedensen Fas 6:s mutation-hooks ärver — de behöver aldrig känna till sin
 * egen route för att nå datakällan.
 */
export function useDataSource(): DataSourceAdapter {
  const dataSource = useRouteContext({ strict: false, select: (context) => context.dataSource });
  // Invariant: `dataSource` injiceras i root-context (ADR-055) → alltid närvarande.
  // `strict: false` typar all context-egenskaper som optional, så guarden gör
  // invarianten explicit (defense-in-depth, speglar AuthError-mönstret). Träffas
  // den i produktion är root-context-injektionen bruten (regression).
  if (!dataSource) {
    throw new Error(
      'dataSource saknas i router-context — root-context-injektionen (ADR-055) är bruten',
    );
  }
  return dataSource;
}
