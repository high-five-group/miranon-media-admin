// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande). Mönster: `hantera-inbetalning`
// (ETT EF, `atgard`-fältet väljer gren) + `send-registration-confirmation`
// (Airtable Status-flip via allowlist-SSOT, samma tabell).
//
// cancel-registration — TASK-368.2, PRD TASK-368 beslut 1/3/4. Serverkontraktet
// anmälans sida (TASK-368.3) bygger på: appen kan sätta en aktiv anmälan till
// "Avbokad/Ombokad" med ett frivilligt skäl, och sätta tillbaka en avbokad
// anmälan till rätt status, härledd ur bekräftelsedatumet.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR ETT EF OCH INTE TVÅ (motivering, uppdraget bad om ett öppet val)
// ═══════════════════════════════════════════════════════════════════════════
// `hantera-inbetalning` är den etablerade precedensen för "en operation, två
// motsatta handlingar på samma entitet, ett `atgard`-fält": radera/makulera
// delar exakt den formen avboka/aterta har här (samma entitet, motsatta
// riktningar, ett gemensamt efterarbete). Två separata EF:er hade dubblicerat
// hela säkerhets-/läs-/logg-kroppen för en skillnad som ryms i EN
// if-gren (`beslutaCancelOvergang`), och hade krävt två poster i
// `.prod-functions-allowlist.conf`/`ef-metod-vakt.test.ts` för samma
// affärshändelse. `atgard` är dessutom redan Zod-typad som en sluten union
// (`CancelRegistrationAtgard`), så klienten kan inte skicka något tredje
// värde.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR AKTIVITETSLOGGEN SKRIVS SERVER-SIDE (avsteg från bekräftelse-
// vertikalens klient-mönster)
// ═══════════════════════════════════════════════════════════════════════════
// `send-registration-confirmation` loggar INTE server-side — klienten
// (`registrationConfirmation.ts`) anropar `recordActivity` EFTER ett lyckat
// svar. Denna EF gör tvärtom och följer i stället betalningsdomänens mönster
// (`registrera-inbetalning`/`hantera-inbetalning` + `_shared/aktivitetslogg.ts`
// + `_shared/betalningar-db.ts`s `skrivAktivitet`): servern utför HELA
// handlingen (läser status, beslutar, skriver Status+Notering, loggar) i en
// enda serverberäkning, med den redan-verifierade anroparen i handen. Två
// fördelar väger tyngre än att avvika från bekräftelse-precedensen: (1) en
// framtida anropare (ett script, en annan yta) kan aldrig glömma att logga —
// loggningen är inte klientens ansvar; (2) `skrivAktivitet` är BEST-EFFORT
// och fäller aldrig handlingen (samma disciplin som betalningsdomänen), så en
// trasig logg-skrivning aldrig kan få Lotta att tro att avbokningen
// misslyckades när Airtable-skrivningen redan lyckats.
//
// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENS UTAN EN SEPARAT NYCKEL (AC #4)
// ═══════════════════════════════════════════════════════════════════════════
// Till skillnad mot `send-registration-confirmation`/`create-registration`
// (som kräver en klient-genererad `Idempotency-Key` för att dedupa en
// SIDOEFFEKT-bärande handling, mail respektive en NY rad) är avbokning en
// STATUS-ÖVERGÅNG på en BEFINTLIG rad: statusen ÄR sitt eget idempotens-
// facit. Ett andra identiskt anrop läser samma status som facit och
// AVVISAS av exakt samma övergångskontroll som en genuint ogiltig övergång
// (`beslutaCancelOvergang` → `redan_avbokad`/`inte_avbokad`, 409) — ingen
// Airtable-skrivning, ingen loggrad. Ingen egen idempotensnyckel-mekanik
// behövs eller byggs.
//
// ═══════════════════════════════════════════════════════════════════════════
// RACE-FÖNSTRET (känd, delad gräns — ingen ny brist)
// ═══════════════════════════════════════════════════════════════════════════
// Läsningen (fetchAirtableRecord) och skrivningen (updateAirtableRecord) är
// TVÅ separata Airtable-anrop utan optimistic-concurrency-token — Airtables
// REST-API har ingen sådan mekanism (`docs/reference/airtable-constraints.md`
// §A). Två samtidiga anrop mot SAMMA anmälan kan därför i teorin båda passera
// övergångskontrollen innan någon hunnit skriva. Detta är EXAKT samma gräns
// `send-registration-confirmation`/`create-registration`/`betalningar-bas.ts`s
// `skrivSpegel` redan lever med (ingen av dem har en Airtable-sida
// compare-and-swap) — ingen ny brist introduceras här, och att bygga en
// egen låsmekanism för just denna EF hade varit spekulativ komplexitet
// ovanför den golvnivå resten av skrivvägen håller.

import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import {
  AKTIVITETSTYP,
  ANMALAN_VERB,
  anmalanObjektId,
  byggStatement,
  lasVisningsnamnUrJwt,
} from '../_shared/aktivitetslogg.ts';
import { requireUser } from '../_shared/auth.ts';
import {
  appendNotering,
  beslutaCancelOvergang,
  byggNoteringsrad,
  type CancelAtgard,
  stockholmDatum,
} from '../_shared/cancel-registration.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { skapaAdminKlient, skrivAktivitet } from '../_shared/betalningar-db.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';

const LOGG = '[cancel-registration]';
const OPERATION_KEY = 'cancel-registration';
const REGISTRATIONS_TABLE = 'Anmälningar';
const ATGARDER: readonly CancelAtgard[] = ['avboka', 'aterta'];
/** Speglar `create-registration`/`betalningar-bas.ts`s rec-ID-form. */
const REC_ID_RE = /^rec[A-Za-z0-9]{14}$/;
/** Samma tak som `hantera-inbetalning`s makulerings-skäl och `inbetalning-
 * notering.ts`s `NOTERING_MAX_LANGD` — ett skäl utan innehåll är inget skäl,
 * och taket skyddar mot en oavsiktligt enorm inklistring. */
const SKAL_MAX_LANGD = 500;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  // METOD-VAKTEN FÖRE AUTH (repots kontrakt, `tests/api/ef-metod-vakt.test.ts`):
  // fel metod är ett kontraktsfel, inte ett auth-fel.
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  const authHeader = req.headers.get('Authorization');
  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  const atgard = body?.atgard;
  if (typeof atgard !== 'string' || !ATGARDER.includes(atgard as CancelAtgard)) {
    return badRequest(`atgard måste vara en av: ${ATGARDER.join(', ')}`, corsHeaders);
  }

  const registrationId = body?.registrationId;
  if (typeof registrationId !== 'string' || !REC_ID_RE.test(registrationId)) {
    return badRequest(
      'registrationId krävs (Anmälningar record-ID, rec-prefix + 14 tecken)',
      corsHeaders,
    );
  }

  // Skälet är FRIVILLIGT för BÅDA riktningarna (uppdraget, beslut 3/4).
  // Frånvaro/null/tom sträng blir alla samma sak: ingen skältext på raden.
  let skal: string | null = null;
  if (body?.skal !== undefined && body?.skal !== null) {
    if (typeof body.skal !== 'string') {
      return badRequest('skal måste vara text när det anges', corsHeaders);
    }
    const trimmat = body.skal.trim();
    if (trimmat.length > SKAL_MAX_LANGD) {
      return badRequest(`Skälet får vara högst ${SKAL_MAX_LANGD} tecken.`, corsHeaders);
    }
    skal = trimmat === '' ? null : trimmat;
  }

  const operation = getOperation(OPERATION_KEY);
  if (!operation) {
    return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
  }

  try {
    const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, registrationId);
    if (!record) {
      return jsonResponse({ error: `Anmälan hittades inte: ${registrationId}` }, 404, corsHeaders);
    }
    const f = record.fields;
    const aktuellStatus = selectName(f['Status'] ?? null);
    const bekraftelseSkickad = scalarString(f['Bekräftelse skickad'] ?? null);
    const befintligNotering = scalarString(f['Notering'] ?? null);
    const fornamn = scalarString(f['Förnamn']) ?? '';
    const efternamn = scalarString(f['Efternamn']) ?? '';
    const namn = `${fornamn} ${efternamn}`.trim() || registrationId;

    const beslut = beslutaCancelOvergang(atgard as CancelAtgard, aktuellStatus, bekraftelseSkickad);
    if (!beslut.ok) {
      // 409, inte 400: registrationId och atgard är BÅDA giltig indata — det
      // är anmälans NUVARANDE TILLSTÅND som gör övergången otillåten
      // (samma klassning som `hantera-inbetalning`s `redan_makulerad`/
      // `kvitto_finns`). Samma gren fångar idempotensen (AC #4): ett andra
      // identiskt anrop läser samma status och avvisas HÄR, före både
      // Airtable-skrivningen och loggningen.
      console.warn(
        `${LOGG} DENY ${beslut.kod} | caller_user_id=${user.id} | registrationId=${registrationId} | ` +
          `atgard=${atgard} | status=${aktuellStatus ?? 'null'}`,
      );
      return jsonResponse({ error: beslut.felmeddelande, code: beslut.kod }, 409, corsHeaders);
    }

    const nu = new Date();
    const datum = stockholmDatum(nu);
    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;
    const nyRad = byggNoteringsrad(atgard as CancelAtgard, datum, visningsnamn, skal);
    const nyNotering = appendNotering(befintligNotering, nyRad);

    const fields: Record<string, unknown> = {
      Status: beslut.nyStatus,
      Notering: nyNotering,
    };

    // SSOT-grind (defense-in-depth): varje server-byggt fält måste vara
    // allowlistat INNAN Airtable-anropet.
    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `${LOGG} DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      return badRequest(
        `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
        corsHeaders,
      );
    }

    // ── Steg 1: basen (Status + Notering, EN Airtable-PATCH) ──────────────
    await updateAirtableRecord(operation.tableId, registrationId, fields);

    // ── Steg 2: aktivitetsloggen (best-effort, EFTER lyckad basskrivning,
    // ALDRIG före — se `skrivAktivitet`s eget filhuvud) ───────────────────
    const db = skapaAdminKlient();
    const verb = atgard === 'avboka' ? ANMALAN_VERB.avbokade : ANMALAN_VERB.atertogAvbokning;
    await skrivAktivitet(
      db,
      byggStatement({
        statementId: crypto.randomUUID(),
        requestId,
        actorAccountId: user.id,
        actorName: visningsnamn,
        // INGET SKÄL I LOGGEN — se `ANMALAN_VERB`s eget filhuvud
        // (`_shared/aktivitetslogg.ts`).
        verb,
        objektId: anmalanObjektId(registrationId),
        objektNamn: namn,
        aktivitetstyp: AKTIVITETSTYP.anmalan,
        timestamp: nu.toISOString(),
      }),
    );

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `registrationId=${registrationId} | atgard=${atgard} | nyStatus=${beslut.nyStatus}`,
    );

    return jsonResponse(
      {
        atgard,
        registrationId,
        status: beslut.nyStatus,
        notering: nyNotering,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: OPERATION_KEY,
      method: req.method,
      callerUserId: user.id,
    });
  }
});
