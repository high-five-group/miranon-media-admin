// @ts-nocheck — Deno Edge Function (esm.sh-import via `_shared/betalningar-db.ts`
// + Deno-globaler; typas vid deploy, se ADR-010 § Fas 7-åtagande).
//
// rebook-registration — TASK-368.4, PRD TASK-368 beslut 7–8, ADR-130.
// Serverkontraktet ombokningssteget i appen (TASK-368.5) bygger på: Lotta kan
// flytta en person från ett event till ett annat i EN operation, och personens
// pengar följer med så att hon inte ser ut som obetald.
//
// ═══════════════════════════════════════════════════════════════════════════
// VARFÖR EN EGEN EF OCH INTE EN TREDJE `atgard` I `cancel-registration`
// ═══════════════════════════════════════════════════════════════════════════
// Uppdraget bad om ett motiverat val. Repots egen betalningsdomän har redan
// gjort exakt denna avvägning och landat i TVÅ funktioner:
// `registrera-inbetalning` SKAPAR en rad, `hantera-inbetalning` verkar på en
// BEFINTLIG (radera/makulera via ett `atgard`-fält). Gränsen går alltså inte
// vid domänen utan vid om operationen SKAPAR något.
//
// En ombokning skapar en ny anmälan, rör en ANDRA databas (Postgres-raderna
// flyttas), räknar om spegeln på TVÅ anmälningar och svarar med ett helt annat
// innehåll (nytt record-ID, flyttade rader, prisskillnad) än
// `cancel-registration`s `{atgard, registrationId, status, notering}`. Att
// klämma in den som ett tredje `atgard`-värde hade tvingat fram en
// diskriminerad union i klientens svarsschema, en andra fältmängd i samma
// allowlist-post, och en omdeploy av EN funktion som leverans 1 redan är
// beroende av (`cancel-registration` är staging-deployad och på väg till prod
// i leverans 1). Blast-radien hålls i stället isär: den här funktionen kan
// felas, deployas om och rullas tillbaka utan att röra avbokningen.
//
// `hantera-inbetalning`-mönstret (ett EF, ett `atgard`-fält) gäller fortsatt
// för `avboka`/`aterta`: två MOTSATTA handlingar på SAMMA rad med gemensamt
// efterarbete. Ombokningen är ingen motsats till avbokningen — den INNEHÅLLER
// en.
//
// ═══════════════════════════════════════════════════════════════════════════
// ORDNINGEN ÄR LASTBÄRANDE (kortets AC #4)
// ═══════════════════════════════════════════════════════════════════════════
//   1. ny anmälan (eller adoption av en befintlig, se § IDEMPOTENSEN)
//   2. flytt av de AKTIVA inbetalningarna i Postgres
//   3. statusbyte + Notering-append på den gamla anmälan
//   4. spegeln räknas om på BÅDA anmälningarna
//   5. aktivitetsloggen
//
// Skälet till att statusbytet ligger EFTER flytten: allt som kan gå fel ska gå
// fel MEDAN den gamla anmälan fortfarande är aktiv. Då är läget läsbart för
// Lotta (personen står kvar där hon var, pengarna syns), och ett omanrop kan
// köra klart. Vore ordningen omvänd hade ett avbrott lämnat en avbokad anmälan
// med pengarna kvar på sig och ingen väg tillbaka utom handpåläggning i basen.
//
// Steg 4 och 5 är BEST-EFFORT och fäller aldrig operationen: spegeln är en
// projektion som självläker vid nästa skrivning (ADR-128 beslut 5) och
// loggningen är en historik, inte en förutsättning (`skrivAktivitet`s eget
// filhuvud). Utfallet SYNS i svaret i stället för att tystas.
//
// ═══════════════════════════════════════════════════════════════════════════
// IDEMPOTENSEN — NYCKELN ÄR SERVER-SIDA FAKTA
// ═══════════════════════════════════════════════════════════════════════════
// Se `_shared/rebook-registration.ts`s filhuvud för hela resonemanget (varför
// varken en klient-buren `Idempotency-Key` eller Notering-raden duger). Kort:
// gamla anmälans STATUS plus FRÅGAN om mål-anmälan redan finns avgör allt.
// Ett andra identiskt anrop efter en fullbordad ombokning skapar ingen anmälan,
// flyttar noll rader, skriver ingen status och loggar inget — det räknar bara
// om spegeln och svarar med `aterupptaget: true`.
//
// ═══════════════════════════════════════════════════════════════════════════
// KVITTOT RÖRS ALDRIG (ADR-130 beslut 2)
// ═══════════════════════════════════════════════════════════════════════════
// `kvitto_id` ingår inte i flyttens `update`, och `kvitton.inbetalning_id` kan
// strukturellt inte pekas om: `service_role`s UPDATE-grant på `kvitton` är
// KOLUMN-SCOPAD till (lagringsnyckel, skickad_nar, mottagare, status)
// (migration `20260830195728` § 4). Att kvittot står kvar är alltså en
// databasgaranti, inte något denna kod behöver hålla.
//
// ═══════════════════════════════════════════════════════════════════════════
// RACE-FÖNSTRET (känd, delad gräns — ingen ny brist)
// ═══════════════════════════════════════════════════════════════════════════
// Läsningen av anmälan och skrivningen av dess status är två separata
// Airtable-anrop utan optimistic-concurrency-token; basens REST-API har ingen
// sådan mekanism (`docs/reference/airtable-constraints.md` §A). Samma gräns
// `cancel-registration`, `create-registration` och `skrivSpegel` redan lever
// med. FLYTTEN i Postgres bär däremot sitt villkor I FRÅGAN
// (`.eq('status','aktiv')` + `.eq('anmalan_record_id', gamla)`), så två
// samtidiga ombokningar kan inte flytta samma rad två gånger.

import {
  AKTIVITETSTYP,
  ANMALAN_VERB,
  anmalanObjektId,
  byggStatement,
  lasVisningsnamnUrJwt,
  NY_ANMALAN_EXTENSION_IRI,
} from '../_shared/aktivitetslogg.ts';
import { requireUser } from '../_shared/auth.ts';
import { fetchAirtableRecord, updateAirtableRecord } from '../_shared/airtable-client.ts';
import { byggPrisbild, lasAnmalan, lasEvent, skrivSpegel } from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  lasInbetalningarForAnmalan,
  radTillInbetalning,
  skapaAdminKlient,
  skrivAktivitet,
} from '../_shared/betalningar-db.ts';
import { harledBetalning } from '../_shared/betalningsharledning.ts';
import { appendNotering, stockholmDatum } from '../_shared/cancel-registration.ts';
import { scalarNumber, scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import {
  hamtaEventNyckel,
  hamtaSkapaOperation,
  skapaAnmalanRad,
  sokBefintligAnmalan,
} from '../_shared/create-registration.ts';
import { generateRequestId, mapErrorToResponse } from '../_shared/errors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  barOmbokningsradMot,
  beslutaOmbokning,
  byggFlyttadOgonblicksbild,
  byggOmbokningsrad,
  summeraFlyttat,
} from '../_shared/rebook-registration.ts';

const LOGG = '[rebook-registration]';
const OPERATION_KEY = 'rebook-registration';
const REGISTRATIONS_TABLE = 'Anmälningar';
/** Speglar `create-registration`/`betalningar-bas.ts`s rec-ID-form. */
const REC_ID_RE = /^rec[A-Za-z0-9]{14}$/;

/** Prisbilden när anmälan inte går att läsa — härledningen får då `null`-pris. */
const TOM_PRISBILD = { avtalatPris: null, eventPris: null, anmalningsavgift: null, eventTyp: null };

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
 * AC #4: "misslyckas ett steg rapporteras exakt vilket". Steget står BÅDE i
 * serverloggen (korrelerbart via requestId, ADR-111) och i svaret, så att
 * appen kan säga vad som hann hända innan det brast — ett generiskt 500 hade
 * lämnat Lotta utan att veta om personen fått en ny anmälan eller inte.
 */
function stegFel(
  steg: string,
  meddelande: string,
  fel: unknown,
  requestId: string,
  corsHeaders: Record<string, string>,
): Response {
  const text = fel instanceof Error ? fel.message : String(fel);
  console.error(`${LOGG} STEG-FEL | requestId=${requestId} | steg=${steg} | fel=${text}`);
  return jsonResponse({ error: meddelande, code: 'steg_fel', steg, requestId }, 500, corsHeaders);
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  // METOD-VAKTEN FÖRE AUTH (repots kontrakt, `tests/api/ef-metod-vakt.test.ts`):
  // fel metod är ett kontraktsfel, inte ett auth-fel.
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

  const registrationId = body?.registrationId;
  if (typeof registrationId !== 'string' || !REC_ID_RE.test(registrationId)) {
    return badRequest(
      'registrationId krävs (Anmälningar record-ID, rec-prefix + 14 tecken)',
      corsHeaders,
    );
  }

  const nyttEventId = body?.nyttEventId;
  if (typeof nyttEventId !== 'string' || !REC_ID_RE.test(nyttEventId)) {
    return badRequest(
      'nyttEventId krävs (Eventplanering record-ID, rec-prefix + 14 tecken)',
      corsHeaders,
    );
  }

  // INGET `skal`-FÄLT, med avsikt. Kortets AC #2 låser Notering-radens form till
  // '[Ombokad ÅÅÅÅ-MM-DD av <aktör>] till <event, datum>' — skälet ÄR
  // ombokningen, och det härleds server-side ur mål-eventet (PRD beslut 7:
  // "fyller i skälet"). En fritextparameter hade gjort formen valfri och
  // därmed obeständig.

  const statusOperation = getOperation(OPERATION_KEY);
  if (!statusOperation) {
    return badRequest(`Unknown operation: ${OPERATION_KEY}`, corsHeaders);
  }
  const skapaOperation = hamtaSkapaOperation();
  if (!skapaOperation) {
    return badRequest('Unknown operation: create-registration', corsHeaders);
  }

  try {
    // ── Läs den gamla anmälan RÅTT: den bär både beslutsunderlaget (Status,
    // Event-länken) och personuppgifterna den nya anmälan ska ärva ──────────
    const record = await fetchAirtableRecord(REGISTRATIONS_TABLE, registrationId);
    if (!record) {
      return jsonResponse({ error: `Anmälan hittades inte: ${registrationId}` }, 404, corsHeaders);
    }
    const f = record.fields;
    const aktuellStatus = selectName(f['Status'] ?? null);
    const befintligNotering = scalarString(f['Notering'] ?? null);
    const fornamn = scalarString(f['Förnamn']) ?? '';
    const efternamn = scalarString(f['Efternamn']) ?? '';
    const namn = `${fornamn} ${efternamn}`.trim() || registrationId;
    const epost = scalarString(f['E-post']);
    const telefon = scalarString(f['Mobilnummer']);
    const antalPlatser = scalarNumber(f['Antal platser']);
    const eventLank = f['Event'];
    const gammaltEventId = Array.isArray(eventLank)
      ? (eventLank.find((v: unknown) => typeof v === 'string') ?? null)
      : null;

    // E-posten ÄR nyckeln till affärs-unikheten på mål-eventet. Utan den kan
    // varken adoptionen eller skapandet göras — och en anmälan utan e-post kan
    // `create-registration` ändå aldrig ha skapat.
    if (!epost || epost.trim() === '') {
      return jsonResponse(
        {
          error: 'Anmälan saknar e-postadress och kan därför inte bokas om.',
          code: 'epost_saknas',
        },
        409,
        corsHeaders,
      );
    }

    // ── Mål-eventet: EventKey (för affärs-unikheten) och prisbilden ─────────
    //
    // TVÅ LÄSNINGAR AV SAMMA EVENTRAD, medvetet: `hamtaEventNyckel` behöver
    // `EventKey` (en formel `lasEvent` inte returnerar), och `lasEvent` löser
    // prisets tre nivåer inklusive Eventinnehåll-standarden. Att slå ihop dem
    // hade krävt en ändring i `_shared/betalningar-bas.ts`, som TASK-372 rör
    // parallellt — den filen lämnas orörd, och kostnaden (ett extra anrop mot
    // basens delade tak) bokförs hellre än att två skivor skriver i samma fil.
    const nyckel = await hamtaEventNyckel(nyttEventId);
    if (!nyckel) {
      return jsonResponse({ error: `Eventet hittades inte: ${nyttEventId}` }, 404, corsHeaders);
    }
    const nyttEvent = await lasEvent(nyttEventId);

    // ── Finns redan en anmälan för personen på mål-eventet? ────────────────
    const befintligMalAnmalan = await sokBefintligAnmalan(
      skapaOperation.tableId,
      epost,
      nyckel.eventKey,
    );

    const beslut = beslutaOmbokning({
      aktuellStatus,
      gammaltEventId,
      nyttEventId,
      malAnmalanFinns: befintligMalAnmalan !== null,
      // Adoptionens andra villkor: bär gamla anmälans Notering en Ombokad-rad
      // mot PRECIS detta målevent? Namnet/datumet läses ur samma källa som
      // raden en gång skrevs ur (`lasEvent`, med `hamtaEventNyckel`s
      // `Event (text)` som fallback) — se `barOmbokningsradMot`.
      omkorningBekraftad: barOmbokningsradMot(
        befintligNotering,
        nyttEvent?.namn ?? nyckel.eventNamnFallback,
        nyttEvent?.startdatum ?? null,
      ),
    });
    if (!beslut.ok) {
      // 409, inte 400: BÅDA ID:na är giltig indata — det är anmälans NUVARANDE
      // TILLSTÅND (eller att målet är samma event) som gör ombokningen
      // otillåten. Samma klassning som `cancel-registration`s `redan_avbokad`.
      console.warn(
        `${LOGG} DENY ${beslut.kod} | caller_user_id=${user.id} | registrationId=${registrationId} | ` +
          `nyttEventId=${nyttEventId} | status=${aktuellStatus ?? 'null'}`,
      );
      return jsonResponse({ error: beslut.felmeddelande, code: beslut.kod }, 409, corsHeaders);
    }

    const db = skapaAdminKlient();
    const nu = new Date();
    const visningsnamn = lasVisningsnamnUrJwt(authHeader) ?? user.email ?? user.id;

    // ── Steg 1: den nya anmälan ───────────────────────────────────────────
    //
    // ADOPTION SKER ENDAST I ÅTERUPPTAGNINGSLÄGET (Marcus beslut 2026-09-03,
    // granskningen av PR #2247). Varje annat läge där personen redan har en
    // anmälan på mål-eventet har redan avvisats ovan med
    // `redan_anmald_pa_malet` — pengar slås aldrig ihop mellan två anmälningar
    // på en knapptryckning. Se `_shared/rebook-registration.ts`s filhuvud
    // § ADOPTION och ADR-130 § Konsekvenser för vad det kostar.
    let nyAnmalanId: string;
    let nyAnmalanSkapad = false;
    if (beslut.lage === 'aterupptagning') {
      // `beslutaOmbokning` gav detta läge ENBART när mål-anmälan finns, så
      // `befintligMalAnmalan` kan inte vara null här.
      nyAnmalanId = (befintligMalAnmalan as { id: string }).id;
    } else {
      let skrivet;
      try {
        skrivet = await skapaAnmalanRad(
          {
            fornamn,
            efternamn,
            email: epost,
            telefon,
            antalPlatser,
            // INGEN Notering ärvs till den nya anmälan: den gamlas Notering kan
            // bära avbokningshistorik och Lottas anteckningar om ETT annat
            // event. Den nya anmälan börjar rent, precis som en manuellt
            // skapad gör.
            notering: null,
            eventId: nyttEventId,
          },
          nyckel.eventKey,
          LOGG,
          user.id,
        );
      } catch (fel) {
        return stegFel(
          'skapa-anmalan',
          'Den nya anmälan kunde inte skapas. Inget har ändrats.',
          fel,
          requestId,
          corsHeaders,
        );
      }
      if (!skrivet.ok) {
        if (skrivet.kod === 'falt_ej_tillatet') {
          return badRequest(
            `Field "${skrivet.falt}" not allowed for operation "create-registration"`,
            corsHeaders,
          );
        }
        return badRequest('Unknown operation: create-registration', corsHeaders);
      }
      nyAnmalanId = skrivet.record.id;
      nyAnmalanSkapad = true;
    }

    // ── Steg 2: flytta de AKTIVA inbetalningarna ───────────────────────────
    //
    // `.eq('status','aktiv')` är hela regeln bakom "makulerade flyttas inte"
    // (kortets AC #3): en makulerad post är en RÄTTAD post och hör hemma där
    // den registrerades — den räknas inte i någon summa (`harledBetalning`
    // filtrerar på samma villkor) och ska inte följa med till ett event den
    // aldrig avsåg. `kvitto_id` står INTE i uppdateringen (ADR-130 beslut 2).
    // Villkoret ligger i FRÅGAN, inte i en tidigare läsning — därför är ett
    // omanrop strukturellt en nolloperation, inte en dubbelflytt.
    const ogonblicksbild = byggFlyttadOgonblicksbild(
      nyttEvent?.namn ?? null,
      nyttEvent?.startdatum ?? null,
    );
    let flyttadeRader = 0;
    let flyttadSumma = 0;
    try {
      const { data: flyttade, error: flyttFel } = await db
        .from(INBETALNINGAR_TABELL)
        .update({ anmalan_record_id: nyAnmalanId, ...ogonblicksbild })
        .eq('anmalan_record_id', registrationId)
        .eq('status', 'aktiv')
        .select(INBETALNING_KOLUMNER);
      if (flyttFel) throw flyttFel;
      const poster = (flyttade ?? []).map(radTillInbetalning);
      flyttadeRader = poster.length;
      flyttadSumma = summeraFlyttat(poster.map((post) => post.belopp));
    } catch (fel) {
      return stegFel(
        'flytta-inbetalningar',
        nyAnmalanSkapad
          ? 'Den nya anmälan skapades, men inbetalningarna kunde inte flyttas. Den gamla anmälan är oförändrad — försök igen.'
          : 'Inbetalningarna kunde inte flyttas. Den gamla anmälan är oförändrad — försök igen.',
        fel,
        requestId,
        corsHeaders,
      );
    }

    // ── Steg 3: statusbyte + Notering-append på den GAMLA anmälan ──────────
    let nyNotering = befintligNotering ?? '';
    if (beslut.statusSkaSkrivas) {
      const nyRad = byggOmbokningsrad(
        stockholmDatum(nu),
        visningsnamn,
        nyttEvent?.namn ?? nyckel.eventNamnFallback,
        nyttEvent?.startdatum ?? null,
      );
      nyNotering = appendNotering(befintligNotering, nyRad);
      const fields: Record<string, unknown> = {
        Status: beslut.nyStatus,
        Notering: nyNotering,
      };
      // SSOT-grind (defense-in-depth): varje server-byggt fält måste vara
      // allowlistat INNAN Airtable-anropet.
      const disallowed = findDisallowedField(statusOperation, fields);
      if (disallowed !== null) {
        console.warn(
          `${LOGG} DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
        );
        return badRequest(
          `Field "${disallowed}" not allowed for operation "${OPERATION_KEY}"`,
          corsHeaders,
        );
      }
      try {
        await updateAirtableRecord(statusOperation.tableId, registrationId, fields);
      } catch (fel) {
        return stegFel(
          'statusbyte',
          'Pengarna flyttades till den nya anmälan, men den gamla kunde inte avbokas. Kör ombokningen igen — den fortsätter där den slutade.',
          fel,
          requestId,
          corsHeaders,
        );
      }
    }

    // ── Steg 4: spegeln på BÅDA anmälningarna ──────────────────────────────
    //
    // Den GAMLA måste speglas om, annars står basens `Summa inbetalt (kr)`
    // kvar på pengar som inte längre sitter där — och `Saknas (kr)` räknas ur
    // just den summan. Den NYA måste speglas om av samma skäl åt andra hållet.
    // Härledningen läser HELA mängden per anmälan (ADR-128 beslut 2), aldrig
    // ett delta.
    const gammalAnmalan = await lasAnmalan(registrationId);
    const gammaltEvent = gammalAnmalan?.eventId ? await lasEvent(gammalAnmalan.eventId) : null;
    const allaGamla = await lasInbetalningarForAnmalan(db, registrationId);
    const harledningGammal = harledBetalning(
      allaGamla.map((post) => ({ belopp: post.belopp, status: post.status })),
      gammalAnmalan ? byggPrisbild(gammalAnmalan, gammaltEvent) : TOM_PRISBILD,
    );
    const spegelGammal = gammalAnmalan
      ? await skrivSpegel(
          registrationId,
          {
            summaInbetalt: harledningGammal.summa,
            anmalningsavgift: harledningGammal.anmalningsavgiftVarde,
            slutbetalning: harledningGammal.slutbetalningVarde,
          },
          LOGG,
        )
      : {
          skrivet: false,
          forsok: 0,
          skal: 'Anmälan finns inte längre i basen — spegeln kan inte skrivas.',
        };

    const nyAnmalan = await lasAnmalan(nyAnmalanId);
    const allaNya = await lasInbetalningarForAnmalan(db, nyAnmalanId);
    const harledningNy = harledBetalning(
      allaNya.map((post) => ({ belopp: post.belopp, status: post.status })),
      nyAnmalan ? byggPrisbild(nyAnmalan, nyttEvent) : TOM_PRISBILD,
    );
    const spegelNy = nyAnmalan
      ? await skrivSpegel(
          nyAnmalanId,
          {
            summaInbetalt: harledningNy.summa,
            anmalningsavgift: harledningNy.anmalningsavgiftVarde,
            slutbetalning: harledningNy.slutbetalningVarde,
          },
          LOGG,
        )
      : {
          skrivet: false,
          forsok: 0,
          skal: 'Den nya anmälan kunde inte läsas — spegeln kan inte skrivas.',
        };

    // ── Steg 5: aktivitetsloggen (best-effort, EFTER basskrivningen) ───────
    //
    // Loggas BARA när denna körning faktiskt utförde ombokningen. En
    // återupptagning (`statusSkaSkrivas === false`) har redan en loggrad från
    // första gången — en andra hade gett Lotta två rader för en handling,
    // samma disciplin som `cancel-registration`s idempotens-gren.
    if (beslut.statusSkaSkrivas) {
      await skrivAktivitet(
        db,
        byggStatement({
          statementId: crypto.randomUUID(),
          requestId,
          actorAccountId: user.id,
          actorName: visningsnamn,
          verb: ANMALAN_VERB.bokadeOm,
          // Objektet är den GAMLA anmälan; den NYA bärs i extensions så att
          // BÅDA finns i samma statement (kortets AC #2).
          objektId: anmalanObjektId(registrationId),
          objektNamn: namn,
          aktivitetstyp: AKTIVITETSTYP.anmalan,
          timestamp: nu.toISOString(),
          extraExtensions: { [NY_ANMALAN_EXTENSION_IRI]: anmalanObjektId(nyAnmalanId) },
        }),
      );
    }

    console.log(
      `${LOGG} DONE | caller_user_id=${user.id} | requestId=${requestId} | ` +
        `gammal=${registrationId} | ny=${nyAnmalanId} | skapad=${nyAnmalanSkapad} | ` +
        `lage=${beslut.lage} | flyttade=${flyttadeRader} | spegelGammal=${spegelGammal.skrivet} | ` +
        `spegelNy=${spegelNy.skrivet}`,
    );

    return jsonResponse(
      {
        gammalAnmalanId: registrationId,
        nyAnmalanId,
        /**
         * Skapades raden i DETTA anrop? Efter adoptions-begränsningen är detta
         * den exakta komplementen till `aterupptaget` — fältet står kvar för
         * att det namnger FAKTUM (en rad skrevs) där `aterupptaget` namnger
         * LÄGET, och 368.5 behöver det förra för sin bekräftelsetext.
         */
        nyAnmalanSkapad,
        /** `true` = allt var redan gjort; detta anrop ändrade ingenting. */
        aterupptaget: beslut.lage === 'aterupptagning',
        nyttEventId,
        /** Gamla anmälans status EFTER operationen. */
        status: beslut.nyStatus,
        /** Gamla anmälans Notering EFTER appendet (hela fältet, som `cancel-registration`). */
        notering: nyNotering,
        /**
         * ═══ PER ANROP, INTE ETT TILLSTÅND — LÄS DETTA FÖRE DU VISAR TALET ═══
         * `flyttadeRader`/`flyttadSumma` beskriver vad DETTA anrop flyttade.
         * Vid en återupptagning är de därför `0`/`0` trots att pengarna sitter
         * rätt sedan förra gången. En text som säger "X kr flyttades" byggd på
         * `flyttadSumma` skulle alltså påstå "0 kr" om en omkörning.
         *
         * TASK-368.5 ska i stället visa `summaNyAnmalan` — beloppet spegeln
         * faktiskt skrev till den nya anmälan (`spegelNy`) — för allt som
         * beskriver ett TILLSTÅND ("så här mycket sitter nu på anmälan").
         * `flyttadeRader`/`flyttadSumma` hör hemma i kvittensen på HANDLINGEN
         * och i loggen, ingen annanstans.
         */
        flyttadeRader,
        flyttadSumma,
        /**
         * Summan av de AKTIVA inbetalningarna på den NYA anmälan efter
         * operationen — exakt talet `spegelNy` skrev till basens
         * `Summa inbetalt (kr)`. Stabilt över omkörningar.
         */
        summaNyAnmalan: harledningNy.summa,
        /** Priset som gäller på den NYA anmälan. `null` = okänt pris. */
        nyttPris: harledningNy.gallandePris,
        /**
         * Prisskillnaden appen visar (kortets AC #3). Positiv = personen ska
         * betala mellanskillnaden; negativ = pengar ska tillbaka; `null` =
         * priset går inte att avgöra.
         *
         * Talet är `harledBetalning`s `saknas` för den NYA anmälan — alltså
         * nytt pris minus summan av de AKTIVA inbetalningarna som nu sitter
         * där. I normalfallet (nyskapad anmälan utan tidigare inbetalningar)
         * är den summan exakt `flyttadSumma`, vilket är AC:ns ordalydelse. I
         * adoptions-/omanropsfallet skiljer de sig, och då är DETTA talet det
         * sanna: det säger vad som faktiskt saknas på anmälan personen har.
         * Ingen egen prisregel härleds här — `betalningsharledning.ts`
         * återanvänds oförändrad.
         */
        prisskillnad: harledningNy.saknas,
        spegelGammal,
        spegelNy,
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: OPERATION_KEY,
      method: req.method,
      callerUserId: user.id,
    });
  }
});
