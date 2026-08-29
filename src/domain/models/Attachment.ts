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
 *
 * [OMBYGGD, TASK-338.3, ADR-125 § Beslut 1] Räckvidden är inte längre "exakt
 * EN av tre" utan `Event` ELLER `Gemensam` — och `Gemensam` är ett FILTER
 * över TRE valfria axlar: `kursfamilj`, `kursniva` och det nya `plats`.
 * Axlarna kombineras med OCH, en tom axel begränsar inte, och noll satta
 * axlar betyder alla event. Läsvägen normaliserar legacy-värdena
 * (`Kurstyp`/`Alla event`) till `Gemensam` INNAN domänformen når hit — se
 * `../schemas/Attachment.schema.ts` § `normaliseraRaAttachment`, så ingen
 * konsument av denna modell behöver känna till att de har existerat.
 *
 * MATCHNINGEN BOR INTE HÄR OCH INTE I NÅGON KONSUMENT (ADR-057, kortets
 * DoD #6): vilka event en gemensam bilaga faktiskt gäller avgörs SERVER-SIDE
 * av `supabase/functions/_shared/rackvidd-matchning.ts`. Fälten nedan är
 * uteslutande PRESENTATIONSUNDERLAG — det klienten renderar som badge och
 * sammanfattningsrad, aldrig något den filtrerar på.
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
  /** Räckvidd (TASK-275.2 → TASK-338.3, ADR-125 § 1) — se docblocken ovan.
   *  `Event` | `Gemensam` | `null` (okänt/saknat värde). */
  rackvidd: AttachmentScopeValue | null;
  /** Kursfamilj-AXELN vid räckvidd Gemensam; `null` = axeln begränsar inte. */
  kursfamilj: string | null;
  /** Kursnivå-AXELN vid räckvidd Gemensam; `null` = hela familjen (tom-nivå-regeln). */
  kursniva: string | null;
  /**
   * [TASK-338.3, ADR-125 § Beslut 1] PLATS-AXELN — `null` när bilagan inte är
   * platsbunden (det vanliga). Speglar `mapAttachmentRecord`
   * (`_shared/attachments.ts`) exakt: `id` är Platser-radens record-ID,
   * `namn` kommer ur `Platsnamn`-lookupen så klienten slipper ett eget
   * uppslag mot Platser.
   *
   * `namn` KAN vara tomt utan att `id` försvinner — lookupen kan halka efter
   * en nyss skapad länk, och ett `plats: null` hade då sett ut som "ingen
   * plats" i stället för "namnet är inte läst än". Badgen/sammanfattningen
   * faller tillbaka på ett neutralt uttryck i det läget i stället för att
   * rendera en tom pill (se `rackviddsText.ts`).
   */
  plats: { id: string; namn: string } | null;
  /**
   * [TASK-309.6, ADR-125 § 5] Bara satt för Dokumentklass 'Event-mallad' —
   * Airtables optionsnamn ('Bekräftelsebilaga'/'Deltagarinformation'), eller
   * `null` (uppladdade/person-genererade rader, legacy Event-mallade rader
   * från före TASK-309.4). Speglar `mapAttachmentRecord`
   * (`_shared/attachments.ts`) exakt.
   */
  mall: string | null;
  /**
   * [TASK-309.6, ADR-125 § 5] SHA-256 över kanoniskt serialiserat
   * ifyllnadsunderlag vid genereringstillfället, server-internt. `null` när
   * fältet saknas (samma legacy-fall som `mall` ovan).
   */
  kallhash: string | null;
  /**
   * [TASK-309.6, ADR-125 § 3] HÄRLETT klient-side vid listning (aldrig
   * lagrat) — `true` när dagens ifyllnadsunderlags hash skiljer sig från
   * `kallhash`, `false` när den matchar, `null` när inaktualitet inte kan
   * eller ska bedömas (icke-Event-mallad rad, okänt/saknat `mall`/
   * `kallhash`, eller ett event vars underlag inte gick att hämta). Se
   * `AirtableAdapter.berikaMedInaktuell` för härledningen.
   */
  inaktuell: boolean | null;
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
   *  giltigt endast för `rackvidd` Gemensam). */
  eventId: string | null;
  file: File;
  /** Räckvidd — default Event (oförändrat beteende) om utelämnad. */
  rackvidd?: AttachmentScopeValue;
  /** Kursfamilj-axeln — VALFRI sedan TASK-338.3 (var obligatorisk för den
   *  rivna Kurstyp-räckvidden). Utelämnad = axeln begränsar inte. */
  kursfamilj?: string;
  /** Kursnivå-axeln — valfri; tom/utelämnad = hela familjen (tom-nivå-regeln).
   *  EF:en avvisar en nivå UTAN familj ("en halv tanke", AttachmentScopeInputSchema). */
  kursniva?: string;
  /**
   * [TASK-338.3, ADR-125 § Beslut 1] PLATS-axeln — ett Platser-RECORD-ID
   * (`rec…`), aldrig ett platsnamn. Utelämnad = axeln begränsar inte.
   *
   * ID OCH INTE NAMN, av två skäl som båda är mätta någon annanstans i
   * huset: matchningen server-side jämför länkens record-ID
   * (`_shared/rackvidd-matchning.ts` § Plats), och en namnjämförelse hade
   * varit drift-känslig av exakt det skäl ADR-125 § 8 avvisar
   * Ort-matchning. EF:en existenskontrollerar dessutom ID:t mot
   * Platser-tabellen INNAN skrivning (`platsFinns`) — en felstavad
   * referens hade annars skrivits som en TOM länk av Airtable och gjort
   * bilagan synlig på ALLA event i stället för en plats.
   */
  plats?: string;
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
