import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { Skeleton } from '@/components/primitives/Skeleton';
import type { Event } from '@/domain/models/Event';
import { DashboardCard } from './DashboardCard';
import { useDashboardEvents } from './useDashboardData';

/** Visat eventnamn ur de fält Airtable kan leverera — aldrig krasch/tomt. */
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

/** Startdatum-tid; null/ogiltigt → Infinity (sorteras sist, räknas aldrig som "nästa"). */
function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** Långdatum per K10-facit ("15 september 2026") — sv-SE, aldrig rå ISO (Gunilla). */
const LANGDATUM = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Dagar-kvar-pillens EXAKTA tre former (K10-facit, AC #1): "Idag" /
 * "1 dag kvar" / "N dagar kvar". Härledd ur eventets startdatum mot dagens
 * dagsstart; Math.round absorberar tidszons-offseten mellan datumsträngens
 * UTC-midnatt och lokal midnatt (|offset| < 12 h → alltid rätt heltal).
 */
function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / 86_400_000);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/**
 * "Nästa event"-card till K10-facitet (task-4.3; designen låst S55 Del 12,
 * referens `bb31a12`) — det närmast kommande eventet i primär-tint, klickbart
 * i sin HELHET till eventets detaljsida (AC #2): länken är eventnamnet,
 * klick-ytan sträcks över hela kortet via `after:inset-0` mot DashboardCards
 * `relative` — EN länk-yta, inga nästlade länkar, och skärmläsare får ett
 * rent länknamn (eventnamnet) i stället för hela kortets text. I pending-/
 * fel-/tom-läge finns ingen länk → kortet är då inte klickbart (korrekt:
 * det finns inget mål).
 *
 * Facit-formen: dagar-kvar som VIT pill topp-höger ("71 dagar kvar" /
 * "1 dag kvar" / "Idag" — AC #1), metagrupp i text-small (eventnamnet medium,
 * ort med kartnålsikon, långdatum med kalenderikon — AC #3), "X av Y platser
 * bokade" (caption, secondary) med tunn beläggningsstapel (AC #4). Allt inom
 * tokensystemet — inga hårdkodade färger.
 *
 * "Nästa kommande" avgörs TEMPORALT: tidigaste `startdatum` ≥ idag
 * (dagsstart), INTE via `status`-enumet (Planerat/Genomfört/Inställt/Flyttat
 * är planeringstillstånd, inte temporalt). Detta speglar EXAKT 6b:s
 * dokumenterade filter-beslut (EventsList: "upcoming härleds ur startdatum
 * vs idag — INTE ur status-enumet") → ingen NY T14-krock införs. Event utan
 * startdatum räknas aldrig som "nästa" (startTid → Infinity, sist).
 *
 * Läser: namn, `startdatum`, `ort`, beläggning (`antalAnmalda`/`maxPlatser`).
 * Tom-säkert: inga kommande event → vänlig tom-text.
 */
export function NastaEventCard() {
  const { data, isPending, isError, error } = useDashboardEvents();

  // Dagsstarten hoistad ur nasta-memon: pillen (AC #1) härleder dagar-kvar
  // mot SAMMA referenspunkt som urvalet — aldrig två olika "idag".
  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const nasta = useMemo<Event | null>(() => {
    if (!data) return null;
    const kommande = data
      .filter((e) => startTid(e) >= idagStart) // Infinity (null) → aldrig "kommande"
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [data, idagStart]);

  // Beläggningen (AC #4): caption-texten är informationsbäraren; stapelns
  // fyllnadsandel = X/Y (clampad 0–100, division-säkrad för maxPlatser 0).
  const belagda = nasta?.antalAnmalda ?? 0;
  const maxPlatser = nasta?.maxPlatser ?? null;
  const andel =
    maxPlatser != null && maxPlatser > 0
      ? Math.min(100, Math.round((belagda / maxPlatser) * 100))
      : 0;

  return (
    <DashboardCard
      title="Nästa event"
      tone="primary"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nästa event…"
      // Lugnt laddläge (task-8.4): skelettet speglar den laddade kroppens
      // EXAKTA wrapper-anatomi (samma flex/gap/typografi-klasser) → identisk
      // slutgeometri per lh-principen (layout-skift ≈ 0). Eventmeta-raderna
      // (namn/ort/datum i text-small) + beläggningsraden (caption + stapelns
      // 6 px-plats). Pillen är absolut-positionerad (utanför flödet) och
      // speglas inte.
      pendingBody={
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 text-small">
            <Skeleton variant="text" className="w-3/5" />
            <Skeleton variant="text" className="w-2/5" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
          <div className="flex flex-col gap-1 text-caption">
            <Skeleton variant="text" className="w-2/5" />
            <Skeleton variant="text" className="h-1.5 rounded-full" />
          </div>
        </div>
      }
      errorTitle="Kunde inte hämta event"
    >
      {nasta == null ? (
        <p className="text-small text-text-muted">Inga kommande event.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Dagar-kvar som VIT pill topp-höger (K10-facit): positionerad mot
              DashboardCards relative-yta; texten är informationsbäraren. Utan
              startdatum finns ingen tidshorisont → ingen pill. */}
          {nasta.startdatum ? (
            <span className="absolute top-4 right-4 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption">
              {dagarKvarText(startTid(nasta), idagStart)}
            </span>
          ) : null}
          {/* Metagruppen (K10-facit, AC #3) i text-small: eventnamnet i medium
              som länken, orten med kartnålsikon, långdatumet med kalenderikon.
              Ikonerna är dekor (aria-hidden) — texten bär informationen. */}
          <div className="flex flex-col gap-1 text-small">
            <Link
              to="/event/$eventId"
              params={{ eventId: nasta.id }}
              className="font-medium underline-offset-2 after:absolute after:inset-0 hover:underline"
            >
              {eventName(nasta)}
            </Link>
            {nasta.ort ? (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
                {nasta.ort}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={14} className="shrink-0 text-text-secondary" />
              {nasta.startdatum ? LANGDATUM.format(new Date(nasta.startdatum)) : 'Datum ej satt'}
            </span>
          </div>
          {/* "X av Y platser reserverade" (caption, secondary) + tunn stapel
              (vit track, primär-dämpad fyllnad) — K10-facit; termen per
              ORDLISTA "Reservera (plats)" (review-våg 1, Marcus 2026-07-22).
              Stapeln är dekor (aria-hidden): texten bär, färg aldrig ensam. */}
          {maxPlatser != null ? (
            <div className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">
                {belagda} av {maxPlatser} platser reserverade
              </span>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary-muted"
                  style={{ width: `${andel}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-caption text-text-secondary">
              {belagda} anmälda (platser ej satt)
            </span>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
