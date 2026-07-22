import type { EventStatusValue } from '../types/Status';

export interface Event {
  id: string;
  eventlabel: string | null;
  eventNamn: string | null;
  typ: string | null;
  ort: string | null;
  startdatum: string | null;
  slutdatum: string | null;
  tidKvarTillEvent: string | null;
  maxPlatser: number | null;
  antalAnmalda: number;
  platserKvar: number | null;
  anmaldBelaggning: number | null;
  bekraftadBelaggning: number | null;
  antalNyaAnmalningar: number;
  antalAnmalningsavgifter: number;
  antalSlutbetalningar: number;
  antalSlutbetalningFelande: number;
  status: EventStatusValue | null;
  /** System-genererad EventKey-formel ("Event-N") — optional: speglar schemat (task-18.1). */
  eventKey?: string;

  // Beläggningens innehållsmodell (task-18.2; K16 — mappar basen 1-till-1).
  // Optional-fälten speglar schemat (utelämnas-vid-saknas, aldrig null —
  // 18.1:s eventKey-form): endast get-event aggregerar; get-events/
  // update-event utelämnar räkningarna (useUpdateEvent merge-cachar).
  /** Reserverade = basens 'Extra platser' (osatt → nyckeln utelämnas). */
  reserverade?: number;
  /** Manuellt tillagda = basens 'Manuella platser' (osatt → utelämnas). */
  manuelltTillagda?: number;
  /** Anmälda deltagare-raden: länkade Anmälningar med Källa TOM (formulär). */
  viaFormular?: number;
  /** Länkade Anmälningar med Källa '+1' (medföljande). */
  medfoljande?: number;
  /** Aktiva event-kopplade Väntelisteplatser via 'Event (länk)' (utanför taket). */
  vantelista?: number;

  // Auto-utskicket för eventinfo (task-18.6; PRD task-18 beslut 14) — additiva
  // bas-fält som eventsidans auto-utskicks-kryss styr. Utskicks-MOTORN är utanför.
  /** Schemalagt datum för auto-utskicket ('Deltagarinfo schemalagd'); osatt → utelämnas. */
  deltagarinfoSchemalagd?: string;
  /** OPT-OUT: true = eventinfon skickas INTE automatiskt för detta event. */
  deltagarinfoAutoAvstangt?: boolean;
}
