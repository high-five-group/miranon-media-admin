/**
 * En bilaga i bilage-fundamentet (TASK-146.4, PRD task-146 "Bilage-fundamentet").
 *
 * Metadatat bor i Airtable (Bilagor-tabellen, TASK-146.2, additivt skapad av
 * scripts/create-bilagor-table.mjs); bytesen bor i privat Supabase Storage
 * (TASK-146.3, bucket "bilagor") — ALDRIG i Airtables egna attachment-fält
 * (väggkatalogens P28 tvåtimmars-URL:er + P29 5 MB-uppladdningstak,
 * docs/reference/airtable-constraints.md § G). Bytesen är en TREDJE, delad
 * resurs bakom SAMMA adapter-kontrakt — inte "Airtable-data" (ADR-057).
 *
 * v1 bär bara klass A (uppladdad av Roger/Lotta). Bilagor-tabellen har idag
 * inget dokumentklass-fält — TASK-146.5 (klass B, event-mallad) lägger till
 * det ADDITIVT när den faktiska behovet uppstår, inte i förväg.
 */
export interface Attachment {
  id: string;
  /** Bilagans namn/filnamn, t.ex. "Deltagarinformation.pdf". */
  namn: string;
  storlekBytes: number;
  /**
   * ISO-tidsstämpel — satt av den SKRIVANDE adaptern/EF:en, INTE Airtables
   * `createdTime` (se scripts/create-bilagor-table.mjs § "Skapad": Airtables
   * Metadata-API kan inte skapa `createdTime`-fälttypen programmatiskt, och
   * ett manuellt satt fält är dessutom arkitektoniskt bättre för lager-
   * oberoendet — samma kontrakt oavsett vilken adapter som skriver).
   */
  skapad: string;
  /** Länkat event-record-ID (första länken); null om länk saknas (defensivt läs). */
  eventId: string | null;
}

/**
 * Input till `DataSourceAdapter.uploadAttachment` (TASK-146.4, AC #1).
 *
 * Adaptern väljer SJÄLV mönster 1 (bytes genom edge-funktionen) eller mönster 2
 * (signerat, tidsbegränsat uppladdningstillstånd — klienten laddar upp direkt
 * mot lagringen) beroende på `file.size` mot `SMALL_UPLOAD_MAX_BYTES`
 * (`src/data/adapters/attachmentUpload.ts`). Anroparen (den kommande bilage-
 * väljaren, task-147.5) anropar EN metod och behöver aldrig veta vilket
 * mönster som användes — det håller adapter-API:t smalt (uppdragets egen
 * instruktion: "håll adapter-API:t smalt och välnamnat").
 */
export interface UploadAttachmentInput {
  /** Airtable-record-ID (rec-format) för eventet bilagan hör till. */
  eventId: string;
  file: File;
}
