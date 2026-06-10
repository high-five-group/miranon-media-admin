import type { FlagStatusValue, PaymentStatusValue, RegistrationStatusValue } from '../types/Status';

export interface Registration {
  id: string;
  namn: string | null;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  eventNamn: string | null;
  ort: string | null;
  status: RegistrationStatusValue | null;
  flagga: FlagStatusValue | null;
  anmalningsavgift: PaymentStatusValue | null;
  slutbetalning: PaymentStatusValue | null;
  betalningspaminnelseSkickad: string | null;
  inskickad: string | null;
  motivering: string | null;
  tidigareErfarenhet: string | null;
  antalPlatser: number;
  notering: string | null;
  eventId: string | null;
  personId: string | null;
}
