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
//
// [TASK-275.2, ADR-118] `z` importeras här för den nya
// AttachmentScopeInputSchema (räckviddsparametrarnas strikta write-side-
// validering, AC #2) — SAMMA esm.sh-URL-form som
// `_shared/activity-statement-schema.ts` redan etablerar för Deno-EF:er.
import { z } from 'https://esm.sh/zod@4';

export const BILAGOR_BUCKET_ID = 'bilagor';
export const BILAGOR_TABLE = 'Bilagor';
export const EVENTPLANERING_TABLE = 'Eventplanering';

/**
 * Bilagor.Dokumentklass-optionerna (TASK-147.12, additivt fält, staging
 * `fldr2CwboZ3M4USCX`) — DUPLICERAS MEDVETET mot `src/domain/types/Status.ts`s
 * `AttachmentClass`, samma duplicerings-mönster som BILAGOR_BUCKET_ID/
 * SMALL_UPLOAD_MAX_BYTES ovan (Deno-EF:erna delar ingen build-kedja med
 * Vite-bygget). Skrivande EF:er importerar DESSA konstanter, aldrig en
 * bokstavlig sträng inline — en stavfel-drift mellan de två sidorna hade
 * annars gett en tyst 400 (findDisallowedField) eller ett osynkat
 * options-val i UI:t.
 */
export const ATTACHMENT_CLASS_UPPLADDAD = 'Uppladdad';
export const ATTACHMENT_CLASS_EVENT_MALLAD = 'Event-mallad';
export const ATTACHMENT_CLASS_PERSON_GENERERAD = 'Person-genererad';

/**
 * Bilagor.Räckvidd-optionerna (TASK-275.2, ADR-118 beslut 1+4, additivt fält
 * — staging `fldU6i9Ju5HRwSRBf`, prod `fldsEltfGx3y63hhF`, se data-model.md §
 * "Staging- och prodbasens additiva tillskott 2026-08-17 (task-275.1...)".
 * DUPLICERAS MEDVETET mot `src/domain/types/Status.ts`s `AttachmentScope` —
 * samma Deno↔Vite-dubblerings-mönster som ATTACHMENT_CLASS_* ovan.
 *
 * Varje bilaga bär EXAKT en räckvidd (ORDLISTA.md § Räckvidd):
 *   - Event: dagens koppling, `Kursfamilj`/`Kursnivå` UTELÄMNADE.
 *   - Kurstyp: `Kursfamilj` OBLIGATORISK, `Kursnivå` valfri (tom = hela
 *     familjen — "tom-nivå-regeln", samma regel som Eventplanering).
 *   - Alla event: varken `Kursfamilj` eller `Kursnivå`.
 */
export const ATTACHMENT_SCOPE_EVENT = 'Event';
export const ATTACHMENT_SCOPE_KURSTYP = 'Kurstyp';
export const ATTACHMENT_SCOPE_ALLA_EVENT = 'Alla event';

/** Giltiga `Räckvidd`-optionsnamn — speglar VALID_ATTACHMENT_CLASSES nedan. */
const VALID_ATTACHMENT_SCOPES: readonly string[] = [
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_KURSTYP,
  ATTACHMENT_SCOPE_ALLA_EVENT,
];

/**
 * `Kursfamilj`/`Kursnivå`s giltiga valslag på Bilagor — EXAKT samma
 * options-namn som Eventplanerings ADR-115-fält (data-model.md § "Staging-
 * och prodbasens additiva tillskott 2026-08-17 (S104 basstrukturen,
 * ADR-115)"), inte importerade från `course-dimensions.ts` (den modulen är
 * keyed på KURSNAMN → dimensioner, ett annat uppslag än denna raka
 * write-side-enum).
 */
const KURSFAMILJ_VALUES = ['RIM', 'Fjärrskådning', 'Psionautics'] as const;
const KURSNIVA_VALUES = ['Intro', 'Nivå 1', 'Nivå 2', 'Nivå 3'] as const;

/**
 * WRITE-SIDANS strikta Zod-validering av räckviddsparametrarna (TASK-275.2
 * AC #2: "validerar strikt via Zod"). Delad mellan upload-attachment
 * (mönster 1) och finalize-attachment-upload (mönster 2 — se den EF:ens
 * filhuvud för varför INTE create-attachment-upload-ticket: ticket-steget
 * skriver ingen Bilagor-rad och behöver därför aldrig räckviddsparametrarna).
 *
 * Strikt HÄR är korrekt trots den NÄRLIGGANDE varningen i motsatt riktning
 * (airtable-constraints.md § P22, "hård enum på LIVE-LÄSVÄG knäcker på
 * legacy-värden") — DENNA enum sitter på WRITE-vägen, mot NYA klient-
 * angivna värden vi själva kontrollerar, inte mot historisk Airtable-data.
 * Läsvägen (`mapAttachmentRecord` nedan) förblir defensiv (okänt → null).
 *
 * `rackvidd` default:ar till Event (dagens beteende, bakåtkompatibelt — en
 * uppladdning som inte anger räckvidd alls fortsätter fungera identiskt).
 * `kursfamilj` KRÄVS när rackvidd=Kurstyp (annars validation-fel);
 * `kursniva` är ALLTID valfri (tom = "hela familjen", ADR-118 beslut 1).
 * Ett `kursfamilj`/`kursniva`-värde utanför Kurstyp-räckvidden är ett
 * kontraktsfel (ogiltig input), inte tyst ignorerat.
 */
export const AttachmentScopeInputSchema = z
  .object({
    rackvidd: z
      .enum([ATTACHMENT_SCOPE_EVENT, ATTACHMENT_SCOPE_KURSTYP, ATTACHMENT_SCOPE_ALLA_EVENT])
      .default(ATTACHMENT_SCOPE_EVENT),
    kursfamilj: z.enum(KURSFAMILJ_VALUES).optional(),
    kursniva: z.enum(KURSNIVA_VALUES).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.rackvidd === ATTACHMENT_SCOPE_KURSTYP && !val.kursfamilj) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kursfamilj krävs för räckvidd Kurstyp.',
        path: ['kursfamilj'],
      });
    }
    if (val.rackvidd !== ATTACHMENT_SCOPE_KURSTYP && (val.kursfamilj || val.kursniva)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kursfamilj/Kursnivå är bara giltiga tillsammans med räckvidd Kurstyp.',
        path: ['rackvidd'],
      });
    }
  });

export type AttachmentScopeInput = z.infer<typeof AttachmentScopeInputSchema>;

/**
 * Bygger de bas-fält (`Räckvidd`/`Kursfamilj`/`Kursnivå`) en skrivande EF ska
 * lägga till `fields` vid radskapelse, ur ett redan Zod-validerat
 * `AttachmentScopeInput`. `Kursnivå` UTELÄMNAS (aldrig satt till tomsträng)
 * när den inte angetts — samma "utelämnande är formen för 'ingen känd
 * nivå'"-disciplin som `create-event`s `Kursfamilj`/`Kursnivå`-hantering
 * (`_shared/course-dimensions.ts` docblock).
 */
export function buildScopeFields(input: AttachmentScopeInput): Record<string, string> {
  const fields: Record<string, string> = { Räckvidd: input.rackvidd };
  if (input.rackvidd === ATTACHMENT_SCOPE_KURSTYP) {
    if (input.kursfamilj) fields.Kursfamilj = input.kursfamilj;
    if (input.kursniva) fields.Kursnivå = input.kursniva;
  }
  return fields;
}

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

/**
 * Signerad NEDLADDNINGS-URL:ens giltighetstid (TASK-245, `get-attachment-
 * download-url`). KORT TTL per branschstandard — AWS Prescriptive Guidance
 * (docs.aws.amazon.com/prescriptive-guidance/latest/presigned-url-best-
 * practices, research-pass 2026-08-16, sökning "signed URL expiration best
 * practice download preview time-limited"): "Keep the expiration times
 * short… shorter expiration times (minutes to hours rather than days) are
 * generally recommended for security purposes."
 *
 * 300 sekunder (5 minuter) — gott om tid att öppna Dokument-ytans
 * Visa-overlay, förhandsvisa en PDF/bild och/eller klicka "Ladda ner", men
 * kort nog att en läckt URL slutar fungera inom samma session den lästes i.
 * MEDVETET kortare än `SIGNED_UPLOAD_URL_TTL_SECONDS` (7200s, plattformens
 * FASTA uppladdnings-TTL, se den konstantens docblock): uppladdning är en
 * engångs-transaktion som kan dra ut på tiden för stora filer (mönster 2s
 * tre steg), nedladdning är en användare som öppnar EN redan existerande
 * fil i en dialog — inget skäl att hålla länken vid liv timmar efter att
 * dialogen stängts. Till skillnad mot uppladdnings-TTL:en (plattformens
 * FASTA värde, ingen expires-parameter finns) VÄLJER vi denna själva —
 * `createSignedUrl(path, expiresIn)` tar expiresIn i sekunder, verifierat
 * mot `@supabase/storage-js`s källkod (`StorageFileApi.ts`).
 */
export const SIGNED_DOWNLOAD_URL_TTL_SECONDS = 300;

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

/**
 * [TASK-309.22] `sanitizeFilnamn`/`buildAttachmentLeaf`/`buildAttachmentPath`
 * FLYTTADE till `./attachment-filename.ts` (en egen, ZOD-FRI fil — se den
 * filens huvud för det fulla strukturella skälet: `_shared/attachments.ts`
 * importerar zod från `esm.sh`, vilket gör HELA filen otestbar som ett
 * direkt Node-import; funktionerna behövde ingen zod och blev därför
 * body-testbara mot produktionskoden genom flytten,
 * `tests/api/attachment-filename.test.ts`). RE-EXPORTERADE här oförändrat
 * så INGEN av de 13 EF-filer som redan importerar dem via
 * `'../_shared/attachments.ts'` behöver ändra sin importsats.
 */
export {
  buildAttachmentLeaf,
  buildAttachmentPath,
  sanitizeFilnamn,
} from './attachment-filename.ts';

/**
 * [TASK-275.3, ADR-118 beslut 5] Storage-path-ANKARET — den DETERMINISTISKA
 * härledningen som gör `buildAttachmentPath` möjlig även för en GENUINT
 * event-lös uppladdning (räckviddsläget på Dokument-ytan, ingen `eventId`
 * i kontext). Tre grenar, i PRIORITETSORDNING:
 *
 *   1. `eventId` ANGIVEN (oavsett räckvidd) → ANVÄND DEN, oförändrat mot
 *      TASK-275.2:s beteende. Detta täcker BÅDA: (a) alla Event-räckviddiga
 *      bilagor (eventId är obligatorisk för dem, se upload-attachment/
 *      index.ts) OCH (b) en Kurstyp/Alla-event-bilaga uppladdad FRÅN ett
 *      events kontext (Lotta står på ett events sida men väljer ändå en
 *      delad räckvidd) — 275.2:s medvetna design att `Event`-länken förblir
 *      satt oavsett räckvidd när ett event faktiskt är känt.
 *   2. `eventId` UTELÄMNAD + räckvidd Kurstyp → `kurstyp/<kursfamilj-SLUG>`
 *      (se `KURSFAMILJ_SLUG` nedan — INTE det råa Airtable-optionsnamnet,
 *      RÖTT-FÖRST-BELÄGG nedan). Alla bilagor för SAMMA kursfamilj (oavsett
 *      Kursnivå — anKRET är MEDVETET grövre än matchningsformeln i
 *      get-event-attachments, som SJÄLV hanterar tom-nivå-regeln vid
 *      LÄSNING; storage-anKRET behöver bara vara stabilt och
 *      deterministiskt, inte semantiskt fullständigt) delar Storage-mapp —
 *      rent organisatoriskt, ingen åtkomstkontroll vilar på detta (den
 *      sitter i Bilagor-radens `Räckvidd`-fält och EF-guarderna, se
 *      delete-attachment/get-attachment-download-url).
 *   3. `eventId` UTELÄMNAD + räckvidd Alla event → den FASTA strängen
 *      `'alla-event'`.
 *
 * RÖTT-FÖRST-BELÄGG (TASK-275.3, skarpt mot staging 2026-08-17): en
 * event-lös uppladdning med `kursfamilj: 'Fjärrskådning'` (rå sträng, å/ä)
 * som storage-path-segment gav Supabase Storage-serverns EGNA 400
 * `"Invalid key: kurstyp/Fjärrskådning/…"` — INTE ett fel i vår kod runt
 * anropet, utan plattformens objektnyckel-validering som avvisar denna
 * icke-ASCII-formen. `RIM`/`Psionautics` (redan rena ASCII-strängar) föll
 * ALDRIG i samma test — det isolerar felet till just diakritiska tecken i
 * path-SEGMENT, inte till Kurstyp-grenen i stort. `KURSFAMILJ_SLUG` löser
 * det med samma "ASCII-slug för en icke-ASCII-domänsträng"-disciplin som
 * `sanitizeFilnamn` redan bär för klient-angivna filnamn (fast den
 * funktionen tar INTE bort å/ä/ö — bara styrtecken/separatorer — så den var
 * inte lösningen här; kursfamilj är dessutom en SLUTEN, server-kontrollerad
 * uppsättning om tre värden, en explicit uppslagstabell är därför säkrare
 * än en generisk transliterations-algoritm).
 *
 * ANVÄNDS BÅDE VID SKRIVNING (upload-attachment: bygger en NY path ur
 * klientens `{eventId, rackvidd, kursfamilj}`) OCH VID LÄSNING/RADERING
 * (delete-attachment/get-attachment-download-url: härleder SAMMA anker ur
 * en REDAN SKAPAD Bilagor-rads egna fält — `eventId` blir då radens `Event`-
 * länk om satt, annars `null`). EN formel, två användningar — exakt samma
 * disciplin som `buildAttachmentLeaf` redan etablerar för Lagringsnyckel.
 *
 * Returnerar `null` OM inget anker kan härledas (defensivt, borde vara
 * ouppnåeligt givet `AttachmentScopeInputSchema`s validering vid skrivning
 * — men en läsande anropare möter historisk/legacy-data den inte kontrollerat
 * skrev, så "kan inte härleda" måste vara ett uttryckt, hanterat fall snarare
 * än ett kraschande antagande). Ett OKÄNT `kursfamilj`-värde (utanför
 * KURSFAMILJ_SLUG — kan bara nås av läsande anropare mot historisk/felaktig
 * data, ALDRIG av skrivvägen som validerar strikt) faller till samma `null`.
 */
const KURSFAMILJ_SLUG: Readonly<Record<string, string>> = {
  RIM: 'rim',
  Fjärrskådning: 'fjarrskadning',
  Psionautics: 'psionautics',
};

export function buildStorageAnchor(params: {
  eventId: string | null;
  rackvidd: string;
  kursfamilj?: string | null;
}): string | null {
  if (params.eventId) return params.eventId;
  if (params.rackvidd === ATTACHMENT_SCOPE_KURSTYP && params.kursfamilj) {
    const slug = KURSFAMILJ_SLUG[params.kursfamilj];
    if (!slug) return null;
    return `kurstyp/${slug}`;
  }
  if (params.rackvidd === ATTACHMENT_SCOPE_ALLA_EVENT) {
    return 'alla-event';
  }
  return null;
}

/**
 * Uint8Array → base64, UTAN spridningsoperator (`...bytes`) — undviker
 * call-stack-taket på stora arrayer. Samma implementation som fanns
 * DUPLICERAD i generate-event-attachment/index.ts (TASK-146.5); flyttad hit
 * (TASK-147.5) eftersom den bilage-bärande sändvägen (send-action-email/
 * index.ts) behöver EXAKT samma bas64-kodning för att bifoga hämtade
 * Storage-bytes till Resends `attachments[].content` (HTTP-API:t accepterar
 * "a buffer or Base64 string" — en base64-STRÄNG sidesteppar frågan om
 * Deno-global `Buffer` helt, se docs/research/utskicks-bilage-arkitektur-
 * 2026-08-03.md § Delfråga 1).
 */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/** Giltiga `Dokumentklass`-optionsnamn — allt annat (inkl. `undefined`/tomt) mappas till `null`. */
const VALID_ATTACHMENT_CLASSES: readonly string[] = [
  ATTACHMENT_CLASS_UPPLADDAD,
  ATTACHMENT_CLASS_EVENT_MALLAD,
  ATTACHMENT_CLASS_PERSON_GENERERAD,
];

/**
 * Mappar en skapad Bilagor-rad → domän-Attachment (samma shape som
 * `AttachmentSchema` i src/domain/schemas/Attachment.schema.ts — klienten ser
 * ALDRIG Airtable-fältnamn). Fälten är EXAKT scripts/create-bilagor-table.mjs
 * CONFIG.fields: Namn / 'Storlek (bytes)' / Skapad / Event / Dokumentklass
 * (TASK-147.12, sjätte fältet — Lagringsnyckel exponeras aldrig här, se
 * dess egen docblock).
 *
 * `dokumentklass`: `null` för rader som saknar värdet (icke-backfyllda
 * förfälts-rader, eller en framtida klass C-rad utan skrivväg än) ELLER bär
 * ett värde utanför den kända mängden (defensivt — samma "gissa aldrig"-
 * disciplin som resten av denna fil; ett okänt Airtable-optionsnamn ska
 * synas som "okänt" i UI:t, aldrig krascha eller tystas till fel klass).
 */
export function mapAttachmentRecord(record: {
  id: string;
  fields: Record<string, unknown>;
}): {
  id: string;
  namn: string;
  storlekBytes: number;
  skapad: string;
  eventId: string | null;
  dokumentklass: string | null;
  rackvidd: string | null;
  kursfamilj: string | null;
  kursniva: string | null;
  /** [TASK-309.4, ADR-125 § Beslut 3] Bara satt för Dokumentklass
   *  'Event-mallad' — 'Bekräftelsebilaga'/'Deltagarinformation'/'Kvitto',
   *  eller null (uppladdade/person-genererade rader, legacy Event-mallade
   *  rader från före denna skiva). */
  mall: string | null;
  /** [TASK-309.4, ADR-125 § Beslut 3] SHA-256 över kanoniskt serialiserat
   *  ifyllnadsunderlag, server-internt — adaptern (TASK-309.6) härleder
   *  inaktualitet genom att räkna om samma hash och jämföra. null när
   *  fältet saknas (samma legacy-fall som `mall` ovan). */
  kallhash: string | null;
} {
  const f = record.fields;
  const namn = f.Namn;
  const storlek = f['Storlek (bytes)'];
  const skapad = f.Skapad;
  const event = f.Event;
  const klass = f.Dokumentklass;
  const mall = f['Mall'];
  const kallhash = f['Källhash'];
  // [TASK-275.2, ADR-118] Räckvidd/Kursfamilj/Kursnivå — SAMMA defensiva
  // "okänt/saknat → null"-disciplin som Dokumentklass ovan. Legacy-rader
  // (skrivna före denna skiva, eller innan basmigreringen i task-275.1)
  // saknar fälten helt; ett okänt Airtable-optionsnamn ska synas som "okänt"
  // i UI:t, aldrig krascha eller gissas till 'Event'.
  const rackvidd = f['Räckvidd'];
  const kursfamilj = f['Kursfamilj'];
  const kursniva = f['Kursnivå'];
  return {
    id: record.id,
    namn: typeof namn === 'string' ? namn : '',
    storlekBytes: typeof storlek === 'number' ? storlek : 0,
    skapad: typeof skapad === 'string' ? skapad : new Date(0).toISOString(),
    eventId: Array.isArray(event) && event.length > 0 ? (event[0] as string) : null,
    dokumentklass:
      typeof klass === 'string' && VALID_ATTACHMENT_CLASSES.includes(klass) ? klass : null,
    rackvidd:
      typeof rackvidd === 'string' && VALID_ATTACHMENT_SCOPES.includes(rackvidd)
        ? rackvidd
        : null,
    kursfamilj: typeof kursfamilj === 'string' && kursfamilj.length > 0 ? kursfamilj : null,
    kursniva: typeof kursniva === 'string' && kursniva.length > 0 ? kursniva : null,
    mall: typeof mall === 'string' && mall.length > 0 ? mall : null,
    kallhash: typeof kallhash === 'string' && kallhash.length > 0 ? kallhash : null,
  };
}
