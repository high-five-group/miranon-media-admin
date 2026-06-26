import type { Attendance } from '../../domain/models/Attendance';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { MailLogEntry, MailPayload } from '../../domain/models/MailPayload';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import type {
  Intresserad,
  PersonDetail,
  SavedSegment,
  SaveSegmentInput,
  SegmentResult,
  SegmentRule,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  MailLogFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ListParams, PersonsPage } from '../../domain/types/Pagination';
import type { DataSourceAdapter } from './DataSourceAdapter';

const NOT_IMPLEMENTED = 'SupabaseAdapter: Not implemented — migrate Edge Functions first';

export class SupabaseAdapter implements DataSourceAdapter {
  async fetchEvents(): Promise<Event[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchRegistrations(_filters?: RegistrationFilters): Promise<Registration[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async listPersons(_params?: ListParams): Promise<PersonsPage> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateRecord(
    _operationKey: string,
    _recordId: string,
    _fields: Record<string, unknown>,
  ): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchEvent(_id: string): Promise<Event> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchPerson(_id: string): Promise<PersonDetail> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateRegistration(
    _operationKey: string,
    _id: string,
    _fields: Partial<Registration>,
  ): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createRegistration(_input: CreateRegistrationInput): Promise<Registration> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchAttendance(_filters?: AttendanceFilters): Promise<Attendance[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateAttendance(_operationKey: string, _id: string, _status: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchWaitlist(_filters?: WaitlistFilters): Promise<WaitlistEntry[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchIntresserade(): Promise<Intresserad[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchEngagements(_personId?: string): Promise<Engagement[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendEmail(_payload: MailPayload): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchMailLog(_filters?: MailLogFilters): Promise<MailLogEntry[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async computeSegment(_rule: SegmentRule): Promise<SegmentResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async saveSegment(_input: SaveSegmentInput): Promise<SavedSegment> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async listSegments(): Promise<SavedSegment[]> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
