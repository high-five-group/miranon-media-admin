// @ts-nocheck — Deno Edge Function shared module (Deno-globaler; typas vid
// deploy av `deno check`/`deno lint`, se ADR-010 § Fas 7-åtagande). Samma
// undantags-mönster som övriga _shared-filer som körs i Deno-runtimen.
//
// laggUtkast — TASK-302.1 (PRD TASK-302, `ADR-124`, S108 resume 7,
// 2026-08-22). Skriver ett TRANSIENT förhandsgransknings-utkast till
// Storage och returnerar en kort signerad URL — ANLEDNINGEN till hela
// skivan: Chromes PDF-visare scrollar bara jämnt på en URL SERVERAD AV
// NÄTVERKSTJÄNSTEN. `blob:` (dagens väg), en Service Worker som fångar
// svaret, och båda med `noopener` mättes ALLA laggiga (sex armar, headed
// Chrome 151, `tasks/sessions/2026-08-20-session-108.md` Del 10 § B punkt
// 3 + Del 11) — bara en riktig nätverks-URL scrollar identiskt med
// `http://`-referensen.
//
// KONTRAKTSBROTTET, ÖPPET (TASK-302 § "Kontraktsbrottet, öppet"):
// `generate-event-attachment`/`preview-receipt` förbjöd tidigare ALL
// Storage-skrivning i förhandsvisningen. Den nya, amenderade regeln: EN
// TRANSIENT fil under `utkast/<eventId>/<typ>.pdf`, `upsert: true` — högst
// EN fil per event OCH typ, aldrig listad i appen, borttagen vid skarp
// generering (TASK-302.3). Mängden växer med ANTAL EVENT, inte med antal
// förhandsgranskningar.
//
// ÅTERANVÄNDER MEDVETET — ingen ny TTL, ingen ny bucket, ingen ny
// eventId-valideringsform: `BILAGOR_BUCKET_ID` och
// `SIGNED_DOWNLOAD_URL_TTL_SECONDS` (samma konstant `get-attachment-
// download-url` redan bär, 300s — se `attachments.ts`s docblock för det
// fulla, källbelagda TTL-resonemanget) och `isValidEventId` (samma
// rec-prefix-grind som `create-registration`/`create-event-note`).
//
// SÖKVÄGS-VALIDERING, INGEN PATH-INJEKTION: `eventId` måste ha rec-formen
// (`isValidEventId`) och `typ` måste vara ETT av de tre stängda
// enum-värdena (`UTKAST_TYPER`) — SAMMA "stängd uppsättning, ingen fri
// sträng i en path-SEGMENT"-disciplin `_shared/attachments.ts`s
// `buildStorageAnchor`/`KURSFAMILJ_SLUG` redan etablerar för Kursfamilj.
// Valideringen sitter HÄR (inte bara i anropande EF) eftersom denna
// funktion är den GEMENSAMMA vägen in — `test-docraptor-render` (denna
// skiva, prototypen) OCH de skarpa preview-EF:erna (`TASK-302.2`) anropar
// samma `laggUtkast`, en formel, flera anropare.

import { ValidationError, HttpError } from './errors.ts';
import { BILAGOR_BUCKET_ID, isValidEventId, SIGNED_DOWNLOAD_URL_TTL_SECONDS } from './attachments.ts';

/** De tre dokumentklasserna utkast-vägen stödjer (TASK-302 § Designbeslut). */
export const UTKAST_TYPER = ['bilaga', 'kvitto', 'deltagarinformation'] as const;
export type UtkastTyp = (typeof UTKAST_TYPER)[number];

export function isValidUtkastTyp(value: unknown): value is UtkastTyp {
  return typeof value === 'string' && (UTKAST_TYPER as readonly string[]).includes(value);
}

/** Minimal ytstruktur för den del av `SupabaseClient` denna funktion faktiskt
 * använder — undviker att importera hela SDK-typen bara för storage-anropen. */
interface SupabaseAdminLike {
  storage: {
    from(bucket: string): {
      upload(
        path: string,
        bytes: Uint8Array,
        options: { contentType: string; upsert: boolean },
      ): Promise<{ error: { message: string } | null }>;
      createSignedUrl(
        path: string,
        expiresIn: number,
      ): Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>;
    };
  };
}

export interface UtkastResultat {
  /** Kort signerad URL till PDF:en, serverad av nätverkstjänsten (Storage). */
  url: string;
  /** ISO-tidsstämpel för när `url` slutar fungera (nu + `SIGNED_DOWNLOAD_URL_TTL_SECONDS`). */
  utgar: string;
}

/**
 * Skriver `bytes` till `utkast/<eventId>/<typ>.pdf` i `BILAGOR_BUCKET_ID`
 * (`upsert: true` — samma path skriven två gånger ERSÄTTER, skapar aldrig
 * ett andra objekt) och returnerar en signerad URL + dess utgångstid.
 *
 * Kastar `ValidationError` (400) för ogiltig `eventId`/`typ`-form,
 * `HttpError` (502) om Storage-skrivningen eller signeringen misslyckas —
 * SAMMA felkontrakt som `upload-attachment`/`get-attachment-download-url`
 * redan bär för motsvarande fel, propagerat av anroparens `mapErrorToResponse`.
 */
export async function laggUtkast(
  supabaseAdmin: SupabaseAdminLike,
  params: { eventId: string; typ: UtkastTyp; bytes: Uint8Array },
): Promise<UtkastResultat> {
  if (!isValidEventId(params.eventId)) {
    throw new ValidationError('eventId must be an Airtable record ID (rec…)');
  }
  if (!isValidUtkastTyp(params.typ)) {
    throw new ValidationError(`typ must be one of: ${UTKAST_TYPER.join(', ')}`);
  }

  const path = `utkast/${params.eventId}/${params.typ}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BILAGOR_BUCKET_ID)
    .upload(path, params.bytes, { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    throw new HttpError(502, `Utkastet kunde inte sparas: ${uploadError.message}`);
  }

  const { data: signed, error: signError } = await supabaseAdmin.storage
    .from(BILAGOR_BUCKET_ID)
    .createSignedUrl(path, SIGNED_DOWNLOAD_URL_TTL_SECONDS);
  if (signError || !signed) {
    throw new HttpError(
      502,
      `Kunde inte skapa en nedladdningslänk: ${signError?.message ?? 'okänt fel'}`,
    );
  }

  const utgar = new Date(Date.now() + SIGNED_DOWNLOAD_URL_TTL_SECONDS * 1000).toISOString();
  return { url: signed.signedUrl, utgar };
}
