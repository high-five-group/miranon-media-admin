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
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ListParams, PersonsPage } from '../../domain/types/Pagination';
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

  async listPersons(params?: ListParams): Promise<PersonsPage> {
    const query: Record<string, string> = {};
    if (params?.search) query.search = params.search;
    if (params?.cursor) query.cursor = params.cursor;
    if (params?.pageSize) query.pageSize = String(params.pageSize);

    const data = await callEdgeFunction<{ persons: unknown; nextCursor: string | null }>(
      'get-persons',
      Object.keys(query).length > 0 ? query : undefined,
    );
    return {
      persons: z.array(PersonSchema).parse(data.persons),
      nextCursor: data.nextCursor ?? null,
    };
  }

  async updateRecord(
    operationKey: string,
    recordId: string,
    fields: Record<string, unknown>,
  ): Promise<void> {
    await postEdgeFunction('update-record', { operationKey, recordId, fields });
  }

  // === Debt-klassade stub-metoder (Fas 2.5 klunga 4, A5-tabellen i
  // P1-sessionsdok Del 3). EF deployas per strangler-fig-sub-fas i Fas 6;
  // .parse()-aktivering sker vid deploy (ADR-026 beslut 5). ===

  /**
   * Hämta enskilt event via ID.
   *
   * @deferTo: Fas-6b (Events-domän) — A5 #1, 06b-impact: liten (events-lookup,
   * snarlik fetchEvents).
   * @todo Apply Zod .parse() runtime validation when get-event Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchEvent(_id: string): Promise<Event> {
    throw new Error('Not deployed yet — see Fas 6b');
  }

  /**
   * Hämta enskild person via ID.
   *
   * @deferTo: Fas-6a (Persons-domän, FÖRST i strangler-fig-sekvensen) — A5 #2,
   * 06b-impact: medel (target joinar persons + person_identifiers + lead_profiles).
   * @todo Apply Zod .parse() runtime validation when get-person Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchPerson(_id: string): Promise<Person> {
    throw new Error('Not deployed yet — see Fas 6a');
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
   * @deferTo: Fas-6c (Registrations-domän) — A5 #3, 06b-impact: STOR
   * (idempotency_key, registration_attendees, transaktionsdesign).
   * EF-implementationen MÅSTE inkludera idempotency-mekanismen per ADR-014
   * (create-registration-idempotency) — annars reproduceras F.4-dubblettbuggen.
   * @todo Apply Zod .parse() runtime validation when create-registration Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async createRegistration(_data: Omit<Registration, 'id'>): Promise<Registration> {
    throw new Error('Not deployed yet — see Fas 6c');
  }

  /**
   * Hämta deltaganden (närvaro).
   *
   * @deferTo: Fas-6b (Events-domän, Närvaro-flik) — A5 #4, 06b-impact: medel
   * (target använder FK-kedja event → event_session → attendances; ren läsning).
   * @todo Apply Zod .parse() runtime validation when get-attendance Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchAttendance(_filters?: AttendanceFilters): Promise<Attendance[]> {
    throw new Error('Not deployed yet — see Fas 6b');
  }

  /** Uppdatera deltagandes status — kräver explicit operationKey (M4). */
  async updateAttendance(operationKey: string, id: string, status: string): Promise<void> {
    await this.updateRecord(operationKey, id, { Status: status });
  }

  /**
   * Hämta väntelistan.
   *
   * @deferTo: Fas-6c (väntelista-konvertering tillsammans med Registrations) —
   * A5 #5, 06b-impact: liten (waitlist_entries-läsning, samma form post-Fas E).
   * @todo Apply Zod .parse() runtime validation when get-waitlist Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchWaitlist(_filters?: WaitlistFilters): Promise<WaitlistEntry[]> {
    throw new Error('Not deployed yet — see Fas 6c');
  }

  /**
   * Hämta leads (hämtade erbjudanden).
   *
   * @deferTo: Fas-6e (Mer-fliken, VILLKORLIG) — A5 #6, 06b-impact: medel.
   * Död-kod-kandidat: omvärderas vid Fas 6:s sub-fas-planering (Mer-flikens
   * scope-beslut). Behålls tills dess per A5.
   * @todo Apply Zod .parse() runtime validation when get-leads Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchLeads(_filters?: LeadFilters): Promise<Lead[]> {
    throw new Error('Not deployed yet — see Fas 6e');
  }

  /**
   * Hämta engagemang.
   *
   * @deferTo: post-Gate-4B (utanför Fas 6, post-Fas E-fönster) — A5 #7,
   * 06b-impact: STOR + osäker (Gate 4B fråga 4 öppen: interactions-tabell
   * vs separata). Svagaste deploy-kandidaten av alla 9 per A5.
   * @todo Apply Zod .parse() runtime validation when get-engagements Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchEngagements(_personId?: string): Promise<Engagement[]> {
    throw new Error('Not deployed yet — see Gate 4B-resolution (post-Fas E)');
  }

  /**
   * Skicka mailutskick.
   *
   * @deferTo: Fas-6e (Mer-fliken Mail eller per-anmälan actions) — A5 #8,
   * 06b-impact: ENORM (target är communication_outbox-arkitektur).
   * Direct-Resend-implementationen är medveten skuld per ADR-015
   * (send-email-direct-resend); migreras till outbox post-Fas E.
   */
  async sendEmail(_payload: MailPayload): Promise<void> {
    throw new Error('Not deployed yet — see Fas 6e');
  }

  /**
   * Hämta mailloggen.
   *
   * @deferTo: Fas-6e (Mer-fliken, VILLKORLIG) — A5 #9, 06b-impact: medel.
   * Död-kod-kandidat: omvärderas vid Fas 6:s sub-fas-planering (Mer-flikens
   * scope-beslut). Behålls tills dess per A5.
   * @todo Apply Zod .parse() runtime validation when get-mail-log Edge Function deploys.
   * See ADR-026 (Runtime-validering vid datagräns med Zod .parse()).
   */
  async fetchMailLog(_filters?: MailLogFilters): Promise<MailLogEntry[]> {
    throw new Error('Not deployed yet — see Fas 6e');
  }
}
