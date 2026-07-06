import { Link } from '@tanstack/react-router';
import { CalendarDays, Ellipsis, House, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { TabBar } from '@/components/AppShell/TabBar';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import {
  displayName,
  inskickadDatum,
  inskickadTid,
} from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import { PaymentStatus } from '@/domain/types/Status';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] K2 — Marcus designdump 2026-07-06 applicerad på K1 (S55 Del 3):
 * headern borta; adaptiv navigation (vänstermeny ≥lg per Material 3-mönstret,
 * verklig TabBar <lg); "Hej Lotta" utan utropstecken; "Mina sidor"-knapp
 * (visuell — funktionen senare); nya kortrubriker som tydliga etiketter;
 * Nästa event med kursnamn/ort/långdatum/dagar-kvar/platser; Obetalda = bara
 * siffran; scrollbar anmälningslista med event-pill (rad → eventets sida);
 * aktivitets-mock nedtill höger (xAPI, Fas 6.5 — exempeldata); version i
 * sidomenyns botten. Kastas med prototypen (throwaway-kontraktet).
 */

// ── Sidomeny-mock (≥lg) — Material 3 component swapping: rail/meny på desktop ─
const NAV = [
  { to: '/hem', label: 'Hem', icon: House },
  { to: '/event', label: 'Event', icon: CalendarDays },
  { to: '/personer', label: 'Personer', icon: Users },
  { to: '/mer', label: 'Mer', icon: Ellipsis },
] as const;

function SidebarMock() {
  return (
    <nav
      aria-label="Huvudmeny"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-border border-r bg-surface p-3 contrast-more:border-border-strong lg:flex"
    >
      <span className="px-3 py-2 font-semibold">Miranon Media Admin</span>
      <ul className="my-0 mt-2 flex list-none flex-col gap-1 p-0">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                activeProps={{ 'aria-current': 'page' }}
                className="flex min-h-11 items-center gap-3 rounded-full border border-transparent px-4 text-text-secondary transition-colors hover:bg-bg-muted data-[status=active]:bg-bg-emphasized data-[status=active]:font-semibold data-[status=active]:text-text contrast-more:text-text contrast-more:data-[status=active]:border-border-strong"
              >
                <Icon aria-hidden="true" size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {/* Version i menyns botten — footer-konventionen (liten, dämpad). */}
      <span className="mt-auto px-3 py-2 text-caption text-text-muted">
        Miranon Media Admin v0.1.0
      </span>
    </nav>
  );
}

// ── Hälsningen — "Hej Lotta" UTAN utropstecken ("Lotta" vid återbesök = byggkrav) ─
function GreetingK2() {
  const { user } = useAuth();
  const name = user?.displayName;
  return <h1 className="font-semibold text-3xl">{name ? `Hej ${name}` : 'Hej'}</h1>;
}

// ── "Mina sidor" (visuell platshållare — ytan utvecklas senare, klass D) ─────
function MinaSidorButton() {
  return (
    <Button intent="secondary" size="sm" onPress={() => {}}>
      Mina sidor
    </Button>
  );
}

// ── Card-skal — kortrubriken som TYDLIG etikett (versal, spärrad, dämpad) ────
function DashboardCardK2({
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
      <h2
        id={headingId}
        className="font-semibold text-caption text-text-muted uppercase tracking-wider"
      >
        {title}
      </h2>

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

// ── Nästa event — kursnamn · ort · långdatum + dagar kvar · platser ──────────
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

/** "11 juni 2025"-formen ur dumpen. */
function langtDatum(iso: string): string {
  return DATUM_LANG.format(new Date(iso));
}

/** "11 dagar kvar" / "1 dag kvar" / "Idag". */
function dagarKvarText(startMs: number, todayStartMs: number): string {
  const dagar = Math.round((startMs - todayStartMs) / 86_400_000);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

function NastaEventCardK2() {
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

  return (
    <DashboardCardK2
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
        <div className="flex flex-col gap-1">
          <Link
            to="/event/$eventId"
            params={{ eventId: nasta.id }}
            className="font-semibold text-lg underline-offset-2 after:absolute after:inset-0 hover:underline"
          >
            {eventName(nasta)}
          </Link>
          {nasta.ort ? <span className="text-small">{nasta.ort}</span> : null}
          <span className="text-small">
            {nasta.startdatum
              ? `${langtDatum(nasta.startdatum)} · ${dagarKvarText(startTid(nasta), idagStart)}`
              : 'Datum ej satt'}
          </span>
          <span className="text-small text-text-muted">{belaggningText(nasta)}</span>
        </div>
      )}
    </DashboardCardK2>
  );
}

// ── Obetalda anmälningsavgifter — BARA siffran ───────────────────────────────
function ObetaldaCardK2() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const antal = useMemo(() => {
    if (!data) return 0;
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN).length;
  }, [data]);

  return (
    <DashboardCardK2
      title="Obetalda anmälningsavgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <p className="font-semibold text-3xl">{antal}</p>
    </DashboardCardK2>
  );
}

// ── Nya anmälningar att hantera — scrollbar inline, rad → eventets sida ──────
const MAX_RADER_K2 = 25;

function NyaAnmalningarCardK2() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const senaste = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, MAX_RADER_K2);
  }, [data]);

  return (
    <DashboardCardK2
      title="Nya anmälningar att hantera"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nya anmälningar…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      {senaste.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälningar än.</p>
      ) : (
        <ul className="mt-2 flex max-h-72 flex-col overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {senaste.map((reg, i) => {
            const datum = inskickadDatum(reg);
            const rad = (
              <>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium group-hover:underline">
                    {displayName(reg)}
                  </span>
                  <span className="text-small text-text-muted">{datum ?? 'Datum saknas'}</span>
                </span>
                <span className="max-w-[45%] shrink-0 self-center truncate rounded-full bg-bg-emphasized px-2.5 py-0.5 text-caption">
                  {reg.eventNamn ?? 'Utan event'}
                </span>
              </>
            );
            return (
              <li
                key={reg.id}
                className={
                  i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
                }
              >
                {reg.eventId ? (
                  <Link
                    to="/event/$eventId"
                    params={{ eventId: reg.eventId }}
                    className="group flex items-start justify-between gap-3 py-2"
                  >
                    {rad}
                  </Link>
                ) : (
                  <div className="flex items-start justify-between gap-3 py-2">{rad}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCardK2>
  );
}

// ── CTA (oförändrad design) ──────────────────────────────────────────────────
function CTAK2() {
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

// ── Aktivitets-mock — nedtill höger på desktop (xAPI = Fas 6.5, exempeldata) ─
const AKTIVITET_EXEMPEL = [
  { text: 'Anmälan mottagen — Dubblett Test', tid: 'för 2 tim sedan' },
  { text: 'Betalning markerad — Staging Test', tid: 'igår' },
  { text: 'Event uppdaterat — Fjärrskådning', tid: 'igår' },
] as const;

function AktivitetMock() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex break-inside-avoid flex-col gap-1 rounded-2xl border border-transparent bg-bg-muted p-4 contrast-more:border-border-strong print:border-border-strong"
    >
      <h2
        id={headingId}
        className="font-semibold text-caption text-text-muted uppercase tracking-wider"
      >
        Senaste aktivitet
      </h2>
      <ul className="my-0 flex list-none flex-col p-0">
        {AKTIVITET_EXEMPEL.map((rad, i) => (
          <li
            key={rad.text}
            className={`flex flex-col gap-0.5 py-2 ${
              i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
            }`}
          >
            <span className="text-small">{rad.text}</span>
            <span className="text-caption text-text-muted">{rad.tid}</span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-muted">
        Exempeldata — aktivitetsloggen (xAPI) byggs i Fas 6.5.
      </p>
    </section>
  );
}

// ── K2 — adaptiv komposition ─────────────────────────────────────────────────
export function K2() {
  return (
    <div className="flex min-h-dvh">
      <SidebarMock />
      <div className="min-w-0 flex-1">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-3 p-4 pb-24 lg:gap-4 lg:p-8 lg:pb-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
            <GreetingK2 />
            <MinaSidorButton />
          </div>

          <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
            <div className="flex min-w-0 flex-col gap-3 lg:col-span-2 lg:gap-4">
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                <NastaEventCardK2 />
                <ObetaldaCardK2 />
              </div>
              <NyaAnmalningarCardK2 />
              <CTAK2 />
            </div>

            {/* Höger kolumn: aktiviteten NEDTILL höger (justify-end). */}
            <div className="flex min-w-0 flex-col justify-end gap-3 lg:gap-4">
              <AktivitetMock />
            </div>
          </div>
        </div>

        {/* Mobil/platta: verkliga tabbaren (Material 3 component swapping). */}
        <div className="lg:hidden">
          <TabBar />
        </div>
      </div>
    </div>
  );
}
