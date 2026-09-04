import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { EMAIL_RE, skapaAnmalan } from '../_shared/create-registration.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';

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
//
// [TASK-368.4] SKRIV-KÄRNAN BOR I `_shared/create-registration.ts`. Eventuppslaget,
// 409-frågan, fält-bygget, allowlist-grinden och skrivningen flyttade dit
// OFÖRÄNDRADE (samma anrop, samma ordning, samma loggrader) så att
// `rebook-registration` kan skapa den nya anmälan via SAMMA väg i stället för
// en andra kopia. Denna fils yttre kontrakt — metod-vakt, requireUser,
// Idempotency-Key-kravet, input-valideringen och statuskoderna — är MEDVETET
// kvar här; se den modulens filhuvud för hela resonemanget.

const OPERATION_KEY = 'create-registration';

/**
 * Mappar en skapad Airtable-rad till domän-Registration (samma shape som
 * get-registrations' mapRegistration → klienten ser ALDRIG Airtable-fältnamn;
 * `RegistrationSchema.parse()` validerar i adaptern, ADR-026). Lokalt definierad:
 * under ADR-026:s ≥3-tröskel för _shared-extraktion (endast get-registrations +
 * denna; extrahera vid tredje konsument).
 *
 * `eventNamn` (TASK-363): en MANUELL/+1/väntelista-create lämnar Anmälans EGNA
 * `Vill anmäla sig till` osatt (endast webbformuläret fyller det) — formeln
 * `Event (namn)` (`{Vill anmäla sig till}`) blir därför ALLTID tom här, precis
 * som `Kurs (from Event)`-lookupen (`_shared/registration-read.ts` § eventNamn)
 * redan hanterar för läsvägen. Samma idiom här: föredra lookupen
 * `Kurs (from Event)` (eventets kanoniska kursnamn — samma källa get-person och
 * basens egen "Senaste anmälan (sammanfattning)"-formel föredrar, TASK-184) med
 * fallback till formeln, och SIST till `eventNamnFallback` — namnet EF:en redan
 * läste ur Eventplanering-posten (`Event (text)`, identisk källa som lookupen
 * pekar på) innan skrivningen, för det osannolika fallet att Airtables
 * lookup-uppdateringskedja ännu inte hunnit slå igenom i CREATE-svaret (fälla
 * 17/18, data-model.md). `??`-kedjan garanterar alltså aldrig `null` här när
 * Event-länken är satt — vilket den alltid är vid en create (`fields.Event`
 * ovan). STOPP-BESLUT (ADR-086-premisspasset): `Vill anmäla sig till` skrivs
 * INTE vid create — fältet bär en ANNAN semantik (self-reported form-claim,
 * `Eventmatchning`s PÅSTÅENDE-sida, källa för `Antal tidigare genomförda
 * utbildningar`-rollupen på Personer) än "eventets namn", se PR-beskrivningen.
 */
function mapCreatedRegistration(
  record: { id: string; fields: Record<string, unknown> },
  eventNamnFallback: string | null,
) {
  const f = record.fields;
  return {
    id: record.id,
    namn: f['Namn'] ?? null, // formula
    fornamn: f['Förnamn'] ?? null, // text
    efternamn: f['Efternamn'] ?? null, // text
    email: f['E-post'] ?? null, // text
    telefon: f['Mobilnummer'] ?? null, // text
    eventNamn: scalarString(f['Kurs (from Event)']) ?? f['Event (namn)'] ?? eventNamnFallback ?? null,
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
    const antalPlatser = body?.antalPlatser;
    const notering = body?.notering;
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
    // antalPlatser valfri (facit-formen skickar den alltid, default 1; modalen
    // utelämnar den). Om angiven: positivt HELTAL ≥ 1 (basens number, precision 0).
    if (antalPlatser != null) {
      if (
        typeof antalPlatser !== 'number' ||
        !Number.isInteger(antalPlatser) ||
        antalPlatser < 1
      ) {
        return badRequest('antalPlatser must be a positive integer when provided', corsHeaders);
      }
    }
    // notering valfri — om angiven måste den vara en sträng (multilineText).
    if (notering != null && typeof notering !== 'string') {
      return badRequest('notering must be a string when provided', corsHeaders);
    }
    // eventId: Airtable-recordId-format (speglar update-record:s rec-prefix-grind).
    if (typeof eventId !== 'string' || !eventId.startsWith('rec')) {
      return badRequest('Invalid eventId format', corsHeaders);
    }

    const utfall = await skapaAnmalan(
      {
        fornamn,
        efternamn,
        email,
        telefon: typeof telefon === 'string' ? telefon : null,
        antalPlatser: typeof antalPlatser === 'number' ? antalPlatser : null,
        notering: typeof notering === 'string' ? notering : null,
        eventId,
      },
      '[create-registration]',
      user.id,
    );

    if (!utfall.ok) {
      if (utfall.kod === 'okand_operation') {
        return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
      }
      if (utfall.kod === 'event_saknas') {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (utfall.kod === 'dubblett') {
        return new Response(
          JSON.stringify({
            error: 'Personen är redan anmäld till eventet',
            existingName: utfall.befintligtNamn,
            requestId,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      return badRequest(
        `Field "${utfall.falt}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    // Dubbel retur: `registration` = ren domän-shape (adaptern parse:ar denna,
    // ser aldrig Airtable-fältnamn); `record` = rå skriv-bevis (id + fields,
    // identisk form som update-record) så conformance kan asserta att EventKey +
    // Event-länk + Källa faktiskt skrevs (de ligger ej i domän-modellen).
    return new Response(
      JSON.stringify({
        registration: mapCreatedRegistration(utfall.record, utfall.eventNamnFallback),
        record: { id: utfall.record.id, fields: utfall.record.fields },
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
