import type { AttendanceSessionValue, AttendanceStatusValue } from '../types/Status';

export interface Attendance {
  id: string;
  anmalanId: string | null;
  eventId: string | null;
  personId: string | null;
  // Läsbart person-namn — batch-hämtat av get-attendance ur Personer.Namn (ej ett
  // Deltaganden-fält; se Attendance.schema.ts). Symmetriskt med schemat (parallell
  // sanningskälla får aldrig divergera). Fas 6b L3.
  personNamn: string | null;
  session: AttendanceSessionValue | null;
  status: AttendanceStatusValue | null;
  noteringar: string | null;
  avstamt: string | null;
}
