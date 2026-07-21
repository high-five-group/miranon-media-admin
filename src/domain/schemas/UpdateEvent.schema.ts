/**
 * [GA] Write-input till uppdatera-event-vertikalen (task-18.1, PRD task-18
 * Implementationsbeslut 2–3).
 *
 * De typade fälten klienten samlar; update-event-EF:en bygger Airtable-`fields`
 * SERVER-SIDE ur dem (klienten skickar aldrig en rå fields-map) och PATCH:ar
 * BEFINTLIG Eventplanering-rad. Alla uppdaterbara fält är optional — en sektion
 * skickar sina fält (Om eventet: typ/ort/datum/status; Beläggningens Ändra
 * återanvänder operationen för maxPlatser i sin skiva); minst ETT måste vara
 * satt (EF:en fäller annars med 400).
 *
 * INGEN idempotensnyckel (till skillnad mot CreateEventInput): en PATCH med
 * absoluta värden är naturligt idempotent — retry ger samma sluttillstånd
 * (samma klass som update-record-operationerna; ADR-066 b3 gäller create).
 */
export type UpdateEventInput = {
  eventId: string;
  typ?: string;
  ort?: string;
  startdatum?: string;
  slutdatum?: string;
  status?: string;
  maxPlatser?: number;
};
