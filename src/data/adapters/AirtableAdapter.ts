import { z } from 'zod';
import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { Lead } from '../../domain/models/Lead';
import type { MailLogEntry, MailPayload } from '../../domain/models/MailPayload';
import type { Person } from '../../domain/models/Person';
import type { Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import { EventSchema, PersonSchema, RegistrationSchema } from '../../domain/schemas';
import type {
  AttendanceFilters,
  LeadFilters,
  MailLogFilters,
  PersonFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import { callEdgeFunction, postEdgeFunction } from '../config/supabase-client';
import type { DataSourceAdapter } from './DataSourceAdapter';

// Airtable tabell-ID:n (från docs/schema_reference.md). Behålls som
// referens i kommentarer för framtida operations-definitioner i
// supabase/functions/_shared/field-allowlists.ts. Selva mappningen
// operation → tabell sker i Edge Function via getOperation(), inte
// längre i klient-koden (M4 K9-respekt: domännamn i klient, table-IDs
// i Edge Function-implementationen).

export class AirtableAdapter implements DataSourceAdapter {
  // === Befintliga metoder (oförändrade) ===

  async fetchEvents(): Promise<Event[]> {
    const data = await callEdgeFunction<{ events: unknown }>('get-events');
    return z.array(EventSchema).parse(data.events);
  }

  async fetchRegistrations(filters?: RegistrationFilters): Promise<Registration[]> {
    const params: Record<string, string> = {};
    if (filters?.eventId) params.eventId = filters.eventId;
    if (filters?.status) params.status = filters.status;
    if (filters?.flagga) params.flagga = filters.flagga;

    const data = await callEdgeFunction<{ registrations: unknown }>(
      'get-registrations',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return z.array(RegistrationSchema).parse(data.registrations);
  }

  async fetchPersons(filters?: PersonFilters): Promise<Person[]> {
    const params: Record<string, string> = {};
    if (filters?.search) params.search = filters.search;
    if (filters?.limit) params.limit = String(filters.limit);

    const data = await callEdgeFunction<{ persons: unknown }>(
      'get-persons',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return z.array(PersonSchema).parse(data.persons);
  }

  async updateRecord(
    operationKey: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await postEdgeFunction('update-record', { operationKey, recordId, fields });
  }

  // === Nya metoder ===

  /**
   * Hämta enskilt event via ID.
   *
   * @todo Apply Zod .parse() runtime validation when get-event Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchEvent(id: string): Promise<Event> {
    // TODO: Edge Function 'get-event' behöver deployas
    const data = await callEdgeFunction<{ event: Event }>('get-event', { id });
    return data.event;
  }

  /**
   * Hämta enskild person via ID.
   *
   * @todo Apply Zod .parse() runtime validation when get-person Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchPerson(id: string): Promise<Person> {
    // TODO: Edge Function 'get-person' behöver deployas
    const data = await callEdgeFunction<{ person: Person }>('get-person', {
      id,
    });
    return data.person;
  }

  /** Uppdatera anmälan — kräver explicit operationKey (M4). */
  async updateRegistration(
    operationKey: string,
    id: string,
    fields: Partial<Registration>,
  ): Promise<void> {
    await this.updateRecord(operationKey, id, fields as Record<string, unknown>);
  }

  /**
   * Skapa ny anmälan.
   *
   * @todo Apply Zod .parse() runtime validation when create-registration Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async createRegistration(data: Omit<Registration, 'id'>): Promise<Registration> {
    // TODO: Edge Function 'create-registration' behöver deployas
    const result = await postEdgeFunction<{ registration: Registration }>(
      'create-registration',
      data as Record<string, unknown>,
    );
    return result.registration;
  }

  /**
   * Hämta deltaganden (närvaro).
   *
   * @todo Apply Zod .parse() runtime validation when get-attendance Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchAttendance(filters?: AttendanceFilters): Promise<Attendance[]> {
    // TODO: Edge Function 'get-attendance' behöver deployas
    const params: Record<string, string> = {};
    if (filters?.eventId) params.eventId = filters.eventId;
    if (filters?.session) params.session = filters.session;
    if (filters?.status) params.status = filters.status;

    const data = await callEdgeFunction<{ attendance: Attendance[] }>(
      'get-attendance',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return data.attendance;
  }

  /** Uppdatera deltagandes status — kräver explicit operationKey (M4). */
  async updateAttendance(operationKey: string, id: string, status: string): Promise<void> {
    await this.updateRecord(operationKey, id, { Status: status });
  }

  /**
   * Hämta väntelistan.
   *
   * @todo Apply Zod .parse() runtime validation when get-waitlist Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchWaitlist(filters?: WaitlistFilters): Promise<WaitlistEntry[]> {
    // TODO: Edge Function 'get-waitlist' behöver deployas
    const params: Record<string, string> = {};
    if (filters?.event) params.event = filters.event;

    const data = await callEdgeFunction<{ waitlist: WaitlistEntry[] }>(
      'get-waitlist',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return data.waitlist;
  }

  /**
   * Hämta leads (hämtade erbjudanden).
   *
   * @todo Apply Zod .parse() runtime validation when get-leads Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchLeads(filters?: LeadFilters): Promise<Lead[]> {
    // TODO: Edge Function 'get-leads' behöver deployas
    const params: Record<string, string> = {};
    if (filters?.erbjudande) params.erbjudande = filters.erbjudande;
    if (filters?.harAnmalan !== undefined) params.harAnmalan = String(filters.harAnmalan);

    const data = await callEdgeFunction<{ leads: Lead[] }>(
      'get-leads',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return data.leads;
  }

  /**
   * Hämta engagemang.
   *
   * @todo Apply Zod .parse() runtime validation when get-engagements Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchEngagements(personId?: string): Promise<Engagement[]> {
    // TODO: Edge Function 'get-engagements' behöver deployas
    const params: Record<string, string> = {};
    if (personId) params.personId = personId;

    const data = await callEdgeFunction<{ engagements: Engagement[] }>(
      'get-engagements',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return data.engagements;
  }

  /** Skicka mailutskick */
  async sendEmail(payload: MailPayload): Promise<void> {
    // TODO: Edge Function 'send-email' behöver deployas
    await postEdgeFunction('send-email', payload as unknown as Record<string, unknown>);
  }

  /**
   * Hämta mailloggen.
   *
   * @todo Apply Zod .parse() runtime validation when get-mail-log Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchMailLog(filters?: MailLogFilters): Promise<MailLogEntry[]> {
    // TODO: Edge Function 'get-mail-log' behöver deployas
    const params: Record<string, string> = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.efter) params.efter = filters.efter;

    const data = await callEdgeFunction<{ mailLog: MailLogEntry[] }>(
      'get-mail-log',
      Object.keys(params).length > 0 ? params : undefined,
    );
    return data.mailLog;
  }
}
