import { z } from 'zod';

/**
 * [GA] Runtime-validering av create-event-note/get-event-notes-svar (ADR-026).
 *
 * Parallell sanningskälla: interfacet i `../models/EventNote.ts` behålls som
 * compile-time-kontrakt; paritetsfilen `../__tests__/schemas.assignable.ts` fäller
 * divergens i tsc. `forfattare`/`eventId` är nullable (defensivt läs — en manuellt
 * skapad rad kan sakna dem); `text`/`tidpunkt` är alltid strängar (EF:en
 * garanterar dem: `text` via deny-empty vid write, `tidpunkt` ur `createdTime`).
 */
export const EventNoteSchema = z.object({
  id: z.string(),
  forfattare: z.string().nullable(),
  text: z.string(),
  tidpunkt: z.string(),
  eventId: z.string().nullable(),
});
