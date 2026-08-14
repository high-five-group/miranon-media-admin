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

/**
 * Write-shapen för `create-attendance` (TASK-214.1:s EF, konsumerad av
 * TASK-214.2). Klienten skickar ENDAST identiteten — `Status` sätts
 * server-side till 'Närvarande' (EF:en finns bara för dörr-ögonblicket) och
 * `Person (länk)` / `Avstämt` rörs aldrig: de ägs av automationerna A11
 * respektive A8. Samma disciplin som `CreateEventNoteInput`, där författaren
 * sätts server-side ur den verifierade identiteten (ADR-075).
 */
export interface CreateAttendanceInput {
  /** Anmälnings-record-ID — raden som ska få ett deltagande. */
  anmalanId: string;
  /** Eventets record-ID — EF:en 404:ar på okänt event. */
  eventId: string;
  /** Sessionen raden gäller. Deltaganden är EN rad per Anmälan × Session. */
  session: AttendanceSessionValue;
}

/**
 * Svaret från `create-attendance`. `created: false` är INTE ett fel — EF:en är
 * idempotent av design (dubbeltryck vid dörren ska aldrig ge två rader) och
 * returnerar då den BEFINTLIGA raden med 200 i stället för 201.
 */
export interface CreatedAttendance {
  /** Deltagandets record-ID — radens skriv-nyckel efter skapelsen. */
  id: string;
  /** true = ny rad (201); false = raden fanns redan (200, idempotens-vägen). */
  created: boolean;
}
