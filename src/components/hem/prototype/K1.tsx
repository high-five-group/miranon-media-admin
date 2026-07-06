import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useId, useMemo } from 'react';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/primitives/Button';
import { MessageBox } from '@/components/primitives/MessageBox';
import {
  displayName,
  inskickadDatum,
  inskickadTid,
} from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import { PaymentStatus } from '@/domain/types/Status';
import { alertScreenReader } from '@/lib/alert-screen-reader';
import { queryKeys } from '@/queries/keys';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] K1 — EXAKT KOPIA av den faktiska Hem-vyn: baslinjen för T65:s
 * konvergens-pass (S55). Renderingen är radrätt kopierad ur
 * `src/components/hem/` (Hem / Greeting / DashboardCard / NastaEventCard /
 * ObetaldaCard / NyaAnmalningarCard / CTA / RefreshButton på HEAD vid
 * S55-start); datalagret DELAS med den skarpa vyn (useDashboardData →
 * router-context-DI, read-only). Komponenterna är kopierade LOKALT så att
 * iterationssteg (K2, K3 …) kan mutera fritt utan att röra den skarpa vyn.
 * Kastas med prototypen (throwaway-kontraktet klausul iv).
 */

// ── Greeting (kopia) ────────────────────────────────────────────────────────
function Greeting() {
  const { user } = useAuth();
  const name = user?.displayName;
  return <h1 className="font-semibold text-3xl">{name ? `Hej ${name}!` : 'Hej!'}</h1>;
}

// ── RefreshButton (kopia) ───────────────────────────────────────────────────
function RefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: queryKeys.dashboard.all }) > 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    alertScreenReader('Översikten uppdaterad.');
  };

  return (
    <Button intent="secondary" size="sm" isDisabled={isFetching} onPress={handleRefresh}>
      {isFetching ? 'Uppdaterar…' : 'Uppdatera översikt'}
    </Button>
  );
}

// ── DashboardCard (kopia) ───────────────────────────────────────────────────
function DashboardCard({
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
      <h2 id={headingId} className="font-medium text-small text-text-muted">
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

// ── NastaEventCard (kopia) ──────────────────────────────────────────────────
function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function belaggningText(e: Event): string {
  if (e.maxPlatser == null) return `${e.antalAnmalda} anmälda (platser ej satt)`;
  return `${e.antalAnmalda} av ${e.maxPlatser} platser`;
}

function NastaEventCard() {
  const { data, isPending, isError, error } = useDashboardEvents();

  const nasta = useMemo<Event | null>(() => {
    if (!data) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();
    const kommande = data
      .filter((e) => startTid(e) >= todayStart)
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [data]);

  return (
    <DashboardCard
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
          <span className="text-small">
            {[nasta.startdatum, nasta.ort].filter(Boolean).join(' · ') || 'Datum ej satt'}
          </span>
          <span className="text-small text-text-muted">{belaggningText(nasta)}</span>
        </div>
      )}
    </DashboardCard>
  );
}

// ── ObetaldaCard (kopia) ────────────────────────────────────────────────────
const MAX_NAMN = 2;

function ObetaldaCard() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const obetalda = useMemo(() => {
    if (!data) return [];
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN);
  }, [data]);

  return (
    <DashboardCard
      title="Obetalda avgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-3xl">{obetalda.length}</p>
        <p className="text-small text-text-muted">
          {obetalda.length === 0
            ? 'Inga obetalda avgifter.'
            : obetalda
                .slice(0, MAX_NAMN)
                .map((reg) => displayName(reg))
                .join(', ') + (obetalda.length > MAX_NAMN ? ' …' : '')}
        </p>
      </div>
    </DashboardCard>
  );
}

// ── NyaAnmalningarCard (kopia) ──────────────────────────────────────────────
const MAX_RADER = 5;

function NyaAnmalningarCard() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const senaste = useMemo(() => {
    if (!data) return [];
    return [...data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, MAX_RADER);
  }, [data]);

  return (
    <DashboardCard
      title="Nya anmälningar"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar nya anmälningar…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      {senaste.length === 0 ? (
        <p className="text-small text-text-muted">Inga anmälningar än.</p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {senaste.map((reg, i) => {
            const datum = inskickadDatum(reg);
            return (
              <li
                key={reg.id}
                className={
                  i > 0 ? 'border-border-light border-t contrast-more:border-border-strong' : ''
                }
              >
                {reg.eventId ? (
                  <Link
                    to="/event/$eventId/anmalda"
                    params={{ eventId: reg.eventId }}
                    className="group flex flex-col gap-0.5 py-2"
                  >
                    <span className="font-medium group-hover:underline">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {[reg.eventNamn, datum].filter(Boolean).join(' · ') || 'Uppgift saknas'}
                    </span>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-0.5 py-2">
                    <span className="font-medium">{displayName(reg)}</span>
                    <span className="text-small text-text-muted">
                      {['Utan event', datum].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}

// ── CTA (kopia) ─────────────────────────────────────────────────────────────
function CTA() {
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

// ── K1 — kompositionen (kopia av Hem) ───────────────────────────────────────
export function K1() {
  return (
    <section className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
        <Greeting />
        <RefreshButton />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NastaEventCard />
        <ObetaldaCard />
      </div>

      <NyaAnmalningarCard />

      <CTA />
    </section>
  );
}
