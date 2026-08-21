import { z } from 'zod';
import {
  Eventmatchning,
  FlagStatus,
  PaymentStatus,
  RegistrationSource,
  RegistrationStatus,
} from '../types/Status';
import { PersonHistoryEntrySchema } from './PersonDetail.schema';

// Enum-fälten härleds ur Status.ts-konstanterna (single source) och är
// data-verifierade mot live-basen 2026-06-10: 0 records utanför
// optionslistorna (Fas 2.5 klunga 3, MCP filterByFormula-svep).
export const RegistrationSchema = z.object({
  id: z.string(),
  namn: z.string().nullable(),
  fornamn: z.string().nullable(),
  efternamn: z.string().nullable(),
  email: z.string().nullable(),
  telefon: z.string().nullable(),
  eventNamn: z.string().nullable(),
  ort: z.string().nullable(),
  status: z.enum(RegistrationStatus).nullable(),
  flagga: z.enum(FlagStatus).nullable(),
  anmalningsavgift: z.enum(PaymentStatus).nullable(),
  slutbetalning: z.enum(PaymentStatus).nullable(),
  betalningspaminnelseSkickad: z.string().nullable(),
  inskickad: z.string().nullable(),
  motivering: z.string().nullable(),
  tidigareErfarenhet: z.string().nullable(),
  antalPlatser: z.number(),
  notering: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
  // Betalnings-vertikalens fyra ADDITIVA fält (task-18.8; ADR-063 —
  // per-betalnings-notering + senaste påminnelse per betalning). ADDITIVT-
  // OPTIONAL (18.2:s Event-form): äldre mockar/cachade svar utan fälten
  // parsar oförändrat; deployad get-registrations levererar dem alltid
  // (?? null). Konsumtion normaliserar ?? null.
  noteringAnmalningsavgift: z.string().nullable().optional(),
  noteringSlutbetalning: z.string().nullable().optional(),
  paminnelseAnmalningsavgiftSkickad: z.string().nullable().optional(),
  paminnelseSlutbetalningSkickad: z.string().nullable().optional(),
  // Arbetsköns deltagar-shape (task-18.4; PRD task-18 beslut 10). ADDITIVT-
  // OPTIONAL (samma form som betalfälten ovan): fyra delande konsumenters
  // mockar parsar oförändrat. Fält-existensen LIVE-verifierad mot staging-
  // schemat 2026-07-22 (tbloOcrppVoyrHbrq/tbl6ZyCm3V026iFTU, L294) före
  // mappningen: Källa fldwk2sl7CkBv9epw · Medföljande till fld39KEXJxyulXfsN ·
  // Bekräftelse skickad fld0jnbkIbuFAumgG · Deltagarinfo skickad
  // fld3WBS0QQrqLpYtK · Personer.Antal genomförda event flddy8JND3YnlgZxe.
  // `kalla` är enum:ad mot RegistrationSource — Källa TOM levereras som null.
  kalla: z.enum(RegistrationSource).nullable().optional(),
  medfoljandeTill: z.string().nullable().optional(),
  bekraftelseSkickad: z.string().nullable().optional(),
  deltagarinfoSkickad: z.string().nullable().optional(),
  antalGenomfordaEvent: z.number().nullable().optional(),
  // Bor över-markeringen (task-18.7; PRD task-18 beslut 8). ADDITIVT-OPTIONAL
  // av samma skäl som fälten ovan. BOOLEAN utan null (Event-schemats
  // `deltagarinfoAutoAvstangt`-precedent): Airtable utelämnar en OMARKERAD
  // checkbox helt ur svaret, och EF:en normaliserar `=== true` → osatt ⇒ false.
  // Bas-fältet 'Bor över' (fldGYYNnQi7XlfbhP) är ADDITIVT staging-fött
  // 2026-07-22 och LIVE-verifierat skrivbart (L294) före mappningen.
  borOver: z.boolean().optional(),
  // Gruppdynamik-shapen (task-18.10; PRD task-18 beslut 12). ADDITIVT-OPTIONAL
  // av samma skäl som fälten ovan — fyra delande konsumenters mockar parsar
  // oförändrat. Fält-existensen LIVE-verifierad mot staging-schemat 2026-07-23
  // (Personer tbl6ZyCm3V026iFTU · Deltaganden tbldWHH6sSHWoQPHH, L294) FÖRE
  // mappningen: Erfarenhetsbadge fld04qqDQLgbJbBef (formel, Personer) ·
  // Deltaganden-länken fld5shm9UER5CMyTl + raderna Kursnamn (lookup)
  // fldJyjymEoo514AgN · Event startdatum fldExIP1zw5o6ib63 · Session
  // fldBPZnsDL0bNIRHx · Närvaropoäng fldwuo94BY46VUOm4.
  //
  // `erfarenhetsbadge` — PERSONENS kanoniska `Erfarenhetsbadge` (formel), hämtad
  //   i SAMMA person-batch som `antalGenomfordaEvent`. RÅ ur basen: badgen är
  //   RIM 3-BLIND (data-model §Kända buggar) — den KÄNDA luckan (T16) visas som
  //   den är, designas aldrig bort. null när anmälan saknar Person-länk eller i
  //   den event-lösa grenen (spegel av antalGenomfordaEvent).
  // `kurshistorik` — PERSONENS deltaganden (PersonHistoryEntry-shape återanvänd
  //   ur get-person, ingen parallell form) via en TREDJE chunkad record-ID-batch
  //   mot Deltaganden. RÅ per-session-rader (samma kontrakt som get-person:s
  //   historik); gruppdynamik-vyn härleder genomförda+deduperade kurser
  //   klientside (narvaro && Session ∈ {Dag 1, Föreläsning}). null = ingen
  //   Person-länk / event-lösa grenen; [] = person utan deltaganden.
  erfarenhetsbadge: z.string().nullable().optional(),
  kurshistorik: z.array(PersonHistoryEntrySchema).nullable().optional(),
  // Eventlänkens vakt (task-284.1; ADR-122 beslut 3). ADDITIVT-OPTIONAL av
  // samma skäl som fälten ovan — äldre cachade svar parsar oförändrat.
  // `Anmälningar.Eventmatchning` (formelfält, staging fldYz2NRZJjyX8VWB)
  // jämför anmälans egna formulärtext mot det länkade eventets facit,
  // normaliserat mot skiftläge/tankstreck-mellanslag/upprepat årtal.
  // Exakt tre värden — enum:ad mot Eventmatchning (Status.ts).
  eventmatchning: z.enum(Eventmatchning).nullable().optional(),
  // Anmälans egen Datum-textkopia (task-284.3; ADR-122 § Fynd 1). ADDITIVT-
  // OPTIONAL som fälten ovan — äldre cachade svar parsar oförändrat.
  datum: z.string().nullable().optional(),
});
