import { z } from 'zod';
import { EventStatus } from '../types/Status';

/**
 * [GA] Runtime-validering av create-event-vertikalens KLIENT-gräns (Fas 6f, ADR-066).
 *
 * `EventFormatSchema` — get-event-formats-EF:ns rader för Eventtyp-dropdownen (record-ID +
 * visningsnamn). `namn` nullbar: Eventformat.Namn läses via `scalarString` (tomt → null).
 *
 * `CreatedEventSchema` — create-event-EF:ns `event`-domän-shape (mapCreatedEvent). Bär de
 * SYSTEM-genererade `eventKey`/`eventNr` (formel-på-autoNumber) som ADR-066 b4 vill visa
 * efter create, plus det server-HÄRLEDDA `manadAr` (b6). Nullbarheten matchar EF-utdatan:
 * formel-/select-fält → null via scalar/selectName; `eventNr` = autoNumber (number|null).
 * status härleds ur EventStatus-konstanten (single source, samma som EventSchema).
 */
export const EventFormatSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
});

export type EventFormat = z.infer<typeof EventFormatSchema>;

export const CreatedEventSchema = z.object({
  id: z.string(),
  eventlabel: z.string().nullable(),
  eventNamn: z.string().nullable(),
  typ: z.string().nullable(),
  ort: z.string().nullable(),
  startdatum: z.string().nullable(),
  slutdatum: z.string().nullable(),
  manadAr: z.string().nullable(),
  maxPlatser: z.number().nullable(),
  status: z.enum(EventStatus).nullable(),
  eventKey: z.string().nullable(),
  eventNr: z.number().nullable(),
});

export type CreatedEvent = z.infer<typeof CreatedEventSchema>;

/**
 * Write-input till create-event (Fas 6f). De typade fälten klienten samlar; EF:en bygger
 * `fields` server-side ur dem. `idempotencyKey` (UUID v4) bevaras över retries av SAMMA
 * submit (ADR-066 b3) — klienten genererar den när formuläret öppnas, ej per knapptryck.
 * `status` utelämnas → EF:en defaultar 'Planerat'.
 *
 * `publicera` (task-19.4) är PUBLICERINGSFLAGGAN — dra-till-bekräfta-handtagets läge.
 * VALFRI och additiv: frånvaro betyder oarmerad flagga (adaptern skickar nyckeln endast
 * när den är armerad, EF:en skriver Airtable-fältet endast då). Vad flaggan STYR på
 * miranon.se är T79:s kontrakt.
 */
export type CreateEventInput = {
  event: string;
  typ: string;
  ort: string;
  startdatum: string;
  slutdatum: string;
  maxPlatser: number;
  eventtyp: string;
  idempotencyKey: string;
  publicera?: boolean;
};
