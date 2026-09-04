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
// [OMBYGGD, TASK-338.2, ADR-125 § Beslut 1 — ERSÄTTER TASK-275.2:s form]
// Svaret är unionen av TVÅ mängder, och matchningen sker I KOD:
//   (a) eventets EGNA — oförändrad record-ID-batch via den omvända länken
//       (nedan, ATTACHMENTS_LINK_FIELD).
//   (b) GEMENSAMMA KANDIDATER — EN enda hämtning, `Räckvidd ≠ Event`, som
//       sedan filtreras med `matcharEvent` (_shared/rackvidd-matchning.ts)
//       mot eventets Kursfamilj, Kursnivå och Plats.
//
// TIDIGARE STOD HÄR "unionen av TRE mängder" med tre `filterByFormula`-
// hämtningar (Kurstyp-matchande · Alla event · egna). Den formen är RIVEN,
// inte deprecerad: räckvidden är sedan ADR-125 § Beslut 1 ett FILTER över
// tre kombinerbara axlar (Familj · Event · Plats), och Plats-axeln är ett
// multipleRecordLinks-fält som Airtables formelspråk inte kan jämföra mot
// ett record-ID utan hjälpfält. En formel som jämför länkens primär-display
// (namnet) är exakt den T15-klassbugg stycket ovan redan varnar för, och
// namn-drift är samma fälla ADR-125 § 8 avvisar för Ort. Matchningen bor
// därför i EN ren funktion i _shared (ADR-057: aldrig i klienten), med egen
// deterministisk enhetstestsvit (tests/api/rackvidd-matchning.test.ts).
//
// `Räckvidd ≠ Event` är MEDVETET en SUPERMÄNGD, inte ett exakt filter.
// Formeln fångar `Gemensam`, de två legacy-värdena (`Kurstyp`/`Alla event`,
// levande i prod tills TASK-338.6) OCH rader som saknar `Räckvidd` helt.
// KODEN avgör sedan: `arGemensam` säger nej till tomt `Räckvidd`, som är
// den historiska default-formen för `Event` (basfältets egen beskrivning)
// och bärs av mall-genererade klass B-rader. Mätt mot staging 2026-08-29:
// formeln gav 49 rader, varav 34 var event-bundna rader med tomt
// `Räckvidd` — utan kod-grinden hade de landat på VARJE events
// dokumentlista. Supermängden är ändå rätt form: den tolererar varje
// framtida eller okänt optionsnamn utan att formeln behöver uppdateras,
// och mängden gemensamma rader är liten och bunden (tiotals).
//
// Dedupliceras på record-ID (en gemensam bilaga som råkar bära samma `Event`-
// länk som eventet den skapades från hade annars synts två gånger — se
// upload-attachment/index.ts § filhuvudet för varför `Event` förblir satt
// oavsett räckvidd). Varje post i svaret bär sin NORMALISERADE `rackvidd`
// (`Event`/`Gemensam` — aldrig ett legacy-värde), sina axlar och
// `plats: {id, namn} | null` som badge-underlag — se `mapAttachmentRecord`.
//
// [UTBYGGD, TASK-275.3, ADR-118 beslut 5 — kvar i kraft] `eventId` ÄR
// VALFRI. UTELÄMNAD signalerar RÄCKVIDDSLÄGET (Dokument-ytans läge utan
// valt event): svaret blir då ALLA gemensamma bilagor (se
// `fetchAllaGemensamma` nedan) — ingen eventunion, ingen `Eventraden måste
// existera`-kontroll (det finns inget event att slå upp).
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
import {
  arGemensam,
  ATTACHMENT_SCOPE_EVENT,
  BILAGOR_TABLE,
  EVENTPLANERING_TABLE,
  lasPlatsIds,
  mapAttachmentRecord,
  matcharEvent,
  normaliseraRackvidd,
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
  // [TASK-338.2, ADR-125 § Beslut 1] Plats-axeln. `Plats` är länken
  // matchningen jämför på (record-ID), `Platsnamn` lookup-namnet svaret
  // bär ut så klienten slipper ett extra uppslag. BÅDA behövs: namnet får
  // aldrig användas för att matcha, ID:t säger inget åt Lotta.
  'Plats',
  'Platsnamn',
];

/** Eventets Plats-länk (`Eventplanering.Plats`, ADR-125 § 2) — HÄRLEDD
 *  server-side ur `Ort` vid create (TASK-309.30), aldrig klient-buren. */
const EVENT_PLATS_FIELD = 'Plats';

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
 * [TASK-338.2, ADR-125 § Beslut 1] Mängd (b): KANDIDATERNA — EN hämtning,
 * `Räckvidd ≠ Event`, som ersätter TASK-275.2:s tre filterByFormula-
 * mängder. Se filhuvudet för varför formeln medvetet är en SUPERMÄNGD och
 * varför matchningen bor i kod.
 *
 * Formeln skrivs bokstavligt i stället för via `buildEqualsFilter`:
 * hjälpfunktionen bygger `{Fält} = 'värde'`, och det finns ingen
 * `buildNotEqualsFilter`. Att lägga till en sådan för EN användning vore
 * spekulativ generalisering — `NOT(...)` runt en likhet är Airtables egen,
 * dokumenterade form.
 *
 * `fetchFromAirtable` PAGINERAR internt (do/while på `offset`,
 * airtable-client.ts), så kandidatmängden är inte tystnadsbegränsad till
 * de första 100 raderna när Bilagor växer.
 */
async function fetchGemensammaKandidater(): Promise<AirtableRow[]> {
  const filterByFormula = `NOT({Räckvidd} = '${ATTACHMENT_SCOPE_EVENT}')`;
  return (await fetchFromAirtable(BILAGOR_TABLE, {
    filterByFormula,
    fields: ATTACHMENT_FIELDS,
  })) as AirtableRow[];
}

/** Radens räckviddsaxlar, i matcharens form. En läsning, två användningar
 *  (matchningen nedan och räckviddslistningen). */
function radensRackvidd(row: AirtableRow) {
  const rackvidd = row.fields['Räckvidd'];
  const kursfamilj = row.fields['Kursfamilj'];
  const kursniva = row.fields['Kursnivå'];
  return {
    rackvidd: typeof rackvidd === 'string' && rackvidd.length > 0 ? rackvidd : null,
    kursfamilj: typeof kursfamilj === 'string' && kursfamilj.length > 0 ? kursfamilj : null,
    kursniva: typeof kursniva === 'string' && kursniva.length > 0 ? kursniva : null,
    platsIds: lasPlatsIds(row.fields['Plats']),
  };
}

/** Matchar EN kandidatrad mot eventets axlar — tunn brygga mellan
 *  Airtable-radens fältform och den rena matcharens datatyp. */
function matcherEventRad(
  row: AirtableRow,
  eventetsAxlar: { kursfamilj: string | null; kursniva: string | null; platsIds: string[] },
): boolean {
  return matcharEvent(radensRackvidd(row), eventetsAxlar);
}

/**
 * [TASK-275.3, ADR-118 beslut 5 · OMBYGGD TASK-338.2] RÄCKVIDDSLÄGET —
 * ALLA gemensamma bilagor, oavsett event. Detta är listningen bakom
 * Dokument-ytans läge UTAN valt event ("Dokument-sidan har ett läge som
 * visar gemensamma dokument UTAN valt event", task-275.3 AC #2).
 *
 * Samma hämtning som mängd (b) — `Räckvidd ≠ Event` — men UTAN
 * event-matchning (det finns inget event att matcha mot). Kod-grinden
 * `arGemensam` är dock kvar och är HÄR det som skiljer listan från
 * hämtningen: den håller ute raderna med tomt `Räckvidd`, som annars hade
 * lagt 34 mall-genererade, event-bundna PDF:er (mätt i staging
 * 2026-08-29) i Lottas lista över delade dokument. Filhuvudet bär
 * mätningen och resonemanget.
 */
async function fetchAllaGemensamma(): Promise<AirtableRow[]> {
  const kandidater = await fetchGemensammaKandidater();
  return kandidater.filter((row) => {
    const norm = normaliseraRackvidd(radensRackvidd(row));
    return arGemensam(norm.rackvidd);
  });
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

  // [TASK-275.3, ADR-118 beslut 5 · TASK-338.2] `eventId` ÄR VALFRI —
  // UTELÄMNAD signalerar räckviddsläget (Dokument-ytans läge utan valt
  // event): svaret blir då ALLA gemensamma bilagor, ingen eventunion.
  // ANGES `eventId` byggs unionen av eventets egna + de gemensamma
  // kandidater som MATCHAR eventets tre axlar (se filhuvudet).
  if (!eventId) {
    try {
      const attachments = (await fetchAllaGemensamma()).map(mapAttachmentRecord);
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

    // [TASK-275.2 · UTBYGGT TASK-338.2] Eventets EGNA axlar — Kursfamilj/
    // Kursnivå (ADR-115) OCH Plats (ADR-125 § 2). Alla tre läses ur SAMMA
    // eventRecord som redan hämtades ovan: inget extra Airtable-anrop, och
    // ingen risk att Plats läses ur ett annat tidsläge än familjen.
    const rawKursfamilj = eventRecord.fields['Kursfamilj'];
    const rawKursniva = eventRecord.fields['Kursnivå'];
    const eventetsAxlar = {
      kursfamilj: typeof rawKursfamilj === 'string' && rawKursfamilj.length > 0 ? rawKursfamilj : null,
      kursniva: typeof rawKursniva === 'string' && rawKursniva.length > 0 ? rawKursniva : null,
      platsIds: lasPlatsIds(eventRecord.fields[EVENT_PLATS_FIELD]),
    };

    // 3) UNIONEN av TVÅ mängder — parallellt (oberoende Airtable-anrop,
    //    ingen delad state). Mängd (b) hämtas ALLTID: till skillnad från
    //    TASK-275.2:s formel-matchning är den inte villkorad av att eventet
    //    har en Kursfamilj — ett event UTAN familj kan mycket väl matcha en
    //    plats-bunden eller axellös gemensam bilaga.
    const [egna, kandidater] = await Promise.all([
      attachmentIds.length > 0 ? fetchAttachmentsByRecordIds(attachmentIds) : [],
      fetchGemensammaKandidater(),
    ]);

    // 4) MATCHNINGEN I KOD (ADR-057: i EF/_shared, aldrig i klienten) —
    //    varje kandidat prövas mot eventets tre axlar av den rena
    //    `matcharEvent` (egen enhetstestsvit, tests/api/rackvidd-
    //    matchning.test.ts). Legacy-värdena normaliseras inuti den.
    const matchande = kandidater.filter((row) => matcherEventRad(row, eventetsAxlar));

    // 5) Deduplicera på record-ID (en gemensam bilaga kan träffas av BÅDE
    //    (a) och (b) — se filhuvudets union-stycke) INNAN mappning.
    const byId = new Map<string, AirtableRow>();
    for (const row of [...egna, ...matchande]) {
      byId.set(row.id, row);
    }
    const attachments = Array.from(byId.values()).map(mapAttachmentRecord);

    // 6) Nyast först — konsekvent med get-event-notes:s CRM-ordning (senast
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
