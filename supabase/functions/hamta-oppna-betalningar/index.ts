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
//   2. `Saknas (kr)` är BLANK när BASEN inte kan räkna fram ett pris, och
//      `BLANK() > 0` är falskt i Airtable. Sådana anmälningar faller alltså
//      UT ur listan.
//
//      FORMULERINGEN "anmälningar utan pris" VORE FEL, och rättas här
//      (granskningsfynd runda 1): appen kan mycket väl VETA priset i just
//      det fallet. Basens formel läser bara två nivåer — `Avtalat pris (kr)`
//      och lookupen `Pris (kr) (from Event)` — medan `valjPris`
//      (`betalningsharledning.ts`) läser TRE och faller tillbaka på
//      Eventinnehåll-standarden. Ett event vars pris bara finns i
//      standarden har alltså ett känt pris i appen och BLANK i basen.
//      Det är FÖNSTRET som namnges i beslutet nedan.
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
//   + högst ceil(extra anmälningar / 50) EXTRA sökningar mot Anmälningar för
//     fullbetalda rader som ändå har ett oskickat kvitto (TASK-367, se
//     § "KVITTO ATT SKICKA" nedan) — noll i det normala fallet,
//   + ceil(distinkta event / 50) batchade eventläsningar,
//   + högst ett uppslag per DISTINKT (event, typ)-par som saknar egen avgift,
//   + 3 Postgres-frågor (kvitto-att-skicka-kandidaterna, summorna, och de
//     väntande kvittojobben — den sistnämnda bär sedan TASK-367 också
//     köexkluderingen för kandidaterna, se nedan).
// Aldrig en läsning per rad.
//
// ═══════════════════════════════════════════════════════════════════════════
// [TASK-367] "KVITTO ATT SKICKA" HÄRLEDS I POSTGRES, INTE I FLIKENS MINNE
// ═══════════════════════════════════════════════════════════════════════════
// Fyndet (S115 Del 2, 2026-09-03): Marcus registrerade en inbetalning, bytte
// flik, och raden försvann ur inkorgen — betalningen täckte hela priset
// (`Saknas (kr)` blev 0, raden faller ur `OPPEN_BETALNING_FILTER` nedan) OCH
// "väntar på kvitto" levde bara i `BetalningsInkorg.tsx`s React-state. Inget
// mail gick, men ingenting i appen visade det längre.
//
// DEFINITIONEN (S115 Del 2, ordagrant): en AKTIV inbetalning utan `kvitto_id`
// och utan jobbrad i `vantar`/`pagar` ÄR ett kvitto att skicka. Denna
// funktion läser redan varje inbetalning och kön ur Postgres per hämtning —
// härledningen kostar inga nya API-ANROP, bara två extra kolumner i en
// befintlig fråga plus EN ny, global Postgres-fråga.
//
// DEN GLOBALA FRÅGAN ÄR AVSIKTLIGT OSCOPAD. `raderOppna` (Airtable-sökningen
// ovan) känner bara till anmälningar där `Saknas (kr) > 0` — en anmälan som
// blivit FULLBETALD (precis fyndets scenario) finns inte där, men kan mycket
// väl ha ett oskickat kvitto kvar. Kandidaterna måste alltså hämtas OBEROENDE
// av `raderOppna`, och de anmälningar som inte redan är med (`extraRader`
// nedan) hämtas separat och läggs till — annars hade "syns även när
// Saknas (kr) = 0" (kortets AC) varit omöjligt att uppfylla.
//
// `betalsatt <> 'Historik'` UTESLUTER BACKFILLENS RADER (ADR-128 beslut 8,
// samma konstant som `registrera-inbetalning/index.ts`s `BACKFILL_BETALSATT`,
// mätt oberoende härifrån): backfillen (`TASK-346.8`) sätter `status =
// 'aktiv'` och `kvitto_id = null` på VARJE historisk rad — 328 stycken i prod
// vid mättillfället — utan att någonsin gå igenom kvittoflödet. En
// derivering utan denna uteslutning hade gjort VARJE backfillad rad till ett
// falskt "kvitto att skicka" samma dag denna skiva landar: en massregression
// döljs bakom en bugfix. `Historik` är INTE ett värde formuläret kan skicka
// (`VALBARA_BETALSATT` i `Betalningar.schema.ts` utesluter det uttryckligen),
// så uteslutningen kan aldrig dölja en riktig, Lotta-registrerad betalning.
//
// KRYSSRUTAN "SKICKA KVITTO" — LÖST (TASK-367 review runda 1, FYND 2, Marcus
// beslut 2026-09-06 "Definitivt A"). Stod tidigare här som en känd, öppen
// begränsning: registreringsformulärets kryssruta persisterades ingenstans,
// så en inbetalning registrerad MED kryssrutan URTAGEN var i Postgres byte
// för byte identisk med en som väntade på att köas. Kolumnen
// `inbetalningar.kvitto_avbojt` (migration
// `20260906165100_inbetalning_kvitto_avbojt.sql`) stänger hålet:
// `registrera-inbetalning` skriver `!medKvitto` dit, och kandidatfrågan
// nedan (`.eq('kvitto_avbojt', false)`) utesluter sådana rader — samma
// princip som `betalsatt <> 'Historik'` redan bär för backfillen, fast för
// ett AVSIKTLIGT val i stället för en historisk rad.

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
import { lasNumeric, summeraKronor } from '../_shared/betalningsbelopp.ts';
import { raknasSomForfallen, valjPris } from '../_shared/betalningsharledning.ts';

const LOGG = '[hamta-oppna-betalningar]';
const ANMALNINGAR_TABELL_BAS = 'Anmälningar';
const EVENTPLANERING_TABELL = 'Eventplanering';
const EVENTINNEHALL_TABELL = 'Eventinnehåll';

/**
 * ADR-128 beslut 2 i Airtable-syntax. `Avbokad/Ombokad` är ETT valvärde med
 * ett snedstreck i namnet (`data-model.md` § Anmälningar write-fält), inte
 * två värden.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * TVÅ PRISNIVÅER I BASEN, TRE I APPEN — BESLUTAT, INTE ÖVERSETT
 * ═══════════════════════════════════════════════════════════════════════════
 * Granskningsrunda 1 lyfte asymmetrin som en öppen fråga. Orkestreraren
 * avgjorde den under nattmandatet B3, och beslutet är VÄG (a):
 *
 *   BASENS `Saknas (kr)` FÖRBLIR ÖPPENHETS-DEFINITIONEN. Det är S113 Del 11
 *   beslut 12 ordagrant, och det är därför filtret nedan frågar basen i
 *   stället för att räkna om öppenheten här.
 *
 * FÖNSTRET som beslutet lämnar öppet, namngivet så att ingen behöver
 * återupptäcka det: en anmälan till ett event vars pris finns ENBART i
 * Eventinnehåll-standarden — inte som per-event-override och inte som
 * `Avtalat pris (kr)` — får BLANK i basens formel (den läser bara lookupen
 * `Pris (kr) (from Event)`, alltså Eventplanering) och faller därmed ur
 * listan, trots att appens `valjPris` skulle ha hittat priset på tredje
 * nivån.
 *
 * FÖNSTRET STÄNGS AV DATA, INTE AV KOD: pris-backfillen (`TASK-346.8`) sätter
 * per-event-priser i staging, och prod täcks av morgonchecklistans punkt
 * "priser på kommande event" (`TASK-346.11`). Att i stället bredda filtret
 * här hade gjort öppenheten till TVÅ konkurrerande definitioner — en i basen
 * som Lottas vyer läser, och en i appen — vilket är precis vad ADR-128
 * beslut 6 (spegeln är en projektion, aldrig sanningen) finns för att
 * förhindra.
 */
const OPPEN_BETALNING_FILTER = 'AND({Saknas (kr)} > 0, {Status} != "Avbokad/Ombokad")';

/**
 * [TASK-367] Samma sentinel som `registrera-inbetalning/index.ts`s
 * `BACKFILL_BETALSATT` — mätt oberoende härifrån, se den filens kommentar:
 * "`Historik` sätts BARA av backfillen (ADR-128 beslut 8), aldrig av
 * formuläret." En lokal, egen konstant (inte en delad import) av samma skäl
 * som filens övriga fältlistor är lokala: ingen av de två EF:erna importerar
 * den andras magiska strängar, och värdet är en databasgaranti (ADR-128), inte
 * en detalj som förväntas ändras.
 */
const BACKFILL_BETALSATT = 'Historik';

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

/**
 * [TASK-367] Fältlistan bägge Anmälningar-sökningarna behöver — den
 * ursprungliga (`OPPEN_BETALNING_FILTER`) OCH extra-hämtningen av
 * fullbetalda anmälningar med ett oskickat kvitto. EN lista, inte två
 * kopior som kan glida isär: de sätter samma `betalningar[]`-form.
 */
const ANMALNINGAR_FALT = [
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
];

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
    const raderOppna = await fetchFromAirtable(ANMALNINGAR_TABELL_BAS, {
      filterByFormula: OPPEN_BETALNING_FILTER,
      fields: ANMALNINGAR_FALT,
    });

    // ── [TASK-367] Kvitto-att-skicka-kandidaterna, GLOBALT ────────────────
    // Se filhuvudets § "KVITTO ATT SKICKA" för hela resonemanget. Frågan är
    // MEDVETET oscopad mot `raderOppna`: en fullbetald anmälan (Saknas = 0)
    // finns inte där, men kan ändå ha ett oskickat kvitto kvar — exakt
    // fyndets scenario. `betalsatt <> BACKFILL_BETALSATT` utesluter
    // backfillens historiska rader (ADR-128 beslut 8) — utan den blir varje
    // sådan rad ett falskt "kvitto att skicka".
    const db = skapaAdminKlient();
    const { data: kandidatRadar, error: kandidatFel } = await db
      .from(INBETALNINGAR_TABELL)
      .select('id, anmalan_record_id, belopp')
      .eq('status', 'aktiv')
      .is('kvitto_id', null)
      .eq('kvitto_avbojt', false)
      .neq('betalsatt', BACKFILL_BETALSATT);
    if (kandidatFel) throw kandidatFel;

    // RÅ ÄNNU — köexkluderingen sker LÄNGRE NER, tillsammans med den
    // BEFINTLIGA jobbrads-frågan (se § "Postgres: summorna och de väntande
    // kvittojobben" nedan). Den frågan är redan scopad mot VARJE inbetalning
    // som hör till en anmälan i det slutgiltiga `rader` — en mängd som (via
    // extra-hämtningen nedan) med NÖDVÄNDIGHET omfattar alla kandidater här,
    // så en andra, separat jobbrads-fråga bara för kandidaterna hade varit
    // samma fråga två gånger. `kandidatPerAnmalan` är därför RÅ (oexkluderad)
    // fram tills sista steget i `betalningar`-sammansättningen.
    const kandidatPerAnmalan = new Map<
      string,
      { inbetalningId: string; belopp: number }[]
    >();
    for (const rad of kandidatRadar ?? []) {
      const anmalanId = rad.anmalan_record_id as string;
      const lista = kandidatPerAnmalan.get(anmalanId) ?? [];
      lista.push({ inbetalningId: rad.id as string, belopp: lasNumeric(rad.belopp) ?? 0 });
      kandidatPerAnmalan.set(anmalanId, lista);
    }

    // De kandidat-anmälningar som INTE redan är med i `raderOppna` — de
    // fullbetalda. Hämtas i en EGEN, batchad sökning: samma `RECORD_ID()
    // OR(...)`-mönster som eventuppslaget nedan använder för Eventplanering,
    // återanvänt här för Anmälningar. `{Status} != "Avbokad/Ombokad"` speglar
    // `OPPEN_BETALNING_FILTER`s andra villkor — en avbokad/ombokad anmälan
    // ska inte dyka upp här heller, oavsett kvittoläge.
    const kandidatAnmalanIds = [...kandidatPerAnmalan.keys()];
    const kandaAnmalanIds = new Set(raderOppna.map((rad) => rad.id));
    const extraAnmalanIds = kandidatAnmalanIds.filter((id) => !kandaAnmalanIds.has(id));

    const raderExtra: typeof raderOppna = [];
    for (const bit of delar(extraAnmalanIds, BATCH_STORLEK)) {
      const extra = await fetchFromAirtable(ANMALNINGAR_TABELL_BAS, {
        filterByFormula: `AND(OR(${bit.map((id) => `RECORD_ID()='${id}'`).join(',')}), {Status} != "Avbokad/Ombokad")`,
        fields: ANMALNINGAR_FALT,
      });
      raderExtra.push(...extra);
    }

    // FRÅN OCH MED HÄR ÄR `rader` DEN SAMMANSLAGNA MÄNGDEN — allt nedanför
    // (eventuppslag, prisstandard, Postgres-summorna) körs över BÅDA
    // grupperna, precis som om EF:en alltid hade returnerat dem tillsammans.
    const rader = [...raderOppna, ...raderExtra];

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
    // `db`-klienten är redan skapad ovan (§ "Kvitto-att-skicka-kandidaterna").
    const anmalanIds = rader.map((rad) => rad.id);

    const summaPerAnmalan = new Map();
    const vantandeKvitton = new Map();
    /**
     * [TASK-367] Inbetalning-ID:n som ligger i kön (`vantar`/`pagar`) just nu
     * — köexkluderingen för `kandidatPerAnmalan` ovan. Denna fråga är REDAN
     * scopad mot varje inbetalning som hör till en anmälan i `rader`, en
     * mängd som (via extra-hämtningen ovan) med NÖDVÄNDIGHET omfattar VARJE
     * kandidat: en andra jobbrads-fråga bara för kandidaterna hade frågat
     * databasen samma sak två gånger.
     */
    const koadeInbetalningIds = new Set<string>();

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
          // [TASK-367] Oberoende av anmälan-uppslaget nedan: en kandidat är
          // "köad" oavsett om dess anmälan går att slå upp här.
          koadeInbetalningIds.add(rad.objekt_id as string);
          const anmalanId = inbetalningTillAnmalan.get(rad.objekt_id);
          if (!anmalanId) continue;
          vantandeKvitton.set(anmalanId, (vantandeKvitton.get(anmalanId) ?? 0) + 1);
        }
      }
    }

    // [TASK-367] DEN SLUTGILTIGA "kvitto att skicka"-mängden: kandidaterna
    // minus de som redan ligger i kön. Se filhuvudets § "KVITTO ATT SKICKA".
    const oskickadePerAnmalan = new Map<string, { inbetalningId: string; belopp: number }[]>();
    for (const [anmalanId, kandidater] of kandidatPerAnmalan.entries()) {
      const kvar = kandidater.filter((k) => !koadeInbetalningIds.has(k.inbetalningId));
      if (kvar.length > 0) oskickadePerAnmalan.set(anmalanId, kvar);
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
      const saknas = scalarNumber(f['Saknas (kr)']);

      // [TASK-367 review runda 1, FYND 1] Se `_shared/betalningsharledning.ts`s
      // `raknasSomForfallen`-docblock för varför `saknas > 0` krävs HÄR också
      // — inte bara i `OPPEN_BETALNING_FILTER`. `raderExtra` (§ "KVITTO ATT
      // SKICKA" ovan) bryter antagandet att varje rad redan har `Saknas
      // (kr) > 0`.
      if (raknasSomForfallen(saknas, deadline, idag)) forfallna += 1;

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
        saknas,
        gallandePris: valjPris(avtalatPris, prisFranEvent, ev?.pris ?? null),
        anmalningsavgift: ev?.avgift ?? null,
        summaInbetalt,
        summaInbetaltSpegel: spegel,
        spegelIFas: Math.abs((spegel ?? 0) - summaInbetalt) < ORE_TOLERANS,
        deadlineSlutbetalning: deadline,
        kvittonAttSkicka: vantandeKvitton.get(rad.id) ?? 0,
        // [TASK-367] Se filhuvudets § "KVITTO ATT SKICKA" — tomt array är det
        // normala fallet (inget att skicka), inte en avsaknad av data.
        oskickadeKvitton: oskickadePerAnmalan.get(rad.id) ?? [],
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
