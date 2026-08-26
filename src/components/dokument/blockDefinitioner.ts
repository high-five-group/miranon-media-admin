/**
 * Blockdefinitionerna — vilka block hör till eventinnehåll respektive
 * plats, deras etiketter, agenda-/långtext-/datum-flaggor (Del 2 § D
 * beslut 1, 5, 6). UTBRUTEN ur `GenereringsVy.tsx` (TASK-309.7,
 * ADR-125 § 7) — VERBATIM flytt, ingen formändring: samma `MallId`/`Kalla`/
 * `BlockId`/`BlockDef`/`Grupp`-typer, samma `INFORUTA_BAS`/`GRUPPER`/
 * `INFORUTA_IDN`-värden som förut levde inline i prototypfilen (tidigare
 * rad ~207, ~220–367).
 *
 * VARFÖR EN EGEN MODUL: Mer-sidans två nya ytor (Eventinnehåll, Platser)
 * behöver veta VILKA fält som hör till respektive tabell och VAD de heter
 * i UI:t — exakt samma karta genereringsvyn redan bär. En andra
 * handhållen lista hade kunnat glida isär från den första (samma
 * SSOT-disciplin som `_shared/eventinnehall-falt.ts` redan följer på
 * EF-sidan). `GenereringsVy.tsx` importerar härifrån i stället för
 * att definiera sin egen kopia.
 */

/** Vilken mall ett block/en grupp hör till. */
export type MallId = 'bekraftelse' | 'deltagarinfo';

/** Blockets källa — vilken entitet dess standardvärde kommer ifrån. */
export type Kalla = 'event' | 'eventinnehall' | 'plats';

export type BlockId =
  | 'rubrik'
  | 'datumTid'
  | 'plats'
  /** [TASK-309.7] Eventinnehållets EGNA `Tid`-fält (`EVENTINNEHALL_FALT_
   *  KEYS`, `_shared/eventinnehall-falt.ts`) — fristående redigerbart på
   *  Mer-sidans Eventinnehåll-yta. `GRUPPER` nedan använder den ALDRIG:
   *  genereringsvyns "Datum och tid"-block (`datumTid`, ovan) bäddar in
   *  samma text i en kombinerad, event-källad sträng i stället. */
  | 'tid'
  | 'pris'
  | 'anmalningsavgift'
  | 'resterande'
  | 'sistaBetalningsdag'
  | 'beskrivning'
  | 'dagEtt'
  | 'dagTva'
  | 'forberedelser'
  | 'klader'
  | 'tagMed'
  | 'rokning'
  | 'parfym'
  | 'mat'
  | 'overnattning'
  | 'parkering'
  | 'transport'
  | 'utrustning';

export type BlockDef = {
  id: BlockId;
  etikett: string;
  kalla: Kalla;
  /** Platsens fält — blocket kan sparas som platsens standard (beslut 6 C). */
  platsFalt?: 'adress' | 'parkering' | 'transport' | 'klader';
  /** Låst: hämtas ur eventet och ändras på eventsidan, inte här. */
  last?: boolean;
  agenda?: boolean;
  /** Ett datum (ISO-sträng som värde) — redigeras med datumfält, inte
   *  text. `sistaBetalningsdag` är det enda blocket som sätter den, och
   *  det enda som LÄSER flaggan är Inforutans sektionsmorf
   *  (`GenereringsVy.tsx`, `r.def.datum ? <DatumEnkel .../> : <Input
   *  .../>`) — `sistaBetalningsdag` hör till Inforutan-gruppen och når
   *  aldrig `BlockDialog`, vars motsvarande (onåbara) gren revs i
   *  `TASK-309.19` (se
   *  `tests/visual/dokument-generering-promoverings-grind.spec.ts`
   *  § DATUM-LÄGET för de tre spärrarna). */
  datum?: boolean;
  /** Löptext: blockets yta fyller sitt tak och textrutan rullar i sig själv,
   *  i stället för att växa förbi dialogen. */
  langtext?: boolean;
  /** Rubriken på det ämnesstycke i deltagarinformationen blocket motsvarar. */
  amnesstycke?: string;
};

export type Grupp = { rubrik: string; block: BlockDef[] };

const INFORUTA_BAS: BlockDef[] = [
  { id: 'rubrik', etikett: 'Rubrik', kalla: 'event', last: true },
  { id: 'datumTid', etikett: 'Datum och tid', kalla: 'event' },
  { id: 'plats', etikett: 'Plats', kalla: 'plats', platsFalt: 'adress' },
];

/** Blocken som bor i Inforutans sektionsmorf — härlett ur GRUPPER nedan
 *  vid modulinit, aldrig en andra handhållen lista. */
export const GRUPPER: Record<MallId, Grupp[]> = {
  bekraftelse: [
    {
      rubrik: 'Inforutan',
      block: [
        ...INFORUTA_BAS,
        { id: 'pris', etikett: 'Pris', kalla: 'eventinnehall' },
        { id: 'anmalningsavgift', etikett: 'Anmälningsavgift', kalla: 'eventinnehall' },
        { id: 'resterande', etikett: 'Resterande belopp', kalla: 'eventinnehall' },
        { id: 'sistaBetalningsdag', etikett: 'Sista betalningsdag', kalla: 'event', datum: true },
      ],
    },
    {
      rubrik: 'Om utbildningen',
      block: [
        { id: 'beskrivning', etikett: 'Beskrivning', kalla: 'eventinnehall', langtext: true },
      ],
    },
    {
      rubrik: 'Agenda',
      block: [
        { id: 'dagEtt', etikett: 'Dag 1', kalla: 'eventinnehall', agenda: true },
        { id: 'dagTva', etikett: 'Dag 2', kalla: 'eventinnehall', agenda: true },
      ],
    },
  ],
  deltagarinfo: [
    { rubrik: 'Inforutan', block: INFORUTA_BAS },
    {
      rubrik: 'Praktisk information',
      block: [
        {
          id: 'forberedelser',
          etikett: 'Förberedelser',
          kalla: 'eventinnehall',
          amnesstycke: 'Förberedelser',
        },
        {
          id: 'klader',
          etikett: 'Kläder',
          kalla: 'plats',
          platsFalt: 'klader',
          amnesstycke: 'Kläder',
        },
        { id: 'tagMed', etikett: 'Tag med', kalla: 'eventinnehall', amnesstycke: 'Tag med' },
        {
          id: 'rokning',
          etikett: 'För dig som röker',
          kalla: 'eventinnehall',
          amnesstycke: 'För dig som röker',
        },
        {
          id: 'parfym',
          etikett: 'Parfym och kosmetika',
          kalla: 'eventinnehall',
          amnesstycke: 'Parfym och kosmetika',
        },
        { id: 'mat', etikett: 'Mat/fika', kalla: 'eventinnehall', amnesstycke: 'Mat/fika' },
        {
          id: 'overnattning',
          etikett: 'Övernattning',
          kalla: 'eventinnehall',
          amnesstycke: 'Övernattning',
        },
        {
          id: 'parkering',
          etikett: 'Parkering',
          kalla: 'plats',
          platsFalt: 'parkering',
          amnesstycke: 'Parkering',
        },
        {
          id: 'transport',
          etikett: 'Transport från tåget',
          kalla: 'plats',
          platsFalt: 'transport',
          amnesstycke: 'Transport från tåget',
        },
        {
          id: 'utrustning',
          etikett: 'Utrustning',
          kalla: 'eventinnehall',
          amnesstycke: 'Utrustning',
        },
      ],
    },
  ],
};

/** Blocken som bor i Inforutans sektionsmorf — HÄRLETT ur `GRUPPER`, aldrig
 *  en andra handhållen lista som kan glida isär från den. */
export const INFORUTA_IDN = new Set<BlockId>(
  Object.values(GRUPPER)
    .flat()
    .filter((g) => g.rubrik === 'Inforutan')
    .flatMap((g) => g.block.map((b) => b.id)),
);
