// Väntelista-rad (roster-kontrakt, Fas 6c Leverabel 3). Speglar
// WaitlistEntrySchema. ENDAST fält vy:n konsumerar — utm/eventdatum borttagna
// (inget konsumerar dem). `createdTime` = record-metadata ("när de ställde sig"
// + sort-nyckel). `informationsmail1Skickad` = dateTime-ISO eller null.
export interface WaitlistEntry {
  id: string;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  informationsmail1Skickad: string | null;
  createdTime: string;
}
