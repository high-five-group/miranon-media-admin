export interface WaitlistEntry {
  id: string;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefonnummer: string | null;
  event: string | null;
  eventdatumStart: string | null;
  eventdatumSlut: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
}
