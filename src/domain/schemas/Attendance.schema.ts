import { z } from 'zod';

/**
 * [GA] Runtime-validering av Airtable-API-svar för Attendance.
 *
 * Parallell sanningskälla: interfacet i `../models/Attendance.ts` behålls
 * som compile-time-kontrakt. Fas 1 använder båda; Fas 2/3 kan konsolidera
 * till schema-som-sanningskälla.
 */
export const AttendanceSchema = z.object({
  id: z.string(),
  anmalanId: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
  session: z.string().nullable(),
  status: z.string().nullable(),
  noteringar: z.string().nullable(),
  avstamt: z.string().nullable(),
});
