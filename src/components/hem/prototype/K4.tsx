import { Link } from '@tanstack/react-router';
import { CalendarDays, Ellipsis, House, MapPin, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { TabBar } from '@/components/AppShell/TabBar';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import type { Event } from '@/domain/models/Event';
import { PaymentStatus } from '@/domain/types/Status';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] K4 — Marcus K3-feedback 2026-07-06 åtgärdad (S55 Del 5):
 * innehållet ALLTID centrerat mitt på skärmen (menyn + aktivitetsloggen
 * positioneras fixed/absolute och förskjuter aldrig kolumnen); menyn =
 * tabbaren med EXAKTA mått flippade (höjd 568 px = horisontella bredden,
 * cellerna flex-1 med aktiv pill som fyller cellen — samma principer) och
 * NÄRA innehållet (20 px från kolumnkanten); aktivitetsloggen som subtil
 * LIVE-historik (bg-subtle, liten text, puls-dot, AKTÖR framgår: Lotta/
 * Roger Gotthardsson, Marcus Johansson — inga ikoner) bottenlinjerad med
 * anmälningskortet; kortrubriker i ACCENT-koppar (--mm-accent #a3491c,
 * ~5,9:1 mot kortytan — annan färg, inte bara annan grå); anmälningslistan
 * per FK-mönstret (IMG_1539: tre-radiga rader namn/event/"Anmäld <datum>"
 * + chevron). Nästa event-kortet oförändrat från K3 (godkänt). Kastas med
 * prototypen.
 */

// ── Vertikal tabbar — exakta tabbar-mått flippade, nära innehållet ───────────
const NAV = [
  { to: '/hem', label: 'Hem', icon: House },
  { to: '/event', label: 'Event', icon: CalendarDays },
  { to: '/personer', label: 'Personer', icon: Users },
  { to: '/mer', label: 'Mer', icon: Ellipsis },
] as const;

function VertikalTabbarK4() {
  return (
    <nav
      aria-label="Huvudnavigation"
      className="-translate-y-1/2 fixed top-1/2 right-[calc(50%+340px)] hidden h-[568px] rounded-full border border-border bg-surface contrast-more:border-border-strong lg:block"
    >
      <ul className="my-0 flex h-full list-none flex-col items-stretch gap-1 p-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex flex-1">
              <Link
                to={item.to}
                activeProps={{ 'aria-current': 'page' }}
                className="flex h-full w-full min-w-16 flex-col items-center justify-center gap-0.5 rounded-full border border-transparent px-3 text-caption text-text-secondary transition-colors data-[status=active]:bg-bg-emphasized data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text contrast-more:data-[status=active]:border-border-strong"
              >
                <Icon aria-hidden="true" size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ── Hälsningen + Mina sidor ──────────────────────────────────────────────────
function GreetingK4() {
  const { user } = useAuth();
  const name = user?.displayName;
  return <h1 className="font-semibold text-3xl">{name ? `Hej ${name}` : 'Hej'}</h1>;
}

function MinaSidorButton() {
  return (
    <Button intent="secondary" size="sm" onPress={() => {}}>
      Mina sidor
    </Button>
  );
}

// ── Card-etikett — ACCENT-koppar (annan FÄRG, inte bara annan grå) ───────────
function CardEtikett({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="text-(color:--mm-accent) font-semibold text-caption uppercase tracking-wider"
    >
      {children}
    </h2>
  );
}

function DashboardCardK4({
  title,
  tone = 'neutral',
  isPending,
  isError,
  error,
  loadingLabel,
  errorTitle,
  children,
}: {
  title: string;
  tone?: 'neutral' | 'primary';
  isPending: boolean;
  isError: boolean;
  error: unknown;
  loadingLabel: string;
  errorTitle: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`relative flex break-inside-avoid flex-col gap-1 rounded-2xl border border-transparent p-4 contrast-more:border-border-strong print:border-border-strong ${
        tone === 'primary' ? 'bg-primary-tint' : 'bg-bg-muted'
      }`}
    >
      <CardEtikett id={headingId}>{title}</CardEtikett>

      {isPending ? (
        <p role="status" aria-live="polite" aria-busy="true" className="text-small text-text-muted">
          {loadingLabel}
        </p>
      ) : isError ? (
        <MessageBox intent="error" title={errorTitle}>
          {error instanceof Error ? error.message : 'Okänt fel.'}
        </MessageBox>
      ) : (
        children
      )}
    </section>
  );
}

// ── Nästa event — oförändrat från K3 (godkänt), endast etikettfärgen ny ──────
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

const DATUM_LANG = new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function dagarKvarText(startMs: number, todayStartMs: number): string {
  const dagar = Math.round((startMs - todayStartMs) / 86_400_000);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

function NastaEventCardK4() {
  const { data, isPending, isError, error } = useDashboardEvents();

  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  const nasta = useMemo<Event | null>(() => {
    if (!data) return null;
    const kommande = data
      .filter((e) => startTid(e) >= idagStart)
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [data, idagStart]);

  const belagda = nasta?.antalAnmalda ?? 0;
  const max = nasta?.maxPlatser ?? null;
  const andel = max != null && max > 0 ? Math.min(100, Math.round((belagda / max) * 100)) : 0;

  return (
    <DashboardCardK4
      title="Nästa event"
      tone="primary"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nästa event…"
      errorTitle="Kunde inte hämta event"
    >
      {nasta == null ? (
        <p className="text-small text-text-muted">Inga kommande event.</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <Link
              to="/event/$eventId"
              params={{ eventId: nasta.id }}
              className="font-semibold text-xl underline-offset-2 after:absolute after:inset-0 hover:underline"
            >
              {eventName(nasta)}
            </Link>
            {nasta.startdatum ? (
              <span className="shrink-0 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption">
                {dagarKvarText(startTid(nasta), idagStart)}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1 text-small">
            {nasta.ort ? (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" size={14} className="text-text-secondary" />
                {nasta.ort}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={14} className="text-text-secondary" />
              {nasta.startdatum ? DATUM_LANG.format(new Date(nasta.startdatum)) : 'Datum ej satt'}
            </span>
          </div>
          {max != null ? (
            <div className="flex flex-col gap-1">
              <span className="text-caption text-text-secondary">
                {belagda} av {max} platser bokade
              </span>
              <div aria-hidden="true" className="h-1.5 rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-(--mm-primary-muted)"
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
    </DashboardCardK4>
  );
}

// ── Obetalda — bara siffran ──────────────────────────────────────────────────
function ObetaldaCardK4() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const antal = useMemo(() => {
    if (!data) return 0;
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN).length;
  }, [data]);

  return (
    <DashboardCardK4
      title="Obetalda anmälningsavgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <p className="font-semibold text-3xl">{antal}</p>
    </DashboardCardK4>
  );
}

// ── Nya anmälningar — FK-mönstret (IMG_1539): tre rader + chevron ────────────
const ANMALNINGAR_EXEMPEL = [
  { namn: 'Anna Andersson', event: 'Fjärrskådning 2 · Skövde · 15 sep', anmald: '6 juli' },
  { namn: 'Erik Lindqvist', event: 'Fjärrskådning 2 · Skövde · 15 sep', anmald: '5 juli' },
  { namn: 'Maria Nilsson', event: 'Resor i medvetandet · Göteborg · 3 okt', anmald: '5 juli' },
  { namn: 'Johan Berg', event: 'Fjärrskådning 1 · Stockholm · 22 aug', anmald: '4 juli' },
  { namn: 'Karin Ek', event: 'Psionautics · Skövde · 12 nov', anmald: '4 juli' },
  { namn: 'Peter Ström', event: 'Fjärrskådning 3 · Skövde · 28 sep', anmald: '3 juli' },
  { namn: 'Lisa Holm', event: 'Resor i medvetandet · Göteborg · 3 okt', anmald: '3 juli' },
  { namn: 'Oskar Vik', event: 'Fjärrskådning 1 · Stockholm · 22 aug', anmald: '2 juli' },
] as const;

function NyaAnmalningarCardK4() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="relative flex break-inside-avoid flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
    >
      <CardEtikett id={headingId}>Nya anmälningar att hantera</CardEtikett>
      <ul className="k3-scroll mt-2 flex max-h-80 flex-col overflow-y-auto pr-3">
        {ANMALNINGAR_EXEMPEL.map((rad, i) => (
          <li
            key={`${rad.namn}-${rad.anmald}`}
            className={
              i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
            }
          >
            <Link to="/event" className="group flex items-center justify-between gap-3 py-3">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-semibold group-hover:underline">{rad.namn}</span>
                <span className="truncate text-small">{rad.event}</span>
                <span className="text-small text-text-muted">Anmäld {rad.anmald}</span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-text-secondary">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-caption text-text-muted">
        Exempeldata — staging-anmälningarna saknar event-koppling; skarp data vid bygget.
      </p>
      {/* [PROTOTYPE] Centrerad scrollmarkör (K3-fixen behållen). */}
      <style>{`
        .k3-scroll { scrollbar-width: thin; scrollbar-color: var(--mm-border-strong) transparent; scrollbar-gutter: stable; }
        .k3-scroll::-webkit-scrollbar { width: 12px; }
        .k3-scroll::-webkit-scrollbar-track { background: transparent; }
        .k3-scroll::-webkit-scrollbar-thumb {
          background: var(--mm-border-strong);
          border-radius: 999px;
          border: 3px solid var(--mm-bg-muted);
        }
      `}</style>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────
function CTAK4() {
  return (
    <Link
      to="/mer/anmalningar"
      className="text-(color:--mm-btn-cta-text) flex min-h-14 items-center justify-between rounded-2xl bg-(--mm-btn-cta-bg) px-6 py-4 font-semibold text-lg transition-colors hover:bg-(--mm-btn-cta-hover)"
    >
      Visa alla anmälningar
      <span aria-hidden="true">›</span>
    </Link>
  );
}

// ── Senaste aktivitet — subtil LIVE-historik (aktör framgår, inga ikoner) ────
const AKTIVITET_EXEMPEL = [
  {
    aktor: 'Lotta Gotthardsson',
    handelse: 'markerade betalning — Anna Andersson (Fjärrskådning 2)',
    tid: 'för 2 tim sedan',
  },
  {
    aktor: 'Roger Gotthardsson',
    handelse: 'bekräftade anmälan — Erik Lindqvist (Fjärrskådning 2)',
    tid: 'för 5 tim sedan',
  },
  {
    aktor: 'Marcus Johansson',
    handelse: 'lade till person — Maria Nilsson',
    tid: 'igår 16:42',
  },
  {
    aktor: 'Lotta Gotthardsson',
    handelse: 'markerade betalning — Johan Berg (Fjärrskådning 1)',
    tid: 'igår 09:15',
  },
] as const;

function AktivitetK4() {
  const headingId = useId();
  return (
    <aside
      aria-labelledby={headingId}
      className="absolute bottom-0 left-full ml-5 hidden w-72 flex-col gap-1 rounded-xl border border-border-light bg-bg-subtle p-3 contrast-more:border-border-strong xl:flex"
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-(--mm-success)" />
        <h2
          id={headingId}
          className="font-semibold text-caption text-text-muted uppercase tracking-wider"
        >
          Senaste aktivitet
        </h2>
      </div>
      <ol className="my-0 flex list-none flex-col p-0">
        {AKTIVITET_EXEMPEL.map((rad, i) => (
          <li
            key={`${rad.aktor}-${rad.tid}`}
            className={`flex flex-col gap-0.5 py-2 ${
              i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
            }`}
          >
            <span className="text-caption text-text-muted">{rad.tid}</span>
            <span className="text-caption">
              <span className="font-medium">{rad.aktor}</span> {rad.handelse}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-caption text-text-muted">Exempeldata — byggs i Fas 6.5.</p>
    </aside>
  );
}

// ── K4 — komposition: kolumnen ALLTID skärm-centrerad ────────────────────────
export function K4() {
  return (
    <div className="relative min-h-dvh">
      <VertikalTabbarK4 />

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3 p-4 pb-24 lg:py-8">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
          <GreetingK4 />
          <MinaSidorButton />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NastaEventCardK4 />
          <ObetaldaCardK4 />
        </div>

        {/* Aktivitetsloggen bottenlinjerar med anmälningskortet (absolute
            mot detta relative-omslag) — förskjuter aldrig kolumnen. */}
        <div className="relative">
          <NyaAnmalningarCardK4 />
          <AktivitetK4 />
        </div>

        <CTAK4 />
      </div>

      {/* Versionsraden — diskret, förskjuter inget. */}
      <span className="fixed bottom-4 left-4 hidden text-caption text-text-muted lg:block">
        v0.1.0
      </span>

      {/* Mobil/platta: verkliga tabbaren. */}
      <div className="lg:hidden">
        <TabBar />
      </div>
    </div>
  );
}
