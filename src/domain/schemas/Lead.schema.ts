import { z } from 'zod';

export const LeadSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  erbjudandeNamn: z.string().nullable(),
  datum: z.string().nullable(),
  sourceKey: z.string().nullable(),
  personId: z.string().nullable(),
  engagemangId: z.string().nullable(),
  erbjudandeSource: z.string().nullable(),
  kalla: z.string().nullable(),
});
