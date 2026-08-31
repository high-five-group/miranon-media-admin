// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// jobb-konsument — jobbmotorns konsument. TASK-346.4 AC #3,
// ADR-129 beslut 1, 2, 4, 5, 6, 9, 10, 11.
//
// ═══════════════════════════════════════════════════════════════════════════
// NAMNET: ALDRIG `send-*`
// ═══════════════════════════════════════════════════════════════════════════
// ADR-129 beslut 6. Mail-låset (`.mail-lock-policy.conf`,
// `scripts/deny-resend-send.sh`) fäller Bash-kommandon som innehåller
// `functions/v1/send-`, vilket hade gjort funktionen OANROPBAR för varje
// agent i staging. Namnet är dessutom generiskt, som motorn: kvittot är
// första konsumenten, inte den enda (beslut 11).
//
// ═══════════════════════════════════════════════════════════════════════════
// AUKTORISATIONEN ÄR HEMLIGHETEN — INTE JWT:N
// ═══════════════════════════════════════════════════════════════════════════
// `verify_jwt = true` står i `supabase/config.toml` och är ett FÖRSTA
// FÖRSVAR: gatewayn avvisar skräp innan vår kod körs. Men anon-nyckelns JWT
// PASSERAR den grinden — MÄTT, inte antaget (ADR-129 § Kontext: ett
// `net.http_post` med anon-nyckeln mot `get-events`, som har grinden på, gav
// 405 ur VÅR EGEN metodkontroll, alltså släppte gatewayn igenom). Grinden
// bevisar därför bara att anroparen känner till en PUBLIK nyckel.
//
// Auktorisationen är den delade hemligheten i `x-jobbmotor-hemlighet`,
// jämförd i KONSTANTTID. `requireUser` används INTE: anroparen är cron
// (`jobb_cron_tick()`) eller kicken (`koa-kvitton`), aldrig en människa, och
// `requireUser` avvisar uttryckligen anon-rollen.
//
// HEMLIGHETEN SKRIVS ALDRIG UT. Varken i loggar, felmeddelanden eller
// svarskroppar — inte ens dess längd.
//
// ═══════════════════════════════════════════════════════════════════════════
// KONTRAKTET MELLAN KÖN OCH TABELLEN
// ═══════════════════════════════════════════════════════════════════════════
// De tre reglerna står vid självläkningen i migrationen
// `20260830195900_jobbmotorn_ko_cron_jobbtabeller.sql` och är kodade i
// `_shared/jobb-tillstand.ts`. Ordningen de tvingar fram — läs raden, claima
// villkorat, skriv slutstatus FÖRE kö-städningen — ägs av
// `_shared/kvittojobb.ts`. Denna fil bygger BARA I/O-gränserna.
//
// Dubbelarbete är möjligt (två körningar av samma rad); dubbel EFFEKT är det
// inte — `kvitton.inbetalning_id` är unik, och Resends idempotensnyckel är
// deterministisk per inbetalning.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@6';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse } from '../_shared/errors.ts';
import { BILAGOR_BUCKET_ID, toBase64 } from '../_shared/attachments.ts';
import { byggKvittoData } from '../_shared/mall-data.ts';
import { renderaMallPdf } from '../_shared/mall-render.ts';
import { isUtskickSparrat, RESEND_TEST_ADDRESSES } from '../_shared/send-bulk.ts';
import { byggPrisbild, lasAnmalan, lasEvent, skrivSpegel } from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  JOBB_RAD_KOLUMNER,
  JOBB_RAD_TABELL,
  JOBB_TABELL,
  KVITTO_KOLUMNER,
  KVITTON_TABELL,
  lasInbetalningarForAnmalan,
  radTillInbetalning,
  radTillKvitto,
} from '../_shared/betalningar-db.ts';
import { harledBetalning } from '../_shared/betalningsharledning.ts';
import { korKvittobatch, kvittoLagringsnyckel } from '../_shared/kvittojobb.ts';
import { sammanfattaJobb } from '../_shared/jobb-tillstand.ts';

const LOGG = '[jobb-konsument]';
const HEMLIGHETS_HEADER = 'x-jobbmotor-hemlighet';
const JOBBTYP = 'kvitto';

/**
 * Hur många kömeddelanden en invokation plockar. Lottas lördag är åtta;
 * taket är satt så att en enskild invokation aldrig behöver klara hela
 * batchen — cron kommer tillbaka om tio sekunder, och konstruktionen är
 * medvetet oberoende av om plattformens väggklocka är 150 s eller 400 s
 * (ADR-129 § Obelagt).
 */
const BATCH_STORLEK = 10;

/**
 * Hur länge ett plockat meddelande är osynligt för andra konsumenter.
 * Måste vara komfortabelt längre än en rads arbete (PDF + mail) men KORTARE
 * än självläkningens fem minuter — annars kan svepet återställa en rad som
 * fortfarande hålls osynlig av kön.
 */
const SYNLIGHET_SEKUNDER = 120;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Konstanttids-jämförelse. En vanlig `===` på strängar avbryter vid första
 * skiljande tecknet, och tidsskillnaden läcker hemligheten tecken för tecken
 * till en anropare som mäter svarstiden.
 *
 * Längden jämförs först och läcker därmed hemlighetens LÄNGD — det är en
 * medveten, allmänt accepterad kompromiss (samma som `crypto.timingSafeEqual`
 * gör i Node: den kastar på olika längd). Längden är inte hemligheten.
 */
function likaIKonstantTid(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let skillnad = 0;
  for (let i = 0; i < a.length; i += 1) {
    skillnad |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return skillnad === 0;
}

/** base64 → bytes. Motsvarigheten till `toBase64` (`_shared/attachments.ts`). */
function franBase64(b64: string): Uint8Array {
  const binart = atob(b64);
  const bytes = new Uint8Array(binart.length);
  for (let i = 0; i < binart.length; i += 1) bytes[i] = binart.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use POST.' }, 405, corsHeaders);
  }

  // ── Auktorisationen: den delade hemligheten ─────────────────────────────
  const forvantad = Deno.env.get('JOBBMOTOR_DELAD_HEMLIGHET');
  if (!forvantad) {
    // FAIL-CLOSED. En osatt hemlighet får aldrig betyda "alla släpps in".
    console.error(`${LOGG} JOBBMOTOR_DELAD_HEMLIGHET saknas — avvisar allt`);
    return jsonResponse({ error: 'Jobbmotorn är inte konfigurerad.' }, 503, corsHeaders);
  }
  const angiven = req.headers.get(HEMLIGHETS_HEADER) ?? '';
  if (!likaIKonstantTid(angiven, forvantad)) {
    console.warn(`${LOGG} DENY felaktig eller saknad jobbmotor-hemlighet`);
    return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  }

  // ── Utskicks-spärren FÖRE kön ──────────────────────────────────────────
  // Läses per anrop (ingen cache), samma form som `send-receipt-email`.
  // Plockas INGA meddelanden: raderna står kvar som `vantar` och skickas när
  // spärren lyfts, i stället för att brännas till `fel`.
  if (isUtskickSparrat(Deno.env.get('UTSKICK_SPARR'))) {
    console.warn(`${LOGG} UTSKICK-SPARR aktiv — inget plockas ur kön`);
    return jsonResponse(
      { plockade: 0, utfall: [], skal: 'utskick_blockerat' },
      200,
      corsHeaders,
    );
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // ── Plocka batchen ur kön via wrappern i `public` ─────────────────────
    // ADR-129 beslut 5: wrapper i `public`, aldrig `pgmq_public` (det schemat
    // skapas av en Dashboard-toggle, inte av utökningen — mätt).
    const { data: koRadar, error: koFel } = await db.rpc('jobb_ko_las', {
      p_antal: BATCH_STORLEK,
      p_synlighet_sekunder: SYNLIGHET_SEKUNDER,
    });
    if (koFel) throw koFel;

    const batch = (koRadar ?? [])
      .filter((rad) => rad.jobbtyp === JOBBTYP && typeof rad.rad_id === 'string')
      .map((rad) => ({ msgId: Number(rad.msg_id), radId: rad.rad_id as string }));

    if (batch.length === 0) {
      return jsonResponse({ plockade: 0, utfall: [] }, 200, corsHeaders);
    }

    // Försöksräknaren: `lasRad` fyller den, `markeraPagar` skriver den. Att
    // hålla den i en Map i stället för i orkestratorns kontrakt håller
    // `kvittojobb.ts` fri från en detalj som bara har mening mot Postgres.
    const forsokPerRad = new Map<string, number>();
    const jobbIdPerRad = new Map<string, string>();

    const nuFn = () => new Date().toISOString();

    const utfall = await korKvittobatch(batch, {
      nu: nuFn,

      async lasRad(radId) {
        const { data, error } = await db
          .from(JOBB_RAD_TABELL)
          .select(JOBB_RAD_KOLUMNER)
          .eq('id', radId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        forsokPerRad.set(radId, Number(data.forsok ?? 0));
        jobbIdPerRad.set(radId, data.jobb_id as string);
        return {
          id: data.id as string,
          jobbId: data.jobb_id as string,
          jobbtyp: data.jobbtyp as string,
          objektId: data.objekt_id as string,
          status: data.status as string,
        };
      },

      async markeraPagar(radId, uppdatering) {
        // VILLKORET LIGGER I FRÅGAN (`.eq('status','vantar')`), inte i en
        // föregående läsning. En läs-sedan-skriv hade varit en kapplöpning
        // två samtidiga konsumenter kunde vinna båda.
        const { data, error } = await db
          .from(JOBB_RAD_TABELL)
          .update({ ...uppdatering, forsok: (forsokPerRad.get(radId) ?? 0) + 1 })
          .eq('id', radId)
          .eq('status', 'vantar')
          .select('id');
        if (error) throw error;
        return (data ?? []).length > 0;
      },

      async markeraRadSlut(radId, uppdatering) {
        const { error } = await db.from(JOBB_RAD_TABELL).update(uppdatering).eq('id', radId);
        if (error) throw error;
      },

      async stadaKomeddelande(msgId, resultat) {
        // Lyckade meddelanden RADERAS; misslyckade ARKIVERAS — historiken
        // efter ett fel är värd att behålla (migrationens kommentar för
        // `jobb_ko_arkivera`).
        const funktion = resultat === 'skickat' ? 'jobb_ko_radera' : 'jobb_ko_arkivera';
        const { error } = await db.rpc(funktion, { p_msg_id: msgId });
        if (error) throw error;
      },

      async hamtaUnderlag(inbetalningId) {
        const { data, error } = await db
          .from(INBETALNINGAR_TABELL)
          .select(INBETALNING_KOLUMNER)
          .eq('id', inbetalningId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const post = radTillInbetalning(data);
        if (post.status !== 'aktiv') {
          throw new Error('Inbetalningen är makulerad — inget kvitto skickas.');
        }

        const anmalan = await lasAnmalan(post.anmalanRecordId);
        if (!anmalan) {
          // KONSISTENSVAKTEN (ADR-128 beslut 6) — anmälan borta. Raden blir
          // `fel` med ett skäl Lotta förstår, i stället för ett tyst hopp.
          throw new Error('Anmälan finns inte längre i basen — kvittot kan inte skickas.');
        }
        const event = anmalan.eventId ? await lasEvent(anmalan.eventId) : null;

        // Facket kvittots ledger-rad ska bära. HÄRLETT, aldrig valt: samma
        // regel som spegeln (ADR-128 beslut 2). Inert för kvittots synliga
        // text sedan TASK-306:s rättelsevarv.
        const alla = await lasInbetalningarForAnmalan(db, post.anmalanRecordId);
        const harledning = harledBetalning(
          alla.map((rad) => ({ belopp: rad.belopp, status: rad.status })),
          byggPrisbild(anmalan, event),
        );

        return {
          inbetalningId: post.id,
          anmalanRecordId: post.anmalanRecordId,
          belopp: post.belopp,
          betalsatt: post.betalsatt,
          betalningsdatum: post.betalningsdatum,
          kundnamn: anmalan.namn || post.ogonblicksbildNamn,
          email: anmalan.epost ?? '',
          eventNamn: event?.namn ?? post.ogonblicksbildEvent,
          eventTyp: event?.typ ?? null,
          eventStart: event?.startdatum ?? null,
          eventSlut: event?.slutdatum ?? null,
          bokforingstext: event?.bokforingstext ?? null,
          betalning: harledning.alltKlart ? 'slut' : 'avgift',
        };
      },

      async hittaKvitto(inbetalningId) {
        const { data, error } = await db
          .from(KVITTON_TABELL)
          .select(KVITTO_KOLUMNER)
          .eq('inbetalning_id', inbetalningId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const kvitto = radTillKvitto(data);

        // [TASK-346.9 fix-runda 2, W4] Läs den PERSISTERADE hänvisningens
        // NUMMER — `kvittojobb.ts`s `forbered()` behöver den (inte bara
        // `original_kvitto_id`) för att kunna återuppta en halvfärdig
        // kreditkvitto-rad utan att räkna om via `hittaOriginalKvitto`. En
        // andra, liten läsning i stället för en PostgREST-embed
        // (`original:original_kvitto_id(kvittonummer)`) — samma raka
        // frågeform som resten av filen, ingen ny mönster.
        let originalKvittonummer: string | null = null;
        if (kvitto.originalKvittoId !== null) {
          const { data: originalData, error: originalFel } = await db
            .from(KVITTON_TABELL)
            .select('kvittonummer')
            .eq('id', kvitto.originalKvittoId)
            .maybeSingle();
          if (originalFel) throw originalFel;
          originalKvittonummer = (originalData?.kvittonummer as string | null) ?? null;
        }

        return {
          id: kvitto.id,
          kvittonummer: kvitto.kvittonummer,
          ar: kvitto.ar,
          lopnummer: kvitto.lopnummer,
          status: kvitto.status,
          lagringsnyckel: kvitto.lagringsnyckel,
          typ: kvitto.typ,
          originalKvittoId: kvitto.originalKvittoId,
          originalKvittonummer,
        };
      },

      // [TASK-346.9] Kreditkvittots hänvisning — se `kvittojobb.ts`s
      // `KvittoJobbDeps.hittaOriginalKvitto`-docstring för DESIGNVALET
      // (senast utfärdade, icke-makulerade `typ: 'kvitto'` för samma
      // anmälan). Två steg därför att `kvitton` saknar `anmalan_record_id`
      // — kopplingen går via `inbetalningar`.
      async hittaOriginalKvitto(anmalanRecordId) {
        const { data: inbetalningsRadar, error: inbetalningsFel } = await db
          .from(INBETALNINGAR_TABELL)
          .select('id')
          .eq('anmalan_record_id', anmalanRecordId);
        if (inbetalningsFel) throw inbetalningsFel;
        const inbetalningIds = (inbetalningsRadar ?? []).map((rad) => rad.id as string);
        if (inbetalningIds.length === 0) return null;

        const { data, error } = await db
          .from(KVITTON_TABELL)
          .select(KVITTO_KOLUMNER)
          .in('inbetalning_id', inbetalningIds)
          .eq('typ', 'kvitto')
          .neq('status', 'makulerat')
          .order('skapad_nar', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const kvitto = radTillKvitto(data);
        return { id: kvitto.id, kvittonummer: kvitto.kvittonummer };
      },

      async allokeraNummer(ar) {
        // ADR-128 beslut 4: sekvens per år, FAIL-CLOSED mot ett saknat golv.
        // Saknas golvet kastar funktionen (P0002) i stället för att gissa
        // 1001 och kollidera med den gamla Airtable-serien.
        const { data, error } = await db.rpc('allokera_kvittonummer', { p_ar: ar });
        if (error) throw error;
        const rad = Array.isArray(data) ? data[0] : data;
        if (!rad) throw new Error('Kvittonumret kunde inte allokeras.');
        return {
          kvittonummer: rad.kvittonummer as string,
          ar: Number(rad.ar),
          lopnummer: Number(rad.lopnummer),
        };
      },

      async skapaKvitto(spec) {
        // KASTAR vid unik-nyckel-brott — det ÄR dubbelskicksspärren
        // (`kvitton.inbetalning_id unique`, ADR-128 beslut 4).
        // `kvittonummer` skrivs ALDRIG: den är en genererad kolumn.
        // [TASK-346.9] `typ`/`original_kvitto_id`: `kvittojobb.ts`s `forbered()`
        // har redan avgjort båda — `kvitton_kreditkvitto_har_original`-
        // constrainten är facit, inte en kontroll vi duplicerar här.
        const { data, error } = await db
          .from(KVITTON_TABELL)
          .insert({
            inbetalning_id: spec.inbetalningId,
            ar: spec.ar,
            lopnummer: spec.lopnummer,
            typ: spec.typ,
            original_kvitto_id: spec.originalKvittoId,
            status: 'utfardat',
          })
          .select('id')
          .single();
        if (error) throw error;
        return { id: data.id as string };
      },

      async finaliseraKvitto(kvittoId, falt) {
        // Exakt de FYRA kolumner `service_role` har UPDATE på. Ett försök
        // utanför listan fälls av Postgres oavsett vad koden gör.
        const { error } = await db
          .from(KVITTON_TABELL)
          .update({
            lagringsnyckel: falt.lagringsnyckel,
            skickad_nar: falt.skickadNar,
            mottagare: falt.mottagare,
            status: 'skickat',
          })
          .eq('id', kvittoId);
        if (error) throw error;
      },

      async byggPdf(spec) {
        const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
        if (!apiKey) throw new HttpError(500, 'DOCRAPTOR_API_KEY saknas i secrets');
        const test = Deno.env.get('ENVIRONMENT') !== 'production';

        // BEFINTLIGA MALLVÄGEN, ORÖRD. TASK-346.5 äger kvittomallens
        // innehåll (betalningsdatum, en rad) — denna skiva rör varken
        // `docs/mallar/` eller `receipt-content.ts`.
        const kvittoData = byggKvittoData({
          kvittonummer: spec.kvittonummer,
          kundnamn: spec.kundnamn,
          kundEpost: spec.email,
          // Kvittot avser EN inbetalning. Ett negativt belopp
          // (återbetalning) hör till kreditkvittot, som byggs av TASK-346.9;
          // beloppet trådas oförändrat och absolutvärdet tas INTE här — att
          // dölja tecknet vore att låta kvittot ljuga.
          belopp: spec.belopp,
          betalsatt: spec.betalsatt,
          betalning: spec.betalning,
          eventNamn: spec.eventNamn,
          // Kvittots "Datum" är utfärdandedagen; betalningsdatumet är
          // mallens egen rad (TASK-346.5) — `spec.betalningsdatum` fanns
          // redan på `KvittoPdfSpec` (346.4:s port, se kvittojobb.ts) men
          // tråddes inte vidare hit förrän nu; 346.4 lämnade denna rad
          // MEDVETET omärkt (se filhuvudets kommentar ovan) för 346.5 att
          // slutföra, eftersom `byggKvittoData`/mallens tokenyta är den
          // skivans egendom, inte 346.4:s.
          datum: spec.datum,
          betalningsdatum: spec.betalningsdatum,
          eventTyp: spec.eventTyp,
          eventStart: spec.eventStart,
          eventSlut: spec.eventSlut,
          bokforingstext: spec.bokforingstext,
          // [TASK-346.9] AKTIVERAR TASK-346.5:s förberedda tokenyta — se
          // `receipt-content.ts`/`mall-data.ts` för `kvittoRubrik`/
          // `kvittoHanvisning`. `spec.typ`/`spec.hanvisningTillKvittonummer`
          // kommer alltid satta ur `kvittojobb.ts`s `forbered()`.
          typ: spec.typ,
          hanvisningTillKvittonummer: spec.hanvisningTillKvittonummer,
        });

        const bytes = await renderaMallPdf('kvitto', kvittoData, {
          apiKey,
          test,
          namn: `Kvitto ${spec.kvittonummer}`,
        });
        return { filename: `${spec.kvittonummer}.pdf`, contentBase64: toBase64(bytes) };
      },

      async sparaPdf(spec) {
        // Miranon Medias EGEN verifikation (SFL 39 kap. 5 §) — bucketen
        // `bilagor` är privat, och nyckeln bor i ledgern.
        const nyckel = kvittoLagringsnyckel(spec.ar, spec.kvittonummer);
        const { error } = await db.storage
          .from(BILAGOR_BUCKET_ID)
          .upload(nyckel, franBase64(spec.pdf.contentBase64), {
            contentType: 'application/pdf',
            // `upsert` så att en omkörning efter ett mailfel inte fäller på
            // ett redan uppladdat objekt. Numret är detsamma, PDF:en är
            // detsamma — det är samma kvitto.
            upsert: true,
          });
        if (error) throw error;
        return nyckel;
      },

      async skickaMail(spec, ctx) {
        const apiKey = Deno.env.get('RESEND_API_KEY');
        const from = Deno.env.get('RESEND_FROM');
        if (!apiKey || !from) {
          return { accepterat: false, skal: 'Resend är inte konfigurerat i denna miljö.' };
        }

        // ICKE-PROD-SPÄRREN (GOLV, återanvänd ur `send-bulk.ts`, aldrig
        // kringgången). Returneras som ett radfel i stället för ett kastat
        // undantag: en enda adress utanför testlistan ska inte fälla de sju
        // övriga kvittona i batchen.
        const isProd = Deno.env.get('ENVIRONMENT') === 'production';
        if (!isProd && !RESEND_TEST_ADDRESSES.includes(spec.email)) {
          return {
            accepterat: false,
            skal: `Adressen ${spec.email} är inte en Resend-testadress — inget mail skickas i denna miljö.`,
          };
        }

        const replyTo = Deno.env.get('RESEND_REPLY_TO');
        const resend = new Resend(apiKey);
        // [TASK-346.9] Rubriken skiljer kvitto från kreditkvitto i mailet —
        // samma distinktion som `kvittoRubrik()` gör på PDF:en (`receipt-
        // content.ts`). Mottagaren ska aldrig läsa "kvitto" om det den fick
        // var en kreditering.
        const dokumentord = spec.typ === 'kreditkvitto' ? 'kreditkvitto' : 'kvitto';
        const text =
          `Hej ${spec.kundnamn},\n\nHär kommer ditt ${dokumentord} (${spec.kvittonummer}), bifogat som PDF.\n\n` +
          'Roger och Lotta, Miranon Media';
        const { error } = await resend.emails.send(
          {
            from,
            to: [spec.email],
            subject: `${dokumentord === 'kreditkvitto' ? 'Kreditkvitto' : 'Kvitto'} ${spec.kvittonummer}`,
            text,
            html: text.replace(/\n/g, '<br>'),
            // ETT ANROP PER KVITTO. Resends batch-API stödjer inte bilagor
            // (ADR-120, mätt verbatim mot förstapartsdokumentationen), och
            // ett kvitto utan sin PDF är inte ett kvitto.
            attachments: [{ filename: spec.pdf.filename, content: spec.pdf.contentBase64 }],
            ...(replyTo && replyTo.trim() ? { replyTo } : {}),
          },
          { idempotencyKey: ctx.idempotencyKey },
        );
        if (error) return { accepterat: false, skal: error.message };
        return { accepterat: true };
      },

      async speglaKvittonummer(anmalanRecordId, kvittonummer) {
        // Spegeln skrivs med SUMMAN också — annars hade ett kvitto kunnat
        // skrivas till en anmälan vars `Summa inbetalt (kr)` släpade, och
        // basens `Saknas (kr)` blivit fel i samma ögonblick som kvittot kom.
        const anmalan = await lasAnmalan(anmalanRecordId);
        if (!anmalan) throw new Error('Anmälan finns inte längre i basen.');
        const event = anmalan.eventId ? await lasEvent(anmalan.eventId) : null;
        const alla = await lasInbetalningarForAnmalan(db, anmalanRecordId);
        const harledning = harledBetalning(
          alla.map((rad) => ({ belopp: rad.belopp, status: rad.status })),
          byggPrisbild(anmalan, event),
        );
        const utfallSpegel = await skrivSpegel(
          anmalanRecordId,
          {
            summaInbetalt: harledning.summa,
            anmalningsavgift: harledning.anmalningsavgiftVarde,
            slutbetalning: harledning.slutbetalningVarde,
            kvittonummer,
          },
          LOGG,
        );
        if (!utfallSpegel.skrivet) {
          throw new Error(utfallSpegel.skal ?? 'Spegeln kunde inte skrivas.');
        }
      },

      async kopplaKvitto(inbetalningId, kvittoId) {
        const { error } = await db
          .from(INBETALNINGAR_TABELL)
          .update({ kvitto_id: kvittoId })
          .eq('id', inbetalningId);
        if (error) throw error;
      },
    });

    // ── Stäng de jobb vars alla rader nått slutstatus ─────────────────────
    const berordaJobb = [...new Set([...jobbIdPerRad.values()])];
    for (const jobbId of berordaJobb) {
      const { data: rader, error: raderFel } = await db
        .from(JOBB_RAD_TABELL)
        .select('status')
        .eq('jobb_id', jobbId);
      if (raderFel) {
        console.warn(`${LOGG} kunde inte läsa jobbets rader | jobb=${jobbId}`);
        continue;
      }
      const summering = sammanfattaJobb((rader ?? []).map((rad) => ({ status: rad.status })));
      if (summering.status !== 'avslutat') continue;
      const { error: stangFel } = await db
        .from(JOBB_TABELL)
        .update({ status: 'avslutat', avslutad_nar: nuFn() })
        .eq('id', jobbId)
        .eq('status', 'oppet');
      if (stangFel) console.warn(`${LOGG} kunde inte stänga jobbet | jobb=${jobbId}`);
    }

    const skickade = utfall.filter((post) => post.utfall === 'skickat').length;
    const fel = utfall.filter((post) => post.utfall === 'fel').length;
    console.log(
      `${LOGG} DONE | requestId=${requestId} | plockade=${batch.length} | ` +
        `skickade=${skickade} | fel=${fel}`,
    );

    return jsonResponse({ plockade: batch.length, utfall }, 200, corsHeaders);
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'jobb-konsument',
      method: req.method,
    });
  }
});
