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
// FAMILJE-axeln flytta ankaret. Se § ANKAR-INVARIANTEN nedan för guarden
// som håller det.
//
// ═══ VAKTERNA (SECURITY-SPEC §6.10 "guard"), I ORDNING ═══
//   1. `attachmentId` måste ha rec-formen                      → 400
//   2. Räckviddsparametrarna genom `AttachmentScopeInputSchema`
//      (IMPORTERAD från _shared/attachments.ts — samma schema som
//      upload-attachment/finalize-attachment-upload, aldrig en kopia)  → 400
//   3. Målräckvidden måste normalisera till `Gemensam`         → 400
//   4. Raden måste finnas                                       → 404
//   5. RADENS räckvidd måste vara gemensam (`arGemensam` efter
//      `normaliseraRackvidd` — samma delade predikat delete-attachment
//      läser, aldrig en egen uppräkning av legacy-värdena)      → 403
//   6. RADENS `Dokumentklass` måste vara `Uppladdad`            → 403
//   7. `plats` måste FINNAS i Platser (`platsFinns`)            → 404
//   8. ANKAR-INVARIANTEN: den nya familje-axeln får inte flytta
//      storage-ankaret                                          → 409
//
// VAKT 6 FÖRTJÄNAR SIN EGEN RAD. En `Event-mallad` bilaga (klass B) fylls
// ur mall-renderaren vid varje generering (`generate-event-attachment`,
// ADR-125 § Beslut 3) och hör ALLTID till sitt event; en
// `Person-genererad` (klass C) hör till en anmälan. Att låta någon av dem
// få en filter-räckvidd hade lagt ett enskilt events kvitto eller
// bekräftelsebilaga i VARJE Rönninge-events dokumentlista och därmed i
// utskicken. Dokumentklassen är ortogonal mot räckvidden (ADR-118 beslut 4)
// — den här EF:en är den ENDA platsen där de två möts, och den möts
// fail-closed: `null`/okänd klass avvisas också, eftersom en rad vi inte
// kan klassa inte heller kan bedömas som säker att bredda.
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
  ATTACHMENT_CLASS_UPPLADDAD,
  AttachmentScopeInputSchema,
  BILAGOR_TABLE,
  buildScopeUpdateFields,
  buildStorageAnchor,
  isValidEventId as isValidRecordId,
  mapAttachmentRecord,
  normaliseraRackvidd,
  platsFinns,
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

    // VAKT 5 — RADENS räckvidd. Läser det DELADE predikatet efter
    // normalisering, aldrig en egen uppräkning: exakt den drift som gjorde
    // varje `Gemensam`-rad oraderbar i delete-attachment innan TASK-338.2
    // rättade den där (se den filens § AUKTORISATIONEN).
    const radensRackvidd = lasOption(rad.fields['Räckvidd']);
    const radenArGemensam = arGemensam(
      normaliseraRackvidd({
        rackvidd: radensRackvidd,
        kursfamilj: null,
        kursniva: null,
        platsIds: [],
      }).rackvidd,
    );
    if (!radenArGemensam) {
      console.warn(
        `[update-attachment-scope] DENY icke-gemensam bilaga | caller_user_id=${user.id} | attachment=${attachmentId} | rackvidd=${radensRackvidd ?? '(tom)'}`,
      );
      throw new ForbiddenError(
        'Bara delade bilagor kan byta räckvidd. Den här hör till ett enskilt event.',
      );
    }

    // VAKT 6 — dokumentklassen. Se filhuvudet för varför denna vakt finns
    // och varför den är fail-closed på `null`/okänt.
    const dokumentklass = lasOption(rad.fields['Dokumentklass']);
    if (dokumentklass !== ATTACHMENT_CLASS_UPPLADDAD) {
      console.warn(
        `[update-attachment-scope] DENY dokumentklass | caller_user_id=${user.id} | attachment=${attachmentId} | klass=${dokumentklass ?? '(tom)'}`,
      );
      throw new ForbiddenError(
        'Bara uppladdade dokument kan byta räckvidd. Mall-genererade bilagor följer sitt event.',
      );
    }

    // VAKT 7 — platsen måste FINNAS. Samma vaktklass och samma skäl som
    // upload-attachment: Airtable TYSTAR ett okänt record-ID i ett länkfält,
    // så ett felstavat plats-ID hade rensat platsaxeln i stället för att
    // sätta den — en tyst UPPVIDGNING till alla event, alltså precis den
    // skada PRD TASK-338 berättelse 3 finns för att förhindra.
    if (scopeParsed.data.plats && !(await platsFinns(scopeParsed.data.plats))) {
      return new Response(JSON.stringify({ error: 'Platsen hittades inte.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // VAKT 8 — ANKAR-INVARIANTEN. `buildStorageAnchor` härleder path-ankaret
    // ur radens EGNA fält, och inom Gemensam-grenen beror det på
    // `kursfamilj` (`kurstyp/<slug>` när satt, annars `alla-event`). En
    // ändring som flyttar ankaret hade lämnat bytesen kvar på den GAMLA
    // pathen medan både `get-attachment-download-url` och
    // `delete-attachment` härledde den NYA — filen blir tyst oöppningsbar
    // och oraderbar, utan något felmeddelande någonstans.
    //
    // 409 CONFLICT, inte 400: anropet är VÄLFORMAT och skulle vara giltigt
    // för en annan rad — det är radens nuvarande lagringsläge som står i
    // vägen. Klienten kan inte rätta det genom att ändra sin input.
    //
    // ATT FLYTTA BYTESEN i stället vore den fulla lösningen (kopiera →
    // verifiera → uppdatera → radera gamla). Den är MEDVETET INTE byggd
    // här: den kräver Storage-transaktionsdisciplinen som
    // `_shared/storage-kopiera.ts` (TASK-340.1) bär, och att bunta in den
    // hade gjort denna skiva till två. Bokförd som öppen begränsning i
    // kortets Implementation Notes, inte gömd — i praktiken träffar den
    // bara den som byter FAMILJE-axeln på en familjebunden bilaga, medan
    // hela skivans syfte (plats-axeln) aldrig rör ankaret.
    const linkatEvent = rad.fields[EVENT_LINK_FIELD];
    const linkatEventId =
      Array.isArray(linkatEvent) && linkatEvent.length > 0 ? (linkatEvent[0] as string) : null;
    const ankarNu = buildStorageAnchor({
      eventId: linkatEventId,
      rackvidd: radensRackvidd ?? '',
      kursfamilj: lasOption(rad.fields['Kursfamilj']),
    });
    const ankarEfter = buildStorageAnchor({
      eventId: linkatEventId,
      rackvidd: malRackvidd.rackvidd ?? '',
      kursfamilj: malRackvidd.kursfamilj,
    });
    if (ankarNu !== ankarEfter) {
      console.warn(
        `[update-attachment-scope] DENY ankar-flytt | caller_user_id=${user.id} | attachment=${attachmentId} | fran=${ankarNu} | till=${ankarEfter}`,
      );
      throw new HttpError(
        409,
        'Familjen kan inte ändras på den här bilagan — filen ligger lagrad under den nuvarande ' +
          'familjen. Ladda upp filen på nytt med rätt familj i stället.',
      );
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
