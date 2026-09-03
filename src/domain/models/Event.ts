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

  // Basdimensionerna (TASK-249.4, ADR-115) — Eventplanerings additiva Kursfamilj/
  // Kursnivå-fält (data-model.md § "Staging- och prodbasens additiva tillskott
  // 2026-08-17"). Sätts vid skapelse (create-event, kursnamnsmappningen i
  // `_shared/course-dimensions.ts`) och läses här ur basens fält — ALDRIG gissat.
  // OPTIONAL är en BAKÅTKOMPATIBILITETS-lucka för svar/cache från FÖRE denna leverans
  // (eventKey-formen ovan) — get-events/get-event/update-event bär nyckeln ALLTID
  // sedan denna leverans (aldrig omitted av EF:erna själva); `null` betyder att raden
  // saknar en känd familj (okänt kursnamn) eller — för kursnivå — en nivålös familj
  // (Fjärrskådning/Psionautics, TOMT per design). "Okänd familj" försvinner alltså
  // aldrig tyst: nyckeln är alltid närvarande i EF-svaret, värdet är `null` i klartext.
  kursfamilj?: string | null;
  /** Kursnivå (Intro/Nivå 1-3) — se `kursfamilj` för formens fulla rationale. */
  kursniva?: string | null;

  // Beläggningens innehållsmodell (task-18.2; K16 — mappar basen 1-till-1).
  // Optional-fälten speglar schemat (utelämnas-vid-saknas, aldrig null —
  // 18.1:s eventKey-form): endast get-event aggregerar; get-events/
  // update-event utelämnar räkningarna (useUpdateEvent merge-cachar).
  /** Reserverade = basens 'Extra platser' (osatt → nyckeln utelämnas). */
  reserverade?: number;
  /** Manuellt tillagda = basens 'Manuella platser' (osatt → utelämnas). */
  manuelltTillagda?: number;
  /** AKTIVA länkade Anmälningar med Källa TOM (formulär). */
  viaFormular?: number;
  /** AKTIVA länkade Anmälningar med Källa '+1' (medföljande). */
  medfoljande?: number;
  /**
   * TASK-373: AKTIVA länkade Anmälningar med varje ANNAT Källa-värde
   * ('Manuell' · 'Väntelista' · framtida). Räknas in i "Anmälda deltagare"-raden
   * tillsammans med `viaFormular` (se `src/lib/belaggning.ts`).
   */
  ovrigaAnmalningar?: number;
  /** Aktiva event-kopplade Väntelisteplatser via 'Event (länk)' (utanför taket). */
  vantelista?: number;
  /** Bor över-summeringen (task-17.5): härlett antal ikryssade 'Bor över' bland
   *  eventets Anmälningar — listkortets säng-rad (EventCard). Optional speglar
   *  schemat: get-events/get-event aggregerar (alltid tal ≥0); update-event/
   *  create-event/äldre cache utelämnar (aldrig null). Härleds ur kryssen (ADR-063). */
  borOverAntal?: number;

  // Auto-utskicket för eventinfo (task-18.6; PRD task-18 beslut 14) — additiva
  // bas-fält som eventsidans auto-utskicks-kryss styr. Utskicks-MOTORN är utanför.
  /** Schemalagt datum för auto-utskicket ('Deltagarinfo schemalagd'); osatt → utelämnas. */
  deltagarinfoSchemalagd?: string;
  /** OPT-OUT: true = eventinfon skickas INTE automatiskt för detta event. */
  deltagarinfoAutoAvstangt?: boolean;
}
