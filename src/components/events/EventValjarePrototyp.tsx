/**
 * [PROTOTYPE] S83 pass 4 — TASK-18.18 + TASK-18.19 (ETT pass, samma
 * komponentfamilj). KASTBAR KOD (throwaway-kontraktet).
 *
 * FRÅGAN (nedskriven, klausul i): Hur ska EVENTVÄLJAREN se ut och bete sig
 * på (1) manuell anmälan-sidan (förvald från djuplänken, bytbar — stängt
 * läge = B-formens kontextrad: prick + namn + ort + kollapsat datumspann)
 * och (2) eventdetaljsidan (rubrik-frågan: A = väljaren ÄR rubriken,
 * Stripe-formen · B = kompakt kontroll ovanför H1:an)?
 *
 * Kortens öppna beslut demonstreras live: route-semantik = URL-navigering
 * (rek a — bytet navigerar riktiga routen, datan laddas om) ·
 * list-innehåll = kommande event i LISTANS låsta ordning (närmast först) ·
 * riktig datahämtning (underform A — staging by construction).
 * URL: ny-anmalan ?variant=k · eventsidan ?variant=a | ?variant=b.
 * Rivs med passet (klausul iv).
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CalendarDays, Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PrototypeVariant } from '@/components/dev/PrototypeSwitcher';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { queryKeys } from '@/queries/keys';
import { dateValue, eventName } from './EventCard';

export const PROTO_VARIANTS_18_18: PrototypeVariant[] = [
  { key: 'k', label: 'Eventväljaren', steg: 1, stegLabel: 'Steg 1 — kontextrad-väljaren (utkast)' },
];

export const PROTO_VARIANTS_18_19: PrototypeVariant[] = [
  { key: 'a', label: 'Variant A', steg: 1, stegLabel: 'A — väljaren ÄR rubriken (Stripe-formen)' },
  { key: 'b', label: 'Variant B', steg: 1, stegLabel: 'B — kompakt kontroll ovanför H1' },
];

/** Kollapsat datumspann: "10–12 augusti 2026" / "31 aug – 2 sep 2026". */
function datumSpann(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const start = new Date(e.startdatum);
  if (Number.isNaN(start.getTime())) return 'Datum ej satt';
  const slut = e.slutdatum ? new Date(e.slutdatum) : null;
  const langt = new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  if (!slut || Number.isNaN(slut.getTime()) || e.startdatum === e.slutdatum) {
    return langt.format(start);
  }
  if (start.getMonth() === slut.getMonth() && start.getFullYear() === slut.getFullYear()) {
    const manad = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(
      start,
    );
    return `${start.getDate()}–${slut.getDate()} ${manad}`;
  }
  const kort = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
  return `${kort.format(start)} – ${kort.format(slut)} ${slut.getFullYear()}`;
}

/**
 * "Augusti 2026" — versal första bokstaven, gemener resten. EXAKT
 * EventsList.monthLabel:s form (repots etablerade månadsgrupp-rubrik för
 * event); replikerad här bara för att prototypen ska förbli kastbar.
 * SKARPA bygget ska LYFTA monthLabel/groupByMonth till delad plats i
 * stället — två grammatiker för samma sak är drift, inte design.
 */
function manadsEtikett(e: Event): string {
  if (!e.startdatum) return 'Datum ej satt';
  const d = new Date(e.startdatum);
  if (Number.isNaN(d.getTime())) return 'Datum ej satt';
  const etikett = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(d);
  return etikett.charAt(0).toUpperCase() + etikett.slice(1);
}

/** Kontextradens innehåll (18.18 B-formen): prick + namn + ort + spann. */
function Kontextrad({ event: e, baraNamn }: { event: Event; baraNamn?: boolean }) {
  return (
    <>
      <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-cat-event" />
      <span className="truncate font-medium">{eventName(e)}</span>
      {baraNamn ? null : (
        <>
          {e.ort ? <span className="shrink-0 text-text-secondary">· {e.ort}</span> : null}
          <span className="shrink-0 text-text-secondary">· {datumSpann(e)}</span>
        </>
      )}
    </>
  );
}

/**
 * Eventväljaren — förvald med aktuellt event, öppningsbar lista över
 * KOMMANDE event (listans låsta ordning: närmast först), byte NAVIGERAR
 * routen (URL:en alltid sann/delbar). `form`: 'kontextrad' (18.18 valt
 * läge + 18.19 B — namn · ort · datum) · 'rubrik' (18.19 A — namnet i
 * H1-storlek som trigger) · 'tom' (18.18 tomma läget — sidans enda
 * handling när inget event är valt: stor fristående trigger).
 * `variantEfterVal`: prototyp-brygga så tomma läget kan demonstrera
 * övergången till valt läge (rivs med passet).
 */
export function EventValjarePrototyp({
  eventId,
  to,
  form,
  variantEfterVal,
  vit,
}: {
  eventId: string;
  to: '/event/$eventId/ny-anmalan' | '/event/$eventId';
  form: 'kontextrad' | 'rubrik' | 'namn' | 'tom';
  variantEfterVal?: string;
  /** Vit pill i stället för grå — när väljaren sitter PÅ en grå kortyta och
      ska lyfta ur den i stället för att smälta in (Marcus 2026-07-24). */
  vit?: boolean;
}) {
  const dataSource = useDataSource();
  const navigate = useNavigate();
  const [oppen, setOppen] = useState(false);
  const [fraga, setFraga] = useState('');
  const rotRef = useRef<HTMLDivElement>(null);
  const sokRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  const idagStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const kommande = (data ?? [])
    .filter((e) => dateValue(e) >= idagStart || e.id === eventId)
    .sort((a, b) => dateValue(a) - dateValue(b));
  const aktuellt = (data ?? []).find((e) => e.id === eventId) ?? null;

  // Sökningen matchar namn ELLER ort — de två fälten Lotta känner ett event på.
  const q = fraga.trim().toLowerCase();
  const traffar = q
    ? kommande.filter((e) => `${eventName(e)} ${e.ort ?? ''}`.toLowerCase().includes(q))
    : kommande;

  // Månadsgruppering: listans låsta ordning (närmast först) är oförändrad —
  // rubrikerna läggs ovanpå den, de sorterar inte om något.
  const grupperade = traffar.reduce<[string, Event[]][]>((acc, e) => {
    const manad = manadsEtikett(e);
    const sist = acc.at(-1);
    if (sist && sist[0] === manad) sist[1].push(e);
    else acc.push([manad, [e]]);
    return acc;
  }, []);

  // Fokus till sökfältet när listan öppnas — programmatiskt, INTE autoFocus:
  // fokusflytten är ett svar på användarens egen handling (hon tryckte på
  // triggern), inte något som händer vid sidladdning. Lintern har rätt om
  // autoFocus; regeln undertrycks aldrig när golvet är a11y 11.
  useEffect(() => {
    if (oppen) sokRef.current?.focus();
  }, [oppen]);

  // Stäng vid Escape + klick utanför (prototyp-nivå; skarpa bygget tar
  // React Aria Select/ComboBox per kortets beslut d).
  useEffect(() => {
    if (!oppen) return;
    const tangent = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOppen(false);
    };
    const klick = (e: MouseEvent) => {
      if (rotRef.current && !rotRef.current.contains(e.target as Node)) setOppen(false);
    };
    document.addEventListener('keydown', tangent);
    document.addEventListener('mousedown', klick);
    return () => {
      document.removeEventListener('keydown', tangent);
      document.removeEventListener('mousedown', klick);
    };
  }, [oppen]);

  const valj = (id: string) => {
    setOppen(false);
    setFraga('');
    // Sökparametrarna behålls (bl.a. ?variant under passet) — skarpa bygget
    // ärver samma princip via nuqs/URL-kontraktet. `variantEfterVal` är
    // prototyp-bryggan: tomma läget växlar till valt läge vid val.
    if (id !== eventId)
      navigate({
        to,
        params: { eventId: id },
        search: (prev: unknown) =>
          (variantEfterVal ? { ...(prev as object), variant: variantEfterVal } : prev) as never,
      });
  };

  return (
    <div ref={rotRef} className="relative min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={oppen}
        onClick={() => setOppen((o) => !o)}
        className={
          form === 'rubrik'
            ? '-mx-2 flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left font-semibold text-3xl hover:bg-bg-emphasized motion-safe:transition-colors'
            : form === 'tom'
              ? // Tomma lägets trigger: sidans ENDA handling, därför full bredd
                // och rejäl höjd — inte en liten pill i ett tomt kort.
                'flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-4 text-left font-medium text-body hover:bg-bg-muted motion-safe:transition-colors'
              : `flex min-w-0 items-center gap-2 rounded-full px-3.5 py-2 text-left text-small motion-safe:transition-colors ${
                  vit
                    ? 'border border-border bg-surface hover:bg-bg-muted'
                    : 'bg-bg-muted hover:bg-bg-emphasized'
                }`
        }
      >
        {form === 'rubrik' ? (
          <span className="min-w-0 truncate">{aktuellt ? eventName(aktuellt) : 'Event'}</span>
        ) : form === 'tom' ? (
          <>
            <CalendarDays aria-hidden="true" size={20} className="shrink-0 text-text-secondary" />
            <span>Välj event</span>
          </>
        ) : aktuellt ? (
          <Kontextrad event={aktuellt} baraNamn={form === 'namn'} />
        ) : (
          <span className="text-text-secondary">Välj event</span>
        )}
        <ChevronsUpDown
          aria-hidden="true"
          size={form === 'rubrik' ? 20 : 16}
          className={
            form === 'tom' ? 'ml-auto shrink-0 text-text-secondary' : 'shrink-0 text-text-secondary'
          }
        />
        <span className="sr-only">Byt event</span>
      </button>

      {oppen ? (
        <div className="absolute top-full left-0 z-20 mt-2 flex max-h-96 w-max min-w-full max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-border bg-surface p-1 shadow-lg">
          {/* SÖK: USWDS sätter combobox-tröskeln vid >15 val; staging har 11
              och listan växer monotont (event ackumuleras). Fältet är därför
              med från start — det skadar inte vid 11 och slipper en omdesign
              vid 16. Skarpa bygget bär React Aria ComboBox (kortets beslut d),
              inte denna prototyp-input. */}
          <input
            type="text"
            value={fraga}
            onChange={(e) => setFraga(e.target.value)}
            placeholder="Sök event eller ort…"
            aria-label="Sök event"
            ref={sokRef}
            className="mb-1 rounded-lg border border-border bg-bg-muted px-3 py-2 text-small outline-none focus:border-border-strong"
          />
          <div role="listbox" aria-label="Byt event" className="flex flex-col overflow-auto">
            {grupperade.map(([manad, rader]) => (
              <div key={manad} className="flex flex-col">
                {/* MÅNADSRUBRIK: event-listans egen form (font-semibold ·
                    text-small · text-text-secondary) — samma vikt och kulör
                    som när Lotta ser månadsgrupperna på event-sidan. */}
                <span className="px-3 pt-3 pb-1 font-semibold text-small text-text-secondary">
                  {manad}
                </span>
                {rader.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    role="option"
                    aria-selected={e.id === eventId}
                    onClick={() => valj(e.id)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-small hover:bg-bg-emphasized motion-safe:transition-colors ${
                      e.id === eventId ? 'bg-bg-muted' : ''
                    }`}
                  >
                    <Kontextrad event={e} />
                    {e.id === eventId ? (
                      <Check
                        aria-hidden="true"
                        size={16}
                        className="ml-auto shrink-0 text-success"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
            ))}
            {traffar.length === 0 ? (
              <span className="px-3 py-2 text-small text-text-muted">
                {fraga ? `Inget event matchar "${fraga}"` : 'Inga kommande event'}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
