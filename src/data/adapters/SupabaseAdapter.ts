import type {
  Attachment,
  AttachmentDownloadUrl,
  DocumentPreview,
  UploadAttachmentInput,
} from '../../domain/models/Attachment';
import type {
  Attendance,
  CreateAttendanceInput,
  CreatedAttendance,
} from '../../domain/models/Attendance';
import type { DocumentSources } from '../../domain/models/DocumentSources';
import type { Engagement } from '../../domain/models/Engagement';
import type { Event } from '../../domain/models/Event';
import type { CreateEventNoteInput, EventNote } from '../../domain/models/EventNote';
import type { MailLogEntry, MailPayload, MailSendResult } from '../../domain/models/MailPayload';
import type { Person } from '../../domain/models/Person';
import type { CreatePersonNoteInput, PersonNote } from '../../domain/models/PersonNote';
import type { CreateRegistrationInput, Registration } from '../../domain/models/Registration';
import type { WaitlistEntry } from '../../domain/models/WaitlistEntry';
import {
  type ActivityStatement,
  type ConfirmRegistrationsInput,
  type ConfirmRegistrationsResult,
  type CreatedEvent,
  type CreateEventInput,
  type EventFormat,
  type Intresserad,
  type PersonDetail,
  type RecordActivityResult,
  RecordActivityResultSchema,
  type RegistrationDetail,
  type SavedSegment,
  type SaveEventContentInput,
  type SaveEventTextInput,
  type SavePlaceStandardInput,
  type SaveSegmentInput,
  type SegmentResult,
  type SegmentRuleDnf,
  type SendActionEmailInput,
  type SendActionEmailResult,
  type SendActionTestEmailInput,
  type SendActionTestEmailResult,
  type SendReceiptInput,
  type SendReceiptResult,
  type UpdateEventInput,
} from '../../domain/schemas';
import type {
  AttendanceFilters,
  RegistrationFilters,
  WaitlistFilters,
} from '../../domain/types/Filters';
import type { ActivityLogPage, ActivityLogParams } from '../../domain/types/Pagination';
import { postEdgeFunction } from '../config/supabase-client';
import type { DataSourceAdapter, UtkastTyp } from './DataSourceAdapter';

const NOT_IMPLEMENTED = 'SupabaseAdapter: Not implemented - migrate Edge Functions first';

export class SupabaseAdapter implements DataSourceAdapter {
  async fetchEvents(): Promise<Event[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchRegistrations(_filters?: RegistrationFilters): Promise<Registration[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  // [RIVEN, TASK-286.3] `listPersons` stod här som stub för cursor-porten
  // (ADR-056). Riven tillsammans med interface-deklarationen och
  // Airtable-implementationen när sista konsumenten försvann (TASK-286.2).
  // Dubbel-källa-kontraktet är därmed FORTSATT symmetriskt: båda adaptrarna
  // bär exakt de metoder `DataSourceAdapter` deklarerar, varken fler
  // eller färre (ADR-056 swappbarhet).
  async fetchPersonsRegister(): Promise<Person[]> {
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

  async fetchRegistration(_id: string): Promise<RegistrationDetail> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchAttendance(_filters?: AttendanceFilters): Promise<Attendance[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateAttendance(_operationKey: string, _id: string, _status: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createAttendance(_input: CreateAttendanceInput): Promise<CreatedAttendance> {
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

  async sendEmail(_payload: MailPayload): Promise<MailSendResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchMailLog(): Promise<MailLogEntry[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async computeSegment(_rule: SegmentRuleDnf): Promise<SegmentResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async saveSegment(_input: SaveSegmentInput): Promise<SavedSegment> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async listSegments(): Promise<SavedSegment[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getEventFormats(): Promise<EventFormat[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getDocumentSources(_eventId: string): Promise<DocumentSources> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async saveEventText(_input: SaveEventTextInput): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async savePlaceStandard(_input: SavePlaceStandardInput): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async saveEventContent(_input: SaveEventContentInput): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createEvent(_input: CreateEventInput): Promise<CreatedEvent> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async updateEvent(_input: UpdateEventInput): Promise<Event> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async confirmRegistrations(
    _input: ConfirmRegistrationsInput,
  ): Promise<ConfirmRegistrationsResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendActionEmail(_input: SendActionEmailInput): Promise<SendActionEmailResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendActionTestEmail(_input: SendActionTestEmailInput): Promise<SendActionTestEmailResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async sendReceipt(_input: SendReceiptInput): Promise<SendReceiptResult> {
    throw new Error(NOT_IMPLEMENTED);
  }

  /**
   * Aktivitetsloggens skrivväg (TASK-201.3, ADR-110/ADR-111) — FUNKTIONELL
   * här, till skillnad från alla andra metoder i denna Fas E-stub-klass.
   * `activity_log` har ALDRIG legat i Airtable (se `DataSourceAdapter.
   * recordActivity`s docblock för hela resonemanget) — `log-activity`-EF:en
   * skriver redan mot Supabase oavsett vilken adapter som är "live", så
   * denna metod behöver ingen migration för att fungera i Fas E.
   */
  async recordActivity(statement: ActivityStatement): Promise<RecordActivityResult> {
    const data = await postEdgeFunction<unknown>('log-activity', { ...statement });
    return RecordActivityResultSchema.parse(data);
  }

  async fetchEventNotes(_eventId: string): Promise<EventNote[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createEventNote(_input: CreateEventNoteInput): Promise<EventNote> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchPersonNotes(_personId: string): Promise<PersonNote[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async createPersonNote(_input: CreatePersonNoteInput): Promise<PersonNote> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async uploadAttachment(_input: UploadAttachmentInput): Promise<Attachment> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchEventAttachments(_eventId: string): Promise<Attachment[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchGemensammaBilagor(): Promise<Attachment[]> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async deleteAttachment(_eventId: string | null, _attachmentId: string): Promise<void> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async getAttachmentDownloadUrl(
    _eventId: string | null,
    _attachmentId: string,
  ): Promise<AttachmentDownloadUrl> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async previewEventTemplate(_eventId: string): Promise<DocumentPreview> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async previewReceipt(_eventId: string): Promise<DocumentPreview> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async renderPdfFranHtml(_html: string, _namn: string): Promise<Blob> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async renderPdfTillUtkast(
    _html: string,
    _namn: string,
    _params: { eventId: string; typ: UtkastTyp },
  ): Promise<{ url: string; utgar: string }> {
    throw new Error(NOT_IMPLEMENTED);
  }

  async fetchActivityLog(_params?: ActivityLogParams): Promise<ActivityLogPage> {
    throw new Error(NOT_IMPLEMENTED);
  }
}
