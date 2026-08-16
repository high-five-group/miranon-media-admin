import { z } from 'zod';
import { AttachmentClass } from '../types/Status';

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
 */
export const AttachmentSchema = z.object({
  id: z.string(),
  namn: z.string(),
  storlekBytes: z.number(),
  skapad: z.string(),
  eventId: z.string().nullable(),
  dokumentklass: z.enum(AttachmentClass).nullable(),
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
 */
export const DocumentPreviewSchema = z.object({
  pdfBase64: z.string(),
});
