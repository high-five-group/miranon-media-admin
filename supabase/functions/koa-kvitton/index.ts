// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// koa-kvitton — "Skicka N kvitton". TASK-346.4 AC #3, ADR-129 beslut 1–3.
//
// ═══════════════════════════════════════════════════════════════════════════
// ETT KLICK, ETT SVAR, INGEN VÄNTAN
// ═══════════════════════════════════════════════════════════════════════════
// PRD berättelse 8: "Som Lotta vill jag trycka en gång på 'Skicka 8 kvitton'
// och gå vidare, så att jag inte behöver vänta på att åtta PDF:er
// genereras." Funktionen skapar därför ETT jobb med N rader, köar dem, och
// SVARAR — allt tungt arbete görs av `jobb-konsument`.
//
// KICKEN (ADR-129 beslut 3) startas med `EdgeRuntime.waitUntil` EFTER att
// svaret byggts, så att första kvittot går inom sekunder i stället för att
// vänta på nästa cron-tick. Den är en OPTIMERING, ALDRIG EN GARANTI: faller
// den — instansen stängs, väggklockan tar slut vid 150/400 s, hemligheten
// saknas — händer ingenting annat än att `jobb_cron_tick()` tar över inom
// tio sekunder. Det är den egenskapen som gör att kicken får vara enkel.
//
// FÄLLAN VID LOKAL TEST, bokförd i förväg av ADR-129 beslut 3: i lokal
// CLI-körning dödas instansen efter varje request om inte
// `[edge_runtime] policy = "per_worker"` står i `supabase/config.toml`.
// Bakgrundsarbetet avbryts då innan det hunnit klart — "ett fel som ser ut
// som en bugg i koden men är en testmiljö-inställning". Raden ÄR satt i
// config.toml av denna skiva.
//
// ═══════════════════════════════════════════════════════════════════════════
// DUBBELKLICK KAN INTE SKAPA TVÅ JOBB FÖR SAMMA INBETALNING
// ═══════════════════════════════════════════════════════════════════════════
// `jobb_rad_oppen_per_objekt_idx` är ett PARTIELLT unikt index över
// (jobbtyp, objekt_id) `where status in ('vantar','pagar')`. Andra
// insättningen fälls av databasen, inte av en kontroll här — kontrollen
// nedan finns för att kunna svara med ett BEGRIPLIGT skäl i `hoppade` i
// stället för ett rått 23505.
//
// Avslutade rader (skickat/fel) ingår inte i indexet, så en omkörning efter
// ett fel är fortfarande möjlig. Det är avsiktligt.

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
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  JOBB_RAD_TABELL,
  JOBB_TABELL,
  KVITTON_TABELL,
  arUnikNyckelBrott,
  radTillInbetalning,
  skapaAdminKlient,
  skrivAktivitet,
} from '../_shared/betalningar-db.ts';

const LOGG = '[koa-kvitton]';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Lottas lördag är åtta rader. Taket är brett men inte obegränsat. */
const MAX_PER_JOBB = 100;
const JOBBTYP = 'kvitto';

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function badRequest(message: string, corsHeaders: Record<string, string>): Response {
  return jsonResponse({ error: message }, 400, corsHeaders);
}

/**
 * Kicken: ett omedelbart anrop till konsumenten (ADR-129 beslut 3 och 6).
 *
 * BÄR BÅDA AUKTORISATIONSLAGREN. Anon-nyckeln passerar gateway-grinden
 * `verify_jwt = true` — MÄTT, inte antaget (ADR-129 § Kontext: 405 ur vår
 * egen `get-events`-kod) — och är därför INGEN auktorisation. Den delade
 * hemligheten i egen header är auktorisationen, och konsumenten jämför den i
 * konstanttid.
 *
 * KASTAR ALDRIG. En misslyckad kick är per konstruktion gratis: cron tar över.
 */
async function kickaKonsumenten(): Promise<boolean> {
  const bas = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const hemlighet = Deno.env.get('JOBBMOTOR_DELAD_HEMLIGHET');
  if (!bas || !anon || !hemlighet) {
    console.warn(`${LOGG} kick hoppades över — miljövariabler saknas (cron tar över)`);
    return false;
  }
  try {
    const svar = await fetch(`${bas}/functions/v1/jobb-konsument`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
        apikey: anon,
        'x-jobbmotor-hemlighet': hemlighet,
      },
      body: JSON.stringify({ kalla: 'kick' }),
    });
    // Kroppen läses så att anslutningen stängs rent; innehållet är ointressant
    // här — konsumentens utfall bor i jobb_rad, inte i detta svar.
    await svar.text();
    console.log(`${LOGG} kick klar | status=${svar.status}`);
    return svar.ok;
  } catch (fel) {
    const text = fel instanceof Error ? fel.message : String(fel);
    console.warn(`${LOGG} kick misslyckades (cron tar över) | fel=${text}`);
    return false;
  }
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

  const raIds = body?.inbetalningIds;
  if (!Array.isArray(raIds) || raIds.length === 0) {
    return badRequest('inbetalningIds krävs (minst ett UUID)', corsHeaders);
  }
  if (raIds.length > MAX_PER_JOBB) {
    return badRequest(`Högst ${MAX_PER_JOBB} kvitton per jobb.`, corsHeaders);
  }
  const inbetalningIds = [...new Set(raIds.filter((id): id is string => typeof id === 'string'))];
  if (inbetalningIds.length === 0 || inbetalningIds.some((id) => !UUID_RE.test(id))) {
    return badRequest('inbetalningIds måste vara UUID:n', corsHeaders);
  }

  try {
    const db = skapaAdminKlient();
    const nu = new Date().toISOString();
    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;
    const hoppade: { inbetalningId: string; skal: string }[] = [];

    // ── Vilka inbetalningar SKA få ett kvitto? ────────────────────────────
    const { data: radar, error: lasFel } = await db
      .from(INBETALNINGAR_TABELL)
      .select(INBETALNING_KOLUMNER)
      .in('id', inbetalningIds);
    if (lasFel) throw lasFel;

    const funna = new Map((radar ?? []).map((rad) => [rad.id, radTillInbetalning(rad)]));

    const { data: kvittoRadar, error: kvittoFel } = await db
      .from(KVITTON_TABELL)
      .select('inbetalning_id, status, kvittonummer')
      .in('inbetalning_id', inbetalningIds);
    if (kvittoFel) throw kvittoFel;
    const kvittoPerInbetalning = new Map(
      (kvittoRadar ?? []).map((rad) => [rad.inbetalning_id, rad]),
    );

    const kandidater: string[] = [];
    for (const id of inbetalningIds) {
      const post = funna.get(id);
      if (!post) {
        hoppade.push({ inbetalningId: id, skal: 'Inbetalningen finns inte.' });
        continue;
      }
      if (post.status !== 'aktiv') {
        hoppade.push({ inbetalningId: id, skal: 'Inbetalningen är makulerad.' });
        continue;
      }
      const kvitto = kvittoPerInbetalning.get(id);
      if (kvitto && kvitto.status === 'skickat') {
        hoppade.push({
          inbetalningId: id,
          skal: `Kvitto ${kvitto.kvittonummer} är redan skickat. Använd Skicka igen.`,
        });
        continue;
      }
      kandidater.push(id);
    }

    if (kandidater.length === 0) {
      // INGET JOBB SKAPAS. Ett tomt jobb hade legat kvar som `oppet` för
      // alltid (`sammanfattaJobb`: noll rader är aldrig avslutat) och gjort
      // Hem-kortet fel.
      return jsonResponse(
        { jobbId: null, koade: 0, hoppade, kickad: false },
        200,
        corsHeaders,
      );
    }

    // ── Jobbet ────────────────────────────────────────────────────────────
    const { data: jobb, error: jobbFel } = await db
      .from(JOBB_TABELL)
      .insert({ jobbtyp: JOBBTYP, status: 'oppet', skapad_av: visningsnamn })
      .select('id')
      .single();
    if (jobbFel) throw jobbFel;

    // ── Raderna, en i taget så att en dubblett bara fäller SIN rad ────────
    // En batch-insert hade fällts i sin helhet av det partiella unika
    // indexet så snart EN av posterna redan låg i kön — och Lottas sju
    // övriga kvitton hade tappats med den.
    const koade: string[] = [];
    for (const inbetalningId of kandidater) {
      const { data: rad, error: radFel } = await db
        .from(JOBB_RAD_TABELL)
        .insert({
          jobb_id: jobb.id,
          jobbtyp: JOBBTYP,
          objekt_id: inbetalningId,
          status: 'vantar',
        })
        .select('id')
        .single();
      if (radFel) {
        if (arUnikNyckelBrott(radFel)) {
          hoppade.push({
            inbetalningId,
            skal: 'Kvittot ligger redan i kön och skickas strax.',
          });
          continue;
        }
        throw radFel;
      }
      koade.push(rad.id);
    }

    // ── Kön: transport, aldrig sanning (ADR-129 beslut 1–2) ───────────────
    // Meddelandeformen byggs av `jobb_ko_skicka` i Postgres, inte här — den
    // bor där så att den inte kan drifta mellan producenter.
    for (const radId of koade) {
      const { error: koFel } = await db.rpc('jobb_ko_skicka', {
        p_jobbtyp: JOBBTYP,
        p_rad_id: radId,
      });
      if (koFel) {
        // Raden ÄR skriven och står som `vantar`. Kön är bara väckningen, och
        // `jobb_cron_tick()` ringer konsumenten så länge något väntar — så en
        // misslyckad köning fördröjer, den tappar inte.
        console.warn(`${LOGG} kunde inte köa rad ${radId} (cron tar över) | fel=${koFel.message}`);
      }
    }

    // ── Aktivitetsloggen ──────────────────────────────────────────────────
    const forstaPost = funna.get(kandidater[0]);
    await skrivAktivitet(
      db,
      byggStatement({
        statementId: crypto.randomUUID(),
        requestId,
        actorAccountId: user.id,
        actorName: visningsnamn,
        verb: INBETALNING_VERB.koade_kvitton,
        // Objektet är den FÖRSTA anmälan i batchen. Ett jobb kan spänna över
        // flera anmälningar, och xAPI:s objekt är singulärt — att peka på
        // den första är ärligare än att hitta på ett samlings-objekt som
        // inte motsvarar något i basen. Antalet står i namnet.
        objektId: anmalanObjektId(forstaPost?.anmalanRecordId ?? 'recokant0000000'),
        objektNamn: `${koade.length} kvitto(n)`,
        aktivitetstyp: AKTIVITETSTYP.kvitto,
        timestamp: nu,
      }),
    );

    // ── Kicken sist, i bakgrunden (ADR-129 beslut 3) ──────────────────────
    // `EdgeRuntime.waitUntil` håller instansen vid liv tills löftet är klart,
    // UTAN att svaret väntar. `typeof`-vakten finns för miljöer där globalen
    // saknas (lokal `deno run`, framtida runtime-byte) — då blir kicken
    // synkront överhoppad och cron tar över, precis som vid varje annat
    // kick-fel.
    let kickad = false;
    if (typeof EdgeRuntime !== 'undefined' && typeof EdgeRuntime.waitUntil === 'function') {
      EdgeRuntime.waitUntil(kickaKonsumenten());
      kickad = true;
    } else {
      console.warn(`${LOGG} EdgeRuntime.waitUntil saknas — ingen kick, cron tar över`);
    }

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | jobb=${jobb.id} | ` +
        `koade=${koade.length} | hoppade=${hoppade.length} | kickad=${kickad}`,
    );

    return jsonResponse(
      { jobbId: jobb.id, koade: koade.length, hoppade, kickad },
      202,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'koa-kvitton',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
