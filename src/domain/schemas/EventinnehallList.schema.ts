import { z } from 'zod';

/**
 * [GA] Runtime-validering av `get-event-contents`/`get-places`-EF:ernas svar
 * (ADR-026, TASK-309.7 AC #2–#3). Mer-sidans två nya ytor listar SAMTLIGA
 * rader (inte ett enskilt events ifyllnadsunderlag — det är
 * `DocumentSources.schema.ts`s jobb) och redigerar dem direkt via
 * `save-event-content`/`save-place-standard` (skiva 2, ADR-125 § 2).
 *
 * `AgendaRadSchema` är en egen lokal kopia (samma konvention som
 * `DocumentSources.schema.ts`s modul-privata variant) — ingen delad
 * export finns att importera i stället, och en tredje handhållen
 * `text`/`tid`/`meditation`-form hade varit precis den drift SSOT-
 * disciplinen på EF-sidan (`_shared/eventinnehall-falt.ts`) finns för att
 * förhindra om den låg utanför denna fils egna gränser.
 */

const AgendaRadSchema = z.object({
  text: z.string(),
  tid: z.string(),
  meditation: z.boolean(),
});

const nullableString = () => z.string().nullable();

/** De TOLV Eventinnehåll-egna textfälten (`EVENTINNEHALL_FALT_KEYS`,
 *  `_shared/eventinnehall-falt.ts`) — samma nycklar som `EventinnehallFalt`
 *  i `DocumentWrites.schema.ts`. */
export const EventinnehallFaltSchema = z.object({
  tid: nullableString(),
  pris: nullableString(),
  anmalningsavgift: nullableString(),
  resterandeBelopp: nullableString(),
  beskrivning: nullableString(),
  forberedelser: nullableString(),
  tagMed: nullableString(),
  rokning: nullableString(),
  parfym: nullableString(),
  mat: nullableString(),
  overnattning: nullableString(),
  utrustning: nullableString(),
});

export const EventinnehallListItemSchema = z.object({
  id: z.string(),
  namn: z.string(),
  event: z.string().nullable(),
  typ: z.string().nullable(),
  falt: EventinnehallFaltSchema,
  agenda: z.object({
    dag1: z.array(AgendaRadSchema),
    dag2: z.array(AgendaRadSchema),
  }),
});

export type EventinnehallListItem = z.infer<typeof EventinnehallListItemSchema>;

/** De FYRA plats-fälten (`PLATS_FALT_KEYS`) — samma nycklar som `PlatsFalt`
 *  i `DocumentWrites.schema.ts`. */
export const PlatsFaltSchema = z.object({
  adress: nullableString(),
  parkering: nullableString(),
  transport: nullableString(),
  klader: nullableString(),
});

export const PlaceListItemSchema = z.object({
  id: z.string(),
  namn: z.string(),
  falt: PlatsFaltSchema,
});

export type PlaceListItem = z.infer<typeof PlaceListItemSchema>;
