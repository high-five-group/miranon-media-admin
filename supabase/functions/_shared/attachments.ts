// @ts-nocheck — Deno Edge Function shared module (esm.sh-import + Deno-
// globaler; typas vid deploy av `deno check`/`deno lint`, se ADR-010 § Fas
// 7-åtagande). Samma undantags-mönster som övriga _shared-filer som körs i
// Deno-runtimen.
//
// Delad mekanik för bilage-fundamentets TRE produktions-EF:er (TASK-146.4):
// upload-attachment (Mönster 1), create-attachment-upload-ticket + finalize-
// attachment-upload (Mönster 2). Bryts ut hit i stället för dupliceras tre
// gånger — samma _shared-konvention som field-allowlists.ts/coerce.ts.
//
// BILAGOR_BUCKET_ID och SMALL_UPLOAD_MAX_BYTES DUPLICERAS MEDVETET mot
// TS-klienten (src/data/adapters/attachmentUpload.ts) — Deno-EF:erna delar
// ingen build-kedja med Vite-bygget. Samma duplicerings-mönster som
// STAGING_PROJECT_REF i scripts/provision-attachments-bucket.mjs.

export const BILAGOR_BUCKET_ID = 'bilagor';
export const BILAGOR_TABLE = 'Bilagor';
export const EVENTPLANERING_TABLE = 'Eventplanering';

/** Se src/data/adapters/attachmentUpload.ts för det fulla resonemanget — samma tal. */
export const SMALL_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

/**
 * `createSignedUploadUrl` tar ingen expires-parameter (verifierat mot
 * `@supabase/storage-js`s källkod, `StorageFileApi.ts` — signaturen är
 * `createSignedUploadUrl(path, options?: {upsert: boolean})`, ingen TTL-arg).
 * TTL:en är FAST, satt av plattformen. EMPIRISKT verifierat mot staging
 * 2026-08-10 (inte citerat ur forskningspasset): avkodad JWT-payload från ett
 * riktigt anrop gav `iat`/`exp`-diff = 7200 sekunder — stänger den lucka
 * forskningspasset uttryckligen flaggade som svagare belagd
 * (docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Vad jag inte
 * kunde belägga).
 */
export const SIGNED_UPLOAD_URL_TTL_SECONDS = 7200;

/** Läsbar filstorlek för fel på Lottas språk (AC #6: "inte i byte"). */
export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Airtable-record-ID-formen (speglar create-registration/create-event-note:s rec-prefix-grind). */
export function isValidEventId(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('rec') && value.length > 3;
}

/** UUID v4-formen — attachmentId genereras alltid av oss (crypto.randomUUID()), aldrig av klienten. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidAttachmentId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

const MAX_CONTROL_CODE_POINT = 31;
const DEL_CODE_POINT = 127;

/**
 * Sant för styrtecken (kodpunkt 0 till 31, eller DEL/127) — filtreras bort ur
 * klient-angivna filnamn. Kodpunkt-jämförelse i stället för en regex-
 * teckenklass med inbäddade escape-sekvenser: undviker risken att en
 * bokstavlig styrtecken-byte smyger sig in i själva källfilen via en
 * textredigering (motiv, inte gissning — exakt det hände under detta korts
 * eget bygge, TASK-146.4, se slutrapportens § fynd).
 */
function isControlCodePoint(codePoint: number): boolean {
  return codePoint <= MAX_CONTROL_CODE_POINT || codePoint === DEL_CODE_POINT;
}

const PATH_SEPARATOR_RE = /[/\\]/g;

/**
 * Städar ett klient-angivet filnamn till något som är säkert som EN
 * path-SEGMENT (aldrig flera): tar bort katalogseparatorer och styrtecken,
 * trimmar, cappar längden. Body-only — bär INGEN säkerhetsgaranti mot
 * cross-event-åtkomst (den kommer från att `eventId` valideras separat och
 * att attachmentId alltid är server-genererat).
 */
export function sanitizeFilnamn(raw: string): string {
  const noSeparators = raw.replace(PATH_SEPARATOR_RE, '-');
  const noControlChars = Array.from(noSeparators)
    .filter((ch) => !isControlCodePoint(ch.codePointAt(0) ?? 0))
    .join('');
  const stripped = noControlChars.trim();
  const MAX_LEN = 200;
  return stripped.length > MAX_LEN ? stripped.slice(0, MAX_LEN) : stripped;
}

/**
 * Den DETERMINISTISKA path-formen — SAMMA formel i create-attachment-upload-
 * ticket (vid utfärdande) och finalize-attachment-upload (vid verifiering).
 * `attachmentId` är alltid server-genererat (crypto.randomUUID()), aldrig
 * klient-buret — det är därför en klient inte kan peka finalize mot en annan
 * händelses/annan uppladdnings fil: de kan bara "träffa" en path som
 * FAKTISKT har bytes där, och bytes hamnar bara där via ett tillstånd som
 * SERVERN redan knöt till just detta (eventId, attachmentId, filnamn).
 */
export function buildAttachmentPath(
  eventId: string,
  attachmentId: string,
  filnamn: string,
): string {
  return `${eventId}/${attachmentId}-${sanitizeFilnamn(filnamn)}`;
}

/**
 * Mappar en skapad Bilagor-rad → domän-Attachment (samma shape som
 * `AttachmentSchema` i src/domain/schemas/Attachment.schema.ts — klienten ser
 * ALDRIG Airtable-fältnamn). Fälten är EXAKT scripts/create-bilagor-table.mjs
 * CONFIG.fields: Namn / 'Storlek (bytes)' / Skapad / Event.
 */
export function mapAttachmentRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): { id: string; namn: string; storlekBytes: number; skapad: string; eventId: string | null } {
  const f = record.fields;
  const namn = f.Namn;
  const storlek = f['Storlek (bytes)'];
  const skapad = f.Skapad;
  const event = f.Event;
  return {
    id: record.id,
    namn: typeof namn === 'string' ? namn : '',
    storlekBytes: typeof storlek === 'number' ? storlek : 0,
    skapad: typeof skapad === 'string' ? skapad : new Date(0).toISOString(),
    eventId: Array.isArray(event) && event.length > 0 ? (event[0] as string) : null,
  };
}
