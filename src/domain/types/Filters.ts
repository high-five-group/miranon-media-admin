export interface RegistrationFilters {
  eventId?: string;
  status?: string;
  flagga?: string;
}

export interface PersonFilters {
  search?: string;
  limit?: number;
}

/** Scenario 3: Eventdag — filtrera deltaganden */
export interface AttendanceFilters {
  eventId?: string;
  session?: string;
  status?: string;
}

/** Scenario 8: Väntelista */
export interface WaitlistFilters {
  event?: string;
}

/**
 * Aktivitetsloggens läsfilter (TASK-201.5, PRD TASK-201 användarberättelse #7).
 * Server-side (get-activity-log-EF), inte klient-side — se
 * `src/domain/types/Pagination.ts`s `ActivityLogParams` för den paginerade
 * hämtningens fulla parameterform.
 */
export interface ActivityLogFilters {
  /** Equality mot `object_type`-kolumnen (statement.object.definition.type-IRI:n). */
  category?: string;
  /**
   * Equality mot `context.extensions[EVENT_ID_EXTENSION_IRI]` (se
   * `src/domain/schemas/ActivityStatement.schema.ts`). ÖPPEN
   * koordinerings-skuld: skrivvägen (TASK-201.3/201.4) emitterar ännu inte
   * denna nyckel — filtret är ett verifierat kontrakt, inte (ännu) en
   * beprövad väg mot riktiga rader. Se `get-activity-log`-EF:ens filhuvud.
   */
  eventId?: string;
  /** ISO 8601 — undre gräns (inclusive) mot `occurred_at`. */
  from?: string;
  /** ISO 8601 — övre gräns (inclusive) mot `occurred_at`. */
  to?: string;
}
