// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som upload-attachment/index.ts.
//
// finalize-attachment-upload — TASK-146.4 mönster 2, steg 2 ("stora filer"):
// anropas EFTER att klienten (adaptern) laddat upp bytesen direkt mot
// lagringen med det tillstånd create-attachment-upload-ticket utfärdade.
// Skriver Bilagor-metadataraden — samma tabell, samma fält som mönster 1
// (upload-attachment), men storleken läses från lagringens FAKTISKA
// objekt-metadata, aldrig från ett klient-påstått tal.
//
// AUKTORISATIONSBESLUTET (AC #5), del 2: klienten skickar ALDRIG en path.
// Den skickar bara (eventId, attachmentId, filnamn) — EXAKT samma tre värden
// den fick/uppgav vid ticket-utfärdandet — och denna funktion DERIVERAR
// samma path SERVER-SIDE med samma formel
// (_shared/attachments.ts buildAttachmentPath). Sedan verifieras att ett
// objekt FAKTISKT finns där (storage.info — se § EXISTENSKONTROLLEN nedan
// för varför INTE storage.list, TASK-196) INNAN någon metadatarad skrivs.
// Det stänger den uppenbara attacken ("peka finalize mot en annan händelses
// fil"): eftersom attachmentId alltid är server-genererat vid ticket-
// utfärdandet och aldrig återanvänds mellan event, kan en klient bara
// "träffa" en path som den SJÄLV fick ett giltigt, scopat tillstånd för och
// FAKTISKT laddade upp bytes till — annars finns ingenting att hitta på den
// deriverade platsen och verifieringen faller.
//
// [TASK-275.2, ADR-118 · UTBYGGT TASK-338.2, ADR-125 § Beslut 1]
// RÄCKVIDDSPARAMETRARNA — SAMMA disciplin som upload-attachment/index.ts (se
// den filens motsvarande stycke): valfria, strikt Zod-validerade, `Event`
// förblir satt oavsett räckvidd. Nu FYRA parametrar: `plats` (Platser-
// record-ID) är räckviddens tredje axel och existenskontrolleras mot
// Platser-tabellen (`platsFinns`) innan raden skrivs. Legacy-värdena
// `Kurstyp`/`Alla event` accepteras och sparas som `Gemensam`.
// `create-attachment-upload-ticket` (steg 1) rör INTE dessa — den skriver
// ingen Bilagor-rad, bara denna (steg 2, radskapelsen) behöver dem.
//
// IDEMPOTENS [TASK-183] — DETERMINISTISK nyckel, INTE ett klient-genererat
// Idempotency-Key (skiljer sig från create-event/create-registration-
// mönstret, ADR-014/ADR-066): `Lagringsnyckel` (`buildAttachmentLeaf`,
// `<attachmentId>-<sanitizeFilnamn(filnamn)>`) är REDAN unik och deterministisk
// per uppladdning — attachmentId är alltid server-genererat en gång vid
// ticket-utfärdandet (create-attachment-upload-ticket) och klienten
// återanvänder SAMMA attachmentId vid ett retry (nätverkstimeout,
// `fetchWithRetry` i src/data/utils.ts). Ett andra finalize-anrop med samma
// (eventId, attachmentId, filnamn) deriverar därför samma path OCH samma
// Lagringsnyckel-värde — precis den egenskap ADR-066:s upsert-mekanism
// (`upsertAirtableRecord`, `performUpsert.fieldsToMergeOn`) kräver av ett
// merge-fält. MEKANISM: samma Airtable-native match-or-create som
// create-event — färsk Lagringsnyckel → createdRecords (ny rad, 201); samma
// Lagringsnyckel (retry) → updatedRecords (idempotent replay, 200, SAMMA
// record-ID). En genuint NY uppladdning får alltid en NY ticket → ny
// attachmentId → ny Lagringsnyckel → egen rad (ingen omedveten sammanslagning
// av två olika filer). Ingen klient-ändring krävs — nyckeln är alltid
// implicit i de tre värden klienten redan skickar.

import { fetchAirtableRecord, upsertAirtableRecord } from '../_shared/airtable-client.ts';
import {
  ATTACHMENT_CLASS_UPPLADDAD,
  AttachmentScopeInputSchema,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentLeaf,
  buildAttachmentPath,
  buildScopeFields,
  EVENTPLANERING_TABLE,
  isValidAttachmentId,
  isValidEventId,
  mapAttachmentRecord,
  platsFinns,
} from '../_shared/attachments.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const OPERATION_KEY = 'create-attachment';
// IDEMPOTENS-MERGE-FÄLTET [TASK-183] — se filhuvudets § IDEMPOTENS. `Lagringsnyckel`
// är redan skrivbart och redan skrivet av denna funktion (deriverat, aldrig
// klient-buret) — merge-fältet återanvänder ett fält som redan finns, ingen
// ny kolumn behövs.
const MERGE_FIELD = 'Lagringsnyckel';

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const eventId = body?.eventId;
    const attachmentId = body?.attachmentId;
    const filnamn = body?.filnamn;

    if (!isValidEventId(eventId)) {
      return badRequest('Ogiltigt event-id.', corsHeaders);
    }
    if (!isValidAttachmentId(attachmentId)) {
      return badRequest('Ogiltigt uppladdnings-id.', corsHeaders);
    }
    if (typeof filnamn !== 'string' || !filnamn.trim()) {
      return badRequest('Filen saknar namn.', corsHeaders);
    }

    // [TASK-275.2 · UTBYGGT TASK-338.2] Räckviddsparametrarna — strikt Zod,
    // SAMMA schema som upload-attachment/index.ts, nu inklusive Plats-axeln
    // (ADR-125 § Beslut 1) och legacy-toleransen för Kurstyp/Alla event.
    const scopeParsed = AttachmentScopeInputSchema.safeParse({
      rackvidd: body?.rackvidd,
      kursfamilj: body?.kursfamilj,
      kursniva: body?.kursniva,
      plats: body?.plats,
    });
    if (!scopeParsed.success) {
      return badRequest(
        scopeParsed.error.issues[0]?.message ?? 'Ogiltig räckvidd.',
        corsHeaders,
      );
    }

    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Eventet hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // [TASK-338.2] PLATSEN FINNS-kontrollen — samma delade vakt som
    // upload-attachment (se `platsFinns`, _shared/attachments.ts). Ligger
    // FÖRE existenskontrollen av Storage-objektet av samma skäl som där:
    // ett avvisat anrop ska falla på det billigaste ledet först.
    if (scopeParsed.data.plats && !(await platsFinns(scopeParsed.data.plats))) {
      return new Response(JSON.stringify({ error: 'Platsen hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Path DERIVERAS server-side — SAMMA formel som utfärdandet. Klienten
    // skickar aldrig en path direkt (§ AUKTORISATIONSBESLUTET ovan).
    // `expectedFilename` ÄR leaf-delen av `path` (TASK-147.5: samma
    // `buildAttachmentLeaf`-anrop skriver nu även Lagringsnyckel-fältet
    // nedan — en beräkning, två användningar, aldrig två separata formler).
    const expectedFilename = buildAttachmentLeaf(attachmentId, filnamn);
    const path = buildAttachmentPath(eventId, attachmentId, filnamn);

    // EXISTENSKONTROLLEN läser OBJEKTET DIREKT via dess kända, deriverade
    // `path` (`storage.info`, GET /object/info/{path}) — INTE via
    // `storage.list(eventId)` + en manuell namn-sökning i svaret (TASK-196,
    // 2026-08-12). `.list()` är en FOLDER-listning med bibliotekets defaults
    // `limit:100, offset:0, sortBy:{name,asc}` (verifierat mot den
    // installerade @supabase/storage-js-källkoden, `StorageFileApi.ts`) — den
    // paginerar, och BELAGGNING_EVENT_ID-mappen växer UTAN GRÄNS över tid
    // (storage-bytes städas aldrig, se testfilens egen header +
    // .purge-staging-policy.json som bara purgar Airtable-raden). En nyss
    // uppladdad fil vars slumpmässiga UUID-prefix sorterar utanför sidans
    // fönster missas då AV `.list()` PERMANENT — inte tillfälligt.
    // Rött-först-belägg (2026-08-12, TASK-196): en riktig ticket→PUT→finalize
    // mot skarp staging föll DETERMINISTISKT även efter 16 sekunders väntan
    // före finalize — alltså INTE "eventual consistency" (den hypotesen är
    // falsifierad: en genuin läs-efter-skriv-fördröjning hade läkt inom
    // millisekunder-till-sekunder, inte förblivit fel i 16s rakt igenom).
    // `.info(path)` är en ENSKILD resurs-URL (inte en lista) och är därför
    // strukturellt IMMUN mot mappstorleken, oavsett hur många syskonobjekt
    // som finns i samma event-mapp.
    const { data: info, error: infoError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .info(path);
    if (infoError) {
      // Storage svarar ALLTID med HTTP 400 och en inbäddad `statusCode`-sträng
      // för "hittades inte" (`{"statusCode":"404","error":"not_found",...}`,
      // empiriskt verifierat mot skarp staging TASK-196 2026-08-12) —
      // `@supabase/storage-js`s felhantering (`lib/common/fetch.ts`
      // `handleError`) lyfter DEN strängen till `error.statusCode`, medan
      // `error.status` alltid blir den råa HTTP-koden (400). Kontrollera
      // därför `statusCode`, aldrig `status`, för att skilja "hittades inte"
      // (400, väntat) från ett faktiskt lagringsfel (502, oväntat).
      if (infoError.statusCode === '404') {
        return badRequest(
          'Uppladdningen verkar inte ha slutförts — filen hittades inte i lagringen. ' +
            'Prova att ladda upp igen.',
          corsHeaders,
        );
      }
      throw new HttpError(
        502,
        `Lagringen kunde inte kontrolleras just nu: ${infoError.message}. Prova igen.`,
      );
    }

    // Storleken kommer från LAGRINGENS FAKTISKA objekt-metadata — aldrig ett
    // klient-påstått tal (AC #5, server-side auktorisationsbeslut).
    const actualSizeBytes = info?.size;
    if (typeof actualSizeBytes !== 'number') {
      throw new HttpError(502, 'Filens storlek kunde inte läsas från lagringen. Prova igen.');
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new HttpError(500, `Okänd operation: ${OPERATION_KEY}`);
    }

    const fields: Record<string, unknown> = {
      Namn: filnamn.trim(),
      'Storlek (bytes)': actualSizeBytes,
      Skapad: new Date().toISOString(),
      Event: [eventId],
      // [TASK-147.5] Additivt — se upload-attachment/index.ts:s motsvarande rad.
      // [TASK-183] Samma värde är NU merge-fältet (se filhuvudets § IDEMPOTENS)
      // — MERGE_FIELD pekar på precis denna nyckel, inte en parallell konstant.
      [MERGE_FIELD]: expectedFilename,
      // [TASK-147.12] Additivt — mönster 2 är fortfarande klass A (samma
      // uppladdningshandling, bara stor fil). Se upload-attachment/index.ts:s
      // motsvarande rad.
      Dokumentklass: ATTACHMENT_CLASS_UPPLADDAD,
      // [TASK-275.2, ADR-118] Se upload-attachment/index.ts:s motsvarande rad.
      ...buildScopeFields(scopeParsed.data),
    };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[finalize-attachment-upload] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(`Fält "${disallowed}" är inte tillåtet.`, corsHeaders);
    }

    console.log(
      `[finalize-attachment-upload] ALLOW | caller_user_id=${user.id} | event=${eventId} | path=${path} | bytes=${actualSizeBytes} | rackvidd=${scopeParsed.data.rackvidd}`,
    );

    // IDEMPOTENS-MEKANISM [TASK-183]: upsert på Lagringsnyckel (ADR-066:s
    // mönster, se filhuvudets § IDEMPOTENS). Färsk Lagringsnyckel →
    // createdRecords (ny rad); samma Lagringsnyckel (retry, samma
    // attachmentId) → updatedRecords (idempotent replay, samma rad — INGEN
    // dubblett skapas).
    const { record, created: wasCreated } = await upsertAirtableRecord(BILAGOR_TABLE, fields, [
      MERGE_FIELD,
    ]);

    // 201 vid ny rad, 200 vid idempotent replay (samma Lagringsnyckel →
    // matchad, inget nytt skapades) — speglar create-event/index.ts EXAKT.
    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(record),
        record: { id: record.id, fields: record.fields, createdTime: record.createdTime },
        created: wasCreated,
      }),
      {
        status: wasCreated ? 201 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'finalize-attachment-upload',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
