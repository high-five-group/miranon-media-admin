import { z } from 'zod';
import { AttachmentClass, AttachmentScope } from '../types/Status';

/**
 * [GA] Runtime-validering av upload-attachment/finalize-attachment-upload-svar
 * (ADR-026). Parallell sanningskälla: interfacet i `../models/Attachment.ts`.
 *
 * `dokumentklass` (TASK-147.12): `z.enum(AttachmentClass)` — Zod v4 accepterar
 * ett enum-likt const-objekt direkt och läser dess VÄRDEN (de tre Airtable-
 * optionsnamnen), `.nullable()` täcker både okänd/icke-härledd historik och
 * klass C:s ännu obyggda skrivväg (se domänmodellens docblock). Samma teknik
 * `ModalitetSchema` (Segment.schema.ts, `z.enum(ModalitetEnum)`) redan
 * använder för sin Status.ts-speglade enum — inte en ny konvention.
 *
 * [UTBYGGD, TASK-275.2, ADR-118] `rackvidd`: `z.enum(AttachmentScope)`
 * `.nullable()` — SAMMA teknik som `dokumentklass`, säkert eftersom
 * `mapAttachmentRecord` (server-side) redan defuserar okända värden till
 * `null` innan svaret lämnar EF:en. `kursfamilj`/`kursniva`: LENIENT
 * `z.string().nullable()` (INTE ett strikt enum) — P22-motiverat, speglar
 * `Event.schema.ts`s `kursfamilj`/`kursniva` för samma värdedomän.
 */
export const AttachmentSchema = z.object({
  id: z.string(),
  namn: z.string(),
  storlekBytes: z.number(),
  skapad: z.string(),
  eventId: z.string().nullable(),
  dokumentklass: z.enum(AttachmentClass).nullable(),
  rackvidd: z.enum(AttachmentScope).nullable(),
  kursfamilj: z.string().nullable(),
  kursniva: z.string().nullable(),
  // [TASK-309.6, ADR-125 § 5] `mall`/`kallhash` speglar `mapAttachmentRecord`
  // (`_shared/attachments.ts`) — UTAN dessa två rader hade `.parse()` (Zods
  // default: strippa okända nycklar) tyst kastat bort fälten ur varje
  // `Attachment` — `inaktuell`-härledningen (adaptern, se domänmodellen)
  // hade då aldrig sett `mall`/`kallhash` att räkna på.
  //
  // `.nullable().optional()` (INTE bara `.nullable()` som `dokumentklass`/
  // `rackvidd` ovan) — MEDVETET LENIENARE, av två skäl mätta i denna skiva:
  //   1. En EF-deploy som ligger EFTER kodens `mapAttachmentRecord`-ändring
  //      men FÖRE en redeploy (se `AirtableAdapter.ts` § berikaMedInaktuell-
  //      docblockets stale-deploy-fynd, TASK-309.6) kan SAKNA nycklarna
  //      helt i sitt JSON-svar — en strikt `.nullable()` hade fällt HELA
  //      listningen (Zod strippar inte bort på fel, den KASTAR) för en
  //      transient driftsituation en enda funktion glömdes redeploya i.
  //   2. Skarpt mätt: två BEFINTLIGA acceptance-mockar
  //      (`dokument-rackviddsval.acceptance.test.ts`,
  //      `atgarder-bilageval-send.acceptance.test.ts`) konstruerar
  //      `Attachment`-formade JSON-svar UTAN `mall`/`kallhash` — en strikt
  //      `.nullable()` fällde samtliga 11 test i den förstnämnda filen
  //      (verifierat, återställt till denna leniens). `.transform()`
  //      normaliserar `undefined` → `null` så `Attachment`-typen (domän-
  //      modellen) förblir `string | null`, ALDRIG `undefined`, för varje
  //      konsument nedströms.
  mall: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  kallhash: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

/**
 * Svaret från create-attachment-upload-ticket-EF:en (TASK-146.4 mönster 2,
 * AC #4). INTERNT till `AirtableAdapter.uploadAttachment` — konsumeras aldrig
 * utanför data-lagret, exponeras aldrig på `DataSourceAdapter`-kontraktet
 * (bilageväljaren ser bara `Attachment`, aldrig lagrings-mekaniken; ADR-057
 * klausul a). Valideras ändå med `.parse()` vid EF-svarsgränsen — samma
 * ADR-026-disciplin som varje annat EF-svar i denna kodbas, oavsett om
 * formen är "publik" på adapterkontraktet.
 *
 * `expiresInSec` = 7200 (2h), EMPIRISKT verifierat mot staging 2026-08-10 —
 * inte bara citerat ur forskningspasset. Fullt resonemang (avkodad
 * token-payload, plattformens fasta TTL, källa till storage-js-signaturen):
 * `supabase/functions/_shared/attachments.ts` §
 * SIGNED_UPLOAD_URL_TTL_SECONDS. Forskningspasset
 * (docs/research/utskicks-bilage-arkitektur-2026-08-03.md § Vad jag inte
 * kunde belägga) flaggade uttryckligen denna siffra som svagare belagd än
 * övriga plattformsfakta och bad byggpasset stänga luckan — gjort.
 */
export const AttachmentUploadTicketSchema = z.object({
  attachmentId: z.string(),
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
  maxBytes: z.number(),
  expiresInSec: z.number(),
});

/**
 * Svaret från get-attachment-download-url-EF:en (TASK-245). Tidsbegränsad
 * signerad nedladdnings-/förhandsvisnings-URL för EN bilaga i den privata
 * `bilagor`-bucketen — se `_shared/attachments.ts` §
 * SIGNED_DOWNLOAD_URL_TTL_SECONDS för TTL-motiveringen (300s, källbelagt
 * mot AWS Prescriptive Guidance). `.parse()` validerar vid datagränsen
 * (ADR-026), samma disciplin som `AttachmentUploadTicketSchema`.
 */
export const AttachmentDownloadUrlSchema = z.object({
  url: z.string(),
  expiresInSeconds: z.number(),
});

/**
 * Svaret från generate-event-attachment (`preview: true`-grenen) resp.
 * preview-receipt-EF:en (TASK-246). Parallell sanningskälla:
 * `../models/Attachment.ts` § DocumentPreview — se den docblocken för
 * varför formen är MEDVETET minimal (ingen `attachment`/`record`/
 * `storagePath`, AC #3).
 *
 * [ÄNDRAD, ADR-124, TASK-302.2] Formen var `{ pdfBase64: string }` fram
 * till 2026-08-22 — en base64-kodad PDF-byteström. Den premissen (bytes
 * till klienten räcker för att visa dokumentet) föll mot en mätning (sex
 * klientleveransarmar, headed Chrome 151, `ADR-124` § Kontext): bara en URL
 * SERVERAD AV NÄTVERKSTJÄNSTEN scrollar jämnt i Chromes PDF-visare. Formen
 * är nu `{ url, utgar }` — en kort SIGNERAD Storage-URL till ett TRANSIENT
 * utkast (`laggUtkast`, `_shared/utkast.ts`) i stället för bytes. Samma
 * fältform som `UtkastResultatSchema` nedan, men egen SCHEMA-instans: de
 * två svarar olika EF:er och delar ingen kod, bara fältform.
 */
export const DocumentPreviewSchema = z.object({
  url: z.string().url(),
  utgar: z.string().datetime(),
  /**
   * [TILLÄGG, TASK-340.1 → TASK-340.2, PRD `TASK-340` § Implementationsbeslut A]
   * Underlagets `Källhash` — den EF:en REDAN räknade ut och tidigare kastade
   * bort i preview-grenen. Klienten skickar tillbaka den vid Skapa; servern
   * räknar om dagens hash och PROMOVERAR utkastets exakta bytes när de
   * stämmer, i stället för att rendera om (DocRaptor slumpar PDF:ens `/ID`
   * per anrop, så en omrendering ger BEVISLIGEN andra bytes än den fil Lotta
   * granskade — research `forhandsgranska-spara-atervand-bilageflodet-
   * 2026-08-29.md` § 2.3).
   *
   * VALFRI, MED AVSIKT — TVÅ SKÄL, båda mätta och inget av dem hypotetiskt:
   *   1. `preview-receipt` delar detta schema och bär INGEN hash (kvittots
   *      utkast promoveras aldrig, PRD § Utanför omfattningen).
   *   2. LANDNING ÄR INTE DEPLOY. `TASK-340.1` landade i `main` 2026-08-29
   *      (PR `#2083`, `0f101a0d` + `873efad9`), men Edge Functions deployas
   *      i en EGEN kadens (`scripts/fas4-prod-deploy.sh`, staging via sin
   *      egen väg) — koden i `main` säger alltså ingenting om vad den
   *      körande EF:en svarar just nu. Ett obligatoriskt fält hade brutit
   *      varje förhandsgranskning i fönstret mellan merge och deploy, och
   *      igen vid varje rollback.
   *
   * FORMEN VALIDERAS INTE HÄR, och det är ett medvetet val. EF:en avvisar en
   * icke-kanonisk `kallhash` med 400 (`arKanoniskKallhash` i
   * `_shared/promoveringsbeslut.ts`), så ett formfel MÅSTE fångas innan vi
   * SKICKAR — inte när vi LÄSER. Läses formen strängt här faller hela
   * förhandsgranskningen på ett fält som bara är en optimering; gaten sitter
   * därför i `AirtableAdapter.skapaEventBilaga` (`arKanoniskKallhash`,
   * `mallKallhash.ts`), som hellre utelämnar hashen än skickar en trasig.
   */
  kallhash: z.string().optional(),
});

/**
 * Svaret från generate-event-attachment SKARPA gren (utan `preview`) —
 * `TASK-340.1`s ADDITIVA utbyggnad, konsumerad av `TASK-340.2`s
 * bekräftelseyta. Parallell sanningskälla: `../models/Attachment.ts` §
 * `SkapadEventBilaga`.
 *
 * DE TRE BOOLEANERNA BÄR `.default(false)` — INTE `.optional()`. Skillnaden
 * är hela poängen: konsumenten (`GenereringsVy`s textkomposition) ska aldrig
 * behöva skilja `false` från `undefined` för att avgöra vilken mening som
 * ska stå i bekräftelsen. Ett svar från den ÄNNU EJ DEPLOYADE EF:en (eller
 * från en äldre fixtur) saknar fälten helt och normaliseras då till `false`,
 * vilket är exakt sanningen om ett sådant svar: ingen promovering skedde,
 * inget underlag ändrades, ingenting ersattes.
 *
 * STATUSKODEN LÄSES INTE HÄR, och behöver inte läsas någonstans.
 * `postEdgeFunction` släpper igenom hela 2xx-bandet (`res.ok`), så både 201
 * (ny rad) och 200 (`ersatte`) når parsningen oförändrat. Invarianten
 * `201 ⇔ ersatte === false` bor i EF:en och bevisas i dess egen svit; på
 * klientsidan är `ersatte` det enda vi behöver — att härleda samma sak ur
 * statuskoden hade varit en andra, driftbar sanning om samma faktum.
 */
export const SkapadEventBilagaSchema = z.object({
  attachment: AttachmentSchema,
  /** Utkastets bytes kopierades — den sparade filen ÄR den granskade filen. */
  promoverad: z.boolean().default(false),
  /** Underlaget hade ändrats sedan förhandsgranskningen → dokumentet gjordes om. */
  underlagAndrat: z.boolean().default(false),
  /** En befintlig Event-mallad rad skrevs över i stället för att en ny föddes. */
  ersatte: z.boolean().default(false),
});

/**
 * Svaret från `test-docraptor-render` (RIVEN, `TASK-309.4`, `ADR-125` § 5)
 * med `leverans: 'utkast'` (TASK-302.1, PRD `TASK-302`, `ADR-124`) — en kort
 * signerad URL till ett TRANSIENT
 * utkast i Storage i stället för PDF-bytes, eftersom Chromes PDF-visare
 * bara scrollar jämnt på en URL serverad av nätverkstjänsten (mätt,
 * `TASK-302` § "Problemet"). `utgar` är URL:ens ISO-utgångstid — samma
 * bakomliggande TTL (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`) som
 * `AttachmentDownloadUrlSchema`s `expiresInSeconds` ovan uttrycker som
 * sekunder i stället för en tidsstämpel; de två formerna delar ingen kod.
 * `.parse()` validerar vid datagränsen (ADR-026), samma disciplin som
 * `DocumentPreviewSchema`.
 */
export const UtkastResultatSchema = z.object({
  url: z.string(),
  utgar: z.string(),
});
