import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import {
  berikaPersonhistorik,
  fetchByRecordIds,
  mapRegistration,
  REGISTRATIONS_TABLE,
} from '../_shared/registration-read.ts';

/**
 * `Från formulär`-optionernas ID:n (fldCLVfJIHcuI1l83) — IdChip-radens
 * kopierbara options-ID (task-18.17 byggkrav 9, Stripe-idiomet). Airtables
 * record-API levererar select-värden som NAMN; options-ID:t finns bara i
 * schemat. Konstant-mappning här följer repo-disciplinen att fält-/options-ID:n
 * är dokumenterade schema-konstanter (data-model.md §Schema cheat sheet —
 * "kunna utföra valfri operation utan att slå upp get_table_schema"), inte
 * runtime-uppslag: ett Meta-API-anrop per request hade kostat latens och ett
 * token-scope (schema.bases:read) EF-token inte behöver ha.
 *
 * LIVE-verifierad IDENTISK i prod (app8uGPrVCVOm6LfD) och staging
 * (apphjj8Q7lkXCMsL4) 2026-07-25 — duplicerade baser delar options-ID:n.
 * Nytt/omdöpt formulär utanför mappningen → null → chippen uteblir (graciöst,
 * aldrig fel ID).
 */
const FORM_OPTION_IDS: Readonly<Record<string, string>> = {
  Huvudformulär: 'selQyiMaRVXuu7Nm5',
  Expressformulär: 'sel3AUdlVOr6398pp',
  Obekräftad: 'selUxnvOXE2l2Xm8a',
  'Anmälan-Psionautics.se': 'sel8kD62CnmERMXu0',
  'Backfill (historisk)': 'selGi1iqC3lb8MSSh',
};

// Namn-fälten för relations-batchen (medföljande-relationens BÅDA håll —
// PersonMiniKorten bär visningsnamn, aldrig record-ID:n). En projektion.
const RELATION_NAME_FIELDS = ['Namn', 'Förnamn', 'Efternamn'];

// Eventraden läses för Typ/Ort (F2) — per NAMN (ADR-050 bas-portabilitet).
const EVENTPLANERING_TABLE = 'Eventplanering';

/**
 * Visningsnamn ur en relaterad Anmälningar-rads namnfält. Basens `Namn`-formel
 * är `{Förnamn} & " " & {Efternamn}` → " " för namnlösa rader — trim-tomt
 * coercas till null (klienten äger fallbacken "Namn saknas", displayName-
 * disciplinen), aldrig en blank sträng som ser ut som data.
 */
function relationsNamn(fields: Record<string, unknown>): string | null {
  const namn = typeof fields['Namn'] === 'string' ? fields['Namn'].trim() : '';
  if (namn !== '') return namn;
  const sammansatt = [fields['Förnamn'], fields['Efternamn']]
    .filter((d): d is string => typeof d === 'string' && d.trim() !== '')
    .map((d) => d.trim())
    .join(' ');
  return sammansatt !== '' ? sammansatt : null;
}

/**
 * get-registration — per-anmälan-detaljshapen (task-18.17; S83-facit,
 * Marcus-låst 2026-07-24). Single-get-mallen (ärver get-person/get-event-
 * kontraktet: 400 Missing id · 404 { error } · 401 via requireUser) med
 * get-registrations läs-kärna ÅTERANVÄND (`_shared/registration-read.ts`) —
 * samma mapRegistration + berikaPersonhistorik, aldrig en parallell mapper.
 *
 * DETALJ-UTÖKNINGEN utöver list-shapen (fält live-verifierade mot prod-schemat
 * 2026-07-25, L294 — se RegistrationDetail.schema.ts):
 *   - `anmalanId` — basens autonummer `ID` (headerns "Anmälan #N").
 *   - `franFormular` + `franFormularId` — formulärnamnet + options-ID:t
 *     (FORM_OPTION_IDS ovan; IdChip-raden).
 *   - `fragorFunderingar` · `villkorOk` — formulärets fritext + villkors-
 *     godkännandet ("Yes"-text ⇒ true).
 *   - Event-fälten: `eventTyp` + `eventOrt` ur EVENTRADEN (F2 — anmälans egna
 *     Typ/Ort är formulärets kopior, tomma för app-skapade anmälningar;
 *     anmälans kopia är fallback) · `startdatum` · `slutdatum` · `tidKvar` ·
 *     `eventKey` (lookup/formel på Anmälningar-raden).
 *   - Deadline-formlerna: `deadlineSlutbetalning` + `dagarKvarTillDeadline`
 *     (basens fldGlznON7xqR3IE1/fldZKPoOpziYbthYF — samma start − 14-regel som
 *     18.8:s klient-härledning, här RÅ ur basen per kortets shape-beslut).
 *   - `plusOneForfraganSkickad` — tidslinjens +1-mailhändelse.
 *   - MEDFÖLJANDE-RELATIONEN BÅDA HÅLL: självlänken (`medfoljandeTill` +
 *     upplöst `medfoljandeTillNamn`) och inversen (`From field: Medföljande
 *     till` → `plusEttor` med ID + namn) — EN namn-batch för samtliga.
 *   - BAS-GAP (öppet bokfört i kortet, AT-Max/ADR-063-kandidat): `sidUrl` +
 *     `utm` kräver formulär- OCH basfält som inte finns — levereras som null
 *     (nycklarna finns så vyns rader renderas när fälten föds; ett gissat
 *     fältnamn här vore en parallell sanning).
 *
 * ANROPSBUDGET: 1 record-get + PARALLELLT (person-batch + deltagande-batch ·
 * ≤1 event-get · ≤1 relations-namn-batch) = 3–5 Airtable-anrop per request,
 * varav de oberoende körs samtidigt (INSTANT-golvet).
 *
 * ATOMICITET: record-get + batcharna är ICKE-atomära — acceptabelt för en
 * admin-läsvy, medvetet utan snapshot-isolering (get-person-disciplinen).
 */
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1) Anmälningsraden — ETT single-get (alla fält; detaljshapen läser ~30).
    //    null = 404 (single-get-mallens kontrakt: okänt ID är klient-fel).
    const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, id);
    if (!record) {
      return new Response(JSON.stringify({ error: 'Registration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const f = record.fields;

    // 2) List-shapen via den DELADE mappningen (en rad).
    const base = mapRegistration(record);

    // 3) TRE oberoende hämtningar PARALLELLT (INSTANT-golvet, ADR-078 —
    //    seriellt hade adderat deras latenser):
    //    a) person-berikningen (den delade batchen),
    //    b) EVENTRADEN för Typ/Ort (review-fynd F2: anmälans egna Typ-/Ort-
    //       fält är FORMULÄRETS kopior — create-registration skriver dem
    //       aldrig, så app-skapade anmälningar (Manuell/+1/Väntelista) har dem
    //       tomma; eventraden är sanningen när länken finns),
    //    c) namn-batchen för medföljande-relationen åt BÅDA håll (självlänken
    //       + inversen `From field: Medföljande till`).
    const plusEttIds: string[] = Array.isArray(f['From field: Medföljande till'])
      ? (f['From field: Medföljande till'] as string[])
      : [];
    const relationIds = [
      ...new Set([base.medfoljandeTill, ...plusEttIds].filter((rid): rid is string => rid != null)),
    ];
    const [, eventRecord, relationRecords] = await Promise.all([
      berikaPersonhistorik([base]),
      base.eventId != null
        ? fetchAirtableRecord(EVENTPLANERING_TABLE, base.eventId)
        : Promise.resolve(null),
      relationIds.length > 0
        ? fetchByRecordIds(REGISTRATIONS_TABLE, relationIds, RELATION_NAME_FIELDS)
        : Promise.resolve([]),
    ]);
    const namnPerId = new Map<string, string | null>();
    for (const rel of relationRecords) {
      namnPerId.set(rel.id, relationsNamn(rel.fields));
    }

    // 4) Detalj-utökningen.
    const franFormular = scalarString(f['Från formulär']);
    const registration = {
      ...base,
      anmalanId: scalarNumber(f['ID']),
      franFormular,
      franFormularId: franFormular != null ? (FORM_OPTION_IDS[franFormular] ?? null) : null,
      fragorFunderingar: f['Frågor eller funderingar?'] ?? null,
      // Basens villkorsfält är formulärets TEXT-svar ("Yes"); icke-tomt ⇒
      // godkänt. Icke-formulär-anmälningar har aldrig mött kryssrutan — vyn
      // renderar dem "Ej tillämpligt (<källa>)", aldrig ett falskt "Nej".
      villkorOk:
        typeof f['Jag har läst och godkänner villkoren och integritetspolicyn.'] === 'string' &&
        (f['Jag har läst och godkänner villkoren och integritetspolicyn.'] as string).trim() !== '',
      // Eventets Typ/Ort ur EVENTRADEN (F2); anmälans egna formulär-kopior är
      // fallback för historiska rader utan Event-länk. Ort levereras som EGET
      // detaljfält (`eventOrt`) — list-shapens `ort` förblir anmälans kopia.
      eventTyp: selectName(eventRecord?.fields['Typ']) ?? selectName(f['Typ']),
      eventOrt: scalarString(eventRecord?.fields['Ort']) ?? scalarString(f['Ort']),
      startdatum: scalarString(f['Startdatum']), // lookup (1→1) → skalär
      slutdatum: scalarString(f['Slutdatum']), // lookup (1→1) → skalär
      tidKvar: scalarString(f['Tid kvar till event (from Event)']), // lookup → skalär
      eventKey: f['EventKey'] ?? null,
      deadlineSlutbetalning: scalarString(f['Deadline slutbetalning']),
      dagarKvarTillDeadline: scalarNumber(f['Dagar kvar till deadline']),
      plusOneForfraganSkickad: f['Plus-one förfrågan skickad'] ?? null,
      medfoljandeTillNamn:
        base.medfoljandeTill != null ? (namnPerId.get(base.medfoljandeTill) ?? null) : null,
      plusEttor: plusEttIds.map((rid) => ({ id: rid, namn: namnPerId.get(rid) ?? null })),
      // BAS-GAP (AT-Max/ADR-063-kandidat, öppet bokfört i kortet): fälten
      // finns inte i basen än — null tills de föds, aldrig gissade fältnamn.
      sidUrl: null as string | null,
      utm: null as string | null,
    };

    return new Response(JSON.stringify({ registration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'get-registration',
      method: req.method,
      callerUserId: auth.user.id,
    });
  }
});
