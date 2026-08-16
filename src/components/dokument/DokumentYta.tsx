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
 * VISA-BETEENDET: `BilagaVisaKnapp` (TASK-245) hämtar en tidsbegränsad
 * signerad nedladdnings-URL (`DataSourceAdapter.getAttachmentDownloadUrl`,
 * 300s TTL — se `_shared/attachments.ts` § SIGNED_DOWNLOAD_URL_TTL_SECONDS)
 * och visar riktig förhandsvisning (PDF via `<iframe>`, bild via `<img>`)
 * plus en "Ladda ner"-länk, eller en ärlig `MessageBox intent="info"`-gräns
 * för format som varken är PDF eller bild ("gissa aldrig"-disciplinen).
 * `GenereradPdfVisaKnapp` (TASK-246) genererar i stället en TRANSIENT PDF
 * per klick för klass B/C (`Blob`+`createObjectURL`, riven med
 * `URL.revokeObjectURL` i `useEffect`s cleanup) — SIDOEFFEKTSFRI per
 * konstruktion (AC #3): `previewEventTemplate` (klass B, `preview: true`
 * mot generate-event-attachment) och `previewReceipt` (klass C, en NY,
 * dedikerad EF `preview-receipt` som varken importerar send-receipt.ts,
 * receipt-numbering.ts eller Resend direkt) når ALDRIG Storage-
 * uppladdningen, Bilagor-radskapelsen eller ett allokerat kvittonummer.
 *
 * PERSONDATA FÖR KLASS C: TYPEXEMPEL, inte en verklig anmälan (se
 * `preview-receipt/index.ts` § PERSONDATA) — ingen anmälan/betalning är
 * VALD på denna generiska katalograd, och basen saknar ett prisfält
 * oavsett. Eventets namn ÄR verkligt (samma eventId som Dokument-ytans
 * redan valda event).
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, Download, FileText, Upload } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo, useState } from 'react';
import { FileTrigger } from 'react-aria-components';
import { EventValjare } from '@/components/events/EventValjare';
import { Button } from '@/components/primitives/Button';
import { Dialog, DialogTrigger } from '@/components/primitives/Dialog';
import { MessageBox } from '@/components/primitives/MessageBox';
import { Modal } from '@/components/primitives/Modal';
import { Skeleton } from '@/components/primitives/Skeleton';
import { ToggleButton, ToggleButtonGroup } from '@/components/primitives/ToggleButtonGroup';
import { formatMB } from '@/data/adapters/attachmentUpload';
import { useReplaceAttachment } from '@/data/mutations/useReplaceAttachment';
import { useUploadAttachment } from '@/data/mutations/useUploadAttachment';
import { useDataSource } from '@/data/useDataSource';
import type { Attachment, DocumentPreview } from '@/domain/models/Attachment';
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

  const uploadMutation = useUploadAttachment(eventId ?? '');
  // "Ersätt" (TASK-147.11) — SKILD hook/mutation från uppladdningsknappen
  // längst ner: samma FileTrigger-mönster, men bär vilken befintlig post
  // som ska bort (`oldAttachmentId`) och komponerar upload+delete i rätt
  // ordning (se useReplaceAttachment.ts för kontraktet).
  const replaceMutation = useReplaceAttachment(eventId ?? '');

  const rader = useMemo(
    () => grupperaPerNamn(attachmentsQuery.data ?? []),
    [attachmentsQuery.data],
  );

  const handleUpload = (files: FileList | null) => {
    const file = files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handleReplace = (files: FileList | null, oldAttachmentId: string) => {
    const file = files?.[0];
    if (file) replaceMutation.mutate({ file, oldAttachmentId });
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
          default-vald här. */}
      <EventValjare
        valtEventId={eventId ?? undefined}
        valtEvent={valtEvent}
        onByte={(id) => void setEventId(id)}
      />

      {eventId == null ? (
        <p className="text-small text-text-muted">Välj ett event för att se dess bilagor.</p>
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
 * GENERERAD PDF — VISA-KNAPPEN (TASK-246). Ersätter varv 3:s `VisaKnapp` +
 * `ProduceratExempel` (den statiska fältlistan, git bevarar historiken) för
 * klass B/C — Marcus-ordern 2026-08-16: "en riktigt genererad PDF på alla
 * mallar ... och även generatorn". SKILD komponent från `BilagaVisaKnapp`
 * (ovan): den hämtar en signerad URL till en REDAN LAGRAD fil (TASK-245);
 * denna genererar en HELT NY, TRANSIENT PDF VID KLICK (POST, ingen lagrad
 * resurs att peka en URL mot) — bytesen kommer som base64 i själva svaret.
 *
 * `Blob` + `createObjectURL` i stället för en `data:`-URI: robust mot
 * data-URI-storleksgränser i vissa webbläsare (branschmönster för
 * "förhandsvisa en genererad fil i webbläsaren"), och `URL.revokeObjectURL`
 * städas explicit i `useEffect`s cleanup — en objekt-URL som aldrig
 * återkallas läcker minne, en per klick.
 *
 * SAMMA lazy-mönster som `BilagaVisaKnapp`: `isOpen` styr BÅDE
 * `DialogTrigger` OCH queryns `enabled` — PDF:en genereras FÖRST när
 * dialogen faktiskt öppnas, aldrig i förväg för hela listan.
 */
function GenereradPdfVisaKnapp({
  title,
  eventId,
  typ,
}: {
  title: string;
  eventId: string;
  /** Vilken generator-EF som ska anropas — se DataSourceAdapter för kontraktet per typ. */
  typ: 'mall' | 'generator';
}) {
  const dataSource = useDataSource();
  const [isOpen, setIsOpen] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const queryKey =
    typ === 'mall'
      ? queryKeys.documentPreviews.eventTemplate(eventId)
      : queryKeys.documentPreviews.receipt(eventId);

  const previewQuery = useQuery<DocumentPreview>({
    queryKey,
    queryFn: () =>
      typ === 'mall'
        ? dataSource.previewEventTemplate(eventId)
        : dataSource.previewReceipt(eventId),
    enabled: isOpen,
  });

  // Bygger/river objekt-URL:en när base64-datan ändras — INTE inuti queryFn
  // (queryFn ska vara REN datahämtning, ingen DOM-sideeffekt; samma
  // disciplin som gör att TanStack Query kan cacha/dedupa fritt).
  useEffect(() => {
    if (!previewQuery.data) return;
    const bytes = Uint8Array.from(atob(previewQuery.data.pdfBase64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [previewQuery.data]);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button intent="primary" emphasis="subtle" size="sm" className="self-center">
        Visa
      </Button>
      <Modal isDismissable>
        <Dialog title={title} size="lg">
          {previewQuery.isPending ? (
            <div role="status" aria-busy="true" className="flex flex-col gap-2">
              <span className="sr-only">Genererar förhandsvisning…</span>
              <Skeleton variant="listRow" className="h-[60vh]" />
            </div>
          ) : previewQuery.isError ? (
            <MessageBox intent="error" title="Kunde inte generera dokumentet">
              {previewQuery.error instanceof Error ? previewQuery.error.message : 'Okänt fel.'}
            </MessageBox>
          ) : blobUrl ? (
            <div className="flex flex-col gap-3">
              <iframe
                src={blobUrl}
                title={`Förhandsvisning av ${title}`}
                className="h-[60vh] w-full rounded border border-border bg-bg"
              />
              <a
                href={blobUrl}
                download={`${title}.pdf`}
                className="inline-flex items-center gap-1.5 self-start font-medium text-body underline underline-offset-2 hover:text-text"
              >
                <Download aria-hidden="true" size={16} />
                Ladda ner {title}.pdf
              </a>
            </div>
          ) : null}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

/**
 * FÖRHANDSVISNINGS-FORMATET, härlett ur filnamnets ändelse (TASK-245) —
 * SAMMA "gissa aldrig ur mönster"-disciplin som filhuvudets Fynd 1: ingen
 * server-buren `contentType` finns på `Attachment` (`Attachment.schema.ts`),
 * så ändelsen är den enda signal klienten faktiskt HAR. Bucketen `bilagor`
 * tillåter i dag ENDAST `application/pdf`
 * (`scripts/provision-attachments-bucket.mjs` § MIME-FILTER) — `bild`-grenen
 * är alltså medvetet FRAMÅTRIKTAD (AC #2 nämner uttryckligen "bild/PDF") och
 * overifierad mot verklig data i dag, men kostar noll extra rader att hålla
 * generisk i stället för PDF-bara.
 */
const BILD_ANDELSER = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);

type ForhandsvisningsFormat = 'pdf' | 'bild' | 'okant';

function forhandsvisningsFormat(namn: string): ForhandsvisningsFormat {
  const match = /\.([a-z0-9]+)$/i.exec(namn);
  const andelse = match ? match[1].toLowerCase() : '';
  if (andelse === 'pdf') return 'pdf';
  if (BILD_ANDELSER.has(andelse)) return 'bild';
  return 'okant';
}

/**
 * BILAGORNAS VISA-KNAPP (TASK-245, ersätter den ärliga info-dialogen — se
 * filhuvudets VISA-BETEENDET-not). SKILD komponent från `GenereradPdfVisaKnapp`
 * ovan: bilagor behöver en LAZY, dialog-scopad datahämtning (signerad URL,
 * TTL 300s) som Mallar/Generatorer (transient PDF-generering, ingen lagrad
 * resurs) aldrig behöver — att trycka in fetch-logik i en delad primitiv
 * hade tvingat två orelaterade call sites att bära samma komplexitet.
 *
 * LAZY PER KONSTRUKTION: `isOpen` styr BÅDE `DialogTrigger` (kontrollerad,
 * till skillnad mot `VisaKnapp`s okontrollerade form) OCH queryns `enabled`
 * — URL:en hämtas FÖRST när dialogen faktiskt öppnas, aldrig i förväg för
 * varje rad i listan. TanStack Querys default `staleTime` (0) gör att en
 * stängd-och-återöppnad dialog refetchar automatiskt i stället för att
 * återanvända en potentiellt utgången URL — ingen egen invalidation-logik
 * behövs (se `queryKeys.attachments.downloadUrl`).
 */
function BilagaVisaKnapp({ eventId, attachment }: { eventId: string; attachment: Attachment }) {
  const dataSource = useDataSource();
  const [isOpen, setIsOpen] = useState(false);
  const format = forhandsvisningsFormat(attachment.namn);

  const downloadQuery = useQuery({
    queryKey: queryKeys.attachments.downloadUrl(eventId, attachment.id),
    queryFn: () => dataSource.getAttachmentDownloadUrl(eventId, attachment.id),
    enabled: isOpen,
  });

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button intent="primary" emphasis="subtle" size="sm" className="self-center">
        Visa
      </Button>
      <Modal isDismissable>
        <Dialog title={attachment.namn} size="lg">
          {downloadQuery.isPending ? (
            <div role="status" aria-busy="true" className="flex flex-col gap-2">
              <span className="sr-only">Förbereder förhandsvisning…</span>
              <Skeleton variant="listRow" className="h-[60vh]" />
            </div>
          ) : downloadQuery.isError ? (
            <MessageBox intent="error" title="Kunde inte öppna filen">
              {downloadQuery.error instanceof Error ? downloadQuery.error.message : 'Okänt fel.'}
            </MessageBox>
          ) : (
            <div className="flex flex-col gap-3">
              {format === 'pdf' && (
                <iframe
                  src={downloadQuery.data.url}
                  title={`Förhandsvisning av ${attachment.namn}`}
                  className="h-[60vh] w-full rounded border border-border bg-bg"
                />
              )}
              {format === 'bild' && (
                <img
                  src={downloadQuery.data.url}
                  alt={attachment.namn}
                  className="max-h-[60vh] w-full rounded border border-border object-contain"
                />
              )}
              {format === 'okant' && (
                <MessageBox intent="info" title="Kan inte förhandsvisas här">
                  Den här filtypen kan inte förhandsvisas i den här vyn. Ladda ner den för att öppna
                  den.
                </MessageBox>
              )}
              <a
                href={downloadQuery.data.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start font-medium text-body underline underline-offset-2 hover:text-text"
              >
                <Download aria-hidden="true" size={16} />
                Ladda ner {attachment.namn}
              </a>
            </div>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

type UploadMutation = ReturnType<typeof useUploadAttachment>;
type ReplaceMutation = ReturnType<typeof useReplaceAttachment>;

function BilageRadRow({
  eventId,
  rad,
  onReplace,
  replaceMutation,
}: {
  eventId: string;
  rad: BilageRad;
  onReplace: (files: FileList | null, oldAttachmentId: string) => void;
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
  return (
    <div data-testid="dokument-fil" className="flex items-start gap-3 py-3">
      <FileText aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-text-muted" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="break-words font-medium text-body">{current.namn}</span>
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
      <span className="flex shrink-0 items-center gap-2 self-center">
        <BilagaVisaKnapp eventId={eventId} attachment={current} />
        <FileTrigger
          acceptedFileTypes={['application/pdf']}
          onSelect={(files) => onReplace(files, current.id)}
        >
          <Button intent="ghost" size="sm" isDisabled={ersatterDennaRaden}>
            {ersatterDennaRaden ? 'Ersätter…' : 'Ersätt'}
          </Button>
        </FileTrigger>
      </span>
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
      <GenereradPdfVisaKnapp title={mall.namn} eventId={eventId} typ="mall" />
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
      <GenereradPdfVisaKnapp title={gen.namn} eventId={eventId} typ="generator" />
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
  onUpload: (files: FileList | null) => void;
  uploadMutation: UploadMutation;
  onReplace: (files: FileList | null, oldAttachmentId: string) => void;
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

      <UppladdningsFel uploadMutation={uploadMutation} />
      <ErsattningsFel replaceMutation={replaceMutation} />
      <div>
        <FileTrigger acceptedFileTypes={['application/pdf']} onSelect={onUpload}>
          <Button intent="secondary" isDisabled={uploadMutation.isPending}>
            <Upload aria-hidden="true" size={16} className="shrink-0" />
            {uploadMutation.isPending ? 'Laddar upp…' : 'Ladda upp en fil'}
          </Button>
        </FileTrigger>
      </div>
    </div>
  );
}
