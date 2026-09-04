// @ts-nocheck — Deno Edge Function-modul (importerar `airtable-client.ts`,
// som rör Deno-globaler; typas vid deploy, se ADR-010 § Fas 7-åtagande).
// Samma undantags-mönster som `_shared/betalningar-bas.ts`.
//
// SKAPA-ANMÄLAN-KÄRNAN — utbruten ur `create-registration/index.ts` i
// TASK-368.4, oförändrad i sak.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR DEN BRÖTS UT, OCH VAD SOM MEDVETET INTE FÖLJDE MED
// ═══════════════════════════════════════════════════════════════════════════
// Ombokningen (`rebook-registration`) ska skapa den nya anmälan "via befintlig
// skapa-anmälan" (kortets AC #2). Alternativet — att låta en Edge Function
// HTTP-anropa en annan — är inget mönster huset har, och hade lagt ett extra
// auth-/nätverksled i en operation som redan rör två databaser. Kärnan bor
// därför här och delas av BÅDA EF:erna.
//
// FÖLJDE MED (identisk kod, samma ordning): eventuppslaget som ger `EventKey`,
// affärs-unikhetens fråga (Normaliserad e-post × EventKey), fält-bygget
// server-side, allowlist-grinden och själva skrivningen.
//
// FÖLJDE INTE MED, med avsikt: `create-registration`s YTTRE kontrakt —
// metod-vakten, `requireUser`, `Idempotency-Key`-kravet (ADR-059),
// input-valideringen och HTTP-statuskoderna. De är den EF:ens gränssnitt mot
// klienten och ska inte kunna ändras av en delad modul. `mapCreatedRegistration`
// stannade också kvar: den formar `create-registration`s SVAR, och ombokningen
// har ett annat svar.
//
// ═══════════════════════════════════════════════════════════════════════════
// TRE STEG SOM KAN ANROPAS VAR FÖR SIG — OCH VARFÖR
// ═══════════════════════════════════════════════════════════════════════════
// `create-registration` behöver hela kedjan i ett svep och anropar `skapaAnmalan`.
// Ombokningen behöver DELA den: den måste veta OM en anmälan redan finns på
// mål-eventet INNAN den beslutar vad som ska hända (`beslutaOmbokning`s
// `malAnmalanFinns`, `_shared/rebook-registration.ts`), och först därefter
// eventuellt skapa. Utan uppdelningen hade ombokningen fått göra
// eventuppslaget och dubblett-frågan TVÅ gånger — två extra anrop mot basens
// delade 5/sekund-tak (ADR-063 § S91-not) i en operation som redan gör ett
// tiotal.
//
// BLAST-RADIE, SAGT RAKT UT: `create-registration` är prod-deployad och används
// dagligen. Utbrytningen är en ren FLYTT — samma anrop, samma ordning, samma
// loggrader, samma statuskoder — och EF:en måste deployas om (staging gjort i
// denna skiva, prod är som alltid en separat Marcus-auktoriserad handling).

import { createAirtableRecord, fetchAirtableRecord, fetchFromAirtable } from './airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from './airtable-filter.ts';
import { scalarString } from './coerce.ts';
import { findDisallowedField, getOperation } from './field-allowlists.ts';

export const CREATE_REGISTRATION_OPERATION = 'create-registration';
const EVENTPLANERING_TABLE = 'Eventplanering';

// Sätts vid manuell admin-create (data-model.md § Källa-/Status-värden).
// Manuell = admin lägger till manuellt; Obekräftad = create-default.
export const SOURCE_MANUAL = 'Manuell';
export const STATUS_CREATE_DEFAULT = 'Obekräftad';

// Pragmatisk e-post-format-grind (samma anda som klient-validering). Avsiktligt
// enkel: en exakt RFC-5322-parser är fel verktyg här — 409-/normaliserings-
// korrektheten vilar på Airtables `LOWER(TRIM())`, inte på adress-strukturen.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SkapaAnmalanInput = {
  fornamn: string;
  efternamn: string;
  email: string;
  telefon?: string | null;
  antalPlatser?: number | null;
  notering?: string | null;
  eventId: string;
};

export type EventNyckel = {
  eventKey: string;
  /** `Event (text)` på eventraden — `mapCreatedRegistration`s sista fallback. */
  eventNamnFallback: string | null;
};

/** Den befintliga anmälan affärs-unikheten hittade. */
export type BefintligAnmalan = { id: string; namn: string | null };

export type SkapaAnmalanUtfall =
  | {
      ok: true;
      record: { id: string; fields: Record<string, unknown> };
      eventKey: string;
      eventNamnFallback: string | null;
    }
  | { ok: false; kod: 'okand_operation' }
  | { ok: false; kod: 'event_saknas' }
  | {
      ok: false;
      kod: 'dubblett';
      /** Den BEFINTLIGA anmälans record-ID — ombokningens adoptionsväg behöver det. */
      befintligId: string;
      befintligtNamn: string | null;
      eventKey: string;
    }
  | { ok: false; kod: 'falt_ej_tillatet'; falt: string };

/** Operationens allowlist-post, eller `null` om nyckeln saknas i registret. */
export function hamtaSkapaOperation() {
  return getOperation(CREATE_REGISTRATION_OPERATION);
}

/**
 * Hämtar eventraden och läser dess `EventKey`-formelvärde ("Event-N").
 * `null` = eventet finns inte (anroparen formulerar sin 404 — ärver
 * get-event/get-registrations eventId-grenens kontrakt).
 *
 * KASTAR när eventraden finns men saknar `EventKey`: formeln är alltid
 * beräknad, så ett tomt värde är ett data-integritetsfel i basen (500), inte
 * ett begripligt 400. Samma beteende som före utbrytningen.
 */
export async function hamtaEventNyckel(eventId: string): Promise<EventNyckel | null> {
  const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
  if (!eventRecord) return null;
  const eventKey = eventRecord.fields['EventKey'];
  if (typeof eventKey !== 'string' || !eventKey) {
    throw new Error(`Eventplanering ${eventId} saknar EventKey-formelvärde`);
  }
  return {
    eventKey,
    // TASK-363: sista-utväg-fallback för mapCreatedRegistration's eventNamn.
    // `Event (text)` (fldNIc8I2ynUoLkNn) är formel-KÄLLAN `Kurs (from Event)`
    // slår upp via Event-länken — samma värde, läst direkt ur den redan
    // hämtade (och redan beräknade) Eventplanering-posten.
    eventNamnFallback: scalarString(eventRecord.fields['Event (text)']),
  };
}

/**
 * Affärs-unikheten: finns redan en anmälan för denna e-post på detta event?
 *
 * Normaliserad e-post (LOWER(TRIM), replikerad deterministiskt) + EventKey-
 * STRÄNGEN. FILTRERAR ALDRIG på Event-länken (T15-lärdomen). Injektionssäkert
 * via `buildEqualsFilter` (samma builder som get-registrations).
 */
export async function sokBefintligAnmalan(
  tableId: string,
  email: string,
  eventKey: string,
): Promise<BefintligAnmalan | null> {
  const dupFilter = combineWithAnd([
    buildEqualsFilter('Normaliserad e-post', email.trim().toLowerCase()),
    buildEqualsFilter('EventKey', eventKey),
  ]);
  const existing = await fetchFromAirtable(tableId, {
    filterByFormula: dupFilter,
    fields: ['Namn'],
    maxRecords: 1,
  });
  if (existing.length === 0) return null;
  return { id: existing[0].id, namn: scalarString(existing[0].fields['Namn']) };
}

/**
 * Bygger och skriver anmälningsraden. Anroparen har redan löst `eventKey` och
 * prövat affärs-unikheten (`hamtaEventNyckel` + `sokBefintligAnmalan`).
 *
 * Endast skrivbara create-fält (data-model.md § Anmälningar write-fält);
 * formel/rollup (Namn / Normaliserad e-post / Är aktiv) sätts ALDRIG.
 * Person-länk sätts INTE — den delegeras till automation A2 (data-model.md
 * rad 204; Anmälan är giltig utan den, personId är nullable).
 */
export async function skapaAnmalanRad(
  input: SkapaAnmalanInput,
  eventKey: string,
  loggPrefix: string,
  callerUserId: string,
): Promise<
  | { ok: true; record: { id: string; fields: Record<string, unknown> } }
  | { ok: false; kod: 'okand_operation' }
  | { ok: false; kod: 'falt_ej_tillatet'; falt: string }
> {
  const operation = hamtaSkapaOperation();
  if (!operation) return { ok: false, kod: 'okand_operation' };

  const fields: Record<string, unknown> = {
    Förnamn: input.fornamn.trim(),
    Efternamn: input.efternamn.trim(),
    'E-post': input.email.trim(),
    Källa: SOURCE_MANUAL,
    Status: STATUS_CREATE_DEFAULT,
    Inskickad: new Date().toISOString(),
    EventKey: eventKey,
    Event: [input.eventId], // länk-fältets NAMN är 'Event' (fldi3enUaMdbuGSlm)
  };
  if (typeof input.telefon === 'string' && input.telefon.trim()) {
    fields['Mobilnummer'] = input.telefon.trim();
  }
  // Facit-formens två återstående fält (task-18.12). Antal platser skrivs när
  // angivet (annars lämnas basens number tomt — läs-mappningen normaliserar ?? 1);
  // Notering skrivs bara när icke-tom (tom text ⇒ fältet lämnas osatt).
  if (typeof input.antalPlatser === 'number') {
    fields['Antal platser'] = input.antalPlatser;
  }
  if (typeof input.notering === 'string' && input.notering.trim()) {
    fields['Notering'] = input.notering.trim();
  }

  // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
  // (defense-in-depth mot framtida kod-drift; deny → anroparens 400).
  const disallowed = findDisallowedField(operation, fields);
  if (disallowed !== null) {
    console.warn(
      `${loggPrefix} DENY field not in allowlist | caller_user_id=${callerUserId} | field=${disallowed}`,
    );
    return { ok: false, kod: 'falt_ej_tillatet', falt: disallowed };
  }

  console.log(
    `${loggPrefix} ALLOW | caller_user_id=${callerUserId} | eventKey=${eventKey} | event=${input.eventId}`,
  );

  const created = await createAirtableRecord(operation.tableId, fields);
  return { ok: true, record: created };
}

/**
 * Hela kedjan i ett svep: eventuppslag → affärs-unikhet → skrivning.
 * `create-registration`s väg, oförändrad i sak.
 */
export async function skapaAnmalan(
  input: SkapaAnmalanInput,
  loggPrefix: string,
  callerUserId: string,
): Promise<SkapaAnmalanUtfall> {
  // Allowlist-SSOT hämtas FÖRST (defensiv — operationen är statiskt
  // registrerad, men null-vägen behålls för paritet, och ordningen är densamma
  // som före utbrytningen).
  const operation = hamtaSkapaOperation();
  if (!operation) return { ok: false, kod: 'okand_operation' };

  const nyckel = await hamtaEventNyckel(input.eventId);
  if (!nyckel) return { ok: false, kod: 'event_saknas' };

  const befintlig = await sokBefintligAnmalan(operation.tableId, input.email, nyckel.eventKey);
  if (befintlig) {
    console.warn(
      `${loggPrefix} DENY duplicate | caller_user_id=${callerUserId} | eventKey=${nyckel.eventKey}`,
    );
    return {
      ok: false,
      kod: 'dubblett',
      befintligId: befintlig.id,
      befintligtNamn: befintlig.namn,
      eventKey: nyckel.eventKey,
    };
  }

  const skrivet = await skapaAnmalanRad(input, nyckel.eventKey, loggPrefix, callerUserId);
  if (!skrivet.ok) return skrivet;
  return {
    ok: true,
    record: skrivet.record,
    eventKey: nyckel.eventKey,
    eventNamnFallback: nyckel.eventNamnFallback,
  };
}
