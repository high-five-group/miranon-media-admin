import type { FlagStatusValue, PaymentStatusValue, RegistrationStatusValue } from '../types/Status';

/**
 * Input för att skapa en manuell anmälan (create-registration-EF, Fas 6c).
 *
 * MEDVETET en egen write-shape, INTE `Omit<Registration, 'id'>` (läs-shapen):
 * en create tar bara de fält admin faktiskt fyller i + idempotensnyckeln —
 * EF:en härleder resten server-side (EventKey via lookup, Källa/Status/Inskickad
 * som konstanter, Person-länk via A2). `idempotencyKey` är en klient-genererad
 * UUID (crypto.randomUUID) per submit (ADR-059).
 */
export interface CreateRegistrationInput {
  fornamn: string;
  efternamn: string;
  email: string;
  telefon: string | null;
  eventId: string;
  idempotencyKey: string;
}

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
