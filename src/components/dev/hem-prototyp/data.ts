import { displayName, inskickadTid } from '@/components/registrations/registration-display';
import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';
import { PaymentStatus, RegistrationStatus } from '@/domain/types/Status';

/**
 * [PROTOTYPE-DATA, TASK-226] Delad härledningslogik för hem-vyns divergens-
 * prototyp (V1 ro · V2 kontroll · V3 skönhet — /dev/hem-prototyp). SAMMA data
 * i alla tre varianter, bara ytan skiljer — annars mäter Marcus tre olika
 * datamodeller i stället för tre estetiska riktningar (S102 Del 8-kvittensen).
 *
 * Formlerna nedan är hämtade VERBATIM eller nästan verbatim ur skarp kod:
 * `velNastaEvent`/`dagarKvarText` ur `hem/NastaEventCard.tsx`,
 * `eventIdentitet`/`initialer` ur `hem/NyaAnmalningarCard.tsx` respektive
 * `persons/PersonsList.tsx` k13, `obekraftad`/`saknar*`/14-dagars-deadlinen
 * ur `events/atgarder/AtgardsSida.tsx`. Ingen ny EF, ingen mock — allt läses
 * ur `useDashboardEvents`/`useDashboardRegistrations` (hem/useDashboardData.ts)
 * som redan hämtar riktig staging-data.
 *
 * Throwaway-kontraktet (ADR-102/103): filen bor UNDER dev-routen och rivs med
 * förlorarna. Vinnarens konvergens skriver facitet om från grunden — den
 * absorberar ingen kod härifrån rakt av.
 */

const DEADLINE_DAGAR = 14;
const DAG_MS = 86_400_000;

/** Lokal dagsstart (midnatt) för ett godtyckligt ms-ögonblick. */
export function dagsStart(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startTid(e: Event): number {
  if (!e.startdatum) return Number.POSITIVE_INFINITY;
  const t = new Date(e.startdatum).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * "Nästa kommande" — TEMPORALT (startdatum ≥ idag), ALDRIG via
 * `status`-enumet (samma T14-disciplin som NastaEventCard.tsx-facitet).
 */
export function velNastaEvent(events: Event[] | undefined, idagStartMs: number): Event | null {
  if (!events) return null;
  const kommande = events
    .filter((e) => startTid(e) >= idagStartMs)
    .sort((a, b) => startTid(a) - startTid(b));
  return kommande[0] ?? null;
}

/** Dagar-kvar-pillens tre former: "Idag" / "1 dag kvar" / "N dagar kvar" (NastaEventCard.tsx-facit). */
export function dagarKvarText(startMs: number, idagStartMs: number): string {
  const dagar = Math.round((startMs - idagStartMs) / DAG_MS);
  if (dagar <= 0) return 'Idag';
  return dagar === 1 ? '1 dag kvar' : `${dagar} dagar kvar`;
}

/** Beläggningsandelen 0–100, clampad och division-säkrad (NastaEventCard.tsx-facit). */
export function belaggningAndel(belagda: number, maxPlatser: number | null): number {
  if (maxPlatser == null || maxPlatser <= 0) return 0;
  return Math.min(100, Math.round((belagda / maxPlatser) * 100));
}

export function eventsById(events: Event[] | undefined): Map<string, Event> {
  const m = new Map<string, Event>();
  for (const e of events ?? []) m.set(e.id, e);
  return m;
}

const KORTDATUM = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' });
function kortDatum(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : KORTDATUM.format(t).replace(/\.$/, '');
}

/** Radens event-identitet "kurs · ort · kortdatum" (NyaAnmalningarCard.tsx-facit, klient-join). */
export function eventIdentitet(reg: Registration, event: Event | undefined): string {
  if (!reg.eventId) return 'Utan event';
  if (!event) return reg.eventNamn ?? 'Uppgift saknas';
  const namn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
  return [namn, event.ort, kortDatum(event.startdatum)].filter(Boolean).join(' · ');
}

/**
 * Initialerna för avatar-cirkeln (PersonsList.tsx k13-facit, KOPIERAD med
 * avsikt — samma per-fil-duplicering husets rader redan bär; den delade ytan
 * är datalagret, inte presentationsformlerna).
 */
export function initialer(namn: string): string {
  return namn
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((d) => d[0]?.toUpperCase() ?? '')
    .join('');
}

export interface AnmalningRad {
  reg: Registration;
  namn: string;
  identitet: string;
}

export interface AnmalningarVy {
  /** Totalt antal obekräftade — räknar-rubrikens tal (kan vara > rows.length). */
  total: number;
  /** Initial-lista, senast inskickade först. */
  rows: AnmalningRad[];
}

/**
 * Obekräftade anmälningar — de som väntar på bekräftelsesvep. `obekraftad`
 * är hämtad ur AtgardsSida.tsx (`r.status === RegistrationStatus.OBEKRAFTAD`);
 * hem-kortets facit (`NyaAnmalningarCard`) är recency-baserat UTAN
 * status-filter — divergens-prototypens räknar-rubrik ("N nya anmälningar
 * att bekräfta") kräver just statusfiltret, per S102 Del 8-kvittensen.
 */
export function obekraftadeAnmalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  maxRows: number,
): AnmalningarVy {
  if (!regs) return { total: 0, rows: [] };
  const obekraftade = regs
    .filter((r) => r.status === RegistrationStatus.OBEKRAFTAD)
    .sort((a, b) => inskickadTid(b) - inskickadTid(a));
  return {
    total: obekraftade.length,
    rows: obekraftade.slice(0, maxRows).map((reg) => ({
      reg,
      namn: displayName(reg),
      identitet: eventIdentitet(reg, reg.eventId ? eventsMap.get(reg.eventId) : undefined),
    })),
  };
}

const saknarAnmalningsavgift = (r: Registration) =>
  r.anmalningsavgift === PaymentStatus.EJ_MOTTAGEN;
const saknarSlutbetalning = (r: Registration) => r.slutbetalning === PaymentStatus.EJ_MOTTAGEN;

export type Avgiftstyp = 'Anmälningsavgift' | 'Slutbetalning';

export interface ForfallenRad {
  reg: Registration;
  namn: string;
  eventNamn: string;
  avgiftstyp: Avgiftstyp;
  /** Skickat-markören: har EN påminnelse redan gått ut för just denna avgiftstyp. */
  skickat: boolean;
  deadlineMs: number;
}

export interface ForfallnaVy {
  /** Totalt antal förfallna rader (en registrering med två saknade avgifter ⇒ 2). */
  total: number;
  /** Initial-lista, mest förfallna (äldsta deadline) först. */
  rows: ForfallenRad[];
}

/**
 * Förfallna betalningar — "betalning saknas OCH eventstart−14 dagar
 * passerad" (S102 Del 8-kvittensen, task-226 AC #1). Deadline-formeln är
 * DELAD med `AtgardsSida.tsx` `deadlineDatum` / `Betalningar.tsx`
 * `deadlineStatus` — 14 dagar före start, ALDRIG en andra kopia av regeln.
 *
 * EN RAD PER AVGIFTSTYP (task-226 AC-språket "avgiftstyp per rad"): en
 * registrering som saknar BÅDA anmälningsavgift och slutbetalning ger två
 * rader, en per typ — samma modell som AtgardsSida.tsx:s fyra parallella
 * åtgärder (`ATGARDER`), inte en sammanslagen "obetald"-boolean.
 *
 * Härlett UR BEFINTLIGA Registration-fält (`anmalningsavgift`,
 * `slutbetalning`, `paminnelseAnmalningsavgiftSkickad`,
 * `paminnelseSlutbetalningSkickad`) — ingen ny EF, ingen ny datakälla
 * (task-226 hård ram).
 */
export function forfallnaBetalningar(
  regs: Registration[] | undefined,
  eventsMap: Map<string, Event>,
  nuMs: number,
  maxRows: number,
): ForfallnaVy {
  if (!regs) return { total: 0, rows: [] };
  const rader: ForfallenRad[] = [];
  for (const reg of regs) {
    if (!reg.eventId) continue;
    const event = eventsMap.get(reg.eventId);
    if (!event?.startdatum) continue;
    const start = Date.parse(event.startdatum);
    if (Number.isNaN(start)) continue;
    const deadlineMs = start - DEADLINE_DAGAR * DAG_MS;
    if (deadlineMs > nuMs) continue; // deadline inte passerad än
    const eventNamn = event.eventNamn ?? event.eventlabel ?? 'Namnlöst event';
    const namn = displayName(reg);
    if (saknarAnmalningsavgift(reg)) {
      rader.push({
        reg,
        namn,
        eventNamn,
        avgiftstyp: 'Anmälningsavgift',
        skickat: reg.paminnelseAnmalningsavgiftSkickad != null,
        deadlineMs,
      });
    }
    if (saknarSlutbetalning(reg)) {
      rader.push({
        reg,
        namn,
        eventNamn,
        avgiftstyp: 'Slutbetalning',
        skickat: reg.paminnelseSlutbetalningSkickad != null,
        deadlineMs,
      });
    }
  }
  rader.sort((a, b) => a.deadlineMs - b.deadlineMs);
  return { total: rader.length, rows: rader.slice(0, maxRows) };
}

/**
 * xAPI Language Map → sv-SE-strängen (samma form som `SenasteAktivitet.tsx`
 * `sprakText` — medvetet EJ delad dit, samma per-fil-duplicering som filens
 * övriga presentationsformler; den delade ytan är datalagret, inte formen).
 */
export function sprakText(map: Record<string, string>): string {
  return map['sv-SE'] ?? Object.values(map)[0] ?? '';
}

/**
 * Förnamnet ur ett fullt visningsnamn (`Greeting.tsx`-facitets `fornamn`,
 * KOPIERAD med avsikt). AVVIKELSE FRÅN GREETING.TSX, öppet bokförd: de tre
 * varianterna delar INTE sessionStorage-flaggan `mm-hem-greeted` — "Hej
 * {förnamn}" visas ALLTID, aldrig det avskalade "{förnamn}". Skälet är
 * dubbelt: (1) sessionStorage-nyckeln är delad med den skarpa /hem-sidan —
 * ett besök där innan granskningen hade tystat hälsningen på ETT håll av tre
 * varianter men inte de andra två, en ren artefakt av besöksordning, inte en
 * designskillnad Marcus ska behöva tolka; (2) varje variant äger sin egen
 * rubrik-typografi (task-226: "radikalt olika, inte tre nyanser") —
 * `Greeting`s `<h1>`-klass är hårdkodad utan prop, så komponenten själv
 * återanvänds inte, bara denna extraktionslogik.
 */
export function fornamn(helaNamnet: string): string {
  return helaNamnet.trim().split(/\s+/)[0];
}
