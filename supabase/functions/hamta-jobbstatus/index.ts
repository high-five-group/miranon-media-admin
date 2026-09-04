// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hamta-jobbstatus — jobbets läge per rad. TASK-346.4 AC #1 och #5,
// ADR-129 beslut 2 och 8, PRD berättelse 10 och 11.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR DENNA FUNKTION FINNS TROTS REALTIME
// ═══════════════════════════════════════════════════════════════════════════
// ADR-129 beslut 8, ordagrant: "Klienten prenumererar på Postgres Changes för
// sina rader OCH LÄSER LÄGET VID APPÖPPNING. Push är en snabbhet, aldrig en
// sanning: en webbläsare som var stängd får sitt läge ur läsningen."
//
// Realtime levererar bara ÄNDRINGAR som sker medan prenumerationen lever. En
// iPad som stängdes mitt i ett jobb och öppnas igen har missat varje event
// däremellan — utan denna läsning hade Lotta sett ett jobb som fortfarande
// "pågår" fast det blev klart för en timme sedan.
//
// UTAN `jobbId` returneras det SENASTE jobbet. Det är vad Hem-kortet visar
// ("8 kvitton skickade"), och det gör att klienten inte behöver komma ihåg
// ett id över en omstart.
//
// KVITTONUMRET PER RAD kommer ur LEDGERN, inte ur jobbet. Jobbraden vet
// vilket OBJEKT den arbetar på (inbetalningens id); numret är kvittots
// egenskap. Att denormalisera in det i jobbraden hade gett två sanningar om
// samma nummer.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import {
  JOBB_RAD_KOLUMNER,
  JOBB_RAD_TABELL,
  JOBB_TABELL,
  KVITTON_TABELL,
  radTillJobbRad,
  skapaAdminKlient,
} from '../_shared/betalningar-db.ts';
import { sammanfattaJobb } from '../_shared/jobb-tillstand.ts';

const LOGG = '[hamta-jobbstatus]';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed. Use GET.' }, 405, corsHeaders);
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const url = new URL(req.url);
  const jobbId = url.searchParams.get('jobbId');
  if (jobbId !== null && !UUID_RE.test(jobbId)) {
    return jsonResponse({ error: 'jobbId måste vara ett UUID' }, 400, corsHeaders);
  }

  try {
    const db = skapaAdminKlient();

    const jobbFraga = db
      .from(JOBB_TABELL)
      .select('id, jobbtyp, status, skapad_av, skapad_nar, avslutad_nar');
    const { data: jobbRad, error: jobbFel } = jobbId
      ? await jobbFraga.eq('id', jobbId).maybeSingle()
      : await jobbFraga.order('skapad_nar', { ascending: false }).limit(1).maybeSingle();
    if (jobbFel) throw jobbFel;

    if (!jobbRad) {
      // INGET JOBB ÄR INTE ETT FEL. Lotta har helt enkelt inte skickat något
      // ännu, och Hem-kortet ska visa noll, inte en felruta.
      return jsonResponse(
        {
          jobb: null,
          rader: [],
          sammanfattning: { totalt: 0, skickade: 0, fel: 0, kvar: 0 },
        },
        200,
        corsHeaders,
      );
    }

    const { data: radar, error: raderFel } = await db
      .from(JOBB_RAD_TABELL)
      .select(JOBB_RAD_KOLUMNER)
      .eq('jobb_id', jobbRad.id)
      .order('skapad_nar', { ascending: true });
    if (raderFel) throw raderFel;

    // Kvittonumren för raderna som hunnit få ett — EN fråga, aldrig en per rad.
    const objektIds = (radar ?? []).map((rad) => rad.objekt_id);
    const nummerPerObjekt = new Map();
    if (objektIds.length > 0) {
      const { data: kvittoRadar, error: kvittoFel } = await db
        .from(KVITTON_TABELL)
        .select('inbetalning_id, kvittonummer')
        .in('inbetalning_id', objektIds);
      if (kvittoFel) throw kvittoFel;
      for (const rad of kvittoRadar ?? []) {
        nummerPerObjekt.set(rad.inbetalning_id, rad.kvittonummer);
      }
    }

    const rader = (radar ?? []).map((rad) =>
      radTillJobbRad(rad, nummerPerObjekt.get(rad.objekt_id) ?? null),
    );
    const summering = sammanfattaJobb(rader.map((rad) => ({ status: rad.status })));

    console.log(
      `${LOGG} OK | caller_user_id=${user.id} | requestId=${requestId} | jobb=${jobbRad.id} | ` +
        `totalt=${summering.totalt} | kvar=${summering.kvar}`,
    );

    return jsonResponse(
      {
        jobb: {
          id: jobbRad.id,
          jobbtyp: jobbRad.jobbtyp,
          status: jobbRad.status,
          skapadAv: jobbRad.skapad_av,
          skapadNar: jobbRad.skapad_nar,
          avslutadNar: jobbRad.avslutad_nar ?? null,
        },
        rader,
        sammanfattning: {
          totalt: summering.totalt,
          skickade: summering.skickade,
          fel: summering.fel,
          kvar: summering.kvar,
        },
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'hamta-jobbstatus',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
