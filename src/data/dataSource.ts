import { AirtableAdapter } from './adapters/AirtableAdapter';
import type { DataSourceAdapter } from './adapters/DataSourceAdapter';

/**
 * Live datakälla-instans — det namngivna hemmet för "vilken adapter är live"
 * (ADR-055). Injiceras i router-context (`src/router.ts`) bredvid `queryClient`
 * och `auth`; komponenter/hooks läser den därifrån, aldrig via direkt-import av
 * denna modul (DI-idiom-konsekvens, se ADR-055).
 *
 * `AirtableAdapter` är den enda körbara adaptern idag — den talar Airtable via
 * Supabase-Edge-Functions (`get-registrations`, `update-record`, …).
 * `SupabaseAdapter` kastar `NOT_IMPLEMENTED` i varje metod och tar över först i
 * Fas E; bytet är då denna enda rad. Typad mot `DataSourceAdapter` så bytet är
 * mekaniskt.
 */
export const dataSource: DataSourceAdapter = new AirtableAdapter();
