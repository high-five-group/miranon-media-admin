import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronsUpDown } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import {
  Button as AriaButton,
  Input as AriaInput,
  Select as AriaSelect,
  Autocomplete,
  Header,
  ListBox,
  ListBoxSection,
  Popover,
  SearchField,
  SelectValue,
  useFilter,
} from 'react-aria-components';
import { SelectItem } from '@/components/primitives/Select';
import { Skeleton } from '@/components/primitives/Skeleton';
import { useDataSource } from '@/data/useDataSource';
import type { Event } from '@/domain/models/Event';
import { kursfargForKurs } from '@/lib/kursfarg';
import { queryKeys } from '@/queries/keys';
import { datumSpannText } from './detail/datumSpann';
import { dateValue, eventName } from './EventCard';
import { groupByMonth } from './manadsgrupp';

/**
 * Eventväljaren på manuell anmälan-sidan (task-18.18; S83 pass 4-facit,
 * Marcus-låst 2026-07-24). Branschledar-precedent: Linear (New issue-
 * teamväljaren) · Stripe (kundväljaren på create-payment) · Notion.
 *
 * KOMPONENTVALET (beslut d, omlandat Select → ComboBox eftersom sök ingår):
 * byggd på React Arias EGEN dokumenterade sökväljar-form — `Select` (rik
 * trigger) + `Autocomplete` + `SearchField` + `ListBox` i Popover
 * (react-aria.adobe.com/Select § "Autocomplete with SearchField"), samma
 * combobox-maskineri i popover-form: sökfältet styr listboxen med virtuell
 * fokus (aria-activedescendant), piltangenter navigerar, Enter väljer,
 * Escape stänger. Den inline-formen av ComboBox (alltid synligt textfält)
 * kan inte rendera facitets stängda läge — en rik kontextrad utan fält —
 * så popover-formen är React Aria-vägen till det låsta facitet; öppet
 * bokfört på kortet. Prototypens råa input/lista är EJ förlagan (punkt 12).
 *
 * STÄNGDA LÄGET bär B-formens kontextrad (kursfärgs-prick + namn
 * font-medium + ort + kollapsat datumspann) — väljaren bär IDENTITETEN
 * (punkt 3): vit (`bg-surface`) på grå kortyta, hover `bg-bg-muted`.
 * TOMT LÄGE (ingen `valtEventId`): fristående full bredd-form som sidans
 * enda handling (punkt 7): `rounded-2xl border bg-surface px-4 py-4`,
 * kalender-ikon + "Välj event".
 *
 * LISTAN (punkt 8–10): sök från start (USWDS-tröskeln >15 val — staging har
 * 11 och listan växer monotont), matchar namn ELLER ort (textValue bär
 * båda), fokus flyttas PROGRAMMATISKT till fältet när listan öppnas
 * (aldrig autoFocus-attributet — a11y/noAutofocus undertrycks inte);
 * kommande event närmast först; månadsgrupperade i EventsLists EGEN
 * rubrikform via delade `groupByMonth` (punkt 9 — lyftet är skivans krav).
 *
 * Datakällan är listcachen (`events.list` — samma nyckel som event-listan):
 * varm vid navigering från listan; kall djuplänk startar hämtningen vid
 * mount (sidans primära interaktion är väljaren — ADR-078: ingen väntan på
 * data vi redan har, golvet deklareras).
 */
export function EventValjare({
  valtEventId,
  valtEvent,
  onByte,
  isDisabled,
}: {
  /** Valt event-ID (djuplänken/URL:en). Utelämnad = tomt läge (punkt 7). */
  valtEventId?: string;
  /** Eventdata för stängda lägets kontextrad (placeholder eller detalj). */
  valtEvent?: Event;
  /** Byte/val: navigerar URL:en (beslut a/13) — väljaren äger inget state. */
  onByte: (eventId: string) => void;
  isDisabled?: boolean;
}) {
  const dataSource = useDataSource();
  const { contains } = useFilter({ sensitivity: 'base' });

  const { data, isPending } = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: () => dataSource.fetchEvents(),
  });

  // Dagsstarten: EN referenspunkt (NastaEventCard-disciplinen).
  const idagStart = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.getTime();
  }, []);

  // Kommande event, närmast först (punkt 10; ORDLISTA "Period": härlett ur
  // startdatum, aldrig Status); odaterade (Infinity) räknas kommande, sist.
  // Månadsrubrikerna läggs OVANPÅ ordningen (delade groupByMonth).
  const grupper = useMemo(() => {
    const kommande = (data ?? [])
      .filter((e) => dateValue(e) >= idagStart)
      .sort((a, b) => dateValue(a) - dateValue(b));
    return groupByMonth(kommande);
  }, [data, idagStart]);

  const tomtLage = valtEventId == null;

  return (
    <AriaSelect
      aria-label="Välj event"
      selectedKey={valtEventId ?? null}
      onSelectionChange={(key) => {
        if (key == null) return;
        const id = String(key);
        if (id !== valtEventId) onByte(id);
      }}
      isDisabled={isDisabled}
      className="flex min-w-0 flex-col"
    >
      <AriaButton
        data-testid="event-valjare-trigger"
        className={
          tomtLage
            ? // Fristående formen (punkt 7): sidans enda handling, full bredd.
              'flex w-full items-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-4 text-body hover:bg-bg-muted motion-safe:transition-colors'
            : // Pillen på grå kortyta (punkt 3): vit, lyfter ur ytan.
              'flex w-auto max-w-full items-center gap-2 self-start rounded-full border border-border bg-surface px-3.5 py-2 text-small hover:bg-bg-muted motion-safe:transition-colors'
        }
      >
        {tomtLage ? (
          <CalendarDays aria-hidden="true" size={18} className="shrink-0 text-text-secondary" />
        ) : null}
        <SelectValue className="flex min-w-0 items-center gap-2">
          {() =>
            tomtLage ? (
              'Välj event'
            ) : valtEvent ? (
              <KontextRad event={valtEvent} />
            ) : (
              // Kall djuplänk utan cache: skeleton i trigger-radens
              // slutgeometri (en textrad i pillen) tills data landat —
              // accessibla namnet bärs av Select-etiketten (Roselli-formen:
              // blocket är dekor).
              <Skeleton variant="text" className="w-48 text-small" />
            )
          }
        </SelectValue>
        <ChevronsUpDown
          aria-hidden="true"
          size={16}
          className={`shrink-0 text-text-secondary ${tomtLage ? 'ml-auto' : ''}`}
        />
      </AriaButton>
      <Popover
        data-testid="event-valjare-popover"
        className="flex min-w-(--trigger-width) flex-col gap-1 rounded-xl border border-(--mm-select-popover-border) bg-(--mm-select-popover-bg) p-2 shadow-lg"
      >
        {/* Autocomplete = React Arias combobox-maskineri i popover-form:
            sökfältet styr listboxen (virtuell fokus), filtret matchar
            namn ELLER ort via textValue (punkt 8). */}
        <Autocomplete filter={contains}>
          <SokFalt />
          <ListBox
            className="max-h-80 overflow-auto outline-none"
            renderEmptyState={() => (
              <p className="px-3 py-2 text-small text-text-muted">
                {isPending ? 'Laddar event…' : 'Inga event matchar sökningen'}
              </p>
            )}
          >
            {grupper.map((grupp) => (
              <ListBoxSection id={grupp.label} key={grupp.label}>
                {/* Månadsrubriks-formen — EventsLists EGEN (punkt 9):
                    font-semibold text-small text-text-secondary, ALDRIG
                    ALL CAPS (S83 pass 4-fångst #1). */}
                <Header className="px-3 pt-3 pb-1 font-semibold text-small text-text-secondary">
                  {grupp.label}
                </Header>
                {grupp.events.map((e) => (
                  // Primitivens SelectItem (review-pilotens F6 — en
                  // item-grammatik, ingen lokal kopia med drift).
                  <SelectItem
                    id={e.id}
                    key={e.id}
                    // textValue bär namn + ort → sök matchar båda (punkt 8);
                    // spannet ingår i radens accessibla namn via innehållet.
                    textValue={`${eventName(e)} ${e.ort ?? ''}`}
                  >
                    <KontextRad event={e} />
                  </SelectItem>
                ))}
              </ListBoxSection>
            ))}
          </ListBox>
        </Autocomplete>
      </Popover>
    </AriaSelect>
  );
}

/**
 * B-formens kontextrad (facit punkt 3): kursfärgs-prick (18.17:s
 * Avser-rad-grammatik, aria-hidden — texten bär, WCAG 1.4.1) + namn
 * font-medium + ort + kollapsat datumspann. Delad mellan stängda läget
 * och listraderna — väljaren bär identiteten med EN grammatik.
 */
function KontextRad({ event }: { event: Event }) {
  const farg = kursfargForKurs(event.eventNamn);
  return (
    <>
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${farg.bgClass}`} />
      <span className="min-w-0 truncate">
        <span className="font-medium">{eventName(event)}</span>
        <span className="text-text-secondary">
          {' '}
          · {event.ort ?? 'Ort ej satt'} · {datumSpannText(event)}
        </span>
      </span>
    </>
  );
}

/**
 * Sökfältet i listan (punkt 8): med från start (USWDS-tröskeln), fokus
 * PROGRAMMATISKT vid öppning — rAF så React Arias egen fokushantering
 * (FocusScope) hunnit köra först; aldrig autoFocus-attributet
 * (a11y/noAutofocus undertrycks inte när golvet är 11).
 */
function SokFalt() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => ref.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <SearchField aria-label="Sök event eller ort" className="flex flex-col">
      <AriaInput
        ref={ref}
        placeholder="Sök event eller ort…"
        className="text-(color:--mm-input-text) placeholder:text-(color:--mm-input-text-placeholder) min-h-10 w-full rounded border border-(--mm-input-border) bg-(--mm-input-bg) px-3 text-body"
      />
    </SearchField>
  );
}
