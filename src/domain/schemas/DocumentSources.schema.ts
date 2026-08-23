import { z } from 'zod';

/**
 * [GA] Runtime-validering av `get-document-sources`-EF:ens svar (ADR-026).
 * Parallell sanningskälla: interfacen i `../models/DocumentSources.ts` —
 * se den filens huvud för VARFÖR standard/kopia-formen ser ut som den gör.
 */

const AgendaRadSchema = z.object({
  text: z.string(),
  tid: z.string(),
  meditation: z.boolean(),
});

/** Generisk standard/kopia-fabrik — ETT ställe för paret, ingen fältvis kopia. */
function standardKopia<T extends z.ZodTypeAny>(inner: T) {
  return z.object({ standard: inner, kopia: inner.nullable() });
}

const nullableString = () => z.string().nullable();

export const DocumentSourcesEventSchema = z.object({
  id: z.string(),
  eventNamn: z.string().nullable(),
  typ: z.string().nullable(),
  ort: z.string().nullable(),
  startdatum: z.string().nullable(),
  slutdatum: z.string().nullable(),
  eventKey: z.string().optional(),
});

export const DocumentSourcesEventinnehallSchema = z
  .object({
    id: z.string(),
    namn: z.string(),
  })
  .nullable();

export const DocumentSourcesPlatsSchema = z
  .object({
    id: z.string(),
    namn: z.string(),
  })
  .nullable();

export const DocumentSourcesAgendaSchema = z.object({
  dag1: standardKopia(z.array(AgendaRadSchema)),
  dag2: standardKopia(z.array(AgendaRadSchema)),
});

export const DocumentSourcesKopiorSchema = z.object({
  tid: standardKopia(nullableString()),
  pris: standardKopia(nullableString()),
  anmalningsavgift: standardKopia(nullableString()),
  resterandeBelopp: standardKopia(nullableString()),
  // sistaBetalningsdag.standard är ALLTID härledbar (Startdatum − 14 dagar,
  // ADR-125 § 2) — därför z.string(), aldrig .nullable(), till skillnad mot
  // alla andra block. Se DocumentSourcesKopior i domänmodellen.
  sistaBetalningsdag: z.object({ standard: z.string(), kopia: z.string().nullable() }),
  beskrivning: standardKopia(nullableString()),
  forberedelser: standardKopia(nullableString()),
  tagMed: standardKopia(nullableString()),
  rokning: standardKopia(nullableString()),
  parfym: standardKopia(nullableString()),
  mat: standardKopia(nullableString()),
  overnattning: standardKopia(nullableString()),
  utrustning: standardKopia(nullableString()),
  adress: standardKopia(nullableString()),
  parkering: standardKopia(nullableString()),
  transport: standardKopia(nullableString()),
  klader: standardKopia(nullableString()),
});

export const DocumentSourcesSchema = z.object({
  event: DocumentSourcesEventSchema,
  eventinnehall: DocumentSourcesEventinnehallSchema,
  plats: DocumentSourcesPlatsSchema,
  agenda: DocumentSourcesAgendaSchema,
  kopior: DocumentSourcesKopiorSchema,
});
