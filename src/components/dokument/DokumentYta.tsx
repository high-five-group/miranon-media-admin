/**
 * Dokument-ytan — Mer-ytan där bilagor förvaltas (`T131`). PROMOVERAD ur
 * S100/TASK-147.6:s konvergenspass (ADR-102 B1/B2, ADR-103 B2 steg 1) —
 * denna fil ÄR den skarpa ytan, ingen separat prototypfil att riva.
 * Facit-manifestet `s102-dokument-konvergens` är PENSIONERAT (TASK-309.29,
 * 2026-08-28) och arkivflyttat till
 * `tasks/sessions/archive/bilagor/s102-dokument-konvergens/` — dess
 * `ARKIVERAD.md` bär skälet, gapet och efterträdarna. Det beskrev denna yta
 * som den såg ut 2026-08-16 (Marcus stämpel, TASK-164-rivningen, ADR-102 B1,
 * ADR-103 B2 steg 4); Visa-dialogen det avbildar är riven, se
 * `[ERSATT, TASK-273.4]` nedan. Dagens formbeskrivning bor i
 * `tasks/sessions/bilagor/s108-generering/facit.json` och
 * `tasks/sessions/bilagor/s108-dokumentytan/facit.json` (TASK-309.10,
 * PR #1961) — båda ännu ostämplade, och ingen av dem täcker ett valt events
 * fulla lista med dagens ikonpar (gapet; uppföljning i TASK-309.32).
 * Fullständig bygghistorik (skärpningsvarv 1–3, TASK-245/246) finns i
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
 * `tasks/sessions/archive/bilagor/s102-dokument-konvergens/
 * AMENDERING-2026-08-17-visa-till-ikonpar.md`): Visa-dialogen ersatt av TVÅ
 * ikonknappar per rad för alla tre dokumentklasser. [T176, 2026-08-29:
 * ikonparet är i sin tur rivet — Öppna ÄR radens namn och Ladda ner är en
 * menypost; `DokumentAtgardsKnappar`/`LaddaNerKnapp` finns inte längre. Se
 * `DokumentRadSkal`s docblock. Popup-mönstret nedan är OFÖRÄNDRAT och bor nu
 * i `oppnaDokument()`.] Förhandsvisa
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
 * amenderings-sidofilen `tasks/sessions/archive/bilagor/
 * s102-dokument-konvergens/AMENDERING-2026-08-17-rackviddsval-gemensamt-
 * lage-badges.md` för hela avvikelsen mot det godkända facit-manifestet.
 * Kort sammanfattat:
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
  // [T176] "Skapa dokument ▾" — chevronen säger att knappen öppnar något,
  // samma affordans `Select`s trigger bär.
  ChevronDown,
  Download,
  // [2026-08-29] ⋯-knappen som ersätter radens ikonrad. `Ellipsis` (inte
  // `MoreVertical`): menyn öppnas NEDÅT från en knapp längst ut till höger i
  // en vågrät rad, och tre vågräta prickar är den form användare känner igen
  // som "fler val i den här raden" (samma val som `Files`/`Target` gjordes på
  // — ikonen ska läsa som det den gör).
  Ellipsis,
  // [T176] "Skapa dokument"-triggerns ikon — ett dokument som TILLKOMMER.
  FilePlus,
  Files,
  // Radens ledande typglyf — `FileText` för pdf/okänt, `Image` för bilder.
  // `Image` krockar med webbläsarens globala `Image`-konstruktor, därav
  // alias.
  FileText,
  FileUp,
  Image as ImageIcon,
  Loader2,
  // [T176] Kvittots menypost — `Receipt` är lucides egen kvittoikon.
  Receipt,
  RefreshCw,
  // [TASK-338.4] "Ändra räckvidd" — `Target` läser som "vad detta dokument
  // siktar på", vilket är precis vad en filter-räckvidd ÄR (ADR-125 § 1).
  // `Files` är upptagen av räckviddslägets egen väljar-ikon och `Layers` av
  // segment-byggarens lager-begrepp; `Settings`/`Pencil` hade lovat en
  // generell redigering av bilagan, inte specifikt dess spridning.
  Target,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { useAuth } from '@/auth/useAuth';
import type { MallId } from '@/components/dokument/blockDefinitioner';
import { stegEtikett } from '@/components/dokument/nivaSprak';
import { RackviddBadge } from '@/components/dokument/RackviddBadge';
import { rackviddsSammanfattning } from '@/components/dokument/rackviddsText';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Dialog } from '@/components/primitives/Dialog';
import { Meny, MenyAvdelare, MenyPost } from '@/components/primitives/Meny';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { Select, SelectItem } from '@/components/primitives/Select';
import { SidRam } from '@/components/primitives/SidRam';
import { Skeleton } from '@/components/primitives/Skeleton';
import { StatusBadge } from '@/components/registrations/StatusBadge';
import { mallIdFranAirtableOption } from '@/data/adapters/mallKallhash';
import type { DokumentKalla } from '@/data/mutations/dokumentKalla';
import { useDeleteAttachment } from '@/data/mutations/useDeleteAttachment';
import { useForhandsvisaDokument } from '@/data/mutations/useForhandsvisaDokument';
import { useLaddaNerDokument } from '@/data/mutations/useLaddaNerDokument';
import { useReplaceAttachment } from '@/data/mutations/useReplaceAttachment';
import { useSkapaOmEventBilaga } from '@/data/mutations/useSkapaOmEventBilaga';
import { useUpdateAttachmentScope } from '@/data/mutations/useUpdateAttachmentScope';
import {
  type UploadAttachmentVariables,
  useUploadAttachment,
} from '@/data/mutations/useUploadAttachment';
import { useEventAttachments } from '@/data/queries/useEventAttachments';
import { usePlacesList } from '@/data/queries/usePlacesList';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { AttachmentClass, AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';
import { fornamn } from '@/lib/fornamn';
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

/* [T176, 2026-08-29] `fyllerI`/`byggsUr` ÄR RIVNA. De bar radernas
   detaljled ("Fyller i datum, plats, pris …" / "Byggs ur namn, e-post …") i
   `MallRad`/`GeneratorRad`, som inte längre finns: katalogerna renderas nu
   som menyposter i `SkapaDokumentMeny`, och en menypost är ikon + etikett.
   Fälten hade blivit data utan läsare — "ingen abstraktion utan faktisk
   nuvarande användare". Datan finns kvar i git om formen ändras igen. */
type Mall = {
  id: MallId;
  namn: string;
};

const MALLAR: Mall[] = [
  { id: 'bekraftelse', namn: 'Bekräftelsebilaga' },
  { id: 'deltagarinfo', namn: 'Deltagarinformation' },
];

type Generator = {
  id: string;
  namn: string;
};

const GENERATORER: Generator[] = [{ id: 'c1', namn: 'Betalningskvitto' }];

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

/**
 * [TASK-338.3] Nolläget i räckviddsdialogens tre axel-`Select`ar — "axeln är
 * inte satt, den begränsar inte" (ADR-125 § 1). Se `RackviddsDialog`s
 * kommentar vid Familj-selecten för varför nolläget är ett EGET alternativ
 * i stället för en platshållare.
 *
 * Värdet kan inte kollidera med riktig data: familjerna är tre kända namn,
 * stegen är basens `Nivå N`-optioner och platserna är Airtable-record-ID:n
 * (`rec…`). Det lämnar aldrig klienten — `axelVarde` översätter tillbaka
 * till `null` innan valet blir en EF-parameter.
 */
const ALLA_AXEL = '__alla';

/** Select-nyckel → axelvärde: nolläget (och inget val alls) blir `null`. */
function axelVarde(nyckel: React.Key | null): string | null {
  if (nyckel == null) return null;
  const varde = String(nyckel);
  return varde === ALLA_AXEL ? null : varde;
}

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

/** [TASK-275.3, UTBYGGD TASK-338.3] Räckviddsvalet `RackviddsDialog`
    producerar — delad shape mellan uppladdning (`UploadAttachmentVariables`
    minus `file`) och ersättning (`ReplaceAttachmentInput` minus `file`/
    `oldAttachmentId`). Bär sedan ADR-125 § 1 alla TRE axlarna; `plats` är
    ett Platser-record-ID, aldrig ett namn. */
type UploadScopeVal = Pick<
  UploadAttachmentVariables,
  'rackvidd' | 'kursfamilj' | 'kursniva' | 'plats'
>;

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

  // [TASK-340.2] Frågan bor nu i `useEventAttachments` — SAMMA nyckel, samma
  // `enabled`-villkor, ingen beteendeändring här. Den flyttade ut därför att
  // `GenereringsVy.tsx` behöver samma svar för sin "Skapa om …"-etikett, och
  // två inline-`useQuery` med samma nyckel är två ställen att hålla i synk.
  // Se hookens docblock för hela resonemanget.
  const attachmentsQuery = useEventAttachments(eventId);

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
  // [TASK-338.4] "Ändra räckvidd" — som Radera ovan ANVÄNDS den bara i
  // räckviddsläget (ADR-118 beslut 3: en delad bilaga är oredigerbar ur ett
  // events kontext). Enda OPTIMISTISKA mutationen på denna yta; skälet
  // (ingen fil rör sig) står i useUpdateAttachmentScope.ts § docblock.
  const scopeMutation = useUpdateAttachmentScope(eventId);

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

  // ═══ [TASK-338.4] RADEN VARS RÄCKVIDD ÄNDRAS ═══
  //
  // Samma disciplin som `valdaFiler` ovan, och samma dialog: `null` betyder
  // "ingen ändring pågår". Att BÅDA lägena bärs av var sitt state (i stället
  // för ett delat `dialogLage`) håller dem ömsesidigt uteslutande på ett sätt
  // som syns i JSX-grenen nedan — och gör det omöjligt att av misstag öppna
  // en uppladdningsdialog med en rad förifylld.
  const [andrasRackvidd, setAndrasRackvidd] = useState<Attachment | null>(null);

  /**
   * RÄCKVIDDSVÄXLINGEN — EN HANDLER, båda anropsvägarna.
   *
   * `onByte` (event → event, delade → event) och `gemensamtAlternativ.onValj`
   * ("Delade dokument") är `EventValjare`s ENDA två vägar in i ett
   * räckviddsbyte (se dess `onSelectionChange` — sentinel-grenen ELLER
   * event-grenen, aldrig båda för samma klick), och båda pekar hit.
   *
   * [T176, RIVET] Handlern nollställde tidigare ÄVEN typfiltret
   * (`void setFilter(null)`, TASK-309.40) vid varje byte i båda riktningarna.
   * Filtret finns inte längre — `?typ` är riven med `LISTA_FILTER`, se
   * `DokumentLista`s docblock — så det finns inget att nollställa. Problemet
   * den raden löste (ett filter som överlevde ett räckviddsbyte OSYNLIGT,
   * eftersom nuqs-nyckeln inte hör till komponent-livscykeln och
   * räckviddsläget saknade filterrad) kan strukturellt inte uppstå igen.
   */
  const handleRackviddsByte = (nastaEventId: string | null) => {
    void setEventId(nastaEventId);
  };

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

  /**
   * [TASK-338.4] Sparar den nya räckvidden på raden i `andrasRackvidd`.
   *
   * `platsNamn` kommer FRÅN DIALOGEN (som redan har platslistan) och används
   * ENBART för den optimistiska renderingen — se `useUpdateAttachmentScope.ts`
   * § `UpdateAttachmentScopeVariables`. EF:en får aldrig ett platsNAMN;
   * kontraktet bär bara record-ID:t.
   *
   * `onSuccess`-callbacken stänger dialogen, INTE ett `isSuccess`-useEffect:
   * flaggan står kvar efter stängning och hade stängt nästa dialog i samma
   * ögonblick den öppnades (samma fälla `handleUpload` redan bokför). Vid
   * FEL stängs dialogen inte — felet renderas inuti den, intill valet.
   */
  const handleSparaRackvidd = (scope: UploadScopeVal, onKlart: () => void, platsNamn?: string) => {
    const rad = andrasRackvidd;
    if (!rad) return;
    scopeMutation.mutate(
      {
        attachmentId: rad.id,
        namn: rad.namn,
        // Dialogen kan bara producera GEMENSAM här ("Bara detta event" är
        // avstängd i ändra-läget), men vi läser värdet den faktiskt gav i
        // stället för att hårdkoda — så en framtida ändring av dialogen inte
        // tyst skickar något annat än vad Lotta såg.
        rackvidd: scope.rackvidd ?? AttachmentScope.GEMENSAM,
        kursfamilj: scope.kursfamilj,
        kursniva: scope.kursniva,
        plats: scope.plats,
        platsNamn,
      },
      { onSuccess: onKlart },
    );
  };

  return (
    <div className="flex flex-col gap-4" data-testid="dokument-yta">
      {/* TASK-299.11 — PROMOVERAD: husets delade SidRam-primitiv (kant-i-
          kant-dialekten, endast sidkromet) ersätter den gamla textlänken.
          Dev-växeln `?sidram=ny` (TASK-299.1) är riven (ADR-103 B2 steg 4);
          facit-manifestet amenderat till klass (c), se tasks/sessions/
          archive/bilagor/s102-dokument-konvergens/AMENDERING-2026-08-23-
          sidram-promovering.md (arkivflyttat, TASK-309.29). */}
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
          onByte={(id) => handleRackviddsByte(id)}
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
            onValj: () => handleRackviddsByte(null),
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
            onAndraRackvidd={setAndrasRackvidd}
            scopeMutation={scopeMutation}
            uploadMutation={uploadMutation}
            onValjFil={setValdaFiler}
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
            uploadMutation={uploadMutation}
            onValjFil={setValdaFiler}
          />
        )}

        {/* [T176, 2026-08-29] UPPLADDNINGSKNAPPEN STOD HÄR — den bor nu i
            kortets handlingsrad ovanför listan (`ListHandlingsRad`), samma
            plats filterraden lämnade. Historiken, för den som undrar varför
            den flyttat två gånger:

              2026-08-17  ÖVER listan (listans längd var obegränsad, så en
                          knapp under den kunde hamna utanför skärmen)
              2026-08-18  UNDER listan — Marcus: *"detta gör det logiskt att
                          sätta Ladda upp-knappen under dokumentlistan"*, ett
                          giltigt drag så fort listan fick låst höjd och
                          inline-rullning
              2026-08-29  IN I KORTET, ovanför listan, tillsammans med
                          "Skapa dokument" — handlingarna hör ihop som ETT
                          block ("vad kan jag göra här?") och listan som ett
                          annat ("vad finns här?"); två handlingszoner på var
                          sin sida om listan var en zon för mycket

            Flödet är ORÖRT: knappen öppnar filväljaren DIREKT och
            räckviddsfrågan ställs efteråt i dialogen, när det finns en fil att
            ställa den om (Marcus 2026-08-18 — före det stod ett permanent
            tvåstegs-block som frågade om spridning innan filen fanns).
            `data-testid="ladda-upp-ny-fil"` följde med oförändrat. */}

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
          lage={{ typ: 'uppladdning', filer: valdaFiler }}
          harEvent={eventId != null}
          arbetar={uploadMutation.isPending}
          // Uppladdningsfelet bor på SIDAN (`UppladdningsFel` ovan), inte i
          // dialogen — den stänger vid framgång och hade rivit felet med sig.
          fel={null}
          onStang={() => setValdaFiler(null)}
          onBekrafta={(scope, onKlart) => handleUpload(valdaFiler, scope, onKlart)}
        />
      )}

      {/* [TASK-338.4] ÄNDRA RÄCKVIDD — samma dialog, andra läget. Villkorad
          montering av EXAKT samma skäl som uppladdningens ovan: förifyllningen
          läses som `useState`-initialvärde, så en rivning vid stängning är det
          som garanterar att nästa öppning speglar RADENS axlar och inte förra
          radens. De två staten är ömsesidigt uteslutande i praktiken (Lotta
          kan bara trycka på en knapp i taget) men ingen av dem stänger av den
          andra — det behövs inte, eftersom `Modal` staplar och den senast
          öppnade tar fokus. */}
      {andrasRackvidd != null && (
        <RackviddsDialog
          lage={{
            typ: 'andra-rackvidd',
            attachmentId: andrasRackvidd.id,
            namn: andrasRackvidd.namn,
            // RADENS NUVARANDE AXLAR blir dialogens utgångsläge. `?? undefined`
            // och inte `?? null`: `UploadScopeVal` bär `undefined` som "axeln
            // är inte satt" hela vägen ner till EF:en, medan modellen bär
            // `null` — översättningen sker här, vid gränsen, en gång.
            initial: {
              rackvidd: andrasRackvidd.rackvidd ?? undefined,
              kursfamilj: andrasRackvidd.kursfamilj ?? undefined,
              kursniva: andrasRackvidd.kursniva ?? undefined,
              plats: andrasRackvidd.plats?.id ?? undefined,
            },
          }}
          harEvent={eventId != null}
          arbetar={scopeMutation.isPending}
          fel={
            scopeMutation.isError
              ? (scopeMutation.error?.message ?? 'Inget felmeddelande angavs.')
              : null
          }
          onStang={() => {
            setAndrasRackvidd(null);
            // Nollställ felet med dialogen: mutationens `isError` står kvar
            // efter stängning och hade annars visat förra försökets fel i
            // samma ögonblick nästa rad öppnades.
            scopeMutation.reset();
          }}
          onBekrafta={handleSparaRackvidd}
        />
      )}
    </div>
  );
}

/* ═══ RADENS IKONKNAPP — EN KVAR, MEN FORMEN GÄLLER ═══
 *
 * Konstanten bar tidigare FYRA à FEM knappar per rad (Marcus 2026-08-17:
 * *"alla fyra knappar måste se likadana ut och sitta i rad, alltså även
 * previewknappen, gör de mindre så får de plats."*). Sedan T176 (2026-08-29)
 * finns exakt EN kvar — radens ⋯-trigger — och resten bor som menyposter
 * (`DokumentRadSkal`). Konstanten står ändå: den bär två saker som inte fick
 * följa med i rivningen.
 *
 * ── 1. STORLEKEN ÄR 44 px, OCH DEN ÄR ETT GOLV VI INTE SÄNKER ──
 *
 * "Gör dem mindre" löstes en gång med IKONEN (18 → 16 px) och luften mellan
 * dem, aldrig med träffytan. 44×44 är repots egen uttalade ribba
 * (`DESIGN-SYSTEM-SPEC.md` § checklista, "Touch targets ≥ 44px?") och den är
 * mekaniskt låst på annat håll i huset (`tests/a11y/NavCard.spec.ts`:
 * "träffyta: raden är ≈58 px hög (≥44 px-golvet)").
 *
 * ── 2. FORMEN ÄR `primary`+`subtle` — RÖR DEN INTE TILL `ghost` ══
 *
 * FLYTTAD HIT från den rivna `DokumentAtgardsKnappar`s docblock (T176), för
 * att invarianten gäller ⋯-knappen precis som den gällde ikonparet. Detta är
 * en ÅTERSTÄLLD fix, inte ett smakval, och den har rivits en gång redan:
 *
 *   1. `3b592e8c` (TASK-147.6 varv 3) bytte den dåvarande Visa-knappen FRÅN
 *      `ghost` TILL `intent="primary" emphasis="subtle"` — på Marcus
 *      granskningsfynd. Skälet stod i klartext: `ghost`s hover-token
 *      (`--mm-button-ghost-bg-hover`) ÄR `var(--mm-bg-muted)`, vilket är
 *      EXAKT samma färg som radgruppens egen bakgrund (`bg-bg-muted` på
 *      `grupp-kort`). Hovern FANNS i CVA:n hela tiden — den var osynlig mot
 *      en identisk bakgrund.
 *   2. `b881fe64` (TASK-273.4) ersatte Visa-knappen med ett ikonpar och satte
 *      `intent="ghost"` — vilket återinförde exakt samma token-identitet, och
 *      därmed exakt samma osynliga hover.
 *   3. Marcus fångade den igen vid QA 273.5 steg 5 (2026-08-17): "de behöver
 *      alltså samma bakgrund som visa-knappen hade, samma hover också
 *      liksom". Samma defekt, andra ronden.
 *
 * INVARIANTEN, formulerad så den överlever nästa ombyggnad: en knapp som
 * sitter INUTI `grupp-kort` (`bg-bg-muted`) får aldrig bära `ghost`, för
 * `ghost`s hover ÄR `bg-bg-muted`. `subtle` är dessutom primitivens egen
 * deklarerade form för just denna ytklass ("tabellrader/toolbars, kompakt:
 * svag intent-tonad platta", `Button.tsx` § subtle) och tänder en kant i
 * intent-färgen under `prefers-contrast: more` — 11-golvet, som `ghost`
 * (transparent botten) inte kan ge här.
 *
 * [T176-TILLÄGG] Sedan raden fick sin egen hover-platta (`bg-bg-muted` mot
 * listans `bg-surface`, se `DokumentRadSkal`) har invarianten en TREDJE
 * grund: en `ghost`-knapp inuti raden hade hovrat till exakt radens egen
 * hover-ton. Namnknappen löser samma sak åt andra hållet — den bär INGEN
 * platta alls och låter raden bära återkopplingen.
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
 * null`).
 *
 * NÅBAR I BÅDA LISTORNA (rättat i TASK-309.39 — stycket sade tidigare
 * `GemensamtLage` ENSAMT, och `harMattAlls`-nödmätningen gjorde det
 * falskt):
 *
 *   • `GemensamtLage`, vid ett events ALLRA FÖRSTA rendering med noll
 *     delade dokument. Oförändrat sedan TASK-309.24.
 *   • `DokumentLista`, vid SIDLADDNING direkt i `?typ=bilaga` på ett event
 *     UTAN bilagor. Filtret visar då bara tomt-lägets placeholder-`<li>`
 *     (`antalSynliga === 0`), och eftersom komponenten monteras MED det
 *     filtret har den aldrig renderat i 'alla' — `senastUppmattRadhojd` är
 *     alltså `null` när nödmätningen kör. Mätt 2026-08-29: 398 px, alltså
 *     `LISTA_FALLBACK_RADHOJD × 4 + kantjustering`.
 *
 * DET GAMLA PÅSTÅENDET VAR SANT FÖR SIN EGEN KOD, INTE FÖR DENNA. Det löd
 * att `DokumentLista` *"har alltid minst `MALLAR.length +
 * GENERATORER.length === 3` RIKTIGA rader synliga i 'alla' (default-filtret)
 * och har därför redan skrivit `senastUppmattRadhojd`"*. Den slutledningen
 * förutsätter att komponenten NÅGON GÅNG renderat i 'alla' — vilket den
 * inte gör när `?typ=` redan står på 'bilaga' vid mount. Före 309.39 var
 * det ofarligt eftersom höjden då inte sattes ALLS (det var symptom S1);
 * nödmätningen gör vägen nåbar, och därmed påståendet fel.
 *
 * Test: `dokument-lista-hojdlas-tidpunkt.acceptance.test.ts` § "NIVÅ 3 är
 * nåbar även i DokumentLista".
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
 * `GemensamBilageRadRow` (GemensamtLage's ENDA radtyp) kunde tidigare BRYTA
 * första gången ett riktigt delat dokument dök upp på en smal skärm, vilket
 * kunde ge EN synlig höjdjustering den allra första gången listan gick från
 * tom till fylld på mobil.
 *
 * ═══ [T176, 2026-08-29] 99 → 107, OCH BRYTNINGSFÖRBEHÅLLET ÄR BORTA ═══
 *
 * TVÅ saker ändrades, båda MÄTTA (`getBoundingClientRect` i renderad yta,
 * dev-server mot staging):
 *
 *   1. REFERENSRADEN FINNS INTE LÄNGRE. Talet 99 var uppmätt på `MallRad` —
 *      vald just för att den strukturellt aldrig kunde bryta. Mallarna är
 *      handlingar nu (`SkapaDokumentMeny`), inte listrader, så `MallRad` är
 *      riven. Referensen är i stället en BILAGERAD, vars namnknapp bär
 *      44 px träffyta: uppmätt **107 px** vid BÅDE 1280 px och 390 px.
 *   2. FÖRBEHÅLLET OM RADBRYTNING ÄR UPPHÄVT. Det byggde på att
 *      ikonkolumnen (4–5 × 44 px) inte rymdes bredvid namnet vid 375 px och
 *      tvingade `flex-wrap`. Med EN ⋯-knapp kvar är raden `flex-nowrap` och
 *      kan strukturellt inte bryta (`DokumentRadSkal`s docblock) — 107 är
 *      alltså viewport-oberoende av samma skäl 99 var det, men nu för den
 *      radform som FAKTISKT visas.
 *
 * Följden är att tom och fylld lista delar höjd igen (4 × 107 + kant), i
 * stället för att hoppa ~32 px när första dokumentet dyker upp. Talet
 * dupliceras medvetet i båda acceptance-sviterna (`FALLBACK_RADHOJD`) — se
 * deras egna kommentarer.
 */
const LISTA_FALLBACK_RADHOJD = 107;

/**
 * En rads EGEN separatorlinje i px — `border-bottom-width`, läst ur
 * renderad stil, aldrig antagen.
 *
 * ATT DEN SITTER PÅ `border-bottom` OCH INTE PÅ `border-top` ÄR EN MÄTT
 * EGENSKAP HOS TAILWIND 4, INTE EN SMAKSAK (TASK-309.39, 2026-08-29):
 * `divide-y` genererar i v4 `:where(& > :not(:last-child)) {
 * border-bottom-width: … }` — linjen tillhör alltså raden OVANFÖR
 * mellanrummet. I v3 var samma verktygsklass `border-top-width` på
 * `& > * + *`, alltså raden NEDANFÖR. Uppmätt i vår faktiska bundle
 * (`tailwindcss@4.2.2`): varje `<li>` bär `border-top: 0px` och
 * `border-bottom: 1px`.
 *
 * SKILLNADEN ÄR HELA TASK-309.39s ANDRA SYMPTOM. Med v3:s semantik hade
 * linjen mellan rad 4 och rad 5 tillhört rad 5 och legat utanför en box
 * som slutar vid rad 4:s underkant — helt utan avdrag. Med v4:s semantik
 * ligger den INNANFÖR rad 4:s egen `getBoundingClientRect().bottom`, och
 * en höjd satt till exakt det spannet reserverar plats åt just den linje
 * som INTE ska synas.
 *
 * Läses per rad i stället för en gång för `<ul>`: linjen finns bara på
 * `:not(:last-child)` plus (via `sistaRadenBarLinje`) på sista raden i
 * 1–3- och 5+-lägena, så DEN AKTUELLA radens värde är det enda som säger
 * något — och 0 är ett giltigt, meningsfullt svar (fjärde raden ÄR sista,
 * exakt-fyra-fallet). `Number.parseFloat` av ett tomt/ogiltigt värde ger
 * `NaN`, som hade förgiftat hela höjduttrycket tyst; `|| 0` gör den
 * degraderingen explicit och ofarlig.
 */
function separatorBredd(rad: Element): number {
  return Number.parseFloat(getComputedStyle(rad).borderBottomWidth) || 0;
}

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
 * ── EN OMÄTT LISTA ÄR ALDRIG ETT GILTIGT VILOLÄGE (TASK-309.39) ──
 *
 * "Står kvar vid sitt senaste värde" förutsätter att ETT senaste värde
 * finns. Gjorde det inte det, stod listan kvar vid `null` — och en `<ul>`
 * utan `style.height` följer sitt innehåll. `harMattAlls` stänger exakt
 * det hålet: när INGEN nivå ännu satt en höjd mäter effekten oavsett vad
 * källvillkoren säger, och den nödmätningen sätter aldrig
 * `harForetradesMatt` (den är ett dugligt första-värde, inte ett
 * företräde — 'bilaga' och 'alla' får förfina det precis som förut).
 *
 * HÅLET VAR NÅBART PÅ TVÅ VÄGAR, BÅDA MÄTTA 2026-08-29:
 *
 *   1. `?typ=bilaga` på ett event med FÄRRE än fyra bilagor.
 *      `foretradesMatbar` kräver `rader.length >= LISTA_SYNLIGA_RADER`,
 *      `reservMatbar` kräver filtret 'alla' — båda falska. Marcus nådde
 *      det genom att växla räckvidd: nuqs-nyckeln `typ` överlever bytet
 *      delade ↔ event medan komponenten monteras OM (alla refs och
 *      `hojd`-state nollställs), och räckviddsläget har ingen filterrad
 *      som visar att filtret ens är satt. Uppmätt utfall före fixen:
 *      listan stod på 200 px (två raders naturliga höjd) i stället för
 *      fyra raders låsta, i VARJE ram — inte "sent låst" utan aldrig låst.
 *      Marcus beskrivning *"några sekunder senare ligga låst"* är
 *      låsningen som inträffar först när något ANNAT gör filtret mätbart.
 *   2. Sidladdning i `?typ=mall` eller `?typ=generator`. `MALLAR` har två
 *      poster och `GENERATORER` en, så de kan ALDRIG nå fyra rader —
 *      låsningen uteblev permanent, utan att någon växling behövdes.
 *
 * VÄG 2 ÄR SKÄLET ATT FIXEN SITTER HÄR OCH INTE I RÄCKVIDDSVÄXLINGEN. Att
 * i stället nolla `?typ` när räckvidden byts hade tagit väg 1 och lämnat
 * väg 2 öppen — och det vore dessutom en produktändring (filtret skulle
 * tyst kastas om), inte en rotorsaksfix. Frågan om `?typ` bör överleva ett
 * räckviddsbyte är verklig men separat, och ligger hos Marcus.
 *
 * Test: `dokument-lista-hojdlas-tidpunkt.acceptance.test.ts` § S1 samplar
 * ram för ram och fäller på FÖRSTA olåsta ramen — inte på ett stickprov
 * efteråt, som inte kan se ett tidsfönster.
 *
 * `getBoundingClientRect()` på RADERNA, aldrig `offsetTop`/`clientHeight`:
 * den senare rundar till HELA pixlar (mätt, TASK-309.24 — en 1 px-diff mot
 * `tests/acceptance/dokument-rackviddsval.acceptance.test.ts`s egen
 * `getBoundingClientRect`-baserade `fyraRader`-mätning avslöjade det). Att
 * skillnaden (nivå 1) mäts mellan TVÅ element i SAMMA rullande container
 * gör den scroll-position-OBEROENDE trots att `getBoundingClientRect` är
 * viewport-rymden: rullar listan S pixlar flyttar sig BÅDA elementens
 * rektanglar med S, och S tar ut sig själv i subtraktionen
 * (`fjarde.bottom - forsta.top`).
 *
 * ── DEN FJÄRDE SEPARATORN LIGGER UTANFÖR KANTEN (TASK-309.39) ──
 *
 * Spannet ovan är INTE höjden. Fjärde radens egen `border-bottom` dras
 * bort (`separatorBredd`, se dess docblock för Tailwind 4-mätningen som
 * bär hela resonemanget) innan `kantjustering` läggs på.
 *
 * DETTA STYCKE SADE TIDIGARE MOTSATSEN, OCH DET VAR FEL — inte slarvigt
 * skrivet, utan byggt på ett antagande om `divide-y` som aldrig prövades:
 * *"Ingen egen kantlinje behöver uteslutas för hand här: `sistaRadenBarLinje`
 * är redan FALSK precis när fjärde raden är den sista …"*. Den meningen
 * resonerar enbart om `[&>li:last-child]:border-b`, och missar att
 * `divide-y` ger fjärde raden en `border-bottom` så fort en FEMTE rad
 * följer. Marcus såg följden i prod 2026-08-29: *"vi har sagt att listan
 * ska sluta precis över den nedersta separatorn men det gör den inte just
 * nu, jag ser den nedersta separatorn."*
 *
 * MÄTT FÖRE FIXEN (acceptance-riggen, 1280×720, fem rader): innehållsytan
 * slutade vid 397 px och fjärde radens linje upptog 396→397 px — alltså
 * ytans sista synliga pixelrad. Avdraget flyttar kanten till 396 px, så
 * linjen hamnar precis utanför. Vid EXAKT fyra rader är fjärde raden
 * `:last-child`, bär ingen linje, och avdraget blir 0 — höjden är
 * oförändrad och 1 px-scroll-invarianten (AC #5) rörs inte. Bieffekten är
 * god och avsiktlig: fyra och fem rader delar nu EXAKT samma bounding box
 * i stället för att skilja sig med linjens bredd.
 *
 * NIVÅ 2 gör samma avdrag av samma skäl — `radhojd × 4` innehåller fyra
 * separatorer när den mätta raden bär sin egen, men bara TRE av dem ligger
 * MELLAN rader. NIVÅ 3 gör inget avdrag: den läser `senastUppmattRadhojd`,
 * som NIVÅ 1/2 redan skrivit separator-fri.
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
  // [TASK-309.39] NÖDMÄTNINGENS spärr — se filhuvudets "EN OMÄTT LISTA ÄR
  // ALDRIG ETT GILTIGT VILOLÄGE"-stycke. Sant så fort NÅGON nivå satt en
  // höjd; det är det enda som skiljer "ingen mätkälla är giltig, men vi har
  // redan ett värde" (stå kvar — regel 5) från "ingen mätkälla är giltig och
  // vi har INGET värde" (mät ändå — annars följer listan innehållet).
  const harMattAlls = useRef(false);
  // NIVÅ 2/3:s minne — senast uppmätt ENSKILD radhöjd (inte den slutliga
  // fyra-raders-höjden), skriven av VILKEN nivå som helst som lyckats mäta
  // riktiga rader. Grunden för NIVÅ 3:s förstahandsval.
  const senastUppmattRadhojd = useRef<number | null>(null);

  useLayoutEffect(() => {
    // [TASK-309.39] NÖDMÄTNING — se filhuvudets "EN OMÄTT LISTA ÄR ALDRIG
    // ETT GILTIGT VILOLÄGE"-stycke. Villkoret nedan är oförändrat för allt
    // UTOM det läge där ingen höjd alls existerar ännu.
    const nodmatning = !harMattAlls.current;
    if (!foretradesMatbar && !(reservMatbar && !harForetradesMatt.current) && !nodmatning) return;
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
        const fjardeEl = barn[LISTA_SYNLIGA_RADER - 1];
        const forsta = barn[0].getBoundingClientRect();
        const fjarde = fjardeEl.getBoundingClientRect();
        // [TASK-309.39] Fjärde radens EGEN separator räknas ALDRIG in — se
        // filhuvudets "DEN FJÄRDE SEPARATORN LIGGER UTANFÖR KANTEN"-stycke.
        const spann = fjarde.bottom - forsta.top - separatorBredd(fjardeEl);
        setHojd(spann + kantjustering);
        senastUppmattRadhojd.current = spann / LISTA_SYNLIGA_RADER;
        harPreciserMatt.current = true;
        harMattAlls.current = true;
        if (foretradesMatbar) harForetradesMatt.current = true;
        return;
      }
      // MONOTON — se filhuvudets "PRECISIONEN ÄR MONOTON"-stycke: en gång
      // precist mätt skriver ingen lägre nivå över värdet igen.
      if (harPreciserMatt.current) return;

      let radhojd: number;
      // [TASK-309.39] Den mätta radens EGEN separator, av samma skäl som
      // NIVÅ 1 drar bort den fjärdes: en `radhojd` mätt på en rad som BÄR
      // sin linje innehåller fyra linjer när den multipliceras med fyra,
      // men bara TRE av dem ligger mellan rader. Hålls NOLL i NIVÅ 3 — där
      // finns ingen riktig rad, och `senastUppmattRadhojd` bär redan ett
      // separator-fritt tal (NIVÅ 1/2 skriver det efter avdraget).
      let radensSeparator = 0;
      if (antalRiktigaRader > 0) {
        // NIVÅ 2 — ESTIMAT: MAX av de riktiga radernas EGNA höjd (se
        // filhuvudets "VARFÖR MAX"-stycke).
        radhojd = 0;
        for (let i = 0; i < barn.length; i++) {
          const h = barn[i].getBoundingClientRect().height;
          if (h > radhojd) {
            radhojd = h;
            radensSeparator = separatorBredd(barn[i]);
          }
        }
      } else {
        // NIVÅ 3 — FALLBACK: senast kända radhöjd, annars den dokumenterade
        // konstanten (se `LISTA_FALLBACK_RADHOJD`s docblock — EN konstant,
        // viewport-oberoende, sedan runda 2:s andra varv).
        radhojd = senastUppmattRadhojd.current ?? LISTA_FALLBACK_RADHOJD;
      }
      senastUppmattRadhojd.current = radhojd;
      harMattAlls.current = true;
      setHojd(radhojd * LISTA_SYNLIGA_RADER - radensSeparator + kantjustering);
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
 * ═══ RADEN BÄR BARA DATUMET (Marcus 2026-08-29) ═══
 *
 * Historiken, i tre steg, för den som undrar varför så lite står kvar:
 *
 *   1. `Klass: Uppladdad · 0.0 MB · Uppladdad 17 aug. 2026 22:38` var
 *      utgångsläget. Marcus: *"Ta bort 'Klass:' framför 'Uppladdad:'"*.
 *   2. FILSTORLEKEN UTGICK samtidigt. `0.0 MB` är brus för varje fil under
 *      50 kB, och Lotta fattar inget beslut på den.
 *   3. KLASSLEDET UTGÅR NU OCKSÅ (Marcus 2026-08-29, ordagrant: *"ta bort
 *      'event-mallad'"*). Det stod villkorat — `Uppladdad` doldes som
 *      default-fall medan `Event-mallad`/`Person-genererad`/`Okänd` visades
 *      — och gav rader som `Event-mallad · Uppladdad 29 aug. 2026 19:52`.
 *      Beslut 1 i TASK-147.12-resonemanget ("klassen visas bara när den
 *      säger något nytt") är därmed UPPHÄVT, inte tappat: det är samma
 *      information `RackviddBadge`/mall-pillen redan bär i täckningsraden
 *      ovanför, i en form Lotta faktiskt läser.
 *
 * KVAR STÅR `Uppladdad 17 aug. 2026 22:38` — det enda meta-värdet som
 * faktiskt skiljer två filer åt i en lista — plus `+N äldre filer` när
 * `grupperaPerNamn` kollapsat dubbletter (läggs på av anroparen, inte här).
 *
 * Funktionen returnerar fortfarande en LISTA (inte en sträng): `MetaRad`
 * fogar samman leden med ` · `, och `DokumentRadSkal` spetsar på
 * dubblett-ledet. En framtida yta som vill lägga till ett led gör det på
 * ett ställe.
 */
function metaDelar(current: BilageRad['current']): (string | null)[] {
  return [`Uppladdad ${DATUM_TID.format(new Date(current.skapad))}`];
}

/**
 * ÖPPNANDET — EN KODVÄG, två anropsställen (radens namnknapp i
 * `DokumentRadSkal`, kvitto-posten i `SkapaDokumentMeny`).
 *
 * MÅSTE ANROPAS SYNKRONT UR KLICK-HANDLERN. `window.open` nedan är hela
 * popup-blockerar-säkerheten: fönstret öppnas i användarens egen gest, och
 * adressen sätts EFTERÅT när hämtningen är klar (se filhuvudets IKONPAR-not
 * för mätningen och för varför `noopener` är uteslutet). Lägg aldrig ett
 * `await` före anropet av denna funktion.
 *
 * [TASK-309.26 AC #4 / TASK-309.38] Fönstret får en momentan laddningssida
 * direkt — annars står det tomt (`about:blank`) under hela hämtningen, samma
 * "abrupt tomt fönster" Marcus avvisade 2026-08-22 för genereringsvyn.
 * Väntetexten är personlig men bär det GENERISKA "dokumentet", inte namnet i
 * bestämd form: vägen är delad mellan fritt uppladdade filnamn
 * ("kontrakt_signerat.pdf" — inte en böjbar substantivfras) och katalogens
 * fasta namn, och svensk bestämd form bildas inte med en enda regel över
 * substantiv-klasser (`GenereringsVy.tsx`s `MALL_META` bär därför en
 * uppslagstabell i stället — den vägen har ett känt, litet antal namn).
 */
function oppnaDokument({
  kalla,
  forNamn,
  mutation,
}: {
  kalla: DokumentKalla;
  forNamn: string | null;
  mutation: ReturnType<typeof useForhandsvisaDokument>;
}) {
  const handle = window.open('', '_blank');
  skrivLaddningssida(handle, {
    titel: 'Öppnar dokument…',
    text: forNamn
      ? `Ett ögonblick ${forNamn}, dokumentet öppnas här om några sekunder.`
      : 'Ett ögonblick, dokumentet öppnas här om några sekunder.',
  });
  mutation.mutate({ kalla, handle });
}

/**
 * ═══ RADENS DELADE SKAL — EN FORM FÖR BÅDA LÄGENA ═══
 *
 * Eventläget och räckviddsläget renderade före S107:s fjärde QA-rond varsin
 * nästan identisk rad, med samma metadata-lista skriven två gånger. De hade
 * redan börjat glida isär. Skalet är därför delat KOD, inte delad
 * beskrivning — samma lärdom `HandlingsRad` bär i sitt eget huvud.
 *
 * ═══ [2026-08-29] FRÅN IKONRAD TILL NAMN + ⋯ (Marcus prod-granskning) ═══
 *
 * VAD SOM MÄTTES I PROD (event RIM 1, 2026-08-29): eventlägets rader bar två
 * till fyra kvadratiska ikonknappar (Öppna · Ladda ner · Ersätt · Skapa om)
 * och räckviddslägets bar FEM (+ Ändra räckvidd + Radera) — fem identiska
 * grå lådor i rad, där filnamnet klipptes till "2025-HörlurarMiranonMedi…"
 * för att ikonkolumnen tog bredden. Ikonerna hade inga etiketter; Lotta ska
 * gissa vad en `FileUp` betyder bredvid en `Target`.
 *
 * DEN NYA ANATOMIN — TRE ZONER, ALDRIG FLER:
 *
 *   1. TYPGLYFEN (`TypGlyf`) — en 20 px lucide-ikon i en fast kolumn, så
 *      varje rads text startar på samma x. `aria-hidden`: filändelsen står
 *      redan i namnet, glyfen är ett SKANNINGSSTÖD, inte information.
 *   2. TEXTKOLUMNEN — namnet som KNAPP (radens primära handling = Öppna),
 *      därunder täckningsraden och metaraden. Samma TRE LED som förut, se
 *      nedan.
 *   3. ⋯-KNAPPEN — EN knapp, som öppnar `Meny` med alla sekundära
 *      handlingar, var och en med ikon OCH text.
 *
 * NAMNET ÄR KNAPPEN, INTE EN IKON BREDVID DET. Det tar bort tre av fyra
 * ikonknappar ur bredduppgörelsen och ger namnet all plats som ⋯ inte
 * behöver. Det följer husets egen grammatik (`PersonsList`s namn-Link,
 * `HandlingsRad`) — men UTAN `after:absolute after:inset-0`-greppet: den
 * osynliga klickfällan är riven på Marcus order och återinförs inte (se
 * `MallRad`s docblock för buggen den orsakade).
 *
 * ── RADEN WRAPPAR ALDRIG (`flex-nowrap`) ──
 *
 * TASK-309.20 gav raden `flex-wrap` därför att fyra à fem 44 px-knappar
 * strukturellt inte rymdes bredvid namnkolumnens golv vid 375 px. Med EN
 * knapp kvar är den aritmetiken borta: 24 px glyf + 8 px + namn + 8 px +
 * 44 px ⋯ ryms med marginal i den mätta 251 px-radbredden. Wrappen var en
 * kompensation för ett problem som inte längre finns, och den KOSTADE:
 * mobilraderna i prod visade knapparna under metaraden på rad 1 men till
 * höger på rad 2–3, alltså två olika radformer i samma lista. Nu är
 * anatomin identisk på mobil och skrivbord.
 *
 * ── HOVERN LIGGER PÅ RADEN, INTE PÅ NAMNKNAPPEN ──
 *
 * Raden hovrar till `bg-bg-muted` (#f5f5f3) mot listans `bg-surface`
 * (#ffffff) — ETT tonsteg, exakt samma steg `HandlingsRad` gör från sitt
 * kort (#f5f5f3 → #edeee9). NAMNKNAPPEN bär därför INGEN egen platta:
 *
 *   • `ghost` hade gett hover `--mm-bg-muted` — IDENTISK med radens egen
 *     hover, alltså en osynlig knapp-platta ovanpå en synlig rad-platta.
 *     Det är samma token-identitets-fälla som fällt denna yta sex gånger
 *     (filhuvudets systemiska fynd).
 *   • `primary`+`subtle` hade gett varje rads NAMN en permanent guldtonad
 *     platta — en lista som ser ut som en knapprad.
 *
 * Knappen är alltså transparent i alla lägen och låter radplattan bära
 * återkopplingen; tangentbordet får sin egen ring ur den globala
 * `*:focus-visible`-regeln (base.css). ⋯-knappen behåller däremot
 * `primary`+`subtle` — dess hover (`--mm-button-primary-subtle-bg-hover`)
 * skiljer sig från BÅDE `bg-surface` och `bg-bg-muted`, så invarianten i
 * `IKONKNAPP_KLASS`s docblock hålls.
 *
 * ═══ RADENS FORM ÄR LÅST TILL TRE LED (Marcus 2026-08-17, OFÖRÄNDRAT) ═══
 *
 * *"vi måste se till att alla dokumentrader är lika höga, det måste vara:
 * Dokumentnamn / Täckning / Uppladdningsdatum PÅ ALLA rader, alltid."*
 *
 * TRE LED, ALLTID RENDERADE:
 *   1. namnet     — ETT svep, trunkerat (se nedan)
 *   2. täckningen — badge; event-egna får "Detta event" i stället för
 *                   ingenting (se `RackviddBadge`s egen not)
 *   3. datumet    — `Uppladdad <datum>`
 *
 * NAMNET TRUNKERAS I STÄLLET FÖR ATT RADBRYTA. `truncate` kräver `min-w-0`
 * på varje flex-förfader hela vägen upp, annars växer kolumnen i stället för
 * att klippa — därav `min-w-0` på kolumnen, knappen och namn-spannet.
 *
 * HELA NAMNET NÅS PÅ TVÅ VÄGAR: `title` (pekare) och knappens `aria-label`
 * (skärmläsare — den bär alltid hela namnet). KÄND KANT, medvetet
 * accepterad: på TOUCH finns ingen hover, så ett avklippt namn kan där inte
 * läsas i sin helhet. Motvikten är att namnet nu får HELA raden minus
 * 76 px i stället för minus 182–228 px, alltså att trunkeringen åter är ett
 * skyddsnät för undantaget i stället för normalfallet.
 *
 * "+N ÄLDRE FILER" bor i datumledet, inte som en fjärde rad.
 *
 * ── HÖJDLÅSET RÖRS INTE ──
 *
 * `useLastaListhojd` MÄTER radernas renderade höjd; ingen konstant beskriver
 * dem. Att raden blir något högre (namnknappens 44 px-träffyta) är därför
 * ingen ändring av låsningens logik, bara av det tal den mäter fram.
 */

/** Filändelser som ska visa en bild-glyf i stället för dokument-glyfen. */
const BILDANDELSER = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'avif',
  'heic',
  'heif',
  'bmp',
  'svg',
  'tif',
  'tiff',
]);

/**
 * Radens ledande typglyf. `aria-hidden` — filändelsen står redan i namnet,
 * som skärmläsaren läser; glyfen finns för ÖGAT som skannar en lista.
 *
 * Fast kolumnbredd (`w-6`) så att varje rads text börjar på samma x oavsett
 * glyf, och `h-11` så glyfen centreras mot namnknappens 44 px i stället för
 * att klistra i radens överkant.
 */
function TypGlyf({ namn }: { namn: string }) {
  const andelse = namn.includes('.') ? (namn.split('.').pop() ?? '').toLowerCase() : '';
  const arBild = BILDANDELSER.has(andelse);
  return (
    <span className="flex h-11 w-6 shrink-0 items-center justify-center text-text-secondary">
      {arBild ? (
        <ImageIcon aria-hidden="true" size={20} />
      ) : (
        <FileText aria-hidden="true" size={20} />
      )}
    </span>
  );
}

function DokumentRadSkal({
  namn,
  kalla,
  current,
  dolda,
  menyposter,
  filinput,
}: {
  namn: string;
  kalla: DokumentKalla;
  current: BilageRad['current'];
  dolda: number;
  /**
   * Radens EGNA menyposter (Ersätt/Skapa om/Ändra räckvidd/Radera) — de
   * läggs EFTER den delade "Ladda ner"-posten som skalet självt renderar.
   */
  menyposter?: React.ReactNode;
  /**
   * Dolda `<input type="file">` raden behöver (Ersätt). MÅSTE renderas i
   * RADEN och inte bland menyposterna: `Popover` portalerar sitt innehåll
   * till `document.body`, så en input inuti menyn hade lämnat raden — och
   * varje test som scopar `rad.locator('input[type="file"]')` hade slutat
   * hitta den.
   */
  filinput?: React.ReactNode;
}) {
  // ÖPPNA + LADDA NER BOR HÄR, inte i anropande radkomponent: båda gäller
  // VARJE rad i båda lägena, och två instanser av samma hook i två
  // radkomponenter var precis det som lät lägena glida isär före S107.
  const forhandsvisaMutation = useForhandsvisaDokument();
  const nedladdningMutation = useLaddaNerDokument();
  // [TASK-309.38] Samma väntehälsning som GenereringsVy.tsx.
  const { user } = useAuth();
  const forNamn = user?.displayName ? fornamn(user.displayName) : null;

  return (
    <div
      data-testid="dokument-fil"
      className="-mx-2 flex flex-nowrap items-start gap-2 rounded-lg px-2 py-2 hover:bg-bg-muted motion-safe:transition-colors"
    >
      <TypGlyf namn={namn} />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        {/* NAMNET ÄR KNAPPEN — se docblocket för varför den är transparent
            och varför hovern ligger på raden. `-mx-2 px-2` låter träffytan nå
            ut i radens egen luft utan att namnet flyttar sig visuellt. */}
        <Button
          intent="ghost"
          size="sm"
          className="-mx-2 min-h-11 w-full min-w-0 justify-start rounded-lg px-2 font-medium text-body data-[hovered]:bg-transparent data-[pressed]:bg-transparent"
          // `aria-disabled`, INTE `isDisabled`: ett native `disabled` tar
          // knappen ur tabordningen mitt i klicket. Vakten i onPress bär
          // dubbelklicks-skyddet i stället.
          aria-disabled={forhandsvisaMutation.isPending}
          aria-label={forhandsvisaMutation.isPending ? `Öppnar ${namn} …` : `Öppna ${namn}`}
          onPress={() => {
            if (forhandsvisaMutation.isPending) return;
            oppnaDokument({ kalla, forNamn, mutation: forhandsvisaMutation });
          }}
        >
          {forhandsvisaMutation.isPending && (
            <Loader2
              aria-hidden="true"
              size={IKON_STORLEK}
              className="shrink-0 motion-safe:animate-spin"
            />
          )}
          <span className="min-w-0 truncate" title={namn}>
            {namn}
          </span>
        </Button>
        {/* [TASK-309.6, ADR-125 § 3+5] Mall-/INAKTUELL-badgen delar RADEN med
            RackviddBadge (samma "TRE LED, ALLTID RENDERADE"-lås) i stället för
            att lägga till en fjärde rad. INAKTUELL bär TEXT, inte bara färg
            (`StatusBadge`, WCAG 1.4.1). `w-full min-w-0` så en för bred badge
            TRUNKERAS inom raden i stället för att flyta ut. */}
        <span className="flex w-full min-w-0 flex-wrap items-center gap-1">
          <RackviddBadge
            rackvidd={current.rackvidd}
            kursfamilj={current.kursfamilj}
            kursniva={current.kursniva}
            plats={current.plats}
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
        {/* FELEN BOR I TEXTKOLUMNEN, inte i handlingszonen. De två
            mutationerna vars knappar flyttat in i menyn (Öppna, Ladda ner)
            har ingen synlig knapp att stå bredvid längre — och en felruta i
            en portalerad meny hade försvunnit i samma ögonblick menyn
            stängdes. */}
        {forhandsvisaMutation.isError && (
          <MessageBox intent="error" title="Kunde inte öppna filen" className="mt-1 w-full">
            {forhandsvisaMutation.error instanceof Error
              ? forhandsvisaMutation.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        )}
        {nedladdningMutation.isError && (
          <MessageBox intent="error" title="Kunde inte ladda ner filen" className="mt-1 w-full">
            {nedladdningMutation.error instanceof Error
              ? nedladdningMutation.error.message
              : 'Inget felmeddelande angavs.'}
          </MessageBox>
        )}
      </span>
      {filinput}
      <Meny
        etikett={`Fler val för ${namn}`}
        trigger={
          <Button
            intent="primary"
            emphasis="subtle"
            size="sm"
            className={IKONKNAPP_KLASS}
            aria-label={`Fler val för ${namn}`}
          >
            <Ellipsis aria-hidden="true" size={IKON_STORLEK} />
          </Button>
        }
      >
        <MenyPost
          ikon={
            nedladdningMutation.isPending ? (
              <Loader2
                aria-hidden="true"
                size={IKON_STORLEK}
                className="motion-safe:animate-spin"
              />
            ) : (
              <Download aria-hidden="true" size={IKON_STORLEK} />
            )
          }
          isDisabled={nedladdningMutation.isPending}
          textValue="Ladda ner"
          onAction={() => {
            if (nedladdningMutation.isPending) return;
            nedladdningMutation.mutate({ kalla, namn });
          }}
        >
          {nedladdningMutation.isPending ? 'Laddar ner…' : 'Ladda ner'}
        </MenyPost>
        {menyposter}
      </Meny>
    </div>
  );
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;
type ReplaceMutation = ReturnType<typeof useReplaceAttachment>;
type DeleteMutation = ReturnType<typeof useDeleteAttachment>;
/** [TASK-338.4] "Ändra räckvidd"-mutationen — samma härlednings-mönster
    som syskonen ovan, så en signaturändring i hooken följer med hit. */
type ScopeMutation = ReturnType<typeof useUpdateAttachmentScope>;
type SkapaOmMutation = ReturnType<typeof useSkapaOmEventBilaga>;

/** [TASK-275.3, OMBYGGD TASK-338.3] Sant för en GEMENSAM bilaga (räckvidd
    `Gemensam`) — delad mellan BilageRadRow (döljer Ersätt) och badgens eget
    "Detta event"-villkor (RackviddBadge.tsx).

    ETT värde att jämföra mot i stället för två: legacy-räckvidderna
    normaliseras bort vid datagränsen (`normaliseraRaAttachment`), så ingen
    UI-yta behöver längre känna till `Kurstyp`/`Alla event`. */
function arGemensam(rackvidd: Attachment['rackvidd']): boolean {
  return rackvidd === AttachmentScope.GEMENSAM;
}

/**
 * ÖPPNAR RADENS DOLDA FILVÄLJARE — den väg "Ersätt" tar sedan handlingen
 * flyttade in i ⋯-menyn.
 *
 * VARFÖR INTE `FileTrigger` LÄNGRE: react-arias `FileTrigger` driver sin
 * dolda input via `PressResponder`-kontexten (verifierat i den installerade
 * källan, `react-aria-components/dist/private/FileTrigger.mjs` — den
 * renderar `<PressResponder onPress={…}>{children}</PressResponder>` plus
 * inputen). `MenuItem` bygger på `useMenuItem` och konsumerar INTE den
 * kontexten, så en menypost inuti en `FileTrigger` hade aldrig öppnat något.
 * Raden renderar därför inputen själv och menyposten klickar den.
 *
 * `value = ''` FÖRE klicket är inte kosmetik: utan nollställningen fyrar
 * `change` inte när SAMMA fil väljs två gånger i rad, och Lotta som råkat
 * välja fel version och väljer om den rätta hade fått tyst ingenting.
 * `FileTrigger` gör exakt samma sak i sin `onPress` (samma källa).
 */
function oppnaFilvaljare(ref: React.RefObject<HTMLInputElement | null>) {
  const input = ref.current;
  if (!input) return;
  input.value = '';
  input.click();
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
  const ersattInputRef = useRef<HTMLInputElement>(null);
  // Bara DENNA rads meny visar "Ersätter…" — inte hela listan (till skillnad
  // mot uppladdningsknappen, som stänger av sig själv via sin egen
  // `uploadMutation.isPending`). `variables` finns bara medan mutationen
  // faktiskt pågår (TanStack Query), så jämförelsen är säker även innan
  // första anropet.
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
  // [TASK-309.6] Samma "bara DENNA rad"-disciplin som `ersatterDennaRaden`.
  const skaparOmDennaRaden =
    skapaOmMutation.isPending && skapaOmMutation.variables?.ersatt === current.id;
  // [TASK-275.3, ADR-118 beslut 3] Ersätt VISAS INTE i eventkontext för en
  // GEMENSAM bilaga — badgen bär förklaringen (AC #4). Servern nekar 403
  // ändå (delete-attachment/index.ts), men UI-lagret ska inte erbjuda en
  // handling den vet kommer avvisas.
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
      filinput={
        !gemensam && (
          // `hidden` (display:none) — EXAKT samma form som `FileTrigger`
          // renderar sin egen input i (`style={{display:'none'}}`), så den
          // varken syns, tar tabbstopp eller når skärmläsaren.
          <input
            ref={ersattInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) =>
              onReplace(e.target.files, current.id, {
                rackvidd: current.rackvidd ?? undefined,
                kursfamilj: current.kursfamilj ?? undefined,
                kursniva: current.kursniva ?? undefined,
                // [TASK-338.3] Plats-axeln MÅSTE följa med — se
                // `ReplaceAttachmentInput`s docblock: utan den vidgas en
                // platsbunden bilaga tyst till ALLA event vid nästa byte.
                plats: current.plats?.id ?? undefined,
              })
            }
          />
        )
      }
      menyposter={
        <>
          {/* [TASK-275.3, ADR-118 beslut 3] Ersätt VISAS INTE i eventkontext
              för en GEMENSAM bilaga — badgen bär förklaringen (AC #4).

              För eventets EGNA filer står den kvar (Marcus-beslut
              2026-08-17): förvaltningen flyttades i övrigt till
              räckviddsläget, men en event-egen fil syns inte där, så utan
              denna post hade den saknat ersätt-väg helt. */}
          {!gemensam && (
            <MenyPost
              ikon={
                ersatterDennaRaden ? (
                  <Loader2
                    aria-hidden="true"
                    size={IKON_STORLEK}
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <FileUp aria-hidden="true" size={IKON_STORLEK} />
                )
              }
              isDisabled={ersatterDennaRaden}
              textValue="Ersätt"
              onAction={() => oppnaFilvaljare(ersattInputRef)}
            >
              {ersatterDennaRaden ? 'Ersätter…' : 'Ersätt'}
            </MenyPost>
          )}
          {skapaOmMallId !== null && (
            <MenyPost
              ikon={
                skaparOmDennaRaden ? (
                  <Loader2
                    aria-hidden="true"
                    size={IKON_STORLEK}
                    className="motion-safe:animate-spin"
                  />
                ) : (
                  <RefreshCw aria-hidden="true" size={IKON_STORLEK} />
                )
              }
              isDisabled={skaparOmDennaRaden}
              textValue="Skapa om"
              onAction={() => {
                if (skaparOmDennaRaden) return;
                skapaOmMutation.mutate({ mall: skapaOmMallId, ersatt: current.id });
              }}
            >
              {skaparOmDennaRaden ? 'Skapar om…' : 'Skapa om'}
            </MenyPost>
          )}
        </>
      }
    />
  );
}

/**
 * ═══ HANDLINGSRADEN ÖVER LISTAN — MALLAR OCH GENERATORER ÄR HANDLINGAR,
 *     INTE DOKUMENT (`T176`, Marcus 2026-08-29) ═══
 *
 * `MallRad`/`GeneratorRad` är RIVNA. De renderades som rader i
 * dokumentlistan trots att de inte ÄR dokument — de är sätt att SKAPA ett.
 * Följden syntes i prod: en lista med sex poster där två (Deltagarinformation-
 * mallen, Betalningskvitto-generatorn) låg under rullningskanten och alltså
 * var osynliga, och där Lotta fick skanna förbi katalogposter för att hitta
 * sina verkliga filer. Katalogerna (`MALLAR`/`GENERATORER`) lever kvar som
 * kod-nivå-listor — det är RENDERINGEN som flyttat, inte datan.
 *
 * Raden bär TVÅ handlingar, i den ordning Lotta gör dem (*"Tror hon kommer
 * ladda upp mest"*, Marcus 2026-08-17):
 *
 *   1. `Ladda upp fil` — samma `FileTrigger`-flöde och samma
 *      `uploadMutation` som knappen under listan hade. Den knappen är riven:
 *      två uppladdningsvägar på samma sida hade varit två ställen att hålla
 *      i synk, och `UppladdningsFel` bor kvar på SIDAN (dialogen rivs vid
 *      framgång och hade tagit felet med sig).
 *   2. `Skapa dokument ▾` — samma `Meny`-primitiv som radernas ⋯, med
 *      mallarna och kvittot som poster.
 *
 * ── RÄCKVIDDSLÄGET FÅR BARA UPPLADDNINGEN, OCH DET ÄR DAGENS BETEENDE ──
 *
 * `MALLAR`/`GENERATORER` renderades aldrig i `GemensamtLage`: en mall
 * genereras UR ett events data och har inget meningsfullt läge utan valt
 * event (`GemensamtLage`s eget docblock). Menyn utelämnas därför helt när
 * `eventId` är `null` — hellre ingen knapp än en avstängd som lovar något
 * ytan inte kan hålla.
 *
 * ── PLACERINGEN ÄRVER FILTERRADENS PLATS, INTE UPPLADDNINGSKNAPPENS ──
 *
 * Marcus 2026-08-18 om varför uppladdningen stod UNDER listan: *"detta gör
 * det logiskt att sätta Ladda upp-knappen under dokumentlistan"* — och skälet
 * var att listan rullar inline och därför aldrig växer förbi sin maxhöjd.
 * Argumentet håller fortfarande för en knapp under listan, men handlingarna
 * hör ihop som ETT block ("vad kan jag göra här?") och listan som ett annat
 * ("vad finns här?"). Att splittra dem på var sin sida om listan hade gett
 * två handlingszoner. Filterraden lämnade dessutom exakt den platsen
 * (`DokumentLista` nedan), så kortets överkant stod tom.
 */
function ListHandlingsRad({
  eventId,
  uploadMutation,
  onValjFil,
}: {
  /** `null` = räckviddsläget: bara uppladdning, ingen "Skapa dokument". */
  eventId: string | null;
  uploadMutation: UploadMutation;
  onValjFil: (filer: FileList | null) => void;
}) {
  return (
    // `pt-1`, INGEN horisontell padding — knapparnas kanter ska LINJERA
    // EXAKT med listans. Här stod `px-1` med motiveringen att knapparna
    // "behöver egen luft för att inte klistra i ramens kant"; den var fel.
    // Listan själv ligger vid ramens kant (kortets `p-2`), så 4 px extra
    // indrag gav en synlig förskjutning mot listan i stället för luft —
    // mätt i skärmdump: knappens vänsterkant 385 mot listans 381 vid
    // 1280 px, 45 mot 41 (och högerkanten 345 mot 349) vid 390 px. Knappar
    // som linjerar med listan läser som en rad i samma kolumn; 4 px
    // förskjutning läser som ett fel. Den vertikala luften (`pt-1`) står
    // kvar — den skiljer handlingsraden från kortets överkant utan att
    // röra kolumnen.
    //
    // ═══ STAPLADE I FULL BREDD UNDER `sm`, SIDA VID SIDA FRÅN `sm` ═══
    //
    // Första formen var `flex-wrap`: knapparna behöll sin intrinsic bredd
    // (mätt vid 390 px: 132 resp. 181 px) och bröt till två VÄNSTERSTÄLLDA
    // rader med olika längd — det såg oavslutat ut, inte som en medveten
    // mobilform. `flex-col` + `w-full` staplar dem i stället som ETT block
    // med samma bredd, primärhandlingen överst; `sm:flex-row` + `sm:w-auto`
    // ger tillbaka sida-vid-sida-formen så fort bredden räcker.
    //
    // BREDDEN MÅSTE NÅ SJÄLVA `<Button>`. `MenuTrigger` (react-aria) renderar
    // INGET eget DOM-element — den är en ren kontextleverantör plus en
    // portalerad `Popover` — så `Meny`s trigger-knapp är ett DIREKT flexbarn
    // och tar `w-full` självt. Uppladdningens `FileTrigger` gör detsamma
    // (fragment + dold input), men den ligger inuti `data-testid`-ankaret
    // nedan, så DEN diven måste också bära `w-full sm:w-auto` — annars
    // sträcker sig ankaret men inte knappen.
    <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-center">
      {/* `data-testid` på WRAPPERN, inte på knappen: `FileTrigger` renderar
          sin dolda `<input type="file">` som SYSKON till knappen, och det är
          inputen testet behöver nå (`setInputFiles`). Sidan bär flera
          filväljare — varje rads "Ersätt" är en — så ett scopat ankare är
          enda sättet att träffa RÄTT input. Ankarnamnet är oförändrat sedan
          knappen bodde under listan, så befintliga tester följer med. */}
      <div data-testid="ladda-upp-ny-fil" className="w-full sm:w-auto">
        <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={onValjFil}>
          {/* `min-h-11` — 44 px-golvet, samma som filterraden bar
              (`min-h-11` per pill, "size='sm' ensamt gav 37 px, under
              golvet") och samma som radernas ⋯ bär via `IKONKNAPP_KLASS`.
              `size="sm"` styr typografi och sidpadding, ALDRIG höjden:
              dess `min-h-8` mätte 32 px, alltså under golvet för sidans
              primära handling. */}
          <Button
            intent="primary"
            size="sm"
            className="min-h-11 w-full sm:w-auto"
            isDisabled={uploadMutation.isPending}
          >
            <Upload aria-hidden="true" size={IKON_STORLEK} className="shrink-0" />
            {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp fil'}
          </Button>
        </FileTrigger>
      </div>
      {eventId !== null && <SkapaDokumentMeny eventId={eventId} />}
    </div>
  );
}

/**
 * "Skapa dokument ▾" — mallkatalogen plus kvittot, som meny i stället för
 * listrader.
 *
 * MALLPOSTERNA gör EXAKT vad `MallRad`s chevron-knapp gjorde: sätter
 * `?mall=` och `?vy=generering` via nuqs, så `dokument.tsx`s routekomponent
 * byter till `GenereringsVy`. Ingen ny navigeringsväg, bara en ny form.
 *
 * ═══ KVITTOT ÖPPNAR — DET LADDAS INTE NER (orkestrerar-beslut, Marcus
 *     mandat 2026-08-29) ═══
 *
 * `GeneratorRad` bar TVÅ knappar, Öppna och Ladda ner. Nedladdningen är
 * riven och får ingen menypost. Skälet är inte förenkling utan
 * kvittoseriens integritet: kvittots ENDA leveransväg är "Skicka kvitto" i
 * Åtgärder (`AtgardsSida.tsx`, TASK-147.7/ADR-109), där SERVERN allokerar
 * kvittonumret. En PDF nedladdad härifrån saknar kvittonummer och är alltså
 * ett kvitto-LIKNANDE dokument utanför serien — en nedladdningsknapp hade
 * bjudit in till att mejla den för hand och därmed kringgå serien.
 * Dokumentytans generator är en FÖRHANDSVISNING av kvittoformen, inte ett
 * kvitto (`preview-receipt/index.ts` § PERSONDATA: typexempel, aldrig en
 * verklig anmälan, och den når aldrig Storage, Bilagor-raden eller ett
 * allokerat kvittonummer).
 */
function SkapaDokumentMeny({ eventId }: { eventId: string }) {
  // nuqs-paret genereringsvyn läser i `dokument.tsx`s routekomponent
  // (`vy`/`mall`) — samma nycklar, ingen prop-borrning: `DokumentYta` och
  // `GenereringsVy` är syskon under samma route.
  const [, setVy] = useQueryState('vy');
  const [, setMall] = useQueryState('mall');
  const forhandsvisaMutation = useForhandsvisaDokument();
  const { user } = useAuth();
  const forNamn = user?.displayName ? fornamn(user.displayName) : null;

  return (
    <>
      <Meny
        etikett="Skapa dokument"
        // `bottom start` (inte radernas `bottom end`): triggern står till
        // VÄNSTER i sin rad, så menyn ska växa åt höger.
        placement="bottom start"
        trigger={
          // `min-h-11 w-full sm:w-auto` — samma 44 px-golv och samma
          // stapel-form som uppladdningsknappen (se `ListHandlingsRad`s
          // docblock). Knappen är ett DIREKT flexbarn i handlingsraden:
          // `MenuTrigger` renderar inget eget DOM-element, så bredden når
          // hela vägen ner utan en wrapper att kompensera för.
          <Button
            intent="secondary"
            emphasis="outline"
            size="sm"
            className="min-h-11 w-full sm:w-auto"
          >
            <FilePlus aria-hidden="true" size={IKON_STORLEK} className="shrink-0" />
            Skapa dokument
            <ChevronDown aria-hidden="true" size={IKON_STORLEK} className="shrink-0" />
          </Button>
        }
      >
        {MALLAR.map((mall) => (
          <MenyPost
            key={mall.id}
            ikon={<FileText aria-hidden="true" size={IKON_STORLEK} />}
            textValue={mall.namn}
            onAction={() => {
              void setMall(mall.id);
              void setVy('generering');
            }}
          >
            {mall.namn}
          </MenyPost>
        ))}
        {GENERATORER.map((gen) => (
          <MenyPost
            key={gen.id}
            ikon={
              forhandsvisaMutation.isPending ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Receipt aria-hidden="true" size={IKON_STORLEK} />
              )
            }
            isDisabled={forhandsvisaMutation.isPending}
            textValue={gen.namn}
            onAction={() => {
              if (forhandsvisaMutation.isPending) return;
              // Samma popup-blockerar-säkra väg som radernas namnknapp —
              // `window.open` synkront i handlern, adressen efteråt.
              oppnaDokument({
                kalla: { typ: 'generator', eventId },
                forNamn,
                mutation: forhandsvisaMutation,
              });
            }}
          >
            {gen.namn}
          </MenyPost>
        ))}
      </Meny>
      {forhandsvisaMutation.isError && (
        <MessageBox intent="error" title="Kunde inte öppna dokumentet" className="w-full">
          {forhandsvisaMutation.error instanceof Error
            ? forhandsvisaMutation.error.message
            : 'Inget felmeddelande angavs.'}
        </MessageBox>
      )}
    </>
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

/**
 * ═══ KORTETS RAM ÄR 8 px, INTE 16 (Marcus 2026-08-29) ═══
 *
 * *"Man kanske kan göra 'listytan', den höjdlåset sitter på lite större, så
 * den gråa ramen som är bakgrunden blir lite smalare också, stör mig lite på
 * att 'ramen' är så tjock."*
 *
 * Kortet (`grupp-kort`, `bg-bg-muted`) bär listans egen `bg-surface`-yta, och
 * dess padding ÄR därför en synlig ram. `p-4` → `p-2` halverar den och ger
 * listytan 16 px mer bredd. SYMMETRIN är oförändrad och icke förhandlingsbar
 * (Marcus 2026-08-18: *"den grå ramen ser bredare ut på sidorna än vad den är
 * över och under"*) — `p-2` är lika brett runtom, precis som `p-4` var.
 *
 * DELAD KONSTANT, INTE TVÅ STRÄNGAR: eventläget och räckviddsläget bar
 * identiska men separata klass-strängar för både kortet och `<ul>`:et. De hade
 * redan glidit isär en gång (`sistaRadenBarLinje` saknades helt i
 * räckviddsläget, TASK-309.24) — samma lärdom `DokumentRadSkal` och
 * `HandlingsRad` bär i sina egna huvuden.
 */
const GRUPPKORT_KLASS =
  'flex flex-col gap-2 rounded-2xl border border-transparent bg-bg-muted p-2 contrast-more:border-border-strong';

/**
 * ═══ LISTANS RAM — `<ul>`:et, rullningen och uttoningen, EN gång ═══
 *
 * `<ul>`/`<li>`, INTE `<div>` — och det är ett a11y-krav, inte smak:
 * `aria-label` stöds inte av en rollös `<div>` (biome
 * `useAriaPropsSupportedByRole` fällde exakt det, mätt 2026-08-18), och
 * listrollen bär namnet. Det är dessutom husets form för samma sak
 * (`NyaAnmalningar.tsx`, `Deltagare.tsx`). `divide-y` opererar på direkta
 * barn, så avdelarna följer `<li>`-elementen.
 *
 * LISTAN ÄR EN EGEN YTA: `bg-surface` MOT KORTETS `bg-bg-muted`. Marcus
 * 2026-08-18: *"vi behöver ge inline-scroll-ytan en annan färg/toning"*.
 * TOKENVALET ÄR PÅTVINGAT, INTE SMAK — kortet ÄR `bg-bg-muted`, så en lista
 * med samma token hade varit OSYNLIG (filhuvudets systemiska fynd: sex
 * instanser av exakt den felklassen på denna yta).
 *
 * INLINE-RULLNING är husets etablerade form (`NyaAnmalningar.tsx`,
 * `ForfallnaBetalningar.tsx` ×3, `Deltagare.tsx`, `EventValjare`s listbox) —
 * klasserna är kopierade ur den, inte uppfunna. TABB-STOPPET sätts BARA när
 * listan faktiskt rullar (`Deltagare.tsx`s förfining: *"ett fokuserbart
 * område utan funktion vore ett tomt stopp i tangentbordsflödet"*); när den
 * rullar är `tabIndex={0}` ett WCAG 2.1.1-golv (axe
 * `scrollable-region-focusable`).
 *
 * ── RULLNINGSSKUGGAN: DOLDA RADER SKA SYNAS SOM DOLDA (T176) ──
 *
 * Prod 2026-08-29: `scrollHeight 594 / clientHeight 395` med SEX rader — två
 * låg under kanten utan att något antydde det. Låst höjd + `overflow-y: auto`
 * ger ingen rullningslist förrän man rör listan (macOS overlay-scrollbars),
 * så kanten såg ut som slutet.
 *
 * DEN ÄR EN SKUGGA, INTE EN UTTONING MOT YTFÄRGEN — och det är ett MÄTT val,
 * inte en smaksak. Första formen var en gradient `from-surface` (vitt) som
 * tonade ut innehållet mot listans egen botten. Den fungerar när en HALV rad
 * sticker fram under kanten, men vår höjd är låst till EXAKT fyra hela rader:
 * gradienten lade sig då över fjärde radens datumrad och gjorde den blek
 * (avläst i skärmdump: "Uppladdad 29 aug. 2026 19:32" halvsuddad på rad 4 men
 * inte på 1–3), vilket läser som en renderingsbugg snarare än "det finns mer".
 * Kortare gradient (16 px) tog bort suddigheten men också hela signalen.
 *
 * Formen är i stället husets state-layer-token `--mm-state-hover`
 * (`color-mix(in srgb, var(--mm-text) 6%, transparent)`) tonad uppåt mot
 * transparent — ETT genomskinligt skrim, alltså exakt den roll tokenets eget
 * docblock beskriver ("mörknar vilken yta som helst under sig med ett
 * konstant perceptuellt steg", uppmätt ΔE00 2,63 mot vit). Texten under
 * DÄMPAS inte, den får en svag skugga bakom sig — samma avläsning som
 * Material 3:s scroll-edge och Lea Verous klassiska "scrolling shadows".
 *
 * SKUGGAN LIGGER PÅ WRAPPERN, ALDRIG PÅ `<ul>`. Höjdlåset mäter `<ul>`:ets
 * bounding box och dess `border-*`-bredder (`useLastaListhojd` § kantjustering)
 * — ett element INUTI `<ul>` hade blivit ett femte "barn" som `mat()` räknar
 * som en rad, och en padding/margin hade förskjutit spannet. En absolut
 * positionerad syskon-`<span>` i en `relative` wrapper rör ingendera.
 *
 * DEN FÖRSVINNER VID BOTTEN. En skugga som ligger kvar när man rullat hela
 * vägen ner ljuger — den säger "mer finns" om ett tomt slut. `onScroll`
 * (billig: listan har fyra synliga rader, ingen virtualisering) sätter
 * `vidBotten`, och `- 1` i jämförelsen är sub-pixel-marginalen `scrollTop`
 * bär vid fraktionella höjder.
 *
 * `prefers-contrast: more` BYTER SKRIM MOT KANT: ett 6 %-skrim är per
 * definition låg kontrast, och användare som bett om hög kontrast har bett
 * bort just den signalklassen. Under den mediafrågan blir signalen en 4 px
 * solid `border-strong`-list i stället. `prefers-reduced-motion` kräver
 * inget: signalen animeras inte alls.
 */
function DokumentListRam({
  listRef,
  matadHojd,
  kanRulla,
  sistaRadenBarLinje,
  ariaLabel,
  children,
}: {
  listRef: React.RefObject<HTMLUListElement | null>;
  matadHojd: number | null;
  kanRulla: boolean;
  sistaRadenBarLinje: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const [vidBotten, setVidBotten] = useState(false);
  return (
    <div className="relative">
      <ul
        ref={listRef}
        data-testid="dokument-lista"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: fokuserbar scrollregion är WCAG 2.1.1-golvet (axe scrollable-region-focusable) — samma motiv som NyaAnmalningar.tsx.
        tabIndex={kanRulla ? 0 : undefined}
        aria-label={kanRulla ? ariaLabel : undefined}
        onScroll={(e) => {
          const el = e.currentTarget;
          setVidBotten(el.scrollTop + el.clientHeight >= el.scrollHeight - 1);
        }}
        // [TASK-309.24] Höjden är en MÄTNING (`useLastaListhojd`), inte ett
        // hårdkodat px-tal — se hookens docblock. `matadHojd` kan vara `null`
        // under en enda synkron render-cykel innan `useLayoutEffect` hunnit
        // mäta (ingen synlig flimmer, samma "mät efter commit, applicera före
        // paint"-garanti React ger `useLayoutEffect`); listan visar då sin
        // NATURLIGA höjd, vilket är exakt vad mätningen själv behöver läsa av.
        // Låsningen är OVILLKORAD — se `berakaListgeometri`s docblock.
        style={matadHojd !== null ? { height: matadHojd, maxHeight: matadHojd } : undefined}
        className={`focus-ring-inset scrollbar-inline divide-y divide-border rounded-xl border border-transparent bg-surface px-3 contrast-more:divide-border-strong contrast-more:border-border-strong ${
          kanRulla ? 'overflow-y-auto' : 'overflow-y-hidden'
        } ${
          sistaRadenBarLinje
            ? '[&>li:last-child]:border-border [&>li:last-child]:border-b contrast-more:[&>li:last-child]:border-border-strong'
            : ''
        }`}
      >
        {children}
      </ul>
      {kanRulla && !vidBotten && (
        <span
          aria-hidden="true"
          data-testid="lista-uttoning"
          className="pointer-events-none absolute inset-x-px bottom-px h-6 rounded-b-xl bg-linear-to-t from-(--mm-state-hover) to-transparent contrast-more:h-1 contrast-more:rounded-none contrast-more:bg-border-strong contrast-more:bg-none"
        />
      )}
    </div>
  );
}

/**
 * DOKUMENT-LISTAN (eventläget) — EN flat lista med EVENTETS BILAGOR, punkt.
 *
 * ═══ [T176, Marcus 2026-08-29] TYPFILTRET ÄR RIVET ═══
 *
 * `ListaTyp`/`LISTA_FILTER`/`ToggleButtonGroup` och nuqs-nyckeln `?typ` är
 * borta. De filtrerade mellan bilagor, mallar och generatorer — och sedan
 * mallarna och generatorerna flyttat upp i handlingsraden
 * (`ListHandlingsRad`) finns bara EN sorts rad kvar. Ett filter med tre
 * alternativ varav två är tomma är sämre än inget filter.
 *
 * FÖLJDRIVNINGAR I SAMMA DRAG, båda för att `?typ` inte längre existerar:
 *   • TASK-309.40:s nollställning av `?typ` vid räckviddsbyte
 *     (`handleRackviddsByte`) — den fanns för att filtret annars överlevde
 *     ett byte osynligt.
 *   • TASK-340.2:s `setTyp('bilaga')` i `dokument.tsx`s "Till dokumenten"
 *     (`GenereringsVy`s bekräftelseyta). NAVIGERINGEN är kvar — bara
 *     parametern är borta, och landningen visar nu bilagorna ändå eftersom
 *     listan inte kan visa något annat.
 *
 * ═══ HÖJDLÅSETS INKOPPLING EFTER RIVNINGEN ═══
 *
 * `useLastaListhojd(rader.length >= LISTA_SYNLIGA_RADER, true, rader.length,
 * rader)`. Hookens kropp är ORÖRD; det är argumenten som ändras, och varje
 * ändring följer av att filtret försvann:
 *
 *   • `foretradesMatbar` var *"'bilaga'-filtret OCH minst fyra egna rader"*.
 *     Filtervillkoret är alltid uppfyllt nu (det finns bara en kontext), så
 *     kvar står radvillkoret: `rader.length >= LISTA_SYNLIGA_RADER`.
 *   • `reservMatbar` var *"filtret 'alla'"* — likaså alltid uppfyllt, alltså
 *     `true`.
 *   • `antalRiktigaRader` var det FILTRERADE antalet; nu `rader.length`.
 *
 * DE TVÅ KÄLLORNA FANNS FÖR ETT PROBLEM SOM INTE LÄNGRE FINNS. Hookens
 * docblock: *"en rads pixelhöjd beror mätt på hur många SYSKON den har i DOM,
 * inte bara sitt eget innehåll (samma rad mätte 99 px bland sju syskon, 98 px
 * bland fyra)"* — därav företrädet för den kontext AC #2 faktiskt prövas i.
 * Med EN kontext kan de två aldrig ge olika tal, och `harForetradesMatt`-
 * spärren blir en no-op i praktiken. Den lämnas orörd i hooken: den skadar
 * inget, och `GemensamtLage` anropar redan hooken med `true, true` sedan
 * TASK-309.24 — de två lägena bär nu IDENTISK inkoppling så när som på
 * företrädesvillkoret.
 *
 * NÖDMÄTNINGEN (nivå 3, TASK-309.39) tar 0–3-radersfallet precis som förut.
 * De två vägar dess docblock listar som "nåbara" — `?typ=bilaga` på ett event
 * med färre än fyra bilagor, och sidladdning i `?typ=mall`/`?typ=generator`
 * — är BÅDA rivna med filtret; nivå 3 nås nu bara av det ärliga fallet
 * "eventet har inga bilagor".
 */
function DokumentLista({
  eventId,
  rader,
  onReplace,
  replaceMutation,
  uploadMutation,
  onValjFil,
}: {
  eventId: string;
  rader: BilageRad[];
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  uploadMutation: UploadMutation;
  onValjFil: (filer: FileList | null) => void;
}) {
  // [TASK-309.6] "Skapa om" (AC #4) — EN mutation-instans för HELA listan,
  // samma "bara denna rads post lyser"-mönster som `replaceMutation`
  // (`skaparOmDennaRaden` i `BilageRadRow`). Instansierad HÄR (inte lyft upp
  // till `DokumentYta`): denna komponent har redan ett GARANTERAT non-null
  // `eventId: string` — `DokumentYta`s eget `eventId` är `string | null`
  // (räckviddsläget), och "Skapa om" existerar strukturellt inte där
  // (Event-mallade rader visas aldrig i `GemensamtLage`, se
  // `AirtableAdapter.berikaMedInaktuell` § docblock).
  const skapaOmMutation = useSkapaOmEventBilaga(eventId);

  const { kanRulla, sistaRadenBarLinje } = berakaListgeometri(rader.length);
  const { listRef, hojd: matadHojd } = useLastaListhojd(
    rader.length >= LISTA_SYNLIGA_RADER,
    true,
    rader.length,
    rader,
  );

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        {/* INGEN RUBRIK I KORTET — BESLUTAD BORT, INTE TAPPAD (Marcus,
            QA 273.5 steg 5, 2026-08-18: *"Ta bort rubriken 'Dokument för
            eventet' i eventläget … Man ser ju vad de olika ytorna är för
            något ändå."*). `<h1>Dokument` står redan i sidhuvudet och
            `EventValjare` direkt ovanför visar VILKET event listan gäller.

            `<section>` står UTAN `aria-labelledby` — husets etablerade form
            för sektioner utan egen rubrik (`Waitlist.tsx`, `Hem.tsx`,
            `InstalleraAppen.tsx`). En namnlös `section` exponeras per spec
            inte som landmark, vilket är rätt: den ÄR inte en självständig
            region. */}
        <div data-testid="grupp-kort" className={GRUPPKORT_KLASS}>
          <ListHandlingsRad
            eventId={eventId}
            uploadMutation={uploadMutation}
            onValjFil={onValjFil}
          />
          <DokumentListRam
            listRef={listRef}
            matadHojd={matadHojd}
            kanRulla={kanRulla}
            sistaRadenBarLinje={sistaRadenBarLinje}
            ariaLabel="Dokument"
          >
            {rader.map((r) => (
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
            {rader.length === 0 && (
              <li className="py-3 text-small text-text-muted">
                Inga bilagor för det här eventet än.
              </li>
            )}
          </DokumentListRam>
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
 *
 * ═══ TVÅ LÄGEN SEDAN TASK-338.4 (ADR-125 § Beslut 1) ═══
 *
 * Samma dialog bär nu BÅDE uppladdningens räckviddsfråga och "Ändra
 * räckvidd" på en redan uppladdad delad bilaga (PRD TASK-338 berättelse 8).
 * Lägena skiljs av `lage`, en DISKRIMINERAD UNION — inte av en handfull
 * valfria props. Skälet är att de två lägena bär OLIKA data (en `FileList`
 * respektive ett `attachmentId` + ett förifyllt utgångsläge), och en
 * union gör det omöjligt att av misstag rendera ett halvt läge; med
 * `filer?: FileList` + `initial?: …` hade typen tillåtit båda samtidigt
 * eller ingendera.
 *
 * VAD SOM ÄR GEMENSAMT, och varför en delad dialog är rätt: frågan Lotta
 * svarar på är IDENTISK ("vad ska det här gälla?"), och axlarna, deras
 * defaults, sammanfattningsraden, geometrilåset och tangentbordsordningen
 * ska vara det också. Två kopior hade drivit isär vid nästa axel.
 *
 * VAD SOM SKILJER, och varje skillnad har ett skäl:
 *   - FÖRIFYLLNING. Uppladdningen startar i nolläget; ändringen startar i
 *     radens NUVARANDE axlar, annars vore "ändra" i praktiken "skriv om
 *     från början" och Lotta hade tappat det hon redan valt.
 *   - "Bara detta event" är ALLTID avstängd i ändra-läget, oavsett
 *     `harEvent`. Servern kan inte göra en delad bilaga event-egen (filens
 *     lagringsplats är härledd ur räckvidden, se update-attachment-scope/
 *     index.ts § VAD DEN INTE ÄR) — ett aktivt val som alltid ger 400 vore
 *     en fälla, inte ett val.
 *   - FELET BOR I DIALOGEN i ändra-läget, till skillnad mot uppladdningens
 *     `UppladdningsFel` som bor på sidan. Uppladdningsdialogen STÄNGER vid
 *     framgång och skulle ha rivit felet med sig; ändra-dialogen står kvar
 *     tills servern sagt ja, så felet kan visas intill det val som orsakade
 *     det i stället för på en sida hon redan lämnat.
 *
 * ═══ VAD FELRUTAN FAKTISKT VISAR ═══
 * Husets `EdgeFunctionError`-form (`src/data/config/supabase-client.ts` §
 * `edgeFunctionError`): `Edge Function "update-attachment-scope" 403:
 * <serverns skäl>`. Serverns skäl NÅR alltså fram, men bakom ett tekniskt
 * prefix Lotta inte har någon användning för. Att skriva att rutan visar ett
 * Gunilla-läsbart skäl vore mer än vad koden gör (ADR-083). Begripligheten
 * bärs av RUBRIKEN ("Räckvidden kunde inte ändras") tills den repo-breda
 * felöversättningen finns — det är en egen, registrerad tråd, och
 * renderingsmönstret rörs INTE härifrån.
 */
type RackviddsDialogLage =
  | { typ: 'uppladdning'; filer: FileList }
  | { typ: 'andra-rackvidd'; attachmentId: string; namn: string; initial: UploadScopeVal };

function RackviddsDialog({
  lage,
  harEvent,
  arbetar,
  fel,
  onStang,
  onBekrafta,
}: {
  lage: RackviddsDialogLage;
  harEvent: boolean;
  /** Den körande mutationens `isPending` — låser dialogen, se docblocket. */
  arbetar: boolean;
  /** Felmeddelande att visa INUTI dialogen (bara ändra-läget, se docblocket). */
  fel: string | null;
  onStang: () => void;
  /**
   * Bekräftelsen. `platsNamn` är PRESENTATIONS-data, inte en del av
   * EF-kontraktet: dialogen har redan platslistan (`usePlacesList`) och kan
   * därför namnge den valda platsen gratis, medan `scope.plats` bär det
   * record-ID servern faktiskt vill ha. Alternativet — att låta sidan slå
   * upp namnet — hade krävt en andra `usePlacesList`-prenumeration på hela
   * Dokument-ytan, alltså en platshämtning även när ingen dialog är öppen.
   * Uppladdningsvägen ignorerar argumentet (den renderar ingen badge
   * optimistiskt); ändra-vägen behöver det för sin.
   */
  onBekrafta: (scope: UploadScopeVal, onKlart: () => void, platsNamn?: string) => void;
}) {
  const andrar = lage.typ === 'andra-rackvidd';
  // FÖRIFYLLNINGEN läses EN gång, som `useState`-initialvärde — dialogen
  // unmountas vid varje stängning (se anropsstället), så ett kvarhängande
  // värde är strukturellt omöjligt och en `useEffect`-synk vore både onödig
  // och en väg för radens uppdaterade data att skriva över Lottas pågående
  // redigering mitt i.
  const [rackvidd, setRackvidd] = useState<AttachmentScopeValue>(() =>
    andrar ? AttachmentScope.GEMENSAM : harEvent ? AttachmentScope.EVENT : AttachmentScope.GEMENSAM,
  );
  const [kursfamilj, setKursfamilj] = useState<string | null>(() =>
    lage.typ === 'andra-rackvidd' ? (lage.initial.kursfamilj ?? null) : null,
  );
  const [kursniva, setKursniva] = useState<string | null>(() =>
    lage.typ === 'andra-rackvidd' ? (lage.initial.kursniva ?? null) : null,
  );
  const [platsId, setPlatsId] = useState<string | null>(() =>
    lage.typ === 'andra-rackvidd' ? (lage.initial.plats ?? null) : null,
  );

  // PLATSLISTAN ÄR SAMMA LÄSVÄG SOM MER → PLATSER (kortets AC #1, PRD
  // berättelse 11: *"platslistan i dialogen är samma som under Mer →
  // Platser, så att en ny plats bara behöver läggas till en gång"*).
  // `usePlacesList` bär redan den globala, stabila query-nyckeln och
  // invalideras av `useSavePlace` — en egen hämtning här hade gett en andra
  // sanning om vilka platser som finns, och en nyss tillagd plats hade
  // saknats i dialogen tills sidan laddades om.
  const platserQuery = usePlacesList();
  const platser = platserQuery.data ?? [];
  // [TASK-338.3 runda 2] FELET MÅSTE SYNAS, inte tolkas som "inga platser".
  // `usePlacesList` som fallerar ger `data === undefined`, alltså en TOM
  // lista — visuellt oskiljbar från en bas utan platser. Lotta hade då
  // kunnat ladda upp en bilaga hon TROR blir platsbunden, medan den i
  // själva verket blir `Gemensam` utan axlar = ALLA event (PRD TASK-338
  // berättelse 3: fel information går ut). Frånvaron av ett besked är här
  // farligare än beskedet självt.
  const platserFel = platserQuery.isError;

  const gemensam = rackvidd === AttachmentScope.GEMENSAM;
  const kursfamiljHarNivaer = kursfamilj != null && KURSFAMILJ_MED_NIVAER.has(kursfamilj);
  const laddarUpp = arbetar;
  // Dokumentets namn — filens i uppladdningsläget, radens i ändra-läget.
  // Raden under rubriken svarar på "vad handlar det här om?" i BÅDA lägena.
  const filnamn = andrar ? lage.namn : (lage.filer.item(0)?.name ?? 'Filen');

  // Sammanfattningen läser platsens NAMN, inte dess id — texten är för
  // Lotta. Faller tillbaka på `null` (= "axeln räknas som osatt") medan
  // listan laddar, så raden aldrig hinner peka på en plats den inte kan namnge.
  const valdPlatsNamn = platser.find((plats) => plats.id === platsId)?.namn ?? null;
  const sammanfattning = rackviddsSammanfattning({
    kursfamilj,
    kursniva,
    platsNamn: valdPlatsNamn,
  });

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
        // RUBRIKEN SÄGER VILKEN FRÅGA SOM STÄLLS. I ändra-läget finns ingen
        // fil att ladda upp — "Vad ska filen gälla?" hade läst som att en
        // uppladdning pågick. Samma fråga, rätt tempus.
        title={andrar ? 'Vad ska dokumentet gälla?' : 'Vad ska filen gälla?'}
        size="md"
        aria-description={
          andrar
            ? 'Ändra vilka event det delade dokumentet ska gälla. Välj familj, steg och plats. Tomma val betyder ingen begränsning.'
            : 'Välj om filen gäller bara det valda eventet eller är ett delat dokument som gäller flera event.'
        }
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
              rubrik ställer redan frågan gruppen svarar på.

              [TASK-338.3] TVÅ VAL, INTE TRE — och orienteringen är VERTIKAL.
              "En familj"/"Alla event" var två av ADR-118:s tre räckvidder;
              med ADR-125 § 1 är de samma räckvidd (`Gemensam`) med respektive
              utan axlar, så valet är binärt: hör filen till DETTA event, eller
              är den delad? Etiketterna är hela satser ("Delat dokument -
              gäller flera event") och ryms inte bredvid varandra på 375 px,
              därav `vertical` i stället för den tidigare `horizontal`. */}
          <RadioGroup
            label="Räckvidd"
            hideLabel
            orientation="vertical"
            value={rackvidd}
            onChange={(value) => {
              const next = value as AttachmentScopeValue;
              setRackvidd(next);
              // Axlarna nollas när filen blir event-egen: de är MENINGSLÖSA
              // för räckvidd Event, och EF:ens write-schema avvisar dem
              // uttryckligen ("Kursfamilj, Kursnivå och Plats är bara giltiga
              // för en gemensam bilaga"). Att bara dölja dem hade skickat ett
              // kontraktsbrott vid nästa Ladda upp.
              if (next !== AttachmentScope.GEMENSAM) {
                setKursfamilj(null);
                setKursniva(null);
                setPlatsId(null);
              }
            }}
          >
            {/* ALLTID AVSTÄNGD I ÄNDRA-LÄGET, oavsett `harEvent` — se
                docblockets § VAD SOM SKILJER. `update-attachment-scope`
                svarar 400 på räckvidd Event ("en delad bilaga kan inte göras
                event-egen här"), så ett valbart alternativ hade varit en
                fälla: Lotta väljer, trycker Spara, får ett fel hon inte kan
                göra något åt. Vägen dit finns ändå — radera och ladda upp
                filen på nytt i eventets kontext. */}
            <Radio value={AttachmentScope.EVENT} isDisabled={andrar || !harEvent}>
              Bara detta event
            </Radio>
            {/* KORT BINDESTRECK, INTE LÅNGT — Marcus 2026-08-09: *"Ta bort
                alla långa bindestreck överallt, jag gillar de korta
                bindestrecken (-)"*, mekaniserat i
                `scripts/check-langa-streck.mjs` (CI-wirad grind som fäller på
                långt streck i JSXText). Kortet skriver etiketten med långt
                streck; regeln och grinden slår bokstaven, och ett undantag i
                `.langa-streck-policy.json` vore fel väg — policyn reserverar
                dem för tom-markören, inte för text som kan skrivas om. */}
            <Radio value={AttachmentScope.GEMENSAM}>Delat dokument - gäller flera event</Radio>
          </RadioGroup>

          {/* ═══ DE TRE AXLARNA + SAMMANFATTNINGEN — ALLTID RENDERADE ═══
              (TASK-309.23:s teknik, utvidgad till tre axlar av TASK-338.3.)

              Marcus prod-röktest 2026-08-26: *"rutan aldrig ändrar storlek och
              läge vad jag än väljer eller trycker på"*. `Modal`s overlay är
              `items-center`, så varje höjdändring flyttar OCKSÅ dialogen
              vertikalt — ett hopp vid varje radioklick.

              Blocket renderas därför ALLTID och döljs med `invisible` (kvar i
              layouten, osynlig) + native `inert` när räckvidden är Event.
              `inert` gör HELA underträdet icke-fokuserbart OCH tar bort det ur
              tillgänglighetsträdet i en sats — starkare golv än `tabIndex={-1}`
              per kontroll, som måste upprepas för varje ny kontroll och lätt
              glöms. Det tystar dessutom `aria-live`-raden nedan i event-läget,
              vilket är precis rätt: en sammanfattning av ett filter som inte
              gäller ska inte annonseras.

              PRISET ÄR RESERVERAT TOMRUM i event-läget, och det är MEDVETET
              betalt: tre selects plus sammanfattningsraden är mer reserverad
              yta än den enda rad TASK-309.23 reserverade. Alternativet är en
              dialog som hoppar, vilket Marcus uttryckligen avvisat. Flaggat
              för hans QA-vandring (kortets AC #3).

              SELECTARNA STAPLAS, ingen `sm:flex-row`. Tre triggers sida vid
              sida i en 28rem-dialog ger ~128 px var, vilket trunkerar "Alla
              familjer"/"Alla platser" redan i nolläget — och en brytpunkt som
              byter kolumn/rad gör dessutom geometrilåset beroende av
              viewport-bredden (exakt det `sm:`-fall den tidigare radens
              kommentar varnade för). En kolumn på alla bredder är både
              läsbarare och trivialt stabil. */}
          <div className={`flex flex-col gap-2 ${gemensam ? '' : 'invisible'}`} inert={!gemensam}>
            {/* ═══ ALLA AXLAR ÄR VALFRIA — DÄRFÖR ETT EXPLICIT "ALLA"-VAL ═══

                Fram till TASK-338.3 var Kursfamilj OBLIGATORISK för den (nu
                rivna) Kurstyp-räckvidden, så en `Select` med enbart
                platshållare räckte: ett val gjordes en gång och togs aldrig
                tillbaka.

                Med ADR-125 § 1 är varje axel valfri, och då MÅSTE vägen
                tillbaka finnas — en Lotta som råkat välja RIM ska kunna ångra
                sig till "alla familjer" utan att stänga dialogen och börja om.
                `react-aria`s `Select` har ingen inbyggd rensa-knapp, så
                nolläget bärs av ett eget första alternativ. Det är dessutom
                BÄTTRE än en platshållare på en yta där etiketterna är
                `hideLabel`: triggern säger nu alltid i klartext vad axeln gör
                ("Alla familjer") i stället för att vara tom.

                Sentinelvärdet kan inte kollidera med riktig data: familjerna
                är tre kända namn och platserna är Airtable-record-ID:n
                (`rec…`). */}
            <Select
              label="Familj"
              hideLabel
              selectedKey={kursfamilj ?? ALLA_AXEL}
              onSelectionChange={(key) => {
                setKursfamilj(axelVarde(key));
                // Steget hör till familjen — byter familjen är ett kvarhängande
                // steg antingen ogiltigt (nivålös familj) eller osynligt satt.
                setKursniva(null);
              }}
            >
              <SelectItem id={ALLA_AXEL}>Alla familjer</SelectItem>
              {KURSFAMILJ_VALUES.map((v) => (
                <SelectItem key={v} id={v}>
                  {v}
                </SelectItem>
              ))}
            </Select>

            {/* Steg-selecten bär SAMMA teknik en nivå ner: alltid monterad,
                osynlig + `inert` för en nivålös familj (Fjärrskådning och
                Psionautics har inga steg alls — ORDLISTA.md § Steg). Utan att
                den ALLTID renderas hade en nivåbärande familj (RIM) gett en
                annan dialoghöjd än en nivålös. */}
            <div className={kursfamiljHarNivaer ? '' : 'invisible'} inert={!kursfamiljHarNivaer}>
              <Select
                label="Steg"
                hideLabel
                selectedKey={kursniva ?? ALLA_AXEL}
                onSelectionChange={(key) => setKursniva(axelVarde(key))}
              >
                <SelectItem id={ALLA_AXEL}>Alla steg</SelectItem>
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

            {/* PLATS-AXELN (ADR-125 § 1) — nolläget står FÖRST och är valt från
                start, så listan är användbar även medan `usePlacesList` laddar
                (då bär den bara nolläget). En tom lista under laddning hade
                sett ut som "inga platser finns". */}
            <Select
              label="Plats"
              hideLabel
              isDisabled={platserFel}
              selectedKey={platsId ?? ALLA_AXEL}
              onSelectionChange={(key) => setPlatsId(axelVarde(key))}
            >
              <SelectItem id={ALLA_AXEL}>Alla platser</SelectItem>
              {platser.map((plats) => (
                <SelectItem key={plats.id} id={plats.id}>
                  {plats.namn}
                </SelectItem>
              ))}
            </Select>

            {/* ═══ PLATSLISTANS FEL — INLINE, INTILL DEN AXEL SOM GICK FEL ═══
                (kortets runda 2, INFO-fyndet.)

                KLASSEN ÄR GIVEN, INTE VALD: "uppgiftsgenererat fel, knutet
                till en yta" i notistrappan (`DESIGN-SYSTEM-SPEC.md` § 21,
                ADR-121 beslut 4) → `MessageBox`, inline intill det som gick
                fel. Samma primitiv och samma `intent="error"` som ytans
                övriga fel ("Kunde inte hämta bilagor", "Kunde inte ladda upp
                filen"). Trappans egen kolumn "Förskjuter layout?" säger JA
                för denna klass — felet får alltså kosta höjd, till skillnad
                mot allt annat i denna dialog.

                DEN DELADE VÄGEN STÄNGS INTE AV, och det är ett medvetet val
                mot en näraliggande frestelse: i räckviddsläget är "Bara
                detta event" redan avstängd (inget event att koppla mot), så
                ett avstängt "Delat dokument" hade lämnat dialogen UTAN något
                giltigt val alls — en återvändsgränd där Lotta inte kan ladda
                upp någonting. Dessutom är en axellös gemensam bilaga ("alla
                event") ett FULLT LEGITIMT val som inte behöver platslistan.
                Skyddet ligger i stället i att (a) felet syns, (b)
                Plats-selecten är avstängd i stället för tomt lockande, och
                (c) sammanfattningsraden nedan fortsätter säga sanningen
                ("Gäller: alla event") — hon kan alltså inte tro att hon valt
                en plats. */}
            {/* `gemensam &&` ÄR INTE REDUNDANT — det är a11y-golvet.
                (Runda 3, INFO/a11y.)

                `MessageBox intent="error"` renderar `role="alert"`
                (MessageBox.tsx rad ~94). En alert annonseras när noden DYKER
                UPP i tillgänglighetsträdet — inte när den råkar bli synlig.
                Villkorad bara på `platserFel` monterades rutan direkt vid
                dialogens öppning, alltså INUTI blocket som är `inert` i
                eventläget (och dialogen initieras till EVENT när `harEvent`).
                `inert` tar bort hela underträdet ur tillgänglighetsträdet, så
                alerten fyrade i ett läge där ingen kunde höra den — och när
                Lotta sedan växlade till "Delat dokument" fanns noden redan,
                så det fyrade inget då heller. Felet var alltså SYNLIGT men
                aldrig ANNONSERAT: tyst för en skärmläsaranvändare, vilket är
                precis den grupp som inte kan se den avstängda Plats-selecten.

                Med `gemensam &&` monteras rutan i samma ögonblick blocket
                blir aktivt, och alerten fyrar då — mot ett träd som faktiskt
                exponerar den. Tillgänglighet är 11 utan undantag
                (CLAUDE.md § Kvalitetsribba). */}
            {gemensam && platserFel && (
              <MessageBox intent="error" title="Platserna kunde inte hämtas">
                Försök igen om en stund. Du kan fortfarande ladda upp filen, men inte koppla den
                till en plats.
              </MessageBox>
            )}

            {/* ═══ SAMMANFATTNINGEN — VAD VALET BETYDER, I KLARTEXT ═══
                (kortets AC #1; PRD TASK-338 berättelse 6: *"se i klartext vad
                mitt räckviddsval betyder innan jag sparar"*.)

                Ersätter den rivna raden "Välj en familj för att gå vidare." —
                den var en VALIDERINGSLEDTEXT för ett krav som inte längre
                finns (noll axlar är giltigt och betyder alla event, ADR-125
                § 1), så "Ladda upp" är aldrig avstängd av räckviddsskäl mer.

                `aria-live="polite"` + `aria-atomic` UTAN `role="status"`:
                rollen implicerar samma politeness, och att sätta båda är den
                kända dubbelannonserings-fällan. Regionen bär BARA meningen —
                aldrig kontrollerna — så skärmläsaren annonserar konsekvensen
                ("Gäller: RIM-event i Rönninge") EFTER att selecten själv
                annonserat sitt värde, i stället för att säga samma sak två
                gånger.

                HÖJDEN ÄR LÅST, som allt annat i denna dialog: `line-clamp-2`
                gör att texten aldrig kan bli högre än två rader (2 × 1,5 ×
                0,875rem = 2,625rem) och `min-h-12` (3rem) reserverar mer än
                så — boxen är därmed exakt 3rem oavsett om meningen är "Gäller:
                alla event" eller den längsta tre-axel-formen. Ett långt
                platsnamn trunkeras visuellt men står helt i `title`, och
                skärmläsaren läser alltid hela textnoden (klippningen är ren
                CSS). */}
            <p
              aria-atomic="true"
              aria-live="polite"
              className="line-clamp-2 min-h-12 text-small text-text-secondary"
              title={sammanfattning}
            >
              {sammanfattning}
            </p>
          </div>

          {/* ═══ ÄNDRA-LÄGETS FEL BOR HÄR, INTE PÅ SIDAN ═══
              (Se docblockets § VAD SOM SKILJER för hela motivet.)

              Uppladdningens fel bor på SIDAN (`UppladdningsFel`) därför att
              dialogen rivs vid framgång och hade tagit felet med sig. Denna
              dialog står kvar tills servern sagt ja, så felet kan stå intill
              valet som orsakade det, i stället för på en sida hon lämnat.

              VAD RUTAN FAKTISKT VISAR: husets `EdgeFunctionError`-form,
              `Edge Function "…" 403: <serverns skäl>`. Skälet NÅR alltså hit,
              men bakom ett tekniskt prefix — se dialogens docblock § VAD
              FELRUTAN FAKTISKT VISAR. Rubriken bär begripligheten;
              felöversättningen är repo-bred och rörs inte här.

              Samma notistrappe-klass och samma primitiv som platslistans fel
              ovan: uppgiftsgenererat fel, knutet till en yta
              (`DESIGN-SYSTEM-SPEC.md` § 21, ADR-121 beslut 4). */}
          {fel !== null && (
            <MessageBox intent="error" title="Räckvidden kunde inte ändras">
              {fel}
            </MessageBox>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button intent="ghost" onPress={onStang} isDisabled={laddarUpp}>
              Avbryt
            </Button>
            <Button
              intent="primary"
              isDisabled={laddarUpp}
              onPress={() =>
                onBekrafta(
                  {
                    rackvidd,
                    // AXLARNA SKICKAS BARA FÖR GEMENSAM, och `undefined`
                    // (utelämnad nyckel) är formen för "axeln är inte satt" —
                    // aldrig tom sträng. EF:ens `buildScopeFields` UTELÄMNAR i
                    // sin tur fältet i Airtable-skrivningen, så "ingen axel" är
                    // samma sak hela vägen ner. En tomsträng hade skrivits som
                    // ett värde och smalnat räckvidden.
                    //
                    // [TASK-338.4] I ÄNDRA-LÄGET betyder samma `undefined`
                    // att axeln RENSAS (`buildScopeUpdateFields`), inte att
                    // den lämnas orörd — det är därför Lotta kan bredda
                    // "RIM · Rönninge" tillbaka till bara "Rönninge".
                    kursfamilj: gemensam ? (kursfamilj ?? undefined) : undefined,
                    kursniva: gemensam ? (kursniva ?? undefined) : undefined,
                    plats: gemensam ? (platsId ?? undefined) : undefined,
                  },
                  onStang,
                  // Samma uppslag sammanfattningsraden redan gör — `valdPlatsNamn`
                  // är `null` när ingen plats är vald ELLER när listan inte
                  // hunnit ladda, och i båda fallen är `undefined` rätt: den
                  // optimistiska badgen visar då platsen utan namn i stället
                  // för ett namn som kan vara fel.
                  valdPlatsNamn ?? undefined,
                )
              }
            >
              {andrar ? null : <Upload aria-hidden="true" size={16} className="shrink-0" />}
              {andrar ? (laddarUpp ? 'Sparar…' : 'Spara') : laddarUpp ? 'Laddar upp…' : 'Ladda upp'}
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
 * [T176, 2026-08-29] LÄGENA DELAR NU SKELETT HELT: samma `GRUPPKORT_KLASS`,
 * samma `DokumentListRam`, samma `ListHandlingsRad`. Den enda skillnaden är
 * att handlingsraden här saknar "Skapa dokument" — mallar och kvitto härleds
 * ur ett events data och har inget meningsfullt läge utan valt event (samma
 * skäl som filterraden aldrig fanns här). Att lägena bar identiska men
 * SEPARATA klass-strängar var precis det som lät `sistaRadenBarLinje` saknas
 * här i månader (TASK-309.24).
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
  onAndraRackvidd,
  scopeMutation,
  uploadMutation,
  onValjFil,
}: {
  rader: BilageRad[];
  laddar: boolean;
  fel: boolean;
  felmeddelande: string;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  onDelete: (attachmentId: string, namn: string) => void;
  deleteMutation: DeleteMutation;
  onAndraRackvidd: (rad: Attachment) => void;
  scopeMutation: ScopeMutation;
  uploadMutation: UploadMutation;
  onValjFil: (filer: FileList | null) => void;
}) {
  // Förvaltningsläget har aldrig haft någon filterrad, så höjdlåsningen har
  // varit OVILLKORAD här sedan TASK-309.24 (`matbar` konstant sant). Sedan
  // T176 gäller samma sak i eventläget — de två inkopplingarna skiljer sig nu
  // bara i företrädesvillkoret, se `DokumentLista`s docblock.
  const { kanRulla, sistaRadenBarLinje } = berakaListgeometri(rader.length);
  const { listRef, hojd: matadHojd } = useLastaListhojd(true, true, rader.length, rader);
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-3">
        {/* HJÄLPTEXTEN ÄR BORTTAGEN (Marcus, QA 273.5 steg 5, 2026-08-17:
            "Ta bort hjälptexten … den behövs inte"). Den löd "Gemensamma
            dokument gäller flera event: en kurstyp eller alla event. Ändras
            här, syns direkt överallt de gäller." — informationen bärs redan av
            `RackviddBadge` per rad, som säger samma sak om den enskilda filen i
            stället för i abstrakt form ovanför listan. Återinför den inte utan
            att först fråga; raden är beslutad bort, inte tappad. */}
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
          <div data-testid="grupp-kort" className={GRUPPKORT_KLASS}>
            {/* INGEN RUBRIK — BESLUTAD BORT, INTE TAPPAD (Marcus, QA 273.5
                steg 5, 2026-08-18: *"Ta även bort rubriken 'Dokument' i
                förvaltningsläget."*). Den hette först "Gemensamma dokument",
                kortades till "Dokument" 2026-08-17 — och blev därmed en ren
                dubblett av sidhuvudets `<h1>Dokument` en skärmhöjd ovanför.
                Se eventlägets sektionskommentar för `section`-formen. */}
            <ListHandlingsRad
              eventId={null}
              uploadMutation={uploadMutation}
              onValjFil={onValjFil}
            />
            <DokumentListRam
              listRef={listRef}
              matadHojd={matadHojd}
              kanRulla={kanRulla}
              sistaRadenBarLinje={sistaRadenBarLinje}
              ariaLabel="Delade dokument"
            >
              {rader.map((r) => (
                <li key={r.current.id}>
                  <GemensamBilageRadRow
                    rad={r}
                    onReplace={onReplace}
                    replaceMutation={replaceMutation}
                    onDelete={onDelete}
                    deleteMutation={deleteMutation}
                    onAndraRackvidd={onAndraRackvidd}
                    scopeMutation={scopeMutation}
                  />
                </li>
              ))}
              {rader.length === 0 && (
                <li className="py-3 text-small text-text-muted">Inga delade dokument än.</li>
              )}
            </DokumentListRam>
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
  onAndraRackvidd,
  scopeMutation,
}: {
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  onDelete: (attachmentId: string, namn: string) => void;
  deleteMutation: DeleteMutation;
  /** [TASK-338.4] Öppnar RackviddsDialog förifylld med RADENS axlar. */
  onAndraRackvidd: (rad: Attachment) => void;
  scopeMutation: ScopeMutation;
}) {
  const { current, dolda } = rad;
  const ersattInputRef = useRef<HTMLInputElement>(null);
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
  const raderarDennaRaden =
    deleteMutation.isPending && deleteMutation.variables?.attachmentId === current.id;
  const andrarDennaRaden =
    scopeMutation.isPending && scopeMutation.variables?.attachmentId === current.id;
  return (
    <DokumentRadSkal
      namn={current.namn}
      kalla={{ typ: 'bilaga', eventId: null, attachmentId: current.id }}
      current={current}
      dolda={dolda}
      filinput={
        // `hidden` (display:none) — se `BilageRadRow`s motsvarande input.
        <input
          ref={ersattInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) =>
            onReplace(e.target.files, current.id, {
              rackvidd: current.rackvidd ?? undefined,
              kursfamilj: current.kursfamilj ?? undefined,
              kursniva: current.kursniva ?? undefined,
              // [TASK-338.3] Se BilageRadRow ovan — plats-axeln följer med,
              // annars blir "Ersätt" en tyst uppvidgning till alla event.
              plats: current.plats?.id ?? undefined,
            })
          }
        />
      }
      menyposter={
        // RÄCKVIDDSLÄGET ÄR FÖRVALTNINGSYTAN (Marcus 2026-08-17): här — och
        // enligt ADR-118 beslut 3 BARA här — får en gemensam bilaga ersättas
        // och raderas. Eventläget är Lottas läsflöde och ska inte bära
        // handlingar som kan förstöra något för alla event samtidigt.
        //
        // ORDNINGEN GÅR FRÅN MINST TILL MEST INGRIPANDE: byt fil → byt
        // spridning → ta bort. Radera står SIST, efter en avdelare, i egen
        // faroton — muskelminnet för den farligaste handlingen flyttas inte,
        // och avdelaren gör det svårare att träffa den av misstag när menyn
        // öppnas med tangentbord (`ArrowUp` från triggern landar på Radera,
        // men avdelaren gör gruppbytet hörbart för skärmläsaren).
        <>
          <MenyPost
            ikon={
              ersatterDennaRaden ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <FileUp aria-hidden="true" size={IKON_STORLEK} />
              )
            }
            isDisabled={ersatterDennaRaden}
            textValue="Ersätt"
            onAction={() => oppnaFilvaljare(ersattInputRef)}
          >
            {ersatterDennaRaden ? 'Ersätter…' : 'Ersätt'}
          </MenyPost>
          {/* [TASK-338.4] ÄNDRA RÄCKVIDD — bara här, aldrig i eventläget.
              ADR-118 beslut 3 gäller vidare: räckviddsläget ÄR förvaltnings-
              ytan, och en handling som ändrar vilka event ett dokument gäller
              hör hemma bland de andra förvaltningshandlingarna, inte i Lottas
              läsflöde per event. `BilageRadRow` (eventläget) får därför ingen
              motsvarighet — där är en delad bilaga fortsatt oredigerbar, och
              badgen bär förklaringen.

              [2026-08-29] `Target`-ikonen står kvar men är inte längre ensam
              bärare av betydelsen: menyposten bär TEXTEN "Ändra räckvidd".
              Den femte identiska grå ikonlådan som ADR-125-noten flaggade för
              Marcus QA-vandring vid smal skärm finns inte längre — hela
              ikonkolumnen är EN ⋯-knapp. */}
          <MenyPost
            ikon={
              andrarDennaRaden ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Target aria-hidden="true" size={IKON_STORLEK} />
              )
            }
            isDisabled={andrarDennaRaden}
            textValue="Ändra räckvidd"
            onAction={() => onAndraRackvidd(current)}
          >
            {andrarDennaRaden ? 'Ändrar räckvidd…' : 'Ändra räckvidd'}
          </MenyPost>
          <MenyAvdelare />
          <MenyPost
            ton="fara"
            ikon={
              raderarDennaRaden ? (
                <Loader2
                  aria-hidden="true"
                  size={IKON_STORLEK}
                  className="motion-safe:animate-spin"
                />
              ) : (
                <Trash2 aria-hidden="true" size={IKON_STORLEK} />
              )
            }
            isDisabled={raderarDennaRaden}
            textValue="Radera"
            onAction={() => onDelete(current.id, current.namn)}
          >
            {raderarDennaRaden ? 'Raderar…' : 'Radera'}
          </MenyPost>
        </>
      }
    />
  );
}
