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
  updateRecord(tableId: string, recordId: string, fields: Record<string, unknown>): Promise<void>;

  // === Nya ===

  /** Hämta ett enskilt event via ID */
  fetchEvent(id: string): Promise<Event>;

  /** Hämta en enskild person via ID */
  fetchPerson(id: string): Promise<Person>;

  /** Uppdatera en anmälan (domänspecifik — anropar updateRecord internt) */
  updateRegistration(id: string, fields: Partial<Registration>): Promise<void>;

  /** Skapa ny anmälan */
  createRegistration(data: Omit<Registration, 'id'>): Promise<Registration>;

  /** Hämta deltaganden (närvaro) för ett event */
  fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]>;

  /** Uppdatera en deltagandes status */
  updateAttendance(id: string, status: string): Promise<void>;

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
