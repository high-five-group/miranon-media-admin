import { Link } from '@tanstack/react-router';
import { CalendarDays, MapPin } from 'lucide-react';
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
 * [PROTOTYPE] K8 — Marcus K7-feedback 2026-07-07 (S55 Del 9):
 * Nästa event-kortet: eventnamnet NER från titelstorleken — blir en del
 * av metagruppen (samma storlek som ort/datum; fortsatt länken +
 * helkorts-klickytan), rubriken "Nästa event" ensam stor; historikrutan:
 * "Senaste aktivitet"-rubriken BORT (aria-label bär namnet) +
 * "Se all aktivitetshistorik"-länk längst ner; anmälningskortet:
 * rubriken INFLYTTAD (pl-2) så den linjerar vertikalt med radnamnen
 * (zebra-banden orörda). Övrigt oförändrat från K7. Kastas med
 * prototypen.
 */

// ── Hälsningen + Mina sidor ──────────────────────────────────────────────────
function GreetingK8() {
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

// ── Card-skal — rubriken ÖVER kortet, ordinarie dämpad grå ───────────────────
function DashboardCardK8({
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
      className={`relative flex break-inside-avoid flex-col gap-2 rounded-2xl border border-transparent p-4 contrast-more:border-border-strong print:border-border-strong ${
        tone === 'primary' ? 'bg-primary-tint' : 'bg-bg-muted'
      }`}
    >
      {/* Rubriken STOR som kortinnehållets titel (Fjärrskådning-storleken);
          färgen = base.css-regelns mörka default (som före ljusgrå-testet). */}
      <h2 id={headingId} className="font-semibold text-xl">
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

// ── Nästa event (K3-formen, godkänd) ─────────────────────────────────────────
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

function NastaEventCardK8() {
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
    <DashboardCardK8
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
          {nasta.startdatum ? (
            <span className="absolute top-4 right-4 rounded-full bg-surface px-2.5 py-0.5 font-medium text-caption">
              {dagarKvarText(startTid(nasta), idagStart)}
            </span>
          ) : null}
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
    </DashboardCardK8>
  );
}

// ── Obetalda — bara siffran ──────────────────────────────────────────────────
function ObetaldaCardK8() {
  const { data, isPending, isError, error } = useDashboardRegistrations();

  const antal = useMemo(() => {
    if (!data) return 0;
    return data.filter((reg) => reg.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN).length;
  }, [data]);

  return (
    <DashboardCardK8
      title="Obetalda anmälningsavgifter"
      isPending={isPending}
      isError={isError}
      error={error}
      loadingLabel="Laddar obetalda avgifter…"
      errorTitle="Kunde inte hämta anmälningar"
    >
      <p className="font-semibold text-3xl">{antal}</p>
    </DashboardCardK8>
  );
}

// ── Nya anmälningar — caption-storlek + zebra (avdelarna borta) ──────────────
const ANMALNINGAR_EXEMPEL = [
  {
    namn: 'Anna Andersson',
    event: 'Fjärrskådning 2 · Skövde · 15 sep',
    anmald: 'för 10 min sedan',
  },
  { namn: 'Erik Lindqvist', event: 'Fjärrskådning 2 · Skövde · 15 sep', anmald: 'för 2 tim sedan' },
  {
    namn: 'Maria Nilsson',
    event: 'Resor i medvetandet · Göteborg · 3 okt',
    anmald: 'för 4 tim sedan',
  },
  { namn: 'Johan Berg', event: 'Fjärrskådning 1 · Stockholm · 22 aug', anmald: 'igår 14:02' },
  { namn: 'Karin Ek', event: 'Psionautics · Skövde · 12 nov', anmald: 'igår 09:31' },
  { namn: 'Peter Ström', event: 'Fjärrskådning 3 · Skövde · 28 sep', anmald: 'för 2 dagar sedan' },
  {
    namn: 'Lisa Holm',
    event: 'Resor i medvetandet · Göteborg · 3 okt',
    anmald: 'för 2 dagar sedan',
  },
  { namn: 'Oskar Vik', event: 'Fjärrskådning 1 · Stockholm · 22 aug', anmald: 'för 3 dagar sedan' },
] as const;

function NyaAnmalningarCardK8() {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="relative flex break-inside-avoid flex-col gap-2 rounded-2xl border border-[color:var(--mm-accent)] bg-bg-muted p-4 print:border-border-strong"
    >
      <h2 id={headingId} className="pl-2 font-semibold text-xl">
        Nya anmälningar att hantera
      </h2>
      <div className="flex flex-col gap-1">
        <ul className="k3-scroll flex max-h-80 flex-col overflow-y-auto pr-3">
          {ANMALNINGAR_EXEMPEL.map((rad, i) => (
            <li
              key={`${rad.namn}-${rad.anmald}`}
              className={i % 2 === 1 ? 'rounded-lg bg-bg-emphasized' : ''}
            >
              <Link to="/event" className="group flex flex-col gap-0.5 px-2 py-2">
                <span className="truncate font-semibold group-hover:underline">{rad.namn}</span>
                <span className="truncate text-small">{rad.event}</span>
                <span className="text-caption text-text-muted">{rad.anmald}</span>
              </Link>
            </li>
          ))}
        </ul>
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
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────
function CTAK8() {
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

// ── Senaste aktivitet — svag fyllton (bg-subtle), ingen kant ─────────────────
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

function AktivitetK8() {
  return (
    <aside
      aria-label="Senaste aktivitet"
      className="absolute bottom-0 left-full ml-5 hidden w-72 flex-col gap-1 rounded-xl bg-bg-subtle p-3 xl:flex"
    >
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
      <Link to="/mer" className="mt-1 font-medium text-caption underline-offset-2 hover:underline">
        Se all aktivitetshistorik ›
      </Link>
    </aside>
  );
}

// ── K8 — komposition: K1-menyn tillbaka (botten-tabbaren, alla breakpoints) ──
export function K8() {
  return (
    <div className="relative min-h-dvh">
      <div className="mx-auto flex w-full max-w-[600px] flex-col gap-3 p-4 pt-6 pb-24 lg:pt-14">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-bg-muted p-6 contrast-more:border-border-strong print:border-border-strong">
          <GreetingK8 />
          <MinaSidorButton />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NastaEventCardK8 />
          <ObetaldaCardK8 />
        </div>

        {/* Aktivitetsloggen bottenlinjerar med anmälningskortet. */}
        <div className="relative">
          <NyaAnmalningarCardK8 />
          <AktivitetK8 />
        </div>

        <CTAK8 />
      </div>

      {/* Versionsraden — diskret nere till vänster. */}
      <span className="fixed bottom-4 left-4 hidden text-caption text-text-muted lg:block">
        Miranon Media Admin v0.1.0
      </span>

      {/* K1-menyn tillbaka: verkliga botten-tabbaren på ALLA breakpoints. */}
      <TabBar />
    </div>
  );
}
