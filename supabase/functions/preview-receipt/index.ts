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
// de TVÅ REN-funktionerna (`kvittoRader` + den utbrutna `renderKvittoPdf`,
// _shared/receipt-pdf.ts, TASK-246-utbrytningen ur send-receipt-email/
// index.ts) utan att röra ledgern, Kvitton-tabellen eller Resend ALLS.
// Denna filen (och `renderKvittoPdf`) importerar VARKEN `_shared/send-
// receipt.ts` ELLER `_shared/receipt-numbering.ts` ELLER `resend` DIREKT.
// EN indirekt textreferens finns: `_shared/receipt-content.ts` har en
// `import type { Betalning, Betalsatt } from './send-receipt.ts'` — men det
// är en TYPE-ONLY-import (bara literal-unions för `kvittoRader`s
// parametertyp), ERAD AV TYPESCRIPT VID TRANSPILERING (ingen JS-import
// kvarstår i den körda koden — Deno kör aldrig, laddar aldrig, det modul-
// trädet). `supabase functions deploy` laddar ändå upp `send-receipt.ts`/
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
// LÄSER (fetchAirtableRecord mot Eventplanering) — INGEN SKRIVNING alls,
// varken Airtable, Storage eller Resend. Samma EF1–EF6-ribba (SECURITY-SPEC
// §6.10) som generate-event-attachment/get-attachment-download-url.

import { fetchAirtableRecord } from '../_shared/airtable-client.ts';
import { isValidEventId, toBase64 } from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { selectName } from '../_shared/coerce.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { generateRequestId, mapErrorToResponse, ValidationError } from '../_shared/errors.ts';
import { kvittoRader } from '../_shared/receipt-content.ts';
import { renderKvittoPdf } from '../_shared/receipt-pdf.ts';

const EVENTS_TABLE = 'Eventplanering';

/** Ärlig platshållare — ALDRIG ett riktigt allokerat kvittonummer (se filhuvudet). */
const FORHANDSVISNING_KVITTONUMMER = 'FÖRHANDSVISNING';

/**
 * Typexemplet (se filhuvudets PERSONDATA-stycke för varför persondata inte
 * kan vara verklig här). "Exempelperson" speglar samma "Exempelvärde"-
 * disciplin som `ProduceratExempel` i DokumentYta.tsx bar FÖRE detta kort
 * (skillnaden nu: bytesen som produceras ÄR en riktig, pdf-lib-renderad
 * PDF, inte en statisk fältlista).
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
    const eventNamn = selectName(eventRecord.fields['Event (source)']);

    const rader = kvittoRader({
      kvittonummer: FORHANDSVISNING_KVITTONUMMER,
      kundnamn: TYPEXEMPEL.kundnamn,
      kundEpost: TYPEXEMPEL.kundEpost,
      belopp: TYPEXEMPEL.belopp,
      betalsatt: TYPEXEMPEL.betalsatt,
      betalning: TYPEXEMPEL.betalning,
      eventNamn,
      datum: new Date().toISOString(),
    });
    const pdfBytes = await renderKvittoPdf(rader);

    console.log(`[preview-receipt] ALLOW | caller_user_id=${user.id} | event=${eventId}`);

    return new Response(JSON.stringify({ pdfBase64: toBase64(pdfBytes), requestId }), {
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
