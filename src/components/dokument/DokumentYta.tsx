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
 * SIDKROM: stulen verbatim ur `AktivitetsHistorik.tsx` § `kromKnapp`
 * (S106-facitet, `tasks/sessions/bilagor/s106-aktivitetslogg/facit.json`)
 * — rund `size-11 bg-bg-muted`-chevron (`ChevronLeft 26`) tillbaka till
 * `/mer`, `<header className="flex flex-col gap-1">`, ingen egen
 * sidopadding (rätt mot `AppShell`s `main`-padding). `AtgardsSida.tsx`s
 * `Sidhuvud` förkastades som mönsterkälla: dess extra `px-4`/`mx-4`-nivå
 * hade dubblat sidmarginalen ovanpå `AppShell`s egen — samma
 * dubbleringsfel `MailLog.tsx`/`Intresserade.tsx` bär.
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
 * Nedladdning triggar INGEN flik: en dold `<a download>`-länk klickas
 * programmatiskt. Klass A: den signerade URL:en får en `download`-query-
 * parameter påklistrad KLIENT-SIDIGT — `@supabase/storage-js`s egen
 * `createSignedUrl` bygger exakt denna parameter EFTER att URL:en redan
 * signerats (`node_modules/@supabase/storage-js/src/packages/
 * StorageFileApi.ts` rad 723–728), så att lägga till den i efterhand kräver
 * INGEN ändring av `get-attachment-download-url`-EF:en. VERIFIERAT LIVE mot
 * staging (TASK-273.4, samma fixturhändelse `recIFrxHZw165ycXk`): Storage-
 * servern svarar då med en riktig `Content-Disposition: attachment`-header
 * (utan parametern: ingen disposition-header alls). Klass B/C: samma
 * blob-URL som förhandsvisningen (byggd färskt per klick) — `download`-
 * attributet honoreras nativt eftersom blob-URL:er redan är same-origin.
 *
 * PERSONDATA FÖR KLASS C: TYPEXEMPEL, inte en verklig anmälan (se
 * `preview-receipt/index.ts` § PERSONDATA) — ingen anmälan/betalning är
 * VALD på denna generiska katalograd, och basen saknar ett prisfält
 * oavsett. Eventets namn ÄR verkligt (samma eventId som Dokument-ytans
 * redan valda event). `previewEventTemplate`/`previewReceipt` (klass B/C)
 * når ALDRIG Storage-uppladdningen, Bilagor-radskapelsen eller ett
 * allokerat kvittonummer — SIDOEFFEKTSFRI förhandsvisning (AC #3, TASK-246).
 *
 * [UTBYGGD, TASK-275.3, ADR-118] RÄCKVIDDSVAL + RÄCKVIDDSLÄGE + BADGES — se
 * amenderings-sidofilen `tasks/sessions/bilagor/s102-dokument-konvergens/
 * AMENDERING-2026-08-17-rackviddsval-gemensamt-lage-badges.md` för hela
 * avvikelsen mot det godkända facit-manifestet. Kort sammanfattat:
 *   - UPPLADDNINGSFLÖDET (`UppladdningsFlode` nedan, delad mellan
 *     eventläget och räckviddsläget) bär nu ett räckviddsval (RadioGroup:
 *     Detta event/En kurstyp/Alla event — husets radioval-primitiv,
 *     `RadioGroup`/`Radio`), med Kursfamilj/Kursnivå-`Select` (husets
 *     select-primitiv) när Kurstyp är valt. "Detta event" är avstängt
 *     (`isDisabled`) när inget event är valt.
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
import { Link } from '@tanstack/react-router';
import {
  ChevronLeft,
  Download,
  ExternalLink,
  Loader2,
  Replace,
  Trash2,
  Upload,
} from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useId, useMemo, useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { stegEtikett } from '@/components/dokument/nivaSprak';
import { RackviddBadge } from '@/components/dokument/RackviddBadge';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Radio, RadioGroup } from '@/components/primitives/RadioGroup';
import { Select, SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { StegSektion } from '@/components/primitives/StegSektion';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { formatMB } from '@/data/adapters/attachmentUpload';
import type { DokumentKalla } from '@/data/mutations/dokumentKalla';
import { useDeleteAttachment } from '@/data/mutations/useDeleteAttachment';
import { useForhandsvisaDokument } from '@/data/mutations/useForhandsvisaDokument';
import { useLaddaNerDokument } from '@/data/mutations/useLaddaNerDokument';
import { useReplaceAttachment } from '@/data/mutations/useReplaceAttachment';
import {
  type UploadAttachmentVariables,
  useUploadAttachment,
} from '@/data/mutations/useUploadAttachment';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment } from '@/domain/models/Attachment';
import { AttachmentScope, type AttachmentScopeValue } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';

/* ------------------------------------------------------------------ *
 * KLASS B/C — KOD-NIVÅ-KATALOGER, INTE INSTANS-LISTOR (se Fynd 1 ovan).
 * Oförändrade sedan S100: mall-editorn är uttryckligen senare (PRD task-146
 * § Utanför omfattningen) och kvittogenereringen (klass C) hör till
 * TASK-147.7, obyggd.
 * ------------------------------------------------------------------ */

type Mall = {
  id: string;
  namn: string;
  /** Vilka eventfält mallen fyller i — det som gör den till en MALL. */
  fyllerI: string[];
};

const MALLAR: Mall[] = [
  {
    id: 'b1',
    namn: 'Deltagarinformation',
    fyllerI: ['Eventnamn', 'Datum', 'Ort', 'Lokal', 'Starttid'],
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

/** [TASK-275.3] Räckviddsvalet `UppladdningsFlode` producerar — delad shape
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

  const handleUpload = (files: FileList | null, scope: UploadScopeVal) => {
    const file = files?.[0];
    if (file) uploadMutation.mutate({ file, ...scope });
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
      {/* HUSETS SIDKROM — stulet verbatim ur AktivitetsHistorik.tsx § kromKnapp
          (S106-facitet). Se filhuvudets SIDKROM-not för varför AtgardsSida.tsx
          § Sidhuvud (den andra mönsterkällan) INTE ärvs här. */}
      <Link
        to="/mer"
        aria-label="Tillbaka till Mer"
        className="flex size-11 shrink-0 items-center justify-center self-start rounded-full bg-bg-muted"
      >
        <ChevronLeft aria-hidden="true" size={26} />
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="font-semibold text-3xl">Dokument</h1>
      </header>

      {/* Eventväljaren (Fynd 2): fundamentet är event-scopat, så ytan
          behöver ett valt event innan verklig data kan hämtas. Samma
          delade komponent som Åtgärds-sidan/manuell anmälan (kontextrad-
          formen). Tomt läge tills Marcus/Lotta väljer — ingen fixtur
          default-vald här. TOMT LÄGE är sedan TASK-275.3 INTE längre "väntar
          på val" — det ÄR räckviddsläget (se GemensamtLage nedan). */}
      <EventValjare
        valtEventId={eventId ?? undefined}
        valtEvent={valtEvent}
        onByte={(id) => void setEventId(id)}
      />

      {/* [TASK-275.3] Vägen TILLBAKA till räckviddsläget — EventValjarens
          popover har inget "rensa val"-alternativ (den byter bara MELLAN
          event), så ett eget, litet textutträde behövs. Husets Button-
          primitiv (`intent="ghost" size="sm"`) — ingen ny formuppfinning.
          Syns bara när ett event faktiskt är valt (annars redan i
          räckviddsläget, knappen vore meningslös). */}
      {eventId != null && (
        <Button
          intent="ghost"
          size="sm"
          className="self-start"
          onPress={() => void setEventId(null)}
        >
          Visa gemensamma dokument
        </Button>
      )}

      {eventId == null ? (
        <GemensamtLage
          rader={gemensammaRader}
          laddar={gemensammaQuery.isPending}
          fel={gemensammaQuery.isError}
          felmeddelande={
            gemensammaQuery.error instanceof Error ? gemensammaQuery.error.message : 'Okänt fel.'
          }
          onUpload={handleUpload}
          uploadMutation={uploadMutation}
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
          {attachmentsQuery.error instanceof Error ? attachmentsQuery.error.message : 'Okänt fel.'}
        </MessageBox>
      ) : (
        <DokumentLista
          eventId={eventId}
          rader={rader}
          onUpload={handleUpload}
          uploadMutation={uploadMutation}
          onReplace={handleReplace}
          replaceMutation={replaceMutation}
        />
      )}
    </div>
  );
}

/** Metaraden under namnet — bara verkliga fält (storlek, uppladdad-datum). */
function MetaRad({ delar }: { delar: (string | null)[] }) {
  const text = delar.filter(Boolean).join(' · ');
  if (!text) return null;
  return <span className="text-caption text-text-muted">{text}</span>;
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
  const nedladdningMutation = useLaddaNerDokument();

  const fel = forhandsvisaMutation.isError
    ? forhandsvisaMutation.error
    : nedladdningMutation.isError
      ? nedladdningMutation.error
      : null;

  return (
    // VÄNSTERSTÄLLD, inte högerställd: knapparna står numera i radens egen
    // informationskolumn (namn → knappar → räckvidd → datum, Marcus
    // strukturfynd 2026-08-17), inte i en högermarginal. `items-end` hade
    // dragit dem till kolumnens högra kant, ut ur läsflödet.
    <span className="flex flex-col items-start gap-1.5">
      <span className="flex items-center gap-1">
        <Button
          intent="primary"
          emphasis="subtle"
          size="sm"
          className="size-11 shrink-0 p-0"
          // MEDVETET `aria-disabled` — INTE `isDisabled` (som Button.tsx:s
          // egen `isLoading`-docblock förklarar: `isDisabled` renderar ett
          // native `disabled`-attribut och tar bort knappen ur tabordningen
          // mitt i klicket. `aria-disabled` annonserar samma tillstånd utan
          // att flytta fokus — dubbelklicks-skyddet sköts av
          // early-return-vakten i onPress nedan, samma teknik Button.tsx
          // själv använder för `isLoading`.
          aria-disabled={forhandsvisaMutation.isPending}
          aria-label={forhandsvisaMutation.isPending ? `Öppnar ${namn} …` : `Förhandsvisa ${namn}`}
          onPress={() => {
            if (forhandsvisaMutation.isPending) return;
            // KRITISKT: window.open MÅSTE anropas synkront här, före all
            // await/mutate-hantering — se filhuvudets IKONPAR-not.
            const handle = window.open('', '_blank');
            forhandsvisaMutation.mutate({ kalla, handle });
          }}
        >
          {forhandsvisaMutation.isPending ? (
            <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin" />
          ) : (
            // `ExternalLink`, inte `Eye` (Marcus: "previewikonen är ful").
            // Bytet är inte bara kosmetiskt — det är ÄRLIGARE: knappen öppnar
            // dokumentet i en NY FLIK (`window.open` i onPress nedan), den
            // visar det inte inline. Ögat lovar en förhandsvisning på plats
            // som aldrig kommer; pilen-ur-rutan säger vad som faktiskt
            // händer, och skiljer sig dessutom tydligare från nedladdnings-
            // pilen bredvid än ett öga gör.
            <ExternalLink aria-hidden="true" size={18} />
          )}
        </Button>
        <Button
          intent="primary"
          emphasis="subtle"
          size="sm"
          className="size-11 shrink-0 p-0"
          aria-disabled={nedladdningMutation.isPending}
          aria-label={nedladdningMutation.isPending ? `Laddar ner ${namn} …` : `Ladda ner ${namn}`}
          onPress={() => {
            if (nedladdningMutation.isPending) return;
            nedladdningMutation.mutate({ kalla, namn });
          }}
        >
          {nedladdningMutation.isPending ? (
            <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin" />
          ) : (
            <Download aria-hidden="true" size={18} />
          )}
        </Button>
      </span>
      {fel && (
        <MessageBox intent="error" className="max-w-56">
          {fel instanceof Error ? fel.message : 'Okänt fel.'}
        </MessageBox>
      )}
    </span>
  );
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;
type ReplaceMutation = ReturnType<typeof useReplaceAttachment>;
type DeleteMutation = ReturnType<typeof useDeleteAttachment>;

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
}: {
  eventId: string;
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
}) {
  const { current, dolda } = rad;
  // Bara DENNA rads knapp visar "Ersätter…"/blir avstängd — inte hela
  // listan (till skillnad mot uppladdningsknappen längst ner, som stänger
  // av sig själv via sin egen `uploadMutation.isPending`). `variables`
  // finns bara medan mutationen faktiskt pågår (TanStack Query), så
  // jämförelsen är säker även innan första anropet.
  const ersatterDennaRaden =
    replaceMutation.isPending && replaceMutation.variables?.oldAttachmentId === current.id;
  // [TASK-275.3, ADR-118 beslut 3] Ersätt VISAS INTE i eventkontext för en
  // GEMENSAM bilaga — badgen bär förklaringen (AC #4). Servern nekar 403
  // ändå (delete-attachment/index.ts), men UI-lagret ska inte erbjuda en
  // knapp den vet kommer avvisas.
  const gemensam = arGemensam(current.rackvidd);
  return (
    <div data-testid="dokument-fil" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <span className="break-words font-medium text-body">{current.namn}</span>
        <DokumentAtgardsKnappar
          namn={current.namn}
          kalla={{ typ: 'bilaga', eventId, attachmentId: current.id }}
        />
        <RackviddBadge
          rackvidd={current.rackvidd}
          kursfamilj={current.kursfamilj}
          kursniva={current.kursniva}
        />
        <MetaRad
          delar={[
            // [TASK-147.12] Verklig klass — se filens docblock (Fynd 1).
            // "Okänd" är en ÄRLIG etikett (Gunilla-principen), inte en
            // gissning: den betyder "backfillen kunde inte härleda den här
            // raden", aldrig "vi vet men visar det inte".
            `Klass: ${current.dokumentklass ?? 'Okänd'}`,
            formatMB(current.storlekBytes),
            `Uppladdad ${DATUM_TID.format(new Date(current.skapad))}`,
          ]}
        />
        {dolda > 0 && (
          <span className="text-caption text-text-secondary">
            +{dolda} {dolda === 1 ? 'äldre fil' : 'äldre filer'} med samma namn (visas inte)
          </span>
        )}
      </span>
      {!gemensam && (
        <span className="flex shrink-0 items-center gap-1">
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
              intent="secondary"
              size="sm"
              className="size-11 shrink-0 p-0"
              isDisabled={ersatterDennaRaden}
              aria-label={
                ersatterDennaRaden ? `Ersätter ${current.namn} …` : `Ersätt ${current.namn}`
              }
            >
              {ersatterDennaRaden ? (
                <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin" />
              ) : (
                <Replace aria-hidden="true" size={18} />
              )}
            </Button>
          </FileTrigger>
        </span>
      )}
    </div>
  );
}

function MallRad({ mall, eventId }: { mall: Mall; eventId: string }) {
  return (
    <div data-testid="dokument-mall" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{mall.namn}</span>
        <MetaRad delar={[`Fyller i ${mall.fyllerI.join(', ').toLowerCase()}`]} />
      </span>
      <DokumentAtgardsKnappar namn={mall.namn} kalla={{ typ: 'mall', eventId }} />
    </div>
  );
}

function GeneratorRad({ gen, eventId }: { gen: Generator; eventId: string }) {
  return (
    <div data-testid="dokument-generator" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{gen.namn}</span>
        <MetaRad delar={[`Byggs ur ${gen.byggsUr.join(', ').toLowerCase()}`]} />
      </span>
      <DokumentAtgardsKnappar namn={gen.namn} kalla={{ typ: 'generator', eventId }} />
    </div>
  );
}

function UppladdningsFel({ uploadMutation }: { uploadMutation: UploadMutation }) {
  if (!uploadMutation.isError) return null;
  return (
    <MessageBox intent="error" title="Kunde inte ladda upp filen">
      {uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Okänt fel.'}
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
      {replaceMutation.error instanceof Error ? replaceMutation.error.message : 'Okänt fel.'}
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
  onUpload,
  uploadMutation,
  onReplace,
  replaceMutation,
}: {
  eventId: string;
  rader: BilageRad[];
  onUpload: (files: FileList | null, scope: UploadScopeVal) => void;
  uploadMutation: UploadMutation;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
}) {
  const [filter, setFilter] = useQueryState('typ');
  const aktivtFilter: ListaTyp =
    filter === 'bilaga' || filter === 'mall' || filter === 'generator' ? filter : 'alla';

  const visaBilagor = aktivtFilter === 'alla' || aktivtFilter === 'bilaga';
  const visaMallar = aktivtFilter === 'alla' || aktivtFilter === 'mall';
  const visaGeneratorer = aktivtFilter === 'alla' || aktivtFilter === 'generator';

  return (
    <div className="flex flex-col gap-3">
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

      <div
        data-testid="grupp-kort"
        className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
      >
        {visaBilagor &&
          rader.map((r) => (
            <BilageRadRow
              key={r.current.id}
              eventId={eventId}
              rad={r}
              onReplace={onReplace}
              replaceMutation={replaceMutation}
            />
          ))}
        {visaMallar && MALLAR.map((m) => <MallRad key={m.id} mall={m} eventId={eventId} />)}
        {visaGeneratorer &&
          GENERATORER.map((g) => <GeneratorRad key={g.id} gen={g} eventId={eventId} />)}
        {visaBilagor && rader.length === 0 && !visaMallar && !visaGeneratorer && (
          <p className="py-3 text-small text-text-muted">Inga bilagor för det här eventet än.</p>
        )}
      </div>

      <ErsattningsFel replaceMutation={replaceMutation} />
      <UppladdningsFlode harEvent onUpload={onUpload} uploadMutation={uploadMutation} />
    </div>
  );
}

/**
 * UPPLADDNINGSFLÖDET (TASK-275.3, AC #1) — räckviddsval delat mellan
 * eventläget (`DokumentLista` ovan, `harEvent` alltid true) och
 * räckviddsläget (`GemensamtLage` nedan, `harEvent` alltid false). Radioval
 * via husets primitiv (`RadioGroup`/`Radio`), Kursfamilj/Kursnivå via husets
 * `Select` — INGA nya formuppfinningar (Marcus kvalitetsdirektiv
 * 2026-08-17).
 *
 * "Detta event" är `isDisabled` när `!harEvent` (räckviddsläget har inget
 * event att koppla mot) — startvärdet väljs DÄRFÖR olika (Event när ett
 * event finns, annars Kurstyp): en avstängd men FÖRVALD radioknapp hade
 * lämnat räckviddsläget i ett tillstånd utan giltigt val. Komponenten
 * MONTERAS OM när `harEvent` byter (DokumentLista/GemensamtLage är skilda
 * JSX-grenar i `DokumentYta`, aldrig samma monterade instans) — lokalt
 * `useState` behöver därför ingen synk-effekt.
 *
 * VALIDERING: räckvidd Kurstyp UTAN vald Familj håller uppladdnings-
 * knappen avstängd (`scopeGiltig`) — Lotta kan inte råka skicka ett
 * ofullständigt val som EF:en ändå hade avvisat (400, `AttachmentScope
 * InputSchema`); felet fångas HÄR, innan filväljaren ens öppnas.
 *
 * ═══ FLÖDET ÄR ETT EGET BLOCK I TVÅ STEG (S107 QA-vandringen) ═══
 *
 * Marcus fynd, steg 5: "allt under gemensamma dokument-ytan måste ligga i
 * ett eget block … sedan kanske det behöver struktureras lite som
 * segmentsidan gör, lite wizard liksom". Före detta varv låg räckviddsvalet,
 * fält-selectarna och uppladdningsknappen NAKNA på sidan, direkt under
 * listkortet — kontroller utan behållare, medan listan bredvid satt i ett
 * eget kort. Ytan såg oavslutad ut, och det var den.
 *
 * Formen är husets `StegSektion` (`primitives/StegSektion.tsx`, lyft ur
 * segment-byggaren i samma landning) — INTE en lokal variant. Två steg:
 *
 *   1. "Vad ska filen gälla?"  räckvidd + (vid Eventtyp) familj/nivå
 *   2. "Välj fil"              filväljaren
 *
 * STEG 2 VILAR I STÄLLET FÖR ATT BARA VARA AVSTÄNGT när `scopeGiltig` är
 * falskt. En avstängd knapp säger "nej" utan att säga varför; ett vilande
 * steg säger vad som saknas och vart man går för att fixa det. Knappens egen
 * `isDisabled` behålls ändå som andra spärr — vilar-ledtexten är
 * kommunikation, `isDisabled` är grinden, och de ska inte förväxlas.
 *
 * UPPLADDNINGSFELET FLYTTADE MED till steg 2, där handlingen bor. Det stod
 * förut mellan selectarna och knappen, alltså i steg 1:s yta, och pekade på
 * ett fel som uppstått i steg 2.
 */
function UppladdningsFlode({
  harEvent,
  onUpload,
  uploadMutation,
}: {
  harEvent: boolean;
  onUpload: (files: FileList | null, scope: UploadScopeVal) => void;
  uploadMutation: UploadMutation;
}) {
  const [rackvidd, setRackvidd] = useState<AttachmentScopeValue>(
    harEvent ? AttachmentScope.EVENT : AttachmentScope.KURSTYP,
  );
  const [kursfamilj, setKursfamilj] = useState<string | null>(null);
  const [kursniva, setKursniva] = useState<string | null>(null);
  const blockRubrikId = useId();

  const kursfamiljHarNivaer = kursfamilj != null && KURSFAMILJ_MED_NIVAER.has(kursfamilj);
  const scopeGiltig = rackvidd !== AttachmentScope.KURSTYP || kursfamilj != null;

  return (
    // BLOCKET HAR EN EGEN RUBRIK (Marcus: "Wizarden måste ju ha en egen
    // rubrik eller eget block liksom, typ 'Ladda upp filer'. Det ser inte
    // riktigt lika snyggt ut som på segmentsidan"). Skillnaden mot
    // segmentsidan var att DEN har en `<h1>` direkt ovanför sina steg —
    // stegen stod aldrig rubriklösa. Här saknades det ledet helt: stegen
    // hängde under en lista utan att något sa vad de tillsammans ÄR.
    //
    // Rubriken är `<h2>` under sidans `<h1>Dokument`, och stegen går därför
    // ner till `<h3>` (`rubrikNiva`) — annars hade blockrubriken blivit
    // syskon till sina egna steg i rubrikordningen.
    <section aria-labelledby={blockRubrikId} className="flex flex-col gap-3">
      <h2 id={blockRubrikId} className="font-semibold text-lg">
        Ladda upp filer
      </h2>
      <StegSektion nummer={1} rubrikNiva={3} rubrik="Vad ska filen gälla?">
        <RadioGroup
          label="Räckvidd"
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

        {rackvidd === AttachmentScope.KURSTYP && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Select
              label="Familj"
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
            {kursfamiljHarNivaer && (
              <Select
                label="Steg"
                placeholder="Alla steg"
                selectedKey={kursniva}
                onSelectionChange={(key) => setKursniva(key == null ? null : String(key))}
                className="sm:max-w-56"
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
            )}
          </div>
        )}
      </StegSektion>

      <StegSektion
        nummer={2}
        rubrikNiva={3}
        rubrik="Välj fil"
        vilar={scopeGiltig ? undefined : 'Välj en familj i steget ovan först.'}
      >
        <UppladdningsFel uploadMutation={uploadMutation} />
        <div>
          <FileTrigger
            acceptedFileTypes={['application/pdf']}
            onSelect={(files) =>
              onUpload(files, {
                rackvidd,
                kursfamilj:
                  rackvidd === AttachmentScope.KURSTYP ? (kursfamilj ?? undefined) : undefined,
                kursniva:
                  rackvidd === AttachmentScope.KURSTYP ? (kursniva ?? undefined) : undefined,
              })
            }
          >
            <Button intent="secondary" isDisabled={uploadMutation.isPending || !scopeGiltig}>
              <Upload aria-hidden="true" size={16} className="shrink-0" />
              {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp en fil'}
            </Button>
          </FileTrigger>
        </div>
      </StegSektion>
    </section>
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
  onUpload,
  uploadMutation,
  onReplace,
  replaceMutation,
  onDelete,
  deleteMutation,
}: {
  rader: BilageRad[];
  laddar: boolean;
  fel: boolean;
  felmeddelande: string;
  onUpload: (files: FileList | null, scope: UploadScopeVal) => void;
  uploadMutation: UploadMutation;
  onReplace: (files: FileList | null, oldAttachmentId: string, scope: UploadScopeVal) => void;
  replaceMutation: ReplaceMutation;
  onDelete: (attachmentId: string, namn: string) => void;
  deleteMutation: DeleteMutation;
}) {
  return (
    <div className="flex flex-col gap-3">
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
        <div
          data-testid="grupp-kort"
          className="divide-y divide-border rounded-2xl border border-transparent bg-bg-muted px-4 contrast-more:border-border-strong"
        >
          {rader.map((r) => (
            <GemensamBilageRadRow
              key={r.current.id}
              rad={r}
              onReplace={onReplace}
              replaceMutation={replaceMutation}
              onDelete={onDelete}
              deleteMutation={deleteMutation}
            />
          ))}
          {rader.length === 0 && (
            <p className="py-3 text-small text-text-muted">Inga gemensamma dokument än.</p>
          )}
        </div>
      )}

      <ErsattningsFel replaceMutation={replaceMutation} />
      <UppladdningsFlode harEvent={false} onUpload={onUpload} uploadMutation={uploadMutation} />
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
    <div data-testid="dokument-fil" className="flex items-start gap-3 py-3">
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
        <span className="break-words font-medium text-body">{current.namn}</span>
        <DokumentAtgardsKnappar
          namn={current.namn}
          kalla={{ typ: 'bilaga', eventId: null, attachmentId: current.id }}
        />
        <RackviddBadge
          rackvidd={current.rackvidd}
          kursfamilj={current.kursfamilj}
          kursniva={current.kursniva}
        />
        <MetaRad
          delar={[
            `Klass: ${current.dokumentklass ?? 'Okänd'}`,
            formatMB(current.storlekBytes),
            `Uppladdad ${DATUM_TID.format(new Date(current.skapad))}`,
          ]}
        />
        {dolda > 0 && (
          <span className="text-caption text-text-secondary">
            +{dolda} {dolda === 1 ? 'äldre fil' : 'äldre filer'} med samma namn (visas inte)
          </span>
        )}
      </span>
      {/* HANDLINGSKOLUMNEN — de MUTERANDE handlingarna, skilda från radens
          egen informationskolumn. Ersätt och Radera ändrar beståndet;
          förhandsvisa och ladda ner gör det inte, och de bor därför kvar i
          informationskolumnen ovan. Separationen är avsiktlig: den gör att
          ingen når Radera på väg mot Ladda ner.

          FÄRGTONINGEN BÄR SAMMA SKILLNAD (Marcus: "rödtoning på radera och
          gul eller grå på ersätt"). Vi har ingen gul intent — paletten bär
          primary/secondary/danger/success/ghost — så Ersätt får `secondary`
          (neutral, ritad kant) och Radera `danger`+`subtle` (röd tonad
          platta). Båda är husets egna former, ingen ny uppfinning.

          INGEN `ghost` HÄR. Samma skäl som ikonparets docblock stavar ut:
          `ghost`s hover-token ÄR `bg-bg-muted`, vilket är radgruppens egen
          bakgrund — hovern hade varit osynlig. Knapparna bar `ghost` fram
          till detta varv och hade alltså samma latenta defekt som Visa-
          knappen en gång hade. */}
      <span className="flex shrink-0 items-center gap-1">
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
            intent="secondary"
            size="sm"
            className="size-11 shrink-0 p-0"
            isDisabled={ersatterDennaRaden}
            aria-label={
              ersatterDennaRaden ? `Ersätter ${current.namn} …` : `Ersätt ${current.namn}`
            }
          >
            {ersatterDennaRaden ? (
              <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin" />
            ) : (
              <Replace aria-hidden="true" size={18} />
            )}
          </Button>
        </FileTrigger>
        <Button
          intent="danger"
          emphasis="subtle"
          size="sm"
          className="size-11 shrink-0 p-0"
          isDisabled={raderarDennaRaden}
          aria-label={raderarDennaRaden ? `Raderar ${current.namn} …` : `Radera ${current.namn}`}
          onPress={() => onDelete(current.id, current.namn)}
        >
          {raderarDennaRaden ? (
            <Loader2 aria-hidden="true" size={18} className="motion-safe:animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" size={18} />
          )}
        </Button>
      </span>
    </div>
  );
}
