import {
  fetchFromAirtable,
  updateAirtableRecord,
  upsertAirtableRecord,
} from '../_shared/airtable-client.ts';
import { buildEqualsFilter } from '../_shared/airtable-filter.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { lookupCourseDimensions } from '../_shared/course-dimensions.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { deriveManadAr } from '../_shared/event-map.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  avgorPlatsLank,
  harRedanPlats,
  PLATS_UPPSLAG_MAX_RECORDS,
  type PlatsLankning,
} from '../_shared/plats-uppslag.ts';

// create-event — skapar ett NYTT event i Eventplanering (Fas 6f, ADR-066). Repots
// tredje write-vertikal; speglar create-registration (6c L4) + save-segment (6g L3)
// EXAKT i säkerhets-kontraktet: POST→405, requireUser→401, body-JSON-fel→400,
// allowlist-SSOT via field-allowlists.ts (deny→400), {error}+requestId, central
// mapErrorToResponse.
//
// FÄLT-SHAPE byggs SERVER-SIDE ur typade inputs — klienten skickar ALDRIG en rå
// `fields`-map. Endast live-belagda skrivbara create-fält (data-model.md
// § Eventplanering create-fält). System-genererade fält sätts ALDRIG: EventKey
// (formel "Event-" & {Event-nr}) + Event-nr (autoNumber) FÖDS vid skapande; spegel-/
// länk-fält (Anmälningar/Närvaro) sätts från motsatt sida (A1/A3) — ett nyfött event
// har noll. `Månad/år` härleds ur Startdatum (ADR-066 b6 — basens manuella singleSelect
// är en designbrist, §Kända fällor 36; vi route-around:ar den server-side).
//
// PUBLICERINGSFLAGGAN (task-19.4, ADR-066-tillägget): den VALFRIA boolean-inputen
// `publicera` armerar checkbox-fältet `Publicerad på miranon.se`. Armerat → fältet läggs
// i fields-mapen som `true`; OARMERAT → fältet UTELÄMNAS helt (se fields-bygget nedan).
// Vad flaggan STYR på miranon.se (kalender-synlighet, anmälningsformulär, event-sida) är
// T79:s kontrakt — EF:en bär bara flaggan. Prod-fältet måste finnas FÖRE prod-deploy.
//
// BASDIMENSIONERNA (TASK-249.4, ADR-115): Kursfamilj/Kursnivå härleds SERVER-SIDE ur
// `event`-kursnamnet via `_shared/course-dimensions.ts`s kursnamnsmappning (EXAKT samma
// mappning som redan kört backfillen, data-model.md § "Staging- och prodbasens additiva
// tillskott 2026-08-17"). Känt kursnamn → BÅDA/Kursfamilj-ensam sätts (nivålösa familjer
// bär ingen Kursnivå — TOMT per design). Okänt kursnamn → BÅDA fälten UTELÄMNAS (ingen
// gissad familj) och en varning loggas (öppet, aldrig tyst — samma disciplin som
// OkandaKurser-mönstret i prototypen, VariantD.tsx). Detta stänger den dokumenterade
// skapelseväg-kanten: "skapelsevägarna sätter INTE fälten än" (data-model.md, samma
// sektion) — nya event föds aldrig utan familj när kursnamnet är känt.
//
// ORT-TILL-PLATS (TASK-309.30, ADR-125 § 2): eventets `Ort` slås upp mot
// Platser-tabellens `Namn` och `Plats`-länken sätts när EXAKT EN rad matchar.
// Ingen klient-input, ingen formändring — en HÄRLEDNING i samma anda som
// Eventinnehålls "Event × Typ, ingen länk" och som `Månad/år` ovan. Noll eller
// flera träffar → länken lämnas TOM och skälet loggas öppet (aldrig en gissad
// plats; `Platser.Namn` kan strukturellt inte tvingas unik, se
// `_shared/plats-uppslag.ts` § VARFÖR "EXAKT EN TRÄFF" ÄR HELA REGELN).
//
// ORDNINGEN ÄR INVARIANTEN: `Plats` läggs ALDRIG i upsertens fields-map. En
// upsert som bar fältet hade vid en IDEMPOTENT REPLAY patchat en befintlig rad
// och därmed kunnat skriva över en Plats som satts för hand efter det första
// anropet — precis den felklass publiceringsflaggans utelämnings-mönster redan
// bokför för checkboxen. I stället: upsert utan `Plats`, och DÄREFTER en
// separat PATCH som bara körs när den upsertade raden faktiskt saknar länk.
// En nyfödd rad har per definition ingen; en replayad rad som bär en behåller
// den (`skal: 'redan-satt'`).
//
// Utfallet bärs ut i svarets `platsLankning` ({ satt, platsId, skal }) så
// beteendet är OBSERVERBART för anroparen och för conformance-testet, inte
// bara synligt i en serverlogg. Klienten är oberörd: adaptern parse:ar enbart
// `data.event` (AirtableAdapter.createEvent), och zod strippar okända nycklar.
// Ett fel i uppslaget eller i PATCH:en fäller ALDRIG skapandet — eventet är
// redan skrivet, och en härledning får inte kosta Lotta hennes event
// (`skal: 'uppslag-fel'`, öppet loggat).
//
// VALIDERING (manuell deny-by-default): speglar create-registration/save-segment som
// validerar manuellt, INTE via Zod — Zod används bara i klient-/adapter-lagret (ADR-026),
// inte i EF-request-vägen. Kodbas-konsistens > abstrakt schema-kanon (samma princip som
// Idempotency-Key-transporten nedan).
//
// IDEMPOTENS (ADR-066 b3 + Stripe/IETF-semantik): klient-UUID i Idempotency-Key
// (header har företräde, body som fallback — speglar create-registration EXAKT).
// MEKANISM: Airtable-nativ upsert (performUpsert.fieldsToMergeOn:['Idempotensnyckel'])
// → match-or-create i ETT atomiskt server-anrop. Färsk nyckel → nytt event (201);
// samma nyckel (retry) → matchad rad (200, samma record-ID). INGEN 409-affärs-dedup:
// två event samma dag/ort är legitima — idempotensen är ren retry-säkerhet via nyckeln,
// inte affärs-unikhet (till skillnad mot create-registrations e-post+EventKey-409).

const OPERATION_KEY = 'create-event';
const MERGE_FIELD = 'Idempotensnyckel';
const STATUS_CREATE_DEFAULT = 'Planerat';
// PUBLICERINGSFLAGGAN (task-19.4, ADR-066-tillägget) — EXAKT Airtable-fältnamnet
// (checkbox, staging `fldyJKnJCP1brHwL6`). Skapa-sidans dra-till-bekräfta-handtag
// armerar den; vad flaggan STYR på miranon.se är T79:s kontrakt, inte EF:ens.
const PUBLICERAD_FIELD = 'Publicerad på miranon.se';

// ORT-TILL-PLATS (TASK-309.30) — Platser-tabellen adresseras per NAMN
// (ADR-050 bas-portabilitet, samma form som save-place-standard/get-places),
// `Namn` är dess primärfält och `Plats` är Eventplanerings länkfält dit.
const PLATSER_TABLE = 'Platser';
const PLATSER_NAMN_FIELD = 'Namn';
const PLATS_LINK_FIELD = 'Plats';

// UUID v4-format (samma form som crypto.randomUUID() genererar klient-side).
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// ISO-datum YYYY-MM-DD (Airtable date-fält-form; samma anda som create-registrations
// pragmatiska format-grindar — exakt kalender-validitet vilar på Airtable).
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mappar en skapad/matchad Eventplanering-rad till domän-Event (samma anda som
 * get-event:s mapEvent → klienten ser ALDRIG Airtable-fältnamn; adaptern parse:ar
 * i L2, ADR-026). Bär de system-genererade `eventKey`/`eventNr` som ADR-066 b4
 * vill visa i UI:t (servern tilldelar dem → pessimistisk create slipper temp-id).
 */
function mapCreatedEvent(record: { id: string; fields: Record<string, unknown> }) {
  const f = record.fields;
  return {
    id: record.id,
    eventlabel: f['Eventlabel'] ?? null, // formula (primary)
    eventNamn: selectName(f['Event (source)']), // singleSelect
    typ: selectName(f['Typ']), // singleSelect
    ort: scalarString(f['Ort']), // text
    startdatum: f['Startdatum'] ?? null, // date
    slutdatum: f['Slutdatum'] ?? null, // date
    manadAr: selectName(f['Månad/år']), // singleSelect (härlett)
    maxPlatser: scalarNumber(f['Max antal platser']), // number
    status: selectName(f['Status'] ?? null), // singleSelect
    eventKey: f['EventKey'] ?? null, // formula "Event-N" (system-genererad)
    eventNr: scalarNumber(f['Event-nr']), // autoNumber (system-genererad)
  };
}

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
    const body = (await req.json()) as Record<string, unknown> | null;
    const event = body?.event;
    const typ = body?.typ;
    const ort = body?.ort;
    const startdatum = body?.startdatum;
    const slutdatum = body?.slutdatum;
    const maxPlatser = body?.maxPlatser;
    const status = typeof body?.status === 'string' && body.status.trim() ? body.status : STATUS_CREATE_DEFAULT;
    const eventtyp = body?.eventtyp;
    const publicera = body?.publicera;

    // INVARIANT: Idempotency-Key krävs (header har företräde, body som fallback —
    // create-registration-mönstret). Saknas → 400. Format: UUID v4 (non-empty).
    const idempotencyKey =
      req.headers.get('Idempotency-Key') ??
      (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '');
    if (!idempotencyKey) {
      console.warn(`[create-event] DENY missing idempotency key | caller_user_id=${user.id}`);
      return badRequest('Idempotency-Key is required (header or body)', corsHeaders);
    }
    if (!UUID_V4_RE.test(idempotencyKey)) {
      console.warn(`[create-event] DENY malformed idempotency key | caller_user_id=${user.id}`);
      return badRequest('Idempotency-Key must be a UUID v4', corsHeaders);
    }

    // Input-validering (deny-by-default). Required: event/typ/ort/startdatum/slutdatum/
    // maxPlatser/eventtyp. status default 'Planerat'.
    if (typeof event !== 'string' || !event.trim()) {
      return badRequest('event is required (non-empty string)', corsHeaders);
    }
    if (typeof typ !== 'string' || !typ.trim()) {
      return badRequest('typ is required (non-empty string)', corsHeaders);
    }
    if (typeof ort !== 'string' || !ort.trim()) {
      return badRequest('ort is required (non-empty string)', corsHeaders);
    }
    if (typeof startdatum !== 'string' || !ISO_DATE_RE.test(startdatum)) {
      return badRequest('startdatum is required (ISO YYYY-MM-DD)', corsHeaders);
    }
    if (typeof slutdatum !== 'string' || !ISO_DATE_RE.test(slutdatum)) {
      return badRequest('slutdatum is required (ISO YYYY-MM-DD)', corsHeaders);
    }
    if (typeof maxPlatser !== 'number' || !Number.isFinite(maxPlatser) || maxPlatser < 0) {
      return badRequest('maxPlatser is required (non-negative number)', corsHeaders);
    }
    // eventtyp KRÄVS vid create (ADR-066 b5, GREN A) — driver Sessionsmall-lookupen.
    // Eventformat-record-ID (rec-prefix, speglar create-registrations eventId-grind).
    if (typeof eventtyp !== 'string' || !eventtyp.startsWith('rec')) {
      return badRequest('eventtyp is required (Eventformat record-ID, rec-prefix)', corsHeaders);
    }
    // publicera är VALFRI (task-19.4) — frånvaro = oarmerad flagga. Närvarande men av
    // fel typ är däremot ett klient-fel (deny-by-default: ingen coercion av 'ja'/1).
    if (publicera !== undefined && typeof publicera !== 'boolean') {
      return badRequest('publicera must be a boolean when present', corsHeaders);
    }

    // Allowlist-SSOT: hämta operationens tableId + allowedFields.
    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
    }

    // Bygg write-fält SERVER-SIDE — endast skrivbara create-fält. System-genererade
    // (EventKey/Event-nr) + spegel/länk (Anmälningar/Närvaro) sätts ALDRIG. Månad/år
    // härleds ur Startdatum (ADR-066 b6). Eventtyp → single-element link-array
    // (fldCAGA9NPnd9kEmi, prefersSingleRecordLink). Idempotensnyckel → merge-nyckeln.
    const fields: Record<string, unknown> = {
      'Event (source)': event.trim(),
      Typ: typ.trim(),
      Ort: ort.trim(),
      Startdatum: startdatum,
      Slutdatum: slutdatum,
      // Härlett server-side ur Startdatum (ADR-066 b6) via _shared/event-map.ts.
      // Basens options-lista är ändlig (Nov 2025 – Dec 2026); ett datum utanför
      // den FELAR (typecast:false → 500) i stället för att tyst skapa en option —
      // medvetet, §Kända fällor 36 + 45. Maximerings-kandidat T16.
      'Månad/år': deriveManadAr(startdatum),
      'Max antal platser': maxPlatser,
      Status: status,
      Eventtyp: [eventtyp],
      [MERGE_FIELD]: idempotencyKey,
    };

    // PUBLICERINGSFLAGGAN (task-19.4): fältet läggs in ENDAST när handtaget är armerat.
    // `fields` är en TÄT map — ett inskrivet `false`/`undefined` SÄTTER fältet (och skulle
    // vid en idempotent replay dessutom kunna nolla en flagga som satts i basen). Att
    // UTELÄMNA nyckeln är därför enda korrekta formen för "lämnar flaggan osatt".
    if (publicera === true) {
      fields[PUBLICERAD_FIELD] = true;
    }

    // BASDIMENSIONERNA (TASK-249.4): känt kursnamn → Kursfamilj sätts alltid, Kursnivå
    // sätts endast för nivåbärande familjer (RIM). Okänt kursnamn → BÅDA UTELÄMNADE ur
    // fields-mapen (aldrig en gissad familj skriven på en ny rad) + öppen server-logg.
    const kursdimensioner = lookupCourseDimensions(event.trim());
    if (kursdimensioner) {
      fields['Kursfamilj'] = kursdimensioner.kursfamilj;
      if (kursdimensioner.kursniva !== null) {
        fields['Kursnivå'] = kursdimensioner.kursniva;
      }
    } else {
      console.warn(
        `[create-event] Kursnamn utanför kursnamnsmappningen — Kursfamilj/Kursnivå UTELÄMNADE | caller_user_id=${user.id} | event=${event.trim()}`,
      );
    }

    // SSOT-grind: varje server-byggt fält måste vara på operationens allowlist
    // (defense-in-depth mot framtida kod-drift; deny → 400). 'Idempotensnyckel' ÄR
    // allowlistad — annars skulle vår egen merge-skrivning fällas här.
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[create-event] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    console.log(
      `[create-event] ALLOW | caller_user_id=${user.id} | idempotencyKey=${idempotencyKey} | event=${event.trim()}`,
    );

    // ORT-TILL-PLATS, steg 1 (TASK-309.30): uppslaget startar PARALLELLT med
    // upserten — de är helt oberoende anrop, och en härledning ska inte kosta
    // Lotta en extra round-trip i den skarpa skapa-vägen. Hela uttrycket ligger
    // i en egen try/catch: `buildEqualsFilter` kan kasta SYNKRONT (kontroll-/
    // bidi-tecken i orten) och skulle då aldrig nå en `.catch()` på promisen.
    // `null` = uppslaget gav inget svar att lita på, aldrig "noll träffar".
    const platsUppslag: Promise<{ id: string }[] | null> = (async () => {
      try {
        return (await fetchFromAirtable(PLATSER_TABLE, {
          filterByFormula: buildEqualsFilter(PLATSER_NAMN_FIELD, ort.trim()),
          maxRecords: PLATS_UPPSLAG_MAX_RECORDS,
          fields: [PLATSER_NAMN_FIELD],
        })) as { id: string }[];
      } catch (error) {
        console.warn(
          `[create-event] Plats-uppslaget fallerade, Plats LÄMNAS TOM | caller_user_id=${user.id} | ort=${ort.trim()} | fel=${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
    })();

    // IDEMPOTENS-MEKANISM: upsert på 'Idempotensnyckel'. Färsk nyckel → createdRecords
    // (nytt event); samma nyckel → updatedRecords (idempotent replay, samma rad).
    const { record, created } = await upsertAirtableRecord(operation.tableId, fields, [MERGE_FIELD]);

    // ORT-TILL-PLATS, steg 2: länka EFTER upserten. Ordningen är invarianten —
    // se filhuvudet § ORT-TILL-PLATS. Startvärdet är 'uppslag-fel' eftersom det
    // är precis vad ett `null`-uppslag betyder.
    const platsTraffar = await platsUppslag;
    let platsLankning: PlatsLankning = { satt: false, platsId: null, skal: 'uppslag-fel' };
    // Radens fält som svaret ska bära. PATCH:ens svar returnerar hela raden,
    // men vi LÄGGER den ovanpå upsertens i stället för att ersätta den: den
    // enda skillnaden är `Plats`, och ett överlägg kan strukturellt inte tappa
    // ett fält (EventKey/Event-nr/Månad/år) som conformance-testet läser.
    let svarsFields: Record<string, unknown> = record.fields;

    if (platsTraffar !== null) {
      const beslut = avgorPlatsLank(platsTraffar);
      if (!beslut.lanka) {
        // Noll eller flera träffar: TOM länk, öppet loggat. Aldrig en gissning.
        platsLankning = { satt: false, platsId: null, skal: beslut.skal };
        console.log(
          `[create-event] Plats EJ länkad | caller_user_id=${user.id} | record=${record.id} | ort=${ort.trim()} | skal=${beslut.skal}`,
        );
      } else if (harRedanPlats(record.fields)) {
        // Idempotent replay mot en rad som redan bär en Plats. RÖRS ALDRIG —
        // en manuellt satt plats vinner alltid över härledningen.
        platsLankning = { satt: false, platsId: null, skal: 'redan-satt' };
        console.log(
          `[create-event] Plats redan satt, lämnas orörd | caller_user_id=${user.id} | record=${record.id}`,
        );
      } else {
        const platsFields: Record<string, unknown> = { [PLATS_LINK_FIELD]: [beslut.platsId] };
        // Samma SSOT-grind som fields-mapen ovan: skrivningen gates:as mot
        // operationens allowlist FÖRE Airtable-anropet.
        const disallowedPlats = findDisallowedField(operation, platsFields);
        if (disallowedPlats !== null) {
          console.warn(
            `[create-event] DENY field not in allowlist (plats) | caller_user_id=${user.id} | field=${disallowedPlats}`,
          );
        } else {
          try {
            const uppdaterad = await updateAirtableRecord(
              operation.tableId,
              record.id,
              platsFields,
            );
            svarsFields = { ...record.fields, ...uppdaterad.fields };
            platsLankning = { satt: true, platsId: beslut.platsId, skal: 'exakt-en-traff' };
            console.log(
              `[create-event] Plats länkad | caller_user_id=${user.id} | record=${record.id} | ort=${ort.trim()} | plats=${beslut.platsId}`,
            );
          } catch (error) {
            // Eventet ÄR skapat. Ett fel i härledningen får aldrig göra om det
            // till ett misslyckat skapande som klienten retryar.
            console.warn(
              `[create-event] Plats-länkningen fallerade, eventet skapades ändå | caller_user_id=${user.id} | record=${record.id} | plats=${beslut.platsId} | fel=${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }
    }

    const svarsRecord = { id: record.id, fields: svarsFields };

    // Dubbel retur: `event` = ren domän-shape (adaptern parse:ar denna i L2); `record` =
    // rå skriv-bevis (id + fields) så staging-testet kan asserta att EventKey/Event-nr
    // genererades, Månad/år härleddes och Eventtyp sattes (create-registration-mönstret).
    // 201 vid create, 200 vid idempotent replay (samma nyckel → matchad, inget skapades).
    //
    // `platsLankning` (TASK-309.30) är det TREDJE, additiva fältet: härledningens
    // utfall gjort OBSERVERBART. Klienten rör det inte (AirtableAdapter.createEvent
    // parse:ar enbart `data.event`, och zod strippar okända nycklar) — det finns för
    // conformance-testet och för den som läser ett svar i felsökning.
    return new Response(
      JSON.stringify({
        event: mapCreatedEvent(svarsRecord),
        record: svarsRecord,
        created,
        platsLankning,
      }),
      {
        status: created ? 201 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'create-event',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
