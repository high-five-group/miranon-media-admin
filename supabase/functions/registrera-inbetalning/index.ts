// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande). Samma undantags-mönster som
// send-receipt-email/index.ts och log-activity/index.ts.
//
// registrera-inbetalning — TASK-346.4 AC #2, ADR-128.
//
// ═══════════════════════════════════════════════════════════════════════════
// "I EN TRANSAKTION" — VAD DET FAKTISKT BETYDER HÄR
// ═══════════════════════════════════════════════════════════════════════════
// Kortets AC #2 säger "skapar raden i Postgres i en transaktion". Raden
// skrivs med EN `insert`-sats, och en ensam sats ÄR en transaktion i
// Postgres — den är atomär, och `inbetalningar`s nio check-constraints
// (tecken följer typ, makulering kräver skäl, belopp ej noll, betalsätt- och
// typ-värden, record-ID-form) gäller alla i samma ögonblick. Ingen
// fler-sats-sekvens behövs, eftersom `kvitto_id` sätts först av
// kvittojobbet, långt senare.
//
// VAD SOM INTE ÄR I TRANSAKTIONEN, OCH INTE KAN VARA DET: spegelskrivningen
// till Airtable. `airtable-constraints.md` §A P2 säger att basen saknar
// transaktioner helt, och ADR-128 § Konsekvenser bokför den tvålagriga
// sanningen som en KOSTNAD, inte som något som ska designas bort. Följden är
// exakt vad ADR-128 beslut 5 föreskriver: spegeln skrivs med omförsök, och
// en eftersläpning SYNS I APPEN (`spegel` i svaret) i stället för att tystas.
//
// ORDNINGEN ÄR LASTBÄRANDE: Postgres FÖRST, spegeln SEDAN. Vore det tvärtom
// kunde basen bära en summa som ingen inbetalning motsvarar — en osanning i
// det lager Lottas vyer läser. Åt det håll vi valt kan basen bara SLÄPA, och
// en släpande spegel är synlig och självläkande vid nästa skrivning.
//
// ═══════════════════════════════════════════════════════════════════════════
// BELOPPET KOMMER SOM STRÄNG, MED AVSIKT
// ═══════════════════════════════════════════════════════════════════════════
// Klienten skickar Lottas RÅA inmatning ('2 500,00'), och `normaliseraBelopp`
// (`_shared/betalningsbelopp.ts`) tolkar den HÄR. Skälet står i den modulens
// filhuvud: `Number('1e3')` ger 1000 och `parseFloat('12abc')` ger 12, båda
// utan fel. En tolkning som kan gå tyst fel hör hemma på servern, där den
// kan bevisas hermetiskt (`tests/api/betalningsbelopp.test.ts`).

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
import {
  byggPrisbild,
  lasAnmalan,
  lasEvent,
  REC_ID_RE,
  skrivSpegel,
} from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  arUnikNyckelBrott,
  lasInbetalningarForAnmalan,
  radTillInbetalning,
  skapaAdminKlient,
  skrivAktivitet,
} from '../_shared/betalningar-db.ts';
import { normaliseraBelopp } from '../_shared/betalningsbelopp.ts';
import { harledBetalning } from '../_shared/betalningsharledning.ts';

const LOGG = '[registrera-inbetalning]';
const VALBARA_BETALSATT = ['Swish', 'Bankgiro', 'Plusgiro'];
/** `Historik` sätts BARA av backfillen (ADR-128 beslut 8), aldrig av formuläret. */
const BACKFILL_BETALSATT = 'Historik';
const TYP_VARDEN = ['inbetalning', 'aterbetalning'];
const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;

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
  // fel metod är ett kontraktsfel, inte ett auth-fel, och svaret ska vara
  // detsamma oavsett vem som frågar.
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

  const anmalanRecordId = body?.anmalanRecordId;
  if (typeof anmalanRecordId !== 'string' || !REC_ID_RE.test(anmalanRecordId)) {
    return badRequest(
      'anmalanRecordId krävs (Anmälningar record-ID, rec-prefix + 14 tecken)',
      corsHeaders,
    );
  }

  const typ = typeof body?.typ === 'string' ? body.typ : 'inbetalning';
  if (!TYP_VARDEN.includes(typ)) {
    return badRequest(`typ måste vara en av: ${TYP_VARDEN.join(', ')}`, corsHeaders);
  }

  const raBelopp = body?.belopp;
  const normaliserat = normaliseraBelopp(raBelopp);
  if (normaliserat === null) {
    return badRequest(
      'Beloppet gick inte att läsa. Skriv det som banken visar det, till exempel 2 500,00.',
      corsHeaders,
    );
  }
  if (normaliserat === 0) {
    return badRequest('Ett nollbelopp är aldrig en inbetalning.', corsHeaders);
  }

  // TECKNET FÖLJER TYPEN, OCH SERVERN SÄTTER DET. Lotta skriver "500" och
  // väljer "återbetalning"; att kräva att hon skriver "-500" hade lagt en
  // teknisk detalj i hennes händer, och check-constrainten
  // `inbetalningar_tecken_foljer_typ` hade avvisat raden med ett
  // databasfel i stället för ett begripligt meddelande.
  const belopp = typ === 'aterbetalning' ? -Math.abs(normaliserat) : Math.abs(normaliserat);

  const betalsatt = body?.betalsatt;
  const tillatnaBetalsatt = [...VALBARA_BETALSATT, BACKFILL_BETALSATT];
  if (typeof betalsatt !== 'string' || !tillatnaBetalsatt.includes(betalsatt)) {
    return badRequest(`betalsatt måste vara en av: ${tillatnaBetalsatt.join(', ')}`, corsHeaders);
  }

  const raDatum = body?.betalningsdatum;
  if (raDatum !== undefined && (typeof raDatum !== 'string' || !DATUM_RE.test(raDatum))) {
    return badRequest('betalningsdatum måste vara på formen YYYY-MM-DD', corsHeaders);
  }
  const nu = new Date().toISOString();
  const betalningsdatum = typeof raDatum === 'string' ? raDatum : nu.slice(0, 10);

  const bankreferens =
    typeof body?.bankreferens === 'string' && body.bankreferens.trim() !== ''
      ? body.bankreferens.trim()
      : null;

  // Avtalat pris är FRIVILLIGT och normaliseras med samma parser som
  // beloppet — det är också ett kronbelopp Lotta skriver för hand.
  let avtalatPris: number | undefined;
  if (body?.avtalatPris !== undefined && body.avtalatPris !== null && body.avtalatPris !== '') {
    const parsat = normaliseraBelopp(body.avtalatPris);
    if (parsat === null || parsat < 0) {
      return badRequest('Avtalat pris gick inte att läsa (ange till exempel 2 000).', corsHeaders);
    }
    avtalatPris = parsat;
  }

  try {
    const anmalan = await lasAnmalan(anmalanRecordId);
    if (!anmalan) {
      return jsonResponse({ error: `Anmälan hittades inte: ${anmalanRecordId}` }, 404, corsHeaders);
    }

    const event = anmalan.eventId ? await lasEvent(anmalan.eventId) : null;

    const db = skapaAdminKlient();
    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;

    // ── Steg 1: raden i Postgres (den atomära delen) ──────────────────────
    const { data: skapad, error: insertFel } = await db
      .from(INBETALNINGAR_TABELL)
      .insert({
        anmalan_record_id: anmalanRecordId,
        // ÖGONBLICKSBILDEN — verifikationskravet (ADR-128 beslut 1). Fylls
        // med det som är känt NU; kolumnerna är NOT NULL, så en tom sträng
        // vore lagligt men obegripligt om posten läses ensam om fem år.
        ogonblicksbild_namn: anmalan.namn || 'Okänt namn',
        ogonblicksbild_event: event?.namn ?? 'Okänt event',
        ogonblicksbild_eventdatum: event?.startdatum ?? null,
        belopp,
        betalsatt,
        betalningsdatum,
        typ,
        status: 'aktiv',
        bankreferens,
        skapad_av: visningsnamn,
      })
      .select(INBETALNING_KOLUMNER)
      .single();

    if (insertFel) {
      // Dubblettnyckeln vid import (PRD berättelse 20): "en rad som redan
      // importerats hoppas över SYNLIGT". 409 så anroparen kan skilja den
      // från ett formfel.
      if (arUnikNyckelBrott(insertFel)) {
        console.warn(`${LOGG} DUBBLETT bankreferens | caller_user_id=${user.id}`);
        return jsonResponse(
          {
            error: 'En inbetalning med samma bankreferens finns redan.',
            code: 'dubblett_bankreferens',
          },
          409,
          corsHeaders,
        );
      }
      throw insertFel;
    }

    const inbetalning = radTillInbetalning(skapad);

    // ── Steg 2: härledningen ur HELA mängden, inte ur den nya raden ───────
    const alla = await lasInbetalningarForAnmalan(db, anmalanRecordId);
    const prisbild = byggPrisbild(
      // Ett avtalat pris som sätts i samma operation ska gälla REDAN i denna
      // härledning — annars hade svaret visat facken enligt det gamla priset.
      avtalatPris !== undefined ? { ...anmalan, avtalatPris } : anmalan,
      event,
    );
    const harledning = harledBetalning(
      alla.map((post) => ({ belopp: post.belopp, status: post.status })),
      prisbild,
    );

    // ── Steg 3: spegeln (kastar aldrig, se `skrivSpegel`) ─────────────────
    const spegel = await skrivSpegel(
      anmalanRecordId,
      {
        summaInbetalt: harledning.summa,
        anmalningsavgift: harledning.anmalningsavgiftVarde,
        slutbetalning: harledning.slutbetalningVarde,
        ...(avtalatPris !== undefined ? { avtalatPris } : {}),
      },
      LOGG,
    );

    // ── Steg 4: aktivitetsloggen (best-effort, se `skrivAktivitet`) ───────
    await skrivAktivitet(
      db,
      byggStatement({
        statementId: crypto.randomUUID(),
        requestId,
        actorAccountId: user.id,
        actorName: visningsnamn,
        verb: INBETALNING_VERB.registrerade,
        objektId: anmalanObjektId(anmalanRecordId),
        objektNamn: anmalan.namn || anmalanRecordId,
        aktivitetstyp: AKTIVITETSTYP.betalning,
        timestamp: nu,
      }),
    );

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `anmalan=${anmalanRecordId} | typ=${typ} | avgiftKlar=${harledning.avgiftKlar} | ` +
        `alltKlart=${harledning.alltKlart} | spegel=${spegel.skrivet}`,
    );

    return jsonResponse(
      {
        inbetalning,
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
      201,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'registrera-inbetalning',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
