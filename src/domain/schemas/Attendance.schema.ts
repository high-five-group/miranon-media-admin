import { z } from 'zod';
import { AttendanceSession, AttendanceStatus } from '../types/Status';

/**
 * [GA] Runtime-validering av Airtable-API-svar för Attendance.
 *
 * Parallell sanningskälla: interfacet i `../models/Attendance.ts` behålls
 * som compile-time-kontrakt. Fas 1 använder båda; Fas 2/3 kan konsolidera
 * till schema-som-sanningskälla.
 *
 * Enum-fälten härleds ur Status.ts-konstanterna (single source) och är
 * data-verifierade mot live-basen 2026-06-10: 0 records utanför
 * optionslistorna (Fas 2.5 klunga 3).
 */
export const AttendanceSchema = z.object({
  id: z.string(),
  anmalanId: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
  // `personNamn` är INTE ett Deltaganden-fält. Deltaganden bär bara person-
  // record-ID:n (`Person (länk)` / `Person`-lookup → IDs, live-verifierat
  // 2026-06-20). Läsbara namn (Gunilla-princip: vyn visar aldrig rec-ID:n)
  // BATCH-hämtas av get-attendance ur Personer.Namn (primärfält-formel → alltid
  // sträng, "Ej tillgängligt" för namnlös) — samma aggregerings-disciplin som
  // PersonDetailSchema:s `historik` (Fas 6b L3, VÄGVAL A). null = person-ID utan
  // träff i namn-batchen (bör ej hända, null-säkert).
  personNamn: z.string().nullable(),
  session: z.enum(AttendanceSession).nullable(),
  status: z.enum(AttendanceStatus).nullable(),
  noteringar: z.string().nullable(),
  avstamt: z.string().nullable(),
});
