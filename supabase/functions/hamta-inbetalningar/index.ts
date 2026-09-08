// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy, se ADR-010 § Fas 7-åtagande).
//
// hamta-inbetalningar — inbetalningarna för EN anmälan, EN person, ELLER
// (TASK-437) en HEL BATCH av anmälningar i ETT anrop.
// TASK-346.4 AC #1, PRD TASK-346 berättelse 24 (personkortets Betalningar)
// och beslut 10 (Åtgärds-panelen, anmälans detaljvy).
//
// ═══════════════════════════════════════════════════════════════════════════
// BATCH-VÄGEN (TASK-437) — POST, INTE EN QUERY-PARAM-LISTA
// ═══════════════════════════════════════════════════════════════════════════
// Behovet: eventdetaljens logg ska visa inbetalningar för ALLA anmälningar i
// ett event. `useInbetalningarPerAnmalan`s docblock (`useBetalningar.ts`)
// säger redan varför en läsning PER anmälan är fel för en lista med många
// rader: "tjugo Edge Function-anrop". Två designval, båda bokförda i PR-
// kroppen för TASK-437:
//
//  1) BATCH AV ANMÄLNINGS-RECORD-ID:N, INTE ETT `eventId`. Klienten har
//     redan eventets anmälningar (`useRegistrations`/eventvyn) — att skicka
//     ett `eventId` hade tvingat DENNA EF att slå upp eventets anmälningar i
//     Airtable FÖRST (en ny uppslagsväg, ett nytt anrop mot det delade
//     Airtable-taket, ADR-063 § S91-not), bara för att komma fram till exakt
//     den lista klienten redan hade. `inbetalningar.anmalan_record_id` är
//     redan INDEXERAT (`inbetalningar_anmalan_idx`, migration
//     `20260830195728`) — ett `.in(...)`-filter över anmälnings-ID:n är
//     samma frågeform GET-vägen redan kör, bara med N värden i stället för
//     ett. NOLL Airtable-anrop i denna väg.
//
//  2) POST MED JSON-KROPP, INTE GET MED QUERY-PARAMS. Ett event kan ha
//     uppåt `MAX_ANMALNINGAR_PER_BATCH` deltagare — en query-sträng med så
//     många record-ID:n är läsbar men onödigt bräcklig (URL-längdtak,
//     URLSearchParams-kodning av en array). `compute-segment/index.ts`
//     satte redan precedentet i detta repo ("Repots första POST-LÄS-only-EF:
//     regeln ... ryms ej i query-params") — samma resonemang här: input är
//     en LISTA, inte ett fåtal skalärer, så POST är rätt verktyg trots att
//     anropet är en läsning. GET-vägen (`anmalanRecordId`/`personId`) är
//     HELT OFÖRÄNDRAD — se `hanteraBatch` nedan för hela batch-kroppen.
//
// SPEGEL INGÅR MEDVETET INTE PER GRUPP I BATCH-SVARET. Den enskilda
// anmälnings-vägen (GET) gör en `lasAnmalan`-läsning (ETT Airtable-anrop) för
// att jämföra Postgres-summan mot basens spegel. Att göra SAMMA sak per
// anmälan i en batch på upp till `MAX_ANMALNINGAR_PER_BATCH` poster hade
// återinfört exakt det N-anrops-mönster batch-vägen finns för att eliminera
// — bara flyttat innanför en enda EF-invokation. `jobbfel` ingår DÄREMOT per
// grupp: den härleds redan ur Postgres (ingen Airtable-kostnad) och är
// naturligt attribuerbar per anmälan via `inbetalningar.anmalan_record_id`.
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
//
// ═══════════════════════════════════════════════════════════════════════════
// FYND (TASK-351, 2026-08-31): INGEN FORMEL PÅ PERSON-VÄGEN — ETT RECORD-GET
// ═══════════════════════════════════════════════════════════════════════════
// Ursprunget slog upp personens anmälningar med
// `FIND(personId, ARRAYJOIN({Person (länk)}))` mot Anmälningar. Två fel,
// mätta live 2026-08-31 (staging `apphjj8Q7lkXCMsL4`):
//
//  1) Fältnamnet var fel. `fldQekqRlLfup8x5K` heter `Person` i BÅDA baserna
//     (staging OCH prod, `describe_table`-verifierat) — `data-model.md` rad
//     ~1053 bar det felaktiga namnet `Person (länk)` (raden ovanför, rad
//     950, hade redan rätt namn — de två raderna motsade varandra). Formeln
//     föll med `422 INVALID_FILTER_BY_FORMULA: Unknown field names: person
//     (länk)`, vilket EF:en mappade till en generisk `500`.
//
//  2) Ett rent namnbyte (`Person (länk)` → `Person`) hade INTE räckt — och
//     hade varit en VÄRRE bugg: `FIND("rec2JwV3Bh0x5qlvl",
//     ARRAYJOIN({Person}))` mot samma tabell gav **0 träffar**, trots att
//     `rec2JwV3Bh0x5qlvl` faktiskt är den länkade personen på en verklig
//     rad. `ARRAYJOIN` på ett länkfält i en Airtable-FORMEL renderar de
//     länkade posternas PRIMÄRFÄLT (personens NAMN — `FIND("Cecilia
//     Ödman", ...)` MATCHADE samma rad), aldrig record-ID:n. Ett filter på
//     personId kan alltså aldrig matcha via den vägen — en tyst TOM sektion
//     för varje person, i stället för en 500.
//
// Fixen läser i stället Personens EGEN rad och dess reverse-länk
// `Anmälningar (länkat fält)` (`fld8pOivka8YdiywK`, samma fält-ID i
// staging OCH prod). Ett API-READ (record-GET, inte en formel) av ett
// länkfält returnerar record-ID:n rakt av — motsatsen till hur samma fält
// renderas INUTI en formel. Se `docs/reference/data-model.md` §Kända
// fällor för den generaliserade noten (övriga formel-callers mot länkfält
// är en öppen, separat granskningsfråga — ändras INTE här).

import { z } from 'https://esm.sh/zod@4';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { stringArray } from '../_shared/coerce.ts';
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
const PERSONER_TABELL_BAS = 'Personer';
/** Reverse-länken på Personer — `fld8pOivka8YdiywK`, samma i staging och prod. */
const PERSON_ANMALNINGAR_FALT = 'Anmälningar (länkat fält)';
/** Personkortet visar en persons betalningar över ALLA event — men inte tusen. */
const MAX_ANMALNINGAR_PER_PERSON = 200;
/**
 * [TASK-437] Batchvägens tak. Samma golv som personvägens
 * `MAX_ANMALNINGAR_PER_PERSON` ovan — ingen känd Miranon-kurs eller -resa
 * kommer i närheten, och samma ceiling-resonemang gäller: en lista LÅNGT
 * över vad en admin-yta rimligen renderar i en logg.
 */
const MAX_ANMALNINGAR_PER_BATCH = 200;
/** Samma jobbtyp-sträng som `koa-kvitton/index.ts` skriver — `jobb_rad.objekt_id` är inbetalningens id. */
const JOBBTYP_KVITTO = 'kvitto';

/** [TASK-437] Batch-kroppens form — zod-validerad, se AC #1. */
const BatchBodySchema = z.object({
  anmalanRecordIds: z
    .array(z.string().regex(REC_ID_RE, 'anmalanRecordIds måste vara Airtable record-ID:n (rec-prefix)'))
    .max(MAX_ANMALNINGAR_PER_BATCH, `Högst ${MAX_ANMALNINGAR_PER_BATCH} anmälningar per anrop.`),
});

type BatchGrupp = {
  anmalanRecordId: string;
  inbetalningar: ReturnType<typeof radTillInbetalning>[];
  kvitton: ReturnType<typeof radTillKvitto>[];
  jobbfel: { inbetalningId: string; skal: string }[];
};

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
 * [TASK-437] Batch-vägen — POST. Se filhuvudets § BATCH-VÄGEN för designvalet
 * (batch av anmälnings-ID:n, ingen Airtable-uppslagning, ingen `spegel` per
 * grupp). KASTAR på Postgres-fel (fångas av anroparens try/catch →
 * `mapErrorToResponse`, samma kontrakt som GET-vägen); returnerar en
 * `Response` direkt för validering (400), aldrig via kastning.
 */
async function hanteraBatch(
  req: Request,
  user: { id: string },
  requestId: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest('Invalid JSON body', corsHeaders);
  }

  const parsed = BatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(
      parsed.error.issues[0]?.message ?? 'anmalanRecordIds är ogiltigt.',
      corsHeaders,
    );
  }

  // Dubbletter kollapsas (send-action-email-mönstret, `registrationIds`):
  // samma anmälan två gånger i samma anrop är ett klientmisstag, inte två
  // grupper.
  const ids = [...new Set(parsed.data.anmalanRecordIds)];

  if (ids.length === 0) {
    console.log(
      `${LOGG} OK BATCH | caller_user_id=${user.id} | requestId=${requestId} | anmalningar=0`,
    );
    return jsonResponse({ grupper: [] }, 200, corsHeaders);
  }

  const db = skapaAdminKlient();

  const { data: radar, error: lasFel } = await db
    .from(INBETALNINGAR_TABELL)
    .select(INBETALNING_KOLUMNER)
    .in('anmalan_record_id', ids)
    .order('betalningsdatum', { ascending: false, nullsFirst: false })
    .order('skapad_nar', { ascending: false });
  if (lasFel) throw lasFel;

  const inbetalningar = (radar ?? []).map(radTillInbetalning);

  // Kvittona för HELA batchen i EN fråga (samma form som GET-vägen, bara med
  // alla batchens inbetalnings-ID:n i `.in(...)` i stället för en anmälans).
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

  // Senaste kvittojobbets felskäl — SAMMA logik som GET-vägens § SENASTE
  // KVITTOJOBBETS FELSKÄL ovan, EN fråga för hela batchen.
  const jobbfelPerInbetalning = new Map<string, string>();
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
    for (const [inbetalningId, jobb] of senasteJobbPerInbetalning) {
      if (jobb.status === 'fel' && jobb.skal !== null) {
        jobbfelPerInbetalning.set(inbetalningId, jobb.skal);
      }
    }
  }

  // ── Gruppera per anmälan — EN grupp per (deduplicerat) begärt ID, ÄVEN för
  // ett ID utan en enda rad (samma "tomt, aldrig fel"-kontrakt som GET-vägens
  // anmalanRecordId/personId bär, se filhuvudet). ──────────────────────────
  const grupper = new Map<string, BatchGrupp>(
    ids.map((id) => [id, { anmalanRecordId: id, inbetalningar: [], kvitton: [], jobbfel: [] }]),
  );
  const anmalanPerInbetalning = new Map<string, string>();
  for (const post of inbetalningar) {
    anmalanPerInbetalning.set(post.id, post.anmalanRecordId);
    grupper.get(post.anmalanRecordId)?.inbetalningar.push(post);
  }
  for (const kvitto of kvitton) {
    const anmalanId = anmalanPerInbetalning.get(kvitto.inbetalningId);
    if (anmalanId !== undefined) grupper.get(anmalanId)?.kvitton.push(kvitto);
  }
  for (const [inbetalningId, skal] of jobbfelPerInbetalning) {
    const anmalanId = anmalanPerInbetalning.get(inbetalningId);
    if (anmalanId !== undefined) grupper.get(anmalanId)?.jobbfel.push({ inbetalningId, skal });
  }

  console.log(
    `${LOGG} OK BATCH | caller_user_id=${user.id} | requestId=${requestId} | ` +
      `anmalningar=${ids.length} | inbetalningar=${inbetalningar.length}`,
  );

  return jsonResponse({ grupper: [...grupper.values()] }, 200, corsHeaders);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed. Use GET or POST.' }, 405, corsHeaders);
  }

  // [TASK-437] POST = batch-vägen. Grenas FÖRE resten av handlern, som är
  // GET-vägen, HELT OFÖRÄNDRAD (bakåtkompatibilitet, AC #1).
  if (req.method === 'POST') {
    const authForBatch = await requireUser(req, corsHeaders);
    if (authForBatch instanceof Response) return authForBatch;
    try {
      return await hanteraBatch(req, authForBatch.user, requestId, corsHeaders);
    } catch (error) {
      return mapErrorToResponse(error, requestId, corsHeaders, {
        function: 'hamta-inbetalningar',
        method: req.method,
        callerUserId: authForBatch.user.id,
      });
    }
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
      // Se filhuvudets §FYND: EN record-GET på Personen själv, ingen formel.
      // Obefintlig person → `fetchAirtableRecord` returnerar `null` (samma
      // 404-normalisering som resten av `_shared/airtable-client.ts`) → tom
      // lista → samma tomma 200-form nedan, precis som formeln gav förut.
      //
      // AVSIKTLIGT ODISKRIMINERAT (R1-granskning `TASK-351`): "personId finns
      // inte" och "personen finns men har noll anmälningar" ger IDENTISKT
      // tomt 200-svar — ingen 404 för det förra. Detta SPEGLAR
      // `anmalanRecordId`-vägen (rad ~144 ovan): den kollapsar `anmalanIds`
      // till `[anmalanRecordId]` OFÖRSETT om raden existerar, och en obefintlig
      // anmälan ger likaså 200 med tomma listor (KONSISTENSVAKTEN nedan larmar
      // bara om Postgres FAKTISKT har inbetalningar mot en försvunnen anmälan —
      // annars tyst 200, samma mönster). Svarets kontrakt är "betalningar för
      // X", och en tom lista är rätt svar oavsett OM X saknas eller är tom —
      // ett medvetet, konsekvent val, inte en förbisedd genväg.
      const personRecord = await fetchAirtableRecord(PERSONER_TABELL_BAS, personId as string);
      const allaAnmalanIds = personRecord ? stringArray(personRecord.fields[PERSON_ANMALNINGAR_FALT]) : [];
      anmalanIds = allaAnmalanIds.slice(0, MAX_ANMALNINGAR_PER_PERSON);
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
