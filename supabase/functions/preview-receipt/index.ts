// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som send-receipt-email/index.ts och
// generate-event-attachment/index.ts.
//
// preview-receipt — TASK-246 "Riktigt genererad PDF i Visa-overlayen för
// mallar (klass B) och generatorer (klass C)", klass C-halvan
// ("person-genererad", t.ex. betalningskvittot).
//
// VARFÖR EN EGEN EF I STÄLLET FÖR ATT ÅTERANVÄNDA send-receipt-email
// (VERIFIERAT, inte antaget — ADR-086 premiss-pass): `_shared/send-
// receipt.ts` § `sendReceipt` är EN sammansatt orkestrator utan dry-run-
// läge, och TVÅ av dess steg är sidoeffekter som en förhandsvisning aldrig
// får ha (AC #3):
//
//   1. `allocateReceiptNumber` (steg 2, KÖRS FÖRE sändningsförsöket) SKRIVER
//      en Kvitton-rad i Airtable OMEDELBART (`_shared/receipt-numbering.ts`
//      § `ledger.create` → `createAirtableRecord`) — även om sändningen
//      sedan avvisas. En bas-skrivning, per definition.
//   2. `deps.sendEmail` (steg 4) är ett RIKTIGT Resend-anrop
//      (`makeRealSender`, send-receipt-email/index.ts) — ett riktigt
//      utgående mail vid en lyckad körning.
//
// Att lägga till ett `dryRun`-flagga-läge INUTI `sendReceipt` hade krävt att
// grena UTANFÖR varje sidoeffekt-anrop i en funktion vars HELA existens är
// att komponera dem i rätt ordning (samma fils eget filhuvud, punkt 1–6) —
// mer riskabelt än en liten, dedikerad, sidoeffektsfri EF som ÅTERANVÄNDER
// [TASK-309.5, uppdaterat — se `_shared/receipt-content.ts`:s filhuvud för
// hela historiken] `_shared/mall-data.ts`s `byggKvittoData` +
// `_shared/mall-render.ts`s `renderaMallPdf('kvitto', …)` (Eta + DocRaptor,
// ERSATTE `kvittoRader` + den nu RIVNA `renderKvittoPdf`/`_shared/
// receipt-pdf.ts`, pdf-lib) utan att röra ledgern, Kvitton-tabellen eller
// Resend ALLS. Denna filen importerar VARKEN `_shared/send-receipt.ts`
// ELLER `_shared/receipt-numbering.ts` ELLER `resend` DIREKT. EN indirekt
// textreferens finns, ETT HOPP LÄNGRE BORT ÄN FÖRUT: `_shared/mall-data.ts`
// importerar `_shared/receipt-content.ts`, som har en `import type
// { Betalning, Betalsatt } from './send-receipt.ts'` — men det är en
// TYPE-ONLY-import (bara literal-unions för `KvittoradSpec`s fält),
// ERAD AV TYPESCRIPT VID TRANSPILERING (ingen JS-import kvarstår i den
// körda koden — Deno kör aldrig, laddar aldrig, det modulträdet).
// `supabase functions deploy` laddar ändå upp `send-receipt.ts`/
// `receipt-numbering.ts`/`send-bulk.ts` som ASSETS (dess statiska
// grafscanner särskiljer inte `import type` från `import` när den paketerar
// källfiler för uppladdning) — det är en deploy-tids-artefakt, inte ett
// runtime-beroende. Resend importeras ALDRIG någonstans i denna kedjan.
//
// ═══════════════════════════════════════════════════════════════════════════
// [TASK-353, 2026-09-01] TVÅ GRENAR SEDAN DENNA SKIVA — LÄS DETTA FÖRST
// ═══════════════════════════════════════════════════════════════════════════
// EF:en bär NU TVÅ lägen, valda av request-bodyn:
//
//   • `{ eventId }` (OFÖRÄNDRAT, dagens enda läge) → TYPEXEMPEL. Detta är
//     Dokument-ytans generator-katalog, och stycket "PERSONDATA" nedan gäller
//     ORDAGRANT för den grenen.
//   • `{ inbetalningId }` (NYTT, ADDITIVT) → den KONKRETA inbetalningens
//     kvitto, med riktigt kundnamn, riktigt belopp, riktigt betalsätt och
//     riktigt betalningsdatum. Se `hamtaRiktigtUnderlag`s docblock för HELA
//     motiveringen och för den mätta premiss-fällning som gjorde grenen
//     nödvändig.
//
// PERSONDATA-STYCKET NEDAN ÄR DÄRMED AMENDERAT, INTE RIVET. Dess mening
// "Kundnamn/belopp/betalsätt kan STRUKTURELLT inte vara verkliga här" var
// sann om den ENDA yta som fanns när den skrevs (generator-katalogen), och är
// fortsatt sann OM den grenen. Den är INTE längre sann om EF:en som helhet:
// betalningsflödets granskningssteg HAR en inbetalning vald, och då faller
// varje punkt i uppräkningen (det finns en vald betalning, beloppet är det
// Lotta själv registrerade, och personen har per definition en betalning
// under behandling). Att låta stycket stå oförändrat hade gjort det till en
// tyst osanning om den nya grenen — ADR-083-disciplinen kräver amendering.
//
// SIDOEFFEKTSFRIHETEN ÄR INVARIANT ÖVER BÅDA GRENARNA: inget allokerat
// kvittonummer, ingen `kvitton`-rad, ingen `jobb_rad`-rad, inget Resend-anrop.
// Endast det transienta Storage-utkastet, i båda fallen.
//
// PERSONDATA: TYPEXEMPEL, INTE en verklig anmälan (bokfört beslut, kortets
// notes, AC #2) — GÄLLER `{ eventId }`-GRENEN. Eventet ÄR verkligt (samma
// eventId som Dokument-ytans redan valda event — samma "riktig PDF ur
// eventets verkliga data"-linje som klass B). Kundnamn/belopp/betalsätt kan
// STRUKTURELLT inte vara verkliga I DEN GRENEN:
//   - Dokument-ytans generator-katalog (GeneratorRad) har ingen anmälan/
//     betalning VALD — det är en generisk katalogvy, inte betalnings-
//     flödet (`BetalningsSkrivYta` § `SkrivRad`, AtgardsSida.tsx).
//   - Belopp/betalsätt är ALLTID Lotta-inmatade vid en riktig sändning,
//     ALDRIG lästa ur basen (basen saknar ett prisfält — ADR-109 § Öppna
//     punkter, verifierat 2026-08-10). En "verklig" siffra här hade alltså
//     varit lika påhittad som typexemplet, bara mindre ärligt märkt.
//   - Att visa en RIKTIG persons namn i en generisk katalog-förhandsvisning
//     (utan att den personen faktiskt har en betalning under behandling)
//     är en dataexponering utan syfte — samma "gissa aldrig, exponera
//     aldrig utan skäl"-disciplin som resten av bilage-fundamentet.
//
// KVITTONUMRET ÄR ALDRIG ETT ALLOKERAT NUMMER — "FÖRHANDSVISNING" är en
// ÄRLIG platshållare (Gunilla-principen: Lotta ska aldrig kunna förväxla
// detta med ett riktigt kvitto), strukturellt oskiljbar från "MM-<år>-N"
// bara genom att INTE följa det mönstret. Ett andra anrop ger EXAKT samma
// platshållartext (aldrig inkrementerande) — det ÄR beviset att ingen
// ledger rörts (se testsvitens "två anrop, samma nummer"-fall).
//
// [ADR-124, TASK-302.2] LEVERANSVÄGEN ÄNDRAD — AC #3 (TASK-146.5) AMENDERAS
// ÖPPET, RIVS INTE. Raden nedan löd till och med 2026-08-22: "LÄSER
// (fetchAirtableRecord mot Eventplanering) — INGEN SKRIVNING alls, varken
// Airtable, Storage eller Resend." Den premissen — att bytes till klienten
// räcker för att visa dokumentet — föll mot en mätning (sex
// klientleveransarmar, headed Chrome 151, `ADR-124` § Kontext): endast en
// URL SERVERAD AV NÄTVERKSTJÄNSTEN scrollar jämnt. Ny, amenderad AC #3,
// VERBATIM (`ADR-124` § Beslut 3):
//
//   Förhandsvisningen har noll KONSUMENT-SYNLIGA sidoeffekter: ingen
//   Bilagor-rad, inget allokerat kvittonummer, inget mail. Den skriver ett
//   TRANSIENT utkast under `utkast/<eventId>/<typ>.pdf` i bucket `bilagor`
//   — aldrig listat i appen, överskrivet per event och typ (`upsert`),
//   borttaget vid skarp generering — för att Chromes PDF-visare bara
//   scrollar jämnt på en URL serverad av nätverkstjänsten (ADR-124).
//
// Det gamla resonemanget om kvittonummer och Resend (ovan i detta filhuvud)
// STÅR KVAR — det är fortfarande sant. Denna EF SKRIVER nu ett TRANSIENT
// Storage-utkast (`laggUtkast`, `_shared/utkast.ts`, `typ: 'kvitto'`), men
// ALDRIG till Airtable och ALDRIG via Resend.
//
// LÄSER (fetchAirtableRecord mot Eventplanering) OCH SKRIVER ETT TRANSIENT
// Storage-utkast — INGEN Airtable-skrivning, INGET Resend-anrop. Samma
// EF1–EF6-ribba (SECURITY-SPEC §6.10) som generate-event-attachment/
// get-attachment-download-url.

import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { isValidEventId } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { byggPrisbild, lasAnmalan, lasEvent } from '../_shared/betalningar-bas.ts';
import {
  INBETALNING_KOLUMNER,
  INBETALNINGAR_TABELL,
  lasInbetalningarForAnmalan,
  radTillInbetalning,
  skapaAdminKlient,
} from '../_shared/betalningar-db.ts';
import { harledBetalning } from '../_shared/betalningsharledning.ts';
import { scalarString, selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, HttpError, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';
// [TASK-309.5] byggKvittoData + renderaMallPdf ERSÄTTER kvittoRader +
// renderKvittoPdf (pdf-lib, `_shared/receipt-pdf.ts`, nu RIVEN) — se
// `_shared/receipt-content.ts`:s filhuvud för den fulla historiken.
import { byggKvittoData } from '../_shared/mall-data.ts';
import { renderaMallPdf } from '../_shared/mall-render.ts';
import { laggUtkast } from '../_shared/utkast.ts';

const EVENTS_TABLE = 'Eventplanering';

/** Ärlig platshållare — ALDRIG ett riktigt allokerat kvittonummer (se filhuvudet). */
const FORHANDSVISNING_KVITTONUMMER = 'FÖRHANDSVISNING';

/** Inbetalningens id-form. Samma uttryck som `hamta-kvittolank/index.ts`. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Typexemplet (se filhuvudets PERSONDATA-stycke för varför persondata inte
 * kan vara verklig här). "Exempelperson" speglar samma "Exempelvärde"-
 * disciplin som `ProduceratExempel` i DokumentYta.tsx bar FÖRE detta kort
 * (skillnaden nu: bytesen som produceras ÄR en riktig, DocRaptor-renderad
 * PDF sedan TASK-309.5 [tidigare pdf-lib-renderad], inte en statisk
 * fältlista).
 */
const TYPEXEMPEL = {
  kundnamn: 'Exempelperson',
  /** Fiktiv adress (S108, Marcus-beslut 2026-08-22) — ALDRIG en verklig kunds e-post, se filhuvudets PERSONDATA-stycke. */
  kundEpost: 'anna.andersson@example.com',
  belopp: 500,
  betalsatt: 'Swish' as const,
  betalning: 'avgift' as const,
};

/**
 * [TASK-353] RIKTIGT UNDERLAG FÖR EN KONKRET INBETALNING — den additiva
 * `inbetalningId`-grenen.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VARFÖR GRENEN ÖVER HUVUD TAGET FINNS
 * ═══════════════════════════════════════════════════════════════════════════
 * Marcus order 2026-09-01: en "Förhandsgranska"-knapp bredvid "Skicka N
 * kvitton", med *"exakt samma metod som … för våra bilagor"*. Bilagornas
 * metod ÄR en EF som renderar EVENTETS RIKTIGA DATA som ett transient utkast
 * (`generate-event-attachment`, `preview: true`). Typexemplet ovan kunde inte
 * bära den ordern: granskningssteget finns för att fånga fel, och en PDF som
 * säger "Exempelperson · 500 kr" när Lotta granskar Bengts 1 200 kr är
 * fabricerad data i exakt det steg som ska fånga fabrikat.
 *
 * DEN MÄTTA PREMISSEN SOM GJORDE GRENEN NÖDVÄNDIG (ADR-086 premiss-pass):
 * uppdraget antog att "kvittona existerar som dokument i kön" och att
 * `hamta-kvittolank` kunde återanvändas rakt av. BÅDA föll mot källan.
 * Kvitton-raden INSERTas först av jobbkonsumenten (`_shared/kvittojobb.ts`
 * FAS 1), PDF:en renderas i FAS 2 — och `hamta-kvittolank` kräver ett
 * `kvittoId` vars `lagringsnyckel` är satt (409 `pdf_saknas` annars). När
 * Lotta står framför knappen finns alltså VARKEN kvitto-post eller PDF.
 * Förhandsgranskningen måste därför RENDERA, inte hämta.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * SIDOEFFEKTSFRIHETEN ÄR INVARIANT — GRENEN ÄNDRAR INGENTING DÄR
 * ═══════════════════════════════════════════════════════════════════════════
 * Denna gren LÄSER `inbetalningar` (Postgres) + `Anmälningar`/`Eventplanering`
 * (Airtable) och skriver, precis som typexempel-grenen, ETT TRANSIENT
 * Storage-utkast. Den allokerar ALDRIG ett kvittonummer, skriver ALDRIG en
 * `kvitton`- eller `jobb_rad`-rad, och rör ALDRIG Resend. Kvittonumret är
 * `FÖRHANDSVISNING` i BÅDA grenarna — ett andra anrop ger exakt samma
 * platshållartext, vilket ÄR beviset att ingen ledger rörts.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FORMEN SPEGLAR `jobb-konsument`s `hamtaUnderlag` — MEDVETET, INTE SLARV
 * ═══════════════════════════════════════════════════════════════════════════
 * Fält för fält samma härledning som `jobb-konsument/index.ts` § `hamtaUnderlag`
 * (rad ~244–289), av EN anledning: det Lotta granskar ska vara det som går i
 * väg. En egen, "enklare" avläsning här hade varit en andra sanning om vad ett
 * kvitto innehåller, och den hade glidit isär tyst.
 *
 * TVÅ MEDVETNA SKILLNADER, båda bokförda:
 *   1. MAKULERAD INBETALNING KASTAR INTE HÄR. Konsumenten vägrar skicka
 *      kvitto för en makulerad inbetalning (rätt — det vore en skarp
 *      sidoeffekt). En FÖRHANDSGRANSKNING är läsning, och Lotta ska kunna
 *      titta på vad som en gång skulle ha gått. Frontenden erbjuder ändå
 *      aldrig knappen i det läget (`kanForhandsgranska`,
 *      `inkorg-harledningar.ts`), så detta är försvar i djup, inte en ny väg.
 *   2. `betalning: 'avgift' | 'slut'` HÄRLEDS ÄNDÅ, trots att fältet är
 *      INERT för kvittots synliga text sedan TASK-306:s rättelsevarv (MÄTT,
 *      inte antaget: `spec.betalning` läses INGENSTANS i `receipt-content.ts`/
 *      `mall-data.ts` — bara omnämnt i kommentarer). Härledningen kostar EN
 *      extra Postgres-läsning och gör förhandsgranskningen byte-trogen ÄVEN
 *      om fältet någon gång blir levande igen. Ett hårdkodat `'avgift'` hade
 *      varit rätt i dag och en tyst lögn den dag etiketten återinförs.
 *
 * `eventId` HÄRLEDS UR ANMÄLAN, inte ur anropet: `SessionsRad` i
 * `BetalningsInkorg.tsx` bär inget eventId, och att låta klienten skicka ett
 * hade öppnat för att förhandsgranska en inbetalning mot FEL events
 * bokföringstext. Anmälan äger kopplingen; servern läser den.
 */
async function hamtaRiktigtUnderlag(inbetalningId: string) {
  const db = skapaAdminKlient();

  const { data, error } = await db
    .from(INBETALNINGAR_TABELL)
    .select(INBETALNING_KOLUMNER)
    .eq('id', inbetalningId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, `Inbetalningen hittades inte: ${inbetalningId}`);
  const post = radTillInbetalning(data);

  const anmalan = await lasAnmalan(post.anmalanRecordId);
  if (!anmalan) {
    throw new HttpError(404, 'Anmälan finns inte längre i basen — kvittot kan inte förhandsgranskas.');
  }

  // Utkastets Storage-path kräver ett event (`utkast/<eventId>/kvitto.pdf`).
  // Fail-closed med ett skäl Lotta förstår, i stället för en path som inte
  // går att bygga.
  if (!anmalan.eventId) {
    throw new ValidationError('Anmälan saknar event — kvittot kan inte förhandsgranskas.');
  }
  const event = await lasEvent(anmalan.eventId);

  // Facket kvittots ledger-rad skulle bära. HÄRLETT, aldrig valt — samma
  // regel som spegeln (ADR-128 beslut 2). Se docblocket § skillnad 2.
  const alla = await lasInbetalningarForAnmalan(db, post.anmalanRecordId);
  const harledning = harledBetalning(
    alla.map((rad) => ({ belopp: rad.belopp, status: rad.status })),
    byggPrisbild(anmalan, event),
  );

  return {
    eventId: anmalan.eventId,
    kundnamn: anmalan.namn || post.ogonblicksbildNamn,
    kundEpost: anmalan.epost ?? '',
    belopp: post.belopp,
    betalsatt: post.betalsatt,
    betalningsdatum: post.betalningsdatum,
    eventNamn: event?.namn ?? post.ogonblicksbildEvent,
    eventTyp: event?.typ ?? null,
    eventStart: event?.startdatum ?? null,
    eventSlut: event?.slutdatum ?? null,
    bokforingstext: event?.bokforingstext ?? null,
    betalning: harledning.alltKlart ? ('slut' as const) : ('avgift' as const),
  };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = corsHeadersFor(req);
  const requestId = generateRequestId();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const auth = await requireUser(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const { user } = auth;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const inbetalningId = body?.inbetalningId;

    /* [TASK-353] TVÅ GRENAR, EN SVARSFORM. `inbetalningId` är ADDITIVT:
       utelämnas det är beteendet BYTE FÖR BYTE dagens (typexemplet ur
       eventet), vilket är vad `DokumentYta.tsx`s generator-katalog anropar.
       Ges det renderas den KONKRETA inbetalningens kvitto — se
       `hamtaRiktigtUnderlag`s docblock. `eventId` blir då VALFRITT, eftersom
       anmälan äger event-kopplingen; skickas det ändå IGNORERAS det medvetet
       (klienten får inte kunna para ihop en inbetalning med fel events
       bokföringstext). */
    const villRiktigtKvitto = inbetalningId !== undefined && inbetalningId !== null;

    let utkastEventId: string;
    let kvittoData: unknown;

    if (villRiktigtKvitto) {
      if (typeof inbetalningId !== 'string' || !UUID_RE.test(inbetalningId)) {
        throw new ValidationError('inbetalningId must be a UUID');
      }
      const underlag = await hamtaRiktigtUnderlag(inbetalningId);
      utkastEventId = underlag.eventId;
      kvittoData = byggKvittoData({
        kvittonummer: FORHANDSVISNING_KVITTONUMMER,
        kundnamn: underlag.kundnamn,
        kundEpost: underlag.kundEpost,
        belopp: underlag.belopp,
        betalsatt: underlag.betalsatt,
        betalning: underlag.betalning,
        eventNamn: underlag.eventNamn,
        datum: new Date().toISOString(),
        eventTyp: underlag.eventTyp,
        eventStart: underlag.eventStart,
        eventSlut: underlag.eventSlut,
        bokforingstext: underlag.bokforingstext,
        // RIKTIGT betalningsdatum, till skillnad från typexemplets `null`:
        // det är en av raderna Lotta granskar (`Betalningsdatum:`).
        betalningsdatum: underlag.betalningsdatum,
      });
    } else {
      const eventId = body?.eventId;

      if (!isValidEventId(eventId)) {
        throw new ValidationError('eventId is required and must be an Airtable record ID (rec…)');
      }

      const eventRecord = await fetchAirtableRecord(EVENTS_TABLE, eventId);
      if (!eventRecord) {
        return new Response(JSON.stringify({ error: 'Event not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // [TASK-306] Läses BY NAME, INTE by ID — se send-receipt-email/index.ts
      // § readEventKvittoFalt för det fulla resonemanget (samma fem fält,
      // samma ADR-086-avvikelse mot uppdragsdirektivet, bokförd i slutrapporten).
      const eventNamn = selectName(eventRecord.fields['Event (source)']);
      const eventTyp = selectName(eventRecord.fields['Typ']);
      const eventStart = scalarString(eventRecord.fields['Startdatum']);
      const eventSlut = scalarString(eventRecord.fields['Slutdatum']);
      const bokforingstext = scalarString(eventRecord.fields['Bokföringstext (kvitto)']);

      utkastEventId = eventId;
      // [TASK-309.5] byggKvittoData + renderaMallPdf('kvitto', …) ERSÄTTER
      // kvittoRader + renderKvittoPdf (pdf-lib, nu riven) — se
      // `_shared/receipt-content.ts`:s filhuvud för hela historiken.
      kvittoData = byggKvittoData({
        kvittonummer: FORHANDSVISNING_KVITTONUMMER,
        kundnamn: TYPEXEMPEL.kundnamn,
        kundEpost: TYPEXEMPEL.kundEpost,
        belopp: TYPEXEMPEL.belopp,
        betalsatt: TYPEXEMPEL.betalsatt,
        betalning: TYPEXEMPEL.betalning,
        eventNamn,
        datum: new Date().toISOString(),
        eventTyp,
        eventStart,
        eventSlut,
        bokforingstext,
        // [TASK-346.5] Förhandsvisningen bygger på TYPEXEMPEL, som föregår
        // Inbetalning/ADR-128 — samma `null` som `send-receipt-email/index.ts`
        // gör, se den filens motsvarande kommentar.
        betalningsdatum: null,
      });
    }

    const apiKey = Deno.env.get('DOCRAPTOR_API_KEY');
    if (!apiKey) {
      throw new HttpError(500, 'DOCRAPTOR_API_KEY saknas i secrets');
    }
    // Fail-closed, SAMMA mönster som generate-event-attachment/index.ts och
    // send-receipt-email/index.ts:s `isProd` (se mall-render.ts:s filhuvud
    // för varför denna härledning bor HOS ANROPAREN).
    const test = Deno.env.get('ENVIRONMENT') !== 'production';

    const pdfBytes = await renderaMallPdf('kvitto', kvittoData as unknown as Record<string, unknown>, {
      apiKey,
      test,
      namn: `Kvitto ${FORHANDSVISNING_KVITTONUMMER}`,
    });

    // [ADR-124, TASK-302.2] TRANSIENT utkast i Storage, inte bytes till
    // klienten — se filhuvudets LEVERANSVÄGEN-ÄNDRAD-stycke. `laggUtkast` är
    // den GEMENSAMMA formeln (`_shared/utkast.ts`), samma som den (nu rivna,
    // TASK-309.4) `test-docraptor-render`s utkast-gren använde (TASK-302.1).
    // `skapaAdminKlient()` ERSÄTTER det tidigare inlinade `createClient(…)` —
    // byte-identisk konstruktion (samma URL, samma service-role-nyckel), men
    // husets egen hjälpare, som nu ändå importeras för underlags-läsningen.
    const supabaseAdmin = skapaAdminKlient();
    const { url, utgar } = await laggUtkast(supabaseAdmin, {
      // [TASK-353] KÄND KANT, MEDVETET INTE LAPPAD I DENNA SKIVA: pathen är
      // `utkast/<eventId>/kvitto.pdf` (`_shared/utkast.ts` § byggUtkastPath),
      // alltså per EVENT och typ — inte per inbetalning. Två
      // förhandsgranskningar av OLIKA personer på SAMMA event skriver därför
      // över varandras utkast. Ofarligt sekventiellt (Lotta tittar på en i
      // taget, och varje klick renderar om), men en samtidig granskning i två
      // flikar kan visa fel persons kvitto i den äldre fliken. Att göra pathen
      // inbetalnings-unik är en egen skiva — den rör förfallo-städningen av
      // utkast och hör inte hemma i en UI-skiva dagen före demon.
      eventId: utkastEventId,
      typ: 'kvitto',
      bytes: pdfBytes,
    });

    /* `utkastEventId` OCH INTE `eventId` — den senare är sedan TASK-353
       block-scopad till typexempel-grenen och hade kastat ReferenceError i
       den nya. Filen bär `@ts-nocheck`, så varken tsc eller Biome hade fällt
       det; raden är rättad mot LÄSNING, inte mot en grind.

       `lage=` skiljer grenarna åt i loggen (staging-deployens
       verifieringspunkt). INGEN PERSONDATA loggas — inbetalningens UUID är
       en nyckel, aldrig kundnamnet eller e-posten. */
    console.log(
      `[preview-receipt] ALLOW | caller_user_id=${user.id} | event=${utkastEventId} | ` +
        `lage=${villRiktigtKvitto ? `inbetalning:${inbetalningId}` : 'typexempel'}`,
    );

    return new Response(JSON.stringify({ url, utgar, requestId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'preview-receipt',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
