import type { PersonHistoryEntry } from '../schemas/PersonDetail.schema';
import type {
  EventmatchningValue,
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
 *
 * `antalPlatser` + `notering` (task-18.12; facit-formens SEX fält): ADDITIVT-
 * OPTIONAL så den befintliga modal-callern (AddRegistrationModal) står orörd —
 * skarpa formsidan skickar dem alltid, modalen utelämnar dem. EF:en skriver
 * 'Antal platser' (number) när angivet och 'Notering' (multilineText) när icke-tom.
 */
export interface CreateRegistrationInput {
  fornamn: string;
  efternamn: string;
  email: string;
  telefon: string | null;
  /** Antal platser (facit-formen; default 1). Osatt ⇒ EF:en skriver ej fältet. */
  antalPlatser?: number;
  /** Fri-text-notering (facit-formen). Tom/osatt ⇒ EF:en skriver ej fältet. */
  notering?: string | null;
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
   * (useDashboardData, AnmalningarSida — f.d. AnmalningarList, TASK-299.5 —
   * EventRegistrations, detail/Betalningar)
   * delar Registration och deras mockar får inte falla. Deployad
   * get-registrations levererar dem alltid som värde-eller-null.
   *
   * `kalla` — basens `Källa`; TOM ⇒ null ⇒ "via formulär" (normen, S73 K37).
   * `medfoljandeTill` — basens `Medföljande till` (self-link) → FÖRSTA
   *   record-ID:t; kopplar en +1-anmälan till sin huvudanmälan.
   * `bekraftelseSkickad` / `deltagarinfoSkickad` — utskicks-tidsstämplarna
   *   (mail 1 respektive mail 2). UI-ordet för den senare är DELTAGARINFO
   *   sedan 2026-08-23 (TASK-303, Marcus: "Jag vänder beslutet") — samma
   *   ord som basens fält `Deltagarinfo skickad`; det tidigare UI-ordet
   *   "eventinfo" är rivet (ORDLISTA § Deltagarinfo).
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
  /**
   * Gruppdynamik-shapen (task-18.10; PRD task-18 beslut 12 — erfarenhetsmix +
   * per-person-kurshistorik). ADDITIVT-OPTIONAL som fälten ovan; deployad
   * get-registrations levererar dem i eventId-grenen som värde-eller-null.
   *
   * `erfarenhetsbadge` — PERSONENS kanoniska `Erfarenhetsbadge` (formel på
   *   Personer), hämtad i samma person-batch som `antalGenomfordaEvent`. RÅ ur
   *   basen — badgen är RIM 3-BLIND (data-model §Kända buggar i insiktskedjan);
   *   den KÄNDA luckan (T16) visas som den är. null när Person-länk saknas eller
   *   i den event-lösa grenen.
   * `kurshistorik` — PERSONENS deltaganden, `PersonHistoryEntry`-shapen
   *   ÅTERANVÄND ur get-person (ingen parallell kurshistorik-form). RÅA
   *   per-session-rader; gruppdynamik-vyn härleder genomförda+deduperade kurser
   *   klientside. null = ingen Person-länk / event-lösa grenen; [] = person utan
   *   deltaganden.
   */
  erfarenhetsbadge?: string | null;
  kurshistorik?: PersonHistoryEntry[] | null;
  /**
   * Eventlänkens vakt (task-284.1; ADR-122 beslut 3). ADDITIVT-OPTIONAL som
   * fälten ovan. `Anmälningar.Eventmatchning` (formelfält) jämför anmälans
   * egna formulärtext mot det länkade eventets facit — exakt tre värden:
   * `'OK'` (stämmer, eller kan inte avgöras pga tomt jämförelsefält),
   * `'Avviker'` (en icke-tom jämförelse divergerar), `'Utan event'` (ingen
   * Event-länk). Markören i AnmalningarSida (f.d. AnmalningarList,
   * TASK-299.5) visar raden vid `'Avviker'`.
   */
  eventmatchning?: EventmatchningValue | null;
  /**
   * Anmälans EGNA formulär-textkopia av datumet (task-284.3; ADR-122 § Fynd 1,
   * `Anmälningar.Datum` fldsROcE2FFTGCL3W, singleLineText — samma fält
   * `Eventmatchning`-formeln jämför mot facit). ADDITIVT-OPTIONAL som
   * `eventmatchning` ovan. Visas i eventväljarens resolution-dialog
   * (`AnmalningRadResolution`, f.d. även syskonet `KopplaTillEventDialog` —
   * revs som död kod i `TASK-400`, 2026-09-05) intill `ort`/`eventNamn` så
   * Lotta kan koppla om en avvikande/okopplad anmälan utan att gissa
   * (AC 4) — ALDRIG facit-fältet `Datum (from Event)`, som hör till det
   * (ev. felaktiga) länkade eventet.
   */
  datum?: string | null;
}
