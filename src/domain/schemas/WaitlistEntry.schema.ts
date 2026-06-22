import { z } from 'zod';

// Roster-kontrakt (Fas 6c, Leverabel 3): get-waitlist returnerar ENDAST dessa
// fält — id, namn, kontakt, informationsmail-1-status, createdTime. utm/eventdatum
// läses medvetet inte (inget konsumerar dem). `createdTime` är record-metadata
// ("när de ställde sig" + sort-nyckel, senaste-först). `informationsmail1Skickad`
// är dateTime-ISO eller null. Runtime-validering vid datagränsen (ADR-026).
export const WaitlistEntrySchema = z.object({
  id: z.string(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefon: z.string().nullable(),
  informationsmail1Skickad: z.string().nullable(),
  createdTime: z.string(),
});
