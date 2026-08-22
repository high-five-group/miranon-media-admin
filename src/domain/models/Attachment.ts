import type { AttachmentClassValue, AttachmentScopeValue } from '../types/Status';

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
 *
 * [UTBYGGD, TASK-275.2, ADR-118] `rackvidd`/`kursfamilj`/`kursniva` —
 * räckviddsmodellen (ADR-118 beslut 1). `fetchEventAttachments` returnerar
 * numera UNIONEN av eventets egna + kurstyps-matchande + alla-event-bilagor
 * (server-side, `get-event-attachments`); dessa tre fält är badge-underlaget
 * som skiljer dem åt i UI:t (task-275.3, inte byggt av denna skiva).
 * `rackvidd: null` = okänt/saknat Räckvidd-värde (samma defensiva
 * "gissa aldrig"-disciplin som `dokumentklass`, ALDRIG antaget 'Event').
 * `kursfamilj`/`kursniva` är `null` utanför Kurstyp-räckvidden ELLER för en
 * nivålös familj (tom-nivå-regeln) — LENIENT `string | null` på läsvägen
 * (INTE ett strikt enum), samma P22-motiverade val som `Event.schema.ts`s
 * `kursfamilj`/`kursniva` redan gör för samma underliggande värdedomän.
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
  /** Räckvidd (TASK-275.2, ADR-118) — se docblocken ovan. */
  rackvidd: AttachmentScopeValue | null;
  /** Kursfamilj vid räckvidd Kurstyp; `null` annars (se docblocken ovan). */
  kursfamilj: string | null;
  /** Kursnivå vid räckvidd Kurstyp; `null` för nivålösa familjer ELLER utanför Kurstyp. */
  kursniva: string | null;
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
 *
 * [UTBYGGD, TASK-275.2, ADR-118] `rackvidd`/`kursfamilj`/`kursniva` — VALFRIA,
 * default Event (dagens beteende, oförändrat om utelämnade). `kursfamilj`
 * krävs av EF:en när `rackvidd` är Kurstyp (server-validerat,
 * `AttachmentScopeInputSchema`) — typas löst (`string`) här snarare än
 * `AttachmentScopeValue`-liknande enum eftersom write-sidans strikta
 * enum-validering redan sitter server-side.
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] `eventId` är NU `string | null` —
 * `null` är GILTIGT ENDAST för `rackvidd` Kurstyp/Alla event (räckviddslägets
 * genuint event-lösa uppladdning; server-validerat, se upload-attachment/
 * index.ts § filhuvudet). Räckvidd Event KRÄVER fortfarande ett verkligt
 * `eventId` (adaptern skickar det oförändrat vidare — den server-sidiga
 * 400:an vid en kontradiktorisk kombination är golvet, inte klienten).
 * MEDVETEN AVGRÄNSNING: event-löst stöd gäller BARA mönster 1 (filer
 * ≤ `SMALL_UPLOAD_MAX_BYTES`) — adaptern (`AirtableAdapter.uploadAttachment`)
 * avvisar ett event-löst FÖRSÖK över gränsen med ett klientfel innan
 * mönster 2 (som fortfarande kräver `eventId`) ens anropas.
 */
export interface UploadAttachmentInput {
  /** Airtable-record-ID (rec-format) för eventet bilagan hör till, eller
   *  `null` för en genuint event-lös gemensam uppladdning (räckviddsläget,
   *  giltigt endast för `rackvidd` Kurstyp/Alla event). */
  eventId: string | null;
  file: File;
  /** Räckvidd — default Event (oförändrat beteende) om utelämnad. */
  rackvidd?: AttachmentScopeValue;
  /** Kursfamilj — krävs av EF:en när `rackvidd` är Kurstyp. */
  kursfamilj?: string;
  /** Kursnivå — valfri; tom/utelämnad = hela familjen (tom-nivå-regeln). */
  kursniva?: string;
}

/**
 * Svaret från `DataSourceAdapter.getAttachmentDownloadUrl` (TASK-245). En
 * TIDSBEGRÄNSAD signerad URL för EN bilaga i den privata `bilagor`-bucketen
 * — se `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS för
 * TTL-motiveringen. `expiresInSeconds` speglar servern (300 i dag) i stället
 * för att hårdkodas i UI:t — samma "servern äger sanningen"-disciplin som
 * `AttachmentUploadTicketSchema.expiresInSec`.
 */
export interface AttachmentDownloadUrl {
  url: string;
  expiresInSeconds: number;
}

/**
 * Svaret från `DataSourceAdapter.previewEventTemplate`/`previewReceipt`
 * (TASK-246, klass B/C:s riktigt genererade men SIDOEFFEKTSFRIA förhands-
 * visning — Marcus-ordern 2026-08-16: "en riktigt genererad PDF på alla
 * mallar ... och även generatorn"). BÅDA metoderna returnerar SAMMA shape.
 *
 * [ÄNDRAD, ADR-124, TASK-302.2] Formen var `{ pdfBase64: string }` fram
 * till 2026-08-22 — en base64-kodad PDF-byteström, ingenting mer. Den
 * premissen (bytes till klienten räcker för att visa dokumentet) föll mot
 * en mätning (sex klientleveransarmar, headed Chrome 151, `ADR-124` §
 * Kontext): bara en URL SERVERAD AV NÄTVERKSTJÄNSTEN scrollar jämnt i
 * Chromes PDF-visare. Formen är nu `{ url, utgar }` — en kort SIGNERAD
 * Storage-URL till ett TRANSIENT utkast (`laggUtkast`, `_shared/
 * utkast.ts`) i stället för bytes. Fortfarande ingen `attachment`/`record`/
 * `storagePath` — de fälten hade antytt en persistens som ALDRIG sker här
 * (AC #3, nu amenderad — se EF-filhuvudenas verbatim-citat av `ADR-124` §
 * Beslut 3). `utgar` är URL:ens ISO-utgångstid. Parallell sanningskälla:
 * `../schemas/Attachment.schema.ts` § `DocumentPreviewSchema`.
 */
export interface DocumentPreview {
  url: string;
  utgar: string;
}
