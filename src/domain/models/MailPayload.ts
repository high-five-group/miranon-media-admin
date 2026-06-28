/** Payload för att skicka ett mailutskick */
export interface MailPayload {
  amne: string;
  mailtext: string;
  segmentIds: string[];
  /** Stabil idempotens-nyckel (UUID v4) per send-avsikt — återanvänds vid retry (ADR-067 D4). */
  idempotencyKey: string;
  antalMottagare?: number;
}

/**
 * Send-email-EF:ens svar (200) — 1:1 mot BulkSendStatus (send-bulk.ts) /
 * MailSendResultSchema. Aldrig binärt: `status` + server-side consent-/no-email-
 * räkning (ADR-067 D3/D5). Klienten visar utfallet, filtrerar aldrig consent själv.
 */
export interface MailSendResult {
  /** `skipped` = noll-leverans (attempted===0: tomt segment / alla undertryckta) — ingen loggrad. */
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  requested: number;
  suppressedConsent: number;
  suppressedNoEmail: number;
  deduped: number;
  attempted: number;
  accepted: number;
  rejected: number;
  rejections: { email: string; reason: string }[];
  logRecordId: string | null;
}

/** En rad i utskicksloggen (Utskickslogg). 1:1 mot MailLogEntrySchema (live-verifierad). */
export interface MailLogEntry {
  id: string;
  /** Namn på utskick (singleLineText). */
  utskicksNamn: string | null;
  /** Utskicks-ID — länk-array → Bulkutskick (record-ID:n). */
  utskicksIds: string[];
  /** Skickat till — länk-array → Personer (mottagar-record-ID:n). */
  skickatTill: string[];
  /** Antal skickade — formula COUNTA (0 vid inga mottagare). */
  antalSkickade: number;
  /** Datum — createdTime (ISO, alltid present). */
  datum: string;
  /** Öppningsgrad — percent-decimal 0–1; null vid Antal skickade = 0. */
  oppningsgrad: number | null;
  /** Filter snapshot (multilineText). */
  filterSnapshot: string | null;
  /** Mailutskick copy (singleLineText). */
  mailutskickCopy: string | null;
}

/** Ett bulkutskick (drafts + skickade) */
export interface BulkMail {
  id: string;
  namn: string | null;
  status: string | null;
  amne: string | null;
  mailtext: string | null;
  forhandsgranskning: string | null;
  testad: boolean;
  senastSkickat: string | null;
  mottagetAvAntal: number | null;
  segmentIds: string[];
}
