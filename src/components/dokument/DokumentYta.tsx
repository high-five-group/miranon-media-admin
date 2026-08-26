/**
 * Dokument-ytan — Mer-ytan där bilagor förvaltas (`T131`). PROMOVERAD ur
 * S100/TASK-147.6:s konvergenspass (ADR-102 B1/B2, ADR-103 B2 steg 1) —
 * denna fil ÄR den skarpa ytan, ingen separat prototypfil att riva.
 * Facit-manifestet
 * `tasks/sessions/bilagor/s102-dokument-konvergens/facit.json` är den
 * auktoritativa formbeskrivningen (ADR-102 B1) och bär Marcus godkännande
 * (TASK-164-rivningen, ADR-103 B2 steg 4). Fullständig bygghistorik
 * (skärpningsvarv 1–3, TASK-245/246) finns i
 * `git log -p -- src/components/dokument/DokumentYta.tsx`, inte upprepad
 * här.
 *
 * FRÅGAN YTAN BESVARAR: vilken form Dokument-ytan ska ha — den yta som
 * förvaltar det bilageväljaren på åtgärds-sidan visar (underlaget § 9,
 * Marcus-beslut 2026-08-07).
 *
 * FYND 1 — KLASS ÄR EN RIKTIG KOLUMN (TASK-147.12). Bilagor-tabellen bär
 * `Dokumentklass` (Uppladdad/Event-mallad, additivt fält, staging); och
 * `Attachment.dokumentklass` visar den VERKLIGA klassen per rad — ingen
 * filnamns-heuristik. "Okänd" är en ärlig etikett (Gunilla-principen), inte
 * en gissning: den betyder att backfillen (se
 * `scripts/backfill-bilagor-dokumentklass.mjs`) inte kunde härleda den raden.
 *
 * FYND 2 — EVENT-SCOPAT, INTE ETT GLOBALT BIBLIOTEK. `uploadAttachment`
 * kräver `eventId`; `fetchEventAttachments` läser EN händelses omvända länk
 * — adaptern har ingen "alla bilagor oavsett event"-metod. Ytan bär därför
 * en eventväljare (samma `EventValjare`-komponent som Åtgärds-sidan och
 * manuell anmälan).
 *
 * FYND 3 — "ANVÄNDS I N EVENT" ÄR INTE BYGGBART. Domänmodellen
 * (`Attachment.eventId`, `mapAttachmentRecord` i `_shared/attachments.ts`)
 * läser bara FÖRSTA länkade eventet, även om Airtable-fältet tekniskt är
 * `multipleRecordLinks` — och ingen adapter-metod lägger någonsin till fler
 * länkar på en befintlig rad. En "används i N event"-räknare är därför
 * strukturellt obyggbar, inte bara utelämnad.
 *
 * "ERSÄTT" (AC #1, TASK-147.11): `useReplaceAttachment` laddar upp den nya
 * filen FÖRST och raderar sedan den gamla posten FAKTISKT (både Storage-
 * bytesen och Bilagor-raden, via `delete-attachment`-EF:en) — en ny
 * uppladdning kan därför inte skapa en dubblett via "Ersätt".
 * `grupperaPerNamn` (nedan) är en ren visningshjälp för KVARVARANDE
 * dubbletter (t.ex. flera identiska klass B-genereringar via
 * `generate-event-attachment`) — den påstår inget om att en dubblett är en
 * "ersättning".
 *
 * KLASS B/C (mallar/generatorer): `MALLAR`/`GENERATORER` nedan är
 * kod-nivå-KATALOGER (vilken mall/generator som FINNS), inte instans-
 * listor. Att lista VERKLIGA genererade instanser (tidigare genererade
 * kvitton/brev) hade krävt samma klass-gissning Fynd 1 avvisar och är
 * utanför scope. Uppladdning + ersättning gäller uttryckligen bara klass
 * A — mallar/generatorer får ingen sådan handling.
 *
 * SIDKROM (PROMOVERAD, TASK-299.11): husets delade `SidRam`-primitiv
 * (`src/components/primitives/SidRam.tsx`, kant-i-kant-dialekten, endast
 * sidkromet — rubriken lever kvar i `<header>` som egen `<h1>`) ersätter
 * den äldre inset-formen `AktivitetsHistorik.tsx` en gång byggde inline.
 * Dev-växeln `?sidram=ny` (TASK-299.1) är riven (ADR-103 B2 steg 4); hela
 * innehållskolumnen under rubriken (EventValjare, listan, uppladdnings-
 * knappen, uppladdningsfelet) delar samma `px-4`-marginal som rubriken,
 * matchande chevronens `mx-4` (TASK-299.2-mätningens fynd om 16 px
 * missalignment, löst i samma landning).
 *
 * RÄTTELSE (TASK-299.1, ADR-124): raden hävdade tidigare att
 * `AtgardsSida.tsx`s `Sidhuvud` (`px-4`/`mx-4`, kant-i-kant) var ett
 * "dubbleringsfel" delat med `MailLog.tsx`/`Intresserade.tsx`. Det var fel:
 * huset bär TVÅ layout-dialekter, båda facit-stämplade (sessionsdok S111
 * Del 2 § B), och Marcus har avgjort KANT-I-KANT (`Sidhuvud`s geometri) som
 * husets form — nu den ENDA formen på denna yta (TASK-299.11).
 *
 * FORMEN ÄR LÅST TILL EN LISTA (Marcus-GO 2026-08-16): `?form=grupper`/
 * `?form=lista`-växeln och `DokumentGrupper`-funktionen (tre klass-grupper)
 * är rivna (git bevarar historiken) — bara den flata, filtrerbara listan
 * kvarstår, aldrig bakom en växel.
 *
 * [ERSATT, TASK-273.4] VISA-BETEENDET nedan (dialog-baserad Visa-knapp) är
 * RIVET — se IKONPAR-noten som ersätter det. Historiken behålls här för
 * `git log -p` (Visa-dialogen bar en `<iframe>`/`<img>`-inbäddad
 * förhandsvisning, TASK-245/246): `BilagaVisaKnapp` (TASK-245) hämtade en
 * tidsbegränsad signerad nedladdnings-URL
 * (`DataSourceAdapter.getAttachmentDownloadUrl`, 300s TTL — se
 * `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS) och visade
 * förhandsvisning INUTI dialogen; `GenereradPdfVisaKnapp` (TASK-246)
 * genererade en TRANSIENT PDF per klick för klass B/C på samma sätt.
 *
 * IKONPAR (TASK-273.4, Marcus-beslut 2026-08-17 — se amenderings-sidofilen
 * `tasks/sessions/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-17-
 * visa-till-ikonpar.md`): Visa-dialogen ersatt av TVÅ ikonknappar per rad,
 * `DokumentAtgardsKnappar` nedan, för alla tre dokumentklasser. Förhandsvisa
 * öppnar dokumentet i en RIKTIG ny webbläsarflik (webbläsarens egen
 * PDF-/bildvisare, ingen egen iframe/img-rendering längre) via ett
 * POPUP-BLOCKERAR-SÄKERT mönster: `window.open('', '_blank')` anropas
 * SYNKRONT i klick-handlern (innan någon `await`, se `PrototypeSwitcher.tsx`
 * rad 381 för samma synkrona-öppning-princip), adressen sätts EFTERÅT när
 * den asynkrona hämtningen är klar — bevisat i ett skarpt Chrome-
 * beteendetest (AC #1, throwaway, kastat efter passet) att detta inte
 * blockeras. `noopener` är MEDVETET UTESLUTET: verifierat (samma throwaway-
 * pass) att `window.open('', '_blank', 'noopener')` returnerar `null` i
 * riktig Chrome — noopener och "navigera handtaget senare" är ömsesidigt
 * uteslutande. Destinationen är alltid egen, betrodd data (signerad
 * Storage-URL i vår egen bucket, eller en `blob:`-URL byggd av vår egen JS),
 * aldrig en tredjeparts-länk, vilket gör reverse-tabnabbing-risken av det
 * uteblivna `noopener` försumbar här.
 *
 * [TILLÄGG, TASK-309.26 review-runda 1, AC #4] Fönstret bär numera en
 * momentan laddningssida (`skrivLaddningssida`, `@/lib/skriv-laddningssida`,
 * "Öppnar dokument…") direkt efter `window.open`, INNAN
 * `forhandsvisaMutation.mutate(...)` — samma delade mönster som
 * `GenereringsVy.tsx`s `skapaDokument` numera använder. Fönstret stod annars
 * tomt (`about:blank`) under hela hämtningen, samma "abrupt tomt fönster"
 * Marcus avvisade 22 aug 2026 för genereringsvyn — konsekvenskravet (AC #4)
 * mot just DENNA yta var det som synliggjorde att defekten fanns här också.
 * Se `useForhandsvisaDokument.ts`s docblock och `@/lib/skriv-laddningssida`
 * för hela resonemanget, MDN-källorna och viewport-/typsnittsvalen.
 *
 * Nedladdning triggar INGEN flik: en dold `<a download>`-länk klickas
 * programmatiskt. Klass A: den signerade URL:en får en `download`-query-
 * parameter påklistrad KLIENT-SIDIGT — `@supabase/storage-js`s egen
 * `createSignedUrl` bygger exakt denna parameter EFTER att URL:en redan
 * signerats (`node_modules/@supabase/storage-js/src/packages/
 * StorageFileApi.ts` rad 723–728), så att lägga till den i efterhand kräver
 * INGEN ändring av `get-attachment-download-url`-EF:en. VERIFIERAT LIVE mot
 * staging (TASK-273.4, samma fixturhändelse `recIFrxHZw165ycXk`): Storage-
 * servern svarar då med en riktig `Content-Disposition: attachment`-header
 * (utan parametern: ingen disposition-header alls). Klass C: samma URL som
 * förhandsvisningen (byggd färskt per klick, se `dokumentKalla.ts`s
 * filhuvud för leveransvägens historik) — `download`-attributet honoreras
 * nativt eftersom URL:en redan är signerad av samma anrop.
 *
 * [ÄNDRAD, TASK-309.8] Klass B (mall) hade tidigare EGEN förhandsvisning/
 * nedladdning här (`previewEventTemplate` via `MallRad`) — riven, se
 * `MallRad`s docblock och `dokumentKalla.ts`s filhuvud. Klass B som
 * DOKUMENTKLASS på en redan genererad, persisterad bilaga (`AttachmentClass.
 * EVENT_MALLAD`, badgen nedan) laddas ner som VILKEN ANNAN bilaga som helst
 * (klass A-vägen).
 *
 * PERSONDATA FÖR KLASS C: TYPEXEMPEL, inte en verklig anmälan (se
 * `preview-receipt/index.ts` § PERSONDATA) — ingen anmälan/betalning är
 * VALD på denna generiska katalograd, och basen saknar ett prisfält
 * oavsett. Eventets namn ÄR verkligt (samma eventId som Dokument-ytans
 * redan valda event). `previewReceipt` (klass C) når ALDRIG Storage-
 * uppladdningen, Bilagor-radskapelsen eller ett allokerat kvittonummer —
 * SIDOEFFEKTSFRI förhandsvisning (AC #3, TASK-246).
 *
 * [UTBYGGD, TASK-275.3, ADR-118] RÄCKVIDDSVAL + RÄCKVIDDSLÄGE + BADGES — se
 * amenderings-sidofilen `tasks/sessions/bilagor/s102-dokument-konvergens/
 * AMENDERING-2026-08-17-rackviddsval-gemensamt-lage-badges.md` för hela
 * avvikelsen mot det godkända facit-manifestet. Kort sammanfattat:
 *   - RÄCKVIDDSVALET (RadioGroup: Detta event/En kurstyp/Alla event — husets
 *     radioval-primitiv, `RadioGroup`/`Radio`), med Kursfamilj/Kursnivå-
 *     `Select` (husets select-primitiv) när Kurstyp är valt. "Detta event" är
 *     avstängt (`isDisabled`) när inget event är valt.
 *     [OMHÄNGT 2026-08-18] Valet bodde först i `UppladdningsFlode` — ett
 *     permanent tvåstegs-block på sidan. Det blocket är rivet; frågan ställs
 *     nu i `RackviddsDialog` EFTER att filen valts. Formen och värdena är
 *     oförändrade, bara tidpunkten bytte — se dialogens eget docblock.
 *   - RÄCKVIDDSLÄGET (`GemensamtLage` nedan) är Dokument-ytans NYA läge
 *     UTAN valt event (ORDLISTA.md § Gemensam bilaga/Räckvidd) — ersätter
 *     den tidigare "Välj ett event för att se dess bilagor."-texten. Listar
 *     ALLA gemensamma bilagor (`fetchGemensammaBilagor`), och är den ENDA
 *     platsen en gemensam bilaga kan ersättas/raderas (ADR-118 beslut 3).
 *   - BADGEN (`RackviddBadge`, `src/components/dokument/RackviddBadge.tsx`)
 *     märker varje gemensam bilaga i eventlägets lista — husets neutrala
 *     metadata-pill-grammatik, ingen ny formuppfinning.
 *   - ERSÄTT DÖLJS i eventläget för gemensamma bilagor (`BilageRadRow`
 *     nedan) — badgen bär förklaringen (ADR-118 beslut 3, AC #4).
 */
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Download,
  ExternalLink,
  Files,
  FileUp,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import type { MallId } from '@/components/dokument/blockDefinitioner';
import { stegEtikett } from '@/components/dokument/nivaSprak';
import { RackviddBadge } from '@/components/dokument/RackviddBadge';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Dialog } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { mallIdFranAirtableOption } from '@/data/adapters/mallKallhash';
import type { DokumentKalla } from '@/data/mutations/dokumentKalla';
import { useDeleteAttachment } from '@/data/mutations/useDeleteAttachment';
import { useForhandsvisaDokument } from '@/data/mutations/useForhandsvisaDokument';
import { useLaddaNerDokument } from '@/data/mutations/useLaddaNerDokument';
import { useReplaceAttachment } from '@/data/mutations/useReplaceAttachment';
import { useSkapaOmEventBilaga } from '@/data/mutations/useSkapaOmEventBilaga';
import {
  type UploadAttachmentVariables,
  useUploadAttachment,
} from '@/data/mutations/useUploadAttachment';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { AttachmentClass, AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';
import { skrivLaddningssida } from '@/lib/skriv-laddningssida';
import { queryKeys } from '@/queries/keys';

/* ------------------------------------------------------------------ *
 * KLASS B/C — KOD-NIVÅ-KATALOGER, INTE INSTANS-LISTOR (se Fynd 1 ovan).
 *
 * [ÄNDRAD, TASK-309.8, ADR-125 § 6] `MALLAR` bar tidigare EN generisk
 * placeholder-post utan verklig funktion (förhandsvisning/nedladdning av
 * en hårdkodad `'deltagarinfo'`-mall, se `MallRad`s docblock). Den är nu
 * de TVÅ RIKTIGA mallarna genereringsvyn (`GenereringsVy.tsx`) bygger —
 * samma katalog-data som bar prototypens rivna `ListaVy` (T66-startpunkten,
 * "klasserna stulna rad för rad"), flyttad hit VERBATIM eftersom listvyn
 * själv är riven (skiva 7 ersätter kopian med denna, den skarpa). `id` är
 * nu `MallId` (delad med `blockDefinitioner.ts`/`GenereringsVy.tsx`), inte
 * en fri sträng — samma disciplin som `BLOCK_TILL_FALT` redan håller.
 *
 * `GENERATORER` (kvitto) är OFÖRÄNDRAD sedan S100: kvittogenereringen hör
 * till TASK-147.7, obyggd, och går inte via genereringsvyn (ADR-125 § 6
 * nämner den bara som kontext för varför den INTE fick en "Skapa"-knapp).
 * ------------------------------------------------------------------ */

type Mall = {
  id: MallId;
  namn: string;
  /** Vilka eventfält mallen fyller i — det som gör den till en MALL. */
  fyllerI: string[];
};

const MALLAR: Mall[] = [
  {
    id: 'bekraftelse',
    namn: 'Bekräftelsebilaga',
    fyllerI: ['Datum', 'Plats', 'Pris', 'Betalning', 'Innehåll'],
  },
  {
    id: 'deltagarinfo',
    namn: 'Deltagarinformation',
    fyllerI: ['Datum', 'Plats', 'Praktisk info'],
  },
];

type Generator = {
  id: string;
  namn: string;
  /** Vilka uppgifter filen byggs ur — per person. */
  byggsUr: string[];
};

const GENERATORER: Generator[] = [
  {
    id: 'c1',
    namn: 'Betalningskvitto',
    byggsUr: ['Namn', 'E-post', 'Betalt belopp', 'Betaldatum', 'Eventnamn'],
  },
];

/* ------------------------------------------------------------------ *
 * KURSFAMILJ/KURSNIVÅ-VALSLAGET (TASK-275.3, ADR-118 beslut 1)
 *
 * EXAKT samma valslag som Bilagor.Kursfamilj/Kursnivå (staging
 * `fld8Mc23OdJXFSBEx`/`fldMAGsqnQ4ddFmaI`, disk-verifierat mot
 * `docs/reference/data-model.md` § "Staging- och prodbasens additiva
 * tillskott 2026-08-17") och server-sidans `_shared/attachments.ts` §
 * KURSFAMILJ_VALUES/KURSNIVA_VALUES — DUPLICERAD MEDVETET (samma Deno↔Vite-
 * dubblerings-mönster som `AttachmentClass`/`AttachmentScope` i
 * `domain/types/Status.ts` redan etablerar; write-sidans strikta
 * server-enum är golvet, denna lista är bara UI-urvalet).
 *
 * `KURSFAMILJ_MED_NIVAER`: BARA RIM har verkliga nivåer (Intro/Nivå 1-3) —
 * Fjärrskådning och Psionautics är NIVÅLÖSA familjer (data-model.md § samma
 * sektion: "TOMT för nivålösa familjer"; `_shared/course-dimensions.ts`s
 * `KURS_KARTA` speglar samma fakta för event-sidans Kursfamilj/Kursnivå).
 * Kursnivå-selecten renderas därför BARA när en nivåbärande familj är vald
 * — att visa den för Fjärrskådning/Psionautics hade bjudit in ett val som
 * ADR-118 beslut 1 uttryckligen förbjuder ("nivålösa familjer lämnar alltid
 * nivån tom, samma regel som eventen").
 * ------------------------------------------------------------------ */
const KURSFAMILJ_VALUES = ['RIM', 'Fjärrskådning', 'Psionautics'] as const;
const KURSNIVA_VALUES = ['Intro', 'Nivå 1', 'Nivå 2', 'Nivå 3'] as const;
const KURSFAMILJ_MED_NIVAER: ReadonlySet<string> = new Set(['RIM']);

/** Full precision, Gunilla-läsbart — samma format som Anteckningar.tsx § ANTECKNING_TID. */
const DATUM_TID = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * En rad i listan — den verkliga, senaste versionen av en fil, plus (om
 * ytterligare rader med SAMMA `Namn` finns) antalet äldre dubbletter som
 * döljs. Se filhuvudets "ERSÄTT"-stycke: `dolda` bär INGEN claim om VARFÖR
 * en dubblett finns (Ersätt skapar inte längre några — se `grupperaPerNamn`
 * nedan för vad som kan).
 */
type BilageRad = { current: Attachment; dolda: number };

/** [TASK-275.3] Räckviddsvalet `RackviddsDialog` producerar — delad shape
    mellan uppladdning (`UploadAttachmentVariables` minus `file`) och
    ersättning (`ReplaceAttachmentInput` minus `file`/`oldAttachmentId`). */
type UploadScopeVal = Pick<UploadAttachmentVariables, 'rackvidd' | 'kursfamilj' | 'kursniva'>;

/**
 * [TASK-147.11, DEGRADERAD TILL REN VISNINGSHJÄLP] Grupperar VERKLIGA
 * `fetchEventAttachments`-rader per filnamn — kollapsar dubbletter till EN
 * rad (den nyaste; listan kommer redan sorterad nyast-först från servern,
 * `get-event-attachments` § kommentar "Nyast först", så första träffen per
 * namn är garanterat den senaste) plus en räkning av hur många äldre
 * dubbletter som döljs. Bär INTE längre någon "ersatte en tidigare
 * version"-CLAIM (TASK-147.6:s ursprungliga form, se filhuvudet): "Ersätt"
 * raderar nu FAKTISKT den gamla posten (`useReplaceAttachment`), så en
 * framtida ersättning kan aldrig skapa en dubblett att gruppera här.
 * Kvarvarande dubbletter (t.ex. flera identiska klass B-genereringar via
 * `generate-event-attachment`) är INTE ersättningar — funktionen gissar
 * inget om hur de uppstod, den kollapsar dem bara för listläsbarhet.
 */
function grupperaPerNamn(attachments: readonly Attachment[]): BilageRad[] {
  const perNamn = new Map<string, Attachment[]>();
  for (const a of attachments) {
    const lista = perNamn.get(a.namn);
    if (lista) lista.push(a);
    else perNamn.set(a.namn, [a]);
  }
  const rader: BilageRad[] = [];
  for (const lista of perNamn.values()) {
    rader.push({ current: lista[0], dolda: lista.length - 1 });
  }
  // Nyast övergripande överst (sekundär sort — grupperingen kan ha blandat
  // ordningen mellan olika namn).
  rader.sort((a, b) => (a.current.skapad < b.current.skapad ? 1 : -1));
  return rader;
}

export function DokumentYta() {
  const dataSource = useDataSource();
  const [eventId, setEventId] = useQueryState('event');

  const eventsQuery = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });
  const valtEvent = eventsQuery.data?.find((e) => e.id === eventId);

  const attachmentsQuery = useQuery({
    queryKey: queryKeys.attachments.byEvent(eventId ?? ''),
    queryFn: () => dataSource.fetchEventAttachments(eventId ?? ''),
    enabled: eventId != null,
  });

  // [TASK-275.3, ADR-118 beslut 5] Räckviddsläget (Fynd, filhuvudets nya
  // stycke): ALLA gemensamma bilagor, hämtas BARA när inget event är valt —
  // ömsesidigt uteslutande mot `attachmentsQuery` ovan (samma `enabled`-par
  // som redan höll för `attachmentsQuery`, bara omvänt).
  const gemensammaQuery = useQuery({
    queryKey: queryKeys.attachments.gemensamma,
    queryFn: () => dataSource.fetchGemensammaBilagor(),
    enabled: eventId == null,
  });

  // EN mutation-instans TÄCKER BÅDA lägena — `eventId` (`string | null`)
  // BINDS till VILKET läge som faktiskt renderar just nu (bara ETT läge
  // renderar åt gången, se JSX-grenen nedan), så hooken behöver aldrig
  // instansieras två gånger.
  const uploadMutation = useUploadAttachment(eventId);
  // "Ersätt" (TASK-147.11) — SKILD hook/mutation från uppladdningsknappen
  // längst ner: samma FileTrigger-mönster, men bär vilken befintlig post
  // som ska bort (`oldAttachmentId`) och komponerar upload+delete i rätt
  // ordning (se useReplaceAttachment.ts för kontraktet).
  const replaceMutation = useReplaceAttachment(eventId);
  // [TASK-275.3] Standalone Radera — ANVÄNDS bara i räckviddsläget
  // (`GemensamtLage` nedan; se useDeleteAttachment.ts § docblock för varför
  // signaturen ändå speglar hela `string | null`-kontraktet).
  const deleteMutation = useDeleteAttachment(eventId);

  const rader = useMemo(
    () => grupperaPerNamn(attachmentsQuery.data ?? []),
    [attachmentsQuery.data],
  );
  const gemensammaRader = useMemo(
    () => grupperaPerNamn(gemensammaQuery.data ?? []),
    [gemensammaQuery.data],
  );

  // ═══ FILEN FÖRST, RÄCKVIDDEN SEDAN (Marcus 2026-08-18) ═══
  //
  // Vald fil, i väntan på att Lotta svarat på räckviddsfrågan. Att den bor
  // HÄR och inte i knappen är avsiktligt: dialogen gäller hela sidan, inte
  // ett läge — samma fil ska kunna laddas upp oavsett om ett event är valt
  // eller inte, och två monterade dialoger (en per läge) hade kunnat glida
  // isär precis som de två radkomponenterna gjorde före S107:s fjärde rond.
  const [valdaFiler, setValdaFiler] = useState<FileList | null>(null);

  const handleUpload = (files: FileList | null, scope: UploadScopeVal, onKlart?: () => void) => {
    const file = files?.[0];
    // `onSuccess` — INTE ett `isSuccess`-useEffect: mutationens flagga står
    // kvar efter stängning och hade stängt nästa dialog i samma ögonblick
    // den öppnades. Callbacken fyrar exakt en gång, för just denna körning.
    if (file) uploadMutation.mutate({ file, ...scope }, { onSuccess: onKlart });
  };

  const handleReplace = (
    files: FileList | null,
    oldAttachmentId: string,
    scope: UploadScopeVal,
  ) => {
    const file = files?.[0];
    if (file) replaceMutation.mutate({ file, oldAttachmentId, ...scope });
  };

  const handleDelete = (attachmentId: string, namn: string) => {
    deleteMutation.mutate({ attachmentId, namn });
  };

  return (
    <div className="flex flex-col gap-4" data-testid="dokument-yta">
      {/* TASK-299.11 — PROMOVERAD: husets delade SidRam-primitiv (kant-i-
          kant-dialekten, endast sidkromet) ersätter den gamla textlänken.
          Dev-växeln `?sidram=ny` (TASK-299.1) är riven (ADR-103 B2 steg 4);
          facit-manifestet amenderat till klass (c), se
          s102-dokument-konvergens/AMENDERING-2026-08-23-sidram-promovering.md. */}
      <SidRam to="/mer" tillbakaEtikett="Tillbaka till Mer" />

      {/* INGEN INGRESS — PRÖVAD RENDERAD OCH FÄLLD (Marcus 2026-08-18).
          "Filerna som bifogas i utskicken till deltagarna." stod här en kort
          stund som svar på hans egen fråga om vad sidan handlar om; efter att
          ha sett den mot renderad yta: *"Ta bort underrubriken … det fattar
          hon ändå."* Sidans tydlighet bärs i stället av strukturen — ett val,
          en knapp, en lista. Återinför den inte utan att fråga. */}
      <header className="flex flex-col gap-1 px-4">
        <h1 className="font-semibold text-3xl">Dokument</h1>
      </header>

      {/* Eventväljaren (Fynd 2): fundamentet är event-scopat, så ytan
          behöver ett valt event innan verklig data kan hämtas. Samma
          delade komponent som Åtgärds-sidan/manuell anmälan (kontextrad-
          formen). Tomt läge tills Marcus/Lotta väljer — ingen fixtur
          default-vald här. TOMT LÄGE är sedan TASK-275.3 INTE längre "väntar
          på val" — det ÄR räckviddsläget (se GemensamtLage nedan). */}
      {/* VÄLJAREN ÄGER HELA RÄCKVIDDS-AXELN (Marcus 2026-08-18). Listan har
          ett kontextlöst alternativ överst — "Delade dokument" — som är
          valt när `?event=` saknas. Ett val, en kontroll.

          Det ersätter knappen "Visa gemensamma dokument" som stod längst ner
          i dokumentlistan. Den var en NAVIGERING nedstoppad bland listans
          egna kontroller, och kolliderade med typfiltrets "Alla": två
          kontroller i samma kort, på två olika axlar, med samma vikt. Marcus:
          *"vi kan ju inte ha toggle-valet 'ALLA' i eventläget och även ha
          knappen 'Visa gemensamma dokument' … trycker jag på den hamnar ju
          listan i förvaltningsläget. Alltså vad gör vi, detta är inte bra."*

          Knappens etikett var dessutom osann: eventläget visar REDAN
          gemensamma bilagor (`get-event-attachments` unionerar eventets egna
          + kurstyp + alla-event, ADR-118 beslut 2, märkta med `RackviddBadge`).
          Vad den faktiskt gjorde var att gå till förvaltningsytan — den enda
          plats de får ersättas/raderas (ADR-118 beslut 3).

          `EventValjare`s avvisning av avmarkering (`onSelectionChange`:
          `if (key == null) return;`) är därmed inte längre ett problem att
          kompensera för: man avmarkerar aldrig, man väljer ett annat
          alternativ. */}
      {/* TASK-299.11 — hela innehållskolumnen under sidhuvudet (väljaren,
          listan, uppladdningsknappen, uppladdningsfelet) delar SAMMA px-4-
          marginal som rubriken (`headerKlass` ovan), matchande chevronens
          `mx-4` (TASK-299.2-mätningens fynd: annars driver innehållet 16 px
          ur linje med rubriken — samma fix som AktivitetsHistorik.tsx). */}
      <div className="flex flex-col gap-4 px-4">
        <EventValjare
          // Den STORA, luftiga rutan — samma geometri som manuell anmälans
          // tomma läge (Marcus 2026-08-18). Dokument-ytans väljare är sidans
          // primära val och står per konstruktion ALDRIG tom ("Delade dokument"
          // är valt när `?event=` saknas), så pillformen var den enda den
          // någonsin visade. Se `EventValjare`s `form`-prop för hela motivet.
          form="fristaende"
          valtEventId={eventId ?? undefined}
          valtEvent={valtEvent}
          onByte={(id) => void setEventId(id)}
          gemensamtAlternativ={{
            // "Delade dokument", inte "Gemensamma dokument" (Marcus 2026-08-18).
            // MODELLBEGREPPET är oförändrat: ORDLISTA.md § Gemensam bilaga och
            // `AttachmentScope`-värdena rörs inte — detta är UI-språk, samma
            // skillnad som `Nivå`→`Steg` redan bär (nivaSprak.ts).
            etikett: 'Delade dokument',
            // `Files` — FLERA dokument, vilket är precis vad räckvidden betyder
            // (ORDLISTA.md § Gemensam bilaga: syns i varje berört events lista).
            // Kalender vore fel: den betyder event, och detta är valet UTAN
            // event. `Layers` var upptaget av segment-byggarens lager-begrepp.
            // Storleken 18 speglar kalenderikonens i väljarens tomma läge.
            ikon: <Files aria-hidden="true" size={18} className="shrink-0" />,
            onValj: () => void setEventId(null),
          }}
        />

        {eventId == null ? (
          <GemensamtLage
            rader={gemensammaRader}
            laddar={gemensammaQuery.isPending}
            fel={gemensammaQuery.isError}
            felmeddelande={
              gemensammaQuery.error instanceof Error
                ? gemensammaQuery.error.message
                : 'Inget felmeddelande angavs.'
            }
            onReplace={handleReplace}
            replaceMutation={replaceMutation}
            onDelete={handleDelete}
            deleteMutation={deleteMutation}
          />
        ) : attachmentsQuery.isPending ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Laddar bilagor…</span>
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        ) : attachmentsQuery.isError ? (
          <MessageBox intent="error" title="Kunde inte hämta bilagor">
            {attachmentsQuery.error instanceof Error
              ? attachmentsQuery.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        ) : (
          <DokumentLista
            eventId={eventId}
            rader={rader}
            onReplace={handleReplace}
            replaceMutation={replaceMutation}
          />
        )}

        {/* SIDANS PRIMÄRA HANDLING — EN KNAPP, INTE ETT FORMULÄR, OCH DEN STÅR
          UNDER LISTAN (Marcus 2026-08-18).

          Placeringen hänger ihop med att listan RULLAR INLINE: den kan aldrig
          växa förbi sin max-höjd, så knappen under den är alltid inom en
          skärmhöjd. Marcus: *"detta gör det logiskt att sätta Ladda upp-
          knappen under dokumentlistan, vilket också gör layouten snyggare."*
          Utan rullningen hade placeringen varit fel — det var precis därför
          uppladdningen flyttades ÖVER listan 2026-08-17, när listans längd
          var obegränsad.

          Knappen öppnar filväljaren DIREKT; räckviddsfrågan kommer efteråt, i
          dialogen, när det finns en fil att ställa den om. Före detta stod ett
          permanent tvåstegs-block ("Steg 1: Vilka event ska filen gälla?" →
          "Steg 2: Välj fil") som frågade om spridning innan filen fanns.

          `data-testid` på WRAPPERN, inte på knappen: `FileTrigger` renderar
          sin dolda `<input type="file">` som syskon till knappen, och det är
          inputen testet behöver nå (`setInputFiles`). Sidan bär flera
          FileTriggers — varje "Ersätt" är en — så ett scopat ankare är enda
          sättet att träffa RÄTT input. */}
        <div data-testid="ladda-upp-ny-fil">
          <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={setValdaFiler}>
            <Button intent="primary" isDisabled={uploadMutation.isPending}>
              <Upload aria-hidden="true" size={16} className="shrink-0" />
              {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp ny fil'}
            </Button>
          </FileTrigger>
        </div>

        {/* Uppladdningsfelet bor på SIDAN, inte i dialogen: dialogen stänger
            vid framgång och rivs, så ett fel som uppstår i sista ögonblicket
            hade försvunnit med den. Här står det kvar tills nästa försök. */}
        <UppladdningsFel uploadMutation={uploadMutation} />
      </div>

      {/* RÄCKVIDDSFRÅGAN — VILLKORAT MONTERAD, inte bara `isOpen`-styrd.
          Formulärstate (räckvidd/familj/steg) bor i dialogens egen komponent
          och ska vara FÄRSKT vid varje öppning: en kvarhängande "En familj"
          från förra filen hade tyst satt fel räckvidd på nästa. Villkorad
          rendering ger det gratis — samma disciplin som `Hem.tsx`s
          svep-overlay (*"overlayen UNMOUNTAS helt vid stängning, så state
          aldrig läcker in i nästa öppning"*).

          Priset är att ut-animationen hoppas över. Medvetet: `Modal`s
          exit-transition kräver att barnen lever under utgången, och ett
          läckande räckviddsval är en verklig defekt medan en utebliven
          200 ms-skalning inte är det. */}
      {valdaFiler != null && (
        <RackviddsDialog
          filer={valdaFiler}
          harEvent={eventId != null}
          uploadMutation={uploadMutation}
          onStang={() => setValdaFiler(null)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}

/** Metaraden under namnet — bara verkliga fält (storlek, uppladdad-datum). */
/* ═══ DE FYRA RADHANDLINGARNA DELAR EXAKT FORM ═══
 *
 * Marcus 2026-08-17: *"alla fyra knappar måste se likadana ut och sitta i
 * rad, alltså även previewknappen, gör de mindre så får de plats."*
 *
 * Formen bor därför i EN konstant i stället för att upprepas på fyra
 * anropsställen i två radkomponenter — samma skäl som `HandlingsRad` och
 * `StegSektion` lyftes: en delad form som beskrivs på flera ställen glider
 * isär, och glidningen upptäcks av Marcus öga, inte av en grind.
 *
 * ── STORLEKEN ÄR 44 px, OCH DEN ÄR ETT GOLV VI INTE SÄNKER ──
 *
 * "Gör dem mindre" löstes med IKONEN (18 → 16 px) och luften mellan dem
 * (`gap-1` → `gap-0.5`), aldrig med träffytan. 44×44 är repots egen
 * uttalade ribba (`DESIGN-SYSTEM-SPEC.md` § checklista, "Touch targets ≥
 * 44px?") och den är mekaniskt låst på annat håll i huset
 * (`tests/a11y/NavCard.spec.ts`: "träffyta: raden är ≈58 px hög (≥44
 * px-golvet)"). Fyra knappar à 44 px + tre 2 px-mellanrum = 182 px, mätt.
 *
 * Skulle bredden ändå inte räcka på en smal skärm är rätt svar att låta
 * raden bryta, inte att krympa träffytan — en knapp som är för liten att
 * träffa är trasig för Lotta på mobil, medan en rad som bryter bara är
 * längre.
 */
const IKONKNAPP_KLASS = 'size-11 shrink-0 p-0';

/**
 * Listans rullnings-geometri — MÄTT i renderad yta, inte uppskattad.
 *
 * [HISTORIK] Fram till TASK-309.24 stod här ett hårdkodat `max-h-[396px]`
 * (4 × 99 px, "acceptance-riggens" mätning 2026-08-18: fyra raders
 * `top`-värden på 284/383/482/581). Talet höll så länge VARJE rad var
 * exakt 99 px hög — men TASK-309.20 (375 px-defekter, `DokumentRadSkal`s
 * eget filhuvud) gav radens ikonkolumn `flex-wrap`: en Event-mallad rad
 * med FYRA handlingar (Öppna/Ladda ner/Skapa om/Ersätt) bryter till TVÅ
 * rader vid 375 px, och en rad med tre badgar kan göra detsamma redan
 * innan dess (samma docblock, "rader REDAN varierar i höjd"). Radhöjden
 * är sedan dess en RENDERAD EGENSKAP, inte en konstant — ett hårdkodat
 * px-tal hade antingen klippt en verklig rad eller lämnat ett gap, båda
 * fel. `LISTA_SYNLIGA_RADER` (antalet rader) är fortsatt en konstant;
 * `useLastaListhojd` nedan MÄTER pixelhöjden dynamiskt i stället för
 * `LISTA_MAXHOJD`, som är riven.
 */
const LISTA_SYNLIGA_RADER = 4;

/**
 * FALLBACK-RADHÖJD — `useLastaListhojd`s NIVÅ 3 (sista utvägen), använd
 * ENDAST när (a) noll RIKTIGA rader finns i DOM (bara tomt-lägets
 * placeholder-`<li>`) OCH (b) ingen mätning — varken PRECIS eller ESTIMAT —
 * någonsin skett i detta komponent-liv (`senastUppmattRadhojd.current ===
 * null`). I PRAKTIKEN bara nåbar i `GemensamtLage` vid ett events ALLRA
 * FÖRSTA rendering med noll delade dokument: `DokumentLista` har alltid
 * minst `MALLAR.length + GENERATORER.length === 3` RIKTIGA rader synliga i
 * 'alla' (default-filtret) och har därför redan skrivit
 * `senastUppmattRadhojd` långt innan 'bilaga' någonsin kan visa 0
 * (`bilagaKanMataExakt`s docblock nedan).
 *
 * [RUNDA 2, ANDRA VARVET — review-fynd, orkestrerarens/Marcus mandat
 * 2026-08-26] FÖRSTA VARVETS TAL (155 för mobil) VAR FEL VAL, INTE FEL
 * MÄTNING. 155 px kommer från en ENSAM `GemensamBilageRadRow` vid 375 px —
 * den raden BRYTER (`DokumentRadSkal`: `flex-wrap`, 4 ikoner: förhandsvisa/
 * ladda ner/ersätt/radera, `IKONKNAPP_KLASS`-bredden ryms strukturellt
 * ALDRIG bredvid namnkolumnens `min-w-[12ch]`-golv i `<ul>`s uppmätta
 * 277 px vid den bredden — verifierat: ÄVEN en rad med bara TRE ikoner
 * bryter i samma mätning). Att låsa TOMMA listans höjd mot den VÄRSTA
 * tänkbara radformen (en bruten rad) ger en orimlig box: 155×4+kant ≈ 622 px
 * — 78 % av en 800 px mobilskärm luft under "Inga delade dokument än.",
 * innan någon vet om den FÖRSTA riktiga raden ens kommer bryta.
 *
 * Fallbacken representerar i stället en NORMAL rad UTAN ikon-radbrytning —
 * samma storleksordning som desktop, på ALLA brytpunkter (ENGÅNGS-
 * konstant, ingen brytpunkts-gren kvar). MÄTT (inte gissat): `MallRad`
 * (`DokumentYta.tsx` nedan) har INGEN `flex-wrap` på sitt yttre skal och
 * BARA EN ikon (`ChevronRight`) — den kan strukturellt aldrig bryta, och är
 * därför den genuint viewport-OBEROENDE referensen för "en normal rad":
 * uppmätt till **99 px** vid BÅDA `acceptance`-projektets 1280×720-viewport
 * (`<ul>`-bredd 502 px) OCH en 375×800-viewport (`<ul>`-bredd 277 px) —
 * SAMMA TAL, konstant, eftersom raden aldrig bryter oavsett bredd. Detta
 * matchar dessutom den historiska 4×99-mätningen i filhuvudets
 * [HISTORIK]-stycke.
 *
 * DETTA ÄR ETT UTTALAT PRODUKTBESLUT, INTE EN TEKNISK NÖDVÄNDIGHET: en
 * `GemensamBilageRadRow` (GemensamtLage's ENDA radtyp) kommer troligen
 * BRYTA första gången ett riktigt delat dokument dyker upp på en smal
 * skärm (samma mekanism som ovan), vilket kan ge EN synlig höjdjustering
 * den allra första gången listan går från tom till fylld på mobil — en
 * mindre, kontrollerad avvikelse som medvetet väljs FRAMFÖR att alltid
 * reservera en påtagligt för hög tom box. Marcus kan justera avvägningen
 * efter helgen (S108 Del 26-frågan) om den mindre justeringen känns fel i
 * praktiken — bokfört öppet, inte gömt.
 */
const LISTA_FALLBACK_RADHOJD = 99;

/**
 * MÄTER listans låsta höjd mot RENDERAD geometri (TASK-309.24 — filhuvudets
 * nya stycke bär hela regeln; runda 2 gör låsningen OVILLKORAD, se nedan).
 *
 * TRE MÄTNIVÅER, fallande precision — `mat()` provar dem i ordning och
 * skriver ALDRIG en sämre nivå över en bättre (se "PRECISIONEN ÄR MONOTON"):
 *
 *   1. PRECIS (`antalRiktigaRader >= LISTA_SYNLIGA_RADER`) — exakt spannet
 *      rad1.top → rad4.bottom, oförändrat sedan runda 1.
 *   2. ESTIMAT (1–3 RIKTIGA rader) — `radhöjd` = MAX av de BEFINTLIGA
 *      radernas EGNA höjd (INTE en summa av spannet, se nedan), gånger
 *      `LISTA_SYNLIGA_RADER`.
 *   3. FALLBACK (0 RIKTIGA rader) — `senastUppmattRadhojd.current` om något
 *      NÅGONSIN uppmätts i detta komponent-liv, annars den dokumenterade
 *      `LISTA_FALLBACK_RADHOJD`-konstanten (EN, viewport-oberoende).
 *
 * VARFÖR MAX, INTE FÖRSTA RADEN, I NIVÅ 2: TASK-309.20s `flex-wrap` gör att
 * rader kan variera i höjd (en rad med fler ikoner/badgar radbryter, en
 * annan inte) — att alltid ta den FÖRSTA riskerar att underskatta om just
 * den råkar vara kortast av de synliga, vilket hade klippt en senare, högre
 * rad. MAX är den konservativa (aldrig-klippande) uppskattningen.
 *
 * PRECISIONEN ÄR MONOTON, ALDRIG NEDÅT (`harPreciserMatt`, review-fynd 3 /
 * gränsfallet, TASK-309.24 runda 2): en gång en PRECIS mätning skett,
 * skriver varken ESTIMAT eller FALLBACK över den igen — annars hade en
 * in-place-minskning under fyra RIKTIGA rader (radera bilagor tills färre
 * än fyra kvarstår, UTAN sidladdning) fått boxen att KRYMPA i stället för
 * att stå kvar. `GemensamtLage` saknar 'bilaga'/'alla'-källprioriteringen
 * nedan (`harForetradesMatt`) — där mäter VARJE render (`matbar` konstant
 * sant), så UTAN `harPreciserMatt` hade en minskning under fyra DIREKT
 * skrivit över en tidigare precis mätning med en sämre estimat-mätning.
 *
 * MONOTONIN ÄR RIKTAD, INTE ABSOLUT: en UPPGRADERING (NIVÅ 2 → NIVÅ 1, ett
 * fjärde RIKTIGT dokument dyker upp i samma sidladdning — review-fynd,
 * runda 2 andra varvet) SKRIVER över en tidigare ESTIMAT-mätning, och detta
 * är avsiktligt: fjärde raden är verkligt INNEHÅLL som nu går att mäta
 * precist, inte ett filterhopp (regel 5 gäller BARA filterbyte, se
 * `berakaListgeometri`). **Detta är därför det ENDA läget höjden tillåts
 * ÄNDRAS UTAN att en `ResizeObserver`-triggad omritning av en BEFINTLIG
 * raders storlek ligger bakom** (ADR-083: prosan här och koden i `mat()`
 * ska hålla ihop) — en höjdökning vid 3→4 är en mätning av verkligt
 * innehåll, inte en regression av regel 5. Test: se
 * `dokument-lista-hojdlas.acceptance.test.ts`s gränsfall "NIVÅ 2 → NIVÅ 1".
 *
 * MÄTKÄLLAN ÄR I ÖVRIGT (nivå 1/2) MEDVETET BEGRÄNSAD TILL 'alla' OCH
 * 'bilaga', I TVÅ NIVÅER (`foretradesMatbar`/`reservMatbar`, satta av
 * anroparen). Bilagor står ALLTID FÖRST i den kanoniska ordningen (bilagor
 * → mallar → generatorer), så filtret 'bilaga's första `LISTA_SYNLIGA_RADER`
 * rader är SAMMA rader (samma `id`, samma props) som 'alla's — men INTE
 * nödvändigtvis SAMMA RENDERADE HÖJD: en rads pixelhöjd beror mätt
 * (TASK-309.24) på hur många SYSKON den har i DOM, inte bara sitt eget
 * innehåll (samma rad mätte 99 px bland sju syskon, 98 px bland fyra — ren
 * layout-avrundning, se `DokumentLista`s eget stycke för den fulla
 * diagnosen). En mätning måste därför tas i SAMMA "hur många rader finns i
 * DOM"-kontext den senare ska gälla för — 'bilaga' är den kontext AC #2:s
 * exakt-fyra-krav faktiskt prövas i, så `foretradesMatbar` (sann när
 * 'bilaga' själv kan leverera minst fyra rader) vinner ALLTID och LÅSER
 * (`harForetradesMatt`) — en gång mätt DÄRIFRÅN skriver 'alla' aldrig över
 * värdet igen, oavsett hur många gånger filtret växlar tillbaka.
 *
 * `reservMatbar` ('alla', ovillkorat) finns för den FÖRSTA renderingen:
 * sidan öppnas alltid i 'alla' (`aktivtFilter`s default), så UTAN en
 * reservkälla hade den absolut första visningen — innan Lotta någonsin
 * rört filterraden — saknat låst höjd helt (mätt, TASK-309.24: exakt detta
 * hände första implementationsvarvet, `alla.scrollHeight` var lika med
 * `clientHeight` bara för att INGEN mätning någonsin skett). Reservkällan
 * ger ett DUGLIGT första-värde ('alla' är alltid rullningsbar när
 * totalen räcker, så ±1 px spelar ingen roll där) tills 'bilaga' — om den
 * någonsin besöks — förfinar det till det EXAKTA talet. 'mall'/'generator'
 * litas ALDRIG på egen hand: `MALLAR`/`GENERATORER` är statiska (2
 * respektive 1 post, 2026-08-26) och kan idag aldrig ensamma nå
 * `LISTA_SYNLIGA_RADER` — men skulle någon senare lägga till en tredje mall
 * vore dess rader INTE en prefix av den kanoniska ordningen (mallar kommer
 * EFTER bilagor i 'alla'), så mät inte därifrån utan att först lösa den
 * frågan på nytt. `GemensamtLage` har inget filter alls — där finns bara EN
 * kontext, så varje mätning är trygg och dess anrop sätter BÅDA till
 * konstant `true`.
 *
 * `hojd`-state uppdateras alltså bara när minst en av de två (foreträde/
 * reserv) är sann OCH spärren (`harForetradesMatt`) inte hindrar den —
 * annars står den kvar vid sitt senaste värde. Det ÄR poängen med regel 5
 * (filterbyte ändrar aldrig listans bounding box).
 *
 * `getBoundingClientRect()` på RADERNA, aldrig `offsetTop`/`clientHeight`:
 * den senare rundar till HELA pixlar (mätt, TASK-309.24 — en 1 px-diff mot
 * `tests/acceptance/dokument-rackviddsval.acceptance.test.ts`s egen
 * `getBoundingClientRect`-baserade `fyraRader`-mätning avslöjade det). Att
 * skillnaden (nivå 1) mäts mellan TVÅ element i SAMMA rullande container
 * gör den scroll-position-OBEROENDE trots att `getBoundingClientRect` är
 * viewport-rymden: rullar listan S pixlar flyttar sig BÅDA elementens
 * rektanglar med S, och S tar ut sig själv i subtraktionen
 * (`fjarde.bottom - forsta.top`). Ingen egen kantlinje behöver uteslutas
 * för hand här: `berakaListgeometri`s `sistaRadenBarLinje` är redan FALSK
 * precis när fjärde raden är den sista OCH exakt fyller platserna — det är
 * den enda situationen fjärde raden annars skulle fått en egen `border-b`.
 *
 * `ResizeObserver` på RADERNA (upp till fyra, eller färre om listan har
 * färre), inte på `<ul>` självt — samma val som `BlockDialog.tsx`s
 * uttoningsmätning gör och av samma skäl: när höjden väl är LÅST slutar
 * `<ul>` självt att ändra storlek (det är hela poängen), så en observer på
 * ul:et skulle sluta trigga om en rads innehåll ändras EFTER första
 * låsningen (t.ex. ett filnamn som växer och radbryter annorlunda). Raderna
 * själva ändrar storlek oavsett.
 */
function useLastaListhojd(
  foretradesMatbar: boolean,
  reservMatbar: boolean,
  antalRiktigaRader: number,
  ommatningsSignal: unknown,
): { listRef: React.RefObject<HTMLUListElement | null>; hojd: number | null } {
  // `listRef` skapas HÄR (inte mottagen som parameter) av samma skäl som
  // `BlockDialog.tsx`s `rullRef`: biomes `useExhaustiveDependencies` känner
  // igen en `ref.current`-läsning som stabil bara när `useRef`-anropet och
  // effekten som läser den delar samma funktionskropp — en ref given som
  // PARAMETER kan i princip vara vad som helst, och flaggas då som ett
  // riktigt beroende (mätt, TASK-309.24: samma mönster gav
  // `useExhaustiveDependencies`-fel så fort `listRef` kom in som argument).
  const listRef = useRef<HTMLUListElement>(null);
  const [hojd, setHojd] = useState<number | null>(null);
  // Sant så fort `foretradesMatbar` mätt EN gång — spärrar `reservMatbar`
  // från att SKRIVA ÖVER en redan etablerad, precis mätning med en mindre
  // precis (se filhuvudets stycke för VARFÖR de två källorna kan ge olika
  // tal för "samma" fyra rader). Utan spärren hade den FÖRSTA
  // sidladdningen (alltid filtret 'alla') låst in ett värde som senare,
  // första gången 'Bilagor' besöks, tystast blivit fel igen — spärren gör
  // förträdet OÅTERKALLELIGT inom komponentens livslängd, inte bara en
  // engångsprioritering vid mättillfället.
  const harForetradesMatt = useRef(false);
  // NIVÅ 3:s spärr (runda 2) — se filhuvudets "PRECISIONEN ÄR MONOTON"-stycke.
  const harPreciserMatt = useRef(false);
  // NIVÅ 2/3:s minne — senast uppmätt ENSKILD radhöjd (inte den slutliga
  // fyra-raders-höjden), skriven av VILKEN nivå som helst som lyckats mäta
  // riktiga rader. Grunden för NIVÅ 3:s förstahandsval.
  const senastUppmattRadhojd = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (!foretradesMatbar && !(reservMatbar && !harForetradesMatt.current)) return;
    // Läses aldrig — `ommatningsSignal` finns i beroendelistan uteslutande
    // för att TVINGA en ommätning när kanoniska raders innehåll (`rader`)
    // ändras (nya/borttagna bilagor kan byta ut vilka DOM-noder som är
    // "de fyra första", eller sänka `antalRiktigaRader` under fyra). `void`
    // gör referensen explicit i stället för att bara stå i beroendelistan
    // — annars flaggar biomes `useExhaustiveDependencies` den som ett
    // oanvänt beroende.
    void ommatningsSignal;
    const ul = listRef.current;
    if (!ul) return;

    const mat = () => {
      const barn = ul.children;
      // Strukturellt onåbart (både `DokumentLista` och `GemensamtLage`
      // renderar ALLTID minst en `<li>` — en riktig rad eller tomt-lägets
      // placeholder), men en tom `<ul>` ska aldrig krascha på `barn[0]`.
      if (barn.length === 0) return;
      // `<ul>` bär `border border-transparent` (husets nästlingsmönster,
      // se `DokumentLista`s filterstycke) OCH ärver `box-sizing: border-box`
      // (Tailwind preflight, gäller universellt). Ett `style.height` satt
      // till EXAKT radspannet/radhöjden hade därför reserverat 2 px FÖR
      // LITE innehållsyta — kantlinjerna äts av samma tal som innehållet
      // ska få (mätt, TASK-309.24: `ul`s egen `getBoundingClientRect().bottom`
      // slutade 1 px FÖRE fjärde radens verkliga underkant). Kompensationen
      // läggs på HÄR, en gång, för BÅDA nivåerna nedan.
      const kant = getComputedStyle(ul);
      const kantjustering =
        Number.parseFloat(kant.borderTopWidth) + Number.parseFloat(kant.borderBottomWidth);

      if (antalRiktigaRader >= LISTA_SYNLIGA_RADER) {
        // NIVÅ 1 — PRECIS.
        const forsta = barn[0].getBoundingClientRect();
        const fjarde = barn[LISTA_SYNLIGA_RADER - 1].getBoundingClientRect();
        const spann = fjarde.bottom - forsta.top;
        setHojd(spann + kantjustering);
        senastUppmattRadhojd.current = spann / LISTA_SYNLIGA_RADER;
        harPreciserMatt.current = true;
        if (foretradesMatbar) harForetradesMatt.current = true;
        return;
      }
      // MONOTON — se filhuvudets "PRECISIONEN ÄR MONOTON"-stycke: en gång
      // precist mätt skriver ingen lägre nivå över värdet igen.
      if (harPreciserMatt.current) return;

      let radhojd: number;
      if (antalRiktigaRader > 0) {
        // NIVÅ 2 — ESTIMAT: MAX av de riktiga radernas EGNA höjd (se
        // filhuvudets "VARFÖR MAX"-stycke).
        radhojd = 0;
        for (let i = 0; i < barn.length; i++) {
          const h = barn[i].getBoundingClientRect().height;
          if (h > radhojd) radhojd = h;
        }
      } else {
        // NIVÅ 3 — FALLBACK: senast kända radhöjd, annars den dokumenterade
        // konstanten (se `LISTA_FALLBACK_RADHOJD`s docblock — EN konstant,
        // viewport-oberoende, sedan runda 2:s andra varv).
        radhojd = senastUppmattRadhojd.current ?? LISTA_FALLBACK_RADHOJD;
      }
      senastUppmattRadhojd.current = radhojd;
      setHojd(radhojd * LISTA_SYNLIGA_RADER + kantjustering);
    };
    mat();

    const ro = new ResizeObserver(mat);
    for (let i = 0; i < Math.min(LISTA_SYNLIGA_RADER, ul.children.length); i++) {
      ro.observe(ul.children[i]);
    }
    return () => ro.disconnect();
  }, [foretradesMatbar, reservMatbar, antalRiktigaRader, ommatningsSignal]);

  return { listRef, hojd };
}

/**
 * Listans geometri-regler — DELAD mellan `DokumentLista` och
 * `GemensamtLage` (TASK-309.24, Marcus 2026-08-26, ordagrant): *"Vi kan ha
 * låst höjd med separatorlinje på alla OM vi låser höjden så den fjärde
 * separatorlinjen inte syns. Är 5 dokument i listan så syns inte linjen
 * förrän du scrollar."* ERSÄTTER de tidigare separata
 * `lasHojd`/`avslutaLista`-villkoren (TASK-309.12/91738caa,
 * `DokumentLista` bar dem, `GemensamtLage` bar ingetdera — ett genuint
 * glapp, inte ett medvetet undantag; samma regel gäller BÅDA listorna på
 * `/mer/dokument`).
 *
 * INGET `lasHojd`-FÄLT KVAR (runda 2, review-fynd 1): körning 1 lät
 * containerns höjd låsas bara `totaltAntal > LISTA_SYNLIGA_RADER` — Marcus
 * regel 2 är ordagrant *"ALLTID exakt fyra raders hög … Gäller 0–3 rader
 * (luft under; tomt-läget renderas inom samma höjd), exakt 4 och 5+."*
 * Låsningen är alltså nu OVILLKORAD: anroparna applicerar höjdstilen så
 * fort en mätning finns (`matadHojd !== null`, se `useLastaListhojd`s tre
 * nivåer, inklusive FALLBACK-nivån för 0 rader), aldrig villkorat av ett
 * eget booleskt fält här.
 *
 * `kanRulla` — rullar listan I DET AKTUELLA filtret? Styr tabb-stoppet
 * OCH overflow-läget (`hidden` när den inte kan rulla, `auto` när den kan
 * — regel 3: "overflow hidden när ≤ 4, auto när > 4").
 *
 * `sistaRadenBarLinje` — bär den sista SYNLIGA raden sin egen underkant?
 * INTE precis när den exakt fyller de fyra platserna
 * (`antalSynliga === LISTA_SYNLIGA_RADER`): då gör ytans egen kant redan
 * separatorns jobb, och ännu en linje hade legat dubbelt (samma motiv som
 * `d9d973d5`s `avslutaLista`). I alla andra fall — tomt läge undantaget
 * (0 bär aldrig linje), 1–3 och 5+ — bär sista raden linje.
 */
function berakaListgeometri(antalSynliga: number) {
  return {
    kanRulla: antalSynliga > LISTA_SYNLIGA_RADER,
    sistaRadenBarLinje: antalSynliga > 0 && antalSynliga !== LISTA_SYNLIGA_RADER,
  };
}

/**
 * Täckningspillens klass — EN källa, delad av `RackviddBadge` (bilagor) och
 * mall-/generatorraderna. De bar samma sträng på tre ställen innan
 * höjdlåsningen; en delad form som beskrivs flera gånger glider isär, och
 * glidningen upptäcks av Marcus öga i stället för av en grind.
 *
 * ═══ `bg-bg-muted`, INTE `bg-surface` — INSTANS SEX, FÅNGAD FÖRE LANDNING ═══
 *
 * Pillen bar `bg-surface` så länge den låg på kortets `bg-bg-muted`. När
 * listan 2026-08-18 fick sin EGEN `bg-surface`-yta (Marcus: *"ge inline-
 * scroll-ytan en annan färg/toning"*) vände nästlingen — och pillen blev
 * osynlig mot sin nya bakgrund. MÄTT, inte antaget:
 * `getComputedStyle` gav `pill=rgb(255,255,255)` och
 * `lista=rgb(255,255,255)` i renderad yta.
 *
 * Det är sjätte gången samma token-identitet gjort något osynligt på DENNA
 * yta (ghost-hovern ×2, Ersätt/Radera, räckviddspillen, uppladdningsskalet
 * — se filhuvudets systemiska fynd). Regeln som faller ut: **tokenvalet följer
 * NÄSTLINGEN, aldrig vanan.** Byter en behållare bakgrund måste allt som
 * ligger I den prövas om — och prövningen är en mätning av `backgroundColor`,
 * inte en blick på klassnamnet.
 *
 * [TASK-309.20] `min-w-0 max-w-full truncate`, INTE `shrink-0` — samma fix
 * som `RackviddBadge.tsx` fick, av samma mätta skäl (se dess docblock för
 * pixelbeläggen): en Mall-badge med lång text ("Bekräftelsebilaga", 17 tecken)
 * i en Event-mallad rad vid 375 px flöt annars ut över ikonknapparna på
 * exakt samma sätt som räckviddsbadgen — X-överlappet mättes (badge
 * `x=62 width=121` mot första knappens `x=131`), även om Y-banden råkade
 * missa varandra i just den mätta raden. Samma underliggande arkitekturfel,
 * så samma fix på den delade klassen.
 */
const TACKNING_KLASS =
  'inline-flex min-w-0 max-w-full items-center truncate rounded-full border border-transparent bg-bg-muted px-2 py-0.5 font-medium text-caption text-text-secondary contrast-more:border-border-strong';
const IKON_STORLEK = 16;

function MetaRad({ delar }: { delar: (string | null)[] }) {
  const text = delar.filter(Boolean).join(' · ');
  if (!text) return null;
  // TRUNKERAS, precis som namnet ovan — och av samma skäl. Mätt före denna
  // rad: tio av elva rader låg på 99 px och EN på 116, eftersom
  // generatorradens "Byggs ur namn, e-post, betalning …" bröt till två
  // rader. Höjdlåsningen (Marcus 2026-08-17) håller bara om VARJE led är
  // ett svep; det räcker inte att låsa namnet.
  return (
    <span className="w-full min-w-0 truncate text-caption text-text-muted" title={text}>
      {text}
    </span>
  );
}

/**
 * Radens metadata-delar — EN källa, så event- och räckviddsläget aldrig
 * glider isär (de bar identiska men separata literal-listor före S107:s
 * fjärde QA-rond).
 *
 * ═══ VARFÖR "Klass:" ÄR BORTA, OCH VARFÖR DET INTE RÄCKTE ═══
 *
 * Marcus: *"Ta bort 'Klass:' framför 'Uppladdad:'"*. Raden löd
 * `Klass: Uppladdad · 0.0 MB · Uppladdad 17 aug. 2026 22:38`.
 *
 * Att bara stryka prefixet hade gett `Uppladdad · 0.0 MB · Uppladdad 17
 * aug.` — ordet TVÅ gånger, alltså sämre. Dokumentklassens egna värden är
 * `Uppladdad` · `Event-mallad` · `Person-genererad` (`AttachmentClass`), och
 * det första kolliderar med datumledets verb.
 *
 * Tre beslut, i tur och ordning:
 *
 *   1. KLASSEN VISAS BARA NÄR DEN SÄGER NÅGOT NYTT. `Uppladdad` är
 *      default-fallet och upprepar det datumledet redan säger — den utelämnas
 *      därför. `Event-mallad`/`Person-genererad`/`Okänd` bär äkta
 *      information och visas. Samma regel som segment-byggarens räknare
 *      ("N av M matchar" syns bara när filtret gör skillnad, `VariantD.tsx`).
 *   2. FILSTORLEKEN UTGÅR. `0.0 MB` är brus för varje fil under 50 kB, och
 *      Lotta fattar inget beslut på den. Den fanns för att den var lätt att
 *      visa, inte för att någon frågade efter den.
 *   3. DATUMET BÄR RADEN. Kvar står `Uppladdad 17 aug. 2026 22:38` — det
 *      enda meta-värdet som faktiskt skiljer två filer åt i en lista.
 *
 * "Okänd" behålls som ÄRLIG etikett (Gunilla-principen, TASK-147.12): den
 * betyder "backfillen kunde inte härleda den här raden", aldrig "vi vet men
 * visar det inte".
 */
function metaDelar(current: BilageRad['current']): (string | null)[] {
  const klass = current.dokumentklass;
  return [
    klass != null && klass !== AttachmentClass.UPPLADDAD ? klass : null,
    `Uppladdad ${DATUM_TID.format(new Date(current.skapad))}`,
  ];
}

/**
 * FÖRHANDSVISNINGS-/NEDLADDNINGS-IKONERNA (TASK-273.4) — se filhuvudets
 * IKONPAR-not för hela resonemanget (popup-blockerar-säkert mönster,
 * `download`-query-parameter-verifieringen mot staging, blob-URL-hantering
 * för klass B/C). Ren presentationskomponent: den faktiska hämt-/öppna-
 * logiken bor i `useForhandsvisaDokument`/`useLaddaNerDokument`
 * (`src/data/mutations/`, TASK-201.15s mutations-hemvist-grind — en
 * komponent-lokal `useMutation` hade fällt `mutation-hemvist-vakt.test.ts`).
 * Delad över alla tre dokumentklasser via `DokumentKalla`
 * (`src/data/mutations/dokumentKalla.ts`) — samma DRY-motiv den rivna
 * `GenereradPdfVisaKnapp`s docblock uttryckte, nu genomfört för alla tre i
 * stället för bara två.
 *
 * ═══ KNAPPFORMEN ÄR `primary`+`subtle` — RÖR DEN INTE TILL `ghost` ═══
 *
 * Detta är en ÅTERSTÄLLD fix, inte ett smakval, och den har rivits en gång
 * redan. Historiken, för den som frestas förenkla:
 *
 *   1. `3b592e8c` (TASK-147.6 varv 3) bytte den dåvarande Visa-knappen FRÅN
 *      `ghost` TILL `intent="primary" emphasis="subtle"` — på Marcus
 *      granskningsfynd. Skälet stod i klartext i den commitens docblock:
 *      `ghost`s hover-token (`--mm-button-ghost-bg-hover`) är
 *      `var(--mm-bg-muted)`, vilket är EXAKT samma färg som radgruppens egen
 *      bakgrund (`bg-bg-muted` på `grupp-kort`, se `DokumentLista` och
 *      `GemensamtLage` nedan). Hovern FANNS i CVA:n hela tiden — den var
 *      osynlig mot en identisk bakgrund.
 *   2. `b881fe64` (TASK-273.4) ersatte Visa-knappen med detta ikonpar och
 *      satte `intent="ghost"` — vilket återinförde exakt samma
 *      token-identitet, och därmed exakt samma osynliga hover.
 *   3. Marcus fångade den igen vid QA 273.5 steg 5 (2026-08-17):
 *      "de behöver alltså samma bakgrund som visa-knappen hade, samma hover
 *      också liksom". Samma defekt, andra ronden.
 *
 * INVARIANTEN, formulerad så den överlever nästa ombyggnad: en knapp som
 * sitter INUTI `grupp-kort` (`bg-bg-muted`) får aldrig bära `ghost`, för
 * `ghost`s hover ÄR `bg-bg-muted`. `subtle` är dessutom primitivens egen
 * deklarerade form för just denna ytklass ("tabellrader/toolbars, kompakt:
 * svag intent-tonad platta", `Button.tsx` § subtle) och tänder en kant i
 * intent-färgen under `prefers-contrast: more` — 11-golvet, som `ghost`
 * (transparent botten) inte kan ge här.
 */
function DokumentAtgardsKnappar({ namn, kalla }: { namn: string; kalla: DokumentKalla }) {
  const forhandsvisaMutation = useForhandsvisaDokument();

  return (
    <>
      <Button
        intent="primary"
        emphasis="subtle"
        size="sm"
        className={IKONKNAPP_KLASS}
        // `aria-disabled`, INTE `isDisabled`: ett native `disabled` tar
        // knappen ur tabordningen mitt i klicket. Vakten i onPress bär
        // dubbelklicks-skyddet i stället.
        aria-disabled={forhandsvisaMutation.isPending}
        aria-label={forhandsvisaMutation.isPending ? `Öppnar ${namn} …` : `Öppna ${namn}`}
        onPress={() => {
          if (forhandsvisaMutation.isPending) return;
          // KRITISKT: window.open MÅSTE anropas synkront här, före all
          // await/mutate-hantering — se filhuvudets IKONPAR-not.
          const handle = window.open('', '_blank');
          // [TILLÄGG, TASK-309.26 review-runda 1, AC #4] Samma delade
          // laddningssida som GenereringsVy.tsx — fönstret stod annars
          // tomt (about:blank) under hela hämtningen, samma "abrupt
          // tomt fönster"-defekt Marcus avvisade 22 aug för den andra
          // ytan. Se `useForhandsvisaDokument.ts`s docblock.
          skrivLaddningssida(handle, { titel: 'Öppnar dokument…', text: 'Öppnar dokument…' });
          forhandsvisaMutation.mutate({ kalla, handle });
        }}
      >
        {forhandsvisaMutation.isPending ? (
          <Loader2 aria-hidden="true" size={IKON_STORLEK} className="motion-safe:animate-spin" />
        ) : (
          <ExternalLink aria-hidden="true" size={IKON_STORLEK} />
        )}
      </Button>
      {forhandsvisaMutation.isError && (
        <MessageBox intent="error" title="Kunde inte öppna filen" className="max-w-56">
          {forhandsvisaMutation.error instanceof Error
            ? forhandsvisaMutation.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}
    </>
  );
}

/**
 * NEDLADDNINGEN ÄR RADENS ENDA ALLTID-SYNLIGA IKONKNAPP.
 *
 * Före S107:s fjärde QA-rond bar varje rad TRE kvadratiska ikonrutor
 * (`size-11 shrink-0 p-0`). Mönsterkartläggningen av appen visade att den
 * formen inte fanns någon annanstans i huset — samtliga träffar på den
 * klass-strängen låg i denna fil. Det var en lokal uppfinning, och Marcus
 * läste den som främmande ("dokumentsidan är skitdålig").
 *
 * Husets svar på radhandlingar är i stället att den PRIMÄRA handlingen är
 * hela raden (`HandlingsRad`-grammatiken). Förhandsvisningen är den
 * handlingen här; nedladdningen är den enda sekundära som Lotta gör ofta nog
 * att den ska stå framme. Ersätt/Radera är förvaltning och bor i sin egen
 * kolumn, se radernas egna kommentarer.
 */
/**
 * ═══ RADENS DELADE SKAL — EN FORM FÖR BÅDA LÄGENA ═══
 *
 * Eventläget och räckviddsläget renderade före S107:s fjärde QA-rond varsin
 * nästan identisk rad, med samma metadata-lista skriven två gånger. De hade
 * redan börjat glida isär. Skalet är därför delat KOD, inte delad
 * beskrivning — samma lärdom `HandlingsRad` bär i sitt eget huvud.
 *
 * Det enda som skiljer lägena är `handlingar`: eventläget skickar Ersätt för
 * event-egna filer, räckviddsläget skickar Ersätt + Radera. Nedladdningen
 * står alltid framme, och öppnandet är hela raden.
 *
 * ── VARFÖR HELA RADEN ÄR KLICKBAR ──
 *
 * Marcus dom 2026-08-17: *"dokumentsidan är skitdålig… Lotta kommer inte
 * gilla detta."* Mönsterkartläggningen gav orsaken: raden bar TRE
 * kvadratiska ikonrutor, och den formen fanns inte någon annanstans i appen
 * — samtliga träffar på `size-11 shrink-0 p-0` låg i denna fil. Huset löser
 * radhandlingar med att den primära handlingen ÄR raden (`PersonsList`,
 * `EventCard`, `HandlingsRad`), inte med en knappkolumn.
 *
 * Att öppna dokumentet är den handlingen. `after:absolute after:inset-0` på
 * öppna-knappen mot detta `relative`-skal är samma grepp `PersonsList`s
 * namn-Link använder; de sekundära knapparna lyfts över med `relative z-10`
 * så de förblir egna träffytor.
 *
 * ── HOVERN MÅSTE VARA `bg-bg-emphasized`, ALDRIG `bg-bg-muted` ──
 *
 * Kortet raden bor i bär `bg-bg-muted`. En hover i samma token hade varit
 * osynlig — exakt den felklass denna yta redan drabbats av tre gånger
 * (`ghost`-hovern två gånger, räckviddspillen en). `bg-bg-emphasized` är
 * husets nästa steg upp och det `HandlingsRad` självt använder.
 */
/**
 * ═══ RADENS FORM ÄR LÅST TILL TRE RADER (Marcus 2026-08-17) ═══
 *
 * *"vi måste se till att alla dokumentrader är lika höga, det måste vara:
 * Dokumentnamn / Täckning / Uppladdningsdatum PÅ ALLA rader, alltid."*
 *
 * Det är INTE ett nytt mönster — `PersonsList.tsx` bär redan samma
 * höjdlåsning ("varje rad renderas ALLTID, tomt fält får en osynlig
 * platshållare, aldrig villkorad rendering"). Raderna här var förut olika
 * höga beroende på om en badge fanns, om namnet radbröt och om
 * "+N äldre filer" behövdes; listan blev ojämn att skanna.
 *
 * TRE LED, ALLTID RENDERADE:
 *   1. namnet     — ETT svep, trunkerat (se nedan)
 *   2. täckningen — badge; event-egna får "Detta event" i stället för
 *                   ingenting (se `RackviddBadge`s egen not)
 *   3. datumet    — `Uppladdad <datum>`
 *
 * NAMNET TRUNKERAS I STÄLLET FÖR ATT RADBRYTA. `truncate` kräver `min-w-0`
 * på varje flex-förfader hela vägen upp, annars växer kolumnen i stället för
 * att klippa — därav `min-w-0` på både kolumnen och namn-spannet.
 *
 * HELA NAMNET NÅS PÅ TRE VÄGAR, och det behövs: `title` (pekare), knappens
 * `aria-label` (skärmläsare — den bär alltid hela namnet), och radens egen
 * `title`. KÄND KANT, medvetet accepterad: på TOUCH finns ingen hover, så
 * ett avklippt namn kan där inte läsas i sin helhet. Motvikten är att
 * verkliga filnamn är korta — demo-fixturen mäter 17–24 tecken mot
 * testsentinelernas 59 — och att trunkeringen är ett skyddsnät för
 * undantaget, inte normalfallet.
 *
 * "+N ÄLDRE FILER" FLYTTADE IN I DATUMLEDET. Den stod som en fjärde rad och
 * bröt låsningen för just de rader som hade dubbletter.
 *
 * ═══ [TASK-309.20] RADEN BRYTER NU VID 375 px NÄR FYRA IKONKNAPPAR INTE
 * FÅR PLATS — "skyddsnätet" höll inte för NORMALFALLET ═══
 *
 * Mätt (facit `s108-generering/facit-dokumentlista-inaktuell-rad-mobil.png`
 * + `s108-dokumentytan/facit-dokumentyta-rackviddslage-mobil.png`): en
 * Event-mallad rad med FYRA handlingar (Öppna/Ladda ner/Skapa om/Ersätt,
 * `IKONKNAPP_KLASS`s egen räkning: 4×44 px + 3×2 px = 182 px) trunkerade
 * "Bekräftelsebilaga.pdf" till "Bekr…" — fyra tecken, inte den 17–24-tecken-
 * normalen stycket ovan förutsätter. Orsaken är ARITMETISK, inte kosmetisk:
 * vid 375 px är radens tillgängliga bredd (mätt, `RAD_BOX`) 251 px; 182 px
 * ikonkolumn + 12 px mellanrum lämnar bara 57 px åt namnet — under
 * "skyddsnät för undantaget"-antagandet stycket ovan bygger på.
 *
 * FIXEN ÄR DEN REDAN DOKUMENTERADE PLANEN (`IKONKNAPP_KLASS`s docblock,
 * Marcus 2026-08-17): *"Skulle bredden ändå inte räcka på en smal skärm är
 * rätt svar att låta raden bryta, inte att krympa träffytan."* Namnkolumnen
 * bär nu `min-w-[12ch]` i stället för `min-w-0` (ETT golv, ingen ceiling —
 * kolumnen krymper fortfarande till EXAKT den bredd raden ger den så länge
 * båda får plats på en rad, precis som förut). Radens eget skal fick
 * `flex-wrap`: när ikonkolumnens (`shrink-0`, ingen tillåten krympning)
 * hypotetiska bredd + namnkolumnens 12ch-golv + mellanrummet överskrider
 * radens bredd, flyttar CSS-motorn ikonkolumnen till en EGEN rad under —
 * namnkolumnen står då ensam på sin rad och `flex-1` fyller HELA bredden
 * (251 px i det mätta fallet, gott om plats för "Bekräftelsebilaga.pdf" i
 * sin helhet). Vid gott om bredd (skrivbord, eller mobil med färre knappar)
 * händer ingenting nytt — vägen är oförändrad.
 *
 * DETTA BRYTER INTE höjdlåsningen ovan: samma facit-bild visar att rader
 * REDAN varierar i höjd med sitt innehåll (raden med tre badgar — Detta
 * event/Mall/Inaktuell — är synligt högre än syskonraderna med bara en).
 * Låsningen är ett GOLV (namn/täckning/datum renderas ALLTID, aldrig
 * kortare), inte ett tak — en rad får vara högre när den bär mer, och en
 * rad vars ikonkolumn bryter till en egen rad är samma sorts variation.
 * 12ch är ett MEDVETET, JUSTERBART golv (motsvarande knapparnas egna 44 px-
 * golv i princip, inte i magnitud) — inte en ny interaktionsform.
 */
function DokumentRadSkal({
  namn,
  kalla,
  current,
  dolda,
  handlingar,
}: {
  namn: string;
  kalla: DokumentKalla;
  current: BilageRad['current'];
  dolda: number;
  handlingar: React.ReactNode;
}) {
  return (
    <div data-testid="dokument-fil" className="flex flex-wrap items-start gap-3 py-3">
      <span className="flex min-w-[12ch] flex-1 flex-col items-start gap-1">
        <span className="w-full min-w-0 truncate font-medium text-body" title={namn}>
          {namn}
        </span>
        {/* [TASK-309.6, ADR-125 § 3+5] Mall-/INAKTUELL-badgen delar RADEN med
            RackviddBadge (samma "TRE LED, ALLTID RENDERADE"-lås, Marcus
            2026-08-17 — se filhuvudets docblock) i stället för att lägga till
            en fjärde rad. `current.mall`/`current.inaktuell` är `null` för
            varje icke-Event-mallad rad (uppladdade/person-genererade filer),
            så de allra flesta rader visar EXAKT samma två-badge-yta som
            förut. INAKTUELL bär TEXT, inte bara färg (`StatusBadge`,
            WCAG 1.4.1 — samma disciplin som RackviddBadge/nivåbadgar).

            [TASK-309.20] `w-full min-w-0` TILLAGT — utan dem sizear denna
            flex-wrap-rad sig efter sitt EGET innehåll (kolumnens
            `items-start` stretchar inte barn), så badgens tilldelade bredd
            var odefinierad och en enda för bred badge (`shrink-0`) flöt rakt
            ut över ikonknapparna i stället för att TRUNKERAS inom raden.
            Samma `w-full min-w-0`-par som namnspannet ovan bär redan, av
            samma skäl (`DokumentRadSkal`s docblock). Se `RackviddBadge.tsx`
            och `TACKNING_KLASS` för motsvarande fix på badgens egen sida. */}
        <span className="flex w-full min-w-0 flex-wrap items-center gap-1">
          <RackviddBadge
            rackvidd={current.rackvidd}
            kursfamilj={current.kursfamilj}
            kursniva={current.kursniva}
          />
          {current.mall !== null && <span className={TACKNING_KLASS}>{current.mall}</span>}
          {current.inaktuell === true && (
            <StatusBadge ton="warning" storlek="sm">
              Inaktuell
            </StatusBadge>
          )}
        </span>
        <MetaRad
          delar={[
            ...metaDelar(current),
            dolda > 0 ? `+${dolda} ${dolda === 1 ? 'äldre fil' : 'äldre filer'}` : null,
          ]}
        />
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <DokumentAtgardsKnappar namn={namn} kalla={kalla} />
        <LaddaNerKnapp namn={namn} kalla={kalla} />
        {handlingar}
      </span>
    </div>
  );
}

function LaddaNerKnapp({ namn, kalla }: { namn: string; kalla: DokumentKalla }) {
  const nedladdningMutation = useLaddaNerDokument();
  return (
    <>
      <Button
        intent="primary"
        emphasis="subtle"
        size="sm"
        className={IKONKNAPP_KLASS}
        aria-disabled={nedladdningMutation.isPending}
        aria-label={nedladdningMutation.isPending ? `Laddar ner ${namn} …` : `Ladda ner ${namn}`}
        onPress={() => {
          if (nedladdningMutation.isPending) return;
          nedladdningMutation.mutate({ kalla, namn });
        }}
      >
        {nedladdningMutation.isPending ? (
          <Loader2 aria-hidden="true" size={IKON_STORLEK} className="motion-safe:animate-spin" />
        ) : (
          <Download aria-hidden="true" size={IKON_STORLEK} />
        )}
      </Button>
      {nedladdningMutation.isError && (
        <MessageBox intent="error" title="Kunde inte ladda ner filen" className="max-w-56">
          {nedladdningMutation.error instanceof Error
            ? nedladdningMutation.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}
    </>
  );
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;
type ReplaceMutation = ReturnType<typeof useReplaceAttachment>;
type DeleteMutation = ReturnType<typeof useDeleteAttachment>;
type SkapaOmMutation = ReturnType<typeof useSkapaOmEventBilaga>;

/** [TASK-275.3] Sant för en GEMENSAM bilaga (räckvidd Kurstyp/Alla event) —
    delad mellan BilageRadRow (döljer Ersätt) och badgens eget "rendera
    inget"-villkor (RackviddBadge.tsx). */
function arGemensam(rackvidd: Attachment['rackvidd']): boolean {
  return rackvidd === AttachmentScope.KURSTYP || rackvidd === AttachmentScope.ALLA_EVENT;
}

function BilageRadRow({
  eventId,
  rad,
  onReplace,
  replaceMutation,
  skapaOmMutation,
}: {
  eventId: string;
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  skapaOmMutation: SkapaOmMutation;
}) {
  const { current, dolda } = rad;
  // Bara DENNA rads knapp visar "Ersätter…"/blir avstängd — inte hela
  // listan (till skillnad mot uppladdningsknappen längst ner, som stänger
  // av sig själv via sin egen `uploadMutation.isPending`). `variables`
  // finns bara medan mutationen faktiskt pågår (TanStack Query), så
  // jämförelsen är säker även innan första anropet.
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
  // [TASK-309.6] Samma "bara DENNA rads knapp"-disciplin som `ersatterDennaRaden`.
  const skaparOmDennaRaden =
    skapaOmMutation.isPending && skapaOmMutation.variables?.ersatt === current.id;
  // [TASK-275.3, ADR-118 beslut 3] Ersätt VISAS INTE i eventkontext för en
  // GEMENSAM bilaga — badgen bär förklaringen (AC #4). Servern nekar 403
  // ändå (delete-attachment/index.ts), men UI-lagret ska inte erbjuda en
  // knapp den vet kommer avvisas.
  const gemensam = arGemensam(current.rackvidd);
  // [TASK-309.6, ADR-125 § 3+4] "Skapa om" gäller BARA Event-mallade rader
  // med ett KÄNT `mall`-värde ('Bekräftelsebilaga'/'Deltagarinformation') —
  // `mallIdFranAirtableOption` returnerar `null` för allt annat (uppladdade
  // rader, okänt/legacy `mall`), och då finns inget att regenerera MOT.
  const skapaOmMallId =
    current.dokumentklass === AttachmentClass.EVENT_MALLAD
      ? mallIdFranAirtableOption(current.mall)
      : null;
  return (
    <DokumentRadSkal
      namn={current.namn}
      kalla={{ typ: 'bilaga', eventId, attachmentId: current.id }}
      current={current}
      dolda={dolda}
      handlingar={
        <>
          {skapaOmMallId !== null && (
            <Button
              intent="primary"
              emphasis="subtle"
              size="sm"
              className={IKONKNAPP_KLASS}
              aria-disabled={skaparOmDennaRaden}
              aria-label={
                skaparOmDennaRaden ? `Skapar om ${current.namn} …` : `Skapa om ${current.namn}`
              }
              onPress={() => {
                if (skaparOmDennaRaden) return;
                skapaOmMutation.mutate({ mall: skapaOmMallId, ersatt: current.id });
              }}
            >
              {skaparOmDennaRaden ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <RefreshCw aria-hidden="true" size={IKON_STORLEK} />
              )}
            </Button>
          )}
          {/* [TASK-275.3, ADR-118 beslut 3] Ersätt VISAS INTE i eventkontext
              för en GEMENSAM bilaga — badgen bär förklaringen (AC #4).
              Servern nekar 403 ändå, men UI-lagret ska inte erbjuda en knapp
              den vet avvisas.

              För eventets EGNA filer står den kvar (Marcus-beslut
              2026-08-17): förvaltningen flyttades i övrigt till
              räckviddsläget, men en event-egen fil syns inte där, så utan
              denna knapp hade den saknat ersätt-väg helt. */}
          {!gemensam && (
            <FileTrigger
              acceptedFileTypes={['application/pdf']}
              onSelect={(files) =>
                onReplace(files, current.id, {
                  rackvidd: current.rackvidd ?? undefined,
                  kursfamilj: current.kursfamilj ?? undefined,
                  kursniva: current.kursniva ?? undefined,
                })
              }
            >
              <Button
                intent="primary"
                emphasis="subtle"
                size="sm"
                className={IKONKNAPP_KLASS}
                isDisabled={ersatterDennaRaden}
                aria-label={
                  ersatterDennaRaden ? `Ersätter ${current.namn} …` : `Ersätt ${current.namn}`
                }
              >
                {ersatterDennaRaden ? (
                  <Loader2
                    aria-hidden="true"
                    size={IKON_STORLEK}
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <FileUp aria-hidden="true" size={IKON_STORLEK} />
                )}
              </Button>
            </FileTrigger>
          )}
        </>
      }
    />
  );
}

/**
 * [HISTORIK, kravet gäller INTE längre] `relative` var ett hårt krav på
 * dessa rader så länge öppna-knappen bar `after:absolute after:inset-0`
 * (radklick-greppet). Det greppet är rivet på Marcus order — förhandsvisning
 * är en vanlig ikonknapp igen — så raden behöver inget `relative`.
 *
 * Noten står kvar för att buggen var dyr och lätt att återinföra: den
 *
 * uppstår i samma sekund någon återinför ett `after:inset-0`-grepp här.
 * Ett absolut positionerat element mäts mot
 * närmaste POSITIONERADE förfader — saknar raden `relative` klättrar
 * `after`-lagret uppåt i trädet och lägger sig som en osynlig klickfälla
 * över allt det förfadern täcker. Mätt utfall: uppladdningsflödets
 * radioknappar gick inte att klicka, eftersom mall-radens `after` låg över
 * dem. Playwright-felet var ordagrant "…button… intercepts pointer events".
 *
 * Bilagerader får sitt `relative` av `DokumentRadSkal`. Mall- och
 * generatorrader har egen struktur (ingen räckviddsbadge, ingen
 * ersätt-handling) och måste därför bära det själva. Tar du bort `relative`
 * här återuppstår buggen tyst — den syns inte i något statiskt test, bara
 * när någon försöker klicka på något annat på sidan.
 *
 * [ÄNDRAD, TASK-309.8] `MallRad`s handlingsyta bar tidigare SAMMA
 * `DokumentAtgardsKnappar`+`LaddaNerKnapp`-par som `GeneratorRad` (nedan)
 * fortfarande bär — förhandsvisning/nedladdning av en transient PDF via
 * `previewEventTemplate`. Den vägen var HÅRDKODAD till `'deltagarinfo'`
 * (`dokumentKalla.ts`s enda mall var just den), vilket hade förhandsvisat
 * FEL innehåll för den nytillkomna `'bekraftelse'`-posten (`MALLAR` ovan).
 * Genereringsvyn (`GenereringsVy.tsx`) äger nu BÅDA jobben för en mall —
 * "Förhandsgranska först" och "Skapa" — så mall-radens knapp blir en enda
 * ENTRÉ dit i stället för en andra, felkopplad, preview-väg. `typ: 'mall'`
 * (den gamla `DokumentKalla`-varianten) är därför riven, se
 * `dokumentKalla.ts`s filhuvud. `GeneratorRad` (kvitto) är OFÖRÄNDRAD —
 * den har ingen genereringsvy att peka mot (TASK-147.7, obyggd).
 */
function MallRad({ mall }: { mall: Mall }) {
  // nuqs-paret genereringsvyn läser i `dokument.tsx`s routekomponent
  // (`vy`/`mall`) — samma nycklar, ingen prop-borrning: `DokumentYta` och
  // `GenereringsVy` är syskon under samma route, precis som prototypens
  // egen dispatcher (`GenereringsPrototyp`, riven) läste dem lokalt.
  const [, setVy] = useQueryState('vy');
  const [, setMall] = useQueryState('mall');
  return (
    <div data-testid="dokument-mall" className="flex items-center gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full min-w-0 truncate font-medium text-body" title={mall.namn}>
          {mall.namn}
        </span>
        {/* SAMMA TRE LED SOM BILAGERADEN (namn / täckning / detalj), så
            höjdlåsningen håller genom hela listan — inte bara för bilagor.
            En mall genereras ur DETTA events data och gäller därför bara
            det; `TACKNING_KLASS` är samma pill-sträng `RackviddBadge` bär,
            delad som konstant så de två aldrig glider isär. */}
        <span className={TACKNING_KLASS}>Detta event</span>
        <MetaRad delar={[`Fyller i ${mall.fyllerI.join(', ').toLowerCase()}`]} />
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <Button
          intent="primary"
          emphasis="subtle"
          size="sm"
          className={IKONKNAPP_KLASS}
          aria-label={`Skapa ${mall.namn}`}
          onPress={() => {
            void setMall(mall.id);
            void setVy('generering');
          }}
        >
          <ChevronRight aria-hidden="true" size={IKON_STORLEK} />
        </Button>
      </span>
    </div>
  );
}

/** Samma `relative`-krav som `MallRad` ovan — se dess docblock. */
function GeneratorRad({ gen, eventId }: { gen: Generator; eventId: string }) {
  return (
    <div data-testid="dokument-generator" className="flex items-center gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full min-w-0 truncate font-medium text-body" title={gen.namn}>
          {gen.namn}
        </span>
        <span className={TACKNING_KLASS}>Detta event</span>
        <MetaRad delar={[`Byggs ur ${gen.byggsUr.join(', ').toLowerCase()}`]} />
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <DokumentAtgardsKnappar namn={gen.namn} kalla={{ typ: 'generator', eventId }} />
        <LaddaNerKnapp namn={gen.namn} kalla={{ typ: 'generator', eventId }} />
      </span>
    </div>
  );
}

function UppladdningsFel({ uploadMutation }: { uploadMutation: UploadMutation }) {
  if (!uploadMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ladda upp filen">
      {uploadMutation.error instanceof Error
        ? uploadMutation.error.message
        : 'Inget felmeddelande angavs.'}
    </MessageBox>
  );
}

/** Speglar `UppladdningsFel` — egen felruta för "Ersätt" (TASK-147.11), eget
 * felmeddelande (kan skilja på "vilket steg som föll", se
 * `useReplaceAttachment.ts`). */
function ErsattningsFel({ replaceMutation }: { replaceMutation: ReplaceMutation }) {
  if (!replaceMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ersätta filen">
      {replaceMutation.error instanceof Error
        ? replaceMutation.error.message
        : 'Inget felmeddelande angavs.'}
    </MessageBox>
  );
}

type ListaTyp = 'alla' | 'bilaga' | 'mall' | 'generator';

const LISTA_FILTER: { key: ListaTyp; label: string }[] = [
  { key: 'alla', label: 'Alla' },
  { key: 'bilaga', label: 'Bilagor' },
  { key: 'mall', label: 'Mallar' },
  { key: 'generator', label: 'Generatorer' },
];

/**
 * DOKUMENT-LISTAN — den ENDA formen (Marcus-GO, filhuvudets "FORMEN ÄR LÅST
 * TILL EN LISTA"-not), inte längre en av två växlingsbara varianter. En
 * flat, filtrerbar lista: typ-chipsen filtrerar klient-sidigt över samma
 * `rader`/mallar/generatorer som tidigare — ingen ny data.
 *
 * FILTERRADEN (uppdraget: "husets uppdelade filterrad, historik-sidans
 * mönster") — `ToggleButtonGroup` med `spread` (likbredds-läge, ADR-044) på
 * EGEN rad ovanför listan, samma disciplin som `AktivitetsHistorik.tsx`
 * § `FilterRad`s tidsperiod-toggel: `min-h-11` per pill håller 44 px-
 * touch-target-golvet (samma filens kommentar: "`size='sm'` ensamt gav
 * 37 px, under golvet").
 *
 * TYPFILTRETS DATAGRUND: `ListaTyp`/`LISTA_FILTER` filtrerar i dag bara på
 * VILKEN LISTA en rad kommer från (bilagor/mallar/generatorer) — inom
 * "Bilagor" finns ingen verklig klass-uppdelning ännu (Fynd 1, filhuvudet).
 * TASK-147.12 kopplar in den verkliga klassen; denna filterrad ändras inte
 * strukturellt den dagen, bara vad "Bilagor" i praktiken innehåller.
 */
function DokumentLista({
  eventId,
  rader,
  onReplace,
  replaceMutation,
}: {
  eventId: string;
  rader: BilageRad[];
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
}) {
  // [TASK-309.6] "Skapa om" (AC #4) — EN mutation-instans för HELA listan,
  // samma "bara denna rads knapp lyser"-mönster som `replaceMutation`
  // (`skaparOmDennaRaden` i `BilageRadRow`). Instansierad HÄR (inte lyft upp
  // till `DokumentYta`): denna komponent har redan ett GARANTERAT
  // non-null `eventId: string` — `DokumentYta`s eget `eventId` är
  // `string | null` (räckviddsläget), och "Skapa om" existerar strukturellt
  // inte där (Event-mallade rader visas aldrig i `GemensamtLage`, se
  // `AirtableAdapter.berikaMedInaktuell` § docblock).
  const skapaOmMutation = useSkapaOmEventBilaga(eventId);
  const [filter, setFilter] = useQueryState('typ');
  const aktivtFilter: ListaTyp =
    filter === 'bilaga' || filter === 'mall' || filter === 'generator' ? filter : 'alla';

  const visaBilagor = aktivtFilter === 'alla' || aktivtFilter === 'bilaga';
  const visaMallar = aktivtFilter === 'alla' || aktivtFilter === 'mall';
  const visaGeneratorer = aktivtFilter === 'alla' || aktivtFilter === 'generator';

  // `antalSynliga` — se `berakaListgeometri`s eget docblock. Rullning/
  // tabb-stopp styrs av det FILTRERADE antalet (regel 3); höjdlåsningen
  // (runda 2) är sedan review-fynd 1 OVILLKORAD (se `useLastaListhojd`s
  // filhuvud) — `totaltAntal` fyllde bara `lasHojd`s (rivna) villkor och
  // är därför riven med det, inte en kvarglömd variabel.
  const antalSynliga =
    (visaBilagor ? rader.length : 0) +
    (visaMallar ? MALLAR.length : 0) +
    (visaGeneratorer ? GENERATORER.length : 0);
  const { kanRulla, sistaRadenBarLinje } = berakaListgeometri(antalSynliga);

  // [TASK-309.24] `useLastaListhojd`s TVÅ förtroendenivåer (källprioritet;
  // se hookens filhuvud för den TREDJE axeln, precisionsnivån 1/2/3).
  //
  // ═══ 'bilaga' FÖRETRÄDS FRAMFÖR 'alla' — MÄTT, INTE ANTAGET ═══
  //
  // Båda filtren visar bilagornas första `LISTA_SYNLIGA_RADER` rader
  // BYTE-FÖR-BYTE identiskt (bilagor står alltid FÖRST i den kanoniska
  // ordningen) — men EN RADS RENDERADE HÖJD BEROR PÅ HUR MÅNGA SYSKON DEN
  // HAR, inte bara på sitt eget innehåll. Diagnos (TASK-309.24, fyra
  // bilagor + tre statiska rader = sju totalt): rad 4 mätte 99 px när sju
  // rader låg i DOM men 98 px när bara fyra gjorde det — SAMMA rad, SAMMA
  // props, en hel pixels skillnad, ren layout-avrundning fördelad över
  // hela flödet. En höjd mätt i 'alla' (sju rader) och sedan applicerad på
  // 'bilaga' (fyra rader) missar därför sin egen `scrollHeight ===
  // clientHeight`-invariant med exakt den differensen — precis den
  // 1 px-scroll-bugg AC #5 finns för att fånga.
  //
  // `foretradesMatbar` — 'bilaga' NÄR den kan leverera minst fyra egna
  // rader (`rader.length >= LISTA_SYNLIGA_RADER`): det är den kontext
  // AC #2:s exakt-fyra-krav faktiskt prövas i.
  //
  // `reservMatbar` — 'alla', OVILLKORAT (inte bara "när bilaga inte kan").
  // Sidan öppnas alltid i 'alla' (default), så utan en reservkälla som
  // gäller REDAN vid första renderingen hade den första visningen —
  // innan Lotta rört filterraden — saknat låst höjd helt (mätt: exakt
  // detta hände när villkoret var `aktivtFilter === 'alla' &&
  // !bilagaKanMataExakt`, eftersom `bilagaKanMataExakt` redan är sant vid
  // FÖRSTA renderingen om eventet har ≥ 4 bilagor). Hookens egen
  // `harForetradesMatt`-spärr gör reservkällan ofarlig: den skriver bara
  // förrän 'bilaga' väl mätt en gång, aldrig efter. `antalSynliga`
  // skickas som `antalRiktigaRader` — 'alla' med 0 bilagor visar ändå
  // `MALLAR.length + GENERATORER.length === 3` riktiga rader, så
  // `bilaga`-filtrets EGEN 0-rader-fallback (nivå 3) aldrig blir den FÖRSTA
  // mätningen i komponentens liv.
  const bilagaKanMataExakt = rader.length >= LISTA_SYNLIGA_RADER;
  const { listRef, hojd: matadHojd } = useLastaListhojd(
    aktivtFilter === 'bilaga' && bilagaKanMataExakt,
    aktivtFilter === 'alla',
    antalSynliga,
    rader,
  );

  return (
    // ═══ UPPLADDNINGEN FÖRST, LISTAN SEDAN (Marcus 2026-08-17) ═══
    //
    // Ordningen var omvänd: filterrad → lista → uppladdning. För att ladda
    // upp en fil fick Lotta skrolla förbi hela dokumentlistan, vars längd vi
    // inte styr. Marcus: *"man måste ju SE ladda upp sektionen"* — och på
    // frågan vad Lotta gör oftast: *"Tror hon kommer ladda upp mest"*.
    //
    // Den vanligaste handlingen ligger nu överst. Infällning av listan
    // övervägdes och valdes BORT: huset använder `Disclosure` enbart för
    // filterpaneler (`EventsList.tsx`), aldrig för innehållslistor, och en
    // infälld lista hade dolt symptomet i stället för att flytta orsaken.
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        {/* INGEN RUBRIK I KORTET — BESLUTAD BORT, INTE TAPPAD (Marcus,
            QA 273.5 steg 5, 2026-08-18: *"Ta bort rubriken 'Dokument för
            eventet' i eventläget … Man ser ju vad de olika ytorna är för
            något ändå."*).

            Rubriken flyttades in i kortet 2026-08-17 och togs bort dagen
            därpå: `<h1>Dokument` står redan i sidhuvudet och `EventValjare`
            direkt ovanför visar VILKET event listan gäller, så en `<h2>` som
            upprepar båda tillförde ingenting. Återinför den inte utan att
            först fråga.

            `<section>` behåller sin tagg men står nu UTAN `aria-labelledby`
            — husets etablerade form för sektioner utan egen rubrik
            (`Waitlist.tsx`, `Hem.tsx`, `InstalleraAppen.tsx`). En namnlös
            `section` exponeras per spec inte som landmark, vilket är rätt:
            den ÄR inte en självständig region. En `sr-only`-rubrik övervägdes
            och valdes bort — huset har ingen sådan, och en osynlig rubrik som
            säger det synliga redan säger är brus för skärmläsaren, inte
            hjälp. */}
        <div
          data-testid="grupp-kort"
          className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
        >
          {/* FILTRET BOR I KORTET, ÖVERST (Marcus-granskning 2026-08-17,
              eventläget). Det stod förut UTANFÖR kortet; ordningen är nu
              filter → lista inuti samma block — säg hur listan kan smalnas
              av, sedan innehållet. Rubriksteget däremellan utgick 2026-08-18
              (se sektionskommentaren ovan). */}
          <ToggleButtonGroup
            label="Filtrera på typ"
            spread
            selectedKey={aktivtFilter}
            onSelectionChange={(key) => void setFilter(key === 'alla' ? null : key)}
          >
            {LISTA_FILTER.map((f) => (
              <ToggleButton key={f.key} id={f.key} size="sm" className="min-h-11">
                {f.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {/* ═══ LISTAN ÄR EN EGEN YTA: `bg-surface` MOT KORTETS `bg-bg-muted` ═══
              Marcus 2026-08-18: *"vi behöver ge inline-scroll-ytan en annan
              färg/toning och skapa lite luft mellan toggle-valen och själva
              listan."*

              TOKENVALET ÄR PÅTVINGAT, INTE SMAK. Kortet ÄR `bg-bg-muted`
              (`--p-neutral-50`), så en lista med samma token hade varit
              OSYNLIG — exakt den felklass denna yta drabbats av FEM gånger
              (ghost-hovern ×2, Ersätt/Radera, räckviddspillen,
              uppladdningsskalet; se filhuvudets systemiska fynd). Nästlingen
              avgör: muted skal, surface innehåll — samma ordning som
              `StegSektion` bar i uppladdningsblocket och som `HandlingsRadKort`
              följer.

              `px-3` på listan eftersom raderna bara bär vertikal padding
              (`DokumentRadSkal`: `py-3`) och tidigare ärvde kortets `px-4`.
              `pr-3` ur rull-klasserna utgick i samma veva — `px-3` täcker
              högersidan, och `scrollbar-inline` reserverar redan plats för
              rullningslisten via `scrollbar-gutter: stable`.

              `contrast-more:border-border-strong` speglar kortets egen rad:
              under `prefers-contrast: more` räcker inte en vit yta mot en grå
              för att skilja dem åt.

              LUFTEN mellan filterraden och listan bärs av kortets `gap-3`
              (var `gap-2`).

              KORTETS PADDING ÄR SYMMETRISK (`p-4`, var `px-4 py-3`) — Marcus
              fångade asymmetrin så fort listan fick egen yta: *"den grå ramen
              ser bredare ut på sidorna än vad den är över och under"*. 16 px
              horisontellt mot 12 px vertikalt syntes inte så länge listan
              delade kortets bakgrund; med en egen yta blev kortets padding en
              synlig RAM, och en ram ska vara lika bred runtom. Mätt efter
              ändringen: vänster 17 · höger 17 · under 17 px (16 padding + 1 px
              genomskinlig kant).

              INLINE-RULLNING — husets etablerade form (Marcus 2026-08-18:
              *"vi gör dokumentlistan till en inline-scroll lista, det har vi
              många i appen"*, verifierat: `NyaAnmalningar.tsx`,
              `ForfallnaBetalningar.tsx` ×3, `Deltagare.tsx`, `EventValjare`s
              listbox). Klasserna är kopierade ur den formen, inte uppfunna.

              TABB-STOPPET SÄTTS BARA NÄR LISTAN FAKTISKT RULLAR — ärvt ur
              `Deltagare.tsx`s förfining: *"ett fokuserbart område utan
              funktion vore ett tomt stopp i tangentbordsflödet"*. När den
              rullar är `tabIndex={0}` däremot ett WCAG 2.1.1-golv (axe
              `scrollable-region-focusable`): raderna har egna knappar, men
              själva rullningen måste gå att nå med tangentbord.

              ANTALET RÄKNAS UR DET FAKTISKT RENDERADE, inte ur `rader.length`
              — typfiltret döljer hela grupper, och en lista som filtrerats ner
              till två poster ska inte bära ett tomt tabb-stopp. */}
          {/* `<ul>`/`<li>`, INTE `<div>` — och det är ett a11y-krav, inte
              smak. `aria-label` stöds inte av en rollös `<div>` (biome
              `useAriaPropsSupportedByRole` fällde exakt det, mätt 2026-08-18);
              listrollen bär namnet. Det är dessutom husets form för samma sak
              (`NyaAnmalningar.tsx`, `Deltagare.tsx`). `divide-y` opererar på
              direkta barn, så avdelarna följer `<li>`-elementen oförändrat. */}
          <ul
            ref={listRef}
            data-testid="dokument-lista"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningar.tsx.
            tabIndex={kanRulla ? 0 : undefined}
            aria-label={kanRulla ? 'Dokument' : undefined}
            // [TASK-309.24] Höjden är en MÄTNING (`useLastaListhojd`), inte
            // ett hårdkodat px-tal — se hookens docblock. `matadHojd` kan
            // vara `null` under en enda synkron render-cykel innan
            // `useLayoutEffect` hunnit mäta (ingen synlig flimmer, samma
            // "mät efter commit, applicera före paint"-garanti React ger
            // `useLayoutEffect`); listan visar då sin NATURLIGA höjd, vilket
            // är exakt vad mätningen själv behöver läsa av. Låsningen (runda
            // 2) är OVILLKORAD — inget `lasHojd`-fält kvar, se
            // `berakaListgeometri`s docblock.
            style={matadHojd !== null ? { height: matadHojd, maxHeight: matadHojd } : undefined}
            className={`focus-ring-inset scrollbar-inline divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:divide-border-strong contrast-more:border-border-strong ${
              kanRulla ? 'overflow-y-auto' : 'overflow-y-hidden'
            } ${
              sistaRadenBarLinje
                ? '[&>li:last-child]:border-border [&>li:last-child]:border-b contrast-more:[&>li:last-child]:border-border-strong'
                : ''
            }`}
          >
            {visaBilagor &&
              rader.map((r) => (
                <li key={r.current.id}>
                  <BilageRadRow
                    eventId={eventId}
                    rad={r}
                    onReplace={onReplace}
                    replaceMutation={replaceMutation}
                    skapaOmMutation={skapaOmMutation}
                  />
                </li>
              ))}
            {visaMallar &&
              MALLAR.map((m) => (
                <li key={m.id}>
                  <MallRad mall={m} />
                </li>
              ))}
            {visaGeneratorer &&
              GENERATORER.map((g) => (
                <li key={g.id}>
                  <GeneratorRad gen={g} eventId={eventId} />
                </li>
              ))}
            {visaBilagor && rader.length === 0 && !visaMallar && !visaGeneratorer && (
              <li className="py-3 text-small text-text-muted">
                Inga bilagor för det här eventet än.
              </li>
            )}
          </ul>
          {/* INGEN INGÅNG TILL FÖRVALTNINGSLÄGET HÄR — den bor i väljaren
              (se `DokumentYta`s kommentar vid `EventValjare`). Knappen
              "Visa gemensamma dokument" stod här ett dygn, flyttad hit
              2026-08-17 från platsen under eventväljaren; 2026-08-18 revs
              den helt när Marcus såg att den kolliderade med typfiltrets
              "Alla" och att dess etikett var osann. Bygg inte tillbaka den —
              varken här eller ovanför listan. */}
        </div>

        <ErsattningsFel replaceMutation={replaceMutation} />
      </section>
    </div>
  );
}

/**
 * RÄCKVIDDSFRÅGAN — FILEN FÖRST, SPRIDNINGEN SEDAN (Marcus 2026-08-18).
 *
 * Ersätter `UppladdningsFlode`: ett permanent tvåstegs-block på sidan
 * ("Steg 1: Vilka event ska filen gälla?" → "Steg 2: Välj fil"). Marcus dom
 * öppnade omtaget: *"när Lotta trycker på dokument i mer-vyn så kommer hon
 * till denna sida och då ska det vara SJÄLVKLART vad hon kan göra här och
 * vad sidan handlar om."*
 *
 * ═══ VARFÖR ORDNINGEN VÄNDES, INTE BARA GÖMDES ═══
 *
 * Blocket frågade om filens SPRIDNING innan den fanns. Lotta tänker tvärtom:
 * hon har en PDF och undrar vart den ska. Att fälla in samma formulär bakom
 * en knapp hade dolt symptomet — en yta full av formulär — utan att röra
 * orsaken. Nu bär sidan en knapp; frågan ställs när det finns något att
 * svara på, och FILNAMNET står i dialogen så svaret gäller något konkret.
 *
 * ═══ VAD SOM BEVARADES ORÖRT ═══
 *
 * Räckviddsvalets FORM och VÄRDEN är oförändrade sedan TASK-275.3/ADR-118:
 * husets `RadioGroup`/`Radio` + `Select`, `hideLabel` på båda selectarna,
 * "En familj" (aldrig "En eventtyp" — se nedan), `stegEtikett` som rent
 * presentationslager över basvärdena, och valideringen som håller Kurstyp
 * utan familj ogiltig. Det som bytte är VAR frågan ställs, inte VAD den
 * frågar — så api-staging-sviterna och basens `Räckvidd`-optioner är
 * opåverkade.
 *
 * "Detta event" är `isDisabled` när `!harEvent` (förvaltningsläget har inget
 * event att koppla mot); startvärdet väljs DÄRFÖR olika — en avstängd men
 * förvald radioknapp hade lämnat dialogen utan giltigt val.
 *
 * DIALOGEN GÅR INTE ATT STÄNGA AV MISSTAG UNDER PÅGÅENDE UPPLADDNING
 * (`isDismissable`/`isKeyboardDismissDisabled` speglar `isPending`): ett
 * klick utanför mitt i en flerhundra-kB-uppladdning hade sett ut som en
 * avbruten uppladdning utan att vara det — mutationen kör vidare oavsett.
 */
function RackviddsDialog({
  filer,
  harEvent,
  uploadMutation,
  onStang,
  onUpload,
}: {
  filer: FileList;
  harEvent: boolean;
  uploadMutation: UploadMutation;
  onStang: () => void;
  onUpload: (files: FileList | null, scope: UploadScopeVal, onKlart?: () => void) => void;
}) {
  const [rackvidd, setRackvidd] = useState<AttachmentScopeValue>(
    harEvent ? AttachmentScope.EVENT : AttachmentScope.KURSTYP,
  );
  const [kursfamilj, setKursfamilj] = useState<string | null>(null);
  const [kursniva, setKursniva] = useState<string | null>(null);

  const kursfamiljHarNivaer = kursfamilj != null && KURSFAMILJ_MED_NIVAER.has(kursfamilj);
  const scopeGiltig = rackvidd !== AttachmentScope.KURSTYP || kursfamilj != null;
  const laddarUpp = uploadMutation.isPending;
  const filnamn = filer.item(0)?.name ?? 'Filen';

  return (
    <Modal
      isOpen
      isDismissable={!laddarUpp}
      isKeyboardDismissDisabled={laddarUpp}
      onOpenChange={(open) => {
        if (!open) onStang();
      }}
    >
      {/* `close` ur Dialogs render-prop används MEDVETET inte: overlayen är
          fristående monterad (`isOpen` utan `DialogTrigger`, samma form som
          `Hem.tsx`), så stängningen ägs av `onStang` i alla tre vägarna —
          Avbryt, Escape/utanförklick och lyckad uppladdning. En blandning av
          två stängningsmekanismer hade gjort det oklart vilken som gäller. */}
      <Dialog
        title="Vad ska filen gälla?"
        size="md"
        aria-description="Välj om filen gäller det valda eventet, en hel familj eller alla event."
      >
        <div className="flex flex-col gap-4">
          {/* FILNAMNET ÄR EGEN RAD, INTE INBAKAT I RUBRIKEN. En rubrik som
              växer med filnamnet bryter dialogens geometri vid långa namn;
              här kan raden trunkera fritt, och `title` bär hela namnet för
              den som behöver läsa det. */}
          <p className="min-w-0 truncate text-body text-text-secondary" title={filnamn}>
            {filnamn}
          </p>

          {/* `hideLabel` — INTE borttagen etikett (Marcus: "Ta bort
              underrubriken Räckvidd, behövs inte" · "rubriken Familj till
              dropdownlistan kan tas bort"). Primitiven gör då `label` till
              `aria-label`, så skärmläsaren behåller ett namn på kontrollen
              medan ögat slipper en rubrik det inte behöver. Dialogens egen
              rubrik ställer redan frågan gruppen svarar på. */}
          <RadioGroup
            label="Räckvidd"
            hideLabel
            orientation="horizontal"
            value={rackvidd}
            onChange={(value) => {
              const next = value as AttachmentScopeValue;
              setRackvidd(next);
              if (next !== AttachmentScope.KURSTYP) {
                setKursfamilj(null);
                setKursniva(null);
              }
            }}
          >
            <Radio value={AttachmentScope.EVENT} isDisabled={!harEvent}>
              Detta event
            </Radio>
            {/* "En familj" — INTE "En eventtyp". `Eventtyp` är upptaget av ett
                ANNAT begrepp på tre ställen samtidigt: ORDLISTA.md § Eventtyp
                (= Utbildning/Föreläsning), `CreateEventForm.tsx`s egen
                `label="Eventtyp"` för samma sak, och Airtable-fältet `Eventtyp`
                (länken till Eventformat). Etiketten här följer i stället
                Select:en nedan, som heter "Familj". VÄRDET som skickas är
                oförändrat `AttachmentScope.KURSTYP` = strängen 'Kurstyp' —
                basens optionsnamn i fältet `Räckvidd`, som INTE får bytas
                härifrån (datakällans kontrakt, se ADR-118). */}
            <Radio value={AttachmentScope.KURSTYP}>En familj</Radio>
            <Radio value={AttachmentScope.ALLA_EVENT}>Alla event</Radio>
          </RadioGroup>

          {/* TASK-309.23 — RAD-HÖJDEN ÄR LÅST, INTE VILLKORAD (Marcus
              prod-röktest 2026-08-26: *"rutan aldrig ändrar storlek och
              läge vad jag än väljer eller trycker på"*). Raden renderades
              tidigare bara när `rackvidd === KURSTYP`, vilket gjorde
              dialogens höjd — och därmed dess VERTIKALT CENTRERADE läge
              (`Modal`s overlay är `items-center`) — en funktion av
              räckviddsvalet: ett hopp varje gång Lotta bytte radioknapp.

              SAMMA "RESERVERA ALLTID PLATS"-TEKNIK som husets `Pill dold`
              (`PersonsList.tsx`, Marcus S103) och breddlåset i
              `EventCheckin.tsx`: raden RENDERAS ALLTID, döljs med
              `invisible` (kvar i layouten, osynlig) + native `inert`
              (React 19-attribut, https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)
              när räckvidden inte är Kurstyp. `inert` gör HELA underträdet
              icke-fokuserbart och tar bort det ur tillgänglighetsträdet i
              en sats — starkare golv än `tabIndex={-1}` satt per kontroll,
              som måste upprepas för varje ny kontroll i raden och lätt
              glöms. `invisible` sköter den visuella döljningen ensam;
              `inert` är fokus-/AT-spärren.

              STEG-SELECTEN BÄR SAMMA TEKNIK, EN NIVÅ NER. Den var tidigare
              en egen villkorad rendering (`kursfamiljHarNivaer && …`) inuti
              den redan villkorade raden — utan att den ALLTID renderas
              (bara osynliggörs) hade en nivåbärande familj (RIM) fått en
              annan radhöjd vid `sm:`s kolumn-layout (375 px: `flex-col`
              STAPLAR de två selecten, så en andra select adderar höjd) än
              en nivålös familj (Fjärrskådning) eller ingen familj alls —
              exakt samma felklass som räckviddsraden, en nivå ner. */}
          <div
            className={`flex flex-col gap-2 sm:flex-row sm:items-start ${
              rackvidd === AttachmentScope.KURSTYP ? '' : 'invisible'
            }`}
            inert={rackvidd !== AttachmentScope.KURSTYP}
          >
            <Select
              label="Familj"
              hideLabel
              placeholder="Välj familj"
              selectedKey={kursfamilj}
              onSelectionChange={(key) => {
                setKursfamilj(key == null ? null : String(key));
                setKursniva(null);
              }}
              className="sm:max-w-56"
            >
              {KURSFAMILJ_VALUES.map((v) => (
                <SelectItem key={v} id={v}>
                  {v}
                </SelectItem>
              ))}
            </Select>
            <div
              className={`sm:max-w-56 ${kursfamiljHarNivaer ? '' : 'invisible'}`}
              inert={!kursfamiljHarNivaer}
            >
              <Select
                label="Steg"
                hideLabel
                placeholder="Alla steg"
                selectedKey={kursniva}
                onSelectionChange={(key) => setKursniva(key == null ? null : String(key))}
              >
                {/* `id` är basvärdet ('Nivå 1'), texten är presentationen
                    ('Steg 1'). Det som skickas till EF:en är därför
                    oförändrat — se nivaSprak.ts. */}
                {KURSNIVA_VALUES.map((v) => (
                  <SelectItem key={v} id={v}>
                    {stegEtikett(v)}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {/* LEDTEXTEN SÄGER VAD SOM SAKNAS, knappens `isDisabled` är grinden
              — de ska inte förväxlas. Samma disciplin som steg 2:s
              vilo-tillstånd bar innan blocket revs: en avstängd knapp säger
              "nej" utan att säga varför.

              [TASK-309.23] SAMMA RESERVERA-PLATS-TEKNIK som raden ovan:
              meddelandet togglade tidigare hela sin rad in och ut
              (`!scopeGiltig && <p>…</p>`), vilket gav ÄNNU en höjdskillnad
              — denna gången mellan "En familj" utan valt värde (meddelandet
              syns) och en vald familj (meddelandet försvinner), på BÅDA
              brytpunkterna, inte bara vid `sm:`. Ingen fokuserbar kontroll
              i en `<p>`, så `aria-hidden` + `invisible` räcker (samma form
              som `Pill`s `dold`-prop) — `inert` tillför inget här. */}
          <p
            aria-hidden={scopeGiltig || undefined}
            className={`text-small text-text-muted ${scopeGiltig ? 'invisible' : ''}`}
          >
            Välj en familj för att gå vidare.
          </p>

          <div className="flex flex-wrap justify-end gap-2">
            <Button intent="ghost" onPress={onStang} isDisabled={laddarUpp}>
              Avbryt
            </Button>
            <Button
              intent="primary"
              isDisabled={laddarUpp || !scopeGiltig}
              onPress={() =>
                onUpload(
                  filer,
                  {
                    rackvidd,
                    kursfamilj:
                      rackvidd === AttachmentScope.KURSTYP ? (kursfamilj ?? undefined) : undefined,
                    kursniva:
                      rackvidd === AttachmentScope.KURSTYP ? (kursniva ?? undefined) : undefined,
                  },
                  onStang,
                )
              }
            >
              <Upload aria-hidden="true" size={16} className="shrink-0" />
              {laddarUpp ? 'Laddar upp…' : 'Ladda upp'}
            </Button>
          </div>
        </div>
      </Dialog>
    </Modal>
  );
}

/**
 * RÄCKVIDDSLÄGET (TASK-275.3, ADR-118 beslut 5) — Dokument-ytans läge UTAN
 * valt event (ORDLISTA.md § Gemensam bilaga/Räckvidd). Ersätter den
 * tidigare "Välj ett event för att se dess bilagor."-texten (se
 * amenderings-sidofilen). Listar ALLA gemensamma bilagor och är den ENDA
 * platsen en gemensam bilaga kan ersättas/raderas (ADR-118 beslut 3) —
 * servern nekar 403 annars.
 *
 * INGEN typ-filterrad (till skillnad mot `DokumentLista`): mallar/
 * generatorer (klass B/C) genereras UR eventets data och har därför inget
 * meningsfullt läge utan valt event — räckviddsläget visar BARA bilagor.
 */
function GemensamtLage({
  rader,
  laddar,
  fel,
  felmeddelande,
  onReplace,
  replaceMutation,
  onDelete,
  deleteMutation,
}: {
  rader: BilageRad[];
  laddar: boolean;
  fel: boolean;
  felmeddelande: string;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  onDelete: (attachmentId: string, namn: string) => void;
  deleteMutation: DeleteMutation;
}) {
  // Förvaltningsläget har INGEN filterrad (bara bilagor visas), så det finns
  // inget filter att hoppa mellan — höjdlåsningen är därför OVILLKORAD på
  // samma sätt som `DokumentLista`s (`berakaListgeometri`s docblock).
  // [TASK-309.24] Samma delade geometri- och höjdmätningslogik —
  // `sistaRadenBarLinje` (den saknade helt här innan, ett genuint glapp)
  // och `useLastaListhojd` med `matbar` KONSTANT sant: utan filter är varje
  // render en giltig mätkälla (`harPreciserMatt`-spärren i hooken skyddar
  // ändå mot att en in-place-minskning under fyra rader skriver över en
  // redan precis mätning — se hookens filhuvud, "PRECISIONEN ÄR MONOTON").
  const { kanRulla, sistaRadenBarLinje } = berakaListgeometri(rader.length);
  const { listRef, hojd: matadHojd } = useLastaListhojd(true, true, rader.length, rader);
  return (
    // SAMMA ORDNING SOM EVENTLÄGET: uppladdningen först, listan sedan
    // (Marcus 2026-08-17). De två lägena delar nu skelett — en användare som
    // lärt sig det ena känner igen det andra.
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        {/* HJÄLPTEXTEN ÄR BORTTAGEN (Marcus, QA 273.5 steg 5, 2026-08-17:
            "Ta bort hjälptexten … den behövs inte"). Den löd "Gemensamma
            dokument gäller flera event: en kurstyp eller alla event. Ändras
            här, syns direkt överallt de gäller." — informationen bärs redan av
            `RackviddBadge` per rad, som säger samma sak om den enskilda filen i
            stället för i abstrakt form ovanför listan. Återinför den inte utan
            att först fråga; raden är beslutad bort, inte tappad.

            INGEN TYP-FILTERRAD HÄR, och det är avsiktligt: räckviddsläget
            visar BARA bilagor (klass A). Mallar och generatorer härleds ur
            ett events data och har inget meningsfullt läge utan valt event —
            en filterrad med tre döda alternativ hade lovat något ytan inte
            kan hålla. */}
        {laddar ? (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Laddar gemensamma dokument…</span>
            <Skeleton variant="listRow" />
            <Skeleton variant="listRow" />
          </div>
        ) : fel ? (
          <MessageBox intent="error" title="Kunde inte hämta gemensamma dokument">
            {felmeddelande}
          </MessageBox>
        ) : (
          <div
            data-testid="grupp-kort"
            className="flex flex-col gap-3 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong"
          >
            {/* INGEN RUBRIK — BESLUTAD BORT, INTE TAPPAD (Marcus, QA 273.5
                steg 5, 2026-08-18: *"Ta även bort rubriken 'Dokument' i
                förvaltningsläget."*). Den hette först "Gemensamma dokument",
                kortades till "Dokument" 2026-08-17 — och blev därmed en ren
                dubblett av sidhuvudets `<h1>Dokument` en skärmhöjd ovanför.
                Se eventlägets sektionskommentar för `section`-formen. */}
            {/* SAMMA INLINE-RULLNING SOM EVENTLÄGET (se dess kommentar för
                formens härkomst och för varför tabb-stoppet är villkorat).
                Räkningen är enklare här: räckviddsläget visar BARA bilagor,
                ingen filterrad döljer grupper. */}
            <ul
              ref={listRef}
              data-testid="dokument-lista"
              // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningar.tsx.
              tabIndex={kanRulla ? 0 : undefined}
              aria-label={kanRulla ? 'Delade dokument' : undefined}
              // [TASK-309.24] Se `DokumentLista`s motsvarande `<ul>` för
              // `matadHojd`/`useLastaListhojd`s fulla motiv. Låsningen
              // (runda 2) är OVILLKORAD — inget `lasHojd`-fält kvar.
              style={matadHojd !== null ? { height: matadHojd, maxHeight: matadHojd } : undefined}
              className={`focus-ring-inset scrollbar-inline divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:divide-border-strong contrast-more:border-border-strong ${
                kanRulla ? 'overflow-y-auto' : 'overflow-y-hidden'
              } ${
                sistaRadenBarLinje
                  ? '[&>li:last-child]:border-border [&>li:last-child]:border-b contrast-more:[&>li:last-child]:border-border-strong'
                  : ''
              }`}
            >
              {rader.map((r) => (
                <li key={r.current.id}>
                  <GemensamBilageRadRow
                    rad={r}
                    onReplace={onReplace}
                    replaceMutation={replaceMutation}
                    onDelete={onDelete}
                    deleteMutation={deleteMutation}
                  />
                </li>
              ))}
              {rader.length === 0 && (
                <li className="py-3 text-small text-text-muted">Inga delade dokument än.</li>
              )}
            </ul>
          </div>
        )}

        <ErsattningsFel replaceMutation={replaceMutation} />
      </section>
    </div>
  );
}

/**
 * En rad i räckviddslägets lista (TASK-275.3) — speglar `BilageRadRow`, men
 * med TVÅ skillnader: badgen visas ALLTID (varje rad här ÄR gemensam per
 * konstruktion — ingen `arGemensam`-gren behövs), och Ersätt/Radera är
 * BÅDA tillgängliga (detta ÄR räckviddsläget, ADR-118 beslut 3). `eventId`
 * i `kalla` är MEDVETET `null` — förhandsvisning/nedladdning av en gemensam
 * bilaga kräver inget eventkontext (get-attachment-download-url/index.ts §
 * filhuvudet, "gemensam bilaga: inget ägarskaps-guard alls").
 */
function GemensamBilageRadRow({
  rad,
  onReplace,
  replaceMutation,
  onDelete,
  deleteMutation,
}: {
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  onDelete: (attachmentId: string, namn: string) => void;
  deleteMutation: DeleteMutation;
}) {
  const { current, dolda } = rad;
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
  const raderarDennaRaden =
    deleteMutation.isPending && deleteMutation.variables?.attachmentId === current.id;
  return (
    <DokumentRadSkal
      namn={current.namn}
      kalla={{ typ: 'bilaga', eventId: null, attachmentId: current.id }}
      current={current}
      dolda={dolda}
      handlingar={
        // RÄCKVIDDSLÄGET ÄR FÖRVALTNINGSYTAN (Marcus 2026-08-17): här — och
        // enligt ADR-118 beslut 3 BARA här — får en gemensam bilaga ersättas
        // och raderas. Eventläget är Lottas läsflöde och ska inte bära
        // handlingar som kan förstöra något för alla event samtidigt.
        <>
          <FileTrigger
            acceptedFileTypes={['application/pdf']}
            onSelect={(files) =>
              onReplace(files, current.id, {
                rackvidd: current.rackvidd ?? undefined,
                kursfamilj: current.kursfamilj ?? undefined,
                kursniva: current.kursniva ?? undefined,
              })
            }
          >
            <Button
              intent="primary"
              emphasis="subtle"
              size="sm"
              className={IKONKNAPP_KLASS}
              isDisabled={ersatterDennaRaden}
              aria-label={
                ersatterDennaRaden ? `Ersätter ${current.namn} …` : `Ersätt ${current.namn}`
              }
            >
              {ersatterDennaRaden ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <FileUp aria-hidden="true" size={IKON_STORLEK} />
              )}
            </Button>
          </FileTrigger>
          <Button
            intent="danger"
            emphasis="subtle"
            size="sm"
            className={IKONKNAPP_KLASS}
            isDisabled={raderarDennaRaden}
            aria-label={raderarDennaRaden ? `Raderar ${current.namn} …` : `Radera ${current.namn}`}
            onPress={() => onDelete(current.id, current.namn)}
          >
            {raderarDennaRaden ? (
              <Loader2
                aria-hidden="true"
                size={IKON_STORLEK}
                className="motion-safe:animate-spin"
              />
            ) : (
              <Trash2 aria-hidden="true" size={IKON_STORLEK} />
            )}
          </Button>
        </>
      }
    />
  );
}
