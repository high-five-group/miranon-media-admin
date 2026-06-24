import { z } from 'zod';

/** Payload för att skicka ett mailutskick */
export const MailPayloadSchema = z.object({
  amne: z.string(),
  mailtext: z.string(),
  segmentIds: z.array(z.string()),
  antalMottagare: z.number().optional(),
});

/**
 * En rad i utskicksloggen (Utskickslogg, tblIesjbuSWNp6oxK). Live-verifierad
 * fält-grund (Session 33 L2 STEG 1, staging) — ersätter den tidiga skissen som
 * data-model.md var tyst om. Fält-ordningen speglar live-tabellen.
 */
export const MailLogEntrySchema = z.object({
  id: z.string(),
  /** Namn på utskick (singleLineText). Mappning, ej fältnamn-1:1. */
  utskicksNamn: z.string().nullable(),
  /**
   * Utskicks-ID — `multipleRecordLinks` → Bulkutskick. Länk-ARRAY av record-ID:n
   * (ALDRIG skalär; rättat från felaktig `bulkutskickId: string|null`). Tom array
   * när olänkad. Namnet ärligt = array.
   */
  utskicksIds: z.array(z.string()),
  /** Skickat till — `multipleRecordLinks` → Personer. Mottagar-record-ID:n. */
  skickatTill: z.array(z.string()),
  /** Antal skickade — formula `COUNTA({Skickat till})`. Alltid number (0 vid inga mottagare). */
  antalSkickade: z.number(),
  /**
   * Datum — `createdTime` (record-metadata, ISO, ALLTID present → ej nullable;
   * identisk proveniens som `WaitlistEntrySchema.createdTime` som också är z.string()).
   */
  datum: z.string(),
  /**
   * Öppningsgrad (%) — percent-formula `{Antal öppnade mail}/{Antal skickade}`.
   * Airtable-API ger DECIMAL 0–1 (ej heltal-procent); `null` när Antal skickade = 0
   * (division-by-zero → Airtable ger tomt/specialValue). Vyn formaterar 0–1 → "%".
   */
  oppningsgrad: z.number().nullable(),
  /** Filter snapshot (multilineText) — "vilka fick" (segment/filter-ögonblicksbild). */
  filterSnapshot: z.string().nullable(),
  /** Mailutskick copy (singleLineText). */
  mailutskickCopy: z.string().nullable(),
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
