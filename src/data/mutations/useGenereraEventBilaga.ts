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

/**
 * [OMSKRIVEN, TASK-340.2 review-runda 2] Typen bar tidigare ett `url`-fält:
 * en signerad nedladdnings-URL som hämtades HÄR, direkt efter skapandet, och
 * som bekräftelseytan sedan höll i sitt state tills Lotta klickade "Visa
 * dokumentet".
 *
 * DEN FORMEN VAR EN TIDSINSTÄLLD DEFEKT. Signerade Storage-URL:er lever
 * **300 sekunder** (`SIGNED_DOWNLOAD_URL_TTL_SECONDS`,
 * `supabase/functions/_shared/attachments.ts`). Bekräftelsen är däremot en
 * yta Lotta får STÅ KVAR på — det är hela poängen med att inte omdirigera
 * henne — så ett klick fem minuter senare hade öppnat en flik mot en utgången
 * URL: ett rått Storage-fel i ett nytt fönster, utan besked i appen och utan
 * väg vidare. Fönstret blir inte tomt; det blir FEL, vilket är värre.
 *
 * Fältet är därför BORTA, och med det hämtningen: bekräftelsen lagrar bara
 * `attachment.id` och hämtar en FÄRSK URL vid varje klick, genom husets
 * befintliga `useForhandsvisaDokument` (samma väg dokumentlistans Öppna-ikon
 * går, `DokumentYta.tsx` § IKONPAR). Att hämta en URL vid Skapa som ingen
 * längre läser vore dessutom ett nätverksanrop för ingenting.
 */
export type GenereradEventBilaga = SkapadEventBilaga;

/**
 * Mutation: "Skapa" i genereringsvyn (TASK-309.6, AC #3, ADR-125 § 5) —
 * skapar eller ERSÄTTER en Event-mallad Bilagor-rad ur eventets riktiga
 * data och sparar ev. markerade block som platsens nya standard.
 *
 * ── VAD SOM ÄNDRADES I TASK-340.2, OCH VARFÖR DEN GAMLA LYDELSEN VAR FEL ──
 *
 * Docblocket sade fram till denna skiva: *"Skapar ALLTID en ny rad (aldrig
 * `ersatt`) — upprepade klick kan ge dubbletter, samma synliga '+N äldre
 * filer'-grupp uppladdade filer redan delar."* Det var en sann beskrivning
 * av en DEFEKT, inte av ett designval, och det är dessutom FALSKT sedan
 * `TASK-340.1` landade (`main`, 2026-08-29, PR `#2083`): SERVERN slår
 * själv upp en befintlig Event-mallad rad
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

      // INGEN `getAttachmentDownloadUrl` HÄR — se `GenereradEventBilaga`s
      // docblock: en URL hämtad nu är utgången om fem minuter, och
      // bekräftelseytan är byggd för att Lotta ska kunna stå kvar.
      return skapad;
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
