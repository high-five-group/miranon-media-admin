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
  // Närvaropoäng (task-18.9) — basens `Närvaropoäng`-formel (1 om Status ∈
  // {Närvarande, Deltog online}, annars 0). Symmetriskt med schemat (parallell
  // sanningskälla får aldrig divergera; paritetsfilen fäller divergens i tsc).
  // Optional — deploy-gap: den deployade EF:en bär fältet först efter den separata
  // EF-deployen (DoD #7); registret faller tillbaka på status-mappningen tills dess.
  narvaropoang?: number | null;
}
