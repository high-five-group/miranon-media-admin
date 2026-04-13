import { z } from 'zod';

export const EngagementSchema = z.object({
  id: z.string(),
  personId: z.string().nullable(),
  erbjudandeNamn: z.string().nullable(),
  forstaHamtning: z.string().nullable(),
  senasteHamtning: z.string().nullable(),
  totaltAntalHamtningar: z.number(),
  normaliseradEpost: z.string().nullable(),
  engagemangNyckel: z.string().nullable(),
});
