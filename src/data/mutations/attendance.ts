import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalideraPersonregistret } from '@/data/mutations/personregister-invalidering';
import { useDataSource } from '@/data/useDataSource';
import type { AttendanceSessionValue, AttendanceStatusValue } from '@/domain/types/Status';
import { AttendanceStatus } from '@/domain/types/Status';
import { queryKeys } from '@/queries/keys';

/**
 * NÄRVARONS SKRIVVÄG (TASK-214.2, PRD task-214) — dörrlistans enda väg till
 * basen. Två operationer, aldrig fler:
 *
 *   1. `set-attendance-status` (via `update-record`) — EXAKT fältet `Status`
 *      på ett BEFINTLIGT Deltagande. Allowlisten gatar fältet, inte värdet.
 *   2. `create-attendance` — BACKUP-vägen när raden saknas i basen. EF:en
 *      sätter `Status: 'Närvarande'` server-side och atomärt.
 *
 * `Avstämt` skrivs ALDRIG av appen: automationen A8 triggar på ändring av just
 * `Status` och äger tidsstämpeln. `Person (länk)` ägs av A11. Båda ligger
 * medvetet utanför operationernas allowlists (`field-allowlists.ts`).
 *
 * V1-SKRIVYTAN är formens uttryck: Närvarande ⇄ Ej avstämt via kryssrutan.
 * Registrets fyra övriga statusvärden går genom SAMMA operation men har ingen
 * yta i dörren (PRD § Utanför omfattningen — behovet mäts innan formen utökas).
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  VARFÖR OPTIMISTIKEN INTE BOR HÄR — avsteg från ADR-016:s komponent C/D
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Husets kryss-mutationer (`useSetBorOver`, `useSetPaymentStatus`) lägger sin
 * optimistiska flipp i `onMutate` mot query-cachen och rullar tillbaka i
 * `onError`. Det mönstret förutsätter att FLIPPEN och SKRIVNINGEN sker i samma
 * ögonblick. I dörren gör de det inte:
 *
 *   · Raden blir grön VID TRYCKET (kvittensfönstret, 1,2 s).
 *   · Skrivningen går EXAKT när fönstret löpt ut — ångra inom fönstret ska ge
 *     NOLL skrivanrop (S103 Del 15 F2, Marcus punkt 6).
 *
 * En `onMutate` hade alltså flippat 1,2 s FÖR SENT — mutationen startar först
 * när fönstret redan är slut. Det optimistiska lagret måste därför bo där
 * flippen sker (`useDorrLageD` i `EventCheckin.tsx`), och rollbacken med
 * det. ADR-016:s komponenter finns kvar, i ett annat lager: C = överlägget
 * sätts vid trycket, D = anroparens `onError` river överlägget så raden
 * återförs till arbetslistan, E = `onSettled` invaliderar strömmen här.
 *
 * En andra optimistik i cachen ovanpå den lokala hade dessutom gett TVÅ källor
 * för samma radtillstånd — `byggRaderD` läser `attendance`-cachen som basläge
 * och lägger överlägget ovanpå. Två skribenter på samma UI-tillstånd är samma
 * felklass som två skribenter på `Avstämt`.
 *
 * AKTIVITETSLOGGEN (`recordActivity`) anropas MEDVETET INTE — se skivans
 * slutrapport. PRD task-214 § Utanför omfattningen håller aktivitetsloggen
 * utanför denna vertikal, och ett incheckningsverb är en ny post i
 * `activityTypes.ts` som hör hemma i ett eget beslut (TASK-201-familjens form:
 * varje instrumentering bar sitt eget mandat).
 */

/** Operationsnyckeln — den enda som får röra Deltaganden.Status (TASK-214.1). */
export const SET_ATTENDANCE_STATUS_OPERATION = 'set-attendance-status';

/**
 * En skrivning mot EN dörr-rad. `deltagandeId: null` betyder att basen saknar
 * raden — då tar CREATE-backupen över, och `anmalanId` + `session` är det som
 * identifierar raden som ska skapas.
 */
export interface SkrivNarvaroInput {
  /** Deltagandets record-ID, eller null när raden inte finns i basen. */
  deltagandeId: string | null;
  /** Anmälnings-record-ID — CREATE-vägens identitet. */
  anmalanId: string;
  /** Sessionen raden gäller. Deltaganden är EN rad per Anmälan × Session. */
  session: AttendanceSessionValue;
  /** Måltillståndet. V1: Närvarande eller Ej avstämt. */
  status: AttendanceStatusValue;
}

export interface SkrivNarvaroResultat {
  /**
   * Radens skriv-nyckel EFTER skrivningen. CREATE-vägen ger ett NYTT id som
   * anroparen måste minnas — annars skulle en efterföljande urbockning tro att
   * raden fortfarande saknas och försöka skapa den en gång till (EF:en är
   * idempotent, så det hade varit ofarligt men fel: ett anrop utan verkan).
   */
  deltagandeId: string | null;
  /** true när CREATE-backupen användes (raden saknades i basen). */
  viaCreate: boolean;
}

/**
 * Dörrlistans skrivning. Anroparen äger sitt optimistiska tillstånd och skickar
 * per-anrops-callbacks (`mutate(input, { onSuccess, onError })`) — hook-state
 * (`isPending`/`error`) speglar bara SENASTE anropet, och vid dörren kan flera
 * incheckningar vara i flykt samtidigt.
 */
export function useSetAttendanceStatus(eventId: string) {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const key = queryKeys.events.attendance(eventId);

  return useMutation<SkrivNarvaroResultat, Error, SkrivNarvaroInput>({
    mutationFn: async ({ deltagandeId, anmalanId, session, status }) => {
      if (deltagandeId === null) {
        // Ingen rad i basen. Bara incheckningen har en CREATE-väg — EF:en
        // sätter alltid 'Närvarande'. En urbockning utan rad är däremot redan
        // det tillstånd basen bär ("Ej avstämt" är frånvaron av en rad), så
        // den skriver ingenting: ett anrop som per konstruktion inte kan
        // ändra något är brus, inte säkerhet.
        if (status !== AttendanceStatus.NARVARANDE) {
          return { deltagandeId: null, viaCreate: false };
        }
        const skapad = await dataSource.createAttendance({ anmalanId, eventId, session });
        return { deltagandeId: skapad.id, viaCreate: true };
      }

      await dataSource.updateAttendance(SET_ATTENDANCE_STATUS_OPERATION, deltagandeId, status);
      return { deltagandeId, viaCreate: false };
    },

    // TASK-286.4 (ADR-123 beslut 6) — PERSONREGISTRET. En skrivning mot
    // Deltaganden ändrar visserligen ingen ANMÄLAN (se onSettled nedan), men
    // den ändrar PERSONEN: `Totala deltaganden` och deltagandegrenen i
    // `Senaste interaktion (text)`/`(datum)` är rollup/formel över Deltaganden
    // — och interaktionsraden är RENDERAD i personlistan. Hook-nivåns
    // onSuccess körs UTÖVER anroparens per-anrops-callbacks (query-core:
    // mutation.js kör options.onSuccess, mutationObserver.js kör
    // mutateOptions.onSuccess), så dörrlistans egna callbacks står orörda.
    onSuccess: () => {
      invalideraPersonregistret(queryClient);
    },

    // Synka mot servern oavsett utfall (ADR-016 komponent E). Registreringarnas
    // nyckel rörs INTE: en skrivning mot Deltaganden ändrar ingen anmälan.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
