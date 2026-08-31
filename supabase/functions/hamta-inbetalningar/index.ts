// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hamta-inbetalningar — inbetalningarna för EN anmälan eller EN person.
// TASK-346.4 AC #1, PRD TASK-346 berättelse 24 (personkortets Betalningar)
// och beslut 10 (Åtgärds-panelen, anmälans detaljvy).
//
// ═══════════════════════════════════════════════════════════════════════════
// EFTERSLÄPNINGEN SYNS HÄR — UTAN EN EGEN KOLUMN
// ═══════════════════════════════════════════════════════════════════════════
// ADR-128 beslut 5: "Spegeln skrivs i samma operation som inbetalningen, med
// omförsök. Eftersläpning kan uppstå ... och SYNS I APPEN i stället för att
// tystas."
//
// Kortets AC #2 formulerar samma sak som "eftersläpning bokförs på raden" —
// men `inbetalningar` HAR ingen spegel-status-kolumn (migration
// `20260830195728`, hela kolumnlistan). Kortet skrevs innan schemat byggdes.
//
// Divergensen är bokförd öppet i PR-kroppen, och löses HÄR utan en
// schemaändring: eftersläpningen är HÄRLEDBAR. Postgres-summan är sanningen,
// basens `Summa inbetalt (kr)` är spegeln, och skiljer de två sig har
// spegelskrivningen släpat. Svaret bär båda talen plus `iFas`. Det är
// dessutom en STARKARE signal än en kolumn: en kolumn hade sagt vad den
// SENASTE skrivningen trodde, jämförelsen säger vad som FAKTISKT gäller nu.
//
// PER ANMÄLAN gör vi jämförelsen (en Airtable-läsning). Den globala listan
// (`hamta-oppna-betalningar`) gör det också, men där kommer spegelvärdet
// gratis ur samma sökning — här kostar det ett extra anrop, och det är värt
// det på en vy som visar EN anmälan.
//
// ═══════════════════════════════════════════════════════════════════════════
// PERSON-VÄGEN GÅR VIA BASEN, INTE VIA POSTGRES
// ═══════════════════════════════════════════════════════════════════════════
// `inbetalningar` bär anmälans record-ID, aldrig personens — bryggan mellan
// lagren är EN nyckel (ADR-128 beslut 6). Personens anmälningar slås därför
// upp i basen först, och deras record-ID:n används som `in`-filter mot
// Postgres. Alternativet (en person-kolumn i Postgres) hade skapat en ANDRA
// brygga att hålla i synk.

import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { buildLinkedRecordFilter } from '../_shared/airtable-filter.ts';
import { fetchFromAirtable } from '../_shared/airtable-client.ts';
import { lasAnmalan, REC_ID_RE } from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  JOBB_RAD_TABELL,
  KVITTO_KOLUMNER,
  KVITTON_TABELL,
  radTillInbetalning,
  radTillKvitto,
  skapaAdminKlient,
} from '../_shared/betalningar-db.ts';
import { summeraKronor } from '../_shared/betalningsbelopp.ts';

const LOGG = '[hamta-inbetalningar]';
const ANMALNINGAR_TABELL_BAS = 'Anmälningar';
/** Personkortet visar en persons betalningar över ALLA event — men inte tusen. */
const MAX_ANMALNINGAR_PER_PERSON = 200;
/** Samma jobbtyp-sträng som `koa-kvitton/index.ts` skriver — `jobb_rad.objekt_id` är inbetalningens id. */
const JOBBTYP_KVITTO = 'kvitto';

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

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed. Use GET.' }, 405, corsHeaders);
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  const url = new URL(req.url);
  const anmalanRecordId = url.searchParams.get('anmalanRecordId');
  const personId = url.searchParams.get('personId');

  // EXAKT ETT av de två. Båda satta är tvetydigt (vilket vinner?), ingendera
  // hade returnerat hela ledgern — och en oavsiktlig helhämtning av
  // bokföringen är inte ett rimligt default.
  if ((anmalanRecordId === null) === (personId === null)) {
    return badRequest('Ange exakt ett av anmalanRecordId och personId.', corsHeaders);
  }
  if (anmalanRecordId !== null && !REC_ID_RE.test(anmalanRecordId)) {
    return badRequest('anmalanRecordId måste vara ett Airtable record-ID.', corsHeaders);
  }
  if (personId !== null && !/^rec[A-Za-z0-9]{14}$/.test(personId)) {
    return badRequest('personId måste vara ett Airtable record-ID.', corsHeaders);
  }

  try {
    const db = skapaAdminKlient();

    // ── Vilka anmälningar gäller frågan? ──────────────────────────────────
    let anmalanIds: string[];
    if (anmalanRecordId !== null) {
      anmalanIds = [anmalanRecordId];
    } else {
      const rader = await fetchFromAirtable(ANMALNINGAR_TABELL_BAS, {
        filterByFormula: buildLinkedRecordFilter('Person (länk)', personId as string),
        fields: ['Förnamn'],
        maxRecords: MAX_ANMALNINGAR_PER_PERSON,
      });
      anmalanIds = rader.map((rad) => rad.id);
    }

    if (anmalanIds.length === 0) {
      return jsonResponse(
        {
          inbetalningar: [],
          kvitton: [],
          jobbfel: [],
          spegel: { summaPostgres: 0, summaBasen: null, iFas: true },
        },
        200,
        corsHeaders,
      );
    }

    const { data: radar, error: lasFel } = await db
      .from(INBETALNINGAR_TABELL)
      .select(INBETALNING_KOLUMNER)
      .in('anmalan_record_id', anmalanIds)
      .order('betalningsdatum', { ascending: false, nullsFirst: false })
      .order('skapad_nar', { ascending: false });
    if (lasFel) throw lasFel;

    const inbetalningar = (radar ?? []).map(radTillInbetalning);

    // Kvittona för just dessa inbetalningar — radvyns "Kvitto MM-…" med
    // Visa och Skicka igen (PRD berättelse 12).
    let kvitton: ReturnType<typeof radTillKvitto>[] = [];
    if (inbetalningar.length > 0) {
      const { data: kvittoRadar, error: kvittoFel } = await db
        .from(KVITTON_TABELL)
        .select(KVITTO_KOLUMNER)
        .in(
          'inbetalning_id',
          inbetalningar.map((post) => post.id),
        );
      if (kvittoFel) throw kvittoFel;
      kvitton = (kvittoRadar ?? []).map(radTillKvitto);
    }

    // ═══ SENASTE KVITTOJOBBETS FELSKÄL (TASK-352) ═══════════════════════════
    //
    // Mätt fynd, S113-slutvandringen 2026-08-31: ett kvittojobb som fallerar
    // skriver ett Gunilla-klart skäl i `jobb_rad.skal` (t.ex. entydighets-
    // guardens "Anmälan har flera kvitton som skulle kunna vara originalet"),
    // men den skriften nådde aldrig klienten — raden visade tyst "Inget
    // kvitto" eller "väntar på att skickas", utan att säga VARFÖR.
    //
    // ENDAST DEN SENASTE jobbraden per inbetalning räknas, inte historiken:
    // en lyckad omkörning ska tysta ett gammalt fel, inte lämna det stående.
    // Radarna hämtas i FALLANDE `skapad_nar`-ordning och Map.set skriver
    // aldrig över en befintlig nyckel (`.has`-vakten), så den FÖRSTA träffen
    // per `objekt_id` är den SENASTE raden.
    //
    // `objekt_id` PÅ `jobb_rad` ÄR INBETALNINGENS ID, inte kvittots — samma
    // koppling `koa-kvitton/index.ts` skriver
    // (`objekt_id: inbetalningId`) och `hamta-jobbstatus/index.ts` redan
    // läser ur. En EN fråga för alla rader i svaret, aldrig en per rad.
    let jobbfel: { inbetalningId: string; skal: string }[] = [];
    if (inbetalningar.length > 0) {
      const { data: jobbRadar, error: jobbFel } = await db
        .from(JOBB_RAD_TABELL)
        .select('objekt_id, status, skal')
        .in(
          'objekt_id',
          inbetalningar.map((post) => post.id),
        )
        .eq('jobbtyp', JOBBTYP_KVITTO)
        .order('skapad_nar', { ascending: false });
      if (jobbFel) throw jobbFel;

      const senasteJobbPerInbetalning = new Map<string, { status: string; skal: string | null }>();
      for (const rad of jobbRadar ?? []) {
        if (senasteJobbPerInbetalning.has(rad.objekt_id)) continue;
        senasteJobbPerInbetalning.set(rad.objekt_id, { status: rad.status, skal: rad.skal });
      }

      jobbfel = [...senasteJobbPerInbetalning.entries()]
        .filter((post): post is [string, { status: 'fel'; skal: string }] => {
          const [, jobb] = post;
          return jobb.status === 'fel' && jobb.skal !== null;
        })
        .map(([inbetalningId, jobb]) => ({ inbetalningId, skal: jobb.skal }));
    }

    // ── Spegelns färskhet ─────────────────────────────────────────────────
    // Bara meningsfull för EN anmälan: spegeln är per anmälan, och en
    // person med fem anmälningar har fem speglar. Personvyn får därför
    // `summaBasen: null` och `iFas: true` (inget påstående), i stället för
    // ett hopsummerat tal som inte motsvarar något fält i basen.
    let summaBasen: number | null = null;
    let iFas = true;
    const summaPostgres = summeraKronor(
      inbetalningar.filter((post) => post.status === 'aktiv').map((post) => post.belopp),
    );

    if (anmalanRecordId !== null) {
      const anmalan = await lasAnmalan(anmalanRecordId);
      if (anmalan === null) {
        // KONSISTENSVAKTEN (ADR-128 beslut 6): inbetalningar vars anmälan
        // försvunnit. Larmas i loggen; svaret bär `iFas: false` så ytan kan
        // visa att något är fel i stället för att visa noll.
        if (inbetalningar.length > 0) {
          console.warn(
            `${LOGG} KONSISTENSVAKT | ${inbetalningar.length} inbetalning(ar) pekar på en ` +
              `anmälan som inte finns | anmalan=${anmalanRecordId}`,
          );
          iFas = false;
        }
      } else {
        summaBasen = anmalan.summaInbetaltSpegel;
        // Basen skriver `null` för ett tomt talfält; noll inbetalningar och
        // ett tomt spegelfält är i fas.
        const basen = summaBasen ?? 0;
        iFas = Math.abs(basen - summaPostgres) < 0.005;
      }
    }

    console.log(
      `${LOGG} OK | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `anmalningar=${anmalanIds.length} | inbetalningar=${inbetalningar.length} | iFas=${iFas} | ` +
        `jobbfel=${jobbfel.length}`,
    );

    return jsonResponse(
      { inbetalningar, kvitton, jobbfel, spegel: { summaPostgres, summaBasen, iFas } },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'hamta-inbetalningar',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
