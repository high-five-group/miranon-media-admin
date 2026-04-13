import { z } from 'zod';

export const WaitlistEntrySchema = z.object({
  id: z.string(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefonnummer: z.string().nullable(),
  event: z.string().nullable(),
  eventdatumStart: z.string().nullable(),
  eventdatumSlut: z.string().nullable(),
  utmSource: z.string().nullable(),
  utmMedium: z.string().nullable(),
  utmCampaign: z.string().nullable(),
  utmContent: z.string().nullable(),
});
