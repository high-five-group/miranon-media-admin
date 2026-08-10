import { z } from 'zod';

/**
 * [GA] Runtime-validering av create-person-note/get-person-notes-svar (ADR-026).
 * Speglar `EventNoteSchema` exakt (samma additiva tabell, S103-utökningen med
 * ett Person-länkfält) — `personId` i stället för `eventId`.
 *
 * Parallell sanningskälla: interfacet i `../models/PersonNote.ts` behålls som
 * compile-time-kontrakt; paritetsfilen `../__tests__/schemas.assignable.ts` fäller
 * divergens i tsc. `forfattare`/`personId` är nullable (defensivt läs — en manuellt
 * skapad rad kan sakna dem); `text`/`tidpunkt` är alltid strängar (EF:en
 * garanterar dem: `text` via deny-empty vid write, `tidpunkt` ur `createdTime`).
 */
export const PersonNoteSchema = z.object({
  id: z.string(),
  forfattare: z.string().nullable(),
  text: z.string(),
  tidpunkt: z.string(),
  personId: z.string().nullable(),
});
