import type { Event } from '@/domain/models/Event';

/**
 * Månadsgrupperingen — DELAD modul (task-18.18, facit punkt 9): lyft ur
 * EventsList.tsx när eventväljaren blev andra konsumenten (två grammatiker
 * för samma sak är drift). Rubrikformen ("Augusti 2026" — sv-SE, versal
 * först, ALDRIG ALL CAPS) är EventsLists låsta form (S72-facit story 17;
 * S83 pass 4-fångst #1). Konsumenter: EventsList (listvyn) + EventValjare
 * (manuell anmälan-sidans väljarlista).
 */

/** "Juli 2026" — månadsgrupprubriken bär månaden (sv-SE, versal först). */
export function monthLabel(e: Pick<Event, 'startdatum'>): string {
  if (!e.startdatum) return 'Datum ej satt';
  const d = new Date(e.startdatum);
  if (Number.isNaN(d.getTime())) return 'Datum ej satt';
  const label = new Intl.DateTimeFormat('sv-SE', { month: 'long', year: 'numeric' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Gruppera den redan sorterade listan per månad (tomma månader finns inte).
    Rubrikerna läggs ovanpå ordningen — de sorterar ALDRIG om. */
export function groupByMonth<T extends Pick<Event, 'startdatum'>>(
  events: T[],
): { label: string; events: T[] }[] {
  const groups: { label: string; events: T[] }[] = [];
  for (const e of events) {
    const label = monthLabel(e);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.events.push(e);
    } else {
      groups.push({ label, events: [e] });
    }
  }
  return groups;
}
