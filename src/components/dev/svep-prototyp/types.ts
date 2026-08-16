/**
 * [PROTOTYPE-TYPES, TASK-241.1] Delad typform för svep-prototypens
 * konvergensvarv 1 — sändytan som overlay ovanpå hem-vyn (ADR-114).
 *
 * Egen, LÄTTVIKTIG datamodell — inte appens `Registration`/`Event`
 * domänmodeller. Skälet: sändytan är cross-event (en `Registration` är
 * evigt bunden till ETT event i den skarpa modellen), och prototypens
 * enda jobb är att göra triadens FORM dömbar — inte att bära hela
 * Airtable-schemats fältyta. Den skarpa byggskivan (efter facit-lås)
 * avgör den riktiga intags-/datavägen; se kortets Implementation Notes
 * för `mmAtgardsUrval`-precedentet.
 */

/** De två svep-instanserna (ADR-114 beslut 4) — SAMMA form, olika innehåll
    och olika urvalsregel (en-påminnelse-modellen gäller bara `paminnelse`). */
export type SvepTyp = 'bekraftelse' | 'paminnelse';

/** Simulerade datalägen (kortets AC #1 "alla tillstånd är dömbara"):
    `normal` = 2-3 event-grupper redo att granskas · `tomt` = urvalet är
    tomt (hemmets pekning gav noll träffar) · `fel` = en sändning där minst
    en event-grupp delvis eller helt fallerar (ADR-114 beslut 3 — fel och
    delresultat rapporteras PER EVENT, aldrig som en global siffra). */
export type Scenario = 'normal' | 'tomt' | 'fel';

/** En simulerad mottagare — tillräckligt för adresslistan och den ifyllda
    förhandsvisningen, inget mer. */
export interface SimMottagare {
  id: string;
  namn: string;
  fornamn: string;
  epost: string;
  telefon?: string;
  /** Endast satt för påminnelsesvepets mottagare (S102 Del 10 § radlägena). */
  avgiftstyp?: 'Anmälningsavgift' | 'Slutbetalning';
}

/** En event-grupp i cross-event-urvalet — adresslistans och
    förhandsvisningens grupperingsnyckel (ADR-114 beslut 2/3). */
export interface SimEventGrupp {
  eventId: string;
  eventNamn: string;
  ort: string;
  /** ISO-datum, bara för visning i prototypen. */
  startdatum: string;
  mottagare: SimMottagare[];
}

/** En mottagares utfall inom EN event-grupps sändanrop. */
export interface FallenMottagare {
  mottagare: SimMottagare;
  skal: string;
}

/** Sändanropets utfall FÖR EN event-grupp (ADR-114 beslut 3: "ett sändanrop
    per event-grupp under huven" — fel och delresultat rapporteras här, per
    grupp, aldrig slaget samman till en enda global siffra). */
export interface GruppUtfall {
  eventId: string;
  status: 'sent' | 'partial' | 'failed';
  lyckade: SimMottagare[];
  fallna: FallenMottagare[];
}

/** De tre lägena på samma yta — samma grammatik som `AtgardsSida.tsx`s
    `GranskningsSida` (granska → skickar → resultat), se dess docblock. */
export type SvepLage = 'granska' | 'skickar' | 'resultat';
