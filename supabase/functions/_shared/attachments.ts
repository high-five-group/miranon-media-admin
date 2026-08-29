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
// [TASK-275.2, ADR-118 · UTBYGGT TASK-338.2, ADR-125 § Beslut 1] `z`
// importeras här för AttachmentScopeInputSchema (räckviddsparametrarnas
// strikta write-side-validering) — SAMMA esm.sh-URL-form som
// `_shared/activity-statement-schema.ts` redan etablerar för Deno-EF:er.
//
// PRECIS DÄRFÖR bor räckviddens LÄSVÄG (konstanterna, normaliseringen och
// matcharen) i `./rackvidd-matchning.ts` i stället för här: esm.sh-importen
// gör denna fil omöjlig att importera direkt i ett Node-test, och kortets
// AC #1 kräver en enhetstestbar ren matchare. Samma strukturella flytt som
// `./attachment-filename.ts` (TASK-309.22). Konstanterna re-exporteras
// nedan, så ingen befintlig importsats i någon EF behövde ändras.
//
// [RÄCKVIDDEN, TASK-338.2] `Räckvidd` bär numera TVÅ levande värden —
// `Event` och `Gemensam` (filter över tre valfria axlar: Kursfamilj ·
// Kursnivå · Plats, kombinerade med OCH, tom axel begränsar inte).
// `Kurstyp`/`Alla event` är LEGACY: skrivvägen accepterar dem och sparar
// `Gemensam` med axlarna bevarade, läsvägen normaliserar dem på vägen ut
// (`mapAttachmentRecord`). Rivningsskuld bokförd i `rackvidd-matchning.ts`
// § LEGACY_ATTACHMENT_SCOPES och i AttachmentScopeInputSchemas docblock.
import { z } from 'https://esm.sh/zod@4';
import { fetchAirtableRecord } from './airtable-client.ts';

export const BILAGOR_BUCKET_ID = 'bilagor';
export const BILAGOR_TABLE = 'Bilagor';
export const EVENTPLANERING_TABLE = 'Eventplanering';
/** [TASK-338.2] Platser (`tbl7ER0wNqAZ9ZhEq` i staging) — målet för
 *  `Bilagor.Plats`-länken och för skrivvägens existenskontroll. */
export const PLATSER_TABLE = 'Platser';

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
 * [TASK-338.2, ADR-125 § Beslut 1] Bilagor.Räckvidd-optionerna och den rena
 * matchningen bor NUMERA i `./rackvidd-matchning.ts` — en ZOD-FRI fil, av
 * exakt samma strukturella skäl som `./attachment-filename.ts` (denna fil
 * importerar zod från esm.sh och är därför inte Node-importerbar, medan
 * kortets AC #1 kräver en enhetstestbar matchare). RE-EXPORTERADE här
 * oförändrat så INGEN av de EF:er som redan importerar
 * `ATTACHMENT_SCOPE_*` via `'../_shared/attachments.ts'` behöver ändra sin
 * importsats.
 *
 * Modellen, efter ADR-125 § Beslut 1 (ersätter ADR-118 beslut 1):
 *   - `Event`: bilagan hör till exakt sitt/sina länkade event. Inga axlar.
 *   - `Gemensam`: FILTER-räckvidd över tre VALFRIA axlar (`Kursfamilj`,
 *     `Kursnivå`, `Plats`) kombinerade med OCH; tom axel begränsar inte,
 *     noll axlar = alla event.
 *   - `Kurstyp`/`Alla event`: LEGACY, normaliseras till `Gemensam` vid
 *     läsning (se `normaliseraRackvidd`). Rivningsskuld, se den modulen.
 *
 * Fält-ID:n — staging `Räckvidd` `fldU6i9Ju5HRwSRBf` (option `Gemensam`
 * `selxFObtdzHsUJiun`), `Plats` `fldmkHUxPNRRA0Rxi`, `Platsnamn`
 * `fldyEDJD3Y3InHJ7J` (TASK-338.1); prod väntar TASK-338.6. Se
 * data-model.md § "Bilagornas Gemensam-räckvidd — Plats-axel".
 */
export {
  ATTACHMENT_SCOPE_ALLA_EVENT,
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_GEMENSAM,
  ATTACHMENT_SCOPE_KURSTYP,
  arGemensam,
  lasPlatsIds,
  matcharEvent,
  normaliseraRackvidd,
  VALID_ATTACHMENT_SCOPES,
} from './rackvidd-matchning.ts';

import {
  ATTACHMENT_SCOPE_ALLA_EVENT,
  ATTACHMENT_SCOPE_EVENT,
  ATTACHMENT_SCOPE_GEMENSAM,
  ATTACHMENT_SCOPE_KURSTYP,
  lasPlatsIds,
  normaliseraRackvidd,
  VALID_ATTACHMENT_SCOPES,
} from './rackvidd-matchning.ts';

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
 *
 * [OMSKRIVET, TASK-338.2, ADR-125 § Beslut 1] Fyra värden accepteras, men
 * bara TVÅ är levande. Reglerna prövas mot det RÅA värdet, inte det
 * normaliserade, så varje klientgeneration möter exakt det kontrakt den
 * skrevs mot:
 *
 *   - `Event`      — inga axlar alls (`kursfamilj`/`kursniva`/`plats` är
 *                    kontraktsfel, aldrig tyst ignorerade).
 *   - `Gemensam`   — alla tre axlar VALFRIA; `kursniva` bara tillsammans
 *                    med `kursfamilj` (en nivå utan familj är inte en
 *                    räckvidd, den är en halv tanke); NOLL axlar är
 *                    GILTIGT och betyder "alla event".
 *   - `Kurstyp`    — LEGACY. `kursfamilj` KRÄVS fortfarande, `plats` är
 *                    otillåten. En installerad PWA-klient som skickar
 *                    `Kurstyp` menar precis det ADR-118 lovade; att
 *                    släppa igenom ett `Kurstyp` utan familj bara för att
 *                    värdet normaliseras hade mildrat ett kontrakt i
 *                    stället för att bevara det.
 *   - `Alla event` — LEGACY. Inga axlar alls, precis som förr.
 *
 * RIVNINGSSKULD, bokförd öppet (PRD TASK-338 § Utanför omfattningen): de
 * två legacy-grenarna rivs i en egen skuldpost när installerade PWA-
 * klienter bevisligen slutat skicka dem. Tills dess är de en
 * BAKÅTKOMPATIBILITETSYTA, inte en modell — se `rackvidd-matchning.ts` §
 * LEGACY_ATTACHMENT_SCOPES.
 *
 * `plats` är ett Platser-RECORD-ID (rec…). Formen valideras här; att raden
 * FAKTISKT finns kan bara avgöras mot basen och kontrolleras därför av den
 * skrivande EF:en (`upload-attachment`/`finalize-attachment-upload`, samma
 * vaktklass som `generate-event-attachment`s ersatt-guard) INNAN skrivning.
 */
const PLATS_ID_RE = /^rec[A-Za-z0-9]{3,}$/;

export const AttachmentScopeInputSchema = z
  .object({
    rackvidd: z
      .enum([
        ATTACHMENT_SCOPE_EVENT,
        ATTACHMENT_SCOPE_GEMENSAM,
        ATTACHMENT_SCOPE_KURSTYP,
        ATTACHMENT_SCOPE_ALLA_EVENT,
      ])
      .default(ATTACHMENT_SCOPE_EVENT),
    kursfamilj: z.enum(KURSFAMILJ_VALUES).optional(),
    kursniva: z.enum(KURSNIVA_VALUES).optional(),
    plats: z.string().regex(PLATS_ID_RE, 'Ogiltigt plats-id.').optional(),
  })
  .superRefine((val, ctx) => {
    const harKursaxel = Boolean(val.kursfamilj || val.kursniva);

    if (val.rackvidd === ATTACHMENT_SCOPE_EVENT) {
      if (harKursaxel || val.plats) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Kursfamilj, Kursnivå och Plats är bara giltiga för en gemensam bilaga (räckvidd Gemensam).',
          path: ['rackvidd'],
        });
      }
      return;
    }

    if (val.rackvidd === ATTACHMENT_SCOPE_KURSTYP) {
      if (!val.kursfamilj) {
        ctx.addIssue({
          code: 'custom',
          message: 'Kursfamilj krävs för räckvidd Kurstyp.',
          path: ['kursfamilj'],
        });
      }
      if (val.plats) {
        ctx.addIssue({
          code: 'custom',
          message: 'Plats kräver räckvidd Gemensam.',
          path: ['plats'],
        });
      }
      return;
    }

    if (val.rackvidd === ATTACHMENT_SCOPE_ALLA_EVENT) {
      if (harKursaxel || val.plats) {
        ctx.addIssue({
          code: 'custom',
          message: 'Räckvidd Alla event kan inte bära Kursfamilj, Kursnivå eller Plats.',
          path: ['rackvidd'],
        });
      }
      return;
    }

    // ATTACHMENT_SCOPE_GEMENSAM — alla axlar valfria, noll axlar giltigt.
    if (val.kursniva && !val.kursfamilj) {
      ctx.addIssue({
        code: 'custom',
        message: 'Kursnivå kräver att en Kursfamilj också är vald.',
        path: ['kursniva'],
      });
    }
  });

export type AttachmentScopeInput = z.infer<typeof AttachmentScopeInputSchema>;

/**
 * Bygger de bas-fält (`Räckvidd`/`Kursfamilj`/`Kursnivå`/`Plats`) en
 * skrivande EF ska lägga till `fields` vid radskapelse, ur ett redan
 * Zod-validerat `AttachmentScopeInput`.
 *
 * SKRIVER ALLTID DEN NORMALISERADE räckvidden (`Event`/`Gemensam`) — en
 * legacy-klients `Kurstyp`/`Alla event` blir alltså `Gemensam` I BASEN med
 * sina axlar bevarade. Det är hela poängen med att acceptera dem: basen
 * bär EN modell (ADR-063, "en rad ska gå att granska i Airtable"), och
 * legacy-toleransen sitter i kontraktet, inte i lagringen.
 *
 * Tomma axlar UTELÄMNAS (aldrig satta till tomsträng eller tom länk) —
 * samma "utelämnande är formen för 'ingen känd nivå'"-disciplin som
 * `create-event`s `Kursfamilj`/`Kursnivå`-hantering
 * (`_shared/course-dimensions.ts` docblock) och `upload-attachment`s
 * `Event`-fält. `Plats` skrivs som en LÄNK-array (`[platsId]`), aldrig som
 * ett namn: multipleRecordLinks tar record-ID:n, och en namn-skrivning
 * hade dessutom drivit isär från matchningens ID-jämförelse.
 */
/**
 * [TASK-338.2] EXISTENSKONTROLLEN för `plats` — samma vaktklass som
 * `generate-event-attachment`s ersatt-guard: Zod kan bara pröva FORMEN
 * (`rec…`), inte att raden finns. Utan denna kontroll hade en felstavad
 * eller raderad plats-referens skrivits som en tom länk av Airtable
 * (multipleRecordLinks tystar ett okänt ID) och bilagan blivit
 * PLATS-LÖS — alltså synlig på ALLA event i stället för ett, vilket är
 * exakt den fel-information-går-ut-skada PRD TASK-338 berättelse 3 finns
 * för att förhindra. En tyst uppvidgning är värre än ett 4xx.
 *
 * BOR HÄR, inte inline i de två skrivande EF:erna: en säkerhetsvakt som
 * dupliceras på två ställen driver isär vid nästa ändring, och båda
 * skrivvägarna delar redan `AttachmentScopeInputSchema`/`buildScopeFields`
 * härifrån.
 */
export async function platsFinns(platsId: string): Promise<boolean> {
  const rad = await fetchAirtableRecord(PLATSER_TABLE, platsId);
  return rad !== null;
}

export function buildScopeFields(input: AttachmentScopeInput): Record<string, unknown> {
  const norm = normaliseraRackvidd({
    rackvidd: input.rackvidd,
    kursfamilj: input.kursfamilj ?? null,
    kursniva: input.kursniva ?? null,
    platsIds: input.plats ? [input.plats] : [],
  });

  const fields: Record<string, unknown> = { Räckvidd: norm.rackvidd };
  if (norm.kursfamilj) fields.Kursfamilj = norm.kursfamilj;
  if (norm.kursniva) fields.Kursnivå = norm.kursniva;
  if (norm.platsIds.length > 0) fields.Plats = [...norm.platsIds];
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
  // [TASK-338.2] `Gemensam` läggs till BREDVID de två legacy-värdena, och
  // grenarnas PATH-FORMER lämnas ORÖRDA (`kurstyp/<slug>` respektive
  // `alla-event`). Det är avsiktligt: denna funktion har TVÅ användningar —
  // skrivvägen bygger en ny path, läsvägen (delete-attachment/
  // get-attachment-download-url) härleder SAMMA path ur en REDAN SKAPAD
  // rads egna fält. De 9 staging-rader TASK-338.1 migrerade till `Gemensam`
  // bär fortfarande sina bytes under de gamla prefixen; ett nytt prefix
  // hade gjort varje sådan fil oöppningsbar och oraderbar, tyst.
  //
  // Plats-axeln får MEDVETET ingen egen gren. Ankaret behöver bara vara
  // stabilt och deterministiskt, inte semantiskt fullständigt (se
  // docblocken ovan) — och en plats-gren hade krävt att BÅDA läsande
  // konsumenter också läser `Plats` ur raden och skickar in den, alltså en
  // ny väg för skriv- och läshärledningen att drifta isär. En plats-bunden
  // bilaga utan kursfamilj landar därför under `alla-event`.
  //
  // De TVÅ legacy-grenarna är BYTE FÖR BYTE oförändrade (inklusive att ett
  // `Kurstyp` UTAN `Kursfamilj` fortfarande ger `null`, alltså "kan inte
  // härledas" — ett fail-closed som en läsande konsument redan hanterar).
  // Bara `Gemensam`-grenen är ny.
  if (params.rackvidd === ATTACHMENT_SCOPE_KURSTYP && params.kursfamilj) {
    return kurstypAnkare(params.kursfamilj);
  }
  if (params.rackvidd === ATTACHMENT_SCOPE_ALLA_EVENT) {
    return 'alla-event';
  }
  if (params.rackvidd === ATTACHMENT_SCOPE_GEMENSAM) {
    return params.kursfamilj ? kurstypAnkare(params.kursfamilj) : 'alla-event';
  }
  return null;
}

/** `kurstyp/<ASCII-slug>` — se `buildStorageAnchor`s RÖTT-FÖRST-BELÄGG. */
function kurstypAnkare(kursfamilj: string): string | null {
  const slug = KURSFAMILJ_SLUG[kursfamilj];
  if (!slug) return null;
  return `kurstyp/${slug}`;
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
  /** [TASK-338.2, ADR-125 § Beslut 1] Plats-axeln, redan upplöst till
   *  namn via `Platsnamn`-lookupen så klienten slipper ett extra uppslag.
   *  `null` när bilagan inte är platsbunden (det vanliga). */
  plats: { id: string; namn: string } | null;
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
  // [TASK-338.2, ADR-125 § Beslut 1] NORMALISERINGEN sker HÄR, en gång, på
  // vägen ut — så varje konsument (svaret till klienten, matcharen,
  // räckviddslistningen) ser SAMMA två levande värden och ingen behöver
  // känna till legacy-formerna. En rad som bär `Kurstyp` i basen (prod
  // fram till TASK-338.6, eller staging mellan två EF-deploys) rapporteras
  // alltså som `Gemensam` med sina axlar bevarade.
  const raRackvidd =
    typeof rackvidd === 'string' && VALID_ATTACHMENT_SCOPES.includes(rackvidd) ? rackvidd : null;
  const platsIds = lasPlatsIds(f['Plats']);
  const norm = normaliseraRackvidd({
    rackvidd: raRackvidd,
    kursfamilj: typeof kursfamilj === 'string' && kursfamilj.length > 0 ? kursfamilj : null,
    kursniva: typeof kursniva === 'string' && kursniva.length > 0 ? kursniva : null,
    platsIds,
  });
  // `Platsnamn` är en LOOKUP (multipleLookupValues) och kommer därför som
  // en ARRAY, aldrig som en skalär — även när länken bara bär en rad.
  const platsnamn = Array.isArray(f['Platsnamn']) ? f['Platsnamn'] : [];
  const forstaPlatsId = norm.platsIds[0] ?? null;
  const forstaPlatsnamn = typeof platsnamn[0] === 'string' ? (platsnamn[0] as string) : '';
  return {
    id: record.id,
    namn: typeof namn === 'string' ? namn : '',
    storlekBytes: typeof storlek === 'number' ? storlek : 0,
    skapad: typeof skapad === 'string' ? skapad : new Date(0).toISOString(),
    eventId: Array.isArray(event) && event.length > 0 ? (event[0] as string) : null,
    dokumentklass:
      typeof klass === 'string' && VALID_ATTACHMENT_CLASSES.includes(klass) ? klass : null,
    rackvidd: norm.rackvidd,
    kursfamilj: norm.kursfamilj,
    kursniva: norm.kursniva,
    // Namnet får vara tomt utan att ID:t försvinner: lookupen kan halka
    // efter en nyss skapad länk, och ett `plats: null` hade då sett ut som
    // "ingen plats" i stället för "namnet är inte läst än".
    plats: forstaPlatsId === null ? null : { id: forstaPlatsId, namn: forstaPlatsnamn },
    mall: typeof mall === 'string' && mall.length > 0 ? mall : null,
    kallhash: typeof kallhash === 'string' && kallhash.length > 0 ? kallhash : null,
  };
}
