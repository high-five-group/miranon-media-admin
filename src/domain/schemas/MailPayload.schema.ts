import { z } from 'zod';

/** Payload för att skicka ett mailutskick */
export const MailPayloadSchema = z.object({
  amne: z.string(),
  mailtext: z.string(),
  segmentIds: z.array(z.string()),
  antalMottagare: z.number().optional(),
});

/** En rad i utskicksloggen */
export const MailLogEntrySchema = z.object({
  id: z.string(),
  utskicksNamn: z.string().nullable(),
  bulkutskickId: z.string().nullable(),
  antalSkickade: z.number(),
  datum: z.string().nullable(),
  oppningsgrad: z.number().nullable(),
});

/** Ett bulkutskick (drafts + skickade) */
export const BulkMailSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  status: z.string().nullable(),
  amne: z.string().nullable(),
  mailtext: z.string().nullable(),
  forhandsgranskning: z.string().nullable(),
  testad: z.boolean(),
  senastSkickat: z.string().nullable(),
  mottagetAvAntal: z.number().nullable(),
  segmentIds: z.array(z.string()),
});
