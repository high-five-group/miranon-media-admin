import { z } from 'zod';
import { AttendanceSession, AttendanceStatus } from '../types/Status';

/**
 * [GA] Runtime-validering av Airtable-API-svar för Attendance.
 *
 * Parallell sanningskälla: interfacet i `../models/Attendance.ts` behålls
 * som compile-time-kontrakt. Fas 1 använder båda; Fas 2/3 kan konsolidera
 * till schema-som-sanningskälla.
 *
 * Enum-fälten härleds ur Status.ts-konstanterna (single source) och är
 * data-verifierade mot live-basen 2026-06-10: 0 records utanför
 * optionslistorna (Fas 2.5 klunga 3).
 */
export const AttendanceSchema = z.object({
  id: z.string(),
  anmalanId: z.string().nullable(),
  eventId: z.string().nullable(),
  personId: z.string().nullable(),
  // `personNamn` är INTE ett Deltaganden-fält. Deltaganden bär bara person-
  // record-ID:n (`Person (länk)` / `Person`-lookup → IDs, live-verifierat
  // 2026-06-20). Läsbara namn (Gunilla-princip: vyn visar aldrig rec-ID:n)
  // BATCH-hämtas av get-attendance ur Personer.Namn (primärfält-formel → alltid
  // sträng, "Ej tillgängligt" för namnlös) — samma aggregerings-disciplin som
  // PersonDetailSchema:s `historik` (Fas 6b L3, VÄGVAL A). null = person-ID utan
  // träff i namn-batchen (bör ej hända, null-säkert).
  personNamn: z.string().nullable(),
  session: z.enum(AttendanceSession).nullable(),
  status: z.enum(AttendanceStatus).nullable(),
  noteringar: z.string().nullable(),
  avstamt: z.string().nullable(),
  // Närvaropoäng (task-18.9) — basens `Närvaropoäng`-formel (fldwuo94BY46VUOm4):
  // 1 om Status ∈ {Närvarande, Deltog online}, annars 0. LÄST rå ur basen
  // (scalarNumber) så närvaro-registret räknar EXAKT samma poäng som rollup-kedjan
  // (all kurshistorik räknas uppåt härifrån) — vyn får aldrig räkna närvaro
  // annorlunda än basen. `.optional()` (ej required som personNamn): den DEPLOYADE
  // staging-EF:en returnerar Närvaropoäng först efter den separata, Marcus-
  // auktoriserade EF-deployen (DoD #7) — ett required-fält hade fällt
  // get-attendance.staging-conformance-parsen mot den icke-deployade EF:en
  // (additiv-optional-formen för delade shapes). `.nullable()` bär scalarNumbers
  // specialValue-fallback (NaN/Infinity-objekt → null).
  narvaropoang: z.number().nullable().optional(),
});

/**
 * [GA] Runtime-validering av `create-attendance`-EF:ens svar (TASK-214.2).
 *
 * Parsar EXAKT det adaptern konsumerar — `record.id` (radens skriv-nyckel) och
 * `created`-flaggan — och stripar resten. `record.fields` läses MEDVETET inte:
 * EF:en ekar tillbaka Airtables råa fältform, och att parsa den här hade dragit
 * in Airtable-shapen i domänen tvärs EF-snittet (ADR-080 § Snittet går vid
 * protokollet). Behöver en framtida konsument fälten hämtas de via läsvägen
 * (`get-attendance`), som redan har sin egen domän-mappning.
 *
 * `created: false` är idempotens-vägen (raden fanns redan, 200) — ett giltigt
 * utfall, aldrig ett fel. Se `supabase/functions/create-attendance/index.ts`
 * § IDEMPOTENT AV DESIGN.
 */
export const CreatedAttendanceSchema = z.object({
  record: z.object({ id: z.string() }),
  created: z.boolean(),
});
