// Klient-sidig hash-paritet mot bilagornas Källhash (TASK-309.6, ADR-125 § 3
// + § 5). Servern (`generate-event-attachment/index.ts`) skriver `Källhash`
// som SHA-256 av det EXAKTA, mall-resolvda ifyllnadsunderlaget
// (`_shared/mall-data.ts`s `byggBekraftelseData`/`byggDeltagarinfoData`,
// hashat med `_shared/mall-hash.ts`s `berakaKallhash`). ADR-125 § 3 kräver
// att adaptern kan räkna om SAMMA hash för att härleda inaktualitet vid
// listning — en hash räknad med två olika algoritmer på server och klient
// vore meningslös. Importerar därför de TVÅ delade modulerna direkt (samma
// "mirror-kontrakt", dual Node+Deno-importable, som `_shared/receipt-
// content.ts` redan etablerat, se dess filhuvud) i stället för att
// duplicera logiken klient-side.
//
// Web Crypto (`crypto.subtle`) är GLOBAL i webbläsaren, exakt samma API som
// Deno använder (`_shared/mall-hash.ts`s eget filhuvud) — inget polyfill,
// inget adapter-lager mellan.
//
// `DocumentSources` (klientens domänmodell, `../../domain/models/
// DocumentSources.ts`) och `DocumentSourcesResult` (server-delad typ,
// `_shared/mall-data.ts`) är FÄLT-FÖR-FÄLT IDENTISKA — båda härledda ur
// samma ADR-125 § 2-fältlista (`event`/`eventinnehall`/`plats`/`agenda`/
// `kopior`, samma 17 kopia-nycklar). En `as unknown as`-cast bygger bron
// mellan de två nominellt skilda typerna utan att skriva om någotdera —
// TypeScript har ingen "strukturellt identisk, annat namn"-notation.

import type { DocumentSourcesResult } from '../../../supabase/functions/_shared/mall-data';
import {
  byggBekraftelseData,
  byggDeltagarinfoData,
} from '../../../supabase/functions/_shared/mall-data';
import { berakaKallhash } from '../../../supabase/functions/_shared/mall-hash';
import type { DocumentSources } from '../../domain/models/DocumentSources';
import type { MallId } from './DataSourceAdapter';

export type { MallId };

/** Airtables `Mall`-optionsnamn → `MallId`. `null`/okänt värde (t.ex. en
 *  framtida 'Kvitto'-rad om den någonsin dyker upp i denna kolumn) → `null`
 *  — samma "gissa aldrig"-disciplin som `mapAttachmentRecord`. */
const AIRTABLE_MALL_TILL_ID: Readonly<Record<string, MallId>> = {
  Bekräftelsebilaga: 'bekraftelse',
  Deltagarinformation: 'deltagarinfo',
};

export function mallIdFranAirtableOption(mall: string | null): MallId | null {
  if (mall === null) return null;
  return AIRTABLE_MALL_TILL_ID[mall] ?? null;
}

/**
 * Dagens hash för `mall` givet ett events aktuella `DocumentSources` — SAMMA
 * beräkning `generate-event-attachment/index.ts` gör server-side
 * (`byggXData` → `berakaKallhash`). Jämför mot en bilagerads lagrade
 * `kallhash` för att härleda inaktualitet (ADR-125 § 3).
 */
export async function berakaAktuellKallhash(
  mallId: MallId,
  sources: DocumentSources,
): Promise<string> {
  const resolved = sources as unknown as DocumentSourcesResult;
  const data =
    mallId === 'bekraftelse' ? byggBekraftelseData(resolved) : byggDeltagarinfoData(resolved);
  return berakaKallhash(data);
}
