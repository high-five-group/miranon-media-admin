// @ts-nocheck — Deno Edge Function-modul (esm.sh-import + Deno-globaler;
// typas vid deploy, se ADR-010 § Fas 7-åtagande).
//
// POSTGRES-SIDAN av betalningsdomänen — TASK-346.4, ADR-128/ADR-129.
//
// ═══════════════════════════════════════════════════════════════════════════
// `numeric` KOMMER TILLBAKA SOM STRÄNG — KONVERTERINGEN SKER HÄR, EN GÅNG
// ═══════════════════════════════════════════════════════════════════════════
// Migrationens filhuvud säger det rakt ut: "PostgREST/supabase-js levererar
// `numeric` som STRÄNG, inte som JS-number. Läs den som sträng och räkna
// aldrig med `parseFloat` på pengar i klienten."
//
// Varje `radTill*`-funktion nedan är den enda platsen konverteringen sker, och
// klientens zod-scheman (`src/domain/schemas/Betalningar.schema.ts`) kräver
// `z.number()`. Missas konverteringen någonstans faller `.parse()` i
// adapterlagret — högljutt, vid systemgränsen, i stället för tyst som en
// strängkonkatenering tre lager senare (`"1000" + "1500"` = `"10001500"`).
//
// ═══════════════════════════════════════════════════════════════════════════
// `service_role` — OCH VAD DEN INTE FÅR
// ═══════════════════════════════════════════════════════════════════════════
// Klienten når aldrig nyckeln (ADR-128 beslut 3, ADR-110-prejudikatet).
// Grantarna är dessutom SMALARE än rollen: `kvitton` har SELECT + INSERT plus
// en KOLUMN-SCOPAD UPDATE på (lagringsnyckel, skickad_nar, mottagare, status)
// och ALDRIG DELETE — numret, året, löpnumret, kopplingen och typen kan inte
// ändras efter utfärdandet. `activity_log` har SELECT + INSERT.
// Ett försök utanför det fälls av Postgres oavsett vad koden här gör; koden
// här försöker aldrig.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { lasNumeric } from './betalningsbelopp.ts';
import { statementTillRad, type Statement } from './aktivitetslogg.ts';

export const INBETALNINGAR_TABELL = 'inbetalningar';
export const KVITTON_TABELL = 'kvitton';
export const JOBB_TABELL = 'jobb';
export const JOBB_RAD_TABELL = 'jobb_rad';
export const AKTIVITETSLOGG_TABELL = 'activity_log';

/**
 * `service_role`-klienten. En per EF-invokation, aldrig en modul-global:
 * samma mönster som `makeRealDraftCleaner` (`send-receipt-email/index.ts`)
 * och `log-activity`.
 */
export function skapaAdminKlient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Kolumnerna varje läsning av `inbetalningar` behöver. Explicit, aldrig `*`. */
/*
 * ⚠️ DENNA LISTA BINDER DEPLOY-ORDNINGEN. Nio Edge Functions importerar
 * konstanten, och PostgREST fäller HELA `select`-anropet om EN kolumn i den
 * saknas i databasen. En kolumn får därför ALDRIG läggas till här förrän dess
 * migration är applicerad i miljön: migration FÖRST, EF-deploy SEDAN. Åt andra
 * hållet finns ingen risk — en applicerad kolumn som ingen EF ännu läser är
 * bara en oanvänd kolumn.
 */
export const INBETALNING_KOLUMNER =
  'id, anmalan_record_id, ogonblicksbild_namn, ogonblicksbild_event, ' +
  'ogonblicksbild_eventdatum, belopp, betalsatt, betalningsdatum, typ, status, ' +
  'makulerad_skal, makulerad_nar, bankreferens, kvitto_id, notering, ' +
  'skapad_av, skapad_nar';

/*
 * Noteringens normalisering och tak bor i `inbetalning-notering.ts` — en modul
 * UTAN fjärr-import, så att den kan bevisas hermetiskt i `tests/api/`. Se den
 * filens huvud för varför den inte ligger här.
 */

export const KVITTO_KOLUMNER =
  'id, kvittonummer, ar, lopnummer, inbetalning_id, lagringsnyckel, skickad_nar, ' +
  'mottagare, typ, original_kvitto_id, status, skapad_nar';

export const JOBB_RAD_KOLUMNER =
  'id, jobb_id, jobbtyp, objekt_id, status, skal, forsok, skapad_nar, ' +
  'paborjad_nar, avslutad_nar, uppdaterad_nar';

/** Rad → klientens `Inbetalning`-form. `belopp` blir ett TAL här, se filhuvudet. */
export function radTillInbetalning(rad: Record<string, unknown>) {
  return {
    id: rad.id as string,
    anmalanRecordId: rad.anmalan_record_id as string,
    ogonblicksbildNamn: rad.ogonblicksbild_namn as string,
    ogonblicksbildEvent: rad.ogonblicksbild_event as string,
    ogonblicksbildEventdatum: (rad.ogonblicksbild_eventdatum as string | null) ?? null,
    belopp: lasNumeric(rad.belopp) ?? 0,
    betalsatt: rad.betalsatt as string,
    betalningsdatum: (rad.betalningsdatum as string | null) ?? null,
    typ: rad.typ as string,
    status: rad.status as string,
    makuleradSkal: (rad.makulerad_skal as string | null) ?? null,
    makuleradNar: (rad.makulerad_nar as string | null) ?? null,
    bankreferens: (rad.bankreferens as string | null) ?? null,
    kvittoId: (rad.kvitto_id as string | null) ?? null,
    notering: (rad.notering as string | null) ?? null,
    skapadAv: rad.skapad_av as string,
    skapadNar: rad.skapad_nar as string,
  };
}

export function radTillKvitto(rad: Record<string, unknown>) {
  return {
    id: rad.id as string,
    kvittonummer: rad.kvittonummer as string,
    ar: Number(rad.ar),
    lopnummer: Number(rad.lopnummer),
    inbetalningId: rad.inbetalning_id as string,
    lagringsnyckel: (rad.lagringsnyckel as string | null) ?? null,
    skickadNar: (rad.skickad_nar as string | null) ?? null,
    mottagare: (rad.mottagare as string | null) ?? null,
    typ: rad.typ as string,
    originalKvittoId: (rad.original_kvitto_id as string | null) ?? null,
    status: rad.status as string,
    skapadNar: rad.skapad_nar as string,
  };
}

export function radTillJobbRad(rad: Record<string, unknown>, kvittonummer: string | null = null) {
  return {
    id: rad.id as string,
    jobbId: rad.jobb_id as string,
    jobbtyp: rad.jobbtyp as string,
    objektId: rad.objekt_id as string,
    status: rad.status as string,
    skal: (rad.skal as string | null) ?? null,
    forsok: Number(rad.forsok ?? 0),
    skapadNar: rad.skapad_nar as string,
    paborjadNar: (rad.paborjad_nar as string | null) ?? null,
    avslutadNar: (rad.avslutad_nar as string | null) ?? null,
    uppdateradNar: rad.uppdaterad_nar as string,
    kvittonummer,
  };
}

/**
 * Alla inbetalningar för EN anmälan, nyast först. Läses vid VARJE härledning
 * — summan är en funktion av hela mängden, inte av den post som just skrevs
 * (ADR-128 beslut 2: "oavsett i vilken ordning och i hur många poster
 * pengarna kom").
 */
export async function lasInbetalningarForAnmalan(db: unknown, anmalanRecordId: string) {
  const { data, error } = await (db as ReturnType<typeof skapaAdminKlient>)
    .from(INBETALNINGAR_TABELL)
    .select(INBETALNING_KOLUMNER)
    .eq('anmalan_record_id', anmalanRecordId)
    .order('betalningsdatum', { ascending: false, nullsFirst: false })
    .order('skapad_nar', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(radTillInbetalning);
}

/**
 * Skriver EN aktivitetslogg-post via `service_role`.
 *
 * BEST-EFFORT, ALDRIG BLOCKERANDE — samma disciplin som klientens
 * `recordActivity` (`src/data/activityLog/recordActivity.ts`), som fångar
 * och sväljer sina egna fel. Loggen är en historik, inte en förutsättning:
 * en registrerad inbetalning ska aldrig se ut som misslyckad för att
 * historiken inte kunde skrivas.
 */
export async function skrivAktivitet(db: unknown, statement: Statement): Promise<void> {
  try {
    const { error } = await (db as ReturnType<typeof skapaAdminKlient>)
      .from(AKTIVITETSLOGG_TABELL)
      .insert(statementTillRad(statement));
    if (error) throw error;
  } catch (fel) {
    const text = fel instanceof Error ? fel.message : String(fel);
    console.error(`[aktivitetslogg] kunde inte skrivas (fäller inte handlingen) | fel=${text}`);
  }
}

/**
 * Postgres unik-nyckel-brott. `23505` är SQLSTATE för `unique_violation` —
 * koden, inte meddelandetexten, eftersom texten är lokaliserbar och
 * versionsberoende.
 */
export function arUnikNyckelBrott(fel: unknown): boolean {
  return typeof fel === 'object' && fel !== null && (fel as { code?: string }).code === '23505';
}

/** `23503` = `foreign_key_violation`, t.ex. `on delete restrict` från `kvitton`. */
export function arFramandeNyckelBrott(fel: unknown): boolean {
  return typeof fel === 'object' && fel !== null && (fel as { code?: string }).code === '23503';
}
