// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-email/index.ts och test-pdf-generation/index.ts.
//
// generate-event-attachment — TASK-146.5 "Klass B — event-mallad generering
// ur systemmall" (PRD task-146, bilage-fundamentet). ADR-125-PROMOVERAD
// (TASK-309.4): BÅDA bilagemallarna (`mall: 'bekraftelse' | 'deltagarinfo'`)
// renderas nu genom `_shared/mall-render.ts` (Eta + DocRaptor) i stället för
// pdf-lib och en hårdkodad systemmall. Se ADR-125 § Beslut 4+5.
//
// [TASK-309.4, RIVET] All pdf-lib-kod (SYSTEMMALL_BRODTEXT, byggPdf,
// lasEventUppgifter, formatSvenskDatum/MANADSNAMN) är BORTA — den mallen
// bar EN hårdkodad "Deltagarinformation"-text (AC #2 i task-146.5, ingen
// mall-editor i v1). Ersatt av de RIKTIGA mallarna
// (`docs/mallar/bilagor/{bekraftelsebilaga,deltagarinformation}.html`) med
// eventets FAKTISKA ifyllnadsunderlag (`_shared/document-sources.ts`, delad
// med `get-document-sources/index.ts`, ADR-125 § Beslut 5).
//
// MALL-PARAMETERN (NY, TASK-309.4): body bär nu `mall: 'bekraftelse' |
// 'deltagarinfo'` — EN EF för BÅDA mallarna (ADR-125 § Beslut 5:s
// EF-topologi-tabell), i stället för en hårdkodad enda mall. Ett angivet
// men okänt värde är ett klientfel (400), aldrig en tyst fallback.
//
// KÄLLHASH (NY, TASK-309.4, ADR-125 § Beslut 3): SHA-256
// (`_shared/mall-hash.ts`) över den EXAKTA, mall-resolvda ifyllnadsdatan
// (`_shared/mall-data.ts`s `byggBekraftelseData`/`byggDeltagarinfoData`) —
// samma data Eta faktiskt fyller mallen med, inte råa standard/kopia-par.
// Skriven till Bilagor-radens `Källhash`-fält tillsammans med `Mall`
// (singleSelect-namnet). Adaptern (TASK-309.6) härleder inaktualitet genom
// att räkna om samma hash vid listning och jämföra.
//
// ERSATT-LÄGET (NYTT, TASK-309.4, ADR-125 § Beslut 3 "Regenerering är
// ERSÄTTNING"): body kan bära `ersatt: <attachmentId>` — regenererar EN
// BEFINTLIG Event-mallad rad i stället för att skapa en ny. SAMMA
// Bilagor-rad (samma attachmentId, ägarskaps-guard som delete-attachment/
// index.ts), SAMMA Storage-lagringsnyckel (`upsert: true`, filen skrivs
// över i stället för att en ny path allokeras) — så Åtgärds-sidans
// bilageval förblir giltigt (ADR-125 § 3). `useReplaceAttachment.ts`s
// upload-nytt-radera-gammalt-mönster (TASK-147.11) är ett ANNAT flöde
// (klientens manuella filersättning, en NY rad + en NY attachmentId) —
// denna EF:s ersatt-läge är regenerering AV SAMMA rad, arkitektoniskt
// skilt (se skivans slutrapport för resonemanget).
//
// [ADR-124, TASK-302.2] FÖRHANDSVISNINGS-LÄGET (body-flaggan `preview:
// true`) OFÖRÄNDRAT I FORM: skriver ett TRANSIENT Storage-utkast
// (`_shared/utkast.ts` § `laggUtkast`) och returnerar `{ url, utgar }` —
// noll konsument-synliga sidoeffekter (ingen Bilagor-rad, inget
// kvittonummer, inget mail). `typ` härleds nu ur `mall`
// ('bekraftelse' → 'bilaga', 'deltagarinfo' → 'deltagarinformation' —
// SAMMA `UTKAST_TYPER`-enum TASK-302 redan definierade, ingen ny typ
// behövdes).
//
// AUKTORISATION: samma nivå som create-event-note/create-event
// (requireUser, ingen extra ADMIN_EMAILS-gate).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  createAirtableRecord,
  fetchAirtableRecord,
  updateAirtableRecord,
} from '../_shared/airtable-client.ts';
import {
  ATTACHMENT_CLASS_EVENT_MALLAD,
  BILAGOR_BUCKET_ID,
  BILAGOR_TABLE,
  buildAttachmentLeaf,
  buildAttachmentPath,
  isValidEventId,
  mapAttachmentRecord,
  toBase64,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { fetchDocumentSources } from '../_shared/document-sources.ts';
import {
  ForbiddenError,
  generateRequestId,
  HttpError,
  mapErrorToResponse,
  ValidationError,
} from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import { byggBekraftelseData, byggDeltagarinfoData } from '../_shared/mall-data.ts';
import { berakaKallhash } from '../_shared/mall-hash.ts';
import { renderaMallPdf } from '../_shared/mall-render.ts';
import { laggUtkast, rensaUtkast } from '../_shared/utkast.ts';

const OPERATION_KEY = 'create-attachment';
const EVENT_LINK_FIELD = 'Event';

type MallParam = 'bekraftelse' | 'deltagarinfo';

/** Per-mall konstanter — EN källa, inga syskon-if-satser utspridda i filen. */
const MALL_META: Record<
  MallParam,
  { namnPrefix: string; storageFilnamn: string; airtableOption: string; utkastTyp: 'bilaga' | 'deltagarinformation' }
> = {
  bekraftelse: {
    namnPrefix: 'Bekräftelsebilaga',
    storageFilnamn: 'bekraftelsebilaga.pdf',
    airtableOption: 'Bekräftelsebilaga',
    utkastTyp: 'bilaga',
  },
  deltagarinfo: {
    namnPrefix: 'Deltagarinformation',
    storageFilnamn: 'deltagarinformation.pdf',
    airtableOption: 'Deltagarinformation',
    utkastTyp: 'deltagarinformation',
  },
};

function isValidMallParam(value: unknown): value is MallParam {
  return value === 'bekraftelse' || value === 'deltagarinfo';
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
    const mallRaw = body?.mall;
    // [TASK-246] Strikt boolean — se filhuvudet, samma "gissa aldrig"-disciplin.
    const preview = body?.preview === true;
    const ersattRaw = body?.ersatt;

    if (typeof eventId !== 'string' || !isValidEventId(eventId)) {
      throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
    }
    if (!isValidMallParam(mallRaw)) {
      throw new ValidationError("mall is required and must be 'bekraftelse' or 'deltagarinfo'");
    }
    const mall: MallParam = mallRaw;
    const meta = MALL_META[mall];

    // [SKARPT FYND, TASK-309.4 staging-tester] `ersatt` är Bilagor-radens
    // EGNA Airtable record-ID (samma "attachmentId" klienten ser i
    // `attachment.id`/`record.id` — rec…-formen), INTE den interna
    // `crypto.randomUUID()` som bara lever i Storage-lagringsnyckeln
    // (`buildAttachmentLeaf`). `isValidAttachmentId` (UUID-forms-grinden)
    // var FEL validering här — samma rec-forms-grind som
    // `delete-attachment/index.ts` redan använder för sitt `attachmentId`.
    let ersatt: string | null = null;
    if (ersattRaw !== undefined) {
      if (!isValidEventId(ersattRaw)) {
        throw new ValidationError('ersatt must be an Airtable record ID (rec…) when provided');
      }
      ersatt = ersattRaw;
    }

    // [SKARPT FYND, TASK-309.4 staging-tester] ÄGARSKAPS-GUARDEN MÅSTE KÖRAS
    // FÖRE `fetchDocumentSources(eventId)` — INTE efter. Testet "fel eventId
    // (ägarskaps-guard) → 403" skickar ett PÅHITTAT eventId
    // (`recZZZZZZZZZZZZZZ`) som INTE finns; med den gamla ordningen (fetch
    // DocumentSources FÖRST) föll koden på "Event not found" (404) innan
    // ägarskaps-kontrollen ens nåddes — en attacker hade då kunnat
    // SKILJA "fel event, existerar" (skulle nå ägarskaps-koden) från "fel
    // event, existerar inte" (404) via svarskoden, en informationsläcka
    // ovanpå att skyddet aldrig triggade för det påhittade fallet. Samma
    // "gör den billiga/säkra kontrollen FÖRE den dyra/informativa"-ordning
    // som `delete-attachment/index.ts` redan följer (ägarskap FÖRE
    // Storage-läsning).
    let existingErsattRecord: { id: string; fields: Record<string, unknown> } | null = null;
    if (ersatt) {
      const existing = await fetchAirtableRecord(BILAGOR_TABLE, ersatt);
      if (!existing) {
        return new Response(JSON.stringify({ error: 'Bilagan hittades inte.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const linkedEventIds = existing.fields[EVENT_LINK_FIELD];
      const belongsToEvent =
        Array.isArray(linkedEventIds) && (linkedEventIds as unknown[]).includes(eventId);
      if (!belongsToEvent) {
        console.warn(
          `[generate-event-attachment] DENY ersatt ownership guard | caller_user_id=${user.id} | attachment=${ersatt} | claimed_event=${eventId}`,
        );
        throw new ForbiddenError('Bilagan hör inte till det angivna eventet.');
      }
      if (existing.fields['Dokumentklass'] !== ATTACHMENT_CLASS_EVENT_MALLAD) {
        throw new ForbiddenError('Endast mall-genererade bilagor kan regenereras via ersatt-läget.');
      }
      if (existing.fields['Mall'] !== meta.airtableOption) {
        throw new ValidationError(
          `Bilagans mall (${String(existing.fields['Mall'])}) matchar inte den angivna mallen (${meta.airtableOption}).`,
        );
      }
      existingErsattRecord = existing;
    }

    const sources = await fetchDocumentSources(eventId);
    if (!sources) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mallData =
      mall === 'bekraftelse' ? byggBekraftelseData(sources) : byggDeltagarinfoData(sources);

    const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
    if (!apiKey) {
      throw new HttpError(500, 'DOCRAPTOR_API_KEY saknas i secrets');
    }
    // Fail-closed, SAMMA mönster som send-receipt-email/index.ts:s `isProd`
    // (se mall-render.ts:s filhuvud för varför denna härledning bor HÄR,
    // hos anroparen, och inte inne i renderaMallPdf).
    const test = Deno.env.get('ENVIRONMENT') !== 'production';

    const namn = `${meta.namnPrefix} – ${sources.event.eventlabel}.pdf`;

    const pdfBytes = await renderaMallPdf(mall, mallData as unknown as Record<string, unknown>, {
      apiKey,
      test,
      namn,
    });
    const kallhash = await berakaKallhash(mallData);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (preview) {
      console.log(
        `[generate-event-attachment] PREVIEW | caller_user_id=${user.id} | event=${eventId} | mall=${mall}`,
      );
      const { url, utgar } = await laggUtkast(supabaseAdmin, {
        eventId,
        typ: meta.utkastTyp,
        bytes: pdfBytes,
      });
      return new Response(JSON.stringify({ url, utgar, requestId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new Error(`Unknown operation: ${OPERATION_KEY}`);
    }

    if (ersatt && existingErsattRecord) {
      // ERSATT-LÄGET — regenererar EN BEFINTLIG rad (ADR-125 § 3), se
      // filhuvudet. Existens/ägarskap/dokumentklass/mall-matchning REDAN
      // verifierade ovan (FÖRE fetchDocumentSources) — se den notens
      // resonemang för varför ordningen är låst.
      const existing = existingErsattRecord;
      const lagringsnyckel = existing.fields['Lagringsnyckel'];
      const path =
        typeof lagringsnyckel === 'string' && lagringsnyckel.length > 0
          ? `${eventId}/${lagringsnyckel}`
          : buildAttachmentPath(eventId, ersatt, meta.storageFilnamn);
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BILAGOR_BUCKET_ID)
        .upload(path, pdfBytes, { contentType: 'application/pdf', upsert: true });
      if (uploadError) {
        throw new Error(`Storage-uppladdning misslyckades: ${uploadError.message}`);
      }

      const fields: Record<string, unknown> = {
        Namn: namn,
        'Storlek (bytes)': pdfBytes.byteLength,
        Skapad: new Date().toISOString(),
        Källhash: kallhash,
      };
      const disallowed = findDisallowedField(operation, fields);
      if (disallowed !== null) {
        console.warn(
          `[generate-event-attachment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
        );
        throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
      }

      console.log(
        `[generate-event-attachment] ALLOW ersatt | caller_user_id=${user.id} | event=${eventId} | attachment=${ersatt} | mall=${mall}`,
      );

      const updated = await updateAirtableRecord(BILAGOR_TABLE, ersatt, fields);
      await rensaUtkast(supabaseAdmin, eventId);

      return new Response(
        JSON.stringify({
          attachment: mapAttachmentRecord(updated),
          record: { id: updated.id, fields: updated.fields },
          storagePath: path,
          pdfBase64: toBase64(pdfBytes),
          requestId,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // NY RAD — samma deterministiska path-form som mönster 1/2 (TASK-146.4).
    const attachmentId = crypto.randomUUID();
    const path = buildAttachmentPath(eventId, attachmentId, meta.storageFilnamn);
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BILAGOR_BUCKET_ID)
      .upload(path, pdfBytes, { contentType: 'application/pdf' });
    if (uploadError) {
      throw new Error(`Storage-uppladdning misslyckades: ${uploadError.message}`);
    }

    const fields: Record<string, unknown> = {
      Namn: namn,
      'Storlek (bytes)': pdfBytes.byteLength,
      Skapad: new Date().toISOString(),
      Event: [eventId],
      Lagringsnyckel: buildAttachmentLeaf(attachmentId, meta.storageFilnamn),
      Dokumentklass: ATTACHMENT_CLASS_EVENT_MALLAD,
      Mall: meta.airtableOption,
      Källhash: kallhash,
    };

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[generate-event-attachment] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      throw new Error(`Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`);
    }

    console.log(
      `[generate-event-attachment] ALLOW | caller_user_id=${user.id} | event=${eventId} | mall=${mall} | path=${path}`,
    );

    const created = await createAirtableRecord(operation.tableId, fields);
    await rensaUtkast(supabaseAdmin, eventId);

    return new Response(
      JSON.stringify({
        attachment: mapAttachmentRecord(created),
        record: { id: created.id, fields: created.fields },
        storagePath: path,
        pdfBase64: toBase64(pdfBytes),
        requestId,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'generate-event-attachment',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
