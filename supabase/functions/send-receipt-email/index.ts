// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-action-email/index.ts och
// generate-event-attachment/index.ts.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@6';
import {
  createAirtableRecord,
  deleteAirtableRecord,
  fetchAirtableRecord,
  fetchFromAirtable,
  updateAirtableRecord,
} from '../_shared/airtable-client.ts';
import { BILAGOR_BUCKET_ID, buildAttachmentPath, toBase64 } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
// [TASK-309.5] byggKvittoData + renderaMallPdf ERSÄTTER kvittoRader +
// renderKvittoPdf (pdf-lib, `_shared/receipt-pdf.ts`, nu RIVEN) — samma
// renderare (`_shared/mall-render.ts`, Eta + DocRaptor) som
// bekräftelsebilagan/deltagarinformationen, delad med preview-receipt/
// index.ts (klass C:s sidoeffektsfria förhandsvisning), i stället för att
// duplicera renderar-anropen. Se `_shared/receipt-content.ts`:s filhuvud
// för hela historiken.
import { byggKvittoData } from '../_shared/mall-data.ts';
import { renderaMallPdf } from '../_shared/mall-render.ts';
import type { KvittoLedgerEntry, ReceiptAllocationDeps } from '../_shared/receipt-numbering.ts';
import { isUtskickSparrat, NonProdAddressError, UtskickSparratError } from '../_shared/send-bulk.ts';
import {
  BETALSATT_VARDEN,
  type Betalning,
  type Betalsatt,
  type ReceiptDraftCleaner,
  type ReceiptFinalizer,
  type ReceiptPdfBuilder,
  type ReceiptSender,
  sendReceipt,
} from '../_shared/send-receipt.ts';
// [TASK-302.3, ADR-124] Städar det transienta förhandsgransknings-utkastet
// EFTER lyckad sändning — se makeRealDraftCleaner nedan.
import { rensaUtkast } from '../_shared/utkast.ts';

// send-receipt-email — kvittoserien (TASK-147.7, ADR-109).
//
// EN mottagare, EN betalning per anrop (se _shared/send-receipt.ts filhuvud
// för varför — INTE en femte `send-action-email`-åtgärdstyp). Triggas av
// "Skicka kvitto"-knappen i `BetalningsSkrivYta` § `SkrivRad`
// (AtgardsSida.tsx), synlig ENDAST när en betalning redan är markerad
// Mottagen (den AKTIVA-handling-regeln, Marcus-beslut a: kvittot är ALDRIG
// automatik).
//
// MOTTAGAREN LÖSES SERVER-SIDE (samma "kan aldrig komma från klienten"-
// princip som send-action-email/index.ts): klienten skickar registrationId +
// eventId, adress/namn läses ur Airtable här.
//
// BELOPP OCH BETALSÄTT ÄR KLIENT-BURNA, MEDVETET (ANNAN princip än adress/
// namn): basen har INGET prisfält (varken på Anmälningar eller
// Eventplanering — verifierat mot data-model.md 2026-08-10, ADR-086
// premiss-pass, se ADR-109 § Öppna punkter). Lotta skriver in vad hon
// FAKTISKT mottog — samma "aktiv handling, ingen gissning"-linje som
// beslut (a). `betalsatt` är en closed enum (Swish/Bankgiro/Plusgiro,
// beslut a); `belopp` valideras som ett positivt tal.
const OPERATION_KEY = 'create-receipt';
const REGISTRATIONS_TABLE = 'Anmälningar';
const EVENTS_TABLE = 'Eventplanering';
const KVITTON_TABLE = 'Kvitton';
const REC_ID_RE = /^rec[A-Za-z0-9]+$/;
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BETALNING_VARDEN = ['avgift', 'slut'] as const;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

/** Ledgern mot RIKTIG Airtable — `_shared/receipt-numbering.ts` § ReceiptAllocationDeps. */
function makeRealLedger(): ReceiptAllocationDeps {
  return {
    async listByYear(ar: number): Promise<KvittoLedgerEntry[]> {
      const records = await fetchFromAirtable(KVITTON_TABLE, {
        filterByFormula: `{År} = ${ar}`,
        fields: ['Löpnummer', 'År'],
      });
      return records.map((r) => ({
        id: r.id,
        lopnummer: typeof r.fields['Löpnummer'] === 'number' ? r.fields['Löpnummer'] : 0,
        ar: typeof r.fields['År'] === 'number' ? r.fields['År'] : ar,
      }));
    },
    async create(ar: number, lopnummer: number) {
      const operation = getOperation(OPERATION_KEY);
      if (!operation) throw new Error(`Unknown operation: ${OPERATION_KEY}`);
      const fields = {
        Kvittonummer: `MM-${ar}-${lopnummer}`,
        Löpnummer: lopnummer,
        År: ar,
      };
      const disallowed = findDisallowedField(operation, fields);
      if (disallowed !== null) {
        throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
      }
      const created = await createAirtableRecord(operation.tableId, fields);
      return { id: created.id };
    },
    async remove(id: string) {
      await deleteAirtableRecord(KVITTON_TABLE, id);
    },
  };
}

/**
 * [TASK-309.5] PDF-byggaren — byggKvittoData (_shared/mall-data.ts,
 * återanvänder receipt-content.ts:s rena primitiv) + renderaMallPdf
 * ('kvitto', _shared/mall-render.ts, Eta + DocRaptor). ERSÄTTER kvittoRader
 * + renderKvittoPdf (pdf-lib-layouten, _shared/receipt-pdf.ts, nu RIVEN,
 * TASK-246-utbrytningen). Samma DocRaptor-mönster (apiKey/test-härledning
 * hos ANROPAREN) som generate-event-attachment/index.ts.
 */
function makeRealPdfBuilder(): ReceiptPdfBuilder {
  return async (spec) => {
    const kvittoData = byggKvittoData({
      kvittonummer: spec.kvittonummer,
      kundnamn: spec.kundnamn,
      kundEpost: spec.kundEpost,
      belopp: spec.belopp,
      betalsatt: spec.betalsatt,
      betalning: spec.betalning,
      eventNamn: spec.eventNamn,
      datum: spec.datum,
      eventTyp: spec.eventTyp,
      eventStart: spec.eventStart,
      eventSlut: spec.eventSlut,
      bokforingstext: spec.bokforingstext,
      // [TASK-346.5] `ReceiptPdfBuilder` (den GAMLA ADR-109-vägen,
      // `_shared/send-receipt.ts`) bär inget betalningsdatum — den domänen
      // föregår Inbetalning/ADR-128. `null` bevarar den tidigare synliga
      // "-"-texten oförändrad (raden visade en statisk platshållare innan
      // fältet fanns) i stället för att läcka `undefined` i PDF:en.
      betalningsdatum: null,
    });

    const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
    if (!apiKey) {
      throw new HttpError(500, 'DOCRAPTOR_API_KEY saknas i secrets');
    }
    const test = Deno.env.get('ENVIRONMENT') !== 'production';

    const bytes = await renderaMallPdf('kvitto', kvittoData as unknown as Record<string, unknown>, {
      apiKey,
      test,
      namn: `Kvitto ${spec.kvittonummer}`,
    });
    return { filename: `${spec.kvittonummer}.pdf`, contentBase64: toBase64(bytes) };
  };
}

/**
 * SKARP singel-sender — Resends `/emails` (samma form som send-action-email/
 * index.ts § makeRealSingleSender, TASK-147.5). Ingen batch: ett kvitto är
 * strukturellt EN mottagare.
 */
function makeRealSender(): ReceiptSender {
  return async (spec, ctx) => {
    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      const err = new Error('RESEND_API_KEY not set — send unavailable');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const from = Deno.env.get('RESEND_FROM');
    if (!from) {
      const err = new Error('RESEND_FROM not set');
      err.name = 'ResendNotConfiguredError';
      throw err;
    }
    const replyTo = Deno.env.get('RESEND_REPLY_TO');
    const resend = new Resend(apiKey);
    const text =
      `Hej ${spec.kundnamn},\n\nHär kommer ditt kvitto (${spec.kvittonummer}), bifogat som PDF.\n\n` +
      'Roger och Lotta, Miranon Media';
    const { error } = await resend.emails.send(
      {
        from,
        to: [spec.email],
        subject: `Kvitto ${spec.kvittonummer}`,
        text,
        html: text.replace(/\n/g, '<br>'),
        attachments: [{ filename: spec.pdf.filename, content: spec.pdf.contentBase64 }],
        ...(replyTo && replyTo.trim() ? { replyTo } : {}),
      },
      { idempotencyKey: ctx.idempotencyKey },
    );
    if (error) {
      return { accepted: false, reason: error.message };
    }
    return { accepted: true };
  };
}

/** Finaliserar (PATCH) den redan allokerade Kvitton-raden — `_shared/send-receipt.ts` § ReceiptFinalizer. */
function makeRealFinalizer(callerUserId: string): ReceiptFinalizer {
  return async (id, fields) => {
    const operation = getOperation(OPERATION_KEY);
    if (!operation) throw new Error(`Unknown operation: ${OPERATION_KEY}`);
    const patch: Record<string, unknown> = {
      Anmälan: [fields.registrationId],
      Betalning: fields.betalning === 'avgift' ? 'Anmälningsavgift' : 'Slutbetalning',
      Belopp: fields.belopp,
      Betalsätt: fields.betalsatt,
      Kundnamn: fields.kundnamn,
      Event: [fields.eventId],
      Skickad: fields.skickad,
      ...(fields.lagringsnyckel !== null ? { Lagringsnyckel: fields.lagringsnyckel } : {}),
    };
    const disallowed = findDisallowedField(operation, patch);
    if (disallowed !== null) {
      console.warn(
        `[${OPERATION_KEY}] DENY field not in allowlist | caller_user_id=${callerUserId} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }
    await updateAirtableRecord(operation.tableId, id, patch);
  };
}

/**
 * [TASK-302.3] Städaren — delegerar till `rensaUtkast` (`_shared/utkast.ts`)
 * med en EGEN `createClient`-instans (samma mönster som `makeRealFinalizer`/
 * övriga "makeReal*"-fabriker i denna fil: en riktig I/O-gräns byggd HÄR,
 * injicerad in i den REN orkestratorn `sendReceipt`, aldrig global).
 */
function makeRealDraftCleaner(): ReceiptDraftCleaner {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  return async (eventId: string) => {
    await rensaUtkast(supabaseAdmin, eventId);
  };
}

async function readRegistration(
  id: string,
): Promise<{ email: string | null; kundnamn: string; status: string | null; eventIds: string[] } | null> {
  const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, id);
  if (!record) return null;
  const f = record.fields;
  const fornamn = scalarString(f['Förnamn']) ?? '';
  const efternamn = scalarString(f['Efternamn']) ?? '';
  const eventLink = f['Event'];
  const eventIds = Array.isArray(eventLink) ? eventLink.filter((v): v is string => typeof v === 'string') : [];
  return {
    email: scalarString(f['E-post']),
    kundnamn: `${fornamn} ${efternamn}`.trim(),
    status: selectName(f['Status'] ?? null),
    eventIds,
  };
}

type EventKvittoFalt = {
  eventNamn: string | null;
  eventTyp: string | null;
  eventStart: string | null;
  eventSlut: string | null;
  bokforingstext: string | null;
};

/**
 * [TASK-306] Läser de FEM Event-fält kvittots benämning (`kvittoBenamning`,
 * `_shared/receipt-content.ts`) konsumerar — EN `fetchAirtableRecord`
 * (ersätter den tidigare `readEventNamn`, som bara läste `Event (source)`).
 *
 * ALLA fält läses BY NAME, INTE by ID — samma mönster som VARJE annan
 * Airtable-fältläsning i denna kodbas (`grep -r returnFieldsByFieldId` gav
 * noll träffar repo-brett, ADR-086 premiss-pass). Fält-NAMNET är identiskt
 * i prod och staging (samma EF-kod körs mot båda via `AIRTABLE_BASE_ID`-
 * secreten, ADR-050); ID:t skiljer sig ändå mellan baserna för fält som
 * lagts till EFTER den ursprungliga bas-dupliceringen (data-model.md §
 * "Fält-ID:n skiljer sig mellan baserna") — `Bokföringstext (kvitto)` är
 * ett sådant fält: prod `fldof3z1V1duVZNjM` · staging `fldlYgrv3P4hKezJE`
 * (data-model.md, Eventplanering). En ID-baserad läsning hade krävt en EGEN
 * `returnFieldsByFieldId=true`-hämtning vid sidan av denna namn-baserade
 * (Airtables REST-API kan inte blanda de två i SAMMA svar) — en ny, ensam
 * mekanism ingen annan fält-läsning delar, för ETT fält bland fem i samma
 * funktion. Bokfört som avsiktlig avvikelse mot ett uppdragsdirektiv i
 * TASK-306:s slutrapport i stället för att byggas tyst.
 */
async function readEventKvittoFalt(id: string): Promise<EventKvittoFalt> {
  const record = await fetchAirtableRecord(EVENTS_TABLE, id);
  if (!record) {
    return { eventNamn: null, eventTyp: null, eventStart: null, eventSlut: null, bokforingstext: null };
  }
  const f = record.fields;
  return {
    eventNamn: selectName(f['Event (source)']),
    eventTyp: selectName(f['Typ']),
    eventStart: scalarString(f['Startdatum']),
    eventSlut: scalarString(f['Slutdatum']),
    bokforingstext: scalarString(f['Bokföringstext (kvitto)']),
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  let body: Record<string, unknown> | null;
  try {
    body = (await req.json()) as Record<string, unknown> | null;
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  const registrationId = body?.registrationId;
  if (typeof registrationId !== 'string' || !REC_ID_RE.test(registrationId)) {
    return badRequest('registrationId is required (Anmälningar record-ID, rec-prefix)', corsHeaders);
  }
  const eventId = body?.eventId;
  if (typeof eventId !== 'string' || !REC_ID_RE.test(eventId)) {
    return badRequest('eventId is required (Eventplanering record-ID, rec-prefix)', corsHeaders);
  }
  const betalning = body?.betalning;
  if (typeof betalning !== 'string' || !BETALNING_VARDEN.includes(betalning as Betalning)) {
    return badRequest("betalning is required (one of: 'avgift', 'slut')", corsHeaders);
  }
  const belopp = body?.belopp;
  if (typeof belopp !== 'number' || !Number.isFinite(belopp) || belopp <= 0) {
    return badRequest('belopp is required (positive number)', corsHeaders);
  }
  const betalsatt = body?.betalsatt;
  if (typeof betalsatt !== 'string' || !BETALSATT_VARDEN.includes(betalsatt as Betalsatt)) {
    return badRequest(
      `betalsatt is required (one of: ${BETALSATT_VARDEN.join(', ')})`,
      corsHeaders,
    );
  }
  const jobId =
    req.headers.get('Idempotency-Key') ??
    (typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : '');
  if (!jobId) {
    console.warn(`[send-receipt-email] DENY missing idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key is required (header or body)', corsHeaders);
  }
  if (!UUID_V4_RE.test(jobId)) {
    console.warn(`[send-receipt-email] DENY malformed idempotency key | caller_user_id=${user.id}`);
    return badRequest('Idempotency-Key must be a UUID v4', corsHeaders);
  }

  const isProd = Deno.env.get('ENVIRONMENT') === 'production';
  // [TASK-274] Utskicks-spärren (Marcus beslut B) — central kill-switch, LÄST PER
  // ANROP (ingen cache): frånvarande/uttryckligt 'av' = öppet, allt annat = blockerat.
  const utskickSparrat = isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'));

  try {
    const registration = await readRegistration(registrationId);
    if (!registration) {
      return jsonResponse({ error: `Registration not found: ${registrationId}` }, 404, corsHeaders);
    }
    if (!registration.eventIds.includes(eventId)) {
      return badRequest(`Registration ${registrationId} does not belong to event ${eventId}`, corsHeaders);
    }
    if (!registration.email) {
      return badRequest('Anmälan saknar e-postadress — kvitto kan inte skickas.', corsHeaders);
    }
    if (!registration.kundnamn) {
      return badRequest('Anmälan saknar namn — kvitto kan inte skickas.', corsHeaders);
    }

    const eventKvittoFalt = await readEventKvittoFalt(eventId);

    const result = await sendReceipt(
      {
        registrationId,
        eventId,
        betalning: betalning as Betalning,
        belopp,
        betalsatt: betalsatt as Betalsatt,
        kundnamn: registration.kundnamn,
        email: registration.email,
        eventNamn: eventKvittoFalt.eventNamn,
        eventTyp: eventKvittoFalt.eventTyp,
        eventStart: eventKvittoFalt.eventStart,
        eventSlut: eventKvittoFalt.eventSlut,
        bokforingstext: eventKvittoFalt.bokforingstext,
        jobId,
        isProd,
        utskickSparrat,
        nu: new Date().toISOString(),
      },
      {
        ledger: makeRealLedger(),
        buildPdf: makeRealPdfBuilder(),
        sendEmail: makeRealSender(),
        finalizeReceipt: makeRealFinalizer(user.id),
        cleanupDraft: makeRealDraftCleaner(),
      },
    );

    console.log(
      `[send-receipt-email] DONE | caller_user_id=${user.id} | jobId=${jobId} | ` +
        `registrationId=${registrationId} | betalning=${betalning} | status=${result.status}`,
    );
    return jsonResponse(result, 200, corsHeaders);
  } catch (error) {
    if (error instanceof UtskickSparratError) {
      console.warn(`[send-receipt-email] UTSKICK-SPARR REFUSED | caller_user_id=${user.id}`);
      return jsonResponse({ error: error.message, code: 'utskick_blockerat' }, 423, corsHeaders);
    }
    if (error instanceof NonProdAddressError) {
      console.warn(
        `[send-receipt-email] NONPROD-GUARD REFUSED | caller_user_id=${user.id} | offending=${error.offending.length}`,
      );
      return jsonResponse(
        { error: error.message, code: 'non_prod_address_refused', offending: error.offending },
        422,
        corsHeaders,
      );
    }
    if (error instanceof Error && error.name === 'ResendNotConfiguredError') {
      return jsonResponse({ error: error.message, code: 'resend_not_configured' }, 503, corsHeaders);
    }
    if (error instanceof Error && error.name === 'ReceiptAllocationExhaustedError') {
      return jsonResponse({ error: error.message, code: 'receipt_allocation_exhausted' }, 503, corsHeaders);
    }
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'send-receipt-email',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
