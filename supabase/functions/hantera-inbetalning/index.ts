// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hantera-inbetalning — RADERA eller MAKULERA. TASK-346.4 AC #2,
// PRD TASK-346 berättelse 16 och 17.
//
// ═══════════════════════════════════════════════════════════════════════════
// TVÅ ÅTGÄRDER, EN FUNKTION — OCH VAR GRÄNSEN MELLAN DEM DRAS
// ═══════════════════════════════════════════════════════════════════════════
// PRD:n: "Radera före kvitto; makulera efter." Skillnaden är inte en
// preferens utan bokföring:
//
//   RADERA (berättelse 16, "ett slarvfel ska inte kosta något") — raden
//   försvinner. Tillåtet ENDAST innan ett kvitto utfärdats, och det är inte
//   bara en kodregel: `kvitton.inbetalning_id` bär `on delete restrict`, så
//   databasen fäller försöket även om koden här skulle sluta kontrollera.
//   Kontrollen finns ändå, för att kunna svara med ett begripligt 409 i
//   stället för ett rått databasfel.
//
//   MAKULERA (berättelse 17, "sanningen rättas utan att kvittot försvinner
//   ur bokföringen") — raden består, märkt makulerad med skäl, och räknas
//   inte längre in i summan (`harledBetalning` filtrerar på `status ===
//   'aktiv'`). Kvittot står kvar i ledgern; ett utfärdat kvitto är en
//   verifikation och raderas aldrig.
//
// SKÄLET ÄR OBLIGATORISKT vid makulering. Check-constrainten
// `inbetalningar_makulering_kraver_skal` fäller en makulering utan skäl —
// kontrollen här finns för meddelandets skull, inte för garantins.
//
// ═══════════════════════════════════════════════════════════════════════════
// EFTER BÅDA ÅTGÄRDERNA: SAMMA TRE STEG SOM VID REGISTRERING
// ═══════════════════════════════════════════════════════════════════════════
// Härled om ur HELA mängden, skriv om spegeln, logga. En makulering som inte
// speglades hade lämnat basen med en summa som inte längre stämmer — och
// `Saknas (kr)` räknas ur just den summan.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import {
  AKTIVITETSTYP,
  anmalanObjektId,
  byggStatement,
  INBETALNING_VERB,
  lasVisningsnamnUrJwt,
} from '../_shared/aktivitetslogg.ts';
import { byggPrisbild, lasAnmalan, lasEvent, skrivSpegel } from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  arFramandeNyckelBrott,
  lasInbetalningarForAnmalan,
  radTillInbetalning,
  skapaAdminKlient,
  skrivAktivitet,
} from '../_shared/betalningar-db.ts';
import { harledBetalning } from '../_shared/betalningsharledning.ts';

const LOGG = '[hantera-inbetalning]';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ATGARDER = ['radera', 'makulera'];
/** Skälet läses av Roger i efterhand. En rad utan innehåll är inget skäl. */
const SKAL_MIN_LANGD = 3;
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
  if (typeof atgard !== 'string' || !ATGARDER.includes(atgard)) {
    return badRequest(`atgard måste vara en av: ${ATGARDER.join(', ')}`, corsHeaders);
  }

  const inbetalningId = body?.inbetalningId;
  if (typeof inbetalningId !== 'string' || !UUID_RE.test(inbetalningId)) {
    return badRequest('inbetalningId krävs (UUID)', corsHeaders);
  }

  let skal = '';
  if (atgard === 'makulera') {
    const raSkal = body?.skal;
    if (typeof raSkal !== 'string' || raSkal.trim().length < SKAL_MIN_LANGD) {
      return badRequest(
        `Ange ett skäl till makuleringen (minst ${SKAL_MIN_LANGD} tecken).`,
        corsHeaders,
      );
    }
    if (raSkal.trim().length > SKAL_MAX_LANGD) {
      return badRequest(`Skälet får vara högst ${SKAL_MAX_LANGD} tecken.`, corsHeaders);
    }
    skal = raSkal.trim();
  }

  try {
    const db = skapaAdminKlient();
    const nu = new Date().toISOString();

    const { data: befintlig, error: lasFel } = await db
      .from(INBETALNINGAR_TABELL)
      .select(INBETALNING_KOLUMNER)
      .eq('id', inbetalningId)
      .maybeSingle();
    if (lasFel) throw lasFel;
    if (!befintlig) {
      return jsonResponse({ error: `Inbetalningen hittades inte: ${inbetalningId}` }, 404, corsHeaders);
    }
    const inbetalning = radTillInbetalning(befintlig);
    const anmalanRecordId = inbetalning.anmalanRecordId;

    if (atgard === 'radera') {
      if (inbetalning.kvittoId !== null) {
        return jsonResponse(
          {
            error:
              'Inbetalningen har ett kvitto och kan inte raderas. Makulera den med ett skäl i stället.',
            code: 'kvitto_finns',
          },
          409,
          corsHeaders,
        );
      }
      const { error: raderaFel } = await db
        .from(INBETALNINGAR_TABELL)
        .delete()
        .eq('id', inbetalningId);
      if (raderaFel) {
        // Kapplöpningen: ett kvitto hann utfärdas mellan läsningen och
        // raderingen. `on delete restrict` fäller den, och 409 är samma
        // svar som kontrollen ovan ger — samma sak har hänt.
        if (arFramandeNyckelBrott(raderaFel)) {
          return jsonResponse(
            {
              error:
                'Inbetalningen fick ett kvitto medan raderingen pågick. Makulera den i stället.',
              code: 'kvitto_finns',
            },
            409,
            corsHeaders,
          );
        }
        throw raderaFel;
      }
    } else {
      if (inbetalning.status === 'makulerad') {
        return jsonResponse(
          { error: 'Inbetalningen är redan makulerad.', code: 'redan_makulerad' },
          409,
          corsHeaders,
        );
      }
      const { data: makulerade, error: makuleraFel } = await db
        .from(INBETALNINGAR_TABELL)
        .update({ status: 'makulerad', makulerad_skal: skal, makulerad_nar: nu })
        .eq('id', inbetalningId)
        // VILLKORET LIGGER I FRÅGAN, inte i en tidigare läsning: två
        // samtidiga makuleringar ska inte kunna skriva över varandras skäl.
        .eq('status', 'aktiv')
        // ── UTFALLET LÄSES, INTE BARA FELET (granskningsfynd runda 1) ──
        // Ett villkorat UPDATE som träffar NOLL rader är inte ett fel för
        // Postgres — `error` är null och svaret är tomt. Utan `.select('id')`
        // hade den förlorande parten i kapplöpningen fått 200 OK med ett
        // `skal` som aldrig skrevs, och Lotta hade trott att HENNES skäl stod
        // på raden. Samma form som konsumentens `markeraPagar`
        // (`jobb-konsument/index.ts`): villkoret i frågan, längden som svar.
        .select('id');
      if (makuleraFel) throw makuleraFel;
      if ((makulerade ?? []).length === 0) {
        // Raden var 'aktiv' vid läsningen men inte längre vid skrivningen —
        // någon annan hann makulera den emellan. 409, samma kod som
        // förhandskontrollen ovan: för anroparen har exakt samma sak hänt.
        console.warn(
          `${LOGG} KAPPLOPNING makulering | caller_user_id=${user.id} | inbetalning=${inbetalningId}`,
        );
        return jsonResponse(
          {
            error: 'Inbetalningen makulerades av någon annan medan åtgärden pågick.',
            code: 'redan_makulerad',
          },
          409,
          corsHeaders,
        );
      }
    }

    // ── Räkna om och spegla, exakt som vid registrering ───────────────────
    const anmalan = await lasAnmalan(anmalanRecordId);
    const event = anmalan?.eventId ? await lasEvent(anmalan.eventId) : null;
    const alla = await lasInbetalningarForAnmalan(db, anmalanRecordId);
    const harledning = harledBetalning(
      alla.map((post) => ({ belopp: post.belopp, status: post.status })),
      anmalan
        ? byggPrisbild(anmalan, event)
        : { avtalatPris: null, eventPris: null, anmalningsavgift: null, eventTyp: null },
    );

    // ANMÄLAN KAN VARA BORTA. Konsistensvakten (ADR-128 beslut 6) larmar på
    // inbetalningar vars anmälan försvunnit; här räcker att INTE försöka
    // spegla till en rad som inte finns — ett Airtable-404 hade bokförts som
    // en eftersläpning, vilket är fel diagnos.
    const spegel = anmalan
      ? await skrivSpegel(
          anmalanRecordId,
          {
            summaInbetalt: harledning.summa,
            anmalningsavgift: harledning.anmalningsavgiftVarde,
            slutbetalning: harledning.slutbetalningVarde,
          },
          LOGG,
        )
      : {
          skrivet: false,
          forsok: 0,
          skal: 'Anmälan finns inte längre i basen — spegeln kan inte skrivas.',
        };

    if (!anmalan) {
      console.warn(
        `${LOGG} KONSISTENSVAKT | inbetalningar pekar på en anmälan som inte finns | ` +
          `anmalan=${anmalanRecordId} | inbetalning=${inbetalningId}`,
      );
    }

    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;
    await skrivAktivitet(
      db,
      byggStatement({
        statementId: crypto.randomUUID(),
        requestId,
        actorAccountId: user.id,
        actorName: visningsnamn,
        // INGET SKÄL I LOGGEN. Verben bär ATT något makulerades, aldrig
        // varför — samma integritetsgaranti som anteckningarnas verb
        // (`_shared/aktivitetslogg.ts` § INBETALNING_VERB).
        verb: atgard === 'radera' ? INBETALNING_VERB.raderade : INBETALNING_VERB.makulerade,
        objektId: anmalanObjektId(anmalanRecordId),
        objektNamn: anmalan?.namn || inbetalning.ogonblicksbildNamn || anmalanRecordId,
        aktivitetstyp: AKTIVITETSTYP.betalning,
        timestamp: nu,
      }),
    );

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `atgard=${atgard} | inbetalning=${inbetalningId} | spegel=${spegel.skrivet}`,
    );

    return jsonResponse(
      {
        atgard,
        inbetalningId,
        harledning: {
          summa: harledning.summa,
          gallandePris: harledning.gallandePris,
          saknas: harledning.saknas,
          avgiftKlar: harledning.avgiftKlar,
          alltKlart: harledning.alltKlart,
          arForelasning: harledning.arForelasning,
        },
        spegel,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'hantera-inbetalning',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
