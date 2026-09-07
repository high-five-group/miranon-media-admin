/**
 * [GA] Barrel-export för alla Zod-scheman.
 *
 * Scheman används för att validera Airtable/Edge-Function-svar
 * vid systemgränsen. Interface-typerna ligger i `../models/`.
 */
export {
  type ActivityActor,
  type ActivityContext,
  type ActivityObject,
  type ActivityObjectDefinition,
  type ActivityStatement,
  ActivityStatementSchema,
  type ActivityVerb,
  EVENT_ID_EXTENSION_IRI,
  PERSON_ID_EXTENSION_IRI,
  REQUEST_ID_EXTENSION_IRI,
  type RecordActivityResult,
  RecordActivityResultSchema,
  XAPI_IRI_BASE,
} from './ActivityStatement.schema';
export {
  AttachmentDownloadUrlSchema,
  AttachmentSchema,
  AttachmentUploadTicketSchema,
  DocumentPreviewSchema,
  normaliseraRaAttachment,
  parsaAttachment,
  parsaAttachments,
  parsaSkapadEventBilaga,
  SkapadEventBilagaSchema,
  UtkastResultatSchema,
} from './Attachment.schema';
export { AttendanceSchema, CreatedAttendanceSchema } from './Attendance.schema';
export {
  type HanteraInbetalningInput,
  type HanteraInbetalningResult,
  HanteraInbetalningResultSchema,
  INBETALNING_BETALSATT,
  type Inbetalning,
  type InbetalningBetalsatt,
  InbetalningSchema,
  type Inbetalningslista,
  InbetalningslistaSchema,
  type InbetalningsStatus,
  type InbetalningsTyp,
  type Jobb,
  type JobbRad,
  JobbRadSchema,
  type JobbRadStatus,
  JobbSchema,
  type Jobbstatus,
  JobbstatusSchema,
  type KoaKvittonInput,
  type KoaKvittonResult,
  KoaKvittonResultSchema,
  type Kvitto,
  type Kvittolank,
  KvittolankSchema,
  KvittoSchema,
  type OppenBetalning,
  type OppnaBetalningar,
  OppnaBetalningarSchema,
  type OskickatKvitto,
  type RegistreraInbetalningInput,
  type RegistreraInbetalningResult,
  RegistreraInbetalningResultSchema,
  type SkickaKvittoIgenInput,
  type SkickaKvittoIgenResult,
  SkickaKvittoIgenResultSchema,
  type SpegelUtfall,
  VALBARA_BETALSATT,
} from './Betalningar.schema';
export {
  type CancelRegistrationAtgard,
  CancelRegistrationAtgardSchema,
  type CancelRegistrationInput,
  type CancelRegistrationResult,
  CancelRegistrationResultSchema,
} from './CancelRegistration.schema';
export {
  type ConfirmRegistrationsInput,
  type ConfirmRegistrationsResult,
  ConfirmRegistrationsResultSchema,
} from './ConfirmRegistrations.schema';
export {
  type CreatedEvent,
  CreatedEventSchema,
  type CreateEventInput,
  type EventFormat,
  EventFormatSchema,
} from './CreateEvent.schema';
export {
  DocumentSourcesAgendaSchema,
  DocumentSourcesEventinnehallSchema,
  DocumentSourcesEventSchema,
  DocumentSourcesKopiorSchema,
  DocumentSourcesPlatsSchema,
  DocumentSourcesSchema,
} from './DocumentSources.schema';
export type {
  AgendaDagInput,
  EventinnehallFalt,
  EventTextFalt,
  PlatsFalt,
  SaveEventContentInput,
  SaveEventTextInput,
  SavePlaceInput,
  SavePlaceStandardInput,
} from './DocumentWrites.schema';
export { EngagementSchema } from './Engagement.schema';
export { EventSchema } from './Event.schema';
export {
  EventinnehallFaltSchema,
  type EventinnehallListItem,
  EventinnehallListItemSchema,
  type PlaceListItem,
  PlaceListItemSchema,
  PlatsFaltSchema,
} from './EventinnehallList.schema';
export { EventNoteSchema } from './EventNote.schema';
export { type Intresserad, IntresseradSchema } from './Intresserad.schema';
export {
  BulkMailSchema,
  MailLogEntrySchema,
  MailPayloadSchema,
  MailSendResultSchema,
} from './MailPayload.schema';
export { PersonSchema } from './Person.schema';
export {
  type PersonDetail,
  PersonDetailSchema,
  type PersonHistoryEntry,
  PersonHistoryEntrySchema,
  type PersonMotiveringEntry,
  PersonMotiveringEntrySchema,
  type PersonTouchpointEntry,
  PersonTouchpointEntrySchema,
} from './PersonDetail.schema';
export { PersonNoteSchema } from './PersonNote.schema';
export {
  type RebookRegistrationInput,
  type RebookRegistrationResult,
  RebookRegistrationResultSchema,
} from './RebookRegistration.schema';
export { RegistrationSchema } from './Registration.schema';
export {
  type RegistrationDetail,
  RegistrationDetailSchema,
  type RelateradAnmalan,
  RelateradAnmalanSchema,
} from './RegistrationDetail.schema';
export {
  type MedVillkor,
  MedVillkorSchema,
  type Modalitet,
  ModalitetSchema,
  type Par,
  ParSchema,
  type SavedSegment,
  SavedSegmentSchema,
  type SaveSegmentInput,
  type SegmentMember,
  SegmentMemberSchema,
  type SegmentResult,
  SegmentResultSchema,
  type SegmentRule,
  type SegmentRuleDnf,
  SegmentRuleDnfSchema,
  SegmentRuleSchema,
} from './Segment.schema';
export {
  type ActionSkipReason,
  ActionSkipReasonSchema,
  type SendActionEmailInput,
  type SendActionEmailResult,
  SendActionEmailResultSchema,
  type SendActionTestEmailInput,
  type SendActionTestEmailResult,
  SendActionTestEmailResultSchema,
} from './SendActionEmail.schema';
export {
  BETALSATT_VARDEN,
  type Betalsatt,
  type SendReceiptInput,
  type SendReceiptResult,
  SendReceiptResultSchema,
} from './SendReceipt.schema';
export type { UpdateEventInput } from './UpdateEvent.schema';
export { WaitlistEntrySchema } from './WaitlistEntry.schema';
