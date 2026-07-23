/**
 * Input för att skapa en anteckning (create-event-note-EF, task-18.11, ADR-075).
 *
 * MEDVETET en egen write-shape (INTE `Omit<EventNote, 'id'>`): klienten skickar
 * bara `eventId` + `text`. FÖRFATTAREN sätts SERVER-SIDE ur den inloggade
 * användarens verifierade identitet (JWT `user_metadata.display_name`; fallback
 * e-post) — den är ALDRIG klient-buren, så attributionen inte kan förfalskas
 * (ADR-075:s kärnpoäng: additiv tabell ger äkta per-användar-attribution som
 * Airtable record comments inte kan, eftersom API-skrivningar där bokförs på
 * token-ägaren). `tidpunkt` sätts av Airtables `createdTime` (server-sanning),
 * inte av klienten.
 */
export interface CreateEventNoteInput {
  eventId: string;
  text: string;
}

/**
 * En anteckning i eventets tidsstämplade ström (task-18.11, ADR-075).
 *
 * Parallell sanningskälla: `EventNoteSchema` i `../schemas/EventNote.schema.ts`
 * (paritetsfilen `src/domain/__tests__/schemas.assignable.ts` fäller divergens i
 * tsc). Fas-etiketten (Under/Efter eventet) HÄRLEDS klient-side ur `tidpunkt` mot
 * eventets datum — den lagras aldrig (tysta normen: Innan är omärkt).
 */
export interface EventNote {
  id: string;
  /** Författaren — satt server-side ur inloggad identitet; null om fältet saknas (defensivt läs). */
  forfattare: string | null;
  /** Antecknings-texten (flerradig; whitespace bevaras i UI:t). */
  text: string;
  /** Tidpunkten (ISO) — Airtables `createdTime`, server-sanning. */
  tidpunkt: string;
  /** Länkat event-record-ID (första länken); null om länk saknas (defensivt läs). */
  eventId: string | null;
}
