// INGEN `@ts-nocheck` HÄR — till skillnad från `_shared/attachments.ts` (som
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
 * Städar ett klient-angivet filnamn till något som är säkert som EN
 * path-SEGMENT (aldrig flera): tar bort katalogseparatorer och styrtecken,
 * trimmar, cappar längden. Body-only — bär INGEN säkerhetsgaranti mot
 * cross-event-åtkomst (den kommer från att `eventId` valideras separat och
 * att attachmentId alltid är server-genererat).
 *
 * [TASK-309.22, REVIDERAD EFTER REVIEW-RUNDA 1] Denna funktion faller INTE
 * längre icke-ASCII till ASCII — den gjorde det i en tidigare version av
 * denna skiva, men det visade sig fel PLATS för det steget (se
 * `toStorageSafe`/`buildAttachmentLeaf` nedan för var ASCII-fallet nu bor
 * och VARFÖR). `sanitizeFilnamn`s jobb är att vara den STABILA, IDENTITETS-
 * BÄRANDE saneringen — samma sträng oavsett om resultatet ska hashas
 * (`deriveAttachmentId`, `upload-attachment/index.ts`) eller vidare
 * ASCII-falls för Storage. Två klient-filnamn som bara skiljer sig i
 * diakritik eller skript (`café.pdf` vs `cafe.pdf`, eller två helt olika
 * CJK-strängar) ska ge OLIKA `sanitizeFilnamn`-utdata, eftersom de ÄR
 * olika filnamn — hash-idempotensen (TASK-316) ska skilja dem åt, inte
 * kollapsa dem.
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
 * [TASK-309.22, rotorsak: `Edge Function "upload-attachment" 502: ...
 * Invalid key: alla-event/…-2025-HörlurarMiranonMedia.pdf`, Marcus
 * prod-röktest 2026-08-26] Faller ett REDAN `sanitizeFilnamn`-saneratnamn
 * icke-Storage-säkra tecken (å/ä/ö, é, ü, ñ, ç, CJK-ideogram, emoji, …) till
 * Storage-SÄKRA ASCII-tecken. Körs ENDAST av `buildAttachmentLeaf` nedan —
 * ALDRIG av `sanitizeFilnamn` självt (se den funktionens docblock för
 * varför de två stegen medvetet hålls isär sedan review-runda 1). TVÅ
 * steg, i ordning:
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
 *     som INTE diakritik-dekomponerar mot ASCII, emoji, `ß`/`ø`/`æ`/`œ`/`Þ`,
 *     en-dash `–`, citattecken, `#`, `%`, …) → ETT `-` per KODPUNKT (inte
 *     per UTF-16-enhet, se regexens `u`-flagga ovan). Detta är vad som
 *     GARANTERAR Storage-kompatibilitet för VILKET filnamn som helst —
 *     steg 1 är bara en läsbarhets-bonus för skript som faktiskt
 *     diakritik-dekomponerar. **VIKTIGT, KORRIGERAT PÅSTÅENDE:** en
 *     tidigare version av denna docblock (och av `upload-attachment/
 *     index.ts`s hash-not) påstod att KOLLAPSEN detta steg kan orsaka var
 *     begränsad till "namn som ENDAST skiljer sig i diakritik" — det var
 *     sakligt fel (ADR-083), empiriskt motbevisat i review-runda 1: TVÅ
 *     HELT OLIKA CJK-strängar (`填报指南.pdf`/`肆意妄为.pdf`) och TVÅ HELT
 *     OLIKA emoji (`😀`/`🎉`) faller till SAMMA ASCII-sträng lika lätt som
 *     ett diakritik-par gör. Den bredare sanningen: VARJE tecken utanför
 *     Storages tillåtna mängd kollapsar mot samma fallback-`-`, oavsett hur
 *     olika käll-tecknen är. Just DÄRFÖR flyttades ASCII-fallet HIT (bara
 *     Storage-nyckeln) och hash-underlaget (`sanitizeFilnamn`, ovan) förblir
 *     ofallet — se den funktionens docblock.
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
 * Storage-objektets LEAF-namn (allt utom `eventId/`-prefixet): `<attachmentId>-
 * <ASCII-säkra formen av sanitizeFilnamn(filnamn)>`. Utbruten som EGEN
 * funktion (TASK-147.5) eftersom den bilage-bärande sändvägen behöver
 * PRECIS denna sträng för att skriva `Lagringsnyckel`-fältet vid
 * radskapelse (upload-attachment/finalize-attachment-upload/generate-
 * event-attachment) — samma formel som `buildAttachmentPath` nedan bygger
 * på, inte en parallell variant.
 *
 * [TASK-309.22, REVIDERAD EFTER REVIEW-RUNDA 1] Det ÄR HÄR — och ENDAST
 * här — `toStorageSafe` körs. `deriveAttachmentId`
 * (`upload-attachment/index.ts`) anropar `sanitizeFilnamn` DIREKT (inte via
 * denna funktion) just för att UNDVIKA ASCII-fallet i sitt hash-underlag —
 * se den funktionens docblock för det fulla idempotens-resonemanget.
 */
export function buildAttachmentLeaf(attachmentId: string, filnamn: string): string {
  return `${attachmentId}-${toStorageSafe(sanitizeFilnamn(filnamn))}`;
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
