// [TASK-338.2] Testsidans läsning av EF-svarets `Attachment` — en MEDVETET
// vidare variant av domänens `AttachmentSchema`, bara för staging-sviterna.
//
// VARFÖR DEN BEHÖVS, precist: `src/domain/schemas/Attachment.schema.ts` har
// `rackvidd: z.enum(AttachmentScope).nullable()`, och `AttachmentScope`
// (`src/domain/types/Status.ts`) bär i dag `Event | Kurstyp | Alla event`.
// Sedan denna skiva svarar EF:en med det NORMALISERADE värdet `Gemensam`
// (ADR-125 § Beslut 1) och med det nya fältet `plats`. En `.parse()` mot
// domänschemat KASTAR därför på varje gemensam bilaga.
//
// KLIENTSIDAN ÄR NÄSTA SKIVAS ARBETE (TASK-338.3: domän, adapter,
// RackviddBadge, RackviddsDialog). Att bredda enumet här hade tagit ett
// beslut som hör hemma där — och en halv klientändring är sämre än ingen.
// Testsidan får därför sin egen läsning, och skarven är bokförd, inte
// gömd: SÅ LÄNGE denna fil finns är den beviset på att `AttachmentScope`
// ännu inte bär `GEMENSAM`. När 338.3 landar ska filen rivas och sviterna
// gå tillbaka till `AttachmentSchema` rakt av.
//
// Formen är fortfarande VALIDERAD, inte kringgången: allt utom de två
// fälten ärvs oförändrat från domänschemat, så en regression i `id`,
// `storlekBytes`, `dokumentklass` eller något annat fält fälls precis som
// förut.

import { z } from 'zod';
import { AttachmentSchema } from '../../src/domain/schemas';

export const StagingAttachmentSchema = AttachmentSchema.extend({
  /** `Event` | `Gemensam` efter EF:ens normalisering — legacy-värdena
   *  (`Kurstyp`/`Alla event`) kan aldrig nå hit, men schemat påstår inte
   *  mer än det kan bevisa: en fri sträng, `null` för rader utan värde. */
  rackvidd: z.string().nullable(),
  /** [TASK-338.2] Plats-axeln, upplöst till namn via `Platsnamn`-lookupen.
   *  STRIKT (inte `.optional()` som `mall`/`kallhash`): fältet är hela
   *  poängen med skivan, så en EF som INTE bär det ska fälla sviten
   *  högljutt i stället för att tyst se ut som "ingen plats". */
  plats: z.object({ id: z.string(), namn: z.string() }).nullable(),
});

export type StagingAttachment = z.infer<typeof StagingAttachmentSchema>;
