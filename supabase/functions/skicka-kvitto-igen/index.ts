// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// skicka-kvitto-igen — "Skicka igen" på inbetalningens rad. TASK-346.4 AC #1,
// PRD berättelse 12 och 13.
//
// FUNKTIONEN HETER INTE `send-*`. Mail-låset (`.mail-lock-policy.conf`)
// fäller Bash-kommandon som innehåller `functions/v1/send-`, vilket hade
// gjort funktionen oanropbar för varje agent i staging (ADR-129 beslut 6 —
// samma regel som gav `jobb-konsument` sitt namn).
//
// ═══════════════════════════════════════════════════════════════════════════
// SAMMA PDF, SAMMA NUMMER — LEDGERN RÖRS INTE
// ═══════════════════════════════════════════════════════════════════════════
// PRD: "Skicka igen (samma PDF, samma nummer, valfri adress)". Ett NYTT
// nummer hade gjort kvittot till ett ANNAT kvitto, och Rogers
// verifikationskedja bygger på att det inte gör det.
//
// LEDGER-RADEN UPPDATERAS INTE. `skickad_nar` och `mottagare` bär
// UTFÄRDANDET — den ursprungliga sändningen — och att skriva över dem vid
// varje omsändning hade raderat verifikationens datum. Omsändningen är i
// stället en HÄNDELSE, och bokförs i aktivitetsloggen där historik hör hemma.
//
// PDF:EN LÄSES UR BUCKETEN, den renderas inte om. En omrendering hade kunnat
// ge ett annat innehåll om mallen ändrats sedan utfärdandet (TASK-346.5
// ändrar den), och då hade "samma PDF" varit osant.
//
// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENSNYCKELN ÄR MEDVETET ANNORLUNDA HÄR
// ═══════════════════════════════════════════════════════════════════════════
// Kvittojobbets nyckel är deterministisk per INBETALNING (`kvittojobb.ts` §
// `kvittoIdempotensnyckel`) — den ska hindra att samma kvitto skickas två
// gånger. Här är två sändningar precis vad Lotta BER OM, så samma nyckel
// hade gjort knappen verkningslös.
//
// Nyckeln nedan bär kvittots id, mottagaren och MINUTEN. Följden: ett
// oavsiktligt dubbelklick inom samma minut ger EN sändning, medan en
// medveten omsändning senare (eller till en annan adress) går fram. Det är
// en avvägning, inte en garanti — och den är utskriven här i stället för att
// se ut som samma sorts idempotens som jobbets.

import { Resend } from 'https://esm.sh/resend@6';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { BILAGOR_BUCKET_ID, toBase64 } from '../_shared/attachments.ts';
import { isUtskickSparrat, RESEND_TEST_ADDRESSES } from '../_shared/send-bulk.ts';
import {
  AKTIVITETSTYP,
  anmalanObjektId,
  byggStatement,
  INBETALNING_VERB,
  lasVisningsnamnUrJwt,
} from '../_shared/aktivitetslogg.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  KVITTO_KOLUMNER,
  KVITTON_TABELL,
  radTillInbetalning,
  radTillKvitto,
  skapaAdminKlient,
  skrivAktivitet,
} from '../_shared/betalningar-db.ts';

const LOGG = '[skicka-kvitto-igen]';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EPOST_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

/** Se filhuvudets § IDEMPOTENSNYCKELN för varför minuten ingår. */
function omsandningsnyckel(kvittoId: string, mottagare: string, nu: string): string {
  return `kvitto/${kvittoId}/omsandning/${mottagare}/${nu.slice(0, 16)}`;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

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

  const kvittoId = body?.kvittoId;
  if (typeof kvittoId !== 'string' || !UUID_RE.test(kvittoId)) {
    return badRequest('kvittoId krävs (UUID)', corsHeaders);
  }

  let onskadMottagare: string | null = null;
  if (body?.mottagare !== undefined && body.mottagare !== null && body.mottagare !== '') {
    if (typeof body.mottagare !== 'string' || !EPOST_RE.test(body.mottagare.trim())) {
      return badRequest('mottagare måste vara en giltig e-postadress.', corsHeaders);
    }
    onskadMottagare = body.mottagare.trim();
  }

  if (isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))) {
    console.warn(`${LOGG} UTSKICK-SPARR REFUSED | caller_user_id=${user.id}`);
    return jsonResponse(
      { error: 'Utskick är spärrade i denna miljö.', code: 'utskick_blockerat' },
      423,
      corsHeaders,
    );
  }

  try {
    const db = skapaAdminKlient();
    const nu = new Date().toISOString();

    const { data: kvittoRad, error: kvittoFel } = await db
      .from(KVITTON_TABELL)
      .select(KVITTO_KOLUMNER)
      .eq('id', kvittoId)
      .maybeSingle();
    if (kvittoFel) throw kvittoFel;
    if (!kvittoRad) {
      return jsonResponse({ error: `Kvittot hittades inte: ${kvittoId}` }, 404, corsHeaders);
    }
    const kvitto = radTillKvitto(kvittoRad);

    if (kvitto.lagringsnyckel === null) {
      return jsonResponse(
        {
          error: 'Kvittots PDF är inte sparad än och kan därför inte skickas om.',
          code: 'pdf_saknas',
        },
        409,
        corsHeaders,
      );
    }

    // Mottagaren: den önskade, annars ledgerns ursprungliga.
    const mottagare = onskadMottagare ?? kvitto.mottagare;
    if (!mottagare) {
      return badRequest(
        'Kvittot saknar mottagare och ingen adress angavs — ange en adress.',
        corsHeaders,
      );
    }

    const isProd = Deno.env.get('ENVIRONMENT') === 'production';
    if (!isProd && !RESEND_TEST_ADDRESSES.includes(mottagare)) {
      // ICKE-PROD-SPÄRREN (GOLV, `send-bulk.ts`) — aldrig kringgången.
      return jsonResponse(
        {
          error: `Adressen ${mottagare} är inte en Resend-testadress.`,
          code: 'non_prod_address_refused',
        },
        422,
        corsHeaders,
      );
    }

    // ── PDF:en läses ur bucketen, aldrig om-renderad ──────────────────────
    const { data: fil, error: nedladdningsFel } = await db.storage
      .from(BILAGOR_BUCKET_ID)
      .download(kvitto.lagringsnyckel);
    if (nedladdningsFel) throw nedladdningsFel;
    const bytes = new Uint8Array(await fil.arrayBuffer());

    const apiKey = Deno.env.get('RESEND_API_KEY');
    const from = Deno.env.get('RESEND_FROM');
    if (!apiKey || !from) {
      return jsonResponse(
        { error: 'Resend är inte konfigurerat i denna miljö.', code: 'resend_not_configured' },
        503,
        corsHeaders,
      );
    }
    const replyTo = Deno.env.get('RESEND_REPLY_TO');

    // Kundnamnet hämtas ur inbetalningens ögonblicksbild — den är gjord för
    // att kunna läsas ensam, år efter att anmälan ändrats (ADR-128 beslut 1).
    const { data: inbetalningsRad } = await db
      .from(INBETALNINGAR_TABELL)
      .select(INBETALNING_KOLUMNER)
      .eq('id', kvitto.inbetalningId)
      .maybeSingle();
    const inbetalning = inbetalningsRad ? radTillInbetalning(inbetalningsRad) : null;
    const kundnamn = inbetalning?.ogonblicksbildNamn ?? 'du';

    const resend = new Resend(apiKey);
    const text =
      `Hej ${kundnamn},\n\nHär kommer ditt kvitto (${kvitto.kvittonummer}) igen, bifogat som PDF.\n\n` +
      'Roger och Lotta, Miranon Media';
    const { error: sandFel } = await resend.emails.send(
      {
        from,
        to: [mottagare],
        subject: `Kvitto ${kvitto.kvittonummer}`,
        text,
        html: text.replace(/\n/g, '<br>'),
        attachments: [{ filename: `${kvitto.kvittonummer}.pdf`, content: toBase64(bytes) }],
        ...(replyTo && replyTo.trim() ? { replyTo } : {}),
      },
      { idempotencyKey: omsandningsnyckel(kvittoId, mottagare, nu) },
    );

    if (sandFel) {
      console.warn(`${LOGG} AVVISAD | caller_user_id=${user.id} | skal=${sandFel.message}`);
      return jsonResponse(
        {
          status: 'fel',
          kvittonummer: kvitto.kvittonummer,
          mottagare,
          skal: sandFel.message,
        },
        200,
        corsHeaders,
      );
    }

    // LEDGERN RÖRS INTE — se filhuvudet. Historiken bor i aktivitetsloggen.
    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;
    await skrivAktivitet(
      db,
      byggStatement({
        statementId: crypto.randomUUID(),
        requestId,
        actorAccountId: user.id,
        actorName: visningsnamn,
        verb: INBETALNING_VERB.skickade_kvitto_igen,
        objektId: anmalanObjektId(inbetalning?.anmalanRecordId ?? 'recokant0000000'),
        // MOTTAGARENS ADRESS STÅR INTE I LOGGEN. Verbet bär ATT kvittot
        // skickades om, aldrig till vem — samma integritetsgaranti som
        // resten av betalningsverben (`_shared/aktivitetslogg.ts`).
        objektNamn: `Kvitto ${kvitto.kvittonummer}`,
        aktivitetstyp: AKTIVITETSTYP.kvitto,
        timestamp: nu,
      }),
    );

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `kvitto=${kvitto.kvittonummer}`,
    );

    return jsonResponse(
      { status: 'skickat', kvittonummer: kvitto.kvittonummer, mottagare, skal: null },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'skicka-kvitto-igen',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
