import type { AgendaRad } from '../models/DocumentSources';

/**
 * [GA] Write-input till bilagornas TRE skrivvägar (TASK-309.3, ADR-125 § 2).
 * Klienten samlar dessa typade fält; respektive EF (`save-event-text` /
 * `save-place-standard` / `save-event-content`) bygger Airtable-`fields`
 * SERVER-SIDE ur dem (klienten skickar aldrig en rå fields-map) — samma
 * disciplin som `UpdateEventInput`.
 *
 * De sjutton `EVENT_TEXT_FALT`-nycklarna är EXAKT samma som
 * `DocumentSourcesKopior` (`../models/DocumentSources.ts`) — samma block
 * läsvägen redan namnger. `null` på en textnyckel RENSAR (tillbaka till
 * standarden, ADR-125 beslut 1); `sistaBetalningsdag` är det enda
 * datumfältet (samma `null`-rensning, ingen tom-sträng-specialform).
 */
export type EventTextFalt =
  | 'tid'
  | 'pris'
  | 'anmalningsavgift'
  | 'resterandeBelopp'
  | 'sistaBetalningsdag'
  | 'beskrivning'
  | 'forberedelser'
  | 'tagMed'
  | 'rokning'
  | 'parfym'
  | 'mat'
  | 'overnattning'
  | 'utrustning'
  | 'adress'
  | 'parkering'
  | 'transport'
  | 'klader';

export type PlatsFalt = 'adress' | 'parkering' | 'transport' | 'klader';

export type EventinnehallFalt =
  | 'tid'
  | 'pris'
  | 'anmalningsavgift'
  | 'resterandeBelopp'
  | 'beskrivning'
  | 'forberedelser'
  | 'tagMed'
  | 'rokning'
  | 'parfym'
  | 'mat'
  | 'overnattning'
  | 'utrustning';

/** En dags agenda-ersättning (ADR-125 § 2 — "ersätter rader atomärt per
 *  dag"). `rader: []` är en giltig "töm den här dagens kopia"-avsikt. */
export interface AgendaDagInput {
  dag: 1 | 2;
  rader: AgendaRad[];
}

/**
 * AC #1 — eventets EGNA kopia (`save-event-text`). Minst ett av `falt`/
 * `agenda` krävs (EF:en fäller annars med 400).
 */
export interface SaveEventTextInput {
  eventId: string;
  falt?: Partial<Record<EventTextFalt, string | null>>;
  agenda?: AgendaDagInput;
}

/**
 * AC #2 — "spara som platsens standard" (Del 2 § D beslut 6). `falt` kräver
 * minst ETT icke-tomt fält (ingen `null`-rensning här — att RENSA platsens
 * standard är inte samma handling som denna EF:s syfte). `Ort` skickas
 * ALDRIG — servern läser den ur eventet (beslut 8: Ort rörs aldrig).
 */
export interface SavePlaceStandardInput {
  eventId: string;
  falt: Partial<Record<PlatsFalt, string>>;
}

/**
 * [TASK-309.7] REN plats-redigering UTAN event (Mer-sidans Platser-yta,
 * ADR-125 § 7) — till skillnad från `SavePlaceStandardInput` ovan (som
 * alltid går via ett event och därför både länkar eventet och rensar dess
 * `(bilagetext)`-kopia). Exakt ETT av `platsId`/`namn` krävs (EF:en fäller
 * annars med 400): `platsId` uppdaterar en BEFINTLIG plats direkt; `namn`
 * skapar en ny (find-or-create by `Namn`, server-side — samma säkerhetsnät
 * mot en oavsiktlig dubblett som event-vägen redan bär för `Ort`).
 *
 * `falt` är VALFRITT bara tillsammans med `namn` — "ny plats"-knappen
 * skapar en TOM shell (bara `Namn`) som fylls i via ett andra steg, samma
 * block-dialog som resten av ytan. Med `platsId` krävs minst ETT fält
 * (EF:en fäller annars): en no-op-uppdatering är meningslös där.
 */
export interface SavePlaceInput {
  platsId?: string;
  namn?: string;
  falt?: Partial<Record<PlatsFalt, string>>;
}

/**
 * AC #3 — Eventinnehållets standardtexter + standardagenda
 * (`save-event-content`, Mer-sidan). `eventinnehallId` identifierar raden
 * direkt (Event/Typ är radens fasta identitet, redigeras aldrig här).
 */
export interface SaveEventContentInput {
  eventinnehallId: string;
  falt?: Partial<Record<EventinnehallFalt, string | null>>;
  agenda?: AgendaDagInput;
}
