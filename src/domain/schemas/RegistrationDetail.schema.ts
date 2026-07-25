import { z } from 'zod';
import { RegistrationSchema } from './Registration.schema';

/**
 * Per-anmälan-detaljshapen (task-18.17; S83-facit, Marcus-låst 2026-07-24).
 *
 * EXTEND av list-shapen (RegistrationSchema) — aldrig en parallell form: allt
 * get-registrations levererar per rad levererar get-registration också (samma
 * mapRegistration i `_shared/registration-read.ts`), plus detaljvyns fält.
 * Fälten är REQUIRED (ej additivt-optional): shapen har exakt EN producent
 * (get-registration-EF:en, född i samma leverans) som alltid sätter varje
 * nyckel — det finns inga äldre svar/mockar att vara bakåtkompatibel mot.
 *
 * Fält-existensen LIVE-verifierad mot prod-schemat (tbloOcrppVoyrHbrq)
 * 2026-07-25 (L294) före mappningen: ID fld9ma56IzeckxDfX (autoNumber) ·
 * Från formulär fldCLVfJIHcuI1l83 (multipleSelects) · Frågor eller
 * funderingar? fldtaSHOvGjgu9v39 · Jag har läst och godkänner villkoren...
 * fldwSsq3ZELmtRHPY (multilineText, "Yes") · Typ fldGyYPbxkgS3BqVb ·
 * Startdatum/Slutdatum fldAHtyo4P7Z08Vuj/fldsltWfacFVf18Zq (lookup date) ·
 * Tid kvar till event fldQSRCqIzm49fo3I (lookup text) · EventKey
 * fldPlPLkpqm0X7Xs2 · Deadline slutbetalning fldGlznON7xqR3IE1 (formel date) ·
 * Dagar kvar till deadline fldZKPoOpziYbthYF (formel number) · Plus-one
 * förfrågan skickad fld9BkFY8K5pF0xJ2 · From field: Medföljande till
 * fldlP4z8Dirq00nqq (self-link-inversen).
 */

/** En relaterad anmälan (medföljande-relationen) — ID + visningsnamn. */
export const RelateradAnmalanSchema = z.object({
  id: z.string(),
  /** Visningsnamn ur den länkade radens namnfält; namnlös rad → null. */
  namn: z.string().nullable(),
});

export const RegistrationDetailSchema = RegistrationSchema.extend({
  /** Basens autonummer (`ID`) — headerns "Anmälan #N"-pill. */
  anmalanId: z.number().nullable(),
  /** `Från formulär` (första valet; multipleSelects bär i praktiken ett). */
  franFormular: z.string().nullable(),
  /**
   * Formulärets options-ID (IdChip-raden, Stripe-idiomet). Löses server-side
   * ur formulärnamnet; okänt/omappat namn → null (chippen uteblir).
   */
  franFormularId: z.string().nullable(),
  /** `Frågor eller funderingar?` — Ansökningssvar-sektionens andra fritext. */
  fragorFunderingar: z.string().nullable(),
  /**
   * Villkors-godkännandet härlett ur basens formulärtext-fält ("Yes" ⇒ true).
   * Icke-formulär-anmälningar (Källa satt) har aldrig mött kryssrutan —
   * vyn visar "Ej tillämpligt (<källa>)", aldrig ett falskt "Nej".
   */
  villkorOk: z.boolean(),
  /**
   * Eventets typ — ur EVENTRADEN när Event-länken finns (review-fynd F2:
   * anmälans eget `Typ`-fält är formulärets kopia och står tomt för
   * app-skapade anmälningar); anmälans kopia är fallback.
   */
  eventTyp: z.string().nullable(),
  /** Eventets ort — samma härledning som eventTyp (list-shapens `ort` är anmälans egen kopia). */
  eventOrt: z.string().nullable(),
  /** Eventets startdatum (lookup, ISO YYYY-MM-DD). */
  startdatum: z.string().nullable(),
  /** Eventets slutdatum (lookup, ISO YYYY-MM-DD). */
  slutdatum: z.string().nullable(),
  /** `Tid kvar till event` (lookup-text: "Avslutat" | "N dagar" | "N veckor…"). */
  tidKvar: z.string().nullable(),
  /** `EventKey` ("Event-N") — Avser-länkradens mutade mono-identitet. */
  eventKey: z.string().nullable(),
  /** Basens `Deadline slutbetalning`-formel (start − 14 d; ISO-datum). */
  deadlineSlutbetalning: z.string().nullable(),
  /** Basens `Dagar kvar till deadline`-formel (kan vara negativ). */
  dagarKvarTillDeadline: z.number().nullable(),
  /** `Plus-one förfrågan skickad` — tidslinjens +1-mailhändelse. */
  plusOneForfraganSkickad: z.string().nullable(),
  /** Huvudanmälans visningsnamn när denna anmälan är +1 (self-länken). */
  medfoljandeTillNamn: z.string().nullable(),
  /** Inversen av `Medföljande till` — anmälans egna +1:or (ID + namn). */
  plusEttor: z.array(RelateradAnmalanSchema),
  /**
   * BAS-GAP (öppet bokfört i kortet; AT-Max/ADR-063-kandidat): anmälans
   * käll-URL + råa UTM-parametrar kräver nya formulär- OCH basfält som inte
   * finns än. Nycklarna finns i shapen så vyns rader renderas när data
   * finns; EF:en levererar null tills fälten fötts.
   */
  sidUrl: z.string().nullable(),
  utm: z.string().nullable(),
});

export type RelateradAnmalan = z.infer<typeof RelateradAnmalanSchema>;
export type RegistrationDetail = z.infer<typeof RegistrationDetailSchema>;
