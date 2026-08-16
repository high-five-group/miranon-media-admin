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
// `Lagringsnyckel` (TASK-147.5, additiv) EXPONERAS ALDRIG i svaret —
// `mapAttachmentRecord` (_shared/attachments.ts) är den delade mappern
// upload-attachment/finalize-attachment-upload/generate-event-attachment
// redan använder för sitt klient-svar, och den läser bara Namn/'Storlek
// (bytes)'/Skapad/Event. Server-internt fält, aldrig på klientkontraktet
// (ADR-057 klausul a).
//
// LÄSER bara — ingen skrivning, ingen allowlist-grind behövs.

import { fetchAirtableRecord, fetchFromAirtable } from '../_shared/airtable-client.ts';
import { BILAGOR_TABLE, EVENTPLANERING_TABLE, mapAttachmentRecord } from '../_shared/attachments.ts';
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
// se filhuvudet). mapAttachmentRecord läser bara dessa fem ändå (TASK-147.12
// lade till Dokumentklass), men en explicit fields-lista är en andra,
// oberoende spärr mot att Lagringsnyckel någonsin läcker ut i svaret genom en
// framtida mapper-ändring.
const ATTACHMENT_FIELDS = ['Namn', 'Storlek (bytes)', 'Skapad', 'Event', 'Dokumentklass'];

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

    const attachments =
      attachmentIds.length > 0
        ? (await fetchAttachmentsByRecordIds(attachmentIds)).map(mapAttachmentRecord)
        : [];

    // 3) Nyast först — konsekvent med get-event-notes:s CRM-ordning (senast
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
