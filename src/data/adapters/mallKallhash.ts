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
 * `berakaKallhash`s kanoniska utdataform: SHA-256 som 64 hex-tecken i
 * GEMENER (`bytesToHex` använder `toString(16)`, som aldrig ger versaler).
 *
 * SPEGEL AV `_shared/promoveringsbeslut.ts` § `KALLHASH_FORM`, MEDVETET
 * DUPLICERAD OCH INTE IMPORTERAD. Resten av denna fil importerar visserligen
 * rakt ur `supabase/functions/_shared/` (mirror-kontraktet i filhuvudet
 * ovan) — men `promoveringsbeslut.ts` föds i `TASK-340.1`, som ännu inte är
 * landad (PR `#2083`). En import därifrån hade gjort DENNA gren
 * obyggbar. Formen är dessutom inte en delad ALGORITM utan SHA-256:s egen
 * hex-form: två rader som beskriver samma naturkonstant kan inte glida isär
 * på det sätt två hash-BERÄKNINGAR kan.
 */
const KALLHASH_FORM = /^[0-9a-f]{64}$/;

/**
 * Sant EXAKT när `varde` är en sträng på `berakaKallhash`s utdataform.
 *
 * VARFÖR GATEN BEHÖVS PÅ KLIENTSIDAN (TASK-340.2): EF:en behandlar en
 * ANGIVEN men icke-kanonisk `kallhash` som ett KLIENTFEL och svarar 400 —
 * samma "ett angivet men okänt värde är ett klientfel, aldrig en tyst
 * fallback"-disciplin `mall`/`ersatt` redan bär. Att skicka en trasig hash
 * skulle alltså fälla HELA Skapa, inte bara promoveringen. Klienten
 * utelämnar därför hellre fältet: utan hash renderas dokumentet om, vilket
 * är ett sämre men fullgott utfall (PRD `TASK-340` § A (d)).
 */
export function arKanoniskKallhash(varde: unknown): varde is string {
  return typeof varde === 'string' && KALLHASH_FORM.test(varde);
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
