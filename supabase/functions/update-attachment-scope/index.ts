// @ts-nocheck — Deno Edge Function (esm.sh-import + Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-konsumerande EF:er.
//
// update-attachment-scope — TASK-338.4, ADR-125 § Beslut 1.
//
// ═══ VAD DEN GÖR, PÅ LOTTAS SPRÅK ═══
// Lotta laddade upp parkeringsbilagan som "Alla event" när den egentligen
// bara gäller Rönninge. Utan denna EF är enda vägen tillbaka att radera
// raden och ladda upp filen igen (PRD TASK-338 berättelse 8). Denna
// operation flyttar räckvidden på en REDAN uppladdad delad bilaga —
// samma tre axlar som skrivvägen, ingen ny fil, samma `id`.
//
// ═══ VAD DEN INTE ÄR ═══
// Den kan INTE göra en delad bilaga event-egen, och inte tvärtom. Båda
// riktningarna skulle flytta filens STORAGE-ANKARE (`buildStorageAnchor`,
// _shared/attachments.ts) utan att flytta bytesen — och en rad vars
// härledda path inte längre pekar på sina bytes är tyst oöppningsbar OCH
// oraderbar via `get-attachment-download-url`/`delete-attachment`, som båda
// härleder samma path ur radens egna fält. Räckvidden på RADEN måste därför
// redan vara gemensam, och den skrivna räckvidden är alltid `Gemensam`.
//
// Att ankaret är oförändrat inom Gemensam-grenen är INTE gratis, det är
// MÄTT mot `buildStorageAnchor`s egen kod: grenen ger `kurstyp/<slug>` när
// `kursfamilj` är satt, annars `alla-event` — alltså KAN en ändring av
// FAMILJE-axeln flytta ankaret. Hindret `ankar-flytt` i
// `provaRackviddsbyte` håller det.
//
// ═══ VAKTERNA (SECURITY-SPEC §6.10 "guard"), I ORDNING ═══
//   1. `attachmentId` måste ha rec-formen                      → 400
//   2. Räckviddsparametrarna genom `AttachmentScopeInputSchema`
//      (IMPORTERAD från _shared/attachments.ts — samma schema som
//      upload-attachment/finalize-attachment-upload, aldrig en kopia)  → 400
//   3. Målräckvidden måste normalisera till `Gemensam`         → 400
//   4. Raden måste finnas                                       → 404
//   5. `provaRackviddsbyte` (_shared/rackvidd-matchning.ts) — de TRE
//      rad-beroende hindren, som EN ren funktion:
//        `ej-gemensam`        radens egen räckvidd är inte Gemensam  → 403
//        `fel-dokumentklass`  radens klass är inte `Uppladdad`       → 403
//        `ankar-flytt`        familje-bytet skulle flytta storage-
//                             ankaret från filens faktiska bytes     → 409
//   6. `plats` måste FINNAS i Platser (`platsFinns`)            → 404
//   7. `fields` mot `field-allowlists` (SSOT-grind)            → 400
//
// VAKTERNA BOR I `provaRackviddsbyte` OCH INTE HÄR av ett testbarhets-skäl
// som är värt att förstå innan någon "förenklar" tillbaka dem hit: ett av
// hindren (`fel-dokumentklass`) kan INGEN av våra EF:er framkalla, eftersom
// ingen skrivväg producerar en rad som är både gemensam och mall-genererad.
// Ett staging-test kan alltså inte bevisa den vakten — en ren funktion kan,
// deterministiskt (`tests/api/rackvidds-byte.test.ts`), precis som
// TASK-338.2 gjorde med matcharen. Se funktionens docblock för varje hinder
// och för varför `ankar-flytt` svarar 409 och inte 400.
//
// ═══ SVARET ═══
// Den uppdaterade raden i SAMMA form som get-event-attachments
// (`mapAttachmentRecord`) — så klienten kan skriva rakt in i sin cache utan
// en andra hämtning. Airtables PATCH-svar bär de beräknade fälten inklusive
// `Platsnamn`-lookupen; MÄTT skarpt mot staging 2026-08-29 (en PATCH som
// satte `Plats: [rec17l2c64foUy6WU]` fick `Platsnamn: ["Rönninge"]` tillbaka
// i SAMMA svar), så ingen extra `fetchAirtableRecord` behövs.
//
// AUKTORISATION: `requireUser`, samma nivå som delete-attachment/
// upload-attachment — att ändra en bilagas räckvidd är en likvärdig
// admin-handling, ingen kontohantering.

import {
  fetchAirtableRecord,
  updateAirtableRecord,
} from '../_shared/airtable-client.ts';
import {
  arGemensam,
  AttachmentScopeInputSchema,
  BILAGOR_TABLE,
  buildScopeUpdateFields,
  buildStorageAnchor,
  isValidEventId as isValidRecordId,
  mapAttachmentRecord,
  normaliseraRackvidd,
  platsFinns,
  provaRackviddsbyte,
} from '../_shared/attachments.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeadersFor, handleCors } from '../_shared/cors.ts';
import { findDisallowedField, getOperation } from '../_shared/field-allowlists.ts';
import {
  ForbiddenError,
  generateRequestId,
  HttpError,
  mapErrorToResponse,
  ValidationError,
} from '../_shared/errors.ts';

const OPERATION_KEY = 'update-attachment-scope';
const EVENT_LINK_FIELD = 'Event';

/** Läser en Airtable-singleSelect defensivt: tomt/ej-sträng → `null`. */
function lasOption(varde: unknown): string | null {
  return typeof varde === 'string' && varde.length > 0 ? varde : null;
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
    const attachmentId = body?.attachmentId;

    // VAKT 1 — formen på målet.
    if (!isValidRecordId(attachmentId)) {
      throw new ValidationError(
        'attachmentId is required and must be an Airtable record ID (rec…)',
      );
    }

    // VAKT 2 — räckviddsparametrarna, SAMMA schema som skrivvägen. Att
    // importera i stället för att duplicera är hela poängen: en framtida
    // fjärde axel, eller en ändrad kombinationsregel, får aldrig gälla vid
    // uppladdning men inte vid ändring (ADR-057 — valideringen bor i
    // EF/_shared, på ETT ställe).
    const scopeParsed = AttachmentScopeInputSchema.safeParse({
      rackvidd: body?.rackvidd,
      kursfamilj: body?.kursfamilj,
      kursniva: body?.kursniva,
      plats: body?.plats,
    });
    if (!scopeParsed.success) {
      throw new ValidationError(scopeParsed.error.issues[0]?.message ?? 'Ogiltig räckvidd.');
    }

    // VAKT 3 — målräckvidden. Legacy-värdena (`Kurstyp`/`Alla event`)
    // normaliseras till `Gemensam` av samma funktion som skrivvägen, så en
    // installerad PWA-klient som ännu skickar dem fungerar; `Event` avvisas
    // (se filhuvudet § VAD DEN INTE ÄR).
    const malRackvidd = normaliseraRackvidd({
      rackvidd: scopeParsed.data.rackvidd,
      kursfamilj: scopeParsed.data.kursfamilj ?? null,
      kursniva: scopeParsed.data.kursniva ?? null,
      platsIds: scopeParsed.data.plats ? [scopeParsed.data.plats] : [],
    });
    if (!arGemensam(malRackvidd.rackvidd)) {
      throw new ValidationError(
        'Räckvidden kan bara ändras till Gemensam. En delad bilaga kan inte göras event-egen här.',
      );
    }

    // VAKT 4 — raden måste finnas (samma "hittades inte är ett normalt
    // tillstånd"-kontrakt som delete-attachment/get-event-attachments).
    const rad = await fetchAirtableRecord(BILAGOR_TABLE, attachmentId);
    if (!rad) {
      return new Response(JSON.stringify({ error: 'Bilagan hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VAKTERNA 5, 6 och 8 — HELA den rad-beroende auktorisationen i EN ren
    // funktion (`provaRackviddsbyte`, _shared/rackvidd-matchning.ts). Den
    // bor där, inte som tre `if`-satser här, eftersom en av vakterna
    // (`fel-dokumentklass`) inte går att framkalla via någon EF vi har och
    // därför bara kan bevisas deterministiskt — se den funktionens docblock
    // för hela resonemanget och för vart och ett av hindren.
    //
    // ANKAREN beräknas HÄR (`buildStorageAnchor` bor i den zod-importerande
    // filen och kan inte flyttas till den rena modulen) och JÄMFÖRS där, så
    // beslutet ändå syns på ett ställe.
    const radensRackvidd = lasOption(rad.fields['Räckvidd']);
    const linkatEvent = rad.fields[EVENT_LINK_FIELD];
    const linkatEventId =
      Array.isArray(linkatEvent) && linkatEvent.length > 0 ? (linkatEvent[0] as string) : null;

    const provning = provaRackviddsbyte({
      radensRackvidd,
      radensDokumentklass: lasOption(rad.fields['Dokumentklass']),
      ankarNu: buildStorageAnchor({
        eventId: linkatEventId,
        rackvidd: radensRackvidd ?? '',
        kursfamilj: lasOption(rad.fields['Kursfamilj']),
      }),
      ankarEfter: buildStorageAnchor({
        eventId: linkatEventId,
        rackvidd: malRackvidd.rackvidd ?? '',
        kursfamilj: malRackvidd.kursfamilj,
      }),
    });
    if (!provning.tillatet) {
      const { kod, status, skal } = provning.hinder;
      console.warn(
        `[update-attachment-scope] DENY ${kod} | caller_user_id=${user.id} | attachment=${attachmentId} | rackvidd=${radensRackvidd ?? '(tom)'} | klass=${lasOption(rad.fields['Dokumentklass']) ?? '(tom)'}`,
      );
      throw status === 403 ? new ForbiddenError(skal) : new HttpError(status, skal);
    }

    // VAKT 7 — platsen måste FINNAS. Samma vaktklass och samma skäl som
    // upload-attachment: Airtable TYSTAR ett okänt record-ID i ett länkfält,
    // så ett felstavat plats-ID hade rensat platsaxeln i stället för att
    // sätta den — en tyst UPPVIDGNING till alla event, alltså precis den
    // skada PRD TASK-338 berättelse 3 finns för att förhindra.
    //
    // KÖRS EFTER rad-vakterna, med avsikt: en anropare som inte ens får
    // röra raden ska nekas på DEN grunden, inte få veta om ett plats-ID
    // existerar. Ett extra Airtable-anrop sparas dessutom i nekade fall.
    if (scopeParsed.data.plats && !(await platsFinns(scopeParsed.data.plats))) {
      return new Response(JSON.stringify({ error: 'Platsen hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const operation = getOperation(OPERATION_KEY);
    if (!operation) {
      throw new HttpError(500, `Okänd operation: ${OPERATION_KEY}`);
    }

    // TOMMA AXLAR RENSAS, inte utelämnas — se `buildScopeUpdateFields`
    // (_shared/attachments.ts) för varför en PATCH inte kan återanvända
    // `buildScopeFields`, och för den skarpa staging-mätningen av
    // rensnings-formen.
    const fields = buildScopeUpdateFields(scopeParsed.data);

    const disallowed = findDisallowedField(operation, fields);
    if (disallowed !== null) {
      console.warn(
        `[update-attachment-scope] DENY field not in allowlist | caller_user_id=${user.id} | field=${disallowed}`,
      );
      // Kan inte hända i normal drift (`fields` byggs server-side ur ett
      // validerat schema) — detta är en SSOT-grind mot framtida kod-drift,
      // exakt samma form som upload-attachments motsvarande block.
      throw new ValidationError(`Fält "${disallowed}" är inte tillåtet.`);
    }

    let uppdaterad: { id: string; fields: Record<string, unknown> };
    try {
      uppdaterad = await updateAirtableRecord(BILAGOR_TABLE, attachmentId, fields);
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : String(updateError);
      throw new HttpError(502, `Räckvidden kunde inte sparas: ${message}. Prova igen.`);
    }

    console.log(
      `[update-attachment-scope] ALLOW | caller_user_id=${user.id} | attachment=${attachmentId} | ` +
        `rackvidd=${malRackvidd.rackvidd} | kursfamilj=${malRackvidd.kursfamilj ?? '-'} | ` +
        `kursniva=${malRackvidd.kursniva ?? '-'} | plats=${malRackvidd.platsIds[0] ?? '-'}`,
    );

    return new Response(
      JSON.stringify({ attachment: mapAttachmentRecord(uppdaterad), requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return mapErrorToResponse(error, requestId, corsHeaders, {
      function: 'update-attachment-scope',
      method: req.method,
      callerUserId: user.id,
    });
  }
});
