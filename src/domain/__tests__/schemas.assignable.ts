/**
 * Compile-time test: säkerställer att `z.infer<typeof XxxSchema>` är
 * strukturellt assignable till motsvarande interface `Xxx`.
 *
 * Denna fil kompileras av tsc. Om schemat och interfacet divergerar
 * får vi ett TS-fel här — inte i produktion.
 *
 * Denna fil är INTE en runtime-test — den existerar för sin compile-tid-effekt.
 * Om vi någon gång introducerar ett test-ramverk (vitest, playwright-test) kan
 * denna fil ersättas av en `expectTypeOf`-check.
 */

import type { z } from 'zod';

import type { Attendance } from '../models/Attendance';
import type { Engagement } from '../models/Engagement';
import type { Event } from '../models/Event';
import type { EventNote } from '../models/EventNote';
import type { BulkMail, MailLogEntry, MailPayload, MailSendResult } from '../models/MailPayload';
import type { Person } from '../models/Person';
import type { PersonNote } from '../models/PersonNote';
import type { Registration } from '../models/Registration';
import type { WaitlistEntry } from '../models/WaitlistEntry';

import type {
  AttendanceSchema,
  BulkMailSchema,
  EngagementSchema,
  EventNoteSchema,
  EventSchema,
  MailLogEntrySchema,
  MailPayloadSchema,
  MailSendResultSchema,
  PersonNoteSchema,
  PersonSchema,
  RegistrationSchema,
  WaitlistEntrySchema,
} from '../schemas';

/** Hjälptyp: assignability i båda riktningar (strukturell jämlikhet). */
type AssertEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Varje rad här är ett compile-time-påstående. Om det misslyckas:
// - Uppdatera antingen schemat eller interfacet så de matchar varje fält exakt.
const _attendance: AssertEqual<z.infer<typeof AttendanceSchema>, Attendance> = true;
const _engagement: AssertEqual<z.infer<typeof EngagementSchema>, Engagement> = true;
const _event: AssertEqual<z.infer<typeof EventSchema>, Event> = true;
const _eventNote: AssertEqual<z.infer<typeof EventNoteSchema>, EventNote> = true;
const _mailPayload: AssertEqual<z.infer<typeof MailPayloadSchema>, MailPayload> = true;
const _mailSendResult: AssertEqual<z.infer<typeof MailSendResultSchema>, MailSendResult> = true;
const _mailLogEntry: AssertEqual<z.infer<typeof MailLogEntrySchema>, MailLogEntry> = true;
const _bulkMail: AssertEqual<z.infer<typeof BulkMailSchema>, BulkMail> = true;
const _person: AssertEqual<z.infer<typeof PersonSchema>, Person> = true;
const _personNote: AssertEqual<z.infer<typeof PersonNoteSchema>, PersonNote> = true;
const _registration: AssertEqual<z.infer<typeof RegistrationSchema>, Registration> = true;
const _waitlistEntry: AssertEqual<z.infer<typeof WaitlistEntrySchema>, WaitlistEntry> = true;

// Tysta "noUnusedLocals" — vi vill bara ha TS att kontrollera påståendena ovan.
export const _schemaAssignabilityAsserts = {
  _attendance,
  _engagement,
  _event,
  _eventNote,
  _mailPayload,
  _mailSendResult,
  _mailLogEntry,
  _bulkMail,
  _person,
  _personNote,
  _registration,
  _waitlistEntry,
};
