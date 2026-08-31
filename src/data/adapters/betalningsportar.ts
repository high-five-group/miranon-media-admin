import {
  type HanteraInbetalningInput,
  type HanteraInbetalningResult,
  HanteraInbetalningResultSchema,
  type Inbetalningslista,
  InbetalningslistaSchema,
  type Jobbstatus,
  JobbstatusSchema,
  type KoaKvittonInput,
  type KoaKvittonResult,
  KoaKvittonResultSchema,
  type Kvittolank,
  KvittolankSchema,
  type OppnaBetalningar,
  OppnaBetalningarSchema,
  type RegistreraInbetalningInput,
  type RegistreraInbetalningResult,
  RegistreraInbetalningResultSchema,
  type SkickaKvittoIgenInput,
  type SkickaKvittoIgenResult,
  SkickaKvittoIgenResultSchema,
} from '../../domain/schemas';
import { callEdgeFunction, postEdgeFunction } from '../config/supabase-client';

/**
 * [TASK-346.4, ADR-128/ADR-129] Betalningsportarnas ENDA implementation.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR EN DELAD MODUL OCH INTE TVÅ KOPIOR I ADAPTRARNA
 * ═══════════════════════════════════════════════════════════════════════════
 * Betalningsdata har ALDRIG legat i Airtable — den föddes i Postgres
 * (ADR-128 beslut 3). Det gör den till exakt samma klass som
 * aktivitetsloggen (`recordActivity`, ADR-110), och `DataSourceAdapter`s
 * docblock för den metoden säger vad det innebär: BÅDA adaptrarna
 * implementerar den IDENTISKT, eftersom Edge Function-vägen skriver mot
 * Supabase oavsett vilken adapter som är live. Betalningsportarna är därför
 * INTE en del av Fas E-migrationens swap-yta.
 *
 * `recordActivity` löste det med två ordagrant identiska metodkroppar, en i
 * varje adapter. Nio portar gånger två hade gjort samma val till arton
 * kroppar som måste hållas i synk för hand — och den enda mekanism som hade
 * upptäckt en drift är att någon läser båda filerna samtidigt.
 * Implementationen bor därför HÄR, och adaptrarnas metoder är
 * ett-rads-delegeringar. Interface-formen (`ADR-057` klausul c,
 * port-pariteten) är oförändrad: båda adaptrarna deklarerar exakt samma
 * metoder, och `implements DataSourceAdapter` fäller om en saknas.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * `.parse()` VID SYSTEMGRÄNSEN, ALLTID
 * ═══════════════════════════════════════════════════════════════════════════
 * Samma disciplin som resten av adapterlagret. Kolumnerna är `numeric(12,2)`
 * och kommer ur PostgREST som STRÄNGAR; EF-lagret konverterar dem till tal,
 * och `.parse()` här är beviset för att det faktiskt skett. Missar en EF
 * konverteringen faller anropet HÄR, inte tre lager senare i en summering
 * som tyst blir strängkonkatenering.
 */

/** Alla öppna betalningar över alla event (PRD berättelse 1). */
export async function hamtaOppnaBetalningar(): Promise<OppnaBetalningar> {
  const data = await callEdgeFunction<unknown>('hamta-oppna-betalningar');
  return OppnaBetalningarSchema.parse(data);
}

/**
 * Registrera EN inbetalning. Beloppet skickas som RÅ STRÄNG och normaliseras
 * server-side — se `RegistreraInbetalningInput` för varför.
 */
export async function registreraInbetalning(
  input: RegistreraInbetalningInput,
): Promise<RegistreraInbetalningResult> {
  const data = await postEdgeFunction<unknown>('registrera-inbetalning', { ...input });
  return RegistreraInbetalningResultSchema.parse(data);
}

/**
 * Radera och makulera delar EN Edge Function men är TVÅ portar.
 *
 * EF:en är gemensam därför att de två åtgärderna gör samma sak runt omkring
 * själva mutationen: räkna om härledningen och skriva om spegeln. Portarna
 * är åtskilda därför att de är olika HANDLINGAR för Lotta (ett slarvfel som
 * inte kostat något, kontra en rättelse av något som redan gått i väg), och
 * därför att de har olika argument — skälet är obligatoriskt bara för den
 * ena. En gemensam port med ett `atgard`-fält hade flyttat den skillnaden
 * från typsystemet till en runtime-kontroll.
 *
 * Vilken åtgärd som är TILLÅTEN avgörs server-side, där kvittots existens är
 * känd — aldrig av klientens vy, som kan vara någon sekund gammal.
 */
async function anropaHantera(input: HanteraInbetalningInput): Promise<HanteraInbetalningResult> {
  const data = await postEdgeFunction<unknown>('hantera-inbetalning', { ...input });
  return HanteraInbetalningResultSchema.parse(data);
}

export function raderaInbetalning(inbetalningId: string): Promise<HanteraInbetalningResult> {
  return anropaHantera({ atgard: 'radera', inbetalningId });
}

export function makuleraInbetalning(input: {
  inbetalningId: string;
  skal: string;
}): Promise<HanteraInbetalningResult> {
  return anropaHantera({
    atgard: 'makulera',
    inbetalningId: input.inbetalningId,
    skal: input.skal,
  });
}

/**
 * Inbetalningarna för EN anmälan eller EN person, med spegelns färskhet.
 * Exakt ett av `anmalanRecordId`/`personId` ska anges; EF:en avvisar båda
 * och ingendera.
 */
export async function hamtaInbetalningar(params: {
  anmalanRecordId?: string;
  personId?: string;
}): Promise<Inbetalningslista> {
  const query: Record<string, string> = {};
  if (params.anmalanRecordId !== undefined) query.anmalanRecordId = params.anmalanRecordId;
  if (params.personId !== undefined) query.personId = params.personId;
  const data = await callEdgeFunction<unknown>('hamta-inbetalningar', query);
  return InbetalningslistaSchema.parse(data);
}

/** "Skicka N kvitton" — köar jobbet och svarar direkt (ADR-129 beslut 3). */
export async function koaKvitton(input: KoaKvittonInput): Promise<KoaKvittonResult> {
  const data = await postEdgeFunction<unknown>('koa-kvitton', { ...input });
  return KoaKvittonResultSchema.parse(data);
}

/**
 * Jobbets läge. LÄSES VID APPÖPPNING, inte bara vid Realtime-push
 * (ADR-129 beslut 8: "Push är en snabbhet, aldrig en sanning: en webbläsare
 * som var stängd får sitt läge ur läsningen").
 *
 * Utan `jobbId` returneras det SENASTE jobbet — vad Hem-kortet visar.
 */
export async function hamtaJobbstatus(params?: { jobbId?: string }): Promise<Jobbstatus> {
  const query: Record<string, string> = {};
  if (params?.jobbId !== undefined) query.jobbId = params.jobbId;
  const data = await callEdgeFunction<unknown>('hamta-jobbstatus', query);
  return JobbstatusSchema.parse(data);
}

/** Signerad, tidsbegränsad länk till kvittots sparade PDF ("Visa"). */
export async function hamtaKvittolank(kvittoId: string): Promise<Kvittolank> {
  const data = await callEdgeFunction<unknown>('hamta-kvittolank', { kvittoId });
  return KvittolankSchema.parse(data);
}

/** "Skicka igen" — samma PDF, samma nummer, valfri annan adress. */
export async function skickaKvittoIgen(
  input: SkickaKvittoIgenInput,
): Promise<SkickaKvittoIgenResult> {
  const data = await postEdgeFunction<unknown>('skicka-kvitto-igen', { ...input });
  return SkickaKvittoIgenResultSchema.parse(data);
}
