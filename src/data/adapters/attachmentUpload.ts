// Delade konstanter + hjälpare för AirtableAdapter.uploadAttachment
// (TASK-146.4). Egen fil i stället för inline i AirtableAdapter.ts: dessa är
// mekanik som bara Mönster 2 (stora filer) och base64-kodningen för Mönster 1
// behöver — att bryta ut dem håller adaptern läsbar och gör konstanterna
// testbara/refererbara i isolation.
//
// BILAGOR_BUCKET_ID och SMALL_UPLOAD_MAX_BYTES DUPLICERAS MEDVETET mot
// Deno-sidan (supabase/functions/_shared/attachments.ts) — samma duplicerings-
// mönster som STAGING_PROJECT_REF i scripts/provision-attachments-bucket.mjs
// (fil-header § MILJÖ): TS-klienten (Vite-bygget) och Deno-EF:erna delar
// ingen build-kedja, så ett värde som båda sidor måste vara överens om måste
// stå på båda ställena. `BILAGOR_BUCKET_ID` måste vara IDENTISK med
// `BUCKET_ID` i scripts/provision-attachments-bucket.mjs — annars pekar
// adaptern på en bucket som inte är provisionerad.

export const BILAGOR_BUCKET_ID = 'bilagor';

/**
 * Gräns för Mönster 1 (bytes skickas i EF:ens request-body). Filer större än
 * detta går via Mönster 2 (signerat uppladdningstillstånd, direkt mot
 * lagringen). 6 MB — research-passets rekommenderade TUS-tröskel
 * (docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Delfråga 2,
 * "Uppladdning över 6 MB rekommenderas gå via TUS-baserad resumable upload").
 *
 * MEDVETET AVGRÄNSAT: v1 av Mönster 2 använder Supabases STANDARD
 * `createSignedUploadUrl`/`uploadToSignedUrl` (en enda PUT), INTE TUS-baserad
 * chunkad/återupptagbar uppladdning. Kortets AC #4 kräver "ett tidsbegränsat,
 * path-scopat uppladdnings-tillstånd; klienten laddar upp direkt utan att
 * bytesen passerar funktionen" — det är uppfyllt. Genuin TUS-chunkning med
 * återupptagning kräver en ny klient-bibliotek-dependency (tus-js-client) och
 * progress-/resume-UI som inte har någon konsument än (Dokument-ytan är
 * out-of-scope för detta kort) — att bygga det nu vore spekulativ komplexitet
 * som letar ett problem (~/.claude/CLAUDE.md § Dubbelriktad
 * över-engineering-vakt). Bokfört öppet som avgränsning, inte gömt.
 */
export const SMALL_UPLOAD_MAX_BYTES = 6 * 1024 * 1024;

/**
 * Läsbar filstorlek för felmeddelanden på Lottas språk (AC #6: "inte i byte").
 */
export function formatMB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Kodar en `File` till base64 UTAN spridningsoperator (`...bytes`) — undviker
 * call-stack-tak på stora arrayer. Samma chunkade teknik som
 * supabase/functions/test-pdf-generation/index.ts (TASK-146.1) använder på
 * Deno-sidan för motsvarande PDF-bytes → base64-kodning.
 */
export async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}
