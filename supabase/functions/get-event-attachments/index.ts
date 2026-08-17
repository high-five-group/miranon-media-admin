// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// get-event-attachments — TASK-147.5 "Bilage-bärande sändvägen + bilage-
// väljaren skarp" (PRD task-147). Bilageväljaren (AtgardsSida.tsx §
// BilageValjare) kopplas från en hårdkodad fyra-post-stubb till VERKLIGT
// fundament: eventets Bilagor-rader (TASK-146.4 uppladdade / TASK-146.5
// event-mallat genererade), läst via samma record-ID-batch-mönster
// get-event-notes redan bevisade för en annan per-event-tabell (Anteckningar).
//
// ANVÄNDER MEDVETET INTE ett länkfält-filter på Bilagor-tabellen — samma
// motiv som get-event-notes: länkfilter matchar länkens primär-display, inte
// record-ID (T15-klass-bugg). Record-ID = enda tillförlitliga nyckeln.
//
// [RÄTTAD, TASK-147.12] Bilagor-tabellen bär NU ett dokumentklass-fält
// (`Dokumentklass`, additivt, staging fldr2CwboZ3M4USCX) — nedanstående
// stycke beskrev tidigare (TASK-146.5–147.6) ett strukturellt odelbart
// tillstånd som inte längre håller. Denna EF listar FORTFARANDE ALLA rader
// länkade till eventet oavsett klass (ingen server-side filtrering — samma
// beteende som förut), men SVARET bär nu klassen per rad
// (`mapAttachmentRecord`), så konsumenten (DokumentYta.tsx) kan visa/gruppera
// på verklig klass i stället för att gissa. Klass C (kvitto, TASK-147.7) har
// fortfarande ingen Bilagor-rad att lista här — ingen skrivväg dit än.
//
// [UTBYGGD, TASK-275.2, ADR-118 beslut 2] Svaret är NU unionen av TRE
// mängder, inte bara eventets egna länkade rader:
//   (a) eventets EGNA — oförändrad record-ID-batch via den omvända länken
//       (nedan, ATTACHMENTS_LINK_FIELD).
//   (b) KURSTYP-matchande — `Räckvidd = "Kurstyp"` OCH `Kursfamilj` matchar
//       eventets EGET Kursfamilj-fält (ADR-115) OCH `Kursnivå` matchar
//       (ELLER är TOM — "tom-nivå-regeln": tom nivå på bilagan = hela
//       familjen). Körs INTE alls om eventet saknar Kursfamilj (ADR-118 §
//       Konsekvenser — modellen bär beroende av att den är satt; en tom-
//       sträng-jämförelse hade annars falsk-matchat andra tomma bilagor).
//   (c) ALLA EVENT — `Räckvidd = "Alla event"`, inget ytterligare villkor.
// Dedupliceras på record-ID (en gemensam bilaga som råkar bära samma `Event`-
// länk som eventet den skapades från hade annars synts två gånger — se
// upload-attachment/index.ts § filhuvudet för varför `Event` förblir satt
// oavsett räckvidd). Varje post i svaret bär sin `rackvidd` (badge-underlag)
// — se `mapAttachmentRecord`.
//
// `Lagringsnyckel` (TASK-147.5, additiv) EXPONERAS ALDRIG i svaret —
// `mapAttachmentRecord` (_shared/attachments.ts) är den delade mappern
// upload-attachment/finalize-attachment-upload/generate-event-attachment
// redan använder för sitt klient-svar, och den läser bara de fält
// ATTACHMENT_FIELDS nedan listar. Server-internt fält, aldrig på
// klientkontraktet (ADR-057 klausul a).
//
// LÄSER bara — ingen skrivning, ingen allowlist-grind behövs.

import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd, combineWithOr } from '../_shared/airtable-filter.ts';
import {
  ATTACHMENT_SCOPE_ALLA_EVENT,
  ATTACHMENT_SCOPE_KURSTYP,
  BILAGOR_TABLE,
  EVENTPLANERING_TABLE,
  mapAttachmentRecord,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

// Eventets omvända länkfält som bär Bilagor-record-ID:n — AUTOMATISKT skapat
// av Airtable när Bilagor.Event-länken skapades (samma namn som tabellen,
// live-verifierat 2026-08-10 mot staging via Airtable MCP list_records på
// Eventplanering, fältet `Bilagor`). Speglar get-event-notes:s NOTES_LINK_FIELD.
const ATTACHMENTS_LINK_FIELD = 'Bilagor';

// Max record-ID:n per batch-anrop (kort `OR(RECORD_ID()=…)`-formel) → ETT
// listanrop per chunk. Spegel av get-event-notes:s NOTES_BATCH_SIZE.
const ATTACHMENTS_BATCH_SIZE = 50;

// Fält att hämta ur Bilagor — Lagringsnyckel UTESLUTS MEDVETET (server-internt,
// se filhuvudet). mapAttachmentRecord läser bara dessa fält ändå (TASK-147.12
// lade till Dokumentklass, TASK-275.2 lade till Räckvidd/Kursfamilj/
// Kursnivå), men en explicit fields-lista är en andra, oberoende spärr mot
// att Lagringsnyckel någonsin läcker ut i svaret genom en framtida
// mapper-ändring.
const ATTACHMENT_FIELDS = [
  'Namn',
  'Storlek (bytes)',
  'Skapad',
  'Event',
  'Dokumentklass',
  'Räckvidd',
  'Kursfamilj',
  'Kursnivå',
];

type Fields = Record<string, unknown>;
type AirtableRow = { id: string; fields: Fields };

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/** Batch-hämta record-ID:n ur Bilagor via chunkad `OR(RECORD_ID()=…)`. */
async function fetchAttachmentsByRecordIds(ids: readonly string[]): Promise<AirtableRow[]> {
  const out: AirtableRow[] = [];
  for (const idChunk of chunk(ids, ATTACHMENTS_BATCH_SIZE)) {
    const filterByFormula = `OR(${idChunk.map((rid) => `RECORD_ID()='${rid}'`).join(',')})`;
    const records = (await fetchFromAirtable(BILAGOR_TABLE, {
      filterByFormula,
      fields: ATTACHMENT_FIELDS,
    })) as AirtableRow[];
    out.push(...records);
  }
  return out;
}

/**
 * [TASK-275.2, ADR-118 beslut 2] Mängd (b): Kurstyp-matchande gemensamma
 * bilagor — `Räckvidd = "Kurstyp"` OCH `Kursfamilj` = eventets EGET
 * Kursfamilj-fält (ADR-115) OCH (`Kursnivå` TOM ELLER = eventets EGET
 * Kursnivå — "tom-nivå-regeln", ADR-118 beslut 1: tom nivå på bilagan
 * betyder "hela familjen"). Anropas ALDRIG med tomt `eventKursfamilj` — se
 * callern, som hoppar över hela mängden i det fallet (ADR-118 §
 * Konsekvenser: en `{Kursfamilj} = ""`-jämförelse hade annars falsk-matchat
 * andra bilagor utan känd familj).
 */
async function fetchKurstypMatchande(
  eventKursfamilj: string,
  eventKursniva: string | null,
): Promise<AirtableRow[]> {
  // "Tom-nivå-regeln" — ALLTID två klausuler (tom nivå ELLER exakt nivå-
  // match), aldrig noll/en, så combineWithOr returnerar garanterat en
  // sträng här (bara en TOM lista ger undefined — se airtable-filter.ts).
  const kursnivaOr = combineWithOr([
    buildEqualsFilter('Kursnivå', ''),
    buildEqualsFilter('Kursnivå', eventKursniva ?? ''),
  ]) as string;
  const filterByFormula = combineWithAnd([
    buildEqualsFilter('Räckvidd', ATTACHMENT_SCOPE_KURSTYP),
    buildEqualsFilter('Kursfamilj', eventKursfamilj),
    kursnivaOr,
  ]);
  return (await fetchFromAirtable(BILAGOR_TABLE, {
    filterByFormula,
    fields: ATTACHMENT_FIELDS,
  })) as AirtableRow[];
}

/** [TASK-275.2, ADR-118 beslut 2] Mängd (c): Alla-event-bilagor — inget ytterligare villkor. */
async function fetchAllaEvent(): Promise<AirtableRow[]> {
  const filterByFormula = buildEqualsFilter('Räckvidd', ATTACHMENT_SCOPE_ALLA_EVENT);
  return (await fetchFromAirtable(BILAGOR_TABLE, {
    filterByFormula,
    fields: ATTACHMENT_FIELDS,
  })) as AirtableRow[];
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Missing eventId' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Eventraden — ETT single-get. null = 404 (ärver get-event/get-event-notes-kontraktet).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Eventets Bilagor-record-ID:n ur den omvända länken. Tom/saknad → tom
    //    lista (ej fel; ett event utan bilagor är ett giltigt tillstånd —
    //    normalfallet innan TASK-146.4/146.5-flödena körts för eventet).
    const attachmentIds: string[] = Array.isArray(eventRecord.fields[ATTACHMENTS_LINK_FIELD])
      ? (eventRecord.fields[ATTACHMENTS_LINK_FIELD] as string[])
      : [];

    // [TASK-275.2, ADR-118 beslut 2] Eventets egna Kursfamilj/Kursnivå
    // (ADR-115-fälten, redan på eventRecord — inget extra Airtable-anrop).
    const rawKursfamilj = eventRecord.fields['Kursfamilj'];
    const eventKursfamilj = typeof rawKursfamilj === 'string' ? rawKursfamilj : '';
    const rawKursniva = eventRecord.fields['Kursnivå'];
    const eventKursniva = typeof rawKursniva === 'string' ? rawKursniva : null;

    // 3) UNIONEN av tre mängder — parallellt (oberoende Airtable-anrop, ingen
    //    delad state). Mängd (b) körs bara om eventet FAKTISKT har en
    //    Kursfamilj (se fetchKurstypMatchande § docblock för varför).
    const [egna, kurstypMatchande, allaEvent] = await Promise.all([
      attachmentIds.length > 0 ? fetchAttachmentsByRecordIds(attachmentIds) : [],
      eventKursfamilj ? fetchKurstypMatchande(eventKursfamilj, eventKursniva) : [],
      fetchAllaEvent(),
    ]);

    // 4) Deduplicera på record-ID (en gemensam bilaga kan träffas av BÅDE
    //    (a) och (b)/(c) — se filhuvudets union-stycke) INNAN mappning.
    const byId = new Map<string, AirtableRow>();
    for (const row of [...egna, ...kurstypMatchande, ...allaEvent]) {
      byId.set(row.id, row);
    }
    const attachments = Array.from(byId.values()).map(mapAttachmentRecord);

    // 5) Nyast först — konsekvent med get-event-notes:s CRM-ordning (senast
    //    tillagda överst i väljaren, mest sannolikt relevant för Lotta just nu).
    attachments.sort((a, b) => (a.skapad < b.skapad ? 1 : a.skapad > b.skapad ? -1 : 0));

    return new Response(JSON.stringify({ attachments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-event-attachments',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
