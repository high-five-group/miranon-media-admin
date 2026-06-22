import {
  createAirtableRecord,
  fetchAirtableRecord,
  fetchFromAirtable,
} from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

// create-registration — skapar en MANUELL anmälan (Källa="Manuell") för admin
// (Fas 6c Leverabel 4). Skriv-kärnan som speglar update-record:s SÄKERHET
// (POST→405, requireUser→401, allowlist-SSOT via field-allowlists.ts, deny→400,
// {error}+requestId, central loggning) men för CREATE i stället för PATCH.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typade inputs — klienten skickar aldrig en rå
// `fields`-map (till skillnad mot update-record). Skrivbara fält ENDAST per
// data-model.md § Anmälningar write-fält; formel/rollup (Namn / Normaliserad
// e-post / Är aktiv) sätts ALDRIG. Person-länk sätts INTE — den delegeras till
// automation A2 (data-model.md rad 204; Anmälan är giltig utan den, personId
// är nullable).
//
// EVENTKEY (VÄG B, Chat-låst): EventKey ("Event-N") är en LOOKUP från
// Eventplanering, inte ett route-värde. EF:en hämtar Eventplanering(eventId)
// och läser dess EventKey-formelfält (live-verifierat `"Event-" & {Event-nr}`,
// staging↔prod-paritet), och sätter BÅDE EventKey OCH Event-länk på den nya
// raden. Skäl: (1) data-shape-konsistens — alla form-skapade Anmälningar bär
// EventKey, våra får ej vara anomalier; (2) 409-checken filtrerar på EventKey-
// STRÄNGEN (ej Event-länken → undviker T15-länkfilter-bräckligheten); (3) en
// single-record-fetch tjänar både skrivningen och 409-filtret. Känd fälla 9
// (data-model.md): att sätta EventKey + Event direkt gör A1 idempotent.
//
// IDEMPOTENS (ADR-059 + Stripe-kanon): klient-UUID i Idempotency-Key
// (header ELLER body). INVARIANT: saknas → 400 + LOGGA nyckeln (lagras EJ i
// 6c — Fas E aktiverar server-storage additivt). Nyckeln dedupas alltså INTE
// server-side ännu; affärs-unikhet hanteras separat av 409-checken nedan.
//
// 409 (affärs-unikhet, SKILD från idempotensen): Normaliserad e-post
// (LOWER(TRIM) — replikerad deterministiskt) + EventKey-sträng. Hit → 409.

const OPERATION_KEY = 'create-registration';
const EVENTPLANERING_TABLE = 'Eventplanering';

// Sätts vid manuell admin-create (data-model.md § Källa-/Status-värden).
// Manuell = admin lägger till manuellt; Obekräftad = create-default.
const SOURCE_MANUAL = 'Manuell';
const STATUS_CREATE_DEFAULT = 'Obekräftad';

// Pragmatisk e-post-format-grind (samma anda som klient-validering). Avsiktligt
// enkel: en exakt RFC-5322-parser är fel verktyg här — 409-/normaliserings-
// korrektheten vilar på Airtables `LOWER(TRIM())`, inte på adress-strukturen.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Mappar en skapad Airtable-rad till domän-Registration (samma shape som
 * get-registrations' mapRegistration → klienten ser ALDRIG Airtable-fältnamn;
 * `RegistrationSchema.parse()` validerar i adaptern, ADR-026). Lokalt definierad:
 * under ADR-026:s ≥3-tröskel för _shared-extraktion (endast get-registrations +
 * denna; extrahera vid tredje konsument).
 */
function mapCreatedRegistration(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;
  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Mobilnummer'] ?? null, // text
    eventNamn: f['Event (namn)'] ?? null, // formula
    ort: scalarString(f['Ort']), // text
    status: selectName(f['Status']), // singleSelect
    flagga: selectName(f['Flagga']), // singleSelect
    anmalningsavgift: selectName(f['Anmälningsavgift']), // singleSelect
    slutbetalning: selectName(f['Slutbetalning']), // singleSelect
    betalningspaminnelseSkickad: f['Betalningspåminnelse skickad'] ?? null, // dateTime
    inskickad: f['Inskickad'] ?? null, // dateTime
    motivering: f['Varför vill du gå den här utbildningen?'] ?? null, // text
    tidigareErfarenhet: f['Vilka kurser från Roger och Lotta har du deltagit i tidigare?'] ?? null,
    antalPlatser: f['Antal platser'] ?? 1, // number
    notering: f['Notering'] ?? null, // text
    eventId: Array.isArray(f['Event']) ? f['Event'][0] : null, // linked record → first ID
    personId: Array.isArray(f['Person']) ? f['Person'][0] : null, // linked record → first ID
  };
}

function badRequest(
  message: string,
  corsHeaders: Record<string, string>,
): Response {
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
    const body = (await req.json()) as Record<string, unknown> | null;
    const fornamn = body?.fornamn;
    const efternamn = body?.efternamn;
    const email = body?.email;
    const telefon = body?.telefon;
    const eventId = body?.eventId;

    // INVARIANT: Idempotency-Key krävs (header har företräde, body som fallback).
    // Saknas → 400 + LOGGA nyckeln (lagras EJ i 6c). ADR-059 + Stripe-kanon.
    const idempotencyKey =
      req.headers.get('Idempotency-Key') ??
      (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '');
    if (!idempotencyKey) {
      console.warn(
        `[create-registration] DENY missing idempotency key | caller_user_id=${user.id}`,
      );
      return badRequest('Idempotency-Key is required (header or body)', corsHeaders);
    }
    // LOGGA nyckeln (ej lagra) — binder klient-retry till server-logg (ADR-059).
    console.log(
      `[create-registration] idempotencyKey=${idempotencyKey} | caller_user_id=${user.id}`,
    );

    // Input-validering (deny-by-default). Required: fornamn/efternamn/e-post/eventId.
    if (typeof fornamn !== 'string' || !fornamn.trim()) {
      return badRequest('fornamn is required (non-empty string)', corsHeaders);
    }
    if (typeof efternamn !== 'string' || !efternamn.trim()) {
      return badRequest('efternamn is required (non-empty string)', corsHeaders);
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return badRequest('email is required (valid email)', corsHeaders);
    }
    // telefon valfri — om angiven måste den vara en sträng.
    if (telefon != null && typeof telefon !== 'string') {
      return badRequest('telefon must be a string when provided', corsHeaders);
    }
    // eventId: Airtable-recordId-format (speglar update-record:s rec-prefix-grind).
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      return badRequest('Invalid eventId format', corsHeaders);
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields (defensiv —
    // operationen är statiskt registrerad, men null-vägen behålls för paritet).
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Hämta eventraden → EventKey ("Event-N"). null = okänt event → 404
    // (ärver get-event/get-registrations eventId-grenens 404-kontrakt).
    const eventRecord = await fetchAirtableRecord(EVENTPLANERING_TABLE, eventId);
    if (!eventRecord) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const eventKey = eventRecord.fields['EventKey'];
    if (typeof eventKey !== 'string' || !eventKey) {
      // Eventraden saknar EventKey-formelvärde — data-integritetsfel (ska ej ske;
      // EventKey är en alltid-beräknad formel). Oväntat → 500 (generic body).
      throw new Error(`Eventplanering ${eventId} saknar EventKey-formelvärde`);
    }

    // 409-dedup (affärs-unikhet): Normaliserad e-post (LOWER(TRIM), replikerad) +
    // EventKey-STRÄNGEN. FILTRERAR ALDRIG på Event-länken (T15-lärdom). Injektions-
    // säkert via buildEqualsFilter (samma builder som get-registrations).
    const normalizedEmail = email.trim().toLowerCase();
    const dupFilter = combineWithAnd([
      buildEqualsFilter('Normaliserad e-post', normalizedEmail),
      buildEqualsFilter('EventKey', eventKey),
    ]);
    const existing = await fetchFromAirtable(operation.tableId, {
      filterByFormula: dupFilter,
      fields: ['Namn'],
      maxRecords: 1,
    });
    if (existing.length > 0) {
      const existingName = scalarString(existing[0].fields['Namn']);
      console.warn(
        `[create-registration] DENY duplicate | caller_user_id=${user.id} | eventKey=${eventKey}`,
      );
      return new Response(
        JSON.stringify({
          error: 'Personen är redan anmäld till eventet',
          existingName,
          requestId,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Bygg write-fält SERVER-SIDE (endast skrivbara create-fält; formel/rollup ALDRIG).
    const fields: Record<string, unknown> = {
      Förnamn: fornamn.trim(),
      Efternamn: efternamn.trim(),
      'E-post': email.trim(),
      Källa: SOURCE_MANUAL,
      Status: STATUS_CREATE_DEFAULT,
      Inskickad: new Date().toISOString(),
      EventKey: eventKey,
      Event: [eventId], // länk-fältets NAMN är 'Event' (fldi3enUaMdbuGSlm)
    };
    if (typeof telefon === 'string' && telefon.trim()) {
      fields['Mobilnummer'] = telefon.trim();
    }

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400).
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[create-registration] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(
      `[create-registration] ALLOW | caller_user_id=${user.id} | eventKey=${eventKey} | event=${eventId}`,
    );

    const created = await createAirtableRecord(operation.tableId, fields);

    // Dubbel retur: `registration` = ren domän-shape (adaptern parse:ar denna,
    // ser aldrig Airtable-fältnamn); `record` = rå skriv-bevis (id + fields,
    // identisk form som update-record) så conformance kan asserta att EventKey +
    // Event-länk + Källa faktiskt skrevs (de ligger ej i domän-modellen).
    return new Response(
      JSON.stringify({
        registration: mapCreatedRegistration(created),
        record: { id: created.id, fields: created.fields },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-registration',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
