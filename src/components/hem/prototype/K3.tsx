import { Link } from '@tanstack/react-router';
import {
  BadgeCheck,
  CalendarDays,
  Ellipsis,
  House,
  MapPin,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
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
 * [PROTOTYPE] K3 — Marcus K2-feedback 2026-07-06 åtgärdad punkt för punkt
 * (S55 Del 4): EN innehållskolumn (hälsningskortet SAMMA bredd som övriga);
 * menyn = verkliga tabbar-kapseln FLIPPAD vertikalt på rimligt avstånd
 * vänster om innehållet (inte konventionell sidebar); app-namnet BORT (bara
 * versionsraden, nere till vänster); aktivitetsrutan LÅNGT till höger +
 * nedtill på desktop och DOLD under xl (mobil/platta: via Mer — byggkrav);
 * aktivitetsinnehållet speglar Fas 6.5:s faktiska aktivitetstyper;
 * kortrubriker i text-secondary (neutral-600 — mörkare etikettgrå ur
 * semantic.css, ingen ny token); scrollbaren centrerad markör (egen
 * [PROTOTYPE]-CSS) + luft mellan innehåll och bar; anmälningsraden bär
 * event-identiteten (kurs · ort · datum) i sekundärraden i stället för
 * pill; Nästa event-kortet uppstramat (ikon-metarader, dagar-kvar-pill,
 * beläggningsbar) inom befintliga tokens. Kastas med prototypen.
 */

// ── Vertikal tabbar-kapsel (≥lg) — verkliga TabBar-formen flippad ────────────
const NAV = [
  { to: '/hem', label: 'Hem', icon: House },
  { to: '/event', label: 'Event', icon: CalendarDays },
  { to: '/personer', label: 'Personer', icon: Users },
  { to: '/mer', label: 'Mer', icon: Ellipsis },
] as const;

function VertikalTabbar() {
  return (
    <div className="sticky top-0 hidden h-dvh w-28 shrink-0 flex-col items-center justify-center lg:flex">
      <nav
        aria-label="Huvudnavigation"
        className="rounded-full border border-border bg-surface contrast-more:border-border-strong"
      >
        <ul className="my-0 flex list-none flex-col items-stretch gap-1 p-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex">
                <Link
                  to={item.to}
                  activeProps={{ 'aria-current': 'page' }}
                  className="flex min-h-14 w-full min-w-20 flex-col items-center justify-center gap-0.5 rounded-full border border-transparent px-2 py-2 text-caption text-text-secondary transition-colors data-[status=active]:bg-bg-emphasized data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text contrast-more:data-[status=active]:border-border-strong"
                >
                  <Icon aria-hidden="true" size={20} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Versionsraden — diskret nere till vänster; app-namnet borttaget. */}
      <span className="absolute bottom-4 text-caption text-text-muted">v0.1.0</span>
    </div>
  );
}

// ── Hälsningen ───────────────────────────────────────────────────────────────
function GreetingK3() {
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

// ── Card-skal — etikett i text-secondary (neutral-600, mörkare rubrikgrå) ────
function CardEtikett({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-semibold text-caption text-text-secondary uppercase tracking-wider">
      {children}
    </h2>
  );
}

function DashboardCardK3({
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

// ── Nästa event — uppstramat inom designstilen ───────────────────────────────
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

function NastaEventCardK3() {
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
    <DashboardCardK3
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
    </DashboardCardK3>
  );
}

// ── Obetalda anmälningsavgifter — bara siffran ───────────────────────────────
function ObetaldaCardK3() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const antal = useMemo(() => {
    if (!data) return 0;
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN).length;
  }, [data]);

  return (
    <DashboardCardK3
      title="Obetalda anmälningsavgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <p className="font-semibold text-3xl">{antal}</p>
    </DashboardCardK3>
  );
}

// ── Nya anmälningar att hantera — exempeldata (staging saknar event-koppling) ─
// Rad: namn + event-identiteten (kurs · ort · kort datum) i sekundärraden;
// inskickad-datum till höger. Pillen med enbart kursnamn utgick (K2-feedback);
// event-identiteten kräver kurs+ort+datum för Lottas överblick — datavägen
// (startdatum/eventnr på anmälnings-läsmodellen) är bokförd som byggkrav.
const ANMALNINGAR_EXEMPEL = [
  { namn: 'Anna Andersson', event: 'Fjärrskådning 2 · Skövde · 15 sep', inskickad: '6 jul' },
  { namn: 'Erik Lindqvist', event: 'Fjärrskådning 2 · Skövde · 15 sep', inskickad: '5 jul' },
  { namn: 'Maria Nilsson', event: 'Resor i medvetandet · Göteborg · 3 okt', inskickad: '5 jul' },
  { namn: 'Johan Berg', event: 'Fjärrskådning 1 · Stockholm · 22 aug', inskickad: '4 jul' },
  { namn: 'Karin Ek', event: 'Psionautics · Skövde · 12 nov', inskickad: '4 jul' },
  { namn: 'Peter Ström', event: 'Fjärrskådning 3 · Skövde · 28 sep', inskickad: '3 jul' },
  { namn: 'Lisa Holm', event: 'Resor i medvetandet · Göteborg · 3 okt', inskickad: '3 jul' },
  { namn: 'Oskar Vik', event: 'Fjärrskådning 1 · Stockholm · 22 aug', inskickad: '2 jul' },
] as const;

function NyaAnmalningarCardK3() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="relative flex break-inside-avoid flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
    >
      <CardEtikett id={headingId}>Nya anmälningar att hantera</CardEtikett>
      <ul className="k3-scroll mt-2 flex max-h-72 flex-col overflow-y-auto pr-3">
        {ANMALNINGAR_EXEMPEL.map((rad, i) => (
          <li
            key={`${rad.namn}-${rad.inskickad}`}
            className={
              i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
            }
          >
            <Link to="/event" className="group flex items-start justify-between gap-3 py-2.5">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium group-hover:underline">{rad.namn}</span>
                <span className="truncate text-small text-text-muted">{rad.event}</span>
              </span>
              <span className="shrink-0 text-caption text-text-muted">{rad.inskickad}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-caption text-text-muted">
        Exempeldata — staging-anmälningarna saknar event-koppling; skarp data vid bygget.
      </p>
      {/* [PROTOTYPE] Scrollbar med centrerad markör: kantlinje i kortets yta
          runt thumben ger jämn luft på båda sidor (webkit) + thin/color
          (Firefox). Kastas med prototypen. */}
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
function CTAK3() {
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

// ── Senaste aktivitet — Fas 6.5:s faktiska aktivitetstyper (exempeldata) ─────
const AKTIVITET_EXEMPEL = [
  {
    icon: BadgeCheck,
    text: 'Betalning markerad',
    detalj: 'Anna Andersson — Fjärrskådning 2',
    tid: 'för 2 tim sedan',
  },
  {
    icon: UserCheck,
    text: 'Anmälan bekräftad',
    detalj: 'Erik Lindqvist — Fjärrskådning 2',
    tid: 'för 5 tim sedan',
  },
  {
    icon: UserPlus,
    text: 'Person tillagd',
    detalj: 'Maria Nilsson',
    tid: 'igår',
  },
] as const;

function AktivitetK3() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex w-80 break-inside-avoid flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
    >
      <CardEtikett id={headingId}>Senaste aktivitet</CardEtikett>
      <ul className="my-0 flex list-none flex-col p-0">
        {AKTIVITET_EXEMPEL.map((rad, i) => {
          const Icon = rad.icon;
          return (
            <li
              key={rad.text}
              className={`flex items-start gap-3 py-2.5 ${
                i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
              }`}
            >
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-surface">
                <Icon aria-hidden="true" size={14} className="text-text-secondary" />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-medium text-small">{rad.text}</span>
                <span className="truncate text-small text-text-muted">{rad.detalj}</span>
                <span className="text-caption text-text-muted">{rad.tid}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-caption text-text-muted">
        Exempeldata — aktivitetsloggen byggs i Fas 6.5 (markera betalning, bekräfta anmälan, lägga
        till person …).
      </p>
    </section>
  );
}

// ── K3 — komposition: EN innehållskolumn + aktiviteten långt till höger ──────
export function K3() {
  return (
    <div className="flex min-h-dvh">
      <VertikalTabbar />
      <div className="flex min-w-0 flex-1 gap-6 p-4 lg:p-8">
        {/* Innehållskolumnen — ALLA kort samma bredd (K2-felet rättat). */}
        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3 pb-24 lg:pb-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
            <GreetingK3 />
            <MinaSidorButton />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NastaEventCardK3 />
            <ObetaldaCardK3 />
          </div>

          <NyaAnmalningarCardK3 />

          <CTAK3 />
        </div>

        {/* Aktiviteten LÅNGT till höger + nedtill — ENDAST bred desktop (≥xl);
            mobil/platta når historiken via Mer (dump-kravet; byggkrav klass B). */}
        <div className="hidden shrink-0 flex-col items-end justify-end xl:flex">
          <AktivitetK3 />
        </div>
      </div>

      {/* Mobil/platta: verkliga tabbaren. */}
      <div className="lg:hidden">
        <TabBar />
      </div>
    </div>
  );
}
