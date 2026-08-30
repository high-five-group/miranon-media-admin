// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hamta-oppna-betalningar — inkorgens lista. TASK-346.4 AC #1,
// PRD TASK-346 berättelse 1 ("alla öppna betalningar över alla event på ett
// ställe, så att jag slipper leta i papper och gå in i varje event").
//
// ═══════════════════════════════════════════════════════════════════════════
// DEFINITIONEN, ORDAGRANT UR ADR-128 BESLUT 2
// ═══════════════════════════════════════════════════════════════════════════
//   "ÖPPEN BETALNING = `Saknas (kr) > 0` och status ≠ Avbokad/Ombokad.
//    Obekräftade anmälningar räknas med och märks. FÖRFALLEN =
//    slutbetalningens deadline passerad."
//
// Filtret nedan är den meningen i Airtable-syntax, inte en tolkning av den.
//
// TVÅ IAKTTAGELSER SOM MEDVETET INTE ÄNDRAR FILTRET (ADR-086 — uppdragets
// och ADR:ns bokstav vinner över byggarens omdöme; båda är rapporterade i
// stället för tyst åtgärdade):
//
//   1. `Status` har värdet `Inställt` (`data-model.md` § Anmälningar
//      write-fält). En inställd anmälans betalning är rimligen inte "öppen"
//      för Lotta, men ADR-128 beslut 2 nämner ENBART Avbokad/Ombokad. Att
//      lägga till ett värde här hade varit ett scope-beslut på egen hand.
//   2. `Saknas (kr)` är BLANK när inget pris är känt, och `BLANK() > 0` är
//      falskt i Airtable. Anmälningar utan pris faller alltså UT ur listan.
//      Det är korrekt enligt definitionen (utan pris finns inget saknat
//      belopp att visa) men värt att veta: prisbackfillen (TASK-346.8) är
//      det som gör dem synliga.
//
// ═══════════════════════════════════════════════════════════════════════════
// TVÅ KÄLLOR, TVÅ TAL — OCH VARFÖR BÅDA SKICKAS MED
// ═══════════════════════════════════════════════════════════════════════════
// `Saknas (kr)` räknas av BASEN ur spegelvärdet, och är därför exakt så
// färsk som spegeln (ADR-128 § Konsekvenser). `summaInbetalt` läses ur
// POSTGRES och är alltid sann. Raden bär båda plus `spegelIFas`, så en
// eftersläpning syns i stället för att tystas — samma princip som
// `hamta-inbetalningar`, men här utan ett enda extra anrop: spegelvärdet
// kommer med i samma sökning.
//
// ═══════════════════════════════════════════════════════════════════════════
// ANROPSBUDGETEN
// ═══════════════════════════════════════════════════════════════════════════
// Airtables tak är 5 anrop/sekund och DELAT per bas med Lottas egna klick och
// automationerna A1–A11 (ADR-063 § S91-not). Funktionen gör därför:
//   1 sökning mot Anmälningar (paginerad av `fetchFromAirtable`),
//   + ceil(distinkta event / 50) batchade eventläsningar,
//   + högst ett uppslag per DISTINKT (event, typ)-par som saknar egen avgift,
//   + 2 Postgres-frågor (summorna, och de väntande kvittojobben).
// Aldrig en läsning per rad.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { buildEqualsFilter, combineWithAnd } from '../_shared/airtable-filter.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  JOBB_RAD_TABELL,
  radTillInbetalning,
  skapaAdminKlient,
} from '../_shared/betalningar-db.ts';
import { summeraKronor } from '../_shared/betalningsbelopp.ts';
import { valjPris } from '../_shared/betalningsharledning.ts';

const LOGG = '[hamta-oppna-betalningar]';
const ANMALNINGAR_TABELL_BAS = 'Anmälningar';
const EVENTPLANERING_TABELL = 'Eventplanering';
const EVENTINNEHALL_TABELL = 'Eventinnehåll';

/**
 * ADR-128 beslut 2 i Airtable-syntax. `Avbokad/Ombokad` är ETT valvärde med
 * ett snedstreck i namnet (`data-model.md` § Anmälningar write-fält), inte
 * två värden.
 */
const OPPEN_BETALNING_FILTER = 'AND({Saknas (kr)} > 0, {Status} != "Avbokad/Ombokad")';

/** Airtables egen gräns för hur många villkor ett OR() bär bekvämt. */
const BATCH_STORLEK = 50;

/** Ören-tolerans vid jämförelse av två kronbelopp med olika ursprung. */
const ORE_TOLERANS = 0.005;

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function delar<T>(poster: readonly T[], storlek: number): T[][] {
  const ut: T[][] = [];
  for (let i = 0; i < poster.length; i += storlek) ut.push(poster.slice(i, i + storlek));
  return ut;
}

/**
 * Nyckeln för uppslaget (Event × Typ). JSON, inte en sammanfogad sträng:
 * ett eventnamn innehåller blanksteg ("Resor i medvetandet 1"), så en
 * `split(' ')` tillbaka hade gett fel uppslag TYST i stället för ett fel.
 */
function parNyckel(eventSource: string | null, typ: string | null): string {
  return JSON.stringify([eventSource, typ]);
}

/** Första värdet ur ett lookup-fält (Airtable levererar dem som arrayer). */
function lookupTal(varde: unknown): number | null {
  if (Array.isArray(varde)) return scalarNumber(varde[0]);
  return scalarNumber(varde);
}

function lookupText(varde: unknown): string | null {
  if (Array.isArray(varde)) return scalarString(varde[0]);
  return scalarString(varde);
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

  try {
    const rader = await fetchFromAirtable(ANMALNINGAR_TABELL_BAS, {
      filterByFormula: OPPEN_BETALNING_FILTER,
      fields: [
        'Förnamn',
        'Efternamn',
        'E-post',
        'Mobilnummer',
        'Status',
        'Event',
        'Saknas (kr)',
        'Summa inbetalt (kr)',
        'Avtalat pris (kr)',
        'Pris (kr) (from Event)',
        'Deadline slutbetalning',
        'Kurs (from Event)',
        'Ort (from Event)',
      ],
    });

    // ── Eventens typ och anmälningsavgift: batchat, aldrig per rad ────────
    // De två fälten saknar lookup på Anmälningar (`data-model.md`), så
    // eventen läses direkt. Distinkta ID:n, chunkade i 50.
    const eventIds = [
      ...new Set(
        rader.flatMap((rad) => {
          const lank = rad.fields['Event'];
          return Array.isArray(lank) ? lank.filter((v): v is string => typeof v === 'string') : [];
        }),
      ),
    ];

    const eventPerId = new Map();
    for (const bit of delar(eventIds, BATCH_STORLEK)) {
      const eventRader = await fetchFromAirtable(EVENTPLANERING_TABELL, {
        filterByFormula: `OR(${bit.map((id) => `RECORD_ID()='${id}'`).join(',')})`,
        fields: ['Event (source)', 'Typ', 'Startdatum', 'Pris (kr)', 'Anmälningsavgift (kr)'],
      });
      for (const rad of eventRader) {
        const eventSource = selectName(rad.fields['Event (source)']);
        eventPerId.set(rad.id, {
          namn: eventSource,
          eventSource,
          typ: selectName(rad.fields['Typ']),
          startdatum: scalarString(rad.fields['Startdatum']),
          pris: scalarNumber(rad.fields['Pris (kr)']),
          avgift: scalarNumber(rad.fields['Anmälningsavgift (kr)']),
        });
      }
    }

    // Eventinnehållets standard, för de event som saknar EGEN avgift eller
    // EGET pris. Ett uppslag per DISTINKT (Event × Typ)-par, aldrig per
    // anmälan. Samma uppslag som `fetchDocumentSources` gör för mallarna —
    // det finns ingen lagrad länk Eventplanering→Eventinnehåll.
    const behoverStandard = [...eventPerId.entries()].filter(
      ([, ev]) => (ev.avgift === null || ev.pris === null) && ev.eventSource && ev.typ,
    );
    if (behoverStandard.length > 0) {
      const parNycklar = [
        ...new Set(behoverStandard.map(([, ev]) => parNyckel(ev.eventSource, ev.typ))),
      ];
      for (const nyckel of parNycklar) {
        const [kalla, typ] = JSON.parse(nyckel);
        const standardRader = await fetchFromAirtable(EVENTINNEHALL_TABELL, {
          filterByFormula: combineWithAnd([
            buildEqualsFilter('Event', kalla),
            buildEqualsFilter('Typ', typ),
          ]),
          fields: ['Pris (kr)', 'Anmälningsavgift (kr)'],
          maxRecords: 1,
        });
        const sf = standardRader[0]?.fields ?? {};
        const standardPris = scalarNumber(sf['Pris (kr)']);
        const standardAvgift = scalarNumber(sf['Anmälningsavgift (kr)']);
        for (const [id, ev] of eventPerId.entries()) {
          if (parNyckel(ev.eventSource, ev.typ) !== nyckel) continue;
          eventPerId.set(id, {
            ...ev,
            pris: valjPris(null, ev.pris, standardPris),
            avgift: valjPris(null, ev.avgift, standardAvgift),
          });
        }
      }
    }

    // ── Postgres: summorna och de väntande kvittojobben ───────────────────
    const anmalanIds = rader.map((rad) => rad.id);
    const db = skapaAdminKlient();

    const summaPerAnmalan = new Map();
    const vantandeKvitton = new Map();

    if (anmalanIds.length > 0) {
      const { data: inbetalningsRadar, error: inbetalningsFel } = await db
        .from(INBETALNINGAR_TABELL)
        .select(INBETALNING_KOLUMNER)
        .in('anmalan_record_id', anmalanIds);
      if (inbetalningsFel) throw inbetalningsFel;

      const perAnmalan = new Map();
      const inbetalningTillAnmalan = new Map();
      for (const rad of inbetalningsRadar ?? []) {
        const post = radTillInbetalning(rad);
        inbetalningTillAnmalan.set(post.id, post.anmalanRecordId);
        if (post.status !== 'aktiv') continue;
        const lista = perAnmalan.get(post.anmalanRecordId) ?? [];
        lista.push(post.belopp);
        perAnmalan.set(post.anmalanRecordId, lista);
      }
      for (const [anmalanId, belopp] of perAnmalan.entries()) {
        summaPerAnmalan.set(anmalanId, summeraKronor(belopp));
      }

      // "K kvitton att skicka" på Hem-kortet (berättelse 11) — rader som
      // ännu inte nått slutstatus.
      const inbetalningIds = [...inbetalningTillAnmalan.keys()];
      if (inbetalningIds.length > 0) {
        const { data: jobbRadar, error: jobbFel } = await db
          .from(JOBB_RAD_TABELL)
          .select('objekt_id, status')
          .eq('jobbtyp', 'kvitto')
          .in('objekt_id', inbetalningIds)
          .in('status', ['vantar', 'pagar']);
        if (jobbFel) throw jobbFel;
        for (const rad of jobbRadar ?? []) {
          const anmalanId = inbetalningTillAnmalan.get(rad.objekt_id);
          if (!anmalanId) continue;
          vantandeKvitton.set(anmalanId, (vantandeKvitton.get(anmalanId) ?? 0) + 1);
        }
      }
    }

    // ── Sätt ihop raderna ─────────────────────────────────────────────────
    const idag = new Date().toISOString().slice(0, 10);
    let forfallna = 0;

    const betalningar = rader.map((rad) => {
      const f = rad.fields;
      const lank = f['Event'];
      const eventId = Array.isArray(lank) && typeof lank[0] === 'string' ? lank[0] : null;
      const ev = eventId ? (eventPerId.get(eventId) ?? null) : null;

      const fornamn = scalarString(f['Förnamn']) ?? '';
      const efternamn = scalarString(f['Efternamn']) ?? '';
      const avtalatPris = scalarNumber(f['Avtalat pris (kr)']);
      const prisFranEvent = lookupTal(f['Pris (kr) (from Event)']);
      const spegel = scalarNumber(f['Summa inbetalt (kr)']);
      const summaInbetalt = summaPerAnmalan.get(rad.id) ?? 0;
      const deadline = scalarString(f['Deadline slutbetalning']);

      if (deadline !== null && deadline.slice(0, 10) < idag) forfallna += 1;

      const kursnamn = lookupText(f['Kurs (from Event)']);
      const ort = lookupText(f['Ort (from Event)']);
      const sammansattNamn = [kursnamn, ort].filter((del) => del !== null && del !== '').join(', ');

      return {
        anmalanRecordId: rad.id,
        personNamn: `${fornamn} ${efternamn}`.trim(),
        personEpost: scalarString(f['E-post']),
        personTelefon: scalarString(f['Mobilnummer']),
        eventId,
        // Kursnamn plus ort är vad Lotta känner igen ett event på; saknas
        // båda används eventets egen `Event (source)`.
        eventNamn: sammansattNamn !== '' ? sammansattNamn : (ev?.namn ?? null),
        eventStartdatum: ev?.startdatum ?? null,
        eventTyp: ev?.typ ?? null,
        anmalanStatus: selectName(f['Status'] ?? null),
        saknas: scalarNumber(f['Saknas (kr)']),
        gallandePris: valjPris(avtalatPris, prisFranEvent, ev?.pris ?? null),
        anmalningsavgift: ev?.avgift ?? null,
        summaInbetalt,
        summaInbetaltSpegel: spegel,
        spegelIFas: Math.abs((spegel ?? 0) - summaInbetalt) < ORE_TOLERANS,
        deadlineSlutbetalning: deadline,
        kvittonAttSkicka: vantandeKvitton.get(rad.id) ?? 0,
      };
    });

    console.log(
      `${LOGG} OK | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `oppna=${betalningar.length} | forfallna=${forfallna} | event=${eventIds.length}`,
    );

    return jsonResponse({ betalningar, forfallna }, 200, corsHeaders);
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'hamta-oppna-betalningar',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
