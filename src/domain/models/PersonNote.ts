/**
 * Input för att skapa en anteckning på en person (create-person-note-EF, S103,
 * T97-bygg-spåret). MEDVETET en egen write-shape (INTE `Omit<PersonNote, 'id'>`):
 * klienten skickar bara `personId` + `text`. Speglar `CreateEventNoteInput`
 * exakt — FÖRFATTAREN sätts SERVER-SIDE ur den inloggade användarens
 * verifierade identitet (JWT `user_metadata.display_name`; fallback e-post),
 * aldrig klient-buren (ADR-075:s attributions-kärna, ärvd oförändrad från
 * event-strömmen). `tidpunkt` sätts av Airtables `createdTime`, inte av klienten.
 */
export interface CreatePersonNoteInput {
  personId: string;
  text: string;
}

/**
 * En anteckning i personens tidsstämplade ström (S103; samma additiva
 * Anteckningar-tabell som `EventNote`, ADR-075 utökad med ett Person-länkfält).
 *
 * Parallell sanningskälla: `PersonNoteSchema` i `../schemas/PersonNote.schema.ts`
 * (paritetsfilen `src/domain/__tests__/schemas.assignable.ts` fäller divergens i
 * tsc).
 *
 * INVARIANTEN (kritisk, testad server-side): en Anteckningar-rad bär `eventId`
 * ELLER `personId`, aldrig båda — `EventNote`/`PersonNote` är därför medvetet
 * TVÅ separata domän-shapes (inte en union), eftersom get-event-notes/
 * get-person-notes var för sig bara någonsin returnerar den ena sortens rad.
 */
export interface PersonNote {
  id: string;
  /** Författaren — satt server-side ur inloggad identitet; null om fältet saknas (defensivt läs). */
  forfattare: string | null;
  /** Antecknings-texten (flerradig; whitespace bevaras i UI:t). */
  text: string;
  /** Tidpunkten (ISO) — Airtables `createdTime`, server-sanning. */
  tidpunkt: string;
  /** Länkat person-record-ID (första länken); null om länk saknas (defensivt läs). */
  personId: string | null;
}
