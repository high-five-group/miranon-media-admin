// GEN `@ts-nocheck` HÄR — till skillnad från `_shared/attachments.ts` (som
// importerar Deno-globaler + esm.sh) rör denna fil VARKEN `Deno.` direkt
// eller transitivt. Den är därför REDAN i `tsconfig.edge-shared.json`s
// include-lista (den filens huvud förklarar mekaniken: "transitivt
// Deno-fri" är precis vad `npm run typecheck` verifierar för dessa moduler,
// äkta mot Node-tsc, inte bara Deno-vid-deploy).
//
// [TASK-309.22] Bilage-FILNAMNETS sanering till en Storage-SÄKER path-
// segment — utbruten UR `_shared/attachments.ts` (som ursprungligen bar
// dessa tre funktioner sedan TASK-146.4/275.3) till en EGEN, ZOD-FRI fil.
//
// SKÄLET ÄR STRUKTURELLT, INTE STILISTISKT: `_shared/attachments.ts`
// importerar `https://esm.sh/zod@4` (för `AttachmentScopeInputSchema` —
// räckviddsvalidering, en HELT annan angelägenhet än filnamnssanering).
// Node/Playwright (`api-pure`-projektet, se `CONTRIBUTING.md` § DoD) kan
// INTE resolva en `https://`-URL-import: `ERR_UNSUPPORTED_ESM_URL_SCHEME —
// "Only URLs with a scheme in: file and data are supported by the default
// ESM loader"`, empiriskt verifierat 2026-08-26 under detta korts bygge
// (minimalt repro: `node -e "import('.../attachments.ts')"` kastar direkt,
// INNAN någon av filens funktioner ens anropas — ALLA top-level-imports i
// en ES-modul resolvas innan modulen körs, så EN esm.sh-import i toppen
// gör HELA filen otestbar som ett direkt Node-import, oavsett vilken
// specifik export testet faktiskt behöver). `git grep -rn "_shared/attach"
// tests/` (2026-08-26) bekräftade: INGET existerande test importerar
// `_shared/attachments.ts` (eller någon annan `_shared`-fil med ett
// esm.sh-toppimport, t.ex. `_shared/activity-statement-schema.ts`) direkt —
// samma mönster upprepas överallt (t.ex. `tests/api/mall-render.test.ts`
// importerar mall-*.html-filerna, aldrig `mall-render.ts` självt).
//
// `sanitizeFilnamn`/`buildAttachmentLeaf`/`buildAttachmentPath` BEHÖVER
// ingen zod. Flytten gör dem body-testbara MED PRODUKTIONSKODEN (inte en
// lokal testkopia) i `tests/api/attachment-filename.test.ts` — och löser
// samtidigt uppdragets krav ("enhetstest på sanering/leaf") utan att
// duplicera logiken.
//
// `_shared/attachments.ts` RE-EXPORTERAR alla tre
// (`export { sanitizeFilnamn, buildAttachmentLeaf, buildAttachmentPath }
// from './attachment-filename.ts'`) — de 13 EF-filer som idag importerar
// `../_shared/attachments.ts` (grep, 2026-08-26: create-attachment-upload-
// ticket, preview-receipt, send-action-email, delete-attachment,
// get-attachment-download-url, save-place-standard, generate-event-
// attachment, upload-attachment, finalize-attachment-upload,
// send-receipt-email, get-event-attachments + två `_shared`-filer) kräver
// DÄRFÖR NOLL ändringar av sin egen import-sats.

const MAX_CONTROL_CODE_POINT = 31;
const DEL_CODE_POINT = 127;

/**
 * Sant för styrtecken (kodpunkt 0 till 31, eller DEL/127) — filtreras bort ur
 * klient-angivna filnamn. Kodpunkt-jämförelse i stället för en regex-
 * teckenklass med inbäddade escape-sekvenser: undviker risken att en
 * bokstavlig styrtecken-byte smyger sig in i själva källfilen via en
 * textredigering (motiv, inte gissning — exakt det hände under detta korts
 * eget bygge, TASK-146.4, se slutrapportens § fynd). OFÖRÄNDRAD vid flytten
 * (TASK-309.22) — samma funktion, ny fil.
 */
function isControlCodePoint(codePoint: number): boolean {
  return codePoint <= MAX_CONTROL_CODE_POINT || codePoint === DEL_CODE_POINT;
}

const PATH_SEPARATOR_RE = /[/\\]/g;

/**
 * [TASK-309.22] Supabase Storage/S3:s TILLÅTNA nyckel-tecken för ETT
 * path-segment — VERBATIM mot `supabase/storage`s `src/storage/limits.ts`
 * (`VALID_OBJECT_KEY`, hämtad live mot `master` 2026-08-26, citerad i
 * PR-beskrivningen): `/^[A-Za-z0-9_/!.*'() &$=@;:+,?-]*$/`. `/` UTESLUTS
 * här medvetet — den källregexen gäller en HEL path (flera segment); denna
 * konstant gäller ETT redan separator-fritt LEAF-segment (se
 * `PATH_SEPARATOR_RE` ovan, som redan körts på det här laget), så ett `/`
 * som "överlevde" hit skulle annars smyga in en oavsiktlig extra path-nivå.
 * `g`+`u`-flaggorna: `u` (Unicode-läge) matchar hela KODPUNKTER, inte
 * enskilda UTF-16-enheter — utan den skulle ett tvåenhets-tecken (emoji,
 * CJK utanför BMP) ersättas med TVÅ bindestreck i stället för ett.
 */
const STORAGE_UNSAFE_CHAR_RE = /[^A-Za-z0-9_!.*'() &$=@;:+,?-]/gu;

/** Unicode-kombinerande diakritiska tecken (U+0300–U+036F) — det NFKD
 *  lämnar kvar efter att t.ex. "é" delats upp i "e" + akut accent. */
const COMBINING_DIACRITICS_RE = /[\u0300-\u036f]/gu;

/**
 * [TASK-309.22, rotorsak: `Edge Function "upload-attachment" 502: ...
 * Invalid key: alla-event/…-2025-HörlurarMiranonMedia.pdf`, Marcus
 * prod-röktest 2026-08-26] Faller ett klient-angivet filnamns icke-Storage-
 * säkra tecken (å/ä/ö, é, ü, ñ, ç, CJK-ideogram, emoji, …) till Storage-
 * SÄKRA ASCII-tecken. TVÅ steg, i ordning:
 *
 *  1. **Deburra**: `.normalize('NFKD')` + strippa kombinerande diakritiska
 *     tecken. Samma "normalisera → strippa combining marks"-mönster som
 *     `supabase/supabase#34596` — Supabases EGEN dropzone-fix för PRECIS
 *     detta InvalidKey-fel (se PR-beskrivningens § Research, `git log`-
 *     verifierat patch-innehåll, 2026-08-26) — etablerar för sin
 *     `generateSafeFilename`: å → a, ä → a, ö → o, é → e, ü → u, ñ → n,
 *     ç → c. **NFKD** valt i stället för precedentets **NFD**: NFKD är en
 *     strikt SUPERMÄNGD (kanonisk diakritik-strippning PLUS kompatibilitets-
 *     dekomposition — ligaturer, hel-/halvbreddstecken, romerska siffror)
 *     — ingen skillnad för den svenska bokstavsmängden, mer täckning för
 *     andra skript.
 *  2. **Fallback-ersättning**: allt som ÄNDÅ ligger utanför
 *     `STORAGE_UNSAFE_CHAR_RE` efter steg 1 (CJK-ideogram och annan skrift
 *     som INTE diakritik-dekomponerar mot ASCII, emoji, kvarvarande
 *     symboler som `ß`/`ø`/`æ`/`œ`) → ETT `-` per KODPUNKT (inte per
 *     UTF-16-enhet, se regexens `u`-flagga ovan). Detta är vad som
 *     GARANTERAR Storage-kompatibilitet för VILKET filnamn som helst —
 *     steg 1 är bara en läsbarhets-bonus för skript som faktiskt
 *     diakritik-dekomponerar.
 *
 * **MEDVETET AVSTEG från `supabase/supabase#34596`s `[^\w\s-]` → `-`-steg:**
 * den ersättningen är STRÄNGARE än vad Storage faktiskt kräver — `\w` är
 * bara `[A-Za-z0-9_]`, så den hade skrivit om mellanslag, parenteser, `&`,
 * `'`, `$`, `@` osv. till bindestreck trots att ALLA dessa är GILTIGA
 * enligt `STORAGE_UNSAFE_CHAR_RE` ovan. Vårt regressionskrav ("befintliga
 * ASCII-namns nyckel/id förblir OFÖRÄNDRADE") tillåter inte det: denna
 * funktion rör ENDAST kodpunkter som FAKTISKT ligger utanför Storages
 * egen tillåtna mängd — allt annat lämnas byte-för-byte orört. Ett
 * bevis-i-båda-riktningarna av detta (existerande ASCII-namn oförändrade,
 * nya icke-ASCII-namn giltiga) finns i `tests/api/attachment-filename.test.ts`.
 *
 * **VARFÖR BEFINTLIGA RADER PER KONSTRUKTION ÄR OFÖRÄNDRADE:** varje rad
 * som REDAN finns i Bilagor/Storage har per definition en Lagringsnyckel
 * vars filnamnsdel ALDRIG innehöll ett tecken utanför
 * `STORAGE_UNSAFE_CHAR_RE` — annars hade själva UPPLADDNINGEN som skapade
 * raden redan fallerat med samma "Invalid key"-502 detta kort fixar, och
 * ingen rad hade landat. Denna funktions nya steg kan därför bevisligen
 * aldrig ändra utdata för ett filnamn som en gång redan lyckades ladda upp.
 */
function toStorageSafe(raw: string): string {
  const deburred = raw.normalize('NFKD').replace(COMBINING_DIACRITICS_RE, '');
  return deburred.replace(STORAGE_UNSAFE_CHAR_RE, '-');
}

/**
 * Städar ett klient-angivet filnamn till något som är säkert som EN
 * path-SEGMENT (aldrig flera) OCH giltigt enligt Supabase Storages
 * nyckel-regex (TASK-309.22, se `toStorageSafe` ovan): tar bort
 * katalogseparatorer och styrtecken, faller icke-Storage-säkra tecken till
 * ASCII/`-`, trimmar, cappar längden. Body-only — bär INGEN
 * säkerhetsgaranti mot cross-event-åtkomst (den kommer från att `eventId`
 * valideras separat och att attachmentId alltid är server-genererat).
 */
export function sanitizeFilnamn(raw: string): string {
  const noSeparators = raw.replace(PATH_SEPARATOR_RE, '-');
  const noControlChars = Array.from(noSeparators)
    .filter((ch) => !isControlCodePoint(ch.codePointAt(0) ?? 0))
    .join('');
  const storageSafe = toStorageSafe(noControlChars);
  const stripped = storageSafe.trim();
  const MAX_LEN = 200;
  return stripped.length > MAX_LEN ? stripped.slice(0, MAX_LEN) : stripped;
}

/**
 * Storage-objektets LEAF-namn (allt utom `eventId/`-prefixet): `<attachmentId>-
 * <sanitizeFilnamn(filnamn)>`. Utbruten som EGEN funktion (TASK-147.5) eftersom
 * den bilage-bärande sändvägen behöver PRECIS denna sträng för att skriva
 * `Lagringsnyckel`-fältet vid radskapelse (upload-attachment/finalize-
 * attachment-upload/generate-event-attachment) — samma formel som
 * `buildAttachmentPath` nedan bygger på, inte en parallell variant.
 */
export function buildAttachmentLeaf(attachmentId: string, filnamn: string): string {
  return `${attachmentId}-${sanitizeFilnamn(filnamn)}`;
}

/**
 * Den DETERMINISTISKA path-formen — SAMMA formel i create-attachment-upload-
 * ticket (vid utfärdande) och finalize-attachment-upload (vid verifiering).
 * `attachmentId` är alltid server-genererat (crypto.randomUUID()), aldrig
 * klient-buret — det är därför en klient inte kan peka finalize mot en annan
 * händelses/annan uppladdnings fil: de kan bara "träffa" en path som
 * FAKTISKT har bytes där, och bytes hamnar bara där via ett tillstånd som
 * SERVERN redan knöt till just detta (eventId, attachmentId, filnamn).
 *
 * [UTBYGGD, TASK-275.3, ADR-118] Parametern heter `anchor`, inte längre
 * `eventId` (ren namnändring — INGEN formel/beteendeförändring, samma
 * `${anchor}/${leaf}`-konkatenering som förut). Se `_shared/attachments.ts`s
 * `buildStorageAnchor`-docblock för de tre ankar-grenarna.
 */
export function buildAttachmentPath(
  anchor: string,
  attachmentId: string,
  filnamn: string,
): string {
  return `${anchor}/${buildAttachmentLeaf(attachmentId, filnamn)}`;
}
