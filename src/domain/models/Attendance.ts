import type { AttendanceSessionValue, AttendanceStatusValue } from '../types/Status';

export interface Attendance {
  id: string;
  anmalanId: string | null;
  eventId: string | null;
  personId: string | null;
  session: AttendanceSessionValue | null;
  status: AttendanceStatusValue | null;
  noteringar: string | null;
  avstamt: string | null;
}
