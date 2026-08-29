import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MallId } from '@/data/adapters/DataSourceAdapter';
import { useDataSource } from '@/data/useDataSource';
import type { SkapadEventBilaga } from '@/domain/models/Attachment';
import type { PlatsFalt } from '@/domain/schemas';
import { queryKeys } from '@/queries/keys';

export interface GenereraEventBilagaInput {
  mall: MallId;
  /**
   * Blocken som ska sparas som PLATSENS standard i SAMMA andetag som
   * bilagan skapas (Del 2 § D beslut 6 C, AC #2: "vid Skapa, inte vid
   * krysset") — genereringsvyns "Använd som standard för <ort>"-kryss
   * markerar bara AVSIKTEN i dialogen, den faktiska skrivningen sker här.
   * Utelämnad/tomt objekt = ingen platsstandard sparas denna gång.
   */
  platsFalt?: Partial<Record<PlatsFalt, string>>;
  /**
   * [TILLÄGG, TASK-340.2] Underlagets `Källhash` ur den SENASTE
   * förhandsgranskningen i samma vy (`useForhandsgranskaBilaga`s svar).
   * Stämmer den med serverns omräkning av dagens underlag promoveras
   * utkastets EXAKTA bytes i stället för att dokumentet renderas om —
   * `promoverad: true` i svaret. Utelämnad = dagens beteende, omrendering,
   * tyst (PRD `TASK-340` § A (d)); det är vad varje anrop utan föregående
   * förhandsgranskning får.
   */
  kallhash?: string;
}

export interface GenereradEventBilaga extends SkapadEventBilaga {
  /** Signerad nedladdnings-URL till den NYSS skapade filen (`getAttachmentDownloadUrl`) —
   *  bekräftelseytans "Visa dokumentet" öppnar den i ETT direkt klick, på Lottas
   *  egen knapptryckning (TASK-340.2 — se `GenereringsVy.tsx`s
   *  `startaSkapande`-docblock för varför ingen `window.open` sker i mutationens
   *  egen väg längre). */
  url: string;
}

/**
 * Mutation: "Skapa" i genereringsvyn (TASK-309.6, AC #3, ADR-125 § 5) —
 * skapar eller ERSÄTTER en Event-mallad Bilagor-rad ur eventets riktiga
 * data, sparar ev. markerade block som platsens nya standard, och slår upp
 * den färdiga filens nedladdnings-URL.
 *
 * ── VAD SOM ÄNDRADES I TASK-340.2, OCH VARFÖR DEN GAMLA LYDELSEN VAR FEL ──
 *
 * Docblocket sade fram till denna skiva: *"Skapar ALLTID en ny rad (aldrig
 * `ersatt`) — upprepade klick kan ge dubbletter, samma synliga '+N äldre
 * filer'-grupp uppladdade filer redan delar."* Det var en sann beskrivning
 * av en DEFEKT, inte av ett designval, och det blir dessutom FALSKT när
 * `TASK-340.1` landar: SERVERN slår själv upp en befintlig Event-mallad rad
 * för (event × `Mall`) och går sin ersätt-väg när en finns — svaret bär
 * `ersatte: true` och status **200** i stället för **201**. Klienten kan
 * alltså inte längre skapa en dubblett av misstag.
 *
 * Att låta den gamla meningen stå kvar hade varit precis den `ADR-083`-klass
 * repot städat bort två gånger: prosa som beskriver en mekanism som inte
 * längre är sann. Dubbletterna var verkliga och mätta — 23
 * Bekräftelsebilaga-rader på ETT staging-event 2026-08-29, samtliga födda
 * samma dag, kollapsade bakom "+1 äldre fil" i `DokumentYta.tsx`s
 * `grupperaPerNamn` och OMÖJLIGA att radera från appen (`BilageRadRow`
 * erbjuder Förhandsvisa · Ladda ner · Skapa om · Ersätt — ingen Radera).
 *
 * STATUSKODEN LÄSES INTE — och behöver inte läsas. `postEdgeFunction`
 * släpper igenom hela 2xx-bandet (`res.ok`), så både 200 och 201 når
 * parsningen oförändrat, och `ersatte` i kroppen bär samma faktum som
 * koden. Invarianten `201 ⇔ ersatte === false` ägs av EF:en och bevisas i
 * dess egen svit; att härleda den en andra gång här hade skapat två
 * sanningar om samma sak.
 *
 * Regenerering AV en UTPEKAD rad är fortfarande `useSkapaOmEventBilaga`
 * (Dokument-ytans "Skapa om", AC #4) — en annan handling, egen hook, och
 * den skickar `ersatt` explicit i stället för att låta servern välja.
 *
 * ── INGEN SKÄRMLÄSAR-ANNONSERING HÄR (TASK-340.2, AC #4) ──
 *
 * `onSuccess` anropade tidigare `alertScreenReader('<namn> har skapats')`.
 * Det är BORTA, och borttagandet är själva poängen: från och med denna
 * skiva ersätts formuläret av en bekräftelseyta (`MessageBox intent
 * success`, alltså `role="status"` — `MessageBox.tsx:118`) som fokus
 * dessutom flyttas till. Behöll vi den globala live-regionen skulle Lotta
 * få SAMMA besked TVÅ gånger — exakt den dubbelannonsering research-passet
 * varnar för (`forhandsgranska-spara-atervand-bilageflodet-2026-08-29.md`
 * § 3.3: *"Att göra båda ger dubbelannonsering"*), och det AC #4 mäter.
 * Beskedet bärs nu av ytan Lotta faktiskt landar i, inte av en osynlig
 * region vid sidan av den.
 *
 * `useSkapaOmEventBilaga` behåller sin `alertScreenReader` — DEN handlingen
 * har ingen bekräftelseyta att flytta fokus till (knappen står kvar i
 * listan), så där är live-regionen fortfarande det enda beskedet.
 *
 * ORDNINGEN ÄR KONTRAKTET (speglar `useReplaceAttachment`s disciplin):
 * bilagan skapas FÖRST; platsstandarden sparas EFTER en lyckad skapelse,
 * ALDRIG tvärtom. Misslyckas skapelsen sparas ingen platsstandard.
 */
export function useGenereraEventBilaga(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();

  return useMutation<GenereradEventBilaga, Error, GenereraEventBilagaInput>({
    mutationKey: ['generera-event-bilaga', eventId],

    mutationFn: async ({ mall, platsFalt, kallhash }) => {
      const skapad = await dataSource.skapaEventBilaga({ eventId, mall, kallhash });

      if (platsFalt && Object.keys(platsFalt).length > 0) {
        await dataSource.savePlaceStandard({ eventId, falt: platsFalt });
      }

      const { url } = await dataSource.getAttachmentDownloadUrl(eventId, skapad.attachment.id);
      return { ...skapad, url };
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attachments.byEvent(eventId) });
      // Platsstandarden kan gälla FLERA event (samma resonemang som
      // `useSavePlaceStandard`) — invalidera bara när den faktiskt begärdes.
      if (variables?.platsFalt && Object.keys(variables.platsFalt).length > 0) {
        queryClient.invalidateQueries({ queryKey: queryKeys.documentSources.all });
      }
    },
  });
}
