import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { Lead } from '../../domain/models/Lead';
import type { MailLogEntry, MailPayload } from '../../domain/models/MailPayload';
import type { Person } from '../../domain/models/Person';
import type { Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import type {
  AttendanceFilters,
  LeadFilters,
  MailLogFilters,
  PersonFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';

export interface DataSourceAdapter {
  // === Befintliga (oförändrade) ===
  fetchEvents(): Promise<Event[]>;
  fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]>;
  fetchPersons(filters?: PersonFilters): Promise<Person[]>;

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
  fetchPerson(id: string): Promise<Person>;

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

  /** Skapa ny anmälan */
  createRegistration(data: Omit<Registration, 'id'>): Promise<Registration>;

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

  /** Hämta leads (hämtade erbjudanden) */
  fetchLeads(filters?: LeadFilters): Promise<Lead[]>;

  /** Hämta engagemang, valfritt filtrerat per person */
  fetchEngagements(personId?: string): Promise<Engagement[]>;

  /** Skicka mailutskick */
  sendEmail(payload: MailPayload): Promise<void>;

  /** Hämta mailloggen */
  fetchMailLog(filters?: MailLogFilters): Promise<MailLogEntry[]>;
}
