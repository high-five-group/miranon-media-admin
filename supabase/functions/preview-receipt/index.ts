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
// PERSONDATA: TYPEXEMPEL, INTE en verklig anmälan (bokfört beslut, kortets
// notes, AC #2). Eventet ÄR verkligt (samma eventId som Dokument-ytans
// redan valda event — samma "riktig PDF ur eventets verkliga data"-linje
// som klass B). Kundnamn/belopp/betalsätt kan STRUKTURELLT inte vara
// verkliga här:
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { isValidEventId } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
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

    // [TASK-309.5] byggKvittoData + renderaMallPdf('kvitto', …) ERSÄTTER
    // kvittoRader + renderKvittoPdf (pdf-lib, nu riven) — se
    // `_shared/receipt-content.ts`:s filhuvud för hela historiken.
    const kvittoData = byggKvittoData({
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
    });

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { url, utgar } = await laggUtkast(supabaseAdmin, {
      eventId,
      typ: 'kvitto',
      bytes: pdfBytes,
    });

    console.log(`[preview-receipt] ALLOW | caller_user_id=${user.id} | event=${eventId}`);

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
