import type {
  FlagStatusValue,
  PaymentStatusValue,
  RegistrationSourceValue,
  RegistrationStatusValue,
} from '../types/Status';

/**
 * Input för att skapa en manuell anmälan (create-registration-EF, Fas 6c).
 *
 * MEDVETET en egen write-shape, INTE `Omit<Registration, 'id'>` (läs-shapen):
 * en create tar bara de fält admin faktiskt fyller i + idempotensnyckeln —
 * EF:en härleder resten server-side (EventKey via lookup, Källa/Status/Inskickad
 * som konstanter, Person-länk via A2). `idempotencyKey` är en klient-genererad
 * UUID (crypto.randomUUID) per submit (ADR-059).
 */
export interface CreateRegistrationInput {
  fornamn: string;
  efternamn: string;
  email: string;
  telefon: string | null;
  eventId: string;
  idempotencyKey: string;
}

export interface Registration {
  id: string;
  namn: string | null;
  fornamn: string | null;
  efternamn: string | null;
  email: string | null;
  telefon: string | null;
  eventNamn: string | null;
  ort: string | null;
  status: RegistrationStatusValue | null;
  flagga: FlagStatusValue | null;
  anmalningsavgift: PaymentStatusValue | null;
  slutbetalning: PaymentStatusValue | null;
  betalningspaminnelseSkickad: string | null;
  inskickad: string | null;
  motivering: string | null;
  tidigareErfarenhet: string | null;
  antalPlatser: number;
  notering: string | null;
  eventId: string | null;
  personId: string | null;
  /**
   * Betalnings-vertikalens fyra ADDITIVA fält (task-18.8; ADR-063).
   * Optional i schema-formen (18.2:s Event-precedent — äldre svar utan
   * fälten parsar oförändrat); deployad get-registrations levererar dem
   * alltid som värde-eller-null. Semantik: notering per BETALNING samt
   * SENASTE påminnelse-tidsstämpel per betalning (basens
   * Bekräftelse skickad-grammatik) — gamla odelade `notering`/
   * `betalningspaminnelseSkickad` står kvar orörda ovan.
   */
  noteringAnmalningsavgift?: string | null;
  noteringSlutbetalning?: string | null;
  paminnelseAnmalningsavgiftSkickad?: string | null;
  paminnelseSlutbetalningSkickad?: string | null;
  /**
   * Arbetsköns deltagar-shape (task-18.4; PRD task-18 beslut 10). ADDITIVT-
   * OPTIONAL av samma skäl som betalfälten ovan: fyra andra konsumenter
   * (useDashboardData, AnmalningarList, EventRegistrations, detail/Betalningar)
   * delar Registration och deras mockar får inte falla. Deployad
   * get-registrations levererar dem alltid som värde-eller-null.
   *
   * `kalla` — basens `Källa`; TOM ⇒ null ⇒ "via formulär" (normen, S73 K37).
   * `medfoljandeTill` — basens `Medföljande till` (self-link) → FÖRSTA
   *   record-ID:t; kopplar en +1-anmälan till sin huvudanmälan.
   * `bekraftelseSkickad` / `deltagarinfoSkickad` — utskicks-tidsstämplarna
   *   (mail 1 respektive mail 2). UI-ordet för den senare är EVENTINFO;
   *   basens fält heter `Deltagarinfo skickad` (ORDLISTA-noten).
   * `antalGenomfordaEvent` — PERSONENS `Antal genomförda event` (formel),
   *   hämtad via chunkad Personer-batch i EF:ens eventId-gren. null när
   *   anmälan saknar Person-länk ELLER när svaret kom ur den event-lösa
   *   grenen (som medvetet inte batchar hela basens personer).
   */
  kalla?: RegistrationSourceValue | null;
  medfoljandeTill?: string | null;
  bekraftelseSkickad?: string | null;
  deltagarinfoSkickad?: string | null;
  antalGenomfordaEvent?: number | null;
  /**
   * Bor över-markeringen per anmälan (task-18.7; PRD task-18 beslut 8 —
   * eventsidans kryss-läge). ADDITIVT-OPTIONAL som fälten ovan, men BOOLEAN
   * UTAN null: Airtable utelämnar en omarkerad checkbox helt ur record-svaret,
   * och EF:en normaliserar med `=== true` (Event-shapens
   * `deltagarinfoAutoAvstangt`-precedent) — "osatt" och "urkryssad" är samma
   * tillstånd i basen och ska inte låtsas vara två i shapen.
   *
   * Eventets bor över-ANTAL härleds ALLTID ur dessa kryss (aldrig ett lagrat
   * räknefält) — både i eventsidans summeringsrad och i listkortets rad (17.5).
   */
  borOver?: boolean;
}
