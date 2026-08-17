import type { Event } from '@/domain/models/Event';
import type { Registration } from '@/domain/models/Registration';

/**
 * [TASK-241.2] Sändytans SKARPA typform — promoverad ur prototypens
 * `src/components/dev/svep-prototyp/types.ts` (TASK-241.1, ADR-102/103).
 * Prototypkatalogen RÖRS INTE (SCOPE-GRÄNSER, rivs först i TASK-241.7 efter
 * QA) — den här filen är en NY, egen produktionskopia av FORMEN, kopplad
 * mot RIKTIG data i stället för prototypens `SimEventGrupp`/`SimMottagare`.
 *
 * SKILLNADEN MOT PROTOTYPENS TYPER, medvetet: prototypens `SimEventGrupp`
 * bar en LÄTTVIKTIG egen datamodell (dess eget docblock: "sändytans enda
 * jobb är att göra triadens FORM dömbar — inte att bära hela Airtable-
 * schemats fältyta"). Den skarpa versionen har inget skäl att uppfinna en
 * parallell modell längre — mottagarna ÄR `Registration`-poster, och
 * `fyllPlatshallare` (återanvänd ur `events/atgarder/atgardsmallar.ts`,
 * ADR-114 § Implementationsbeslut) tar redan en `Registration` rakt av.
 */

/** De två svep-instanserna (ADR-114 beslut 4) — SAMMA form, olika innehåll
    och olika urvalsregel. Endast `'bekraftelse'` är kopplad mot verklig data
    i denna skiva (TASK-241.2 AC:erna nämner uteslutande "Bekräfta alla");
    `'paminnelse'` är TASK-241.4:s urvalslogik (en-påminnelse-modellen). */
export type SvepTyp = 'bekraftelse' | 'paminnelse';

/** En event-grupp i cross-event-urvalet — adresslistans och
    förhandsvisningens grupperingsnyckel (ADR-114 beslut 2/3). Bär det FULLA
    `Event`-objektet (inte bara namn/ort) så `fyllPlatshallare` kan läsa
    `startdatum`/`ort`/`eventNamn`/`eventlabel` utan ett andra uppslag. */
export interface SvepEventGrupp {
  event: Event;
  /** Samma ordning `svep-urval.ts` lämnar dem i — recency, ärvd ur
      `obekraftadeAnmalningar` (AC #2: "samma urvalskälla"). */
  mottagare: Registration[];
}
