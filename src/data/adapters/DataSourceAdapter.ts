import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import type {
  ConfirmRegistrationsInput,
  ConfirmRegistrationsResult,
  CreatedEvent,
  CreateEventInput,
  EventFormat,
  Intresserad,
  PersonDetail,
  SavedSegment,
  SaveSegmentInput,
  SegmentResult,
  SegmentRule,
  UpdateEventInput,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ListParams, PersonsPage } from '../../domain/types/Pagination';

export interface DataSourceAdapter {
  // === Befintliga (oförändrade) ===
  fetchEvents(): Promise<Event[]>;
  fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]>;

  /**
   * Cursor-paginerad personlista (ADR-056). Migrations-stabil port: Supabase-
   * adaptern (Fas E) implementerar identisk shape. `cursor`/`nextCursor` är opaka.
   */
  listPersons(params?: ListParams): Promise<PersonsPage>;

  /**
   * Operations-baserad write-API (M4).
   * operationKey matchas mot allowlist i Edge Function — okänd operation
   * eller fält utanför operationens allowedFields → 400. Allowlisten är
   * tom idag (Discovery 2026-05-04). Operations läggs till när Fas 5.5+
   * produktionsslicen anropar dem från UI.
   */
  updateRecord(
    operationKey: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void>;

  // === Nya ===

  /** Hämta ett enskilt event via ID */
  fetchEvent(id: string): Promise<Event>;

  /** Hämta en enskild person via ID */
  fetchPerson(id: string): Promise<PersonDetail>;

  /**
   * Uppdatera en anmälan. Pre-M4 thin wrapper — kräver att caller
   * specificerar vilken operation som körs (t.ex. 'registration.set-status').
   * Idag throws eftersom operations-listan är tom i M4.
   */
  updateRegistration(
    operationKey: string,
    id: string,
    fields: Partial<Registration>,
  ): Promise<void>;

  /**
   * Skapa ny manuell anmälan. Tar write-shapen `CreateRegistrationInput`
   * (ej läs-shapen `Omit<Registration, 'id'>`) — EF:en härleder resten
   * server-side. Returnerar den skapade anmälan i domän-shape (Fas 6c).
   */
  createRegistration(input: CreateRegistrationInput): Promise<Registration>;

  /** Hämta deltaganden (närvaro) för ett event */
  fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]>;

  /**
   * Uppdatera en deltagandes status. Pre-M4 thin wrapper — kräver att
   * caller specificerar operation (t.ex. 'attendance.set-status'). Idag
   * throws eftersom operations-listan är tom i M4.
   */
  updateAttendance(operationKey: string, id: string, status: string): Promise<void>;

  /** Hämta väntelistan */
  fetchWaitlist(filters?: WaitlistFilters): Promise<WaitlistEntry[]>;

  /** Hämta Intresserade (leads = personer som hämtat något men aldrig anmält sig) */
  fetchIntresserade(): Promise<Intresserad[]>;

  /** Hämta engagemang, valfritt filtrerat per person */
  fetchEngagements(personId?: string): Promise<Engagement[]>;

  /** Skicka mailutskick (bulk på segment) — returnerar serverns sänd-utfall (ADR-067 D3) */
  sendEmail(payload: MailPayload): Promise<MailSendResult>;

  /** Hämta mailloggen (GLOBAL lista — hela utskicksloggen, ingen filter-gren) */
  fetchMailLog(): Promise<MailLogEntry[]>;

  /** Beräkna segment-medlemskap från källan (Deltaganden, strikt Närvaropoäng=1) givet en regel */
  computeSegment(rule: SegmentRule): Promise<SegmentResult>;

  /** Spara en namngiven segment-regel som en rad i Segment-tabellen (Fas 6g L3, ADR-065) */
  saveSegment(input: SaveSegmentInput): Promise<SavedSegment>;

  /**
   * Lista app-sparade segment (Fas 6g L3). Legacy Make-rader utan App-segmentregel
   * exkluderas server-side (get-segments) — varje SavedSegment bär en typad regel.
   */
  listSegments(): Promise<SavedSegment[]>;

  /** Lista Eventformat-poster (record-ID + namn) för create-event:s Eventtyp-dropdown (Fas 6f) */
  getEventFormats(): Promise<EventFormat[]>;

  /**
   * Skapa ett nytt event (Fas 6f, ADR-066). Tar write-shapen `CreateEventInput`
   * (typade fält + idempotensnyckel); EF:en bygger Airtable-fälten server-side, härleder
   * Månad/år ur Startdatum, sätter Eventtyp-länken och kör en idempotent upsert. Svaret
   * (`CreatedEvent`) bär de system-genererade EventKey/Event-nr.
   */
  createEvent(input: CreateEventInput): Promise<CreatedEvent>;

  /**
   * Uppdatera ett befintligt event (task-18.1, PRD task-18 beslut 2–3). Tar
   * write-shapen `UpdateEventInput` (typade optionella fält + eventId); EF:en
   * bygger Airtable-fälten server-side, omhärleder Månad/år när Startdatum
   * ändras och PATCH:ar raden. Svaret är den BERIKADE läs-shapen (`Event`) —
   * samma form som fetchEvent, så cachen kan sättas direkt.
   */
  updateEvent(input: UpdateEventInput): Promise<Event>;

  /**
   * Bekräfta en eller flera anmälningar (task-18.6, PRD task-18 beslut 7): SERVERN
   * skickar bekräftelsemailet OCH flippar Status i samma operation (ORDLISTA:
   * Bekräftad ⟺ bekräftelsen skickad). Klienten skickar ENDAST record-ID:n —
   * mottagaren löses server-side. Samma operation bär enskild bekräftelse (ett ID)
   * och Bekräfta alla (N ID:n); svaret är aldrig binärt.
   */
  confirmRegistrations(input: ConfirmRegistrationsInput): Promise<ConfirmRegistrationsResult>;
}
