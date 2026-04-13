export interface Attendance {
  id: string;
  anmalanId: string | null;
  eventId: string | null;
  personId: string | null;
  session: string | null;
  status: string | null;
  noteringar: string | null;
  avstamt: string | null;
}
