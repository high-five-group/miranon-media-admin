export interface Registration {
  id: string;
  namn: string | null;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  eventNamn: string | null;
  ort: string | null;
  status: string | null;
  flagga: string | null;
  anmalningsavgift: string | null;
  slutbetalning: string | null;
  betalningspaminnelseSkickad: string | null;
  inskickad: string | null;
  motivering: string | null;
  tidigareErfarenhet: string | null;
  antalPlatser: number;
  notering: string | null;
  eventId: string | null;
  personId: string | null;
}
