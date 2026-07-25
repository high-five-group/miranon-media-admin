import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BedDouble, CalendarDays, MapPin } from 'lucide-react';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';

/** Event-listans tidsaxel (ORDLISTA "Period") — härledd ur startdatum, aldrig ur Status. */
export type Period = 'upcoming' | 'past';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
export function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Tid-värde för periodfilter/sort; null/ogiltigt startdatum → Infinity (sist, aldrig past). */
export function dateValue(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Fullt = inga platser kvar. `platserKvar` null (okänt tak) → ej "fullt".
    Exporterad sedan task-18.18 (delad med eventväljarens sammanfattning). */
export function isFull(e: Event): boolean {
  return e.platserKvar != null && e.platserKvar <= 0;
}

/**
 * Listkortets ENKLA beläggningsstapel (S72-facitets B-kort) — spår + fyllnad,
 * bredd = antalAnmalda/maxPlatser, grön fyllnad vid fullt. DELAD sedan
 * task-18.18 (review-pilotens F6): eventväljarens sammanfattning bär samma
 * form — en grammatik, inte två kopior (manadsgrupp-lyftets klass). Alltid
 * dekor (aria-hidden här): texten bär beläggningen (WCAG 1.4.1).
 */
export function BelaggningsStapel({
  event: e,
  className = '',
}: {
  event: Event;
  className?: string;
}) {
  const andel =
    e.maxPlatser != null && e.maxPlatser > 0
      ? Math.min(100, Math.round((e.antalAnmalda / e.maxPlatser) * 100))
      : 0;
  return (
    <div aria-hidden="true" className={`h-1.5 rounded-full bg-surface ${className}`}>
      <div
        data-slot="belaggning-fyllnad"
        className={`h-full rounded-full ${isFull(e) ? 'bg-success' : 'bg-(--p-neutral-400)'}`}
        style={{ width: `${andel}%` }}
      />
    </div>
  );
}

/** Långdatum per facit-kortets datumrad ("31 juli 2026") — sv-SE, aldrig rå ISO (Gunilla). */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Dagar-kvar-pillens tre exakta former (Hem-kortets K10-facit): "Idag" /
 * "1 dag kvar" / "N dagar kvar". Math.round absorberar tidszons-offseten
 * mellan datumsträngens UTC-midnatt och lokal midnatt (|offset| < 12 h).
 */
function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / 86_400_000);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/**
 * EventCard — listans likformiga slot-kort (task-17.2; S72-facitets B-kort,
 * vy-lokal 11/10/10 per PRD-beslut 4). Facit:
 * `tasks/sessions/bilagor/s72-event-lista-konvergens/FACIT-listvyn.png`.
 *
 * SLOT-MODELLEN (PRD-beslut 6 — korten är alltid likformiga):
 * - Rubriken reserverar EXAKT 2 rader (`line-clamp-2 min-h-[2lh]`) med
 *   pill-frizon (`pr-24`); alla metarader renderas ALLTID med platshållare
 *   vid saknat värde ("Ort ej satt"/"Datum ej satt"); beläggningsblocket
 *   (text + stapel-spår) renderas även utan tak (tom fyllnad).
 * - Status-slotten topp-höger är SEMANTISK: avvikelsen Inställt/Flyttat
 *   ERSÄTTER dagar-kvar (ett inställt event har ingen nedräkning);
 *   dagar-kvar visas endast för Kommande; Planerat/Genomfört är TYSTA
 *   (endast avvikelser sticker ut — story 8).
 * - Inställt: dämpat kort + genomstruken rubrik + slot-text i error-färg
 *   (texten bär — dimning/färg är förstärkning, aldrig ensam bärare).
 *   DÄMPNINGEN är text-token-buren (text-muted + opacity endast på dekor),
 *   INTE kort-opacity: prototypens opacity-60 drog all text under
 *   WCAG-AA-golvet (axe-mätt 2.77–3.96:1; tillgänglighets-golvet skärs
 *   aldrig — facit-avvikelsen öppet bokförd i task-17.2). Under
 *   prefers-contrast: more släpper dämpningen helt (genomstrykningen +
 *   slot-texten bär ensamma).
 * - Fullbokat: grön kontur + grön stapel-fyllnad; texten "X av X platser
 *   reserverade" bär redan tillståndet (färg aldrig ensam — WCAG 1.4.1).
 *
 * Klickytan är HELA kortet via `after:absolute after:inset-0` på rubriklänken
 * mot kortets `relative` (NastaEventCard-precedenten: EN länk, rent länknamn).
 * Hover-bakgrund bg-emphasized är kort-klassens S72-beslut (NavCards
 * M3-avslag gällde Mer-raderna). Allt inom tokensystemet; stapelns dämpade
 * grå är facitets `--p-neutral-400` (semantisk meter-token saknas ännu —
 * tokens-ytan är delad, se task-17.2-notes).
 *
 * "Bor över"-raden (task-17.5): säng-glyf + härlett antal (`borOverAntal` ur
 * get-events aggregering) som SISTA metaraden — renderas ALLTID (slot-modellen;
 * 0 → "0 bor över", saknat värde → "–"), så korten förblir likhöga (review-våg 1).
 */
export function EventCard({
  event: e,
  period,
  idagStart,
}: {
  event: Event;
  period: Period;
  idagStart: number;
}) {
  const dataSource = useDataSource();
  const queryClient = useQueryClient();
  /** Värmer eventsidans båda queries. Idempotent — React Query dedupar. */
  const forbered = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.detail(e.id),
      queryFn: () => dataSource.fetchEvent(e.id),
      staleTime: 30_000,
    });
    queryClient.prefetchQuery({
      queryKey: queryKeys.registrations.byEvent(e.id),
      queryFn: () => dataSource.fetchRegistrations({ eventId: e.id }),
      staleTime: 30_000,
    });
  };

  const startMs = dateValue(e);
  const installt = e.status === 'Inställt';
  const flyttat = e.status === 'Flyttat';
  const full = isFull(e);
  const maxPlatser = e.maxPlatser;
  // Status-slotten: avvikelsen vinner alltid; dagar-kvar endast Kommande.
  const slot = installt
    ? { text: 'Inställt', cls: 'text-error' }
    : flyttat
      ? { text: 'Flyttat', cls: 'text-warning' }
      : period === 'upcoming' && e.startdatum && Number.isFinite(startMs)
        ? { text: dagarKvarText(startMs, idagStart), cls: '' }
        : null;
  const kontur = full ? 'border-success' : 'border-transparent contrast-more:border-border-strong';

  // Inställt-dämpningen: muted-texttoken (AA-säkrad mot bg-muted) i stället
  // för kort-opacity; contrast-more återställer till ordinarie tonen.
  const dampadText = installt ? 'text-text-muted contrast-more:text-text' : '';

  return (
    <li
      // PREFETCH PÅ AVSIKT: eventsidans två anrop (~1,1 s respektive ~1,4 s
      // mätt) hinner aldrig bli instant om de startar först vid klicket.
      // Hover/fokus är den tidigaste ärliga signalen om att kortet ska
      // öppnas — anropen startar där i stället. React Query dedupar, så
      // upprepad hover kostar inget, och `staleTime` gör att en redan
      // hämtad detalj inte hämtas om.
      onMouseEnter={forbered}
      onFocusCapture={forbered}
      className={`relative flex flex-col gap-2 rounded-2xl border bg-bg-muted p-4 hover:bg-bg-emphasized motion-safe:transition-colors ${kontur}`}
    >
      {slot ? (
        <span
          data-slot="status"
          className={`absolute top-4 right-4 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption ${slot.cls}`}
        >
          {slot.text}
        </span>
      ) : null}
      <div className={`flex flex-col gap-1 text-small ${dampadText}`}>
        <Link
          to="/event/$eventId"
          params={{ eventId: e.id }}
          className={`line-clamp-2 min-h-[2lh] pr-24 font-semibold text-body after:absolute after:inset-0 ${
            installt ? 'line-through' : ''
          }`}
        >
          {eventName(e)}
        </Link>
        <span className="flex items-center gap-1.5">
          <MapPin
            aria-hidden="true"
            size={14}
            className={`shrink-0 ${installt ? 'opacity-60 contrast-more:opacity-100' : 'text-text-secondary'}`}
          />
          {e.ort ?? 'Ort ej satt'}
        </span>
        <span className="flex items-center gap-1.5">
          <CalendarDays
            aria-hidden="true"
            size={14}
            className={`shrink-0 ${installt ? 'opacity-60 contrast-more:opacity-100' : 'text-text-secondary'}`}
          />
          {e.startdatum && Number.isFinite(startMs)
            ? LANGDATUM.format(new Date(e.startdatum))
            : 'Datum ej satt'}
        </span>
        {/* Bor över-raden ALLTID (slot-modellen, task-17.5): säng-glyf + antal.
            Antalet HÄRLEDS ur eventets Anmälningar (get-events aggregerar) —
            ett tal ≥0, där 0 renderas som "0 bor över" (platshållaren vid noll
            är att raden reserveras, inte döljs → kort med och utan bor över är
            likhöga, review-våg 1). "–" är den ärliga formen vid saknat värde
            (äldre cache-svar utan fältet). Ikonen är dekor (aria-hidden);
            texten bär antalet (WCAG 1.4.1). */}
        <span data-slot="bor-over" className="flex items-center gap-1.5">
          <BedDouble
            aria-hidden="true"
            size={14}
            className={`shrink-0 ${installt ? 'opacity-60 contrast-more:opacity-100' : 'text-text-secondary'}`}
          />
          {e.borOverAntal ?? '–'} bor över
        </span>
      </div>
      {/* Beläggningsblocket ALLTID (slot-modellen): texten bär, stapeln
          förstärker (aria-hidden dekor — WCAG 1.4.1). */}
      <div className="flex flex-col gap-1">
        <span className={`text-caption ${dampadText || 'text-text-secondary'}`}>
          {maxPlatser != null
            ? `${e.antalAnmalda} av ${maxPlatser} platser reserverade`
            : `${e.antalAnmalda} anmälda (platser ej satt)`}
        </span>
        <BelaggningsStapel
          event={e}
          className={installt ? 'opacity-60 contrast-more:opacity-100' : ''}
        />
      </div>
    </li>
  );
}
