/**
 * Ifyllnadsunderlaget för de genererade bilagorna (TASK-309.2, ADR-125 § 2,
 * läsvägen ur `get-document-sources`) — allt en renderare eller en
 * förhandsgranskande klientvy behöver för ETT event: eventets egna fält,
 * det uppslagna Eventinnehåll (standardtexter per Event × Typ), den länkade
 * Platsen, agendan och en enhetlig standard/kopia-form för varje redigerbart
 * block.
 *
 * VARFÖR standard/kopia PER BLOCK, INTE TVÅ SEPARATA OBJEKT: prototypens
 * `BlockDef` (`GenereringsVy.tsx`) läser varje block ur EN av tre
 * källor (event/eventinnehall/plats) med "tomt kopia-fält = standarden
 * gäller" som enda regel (ADR-125 beslut 1). Att exponera eventinnehall/
 * plats råvärden separat och låta klienten själv räkna ut fallback hade
 * dubblerat den logiken i varje konsument (klient OCH renderare, ADR-125
 * § 4 "en renderare" — samma regel FÅR inte tolkas på två ställen). `kopior`
 * är därför redan den SAMMANSLAGNA formen: server-sidan (denna läsväg) äger
 * fallback-regeln en gång.
 *
 * `sistaBetalningsdag.standard` är den ENDA härledda (aldrig lagrad)
 * standarden: `Startdatum − 14 dagar` (ADR-125 § 2, samma regel som
 * `Anmälningar.Deadline slutbetalning`) — därför `string`, aldrig `null`,
 * till skillnad mot alla andra block vars standard kan sakna Eventinnehåll-
 * rad (uppslagsmissar, se `eventinnehall: null`).
 */

/** En agendarad — verbatim samma form som prototypens `AgendaRad`
 *  (`GenereringsVy.tsx` rad 123), speglar Agendapunkter-tabellens
 *  Text/Tid/Meditation. */
export interface AgendaRad {
  text: string;
  tid: string;
  meditation: boolean;
}

/** Standard/kopia-paret som varje redigerbart block bär (ADR-125 beslut 1+6). */
export interface StandardKopia<T> {
  standard: T;
  kopia: T | null;
}

export interface DocumentSourcesEvent {
  id: string;
  eventNamn: string | null;
  typ: string | null;
  ort: string | null;
  startdatum: string | null;
  slutdatum: string | null;
  /** System-genererad formel "Event-N" — utelämnad (ej null) om osatt, samma
   *  optional-form som `Event.schema.ts`s `eventKey`. */
  eventKey?: string;
  /** [TASK-309.4] Eventplaneringens `Eventlabel`-formel — konsumeras
   *  server-side (`generate-event-attachment/index.ts`s Bilagor-rad-namn),
   *  men del av kontraktet eftersom `get-document-sources` faktiskt
   *  skriver ut fältet. */
  eventlabel: string;
}

/** Metadata om den uppslagna Eventinnehåll-raden (Event × Typ, ADR-125 § 2
 *  "Uppslag, inte länk") — `null` om ingen rad matchar (event-kombination
 *  som saknar en seedad Eventinnehåll-rad). Blockens FAKTISKA text bor i
 *  `kopior`, inte här — se filhuvudet. */
export interface DocumentSourcesEventinnehall {
  id: string;
  namn: string;
}

/** Metadata om den länkade Platsen (Eventplanering.Plats) — `null` om
 *  eventet inte har en plats länkad. Blockens FAKTISKA text bor i `kopior`. */
export interface DocumentSourcesPlats {
  id: string;
  namn: string;
}

export interface DocumentSourcesAgenda {
  dag1: StandardKopia<AgendaRad[]>;
  dag2: StandardKopia<AgendaRad[]>;
}

/**
 * De sjutton redigerbara textblocken (ADR-125 § 2), nyckelnamngivna EXAKT
 * som prototypens `EVENTINNEHALL`/`PLATSER_SEED`-fält
 * (`GenereringsVy.tsx`) för kontinuitet in i den promoverade ytan
 * (TASK-309.3/skiva 8). `sistaBetalningsdag` är den enda vars `standard`
 * aldrig är `null` — se filhuvudet.
 */
export interface DocumentSourcesKopior {
  tid: StandardKopia<string | null>;
  pris: StandardKopia<string | null>;
  anmalningsavgift: StandardKopia<string | null>;
  resterandeBelopp: StandardKopia<string | null>;
  sistaBetalningsdag: StandardKopia<string>;
  beskrivning: StandardKopia<string | null>;
  forberedelser: StandardKopia<string | null>;
  tagMed: StandardKopia<string | null>;
  rokning: StandardKopia<string | null>;
  parfym: StandardKopia<string | null>;
  mat: StandardKopia<string | null>;
  overnattning: StandardKopia<string | null>;
  utrustning: StandardKopia<string | null>;
  adress: StandardKopia<string | null>;
  parkering: StandardKopia<string | null>;
  transport: StandardKopia<string | null>;
  klader: StandardKopia<string | null>;
}

/** Svaret från `DataSourceAdapter.getDocumentSources` / `get-document-sources`-EF:en. */
export interface DocumentSources {
  event: DocumentSourcesEvent;
  eventinnehall: DocumentSourcesEventinnehall | null;
  plats: DocumentSourcesPlats | null;
  agenda: DocumentSourcesAgenda;
  kopior: DocumentSourcesKopior;
}
