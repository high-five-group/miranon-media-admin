/**
 * [GA] Barrel-export för alla Zod-scheman.
 *
 * Scheman används för att validera Airtable/Edge-Function-svar
 * vid systemgränsen. Interface-typerna ligger i `../models/`.
 */
export { AttendanceSchema } from './Attendance.schema';
export { EngagementSchema } from './Engagement.schema';
export { EventSchema } from './Event.schema';
export { type Intresserad, IntresseradSchema } from './Intresserad.schema';
export {
  BulkMailSchema,
  MailLogEntrySchema,
  MailPayloadSchema,
} from './MailPayload.schema';
export { PersonSchema } from './Person.schema';
export {
  type PersonDetail,
  PersonDetailSchema,
  type PersonHistoryEntry,
  PersonHistoryEntrySchema,
} from './PersonDetail.schema';
export { RegistrationSchema } from './Registration.schema';
export {
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
  SegmentRuleSchema,
} from './Segment.schema';
export { WaitlistEntrySchema } from './WaitlistEntry.schema';
