import { Link } from '@tanstack/react-router';
import { useMemo } from 'react';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus } from '@/domain/types/Status';
import { RefreshButton } from '../RefreshButton';
import { useDashboardEvents, useDashboardRegistrations } from '../useDashboardData';

/**
 * [PROTOTYPE] Variant B — "Siffror först" (stat-tiles + grupprubriks-lista).
 *
 * Struktur: kompakt hälsningsRAD (ingen kortyta) → 2×2 stat-grid med STORA tal
 * (mätvärdena dominerar; obetalda får accent-tint) → grupprubrik UTANFÖR
 * korten (FK: Utbetalningar-månadsrubrikerna) → ETT KORT PER RAD-lista (FK:
 * Ärenden) → helbredds-CTA sist. Informationshierarkin är omvänd mot A:
 * läget-i-siffror först, personerna sedan.
 */

const DAG_MS = 86_400_000;

function eventName(e: Event): string {
  return e.eventNamn ?? e.eventlabel ?? 'Namnlöst event';
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

function displayName(reg: Registration): string {
  if (reg.namn) return reg.namn;
  const composed = [reg.fornamn, reg.efternamn].filter(Boolean).join(' ');
  return composed || 'Namn saknas';
}

function inskickadTid(reg: Registration): number {
  if (!reg.inskickad) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
}

function inskickadDatum(reg: Registration): string | null {
  if (!reg.inskickad) return null;
  const t = Date.parse(reg.inskickad);
  return Number.isNaN(t) ? null : new Date(t).toLocaleDateString('sv-SE');
}

function StatTile({
  label,
  value,
  sub,
  tinted,
}: {
  label: string;
  value: string;
  sub?: string;
  tinted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl p-4 ${tinted ? 'bg-accent-tint' : 'bg-bg-muted'}`}
    >
      <span className="text-small text-text-muted">{label}</span>
      <span className="font-semibold text-4xl">{value}</span>
      {sub ? <span className="text-small text-text-muted">{sub}</span> : null}
    </div>
  );
}

export function VariantB({ namn }: { namn: string }) {
  const events = useDashboardEvents();
  const regs = useDashboardRegistrations();

  const nasta = useMemo<Event | null>(() => {
    if (!events.data) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const kommande = events.data
      .filter((e) => startTid(e) >= now.getTime())
      .sort((a, b) => startTid(a) - startTid(b));
    return kommande[0] ?? null;
  }, [events.data]);

  const senaste = useMemo(() => {
    if (!regs.data) return [];
    return [...regs.data].sort((a, b) => inskickadTid(b) - inskickadTid(a)).slice(0, 5);
  }, [regs.data]);

  const nyaSjuDagar = useMemo(() => {
    if (!regs.data) return 0;
    const grans = Date.now() - 7 * DAG_MS;
    return regs.data.filter((r) => inskickadTid(r) >= grans).length;
  }, [regs.data]);

  const obetalda = useMemo(() => {
    if (!regs.data) return [];
    return regs.data.filter((r) => r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN);
  }, [regs.data]);

  const dagarTillNasta = useMemo<number | null>(() => {
    if (nasta == null) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((startTid(nasta) - now.getTime()) / DAG_MS));
  }, [nasta]);

  const platserKvar =
    nasta == null || nasta.maxPlatser == null ? null : nasta.maxPlatser - nasta.antalAnmalda;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 pb-24">
      {/* Kompakt hälsningsrad — ytan sparas åt siffrorna */}
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Hej {namn}!</h1>
        <RefreshButton />
      </div>

      {events.isPending || regs.isPending ? (
        <p role="status" className="text-text-muted">
          Laddar översikten…
        </p>
      ) : events.isError || regs.isError ? (
        <p className="text-text-muted">Kunde inte hämta översikten. Prova att uppdatera.</p>
      ) : (
        <>
          {/* 2×2 stat-grid — läget i fyra tal */}
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Nya anmälningar (7 dagar)" value={String(nyaSjuDagar)} />
            <StatTile
              label="Obetalda avgifter"
              value={String(obetalda.length)}
              tinted={obetalda.length > 0}
              sub={obetalda.length === 0 ? 'Allt är betalt' : undefined}
            />
            <StatTile
              label="Nästa event"
              value={
                dagarTillNasta == null
                  ? '–'
                  : dagarTillNasta === 0
                    ? 'Idag'
                    : `${dagarTillNasta} dgr`
              }
              sub={nasta ? eventName(nasta) : 'Inga kommande event'}
            />
            <StatTile
              label="Platser kvar"
              value={platserKvar == null ? '–' : String(platserKvar)}
              sub={nasta && platserKvar != null ? `på ${eventName(nasta)}` : undefined}
            />
          </div>

          {/* Grupprubrik utanför korten (FK: Utbetalningar) + ett kort per rad (FK: Ärenden) */}
          <h2 className="mt-2 font-semibold text-lg">Senaste anmälningar</h2>
          {senaste.length === 0 ? (
            <p className="text-small text-text-muted">Inga anmälningar än.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {senaste.map((reg) => (
                <li key={reg.id} className="flex flex-col gap-0.5 rounded-2xl bg-bg-muted p-4">
                  <span className="font-medium">{displayName(reg)}</span>
                  <span className="text-small text-text-muted">
                    {[reg.eventNamn, inskickadDatum(reg)].filter(Boolean).join(' · ') ||
                      'Uppgift saknas'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <Link
        to="/event"
        className="text-(color:--mm-btn-cta-text) flex min-h-14 items-center justify-between rounded-2xl bg-(--mm-btn-cta-bg) px-6 py-4 font-semibold text-lg transition-colors hover:bg-(--mm-btn-cta-hover)"
      >
        Visa alla event
        <span aria-hidden="true">›</span>
      </Link>
    </section>
  );
}
