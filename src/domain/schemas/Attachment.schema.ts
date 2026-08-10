import { z } from 'zod';

/**
 * [GA] Runtime-validering av upload-attachment/finalize-attachment-upload-svar
 * (ADR-026). Parallell sanningskälla: interfacet i `../models/Attachment.ts`.
 */
export const AttachmentSchema = z.object({
  id: z.string(),
  namn: z.string(),
  storlekBytes: z.number(),
  skapad: z.string(),
  eventId: z.string().nullable(),
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
