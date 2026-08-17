import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';

/**
 * Vilken av Dokument-ytans tre dokumentklasser en rad hör till, plus vad
 * som krävs för att hämta dess bytes (TASK-273.4, ersätter den rivna
 * Visa-dialogen — se `DokumentYta.tsx`s filhuvud § IKONPAR). Klass A
 * (bilaga) har ett `attachmentId` att slå upp en redan lagrad fil med;
 * klass B/C (mall/generator) genererar en transient PDF ur bara
 * `eventId` — samma tredelning som `DokumentYta.tsx`s FYND/KLASS B/C-noter.
 *
 * Delad mellan `useForhandsvisaDokument` och `useLaddaNerDokument` (båda
 * `src/data/mutations/`) och komponenten — enda källan till "hur hämtar vi
 * bytes för den här klassen", så de två mutationerna inte duplicerar
 * adapter-anropen var för sig.
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] Klass bilagas `eventId` är NU
 * `string | null` — `null` för en GEMENSAM bilaga öppnad i räckviddsläget
 * (inget event valt). Mallar/generatorer (klass B/C) kräver FORTFARANDE ett
 * riktigt `eventId` (de genererar ur eventets data — det finns inget
 * "mallar utan event"-läge, och räckviddsläget visar dem aldrig, se
 * `DokumentYta.tsx`).
 */
export type DokumentKalla =
  | { typ: 'bilaga'; eventId: string | null; attachmentId: string }
  | { typ: 'mall'; eventId: string }
  | { typ: 'generator'; eventId: string };

/**
 * Blob-URL ur en base64-kodad PDF (klass B/C). Blob-URL:en revokeras
 * MEDVETET ALDRIG här: Chromes PDF-visare kan göra byte-range-anrop mot en
 * flersidig PDF vid scroll i en öppnad förhandsvisningsflik, och en tidigt
 * revokerad URL hade brutit den — kostnaden är några MB kvarhållen minne
 * per öppnad förhandsvisning under sidans livstid, en medveten avvägning.
 */
function blobUrlFranBase64(pdfBase64: string): string {
  const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

/**
 * Hämtar URL:en som SKA visas för en `kalla` — signerad Storage-URL för
 * klass A (`DataSourceAdapter.getAttachmentDownloadUrl`, 300s TTL, se
 * `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS), eller en
 * färsk `blob:`-URL byggd ur en transient PDF-generering för klass B/C
 * (`previewEventTemplate`/`previewReceipt`, SIDOEFFEKTSFRI per konstruktion
 * — når aldrig Storage-uppladdningen, Bilagor-radskapelsen eller ett
 * allokerat kvittonummer).
 */
export async function hamtaDokumentUrl(
  dataSource: DataSourceAdapter,
  kalla: DokumentKalla,
): Promise<string> {
  if (kalla.typ === 'bilaga') {
    const { url } = await dataSource.getAttachmentDownloadUrl(kalla.eventId, kalla.attachmentId);
    return url;
  }
  const { pdfBase64 } =
    kalla.typ === 'mall'
      ? await dataSource.previewEventTemplate(kalla.eventId)
      : await dataSource.previewReceipt(kalla.eventId);
  return blobUrlFranBase64(pdfBase64);
}

/**
 * Nedladdningsbart filnamn för en `kalla` — bilagans eget namn (redan bär
 * en ändelse) för klass A, `${namn}.pdf` för klass B/C (mallar/generatorer
 * har bara ett visningsnamn, ingen lagrad filändelse).
 */
export function dokumentNedladdningsFilnamn(namn: string, kalla: DokumentKalla): string {
  return kalla.typ === 'bilaga' ? namn : `${namn}.pdf`;
}

/**
 * Nedladdningsbar variant av `hamtaDokumentUrl` — klass A får en
 * `download`-query-parameter påklistrad KLIENT-SIDIGT på den redan
 * signerade URL:en. `@supabase/storage-js`s egen `createSignedUrl` bygger
 * exakt denna parameter EFTER att URL:en redan signerats
 * (`node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts` rad
 * 723–728), så att lägga till den i efterhand kräver INGEN ändring av
 * `get-attachment-download-url`-EF:en. VERIFIERAT LIVE mot staging
 * (TASK-273.4, fixturhändelsen `recIFrxHZw165ycXk`): Storage-servern svarar
 * då med en riktig `Content-Disposition: attachment`-header (utan
 * parametern: ingen disposition-header alls). Klass B/C: samma blob-URL som
 * förhandsvisningen — `download`-attributet honoreras nativt eftersom
 * blob-URL:er redan är same-origin.
 */
export async function hamtaDokumentNedladdningsUrl(
  dataSource: DataSourceAdapter,
  kalla: DokumentKalla,
  filnamn: string,
): Promise<string> {
  if (kalla.typ !== 'bilaga') return hamtaDokumentUrl(dataSource, kalla);
  const { url } = await dataSource.getAttachmentDownloadUrl(kalla.eventId, kalla.attachmentId);
  const dekorerad = new URL(url);
  dekorerad.searchParams.set('download', filnamn);
  return dekorerad.toString();
}
