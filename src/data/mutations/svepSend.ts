import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/useAuth';
import { displayName } from '@/components/registrations/registration-display';
import {
  ACTIVITY_OBJECT_TYPES,
  mailVerb,
  registrationObjectId,
} from '@/data/activityLog/activityTypes';
import { recordActivity } from '@/data/activityLog/recordActivity';
import { useDataSource } from '@/data/useDataSource';
import { queryKeys } from '@/queries/keys';
import { type SvepGruppUtfall, type SvepSendInput, sendSvepGrupper } from './svepSendGrupper';

/** [TASK-455] Re-exporterat härifrån så `SvepOverlay.tsx` och andra
    konsumenter ser SAMMA importväg som innan flytten — den rena sändloopen
    (`sendSvepGrupper`) och dess typer bor sedan denna skiva i
    `svepSendGrupper.ts`, se DEN filens docblock för VARFÖR (env.ts-krocken
    i api-pure-tester). */
export { type SvepGruppUtfall, type SvepSendInput, sendSvepGrupper };

/**
 * [TASK-241.3 AC #1/#2] Bekräftelsesvepets (och framtida påminnelsesvepets,
 * TASK-241.4) sändväg — `useConfirmAll`-MÖNSTRET återuppstår som ny
 * konsument (ADR-114 § Konsekvenser), inte den rivna hookens KOD: den
 * verkliga sändloopen bor i `sendSvepGrupper` (`svepSendGrupper.ts`); DENNA
 * fil är hooken som binder den mot React Query, autentiseringen och
 * aktivitetsloggen.
 *
 * VARFÖR EN NY HOOK OCH INTE `useSendActionEmail` RAKT AV: den hooken är
 * bunden till ETT `eventId` vid MONTERING (`useSendActionEmail(eventId)`) —
 * en React-hook kan inte anropas i en loop över event-grupper (Rules of
 * Hooks). Sändytan är cross-event (ADR-114 beslut 2), så `sendSvepGrupper`
 * gör SJÄLVA loopen — se den filens docblock för sändkontraktet,
 * bilage-forwardingen (TASK-455) och felfångst-disciplinen.
 *
 * HEMVIST-VAKTEN (`tests/api/mutation-hemvist-vakt.test.ts`, TASK-201.15):
 * `useMutation` MÅSTE bo under `src/data/mutations/` — SvepOverlay.tsx är
 * därför BARA en konsument, aldrig ägare av mutationen.
 *
 * AKTIVITETSLOGGEN (AC #4): EN post per FAKTISKT skickad mottagare
 * (`utfall.lyckade` — "servern är facit", samma disciplin som
 * `useSendActionEmail`), taggad med DEN GRUPPENS `eventId` — inte ett
 * globalt/första-event-ID — så aktivitetshistorikens per-event-filter ser
 * rätt event för varje rad. Verbet (`mailVerb`) går genom DEN DELADE
 * verb-copy-modulen (`src/data/activityLog/verbCopy.ts`, S106-formen) vid
 * RENDERING, precis som varje annan mail-aktivitetsrad — ingen egen
 * sweep-specifik copy myntas.
 */
export function useSendSvep() {
  const queryClient = useQueryClient();
  const dataSource = useDataSource();
  const { user } = useAuth();

  return useMutation<SvepGruppUtfall[], Error, SvepSendInput>({
    mutationFn: (input) => sendSvepGrupper(dataSource, input),

    // SAMMA FALLBACK-FORM SOM `useSendActionEmail` (TASK-201.3): entiteten
    // är en ANMÄLAN (`registrationObjectId`), `mail` är kategorin.
    onSuccess: (utfallPerGrupp, { svepTyp }) => {
      for (const utfall of utfallPerGrupp) {
        for (const reg of utfall.lyckade) {
          void recordActivity({
            dataSource,
            queryClient,
            actor: { id: user?.id ?? '', name: user?.displayName ?? null },
            verb: mailVerb(svepTyp),
            object: {
              id: registrationObjectId(reg.id),
              type: ACTIVITY_OBJECT_TYPES.mail,
              name: `${displayName(reg)} (${reg.eventNamn ?? 'okänt event'})`,
            },
            eventId: utfall.eventId,
            personId: reg.personId ?? undefined,
          });
        }
      }
    },

    // BÅDA CACHE-YTORNA: hemmets dashboard-queries (så Morgonkollens
    // räknare/rader speglar det nya läget direkt, AC #3) OCH varje berörd
    // events egna queries (samma två `useSendActionEmail` redan invaliderar
    // — en Lotta som navigerar vidare till eventet ska inte se inaktuell
    // data där heller).
    onSettled: (utfallPerGrupp) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.registrations });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.events });
      for (const utfall of utfallPerGrupp ?? []) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.registrations.byEvent(utfall.eventId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(utfall.eventId) });
      }
    },
  });
}
