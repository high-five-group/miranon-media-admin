/** Payload för att skicka ett mailutskick */
export interface MailPayload {
  amne: string;
  mailtext: string;
  segmentIds: string[];
  antalMottagare?: number;
}

/** En rad i utskicksloggen */
export interface MailLogEntry {
  id: string;
  utskicksNamn: string | null;
  bulkutskickId: string | null;
  antalSkickade: number;
  datum: string | null;
  oppningsgrad: number | null;
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
