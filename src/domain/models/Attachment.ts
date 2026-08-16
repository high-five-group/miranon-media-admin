import type { AttachmentClassValue } from '../types/Status';

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
 * [RÄTTAD, TASK-147.5] Bär klass A (uppladdad, TASK-146.4) OCH klass B
 * (event-mallad, TASK-146.5) — denna raden sade tidigare "v1 bär bara klass
 * A" och att TASK-146.5 skulle lägga till ett dokumentklass-fält "när det
 * faktiska behovet uppstår". Det behovet uppstod aldrig: Bilagor-tabellen
 * bär FORTFARANDE inget dokumentklass-fält (klass A och B är strukturellt
 * odelbara i metadatat, generate-event-attachment/index.ts § SAMTIDIGHETS-
 * NOT) — vad som FAKTISKT lades till additivt var `Lagringsnyckel`
 * (TASK-147.5, server-internt, EXPONERAS ALDRIG här — se
 * scripts/create-bilagor-table.mjs § Lagringsnyckel för varför).
 *
 * [RÄTTAD, TASK-147.12] Ovanstående stycke är HISTORIA, inte längre sant:
 * "det behovet uppstod aldrig" höll i nio dagar. Marcus-GO 2026-08-16
 * (ADR-063 — defekten löses I BASEN): Bilagor-tabellen bär nu
 * `Dokumentklass` (singleSelect, additivt, staging `fldr2CwboZ3M4USCX`) och
 * `dokumentklass` nedan speglar det i domänformen. `null` betyder "okänd
 * klass" — antingen en rad skapad FÖRE fältet fanns och inte härledbar vid
 * backfillen, eller en framtida klass C-skrivväg som ännu inte satts
 * (kvitto-generering, TASK-147.7, skriver inte till DENNA tabell/detta
 * fält).
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
  /**
   * Dokumentklass (TASK-147.12, ORDLISTA.md A/B/C). `null` = okänd — en
   * icke-härledbar förfälts-rad eller en klass som ännu saknar skrivväg
   * (person-genererad/klass C). Satt av upload-attachment/finalize-
   * attachment-upload (→ `Uppladdad`) resp. generate-event-attachment
   * (→ `Event-mallad`) vid radskapelse — klienten läser, skriver aldrig.
   */
  dokumentklass: AttachmentClassValue | null;
}

/**
 * Input till `DataSourceAdapter.uploadAttachment` (TASK-146.4, AC #1).
 *
 * Adaptern väljer SJÄLV mönster 1 (bytes genom edge-funktionen) eller mönster 2
 * (signerat, tidsbegränsat uppladdningstillstånd — klienten laddar upp direkt
 * mot lagringen) beroende på `file.size` mot `SMALL_UPLOAD_MAX_BYTES`
 * (`src/data/adapters/attachmentUpload.ts`). Anroparen anropar EN metod och
 * behöver aldrig veta vilket mönster som användes — det håller adapter-API:t
 * smalt (uppdragets egen instruktion: "håll adapter-API:t smalt och
 * välnamnat"). [RÄTTAD, TASK-147.5] Anroparen är INTE åtgärdssidans
 * bilageväljare (den VÄLJER bland befintliga bilagor via
 * `fetchEventAttachments`, laddar aldrig upp) — det är Dokument-ytan
 * (TASK-147.6, ännu en kastbar S100-prototyp, `src/components/dokument/
 * DokumentYta.tsx`) eller motsvarande framtida uppladdnings-yta.
 */
export interface UploadAttachmentInput {
  /** Airtable-record-ID (rec-format) för eventet bilagan hör till. */
  eventId: string;
  file: File;
}
