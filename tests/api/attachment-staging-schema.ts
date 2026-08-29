// [TASK-338.2, SMALNAD TASK-338.4] Staging-sviternas läsning av EF-svarets
// `Attachment`. Kvar av MEDVETET SKÄL — men bara HALVA den ursprungliga
// vidgningen. Läs varför innan du river resten.
//
// ═══ VAD SOM FÖRSVANN, OCH VARFÖR ═══
// Filen bar fram till TASK-338.4 ocksa `rackvidd: z.string().nullable()`.
// Den vidgningen var en SKARV mot en halvfärdig klient: `AttachmentScope`
// (`src/domain/types/Status.ts`) bar då `Event | Kurstyp | Alla event`, så
// domänschemat KASTADE på varje `rackvidd: 'Gemensam'` EF:en svarade med.
// TASK-338.3 landade `GEMENSAM` i enumet, och `normaliseraRaAttachment`
// mappar dessutom legacy-värdena defensivt — skarven fyller alltså ingen
// funktion längre och är riven. Räckvidden går nu via domänschemat rakt av,
// vilket är strikt STARKARE: ett okänt räckviddsvärde fälls i stället för
// att glida igenom som en fri sträng.
//
// ═══ VAD SOM ÄR KVAR, OCH VARFÖR DET ALDRIG SKA RIVAS ═══
// `plats` är STRIKT här och `.nullable().optional()` i domänschemat. Det ser
// ut som en inkonsekvens och är motsatsen: de två schemana har MOTSATTA
// JOBB, och båda gör sitt rätt.
//
//   - Domänschemat (`src/domain/schemas/Attachment.schema.ts`) ska låta
//     LOTTAS LISTA FUNGERA även när EF:en halkar efter. En stale deploy utan
//     TASK-338.2:s `mapAttachmentRecord` saknar nyckeln helt, och en strikt
//     `.nullable()` hade fällt HELA listningen för en transient driftsituation
//     (samma leniens `mall`/`kallhash` redan bär, av samma skäl).
//   - DENNA fil ska göra tvärtom: FÄLLA en EF som glömt bära fältet. Det är
//     hela poängen med en conformance-svit — den mäter vad den DEPLOYADE
//     funktionen faktiskt svarar, och plats-axeln ÄR det TASK-338.1–338.4
//     bygger. Att ärva klientens leniens hit hade gjort sviten blind för
//     precis den regression den finns för.
//
// Två sidor, två avsikter, samma fält. Ersätter man `StagingAttachmentSchema`
// med `parsaAttachment` i sviterna försvinner den ena avsikten tyst.
//
// Formen är i övrigt oförändrat VALIDERAD, inte kringgången: allt utom
// `plats` ärvs från domänschemat, så en regression i `id`, `storlekBytes`,
// `rackvidd`, `dokumentklass` eller något annat fält fälls precis som förut.

import { z } from 'zod';
import { AttachmentSchema } from '../../src/domain/schemas';

export const StagingAttachmentSchema = AttachmentSchema.extend({
  /** [TASK-338.2] Plats-axeln, upplöst till namn via `Platsnamn`-lookupen.
   *  STRIKT (inte `.optional()` som klientens motsvarighet): fältet är hela
   *  poängen med skivan, så en EF som INTE bär det ska fälla sviten
   *  högljutt i stället för att tyst se ut som "ingen plats". Se filhuvudet
   *  § VAD SOM ÄR KVAR för varför de två sidorna skiljer sig med avsikt. */
  plats: z.object({ id: z.string(), namn: z.string() }).nullable(),
});

export type StagingAttachment = z.infer<typeof StagingAttachmentSchema>;
