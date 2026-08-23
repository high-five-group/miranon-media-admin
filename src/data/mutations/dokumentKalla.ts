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
 * Hämtar URL:en som SKA visas för en `kalla` — signerad Storage-URL för
 * ALLA TRE dokumentklasserna (`ADR-124`, `TASK-302.2`): klass A via
 * `DataSourceAdapter.getAttachmentDownloadUrl` (300s TTL, se
 * `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS), klass B/C
 * via `previewEventTemplate`/`previewReceipt` — som nu SKRIVER ett
 * TRANSIENT Storage-utkast och returnerar dess signerade URL i stället för
 * PDF-bytes (svarsformen bytte `{ pdfBase64 }` → `{ url, utgar }`,
 * SIDOEFFEKTSFRIHETEN på Bilagor-tabellen/kvittonumret/mail är OFÖRÄNDRAD).
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
  // [TASK-309.6] `previewEventTemplate` kräver nu `mall` (EF-kravet sedan
  // TASK-309.4) — se dess docblock (`DataSourceAdapter.ts`). Katalog-radens
  // enda mall är "Deltagarinformation" (`MALLAR` i `DokumentYta.tsx`), så
  // `'deltagarinfo'` här är oförändrat BETEENDE, bara ett tidigare
  // odeklarerat/brutet anrop rättat.
  const { url } =
    kalla.typ === 'mall'
      ? await dataSource.previewEventTemplate(kalla.eventId, 'deltagarinfo')
      : await dataSource.previewReceipt(kalla.eventId);
  return url;
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
 * Nedladdningsbar variant av `hamtaDokumentUrl` — en `download`-query-
 * parameter klistras KLIENT-SIDIGT på den redan signerade URL:en, för ALLA
 * TRE dokumentklasserna. `@supabase/storage-js`s egen `createSignedUrl`
 * bygger exakt denna parameter EFTER att URL:en redan signerats
 * (`node_modules/@supabase/storage-js/src/packages/StorageFileApi.ts` rad
 * 723–728), så att lägga till den i efterhand kräver INGEN ändring av någon
 * EF. VERIFIERAT LIVE mot staging (TASK-273.4, fixturhändelsen
 * `recIFrxHZw165ycXk`, klass A): Storage-servern svarar då med en riktig
 * `Content-Disposition: attachment`-header (utan parametern: ingen
 * disposition-header alls) — SAMMA mekanism gäller klass B/C:s utkasts-URL,
 * eftersom den kommer ur samma `createSignedUrl`-anrop (`_shared/
 * utkast.ts` § `laggUtkast`).
 *
 * [RÄTTAT, ADR-124, TASK-302.2] Klass B/C returnerade tidigare en `blob:`-
 * URL OFÖRÄNDRAD här (ingen dekoration behövdes — en `blob:`-URL är
 * same-origin, webbläsaren honorerar `download`-attributet nativt oavsett
 * serverhuvuden). Nu är klass B/C:s URL en CROSS-ORIGIN Supabase
 * Storage-URL precis som klass A:s — utan `?download=`-dekorationen hade
 * webbläsaren IGNORERAT `download`-attributet på `useLaddaNerDokument`s
 * `<a>`-länk och öppnat filen i stället för att spara den under det
 * angivna filnamnet (cross-origin-regeln gäller alla tre klasser lika, inte
 * bara klass A — utan denna fix hade `TASK-302.2` tyst brutit
 * "Ladda ner"-knappen för mallar/generatorer, se slutrapporten).
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
