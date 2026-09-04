import type { DataSourceAdapter } from '@/data/adapters/DataSourceAdapter';

/**
 * Vilken sorts dokument-KÄLLA en rad hör till, plus vad som krävs för att
 * hämta dess bytes (TASK-273.4, ersätter den rivna Visa-dialogen — se
 * `DokumentYta.tsx`s filhuvud § IKONPAR). Klass A (bilaga) har ett
 * `attachmentId` att slå upp en redan lagrad fil med; klass C (generator/
 * kvitto) genererar en transient PDF ur bara `eventId` — samma
 * tvådelning som återstår av `DokumentYta.tsx`s FYND/KLASS B/C-noter (se
 * nedan för vart klass B tog vägen).
 *
 * [RIVET, TASK-309.8, ADR-125 § 6] `{ typ: 'mall'; eventId }` (klass B)
 * fanns här tidigare — `DokumentYta.tsx`s katalograd för mallar
 * (`MallRad`) anropade den för en transient förhandsvisning via
 * `previewEventTemplate`, HÅRDKODAD till `'deltagarinfo'` (katalogens
 * enda mall då). Genereringsvyn (`GenereringsVy.tsx`, TASK-309) äger nu
 * BÅDE förhandsvisning ("Förhandsgranska") och skapande ("Skapa")
 * för de två riktiga mallarna, och `MallRad`s knapp är en entré DIT i
 * stället för en andra, felkopplad preview-väg — se `DokumentYta.tsx`s
 * `MallRad`-docblock. Klass B som DOKUMENTKLASS (`AttachmentClass.
 * EVENT_MALLAD` på en redan genererad, persisterad Bilagor-rad) finns
 * kvar och laddas ner precis som andra bilagor, via `typ: 'bilaga'` nedan
 * — det är bara den fristående, icke-persisterande katalog-förhandsvisningen
 * som är riven.
 *
 * Delad mellan `useForhandsvisaDokument` och `useLaddaNerDokument` (båda
 * `src/data/mutations/`) och komponenten — enda källan till "hur hämtar vi
 * bytes för den här klassen", så de två mutationerna inte duplicerar
 * adapter-anropen var för sig.
 *
 * [UTBYGGD, TASK-275.3, ADR-118 beslut 5] Klass bilagas `eventId` är NU
 * `string | null` — `null` för en GEMENSAM bilaga öppnad i räckviddsläget
 * (inget event valt). Generatorn (klass C) kräver FORTFARANDE ett riktigt
 * `eventId` (den genererar ur eventets data — det finns inget "generator
 * utan event"-läge, och räckviddsläget visar den aldrig, se
 * `DokumentYta.tsx`).
 */
export type DokumentKalla =
  | { typ: 'bilaga'; eventId: string | null; attachmentId: string }
  | { typ: 'generator'; eventId: string };

/**
 * Hämtar URL:en som SKA visas för en `kalla` — signerad Storage-URL för
 * BÅDA dokumentkällorna (`ADR-124`, `TASK-302.2`): klass A via
 * `DataSourceAdapter.getAttachmentDownloadUrl` (300s TTL, se
 * `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS), klass C
 * (generator/kvitto) via `previewReceipt` — som SKRIVER ett TRANSIENT
 * Storage-utkast och returnerar dess signerade URL i stället för PDF-bytes
 * (svarsformen bytte `{ pdfBase64 }` → `{ url, utgar }`,
 * SIDOEFFEKTSFRIHETEN på Bilagor-tabellen/kvittonumret/mail är OFÖRÄNDRAD).
 * [RIVET, TASK-309.8] Klass B:s gren (`previewEventTemplate` via
 * `typ: 'mall'`) rörde denna funktion tidigare — se `DokumentKalla`s
 * filhuvud för var den vägen tog vägen.
 *
 * [RÄTTAT, ADR-124] Den tidigare `blobUrlFranBase64`-hjälparen (riven i
 * denna commit) motiverade `blob:`-vägen med att "Chromes PDF-visare kan
 * göra byte-range-anrop mot en flersidig PDF vid scroll" — FALSIFIERAT: en
 * `blob:`-URL kan strukturellt inte svara på byte-range-anrop alls (ingen
 * HTTP-server bakom den), så det var aldrig därför förhandsgranskningen
 * laggade. MÄTNINGEN (sex klientleveransarmar, headed Chrome 151, `ADR-124`
 * § Kontext) visar i stället att bara en URL SERVERAD AV NÄTVERKSTJÄNSTEN
 * scrollar jämnt — `blob:`, en Service Worker-fångst och båda med
 * `noopener` laggar alla. Klienten bygger därför aldrig mer en `blob:` för
 * ett dokument.
 */
export async function hamtaDokumentUrl(
  dataSource: DataSourceAdapter,
  kalla: DokumentKalla,
): Promise<string> {
  if (kalla.typ === 'bilaga') {
    const { url } = await dataSource.getAttachmentDownloadUrl(kalla.eventId, kalla.attachmentId);
    return url;
  }
  const { url } = await dataSource.previewReceipt(kalla.eventId);
  return url;
}

/**
 * Nedladdningsbart filnamn för en `kalla` — bilagans eget namn (redan bär
 * en ändelse) för klass A, `${namn}.pdf` för klass C (generatorer har bara
 * ett visningsnamn, ingen lagrad filändelse).
 */
export function dokumentNedladdningsFilnamn(namn: string, kalla: DokumentKalla): string {
  return kalla.typ === 'bilaga' ? namn : `${namn}.pdf`;
}

/**
 * Nedladdningsbar variant av `hamtaDokumentUrl` — en `download`-query-
 * parameter klistras KLIENT-SIDIGT på den redan signerade URL:en, för BÅDA
 * dokumentkällorna. `@supabase/storage-js`s egen `createSignedUrl` bygger
 * exakt denna parameter EFTER att URL:en redan signerats
 * (`node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts` rad
 * 723–728), så att lägga till den i efterhand kräver INGEN ändring av någon
 * EF. VERIFIERAT LIVE mot staging (TASK-273.4, fixturhändelsen
 * `recIFrxHZw165ycXk`, klass A): Storage-servern svarar då med en riktig
 * `Content-Disposition: attachment`-header (utan parametern: ingen
 * disposition-header alls) — SAMMA mekanism gäller klass C:s utkasts-URL,
 * eftersom den kommer ur samma `createSignedUrl`-anrop (`_shared/
 * utkast.ts` § `laggUtkast`).
 *
 * [RÄTTAT, ADR-124, TASK-302.2] Klass C returnerade tidigare en `blob:`-URL
 * OFÖRÄNDRAD här (ingen dekoration behövdes — en `blob:`-URL är
 * same-origin, webbläsaren honorerar `download`-attributet nativt oavsett
 * serverhuvuden). Nu är klass C:s URL en CROSS-ORIGIN Supabase Storage-URL
 * precis som klass A:s — utan `?download=`-dekorationen hade webbläsaren
 * IGNORERAT `download`-attributet på `useLaddaNerDokument`s `<a>`-länk och
 * öppnat filen i stället för att spara den under det angivna filnamnet
 * (cross-origin-regeln gäller båda källorna lika, inte bara klass A — utan
 * denna fix hade `TASK-302.2` tyst brutit "Ladda ner"-knappen för
 * generatorn, se slutrapporten).
 */
export async function hamtaDokumentNedladdningsUrl(
  dataSource: DataSourceAdapter,
  kalla: DokumentKalla,
  filnamn: string,
): Promise<string> {
  const url =
    kalla.typ === 'bilaga'
      ? (await dataSource.getAttachmentDownloadUrl(kalla.eventId, kalla.attachmentId)).url
      : await hamtaDokumentUrl(dataSource, kalla);
  const dekorerad = new URL(url);
  dekorerad.searchParams.set('download', filnamn);
  return dekorerad.toString();
}
